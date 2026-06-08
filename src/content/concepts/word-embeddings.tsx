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
    </>
  );
}
