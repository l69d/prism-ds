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
    <h2>Interview practice</h2>

<InterviewProblem question="Explain gradient boosting to someone who already knows decision trees. Why is it called 'gradient' boosting?" difficulty="easy" tag="Conceptual">
  <p>Gradient boosting builds an <strong>additive ensemble of shallow trees</strong>, where each new tree corrects the mistakes of the ensemble built so far. You start with a constant prediction (for squared error, the mean of the target), then repeatedly add a tree fit to the current errors, scaled by a learning rate.</p>
  <p>The &quot;gradient&quot; part comes from viewing this as <strong>gradient descent in function space</strong>. We want to minimize a loss <M>{"L(y, F(x))"}</M> over the prediction function <M>{"F"}</M>. At each step we compute the negative gradient of the loss with respect to the current predictions, and fit the next tree to those pseudo-residuals:</p>
  <MB>{"r_i = -\\left.\\frac{\\partial L(y_i, F(x_i))}{\\partial F(x_i)}\\right|_{F = F_{m-1}}"}</MB>
  <p>For squared error <M>{"L = \\tfrac{1}{2}(y - F)^2"}</M>, the negative gradient is exactly <M>{"y_i - F(x_i)"}</M>, the ordinary residual. That is why the slogan is &quot;fit the residuals, again and again&quot; — for squared loss the pseudo-residual <strong>is</strong> the residual. For other losses (log loss, Huber, quantile) the pseudo-residual is a different expression, but the recipe is identical.</p>
</InterviewProblem>

<InterviewProblem question="How does gradient boosting differ from random forests? When would you reach for one over the other?" difficulty="medium" tag="Conceptual">
  <p>Both are tree ensembles, but they attack the bias-variance tradeoff from opposite ends.</p>
  <ul>
    <li><strong>Random forest</strong> grows many <strong>deep, low-bias, high-variance</strong> trees <strong>independently</strong> on bootstrap samples and <strong>averages</strong> them. Averaging reduces variance; the trees do not talk to each other, so training is embarrassingly parallel and the model is hard to overfit by adding more trees.</li>
    <li><strong>Gradient boosting</strong> grows <strong>shallow, high-bias, low-variance</strong> trees <strong>sequentially</strong>, each one reducing the residual error of the running ensemble. It reduces bias; trees are dependent, so adding too many trees (or too large a learning rate) <strong>will</strong> overfit.</li>
  </ul>
  <p>Practical guidance:</p>
  <ul>
    <li>Boosting usually gives <strong>higher accuracy on tabular data</strong> when you can afford to tune learning rate, tree count, and depth — it is the default for Kaggle-style structured problems and most quant tabular signals.</li>
    <li>Random forests are a great <strong>strong baseline</strong>: fewer knobs, robust to defaults, parallel, and the extra trees never hurt. Good when you want a quick, low-maintenance model or solid feature-importance estimates.</li>
    <li>Because boosting is sequential and order-dependent, it is more sensitive to noisy labels and needs early stopping on a validation set.</li>
  </ul>
</InterviewProblem>

<InterviewProblem question="In XGBoost, what is the role of the learning rate, and why does it interact with the number of trees? How would you tune them together?" difficulty="medium" tag="Applied">
  <p>The learning rate <M>{"\\eta"}</M> (often called <strong>shrinkage</strong>) scales the contribution of each new tree before it is added:</p>
  <MB>{"F_m(x) = F_{m-1}(x) + \\eta \\cdot f_m(x)"}</MB>
  <p>Small <M>{"\\eta"}</M> means each tree only nudges the prediction, so the model needs <strong>more trees</strong> to fit, but each step is more conservative and the ensemble <strong>generalizes better</strong> (less overfitting). There is a direct tradeoff: roughly, halving <M>{"\\eta"}</M> requires about doubling the number of trees to reach the same training fit.</p>
  <p>A standard recipe:</p>
  <ul>
    <li>Fix a small-ish learning rate (e.g. <M>{"\\eta = 0.05"}</M> or <M>{"0.1"}</M>).</li>
    <li>Use <strong>early stopping</strong> on a validation set to choose the number of trees automatically — train with a large cap and stop when validation loss stops improving for, say, 50 rounds.</li>
    <li>Tune tree structure (max depth, min child weight) and regularization (<M>{"\\lambda"}</M>, <M>{"\\gamma"}</M>, subsample, colsample) with this setup.</li>
    <li>Optionally, lower <M>{"\\eta"}</M> at the end and let early stopping add more trees for a final accuracy bump, at the cost of training time.</li>
  </ul>
  <CodeBlock language="python" filename="xgb_early_stop.py">{`import xgboost as xgb
from sklearn.model_selection import train_test_split

X_tr, X_val, y_tr, y_val = train_test_split(X, y, test_size=0.2, random_state=0)

model = xgb.XGBRegressor(
    n_estimators=5000,      # large cap; early stopping picks the real count
    learning_rate=0.05,     # small shrinkage -> needs many trees, generalizes well
    max_depth=4,
    subsample=0.8,
    colsample_bytree=0.8,
    reg_lambda=1.0,
    early_stopping_rounds=50,
    eval_metric="rmse",
)
model.fit(X_tr, y_tr, eval_set=[(X_val, y_val)], verbose=False)
print("best #trees:", model.best_iteration + 1)`}</CodeBlock>
</InterviewProblem>

<InterviewProblem question="Derive the optimal leaf weight in XGBoost's second-order objective, and explain what the resulting 'gain' formula tells you about splitting." difficulty="hard" tag="Math">
  <p>XGBoost approximates the loss at each boosting step with a <strong>second-order Taylor expansion</strong>. For a fixed tree structure, write <M>{"g_i"}</M> and <M>{"h_i"}</M> for the first and second derivatives of the loss at sample <M>{"i"}</M> with respect to the current prediction. The regularized objective for the tree, with weight <M>{"w_j"}</M> on leaf <M>{"j"}</M>, is</p>
  <MB>{"\\tilde{\\mathcal{L}} = \\sum_j \\left[ \\left(\\sum_{i \\in I_j} g_i\\right) w_j + \\tfrac{1}{2}\\left(\\sum_{i \\in I_j} h_i + \\lambda\\right) w_j^2 \\right] + \\gamma T"}</MB>
  <p>where <M>{"I_j"}</M> is the set of samples in leaf <M>{"j"}</M>, <M>{"\\lambda"}</M> is L2 regularization, <M>{"\\gamma"}</M> penalizes the number of leaves <M>{"T"}</M>. Let <M>{"G_j = \\sum_{i \\in I_j} g_i"}</M> and <M>{"H_j = \\sum_{i \\in I_j} h_i"}</M>. Each leaf is an independent quadratic in <M>{"w_j"}</M>; setting the derivative to zero gives the optimal weight</p>
  <MB>{"w_j^* = -\\frac{G_j}{H_j + \\lambda}"}</MB>
  <p>Substituting back, the best achievable objective for that structure is</p>
  <MB>{"\\tilde{\\mathcal{L}}^* = -\\frac{1}{2}\\sum_j \\frac{G_j^2}{H_j + \\lambda} + \\gamma T"}</MB>
  <p>When evaluating a candidate split that divides a node into left (<M>{"L"}</M>) and right (<M>{"R"}</M>), the <strong>gain</strong> is the drop in this objective:</p>
  <MB>{"\\text{Gain} = \\tfrac{1}{2}\\left[ \\frac{G_L^2}{H_L + \\lambda} + \\frac{G_R^2}{H_R + \\lambda} - \\frac{(G_L + G_R)^2}{H_L + H_R + \\lambda} \\right] - \\gamma"}</MB>
  <p>Interpretation: a split is only taken if the score improvement of separating the gradients beats <M>{"\\gamma"}</M>, so <M>{"\\gamma"}</M> acts as a <strong>minimum-gain pruning threshold</strong>. The <M>{"\\lambda"}</M> in each denominator shrinks leaf weights and penalizes leaves with little curvature (small <M>{"H"}</M>), which is what makes the second-order objective more stable and less greedy than plain residual fitting.</p>
</InterviewProblem>

      </>
  );
}
