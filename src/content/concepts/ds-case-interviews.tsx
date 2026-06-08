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
    <h2>Interview practice</h2>
<InterviewProblem question="A product manager says weekly active users (WAU) dropped 8% last week. How would you structure your investigation?" difficulty="easy" tag="Case">
  <p>Resist diving into a hypothesis immediately. Structure the case along two axes before touching data.</p>
  <p><strong>1. Is the drop real?</strong></p>
  <ul>
    <li><strong>Instrumentation:</strong> Did logging change, did an app release break an event, is there a data-pipeline gap or late-arriving data for the most recent week?</li>
    <li><strong>Definition:</strong> Did anyone change how WAU is computed (dedup logic, bot filtering, timezone bucketing)?</li>
  </ul>
  <p><strong>2. If real, segment to localize it.</strong> The goal is to find where the drop concentrates so the cause becomes obvious. Cut by:</p>
  <ul>
    <li><strong>Internal factors:</strong> platform (iOS vs Android vs web), app version, new vs returning users, geography, acquisition channel.</li>
    <li><strong>External factors:</strong> seasonality (compare year-over-year, not just week-over-week), holidays, a competitor launch, a marketing campaign that ended.</li>
  </ul>
  <p>A drop isolated to one platform after a release points to a bug; a broad drop matching last year&apos;s same week points to seasonality. <strong>State your hypothesis, then name the one query that would confirm or kill it</strong> &mdash; interviewers reward this loop over a flat list of ideas.</p>
</InterviewProblem>
<InterviewProblem question="A ride-sharing team wants a single north-star metric for marketplace health. What would you propose and what are its failure modes?" difficulty="medium" tag="Case">
  <p>Pick a metric that captures delivered value, not vanity. A strong candidate is <strong>completed rides per active user per week</strong>, because it ties together both sides of the marketplace and only counts trips that actually happened.</p>
  <p>Justify it against alternatives:</p>
  <ul>
    <li><strong>Gross bookings ($):</strong> grows with price hikes even as rides fall &mdash; rewards the wrong thing.</li>
    <li><strong>Raw ride count:</strong> ignores the user base; can rise just from acquisition spend while per-user engagement rots.</li>
    <li><strong>Requests (not completions):</strong> counts demand the supply side failed to serve, so it can look healthy during an outage.</li>
  </ul>
  <p><strong>Failure modes &amp; guardrails.</strong> Any single metric can be gamed, so pair the north star with guardrails:</p>
  <ul>
    <li>It can rise while <strong>driver earnings</strong> or <strong>rider wait time</strong> degrade &mdash; track both as guardrails.</li>
    <li>Averages hide a collapsing power-law tail; complement with a <strong>retention / cohort</strong> view.</li>
    <li>It says nothing about <strong>unit economics</strong> &mdash; watch contribution margin so growth isn&apos;t bought with subsidies.</li>
  </ul>
  <p>The senior move is to frame it as <strong>one north star plus 2&ndash;3 guardrails</strong>, since marketplaces fail by sacrificing one side for the other.</p>
</InterviewProblem>
<InterviewProblem question="You ship a model to flag fraudulent transactions. Walk through how you would frame this as an ML case end to end." difficulty="hard" tag="Case">
  <p>Drive the case through the modeling lifecycle, surfacing the assumptions a strong candidate makes explicit.</p>
  <p><strong>1. Problem framing &amp; objective.</strong> Confirm it is binary classification with extreme class imbalance (fraud may be well under 1%). Crucially, the business objective is not accuracy &mdash; it is the dollar trade-off between <strong>fraud losses caught</strong> and <strong>false-positive friction</strong> (blocking good customers, manual-review cost).</p>
  <p><strong>2. Label &amp; leakage.</strong> Fraud labels arrive late (chargebacks land weeks later), so recent &quot;clean&quot; transactions may be mislabeled. Use a label-maturity cutoff and split <strong>by time</strong>, never randomly &mdash; a random split leaks future patterns and inflates offline metrics.</p>
  <p><strong>3. Metric.</strong> Accuracy is useless here; predicting &quot;not fraud&quot; scores 99%+. Optimize <strong>PR-AUC</strong> and report recall at a fixed, tolerable false-positive rate. Translate the chosen threshold into expected dollars:</p>
  <MB>{"\\text{Net} = (\\text{TP}\\cdot v_{\\text{fraud}}) - (\\text{FP}\\cdot c_{\\text{friction}}) - (\\text{FN}\\cdot v_{\\text{fraud}})"}</MB>
  <p>where <M>{"v_{\\text{fraud}}"}</M> is value saved per caught fraud and <M>{"c_{\\text{friction}}"}</M> the cost of a false block.</p>
  <p><strong>4. Model &amp; deployment.</strong> Start with gradient-boosted trees on transaction + behavioral features; they handle mixed types and need little scaling. Score in real time, route mid-confidence cases to <strong>manual review</strong> rather than auto-block, and monitor for <strong>drift</strong> &mdash; fraudsters adapt, so an offline-static model decays fast and needs a retraining cadence plus a feedback loop from analyst decisions.</p>
</InterviewProblem>
<InterviewProblem question="In an A/B test the treatment lifts conversion from 10.0% to 10.6% with 50,000 users per arm. Is this significant? Show the calculation." difficulty="medium" tag="Math">
  <p>Use a two-proportion z-test. The pooled rate is roughly <M>{"\\hat{p}=10.3\\%=0.103"}</M>. The standard error of the difference is:</p>
  <MB>{"\\text{SE}=\\sqrt{\\hat{p}(1-\\hat{p})\\left(\\tfrac{1}{n_1}+\\tfrac{1}{n_2}\\right)}=\\sqrt{0.103\\cdot 0.897\\cdot \\tfrac{2}{50000}}"}</MB>
  <p>That gives <M>{"\\text{SE}\\approx\\sqrt{3.70\\times10^{-6}}\\approx 0.00192"}</M>. The observed lift is <M>{"0.006"}</M>, so:</p>
  <MB>{"z=\\frac{0.006}{0.00192}\\approx 3.1"}</MB>
  <p>Since <M>{"|z|>1.96"}</M>, the result is significant at the 5% level (two-sided p &asymp; 0.002). But finish like a practitioner, not a calculator:</p>
  <ul>
    <li><strong>Practical vs statistical:</strong> a 0.6pp absolute lift (6% relative) may or may not clear the launch bar &mdash; check it against the minimum detectable effect set when the test was powered.</li>
    <li><strong>Peeking:</strong> if you stopped early upon seeing significance, the p-value is optimistic; honor the pre-registered sample size or use a sequential test.</li>
    <li><strong>Guardrails:</strong> confirm no offsetting harm (revenue per user, latency) before shipping on conversion alone.</li>
  </ul>
</InterviewProblem>

      </>
  );
}
