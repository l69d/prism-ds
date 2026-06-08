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
      <p>A single deep decision tree memorizes its training data and swings wildly with tiny changes. Ensembles fight this by training many such trees and averaging their votes.</p>

      <KeyIdea>Averaging many noisy-but-roughly-correct models cancels their independent errors, so the crowd is far more stable than any single member.</KeyIdea>

      <h2>Bagging: bootstrap aggregating</h2>
      <p>Bagging builds each model on a <strong>bootstrap sample</strong> &mdash; a dataset of the same size drawn with replacement from the original. Each model sees a slightly different world, so they make different mistakes.</p>
      <ul>
        <li><strong>Bootstrap:</strong> resample the rows with replacement, leaving roughly a third of the data &quot;out of bag&quot; for each tree.</li>
        <li><strong>Aggregate:</strong> average the predictions for regression, or take a majority vote for classification.</li>
      </ul>

      <h2>Random Forests add a twist</h2>
      <p>A Random Forest is bagging on trees, plus one extra trick: at every split, the tree may only consider a <strong>random subset of features</strong>. This stops one dominant feature from making all trees look alike, which decorrelates them and tightens the variance reduction.</p>

      <Basic>
        <p>Imagine asking 100 slightly-different doctors for a diagnosis instead of one. Each doctor has quirks and blind spots, but those quirks point in random directions. When you tally the votes, the individual mistakes wash out and the shared signal &mdash; the actual illness &mdash; survives. Random Forests also forbid every doctor from leaning on the same single symptom, forcing genuinely independent opinions.</p>
      </Basic>

      <Advanced>
        <p>For an average of <M>{"B"}</M> identically-distributed predictors each with variance <M>{"\\sigma^2"}</M> and pairwise correlation <M>{"\\rho"}</M>, the variance of the ensemble is:</p>
        <MB>{"\\operatorname{Var}\\!\\left(\\frac{1}{B}\\sum_{b=1}^{B} f_b\\right) = \\rho\\,\\sigma^2 + \\frac{1-\\rho}{B}\\,\\sigma^2"}</MB>
        <p>As <M>{"B \\to \\infty"}</M> the second term vanishes, leaving the floor <M>{"\\rho\\sigma^2"}</M>. So adding more trees only helps until the correlation floor dominates &mdash; which is exactly why the random feature subset (lowering <M>{"\\rho"}</M>) matters more than sheer tree count.</p>
      </Advanced>

      <Callout kind="insight" title="Why deep trees, not shallow ones">
        Bagging reduces variance but leaves bias untouched, so you want high-variance, low-bias base learners. That is why Random Forest trees are grown deep and left unpruned &mdash; each is overfit on purpose, and the averaging cleans up the variance.
      </Callout>

      <CodeBlock language="python" filename="random_forest.py">{`from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import cross_val_score

X, y = load_breast_cancer(return_X_y=True)

rf = RandomForestClassifier(
    n_estimators=300,      # number of trees
    max_features="sqrt",   # random feature subset per split
    oob_score=True,        # free validation on out-of-bag rows
    n_jobs=-1,
    random_state=0,
)
rf.fit(X, y)

print("OOB accuracy:", round(rf.oob_score_, 4))
print("CV accuracy :", round(cross_val_score(rf, X, y, cv=5).mean(), 4))`}</CodeBlock>

      <MoreDepth>
        <p>The out-of-bag score is a near-free cross-validation: each row is predicted only by the trees that never saw it, giving an honest generalization estimate without a held-out split. But OOB error can be mildly optimistic when rows are correlated (e.g. time series or grouped data), since bootstrap resampling assumes exchangeability. For those cases, prefer grouped or time-aware cross-validation over trusting <code>oob_score_</code>.</p>
      </MoreDepth>

      <Quiz question="Why does a Random Forest restrict each split to a random subset of features rather than always using all of them?" options={[
        { text: "To make each tree train faster on fewer columns", why: "Speed is a minor side effect, not the statistical purpose of the trick." },
        { text: "To lower the correlation between trees so averaging reduces variance more", correct: true, why: "Decorrelating the trees shrinks the rho*sigma^2 floor, the dominant term as the number of trees grows." },
        { text: "To reduce the bias of each individual tree", why: "Feature subsampling does not lower bias; bagging targets variance, not bias." },
        { text: "To guarantee every feature is used exactly once across the forest", why: "There is no such guarantee, and it is unrelated to why subsampling helps." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="Why does averaging many high-variance, low-bias trees reduce error, and what assumption does the variance reduction depend on?" difficulty="easy" tag="Conceptual">
  <p>A single deep decision tree has low bias but high variance: small changes in the training data produce very different trees. Bagging trains <M>{"B"}</M> trees on bootstrap resamples and averages their predictions. Averaging leaves the bias roughly unchanged but cuts the variance.</p>
  <p>If the trees were perfectly independent, each with variance <M>{"\\sigma^2"}</M>, the average would have variance <M>{"\\sigma^2/B"}</M>. But bagged trees are <strong>correlated</strong> because they share most of the data. With pairwise correlation <M>{"\\rho"}</M> the variance of the average is:</p>
  <MB>{"\\rho\\,\\sigma^2 + \\frac{1-\\rho}{B}\\,\\sigma^2"}</MB>
  <p>The second term vanishes as <M>{"B\\to\\infty"}</M>, but the first term <M>{"\\rho\\sigma^2"}</M> is a <strong>floor</strong> set by correlation. So variance reduction depends on the trees being decorrelated, not just numerous. This is exactly the gap that Random Forests attack.</p>
</InterviewProblem>
<InterviewProblem question="How is a Random Forest different from plain bagging of trees, and why does that single change usually help?" difficulty="medium" tag="Conceptual">
  <p>Plain bagging only injects randomness through bootstrap sampling of rows. A Random Forest adds a second source of randomness: at <strong>each split</strong> it considers only a random subset of <M>{"m"}</M> features out of <M>{"p"}</M> (typically <M>{"m=\\sqrt{p}"}</M> for classification, <M>{"m=p/3"}</M> for regression).</p>
  <ul>
    <li>In bagging, if one or two features are very strong predictors, almost every tree splits on them near the root, so the trees look alike and <M>{"\\rho"}</M> stays high.</li>
    <li>Feature subsampling forces many splits to use weaker features, breaking that shared structure and <strong>lowering the correlation</strong> <M>{"\\rho"}</M> between trees.</li>
  </ul>
  <p>Recall the variance floor <M>{"\\rho\\sigma^2"}</M>: lowering <M>{"\\rho"}</M> lowers the floor, so the ensemble variance drops further than bagging can reach. The cost is a small rise in each individual tree&apos;s variance/bias, but the net effect is usually a better bias-variance trade-off. The key hyperparameter is <M>{"m"}</M>: smaller <M>{"m"}</M> means more decorrelation but weaker individual trees.</p>
</InterviewProblem>
<InterviewProblem question="What is the out-of-bag (OOB) error, why is it roughly equivalent to cross-validation, and how would you compute it?" difficulty="medium" tag="Applied">
  <p>Each bootstrap sample draws <M>{"n"}</M> rows with replacement from <M>{"n"}</M> rows. The probability a given row is never picked is <M>{"(1-1/n)^n \\to e^{-1} \\approx 0.368"}</M>, so on average about <strong>37%</strong> of rows are left out of any one tree. Those are that tree&apos;s out-of-bag samples.</p>
  <p>To get the OOB prediction for a row, aggregate only the trees that did <strong>not</strong> see it during training, then compare to the truth. Because each row is predicted only by trees that never trained on it, OOB error is an almost-unbiased estimate of test error&mdash;similar to cross-validation but obtained for free in a single fit, with no separate held-out passes.</p>
  <p>Practical notes: OOB needs enough trees so every row is OOB for a reasonable number of them; it can be noisy with very few trees. Use it to tune <M>{"m"}</M> and the number of trees without a separate validation split.</p>
  <CodeBlock language="python" filename="oob.py">{`from sklearn.ensemble import RandomForestClassifier

rf = RandomForestClassifier(
    n_estimators=500,
    max_features="sqrt",   # m = sqrt(p)
    oob_score=True,        # enable OOB scoring
    n_jobs=-1,
    random_state=0,
)
rf.fit(X_train, y_train)

# Free generalization estimate, no separate validation fold:
print("OOB accuracy:", rf.oob_score_)
# Per-sample OOB class probabilities for custom metrics:
oob_proba = rf.oob_decision_function_`}</CodeBlock>
</InterviewProblem>
<InterviewProblem question="A teammate ranks features by Random Forest impurity (Gini) importance and drops the lowest ones, but a high-cardinality ID-like column ranks near the top. What is going wrong and what would you do instead?" difficulty="hard" tag="Case">
  <p>Impurity-based (mean-decrease-in-impurity) importance is <strong>biased toward high-cardinality and continuous features</strong>. Such features offer many candidate split points, so by chance they can reduce impurity on the training set even when they carry no signal&mdash;classic overfitting that the metric rewards. It is also computed on training data, not held-out data.</p>
  <p>Symptoms and fixes:</p>
  <ul>
    <li>A near-unique ID column scoring high is the textbook tell. Drop genuine identifiers before modeling.</li>
    <li>Use <strong>permutation importance on a held-out set</strong>: shuffle one feature&apos;s values and measure the drop in validation score. No drop means no real reliance on that feature.</li>
    <li>Beware correlated features: permutation importance can split credit across them or understate both. Consider grouped permutation or clustering correlated features first.</li>
    <li>For attribution at the prediction level, SHAP values give a more consistent, theoretically grounded decomposition.</li>
  </ul>
  <p>Bottom line: never select features from impurity importance alone&mdash;validate on data the trees did not split on.</p>
  <CodeBlock language="python" filename="perm_importance.py">{`from sklearn.inspection import permutation_importance

# Computed on held-out data, not the training set
result = permutation_importance(
    rf, X_val, y_val,
    n_repeats=10, random_state=0, n_jobs=-1,
)
for i in result.importances_mean.argsort()[::-1]:
    mean = result.importances_mean[i]
    std = result.importances_std[i]
    print(f"{X_val.columns[i]:<20} {mean:.4f} +/- {std:.4f}")`}</CodeBlock>
</InterviewProblem>

      </>
  );
}
