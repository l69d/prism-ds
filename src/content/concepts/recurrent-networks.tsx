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
    </>
  );
}
