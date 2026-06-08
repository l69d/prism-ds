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
      <p>A model that ships is no longer just a math object &mdash; it is a decision-maker affecting real people. Governance is the discipline of making those decisions <strong>fair</strong>, <strong>explainable</strong>, and <strong>auditable</strong> long after the data scientist has moved on.</p>

      <KeyIdea>Governance turns &quot;the model is accurate&quot; into &quot;we can prove who built it, on what data, why it decided this, and that it does not systematically harm a protected group.&quot;</KeyIdea>

      <h2>The three pillars</h2>
      <ul>
        <li><strong>Fairness</strong> &mdash; the model should not encode discrimination against protected groups (race, gender, age). We measure this with group-level metrics, not just overall accuracy.</li>
        <li><strong>Explainability</strong> &mdash; for any single decision we can give a human-readable reason. This is a legal right in some domains (e.g. credit denials under the US ECOA).</li>
        <li><strong>Audit trails</strong> &mdash; immutable records of which model version, trained on which data snapshot, scored which input, when. Without lineage you cannot answer a regulator&apos;s questions.</li>
      </ul>

      <Basic>
        <p>Think of a loan model. <em>Fairness</em> asks: does it reject women at a much higher rate than men with the same finances? <em>Explainability</em> asks: when it rejects Maria, can we tell her it was her debt-to-income ratio, not a black box? <em>Audit trails</em> ask: six months later, can we reconstruct exactly which model and data produced her score? Governance is just answering &quot;yes&quot; to all three, on paper, repeatably.</p>
      </Basic>

      <Advanced>
        <p>Fairness has formal definitions that are mutually incompatible. <strong>Demographic parity</strong> requires the positive rate to match across groups <M>{"A \\in \\{0,1\\}"}</M>:</p>
        <MB>{"P(\\hat{Y}=1 \\mid A=0) = P(\\hat{Y}=1 \\mid A=1)"}</MB>
        <p><strong>Equalized odds</strong> instead conditions on the true label, requiring equal true- and false-positive rates:</p>
        <MB>{"P(\\hat{Y}=1 \\mid A=a, Y=y) = P(\\hat{Y}=1 \\mid A=a', Y=y) \\quad \\forall y"}</MB>
        <p>The impossibility theorem (Kleinberg et al., 2016) shows that when base rates differ across groups, you cannot simultaneously satisfy calibration, equal false-positive rates, and equal false-negative rates &mdash; except in degenerate cases. Choosing a fairness criterion is therefore a policy decision, not a purely technical one.</p>
      </Advanced>

      <Callout kind="pitfall" title="Removing the protected attribute does not make a model fair">
        Dropping the &quot;gender&quot; column gives <em>fairness through unawareness</em>, which fails: correlated proxies (zip code, occupation, purchase history) silently reconstruct the protected attribute. You must measure disparities on the outputs, not assume them away on the inputs.
      </Callout>

      <h2>Explainability in practice</h2>
      <p>Post-hoc methods like <strong>SHAP</strong> attribute a prediction to its features using Shapley values from cooperative game theory, giving each feature a contribution that sums to the prediction. This supports per-decision reason codes.</p>

      <CodeBlock language="python" filename="audit.py">{`import shap
import pandas as pd

# Per-decision explanation (reason codes)
explainer = shap.TreeExplainer(model)
contribs = explainer.shap_values(X_one_applicant)

# Group-level fairness audit: selection rate by protected group
preds = model.predict(X_test)
rates = pd.DataFrame({"group": A_test, "approved": preds}) \\
          .groupby("group")["approved"].mean()

dpd = rates.max() - rates.min()   # demographic parity difference
print(f"Selection rates:\\n{rates}\\nParity gap: {dpd:.3f}")

# Audit trail: log immutable lineage with every batch score
log = {"model_version": "v3.2.1", "data_snapshot": "2026-06-01",
       "timestamp": "2026-06-08T10:00Z", "parity_gap": float(dpd)}`}</CodeBlock>

      <MoreDepth>
        <p>A subtle senior trap is the <strong>fairness-accuracy gameability of thresholds</strong>. Enforcing equalized odds via group-specific decision thresholds can be legally fragile: in the US, using a protected attribute <em>at inference time</em> to adjust a score may itself constitute disparate treatment, even if the goal is to reduce disparate impact. The mathematically clean fix (different cutoffs per group) and the legally permissible fix often diverge, so governance teams frequently prefer pre-processing (reweighting data) or in-processing (fairness-constrained training) that leaves the deployed scoring rule group-blind.</p>
      </MoreDepth>

      <Quiz question="A bank drops 'race' from its loan model's features and claims the model is now fair. What is the core flaw?" options={[
        { text: "Removing features always lowers accuracy, so the model is now useless", why: "Accuracy may dip slightly, but that is not the fairness flaw being described." },
        { text: "Proxy features correlated with race can reconstruct it, so disparities persist unmeasured", correct: true, why: "This is fairness through unawareness; correlated proxies like zip code recover the protected attribute, so you must audit outputs, not just hide inputs." },
        { text: "The law requires race to be a feature in all credit models", why: "No such requirement exists; in fact using it at inference can be disparate treatment." },
        { text: "SHAP values cannot be computed once a feature is removed", why: "SHAP works fine on whatever feature set remains; this is unrelated to the fairness issue." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="A bank's credit model is accused of being biased against a protected group. Explain the difference between demographic parity and equalized odds, and why you usually can't satisfy both." difficulty="easy" tag="Conceptual">
  <p>Both are group-fairness criteria but they constrain different quantities.</p>
  <ul>
    <li><strong>Demographic parity:</strong> the approval rate is equal across groups, <M>{"P(\\hat{Y}=1 \\mid A=a)"}</M> is the same for every protected attribute value <M>{"a"}</M>. It ignores whether applicants actually repay.</li>
    <li><strong>Equalized odds:</strong> the model has equal true-positive and false-positive rates across groups, i.e. <M>{"P(\\hat{Y}=1 \\mid Y=y, A=a)"}</M> matches across <M>{"a"}</M> for both <M>{"y=0"}</M> and <M>{"y=1"}</M>. It conditions on the true outcome, so it tolerates different approval rates if the underlying repayment rates differ.</li>
  </ul>
  <p>The classic impossibility result (Kleinberg, Chouldechova) says that when base rates differ across groups (<M>{"P(Y=1\\mid A=a)"}</M> is not constant), you cannot simultaneously have calibration, equal false-positive rates, and equal false-negative rates except in degenerate cases. So demographic parity and equalized odds generally conflict, and the right choice is a <strong>policy decision tied to the harm</strong>: parity targets equal access, equalized odds targets equal error burden. State the tradeoff explicitly rather than picking silently.</p>
</InterviewProblem>
<InterviewProblem question="Your team drops the 'race' column from the training data and declares the model fair. Why is this 'fairness through unawareness' insufficient, and what would you do instead?" difficulty="medium" tag="Applied">
  <p>Removing the protected attribute does not remove the information. Other features act as <strong>proxies</strong>: zip code, surname, browsing device, or first name can be highly correlated with race or gender, so a sufficiently flexible model reconstructs the protected signal and the disparate impact persists. Worse, by deleting the column you also lose the ability to <strong>measure</strong> the disparity.</p>
  <p>A more defensible program:</p>
  <ul>
    <li><strong>Keep the attribute for auditing, not for prediction.</strong> Hold it out of the feature set but retain it to compute group metrics.</li>
    <li><strong>Measure outcomes, not intentions.</strong> Compute selection rates and error rates per group; flag where the disparate-impact ratio (the &quot;four-fifths&quot; rule) falls below 0.8.</li>
    <li><strong>Mitigate at the right stage:</strong> pre-processing (reweighing, removing proxy leakage), in-processing (a fairness-constrained or adversarial objective), or post-processing (group-specific thresholds via the equalized-odds method).</li>
    <li><strong>Document the decision</strong> in a model card and re-run the audit on every retrain, since drift can reintroduce bias.</li>
  </ul>
  <p>The headline: proxy variables mean unawareness gives you plausible deniability, not fairness.</p>
</InterviewProblem>
<InterviewProblem question="Compute the disparate-impact ratio and explain what an audit trail must capture so a regulator could reproduce a single rejected decision two years later." difficulty="medium" tag="Math">
  <p>Suppose group A is approved at rate <M>{"p_A = 0.60"}</M> and group B at <M>{"p_B = 0.42"}</M>. The disparate-impact ratio compares the disadvantaged group's selection rate to the favored group's:</p>
  <MB>{"\\text{DI} = \\frac{\\min(p_A, p_B)}{\\max(p_A, p_B)} = \\frac{0.42}{0.60} = 0.70"}</MB>
  <p>Under the four-fifths rule a ratio below <M>{"0.80"}</M> is presumptive adverse impact, so <M>{"0.70"}</M> would trigger scrutiny. Note this flags a statistical pattern, not proof of discrimination; you then test whether the gap is justified by a legitimate business factor.</p>
  <p>To reproduce one rejected decision years later, the audit trail must pin down everything that fed it:</p>
  <ul>
    <li><strong>Model version</strong> and a hash of the exact serialized artifact (weights plus preprocessing).</li>
    <li><strong>Training data snapshot</strong> reference and the feature pipeline / transformation code version.</li>
    <li><strong>The input feature vector</strong> as scored, plus the raw application it derived from.</li>
    <li><strong>The output</strong>: predicted score, the decision threshold in force at that timestamp, and the final action.</li>
    <li><strong>An explanation record</strong> (e.g. SHAP attributions) and the adverse-action reasons given to the applicant.</li>
    <li><strong>Provenance metadata</strong>: who deployed it, when, approval sign-offs, and any override.</li>
  </ul>
  <p>The principle is <strong>determinism plus immutability</strong>: given the logged version and input, re-running must yield the same score, and the log must be append-only so it cannot be edited after the fact.</p>
</InterviewProblem>
<InterviewProblem question="A stakeholder asks for a feature attribution for one specific prediction. Implement a KernelSHAP-style local explanation and explain why these attributions are descriptive, not causal." difficulty="hard" tag="Coding">
  <p>SHAP attributes a prediction to features using Shapley values: each feature's contribution is its average marginal effect over all orderings, with absent features replaced by samples from a background distribution. A small permutation-based estimator:</p>
  <CodeBlock language="python" filename="local_explain.py">{`import numpy as np
from itertools import permutations

def shapley_values(model_predict, x, background, n_perm=200, rng=None):
    """Approximate Shapley values for one instance x.

    model_predict: f(X) -> scores, X shape (n, d)
    x:            (d,) the instance to explain
    background:   (m, d) reference rows for 'absent' features
    """
    rng = rng or np.random.default_rng(0)
    d = x.shape[0]
    phi = np.zeros(d)

    for _ in range(n_perm):
        order = rng.permutation(d)
        # start from a random background row (all features 'absent')
        ref = background[rng.integers(len(background))].copy()
        z = ref.copy()
        prev = model_predict(z[None, :])[0]
        for j in order:
            z[j] = x[j]                  # turn feature j 'on'
            cur = model_predict(z[None, :])[0]
            phi[j] += cur - prev         # marginal contribution
            prev = cur
    phi /= n_perm
    return phi   # sums to f(x) - E[f] in expectation

# Local check: contributions reconstruct the gap from the baseline.
# base = mean prediction over background; base + phi.sum() approx= f(x)
`}</CodeBlock>
  <p>Why this is descriptive, not causal:</p>
  <ul>
    <li>The attribution explains <strong>how the model used a feature</strong>, given the correlations in the background data. It does not tell you what happens in the real world if you intervene on that feature.</li>
    <li>With <strong>correlated features</strong>, splitting credit between them is ambiguous, and the choice of background distribution (interventional vs conditional) changes the numbers materially.</li>
    <li>A feature can get large attribution purely because it is a <strong>proxy</strong> for the true cause, so SHAP can highlight a discriminatory pathway without that feature being causal.</li>
  </ul>
  <p>For governance, SHAP is excellent for generating adverse-action reasons and surfacing suspicious dependencies, but causal claims require a causal model or an experiment, not a feature-attribution method.</p>
</InterviewProblem>

      </>
  );
}
