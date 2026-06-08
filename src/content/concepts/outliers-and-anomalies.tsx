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
      <p>An outlier is a point that sits far from the bulk of your data. The hard part isn&apos;t finding it &mdash; it&apos;s deciding what it means.</p>

      <KeyIdea>An outlier is a question, not a verdict. Before you delete anything, ask which of three things it is: a data <strong>error</strong>, a <strong>rare-but-real</strong> event, or the <strong>signal</strong> you were actually hunting for.</KeyIdea>

      <h2>Three faces of an extreme value</h2>
      <p>The same far-out point demands opposite actions depending on its cause:</p>
      <ul>
        <li><strong>Error</strong> &mdash; a sensor glitch, a typo, a unit mix-up (height of 700 cm). Fix or drop it.</li>
        <li><strong>Rare event</strong> &mdash; genuine but uncommon (a billionaire in an income survey). Keep it; it shapes the true tail.</li>
        <li><strong>Signal</strong> &mdash; in fraud, intrusion, or fault detection, the anomaly <em>is</em> the thing you want to catch. Celebrate it.</li>
      </ul>

      <h2>How we flag them</h2>
      <Basic>
        <p>Two intuitive rulers. The <strong>z-score</strong> asks &quot;how many standard deviations from the mean?&quot; &mdash; roughly 3 or more is suspicious. The <strong>IQR rule</strong> draws a box around the middle 50% of the data and calls anything more than 1.5 box-widths past the edges an outlier. The box approach is safer because the mean and standard deviation are themselves dragged around by the very extremes you&apos;re trying to find.</p>
      </Basic>
      <Advanced>
        <p>The z-score for a point is</p>
        <MB>{"z_i = \\frac{x_i - \\bar{x}}{s}"}</MB>
        <p>but <M>{"\\bar{x}"}</M> and <M>{"s"}</M> have a breakdown point of 0% &mdash; a single bad value corrupts them. Robust statistics fix this. The <strong>IQR fence</strong> flags <M>{"x_i"}</M> outside</p>
        <MB>{"[\\, Q_1 - 1.5\\,\\text{IQR},\; Q_3 + 1.5\\,\\text{IQR} \\,]"}</MB>
        <p>and the <strong>modified z-score</strong> swaps in the median and MAD (median absolute deviation), giving a 50% breakdown point:</p>
        <MB>{"M_i = \\frac{0.6745\\,(x_i - \\tilde{x})}{\\text{MAD}}, \\quad |M_i| > 3.5"}</MB>
      </Advanced>

      <Callout kind="pitfall" title="Don&apos;t delete on sight">
        Trimming extremes to make a model fit better is laundering data. A &quot;clean&quot; dataset that hides real heavy tails will lie to you in production, where the tails are exactly what break things.
      </Callout>

      <h2>Beyond one dimension</h2>
      <p>In many dimensions a point can be perfectly ordinary on every axis yet absurd as a combination (a 2-year-old who is 1.8 m tall). Univariate fences miss these; you need distance- or model-based detectors.</p>

      <CodeBlock language="python" filename="detect.py">{`import numpy as np

def iqr_outliers(x):
    q1, q3 = np.percentile(x, [25, 75])
    iqr = q3 - q1
    lo, hi = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    return (x < lo) | (x > hi)

def modified_zscore(x):
    med = np.median(x)
    mad = np.median(np.abs(x - med))
    return 0.6745 * (x - med) / (mad + 1e-9)

x = np.array([10, 11, 9, 12, 10, 11, 95])
print(iqr_outliers(x))               # last point flagged
print(np.abs(modified_zscore(x)) > 3.5)
`}</CodeBlock>

      <MoreDepth>
        <p>For high-dimensional data, the Mahalanobis distance accounts for correlation between features, but its covariance estimate is itself non-robust &mdash; use the Minimum Covariance Determinant for a robust version. Tree-based <strong>Isolation Forest</strong> sidesteps distances entirely: anomalies get isolated in fewer random splits, scaling near-linearly. And always separate <em>novelty detection</em> (train clean, flag anything new) from <em>outlier detection</em> (the training set itself is contaminated) &mdash; they call for different algorithms.</p>
      </MoreDepth>

      <Quiz question="Your income dataset has a few genuine billionaires. What's the most defensible first step?" options={[
        { text: "Drop them so the mean is more representative", why: "Deleting real data to flatter a summary statistic distorts the true distribution and hides the heavy tail." },
        { text: "Keep them and prefer robust statistics like the median and IQR", correct: true, why: "They are rare but real, so retain them; robust summaries describe the bulk without being dragged around by the tail." },
        { text: "Replace them with the column mean", why: "Mean imputation invents fake typical values and erases legitimate variation in the tail." },
        { text: "Use a z-score cutoff of 3 to remove them automatically", why: "The mean and SD in the z-score are themselves inflated by these very points, so the rule both masks and misfires." },
      ]} />
    </>
  );
}
