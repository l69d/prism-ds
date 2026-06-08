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
    <h2>Interview practice</h2>
<InterviewProblem question="What problem does momentum solve over vanilla SGD, and how does it work?" difficulty="easy" tag="Conceptual">
  <p>Vanilla SGD takes a step proportional to the current gradient: <M>{"\\theta_{t+1} = \\theta_t - \\eta\\, g_t"}</M>. In long, narrow ravines the gradient points mostly across the valley walls, so SGD zig-zags &mdash; oscillating along steep directions while crawling along the shallow direction toward the minimum.</p>
  <p>Momentum accumulates an exponentially-decayed running average of past gradients (a &quot;velocity&quot;) and steps along that:</p>
  <MB>{"v_t = \\mu\\, v_{t-1} + g_t, \\qquad \\theta_{t+1} = \\theta_t - \\eta\\, v_t"}</MB>
  <p>The benefit:</p>
  <ul>
    <li><strong>Oscillating directions cancel.</strong> Components that flip sign each step average toward zero, damping the zig-zag.</li>
    <li><strong>Consistent directions accumulate.</strong> The shallow, persistent component adds up, effectively amplifying the learning rate there by roughly <M>{"1/(1-\\mu)"}</M> at steady state.</li>
  </ul>
  <p>Typical <M>{"\\mu \\approx 0.9"}</M>, giving about a 10&times; effective speed-up along stable directions. Nesterov momentum refines this by evaluating the gradient at the look-ahead point <M>{"\\theta_t - \\eta\\mu v_{t-1}"}</M>, which corrects overshoot a bit sooner.</p>
</InterviewProblem>
<InterviewProblem question="Why does Adam use bias correction, and what goes wrong without it?" difficulty="medium" tag="Math">
  <p>Adam keeps two EMAs: first moment <M>{"m_t = \\beta_1 m_{t-1} + (1-\\beta_1) g_t"}</M> and second moment <M>{"v_t = \\beta_2 v_{t-1} + (1-\\beta_2) g_t^2"}</M>, both initialized at zero. That zero init biases the estimates toward zero early in training.</p>
  <p>Unroll the first moment with constant gradient <M>{"g"}</M>:</p>
  <MB>{"m_t = (1-\\beta_1)\\sum_{i=1}^{t}\\beta_1^{\\,t-i} g = g\\,(1 - \\beta_1^{\\,t})"}</MB>
  <p>So <M>{"\\mathbb{E}[m_t] = (1-\\beta_1^{\\,t})\\,\\mathbb{E}[g_t]"}</M> &mdash; underestimated by the factor <M>{"(1-\\beta_1^{\\,t})"}</M>. Dividing by it removes the bias:</p>
  <MB>{"\\hat{m}_t = \\frac{m_t}{1-\\beta_1^{\\,t}}, \\qquad \\hat{v}_t = \\frac{v_t}{1-\\beta_2^{\\,t}}"}</MB>
  <p><strong>What breaks without it:</strong> with <M>{"\\beta_2 = 0.999"}</M>, at <M>{"t=1"}</M> the raw <M>{"v_1"}</M> is only <M>{"0.001\\,g_1^2"}</M> &mdash; a thousand times too small. The update <M>{"\\hat{m}_t/(\\sqrt{\\hat{v}_t}+\\epsilon)"}</M> would then explode, producing huge, unstable first steps. Bias correction is largest exactly when <M>{"t"}</M> is small and decays to 1, so it only matters during warm-up.</p>
</InterviewProblem>
<InterviewProblem question="Adam usually trains faster than SGD, yet many vision papers report SGD+momentum generalizes better. How do you reason about which to pick?" difficulty="hard" tag="Applied">
  <p>The two optimizers are not interchangeable; they bias the solution differently.</p>
  <ul>
    <li><strong>Why Adam is fast:</strong> the per-parameter <M>{"1/\\sqrt{\\hat{v}_t}"}</M> scaling adapts the effective step to each coordinate&apos;s gradient magnitude. This is huge for sparse or wildly-scaled gradients (embeddings, attention, Transformers), so it dominates NLP and large language models.</li>
    <li><strong>Why SGD can generalize better:</strong> adaptive methods can converge to sharper, lower-margin minima. The uniform, isotropic noise of plain SGD acts as an implicit regularizer that favors flatter minima, which often test better &mdash; a well-documented gap on CIFAR/ImageNet CNNs.</li>
  </ul>
  <p>Practical guidance:</p>
  <ul>
    <li>For Transformers / NLP / sparse features: start with Adam or AdamW. Use <strong>AdamW</strong>, not Adam + L2, because Adam&apos;s scaling distorts coupled weight decay; decoupled decay restores proper regularization.</li>
    <li>For CNNs / vision where you can afford tuning: SGD + momentum with a cosine or step LR schedule is a strong, often state-of-the-art baseline.</li>
    <li>Don&apos;t compare at one learning rate. Adam and SGD have different optimal LRs (Adam often <M>{"\\sim 10^{-3}"}</M>, SGD often <M>{"\\sim 10^{-1}"}</M>). Tune each before declaring a winner.</li>
    <li>A robust compromise: train with Adam early for speed, then switch to SGD for the tail (SWATS-style), capturing both fast progress and flat-minimum generalization.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="Implement one Adam update step in NumPy from scratch, given the gradient." difficulty="medium" tag="Coding">
  <p>The state is the parameter, the two moment buffers, and the step counter. Each call updates the moments, applies bias correction, then takes the scaled step.</p>
  <CodeBlock language="python" filename="adam_step.py">{`import numpy as np

class Adam:
    def __init__(self, params, lr=1e-3, betas=(0.9, 0.999), eps=1e-8):
        self.lr = lr
        self.b1, self.b2 = betas
        self.eps = eps
        self.theta = params.astype(np.float64)
        self.m = np.zeros_like(self.theta)   # 1st moment EMA
        self.v = np.zeros_like(self.theta)   # 2nd moment EMA
        self.t = 0

    def step(self, grad):
        self.t += 1
        # update biased moment estimates
        self.m = self.b1 * self.m + (1 - self.b1) * grad
        self.v = self.b2 * self.v + (1 - self.b2) * grad**2
        # bias-correct
        m_hat = self.m / (1 - self.b1**self.t)
        v_hat = self.v / (1 - self.b2**self.t)
        # parameter update
        self.theta -= self.lr * m_hat / (np.sqrt(v_hat) + self.eps)
        return self.theta

# sanity check: minimize f(x) = (x - 3)^2, grad = 2(x - 3)
opt = Adam(np.array([0.0]), lr=0.1)
for _ in range(500):
    g = 2 * (opt.theta - 3.0)
    opt.step(g)
print(opt.theta)   # -> approx [3.0]`}</CodeBlock>
  <p>Two things interviewers probe: (1) <strong>where bias correction goes</strong> &mdash; on the read-out <M>{"\\hat{m},\\hat{v}"}</M>, not on the stored buffers; and (2) the <M>{"+\\epsilon"}</M> sits <strong>outside</strong> the square root in standard Adam, guarding against division by zero when a coordinate&apos;s gradients are tiny.</p>
</InterviewProblem>

      </>
  );
}
