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
    </>
  );
}
