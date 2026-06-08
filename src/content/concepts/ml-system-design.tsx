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
      <p>ML system design is the discipline of turning a fuzzy business goal into a concrete, measurable, serviceable machine-learning system &mdash; and it is what most ML interviews and most production failures are actually about.</p>

      <KeyIdea>The hardest part of an ML system is almost never the model. It is choosing the right objective, the right metrics, the right data, and a serving architecture that survives real traffic. Frame first, model last.</KeyIdea>

      <h2>The framing loop</h2>
      <p>Every good ML design starts by converting an ambiguous ask (&quot;recommend videos&quot;, &quot;detect fraud&quot;) into a precise ML problem. Walk these steps explicitly:</p>
      <ul>
        <li><strong>Clarify the goal</strong>: what business outcome are we moving? Engagement, revenue, safety?</li>
        <li><strong>Pick the ML task</strong>: ranking, classification, regression, retrieval, generation?</li>
        <li><strong>Define metrics</strong>: an <strong>offline</strong> proxy (AUC, NDCG, recall@k) and an <strong>online</strong> business metric (click-through, dollars saved) you will A/B test.</li>
        <li><strong>State constraints</strong>: latency budget, throughput (QPS), training cadence, cost, and fairness or compliance limits.</li>
      </ul>

      <h2>Reference architecture</h2>
      <p>Once framed, almost every system reduces to the same skeleton: <strong>data ingestion &rarr; feature pipeline &rarr; training &rarr; evaluation &rarr; serving &rarr; monitoring &rarr; feedback</strong>. The arrows that get skipped are monitoring and feedback, and those are exactly where systems silently rot.</p>

      <Basic>
        <p>Think of it like designing a restaurant, not cooking one dish. A great recipe (model) is useless if you cannot source ingredients (data), plate fast enough during the dinner rush (latency), keep quality consistent every night (monitoring), and learn from what diners actually send back (feedback). Interviewers grade the whole restaurant, so spend your first minutes on requirements and trade-offs, not on naming a fancy architecture.</p>
      </Basic>

      <Advanced>
        <p>Frame the choice of operating point rigorously. Most deployed classifiers expose a threshold <M>{"\\tau"}</M> on a score <M>{"s(x)"}</M>, and the right <M>{"\\tau"}</M> is set by the cost of errors, not by accuracy. With cost <M>{"c_{FP}"}</M> for false positives and <M>{"c_{FN}"}</M> for false negatives, you minimize expected cost:</p>
        <MB>{"\\mathbb{E}[\\text{cost}] = c_{FP}\\,P(\\hat{y}=1, y=0) + c_{FN}\\,P(\\hat{y}=0, y=1)"}</MB>
        <p>The optimal decision is to predict the positive class when the posterior exceeds a cost-derived threshold:</p>
        <MB>{"P(y=1 \\mid x) > \\frac{c_{FP}}{c_{FP} + c_{FN}}"}</MB>
        <p>This is why &quot;which metric&quot; is a design decision: a fraud system with <M>{"c_{FN} \\gg c_{FP}"}</M> tolerates many false alarms, pushing the threshold low and demanding a precision-recall view rather than raw accuracy.</p>
      </Advanced>

      <Callout kind="pitfall" title="Optimizing the proxy, not the goal">
        Offline metrics are proxies. A recommender can lift offline NDCG while online engagement drops, because the offline label (a past click) is itself biased by the old system. Always pair an offline metric with an online experiment, and treat divergence between them as a signal, not noise.
      </Callout>

      <CodeBlock language="python" filename="design_spec.py">{`# A design spec is code-reviewable: it forces the trade-offs to be explicit.
from dataclasses import dataclass

@dataclass
class MLSystemSpec:
    task: str               # "ranking" | "binary_classification" | ...
    offline_metric: str     # proxy you can compute on a held-out set
    online_metric: str      # business KPI you will A/B test
    latency_p99_ms: int     # serving budget at the 99th percentile
    qps: int                # expected peak throughput
    retrain_cadence: str    # "daily" | "weekly" | "streaming"
    cost_fp: float          # cost of a false positive
    cost_fn: float          # cost of a false negative

fraud = MLSystemSpec(
    task="binary_classification",
    offline_metric="PR-AUC",      # not accuracy: positives are rare
    online_metric="chargeback_$_prevented",
    latency_p99_ms=50,            # inline with checkout
    qps=2000,
    retrain_cadence="daily",
    cost_fp=1.0,                  # annoyed customer
    cost_fn=120.0,               # an actual fraudulent charge
)

# Cost-optimal threshold from the posterior (see Advanced tier)
threshold = fraud.cost_fp / (fraud.cost_fp + fraud.cost_fn)
print(f"Flag a transaction when P(fraud|x) > {threshold:.3f}")
`}</CodeBlock>

      <MoreDepth>
        <p>Senior designers separate <strong>training/serving skew</strong> from <strong>data drift</strong>, because the fixes differ. Skew is an engineering bug: the same input produces different features at train and serve time (e.g. a feature computed over a full day in batch but only a partial day online). The fix is a shared feature definition &mdash; a feature store or a single transformation library used by both paths. Drift is a statistical reality: <M>{"P(x)"}</M> or <M>{"P(y \\mid x)"}</M> changes over time, and no shared code prevents it. The fix is monitoring distributions plus a retraining trigger. Conflating the two leads teams to retrain endlessly against what is really a plumbing bug.</p>
      </MoreDepth>

      <Quiz question="In an ML system design interview, you are asked to build a system to detect fraudulent transactions. What should you nail down first?" options={[
        { text: "The exact model architecture (e.g. XGBoost vs. a deep net)", why: "Model choice is downstream; it can't be justified until the metrics, constraints, and error costs are defined." },
        { text: "The objective, success metrics, and error-cost trade-offs (and latency/throughput constraints)", correct: true, why: "Framing first determines everything else: rare positives demand PR-AUC over accuracy, and asymmetric costs set the threshold and latency budget." },
        { text: "Which cloud provider and GPU instance type to train on", why: "Infrastructure is an implementation detail that follows from throughput and cost requirements, which you haven't established yet." },
        { text: "The number of hidden layers and the learning rate", why: "Hyperparameters are tuned late, after the problem framing, data, and serving architecture are settled." },
      ]} />
    </>
  );
}
