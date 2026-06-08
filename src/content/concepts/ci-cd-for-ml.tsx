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
    </>
  );
}
