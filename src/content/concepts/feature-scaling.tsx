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
    </>
  );
}
