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
      <p>Naive Bayes is a probabilistic classifier built from Bayes&apos; rule and one deliberately unrealistic shortcut: it assumes every feature is independent given the class. That shortcut is wrong, yet it makes the model fast, robust on tiny data, and a surprisingly strong baseline for text.</p>

      <KeyIdea>To classify, ask which class makes the observed features most probable, multiply each feature&apos;s likelihood as if the features never interact, and pick the winner.</KeyIdea>

      <h2>The core idea</h2>
      <p>We want the most probable class given the evidence. Bayes&apos; rule rewrites that posterior in terms of things we can estimate from training data: how common each class is, and how likely each feature is within each class. The denominator is the same for every class, so we ignore it and just compare numerators.</p>
      <ul>
        <li><strong>Prior:</strong> how frequent each class is overall.</li>
        <li><strong>Likelihood:</strong> how typical a feature value is inside a given class.</li>
        <li><strong>Naive assumption:</strong> treat features as independent so likelihoods simply multiply.</li>
      </ul>

      <Basic>
        <p>Imagine sorting email into spam vs. not-spam. Spam tends to contain words like &quot;free&quot; and &quot;winner&quot;. Naive Bayes learns, from labelled examples, how often each word shows up in spam versus normal mail. For a new email it asks: given these words, which bucket is more believable? It pretends each word is its own independent clue, so it just multiplies the clues together. Even though words clearly do co-occur in reality, this pretend-independence rarely changes which class wins.</p>
      </Basic>

      <Advanced>
        <p>Bayes&apos; rule gives the posterior over class <M>{"C_k"}</M> from features <M>{"x_1,\\dots,x_n"}</M>:</p>
        <MB>{"P(C_k \\mid x_1,\\dots,x_n) = \\frac{P(C_k)\\,\\prod_{i=1}^{n} P(x_i \\mid C_k)}{P(x_1,\\dots,x_n)}"}</MB>
        <p>The product replaces the true joint likelihood under the conditional-independence assumption. Since the denominator is constant across classes, prediction is:</p>
        <MB>{"\\hat{y} = \\arg\\max_{k}\; \\log P(C_k) + \\sum_{i=1}^{n} \\log P(x_i \\mid C_k)"}</MB>
        <p>We sum logs to avoid numerical underflow from multiplying many small probabilities.</p>
      </Advanced>

      <Callout kind="pitfall" title="The zero-frequency trap">
        If a word never appeared in the training spam, its likelihood is zero, and one zero multiplied in wipes out the whole product. Fix it with Laplace (add-one) smoothing so no probability is ever exactly zero.
      </Callout>

      <CodeBlock language="python" filename="naive_bayes.py">{`from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline

texts = ["free money now", "meeting at noon", "winner claim prize", "lunch tomorrow?"]
labels = ["spam", "ham", "spam", "ham"]

# alpha=1.0 is Laplace smoothing -> no zero likelihoods
model = make_pipeline(CountVectorizer(), MultinomialNB(alpha=1.0))
model.fit(texts, labels)

print(model.predict(["claim your free prize"]))   # -> ['spam']
print(model.predict_proba(["lunch at noon"]))      # calibrated? probably not`}</CodeBlock>

      <MoreDepth>
        <p>The independence assumption usually makes the predicted <em>probabilities</em> badly miscalibrated (often pushed toward 0 or 1), yet the <em>ranking</em> of classes stays right far more often than the assumption deserves. The reason: correlated features bias each class&apos;s score, but they tend to bias them in the same direction, so the arg-max survives. Use it for the label, not the confidence; if you need real probabilities, calibrate (e.g. Platt scaling or isotonic regression) afterward.</p>
      </MoreDepth>

      <Quiz question="Why does Naive Bayes often classify well even though its independence assumption is clearly false?" options={[
        { text: "Because correlations bias each class score similarly, so the arg-max class usually stays correct even when probabilities are wrong", correct: true, why: "Decision-boundary survives miscalibrated scores as long as the winning class is unchanged." },
        { text: "Because real-world features are actually independent once you condition on the class", why: "They usually aren't; the assumption is wrong, the model just tolerates it." },
        { text: "Because it estimates the true joint distribution exactly", why: "It deliberately factorizes the joint into a product, which is an approximation." },
        { text: "Because Laplace smoothing corrects the dependence between features", why: "Smoothing only removes zero probabilities; it does nothing about feature correlations." },
      ]} />
    </>
  );
}
