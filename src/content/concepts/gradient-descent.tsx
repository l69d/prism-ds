"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { Quiz } from "@/components/content/quiz";
import { GradientDescentViz } from "@/components/viz/gradient-descent-viz";
import { InterviewProblem } from "@/components/content/interview-problem";
import { CodeBlock } from "@/components/content/code-block";

export default function GradientDescentContent() {
  return (
    <>
      <p>
        Gradient descent is the optimization engine behind almost every model that learns — from
        linear regression to giant neural networks. The idea is beautifully simple:{" "}
        <strong>to find the bottom of a valley, keep stepping downhill.</strong>
      </p>

      <KeyIdea>
        The <strong>gradient</strong> points in the direction of steepest <em>increase</em>. So to
        minimize a loss, step in the <em>opposite</em> direction. Repeat, and you roll toward a minimum.
        The only real knob is how big each step is — the <strong>learning rate</strong>.
      </KeyIdea>

      <p>
        Roll the ball down the loss curve below. Crank the learning rate up until it overshoots and
        diverges; drop it until progress crawls. Move the start point into the other valley to see how
        gradient descent can get stuck in a <strong>local minimum</strong>.
      </p>

      <GradientDescentViz />

      <h2>The update rule</h2>
      <Basic>
        <p>
          At each step: measure the slope under your feet, then move a little way downhill. A small
          step is safe but slow; a big step is fast but can overshoot and bounce out of the valley.
          When the ground goes flat (slope ≈ 0), you&apos;ve arrived.
        </p>
      </Basic>
      <Advanced>
        <p>For parameters <M>{"\\theta"}</M> and learning rate <M>{"\\eta"}</M>:</p>
        <MB>{"\\theta_{t+1} = \\theta_t - \\eta \\, \\nabla_\\theta \\mathcal{L}(\\theta_t)"}</MB>
        <p>
          The step size is <M>{"\\eta"}</M> times the gradient magnitude — so steps shrink naturally as
          you near a minimum. Too large an <M>{"\\eta"}</M> and the quadratic approximation breaks,
          producing the divergence you can trigger above.
        </p>
      </Advanced>

      <Callout kind="warning" title="The learning rate is everything">
        Too small → painfully slow and may stall in flat regions. Too large → overshoots, oscillates,
        or blows up. Practitioners use <strong>schedules</strong> (decay over time) and{" "}
        <strong>adaptive optimizers</strong> like Adam that tune a per-parameter step size automatically.
      </Callout>

      <h2>Batch, stochastic, mini-batch</h2>
      <ul>
        <li><strong>Batch</strong> — use the whole dataset per step. Stable but slow and memory-hungry.</li>
        <li><strong>Stochastic (SGD)</strong> — one example per step. Noisy, but the noise helps escape shallow minima.</li>
        <li><strong>Mini-batch</strong> — a few dozen to a few hundred at a time. The practical default everywhere.</li>
      </ul>

      <MoreDepth>
        <p>
          In high dimensions, the real obstacle usually isn&apos;t local minima — it&apos;s{" "}
          <strong>saddle points</strong> and long, flat ravines, where the gradient is tiny in some
          directions and steep in others. <strong>Momentum</strong> accumulates a velocity to power
          through flats and damp oscillation; <strong>Adam</strong> combines momentum with per-parameter
          scaling. Non-convexity means we rarely find the global optimum — but for over-parameterized
          networks, the many good-enough minima generalize surprisingly well.
        </p>
      </MoreDepth>

      <Quiz
        question="Your loss explodes to NaN within a few training steps. What's the most likely fix to try first?"
        options={[
          { text: "Lower the learning rate.", correct: true, why: "Diverging/NaN loss is the classic symptom of too-large a step size." },
          { text: "Add more layers.", why: "More capacity won't fix an unstable optimizer; it often makes it worse." },
          { text: "Train for more epochs.", why: "If it's already diverging, more steps make it worse." },
          { text: "Remove the loss function.", why: "You need a loss to optimize at all." },
        ]}
      />
    <h2>Interview practice</h2>
<InterviewProblem question="Why does gradient descent move in the direction of the negative gradient, and not some other direction?" difficulty="easy" tag="Conceptual">
  <p>The gradient <M>{"\\nabla L(\\theta)"}</M> is the vector of partial derivatives, and it points in the direction of <strong>steepest ascent</strong> of the loss. We want to <strong>minimize</strong> loss, so we step the opposite way.</p>
  <p>More formally, the first-order Taylor expansion around the current point is:</p>
  <MB>{"L(\\theta + \\Delta\\theta) \\approx L(\\theta) + \\nabla L(\\theta)^\\top \\Delta\\theta"}</MB>
  <p>To decrease <M>{"L"}</M> the most for a fixed step size <M>{"\\lVert \\Delta\\theta \\rVert"}</M>, we minimize the dot product <M>{"\\nabla L^\\top \\Delta\\theta"}</M>. By Cauchy&ndash;Schwarz this is most negative when <M>{"\\Delta\\theta"}</M> points exactly opposite to the gradient, giving the update:</p>
  <MB>{"\\theta_{t+1} = \\theta_t - \\eta\\, \\nabla L(\\theta_t)"}</MB>
  <p>So the negative gradient is the locally optimal descent direction. Note this is only a <strong>local</strong> guarantee &mdash; far from the current point the linear approximation breaks down, which is exactly why the step size <M>{"\\eta"}</M> matters.</p>
</InterviewProblem>
<InterviewProblem question="A teammate's training loss explodes to NaN after a few steps; another's barely moves over thousands of epochs. Both blame the data. What do you check first and why?" difficulty="medium" tag="Applied">
  <p>The classic culprit is the <strong>learning rate</strong>, not the data. The two failure modes are mirror images:</p>
  <ul>
    <li><strong>Loss explodes / NaN:</strong> <M>{"\\eta"}</M> is too large. Each step overshoots the minimum and lands somewhere with a steeper gradient, so the next step overshoots further. Updates diverge and overflow to NaN. Fix: lower <M>{"\\eta"}</M> (try 3&ndash;10x smaller), add gradient clipping, and check for unnormalized features that inflate gradients.</li>
    <li><strong>Loss barely moves:</strong> <M>{"\\eta"}</M> is too small. Steps are tiny, so convergence crawls and the optimizer can stall on a plateau. Fix: raise <M>{"\\eta"}</M>, or use an adaptive optimizer (Adam) or a warmup-then-decay schedule.</li>
  </ul>
  <p>The &quot;just right&quot; regime decreases loss quickly and smoothly. A cheap diagnostic is the <strong>LR range test</strong>: train for a few hundred steps while exponentially increasing <M>{"\\eta"}</M>, plot loss vs. <M>{"\\eta"}</M>, and pick a value just below where the curve turns sharply upward.</p>
  <p>Why check this before the data: it&apos;s a one-line change with immediate feedback, and both symptoms are textbook signatures of a mistuned step size. There is also a theory anchor &mdash; for an <M>{"L"}</M>-smooth loss, convergence requires roughly <M>{"\\eta < 2/L"}</M>, so a large curvature (big <M>{"L"}</M>) demands a small step.</p>
</InterviewProblem>
<InterviewProblem question="In high dimensions, are local minima or saddle points the bigger obstacle for gradient descent, and how does momentum help?" difficulty="hard" tag="Conceptual">
  <p>In high-dimensional non-convex loss surfaces (deep nets), <strong>saddle points vastly outnumber bad local minima</strong>. Intuition: at a critical point the Hessian must be positive in every one of <M>{"d"}</M> directions to be a true minimum. If each curvature sign were roughly a coin flip, an all-positive configuration has probability about <M>{"2^{-d}"}</M> &mdash; vanishingly rare. Most critical points are therefore saddles, with a mix of up and down directions. Empirically, the local minima that <em>do</em> get found tend to have similar, near-optimal loss.</p>
  <p>Saddles hurt because the gradient becomes tiny near them, so plain GD slows to a near-stop on the flat directions even though escape directions exist.</p>
  <p><strong>Momentum</strong> helps by accumulating an exponentially weighted average of past gradients:</p>
  <MB>{"v_{t+1} = \\beta v_t + \\nabla L(\\theta_t), \\qquad \\theta_{t+1} = \\theta_t - \\eta\\, v_{t+1}"}</MB>
  <p>Effects:</p>
  <ul>
    <li><strong>Builds speed on flat/consistent directions</strong> &mdash; aligned gradients add up, so the &quot;ball&quot; coasts through the low-gradient region around a saddle and rolls off it.</li>
    <li><strong>Damps oscillation across narrow ravines</strong> &mdash; gradient components that flip sign step to step cancel in the average, so it zig-zags less and makes steadier progress along the valley floor.</li>
  </ul>
  <p>With <M>{"\\beta = 0.9"}</M> the effective step is roughly <M>{"1/(1-\\beta) = 10"}</M>x a single gradient on persistent directions, which is the speedup that lets it escape saddles where vanilla GD stalls.</p>
</InterviewProblem>
<InterviewProblem question="Contrast batch, stochastic, and mini-batch gradient descent on cost per step, gradient noise, and convergence. Then implement mini-batch GD for linear regression from scratch." difficulty="medium" tag="Coding">
  <p>All three estimate the same full-data gradient; they differ in how many examples <M>{"b"}</M> they use per update:</p>
  <ul>
    <li><strong>Batch</strong> (<M>{"b = N"}</M>): exact gradient, smooth descent, but every step scans the whole dataset &mdash; slow per step and memory-heavy.</li>
    <li><strong>Stochastic / SGD</strong> (<M>{"b = 1"}</M>): one example per step, very cheap and high-variance. The noise lets it escape shallow minima and saddles, but it never fully settles &mdash; it bounces around the optimum, so you typically decay <M>{"\\eta"}</M>.</li>
    <li><strong>Mini-batch</strong> (<M>{"1 \\ll b \\ll N"}</M>, e.g. 32&ndash;512): the practical default. Noise variance scales like <M>{"1/b"}</M>, so larger batches are smoother; it vectorizes well on GPUs and balances stability against per-step cost.</li>
  </ul>
  <p>Implementation of mini-batch GD minimizing MSE <M>{"L = \\frac{1}{b}\\lVert Xw - y \\rVert^2"}</M>, whose gradient is <M>{"\\frac{2}{b} X^\\top (Xw - y)"}</M>:</p>
  <CodeBlock language="python" filename="minibatch_gd.py">{`import numpy as np

def minibatch_gd(X, y, lr=0.01, batch_size=32, epochs=50, seed=0):
    rng = np.random.default_rng(seed)
    n, d = X.shape
    w = np.zeros(d)
    for _ in range(epochs):
        idx = rng.permutation(n)          # reshuffle each epoch
        for start in range(0, n, batch_size):
            b_idx = idx[start:start + batch_size]
            Xb, yb = X[b_idx], y[b_idx]
            resid = Xb @ w - yb
            grad = (2.0 / len(b_idx)) * (Xb.T @ resid)
            w -= lr * grad               # descent step
    return w`}</CodeBlock>
  <p>Key details an interviewer probes: <strong>reshuffling each epoch</strong> (prevents the model learning batch order), <strong>scaling the gradient by the batch size</strong> (so <M>{"\\eta"}</M> is comparable across batch sizes), and the rule of thumb that doubling <M>{"b"}</M> often lets you scale <M>{"\\eta"}</M> up to keep the gradient signal-to-noise ratio roughly constant.</p>
</InterviewProblem>

      </>
  );
}
