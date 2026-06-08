"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { CodeBlock } from "@/components/content/code-block";
import { Quiz } from "@/components/content/quiz";
import { InterviewProblem } from "@/components/content/interview-problem";
import { M, MB } from "@/components/content/math";

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
    <h2>Interview practice</h2>
<InterviewProblem question="Why structure a training workflow as a DAG instead of a single linear script?" difficulty="easy" tag="Conceptual">
  <p>A DAG (directed acyclic graph) makes the <strong>dependencies between steps explicit</strong>: ingest &rarr; validate &rarr; featurize &rarr; train &rarr; evaluate &rarr; register. The orchestrator then knows what can run in parallel, what to skip, and what to re-run.</p>
  <ul>
    <li><strong>Caching and resumption:</strong> if training fails, you re-run only the train node, not the expensive featurization upstream of it.</li>
    <li><strong>Parallelism:</strong> independent branches (e.g. building two feature groups) run concurrently because the DAG shows they share no edge.</li>
    <li><strong>Reproducibility and lineage:</strong> each node has declared inputs and outputs, so you can trace exactly which data and code produced a given model artifact.</li>
    <li><strong>Acyclic guarantee:</strong> no cycles means the run is guaranteed to terminate and have a well-defined topological execution order.</li>
  </ul>
  <p>A linear script hides all of this in implicit ordering and shared mutable state, which makes partial failures, retries, and audits painful.</p>
</InterviewProblem>
<InterviewProblem question="A teammate fits a scaler and selects features on the full dataset, then runs cross-validation on the pipeline. Why is this wrong, and how do you fix it?" difficulty="medium" tag="Applied">
  <p>This is <strong>data leakage</strong>. Any step that learns parameters from the data &mdash; the scaler&apos;s mean and variance, the feature selector&apos;s chosen columns, an imputer&apos;s fill values &mdash; must be fit on the <strong>training fold only</strong>. Fitting them on the full dataset lets information from the validation fold bleed into preprocessing, so cross-validation scores are optimistically biased and will not hold up in production.</p>
  <p>The fix is to put every learned transform <strong>inside</strong> the pipeline object and pass that object to the cross-validator, so fit happens fold-by-fold:</p>
  <CodeBlock language="python" filename="leakproof_cv.py">{`from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score

pipe = Pipeline([
    ("scale", StandardScaler()),          # fit on train fold only
    ("select", SelectKBest(f_classif, k=20)),
    ("clf", LogisticRegression(max_iter=1000)),
])

# cross_val_score re-fits the WHOLE pipeline on each train fold,
# so the scaler and selector never see the held-out fold.
scores = cross_val_score(pipe, X, y, cv=5, scoring="roc_auc")
print(scores.mean(), scores.std())`}</CodeBlock>
  <p>Rule of thumb: if a step has a <strong>fit</strong> method, it belongs inside the pipeline and inside the CV loop, never before it.</p>
</InterviewProblem>
<InterviewProblem question="What does it take to make a training run bit-for-bit reproducible, and which sources of nondeterminism are realistically out of your control?" difficulty="medium" tag="Conceptual">
  <p>Reproducibility means re-running the pipeline yields the same model and metrics. You need to pin every input to the computation:</p>
  <ul>
    <li><strong>Data:</strong> a versioned, immutable snapshot (content hash or dataset version), not a live query whose rows change.</li>
    <li><strong>Code:</strong> a git commit SHA for the pipeline and a locked dependency set (pinned versions, lockfile, or a container image digest).</li>
    <li><strong>Config and hyperparameters:</strong> captured as parameters of the run, not edited in place.</li>
    <li><strong>Randomness:</strong> a fixed seed threaded through data shuffling, weight init, and any stochastic sampling.</li>
    <li><strong>Environment:</strong> same library/CUDA/driver versions, ideally via a container.</li>
  </ul>
  <p>Honest caveats: GPU kernels (atomic reductions, cuDNN autotuning) and multi-threaded float summation can be nondeterministic unless you explicitly force deterministic modes, often at a speed cost. Hardware differences (CPU vs GPU, different GPU model) can change low-order bits. So target <strong>practical reproducibility</strong> (same metrics within tolerance, full lineage logged) and reserve bit-exactness for runs where you have locked the hardware and enabled deterministic flags.</p>
</InterviewProblem>
<InterviewProblem question="Each stage of a 5-stage pipeline succeeds independently with probability 0.95. What is the chance a run completes end to end, and how do retries change it?" difficulty="hard" tag="Math">
  <p>Stages are sequential, so the run succeeds only if all five succeed. With independent stages:</p>
  <MB>{"P(\\text{run}) = \\prod_{i=1}^{5} p_i = 0.95^5 \\approx 0.774"}</MB>
  <p>So roughly <strong>23%</strong> of runs fail somewhere &mdash; a strong argument for not relying on a clean single pass. Now suppose each stage is automatically retried up to <M>{"r"}</M> times, and retries fail independently. A single stage now fails only if all <M>{"r+1"}</M> attempts fail:</p>
  <MB>{"P(\\text{stage ok}) = 1 - (1 - p)^{\\,r+1}"}</MB>
  <p>With one retry (<M>{"r=1"}</M>) per stage, each stage succeeds with <M>{"1 - 0.05^2 = 0.9975"}</M>, so the whole run succeeds with:</p>
  <MB>{"P(\\text{run}) = (1 - 0.05^2)^5 = 0.9975^5 \\approx 0.9876"}</MB>
  <p>End-to-end failure drops from about 23% to about 1.2%. The lesson: <strong>idempotent, retryable stages</strong> are how orchestrators (Airflow, etc.) turn flaky-but-mostly-working steps into reliable pipelines &mdash; but retries only help if a stage is safe to re-run and its failures are transient and roughly independent (a deterministic bug retried still fails every time).</p>
</InterviewProblem>

      </>
  );
}
