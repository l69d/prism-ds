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
      <p>Almost every model you will ever train speaks linear algebra. A data point is a vector, a dataset is a matrix, and a model layer is a transformation that bends one space into another.</p>

      <KeyIdea>A vector is a list of numbers that also points somewhere; a matrix is a machine that takes vectors in and sends transformed vectors out. Master those two ideas and most of machine learning stops looking like magic.</KeyIdea>

      <h2>Vectors and the dot product</h2>
      <p>A feature vector packs one observation into an ordered list, such as <M>{"\\mathbf{x} = [\\text{age}, \\text{income}, \\text{clicks}]"}</M>. The <strong>dot product</strong> measures how aligned two vectors are:</p>
      <ul>
        <li><strong>Large positive</strong>: the vectors point the same way (similar).</li>
        <li><strong>Zero</strong>: they are orthogonal (no shared direction).</li>
        <li><strong>Negative</strong>: they point opposite ways.</li>
      </ul>
      <p>This single operation powers linear models, cosine similarity in search, and attention scores in transformers.</p>

      <h2>Matrices as transformations</h2>
      <p>Multiplying a vector by a matrix rotates, scales, shears, or projects it into a new space. A neural network layer is exactly this: <M>{"\\mathbf{z} = W\\mathbf{x} + \\mathbf{b}"}</M>, where <M>{"W"}</M> reshapes the input before a nonlinearity is applied.</p>

      <Basic>
        <p>Think of a vector as an arrow on a grid. The dot product asks &quot;how much of one arrow lies along the other?&quot; If two arrows point the same direction, their dot product is big; if they are at right angles, it is zero. A matrix is like a recipe that stretches and tilts the whole grid at once, dragging every arrow to a new spot in a consistent way.</p>
      </Basic>

      <Advanced>
        <p>The dot product of two vectors in <M>{"\\mathbb{R}^n"}</M> is</p>
        <MB>{"\\mathbf{a} \\cdot \\mathbf{b} = \\sum_{i=1}^{n} a_i b_i = \\|\\mathbf{a}\\|\\,\\|\\mathbf{b}\\|\\cos\\theta"}</MB>
        <p>so it bundles together magnitude and the angle <M>{"\\theta"}</M> between the vectors. A matrix <M>{"W \\in \\mathbb{R}^{m \\times n}"}</M> defines a linear map <M>{"\\mathbb{R}^n \\to \\mathbb{R}^m"}</M>; its action is fully described by how it transforms basis vectors. The eigenvectors of a square <M>{"W"}</M> are the special directions left unrotated, scaled only by their eigenvalues <M>{"\\lambda"}</M>, satisfying <M>{"W\\mathbf{v} = \\lambda\\mathbf{v}"}</M> — the backbone of PCA and spectral methods.</p>
      </Advanced>

      <Callout kind="insight" title="Why ML loves matrices">
        Batching turns slow per-sample loops into one big matrix multiply. Stacking N feature vectors into a matrix lets a single <M>{"XW"}</M> compute all N predictions at once, which is why GPUs (built for dense linear algebra) made deep learning practical.
      </Callout>

      <CodeBlock language="python" filename="linalg.py">{`import numpy as np

# A dataset: 3 samples, 2 features each
X = np.array([[1.0, 2.0],
              [3.0, 4.0],
              [5.0, 6.0]])

# Model weights for a 2 -> 1 linear layer
w = np.array([0.5, -1.0])
b = 0.1

# Dot product per row == predictions for all samples at once
preds = X @ w + b          # shape (3,)
print(preds)               # [-1.4 -2.4 -3.4]

# Cosine similarity between two feature vectors
a, c = X[0], X[2]
cos = (a @ c) / (np.linalg.norm(a) * np.linalg.norm(c))
print(round(cos, 4))       # 0.9762  -> nearly aligned`}</CodeBlock>

      <MoreDepth>
        <p>Shapes are where real bugs hide. <M>{"X \\in \\mathbb{R}^{N \\times d}"}</M> times <M>{"W \\in \\mathbb{R}^{d \\times k}"}</M> gives <M>{"\\mathbb{R}^{N \\times k}"}</M> — the inner dimensions must match and the outer ones survive. Also watch numerical conditioning: when columns of a feature matrix are nearly collinear, the matrix is ill-conditioned, so inverting it (as in the normal equations for least squares) amplifies tiny errors. That is why practitioners reach for QR or SVD-based solvers and for regularization instead of forming <M>{"(X^\\top X)^{-1}"}</M> directly.</p>
      </MoreDepth>

      <Quiz question="What does a dot product of zero between two nonzero feature vectors tell you?" options={[
        { text: "The vectors are identical", why: "Identical vectors have a large positive dot product equal to the squared norm, not zero." },
        { text: "The vectors are orthogonal — they share no common direction", correct: true, why: "A zero dot product means cos(theta) = 0, so the angle is 90 degrees and the vectors carry no overlapping component." },
        { text: "The vectors point in exactly opposite directions", why: "Opposite vectors give a negative dot product, not zero." },
        { text: "One of the vectors must be the zero vector", why: "The premise says both are nonzero; orthogonal nonzero vectors also give zero." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="What does the dot product of two vectors tell you, and why is it everywhere in ML?" difficulty="easy" tag="Conceptual">
  <p>The dot product <M>{"a \\cdot b = \\sum_i a_i b_i = \\|a\\|\\,\\|b\\|\\cos\\theta"}</M> measures <strong>alignment</strong> between two vectors scaled by their magnitudes.</p>
  <ul>
    <li><strong>Sign tells direction:</strong> positive means the vectors point the same general way, zero means orthogonal, negative means opposing.</li>
    <li><strong>Projection:</strong> <M>{"a \\cdot \\hat{b}"}</M> is how much of <M>{"a"}</M> lies along the unit vector <M>{"\\hat{b}"}</M>.</li>
    <li><strong>Why ML cares:</strong> a linear model&apos;s score is exactly a dot product, <M>{"\\hat{y} = w \\cdot x + b"}</M> — the weight vector is a direction and the prediction is the input&apos;s projection onto it. Cosine similarity, attention scores (<M>{"q \\cdot k"}</M>), and kernel methods are all dot products in disguise.</li>
  </ul>
  <p>Normalizing first (cosine similarity) strips out magnitude so you compare only orientation — useful when document length or feature scale should not dominate.</p>
</InterviewProblem>
<InterviewProblem question="A colleague says matrix multiplication is just a grid of numbers. Reframe it as a transformation and explain what eigenvectors mean in that view." difficulty="medium" tag="Conceptual">
  <p>A matrix <M>{"A"}</M> is a <strong>linear map</strong>: feeding it a vector <M>{"x"}</M> returns <M>{"Ax"}</M>, a rotated, scaled, and/or sheared version of <M>{"x"}</M>. The columns of <M>{"A"}</M> are just the images of the standard basis vectors, so <M>{"Ax"}</M> is a weighted combination of those columns. &quot;Grid of numbers&quot; is the bookkeeping; &quot;transformation&quot; is the meaning.</p>
  <p>An <strong>eigenvector</strong> is a special direction the transformation does not rotate — it only stretches it:</p>
  <MB>{"A v = \\lambda v"}</MB>
  <p>The eigenvalue <M>{"\\lambda"}</M> is the stretch factor along that axis. Eigenvectors are the &quot;natural axes&quot; of the map.</p>
  <ul>
    <li><strong>PCA:</strong> the eigenvectors of the covariance matrix are the directions of maximum variance; their eigenvalues are how much variance each captures.</li>
    <li><strong>Stability / dynamics:</strong> repeatedly applying <M>{"A"}</M> grows directions with <M>{"|\\lambda| > 1"}</M> and shrinks those with <M>{"|\\lambda| < 1"}</M> — this governs power iteration, PageRank, and gradient-descent convergence.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="You have a design matrix X (n samples by d features). Explain what X-transpose-X represents, why it appears in the normal equations, and when it becomes problematic." difficulty="hard" tag="Math">
  <p>For ordinary least squares we minimize <M>{"\\|Xw - y\\|^2"}</M>. Setting the gradient to zero gives the <strong>normal equations</strong>:</p>
  <MB>{"X^\\top X\\, w = X^\\top y \\quad\\Rightarrow\\quad w = (X^\\top X)^{-1} X^\\top y"}</MB>
  <p>The <M>{"d \\times d"}</M> matrix <M>{"X^\\top X"}</M> is (up to a scale) the <strong>uncentered covariance / Gram matrix of the features</strong>: entry <M>{"(i,j)"}</M> is the dot product of feature columns <M>{"i"}</M> and <M>{"j"}</M>, so its diagonal holds feature energies and its off-diagonals hold feature correlations.</p>
  <p>It becomes problematic when features are <strong>collinear</strong>:</p>
  <ul>
    <li>If two columns are nearly linearly dependent, <M>{"X^\\top X"}</M> is near-singular — its smallest eigenvalue approaches zero, the condition number blows up, and the inverse amplifies noise into wildly unstable, high-variance weights.</li>
    <li>If <M>{"d > n"}</M>, the matrix is rank-deficient and <strong>not invertible at all</strong>.</li>
  </ul>
  <p>Fixes: ridge regression adds <M>{"\\lambda I"}</M> to get <M>{"(X^\\top X + \\lambda I)^{-1}"}</M>, lifting every eigenvalue by <M>{"\\lambda"}</M> so the matrix is always invertible and conditioning improves. In practice you also avoid forming the inverse and solve via QR or SVD for numerical stability.</p>
</InterviewProblem>
<InterviewProblem question="Implement cosine similarity between two vectors from scratch with NumPy, and explain one numerical edge case to guard against." difficulty="medium" tag="Coding">
  <p>Cosine similarity is the dot product of the L2-normalized vectors:</p>
  <CodeBlock language="python" filename="cosine.py">{`import numpy as np

def cosine_similarity(a, b, eps=1e-8):
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    # guard against a zero-magnitude vector -> division by zero
    if denom < eps:
        return 0.0
    return float(np.dot(a, b) / denom)

# vectorized: cosine of every row in A against vector b
def cosine_batch(A, b, eps=1e-8):
    A = np.asarray(A, dtype=float)
    b = np.asarray(b, dtype=float)
    num = A @ b
    denom = np.linalg.norm(A, axis=1) * np.linalg.norm(b)
    return num / np.maximum(denom, eps)

print(cosine_similarity([1, 0, 1], [1, 1, 0]))  # 0.5`}</CodeBlock>
  <p><strong>Edge case:</strong> a zero vector has no direction, so its norm is 0 and the formula divides by zero (returning <M>{"\\text{nan}"}</M>). Clamp the denominator with a small <M>{"\\epsilon"}</M> or return 0 explicitly. A second subtlety: floating-point error can push the result a hair outside <M>{"[-1, 1]"}</M>, so clip before feeding it into <M>{"\\arccos"}</M> for an angle.</p>
</InterviewProblem>

      </>
  );
}
