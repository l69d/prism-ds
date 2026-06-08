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
    </>
  );
}
