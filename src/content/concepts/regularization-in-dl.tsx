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
    <h2>Interview practice</h2>

<InterviewProblem question="Why does dropout act as a regularizer, and what changes between training and inference?" difficulty="easy" tag="Conceptual">
  <p>Dropout randomly zeros each unit with probability <M>{"p"}</M> on every forward pass during training. This breaks fragile co-adaptations: a unit cannot rely on a specific partner always being present, so it must learn features that are useful in many random sub-networks. Effectively you train an exponential ensemble of thinned networks that share weights, and averaging an ensemble reduces variance.</p>
  <ul>
    <li><strong>Training:</strong> sample a fresh binary mask per forward pass and drop units.</li>
    <li><strong>Inference:</strong> use the full network with no dropping, so the prediction is deterministic.</li>
  </ul>
  <p>To keep the expected pre-activation constant across the two modes, frameworks use <strong>inverted dropout</strong>: during training the kept activations are scaled up by <M>{"1/(1-p)"}</M>, so at test time nothing extra is needed. Without this scaling, every unit at test time would receive an input roughly <M>{"(1-p)"}</M> times larger than it saw during training, shifting the activation statistics.</p>
</InterviewProblem>

<InterviewProblem question="Show that L2 weight decay is equivalent to adding a Gaussian prior on the weights, and describe its effect on a single weight per step." difficulty="medium" tag="Math">
  <p>Adding an L2 penalty means we minimize</p>
  <MB>{"\\tilde{L}(w) = L(w) + \\frac{\\lambda}{2}\\,\\lVert w \\rVert_2^2 ."}</MB>
  <p>From a Bayesian view, MAP estimation maximizes <M>{"\\log p(\\text{data}\\mid w) + \\log p(w)"}</M>. If we place a zero-mean Gaussian prior <M>{"w \\sim \\mathcal{N}(0, \\tau^2 I)"}</M>, then</p>
  <MB>{"\\log p(w) = -\\frac{1}{2\\tau^2}\\lVert w \\rVert_2^2 + \\text{const},"}</MB>
  <p>which is exactly the L2 term with <M>{"\\lambda = 1/\\tau^2"}</M>. A tighter prior (small <M>{"\\tau"}</M>) gives larger <M>{"\\lambda"}</M> and pulls weights harder toward zero.</p>
  <p>For the gradient step, differentiate: <M>{"\\nabla \\tilde{L} = \\nabla L + \\lambda w"}</M>, so the update is</p>
  <MB>{"w \\leftarrow w - \\eta\\nabla L - \\eta\\lambda w = (1 - \\eta\\lambda)\\,w - \\eta\\nabla L ."}</MB>
  <p>Each step first <strong>shrinks</strong> the weight by the multiplicative factor <M>{"(1 - \\eta\\lambda)"}</M> (hence &quot;weight decay&quot;) before applying the data gradient. Note this exact equivalence holds for plain SGD; for adaptive optimizers like Adam the penalty and the decay are <em>not</em> the same, which is why AdamW decouples decay from the gradient.</p>
</InterviewProblem>

<InterviewProblem question="A model trains to near-zero training loss but validation loss starts rising after epoch 8. Walk through how you would diagnose and fix this with regularization." difficulty="medium" tag="Applied">
  <p>The rising validation loss while training loss keeps falling is the classic signature of <strong>overfitting</strong>; the gap between the two curves is the generalization gap. I would attack it in roughly this order, cheapest and lowest-risk first.</p>
  <ul>
    <li><strong>Early stopping:</strong> the validation curve already tells me the best checkpoint is near epoch 8. Restore weights from the minimum-validation epoch with a patience window. This is free and often the single biggest win.</li>
    <li><strong>Weight decay / L2:</strong> increase <M>{"\\lambda"}</M> (with AdamW, not Adam + naive L2) to constrain weight magnitude. Sweep on a log scale, e.g. <M>{"10^{-5}"}</M> to <M>{"10^{-2}"}</M>.</li>
    <li><strong>Dropout:</strong> add or raise dropout in the higher-capacity layers (fully-connected heads first), typically <M>{"p \\in [0.2, 0.5]"}</M>.</li>
    <li><strong>Data augmentation / more data:</strong> often the most effective regularizer because it directly enlarges the effective dataset; cheap for images and text.</li>
    <li><strong>Reduce capacity:</strong> if the model is far larger than the data warrants, shrink width or depth.</li>
  </ul>
  <p>Crucially, I tune all of these against the validation set and confirm on a held-out test set only once, to avoid overfitting to validation. I would not just lower the learning rate, since that changes optimization speed, not the capacity-control problem causing the gap.</p>
</InterviewProblem>

<InterviewProblem question="Is batch normalization a regularizer, and what breaks when the batch size is very small? How does this affect train vs eval mode?" difficulty="hard" tag="Conceptual">
  <p>BatchNorm normalizes each feature using the <strong>mini-batch</strong> mean and variance, then applies a learned scale and shift <M>{"\\gamma, \\beta"}</M>. It has a regularizing side effect: because the per-example normalization depends on the other random examples in the batch, each example sees slightly different, noisy statistics every step. That stochasticity behaves like injected noise, which is why models with strong BatchNorm sometimes need less dropout. But its primary purpose is optimization (smoother loss landscape, stable activation scales), so it is a weak and incidental regularizer, not a reliable substitute for dropout or weight decay.</p>
  <p>Train vs eval differ fundamentally:</p>
  <ul>
    <li><strong>Train:</strong> normalize with the current batch statistics, and update running estimates of mean and variance.</li>
    <li><strong>Eval:</strong> use the frozen running statistics so predictions are deterministic and independent of which other samples happen to share the batch.</li>
  </ul>
  <p>With very small batches the batch statistics become high-variance and biased estimates of the true moments, so the regularizing noise turns into damaging noise and the running averages converge poorly. Training destabilizes and the train/eval mismatch grows. Forgetting to call eval mode is a common bug that makes inference results jitter. Fixes include larger batches, or switching to a normalization that does not depend on the batch axis such as <strong>GroupNorm</strong> or <strong>LayerNorm</strong> (LayerNorm is the standard choice in Transformers for exactly this batch-independence reason).</p>
</InterviewProblem>

<InterviewProblem question="Implement inverted dropout for a single layer in NumPy, for both training and inference." difficulty="medium" tag="Coding">
  <p>The key details: sample a fresh Bernoulli mask each training call, scale kept units by <M>{"1/(1-p)"}</M> so the expected value is preserved, and do nothing special at test time.</p>
  <CodeBlock language="python" filename="dropout.py">{`import numpy as np

def dropout_forward(x, p, training, rng=None):
    """Inverted dropout. p = probability of DROPPING a unit."""
    if not training or p == 0.0:
        return x, None  # identity at inference

    rng = rng or np.random.default_rng()
    keep = 1.0 - p
    # mask is 1 for kept units, 0 for dropped; scale up by 1/keep
    mask = (rng.random(x.shape) < keep) / keep
    return x * mask, mask

# sanity check: expected activation is preserved under the mask
rng = np.random.default_rng(0)
x = np.ones((100000,))
out, _ = dropout_forward(x, p=0.4, training=True, rng=rng)
print(out.mean())   # ~1.0, not 0.6, thanks to the 1/keep rescale

# at inference the input passes through unchanged
out_eval, _ = dropout_forward(x, p=0.4, training=False)
print(out_eval.mean())  # exactly 1.0`}</CodeBlock>
  <p>The matching backward pass simply routes the upstream gradient through the same mask: <M>{"dx = dout \\cdot \\text{mask}"}</M>. Because the mask already includes the <M>{"1/(1-p)"}</M> factor, the gradient scaling is handled automatically and no test-time adjustment is required.</p>
</InterviewProblem>

      </>
  );
}
