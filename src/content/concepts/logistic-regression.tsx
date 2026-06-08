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
        Logistic regression takes the workhorse of linear models and bends its
        output into a probability, giving you a fast, interpretable classifier
        that underpins much of applied machine learning.
      </p>

      <KeyIdea>
        Compute a linear score, then squash it through the sigmoid so it lands in
        <M>{"(0, 1)"}</M> and reads as a probability. You are still fitting a
        straight decision boundary &mdash; the curve is only in how the score maps to
        a probability.
      </KeyIdea>

      <h2>From a line to a probability</h2>
      <p>
        A linear model produces a raw score <M>{"z = \\mathbf{w}^\\top \\mathbf{x} + b"}</M>
        that ranges over all real numbers. That is fine for predicting a price,
        but useless as a probability. The sigmoid fixes this:
      </p>
      <ul>
        <li><strong>Large positive score</strong> &rarr; probability near 1.</li>
        <li><strong>Score near zero</strong> &rarr; probability near 0.5 (maximally uncertain).</li>
        <li><strong>Large negative score</strong> &rarr; probability near 0.</li>
      </ul>

      <Basic>
        <p>
          Think of it as a dimmer switch rather than a light switch. The linear
          part adds up evidence for the positive class &mdash; each feature pushes the
          score up or down. The sigmoid then turns that total evidence into a
          confidence between 0 and 1. We do not punish the model for being a
          little unsure; we punish it for being confidently wrong, which is why
          the loss explodes when it bets 0.99 on the wrong answer.
        </p>
      </Basic>

      <Advanced>
        <p>The sigmoid and the probability of the positive class:</p>
        <MB>{"\\sigma(z) = \\frac{1}{1 + e^{-z}}, \\qquad P(y = 1 \\mid \\mathbf{x}) = \\sigma(\\mathbf{w}^\\top \\mathbf{x} + b)"}</MB>
        <p>
          We fit by maximizing the likelihood of the data, equivalently
          minimizing the average negative log-likelihood (log-loss / binary
          cross-entropy):
        </p>
        <MB>{"\\mathcal{L} = -\\frac{1}{n}\\sum_{i=1}^{n} \\left[ y_i \\log \\hat{p}_i + (1 - y_i) \\log(1 - \\hat{p}_i) \\right]"}</MB>
        <p>
          This loss is convex in <M>{"(\\mathbf{w}, b)"}</M>, so gradient descent
          reaches the global optimum. The gradient is strikingly clean: with
          <M>{"\\hat{p}_i = \\sigma(z_i)"}</M>, the contribution per example is
          <M>{"(\\hat{p}_i - y_i)\\,\\mathbf{x}_i"}</M> &mdash; the residual times the
          features, exactly mirroring linear regression.
        </p>
      </Advanced>

      <Callout kind="insight" title="The weights are log-odds">
        A coefficient <M>{"w_j"}</M> is the change in the <em>log-odds</em> of the
        positive class per unit of feature <M>{"x_j"}</M>. Exponentiating it,
        <M>{"e^{w_j}"}</M> is an odds ratio &mdash; this is why epidemiologists and
        credit scorers love the model: the parameters are directly interpretable.
      </Callout>

      <CodeBlock language="python" filename="logreg.py">{`from sklearn.linear_model import LogisticRegression
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split

X, y = make_classification(n_samples=1000, n_features=8, random_state=0)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, random_state=0)

# C is inverse regularization strength; smaller C = stronger penalty
clf = LogisticRegression(C=1.0, max_iter=1000)
clf.fit(Xtr, ytr)

proba = clf.predict_proba(Xte)[:, 1]   # calibrated-ish probabilities
print("accuracy:", clf.score(Xte, yte))
print("first probs:", proba[:5].round(3))`}</CodeBlock>

      <Callout kind="pitfall" title="Perfect separation breaks fitting">
        If a feature (or combination) perfectly splits the classes, the
        likelihood keeps improving as weights run to infinity &mdash; coefficients
        diverge and standard errors blow up. Regularization (an L2 penalty, which
        scikit-learn applies by default) tames this by keeping weights finite.
      </Callout>

      <MoreDepth>
        <p>
          Logistic regression is a generalized linear model with a Bernoulli
          response and a logit link, and it is the discriminative cousin of
          Gaussian naive Bayes: under shared-covariance Gaussian class
          conditionals, the posterior <M>{"P(y \\mid \\mathbf{x})"}</M> is exactly
          logistic. The difference is that logistic regression estimates the
          decision boundary directly rather than modeling each class&apos;s density,
          which makes it more robust when the Gaussian assumption is wrong. The
          softmax (multinomial) generalization extends the same log-loss
          machinery to more than two classes, and that single output layer is
          precisely what sits on top of a neural network classifier.
        </p>
      </MoreDepth>

      <Quiz question="Why is log-loss preferred over squared error for training logistic regression?" options={[
        { text: "It makes the model nonlinear in the features", why: "The decision boundary stays linear in the features regardless of the loss; the loss choice does not change that." },
        { text: "It is convex in the parameters and penalizes confident wrong predictions heavily, giving a clean global optimum", correct: true, why: "Log-loss is convex in (w, b) so gradient descent finds the global minimum, and it grows without bound as a confident prediction turns out wrong." },
        { text: "It guarantees the outputs are exactly 0 or 1", why: "Outputs are probabilities in (0,1) from the sigmoid; the loss does not force hard labels." },
        { text: "It removes the need for any regularization", why: "Log-loss does not prevent weights from diverging under perfect separation; regularization is still needed." },
      ]} />
    </>
  );
}
