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
      <p>A model that scored beautifully on Monday can quietly rot by Friday. The world moves, but a deployed model is frozen at its training snapshot. Monitoring is how you notice the gap before your users do.</p>

      <KeyIdea>A model is only valid while the live data looks like its training data. Drift is the slow divergence between the two, and monitoring is the alarm that tells you when that divergence has grown large enough to retrain.</KeyIdea>

      <h2>Two kinds of drift</h2>
      <p>It helps to separate where the change happens. Both degrade performance, but they call for different fixes.</p>
      <ul>
        <li><strong>Data drift (covariate shift):</strong> the distribution of the inputs <M>{"P(X)"}</M> changes, but the true input-to-output relationship <M>{"P(Y \\mid X)"}</M> stays the same. Example: a new marketing campaign brings in a younger user base the model rarely saw.</li>
        <li><strong>Concept drift:</strong> the relationship <M>{"P(Y \\mid X)"}</M> itself changes. The same inputs now map to different outcomes. Example: a fraud pattern that was benign last year is now an attack vector.</li>
      </ul>

      <h2>How it works</h2>
      <Basic>
        <p>You cannot usually measure accuracy in real time because true labels arrive late (did this loan default? you find out in months). So you watch <strong>proxies</strong>. You compare the live feature distributions against a fixed reference window from training, and you watch the model&apos;s own output scores. If the inputs start looking strange, or the model suddenly predicts &quot;fraud&quot; ten times more often than usual, that is your early warning to investigate or retrain.</p>
      </Basic>
      <Advanced>
        <p>Drift detection is two-sample hypothesis testing over time. For a feature, compare a reference sample to a recent window. The <strong>Population Stability Index</strong> is a common bucketed divergence:</p>
        <MB>{"\\text{PSI} = \\sum_{i=1}^{B} (a_i - e_i)\\,\\ln\\!\\left(\\frac{a_i}{e_i}\\right)"}</MB>
        <p>where <M>{"e_i"}</M> and <M>{"a_i"}</M> are the expected (reference) and actual (live) proportions in bucket <M>{"i"}</M>. Rules of thumb: <M>{"\\text{PSI} < 0.1"}</M> is stable, <M>{"0.1\\text{--}0.25"}</M> is moderate, and <M>{"> 0.25"}</M> signals significant shift. PSI is a symmetric, binned cousin of the KL divergence <M>{"\\sum a_i \\ln(a_i / e_i)"}</M>. For continuous features the Kolmogorov-Smirnov statistic <M>{"D = \\sup_x |F_{\\text{live}}(x) - F_{\\text{ref}}(x)|"}</M> works without binning.</p>
      </Advanced>

      <Callout kind="pitfall" title="Drift is not the same as decay">
        Input drift does not always hurt accuracy, and stable inputs do not guarantee a healthy model. A feature can shift wildly while the model stays correct, and concept drift can crater accuracy with the input distribution barely moving. Always tie alerts back to a real or delayed performance metric, not to distribution distance alone.
      </Callout>

      <CodeBlock language="python" filename="psi.py">{`import numpy as np

def psi(reference, live, n_bins=10):
    # Fixed bucket edges from the reference (training) distribution
    edges = np.quantile(reference, np.linspace(0, 1, n_bins + 1))
    edges[0], edges[-1] = -np.inf, np.inf

    e = np.histogram(reference, bins=edges)[0] / len(reference)
    a = np.histogram(live, bins=edges)[0] / len(live)

    # Avoid log(0) / division by zero in sparse buckets
    eps = 1e-6
    e, a = np.clip(e, eps, None), np.clip(a, eps, None)
    return np.sum((a - e) * np.log(a / e))

ref = np.random.normal(0, 1, 10_000)
new = np.random.normal(0.5, 1.2, 5_000)   # shifted + wider
print(round(psi(ref, new), 3))            # ~0.3 -> investigate / retrain`}</CodeBlock>

      <MoreDepth>
        <p>Mature systems do not retrain on a fixed calendar; they retrain on a <strong>trigger</strong>. The decision is a cost trade-off: retraining has compute, validation, and rollout costs, while a stale model has an opportunity cost that grows with drift. A good policy combines a delayed ground-truth metric (when labels eventually land) with leading proxies (PSI, prediction-distribution shift, embedding distances for unstructured data). Beware the <strong>feedback loop</strong>: a model that influences its own future inputs (recommendations, credit approvals) manufactures drift, so your reference window must reflect the post-deployment regime, not the original training set, or you will chase a moving target you created.</p>
      </MoreDepth>

      <Quiz question="A credit model's input features show PSI well under 0.1 (very stable), yet its default-prediction accuracy has collapsed over the last quarter. What is the most likely explanation?" options={[
        { text: "Severe data drift in the inputs", why: "PSI under 0.1 means the input distribution is stable, so data drift is ruled out." },
        { text: "Concept drift: P(Y | X) changed while P(X) stayed the same", why: "Correct. Stable inputs with falling accuracy is the signature of concept drift, where the input-to-label relationship has shifted (e.g., an economic regime change).", correct: true },
        { text: "The PSI calculation must be buggy since drift always lowers accuracy", why: "Drift and accuracy decay are distinct; stable inputs can coexist with a broken concept, so the metric is not necessarily wrong." },
        { text: "Nothing is wrong; low PSI guarantees the model is healthy", why: "Low PSI only confirms input stability, not predictive correctness; concept drift is invisible to input-distribution monitoring." },
      ]} />
    <h2>Interview practice</h2>

<InterviewProblem question="What is the difference between data drift and concept drift, and why does the distinction matter operationally?" difficulty="easy" tag="Conceptual">
  <p>Both describe a model degrading after deployment, but they touch different parts of the joint distribution <M>{"P(X, y) = P(y \\mid X)\\,P(X)"}</M>.</p>
  <ul>
    <li><strong>Data drift (covariate shift):</strong> the input distribution <M>{"P(X)"}</M> changes while the relationship <M>{"P(y \\mid X)"}</M> stays the same. Example: a fraud model trained pre-holidays suddenly sees a flood of high-value gift-card purchases. The mapping from features to fraud is unchanged; you are just seeing inputs from a region the model rarely trained on.</li>
    <li><strong>Concept drift:</strong> the conditional <M>{"P(y \\mid X)"}</M> itself changes &mdash; the same inputs now imply a different label. Example: after a new scam tactic emerges, transactions that used to be benign are now fraudulent. The features look familiar but their meaning shifted.</li>
  </ul>
  <p>Why it matters operationally: <strong>data drift you can often detect without labels</strong> by watching feature distributions, and sometimes fix by reweighting or collecting data in the new region. <strong>Concept drift usually requires fresh labels to even detect</strong>, and the only real fix is retraining on recent data. Confusing the two leads to wasted effort &mdash; e.g. retraining on a shifted-but-still-valid input region when the model was actually fine, or endlessly re-tuning features when the underlying concept has moved.</p>
</InterviewProblem>

<InterviewProblem question="You ship a churn model. Two months later business metrics look worse but you have almost no fresh labels yet (churn is only confirmed after a 90-day window). How do you monitor for degradation and decide whether to retrain?" difficulty="medium" tag="Applied">
  <p>The core constraint is the <strong>label lag</strong>: ground truth arrives 90 days late, so you cannot wait for accuracy/AUC to tell you something is wrong. Build a layered monitoring stack that escalates from label-free to label-dependent signals.</p>
  <ul>
    <li><strong>Tier 1 &mdash; input/data drift (no labels needed):</strong> track per-feature distribution shift against the training reference using PSI or KS statistics, plus a multivariate detector (e.g. train a domain classifier to distinguish training vs. live inputs &mdash; high AUC means the input space has moved). This catches covariate shift immediately.</li>
    <li><strong>Tier 2 &mdash; prediction drift (no labels needed):</strong> monitor the distribution of the model&apos;s output scores and the predicted-positive rate. If the average churn score jumps from 8% to 20% with no business reason, something upstream changed (a broken feature pipeline, a new customer segment).</li>
    <li><strong>Tier 3 &mdash; proxy / leading labels:</strong> use early signals correlated with the eventual outcome &mdash; cancelled auto-renewals, support tickets, login frequency drops. These give a noisy but timely estimate of performance well before the 90-day truth lands.</li>
    <li><strong>Tier 4 &mdash; delayed ground truth:</strong> as real churn labels mature, compute rolling AUC/calibration on the cohorts whose window has closed. This is the gold standard but lags; use it to confirm or calibrate the earlier tiers.</li>
  </ul>
  <p><strong>Retrain decision:</strong> do not retrain on a single drift alarm &mdash; distribution shift alone does not prove the model got worse. Retrain when (a) Tier 1/2 drift is sustained AND (b) Tier 3 proxies or matured Tier 4 labels show real metric decay, or (c) calibration has clearly broken. Always validate the candidate model on a recent holdout and ship behind a champion/challenger or shadow comparison so a retrain cannot silently make things worse.</p>
</InterviewProblem>

<InterviewProblem question="Define the Population Stability Index (PSI) and write code to compute it. What threshold would you alert on?" difficulty="medium" tag="Coding">
  <p>PSI measures how much a distribution has shifted from a reference (training) baseline by bucketing both and comparing bucket mass. With reference proportion <M>{"e_i"}</M> and current proportion <M>{"a_i"}</M> in bin <M>{"i"}</M>:</p>
  <MB>{"\\mathrm{PSI} = \\sum_{i} (a_i - e_i)\\,\\ln\\!\\left(\\frac{a_i}{e_i}\\right)"}</MB>
  <p>It is a symmetrized relative-entropy-style score: each term is large when a bin&apos;s mass both moved a lot and moved proportionally. A common industry rule of thumb: <strong>PSI &lt; 0.1</strong> is stable, <strong>0.1&ndash;0.25</strong> is moderate shift (investigate), and <strong>&gt; 0.25</strong> is a significant shift worth alerting on.</p>
  <CodeBlock language="python" filename="psi.py">{`import numpy as np

def psi(reference, current, bins=10, eps=1e-6):
    # Bin edges fixed from the reference (training) distribution.
    quantiles = np.linspace(0, 1, bins + 1)
    edges = np.quantile(reference, quantiles)
    edges[0], edges[-1] = -np.inf, np.inf  # catch out-of-range live values

    ref_counts, _ = np.histogram(reference, bins=edges)
    cur_counts, _ = np.histogram(current, bins=edges)

    e = ref_counts / ref_counts.sum()
    a = cur_counts / cur_counts.sum()

    # Clip to avoid log(0) / divide-by-zero on empty bins.
    e = np.clip(e, eps, None)
    a = np.clip(a, eps, None)

    return float(np.sum((a - e) * np.log(a / e)))

train = np.random.normal(0, 1, 10000)
live  = np.random.normal(0.5, 1, 10000)   # shifted mean
print(round(psi(train, live), 3))          # ~0.2+ -> investigate`}</CodeBlock>
  <p>Key implementation gotchas: <strong>freeze the bin edges from the reference</strong> (re-binning on live data hides the shift), make the outer bins unbounded so new extreme values are counted, and clip empty bins so the log stays finite.</p>
</InterviewProblem>

<InterviewProblem question="Drift detection is fundamentally a sequential hypothesis-testing problem. If you run a daily KS test on a feature at significance 0.05, what goes wrong over a year, and how do you control it?" difficulty="hard" tag="Math">
  <p>Each daily test has false-positive rate <M>{"\\alpha = 0.05"}</M> under the null of &quot;no drift.&quot; Running it every day is <strong>multiple testing</strong>. If days are independent, the probability of <em>at least one</em> false alarm over <M>{"n = 365"}</M> days is:</p>
  <MB>{"P(\\text{any false alarm}) = 1 - (1 - \\alpha)^{n} = 1 - 0.95^{365} \\approx 1 - 8\\times 10^{-9} \\approx 1.0"}</MB>
  <p>So with a naive daily test you are <strong>essentially guaranteed</strong> to cry wolf, even when nothing ever drifts. The expected number of false alarms per year is <M>{"n\\alpha = 365 \\times 0.05 \\approx 18"}</M>. Alert fatigue follows and real drift gets ignored.</p>
  <p>Mitigations, from simplest to most principled:</p>
  <ul>
    <li><strong>Lower per-test alpha / Bonferroni-style correction:</strong> to keep the yearly family-wise error near 0.05, test at <M>{"\\alpha / n \\approx 1.4\\times 10^{-4}"}</M>. Simple but very conservative, and it ignores that you do not really have a fixed horizon.</li>
    <li><strong>Require persistence, not a single spike:</strong> alert only when the test trips on <M>{"k"}</M> of the last <M>{"m"}</M> days, or smooth the statistic. This trades a little detection latency for far fewer false alarms.</li>
    <li><strong>Use a proper sequential change-point detector:</strong> CUSUM, the Page-Hinkley test, or ADWIN are designed for streaming data &mdash; they accumulate evidence over time and have controllable expected-time-between-false-alarms (ARL) rather than a per-look error rate. This is the right tool: drift monitoring is a sequential problem, so use a sequential method instead of repeating a one-shot test.</li>
  </ul>
  <p>The deeper lesson interviewers want: a p-value threshold is calibrated for a <em>single</em> look. Repeatedly peeking inflates Type I error, so monitoring needs either an explicit correction or a method whose error guarantees hold under continuous monitoring.</p>
</InterviewProblem>

      </>
  );
}
