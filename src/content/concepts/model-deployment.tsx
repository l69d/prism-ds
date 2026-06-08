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
      <p>A trained model sitting in a notebook helps no one. Deployment is the bridge from a saved set of weights to predictions that actually reach a user, a dashboard, or a downstream system.</p>

      <KeyIdea>Deployment is not one thing. The right pattern is dictated by a single question: how soon does someone need the answer? That latency budget splits the world into batch, real-time, and edge.</KeyIdea>

      <h2>The three patterns</h2>
      <p>Each pattern trades latency, cost, and operational complexity differently.</p>
      <ul>
        <li><strong>Batch:</strong> score a large set of records on a schedule (nightly, hourly). Predictions are precomputed and stored, then looked up instantly. Cheap and simple, but answers can be stale.</li>
        <li><strong>Real-time (online):</strong> a request comes in, the model scores it on demand behind an API, and a response returns in milliseconds. Always fresh, but you now own a low-latency, always-on service.</li>
        <li><strong>Edge:</strong> the model runs on the user&apos;s device (phone, browser, sensor). No network round-trip, works offline, and keeps data local, at the cost of tight compute and memory limits.</li>
      </ul>

      <Basic>
        <p>Think of a coffee shop. <strong>Batch</strong> is brewing a big urn before the rush, so cups are poured instantly all morning, but the coffee was made hours ago. <strong>Real-time</strong> is a barista pulling a fresh espresso the moment you order, perfect but you wait in line. <strong>Edge</strong> is the machine on your own kitchen counter, instant and private, but it can only do so much.</p>
      </Basic>

      <Advanced>
        <p>Formally, deployment optimizes a serving objective under a latency constraint. Let <M>{"L"}</M> be end-to-end latency and <M>{"\\tau"}</M> the budget the product can tolerate. You minimize cost per prediction subject to:</p>
        <MB>{"P\\bigl(L \\le \\tau\\bigr) \\ge 1 - \\alpha"}</MB>
        <p>That is, the <M>{"(1-\\alpha)"}</M> tail latency (e.g. p99) must stay under budget, not just the mean. Batch effectively sets <M>{"\\tau \\to \\infty"}</M> for the request path by amortizing compute offline. Real-time serving must hold p99 below tens of milliseconds, which forces choices like model quantization, request batching, and caching. Edge pushes a hard constraint on model size <M>{"|\\theta|"}</M> and FLOPs, so deployment becomes a joint optimization over accuracy and resource footprint, often via pruning or distillation to a student model <M>{"\\theta_s"}</M> with much smaller <M>{"|\\theta_s|"}</M>.</p>
      </Advanced>

      <Callout kind="pitfall" title="Train/serve skew">
        The most common production failure is not a bad model, it is that features computed at serving time differ from those computed at training time. A unit mismatch, a different default for missing values, or a leaked future column silently destroys accuracy. Share one feature transformation pipeline across both paths.
      </Callout>

      <h2>A minimal real-time service</h2>
      <p>A real-time deployment wraps the model in an HTTP endpoint, loads weights once at startup, and applies the exact same preprocessing used in training.</p>

      <CodeBlock language="python" filename="serve.py">{`from fastapi import FastAPI
from pydantic import BaseModel
import joblib

app = FastAPI()
# Load the full pipeline (preprocessing + model) ONCE at startup.
pipeline = joblib.load("model.joblib")

class Request(BaseModel):
    features: list[float]

@app.post("/predict")
def predict(req: Request):
    # Same transforms as training are baked into the pipeline.
    proba = pipeline.predict_proba([req.features])[0, 1]
    return {"score": float(proba)}

@app.get("/health")
def health():
    return {"status": "ok"}  # readiness probe for orchestrators
`}</CodeBlock>

      <Callout kind="insight" title="Choose by latency, then by freshness">
        Start from the latency budget. If users can wait until tomorrow, batch wins on cost and simplicity. Only pay the operational tax of a live service when freshness genuinely changes the decision.
      </Callout>

      <MoreDepth>
        <p>Shipping the model is the start, not the finish. Production deployment needs versioned rollouts (shadow or canary traffic before full cutover), monitoring for data drift and prediction drift, and a fast rollback path. Hybrid patterns are common: precompute candidate scores in batch, then apply a small real-time re-ranking model on top, capturing batch&apos;s cheapness and real-time&apos;s freshness in one system.</p>
      </MoreDepth>

      <Quiz question="A fraud system must approve or decline card transactions in under 50ms as they happen. Which deployment pattern fits?" options={[
        { text: "Real-time (online) serving", correct: true, why: "The decision is needed synchronously within a tight latency budget, so the model must score on demand behind a low-latency API." },
        { text: "Batch scoring on a nightly schedule", why: "Nightly precomputation cannot decide a transaction that is happening right now; the answer would be hours stale." },
        { text: "Edge deployment on the merchant terminal", why: "Fraud models need global, fresh signals and large feature stores that a constrained device cannot host or update fast enough." },
        { text: "No deployment is needed; run it in a notebook", why: "A notebook is not a service and cannot reliably handle live, concurrent transaction traffic." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="When would you deploy a model as a batch job versus a real-time service? Give the trade-offs." difficulty="easy" tag="Conceptual">
  <p><strong>Batch</strong> scores a large set of records on a schedule (nightly, hourly) and writes predictions to a table or cache. <strong>Real-time</strong> (online) exposes the model behind an API and scores one request at a time, synchronously, in tens of milliseconds.</p>
  <ul>
    <li><strong>Use batch when</strong> the input is known ahead of time and predictions can be slightly stale: churn scores for every customer, daily product recommendations, lead scoring. It is simpler, cheaper, and trivially parallel.</li>
    <li><strong>Use real-time when</strong> the prediction depends on fresh, request-time features the system cannot enumerate in advance: fraud on a card swipe, search ranking for a typed query, dynamic pricing. Latency and uptime now matter.</li>
    <li><strong>Key trade-offs:</strong> batch optimizes throughput and cost but tolerates staleness; real-time optimizes freshness and latency but needs low-latency feature lookups, autoscaling, and tight SLAs.</li>
  </ul>
  <p>A common hybrid is to precompute heavy features in batch into a feature store, then do a light real-time lookup plus model call so the online path stays fast.</p>
</InterviewProblem>
<InterviewProblem question="A request flows through three models in series, each with mean latency 30ms and p99 of 120ms. What is the end-to-end p99 you should expect, and how do you cut it?" difficulty="medium" tag="Math">
  <p>The naive answer of adding the means (90ms) is wrong for tail latency. Mean is additive, but a high percentile of a sum is NOT the sum of the per-stage percentiles.</p>
  <p>Means add directly:</p>
  <MB>{"E[L_{total}] = 30 + 30 + 30 = 90\\text{ ms}"}</MB>
  <p>For the tail, assume the three stages are roughly independent. The chain&apos;s p99 is the value <M>{"t"}</M> where the probability that ALL stages finish by <M>{"t"}</M> is 0.99. If each stage individually meets <M>{"t"}</M> with probability <M>{"p"}</M>, then:</p>
  <MB>{"p^3 = 0.99 \;\\Rightarrow\; p = 0.99^{1/3} \\approx 0.9967"}</MB>
  <p>So end-to-end p99 is driven by each stage&apos;s p99.67, which sits well above its own p99 of 120ms. Concretely, summing three independent stage latencies inflates the tail because it is unlikely all three are simultaneously fast, but a single slow stage drags the whole chain. The end-to-end p99 typically lands well above 120ms and below <M>{"3 \\times 120 = 360"}</M>ms.</p>
  <p><strong>How to cut it:</strong></p>
  <ul>
    <li>Run independent models in <strong>parallel</strong> instead of series so latency is <M>{"\\max"}</M> not <M>{"\\sum"}</M>.</li>
    <li>Attack the <strong>slowest stage&apos;s tail</strong>, not the means: it dominates the chain.</li>
    <li>Use <strong>hedged / speculative requests</strong> (fire a duplicate after a short delay, take the first to return) to clip stragglers.</li>
    <li>Cache, quantize, or distill the heaviest model; set per-stage timeouts with sane fallbacks.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="You deployed a new model version. How do you roll it out safely and detect that it is silently degrading in production?" difficulty="medium" tag="Applied">
  <p><strong>Safe rollout:</strong></p>
  <ul>
    <li><strong>Shadow / dark launch:</strong> send live traffic to the new model in parallel, log its predictions, but serve the old one. Compare distributions before any user sees the new model.</li>
    <li><strong>Canary:</strong> route a small slice (1-5%) of real traffic to the new version, watch business and ops metrics, then ramp gradually.</li>
    <li><strong>A/B test</strong> when you need a statistically clean read on a business KPI before full cutover; keep the old version as an instant rollback target (blue-green).</li>
  </ul>
  <p><strong>Detecting silent degradation</strong> (labels often arrive late or never):</p>
  <ul>
    <li><strong>Operational:</strong> latency p50/p99, error rate, throughput, timeout/fallback rate.</li>
    <li><strong>Data quality:</strong> schema checks, null/out-of-range rates, feature freshness.</li>
    <li><strong>Drift:</strong> covariate drift on inputs (PSI, KS test) and prediction drift on the output score distribution, which you can monitor without labels.</li>
    <li><strong>Performance:</strong> once ground truth lands, track rolling AUC / calibration; alert on decay. Proxy with online signals (click-through, conversion) until labels mature.</li>
  </ul>
  <p>The trap is monitoring only accuracy: in production, the model can look healthy on stale offline data while the live input distribution has shifted underneath it. Drift detection on unlabeled inputs is your earliest warning.</p>
</InterviewProblem>
<InterviewProblem question="Why is edge deployment harder than serving from a cloud GPU, and what techniques let a large model run on a phone or microcontroller?" difficulty="hard" tag="Conceptual">
  <p><strong>Why it is harder:</strong> the edge device has a tight, fixed budget. No autoscaling, limited RAM and flash, a weak or absent GPU/NPU, a power and thermal ceiling, and often no network for fallback. You also lose centralized observability, and pushing a model update means shipping binaries to many heterogeneous devices.</p>
  <p><strong>Techniques to fit and speed up a model:</strong></p>
  <ul>
    <li><strong>Quantization:</strong> store and compute weights/activations in int8 (or 4-bit) instead of fp32. This cuts memory roughly 4x and speeds up integer math; post-training quantization is cheap, quantization-aware training recovers more accuracy.</li>
    <li><strong>Pruning:</strong> remove near-zero or redundant weights/channels for a smaller, sparser network.</li>
    <li><strong>Knowledge distillation:</strong> train a small &quot;student&quot; to mimic a large &quot;teacher&quot;, keeping most of the accuracy at a fraction of the size.</li>
    <li><strong>Architecture choices:</strong> use mobile-efficient backbones (depthwise-separable convolutions, etc.) designed for the FLOP/latency budget.</li>
    <li><strong>Compilation / runtimes:</strong> export to a lean format and use an on-device runtime (TFLite, ONNX Runtime, Core ML) that fuses ops and targets the NPU.</li>
  </ul>
  <p>A quick memory check that interviewers like: 7 billion parameters at fp32 is about <M>{"7\\times10^9 \\times 4 \\text{ bytes} \\approx 28"}</M> GB, far past any phone. Quantize to int8 and it is roughly 7GB; 4-bit puts it near 3.5GB, which is why low-bit quantization is the lever that makes large on-device models even thinkable.</p>
  <CodeBlock language="python" filename="quantize_edge.py">{`import tensorflow as tf

# Convert a trained Keras model to a quantized TFLite model for the edge.
converter = tf.lite.TFLiteConverter.from_keras_model(model)

# Post-training int8 quantization: ~4x smaller, integer-only inference.
converter.optimizations = [tf.lite.Optimize.DEFAULT]

def representative_dataset():
    # A few hundred real samples calibrate activation ranges.
    for sample in calibration_samples[:300]:
        yield [sample.astype("float32")]

converter.representative_dataset = representative_dataset
converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
converter.inference_input_type = tf.int8
converter.inference_output_type = tf.int8

tflite_model = converter.convert()
with open("model_int8.tflite", "wb") as f:
    f.write(tflite_model)
`}</CodeBlock>
</InterviewProblem>

      </>
  );
}
