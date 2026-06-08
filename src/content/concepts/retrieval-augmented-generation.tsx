"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { CodeBlock } from "@/components/content/code-block";
import { Quiz } from "@/components/content/quiz";

export default function Lesson() {
  return (
    <>
      <p>
        A language model only knows what was in its training data. Retrieval-Augmented Generation (RAG)
        lets it answer questions about <em>your</em> documents by fetching relevant passages at query
        time and pasting them into the prompt before the model generates a word.
      </p>

      <KeyIdea>
        Don&apos;t make the model memorize your data &mdash; give it an open-book exam. Retrieve the
        most relevant passages, hand them to the LLM as context, and ask it to answer from what it just read.
      </KeyIdea>

      <h2>The three moves</h2>
      <p>Every RAG system is the same loop, built once offline and run once per query:</p>
      <ul>
        <li><strong>Index (offline):</strong> chop documents into chunks, embed each chunk into a vector, store the vectors.</li>
        <li><strong>Retrieve (per query):</strong> embed the user&apos;s question, find the nearest chunk vectors.</li>
        <li><strong>Generate:</strong> stuff those chunks into the prompt and let the LLM answer, grounded in them.</li>
      </ul>

      <Basic>
        <p>
          Think of a vector as a coordinate that captures meaning. Sentences about &quot;refund policy&quot;
          land near each other even if they share no words with the question. To answer, you measure
          which stored chunks sit closest to the question&apos;s coordinate, then read those chunks aloud
          to the model and say: &quot;answer using only this.&quot; The model stops guessing from memory and
          starts paraphrasing evidence you supplied &mdash; so it can cite sources and stay current without retraining.
        </p>
      </Basic>

      <Advanced>
        <p>
          Each chunk and the query map to vectors via an embedding function <M>{"\\phi"}</M>. Retrieval
          ranks chunks by similarity to the query <M>{"q"}</M>, almost always cosine similarity:
        </p>
        <MB>{"\\text{sim}(q, d) = \\frac{\\phi(q) \\cdot \\phi(d)}{\\lVert \\phi(q) \\rVert \\, \\lVert \\phi(d) \\rVert}"}</MB>
        <p>
          We then take the top-<M>{"k"}</M> chunks and condition generation on them. With retrieved set
          <M>{"\\, Z"}</M>, the answer distribution marginalizes over documents:
        </p>
        <MB>{"p(y \\mid x) = \\sum_{z \\in Z} p(z \\mid x)\\, p(y \\mid x, z)"}</MB>
        <p>
          Exact nearest-neighbor search is <M>{"O(N)"}</M> per query, so production stores use approximate
          methods (HNSW graphs, IVF) that trade a little recall for sublinear latency over millions of vectors.
        </p>
      </Advanced>

      <Callout kind="pitfall" title="Garbage retrieval, garbage answer">
        RAG can only ground the model in chunks it actually retrieves. If chunking splits a fact across
        two pieces, or the embedding model is weak, the right passage never reaches the prompt &mdash; and
        the LLM confidently fills the gap with a hallucination. Most RAG failures are retrieval failures, not generation failures.
      </Callout>

      <CodeBlock language="python" filename="rag.py">{`import numpy as np

def cosine(a, b):
    return a @ b / (np.linalg.norm(a) * np.linalg.norm(b))

# Offline: embed and store chunks
chunks = ["Refunds within 30 days.", "Office hours 9-5.", "Free shipping over $50."]
index = [(c, embed(c)) for c in chunks]   # embed -> dense vector

def retrieve(query, k=2):
    q = embed(query)
    scored = sorted(index, key=lambda t: cosine(q, t[1]), reverse=True)
    return [c for c, _ in scored[:k]]

# Per query: retrieve, then generate grounded in context
ctx = retrieve("can I get my money back?")
prompt = f"Answer using ONLY this context:\\n{chr(10).join(ctx)}\\n\\nQ: Can I get a refund?"
answer = llm(prompt)`}</CodeBlock>

      <MoreDepth>
        <p>
          Pure vector search is recall-oriented but loses on exact terms (product SKUs, names, dates).
          Mature systems use <strong>hybrid retrieval</strong> &mdash; fusing dense vectors with sparse
          keyword scores (BM25) &mdash; then add a <strong>cross-encoder reranker</strong> that jointly
          reads query and candidate to reorder the shortlist. Embeddings give cheap recall over millions
          of chunks; the reranker gives expensive precision over the top few dozen. The combination beats either alone.
        </p>
      </MoreDepth>

      <Quiz question="Why does RAG reduce hallucination compared to asking a bare LLM the same question?" options={[
        { text: "It fine-tunes the model's weights on your documents at query time.", why: "RAG does no training; it changes the prompt, not the weights." },
        { text: "It supplies relevant source passages in the prompt so the model can answer from evidence rather than parametric memory.", correct: true, why: "Grounding generation in retrieved, verifiable context is exactly the mechanism." },
        { text: "It makes the model's temperature zero, forcing deterministic output.", why: "Determinism is unrelated to factual grounding; a confident wrong answer can still be deterministic." },
        { text: "It increases the model's context window automatically.", why: "RAG works within the existing window; it selects what to put there, it does not enlarge it." },
      ]} />
    </>
  );
}
