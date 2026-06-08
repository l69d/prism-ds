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
    </>
  );
}
