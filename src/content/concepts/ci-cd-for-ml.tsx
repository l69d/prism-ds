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
      <p>In traditional software, CI/CD means: every code change is automatically built, tested, and shipped. In ML, the same idea applies &mdash; but a model&apos;s behavior depends on three things, not one: the <strong>code</strong>, the <strong>data</strong>, and the <strong>model</strong> itself. A green unit-test suite tells you nothing if the training data silently drifted.</p>

      <KeyIdea>For ML systems you must version and test data and models the way you already version and test code &mdash; otherwise a passing pipeline can still ship a broken predictor.</KeyIdea>

      <h2>The three things that change</h2>
      <p>A classic deploy fails loudly: a syntax error breaks the build. An ML deploy can fail <em>silently</em>: the code is fine, the model trains, accuracy on the old test set looks great &mdash; yet predictions in production are garbage because an upstream feature changed units from dollars to cents. CI/CD for ML adds gates for each input that can move:</p>
      <ul>
        <li><strong>Code tests</strong> &mdash; deterministic logic: feature transforms, data loaders, serving glue.</li>
        <li><strong>Data tests</strong> &mdash; schema, ranges, null rates, distribution drift versus a reference.</li>
        <li><strong>Model tests</strong> &mdash; minimum metric thresholds, slice-level fairness, behavioral checks, and comparison against the currently deployed model.</li>
      </ul>

      <h2>The ML pipeline gate</h2>
      <Basic><p>Think of it as a bouncer with a checklist standing between a freshly trained model and production. The bouncer doesn&apos;t just ask &quot;did the code run?&quot; It asks: is the incoming data shaped like what we expect, did the new model beat the old one on a frozen validation set, and does it still behave sanely on the tricky edge cases we care about? Only if every box is ticked does the model get promoted.</p></Basic>
      <Advanced><p>A promotion gate is a hypothesis test, not a single number. Let <M>{"m_{\\text{new}}"}</M> and <M>{"m_{\\text{old}}"}</M> be candidate and incumbent metrics on a held-out set. Promote only if the improvement clears a margin <M>{"\\delta"}</M> that accounts for evaluation noise:</p><MB>{"\\text{promote} \\iff m_{\\text{new}} - m_{\\text{old}} > \\delta, \\quad \\delta \\approx z_{1-\\alpha}\\,\\widehat{\\sigma}_{\\Delta}"}</MB><p>where <M>{"\\widehat{\\sigma}_{\\Delta}"}</M> is the standard error of the metric difference (estimable by bootstrapping the test set). For data drift, a common gate is a population-stability index or a two-sample test such as Kolmogorov&ndash;Smirnov on each feature, flagging when <M>{"D = \\sup_x |F_{\\text{ref}}(x) - F_{\\text{new}}(x)|"}</M> exceeds a tuned threshold.</p></Advanced>

      <Callout kind="pitfall" title="Aggregate metric, broken slice">A model can raise overall accuracy by 1% while collapsing on a minority slice that matters. Always test per-segment metrics in the gate, not just the headline number.</Callout>

      <CodeBlock language="python" filename="model_gate.py">{`import numpy as np

def bootstrap_metric_se(y_true, y_pred, metric, n=1000, seed=0):
    rng = np.random.default_rng(seed)
    idx = np.arange(len(y_true))
    scores = [metric(y_true[s], y_pred[s])
              for s in (rng.choice(idx, len(idx), replace=True) for _ in range(n))]
    return float(np.std(scores))

def should_promote(m_new, m_old, se_diff, z=1.96):
    # promote only if improvement clears noise-aware margin
    return (m_new - m_old) > z * se_diff

# example: candidate must beat incumbent beyond evaluation noise
se = bootstrap_metric_se(y_true, y_pred_new, metric=accuracy)
print(should_promote(m_new=0.91, m_old=0.90, se_diff=se))`}</CodeBlock>

      <MoreDepth><p>The subtle trap is <strong>leakage through the test set itself</strong>. If you keep tuning thresholds and architectures against the same held-out set that your CI gate evaluates on, that set slowly becomes training data &mdash; your gate inflates and stops protecting production. Mature setups rotate or hold back a sealed &quot;CI-only&quot; evaluation set, and pair the offline gate with a <em>canary / shadow deploy</em> so the real arbiter is live performance on fresh traffic, not a frozen file you&apos;ve implicitly overfit.</p></MoreDepth>

      <Quiz question="Why does CI/CD for ML test data and models, not just code?" options={[
        { text: "Because ML code is too complex to unit test reliably.", why: "Code is testable; the issue is that code is only one of three inputs." },
        { text: "Because a model's behavior depends on data and model artifacts that can change even when code stays identical.", correct: true, why: "Silent data drift or a worse retrained model passes code tests but breaks predictions." },
        { text: "Because data tests can fully replace model evaluation.", why: "They are complementary; clean data can still yield a model that fails the metric gate." },
        { text: "Because version control cannot store model files.", why: "Tools like DVC version data and models fine; storage is not the reason for the extra tests." },
      ]} />
    <h2>Interview practice</h2>

<InterviewProblem question="Traditional CI/CD tests code. Why is that not enough for ML systems, and what extra things must an ML pipeline test?" difficulty="easy" tag="Conceptual">
  <p>In a normal software service the behavior is fully determined by code, so green unit tests plus integration tests give you strong confidence. An ML system has <strong>three</strong> coupled inputs that all change independently: code, data, and the trained model. A pipeline that only tests code can ship a regression even when every test passes &mdash; for example if the upstream feature table silently changed units, or a retrain produced a worse model.</p>
  <p>So an ML CI/CD pipeline adds testing layers beyond code:</p>
  <ul>
    <li><strong>Data tests:</strong> schema validation (types, expected columns), distribution checks (null rate, range, category set), and freshness/volume sanity. These catch the &quot;garbage in&quot; failures that code tests never see.</li>
    <li><strong>Model tests:</strong> a held-out evaluation gate &mdash; the new model must beat (or at least not regress past a threshold below) the current production model on a frozen validation set before it can be promoted.</li>
    <li><strong>Behavioral / invariance tests:</strong> targeted assertions on slices and directional expectations (e.g. raising income should not lower a credit score), plus fairness checks on protected subgroups.</li>
    <li><strong>Pipeline reproducibility:</strong> pin data versions, code, and hyperparameters so a build is reproducible, and the artifact is the versioned model, not just the source.</li>
  </ul>
  <p>The key mental shift: in ML, the deployable artifact is produced by the pipeline, so the pipeline itself &mdash; and the data feeding it &mdash; is part of what you test and version.</p>
</InterviewProblem>

<InterviewProblem question="Design a CI/CD pipeline that automatically retrains and promotes a fraud model, but must never push a worse model to production. Walk through the stages and the gates." difficulty="medium" tag="Applied">
  <p>The goal is a pipeline where a commit or a scheduled trigger can flow all the way to production with no human regression risk. I would structure it as gated stages, where any failed gate stops promotion.</p>
  <ul>
    <li><strong>Trigger:</strong> on code merge, on a cron schedule, or on a data-drift alarm. Record the exact data snapshot version used.</li>
    <li><strong>CI (code gate):</strong> lint, unit tests on feature transforms, and a tiny smoke train on sample data to prove the pipeline runs end to end.</li>
    <li><strong>Data validation gate:</strong> validate the training snapshot against an expected schema and reference statistics; abort if null rates, ranges, or category sets drift beyond tolerance.</li>
    <li><strong>Train + register:</strong> train on the pinned snapshot, log metrics and lineage, and register the candidate in a model registry as a versioned artifact.</li>
    <li><strong>Evaluation gate (the regression guard):</strong> evaluate the candidate and the current production model on the same frozen hold-out. Promote only if the candidate is at least as good on the primary metric and not worse on key slices. For fraud, optimize PR-AUC / recall at a fixed precision rather than accuracy, because positives are rare.</li>
    <li><strong>Shadow / canary deploy:</strong> serve the candidate in shadow mode (scores live traffic, decisions ignored) or to a small canary slice, comparing online metrics before full rollout.</li>
    <li><strong>Promote + monitor + rollback:</strong> flip the registry alias to the new version, keep the previous version warm, and auto-rollback if online metrics or latency breach SLOs.</li>
  </ul>
  <p>The hard requirement &mdash; never ship a worse model &mdash; is enforced by the evaluation gate comparing candidate vs incumbent on an identical hold-out, plus the canary as a second safety net against offline/online metric mismatch.</p>
</InterviewProblem>

<InterviewProblem question="Your evaluation gate promotes a model only if its hold-out AUC is higher than production's. The team complains good models keep getting rejected by noise. How do you set a statistically sound promotion threshold?" difficulty="hard" tag="Math">
  <p>A raw &quot;new AUC &gt; old AUC&quot; rule treats sampling noise as signal: on a finite hold-out set the measured AUC has a standard error, so a genuinely equal model wins or loses the comparison roughly half the time by chance. You want to promote only when the improvement is unlikely to be noise.</p>
  <p>Model the per-example score difference. For a paired comparison on the same <M>{"n"}</M> hold-out examples, let <M>{"d_i"}</M> be the difference in per-example loss (or contribution to the metric) between candidate and incumbent. The mean difference is</p>
  <MB>{"\\bar{d} = \\frac{1}{n}\\sum_{i=1}^{n} d_i, \\qquad \\operatorname{SE}(\\bar{d}) = \\frac{s_d}{\\sqrt{n}}"}</MB>
  <p>where <M>{"s_d"}</M> is the sample standard deviation of the differences. Promote only when the improvement clears a multiple of the standard error:</p>
  <MB>{"\\bar{d} > z \\cdot \\frac{s_d}{\\sqrt{n}}"}</MB>
  <p>with <M>{"z \\approx 1.64"}</M> for a one-sided 95% test. This is just a paired test (a t-test, or for AUC specifically a DeLong test that accounts for AUC&apos;s correlated structure). Practical refinements:</p>
  <ul>
    <li><strong>Require a minimum effect size,</strong> not only significance: demand <M>{"\\bar{d}"}</M> exceed both the noise band and a business-relevant margin <M>{"\\delta"}</M>, so you do not ship a statistically real but trivial 0.0001 gain.</li>
    <li><strong>Correct for repeated looks:</strong> if you retrain and test daily, you run many comparisons; tighten the threshold (e.g. Bonferroni-style) to control false promotions over time.</li>
    <li><strong>Grow the hold-out</strong> if <M>{"\\operatorname{SE}(\\bar{d})"}</M> is too large to detect the margin you care about &mdash; SE shrinks like <M>{"1/\\sqrt{n}"}</M>.</li>
  </ul>
  <p>Net: replace the brittle point comparison with a one-sided significance gate plus a minimum margin, which is exactly the noise complaint resolved.</p>
</InterviewProblem>

<InterviewProblem question="Write a data-validation gate that a CI step can call. It should fail the build (non-zero exit) if a new training batch violates the schema or drifts too far from a reference distribution." difficulty="medium" tag="Coding">
  <p>The gate codifies expectations as assertions and exits non-zero so the CI runner stops the pipeline. I check structure (columns, types, nulls), value ranges, and a simple distribution-drift signal &mdash; the share of out-of-reference categories &mdash; against tolerances.</p>
  <CodeBlock language="python" filename="data_gate.py">{`import sys
import pandas as pd

def validate(df: pd.DataFrame, ref_stats: dict) -> list[str]:
    """Return a list of violation messages; empty means the gate passes."""
    errors = []

    # 1. Schema: required columns present
    missing = set(ref_stats["columns"]) - set(df.columns)
    if missing:
        errors.append(f"missing columns: {sorted(missing)}")

    # 2. Null rate per column within tolerance
    for col, max_null in ref_stats["max_null_rate"].items():
        if col in df.columns:
            rate = df[col].isna().mean()
            if rate > max_null:
                errors.append(f"{col} null rate {rate:.3f} > {max_null}")

    # 3. Numeric ranges (catches unit changes / corrupt values)
    for col, (lo, hi) in ref_stats["ranges"].items():
        if col in df.columns:
            mn, mx = df[col].min(), df[col].max()
            if mn < lo or mx > hi:
                errors.append(f"{col} range [{mn},{mx}] outside [{lo},{hi}]")

    # 4. Categorical drift: fraction of unseen categories
    for col, allowed in ref_stats["categories"].items():
        if col in df.columns:
            unseen = (~df[col].isin(allowed)).mean()
            if unseen > ref_stats["max_unseen_frac"]:
                errors.append(f"{col} unseen-category frac {unseen:.3f} too high")

    # 5. Volume sanity: enough rows to train on
    if len(df) < ref_stats["min_rows"]:
        errors.append(f"only {len(df)} rows < min {ref_stats['min_rows']}")

    return errors

if __name__ == "__main__":
    df = pd.read_parquet(sys.argv[1])
    ref = {
        "columns": ["amount", "merchant", "is_fraud"],
        "max_null_rate": {"amount": 0.0, "merchant": 0.01},
        "ranges": {"amount": (0.0, 1e6)},
        "categories": {"merchant": {"grocery", "travel", "online"}},
        "max_unseen_frac": 0.02,
        "min_rows": 10_000,
    }
    violations = validate(df, ref)
    if violations:
        print("DATA GATE FAILED:")
        for v in violations:
            print("  -", v)
        sys.exit(1)        # non-zero -> CI stops the pipeline
    print("data gate passed")
`}</CodeBlock>
  <p>The design points an interviewer wants to hear: expectations live in version control next to the code; the gate is <strong>fail-closed</strong> (non-zero exit halts promotion); and reference statistics come from a trusted past window, so the same script doubles as a drift detector when you schedule it on incoming production data.</p>
</InterviewProblem>

      </>
  );
}
