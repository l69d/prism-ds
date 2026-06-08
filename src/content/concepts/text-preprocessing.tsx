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
      <p>Raw text is messy and unbounded; models need clean, comparable numeric features. Text preprocessing is the pipeline that turns prose into a vocabulary and then into vectors a model can learn from.</p>

      <KeyIdea>Preprocessing collapses surface variation (case, punctuation, word forms) so that words meaning the same thing land on the same feature &mdash; then weighting decides which words actually carry signal.</KeyIdea>

      <h2>The pipeline</h2>
      <p>A classic bag-of-words pipeline runs four steps in order:</p>
      <ul>
        <li><strong>Tokenization</strong> &mdash; split a string into atomic units (usually words). &quot;Don&apos;t panic!&quot; becomes <em>do</em>, <em>n&apos;t</em>, <em>panic</em>.</li>
        <li><strong>Normalization</strong> &mdash; lowercase, strip punctuation, then <strong>stem</strong> or <strong>lemmatize</strong> so <em>running</em>, <em>runs</em>, and <em>ran</em> share a root.</li>
        <li><strong>Stop-word removal</strong> &mdash; drop ultra-common, low-information words like <em>the</em>, <em>is</em>, <em>of</em>.</li>
        <li><strong>Weighting</strong> &mdash; convert counts into <strong>TF-IDF</strong> scores that reward distinctive terms.</li>
      </ul>

      <Basic>
        <p>Imagine indexing a stack of recipes. You first cut each recipe into words (tokenize), then treat <em>Eggs</em>, <em>eggs</em>, and <em>egg</em> as one ingredient (normalize and stem). Words like <em>the</em> appear in every recipe, so they tell you nothing &mdash; you throw them out (stop-words). Finally, a word like <em>saffron</em> shows up in only one recipe, so it&apos;s a great fingerprint, while <em>salt</em> is everywhere and barely useful. TF-IDF is exactly that instinct: rare-but-present words score high.</p>
      </Basic>

      <Advanced>
        <p>For term <M>{"t"}</M> in document <M>{"d"}</M> within a corpus of <M>{"N"}</M> documents, term frequency is the in-document count and inverse document frequency down-weights ubiquity:</p>
        <MB>{"\\text{idf}(t) = \\log\\frac{N}{1 + |\\{d : t \\in d\\}|}"}</MB>
        <MB>{"\\text{tfidf}(t, d) = \\text{tf}(t, d) \\cdot \\text{idf}(t)"}</MB>
        <p>The <M>{"1 +"}</M> in the denominator is smoothing that prevents division by zero. Resulting document vectors are typically L2-normalized so that <M>{"\\lVert \\mathbf{v}_d \\rVert_2 = 1"}</M>, making cosine similarity reduce to a dot product. Stemming (Porter) is a fast rule-based suffix chopper that can produce non-words; lemmatization uses a dictionary and part-of-speech to return valid base forms at higher cost.</p>
      </Advanced>

      <Callout kind="pitfall" title="Fit IDF on train only">
        Compute the vocabulary and IDF statistics on the training set, then apply the same transform to validation and test. Re-fitting on test leaks corpus-level information and inflates your scores.
      </Callout>

      <CodeBlock language="python" filename="tfidf.py">{`from sklearn.feature_extraction.text import TfidfVectorizer

corpus = [
    "The cat sat on the mat",
    "A dog sat on the log",
    "Cats and dogs are running",
]

vec = TfidfVectorizer(
    lowercase=True,
    stop_words="english",   # drop the, on, are, ...
    ngram_range=(1, 1),
)
X = vec.fit_transform(corpus)   # fit on TRAIN only

print(vec.get_feature_names_out())  # ['cat' 'cats' 'dog' 'dogs' 'log' 'mat' 'running' 'sat']
print(X.shape)                      # (3, 8) sparse matrix
# X.toarray() rows are L2-normalized TF-IDF vectors`}</CodeBlock>

      <Callout kind="insight" title="Why TF-IDF still matters">
        Even in the LLM era, TF-IDF + a linear model is a brutally strong baseline for text classification: cheap, interpretable, and often within a few points of a transformer on small datasets.
      </Callout>

      <MoreDepth>
        <p>Aggressive normalization can erase signal. For sentiment, <em>not</em> is a stop-word in many default lists yet flips polarity &mdash; so you often keep negations and use <strong>bigrams</strong> like <em>not good</em>. Subword tokenizers (BPE, WordPiece) used by modern LLMs sidestep stemming and stop-words entirely: they learn a fixed vocabulary of frequent character chunks, so rare and out-of-vocabulary words decompose into known pieces instead of being dropped.</p>
      </MoreDepth>

      <Quiz question="Why does IDF down-weight a word like 'the'?" options={[
        { text: "It appears in almost every document, so its IDF is near zero", correct: true, why: "log(N / docs containing it) is small when nearly all documents contain the term, shrinking its weight." },
        { text: "It is too short to be a useful token", why: "Token length is irrelevant to TF-IDF; weighting depends on document frequency, not character count." },
        { text: "Stemming removes it before IDF is computed", why: "Stemming changes word forms, not frequency-based weighting; 'the' is handled by stop-words or low IDF, not stemming." },
        { text: "Its term frequency is always exactly one", why: "Common words often have high term frequency; it is the inverse document frequency factor that suppresses them." },
      ]} />
    </>
  );
}
