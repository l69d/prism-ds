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
      <p>Before any model, you summarise. Descriptive statistics compress a column of numbers into a handful of values that capture its center, spread, and shape — without lying about what the raw data actually looks like.</p>

      <KeyIdea>A summary is a deliberate loss of information. The skill is choosing summaries that throw away the noise while keeping the truth — and knowing which summaries quietly distort.</KeyIdea>

      <h2>Center: mean vs median</h2>
      <p>The <strong>mean</strong> is the balance point; the <strong>median</strong> is the middle value when sorted. They agree on symmetric data and split apart on skewed data.</p>
      <ul>
        <li><strong>Mean</strong> — uses every value, so a single extreme point drags it.</li>
        <li><strong>Median</strong> — depends only on rank, so it shrugs off outliers.</li>
      </ul>

      <h2>Spread and shape</h2>
      <p><strong>Variance</strong> and its square root, the <strong>standard deviation</strong>, measure typical distance from the mean. <strong>Quantiles</strong> (the 25th, 50th, 75th percentiles) describe spread without assuming any distribution, and the gap between mean and median signals <strong>skew</strong>.</p>

      <Basic>
        <p>Picture incomes in a room. Add one billionaire and the <em>average</em> income jumps to millions, even though almost everyone is still earning a normal wage. The <em>median</em> barely moves — it just asks &quot;who is in the middle?&quot; That is why reports use median house prices and median salaries: the mean is too easily hijacked by a few giants.</p>
        <p>Spread answers a different question: are people clustered tightly, or scattered? Standard deviation is the typical distance from the average. Quantiles slice the sorted data into chunks so you can say &quot;a quarter of values fall below here.&quot;</p>
      </Basic>

      <Advanced>
        <p>For values <M>{"x_1,\\dots,x_n"}</M>, the mean and the sample variance are:</p>
        <MB>{"\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i, \\qquad s^2 = \\frac{1}{n-1}\\sum_{i=1}^{n} (x_i - \\bar{x})^2"}</MB>
        <p>The <M>{"n-1"}</M> denominator (Bessel&apos;s correction) makes <M>{"s^2"}</M> an unbiased estimator of the population variance: dividing by <M>{"n"}</M> systematically underestimates spread because the sample mean is itself fit to the data. The mean minimises squared error, <M>{"\\arg\\min_c \\sum_i (x_i - c)^2"}</M>, while the median minimises absolute error, <M>{"\\arg\\min_c \\sum_i |x_i - c|"}</M> — which is exactly why the median is robust and the mean is not. Skewness, the third standardised moment, quantifies the asymmetry:</p>
        <MB>{"g_1 = \\frac{\\frac{1}{n}\\sum_i (x_i-\\bar{x})^3}{s^3}"}</MB>
      </Advanced>

      <Callout kind="pitfall" title="Never report the mean alone on skewed data">
        Mean income, mean response time, and mean session length are almost always right-skewed. Reporting only the mean inflates the &quot;typical&quot; value. Pair it with the median and a couple of quantiles, or report the median outright.
      </Callout>

      <CodeBlock language="python" filename="summarise.py">{`import numpy as np

# Salaries: mostly normal, one outlier
x = np.array([38, 41, 45, 47, 52, 55, 60, 9000])

print("mean   ", np.mean(x))            # 1042.4 -> hijacked
print("median ", np.median(x))          # 49.5  -> robust
print("std    ", np.std(x, ddof=1))     # ddof=1 => Bessel's n-1
print("q25,q75", np.percentile(x, [25, 75]))

# Skew check: mean far above median => right tail
print("skewed_right", np.mean(x) > np.median(x))`}</CodeBlock>

      <MoreDepth>
        <p>Quantiles are not uniquely defined — when a percentile falls between two data points, you must interpolate, and there are at least nine conventions (NumPy&apos;s default linear interpolation differs from R&apos;s type-7 vs type-6, and from the &quot;nearest-rank&quot; method). On small samples these choices change reported numbers, so pin the method when results must be reproducible. Likewise, the standard deviation is only an intuitive &quot;typical distance&quot; under roughly Gaussian data; for heavy-tailed distributions it can be enormous or even undefined, and the median absolute deviation (MAD) is a far more stable scale estimate.</p>
      </MoreDepth>

      <Quiz question="A dataset of website session times is strongly right-skewed (most sessions short, a few very long). Which single statistic best represents a typical session?" options={[
        { text: "The mean, because it uses all the data", why: "Using all the data is exactly the problem here: the long-session tail pulls the mean above what most users experience." },
        { text: "The median, because it is the middle value and resists the long tail", correct: true, why: "The median depends on rank, not magnitude, so the heavy right tail does not drag it — it reflects the typical user." },
        { text: "The standard deviation, because it measures spread", why: "Standard deviation describes spread, not a typical value, and is itself inflated by the skew." },
        { text: "The maximum, because it captures the full range", why: "The maximum is the single most extreme point — the opposite of typical." },
      ]} />
    </>
  );
}
