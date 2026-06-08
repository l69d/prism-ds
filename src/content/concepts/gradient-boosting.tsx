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
      <p>Gradient boosting builds a strong predictor out of many weak ones by adding trees one at a time, where each new tree focuses on the mistakes the current model still makes. It is the engine behind XGBoost and LightGBM, the workhorses of tabular machine learning.</p>

      <KeyIdea>Train a tree to predict the errors of the model so far, add a shrunken version of it, and repeat. Each round nudges the prediction a little closer to the truth.</KeyIdea>

      <h2>The core loop</h2>
      <p>Start with a trivial prediction (often the mean of the target). Then, repeatedly:</p>
      <ul>
        <li><strong>Measure the gap.</strong> Compute the residual &mdash; how far off each prediction currently is.</li>
        <li><strong>Fit a small tree</strong> to those residuals, so it learns where and how the model is wrong.</li>
        <li><strong>Add it in</strong>, scaled by a small learning rate, so no single tree dominates.</li>
      </ul>
      <p>After hundreds of these tiny corrections, the ensemble captures rich, non-linear structure that a single tree never could.</p>

      <Basic>
        <p>Imagine grading darts. Your first throw lands left of the bullseye. You do not throw away the dart &mdash; you make a small correction and throw again, then again, each time aiming at whatever distance is left. Gradient boosting is exactly this: every tree is a tiny correction aimed at the leftover error. Because the corrections are small (the learning rate), the model improves smoothly instead of overshooting, and slowly it converges on the target.</p>
      </Basic>

      <Advanced>
        <p>Boosting performs gradient descent in function space. We minimize a loss <M>{"L(y, F(x))"}</M> by building an additive model <M>{"F_m(x) = F_{m-1}(x) + \\nu\\, h_m(x)"}</M>, where <M>{"\\nu"}</M> is the learning rate. At each stage we fit <M>{"h_m"}</M> to the negative gradient of the loss (the pseudo-residuals):</p>
        <MB>{"r_{im} = -\\left[ \\frac{\\partial L(y_i, F(x_i))}{\\partial F(x_i)} \\right]_{F = F_{m-1}}"}</MB>
        <p>For squared error this gradient is just <M>{"y_i - F_{m-1}(x_i)"}</M> &mdash; the ordinary residual. XGBoost refines this with a second-order Taylor expansion, using gradients <M>{"g_i"}</M> and Hessians <M>{"h_i"}</M> plus an explicit regularization term <M>{"\\Omega(f) = \\gamma T + \\tfrac{1}{2}\\lambda \\lVert w \\rVert^2"}</M> on leaf count and weights, giving a closed-form optimal leaf value <M>{"w_j^* = -\\,G_j / (H_j + \\lambda)"}</M>.</p>
      </Advanced>

      <Callout kind="pitfall" title="Lower learning rate is not free">
        Shrinking the learning rate almost always improves accuracy, but only if you raise the number of trees to compensate. A tiny rate with too few trees underfits badly. Tune the two together, and use early stopping on a validation set.
      </Callout>

      <h2>Where it matters</h2>
      <p>On structured, tabular data &mdash; credit scoring, click prediction, ranking, churn &mdash; gradient-boosted trees routinely beat deep nets. LightGBM grows trees leaf-wise and bins features into histograms for speed; XGBoost adds strong regularization and clean handling of missing values.</p>

      <CodeBlock language="python" filename="gbm.py">{`import lightgbm as lgb
from sklearn.model_selection import train_test_split

X_tr, X_val, y_tr, y_val = train_test_split(X, y, test_size=0.2)

model = lgb.LGBMClassifier(
    n_estimators=2000,     # many trees...
    learning_rate=0.03,    # ...with a small step each
    num_leaves=31,
    subsample=0.8,         # row sampling fights overfitting
    colsample_bytree=0.8,  # feature sampling too
)
model.fit(
    X_tr, y_tr,
    eval_set=[(X_val, y_val)],
    callbacks=[lgb.early_stopping(50)],  # stop when val stops improving
)`}</CodeBlock>

      <MoreDepth>
        <p>The distinction between boosting and bagging (random forests) is fundamental. Bagging averages independent high-variance trees to reduce variance. Boosting fits trees sequentially to reduce bias, so each tree is shallow and dependent on the last. This sequential bias-reduction is why boosting is more sensitive to noisy labels and outliers &mdash; it will keep trying to fit them. Robust losses (Huber, quantile) and aggressive regularization are the antidote.</p>
      </MoreDepth>

      <Quiz question="In gradient boosting, what does each newly added tree primarily learn to predict?" options={[
        { text: "The original target values from scratch", why: "Only the very first naive estimate targets the raw mean; later trees target what is left over." },
        { text: "The residuals / negative gradient of the loss from the current ensemble", correct: true, why: "Each tree fits the pseudo-residuals, correcting the errors the model still makes." },
        { text: "A bootstrap-resampled copy of the data, independent of other trees", why: "That describes bagging / random forests, where trees are independent, not boosting." },
        { text: "The variance of the predictions across trees", why: "Boosting reduces bias by sequential correction; it does not target prediction variance." },
      ]} />
    </>
  );
}
