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
      <p>A feature store is a centralized system that computes, stores, and serves the same feature values to both model training and live prediction, so what your model learned from is exactly what it sees in production.</p>

      <KeyIdea>Train on the same numbers you serve. A feature store exists to kill the silent gap between the features computed in your offline notebook and the features computed in your online API.</KeyIdea>

      <h2>The problem it solves</h2>
      <p>In production ML, the same feature often gets implemented twice: once in a batch pipeline (SQL over a warehouse) for training, and again in application code (Python in a request handler) for serving. The two implementations drift. A subtle difference, say a 7-day average computed over calendar days versus rolling hours, means the model is fed inputs at serving time it never saw during training. This is <strong>training-serving skew</strong>, and it silently degrades accuracy without throwing a single error.</p>
      <ul>
        <li><strong>Offline store:</strong> a large columnar table (warehouse, Parquet) holding the full history, used to build training sets.</li>
        <li><strong>Online store:</strong> a low-latency key-value store (Redis, DynamoDB) holding the latest feature value per entity, read in milliseconds at request time.</li>
        <li><strong>Single definition:</strong> one transformation written once, materialized to both stores, so train and serve cannot diverge.</li>
      </ul>

      <Basic>
        <p>Think of a feature store as a shared kitchen. Instead of the training team and the serving team each chopping their own onions slightly differently, both grab pre-chopped onions from the same fridge. Because the ingredient is prepared once and shared, the dish tastes identical whether it&apos;s cooked for practice (training) or for a paying customer (serving). The store also remembers what the fridge held on any past date, so you can reconstruct exactly what was available when an old order came in.</p>
      </Basic>

      <Advanced>
        <p>The core technical guarantee is <strong>point-in-time correctness</strong>. To build a training row for an event at time <M>{"t"}</M>, you must join only feature values that were known strictly before <M>{"t"}</M>, never future ones. A naive join leaks the future and inflates offline metrics. Formally, for label timestamp <M>{"t_i"}</M> and feature observations with event times <M>{"\\tau"}</M>, the correct value is the most recent one satisfying:</p>
        <MB>{"f_i = f\\left(\\arg\\max_{\\tau \\le t_i} \\tau\\right)"}</MB>
        <p>This is an <strong>as-of join</strong> (backward-looking). The feature store enforces it automatically so every training label sees only its own past. The online store, by contrast, simply holds the single freshest value per entity key, since at serving time &quot;now&quot; is the only relevant moment.</p>
      </Advanced>

      <Callout kind="pitfall" title="Label leakage via point-in-time joins">
        Joining the latest feature value to a historical label is the most common feature-store bug. If a customer&apos;s &quot;total_lifetime_spend&quot; is joined as its present-day value to a churn event from last year, the model trains on information from the future and looks brilliant offline, then collapses in production.
      </Callout>

      <h2>What it looks like in practice</h2>
      <p>Modern tools (Feast, Tecton, Databricks) let you declare a feature once and request it for either path. The same definition powers an as-of join for training and a key lookup for serving.</p>

      <CodeBlock language="python" filename="feature_store.py">{`from feast import FeatureStore

store = FeatureStore(repo_path=".")

# TRAINING: as-of join — each label sees only its own past
training_df = store.get_historical_features(
    entity_df=labels,                 # has 'user_id' and 'event_timestamp'
    features=[
        "user_stats:txn_count_7d",
        "user_stats:avg_basket_value",
    ],
).to_df()
model.fit(training_df.drop(columns=["label"]), training_df["label"])

# SERVING: same feature names, latest value, sub-ms lookup
online = store.get_online_features(
    features=[
        "user_stats:txn_count_7d",
        "user_stats:avg_basket_value",
    ],
    entity_rows=[{"user_id": 42}],
).to_dict()
prediction = model.predict(to_vector(online))`}</CodeBlock>

      <MoreDepth>
        <p>A subtle senior-level trap is <strong>online freshness versus offline materialization lag</strong>. Even with one definition, if the batch job that refreshes the online store runs hourly, then at serving time a &quot;7-day count&quot; can be up to an hour stale, while the training data was computed with feature values current as of each event. The definitions match but the freshness does not, reintroducing skew. The fix is to make freshness an explicit, monitored SLA, and where minutes matter, compute the feature with a streaming engine so the online value reflects the same recency the offline as-of join assumes.</p>
      </MoreDepth>

      <Quiz question="Why does a feature store enforce point-in-time (as-of) joins when building training data?" options={[
        { text: "To make the offline store smaller than the online store", why: "Storage size is unrelated; both stores can be large or small independently." },
        { text: "So each training label only sees feature values that were known before the label's timestamp, preventing future leakage", correct: true, why: "Exactly — the backward-looking join reconstructs the past faithfully and avoids inflated, leaky metrics." },
        { text: "To reduce serving latency below one millisecond", why: "Low latency comes from the online key-value store, not from point-in-time joins, which are an offline concern." },
        { text: "Because joining the latest value is always more accurate for historical events", why: "It is the opposite: joining the latest value injects future information and causes label leakage." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="What problem does a feature store solve, and what is training-serving skew?" difficulty="easy" tag="Conceptual">
  <p>A feature store is a centralized system that computes, stores, and serves features so the <strong>same feature definition</strong> is used in both model training (offline) and prediction (online). It typically has two backends: an <strong>offline store</strong> (a data warehouse or columnar files) for large historical batches used in training, and an <strong>online store</strong> (a low-latency key-value store like Redis or DynamoDB) for single-row lookups at serving time.</p>
  <p><strong>Training-serving skew</strong> is any discrepancy between how a feature is computed during training versus serving. Common causes:</p>
  <ul>
    <li>Two separate code paths (a batch SQL job for training, a hand-written Python transform in the API) that drift apart over time.</li>
    <li>Different data sources or freshness: training reads the full warehouse, serving reads a cache that lags or rounds differently.</li>
    <li>Subtle type or unit mismatches (a count vs. a normalized rate, UTC vs. local time).</li>
  </ul>
  <p>The result is a model that scores well offline but degrades in production because the inputs it sees live no longer match the inputs it was trained on. A feature store reduces skew by making both paths read from <strong>one feature definition</strong>, ideally with the offline store materialized from the exact same transformation that feeds the online store.</p>
</InterviewProblem>
<InterviewProblem question="Why are point-in-time correct joins essential when building a training set from a feature store, and how do they prevent label leakage?" difficulty="hard" tag="Conceptual">
  <p>Suppose you train a model to predict whether a user churns, with a label timestamped at the moment churn is observed. Each training row needs feature values <strong>as they were known at or before the prediction time</strong>, never values that were updated afterward. A naive join that attaches the &quot;current&quot; value of each feature would leak future information into the past.</p>
  <p>Concretely, let a row have an event time <M>{"t_e"}</M>. For a feature with a history of updates at times <M>{"t_1 < t_2 < \\dots"}</M>, a <strong>point-in-time (as-of) join</strong> selects the most recent value satisfying:</p>
  <MB>{"\\hat{t} = \\max\\{\\, t_i : t_i \\le t_e \\,\\}"}</MB>
  <p>and uses that version of the feature. Often a <strong>time-to-live (TTL)</strong> is added so a feature only counts if <M>{"t_e - \\hat{t} \\le \\text{TTL}"}</M>, otherwise it is treated as missing (a stale value is worse than no value).</p>
  <p>This matters because leakage inflates offline metrics and silently fails in production. If a feature like &quot;number of support tickets&quot; is computed from the full table, a churning user&apos;s row would include tickets they filed <strong>after</strong> the prediction moment, which the model can never see live. Point-in-time joins are exactly why a feature store keeps timestamped feature histories rather than only the latest value.</p>
</InterviewProblem>
<InterviewProblem question="A real-time fraud model needs aggregate features like 'number of transactions by this card in the last hour' at serving time with under 50ms latency. How would you design this with a feature store?" difficulty="medium" tag="Applied">
  <p>The core tension: the feature is a <strong>sliding-window aggregation</strong> that changes by the second, but serving must be a single fast lookup. You cannot scan all of a card&apos;s transactions at request time. The design splits responsibility between precomputation and lookup.</p>
  <ul>
    <li><strong>Streaming aggregation:</strong> a stream processor (Flink, Spark Structured Streaming, or Kafka Streams) consumes the transaction event stream and maintains windowed counts/sums per card. It writes the current aggregate to the online store keyed by card id.</li>
    <li><strong>Online store:</strong> a low-latency KV store (Redis/DynamoDB) holds the latest aggregate so serving is an O(1) get, well within 50ms.</li>
    <li><strong>Offline parity:</strong> the <strong>same window logic</strong> is run as a batch job over historical events to materialize the offline store for training, using point-in-time joins so each training row gets the hour-window count as of that transaction&apos;s timestamp. This is what keeps training and serving consistent.</li>
    <li><strong>Freshness vs. correctness:</strong> decide tolerance for lag. Tumbling windows are cheap but jump at boundaries; true sliding windows are more accurate but heavier. Use watermarks to bound late-arriving events.</li>
  </ul>
  <p>The interviewer is usually probing whether you put heavy aggregation on the write path (streaming) rather than the read path (serving), and whether you guarantee the batch and streaming definitions match.</p>
  <CodeBlock language="python" filename="window_feature.py">{`# Sketch of a streaming hour-window count written to the online store.
# Same windowing must be mirrored in the offline batch job.

from datetime import timedelta

WINDOW = timedelta(hours=1)

def on_transaction(event, state_store, online_store):
    card = event["card_id"]
    now = event["event_time"]

    # Pull this card's recent timestamps, drop anything outside the window.
    hist = state_store.get(card, default=[])
    hist = [t for t in hist if now - t <= WINDOW]
    hist.append(now)
    state_store.put(card, hist)

    # The serving feature: count of txns in the trailing hour.
    online_store.set(
        key=f"card:{card}:txn_count_1h",
        value=len(hist),
        ttl=WINDOW,  # let it expire if no new events arrive
    )`}</CodeBlock>
</InterviewProblem>
<InterviewProblem question="A teammate proposes skipping the feature store and just having the serving service recompute features from raw tables on each request. What are the concrete trade-offs, and when is each approach right?" difficulty="medium" tag="Case">
  <p>On-demand recomputation is simpler to ship and avoids running a materialization pipeline, but it pushes cost and risk onto the request path. Weigh these axes:</p>
  <ul>
    <li><strong>Latency:</strong> recomputing aggregates from raw tables per request can be slow and unpredictable; a feature store precomputes and serves a single fast lookup. For tight SLAs (ads, fraud), on-demand often cannot meet the budget.</li>
    <li><strong>Consistency:</strong> a separate serving-time transform is a second code path, the classic source of training-serving skew. A feature store gives one definition for both, materialized to offline and online stores.</li>
    <li><strong>Reuse and governance:</strong> a feature store lets many models share, discover, and monitor the same features, with lineage and ownership. Ad-hoc recompute duplicates logic across services.</li>
    <li><strong>Freshness:</strong> on-demand is always fully fresh; a materialized online store can lag by its refresh interval. Some features genuinely need request-time values (e.g., the current request&apos;s own payload), which is why mature stores support <strong>on-demand / request-time feature transforms</strong> layered on top of precomputed ones.</li>
  </ul>
  <p>Right answers depend on context. A single low-traffic model with cheap features and loose latency may not need a store at all. As soon as you have multiple models, strict latency, expensive aggregations, or recurring skew bugs, the feature store earns its keep. A common production pattern is hybrid: precompute heavy historical aggregates in the store, then apply light request-time transforms (ratios, current-input features) on top.</p>
</InterviewProblem>

      </>
  );
}
