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
      <p>An optimizer is the rule that decides how to update a model&apos;s weights once you know the gradient of the loss. The gradient says which way is downhill; the optimizer decides how big a step to take and in what direction.</p>

      <KeyIdea>Every optimizer is a recipe for turning gradients into weight updates. The differences come down to two tricks: averaging gradients over time (momentum) and scaling each parameter&apos;s step by how noisy or steep its history has been (adaptive rates).</KeyIdea>

      <h2>From SGD to Adam</h2>
      <p>Plain <strong>stochastic gradient descent</strong> (SGD) takes a fixed-size step straight down the gradient on a mini-batch. It works, but it zig-zags in steep ravines and crawls on flat plateaus. The famous optimizers fix these two failure modes:</p>
      <ul>
        <li><strong>Momentum</strong> accumulates a velocity from past gradients, so consistent directions build speed and noisy oscillations cancel out.</li>
        <li><strong>RMSProp</strong> keeps a running average of squared gradients and divides the step by its square root, giving each parameter its own adaptive learning rate.</li>
        <li><strong>Adam</strong> combines both: momentum on the gradient and RMSProp-style scaling, with a bias correction for the early steps.</li>
      </ul>

      <Basic>
        <p>Imagine rolling a ball down a bumpy valley. SGD is a ball with no mass that jerks toward whatever direction is steepest right now, so it rattles side to side. <strong>Momentum</strong> gives the ball weight: it keeps rolling in the direction it was already going, smoothing out the rattling and powering through small bumps. <strong>RMSProp</strong> is like giving the ball brakes that grip harder on directions where the slope keeps changing wildly, so it does not overshoot. <strong>Adam</strong> is the ball with both weight and smart brakes, which is why it is the default first thing most people reach for.</p>
      </Basic>

      <Advanced>
        <p>Let <M>{"g_t = \\nabla_\\theta L(\\theta_t)"}</M> be the mini-batch gradient. SGD with momentum maintains a velocity and updates:</p>
        <MB>{"v_t = \\beta v_{t-1} + g_t, \\qquad \\theta_{t+1} = \\theta_t - \\eta\\, v_t"}</MB>
        <p>Adam tracks a first moment (mean) and second moment (uncentered variance) of the gradient, then bias-corrects them:</p>
        <MB>{"m_t = \\beta_1 m_{t-1} + (1-\\beta_1) g_t, \\qquad v_t = \\beta_2 v_{t-1} + (1-\\beta_2) g_t^2"}</MB>
        <MB>{"\\hat{m}_t = \\frac{m_t}{1-\\beta_1^t}, \\qquad \\hat{v}_t = \\frac{v_t}{1-\\beta_2^t}, \\qquad \\theta_{t+1} = \\theta_t - \\eta\\, \\frac{\\hat{m}_t}{\\sqrt{\\hat{v}_t} + \\epsilon}"}</MB>
        <p>The per-parameter division by <M>{"\\sqrt{\\hat{v}_t}"}</M> is the adaptive scaling; the bias correction matters because <M>{"m_0 = v_0 = 0"}</M> makes the early estimates biased toward zero.</p>
      </Advanced>

      <Callout kind="insight" title="Why Adam is the safe default">
        Adam needs little learning-rate tuning to get reasonable results, because each parameter rescales its own step. That robustness is why it dominates research prototypes and Transformer training. Well-tuned SGD with momentum, however, often generalizes slightly better on convolutional vision models.
      </Callout>

      <CodeBlock language="python" filename="optimizers.py">{`import torch

model = torch.nn.Linear(10, 1)

# The default workhorse: Adam (with decoupled weight decay = AdamW)
opt = torch.optim.AdamW(model.parameters(), lr=3e-4, weight_decay=0.01)

# Classic alternative: SGD + momentum, often paired with an LR schedule
# opt = torch.optim.SGD(model.parameters(), lr=0.1, momentum=0.9)

x = torch.randn(32, 10)
target = torch.randn(32, 1)

opt.zero_grad()                       # clear stale gradients
loss = ((model(x) - target) ** 2).mean()
loss.backward()                       # compute g_t
opt.step()                            # apply the optimizer's update rule
`}</CodeBlock>

      <Callout kind="pitfall" title="Forgetting zero_grad">
        In PyTorch, gradients accumulate by default. If you skip <strong>opt.zero_grad()</strong> each iteration, the new gradient is added on top of the old one, silently corrupting every update. Always clear before backward.
      </Callout>

      <MoreDepth>
        <p>A subtle but important detail: the original Adam folds L2 regularization into the gradient, which interacts badly with the adaptive denominator and effectively shrinks weight decay for parameters with large gradients. <strong>AdamW</strong> fixes this by decoupling weight decay from the gradient step, applying it directly to the weights. This single change measurably improves generalization and is why AdamW, not vanilla Adam, is the de facto standard for training large Transformers today.</p>
      </MoreDepth>

      <Quiz question="What is the core difference between SGD with momentum and Adam?" options={[
        { text: "Adam adds a per-parameter adaptive learning rate via a running average of squared gradients, on top of momentum.", correct: true, why: "Adam combines momentum (first moment) with RMSProp-style scaling by the square root of the second moment, giving each parameter its own effective step size." },
        { text: "Momentum uses the gradient while Adam ignores it entirely.", why: "Adam still relies on the gradient; it just smooths and rescales it. It cannot update without g_t." },
        { text: "Adam uses a larger fixed learning rate that never changes per parameter.", why: "Adam's whole point is that the effective step size varies per parameter and over time, not a single fixed rate." },
        { text: "Momentum is only for convex problems, while Adam only works on non-convex ones.", why: "Both are used across convex and non-convex settings; this is not the distinguishing factor." },
      ]} />
    </>
  );
}
