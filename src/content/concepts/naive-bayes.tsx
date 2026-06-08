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
    <h2>Interview practice</h2>
<InterviewProblem question="What is the 'naive' assumption in Naive Bayes, and why does the classifier still work well despite it usually being false?" difficulty="easy" tag="Conceptual">
  <p>The model applies Bayes&apos; rule to get the posterior over a class <M>{"y"}</M> given features <M>{"x_1,\\dots,x_d"}</M>:</p>
  <MB>{"P(y \\mid x_1,\\dots,x_d) \\propto P(y)\\, P(x_1,\\dots,x_d \\mid y)"}</MB>
  <p>The likelihood <M>{"P(x_1,\\dots,x_d \\mid y)"}</M> is hard to estimate jointly. The <strong>naive assumption</strong> is conditional independence of features given the class:</p>
  <MB>{"P(x_1,\\dots,x_d \\mid y) = \\prod_{j=1}^{d} P(x_j \\mid y)"}</MB>
  <p>Real features are rarely independent, yet it works because:</p>
  <ul>
    <li><strong>Classification only needs the argmax</strong>, not calibrated probabilities. Even badly biased posteriors can rank the correct class highest, so decision boundaries survive violated assumptions.</li>
    <li><strong>Few parameters</strong> (<M>{"O(d)"}</M> per class instead of exponential), giving low variance — a great bias-variance trade when data is scarce or high-dimensional, as in text.</li>
    <li>Dependencies that affect all classes similarly cancel out when you take the ratio of posteriors.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="A spam filter sees a word that never appeared in spam during training. What happens, and how do you fix it?" difficulty="medium" tag="Applied">
  <p>If a word <M>{"w"}</M> never occurred in the spam class, the maximum-likelihood estimate is <M>{"P(w \\mid \\text{spam}) = 0"}</M>. Because the likelihood is a product, a single zero <strong>annihilates the entire posterior</strong> — any email containing <M>{"w"}</M> gets zero spam probability regardless of every other word. This is the zero-frequency problem.</p>
  <p>The fix is <strong>Laplace (additive) smoothing</strong>. For a multinomial Naive Bayes with vocabulary size <M>{"V"}</M>:</p>
  <MB>{"P(w \\mid c) = \\frac{\\text{count}(w, c) + \\alpha}{\\big(\\sum_{w'} \\text{count}(w', c)\\big) + \\alpha V}"}</MB>
  <p>with <M>{"\\alpha = 1"}</M> for classic Laplace (or smaller <M>{"\\alpha"}</M> tuned by cross-validation). This guarantees every probability is strictly positive. In practice you also work in <strong>log space</strong> — summing <M>{"\\log P(w \\mid c)"}</M> — to avoid floating-point underflow from multiplying thousands of tiny probabilities.</p>
</InterviewProblem>
<InterviewProblem question="Work through a numeric example: classify a short document with multinomial Naive Bayes and Laplace smoothing." difficulty="hard" tag="Math">
  <p>Two classes with equal priors <M>{"P(\\text{sport}) = P(\\text{tech}) = 0.5"}</M>. Vocabulary <M>{"V = 3"}</M>, namely the three words game, team, and chip. Training word counts:</p>
  <ul>
    <li><strong>sport</strong>: game=3, team=3, chip=0, total=6</li>
    <li><strong>tech</strong>: game=1, team=0, chip=3, total=4</li>
  </ul>
  <p>Classify the document <strong>&quot;game chip&quot;</strong>. With <M>{"\\alpha = 1"}</M> the smoothed likelihoods are:</p>
  <MB>{"P(\\text{game}\\mid\\text{sport}) = \\frac{3+1}{6+3} = \\frac{4}{9}, \\quad P(\\text{chip}\\mid\\text{sport}) = \\frac{0+1}{6+3} = \\frac{1}{9}"}</MB>
  <MB>{"P(\\text{game}\\mid\\text{tech}) = \\frac{1+1}{4+3} = \\frac{2}{7}, \\quad P(\\text{chip}\\mid\\text{tech}) = \\frac{3+1}{4+3} = \\frac{4}{7}"}</MB>
  <p>Unnormalized posteriors (drop the equal prior since it cancels):</p>
  <MB>{"\\text{sport} \\propto \\tfrac{4}{9}\\cdot\\tfrac{1}{9} = \\tfrac{4}{81} \\approx 0.0494"}</MB>
  <MB>{"\\text{tech} \\propto \\tfrac{2}{7}\\cdot\\tfrac{4}{7} = \\tfrac{8}{49} \\approx 0.1633"}</MB>
  <p>Normalizing, <M>{"P(\\text{tech}\\mid\\text{doc}) = 0.1633 / (0.0494 + 0.1633) \\approx 0.77"}</M>, so the document is classified as <strong>tech</strong>. The word &quot;chip&quot; dominates because it is far more characteristic of tech.</p>
</InterviewProblem>
<InterviewProblem question="When would you choose Gaussian vs. multinomial vs. Bernoulli Naive Bayes, and how does Naive Bayes compare to logistic regression?" difficulty="medium" tag="Conceptual">
  <p>The variants differ only in the per-feature likelihood <M>{"P(x_j \\mid y)"}</M>:</p>
  <ul>
    <li><strong>Gaussian</strong>: continuous features modeled as <M>{"x_j \\mid y \\sim \\mathcal{N}(\\mu_{jy}, \\sigma_{jy}^2)"}</M>. Use for real-valued inputs (sensor readings, measurements).</li>
    <li><strong>Multinomial</strong>: features are counts (word frequencies, TF-IDF). The standard choice for document classification.</li>
    <li><strong>Bernoulli</strong>: features are binary presence/absence. Differs from multinomial by explicitly modeling the <strong>absence</strong> of a word as evidence, which helps on short texts.</li>
  </ul>
  <p>Versus logistic regression: Naive Bayes is the <strong>generative</strong> counterpart (it models <M>{"P(x, y)"}</M>) of the <strong>discriminative</strong> logistic regression (which models <M>{"P(y \\mid x)"}</M> directly) — they form a generative-discriminative pair. The classic Ng &amp; Jordan result: Naive Bayes has higher asymptotic error (its independence bias hurts) but <strong>reaches its asymptote faster</strong>, so it often wins with little training data, while logistic regression overtakes it as data grows. Naive Bayes is also trivially fast to train (just count) and naturally handles missing features by skipping their factors.</p>
</InterviewProblem>

      </>
  );
}
