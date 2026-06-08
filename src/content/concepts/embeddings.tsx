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
      <p>An embedding maps a discrete thing &mdash; a word, a product, a user &mdash; to a dense vector of numbers, so that <strong>similar things land near each other</strong> in space.</p>

      <KeyIdea>Embeddings convert &quot;is this like that?&quot; into a geometry problem: meaning becomes distance, and relationships become directions you can measure.</KeyIdea>

      <h2>From symbols to space</h2>
      <p>A raw category like the word &quot;king&quot; carries no math you can compute with. The naive fix, one-hot encoding, gives every word its own axis &mdash; but that makes &quot;king&quot; exactly as far from &quot;queen&quot; as from &quot;banana,&quot; and the vectors balloon to the size of the vocabulary.</p>
      <p>An embedding instead places each item in a compact, continuous space (say 128 or 768 dimensions) where position encodes meaning:</p>
      <ul>
        <li><strong>Proximity</strong> = similarity. Nearby vectors mean related items.</li>
        <li><strong>Direction</strong> = relationship. The offset from &quot;man&quot; to &quot;woman&quot; can echo the offset from &quot;king&quot; to &quot;queen.&quot;</li>
        <li><strong>Learned, not assigned.</strong> The coordinates are tuned by a model from data, not hand-written.</li>
      </ul>

      <Basic>
        <p>Imagine arranging every movie on a giant map. Action blockbusters cluster in one corner, quiet documentaries in another. You never told the map what &quot;action&quot; means &mdash; you just placed films so that ones people enjoy together sit close. Now recommending is easy: find what a user loved, and look at its neighbors. That map is an embedding, and the &quot;coordinates&quot; are the numbers the model learned.</p>
      </Basic>

      <Advanced>
        <p>An embedding layer is a lookup table <M>{"E \\in \\mathbb{R}^{V \\times d}"}</M> mapping each of <M>{"V"}</M> tokens to a <M>{"d"}</M>-dimensional row. Training adjusts these rows by gradient descent against a downstream objective. Similarity is read off with cosine:</p>
        <MB>{"\\cos(\\mathbf{u}, \\mathbf{v}) = \\frac{\\mathbf{u} \\cdot \\mathbf{v}}{\\lVert \\mathbf{u} \\rVert \\, \\lVert \\mathbf{v} \\rVert}"}</MB>
        <p>Word2vec&apos;s skip-gram maximizes the probability of context words given a center word, with the softmax</p>
        <MB>{"P(c \\mid w) = \\frac{\\exp(\\mathbf{v}_c^\\top \\mathbf{v}_w)}{\\sum_{c'} \\exp(\\mathbf{v}_{c'}^\\top \\mathbf{v}_w)}"}</MB>
        <p>Because the denominator sums over the whole vocabulary, it is approximated by negative sampling: push true context pairs together and a few random pairs apart. The geometry emerges as a side effect of predicting co-occurrence.</p>
      </Advanced>

      <Callout kind="insight" title="Why directions carry meaning">
        Analogies like king &minus; man + woman &asymp; queen work because the objective rewards consistent co-occurrence patterns, which the model often encodes as roughly parallel offset vectors. It is a learned regularity, not a guarantee &mdash; treat it as a useful tendency, not a law.
      </Callout>

      <h2>Where it matters</h2>
      <p>Embeddings are the input layer of nearly every modern system: token embeddings feed transformers, item and user embeddings power recommenders, and sentence embeddings drive semantic search and RAG, where you retrieve by nearest neighbors instead of keyword match.</p>

      <CodeBlock language="python" filename="embeddings.py">{`import numpy as np

# A tiny learned table: 5 items, 3 dimensions
E = np.array([
    [0.9, 0.1, 0.0],   # "king"
    [0.8, 0.2, 0.1],   # "queen"
    [0.1, 0.9, 0.2],   # "apple"
    [0.0, 0.8, 0.3],   # "banana"
    [0.85, 0.15, 0.05] # "prince"
])

def cosine(u, v):
    return u @ v / (np.linalg.norm(u) * np.linalg.norm(v))

# "king" is closer to "prince" than to "banana"
print(round(cosine(E[0], E[4]), 3))  # ~0.999
print(round(cosine(E[0], E[3]), 3))  # ~0.18`}</CodeBlock>

      <MoreDepth>
        <p>Raw dot products reward sheer magnitude, so frequent items can dominate similarity rankings unless you normalize &mdash; which is why cosine (or L2-normalized vectors) is the default for retrieval. Also beware that embeddings inherit and amplify biases in their training corpus, and that two embedding spaces trained separately are <strong>not aligned</strong>: the vector for &quot;dog&quot; in model A is meaningless in model B&apos;s coordinate system without an explicit alignment step.</p>
      </MoreDepth>

      <Quiz question="Why is an embedding usually preferred over one-hot encoding for representing words?" options={[
        { text: "It uses fewer dimensions and places semantically similar words near each other", correct: true, why: "Embeddings are dense and low-dimensional, and distance encodes learned similarity." },
        { text: "It guarantees every word is exactly equidistant from every other word", why: "That is precisely the limitation of one-hot encoding, not a benefit." },
        { text: "It requires no training data to construct", why: "Embeddings are learned from data; the coordinates come from an optimization objective." },
        { text: "It makes each word occupy its own unique axis", why: "That describes one-hot encoding, which is sparse and high-dimensional." },
      ]} />
    </>
  );
}
