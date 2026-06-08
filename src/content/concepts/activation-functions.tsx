"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M } from "@/components/content/math";
import { Quiz } from "@/components/content/quiz";
import { ActivationFunctions } from "@/components/viz/activation-functions";

export default function ActivationFunctionsContent() {
  return (
    <>
      <p>
        Activation functions are the <strong>nonlinearity</strong> inside every neuron. They&apos;re what
        let neural networks model curves, interactions, and complex decision boundaries instead of just
        straight lines. The choice of activation has a big effect on how well — and how fast — a network learns.
      </p>

      <KeyIdea>
        Without a nonlinear activation, a deep network is just a linear model in disguise. The activation
        bends the signal, and stacking many bends lets the network carve arbitrarily complex shapes.
      </KeyIdea>

      <p>
        Compare the common activations below. Toggle the derivative (dashed) — that&apos;s what
        backpropagation multiplies by, so where the derivative is near zero, learning <em>stalls</em>.
      </p>

      <ActivationFunctions />

      <h2>The usual suspects</h2>
      <Basic>
        <p>
          <strong>ReLU</strong> is the default: it passes positives through and zeros out negatives —
          simple and fast. <strong>Sigmoid</strong> and <strong>tanh</strong> squash values into a fixed
          range, useful for outputs but problematic deep inside big networks because their gradients
          shrink toward the edges.
        </p>
      </Basic>
      <Advanced>
        <ul>
          <li><strong>Sigmoid</strong> <M>{"\\sigma(x)=\\frac{1}{1+e^{-x}}"}</M> — squashes to (0,1); saturates, gradient ≤ 0.25, not zero-centered.</li>
          <li><strong>Tanh</strong> — zero-centered (−1,1), still saturates at the extremes.</li>
          <li><strong>ReLU</strong> <M>{"\\max(0,x)"}</M> — no positive-side saturation, sparse, cheap; can &quot;die&quot; (stuck at 0).</li>
          <li><strong>Leaky ReLU / GELU</strong> — keep a small gradient for negatives; GELU is the smooth default in modern transformers.</li>
        </ul>
      </Advanced>

      <Callout kind="pitfall" title="The vanishing gradient problem">
        For sigmoid and tanh, the derivative is tiny once you&apos;re away from zero. Multiply many such
        small numbers through deep layers during backprop and the gradient <strong>vanishes</strong> —
        early layers barely learn. ReLU&apos;s constant gradient of 1 for positive inputs is exactly why
        it unlocked deep learning.
      </Callout>

      <MoreDepth>
        <p>
          Practical guidance: default to <strong>ReLU</strong> for hidden layers (or <strong>GELU</strong>
          in transformers); if you see dead neurons, try <strong>Leaky ReLU</strong> or{" "}
          <strong>ELU</strong>. For the <em>output</em> layer, match the task: <strong>sigmoid</strong>
          for binary probability, <strong>softmax</strong> for multi-class, and <strong>no activation</strong>
          (linear) for regression. Pair ReLU with He initialization; pair tanh/sigmoid with Xavier.
        </p>
      </MoreDepth>

      <Quiz
        question="Why did ReLU largely replace sigmoid in the hidden layers of deep networks?"
        options={[
          { text: "ReLU outputs probabilities directly.", why: "That's sigmoid/softmax; ReLU outputs unbounded positives." },
          { text: "ReLU's gradient doesn't vanish for positive inputs, so deep networks train far better.", correct: true, why: "A constant gradient of 1 avoids the shrinking-gradient problem of saturating functions." },
          { text: "ReLU is the only nonlinear function.", why: "There are many; ReLU just trains well and is cheap." },
          { text: "ReLU guarantees a global optimum.", why: "No activation guarantees that; the loss is still non-convex." },
        ]}
      />
    </>
  );
}
