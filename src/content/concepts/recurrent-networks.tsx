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
      <p>A recurrent neural network (RNN) reads a sequence one step at a time, carrying a running summary of everything it has seen so far. That summary is its memory.</p>

      <KeyIdea>An RNN reuses the <strong>same</strong> weights at every time step and threads a hidden state through the sequence, so the network&apos;s output at any moment depends on the entire past, not just the current input.</KeyIdea>

      <h2>The recurrence</h2>
      <p>At each step the network combines the new input with its previous hidden state to produce a new hidden state, then optionally emits an output. The key features are:</p>
      <ul>
        <li><strong>Shared parameters:</strong> one set of weights handles a sequence of any length.</li>
        <li><strong>State carry-over:</strong> the hidden vector is a compressed memory of the past.</li>
        <li><strong>Order sensitivity:</strong> swapping two inputs changes the result, unlike a bag-of-features model.</li>
      </ul>

      <Basic>
        <p>Imagine reading a sentence and keeping a single sticky note in your head that you update after each word. You never re-read from the start; you just revise the note. That note is the hidden state. The catch: a tiny sticky note can only hold so much, so details from the very first words tend to get overwritten by the time you reach the end. That is exactly why RNNs struggle to remember things from far back.</p>
      </Basic>

      <Advanced>
        <p>The vanilla recurrence with input <M>{"x_t"}</M> and hidden state <M>{"h_t"}</M> is:</p>
        <MB>{"h_t = \\tanh(W_{hh} h_{t-1} + W_{xh} x_t + b)"}</MB>
        <p>Training uses <strong>backpropagation through time</strong>: the loss gradient at step <M>{"t"}</M> flows back through every earlier step. The gradient with respect to an early state involves a product of Jacobians,</p>
        <MB>{"\\frac{\\partial h_t}{\\partial h_k} = \\prod_{i=k+1}^{t} \\operatorname{diag}(\\tanh'(\\cdot))\\, W_{hh}^{\\top}"}</MB>
        <p>If the largest singular value of <M>{"W_{hh}"}</M> is below 1, this product shrinks geometrically (vanishing gradients); above 1, it blows up (exploding gradients). Either way, long-range credit assignment becomes unstable.</p>
      </Advanced>

      <Callout kind="insight" title="Why gates were invented">
        LSTMs and GRUs add a near-linear &quot;cell&quot; pathway with learned gates that can copy the state forward unchanged. That additive path lets gradients flow across many steps without repeated multiplication, directly attacking the vanishing-gradient problem.
      </Callout>

      <h2>Where it matters</h2>
      <p>RNNs and their gated variants power language modeling, speech recognition, time-series forecasting, and any task where order and history carry meaning. Even in the Transformer era they remain useful when streaming, low latency, or strict memory budgets matter.</p>

      <CodeBlock language="python" filename="rnn_cell.py">{`import numpy as np

def rnn_forward(inputs, h0, Wxh, Whh, Why, bh, by):
    """Run a vanilla RNN over a sequence of input vectors."""
    h = h0
    outputs = []
    for x in inputs:                      # one step at a time
        h = np.tanh(Wxh @ x + Whh @ h + bh)  # update memory
        y = Why @ h + by                  # emit output
        outputs.append(y)
    return outputs, h                     # h is the final memory
`}</CodeBlock>

      <Callout kind="pitfall" title="Exploding gradients">
        Vanishing gradients need architecture changes, but exploding gradients have a cheap fix: clip the global gradient norm (e.g. to 1.0 or 5.0) before each optimizer step. Skipping this often shows up as sudden NaN losses during training.
      </Callout>

      <MoreDepth>
        <p>The vanishing-gradient story is about <em>trainability</em>, not <em>expressivity</em>. In principle an RNN can represent long dependencies; the problem is that gradient descent struggles to <em>find</em> those solutions. Gates help, but they do not fully solve it, which is why attention won: instead of squeezing all history through one fixed-size bottleneck, attention provides a direct, content-addressed shortcut to every past position, turning a long product of Jacobians into a single weighted sum.</p>
      </MoreDepth>

      <Quiz question="Why do vanilla RNNs struggle with long-range dependencies?" options={[
        { text: "Repeated multiplication by the recurrent weight matrix makes gradients vanish or explode over many steps", correct: true, why: "Backprop through time multiplies many Jacobians, so gradients shrink or blow up geometrically." },
        { text: "They use too many parameters because each time step has its own weights", why: "Backwards: RNNs share one weight set across all steps, which is a strength, not the cause." },
        { text: "The hidden state grows without bound as the sequence gets longer", why: "The hidden state is a fixed-size vector; it does not grow with sequence length." },
        { text: "They cannot represent functions that depend on earlier inputs at all", why: "RNNs can represent long dependencies in principle; the issue is training, not expressivity." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="Explain why vanilla RNNs struggle to learn long-range dependencies. What does this have to do with vanishing and exploding gradients?" difficulty="easy" tag="Conceptual">
  <p>A vanilla RNN maintains a hidden state updated as <M>{"h_t = \\tanh(W_h h_{t-1} + W_x x_t + b)"}</M>. To learn a dependency that spans <M>{"k"}</M> time steps, backpropagation through time multiplies many Jacobians together:</p>
  <MB>{"\\frac{\\partial h_t}{\\partial h_{t-k}} = \\prod_{i=t-k+1}^{t} \\frac{\\partial h_i}{\\partial h_{i-1}} = \\prod_{i} \\operatorname{diag}(\\tanh'(\\cdot))\\, W_h^{\\top}"}</MB>
  <p>This is a repeated product of similar matrices, so its magnitude scales roughly like <M>{"\\lambda^k"}</M> where <M>{"\\lambda"}</M> is the dominant singular value of the recurrent map.</p>
  <ul>
    <li>If <M>{"\\lambda < 1"}</M>, the gradient shrinks geometrically toward zero &mdash; the <strong>vanishing gradient</strong> problem. The network gets no usable error signal from far-back inputs, so it cannot tie outputs to distant context.</li>
    <li>If <M>{"\\lambda > 1"}</M>, the product blows up &mdash; the <strong>exploding gradient</strong> problem, giving NaNs and unstable training.</li>
    <li>The <M>{"\\tanh'"}</M> factor is at most 1 and usually much smaller once units saturate, which biases the product toward vanishing in practice.</li>
  </ul>
  <p>Exploding gradients have an easy patch (gradient clipping). Vanishing gradients are the deeper issue and the main reason architectures like LSTM and GRU exist.</p>
</InterviewProblem>
<InterviewProblem question="How does an LSTM cell mitigate the vanishing-gradient problem? Walk through the gates and the role of the cell state." difficulty="medium" tag="Conceptual">
  <p>An LSTM adds a separate <strong>cell state</strong> <M>{"c_t"}</M> alongside the hidden state, with an update that is mostly <em>additive</em> rather than a repeated matrix multiply:</p>
  <MB>{"c_t = f_t \\odot c_{t-1} + i_t \\odot \\tilde{c}_t"}</MB>
  <p>where the gates are sigmoids of the current input and previous hidden state:</p>
  <ul>
    <li><strong>Forget gate</strong> <M>{"f_t = \\sigma(W_f[h_{t-1},x_t]+b_f)"}</M> &mdash; how much of the old cell state to keep.</li>
    <li><strong>Input gate</strong> <M>{"i_t = \\sigma(\\cdots)"}</M> and candidate <M>{"\\tilde{c}_t = \\tanh(\\cdots)"}</M> &mdash; what new information to write.</li>
    <li><strong>Output gate</strong> <M>{"o_t = \\sigma(\\cdots)"}</M>, with <M>{"h_t = o_t \\odot \\tanh(c_t)"}</M> &mdash; what to expose.</li>
  </ul>
  <p>The key is the gradient along the cell state. Because the recurrence is additive, the cell-to-cell Jacobian is approximately <M>{"\\partial c_t / \\partial c_{t-1} \\approx \\operatorname{diag}(f_t)"}</M>, so the gradient flowing back is a product of forget gates:</p>
  <MB>{"\\frac{\\partial c_t}{\\partial c_{t-k}} \\approx \\prod_{i} \\operatorname{diag}(f_i)"}</MB>
  <p>When the forget gates stay near 1, this product stays near 1 instead of decaying like <M>{"\\lambda^k"}</M> &mdash; a near &quot;constant error carousel&quot; that lets gradients survive over many steps. The network learns when to remember (keep <M>{"f"}</M> high) and when to reset (drop <M>{"f"}</M>). A common practical trick is to initialize the forget-gate bias positive so cells default to remembering early in training.</p>
</InterviewProblem>
<InterviewProblem question="You are forecasting whether a server will fail in the next hour from a stream of multivariate telemetry. Walk me through how you would frame this as a sequence model, and what you would watch out for." difficulty="medium" tag="Applied">
  <p>This is a sequence-to-one binary classification on a sliding window of telemetry.</p>
  <ul>
    <li><strong>Framing.</strong> For each timestamp, take the trailing window of, say, the last 60 minutes of features and label it 1 if a failure occurs within the next hour, else 0. Feed the window through an RNN (GRU/LSTM) and classify from the final hidden state (or a pooled summary of all hidden states).</li>
    <li><strong>Leakage.</strong> Compute normalization statistics (means, stds) only on the training split, and split by <em>time</em>, never randomly &mdash; random splits leak future into past. Make sure no feature implicitly encodes the label (e.g. a post-failure alarm flag).</li>
    <li><strong>Class imbalance.</strong> Failures are rare, so accuracy is useless. Use a class-weighted or focal loss, evaluate with PR-AUC and recall at a fixed alert budget, and tune the decision threshold on validation.</li>
    <li><strong>Variable history / state.</strong> Decide whether to reset hidden state per window (stateless) or carry it across a machine&apos;s continuous stream (stateful). Pad and mask variable-length windows so padding does not pollute the loss.</li>
    <li><strong>Baselines.</strong> Always compare against a gradient-boosted model on hand-rolled window aggregates (rolling mean/std/slope). RNNs only earn their keep if they beat that on tabular-ish telemetry.</li>
  </ul>
  <p>I would also calibrate probabilities, since &quot;will fail soon&quot; alerts are acted on by humans and a 0.7 should mean roughly 70%.</p>
</InterviewProblem>
<InterviewProblem question="Implement a single GRU time step in NumPy from the gate equations, and verify shapes. Then state how its gradient flow differs from a vanilla RNN." difficulty="hard" tag="Coding">
  <p>A GRU uses an update gate <M>{"z_t"}</M> and a reset gate <M>{"r_t"}</M>, and interpolates between the old hidden state and a candidate:</p>
  <MB>{"h_t = (1 - z_t)\\odot h_{t-1} + z_t \\odot \\tilde{h}_t"}</MB>
  <CodeBlock language="python" filename="gru_step.py">{`import numpy as np

def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))

def gru_step(x_t, h_prev, params):
    # x_t: (input_dim,), h_prev: (hidden_dim,)
    Wz, Uz, bz = params["Wz"], params["Uz"], params["bz"]
    Wr, Ur, br = params["Wr"], params["Ur"], params["br"]
    Wh, Uh, bh = params["Wh"], params["Uh"], params["bh"]

    z = sigmoid(Wz @ x_t + Uz @ h_prev + bz)   # update gate
    r = sigmoid(Wr @ x_t + Ur @ h_prev + br)   # reset gate
    h_tilde = np.tanh(Wh @ x_t + Uh @ (r * h_prev) + bh)
    h_t = (1.0 - z) * h_prev + z * h_tilde     # leaky interpolation
    return h_t

# tiny shape check
D, H = 4, 3
rng = np.random.default_rng(0)
P = {
    "Wz": rng.standard_normal((H, D)), "Uz": rng.standard_normal((H, H)), "bz": np.zeros(H),
    "Wr": rng.standard_normal((H, D)), "Ur": rng.standard_normal((H, H)), "br": np.zeros(H),
    "Wh": rng.standard_normal((H, D)), "Uh": rng.standard_normal((H, H)), "bh": np.zeros(H),
}
h = np.zeros(H)
for t in range(5):                      # run a length-5 sequence
    h = gru_step(rng.standard_normal(D), h, P)
print(h.shape)                          # -> (3,)
`}</CodeBlock>
  <p><strong>Why gradients flow better.</strong> When the update gate <M>{"z_t \\to 0"}</M>, the recurrence becomes <M>{"h_t \\approx h_{t-1}"}</M>, an identity skip connection across time. The cell-to-cell Jacobian then has terms near <M>{"(1 - z_t)"}</M> on the diagonal, so the product over many steps can stay close to 1 instead of decaying like the <M>{"\\prod W_h^{\\top}"}</M> of a vanilla RNN. The GRU folds the LSTM&apos;s forget and input gates into one update gate and drops the separate cell state, giving fewer parameters with similar long-range behavior.</p>
</InterviewProblem>

      </>
  );
}
