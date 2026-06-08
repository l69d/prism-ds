"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import Link from "next/link";
import { Quiz } from "@/components/content/quiz";
import { NeuralNetPlayground } from "@/components/viz/neural-net";
import { InterviewProblem } from "@/components/content/interview-problem";
import { CodeBlock } from "@/components/content/code-block";

export default function NeuralNetworksContent() {
  return (
    <>
      <p>
        A neural network is a <strong>stack of simple functions</strong> that together can approximate
        almost any relationship. Strip away the hype and a network is just weighted sums passed through
        nonlinearities — repeated, layer after layer.
      </p>

      <KeyIdea>
        One neuron computes a <strong>weighted sum of its inputs</strong>, adds a bias, and squashes the
        result through a nonlinear <strong>activation</strong>. Stack neurons into layers and layers into
        depth, and the network learns to build increasingly abstract features on its own.
      </KeyIdea>

      <p>
        Change the inputs below and watch the signal propagate left to right. Each node lights up with
        its activation; each edge is a weight (violet positive, pink negative, thicker = stronger).
        That left-to-right computation is the <strong>forward pass</strong>.
      </p>

      <NeuralNetPlayground />

      <h2>From one neuron to a network</h2>
      <Basic>
        <p>
          Think of each neuron as a tiny voter: it looks at its inputs, weighs the ones it cares about,
          and fires more or less strongly. The next layer listens to those votes and forms its own. Early
          layers detect simple patterns; later layers combine them into complex concepts.
        </p>
      </Basic>
      <Advanced>
        <p>A layer is an affine map followed by an elementwise nonlinearity:</p>
        <MB>{"\\mathbf{a}^{(l)} = \\phi\\!\\left(W^{(l)} \\mathbf{a}^{(l-1)} + \\mathbf{b}^{(l)}\\right)"}</MB>
        <p>
          The <strong>universal approximation theorem</strong> says even a single hidden layer (with
          enough units) can approximate any continuous function — but <strong>depth</strong> makes this
          dramatically more parameter-efficient, letting the network reuse features compositionally.
        </p>
      </Advanced>

      <Callout kind="insight" title="Why the nonlinearity is non-negotiable">
        Without activations, stacking layers collapses to a single linear map — a hundred layers would
        be no more expressive than one. The nonlinearity (ReLU, GELU…) is what gives depth its power.
        See the <Link href="/learn/activation-functions">activation functions</Link> lesson.
      </Callout>

      <h2>How it learns</h2>
      <ul>
        <li><strong>Forward pass</strong> — push inputs through to get a prediction.</li>
        <li><strong>Loss</strong> — measure how wrong the prediction is.</li>
        <li><strong>Backward pass</strong> — <Link href="/learn/backpropagation">backpropagation</Link> computes how each weight contributed to the error.</li>
        <li><strong>Update</strong> — <Link href="/learn/gradient-descent">gradient descent</Link> nudges every weight to reduce the loss.</li>
      </ul>

      <MoreDepth>
        <p>
          Training deep nets is a balancing act. <strong>Vanishing/exploding gradients</strong> make early
          layers learn too slowly or blow up — addressed by ReLU-family activations, careful
          initialization (He/Xavier), residual connections, and normalization layers. The number of
          parameters can dwarf the dataset, so <strong>regularization</strong> (dropout, weight decay,
          early stopping, data augmentation) is what keeps an over-capacity model from memorizing.
        </p>
      </MoreDepth>

      <Quiz
        question="What happens if you build a 10-layer network with no activation functions?"
        options={[
          { text: "It becomes more powerful with each layer.", why: "Without nonlinearity, extra layers add no expressive power." },
          { text: "It collapses to an equivalent single linear model.", correct: true, why: "A composition of linear maps is itself a linear map." },
          { text: "It can now fit any function.", why: "The opposite — it's stuck modeling only linear relationships." },
          { text: "It trains faster and generalizes better.", why: "It simply can't represent non-linear patterns at all." },
        ]}
      />
    <h2>Interview practice</h2>
<InterviewProblem question="What does a single neuron compute, and why do we need the nonlinearity?" difficulty="easy" tag="Conceptual">
  <p>A neuron takes inputs <M>{"x"}</M>, forms a weighted sum plus a bias, then passes the result through an activation function <M>{"\\phi"}</M>:</p>
  <MB>{"a = \\phi\\!\\left(\\sum_{i} w_i x_i + b\\right) = \\phi(\\mathbf{w}^\\top \\mathbf{x} + b)"}</MB>
  <p>The weighted sum is an <strong>affine map</strong>; on its own it is linear. The key insight: stacking affine maps gives you another affine map. If layer two computes <M>{"W_2(W_1 \\mathbf{x}) = (W_2 W_1)\\mathbf{x}"}</M>, the whole network collapses to a single linear layer no matter how deep it is.</p>
  <ul>
    <li>The nonlinearity <M>{"\\phi"}</M> (ReLU, sigmoid, tanh) breaks that collapse, letting each added layer carve the input space in genuinely new ways.</li>
    <li>This is what gives multilayer networks their <strong>universal approximation</strong> power; remove the activations and you are back to logistic or linear regression.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="Work through a forward pass by hand for a tiny 2-2-1 ReLU network." difficulty="medium" tag="Math">
  <p>Let the input be <M>{"\\mathbf{x} = [1,\\ 2]^\\top"}</M>. Hidden layer weights and bias:</p>
  <MB>{"W_1 = \\begin{bmatrix} 1 & -1 \\\\ 0 & 2 \\end{bmatrix}, \\quad \\mathbf{b}_1 = \\begin{bmatrix} 0 \\\\ -1 \\end{bmatrix}"}</MB>
  <p>Pre-activations <M>{"\\mathbf{z}_1 = W_1\\mathbf{x} + \\mathbf{b}_1"}</M>:</p>
  <MB>{"\\mathbf{z}_1 = \\begin{bmatrix} (1)(1) + (-1)(2) \\\\ (0)(1) + (2)(2) \\end{bmatrix} + \\begin{bmatrix} 0 \\\\ -1 \\end{bmatrix} = \\begin{bmatrix} -1 \\\\ 3 \\end{bmatrix}"}</MB>
  <p>Apply ReLU <M>{"\\phi(z) = \\max(0, z)"}</M> elementwise: <M>{"\\mathbf{h} = [0,\\ 3]^\\top"}</M>. The negative unit is clamped off.</p>
  <p>Output layer with <M>{"\\mathbf{w}_2 = [2,\\ 1]"}</M> and <M>{"b_2 = 0.5"}</M>:</p>
  <MB>{"y = \\mathbf{w}_2 \\mathbf{h} + b_2 = (2)(0) + (1)(3) + 0.5 = 3.5"}</MB>
  <p>The deactivated unit contributes nothing, which is exactly why ReLU networks produce sparse, piecewise-linear behavior.</p>
</InterviewProblem>
<InterviewProblem question="Implement a forward pass from scratch in NumPy and verify it against a known output." difficulty="medium" tag="Coding">
  <p>A clean forward pass is just alternating matrix multiplies and elementwise activations. Vectorize over the batch dimension so it scales:</p>
  <CodeBlock language="python" filename="forward.py">{`import numpy as np

def relu(z):
    return np.maximum(0.0, z)

def forward(X, params):
    """X: (batch, in_dim). params: list of (W, b)."""
    a = X
    for i, (W, b) in enumerate(params):
        z = a @ W + b              # affine map
        a = relu(z) if i < len(params) - 1 else z  # no activation on output
    return a

# Reproduce the 2-2-1 example above
W1 = np.array([[1., 0.], [-1., 2.]])   # stored so X @ W1 matches W1 @ x
b1 = np.array([0., -1.])
W2 = np.array([[2.], [1.]])
b2 = np.array([0.5])

X = np.array([[1., 2.]])
print(forward(X, [(W1, b1), (W2, b2)]))   # -> [[3.5]]`}</CodeBlock>
  <p>Two details interviewers probe: store weights so the batched <M>{"X W"}</M> convention is consistent, and <strong>do not</strong> apply the hidden activation on the final layer (you usually want raw logits or a task-specific head like softmax).</p>
</InterviewProblem>
<InterviewProblem question="A team can either double the width of one hidden layer or add a second hidden layer of the same size. How would you reason about depth versus width?" difficulty="hard" tag="Applied">
  <p>Both increase capacity, but they buy different things, so frame the answer around the function class and the data.</p>
  <ul>
    <li><strong>Width</strong> adds more basis functions in a single layer. With one wide enough hidden layer you can approximate any continuous function (universal approximation), but the number of units may grow exponentially for functions with compositional structure.</li>
    <li><strong>Depth</strong> composes transformations, so the network can reuse intermediate features. For hierarchical or compositional targets, depth can represent the same function with exponentially fewer parameters than a shallow net; this is the core argument for deep learning.</li>
    <li><strong>Optimization cost:</strong> depth is harder to train. Gradients must flow through more layers, raising vanishing or exploding gradient risk; this is why residual connections, normalization, and good initialization matter as you go deeper.</li>
    <li><strong>Decision in practice:</strong> if the signal is roughly flat or features are weakly hierarchical (many tabular problems), widen. If the structure is hierarchical (vision, language, sequential composition), add depth, but pair it with skip connections and normalization. Above all, treat it as a hyperparameter and let a validation curve decide rather than arguing it purely from theory.</li>
  </ul>
</InterviewProblem>

      </>
  );
}
