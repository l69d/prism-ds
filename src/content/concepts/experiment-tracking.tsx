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
    <h2>Interview practice</h2>
<InterviewProblem question="What does it actually mean to make an ML experiment reproducible, and what minimal set of things must you version to get there?" difficulty="easy" tag="Conceptual">
  <p>Reproducibility means that re-running the same experiment yields the same model and the same metrics &mdash; or at least metrics within known statistical noise. A logged accuracy number is worthless if you cannot regenerate it.</p>
  <p>The minimal set of artifacts to version:</p>
  <ul>
    <li><strong>Code</strong> &mdash; a git commit SHA for the training script, preprocessing, and library pins (a lockfile or container image), so the exact transforms and model definition are recoverable.</li>
    <li><strong>Data</strong> &mdash; a content hash or version tag of the exact training/validation snapshot (tools like DVC or a dataset registry). &quot;The customers table&quot; mutates daily; a hash does not.</li>
    <li><strong>Config / hyperparameters</strong> &mdash; learning rate, seed, splits, feature set, every knob that changes the result.</li>
    <li><strong>Environment</strong> &mdash; Python and CUDA versions, package versions; ideally a frozen image.</li>
    <li><strong>The seed</strong> &mdash; for data shuffling, weight init, and dropout, so stochastic steps repeat.</li>
  </ul>
  <p>The key idea: the model is a <strong>pure function</strong> of (code, data, config, environment, seed). Pin all five and the output is deterministic; leave any one floating and you cannot trust the comparison.</p>
</InterviewProblem>
<InterviewProblem question="A teammate says model B beat model A by 0.4% AUC, so we should ship B. What do you check before trusting that comparison?" difficulty="medium" tag="Applied">
  <p>A 0.4% gap is small enough that it could be noise or an apples-to-oranges comparison. I&apos;d use the tracking system to confirm the two runs are genuinely comparable:</p>
  <ul>
    <li><strong>Same eval data and split.</strong> Compare the logged data hash and split seed. If B was scored on a different validation snapshot or a re-shuffled split, the gap is meaningless.</li>
    <li><strong>Same metric definition.</strong> Confirm both logged AUC the same way (same threshold-free computation, same positive class, no leakage from a changed feature).</li>
    <li><strong>Statistical significance.</strong> 0.4% on a small test set is within noise. I&apos;d look at variance across seeds: re-run each model with several seeds and compare the distributions, not two point estimates.</li>
    <li><strong>No train/eval leakage between runs.</strong> Check that B&apos;s feature pipeline did not accidentally fit on validation data.</li>
    <li><strong>Cost of the change.</strong> Even if real, weigh 0.4% against added latency, complexity, or training cost logged for B.</li>
  </ul>
  <p>The reason experiment tracking matters here: without logged data hashes, split seeds, and per-seed metrics, you literally cannot answer any of these questions &mdash; you are comparing two numbers with no provenance.</p>
</InterviewProblem>
<InterviewProblem question="Estimate the standard error of a test-set AUC and explain how many seeds you would re-run to detect a real 0.4% improvement." difficulty="hard" tag="Math">
  <p>Treat each model&apos;s test metric as a random variable whose spread comes from finite test data plus training stochasticity (init, shuffling). Suppose across <M>{"k"}</M> seeds we observe sample standard deviation <M>{"s"}</M> of the AUC. The standard error of the mean metric is:</p>
  <MB>{"\\mathrm{SE} = \\frac{s}{\\sqrt{k}}"}</MB>
  <p>To call a difference <M>{"\\Delta = 0.004"}</M> significant at roughly the 95% level for a two-sided comparison of two means, we want the gap to exceed about two combined standard errors:</p>
  <MB>{"\\Delta \\gtrsim 2\\sqrt{\\mathrm{SE}_A^2 + \\mathrm{SE}_B^2} = 2\\sqrt{\\tfrac{2 s^2}{k}}"}</MB>
  <p>Solving for the number of seeds per model:</p>
  <MB>{"k \\gtrsim \\frac{8 s^2}{\\Delta^2}"}</MB>
  <p>So if seed-to-seed AUC noise is <M>{"s = 0.005"}</M> and we want to detect <M>{"\\Delta = 0.004"}</M>, then <M>{"k \\gtrsim 8(0.005)^2/(0.004)^2 \\approx 12.5"}</M> &mdash; roughly 13 seeds each. The practical lesson: a single-run 0.4% win is almost never trustworthy, and the only way to make this call is to <strong>log every seed&apos;s metric</strong> so you can estimate <M>{"s"}</M> at all.</p>
</InterviewProblem>
<InterviewProblem question="Instrument a training script so every run is reproducible and comparable. Show what you would log." difficulty="medium" tag="Coding">
  <p>The core pattern: fix the seed, capture provenance (code SHA, data hash, environment), then log params, metrics, and the model artifact under one run ID. Below is a tracker-agnostic sketch (the calls map cleanly onto MLflow, Weights &amp; Biases, etc.).</p>
  <CodeBlock language="python" filename="train.py">{`import hashlib, subprocess, random
import numpy as np
import tracker  # stand-in for mlflow / wandb

SEED = 42

def set_seeds(seed):
    random.seed(seed)
    np.random.seed(seed)
    # torch.manual_seed(seed); torch.cuda.manual_seed_all(seed)

def git_sha():
    return subprocess.check_output(
        ["git", "rev-parse", "HEAD"]).decode().strip()

def data_hash(df):
    # content hash => the exact snapshot is recoverable, not "today's table"
    return hashlib.sha256(
        df.to_csv(index=False).encode()).hexdigest()[:12]

def run_experiment(train_df, val_df, params):
    set_seeds(SEED)
    with tracker.start_run() as run:
        # 1. provenance: code + data + environment
        tracker.log_params({
            "git_sha": git_sha(),
            "train_hash": data_hash(train_df),
            "val_hash": data_hash(val_df),
            "seed": SEED,
            **params,           # lr, depth, feature_set, ...
        })

        model = fit_model(train_df, params)

        # 2. metrics logged against the SAME val snapshot above
        auc = evaluate(model, val_df)
        tracker.log_metrics({"val_auc": auc})

        # 3. the artifact itself, tied to this run id
        tracker.log_model(model, name="model")
        return run.id, auc

if __name__ == "__main__":
    for seed in range(13):          # multiple seeds => estimate noise
        SEED = seed
        run_experiment(train_df, val_df, {"lr": 0.05, "depth": 6})
`}</CodeBlock>
  <p>Why each piece matters: the <strong>git SHA + data hashes</strong> make the run a pure function of recoverable inputs; logging against the <strong>same val snapshot</strong> guarantees comparability across runs; logging the <strong>model artifact under the run ID</strong> means a winning metric can be traced back to a deployable file; and the <strong>seed loop</strong> produces the distribution you need to judge whether a small gap is real.</p>
</InterviewProblem>

      </>
  );
}
