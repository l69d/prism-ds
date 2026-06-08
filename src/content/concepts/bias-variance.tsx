"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { Quiz } from "@/components/content/quiz";
import { BiasVarianceExplorer } from "@/components/viz/bias-variance";
import { InterviewProblem } from "@/components/content/interview-problem";
import { CodeBlock } from "@/components/content/code-block";

export default function BiasVarianceContent() {
  return (
    <>
      <p>
        The bias-variance tradeoff is the central tension in machine learning. Make a model too
        simple and it <strong>underfits</strong>; make it too flexible and it <strong>overfits</strong>.
        The art is finding the sweet spot that generalizes to new data.
      </p>

      <KeyIdea>
        <strong>Bias</strong> is error from wrong assumptions — the model is too rigid to capture the
        pattern. <strong>Variance</strong> is error from sensitivity to the particular training sample —
        the model memorizes noise. You can almost always trade one for the other; you want their sum minimized.
      </KeyIdea>

      <p>
        Increase the polynomial degree below. At degree 1 the model is too stiff (high bias). Push it
        high and it wiggles through every noisy point (high variance) — train error keeps dropping while
        test error turns back up. That U-shaped test curve is the whole story.
      </p>

      <BiasVarianceExplorer />

      <h2>Underfit vs overfit</h2>
      <Basic>
        <p>
          An <strong>underfit</strong> model is wrong in the same way everywhere — a straight line
          through a curve. An <strong>overfit</strong> model is right on the training data and wrong
          on everything else — it learned the noise, not the signal. The tell is the gap: low training
          error but high test error means overfitting.
        </p>
      </Basic>
      <Advanced>
        <p>For squared-error loss, expected test error decomposes exactly:</p>
        <MB>{"\\mathbb{E}\\big[(y-\\hat{f}(x))^2\\big] = \\underbrace{\\text{Bias}[\\hat{f}]^2}_{\\text{too rigid}} + \\underbrace{\\text{Var}[\\hat{f}]}_{\\text{too sensitive}} + \\underbrace{\\sigma^2}_{\\text{irreducible}}"}</MB>
        <p>
          The <M>{"\\sigma^2"}</M> term is noise you can never remove. Increasing model complexity
          lowers bias but raises variance; the optimum is where the two derivatives cancel.
        </p>
      </Advanced>

      <Callout kind="pitfall" title="The symptom you'll actually see">
        A big gap between training and validation score = overfitting (high variance). Both scores
        bad and close together = underfitting (high bias). Diagnose with a <strong>learning curve</strong>
        before reaching for fixes.
      </Callout>

      <h2>How to move along the curve</h2>
      <ul>
        <li><strong>Reduce variance</strong> — more data, regularization, simpler model, bagging, dropout, early stopping.</li>
        <li><strong>Reduce bias</strong> — a more expressive model, better features, less regularization, boosting.</li>
      </ul>

      <MoreDepth>
        <p>
          Modern deep learning complicates the classic picture: hugely over-parameterized networks
          can have near-zero training error yet still generalize, a phenomenon called{" "}
          <strong>double descent</strong> — test error falls, rises near the interpolation threshold,
          then falls again as capacity grows further. The tradeoff still governs, but implicit
          regularization (from SGD, architecture, and scale) reshapes where the optimum sits.
        </p>
      </MoreDepth>

      <Quiz
        question="Your model scores 0.99 on training data but 0.61 on validation. What's happening, and what helps?"
        options={[
          { text: "Underfitting — use a more complex model.", why: "Underfitting shows low scores on both sets, not a huge gap." },
          { text: "Overfitting — add regularization or more data.", correct: true, why: "The large train/val gap is the signature of high variance." },
          { text: "The data is perfect — ship it.", why: "Validation at 0.61 means it won't generalize." },
          { text: "Nothing — training score is all that matters.", why: "Training score alone is meaningless; generalization is the goal." },
        ]}
      />
    <h2>Interview practice</h2>
<InterviewProblem question="Explain the bias-variance tradeoff to a non-specialist, then make it precise." difficulty="easy" tag="Conceptual">
  <p>Intuitively, <strong>bias</strong> is error from a model being too simple to capture the real pattern: it systematically misses, the way a straight line cannot trace a curve. <strong>Variance</strong> is error from the model being too sensitive to the particular training sample: retrain on a fresh draw and the fit lurches around. A high-bias model <strong>underfits</strong> (bad on train and test); a high-variance model <strong>overfits</strong> (great on train, poor on test).</p>
  <p>Made precise: for a fixed test point <M>{"x"}</M> with true value <M>{"y = f(x) + \\varepsilon"}</M> where <M>{"\\varepsilon"}</M> has mean 0 and variance <M>{"\\sigma^2"}</M>, the expected squared error of an estimator <M>{"\\hat{f}"}</M> (expectation over training sets) decomposes as:</p>
  <MB>{"\\mathbb{E}\\big[(y - \\hat{f}(x))^2\\big] = \\underbrace{\\big(f(x) - \\mathbb{E}[\\hat{f}(x)]\\big)^2}_{\\text{bias}^2} + \\underbrace{\\mathbb{E}\\big[(\\hat{f}(x) - \\mathbb{E}[\\hat{f}(x)])^2\\big]}_{\\text{variance}} + \\underbrace{\\sigma^2}_{\\text{irreducible noise}}"}</MB>
  <p>The tradeoff: increasing model flexibility lowers bias but raises variance. Total error is U-shaped in complexity, and the <strong>irreducible noise</strong> <M>{"\\sigma^2"}</M> sets a floor no model can beat.</p>
</InterviewProblem>
<InterviewProblem question="Derive the bias-variance decomposition for squared error from scratch." difficulty="medium" tag="Math">
  <p>Fix <M>{"x"}</M> and write <M>{"\\hat{f} = \\hat{f}(x)"}</M>, with target <M>{"y = f + \\varepsilon"}</M>, <M>{"\\mathbb{E}[\\varepsilon]=0"}</M>, <M>{"\\operatorname{Var}(\\varepsilon)=\\sigma^2"}</M>, and <M>{"\\varepsilon"}</M> independent of the training data. Let <M>{"\\bar{f} = \\mathbb{E}[\\hat{f}]"}</M> (expectation over training sets). Start from the definition and add and subtract <M>{"\\bar{f}"}</M>:</p>
  <MB>{"\\mathbb{E}\\big[(y-\\hat{f})^2\\big] = \\mathbb{E}\\big[(f+\\varepsilon-\\hat{f})^2\\big]"}</MB>
  <p>Group as <M>{"(f-\\bar{f}) + (\\bar{f}-\\hat{f}) + \\varepsilon"}</M> and expand. Every cross term vanishes: <M>{"\\varepsilon"}</M> is mean-zero and independent of <M>{"\\hat{f}"}</M>, and <M>{"\\mathbb{E}[\\bar{f}-\\hat{f}]=0"}</M> kills the middle cross term. What survives is:</p>
  <MB>{"\\mathbb{E}\\big[(y-\\hat{f})^2\\big] = (f-\\bar{f})^2 + \\mathbb{E}\\big[(\\hat{f}-\\bar{f})^2\\big] + \\sigma^2 = \\text{bias}^2 + \\text{variance} + \\sigma^2"}</MB>
  <p>The key mechanical step interviewers look for is justifying that the cross terms are zero: it relies on the independence of the noise and on <M>{"\\bar{f}"}</M> being, by definition, the mean of <M>{"\\hat{f}"}</M>.</p>
</InterviewProblem>
<InterviewProblem question="A random forest gets 0.99 train AUC and 0.71 test AUC. Diagnose it and list concrete fixes, ordered by what you'd try first." difficulty="medium" tag="Applied">
  <p>The large train-test gap is the signature of <strong>high variance</strong> (overfitting), not high bias: a high-bias model would score poorly on <em>both</em>. Before touching the model, confirm the gap is real and not a leakage or split artifact.</p>
  <ul>
    <li><strong>Rule out leakage and bad splits first.</strong> A train AUC of 0.99 often means a feature encodes the target, or rows leaked across the split (e.g. random split on time-series, or duplicate users in both folds). Check feature importances and use grouped/temporal CV.</li>
    <li><strong>Add data.</strong> More training examples is the cleanest variance reducer; the test curve in a learning-curve plot keeps rising if you are data-limited.</li>
    <li><strong>Regularize the trees.</strong> Limit depth, raise min_samples_leaf, lower max_features per split, and use more (not fewer) trees so averaging cuts variance.</li>
    <li><strong>Simplify the feature space.</strong> Drop noisy or near-duplicate features; high-cardinality features feed overfitting.</li>
    <li><strong>Validate the diagnosis.</strong> Plot train vs CV score against a complexity knob (max_depth). If they converge as you regularize, variance was the problem.</li>
  </ul>
  <p>Note the asymmetry: adding trees to a forest reduces variance without increasing bias (it is averaging, not fitting harder), which is why it is a safe first move that does not appear in the simple complexity-knob story.</p>
</InterviewProblem>
<InterviewProblem question="Empirically separate bias from variance with a Monte Carlo experiment: estimate both for polynomial fits of increasing degree and show the U-shape." difficulty="hard" tag="Coding">
  <p>Idea: simulate many training sets from a known <M>{"f"}</M>, fit each degree, and at a fixed test point estimate bias as <M>{"f(x) - \\text{mean of fits}"}</M> and variance as the spread of fits. The minimum of bias-squared plus variance reveals the sweet spot.</p>
  <CodeBlock language="python" filename="bias_variance_mc.py">{`import numpy as np
from numpy.polynomial import polynomial as P

rng = np.random.default_rng(0)
f = lambda x: np.sin(2 * np.pi * x)      # true function
sigma, n_train, n_sets = 0.3, 30, 400     # noise, train size, # datasets
x_test = 0.6                               # one fixed evaluation point

for degree in range(1, 12):
    preds = np.empty(n_sets)
    for s in range(n_sets):
        x = rng.uniform(0, 1, n_train)
        y = f(x) + rng.normal(0, sigma, n_train)
        coef = P.polyfit(x, y, degree)     # fit this dataset
        preds[s] = P.polyval(x_test, coef) # predict the test point

    mean_pred = preds.mean()
    bias2 = (f(x_test) - mean_pred) ** 2   # squared bias
    var = preds.var()                       # variance across datasets
    total = bias2 + var + sigma ** 2        # + irreducible noise
    print(f"deg={degree:2d}  bias2={bias2:.4f}  var={var:.4f}  total={total:.4f}")`}</CodeBlock>
  <p>You will see bias-squared fall steeply for the first few degrees, then variance climb and eventually dominate, so <strong>total</strong> traces a U. The minimum lands near the complexity that matches the true curvature; everything above it is paying variance for bias you have already eliminated. The <M>{"\\sigma^2"}</M> term is a constant floor that no degree can reduce, which is exactly why chasing 0 training error is futile.</p>
</InterviewProblem>

      </>
  );
}
