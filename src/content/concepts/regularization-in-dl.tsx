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
      <p>Deep nets have enough capacity to memorize their training set outright. Regularization is the collection of tricks that push a model to learn patterns that generalize instead of patterns that merely fit the noise.</p>

      <KeyIdea>Every regularizer is a way of telling the network &quot;prefer simpler explanations.&quot; Whether by shrinking weights, injecting noise, or stopping early, you trade a little training accuracy for a lot of test accuracy.</KeyIdea>

      <h2>The four workhorses</h2>
      <p>Modern training almost always combines several of these, because each targets overfitting from a different angle:</p>
      <ul>
        <li><strong>Weight decay</strong> penalizes large weights, biasing the network toward smooth, low-magnitude functions.</li>
        <li><strong>Dropout</strong> randomly zeros activations during training so no single neuron becomes indispensable.</li>
        <li><strong>Batch normalization</strong> standardizes each layer&apos;s inputs per mini-batch, smoothing the loss surface and adding mild noise.</li>
        <li><strong>Early stopping</strong> halts training when validation loss stops improving, before the model starts memorizing.</li>
      </ul>

      <Basic>
        <p>Imagine a student cramming for an exam. If they memorize the exact answer key, they ace the practice test but fail the real one. Regularization is like forcing them to study with distractions, cover up half their notes, and stop before they burn out, so they learn the underlying ideas instead of the answer key.</p>
        <p>Dropout is the &quot;cover half your notes&quot; part: the network can never rely on one neuron always being present, so it spreads knowledge across many. Early stopping is &quot;quit while you&apos;re ahead.&quot;</p>
      </Basic>

      <Advanced>
        <p>Weight decay adds an <M>{"L_2"}</M> penalty to the loss, shrinking weights toward zero:</p>
        <MB>{"\\mathcal{L}_{\\text{reg}} = \\mathcal{L}(\\theta) + \\frac{\\lambda}{2} \\lVert \\theta \\rVert_2^2"}</MB>
        <p>The gradient update becomes <M>{"\\theta \\leftarrow (1 - \\eta\\lambda)\\theta - \\eta \\nabla \\mathcal{L}"}</M>, i.e. multiplicative decay each step. Dropout with keep-probability <M>{"p"}</M> scales each activation by a Bernoulli mask <M>{"m_i \\sim \\text{Bernoulli}(p)"}</M>; at test time we use the full network but rescale by <M>{"p"}</M> (or, with inverted dropout, scale by <M>{"1/p"}</M> at train time). This approximates averaging an exponential ensemble of sub-networks.</p>
        <p>Batch norm normalizes a pre-activation as <M>{"\\hat{x} = (x - \\mu_B)/\\sqrt{\\sigma_B^2 + \\epsilon}"}</M>, then applies learnable scale and shift <M>{"\\gamma \\hat{x} + \\beta"}</M>, decoupling the optimization of each layer from shifts in earlier layers.</p>
      </Advanced>

      <Callout kind="pitfall" title="Weight decay is not always L2 with Adam">With adaptive optimizers, naive L2 penalty gets divided by the per-parameter learning rate and stops behaving like true decay. Use <strong>AdamW</strong>, which decouples weight decay from the gradient step, or your regularization will be silently weaker than you think.</Callout>

      <CodeBlock language="python" filename="regularized_mlp.py">{`import torch.nn as nn
from torch.optim import AdamW

model = nn.Sequential(
    nn.Linear(784, 256),
    nn.BatchNorm1d(256),   # smooths the loss surface
    nn.ReLU(),
    nn.Dropout(p=0.5),     # drop half the activations at train time
    nn.Linear(256, 10),
)

# AdamW decouples weight decay from the adaptive step
opt = AdamW(model.parameters(), lr=1e-3, weight_decay=1e-2)

# Early stopping: track val loss, keep best weights
best, patience, bad = float("inf"), 5, 0
# inside the training loop:
#   if val_loss < best: best, bad = val_loss, 0; save(model)
#   else: bad += 1
#   if bad >= patience: break   # stop before overfitting
`}</CodeBlock>

      <MoreDepth>
        <p>Batch norm and dropout interact badly when stacked carelessly. Dropout changes the variance of activations at train time but not at test time, which shifts the running statistics batch norm relies on, the so-called &quot;variance shift.&quot; Putting dropout <em>before</em> a BN layer is the usual culprit. The common fixes are to place dropout only after the last BN layer, or to skip dropout entirely in conv nets and lean on BN plus weight decay, which is exactly what ResNets do.</p>
      </MoreDepth>

      <Quiz question="Why must dropout behave differently at training versus inference time?" options={[
        { text: "Because at inference we use the full network, so activations must be rescaled to match the expected magnitude seen during training.", correct: true, why: "Dropping a fraction of units reduces expected activation magnitude; using all units at test time requires rescaling (by p, or 1/p at train) to keep the expectation consistent." },
        { text: "Because dropout permanently removes neurons, so fewer exist at test time.", why: "Dropout zeros activations stochastically per step; no neurons are permanently removed." },
        { text: "Because gradients are only computed at inference time.", why: "Gradients are computed during training, not inference." },
        { text: "Because batch norm requires dropout to be disabled to function at all.", why: "BN and dropout are independent; BN does not require dropout to be off, though they can interact." },
      ]} />
    </>
  );
}
