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
      <p>Six weeks ago you trained a model that scored 0.91. Today nothing you try beats 0.87. Which learning rate did you use? Which data snapshot? Without a record, that 0.91 is gone forever. Experiment tracking is the discipline of recording every run so results are reproducible and comparable.</p>

      <KeyIdea>A model&apos;s score is meaningless on its own. It is only trustworthy when you can reproduce it from the exact code, data, and hyperparameters that produced it.</KeyIdea>

      <h2>What a run actually is</h2>
      <p>Think of every training run as a function whose output is a model plus its metrics. The inputs are not just hyperparameters &mdash; they include the full state that determined the result:</p>
      <ul>
        <li><strong>Code</strong> &mdash; the exact commit hash, so logic is pinned.</li>
        <li><strong>Data</strong> &mdash; a version or hash of the dataset, since data drifts silently.</li>
        <li><strong>Config</strong> &mdash; hyperparameters, the random seed, library versions.</li>
        <li><strong>Outputs</strong> &mdash; metrics, the trained weights (artifacts), and logs.</li>
      </ul>
      <p>A tracker (MLflow, Weights &amp; Biases, DVC) captures all of this automatically and gives each run a unique ID, so two runs become a fair side-by-side comparison rather than a guessing game.</p>

      <Basic>
        <p>Imagine a lab notebook for machine learning. A chemist writes down the exact quantities, temperature, and timing for every experiment so a colleague can repeat it and get the same crystals. Experiment tracking is that notebook, but automatic: every time you train, it silently logs what you fed in and what came out. Later you can sort all your runs by accuracy and instantly see <em>why</em> the best one won.</p>
      </Basic>

      <Advanced>
        <p>Reproducibility means determinism: given the same inputs, you get the same output. Formally, a run is a mapping</p>
        <MB>{"r = f(C, D, H, s)"}</MB>
        <p>where <M>{"C"}</M> is the code commit, <M>{"D"}</M> the data version, <M>{"H"}</M> the hyperparameters, and <M>{"s"}</M> the random seed. True reproducibility requires pinning all four. The danger is hidden nondeterminism: GPU floating-point reductions are non-associative, so</p>
        <MB>{"(a + b) + c \\neq a + (b + c)"}</MB>
        <p>at the bit level, and parallel kernels accumulate in nondeterministic order. Even with a fixed seed, two runs can diverge. Bit-exact reproducibility needs deterministic backends plus a recorded environment (e.g. a frozen dependency lockfile and CUDA version).</p>
      </Advanced>

      <Callout kind="pitfall" title="Logging metrics but not artifacts">
        Recording that run #47 hit 0.91 accuracy is useless if you cannot retrieve the actual weights and the data version behind it. Track the artifacts and the dataset hash, not just the scalar score &mdash; otherwise the best number is just a tombstone.
      </Callout>

      <CodeBlock language="python" filename="track.py">{`import mlflow

mlflow.set_experiment("churn-classifier")

with mlflow.start_run():
    # 1. Pin the inputs
    params = {"lr": 0.01, "max_depth": 6, "seed": 42}
    mlflow.log_params(params)
    mlflow.log_param("data_version", "v3-2026-06-01")
    mlflow.log_param("git_commit", "a1b9f2c")

    model = train(X_train, y_train, **params)

    # 2. Pin the outputs
    auc = evaluate(model, X_val, y_val)
    mlflow.log_metric("val_auc", auc)
    mlflow.sklearn.log_model(model, "model")  # the artifact

# Compare every run later:
#   mlflow.search_runs(order_by=["metrics.val_auc DESC"])`}</CodeBlock>

      <MoreDepth>
        <p>The subtle failure is <strong>data leakage across runs</strong>. If your preprocessing (scalers, encoders, imputed values) is fit on the full dataset before tracking begins, every run inherits the same leaked statistics &mdash; reproducible, but reproducibly wrong. Mature pipelines version the <em>transform</em> as an artifact too, fit only on training folds, so that a re-run regenerates the leakage-free pipeline rather than reusing a tainted one. Reproducibility guarantees you can repeat a result; it does not guarantee the result was correct.</p>
      </MoreDepth>

      <Quiz question="You logged val_auc=0.91 for a run but cannot reproduce it. What single piece of tracked metadata is most likely to explain the gap?" options={[
        { text: "The wall-clock training time", why: "Duration is useful for cost analysis but does not affect the model's predictions or score." },
        { text: "The data version / snapshot hash", why: "Correct. Data drifts silently; if the dataset changed since the run, the same code and seed will produce a different model and score." },
        { text: "The name of the experiment", why: "A label organizes runs but carries no information about what produced the result." },
        { text: "The number of CPU cores", why: "Core count can affect speed and occasionally parallel ordering, but it is far less likely than a changed dataset to move the score from 0.91." },
      ]} />
    </>
  );
}
