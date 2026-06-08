"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { CodeBlock } from "@/components/content/code-block";
import { Quiz } from "@/components/content/quiz";
import { InterviewProblem } from "@/components/content/interview-problem";

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
    <h2>Interview practice</h2>
<InterviewProblem question="What problem does RAG solve that fine-tuning does not, and when would you still prefer fine-tuning?" difficulty="easy" tag="Conceptual">
  <p>RAG attaches an external, queryable knowledge source to a frozen LLM at inference time. It directly attacks three weaknesses of a static model:</p>
  <ul>
    <li><strong>Staleness:</strong> the model&apos;s parametric knowledge is frozen at its training cutoff. RAG injects fresh documents into the prompt, so updating knowledge is just re-indexing, no retraining.</li>
    <li><strong>Hallucination &amp; attribution:</strong> retrieved passages give the model grounded evidence and let you cite sources, so answers are checkable.</li>
    <li><strong>Private / long-tail data:</strong> facts that never appeared in pretraining (your internal wiki, a specific contract) can be surfaced on demand.</li>
  </ul>
  <p>Fine-tuning instead changes the weights, so it is the better tool when you need to teach <strong>behavior or form</strong> rather than facts: a house writing style, a strict output schema, a domain-specific reasoning skill, or to compress a frequently-used skill so you stop paying for long retrieved context. The two are complementary &mdash; a common production pattern is fine-tune for format and tone, RAG for the actual facts.</p>
</InterviewProblem>
<InterviewProblem question="Walk through the full RAG pipeline end to end, and name a failure mode at each stage." difficulty="medium" tag="Applied">
  <p>The pipeline splits into an offline indexing phase and an online query phase.</p>
  <ul>
    <li><strong>Chunk:</strong> split documents into passages. Failure: chunks too large dilute the embedding and waste context; too small lose the surrounding meaning. Mitigate with overlap and structure-aware splitting.</li>
    <li><strong>Embed:</strong> map each chunk to a vector with an embedding model. Failure: a domain mismatch (general-purpose embedder on legal or code text) puts relevant chunks far apart in vector space.</li>
    <li><strong>Index:</strong> store vectors in a vector store with an ANN index (HNSW, IVF). Failure: aggressive ANN parameters trade recall for speed, so the true nearest neighbor is silently missed.</li>
    <li><strong>Retrieve:</strong> embed the query and fetch top-<M>{"k"}</M>. Failure: the query and the document are phrased differently (vocabulary mismatch); a pure-vector search can miss exact keyword matches that a hybrid (BM25 + dense) search would catch.</li>
    <li><strong>Rerank (optional):</strong> a cross-encoder rescores candidates. Failure: skipping it leaves loosely relevant chunks ahead of the truly relevant one.</li>
    <li><strong>Generate:</strong> stuff the retrieved context into the prompt and answer. Failure: the model ignores the context and falls back on parametric memory, or the gold passage sits in the middle of a long context and gets lost.</li>
  </ul>
  <p>A useful interview point: most RAG quality problems are <strong>retrieval</strong> problems, not generation problems. If the right chunk never reaches the prompt, no amount of prompt engineering recovers it.</p>
</InterviewProblem>
<InterviewProblem question="Your RAG bot gives confident but wrong answers. How do you diagnose whether the failure is in retrieval or in generation, and how do you measure it?" difficulty="hard" tag="Case">
  <p>First, <strong>decompose the system</strong> so retrieval and generation can be scored independently.</p>
  <p><strong>Is retrieval the problem?</strong> Build a small eval set of questions paired with the ground-truth supporting chunk(s). Then measure whether retrieval surfaces them:</p>
  <ul>
    <li><strong>Recall@k</strong> &mdash; fraction of questions where at least one gold chunk appears in the top <M>{"k"}</M>. Low recall means the answer is impossible regardless of the LLM.</li>
    <li><strong>MRR / nDCG</strong> &mdash; reward placing the gold chunk near the top, which matters because models attend more to the start of context.</li>
  </ul>
  <p><strong>Is generation the problem?</strong> Condition on the correct context and check the answer against it:</p>
  <ul>
    <li><strong>Faithfulness / groundedness</strong> &mdash; is every claim supported by the retrieved text? Measure with an LLM-as-judge or NLI entailment of each answer sentence against the context.</li>
    <li><strong>Answer relevance</strong> &mdash; does the answer actually address the question.</li>
  </ul>
  <p>The diagnosis is the cross-tabulation: if Recall@k is high but faithfulness is low, the model is hallucinating despite having the evidence &mdash; fix the prompt, force citations, or use a stronger model. If Recall@k is low, no generation fix helps &mdash; improve chunking, swap the embedder, add hybrid search or a reranker. Always carry a <strong>retrieval-off baseline</strong> (closed-book answers) so you can prove RAG is adding value at all.</p>
</InterviewProblem>
<InterviewProblem question="Implement cosine-similarity retrieval over a set of chunk embeddings and explain why cosine rather than raw dot product." difficulty="medium" tag="Coding">
  <p>Cosine similarity is the dot product after L2-normalizing both vectors:</p>
  <MB>{"\\text{cos}(q, d) = \\frac{q \\cdot d}{\\lVert q \\rVert \\, \\lVert d \\rVert}"}</MB>
  <p>Dividing by the norms removes magnitude, so two passages that talk about the same topic score high even if one is longer (and thus has a larger raw vector). Many embedding models are trained with a cosine objective, so it matches their geometry. Note that once vectors are normalized, ranking by cosine, by dot product, and by (descending) Euclidean distance are all equivalent &mdash; which is why production indexes often normalize once at insert time and then use a fast inner-product index.</p>
  <CodeBlock language="python" filename="retrieve.py">{`import numpy as np

def normalize(x: np.ndarray) -> np.ndarray:
    # row-wise L2 normalize; add eps to avoid div-by-zero
    norms = np.linalg.norm(x, axis=-1, keepdims=True)
    return x / np.clip(norms, 1e-12, None)

def top_k(query_vec, chunk_mat, chunks, k=3):
    q = normalize(query_vec.reshape(1, -1))      # (1, d)
    D = normalize(chunk_mat)                       # (n, d)
    scores = (D @ q.T).ravel()                     # cosine, since both normalized
    idx = np.argsort(-scores)[:k]                  # highest first
    return [(chunks[i], float(scores[i])) for i in idx]

# toy example
chunks = ["refund policy is 30 days", "office hours are 9 to 5", "returns accepted within a month"]
chunk_mat = np.random.randn(len(chunks), 384)     # stand-in for real embeddings
query_vec = np.random.randn(384)
for text, s in top_k(query_vec, chunk_mat, chunks, k=2):
    print(f"{s:.3f}  {text}")`}</CodeBlock>
  <p>For real corpora you would not loop in NumPy &mdash; you would hand these normalized vectors to an ANN index (FAISS, HNSW) so retrieval stays sublinear as the corpus grows.</p>
</InterviewProblem>

      </>
  );
}
