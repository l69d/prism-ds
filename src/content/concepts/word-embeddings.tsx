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
      <p>Word embeddings turn words into dense vectors so that geometry encodes meaning: words used in similar contexts land near each other, and directions in the space line up with human concepts like gender, tense, or plurality.</p>

      <KeyIdea>A word&apos;s meaning is its company. If we force vectors to predict the words a target keeps company with, vectors of words that share contexts are pulled together — so similarity becomes distance, and analogy becomes vector arithmetic.</KeyIdea>

      <h2>From one-hot to dense vectors</h2>
      <p>A one-hot vector treats every word as an isolated symbol: &quot;cat&quot; and &quot;kitten&quot; are exactly as dissimilar as &quot;cat&quot; and &quot;democracy&quot;. Embeddings replace that sparse, orthogonal coding with a learned dense vector of maybe 100&ndash;300 dimensions where the coordinates are continuous and shared.</p>
      <ul>
        <li><strong>Compact:</strong> a 50,000-word vocabulary becomes a single learnable matrix, not 50,000 unrelated dimensions.</li>
        <li><strong>Structured:</strong> nearby vectors mean related words, and consistent offsets capture relations like <M>{"\\text{king} - \\text{man} + \\text{woman} \\approx \\text{queen}"}</M>.</li>
        <li><strong>Transferable:</strong> embeddings trained on huge corpora seed downstream models that have little labeled data.</li>
      </ul>

      <Basic>
        <p>Imagine reading billions of sentences with a word blanked out. To guess the blank you rely on the surrounding words. Word2Vec automates exactly this game: it slides a window over text and trains a vector for each word so that a word can predict (or be predicted by) its neighbors. Words that fill the same kinds of blanks &mdash; &quot;tea&quot;, &quot;coffee&quot;, &quot;espresso&quot; &mdash; end up with similar vectors because the same neighbors keep pulling them to the same neighborhood.</p>
      </Basic>

      <Advanced>
        <p>Skip-gram with negative sampling maximizes the probability of true context words and minimizes it for randomly sampled &quot;negative&quot; words. For a center word <M>{"w"}</M> with vector <M>{"v_w"}</M> and a context word <M>{"c"}</M> with vector <M>{"u_c"}</M>, the per-pair objective is:</p>
        <MB>{"\\log \\sigma(u_c^\\top v_w) + \\sum_{i=1}^{k} \\mathbb{E}_{c_i \\sim P_n}\\big[\\log \\sigma(-u_{c_i}^\\top v_w)\\big]"}</MB>
        <p>GloVe instead factorizes global co-occurrence counts. It fits a weighted least-squares model so the dot product of two word vectors matches the log of how often they co-occur:</p>
        <MB>{"J = \\sum_{i,j} f(X_{ij})\\,\\big(v_i^\\top u_j + b_i + b_j - \\log X_{ij}\\big)^2"}</MB>
        <p>Both make the dot product (after softmax or weighting) approximate pointwise mutual information, which is why cosine similarity recovers semantic relatedness.</p>
      </Advanced>

      <Callout kind="pitfall" title="Cosine, not Euclidean">
        Compare embeddings with cosine similarity, not raw Euclidean distance. Vector norms drift with word frequency, so length carries little meaning while direction carries most of it &mdash; normalizing first avoids letting common words look artificially &quot;far&quot;.
      </Callout>

      <CodeBlock language="python" filename="embeddings.py">{`from gensim.models import Word2Vec

sentences = [["the", "cat", "sat", "on", "the", "mat"],
             ["a", "kitten", "sat", "near", "the", "cat"]]

# sg=1 -> skip-gram; negative=5 -> 5 negative samples per step
model = Word2Vec(sentences, vector_size=100, window=2,
                 min_count=1, sg=1, negative=5, epochs=50)

v_cat = model.wv["cat"]          # dense 100-d vector
print(model.wv.similarity("cat", "kitten"))   # cosine, in [-1, 1]
print(model.wv.most_similar("cat", topn=3))   # nearest neighbors`}</CodeBlock>

      <MoreDepth>
        <p>Classic embeddings are <strong>static</strong>: &quot;bank&quot; gets one vector that blends river-bank and money-bank senses, so it cannot disambiguate by context. Contextual models (ELMo, BERT) fixed this by emitting a different vector per occurrence. Levy and Goldberg also showed skip-gram with negative sampling is implicitly factorizing a shifted PMI matrix &mdash; so Word2Vec and count-based methods like GloVe are two views of the same underlying statistics, not rival paradigms.</p>
      </MoreDepth>

      <Quiz question="Why do 'tea' and 'coffee' end up with similar Word2Vec vectors?" options={[
        { text: "They are spelled similarly, and the model reads characters.", why: "Word2Vec treats words as atomic tokens; it never sees the characters or spelling." },
        { text: "They appear in similar contexts, so prediction training pulls their vectors together.", correct: true, why: "The distributional hypothesis: shared neighbors create shared predictive pressure, landing them nearby." },
        { text: "They were manually labeled as synonyms before training.", why: "Embeddings are learned unsupervised from raw text with no synonym labels." },
        { text: "They occur with the same total frequency in the corpus.", why: "Frequency affects sampling, not meaning; rare and common words can still be close if contexts match." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="What does it mean that word embeddings capture meaning as direction, and why is the famous king - man + woman = queen analogy a consequence of that?" difficulty="easy" tag="Conceptual">
  <p>An embedding maps each word to a dense vector in <M>{"\\mathbb{R}^d"}</M> (typically <M>{"d \\in [50, 300]"}</M>) such that <strong>semantic relationships become geometric ones</strong>. Words that appear in similar contexts land near each other, and consistent differences in meaning become consistent <strong>directions</strong>.</p>
  <ul>
    <li>The vector <M>{"v_{\\text{king}} - v_{\\text{man}}"}</M> isolates the &quot;royalty minus male-human&quot; offset.</li>
    <li>Adding that offset to <M>{"v_{\\text{woman}}"}</M> lands near <M>{"v_{\\text{queen}}"}</M>, because the gender direction is roughly parallel across many word pairs (man/woman, king/queen, actor/actress).</li>
  </ul>
  <p>Formally, analogy solving is a nearest-neighbor search:</p>
  <MB>{"\\hat{w} = \\arg\\max_{w} \\; \\cos\\big(v_w,\\; v_{\\text{king}} - v_{\\text{man}} + v_{\\text{woman}}\\big)"}</MB>
  <p>Caveat: this works only approximately, and the search usually <strong>excludes the input words</strong> themselves, otherwise &quot;king&quot; often wins trivially. The linear structure emerges because both Word2Vec and GloVe end up factorizing a (shifted) co-occurrence matrix, where ratios of co-occurrence probabilities behave multiplicatively, i.e. additively in log space.</p>
</InterviewProblem>
<InterviewProblem question="Why do we use cosine similarity rather than Euclidean distance to compare word vectors, and when would that choice matter?" difficulty="medium" tag="Conceptual">
  <p>Cosine measures the <strong>angle</strong> between vectors, ignoring magnitude:</p>
  <MB>{"\\cos(u, v) = \\frac{u \\cdot v}{\\lVert u \\rVert \\, \\lVert v \\rVert}"}</MB>
  <p>This matters because in trained embeddings, <strong>vector norm correlates with token frequency and information content</strong>, not with topic. Frequent or high-loss words drift to large norms during SGD. If you used raw Euclidean distance, a rare word and a common synonym could look far apart purely because of a norm gap, even when they point the same way.</p>
  <ul>
    <li>Cosine factors out that nuisance, isolating the <strong>direction</strong> that encodes meaning.</li>
    <li>Note that on <strong>L2-normalized</strong> vectors the two are equivalent: <M>{"\\lVert u - v \\rVert^2 = 2 - 2\\cos(u, v)"}</M>, so ranking by squared distance equals ranking by cosine. Normalize first and the question dissolves.</li>
    <li>When magnitude <strong>is</strong> the signal (e.g. some retrieval setups where confident embeddings should dominate), prefer the dot product instead.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="Walk through the skip-gram with negative sampling objective. Why was negative sampling introduced over the original softmax, and what is each negative example doing?" difficulty="hard" tag="Math">
  <p>Skip-gram predicts context words from a center word. The naive objective uses a full softmax over the vocabulary <M>{"V"}</M>:</p>
  <MB>{"P(c \\mid w) = \\frac{\\exp(v_c \\cdot v_w)}{\\sum_{c' \\in V} \\exp(v_{c'} \\cdot v_w)}"}</MB>
  <p>The denominator sums over <strong>every word in the vocabulary</strong> (often <M>{"10^5"}</M> to <M>{"10^6"}</M>), so each gradient step is <M>{"O(|V|)"}</M> and infeasible. <strong>Negative sampling (SGNS)</strong> replaces this with a binary classification task: distinguish true (center, context) pairs from <M>{"k"}</M> fake pairs drawn from a noise distribution. The per-pair loss is:</p>
  <MB>{"-\\log \\sigma(v_c \\cdot v_w) - \\sum_{i=1}^{k} \\mathbb{E}_{c_i \\sim P_n}\\big[\\log \\sigma(-v_{c_i} \\cdot v_w)\\big]"}</MB>
  <ul>
    <li>The first term pulls genuine co-occurring vectors <strong>together</strong> (pushes their dot product up).</li>
    <li>Each negative term pushes a randomly sampled word <strong>away</strong>, preventing the trivial solution where all vectors collapse to point the same direction.</li>
    <li>Cost drops to <M>{"O(k)"}</M> per step, with <M>{"k"}</M> around 5 to 20 for small corpora, 2 to 5 for large ones.</li>
    <li>Negatives are sampled from the unigram distribution raised to the <M>{"3/4"}</M> power, <M>{"P_n(w) \\propto f(w)^{0.75}"}</M>, which dampens very frequent words and boosts rare ones relative to raw frequency.</li>
  </ul>
  <p>Levy and Goldberg showed SGNS implicitly factorizes the <strong>shifted PMI matrix</strong>, <M>{"v_w \\cdot v_c \\approx \\text{PMI}(w, c) - \\log k"}</M>, which connects it directly to count-based methods like GloVe.</p>
</InterviewProblem>
<InterviewProblem question="A teammate trains Word2Vec on your support-ticket corpus, then ships those static vectors as features for a sentiment classifier. Results are mediocre. How would you diagnose and improve this?" difficulty="medium" tag="Applied">
  <p>I would attack three layers: data, the embedding choice, and the downstream usage.</p>
  <ul>
    <li><strong>Coverage and OOV.</strong> Check what fraction of tokens are out-of-vocabulary. A support corpus has typos, product codes, and SKUs that a min-count filter drops, leaving them as zero vectors. Switch to <strong>fastText</strong>, which composes vectors from character n-grams and handles OOV and misspellings gracefully.</li>
    <li><strong>Corpus size.</strong> Word2Vec needs tens of millions of tokens to converge. If the ticket corpus is small, <strong>start from pretrained vectors and fine-tune</strong>, or just use pretrained, rather than training from scratch on thin data.</li>
    <li><strong>Static vs contextual mismatch.</strong> Static embeddings give one vector per word, so &quot;crash&quot; (software) and &quot;crash&quot; (car) and polarity-flipping &quot;not good&quot; are not distinguished. For sentiment, a contextual model (a fine-tuned transformer encoder) usually wins decisively. That is the likely root cause.</li>
    <li><strong>Aggregation.</strong> If they averaged word vectors into a document vector, plain mean is a weak baseline. Try TF-IDF-weighted averaging, or SIF (smooth inverse frequency with common-component removal), before concluding the embeddings are bad.</li>
  </ul>
  <p>I would A/B these in order of effort: TF-IDF weighting and pretrained init first (cheap), then a fine-tuned transformer as the upper-bound comparison.</p>
</InterviewProblem>

      </>
  );
}
