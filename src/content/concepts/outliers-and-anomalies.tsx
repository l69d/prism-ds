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
    <h2>Interview practice</h2>

<InterviewProblem question="An outlier shows up in your dataset. Walk me through how you decide whether to remove it, keep it, or transform it." difficulty="easy" tag="Conceptual">
  <p>The first move is never to delete it. An outlier is a question, not a defect. The right action depends on <strong>why</strong> the point is extreme:</p>
  <ul>
    <li><strong>Data error</strong> (a temperature of 999&deg;C from a broken sensor, a typo, a unit mix-up). These are genuinely wrong measurements. Fix the parsing, impute, or drop them &mdash; but document the rule.</li>
    <li><strong>Rare but real event</strong> (a flash crash, a viral post, a customer who spends 100x the median). These are valid and often the most informative rows. Removing them silently biases your model toward the boring middle.</li>
    <li><strong>Signal you actually care about</strong> (fraud, intrusion, equipment failure). Here the outliers ARE the target &mdash; deleting them deletes the problem.</li>
  </ul>
  <p>Practical heuristics: check whether the point is plausible given domain limits, see if it is a single feature or the whole row that is anomalous, and ask whether your downstream model is robust. A tree-based model tolerates outliers far better than a linear model or a distance-based clustering algorithm. The unforgivable answer in an interview is &quot;I just drop anything beyond 3 standard deviations&quot; with no reasoning.</p>
</InterviewProblem>

<InterviewProblem question="Why is the z-score rule unreliable for outlier detection, and what would you use instead for skewed data?" difficulty="medium" tag="Conceptual">
  <p>The z-score flags a point when <M>{"|x - \\bar{x}| / s > k"}</M> (usually <M>{"k = 3"}</M>). The trouble is that both <M>{"\\bar{x}"}</M> and <M>{"s"}</M> are computed from the same data that contains the outliers &mdash; this is the <strong>masking</strong> problem. A few extreme points inflate <M>{"s"}</M> so much that they no longer look extreme relative to it, so the rule fails to catch what it was designed to catch.</p>
  <p>It also assumes roughly Gaussian, symmetric data. On a right-skewed distribution (income, latency, transaction size) the z-score rejects far too many legitimate high values and almost nothing on the short left tail.</p>
  <p>Robust alternatives use estimators with a high breakdown point:</p>
  <ul>
    <li><strong>IQR rule:</strong> flag points outside <M>{"[Q_1 - 1.5\\,\\mathrm{IQR},\; Q_3 + 1.5\\,\\mathrm{IQR}]"}</M>. Quartiles are insensitive to extreme values.</li>
    <li><strong>Modified z-score</strong> using the median and MAD: <MB>{"M_i = \\frac{0.6745\\,(x_i - \\tilde{x})}{\\mathrm{MAD}}, \\quad \\mathrm{MAD} = \\operatorname{median}(|x_i - \\tilde{x}|)"}</MB> Flag when <M>{"|M_i| > 3.5"}</M>. The constant <M>{"0.6745"}</M> makes MAD a consistent estimator of <M>{"\\sigma"}</M> under normality.</li>
    <li>For skewed data, transform first (log, Box-Cox) or use quantile-based bounds directly.</li>
  </ul>
</InterviewProblem>

<InterviewProblem question="You have unlabeled, high-dimensional logs and need to flag anomalies. Compare Isolation Forest and a distance/density approach like LOF, and explain when each wins." difficulty="hard" tag="Applied">
  <p>Both are unsupervised, but they exploit different definitions of &quot;anomalous.&quot;</p>
  <ul>
    <li><strong>Isolation Forest</strong> builds random trees by picking a random feature and a random split. Anomalies get isolated in very few splits because they sit in sparse regions, so they have a short average path length. The anomaly score is roughly <M>{"s(x) = 2^{-\\,E[h(x)] / c(n)}"}</M>, where <M>{"E[h(x)]"}</M> is the mean path length and <M>{"c(n)"}</M> normalizes for sample size. It is near-linear time, handles high dimensions and large <M>{"n"}</M> well, needs almost no distance metric, and is a strong default.</li>
    <li><strong>Local Outlier Factor (LOF)</strong> compares the local density of a point to the density of its neighbors. It catches <strong>local</strong> anomalies &mdash; a point that is normal globally but isolated within its own cluster &mdash; which Isolation Forest can miss. But it relies on a meaningful distance metric, suffers in high dimensions (distance concentration), and is <M>{"O(n^2)"}</M> without indexing.</li>
  </ul>
  <p>Decision: for high-dimensional logs at scale, start with Isolation Forest for speed and robustness. If you suspect clustered, density-varying structure (per-user or per-host baselines), add LOF or DBSCAN. Critically, set the contamination/threshold from a <strong>cost trade-off</strong>, not a default &mdash; in anomaly detection the base rate is tiny, so validate with precision@k or a precision-recall curve on whatever labels you can scrape, never raw accuracy.</p>
</InterviewProblem>

<InterviewProblem question="Implement the IQR outlier rule from scratch and explain why 1.5 is the multiplier." difficulty="medium" tag="Coding">
  <p>The IQR (interquartile range) is <M>{"Q_3 - Q_1"}</M>, the spread of the middle 50% of the data. The fence is placed <M>{"1.5\\,\\mathrm{IQR}"}</M> beyond each quartile:</p>
  <CodeBlock language="python" filename="iqr_outliers.py">{`import numpy as np

def iqr_outliers(x, k=1.5):
    x = np.asarray(x, dtype=float)
    q1, q3 = np.percentile(x, [25, 75])
    iqr = q3 - q1
    lower, upper = q1 - k * iqr, q3 + k * iqr
    mask = (x < lower) | (x > upper)
    return mask, (lower, upper)

data = [10, 12, 11, 13, 9, 12, 11, 250, 8, 10]
mask, fences = iqr_outliers(data)
print("fences:", fences)
print("outliers:", np.array(data)[mask])`}</CodeBlock>
  <p>Why <M>{"1.5"}</M>? For a Gaussian, <M>{"Q_1"}</M> and <M>{"Q_3"}</M> sit at about <M>{"\\pm 0.6745\\,\\sigma"}</M>, so <M>{"\\mathrm{IQR} \\approx 1.35\\,\\sigma"}</M>. The fences then land near <M>{"\\pm 2.7\\,\\sigma"}</M>, which captures roughly <M>{"99.3\\%"}</M> of the mass &mdash; aggressive enough to flag real outliers but loose enough not to drown you in false alarms. Tukey chose <M>{"1.5"}</M> as that balance; using <M>{"3.0"}</M> instead marks only &quot;far out&quot; extreme outliers. The key teaching point is that the rule is built on quartiles, so it has a high breakdown point and does not get masked by the outliers themselves.</p>
</InterviewProblem>

      </>
  );
}
