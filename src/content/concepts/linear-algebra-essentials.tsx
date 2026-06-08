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
    </>
  );
}
