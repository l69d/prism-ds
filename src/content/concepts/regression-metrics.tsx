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
    </>
  );
}
