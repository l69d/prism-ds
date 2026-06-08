"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { Quiz } from "@/components/content/quiz";
import { GradientDescentViz } from "@/components/viz/gradient-descent-viz";

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
    </>
  );
}
