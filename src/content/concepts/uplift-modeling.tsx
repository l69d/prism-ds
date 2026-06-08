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
    <h2>Interview practice</h2>
<InterviewProblem question="What is uplift modeling, and how does it differ from a standard response (propensity) model?" difficulty="easy" tag="Conceptual">
  <p>A standard response model predicts <strong>P(outcome | features)</strong> &mdash; for example, the probability a customer buys if we send them a coupon. Uplift modeling instead estimates the <strong>causal effect of the treatment</strong> on each individual: how much the coupon <em>changes</em> their buying probability.</p>
  <p>Formally, with potential outcomes <M>{"Y(1)"}</M> (treated) and <M>{"Y(0)"}</M> (control), uplift is the conditional average treatment effect (CATE):</p>
  <MB>{"\\tau(x) = \\mathbb{E}[Y(1) - Y(0) \\mid X = x]"}</MB>
  <p>The practical difference is in <strong>who you target</strong>. A response model picks people likely to buy &mdash; but many of them (the &quot;sure things&quot;) would have bought anyway, so the coupon is wasted margin. Uplift targets <strong>persuadables</strong>: people who buy <em>only because</em> of the treatment. It also avoids &quot;sleeping dogs&quot; &mdash; customers whom the treatment actually annoys into <em>not</em> buying.</p>
</InterviewProblem>
<InterviewProblem question="Why can't you simply train one model to predict the treatment effect directly, and what is the fundamental obstacle to evaluating uplift?" difficulty="medium" tag="Conceptual">
  <p>The obstacle is the <strong>fundamental problem of causal inference</strong>: for any single person you observe either <M>{"Y(1)"}</M> or <M>{"Y(0)"}</M>, never both. The individual-level label <M>{"Y(1) - Y(0)"}</M> is <strong>never directly observed</strong>, so you cannot do ordinary supervised learning on it &mdash; there is no ground-truth target column to regress on.</p>
  <p>Uplift methods get around this by estimating the two potential outcomes (or their difference) from groups rather than individuals:</p>
  <ul>
    <li><strong>Two-model (T-learner)</strong>: fit one model on treated, one on control, predict <M>{"\\hat{\\tau}(x) = \\hat{\\mu}_1(x) - \\hat{\\mu}_0(x)"}</M>.</li>
    <li><strong>Single-model (S-learner)</strong>: one model with treatment as a feature; take the difference of predictions with the flag on vs off.</li>
    <li><strong>Transformed-outcome / class-transformation, X-learner, R-learner, and uplift trees</strong> that split on treatment-effect heterogeneity directly.</li>
  </ul>
  <p>The same missing-label problem makes <strong>evaluation</strong> hard: you cannot compute per-row error against a true uplift. Instead you evaluate on <em>groups</em> using a randomized holdout &mdash; rank by predicted uplift, then measure the realized treated-minus-control response gap across rank buckets. This gives the <strong>Qini curve</strong> and <strong>uplift (Qini) coefficient</strong>, the AUC-analogues for uplift.</p>
</InterviewProblem>
<InterviewProblem question="Derive the class-transformation (revert-label) trick that lets a single classifier estimate uplift under a 50/50 randomized trial." difficulty="hard" tag="Math">
  <p>Assume treatment <M>{"W"}</M> is randomized with <M>{"P(W=1)=P(W=0)=1/2"}</M>, independent of <M>{"X"}</M>. Define a new binary label that is 1 when the observation &quot;agrees&quot; with its treatment:</p>
  <MB>{"Z = \\begin{cases} 1 & \\text{if } W=1, Y=1 \\\\ 1 & \\text{if } W=0, Y=0 \\\\ 0 & \\text{otherwise} \\end{cases}"}</MB>
  <p>Equivalently <M>{"Z = W Y + (1-W)(1-Y)"}</M>. Now compute <M>{"P(Z=1 \\mid X=x)"}</M>, conditioning on the randomized treatment:</p>
  <MB>{"P(Z=1\\mid x) = P(W=1)\\,P(Y=1\\mid x, W=1) + P(W=0)\\,P(Y=0\\mid x, W=0)"}</MB>
  <p>Using <M>{"P(W=1)=P(W=0)=1/2"}</M> and writing <M>{"p_1(x)=P(Y=1\\mid x,W=1)"}</M>, <M>{"p_0(x)=P(Y=1\\mid x,W=0)"}</M>:</p>
  <MB>{"P(Z=1\\mid x) = \\tfrac{1}{2}p_1(x) + \\tfrac{1}{2}\\big(1 - p_0(x)\\big) = \\tfrac{1}{2} + \\tfrac{1}{2}\\big(p_1(x) - p_0(x)\\big)"}</MB>
  <p>The uplift is exactly <M>{"\\tau(x) = p_1(x) - p_0(x)"}</M>, so rearranging:</p>
  <MB>{"\\tau(x) = 2\\,P(Z=1\\mid x) - 1"}</MB>
  <p>So you can fit <strong>one ordinary classifier</strong> on the transformed label <M>{"Z"}</M>, then map its probability to uplift via <M>{"2\\hat{P}(Z=1\\mid x)-1"}</M>. The catch: this clean form needs <M>{"P(W=1)=1/2"}</M>. For unequal assignment you must weight by the inverse propensity <M>{"1/e(x)"}</M>, otherwise the constant cancellation breaks.</p>
</InterviewProblem>
<InterviewProblem question="You ran a randomized email campaign and trained an uplift model on a treated/control split. How do you build a Qini curve and decide whom to target given a limited send budget?" difficulty="medium" tag="Applied">
  <p>Hold out a randomized test set (both treated and control). Steps:</p>
  <ul>
    <li><strong>Score and sort</strong>: predict uplift for every test row, sort descending.</li>
    <li><strong>Cumulative gains</strong>: walking down the ranked list, at each fraction <M>{"\\phi"}</M> of the population compute the realized incremental conversions, scaling the treated response by the treated/control size ratio:</li>
  </ul>
  <MB>{"Q(\\phi) = R_t(\\phi) - R_c(\\phi)\\,\\frac{N_t(\\phi)}{N_c(\\phi)}"}</MB>
  <p>where <M>{"R_t,R_c"}</M> are cumulative converters in the treated/control groups among the top-<M>{"\\phi"}</M>, and <M>{"N_t,N_c"}</M> the group sizes. Plot <M>{"Q(\\phi)"}</M> vs <M>{"\\phi"}</M> &mdash; that is the Qini curve. The area between it and the random (diagonal) line is the <strong>Qini coefficient</strong>; bigger means better ranking of true uplift.</p>
  <p>For a budget of <M>{"k"}</M> sends, the curve&apos;s shape tells you the optimal cutoff: target the top-ranked customers up to the point where marginal uplift stays positive. If the curve <em>peaks then declines</em>, sending beyond the peak destroys value &mdash; you are hitting sleeping dogs. So target only up to the peak (or up to <M>{"k"}</M>, whichever is smaller), never the whole list.</p>
  <CodeBlock language="python" filename="qini.py">{`import numpy as np

def qini_curve(uplift, treatment, outcome, n_bins=20):
    # sort by predicted uplift, descending
    order = np.argsort(-uplift)
    w = treatment[order]
    y = outcome[order]

    n = len(y)
    qini = []
    for i in range(1, n + 1):
        wt, yt = w[:i], y[:i]
        nt = wt.sum()                 # treated so far
        nc = (1 - wt).sum()           # control so far
        rt = yt[wt == 1].sum()        # treated converters
        rc = yt[wt == 0].sum()        # control converters
        inc = rt - rc * (nt / nc) if nc > 0 else 0.0
        qini.append(inc)
    return np.array(qini)

def qini_coefficient(qini):
    # area between model curve and the random straight line
    n = len(qini)
    random_line = np.linspace(0, qini[-1], n)
    return np.trapz(qini - random_line) / n  # higher is better
`}</CodeBlock>
</InterviewProblem>

      </>
  );
}
