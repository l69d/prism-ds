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
      <p>A matrix is a transformation of space. A decomposition rewrites that transformation as a product of simpler, more revealing pieces &mdash; rotations, stretches, and reflections you can read off directly.</p>

      <KeyIdea>Every matrix factorization answers one question: along which directions does this transformation act <strong>simplest</strong>? Eigenvectors and singular vectors are exactly those directions, and the eigenvalues or singular values tell you how much it stretches along each.</KeyIdea>

      <h2>Eigenvectors: directions that don&apos;t turn</h2>
      <p>An eigenvector of a square matrix <M>{"A"}</M> is a direction that <M>{"A"}</M> only scales &mdash; it never rotates it. The scale factor is the eigenvalue.</p>
      <ul>
        <li><strong>Big eigenvalue:</strong> that direction is amplified.</li>
        <li><strong>Eigenvalue near zero:</strong> that direction is crushed flat (information lost).</li>
        <li><strong>Negative eigenvalue:</strong> the direction is flipped.</li>
      </ul>

      <h2>SVD: the universal decomposition</h2>
      <p>The Singular Value Decomposition works for <em>any</em> matrix, even non-square ones. It says any linear map is a rotation, then an axis-aligned stretch, then another rotation. The stretch amounts are the singular values, ordered largest first.</p>

      <Basic>
        <p>Picture data as a cloud of points. SVD finds the longest axis of the cloud, then the next-longest perpendicular axis, and so on. Keeping only the first few axes gives you a faithful low-dimensional sketch &mdash; that is exactly what PCA does. Recommender systems use the same trick: a giant, mostly-empty user-by-movie ratings table is approximated by a handful of hidden &quot;taste&quot; factors, so you can fill in the blanks and predict ratings.</p>
      </Basic>

      <Advanced>
        <p>For symmetric <M>{"A"}</M>, the spectral theorem gives an orthogonal eigendecomposition:</p>
        <MB>{"A = Q \\Lambda Q^{\\top}, \\quad Q^{\\top}Q = I"}</MB>
        <p>For a general <M>{"m \\times n"}</M> matrix the SVD is:</p>
        <MB>{"A = U \\Sigma V^{\\top}, \\quad \\sigma_1 \\geq \\sigma_2 \\geq \\cdots \\geq 0"}</MB>
        <p>The columns of <M>{"V"}</M> are eigenvectors of <M>{"A^{\\top}A"}</M>, the columns of <M>{"U"}</M> are eigenvectors of <M>{"AA^{\\top}"}</M>, and <M>{"\\sigma_i = \\sqrt{\\lambda_i}"}</M>. Truncating to the top <M>{"k"}</M> singular triplets gives the best rank-<M>{"k"}</M> approximation in Frobenius and spectral norm (Eckart&ndash;Young theorem).</p>
      </Advanced>

      <Callout kind="insight" title="PCA is just SVD on centered data">
        Subtract the column means, run SVD, and the right singular vectors are your principal components while the squared singular values are proportional to the variance each captures. No separate algorithm needed.
      </Callout>

      <CodeBlock language="python" filename="svd_pca.py">{`import numpy as np

# 200 points in 5D living mostly on a 2D plane
X = np.random.randn(200, 2) @ np.random.randn(2, 5)
Xc = X - X.mean(axis=0)            # center the data

U, s, Vt = np.linalg.svd(Xc, full_matrices=False)
var_explained = s**2 / np.sum(s**2)
print(np.round(var_explained, 3))  # ~[0.7, 0.3, 0.0, 0.0, 0.0]

# project onto top-2 principal components
X_2d = U[:, :2] * s[:2]
print(X_2d.shape)                  # (200, 2)`}</CodeBlock>

      <MoreDepth>
        <p>Never compute PCA by forming the covariance matrix <M>{"A^{\\top}A"}</M> and eigendecomposing it. Squaring the data squares the condition number, so tiny singular values get swamped by floating-point error. SVD on the data matrix directly is numerically stable and is what every production library uses. For huge sparse matrices (recommenders), you don&apos;t even materialize the full factors &mdash; randomized or truncated SVD computes only the top <M>{"k"}</M> components.</p>
      </MoreDepth>

      <Quiz question="Why does PCA use SVD on the centered data matrix rather than eigendecomposing the covariance matrix directly?" options={[
        { text: "SVD is the only method that can find eigenvectors", why: "Eigendecomposition also finds them; SVD is preferred for numerical reasons, not exclusivity." },
        { text: "Forming the covariance matrix squares the condition number and amplifies rounding error, while SVD on the data is numerically stable", correct: true, why: "Squaring data via A^T A worsens conditioning; direct SVD avoids that loss of precision." },
        { text: "SVD does not require the data to be centered", why: "PCA still centers the data before SVD; the right singular vectors equal principal components only after centering." },
        { text: "The covariance matrix has no eigenvectors when data is high-dimensional", why: "A covariance matrix is symmetric PSD and always has a full set of real eigenvectors." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="What is the relationship between the SVD of a matrix and the eigendecomposition of its covariance matrix, and why does that make SVD the engine behind PCA?" difficulty="medium" tag="Conceptual">
  <p>Take a centered data matrix <M>{"X \\in \\mathbb{R}^{n \\times d}"}</M> (rows are samples, columns are features, column means subtracted). Its thin SVD is:</p>
  <MB>{"X = U \\Sigma V^{\\top}"}</MB>
  <p>where <M>{"U"}</M> and <M>{"V"}</M> have orthonormal columns and <M>{"\\Sigma"}</M> is diagonal with the singular values <M>{"\\sigma_i \\ge 0"}</M>. Now look at the (scaled) covariance matrix:</p>
  <MB>{"\\tfrac{1}{n} X^{\\top} X = \\tfrac{1}{n} V \\Sigma U^{\\top} U \\Sigma V^{\\top} = V \\left(\\tfrac{\\Sigma^2}{n}\\right) V^{\\top}"}</MB>
  <p>This is exactly the eigendecomposition of the covariance matrix. The takeaways:</p>
  <ul>
    <li>The <strong>right singular vectors</strong> <M>{"V"}</M> are the principal directions (eigenvectors of the covariance).</li>
    <li>The eigenvalues are <M>{"\\lambda_i = \\sigma_i^2 / n"}</M>, so the variance explained by component <M>{"i"}</M> is <M>{"\\sigma_i^2"}</M> up to scaling.</li>
    <li>The projection of the data onto the principal axes (the PCA scores) is <M>{"XV = U\\Sigma"}</M>.</li>
  </ul>
  <p>Why use SVD instead of forming <M>{"X^{\\top}X"}</M>? Numerical stability. Forming the covariance squares the condition number, which amplifies floating-point error and can lose the small singular values entirely. Running SVD directly on <M>{"X"}</M> avoids that, which is why every serious PCA implementation calls an SVD routine under the hood.</p>
</InterviewProblem>
<InterviewProblem question="Which matrices are guaranteed to have a real eigendecomposition with orthogonal eigenvectors, and how does the spectral theorem connect to SVD?" difficulty="easy" tag="Conceptual">
  <p>A real <strong>symmetric</strong> matrix <M>{"A = A^{\\top}"}</M> is guaranteed to have real eigenvalues and a full set of mutually orthogonal eigenvectors. The spectral theorem gives:</p>
  <MB>{"A = Q \\Lambda Q^{\\top}, \\qquad Q^{\\top}Q = I"}</MB>
  <p>where <M>{"Q"}</M> holds orthonormal eigenvectors and <M>{"\\Lambda"}</M> is diagonal with the real eigenvalues. General non-symmetric matrices can have complex eigenvalues, non-orthogonal eigenvectors, or be defective (not diagonalizable at all).</p>
  <p>The link to SVD: every matrix has an SVD, even rectangular or defective ones, because the SVD is really the eigendecomposition of the symmetric matrices <M>{"A^{\\top}A"}</M> and <M>{"AA^{\\top}"}</M>. So SVD is the universal generalization of the spectral theorem to arbitrary matrices. A useful special case: if <M>{"A"}</M> is symmetric positive semidefinite, its SVD and eigendecomposition coincide, with <M>{"\\sigma_i = \\lambda_i"}</M>.</p>
</InterviewProblem>
<InterviewProblem question="Explain how a recommender system uses low-rank matrix factorization to predict ratings, and why truncating the SVD is the right move." difficulty="hard" tag="Applied">
  <p>The setup: a sparse ratings matrix <M>{"R \\in \\mathbb{R}^{m \\times n}"}</M> with <M>{"m"}</M> users, <M>{"n"}</M> items, and most entries missing. The model assumes the true ratings are approximately <strong>low rank</strong>: a small number <M>{"k"}</M> of latent factors (genre taste, price sensitivity, etc.) explains most of the structure. We seek:</p>
  <MB>{"R \\approx P Q^{\\top}, \\qquad P \\in \\mathbb{R}^{m \\times k}, \; Q \\in \\mathbb{R}^{n \\times k}"}</MB>
  <p>Row <M>{"p_u"}</M> is the user&apos;s factor vector, row <M>{"q_i"}</M> is the item&apos;s, and the predicted rating is the dot product <M>{"\\hat{r}_{ui} = p_u^{\\top} q_i"}</M>.</p>
  <p>Why truncate? The Eckart-Young theorem says the best rank-<M>{"k"}</M> approximation in Frobenius (or spectral) norm is exactly the truncated SVD: keep the top <M>{"k"}</M> singular values and zero the rest.</p>
  <MB>{"R_k = \\sum_{i=1}^{k} \\sigma_i u_i v_i^{\\top} = \\arg\\min_{\\operatorname{rank}(B) \\le k} \\lVert R - B \\rVert_F"}</MB>
  <p>The small singular values mostly capture noise and idiosyncratic ratings; discarding them denoises the matrix and forces the model to generalize. Practical caveats interviewers want to hear:</p>
  <ul>
    <li>Plain SVD assumes a dense matrix, but <M>{"R"}</M> is mostly missing. In practice you minimize squared error <strong>over observed entries only</strong> with regularization, solved by ALS or SGD &mdash; not by calling a dense SVD on a zero-filled matrix, which would treat missing as a real rating of zero.</li>
    <li>Choose <M>{"k"}</M> by cross-validation; too large overfits, too small underfits.</li>
    <li>Add per-user and per-item bias terms, since some users rate generously and some items are universally liked.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="Given a small symmetric 2x2 matrix, find its eigenvalues by hand, then verify the leading eigenvector with a few lines of code." difficulty="medium" tag="Math">
  <p>Take <M>{"A = \\begin{pmatrix} 2 & 1 \\\\ 1 & 2 \\end{pmatrix}"}</M>. Solve the characteristic equation <M>{"\\det(A - \\lambda I) = 0"}</M>:</p>
  <MB>{"\\det \\begin{pmatrix} 2-\\lambda & 1 \\\\ 1 & 2-\\lambda \\end{pmatrix} = (2-\\lambda)^2 - 1 = 0"}</MB>
  <p>So <M>{"(2-\\lambda)^2 = 1"}</M>, giving <M>{"\\lambda = 3"}</M> and <M>{"\\lambda = 1"}</M>. For <M>{"\\lambda = 3"}</M>, solve <M>{"(A - 3I)v = 0"}</M>, i.e. <M>{"-v_1 + v_2 = 0"}</M>, so the eigenvector points along <M>{"(1, 1)"}</M>. For <M>{"\\lambda = 1"}</M> the eigenvector is <M>{"(1, -1)"}</M> &mdash; orthogonal, as the spectral theorem promises. Quick sanity checks: the trace <M>{"2+2 = 4"}</M> equals <M>{"\\lambda_1 + \\lambda_2 = 3 + 1"}</M>, and the determinant <M>{"4 - 1 = 3"}</M> equals <M>{"\\lambda_1 \\lambda_2 = 3"}</M>. Verify in code:</p>
  <CodeBlock language="python" filename="eig_check.py">{`import numpy as np

A = np.array([[2.0, 1.0],
              [1.0, 2.0]])

vals, vecs = np.linalg.eigh(A)   # eigh: symmetric/Hermitian solver
print("eigenvalues:", vals)       # [1. 3.]

# leading eigenvector (largest eigenvalue) is the last column from eigh
lead = vecs[:, np.argmax(vals)]
lead = lead / lead[0]            # normalize so first entry is 1
print("leading eigenvector ~", lead)   # [1. 1.]

# verify A v = lambda v
v = np.array([1.0, 1.0])
print("A v =", A @ v, " vs 3 v =", 3 * v)`}</CodeBlock>
  <p>Note the use of <M>{"\\texttt{eigh}"}</M> rather than the general <M>{"\\texttt{eig}"}</M>: for symmetric matrices it is faster, returns real sorted eigenvalues, and guarantees orthonormal eigenvectors.</p>
</InterviewProblem>

      </>
  );
}
