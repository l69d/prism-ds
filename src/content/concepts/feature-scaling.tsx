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
      <p>Feature scaling rewrites your numeric columns onto a common range or spread so that no feature dominates a model simply because it happens to be measured in larger units.</p>
      <KeyIdea>Many algorithms measure distance or take gradient steps in the raw units of your features. A column in dollars (0 to 100,000) will steamroll a column in years (0 to 80) unless you put them on a comparable footing first.</KeyIdea>

      <h2>The three workhorse scalers</h2>
      <p>Almost every practical situation is covered by three transforms:</p>
      <ul>
        <li><strong>Standardization (z-score)</strong>: subtract the mean, divide by the standard deviation. Centers each feature at 0 with unit variance. The default choice.</li>
        <li><strong>Normalization (min-max)</strong>: rescale linearly into a fixed range, usually <M>{"[0, 1]"}</M>. Useful when you need bounded inputs.</li>
        <li><strong>Robust scaling</strong>: subtract the median, divide by the interquartile range. Outliers barely move the median and IQR, so this resists them.</li>
      </ul>

      <Basic>
        <p>Imagine comparing people by height in centimetres and salary in rupees. Salary numbers are thousands of times bigger, so a &quot;nearest neighbor&quot; would group everyone purely by salary and ignore height entirely. Scaling shrinks both onto the same playing field so each feature gets a fair vote.</p>
        <p>Standardization asks &quot;how many standard deviations above or below average is this value?&quot; Min-max asks &quot;where does this sit between the smallest and largest value, from 0 to 1?&quot; Robust scaling does the same as standardization but uses the median and middle 50% so a few wild outliers do not skew the recipe.</p>
      </Basic>

      <Advanced>
        <p>Standardization maps each feature with</p>
        <MB>{"z = \\frac{x - \\mu}{\\sigma}"}</MB>
        <p>where <M>{"\\mu"}</M> and <M>{"\\sigma"}</M> are estimated on the training set only. Min-max scaling is</p>
        <MB>{"x' = \\frac{x - x_{\\min}}{x_{\\max} - x_{\\min}}"}</MB>
        <p>and robust scaling replaces the moments with order statistics,</p>
        <MB>{"x'' = \\frac{x - \\text{median}(x)}{Q_3 - Q_1}"}</MB>
        <p>Scaling matters because gradient descent on an ill-conditioned loss zig-zags: the condition number of the input covariance controls convergence speed, and equalizing feature variances pushes it toward 1. L1/L2 regularization also penalizes coefficients in feature units, so unscaled features get inconsistently penalized.</p>
      </Advanced>

      <h2>Which models actually care</h2>
      <ul>
        <li><strong>Care a lot</strong>: k-NN, k-means, SVMs with RBF kernels, PCA, and any gradient-descent model (linear/logistic regression, neural nets) — all use distances or step sizes that depend on units.</li>
        <li><strong>Do not care</strong>: decision trees, random forests, and gradient-boosted trees. They split on thresholds per feature, so monotonic rescaling leaves the splits unchanged.</li>
      </ul>

      <CodeBlock language="python" filename="scaling.py">{`from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.svm import SVC

# Fit the scaler INSIDE a pipeline so it learns mu/sigma
# only on the training fold during cross-validation.
model = make_pipeline(StandardScaler(), SVC(kernel="rbf"))
model.fit(X_train, y_train)
print(model.score(X_test, y_test))`}</CodeBlock>

      <Callout kind="pitfall" title="Never fit the scaler on the full dataset">
        Fitting the scaler on train and test combined leaks information from the test set into training. Fit on training data only, then apply the stored statistics to validation and test sets. Wrapping the scaler in a pipeline does this automatically per fold.
      </Callout>

      <MoreDepth>
        <p>Tree-based models are scale-invariant only for axis-aligned splits on the raw features. The moment you add a distance-based component — KNN-imputed features, a polynomial/interaction term, or an embedding fed alongside trees — invariance breaks. Also note that standardization does not remove skew or make data Gaussian; for that you need a power transform such as Yeo-Johnson or a log. And for sparse matrices, subtracting the mean destroys sparsity, so use <code>MaxAbsScaler</code> or <code>StandardScaler(with_mean=False)</code> to preserve it.</p>
      </MoreDepth>

      <Quiz question="You train a gradient-boosted tree and a k-NN classifier on the same unscaled data. Which is more likely to suffer?" options={[
        { text: "The k-NN classifier", correct: true, why: "k-NN relies on Euclidean distance, which is dominated by large-magnitude features unless they are scaled." },
        { text: "The gradient-boosted tree", why: "Trees split on per-feature thresholds, so any monotonic rescaling leaves the splits and predictions unchanged." },
        { text: "Both equally", why: "They differ fundamentally: distance-based models are sensitive to scale while tree splits are invariant to it." },
        { text: "Neither, scaling never matters", why: "Scaling matters a great deal for distance- and gradient-based models even if it does not for trees." },
      ]} />
    <h2>Interview practice</h2>

<InterviewProblem question="Which models are sensitive to feature scaling and which are scale-invariant? Explain why." difficulty="easy" tag="Conceptual">
  <p>The dividing line is whether the model uses <strong>distances, dot products, or a shared regularization penalty</strong> across features.</p>
  <ul>
    <li><strong>Need scaling:</strong> k-NN, k-means, SVM/SVR (RBF and linear), PCA, and any gradient-descent model with L1/L2 regularization (ridge, lasso, logistic regression, neural nets). These compare features on a common geometric or penalty scale, so a feature measured in the thousands will dominate one measured in fractions.</li>
    <li><strong>Scale-invariant:</strong> decision trees, random forests, and gradient-boosted trees. They split one feature at a time on threshold rules, and any monotonic rescaling of a single feature leaves the set of possible splits unchanged.</li>
  </ul>
  <p>For PCA the reason is sharp: PCA maximizes variance, and variance has units. An unscaled feature with large variance (say, income in dollars) will hijack the leading component regardless of its true importance, so you standardize first.</p>
</InterviewProblem>

<InterviewProblem question="Why does standardizing features speed up gradient descent? Give the geometric intuition." difficulty="medium" tag="Math">
  <p>Consider squared-error loss <M>{"L(w) = \\tfrac{1}{2}\\,\\|Xw - y\\|^2"}</M>. The curvature is set by the Hessian <M>{"H = X^\\top X"}</M>, and gradient descent converges at a rate governed by its condition number <M>{"\\kappa = \\lambda_{\\max}/\\lambda_{\\min}"}</M>.</p>
  <p>If features have wildly different scales, the columns of <M>{"X"}</M> have very different norms, the eigenvalues of <M>{"X^\\top X"}</M> spread out, and <M>{"\\kappa"}</M> blows up. The loss surface becomes a long narrow valley: a single learning rate is too big along the steep axis and too small along the flat one, so the path zig-zags.</p>
  <MB>{"\\text{error after } k \\text{ steps} \\;\\propto\\; \\left(\\frac{\\kappa - 1}{\\kappa + 1}\\right)^{k}"}</MB>
  <p>Standardizing to zero mean and unit variance equalizes the column norms, pulls the eigenvalues together, shrinks <M>{"\\kappa"}</M> toward 1, and turns the valley into a bowl, so far fewer steps are needed.</p>
</InterviewProblem>

<InterviewProblem question="You have a feature with heavy outliers and a long right tail. How would you scale it, and why not just standardize?" difficulty="medium" tag="Applied">
  <p>Standardization uses the mean and standard deviation, both of which are dragged by outliers. A few extreme points inflate <M>{"\\sigma"}</M>, which compresses the bulk of the data into a tiny range near zero, so the scaling does not actually equalize what most rows look like.</p>
  <p>Better options, roughly in order:</p>
  <ul>
    <li><strong>RobustScaler</strong> centers on the median and divides by the IQR (<M>{"Q_3 - Q_1"}</M>), both of which ignore the tails. The middle 50% of the data ends up on a sensible scale and outliers stay outliers instead of distorting everyone else.</li>
    <li><strong>Transform first, then scale.</strong> For a positive long-tailed feature, apply <M>{"\\log(1+x)"}</M> or a Box-Cox / Yeo-Johnson power transform to pull in the tail and make the distribution roughly symmetric, then standardize.</li>
  </ul>
  <p>Whatever you pick, <strong>fit the scaler on the training split only</strong> and apply the stored statistics to validation and test, otherwise test information leaks into the median, IQR, or transform parameters.</p>
</InterviewProblem>

<InterviewProblem question="Write scikit-learn code that scales features correctly inside cross-validation, avoiding leakage. Explain the bug in the naive version." difficulty="hard" tag="Coding">
  <p>The classic mistake is to scale the whole dataset once, before splitting. Then the scaler&apos;s mean and standard deviation are computed using rows that later land in the validation folds, so every fold has peeked at its own statistics. Cross-validation scores come out optimistically biased.</p>
  <p>The fix is to wrap the scaler and the estimator in a <strong>Pipeline</strong>, so the scaler is re-fit on each training fold only and the same transform is applied to the held-out fold:</p>
  <CodeBlock language="python" filename="scale_cv.py">{`import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score

# WRONG: scaler sees the whole dataset, leaking val stats into training
# X_scaled = StandardScaler().fit_transform(X)
# scores = cross_val_score(LogisticRegression(), X_scaled, y, cv=5)

# RIGHT: scaler is re-fit inside each training fold
pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", LogisticRegression(max_iter=1000)),
])

scores = cross_val_score(pipe, X, y, cv=5, scoring="roc_auc")
print(f"AUC: {scores.mean():.3f} +/- {scores.std():.3f}")

# The fitted statistics live in the pipeline and are reused at predict time
pipe.fit(X, y)
print("means:", np.round(pipe.named_steps["scaler"].mean_, 2))`}</CodeBlock>
  <p>The same rule applies to any preprocessing that learns parameters from data (imputation, target encoding, PCA): it belongs <strong>inside</strong> the pipeline so it is fit on training data only and re-fit per fold.</p>
</InterviewProblem>

      </>
  );
}
