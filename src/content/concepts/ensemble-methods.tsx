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
    </>
  );
}
