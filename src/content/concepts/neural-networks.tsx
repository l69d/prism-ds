"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { MB } from "@/components/content/math";
import Link from "next/link";
import { Quiz } from "@/components/content/quiz";
import { NeuralNetPlayground } from "@/components/viz/neural-net";

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
    </>
  );
}
