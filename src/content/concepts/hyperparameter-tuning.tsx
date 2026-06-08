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
      <p>
        A model&apos;s weights are learned from data, but its <strong>hyperparameters</strong> &mdash;
        tree depth, learning rate, regularization strength &mdash; are knobs you set before training.
        Tuning is the search for the knob settings that generalize best.
      </p>

      <KeyIdea>
        You are searching a space of configurations, scoring each by validation performance. The
        danger is that the more configurations you try, the more you risk picking one that just got
        lucky on that particular validation set.
      </KeyIdea>

      <h2>Three search strategies</h2>
      <ul>
        <li>
          <strong>Grid search</strong>: enumerate every combination on a fixed mesh. Exhaustive and
          reproducible, but cost explodes with the number of hyperparameters.
        </li>
        <li>
          <strong>Random search</strong>: sample configurations at random from defined ranges. With
          the same budget it usually beats grid, because it spends trials exploring the few knobs
          that actually matter rather than wasting them on irrelevant axes.
        </li>
        <li>
          <strong>Bayesian optimization</strong>: build a probabilistic model of &quot;score given
          config&quot; and use it to propose the next config that best trades off promising regions
          against unexplored ones.
        </li>
      </ul>

      <Basic>
        <p>
          Imagine baking cookies. The recipe&apos;s ingredients are the data; the oven temperature
          and bake time are hyperparameters. Grid search tries every temperature-and-time pair on a
          chart. Random search throws darts at the chart &mdash; surprisingly efficient, because if
          only temperature matters, every dart still tests a new temperature. Bayesian search is the
          experienced baker who, after a few batches, focuses on the settings that have looked best.
        </p>
      </Basic>

      <Advanced>
        <p>
          Formally we minimize the expected generalization loss over a hyperparameter vector
          <M>{"\\lambda"}</M>:
        </p>
        <MB>{"\\lambda^{*} = \\arg\\min_{\\lambda \\in \\Lambda} \; \\mathbb{E}_{(x,y)}\\big[\\, \\mathcal{L}(f_{\\theta^{*}(\\lambda)}(x), y) \\,\\big]"}</MB>
        <p>
          where <M>{"\\theta^{*}(\\lambda)"}</M> are the weights fit on the training set for a given
          <M>{"\\lambda"}</M>. We cannot evaluate the true expectation, so we approximate it with a
          validation estimate. Bayesian optimization places a surrogate (often a Gaussian process)
          over the response surface and selects the next point by maximizing an acquisition function
          such as Expected Improvement:
        </p>
        <MB>{"\\text{EI}(\\lambda) = \\mathbb{E}\\big[\\max(0,\; f_{\\text{best}} - f(\\lambda))\\big]"}</MB>
        <p>
          Why random beats grid: with <M>{"k"}</M> hyperparameters but only a handful influential,
          grid wastes resolution on dead axes, while random search&apos;s marginal coverage of any
          single important axis grows with the trial count regardless of <M>{"k"}</M>.
        </p>
      </Advanced>

      <Callout kind="pitfall" title="Overfitting the validation set">
        Every time you pick the best config by validation score, you are optimizing against that
        specific split. After hundreds of trials the &quot;best&quot; score is partly noise. Always
        keep a held-out test set you touch exactly once, and report that number.
      </Callout>

      <CodeBlock language="python" filename="tune.py">{`from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import RandomizedSearchCV
from scipy.stats import randint

# Define a distribution, not a grid: random search samples from these.
param_dist = {
    "n_estimators": randint(100, 600),
    "max_depth": randint(3, 20),
    "min_samples_leaf": randint(1, 20),
}

search = RandomizedSearchCV(
    RandomForestClassifier(random_state=0),
    param_distributions=param_dist,
    n_iter=40,            # budget: 40 sampled configs
    cv=5,                 # inner cross-validation for each config
    scoring="roc_auc",
    random_state=0,
    n_jobs=-1,
)
search.fit(X_trainval, y_trainval)

print("best params:", search.best_params_)
print("cv score:", search.best_score_)
# Report generalization ONCE on the untouched test set:
print("test score:", search.score(X_test, y_test))`}</CodeBlock>

      <MoreDepth>
        <p>
          For honest estimates of tuned-model performance, use <strong>nested cross-validation</strong>:
          an inner loop selects hyperparameters and an outer loop measures generalization. The outer
          folds never inform the search, so the reported score is not optimistically biased by the
          tuning itself. It is expensive, but it is the principled answer to &quot;how good is my
          pipeline, tuning included?&quot; &mdash; not &quot;how good is this one chosen config?&quot;
          Cheaper modern alternatives like Hyperband and ASHA add early stopping, killing weak
          configs after a few epochs so the budget concentrates on survivors.
        </p>
      </MoreDepth>

      <Quiz question="With a fixed compute budget and 8 hyperparameters of which only 2 matter, why does random search typically outperform grid search?" options={[
        { text: "Random search always finds the global optimum, while grid search cannot.", why: "Neither method guarantees the global optimum; both are heuristic samplers of a continuous space." },
        { text: "Random search spreads trials so each important hyperparameter gets many distinct values, instead of wasting resolution on the irrelevant axes.", correct: true, why: "Grid resolution is divided across all axes including dead ones; random sampling gives broad marginal coverage of the few axes that matter." },
        { text: "Random search trains each model faster than grid search does.", why: "Per-model training cost is identical; the difference is purely in which configurations get evaluated." },
        { text: "Random search never overfits the validation set.", why: "Any selection-by-validation-score can overfit the split; that risk is independent of grid vs random." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="When does random search beat grid search, and why?" difficulty="easy" tag="Conceptual">
  <p>Grid search evaluates every point on a Cartesian product of per-hyperparameter values. If you have <M>{"k"}</M> hyperparameters with <M>{"m"}</M> values each, that is <M>{"m^k"}</M> trials &mdash; exponential in dimension.</p>
  <p>The key insight (Bergstra &amp; Bengio, 2012) is that <strong>only a few hyperparameters usually matter</strong>, but you do not know which in advance. Grid search wastes effort: with a grid, every trial reuses the same handful of distinct values along the important axis. With <M>{"n"}</M> grid points over 2 dims you only test <M>{"\\sqrt{n}"}</M> distinct values of each.</p>
  <ul>
    <li>Random search draws each trial independently from the search distributions, so <strong>every trial tests a new value of the important hyperparameter</strong>. With <M>{"n"}</M> random trials you get <M>{"n"}</M> distinct values of each axis.</li>
    <li>Result: for a fixed budget, random search covers the important dimensions far more densely and tends to find better configs in high dimensions.</li>
  </ul>
  <p>Use grid only when the space is small and low-dimensional (1&ndash;2 hyperparameters); prefer random (or Bayesian) otherwise.</p>
</InterviewProblem>
<InterviewProblem question="You ran 500 random configs and picked the one with the best validation score. Why is that score an optimistic estimate of test performance, and how do you fix it?" difficulty="medium" tag="Applied">
  <p>This is <strong>overfitting the validation set</strong> through multiple comparisons. Each validation score is the true score plus noise. When you take the <strong>maximum</strong> over many noisy estimates, you systematically select configs whose noise happened to be positive, so the reported best score is biased upward.</p>
  <p>Intuition: if 500 configs all had the same true score but i.i.d. noise, the winner is the luckiest draw, not the best model. The more configs you try, the larger this &quot;winner&apos;s curse&quot; selection bias.</p>
  <p>Fixes:</p>
  <ul>
    <li><strong>Hold out a separate test set</strong> touched only once, after tuning is fully done. Never select on it.</li>
    <li><strong>Nested cross-validation</strong>: an inner CV loop picks hyperparameters, an outer loop estimates generalization. The outer score is unbiased because hyperparameters are chosen without seeing the outer fold.</li>
    <li>Reduce variance of the selection metric (more CV folds, repeated CV) so the ranking is driven by signal, not luck.</li>
    <li>Prefer simpler configs among near-ties (a one-standard-error rule) to avoid chasing noise.</li>
  </ul>
  <p>Report the <strong>test</strong> (or outer-CV) number as your performance estimate, not the best validation number.</p>
</InterviewProblem>
<InterviewProblem question="With 5-fold CV per config, how many random configs do you need so that at least one lands in the top 5% of the search space with 95% probability? Then estimate the total model fits." difficulty="medium" tag="Math">
  <p>Treat each random config as independently landing in the top 5% with probability <M>{"p = 0.05"}</M>. The probability that <strong>none</strong> of <M>{"n"}</M> trials is in the top 5% is <M>{"(1-p)^n"}</M>. We want at least one hit with probability 0.95:</p>
  <MB>{"1 - (1-p)^n \\ge 0.95 \\;\\Longleftrightarrow\\; (0.95)^n \\le 0.05"}</MB>
  <p>Solve for <M>{"n"}</M>:</p>
  <MB>{"n \\ge \\frac{\\ln 0.05}{\\ln 0.95} = \\frac{-2.996}{-0.0513} \\approx 58.4 \\Rightarrow n = 59"}</MB>
  <p>A handy rule: about <M>{"n \\approx 60"}</M> random trials give &gt;95% chance of hitting the top 5%, and this is <strong>independent of dimensionality</strong> &mdash; the appeal of random search.</p>
  <p>With 5-fold CV, total model fits are <M>{"59 \\times 5 = 295"}</M>. If a single fit takes 2 minutes, that is roughly <M>{"295 \\times 2 = 590"}</M> minutes &asymp; 10 hours serially, motivating parallelism or early stopping.</p>
</InterviewProblem>
<InterviewProblem question="Explain how Bayesian optimization chooses the next hyperparameter to try, and one failure mode to watch for." difficulty="hard" tag="Conceptual">
  <p>Bayesian optimization treats the validation score as an expensive black-box function <M>{"f(\\theta)"}</M> of the hyperparameters <M>{"\\theta"}</M>. It maintains a probabilistic <strong>surrogate model</strong> (often a Gaussian process, or a tree-based model like the TPE in Hyperopt/Optuna) that gives a posterior mean <M>{"\\mu(\\theta)"}</M> and uncertainty <M>{"\\sigma(\\theta)"}</M> at every point.</p>
  <p>It then maximizes an <strong>acquisition function</strong> that trades off exploiting promising regions against exploring uncertain ones. A common choice is Expected Improvement over the current best <M>{"f^*"}</M>:</p>
  <MB>{"\\mathrm{EI}(\\theta) = \\mathbb{E}\\big[\\max(0,\\; f(\\theta) - f^*)\\big]"}</MB>
  <p>The next config is the <M>{"\\theta"}</M> that maximizes EI. After evaluating it, the surrogate is updated and the loop repeats. Because it learns from past trials, it is far more sample-efficient than random search when fits are expensive.</p>
  <p>Failure modes and cautions:</p>
  <ul>
    <li><strong>Over-exploitation / premature convergence</strong>: if the acquisition over-weights the mean it collapses onto a local optimum. Tune the explore&ndash;exploit balance (e.g. EI&apos;s jitter, or use UCB with a sensible <M>{"\\kappa"}</M>).</li>
    <li>It is <strong>sequential</strong> by nature, so it parallelizes worse than random search; use batched / constant-liar variants if you have many workers.</li>
    <li>The surrogate must handle conditional and categorical spaces; a plain GP struggles, whereas TPE handles them more naturally.</li>
    <li>Noisy CV scores can mislead the surrogate &mdash; reduce evaluation noise or model it explicitly.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="Write code to run randomized hyperparameter search with proper nested CV so the reported score is not optimistic." difficulty="hard" tag="Coding">
  <p>The inner loop (<strong>RandomizedSearchCV</strong>) selects hyperparameters; the outer <strong>cross_val_score</strong> estimates generalization on folds never used for selection. The outer mean is an honest performance estimate.</p>
  <CodeBlock language="python" filename="nested_cv.py">{`import numpy as np
from scipy.stats import loguniform, randint
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import (
    RandomizedSearchCV, StratifiedKFold, cross_val_score)
from sklearn.datasets import make_classification

X, y = make_classification(n_samples=2000, n_informative=8, random_state=0)

param_dist = {
    "learning_rate": loguniform(1e-3, 3e-1),   # log scale for rates
    "max_depth": randint(2, 6),
    "n_estimators": randint(100, 600),
    "subsample": loguniform(0.5, 1.0),
}

inner = StratifiedKFold(5, shuffle=True, random_state=1)
outer = StratifiedKFold(5, shuffle=True, random_state=2)

search = RandomizedSearchCV(
    GradientBoostingClassifier(random_state=0),
    param_distributions=param_dist,
    n_iter=60,                 # ~60 trials -> >95% chance of top-5% config
    scoring="roc_auc",
    cv=inner,                  # INNER loop selects hyperparameters
    random_state=0,
    n_jobs=-1,
)

# OUTER loop: each outer fold re-tunes on its own training data,
# then scores on a held-out fold the tuner never saw.
outer_scores = cross_val_score(search, X, y, cv=outer, scoring="roc_auc")
print(f"Unbiased AUC: {outer_scores.mean():.3f} +/- {outer_scores.std():.3f}")

# Final model: refit the search on ALL data to get production hyperparams.
search.fit(X, y)
print("Best params:", search.best_params_)
print("Inner-CV best (optimistic):", round(search.best_score_, 3))`}</CodeBlock>
  <p>Note two things: rates like <M>{"\\eta"}</M> are sampled <strong>log-uniformly</strong> because they matter multiplicatively, and the gap between the optimistic <strong>best_score_</strong> and the outer <strong>outer_scores.mean()</strong> quantifies the selection bias you avoided reporting.</p>
</InterviewProblem>

      </>
  );
}
