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
      <p>Backpropagation is the algorithm that lets a neural network figure out <em>which</em> of its millions of weights caused its mistake, and by how much. It is the chain rule from calculus, applied systematically and efficiently across an entire computation graph.</p>

      <KeyIdea>To learn, a network must answer one question for every weight: &quot;if I nudge you a little, how much does the final loss change?&quot; Backprop answers all of these at once by reusing partial results, in a single backward sweep.</KeyIdea>

      <h2>The two passes</h2>
      <p>Training a network alternates between two directions of travel:</p>
      <ul>
        <li><strong>Forward pass:</strong> feed an input through the layers to produce a prediction, then compare it to the target to get a scalar <strong>loss</strong>.</li>
        <li><strong>Backward pass:</strong> starting from the loss, walk backward layer by layer, multiplying local derivatives together to find each weight&apos;s gradient.</li>
      </ul>
      <p>Those gradients tell an optimizer like gradient descent which way, and how far, to move each weight to shrink the loss.</p>

      <Basic>
        <p>Imagine a relay team that loses a race. Instead of blaming everyone equally, you trace the result backward: the anchor runner contributed directly to the final time, but their performance also depended on the handoff from the runner before them, and so on down the chain.</p>
        <p>Backprop assigns <strong>blame</strong> the same way. The error at the output is passed back through each layer, and at every step it gets scaled by how sensitive that layer was to its own inputs. A weight that strongly influenced a downstream mistake receives a large gradient; one that barely mattered gets a small one. Crucially, the work done for later layers is reused for earlier ones, so nothing is recomputed from scratch.</p>
      </Basic>

      <Advanced>
        <p>For a layer computing <M>{"z = Wx + b"}</M> followed by activation <M>{"a = \\sigma(z)"}</M>, define the upstream gradient <M>{"\\delta = \\partial L / \\partial a"}</M>. The chain rule gives the local gradients:</p>
        <MB>{"\\frac{\\partial L}{\\partial z} = \\delta \\odot \\sigma'(z), \\qquad \\frac{\\partial L}{\\partial W} = \\frac{\\partial L}{\\partial z}\\, x^{\\top}, \\qquad \\frac{\\partial L}{\\partial x} = W^{\\top} \\frac{\\partial L}{\\partial z}"}</MB>
        <p>The term <M>{"\\partial L / \\partial x"}</M> becomes the upstream gradient for the previous layer, so the recursion propagates. The cost of the backward pass is the same order as the forward pass — this is <strong>reverse-mode automatic differentiation</strong>, which computes the gradient of one scalar output with respect to all inputs in a single sweep.</p>
      </Advanced>

      <Callout kind="pitfall" title="Vanishing and exploding gradients">
        Because backprop multiplies many local derivatives together, deep chains can drive gradients toward zero or blow them up. Saturating activations like sigmoid have derivatives below 1, so repeated multiplication shrinks the signal until early layers stop learning. ReLU, residual connections, and careful initialization exist largely to keep this product well-behaved.
      </Callout>

      <CodeBlock language="python" filename="backprop.py">{`import numpy as np

# One hidden layer: x -> z1 -> a1 -> z2 -> loss (MSE)
def forward_backward(x, y, W1, b1, W2, b2):
    z1 = W1 @ x + b1
    a1 = np.maximum(0, z1)          # ReLU
    z2 = W2 @ a1 + b2               # prediction
    loss = 0.5 * np.sum((z2 - y) ** 2)

    # Backward pass: chain rule, reusing each delta
    dz2 = z2 - y                    # dL/dz2
    dW2 = np.outer(dz2, a1)         # dL/dW2
    da1 = W2.T @ dz2                # dL/da1
    dz1 = da1 * (z1 > 0)            # ReLU derivative
    dW1 = np.outer(dz1, x)         # dL/dW1
    return loss, dW1, dW2`}</CodeBlock>

      <MoreDepth>
        <p>Modern frameworks never write these formulas by hand. They record every operation of the forward pass onto a dynamic computation graph, then traverse it in reverse topological order, applying each operation&apos;s registered <em>vector-Jacobian product</em>. This is why you only define the forward pass in PyTorch — <code>loss.backward()</code> walks the recorded graph. The memory cost is the catch: every intermediate activation must be stored for the backward pass, which is why training memory scales with network depth, and why techniques like gradient checkpointing trade recomputation for RAM.</p>
      </MoreDepth>

      <Quiz question="Why is the backward pass only about as expensive as the forward pass, rather than far more costly?" options={[
        { text: "Reverse-mode autodiff reuses each layer's intermediate gradient to compute the previous layer's, so no derivative is recomputed.", correct: true, why: "Exactly — the delta from one layer feeds the next, giving all weight gradients in a single sweep." },
        { text: "The network skips most weights and only updates the largest ones.", why: "Backprop computes a gradient for every weight; it does not prune them during the pass." },
        { text: "Gradients are estimated numerically by perturbing each weight one at a time.", why: "That finite-difference approach would cost one forward pass per weight — backprop avoids it entirely." },
        { text: "The loss is linear, so its derivative is constant and cheap.", why: "Losses and activations are generally nonlinear; the efficiency comes from reuse, not linearity." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="Explain backpropagation in one or two sentences. What is it actually computing?" difficulty="easy" tag="Conceptual">
  <p>Backpropagation is an efficient algorithm for computing the gradient of a scalar loss <M>{"L"}</M> with respect to every parameter in a network. It is the chain rule applied in reverse: instead of recomputing shared subexpressions for each parameter, it does one forward pass to cache activations, then one backward pass that propagates the &quot;error signal&quot; <M>{"\\partial L / \\partial z"}</M> from the output back through each layer, reusing earlier results.</p>
  <p>The key point: it computes <strong>exact</strong> gradients (not approximations), and it does so in time proportional to a single forward pass rather than one pass per parameter. The gradients themselves do not update anything &mdash; an optimizer such as SGD or Adam consumes them. Backprop only assigns blame; the optimizer acts on it.</p>
</InterviewProblem>
<InterviewProblem question="For a single sigmoid neuron with squared loss, derive the gradient of the loss with respect to the weight." difficulty="medium" tag="Math">
  <p>Let the neuron compute <M>{"z = wx + b"}</M>, <M>{"a = \\sigma(z)"}</M> with <M>{"\\sigma(z) = 1/(1+e^{-z})"}</M>, and loss <M>{"L = \\tfrac12 (a - y)^2"}</M>. We want <M>{"\\partial L / \\partial w"}</M> by chaining three local derivatives:</p>
  <MB>{"\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial a}\\cdot\\frac{\\partial a}{\\partial z}\\cdot\\frac{\\partial z}{\\partial w}"}</MB>
  <p>Each piece is simple:</p>
  <ul>
    <li><M>{"\\partial L / \\partial a = (a - y)"}</M></li>
    <li><M>{"\\partial a / \\partial z = \\sigma(z)(1-\\sigma(z)) = a(1-a)"}</M></li>
    <li><M>{"\\partial z / \\partial w = x"}</M></li>
  </ul>
  <p>Multiplying gives the final result:</p>
  <MB>{"\\frac{\\partial L}{\\partial w} = (a - y)\\, a(1-a)\\, x"}</MB>
  <p>The factor <M>{"a(1-a)"}</M> is the seed of the <strong>vanishing-gradient</strong> problem: it peaks at <M>{"0.25"}</M> when <M>{"a = 0.5"}</M> and collapses toward <M>{"0"}</M> when the neuron saturates near <M>{"0"}</M> or <M>{"1"}</M>, so a saturated unit barely learns.</p>
</InterviewProblem>
<InterviewProblem question="Why do deep networks with sigmoid or tanh activations suffer from vanishing gradients, and what changes mitigate it?" difficulty="medium" tag="Conceptual">
  <p>The gradient at an early layer is a <strong>product</strong> of per-layer Jacobians. With sigmoid, each layer contributes a factor whose derivative is at most <M>{"0.25"}</M> (for tanh, at most <M>{"1"}</M> but typically less). Multiplying many sub-unit factors across <M>{"L"}</M> layers shrinks the signal roughly geometrically, so <M>{"\\partial L/\\partial \\theta"}</M> for early layers can be vanishingly small &mdash; those layers stop learning. If factors instead exceed <M>{"1"}</M> consistently, the symmetric failure is <strong>exploding</strong> gradients.</p>
  <p>Standard mitigations:</p>
  <ul>
    <li><strong>ReLU-family activations</strong> &mdash; derivative is exactly <M>{"1"}</M> on the active side, so it does not multiplicatively attenuate the signal.</li>
    <li><strong>Residual / skip connections</strong> &mdash; the identity path lets gradients flow directly past many layers, keeping the Jacobian near identity.</li>
    <li><strong>Normalization</strong> (batch / layer norm) &mdash; keeps pre-activations in a well-conditioned range so units do not saturate.</li>
    <li><strong>Careful initialization</strong> (He, Xavier) &mdash; scales weights so activation and gradient variance is preserved across layers.</li>
    <li><strong>Gradient clipping</strong> &mdash; specifically targets the exploding case, common in RNNs.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="Implement the backward pass for one linear layer (z = xW + b) from scratch, given the upstream gradient dL/dz. What are the shapes?" difficulty="hard" tag="Coding">
  <p>The forward op is <M>{"Z = XW + b"}</M> with batch <M>{"X \\in \\mathbb{R}^{N\\times D}"}</M>, weights <M>{"W \\in \\mathbb{R}^{D\\times H}"}</M>, bias <M>{"b \\in \\mathbb{R}^{H}"}</M>, output <M>{"Z \\in \\mathbb{R}^{N\\times H}"}</M>. Given the upstream gradient <M>{"\\mathrm{d}Z = \\partial L/\\partial Z"}</M> (shape <M>{"N\\times H"}</M>), the three local gradients follow from the chain rule. Note how each is a transpose-contraction that makes the shapes line up:</p>
  <ul>
    <li><M>{"\\mathrm{d}W = X^\\top \\,\\mathrm{d}Z"}</M> &nbsp;(<M>{"D\\times H"}</M>, matches <M>{"W"}</M>)</li>
    <li><M>{"\\mathrm{d}X = \\mathrm{d}Z\\, W^\\top"}</M> &nbsp;(<M>{"N\\times D"}</M>, matches <M>{"X"}</M>)</li>
    <li><M>{"\\mathrm{d}b = \\sum_{n} \\mathrm{d}Z_{n}"}</M> &nbsp;(<M>{"H"}</M>; sum over the batch axis because <M>{"b"}</M> is broadcast)</li>
  </ul>
  <CodeBlock language="python" filename="linear_backward.py">{`import numpy as np

def linear_forward(X, W, b):
    # X: (N, D), W: (D, H), b: (H,)  ->  Z: (N, H)
    Z = X @ W + b
    cache = (X, W)
    return Z, cache

def linear_backward(dZ, cache):
    # dZ: (N, H) is dL/dZ from the next layer
    X, W = cache
    dW = X.T @ dZ          # (D, H)
    dX = dZ @ W.T          # (N, D)
    db = dZ.sum(axis=0)    # (H,)  sum over batch, b is broadcast in forward
    return dX, dW, db

# Gradient check against a numerical estimate
np.random.seed(0)
X = np.random.randn(4, 3)
W = np.random.randn(3, 5)
b = np.random.randn(5)
Z, cache = linear_forward(X, W, b)
dZ = np.random.randn(*Z.shape)          # pretend upstream gradient

dX, dW, db = linear_backward(dZ, cache)

# Numerically verify dW with finite differences: L = sum(Z * dZ)
eps = 1e-6
num_dW = np.zeros_like(W)
for i in range(W.shape[0]):
    for j in range(W.shape[1]):
        Wp = W.copy(); Wp[i, j] += eps
        Wm = W.copy(); Wm[i, j] -= eps
        Lp = np.sum((X @ Wp + b) * dZ)
        Lm = np.sum((X @ Wm + b) * dZ)
        num_dW[i, j] = (Lp - Lm) / (2 * eps)

print("max abs error:", np.max(np.abs(dW - num_dW)))  # ~1e-9`}</CodeBlock>
  <p>The two questions an interviewer is really probing: (1) can you keep the shapes consistent &mdash; <strong>the gradient of a tensor always has that tensor&apos;s shape</strong> &mdash; and (2) do you know to <strong>sum the bias gradient over the batch axis</strong> because the bias was broadcast in the forward pass. A finite-difference gradient check, as above, is the standard way to prove a hand-written backward pass is correct.</p>
</InterviewProblem>

      </>
  );
}
