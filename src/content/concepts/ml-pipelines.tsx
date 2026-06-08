"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { CodeBlock } from "@/components/content/code-block";
import { Quiz } from "@/components/content/quiz";

export default function Lesson() {
  return (
    <>
      <p>A model is only the last step of a long chain: pull data, clean it, build features, train, evaluate, and ship. An <strong>ML pipeline</strong> turns that chain into explicit, ordered, repeatable steps so the same inputs always produce the same artifacts.</p>

      <KeyIdea>A pipeline is a directed acyclic graph (DAG) of steps where edges encode data dependencies. The graph &mdash; not your memory of what you ran &mdash; is the source of truth for how a model was produced.</KeyIdea>

      <h2>From scripts to DAGs</h2>
      <p>Early projects live in a notebook run top-to-bottom by hand. That breaks the moment you need to rerun only the changed parts, parallelize independent work, or reproduce last month&apos;s model. A pipeline fixes this by making each step:</p>
      <ul>
        <li><strong>Declared</strong> &mdash; its inputs and outputs are named explicitly.</li>
        <li><strong>Ordered by dependency</strong> &mdash; an orchestrator (Airflow, Kubeflow, Metaflow, Dagster) topologically sorts the DAG and runs steps only after their parents finish.</li>
        <li><strong>Cached &amp; idempotent</strong> &mdash; if an input is unchanged, the step&apos;s output can be reused instead of recomputed.</li>
      </ul>

      <h2>Reproducibility</h2>
      <p>A run is reproducible only if you pin everything that influences the output: the <strong>data snapshot</strong> (a versioned, immutable reference, not &quot;whatever was in the table today&quot;), the <strong>code commit</strong>, the <strong>config/hyperparameters</strong>, and the <strong>environment</strong> (library versions, random seeds). Loosen any one and your &quot;same&quot; run silently drifts.</p>

      <Basic><p>Think of a pipeline like a recipe with numbered steps. Each step says exactly what it needs from earlier steps and what it produces. If you change the frosting, you do not re-bake the cake &mdash; you only redo the steps downstream of the change. And because the recipe lists exact quantities and oven settings, anyone following it gets the same cake. Run-by-hand notebooks are like cooking from memory: it works once, but you can never recreate it.</p></Basic>

      <Advanced><p>Formally the pipeline is a DAG <strong>G = (V, E)</strong> where vertices are steps and a directed edge u &rarr; v means v consumes an output of u. Acyclicity guarantees a topological order exists, so the scheduler can execute steps respecting dependencies and run independent branches concurrently. Reproducibility is the claim that the output is a deterministic function of a fully pinned input tuple &mdash; (data hash, code SHA, config, seed, environment). Caching is valid exactly when that tuple is unchanged: hash the inputs, and a cache hit lets you skip recomputation while preserving the same logical result. This is why frameworks key their artifact cache on content hashes rather than wall-clock time.</p></Advanced>

      <Callout kind="pitfall" title="Train/serve skew from duplicated logic">Re-implementing feature transforms separately for training and inference is the most common production bug. The two copies drift, and your live model sees subtly different inputs than it trained on. Share one transform definition (a fitted pipeline object or a feature store) across both paths.</Callout>

      <CodeBlock language="python" filename="pipeline.py">{`from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression

# One object owns the whole transform + model chain.
pipe = Pipeline([
    ("impute", SimpleImputer(strategy="median")),
    ("scale", StandardScaler()),
    ("clf", LogisticRegression(max_iter=1000)),
])

# fit() learns imputation values and scaling stats on TRAIN only,
# so no test-set statistics leak into preprocessing.
pipe.fit(X_train, y_train)

# The exact same fitted steps run at inference time -> no train/serve skew.
preds = pipe.predict(X_test)`}</CodeBlock>

      <MoreDepth><p>Orchestration splits into two layers people often conflate. The <strong>control plane</strong> decides ordering, retries, and scheduling (the DAG engine); the <strong>data plane</strong> moves the actual bytes between steps. Keeping large artifacts out of the control plane &mdash; passing references (paths, URIs, content hashes) instead of payloads &mdash; is what lets pipelines scale. It also makes backfills cheap: rerun a node, write a new versioned artifact, and downstream caches invalidate by hash rather than by you remembering what was stale.</p></MoreDepth>

      <Quiz question="Why do production ML pipelines fit preprocessing steps inside the same pipeline object as the model, rather than transforming data in a separate upfront script?" options={[
        { text: "It makes training run faster on the GPU", why: "Bundling transforms with the model does not change compute speed; it is about correctness, not throughput." },
        { text: "It guarantees the identical fitted transform runs at both train and inference time, preventing train/serve skew and leakage", correct: true, why: "A single fitted object applies the same learned statistics everywhere and fits them on train only, avoiding skew and test-set leakage." },
        { text: "Separate scripts are not allowed by orchestration frameworks", why: "Frameworks happily run separate steps; the issue is duplicated logic drifting, not a hard prohibition." },
        { text: "It removes the need to version the input data", why: "Reproducibility still requires pinning a data snapshot regardless of where preprocessing lives." },
      ]} />
    </>
  );
}
