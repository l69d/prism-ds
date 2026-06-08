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
        k-Nearest Neighbors (kNN) makes a prediction for a new point by finding
        the training examples closest to it and letting them vote. There is no
        equation to fit, no weights to learn &mdash; it simply memorizes the data.
      </p>

      <KeyIdea>
        Things that are close together in feature space tend to share a label.
        To classify a point, ask its <strong>k</strong> nearest neighbors and go
        with the majority.
      </KeyIdea>

      <h2>How it works</h2>
      <p>
        kNN is called a <strong>lazy learner</strong> because training does
        almost nothing &mdash; it just stores the data. All the work happens at
        prediction time:
      </p>
      <ul>
        <li>Compute the distance from the query point to every training point.</li>
        <li>Keep the <strong>k</strong> closest ones (the neighbors).</li>
        <li>For classification, take a majority vote; for regression, average their values.</li>
      </ul>

      <Basic>
        <p>
          Imagine you move to a new neighborhood and want to guess whether a
          house is expensive. You look at the few houses nearest to it: if most
          are pricey, you guess pricey. Small <strong>k</strong> (like 1) trusts
          the single closest neighbor &mdash; sensitive but jumpy. Large
          <strong> k</strong> smooths things out by polling a bigger crowd, but
          can blur fine boundaries. The right <strong>k</strong> balances the two.
        </p>
      </Basic>

      <Advanced>
        <p>
          Given a query <M>{"\\mathbf{x}"}</M>, define its neighborhood
          <M>{"\\,N_k(\\mathbf{x})"}</M> as the k training points minimizing a
          distance metric &mdash; commonly Euclidean:
        </p>
        <MB>{"d(\\mathbf{x}, \\mathbf{x}_i) = \\sqrt{\\sum_{j=1}^{p} (x_j - x_{ij})^2}"}</MB>
        <p>The classification rule is a majority vote over the neighborhood:</p>
        <MB>{"\\hat{y}(\\mathbf{x}) = \\arg\\max_{c} \\sum_{i \\in N_k(\\mathbf{x})} \\mathbb{1}(y_i = c)"}</MB>
        <p>
          As <M>{"n \\to \\infty"}</M> with <M>{"k \\to \\infty"}</M> and
          <M>{"\\,k/n \\to 0"}</M>, the kNN error is bounded by twice the Bayes
          error rate &mdash; a remarkable consistency guarantee for such a simple
          method.
        </p>
      </Advanced>

      <Callout kind="pitfall" title="Scale your features first">
        Distance is dominated by whatever feature has the largest range. If
        income is in dollars (thousands) and age is in years (tens), income
        swamps age. Always standardize or normalize features before running kNN.
      </Callout>

      <CodeBlock language="python" filename="knn.py">{`from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline

# Scaling INSIDE the pipeline is essential for distance-based kNN
clf = make_pipeline(
    StandardScaler(),
    KNeighborsClassifier(n_neighbors=5, weights="distance"),
)
clf.fit(X_train, y_train)
print(clf.score(X_test, y_test))`}</CodeBlock>

      <MoreDepth>
        <p>
          kNN suffers from the <strong>curse of dimensionality</strong>: in high
          dimensions, distances concentrate &mdash; the nearest and farthest
          points become almost equidistant, so &quot;nearest&quot; loses meaning.
          It is also slow at inference (every prediction scans the whole training
          set), which motivates spatial indexes like KD-trees and ball-trees, and
          approximate methods like HNSW that power modern vector search.
        </p>
      </MoreDepth>

      <Quiz question="Why must features usually be standardized before applying kNN?" options={[
        { text: "Because kNN cannot handle negative numbers", why: "False; kNN works fine with negative values." },
        { text: "Because the distance metric lets large-scale features dominate the neighbor calculation", correct: true, why: "Unscaled features with big ranges overwhelm the distance, distorting which points count as nearest." },
        { text: "Because standardization speeds up the training phase", why: "kNN barely trains; standardization is about meaningful distances, not training speed." },
        { text: "Because it removes the need to choose k", why: "Scaling and choosing k are independent; you still must pick k." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="Why is k-NN called a lazy learner, and what are the practical consequences at training versus prediction time?" difficulty="easy" tag="Conceptual">
  <p>k-NN is <strong>lazy</strong> because it does no real work at training time &mdash; it simply stores the labeled training set. There is no model to fit, no parameters to estimate; the entire dataset <strong>is</strong> the model. All computation is deferred to prediction time, where for each query point it must find the nearest neighbors.</p>
  <p>Practical consequences:</p>
  <ul>
    <li><strong>Training is essentially free</strong> (just memorize), so adding new data is trivial &mdash; no retraining.</li>
    <li><strong>Prediction is expensive.</strong> A brute-force query over <M>{"n"}</M> points in <M>{"d"}</M> dimensions costs <M>{"O(nd)"}</M> per query. This is the opposite of an eager learner like logistic regression, which is slow to fit but answers queries in <M>{"O(d)"}</M>.</li>
    <li><strong>Memory-heavy:</strong> the whole training set must stay resident.</li>
    <li>Because it is <strong>non-parametric</strong>, it makes no assumption about the shape of the decision boundary and can fit highly irregular boundaries given enough data.</li>
  </ul>
  <p>In practice, prediction cost is mitigated with spatial indexes (KD-trees, ball trees) for low-to-moderate <M>{"d"}</M>, or approximate nearest-neighbor structures (HNSW, LSH) for high <M>{"d"}</M>.</p>
</InterviewProblem>
<InterviewProblem question="How does the choice of k trade off bias and variance, and how would you pick it in practice?" difficulty="medium" tag="Conceptual">
  <p>The hyperparameter <M>{"k"}</M> controls the <strong>smoothness</strong> of the decision boundary and sits squarely on the bias&ndash;variance spectrum.</p>
  <ul>
    <li><strong>Small <M>{"k"}</M> (e.g. <M>{"k=1"}</M>):</strong> low bias, high variance. The boundary is jagged and follows individual points, so a single mislabeled or noisy point can flip a prediction &mdash; classic overfitting.</li>
    <li><strong>Large <M>{"k"}</M>:</strong> high bias, low variance. Predictions average over many neighbors, smoothing the boundary. In the limit <M>{"k=n"}</M>, every query returns the global majority class &mdash; classic underfitting.</li>
  </ul>
  <p>To choose <M>{"k"}</M>, use <strong>cross-validation</strong>: sweep a grid of <M>{"k"}</M> values, measure validation error (or F1 / AUC for imbalanced data), and pick the <M>{"k"}</M> minimizing it. A common heuristic starting point is <M>{"k \\approx \\sqrt{n}"}</M>, and for binary classification an <strong>odd <M>{"k"}</M></strong> avoids tie votes.</p>
  <p>One caveat: error-versus-<M>{"k"}</M> is often U-shaped, so do not just grab the smallest training error &mdash; <M>{"k=1"}</M> has zero training error by construction (each point is its own nearest neighbor) yet generalizes poorly.</p>
</InterviewProblem>
<InterviewProblem question="A teammate runs k-NN on a dataset where one feature is salary (0-200000) and another is age (0-100), with raw Euclidean distance, and gets poor results. Diagnose and fix it." difficulty="medium" tag="Applied">
  <p>The problem is <strong>unscaled features</strong>. Euclidean distance sums squared per-feature differences:</p>
  <MB>{"d(x, q) = \\sqrt{\\sum_{j=1}^{d} (x_j - q_j)^2}"}</MB>
  <p>A salary gap of 50,000 contributes <M>{"50000^2"}</M> to the sum, while an age gap of 50 contributes only <M>{"50^2"}</M>. Salary differences are about a million times larger in squared terms, so distance is <strong>completely dominated by salary</strong> and age is effectively ignored. The &quot;nearest&quot; neighbors are just whoever has the closest salary.</p>
  <p><strong>Fix:</strong> put features on a comparable scale before computing distance. Two standard options:</p>
  <ul>
    <li><strong>Standardization</strong> (z-score): <M>{"x_j' = (x_j - \\mu_j) / \\sigma_j"}</M> &mdash; each feature has mean 0, variance 1.</li>
    <li><strong>Min&ndash;max scaling:</strong> <M>{"x_j' = (x_j - \\min_j) / (\\max_j - \\min_j)"}</M> &mdash; each feature in <M>{"[0,1]"}</M>.</li>
  </ul>
  <p>Critically, fit the scaler on the <strong>training fold only</strong> and apply the same parameters to validation/test to avoid leakage. The clean way is a pipeline:</p>
  <CodeBlock language="python" filename="scaled_knn.py">{`from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import cross_val_score

# Scaler is fit only on training folds inside CV -> no leakage
pipe = Pipeline([
    ("scale", StandardScaler()),
    ("knn", KNeighborsClassifier(n_neighbors=15)),
])

scores = cross_val_score(pipe, X, y, cv=5, scoring="f1_macro")
print("CV F1:", scores.mean())`}</CodeBlock>
  <p>If some features genuinely matter more, scaling plus learned per-feature weights (or a distance-weighted vote) generalizes this idea.</p>
</InterviewProblem>
<InterviewProblem question="Explain the curse of dimensionality and why it breaks k-NN. Sketch the intuition with the volume-of-a-shell argument." difficulty="hard" tag="Math">
  <p>k-NN assumes that points close in feature space have similar labels. In <strong>high dimensions, the notion of &quot;close&quot; collapses</strong>: distances between points become nearly identical, so the nearest neighbor is barely nearer than the farthest, and neighbor-based prediction degrades to noise.</p>
  <p><strong>Concentration of distances.</strong> For many distributions, as <M>{"d \\to \\infty"}</M> the ratio of nearest to farthest distance from a query tends to 1:</p>
  <MB>{"\\lim_{d \\to \\infty} \\frac{\\operatorname{dist}_{\\max} - \\operatorname{dist}_{\\min}}{\\operatorname{dist}_{\\min}} \\to 0"}</MB>
  <p>so all points sit at roughly the same distance and &quot;nearest&quot; loses meaning.</p>
  <p><strong>Volume-of-a-shell intuition.</strong> Consider a unit hypercube in <M>{"d"}</M> dimensions and ask what fraction of its volume lies in a thin outer shell of width <M>{"\\epsilon"}</M> on each side. The interior is a cube of side <M>{"1 - 2\\epsilon"}</M>, so</p>
  <MB>{"\\frac{V_{\\text{shell}}}{V_{\\text{cube}}} = 1 - (1 - 2\\epsilon)^d"}</MB>
  <p>For <M>{"\\epsilon = 0.01"}</M> and <M>{"d = 200"}</M>, the interior fraction is <M>{"(0.98)^{200} \\approx 0.018"}</M>, so over <strong>98% of the volume is in the outer shell</strong>. Almost every point is near a boundary, and the data is extremely sparse &mdash; to keep a fixed local density you would need exponentially more samples in <M>{"d"}</M>.</p>
  <p><strong>Fixes:</strong> reduce effective dimension (PCA, feature selection, or a learned embedding), use a metric learned for the task (e.g. Mahalanobis / LMNN), or switch to a model less reliant on raw local geometry. Approximate-NN indexes speed up search but do <strong>not</strong> cure the statistical degradation &mdash; that requires fewer, more informative dimensions.</p>
</InterviewProblem>

      </>
  );
}
