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
    </>
  );
}
