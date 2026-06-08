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
    </>
  );
}
