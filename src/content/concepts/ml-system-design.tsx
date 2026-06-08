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
    <h2>Interview practice</h2>
<InterviewProblem question="Walk me through how you'd structure the first five minutes of an ML system design interview before drawing any boxes." difficulty="easy" tag="Conceptual">
  <p>The single most common failure mode is jumping to a model or an architecture diagram. Strong candidates spend the opening minutes <strong>scoping the problem</strong> so that every later decision is justified. A clean order:</p>
  <ul>
    <li><strong>Clarify the business goal.</strong> &quot;Recommend videos&quot; is not a spec. Are we optimizing watch time, click-through, long-term retention, or revenue? The objective drives the label and the loss.</li>
    <li><strong>Translate the goal into an ML problem.</strong> Is it ranking, classification, regression, retrieval, or generation? What is one training example, and what is the label? Can we even collect that label, and with what delay?</li>
    <li><strong>Nail down requirements.</strong> Separate <strong>functional</strong> (what predictions, for whom) from <strong>non-functional</strong> (latency budget, queries-per-second, freshness, training cadence, cost).</li>
    <li><strong>Estimate scale.</strong> Number of users, items, requests per second, and data volume per day. A 10ms p99 budget at 100k QPS rules out heavy models at serving time and forces precomputation or distillation.</li>
    <li><strong>State assumptions out loud and pick a metric.</strong> Choose an offline proxy metric and the online metric the business actually cares about, and note that they can diverge.</li>
  </ul>
  <p>Only after this do you draw the data, training, and serving pipelines. The interviewer is mostly grading whether your architecture <em>follows from</em> the requirements rather than the reverse.</p>
</InterviewProblem>
<InterviewProblem question="Design the recommendation/ranking system for a video feed. How would you decompose it given a tight serving latency budget over millions of items?" difficulty="hard" tag="Case">
  <p>You cannot score millions of candidates per request inside a tens-of-milliseconds budget with a deep model, so the canonical answer is a <strong>multi-stage funnel</strong> that trades recall for precision as the candidate set shrinks:</p>
  <ul>
    <li><strong>Candidate generation (retrieval).</strong> Reduce millions to a few hundred candidates cheaply. Use two-tower embeddings (user tower and item tower) with approximate nearest-neighbor search (e.g. HNSW). Item embeddings are precomputed offline; only the user embedding is computed online. Optimize for recall, not precision.</li>
    <li><strong>Ranking.</strong> Score the few hundred candidates with a heavier model (gradient-boosted trees or a deep network) using rich cross features between user and item. This is where most of the predictive power lives; latency is affordable because the set is small.</li>
    <li><strong>Re-ranking / business logic.</strong> Apply diversity, freshness, dedup, and policy constraints, plus exploration so the system keeps learning about new items.</li>
  </ul>
  <p>Cost intuition for the funnel: if scoring one item in the ranker costs <M>{"c"}</M> and retrieval narrows from <M>{"N"}</M> to <M>{"k"}</M>, the per-request ranking cost drops from <M>{"N \\cdot c"}</M> to <M>{"k \\cdot c"}</M> with <M>{"k \\ll N"}</M>, which is what makes the budget feasible.</p>
  <p>Round it out by addressing: how the two-tower model is trained (in-batch negatives plus hard negatives), feature freshness (real-time counters vs. batch features), the cold-start problem for new users and items, a feedback loop with logged impressions for training labels, and online evaluation via A/B test on the true business metric while watching guardrails like latency and diversity.</p>
</InterviewProblem>
<InterviewProblem question="Your offline AUC improved by 2 points but the online A/B test shows no lift, or even a regression. How do you debug this train/serve gap?" difficulty="medium" tag="Applied">
  <p>This is the classic &quot;offline up, online flat&quot; puzzle and it tests whether you understand that an offline metric is only a <em>proxy</em>. Work through the likely causes in order:</p>
  <ul>
    <li><strong>Metric mismatch.</strong> AUC measures ranking over all pairs, but the product only shows the top few items. A model can win on AUC yet lose on top-k metrics like NDCG@k that match what users actually see.</li>
    <li><strong>Training/serving skew.</strong> A feature is computed one way in the batch training pipeline and another way (or with stale values) at serving time. This is the most frequent real-world culprit; the fix is a shared feature definition / feature store and logging served features for parity checks.</li>
    <li><strong>Label leakage offline.</strong> A feature available at training time leaks information not available at prediction time, inflating offline numbers that vanish in production.</li>
    <li><strong>Feedback loop / position bias.</strong> The old model created the training data, so the new model learns to mimic exposure, not true preference. Position-debiasing or randomized exploration data is needed.</li>
    <li><strong>Distribution shift and novelty effects.</strong> Offline evaluation is on a frozen past slice; live traffic differs, and short-term A/B effects (novelty, primacy) can mask or fake a lift.</li>
  </ul>
  <p>Method matters as much as the list: confirm the A/B result is statistically powered, then add an online feature-parity check and re-evaluate offline with a top-k metric before trusting either side.</p>
</InterviewProblem>
<InterviewProblem question="Estimate the storage and the per-request retrieval latency for an embedding-based candidate generator with 100 million items at 256-dimensional float32 embeddings. When does brute-force nearest neighbor stop being viable?" difficulty="medium" tag="Math">
  <p>Start with the embedding table size. Each vector is <M>{"256 \\times 4 = 1024"}</M> bytes (1 KiB) in float32. For 100M items:</p>
  <MB>{"100\\times 10^{6} \\times 1024\\ \\text{bytes} \\approx 1.0\\times 10^{11}\\ \\text{bytes} \\approx 95\\ \\text{GiB}"}</MB>
  <p>That already does not fit comfortably in a single node's RAM, which motivates sharding or compression (e.g. product quantization to int8 cuts it roughly 4x).</p>
  <p>Now brute-force search. An exact top-k requires one dot product per item: <M>{"N\\cdot d"}</M> multiply-adds, here <M>{"10^{8}\\times 256 \\approx 2.6\\times 10^{10}"}</M> FLOPs per query. At a sustained few times <M>{"10^{10}"}</M> FLOPs/s on a CPU core, that is on the order of <strong>seconds per query</strong> &mdash; orders of magnitude over a 10ms budget.</p>
  <p>So brute force dies once <M>{"N\\cdot d"}</M> exceeds what fits in the latency budget, which for a single core happens around the low millions of items. Beyond that you switch to <strong>approximate nearest neighbor</strong> (HNSW, IVF-PQ): sublinear query time at the cost of slightly imperfect recall. The interview point is that you can produce these numbers quickly and let them <em>drive</em> the architecture choice rather than asserting &quot;use an ANN index&quot; with no justification.</p>
</InterviewProblem>

      </>
  );
}
