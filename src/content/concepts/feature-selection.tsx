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
      <p>Feature selection is the art of choosing which input columns to keep. More features is not more signal &mdash; often it is more noise, more overfitting, and a slower, less interpretable model.</p>

      <KeyIdea>A good feature subset is small enough to generalize, yet rich enough to predict. Selection trades raw quantity for usable quality.</KeyIdea>

      <h2>The three families</h2>
      <p>Almost every method falls into one of three camps, distinguished by how they use the model:</p>
      <ul>
        <li><strong>Filter</strong> &mdash; score each feature against the target with a cheap statistic (correlation, mutual information, chi-squared) and keep the top ones. Model-agnostic and fast, but blind to feature interactions.</li>
        <li><strong>Wrapper</strong> &mdash; repeatedly train the actual model on candidate subsets and let validation performance decide. Examples: recursive feature elimination, forward/backward stepwise. Accurate but expensive.</li>
        <li><strong>Embedded</strong> &mdash; selection happens <em>inside</em> training. L1 (Lasso) drives coefficients to zero; tree ensembles expose importances. One fit, no separate search.</li>
      </ul>

      <Basic>
        <p>Think of packing a suitcase. A <strong>filter</strong> picks items by a quick rule (&quot;only things I rated 5 stars&quot;) without trying on outfits. A <strong>wrapper</strong> actually assembles full outfits and judges each combination &mdash; thorough but slow. An <strong>embedded</strong> method packs as you shop, leaving behind anything that does not earn its space along the way.</p>
      </Basic>

      <Advanced>
        <p>Filters rank by a relevance score such as mutual information between feature <M>{"X_j"}</M> and target <M>{"Y"}</M>:</p>
        <MB>{"I(X_j; Y) = \\sum_{x,y} p(x,y)\\, \\log \\frac{p(x,y)}{p(x)\\,p(y)}"}</MB>
        <p>Embedded L1 selection adds a sparsity-inducing penalty to the loss. For linear regression this is the Lasso:</p>
        <MB>{"\\hat{\\mathbf{w}} = \\arg\\min_{\\mathbf{w}} \; \\lVert \\mathbf{y} - X\\mathbf{w} \\rVert_2^2 + \\lambda \\lVert \\mathbf{w} \\rVert_1"}</MB>
        <p>The non-differentiable <M>{"\\ell_1"}</M> ball has corners on the axes, so the optimum often lands exactly at <M>{"w_j = 0"}</M> &mdash; that feature is dropped. Larger <M>{"\\lambda"}</M> means fewer surviving features.</p>
      </Advanced>

      <Callout kind="pitfall" title="Select inside the cross-validation fold">
        Running feature selection on the full dataset and then cross-validating leaks the test labels into the selection step. Always fit the selector on the training fold only, otherwise your reported accuracy is optimistically biased.
      </Callout>

      <CodeBlock language="python" filename="select.py">{`from sklearn.feature_selection import SelectKBest, mutual_info_classif, RFECV
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

# Filter: keep the 10 most informative features
filt = SelectKBest(score_func=mutual_info_classif, k=10)

# Wrapper: recursively eliminate, choose count by CV
clf = LogisticRegression(max_iter=1000)
wrap = RFECV(estimator=clf, step=1, cv=5)

# Embedded: L1 logistic regression zeros out weak coefficients
emb = LogisticRegression(penalty="l1", solver="liblinear", C=0.1)

# Selector lives in the pipeline so it refits per CV fold (no leakage)
pipe = Pipeline([("select", filt), ("model", clf)])`}</CodeBlock>

      <MoreDepth>
        <p>Beware <strong>redundancy</strong>: filters score features one at a time, so two highly correlated columns both look great and both get kept, wasting a slot. Methods like mRMR (minimum redundancy, maximum relevance) explicitly subtract inter-feature correlation from the relevance score. Also remember that &quot;importance&quot; is conditional on the chosen model &mdash; a feature L1 discards may be vital to a kernel SVM. Stability selection (running L1 over many bootstraps and keeping consistently chosen features) gives a far more robust subset than a single fit.</p>
      </MoreDepth>

      <Quiz question="You add an L1 penalty to logistic regression and increase the regularization strength (smaller C). What happens to feature selection?" options={[
        { text: "More coefficients are driven exactly to zero, so fewer features survive", correct: true, why: "Stronger L1 shrinks more weights to the axis corners, dropping them entirely." },
        { text: "All coefficients grow larger to compensate", why: "Regularization shrinks coefficients toward zero, it does not enlarge them." },
        { text: "It becomes a wrapper method", why: "L1 selection is embedded; it happens within a single training fit, no subset search." },
        { text: "Feature interactions are now fully captured", why: "L1 on a linear model still treats features additively; it does not model interactions." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="Explain the difference between filter, wrapper, and embedded feature-selection methods, and give one trade-off of each." difficulty="easy" tag="Conceptual">
  <p>The three families differ in <strong>how tightly the selection is coupled to a model</strong>:</p>
  <ul>
    <li><strong>Filter:</strong> score each feature with a model-agnostic statistic (correlation, mutual information, chi-squared, ANOVA F-test) and keep the top ones. Fast and scalable, but ignores feature interactions and is blind to the downstream model.</li>
    <li><strong>Wrapper:</strong> search subsets by repeatedly training the actual model and scoring on a validation set (forward selection, backward elimination, recursive feature elimination). Captures interactions and optimizes the real objective, but is expensive and prone to overfitting the validation split.</li>
    <li><strong>Embedded:</strong> selection happens inside model fitting (L1/Lasso zeroing coefficients, tree-based importances). A good balance of cost and quality, but the choice is tied to that model family and inherits its biases.</li>
  </ul>
  <p>A common pipeline is a cheap filter to drop obviously useless features, then an embedded or wrapper step for the fine-grained decision.</p>
</InterviewProblem>
<InterviewProblem question="Why does L1 (Lasso) regularization produce sparse solutions while L2 (Ridge) does not?" difficulty="medium" tag="Math">
  <p>Both add a penalty to the loss, but the geometry of the constraint region differs. Minimizing squared error subject to a budget is equivalent to:</p>
  <MB>{"\\min_{\\beta} \; \\lVert y - X\\beta \\rVert_2^2 \\quad \\text{s.t.} \\quad \\lVert \\beta \\rVert_p \\le t"}</MB>
  <p>For L1 the feasible region is a diamond (<M>{"\\sum_j |\\beta_j| \\le t"}</M>); for L2 it is a ball (<M>{"\\sum_j \\beta_j^2 \\le t"}</M>). The elliptical contours of the squared-error loss are most likely to first touch the L1 diamond at a <strong>vertex</strong>, where some coordinates are exactly zero. The L2 ball has no corners, so the optimum almost surely lands at a point with all coordinates non-zero.</p>
  <p>Analytically, with orthonormal features the L1 solution is the <strong>soft-threshold</strong> of the OLS estimate:</p>
  <MB>{"\\hat{\\beta}_j^{\\text{lasso}} = \\operatorname{sign}(\\hat{\\beta}_j^{\\text{ols}}) \\left( |\\hat{\\beta}_j^{\\text{ols}}| - \\lambda \\right)_+"}</MB>
  <p>Any coefficient whose OLS magnitude is below <M>{"\\lambda"}</M> is set to exactly zero, which is why Lasso doubles as a feature selector. Ridge instead shrinks every coefficient by the factor <M>{"1/(1+\\lambda)"}</M> and never reaches zero.</p>
</InterviewProblem>
<InterviewProblem question="You have 50,000 features and 800 labeled rows. A teammate ranks all features by correlation with the target on the full dataset, keeps the top 100, then runs 5-fold cross-validation on those 100 and reports a great score. What is wrong, and how would you fix it?" difficulty="hard" tag="Applied">
  <p>This is <strong>selection bias / feature-selection leakage</strong>. Because the top 100 were chosen using the labels of the entire dataset, information from the held-out folds has already leaked into which features survive. With 50,000 features and only 800 rows, some features will correlate with the target by pure chance, and the selection step cherry-picks exactly those. The cross-validation score is then optimistically biased, sometimes wildly so.</p>
  <p>The fix is to put <strong>feature selection inside the cross-validation loop</strong>: for each fold, run the entire selection-then-fit procedure on the training portion only, and evaluate on the untouched validation portion. Any preprocessing that uses the target (or even target-free fits like scaling) must be learned on the train split alone.</p>
  <CodeBlock language="python" filename="cv_selection.py">{`from sklearn.pipeline import Pipeline
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score

# Selection is a pipeline STEP, so it is refit on each training fold only.
pipe = Pipeline([
    ("select", SelectKBest(f_classif, k=100)),
    ("clf", LogisticRegression(max_iter=1000)),
])

scores = cross_val_score(pipe, X, y, cv=5, scoring="roc_auc")
print(scores.mean(), scores.std())
`}</CodeBlock>
  <p>With <M>{"p \\gg n"}</M> you should also prefer nested CV (or a fully held-out test set) so that hyperparameters such as <M>{"k"}</M> are not tuned on the same data used to report performance.</p>
</InterviewProblem>
<InterviewProblem question="Two features are individually weak predictors but together strongly predict the target (an XOR-like relationship). Which selection methods will keep them and which will drop them?" difficulty="medium" tag="Case">
  <p>This probes the difference between <strong>univariate</strong> and <strong>multivariate</strong> selection.</p>
  <ul>
    <li><strong>Univariate filters</strong> (Pearson correlation, single-feature ANOVA F-test) score each feature in isolation. In a pure XOR each feature alone has near-zero correlation with the target, so both get ranked low and are <strong>dropped</strong> — the classic failure mode of univariate filtering.</li>
    <li><strong>Multivariate / interaction-aware methods</strong> keep them. Wrappers like forward selection or RFE evaluate subsets, so the pair&apos;s joint value is detected once both are present. Tree-based embedded importances can also capture it because trees split on one feature conditioned on another. Mutual information helps only if computed jointly, not feature-by-feature.</li>
  </ul>
  <p>Practical takeaway: do not rely on a univariate filter alone when you expect interactions. Either use a model-based step, add explicit interaction terms before filtering, or pair the filter with a wrapper/embedded pass.</p>
</InterviewProblem>

      </>
  );
}
