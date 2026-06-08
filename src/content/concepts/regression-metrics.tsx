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
      <p>A regression model spits out numbers, but a single accuracy score can&apos;t tell the whole story. Each metric makes a different bet about which errors should hurt the most.</p>

      <KeyIdea>There is no universally &quot;best&quot; regression metric. Your choice encodes what kind of mistake you care about: small steady errors, rare huge errors, or errors relative to the size of each target.</KeyIdea>

      <h2>The four workhorses</h2>
      <p>Given true values and predictions, the common metrics are:</p>
      <ul>
        <li><strong>MAE</strong> (Mean Absolute Error) &mdash; average size of errors, in the original units. Treats a 10-unit miss as exactly twice as bad as a 5-unit miss.</li>
        <li><strong>RMSE</strong> (Root Mean Squared Error) &mdash; like MAE but squares errors first, so big misses dominate. Same units as the target.</li>
        <li><strong>R&sup2;</strong> (coefficient of determination) &mdash; the fraction of variance your model explains versus just predicting the mean. Unitless, usually between 0 and 1.</li>
        <li><strong>MAPE</strong> (Mean Absolute Percentage Error) &mdash; average error as a percent of the true value, so it compares fairly across different scales.</li>
      </ul>

      <Basic>
        <p>Picture predicting house prices. <strong>MAE</strong> answers &quot;on average, how many dollars am I off?&quot; <strong>RMSE</strong> is similar but freaks out about that one mansion you missed by a million. <strong>R&sup2;</strong> answers &quot;am I beating a lazy guess that always says the average price?&quot; And <strong>MAPE</strong> answers &quot;am I off by 5% or 50%?&quot; &mdash; useful when a $10k error on a cheap house matters more than on a mansion.</p>
      </Basic>

      <Advanced>
        <p>The definitions, for errors over <M>{"n"}</M> samples:</p>
        <MB>{"\\text{MAE} = \\frac{1}{n}\\sum_{i=1}^{n} |y_i - \\hat{y}_i|"}</MB>
        <MB>{"\\text{RMSE} = \\sqrt{\\frac{1}{n}\\sum_{i=1}^{n} (y_i - \\hat{y}_i)^2}"}</MB>
        <MB>{"R^2 = 1 - \\frac{\\sum_i (y_i - \\hat{y}_i)^2}{\\sum_i (y_i - \\bar{y})^2}"}</MB>
        <MB>{"\\text{MAPE} = \\frac{100\\%}{n}\\sum_{i=1}^{n} \\left| \\frac{y_i - \\hat{y}_i}{y_i} \\right|"}</MB>
        <p>Minimizing squared error pushes predictions toward the conditional <strong>mean</strong>; minimizing absolute error targets the conditional <strong>median</strong>, which is why MAE is robust to outliers. By Jensen&apos;s inequality, <M>{"\\text{RMSE} \\geq \\text{MAE}"}</M> always, with the gap widening as error variance grows.</p>
      </Advanced>

      <Callout kind="pitfall" title="MAPE blows up near zero">
        Because MAPE divides by the true value, targets at or near zero produce huge or undefined percentages, and it asymmetrically punishes over-prediction less than under-prediction. For data crossing zero, reach for MAE or sMAPE instead.
      </Callout>

      <CodeBlock language="python" filename="regression_metrics.py">{`import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

y_true = np.array([100, 200, 300, 1000])
y_pred = np.array([110, 190, 320, 700])   # big miss on the last point

mae  = mean_absolute_error(y_true, y_pred)
rmse = np.sqrt(mean_squared_error(y_true, y_pred))
r2   = r2_score(y_true, y_pred)
mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100

print(f"MAE  = {mae:.1f}")    # 82.5  -> averages the dollar errors
print(f"RMSE = {rmse:.1f}")   # 151.9 -> inflated by the 300-unit miss
print(f"R2   = {r2:.3f}")     # explained variance vs the mean
print(f"MAPE = {mape:.1f}%")  # error relative to each price`}</CodeBlock>

      <MoreDepth>
        <p>R&sup2; can go <strong>negative</strong> on test data: it just means your model is worse than predicting the training mean. It also mechanically increases when you add features, which is why adjusted R&sup2; penalizes parameter count. And never compare R&sup2; across datasets with different target variance &mdash; a high R&sup2; on a noisy target can hide larger absolute errors than a low R&sup2; on a smooth one. When stakeholders ask &quot;how good is it?&quot;, report an error in real units (MAE/RMSE) alongside R&sup2;.</p>
      </MoreDepth>

      <Quiz question="A delivery-time model occasionally produces wildly wrong estimates, and those rare blunders are the costliest. Which metric best surfaces them?" options={[
        { text: "MAE", why: "MAE weights every error linearly, so a few huge misses get diluted by many small ones." },
        { text: "RMSE", correct: true, why: "Squaring errors makes large misses dominate, so RMSE spikes exactly when rare big blunders occur." },
        { text: "MAPE", why: "MAPE measures relative percentage error, not the absolute magnitude of rare large mistakes." },
        { text: "R-squared", why: "R-squared reports overall explained variance and won't isolate the cost of individual large errors." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="What is the difference between MAE and RMSE, and when would you prefer one over the other?" difficulty="easy" tag="Conceptual">
  <p>Both measure average error magnitude, but they aggregate differently:</p>
  <MB>{"\\text{MAE} = \\frac{1}{n}\\sum_{i=1}^{n}\\lvert y_i - \\hat{y}_i\\rvert, \\qquad \\text{RMSE} = \\sqrt{\\frac{1}{n}\\sum_{i=1}^{n}(y_i - \\hat{y}_i)^2}"}</MB>
  <p><strong>RMSE squares the errors</strong>, so a single large miss contributes far more than several small ones. RMSE is therefore more sensitive to outliers and large errors, while MAE treats every error proportionally to its size.</p>
  <ul>
    <li>Prefer <strong>RMSE</strong> when large errors are disproportionately costly (e.g. badly underestimating demand and stocking out) and you want the model penalized hard for them.</li>
    <li>Prefer <strong>MAE</strong> when you want a robust, interpretable &quot;typical error in the original units&quot; and you do not want a few outliers to dominate the metric.</li>
  </ul>
  <p>A useful fact: minimizing MAE drives predictions toward the conditional <strong>median</strong>, while minimizing RMSE (or MSE) drives them toward the conditional <strong>mean</strong>. By Jensen&apos;s inequality <M>{"\\text{RMSE} \\ge \\text{MAE}"}</M> always, and the gap widens with error variance.</p>
</InterviewProblem>
<InterviewProblem question="A stakeholder says our model is great because R-squared is 0.85. What questions and caveats would you raise?" difficulty="medium" tag="Applied">
  <p>R-squared is the fraction of variance in the target explained by the model relative to predicting the mean:</p>
  <MB>{"R^2 = 1 - \\frac{\\sum_i (y_i - \\hat{y}_i)^2}{\\sum_i (y_i - \\bar{y})^2} = 1 - \\frac{\\text{SS}_{\\text{res}}}{\\text{SS}_{\\text{tot}}}"}</MB>
  <p>Caveats I would surface:</p>
  <ul>
    <li><strong>On what data?</strong> A high <M>{"R^2"}</M> on the training set says little; I want the out-of-sample (test) value. In-sample <M>{"R^2"}</M> never decreases when you add features, so use <strong>adjusted</strong> <M>{"R^2"}</M> or a held-out set to avoid rewarding overfitting.</li>
    <li><strong>Compared to what baseline?</strong> <M>{"R^2"}</M> is measured against the naive mean predictor. In a high-variance target, even a weak model can score 0.85; in a low-noise problem, 0.85 might be poor.</li>
    <li><strong>Is the variance the right thing to explain?</strong> A high <M>{"R^2"}</M> can coexist with biased predictions or large errors in the region that actually matters for the business decision. I would also report RMSE/MAE in original units and look at residual plots.</li>
    <li><strong>Test-set <M>{"R^2"}</M> can be negative</strong> if the model does worse than the mean, which is a red flag the training number hides.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="Why can MAPE be a dangerous metric, and what would you use instead?" difficulty="medium" tag="Conceptual">
  <p>MAPE is the mean absolute percentage error:</p>
  <MB>{"\\text{MAPE} = \\frac{100\\%}{n}\\sum_{i=1}^{n}\\left\\lvert\\frac{y_i - \\hat{y}_i}{y_i}\\right\\rvert"}</MB>
  <p>Its pitfalls:</p>
  <ul>
    <li><strong>Undefined or exploding</strong> when actuals are zero or near zero; one tiny denominator can dominate the whole metric.</li>
    <li><strong>Asymmetric:</strong> it penalizes over-forecasts more heavily than under-forecasts. Predicting <M>{"\\hat{y}=0"}</M> caps the error at 100%, but a high over-prediction is unbounded, so a model can game MAPE by systematically forecasting low.</li>
    <li><strong>Not meaningful for targets that can be negative</strong> (e.g. profit, temperature change).</li>
  </ul>
  <p>Better alternatives depending on the goal:</p>
  <ul>
    <li><strong>sMAPE</strong> (symmetric) or <strong>WAPE / weighted MAPE</strong> <M>{"\\big(\\sum\\lvert y-\\hat{y}\\rvert / \\sum\\lvert y\\rvert\\big)"}</M>, which is robust to small denominators.</li>
    <li><strong>MASE</strong>, which scales error by a naive seasonal baseline and is scale-free and well-defined.</li>
    <li>If multiplicative/percentage errors are genuinely the goal, train on <M>{"\\log y"}</M> and report RMSE in log space, which gives a symmetric percentage-like penalty.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="Given a small set of actuals and predictions, compute MAE, RMSE, and R-squared by hand, then verify with code." difficulty="hard" tag="Math">
  <p>Take <M>{"y = [3, 5, 2, 7]"}</M> and <M>{"\\hat{y} = [2, 5, 4, 6]"}</M>. The residuals are <M>{"[1, 0, -2, 1]"}</M>.</p>
  <p><strong>MAE:</strong> mean of <M>{"\\lvert\\text{residual}\\rvert = (1+0+2+1)/4 = 1.0"}</M>.</p>
  <p><strong>RMSE:</strong> squared residuals are <M>{"[1, 0, 4, 1]"}</M>, so</p>
  <MB>{"\\text{RMSE} = \\sqrt{\\tfrac{1+0+4+1}{4}} = \\sqrt{1.5} \\approx 1.225"}</MB>
  <p><strong>R-squared:</strong> <M>{"\\text{SS}_{\\text{res}} = 6"}</M>. The mean is <M>{"\\bar{y} = 4.25"}</M>, so deviations are <M>{"[-1.25, 0.75, -2.25, 2.75]"}</M> and</p>
  <MB>{"\\text{SS}_{\\text{tot}} = 1.5625 + 0.5625 + 5.0625 + 7.5625 = 14.75"}</MB>
  <MB>{"R^2 = 1 - \\frac{6}{14.75} \\approx 0.593"}</MB>
  <CodeBlock language="python" filename="regression_metrics.py">{`import numpy as np

y      = np.array([3, 5, 2, 7])
y_hat  = np.array([2, 5, 4, 6])

mae  = np.mean(np.abs(y - y_hat))
rmse = np.sqrt(np.mean((y - y_hat) ** 2))
ss_res = np.sum((y - y_hat) ** 2)
ss_tot = np.sum((y - y.mean()) ** 2)
r2 = 1 - ss_res / ss_tot

print(f"MAE  = {mae:.3f}")    # 1.000
print(f"RMSE = {rmse:.3f}")   # 1.225
print(f"R2   = {r2:.3f}")     # 0.593`}</CodeBlock>
  <p>Sanity check: <M>{"\\text{RMSE} \\ge \\text{MAE}"}</M> holds (1.225 vs 1.0), and a positive <M>{"R^2"}</M> confirms the model beats predicting the mean.</p>
</InterviewProblem>

      </>
  );
}
