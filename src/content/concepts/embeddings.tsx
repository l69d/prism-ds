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
    <h2>Interview practice</h2>
<InterviewProblem question="What is an embedding, and why do we prefer it to one-hot encoding for high-cardinality categorical features like user IDs or words?" difficulty="easy" tag="Conceptual">
  <p>An <strong>embedding</strong> maps a discrete symbol (a word, item, user, category) to a dense, low-dimensional real vector that is <strong>learned</strong> so that geometric proximity encodes semantic or behavioral similarity.</p>
  <p>One-hot encoding of a vocabulary of size <M>{"V"}</M> produces a <M>{"V"}</M>-dimensional vector that is all zeros except one 1. The problems:</p>
  <ul>
    <li><strong>Dimensionality blows up.</strong> A million users means a million-dimensional input. An embedding compresses this to, say, 64 or 256 dimensions.</li>
    <li><strong>No notion of similarity.</strong> Every pair of one-hot vectors is orthogonal, so the dot product between any two distinct symbols is 0. &quot;king&quot; is exactly as far from &quot;queen&quot; as from &quot;banana&quot;. Embeddings place related symbols near each other.</li>
    <li><strong>No parameter sharing.</strong> One-hot forces the model to learn each symbol&apos;s weights independently. Embeddings let the model generalize across symbols that behave similarly.</li>
  </ul>
  <p>Mechanically, multiplying a one-hot vector by a weight matrix <M>{"E \\in \\mathbb{R}^{V \\times d}"}</M> just selects a row, so an embedding layer is exactly a learnable lookup table: <M>{"\\text{embed}(i) = E_{i,:}"}</M>.</p>
</InterviewProblem>
<InterviewProblem question="A friend trains word2vec and asks why cosine similarity is the standard way to compare embeddings instead of Euclidean distance. How do you explain it, and when would the two disagree?" difficulty="medium" tag="Conceptual">
  <p>Cosine similarity measures the <strong>angle</strong> between two vectors, ignoring their magnitudes:</p>
  <MB>{"\\cos(u, v) = \\frac{u \\cdot v}{\\lVert u \\rVert \\, \\lVert v \\rVert}"}</MB>
  <p>This is preferred for embeddings because <strong>direction tends to carry the semantics while magnitude often carries nuisance information</strong>. In word2vec-style models, frequent words pick up larger norms during training, so raw Euclidean distance would say a common word is &quot;far&quot; from a rare synonym purely because of frequency, not meaning.</p>
  <p>The two metrics relate directly. For unit-normalized vectors (<M>{"\\lVert u \\rVert = \\lVert v \\rVert = 1"}</M>):</p>
  <MB>{"\\lVert u - v \\rVert^2 = 2 - 2\\,(u \\cdot v) = 2\\,(1 - \\cos(u,v))"}</MB>
  <p>So <strong>on the unit sphere, ranking by Euclidean distance and ranking by cosine give the identical order</strong>. They only disagree when magnitudes vary: two vectors pointing the same way but with very different lengths have cosine 1 yet large Euclidean distance. Practical takeaway: if you L2-normalize embeddings first, the choice is moot, which is exactly why many retrieval systems normalize then use inner product.</p>
</InterviewProblem>
<InterviewProblem question="You need a recommender for a catalog of 5 million products and 50 million users with sparse interaction data. Sketch how you would learn embeddings, how you would serve recommendations at scale, and the main pitfalls." difficulty="hard" tag="Applied">
  <p><strong>Learning.</strong> A two-tower / matrix-factorization setup. Learn a user embedding <M>{"u_i \\in \\mathbb{R}^d"}</M> and an item embedding <M>{"v_j \\in \\mathbb{R}^d"}</M> so that the predicted affinity is the dot product <M>{"\\hat{r}_{ij} = u_i \\cdot v_j"}</M>. Train on implicit feedback (clicks, purchases) with a loss that contrasts observed positives against sampled negatives, e.g. a sampled-softmax or BPR objective. Add side features (category, text, demographics) into each tower so cold-start items get a reasonable vector before they have interactions.</p>
  <p><strong>Serving.</strong> Recommending = finding the items maximizing <M>{"u_i \\cdot v_j"}</M>. Brute force is <M>{"O(N d)"}</M> per user across 5M items, far too slow online. Precompute all item vectors and build an <strong>approximate nearest neighbor</strong> index (HNSW, IVF-PQ, ScaNN). At request time, embed the user and run ANN lookup in milliseconds. Normalize so maximum inner product search reduces to nearest-neighbor cosine.</p>
  <p><strong>Pitfalls:</strong></p>
  <ul>
    <li><strong>Cold start.</strong> New users/items have no learned vector; lean on content features or popularity fallbacks.</li>
    <li><strong>Popularity bias.</strong> Naive negative sampling lets head items dominate; correct with frequency-aware sampling or logQ correction in sampled softmax.</li>
    <li><strong>Stale embeddings.</strong> User interests drift, so the user tower must re-embed from recent behavior, not from a frozen ID vector.</li>
    <li><strong>Train/serve skew.</strong> The ANN index returns <em>approximate</em> top-k; tune recall vs latency so offline metrics match online behavior.</li>
    <li><strong>Feedback loops.</strong> The model trains on items it surfaced, reinforcing itself; inject exploration and log unbiased data.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="Implement, from scratch in NumPy, a function that returns the top-k most similar items to a query vector using cosine similarity over an embedding matrix. Then explain its time complexity." difficulty="medium" tag="Coding">
  <p>The key trick is to L2-normalize once so cosine similarity becomes a single matrix-vector dot product.</p>
  <CodeBlock language="python" filename="topk_cosine.py">{`import numpy as np

def topk_cosine(query, embeddings, k=5):
    """
    query:      shape (d,)        a single embedding
    embeddings: shape (N, d)      the item matrix
    returns:    (indices, scores) of the top-k most similar rows
    """
    # Normalize rows of the matrix and the query to unit length.
    eps = 1e-8
    emb_norm = embeddings / (np.linalg.norm(embeddings, axis=1, keepdims=True) + eps)
    q_norm = query / (np.linalg.norm(query) + eps)

    # With unit vectors, cosine similarity is just the dot product.
    sims = emb_norm @ q_norm          # shape (N,)

    # argpartition finds the top-k in O(N), then we sort just those k.
    idx = np.argpartition(-sims, kth=k - 1)[:k]
    idx = idx[np.argsort(-sims[idx])]
    return idx, sims[idx]

# sanity check
rng = np.random.default_rng(0)
M = rng.normal(size=(1000, 64))
q = M[42] + 0.01 * rng.normal(size=64)   # near row 42
print(topk_cosine(q, M, k=3)[0])         # row 42 should appear first
`}</CodeBlock>
  <p><strong>Complexity.</strong> Normalization and the dot product are <M>{"O(N d)"}</M>. Using <M>{"\\text{argpartition}"}</M> to grab the top <M>{"k"}</M> is <M>{"O(N)"}</M>, and sorting only those <M>{"k"}</M> elements is <M>{"O(k \\log k)"}</M>, so the total is <M>{"O(N d + k \\log k)"}</M> rather than the <M>{"O(N d + N \\log N)"}</M> you would pay by sorting all scores. For millions of items served online this still scales linearly in <M>{"N"}</M>, which is precisely why production systems replace this exact scan with an approximate nearest-neighbor index.</p>
</InterviewProblem>

      </>
  );
}
