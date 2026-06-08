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
    <h2>Interview practice</h2>

<InterviewProblem question="Why do we use log-loss to train logistic regression instead of squared error?" difficulty="easy" tag="Conceptual">
  <p>Logistic regression models <M>{"p = \\sigma(w^\\top x)"}</M>, the probability of the positive class. Two reasons make log-loss (cross-entropy) the right objective:</p>
  <ul>
    <li><strong>It is the maximum-likelihood objective.</strong> For Bernoulli labels, the negative log-likelihood is exactly <M>{"-[y\\log p + (1-y)\\log(1-p)]"}</M>. Minimizing it is the principled MLE for this model.</li>
    <li><strong>It is convex in the weights, while squared error on the sigmoid is not.</strong> Plugging <M>{"\\sigma"}</M> into <M>{"(y-\\sigma(w^\\top x))^2"}</M> produces a non-convex surface with flat regions and local minima, so gradient descent can stall. Log-loss gives a single global optimum.</li>
    <li><strong>It punishes confident mistakes hard.</strong> As <M>{"p \\to 0"}</M> for a true positive, <M>{"-\\log p \\to \\infty"}</M>, which keeps gradients informative even deep in the saturated tails of the sigmoid where squared error gradients vanish.</li>
  </ul>
</InterviewProblem>

<InterviewProblem question="Derive the gradient of the log-loss with respect to the weights, and explain why it has such a clean form." difficulty="medium" tag="Math">
  <p>For one example let <M>{"z = w^\\top x"}</M> and <M>{"p = \\sigma(z) = 1/(1+e^{-z})"}</M>. The loss is:</p>
  <MB>{"L = -\\big[y\\log p + (1-y)\\log(1-p)\\big]"}</MB>
  <p>Use the key identity <M>{"\\sigma'(z) = \\sigma(z)\\,(1-\\sigma(z)) = p(1-p)"}</M>. By the chain rule:</p>
  <MB>{"\\frac{\\partial L}{\\partial p} = -\\frac{y}{p} + \\frac{1-y}{1-p} = \\frac{p-y}{p(1-p)}"}</MB>
  <p>Multiplying by <M>{"\\partial p / \\partial z = p(1-p)"}</M> the denominator cancels:</p>
  <MB>{"\\frac{\\partial L}{\\partial z} = p - y, \\qquad \\frac{\\partial L}{\\partial w} = (p - y)\\,x"}</MB>
  <p>So the gradient is just the <strong>prediction error times the feature vector</strong>. The cancellation is not luck: the sigmoid is the canonical link for the Bernoulli in the exponential family, and for any such generalized linear model the gradient reduces to <M>{"(\\hat{y}-y)x"}</M>. Summed over a batch this is <M>{"X^\\top(p - y)"}</M>.</p>
</InterviewProblem>

<InterviewProblem question="Your fraud classifier has only 1% positives. Trained logistic regression predicts almost everything as non-fraud. What is going on and how would you fix it?" difficulty="medium" tag="Applied">
  <p>The model is not broken; it is correctly minimizing average log-loss on a heavily skewed set, where the cheapest strategy is to push the intercept so <M>{"p"}</M> sits near the base rate and rarely crosses the default 0.5 threshold. Things to do:</p>
  <ul>
    <li><strong>Move the decision threshold, do not trust 0.5.</strong> Logistic regression outputs calibrated probabilities; pick the operating threshold from a precision-recall curve to hit the business cost trade-off, e.g. flag if <M>{"p > 0.05"}</M>.</li>
    <li><strong>Reweight or resample.</strong> Use class weights inversely proportional to frequency (in scikit-learn, <strong>class_weight=&quot;balanced&quot;</strong>) so each fraud case contributes more to the loss, or down-sample the majority.</li>
    <li><strong>Evaluate with the right metrics.</strong> Accuracy is useless here; report PR-AUC, recall at a fixed precision, and the confusion matrix at your chosen threshold.</li>
    <li><strong>Recalibrate after reweighting.</strong> Resampling shifts predicted probabilities away from the true base rate, so correct the intercept or apply Platt/isotonic calibration if you need probabilities, not just rankings.</li>
  </ul>
</InterviewProblem>

<InterviewProblem question="Implement binary logistic regression training with batch gradient descent and L2 regularization in NumPy." difficulty="hard" tag="Coding">
  <p>Using the gradient <M>{"X^\\top(p-y)/n + \\lambda w"}</M> (we exclude the bias from the penalty), a compact, numerically careful implementation is:</p>
  <CodeBlock language="python" filename="logreg.py">{`import numpy as np

def sigmoid(z):
    # clip to avoid overflow in exp for large negative z
    return np.where(z >= 0, 1 / (1 + np.exp(-z)),
                    np.exp(z) / (1 + np.exp(z)))

def train_logreg(X, y, lr=0.1, l2=1e-3, epochs=2000):
    n, d = X.shape
    Xb = np.hstack([np.ones((n, 1)), X])   # prepend bias column
    w = np.zeros(d + 1)
    for _ in range(epochs):
        p = sigmoid(Xb @ w)
        grad = Xb.T @ (p - y) / n
        grad[1:] += l2 * w[1:]             # penalize weights, not bias
        w -= lr * grad
    return w

def predict_proba(X, w):
    Xb = np.hstack([np.ones((X.shape[0], 1)), X])
    return sigmoid(Xb @ w)`}</CodeBlock>
  <p>Key correctness points an interviewer probes: the <strong>numerically stable sigmoid</strong> (a naive <M>{"1/(1+e^{-z})"}</M> overflows for very negative <M>{"z"}</M>); <strong>not regularizing the bias</strong>, since shrinking the intercept biases predictions away from the base rate; and dividing the gradient by <M>{"n"}</M> so the learning rate is independent of batch size. For production you would also standardize features so L2 penalizes all coefficients on a comparable scale.</p>
</InterviewProblem>

      </>
  );
}
