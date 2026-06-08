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
    <h2>Interview practice</h2>
<InterviewProblem question="What is the difference between stemming and lemmatization, and when would you prefer one over the other?" difficulty="easy" tag="Conceptual">
  <p><strong>Stemming</strong> chops off affixes using crude heuristics (e.g. Porter), so &quot;studies&quot;, &quot;studying&quot; both collapse to &quot;studi&quot; &mdash; fast, language-agnostic, but produces non-words.</p>
  <p><strong>Lemmatization</strong> maps a word to its dictionary base form using a vocabulary and morphological analysis, often needing the part-of-speech: &quot;studies&quot; &rarr; &quot;study&quot;, &quot;better&quot; &rarr; &quot;good&quot;. It yields real words but is slower and needs linguistic resources.</p>
  <ul>
    <li>Prefer <strong>stemming</strong> for large-scale retrieval/search where speed matters and the tokens never need to be human-readable.</li>
    <li>Prefer <strong>lemmatization</strong> when downstream tasks care about correctness or interpretability (topic models, features shown to analysts, or where conflating &quot;better&quot;/&quot;good&quot; helps).</li>
  </ul>
  <p>A common pitfall: applying either before training a modern subword-tokenized transformer is usually counterproductive, since the model handles morphology itself and you would destroy signal.</p>
</InterviewProblem>
<InterviewProblem question="Derive the TF-IDF weight for a term and explain why each factor is shaped the way it is." difficulty="medium" tag="Math">
  <p>Let <M>{"t"}</M> be a term, <M>{"d"}</M> a document, and <M>{"N"}</M> the number of documents. A standard formulation uses log-scaled term frequency and smoothed inverse document frequency:</p>
  <MB>{"\\text{tf}(t,d) = 1 + \\log\\big(f_{t,d}\\big), \\qquad \\text{idf}(t) = \\log\\!\\frac{N}{1 + n_t}"}</MB>
  <p>where <M>{"f_{t,d}"}</M> is the raw count of <M>{"t"}</M> in <M>{"d"}</M> and <M>{"n_t"}</M> is the number of documents containing <M>{"t"}</M>. The weight is the product:</p>
  <MB>{"w_{t,d} = \\text{tf}(t,d)\\cdot \\text{idf}(t)"}</MB>
  <p>Reasoning behind the shape:</p>
  <ul>
    <li>The <strong>log on tf</strong> reflects diminishing returns &mdash; the 10th occurrence of a word tells you far less than the 1st, so raw counts would over-reward repetition.</li>
    <li>The <strong>idf</strong> term down-weights words appearing in many documents (a word in every document has <M>{"\\text{idf}\\approx 0"}</M>) and up-weights rare, discriminative words.</li>
    <li>The <strong>+1 in the denominator</strong> prevents division by zero for unseen terms and smooths very rare terms so they do not get an explosively large weight.</li>
  </ul>
  <p>In practice you then L2-normalize each document vector so that long documents do not dominate cosine similarity.</p>
</InterviewProblem>
<InterviewProblem question="You are building a sentiment classifier on customer reviews. How would you decide whether to remove stop-words, and what could go wrong if you remove them blindly?" difficulty="medium" tag="Applied">
  <p>The decision is task-dependent, so I would reason from what the model needs:</p>
  <ul>
    <li><strong>Topic/keyword tasks</strong> (search, topic modeling, TF-IDF retrieval): removing stop-words like &quot;the&quot;, &quot;is&quot;, &quot;and&quot; reduces dimensionality and noise with little cost, since they carry almost no topical signal.</li>
    <li><strong>Sentiment specifically</strong>: many standard stop-word lists contain <strong>negations</strong> like &quot;not&quot;, &quot;no&quot;, &quot;never&quot;. Dropping them turns &quot;not good&quot; into &quot;good&quot; and flips the label &mdash; a classic silent bug.</li>
  </ul>
  <p>So my approach:</p>
  <ul>
    <li>Start without aggressive stop-word removal and measure validation F1; treat removal as a hyperparameter to test, not a default.</li>
    <li>If I remove stop-words, use a <strong>custom list that retains negations and intensifiers</strong> (&quot;not&quot;, &quot;very&quot;, &quot;too&quot;).</li>
    <li>Capture negation context with <strong>bigrams/trigrams</strong> or negation-scope tagging so &quot;not_good&quot; becomes its own feature.</li>
    <li>For transformer models, skip stop-word removal entirely &mdash; attention already learns which tokens matter, and removal just degrades input.</li>
  </ul>
  <p>The broader principle: preprocessing choices must be validated against the metric, not assumed, because what is noise for one task is signal for another.</p>
</InterviewProblem>
<InterviewProblem question="Implement a small tokenizer-to-TF-IDF pipeline from scratch (no scikit-learn) and explain the fit/transform split." difficulty="hard" tag="Coding">
  <p>The key design decision is that <strong>idf and the vocabulary are learned on the training corpus only</strong> (fit), then reused unchanged at transform time so test documents map into the same feature space &mdash; otherwise you leak information and break alignment.</p>
  <CodeBlock language="python" filename="tfidf.py">{`import math
import re
from collections import Counter

def tokenize(text):
    # lowercase, keep word characters, simple whitespace split
    return re.findall(r"[a-z0-9]+", text.lower())

class Tfidf:
    def fit(self, corpus):
        self.docs_tokens = [tokenize(d) for d in corpus]
        n = len(self.docs_tokens)
        # document frequency: how many docs contain each term
        df = Counter()
        for toks in self.docs_tokens:
            for term in set(toks):
                df[term] += 1
        self.vocab = {t: i for i, t in enumerate(sorted(df))}
        # smoothed idf, learned on training data only
        self.idf = {t: math.log(n / (1 + df[t])) for t in self.vocab}
        return self

    def transform(self, corpus):
        rows = []
        for doc in corpus:
            toks = tokenize(doc)
            counts = Counter(toks)
            vec = [0.0] * len(self.vocab)
            for term, f in counts.items():
                if term not in self.vocab:   # ignore OOV terms at test time
                    continue
                tf = 1 + math.log(f)
                vec[self.vocab[term]] = tf * self.idf[term]
            # L2 normalize so long docs do not dominate
            norm = math.sqrt(sum(v * v for v in vec)) or 1.0
            rows.append([v / norm for v in vec])
        return rows

corpus = ["the cat sat", "the dog ran", "cat and dog"]
model = Tfidf().fit(corpus)
print(model.transform(["cat dog dog"]))`}</CodeBlock>
  <p>Talking points an interviewer wants: (1) <strong>fit learns vocab + idf, transform only applies them</strong>; (2) out-of-vocabulary terms at test time are dropped, not added, to keep dimensions fixed; (3) L2 normalization makes cosine similarity well-behaved; (4) complexity is roughly <M>{"O(\\sum_d |d|)"}</M> over total tokens, and the sparse-matrix version avoids the dense zero-filled vectors shown here.</p>
</InterviewProblem>

      </>
  );
}
