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
    </>
  );
}
