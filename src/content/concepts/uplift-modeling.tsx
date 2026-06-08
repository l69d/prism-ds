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
      <p>Most models predict <em>who will buy</em>. Uplift modeling predicts <em>who will buy because you nudged them</em> &mdash; the causal effect of a treatment on each individual.</p>

      <KeyIdea>Uplift estimates the difference between what happens <strong>with</strong> the treatment and what would have happened <strong>without</strong> it, person by person. It targets the causal effect, not the raw outcome.</KeyIdea>

      <h2>Why predicting the outcome is not enough</h2>
      <p>Imagine a retailer sending discount coupons. A churn or purchase model ranks customers by how likely they are to buy. But some of those likely-buyers would have bought <strong>anyway</strong> &mdash; the coupon just wastes margin. Others would never buy regardless. The coupon only pays off for the <strong>persuadables</strong>: people whose behavior actually changes. Uplift modeling finds them.</p>
      <ul>
        <li><strong>Persuadables</strong> &mdash; buy only if treated. Target these.</li>
        <li><strong>Sure things</strong> &mdash; buy either way. Wasted spend.</li>
        <li><strong>Lost causes</strong> &mdash; never buy. Wasted spend.</li>
        <li><strong>Sleeping dogs</strong> &mdash; treating them backfires (e.g. a reminder that triggers a cancellation). Avoid.</li>
      </ul>

      <Basic>
        <p>Think of two parallel worlds for one customer: in one you send the coupon, in the other you don&apos;t. Uplift is the gap in their behavior between those worlds. Since you can only ever observe one world per person, you estimate the gap by comparing similar people who were and weren&apos;t treated &mdash; ideally split by a randomized experiment.</p>
      </Basic>

      <Advanced>
        <p>Formally, uplift is the individual treatment effect under the potential-outcomes framework. With treatment <M>{"W \\in \\{0,1\\}"}</M> and potential outcomes <M>{"Y(1), Y(0)"}</M>, the conditional average treatment effect (CATE) is:</p>
        <MB>{"\\tau(x) = \\mathbb{E}[Y(1) - Y(0) \\mid X = x]"}</MB>
        <p>Under randomization (ignorability, <M>{"(Y(1),Y(0)) \\perp W \\mid X"}</M>) this is identified from observed data as the difference of two conditional means:</p>
        <MB>{"\\tau(x) = \\mathbb{E}[Y \\mid X=x, W=1] - \\mathbb{E}[Y \\mid X=x, W=0]"}</MB>
        <p>The <strong>fundamental problem of causal inference</strong> is that <M>{"Y(1)"}</M> and <M>{"Y(0)"}</M> are never both observed for one unit, so <M>{"\\tau(x)"}</M> has no ground-truth label &mdash; you cannot train on it directly.</p>
      </Advanced>

      <h2>How estimators work</h2>
      <p>Because uplift has no label, models infer it indirectly. Common meta-learners:</p>
      <ul>
        <li><strong>T-learner</strong> &mdash; fit one model on the treated group, one on the control group, subtract their predictions.</li>
        <li><strong>S-learner</strong> &mdash; fit a single model with treatment as a feature, then take the difference between predictions at <M>{"W=1"}</M> and <M>{"W=0"}</M>.</li>
        <li><strong>X-learner</strong> &mdash; refines the T-learner by imputing individual effects, strong when group sizes are imbalanced.</li>
      </ul>

      <Callout kind="pitfall" title="Do not score uplift with AUC on outcomes">
        A model can have great outcome AUC yet rank uplift terribly. Evaluate with uplift-specific tools: the Qini curve and Qini coefficient, or the AUUC (area under the uplift curve), which measure incremental gain as you treat the top-ranked fraction.
      </Callout>

      <CodeBlock language="python" filename="uplift_tlearner.py">{`import numpy as np
from sklearn.ensemble import GradientBoostingClassifier

# X: features, w: treatment (0/1), y: outcome (0/1)
def fit_t_learner(X, w, y):
    m1 = GradientBoostingClassifier().fit(X[w == 1], y[w == 1])
    m0 = GradientBoostingClassifier().fit(X[w == 0], y[w == 0])
    return m0, m1

def predict_uplift(m0, m1, X):
    # tau(x) = P(buy | treated) - P(buy | control)
    return m1.predict_proba(X)[:, 1] - m0.predict_proba(X)[:, 1]

m0, m1 = fit_t_learner(X_train, w_train, y_train)
tau = predict_uplift(m0, m1, X_test)
# Treat customers with the highest positive uplift; skip sleeping dogs (tau < 0)
targets = np.argsort(-tau)[:budget]
`}</CodeBlock>

      <MoreDepth>
        <p>The T-learner subtracts two noisy models, so its variance compounds and small biases in either base learner masquerade as uplift signal. Modern alternatives reduce this: the <strong>R-learner</strong> uses Robinson&apos;s residualization to orthogonalize out the outcome and propensity nuisances (a Neyman-orthogonal loss), and <strong>causal forests</strong> grow trees that split to maximize treatment-effect heterogeneity with honest, out-of-bag estimation for valid confidence intervals. The deeper lesson: validating uplift offline is genuinely hard because the label is counterfactual, so a randomized holdout and a Qini curve are not optional &mdash; they are the only honest scoreboard.</p>
      </MoreDepth>

      <Quiz question="Why can't you train an uplift model directly on a per-person 'true uplift' label?" options={[
        { text: "Uplift labels exist but are too expensive to collect at scale", why: "Cost is not the issue; the label is fundamentally unobservable for any single unit." },
        { text: "For each person you only ever observe one outcome (treated or untreated), never both", correct: true, why: "This is the fundamental problem of causal inference: the counterfactual is missing, so individual uplift has no ground truth." },
        { text: "Uplift is continuous, and classifiers need discrete labels", why: "Uplift can be estimated by classifiers via probability differences; continuity is not the obstacle." },
        { text: "Randomized experiments make the label noisy beyond use", why: "Randomization is what makes uplift identifiable on average; it helps rather than blocks estimation." },
      ]} />
    </>
  );
}
