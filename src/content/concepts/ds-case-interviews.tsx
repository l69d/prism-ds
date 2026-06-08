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
      <p>A data-science case interview is not a quiz with a hidden right answer. It is a structured conversation where the interviewer watches <em>how</em> you decompose an open, ambiguous problem.</p>

      <KeyIdea>Cases reward a visible, repeatable structure: clarify the goal, decompose it into measurable pieces, and reason out loud so the interviewer can follow your thinking.</KeyIdea>

      <h2>The three case families</h2>
      <p>Almost every DS case falls into one of three shapes. Recognizing the type early lets you pick the right framework.</p>
      <ul>
        <li><strong>Product / metrics:</strong> &quot;How would you measure the success of feature X?&quot; Define the goal, propose a North-Star metric plus guardrails, and reason about tradeoffs.</li>
        <li><strong>Diagnostic / root-cause:</strong> &quot;Daily active users dropped 8% — what happened?&quot; Segment by dimensions, isolate internal vs external causes, and rule out instrumentation bugs first.</li>
        <li><strong>Modeling / experiment:</strong> &quot;Build a model to predict churn&quot; or &quot;design an A/B test.&quot; Frame the target, features, evaluation metric, and how the model ships into a decision.</li>
      </ul>

      <h2>A reusable framework</h2>
      <Basic>
        <p>Think of every case as four moves you make slowly and out loud. First <strong>clarify</strong>: restate the question and ask what success means and who the user is. Second <strong>structure</strong>: lay out the few buckets you&apos;ll consider before diving into any one. Third <strong>analyze</strong>: go deep on the highest-leverage bucket with concrete numbers or a metric. Fourth <strong>recommend</strong>: state a decision, name the biggest risk, and what you&apos;d check next. The structure itself is most of the score.</p>
      </Basic>
      <Advanced>
        <p>For metric design, distinguish the optimization target from constraints. A good North-Star metric is sensitive to the feature, hard to game, and tied to long-run value. When trading off a primary metric against a guardrail, you are implicitly maximizing a constrained objective:</p>
        <MB>{"\\max_{a}\; \\mathbb{E}[\\text{value}\\mid a] \\quad \\text{s.t.}\\quad \\mathbb{E}[\\text{harm}\\mid a] \\le \\tau"}</MB>
        <p>For experiment cases, size the test before defending it. The required per-arm sample for detecting a lift of <M>{"\\delta"}</M> at significance <M>{"\\alpha"}</M> and power <M>{"1-\\beta"}</M> scales as:</p>
        <MB>{"n \\approx \\frac{2\\,(z_{1-\\alpha/2}+z_{1-\\beta})^2\\,\\sigma^2}{\\delta^2}"}</MB>
        <p>Smaller effects and noisier metrics demand quadratically more traffic — the single most common quantitative slip candidates make.</p>
      </Advanced>

      <Callout kind="pitfall" title="Jumping straight to the model">
        Candidates who open a churn case with &quot;I&apos;d use XGBoost&quot; lose points. State the business decision the prediction drives first; the model and metric follow from the decision, not the other way around.
      </Callout>

      <h2>Working a diagnostic case</h2>
      <p>When a metric moves, treat it as a measurement before treating it as a fact. Confirm the drop is real, then decompose.</p>
      <CodeBlock language="python" filename="diagnose_drop.py">{`import pandas as pd

# Step 1: is the drop real, or an instrumentation gap?
daily = df.groupby("date")["dau"].sum()
print(daily.pct_change().tail(7))   # confirm magnitude + timing

# Step 2: decompose by segments to localize the cause
for dim in ["platform", "country", "app_version", "new_vs_returning"]:
    seg = (df.groupby([dim, "date"])["dau"].sum()
             .unstack("date").pct_change(axis=1).iloc[:, -1])
    print(dim, seg.sort_values().head(3))  # which slice fell hardest?

# A drop isolated to one app_version => likely a release bug,
# not a market-wide demand shift.`}</CodeBlock>

      <MoreDepth>
        <p>Senior signal: name your assumptions and quantify uncertainty without being asked. Instead of &quot;engagement will go up,&quot; say &quot;I expect a 2-4% session-length lift, but novelty effects can inflate week-one — I&apos;d hold out a cohort and read the metric at 28 days.&quot; Acknowledging novelty effects, network effects, and Simpson&apos;s paradox in segmentation separates strong candidates from mechanical ones.</p>
      </MoreDepth>

      <Quiz question="In a metrics case, why pair a North-Star metric with guardrail metrics?" options={[
        { text: "Guardrails replace the North-Star once the feature launches", why: "They run alongside it permanently; they do not replace the primary success metric." },
        { text: "Guardrails catch harm a single optimized metric would hide or incentivize", correct: true, why: "Optimizing one metric can degrade others (e.g. engagement up but retention down); guardrails constrain that." },
        { text: "Guardrails make the experiment reach significance faster", why: "More metrics do not increase power; they can require multiple-comparison correction." },
        { text: "Guardrails are only needed for modeling cases, not product cases", why: "Guardrails are a product-metric concept and apply directly to product and metric cases." },
      ]} />
    </>
  );
}
