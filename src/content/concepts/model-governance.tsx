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
    </>
  );
}
