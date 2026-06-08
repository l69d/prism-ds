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
      <p>A Support Vector Machine (SVM) draws the decision boundary that keeps the widest possible buffer between classes, and a clever trick lets it bend that boundary into curves without ever leaving linear algebra.</p>

      <KeyIdea>Of all the lines that separate two classes, the best one sits as far as possible from the closest points of either side. Those closest points &mdash; the support vectors &mdash; are the only data that actually defines the boundary.</KeyIdea>

      <h2>The margin</h2>
      <p>Many lines can split two clouds of points. An SVM picks the one that maximizes the <strong>margin</strong>: the perpendicular gap to the nearest point on each side. A wide margin generalizes better because small perturbations to new points are less likely to flip their predicted label.</p>
      <ul>
        <li><strong>Support vectors</strong>: the handful of points sitting exactly on the margin&apos;s edge. Move any other point and the boundary does not budge.</li>
        <li><strong>Soft margin</strong>: real data overlaps, so a penalty <M>{"C"}</M> lets some points violate the margin in exchange for a wider, more stable boundary.</li>
      </ul>

      <h2>The kernel trick</h2>
      <p>When classes are not linearly separable, SVMs map data into a higher-dimensional space where a flat boundary <em>does</em> exist. The trick: you never compute that mapping explicitly &mdash; you only need inner products between points, which a <strong>kernel function</strong> supplies directly.</p>

      <Basic>
        <p>Imagine red dots in a ring around blue dots on a flat table &mdash; no straight line separates them. Now lift the inner blue dots upward, like pushing the center of a trampoline. From the side, a flat sheet of glass can now slice blue from red. The kernel is the rule for how high to lift each point, and the SVM finds the slicing plane &mdash; all without you ever drawing the 3D picture.</p>
      </Basic>

      <Advanced>
        <p>The hard-margin primal problem minimizes the norm of the weight vector subject to correct classification with margin:</p>
        <MB>{"\\min_{\\mathbf{w}, b} \\tfrac{1}{2}\\lVert \\mathbf{w} \\rVert^2 \\quad \\text{s.t.} \\quad y_i(\\mathbf{w}^\\top \\mathbf{x}_i + b) \\ge 1"}</MB>
        <p>Its dual depends on data only through inner products, which we replace with a kernel <M>{"K(\\mathbf{x}_i, \\mathbf{x}_j) = \\langle \\phi(\\mathbf{x}_i), \\phi(\\mathbf{x}_j) \\rangle"}</M>:</p>
        <MB>{"\\max_{\\alpha} \\sum_i \\alpha_i - \\tfrac{1}{2}\\sum_{i,j} \\alpha_i \\alpha_j y_i y_j K(\\mathbf{x}_i, \\mathbf{x}_j), \\quad 0 \\le \\alpha_i \\le C"}</MB>
        <p>Only support vectors have <M>{"\\alpha_i > 0"}</M>. The popular RBF kernel <M>{"K(\\mathbf{x}, \\mathbf{z}) = \\exp(-\\gamma \\lVert \\mathbf{x} - \\mathbf{z} \\rVert^2)"}</M> corresponds to an infinite-dimensional feature map.</p>
      </Advanced>

      <Callout kind="pitfall" title="Scale your features first">
        SVMs measure distances, so a feature on the scale of thousands will dominate one ranging zero to one. Always standardize inputs before fitting, especially with the RBF kernel where <M>{"\\gamma"}</M> assumes comparable spreads across dimensions.
      </Callout>

      <CodeBlock language="python" filename="svm.py">{`from sklearn.svm import SVC
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

# RBF kernel SVM with scaling baked into the pipeline
clf = make_pipeline(
    StandardScaler(),
    SVC(kernel="rbf", C=1.0, gamma="scale"),
)
clf.fit(X_train, y_train)

# Lower C -> wider margin, more tolerance for violations
# Higher gamma -> tighter, wigglier boundary (risk of overfit)
print("accuracy:", clf.score(X_test, y_test))`}</CodeBlock>

      <MoreDepth>
        <p>SVMs scale poorly with sample size: kernel methods are roughly <M>{"O(n^2)"}</M> to <M>{"O(n^3)"}</M> in training because the kernel matrix is <M>{"n \\times n"}</M>. Beyond ~100k rows, prefer a linear SVM (LinearSVC) with explicit features, or approximate the kernel with random Fourier features so a fast linear solver can take over. The penalty <M>{"C"}</M> and kernel width <M>{"\\gamma"}</M> interact strongly, so tune them jointly on a log-spaced grid rather than one at a time.</p>
      </MoreDepth>

      <Quiz question="Why is the kernel trick computationally appealing?" options={[
        { text: "It deletes non-support-vector points to shrink the dataset before training", why: "Support vectors are an outcome of optimization, not a preprocessing step, and the kernel trick is about avoiding explicit feature maps." },
        { text: "It computes inner products in a high-dimensional space without ever forming the mapped coordinates", correct: true, why: "Kernels return the inner product directly, so you get a nonlinear boundary while the math stays in terms of the original points." },
        { text: "It guarantees the data becomes perfectly linearly separable in every case", why: "No kernel guarantees separability; soft margins exist precisely because overlap remains." },
        { text: "It replaces gradient descent with a closed-form matrix inverse", why: "SVM training solves a constrained quadratic program; the kernel trick concerns feature spaces, not the solver type." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="What does 'maximum margin' mean in an SVM, and why does maximizing the margin help generalization?" difficulty="easy" tag="Conceptual">
  <p>For a linearly separable dataset there are infinitely many hyperplanes that perfectly split the two classes. An SVM picks the one that maximizes the <strong>margin</strong>: the distance from the decision boundary to the nearest training point of either class.</p>
  <p>With the boundary written as <M>{"w^\\top x + b = 0"}</M> and labels <M>{"y_i \\in \\{-1, +1\\}"}</M>, the geometric margin of the closest points is <M>{"1/\\lVert w \\rVert"}</M>, so maximizing the margin is the same as minimizing <M>{"\\tfrac{1}{2}\\lVert w \\rVert^2"}</M>.</p>
  <p>Why it helps generalization:</p>
  <ul>
    <li>A wide margin leaves the most &quot;wiggle room&quot;: small perturbations of a test point are unlikely to flip its predicted side, so the classifier is robust.</li>
    <li>It is a form of capacity control. The set of large-margin separators is smaller (lower effective complexity / VC dimension grows with <M>{"1/\\text{margin}^2"}</M>, not with the number of features), which bounds the gap between training and test error.</li>
    <li>The solution depends only on the <strong>support vectors</strong> (points on the margin), so it is insensitive to the bulk of the data sitting far from the boundary.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="Explain the role of the C hyperparameter in a soft-margin SVM. What happens at the two extremes, and how does it relate to the bias-variance tradeoff?" difficulty="medium" tag="Conceptual">
  <p>Real data is rarely perfectly separable, so the soft-margin SVM introduces slack variables <M>{"\\xi_i \\ge 0"}</M> that allow margin violations, and solves:</p>
  <MB>{"\\min_{w,b,\\xi}\\ \\tfrac{1}{2}\\lVert w \\rVert^2 + C \\sum_{i=1}^{n} \\xi_i \\quad \\text{s.t.}\\quad y_i(w^\\top x_i + b) \\ge 1 - \\xi_i,\\ \\xi_i \\ge 0"}</MB>
  <p>The constant <M>{"C"}</M> is the penalty per unit of margin violation, trading off margin width against training mistakes:</p>
  <ul>
    <li><strong>Large C:</strong> violations are expensive, so the optimizer prefers a narrow margin that fits the training data tightly. This is low bias, high variance, and prone to overfitting (in the limit <M>{"C \\to \\infty"}</M> you recover the hard-margin SVM, which fails entirely if the data is not separable).</li>
    <li><strong>Small C:</strong> violations are cheap, so the optimizer accepts more misclassified or in-margin points to keep <M>{"\\lVert w \\rVert"}</M> small and the margin wide. This is high bias, low variance, and can underfit.</li>
  </ul>
  <p>So <M>{"C"}</M> is the inverse of regularization strength. Choose it by cross-validation, typically over a log-spaced grid, jointly with the kernel parameters.</p>
</InterviewProblem>
<InterviewProblem question="What is the kernel trick, and why can an SVM use an infinite-dimensional feature space without ever computing the features explicitly?" difficulty="hard" tag="Math">
  <p>Solving the SVM in its <strong>dual</strong> form, the data enters only through inner products. The dual objective is:</p>
  <MB>{"\\max_{\\alpha}\\ \\sum_i \\alpha_i - \\tfrac{1}{2}\\sum_{i,j} \\alpha_i \\alpha_j\\, y_i y_j\\, (x_i^\\top x_j) \\quad \\text{s.t.}\\quad 0 \\le \\alpha_i \\le C,\\ \\sum_i \\alpha_i y_i = 0"}</MB>
  <p>To learn a nonlinear boundary we map inputs through a feature map <M>{"\\phi(x)"}</M> and replace <M>{"x_i^\\top x_j"}</M> with <M>{"\\phi(x_i)^\\top \\phi(x_j)"}</M>. The <strong>kernel trick</strong> is the observation that we never need <M>{"\\phi"}</M> itself, only the kernel function:</p>
  <MB>{"K(x_i, x_j) = \\phi(x_i)^\\top \\phi(x_j)"}</MB>
  <p>Any function <M>{"K"}</M> that is symmetric and positive semidefinite (Mercer&apos;s condition) corresponds to an inner product in <strong>some</strong> feature space, so we can plug it straight into the dual. Prediction also uses kernels only: <M>{"f(x) = \\operatorname{sign}\\!\\big(\\sum_i \\alpha_i y_i K(x_i, x) + b\\big)"}</M>, summed over the support vectors.</p>
  <p>The RBF (Gaussian) kernel <M>{"K(x, x') = \\exp(-\\gamma \\lVert x - x' \\rVert^2)"}</M> is the classic example: its implicit <M>{"\\phi"}</M> is infinite-dimensional (a Taylor expansion of the exponential gives terms of every degree), yet each kernel evaluation is just a distance and an exponential, computed in the original input dimension. Here <M>{"\\gamma"}</M> controls reach: large <M>{"\\gamma"}</M> means each point influences only a tiny neighborhood, giving very wiggly boundaries that overfit; small <M>{"\\gamma"}</M> gives smooth, near-linear boundaries.</p>
</InterviewProblem>
<InterviewProblem question="You are given a dataset with ~500,000 rows and 2,000 features (text TF-IDF vectors) for a binary classification task. A colleague suggests an RBF-kernel SVM. What concerns would you raise, and what would you do instead?" difficulty="medium" tag="Applied">
  <p>Two practical concerns dominate here:</p>
  <ul>
    <li><strong>Scaling.</strong> Kernel SVM training is roughly <M>{"O(n^2)"}</M> to <M>{"O(n^3)"}</M> in the number of samples because the kernel matrix is <M>{"n \\times n"}</M>. At <M>{"n = 5\\times 10^5"}</M> that matrix has <M>{"2.5 \\times 10^{11}"}</M> entries; it will not fit in memory and will not finish training in reasonable time.</li>
    <li><strong>Geometry of the data.</strong> High-dimensional sparse TF-IDF vectors are usually close to linearly separable already. The RBF kernel&apos;s extra capacity buys little and mainly adds overfitting risk and two hyperparameters (<M>{"C, \\gamma"}</M>) to tune.</li>
  </ul>
  <p>What I would do:</p>
  <ul>
    <li>Use a <strong>linear SVM</strong> via LIBLINEAR (scikit-learn&apos;s <strong>LinearSVC</strong>) or <strong>SGDClassifier</strong> with hinge loss. These train in time roughly linear in the number of nonzeros and handle sparse matrices natively, so 500k x 2k is routine.</li>
    <li>If a nonlinear boundary genuinely helps (validate this), approximate the RBF feature map with random Fourier features (Nystrom / RBFSampler) and feed the resulting explicit features to a linear model, keeping the linear-time scaling.</li>
    <li>Standardize or L2-normalize features, tune <M>{"C"}</M> by cross-validation, and because SVM scores are not probabilities, calibrate (Platt scaling or isotonic) if you need probabilities.</li>
  </ul>
  <CodeBlock language="python" filename="linear_svm.py">{`from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import GridSearchCV

# X is a sparse CSR matrix (500k x 2000), y is binary
base = LinearSVC(loss="squared_hinge", dual=False)  # dual=False: n_samples > n_features

grid = GridSearchCV(
    base,
    param_grid={"C": [0.01, 0.1, 1.0, 10.0]},
    scoring="f1",
    cv=5,
    n_jobs=-1,
)
grid.fit(X, y)

# wrap the tuned linear SVM to get calibrated probabilities
clf = CalibratedClassifierCV(grid.best_estimator_, method="sigmoid", cv=5)
clf.fit(X, y)
proba = clf.predict_proba(X)[:, 1]`}</CodeBlock>
</InterviewProblem>

      </>
  );
}
