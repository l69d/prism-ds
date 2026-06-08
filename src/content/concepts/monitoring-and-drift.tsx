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
    </>
  );
}
