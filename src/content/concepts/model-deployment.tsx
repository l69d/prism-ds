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
    </>
  );
}
