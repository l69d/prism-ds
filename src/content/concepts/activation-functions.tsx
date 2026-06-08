"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { Quiz } from "@/components/content/quiz";
import { ActivationFunctions } from "@/components/viz/activation-functions";
import { InterviewProblem } from "@/components/content/interview-problem";
import { CodeBlock } from "@/components/content/code-block";

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
    <h2>Interview practice</h2>
<InterviewProblem question="Why does a deep network with only linear activations collapse to a single linear layer?" difficulty="easy" tag="Conceptual">
  <p>Stacking linear maps gives another linear map. If layer <M>{"k"}</M> computes <M>{"h_k = W_k h_{k-1} + b_k"}</M> with no nonlinearity, then composing two layers gives:</p>
  <MB>{"W_2(W_1 x + b_1) + b_2 = (W_2 W_1)\\,x + (W_2 b_1 + b_2)"}</MB>
  <p>which is just <M>{"W' x + b'"}</M> for some effective <M>{"W' = W_2 W_1"}</M> and <M>{"b'"}</M>. By induction, any depth of purely linear layers equals one linear layer, so it can only fit linearly-separable / linear-regression targets no matter how many parameters you add.</p>
  <p>The <strong>nonlinearity between layers</strong> is what lets the composition represent curved decision boundaries and rich functions. That is the entire reason activations exist: they break the linearity so depth actually buys you expressive power.</p>
</InterviewProblem>
<InterviewProblem question="Explain the vanishing-gradient problem with sigmoid and how ReLU mitigates it." difficulty="medium" tag="Conceptual">
  <p>The sigmoid <M>{"\\sigma(z) = 1/(1+e^{-z})"}</M> has derivative <M>{"\\sigma'(z) = \\sigma(z)(1-\\sigma(z))"}</M>, which peaks at <M>{"0.25"}</M> when <M>{"z=0"}</M> and decays toward <M>{"0"}</M> for large <M>{"|z|"}</M> (saturation).</p>
  <p>Backprop multiplies these derivatives along the depth. With many layers the gradient at an early layer is roughly a product of terms each <M>{"\\le 0.25"}</M>:</p>
  <MB>{"\\left|\\frac{\\partial L}{\\partial h_1}\\right| \\sim \\prod_{k} |\\sigma'(z_k)| \\le 0.25^{\\,L} \\to 0"}</MB>
  <p>so early layers barely update and training stalls. ReLU, <M>{"\\max(0, z)"}</M>, has derivative exactly <M>{"1"}</M> for <M>{"z>0"}</M> and <M>{"0"}</M> for <M>{"z<0"}</M>. On the active path the gradient is passed through undiluted (no shrinking factor), which keeps signal flowing through deep stacks.</p>
  <ul>
    <li><strong>Trade-off:</strong> the dead region gives the &quot;dying ReLU&quot; problem — a unit stuck at <M>{"z<0"}</M> gets zero gradient forever. Leaky ReLU / GELU keep a small negative slope to avoid permanently dead units.</li>
    <li>ReLU is also cheaper to compute (a threshold, no exp) and induces sparsity in activations.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="Implement sigmoid, tanh, ReLU, and GELU plus their derivatives in NumPy, and check the gradients numerically." difficulty="medium" tag="Coding">
  <p>Numerical gradient checking is the standard sanity test: compare the analytic derivative against a finite-difference estimate.</p>
  <CodeBlock language="python" filename="activations.py">{`import numpy as np

def sigmoid(z):
    return 1.0 / (1.0 + np.exp(-z))

def d_sigmoid(z):
    s = sigmoid(z)
    return s * (1.0 - s)

def tanh(z):
    return np.tanh(z)

def d_tanh(z):
    return 1.0 - np.tanh(z) ** 2

def relu(z):
    return np.maximum(0.0, z)

def d_relu(z):
    return (z > 0).astype(z.dtype)

# tanh-approx GELU (the form used in BERT/GPT)
def gelu(z):
    c = np.sqrt(2.0 / np.pi)
    return 0.5 * z * (1.0 + np.tanh(c * (z + 0.044715 * z ** 3)))

def numeric_grad(f, z, eps=1e-6):
    return (f(z + eps) - f(z - eps)) / (2 * eps)

z = np.linspace(-3, 3, 7)
for f, df, name in [(sigmoid, d_sigmoid, "sigmoid"),
                    (tanh, d_tanh, "tanh"),
                    (relu, d_relu, "relu")]:
    err = np.max(np.abs(df(z) - numeric_grad(f, z)))
    print(f"{name:8s} max grad error = {err:.2e}")`}</CodeBlock>
  <p>The errors print around <M>{"10^{-10}"}</M> for the smooth functions, confirming the closed forms. ReLU shows a tiny mismatch only exactly at <M>{"z=0"}</M> where the derivative is undefined — in practice frameworks just pick <M>{"0"}</M> there, and finite differences straddle the kink, so you should evaluate the check away from the origin.</p>
</InterviewProblem>
<InterviewProblem question="You are choosing an activation for a new architecture. Walk through how you would pick, and why tanh sometimes still beats ReLU." difficulty="hard" tag="Applied">
  <p>There is no universal best; match the activation to the role and the failure mode you fear most.</p>
  <ul>
    <li><strong>Hidden layers of feed-forward / conv nets:</strong> default to <strong>ReLU</strong> for speed and clean gradient flow. If you see many dead units, switch to <strong>Leaky ReLU</strong> or <strong>GELU/SiLU</strong>, which are smooth and keep a small negative slope.</li>
    <li><strong>Transformers / modern LLMs:</strong> <strong>GELU</strong> (or GLU variants like SwiGLU) is standard — the smoothness pairs well with large-batch, LayerNorm&apos;d training and gives a small but consistent edge over raw ReLU.</li>
    <li><strong>Recurrent cells (LSTM/GRU gates):</strong> <strong>sigmoid</strong> for gates (need a value in <M>{"(0,1)"}</M> to act as a soft switch) and <strong>tanh</strong> for the candidate state (zero-centered output).</li>
    <li><strong>Output layer:</strong> dictated by the task — sigmoid for binary, softmax for multiclass, identity/linear for regression. Never put ReLU on a regression output unless the target is provably non-negative.</li>
  </ul>
  <p><strong>Why tanh can beat ReLU:</strong> tanh is <strong>zero-centered</strong> (range <M>{"(-1,1)"}</M>), so its outputs do not introduce a systematic positive bias into the next layer&apos;s inputs. ReLU outputs are always <M>{"\\ge 0"}</M>, which can push the mean activation up and make optimization zig-zag; this is one motivation for normalization layers. In small or shallow nets, or in the bounded internal state of an RNN where you want values to not explode, the bounded zero-centered shape of tanh is genuinely useful. In very deep nets ReLU&apos;s non-saturating gradient usually wins, which is why it became the default.</p>
  <p>The honest interview answer: start from ReLU/GELU, monitor for dead units and gradient norms, and only deviate with evidence — but be able to name <strong>why</strong> each alternative exists (saturation, zero-centering, dead units, smoothness).</p>
</InterviewProblem>

      </>
  );
}
