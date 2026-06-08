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
    <h2>Interview practice</h2>
<InterviewProblem question="Explain the difference between mean and median, and when you would prefer one over the other." difficulty="easy" tag="Conceptual">
  <p>The <strong>mean</strong> is the arithmetic average; it uses every value and is the balance point of the distribution. The <strong>median</strong> is the middle value when data is sorted; it depends only on rank, not magnitude.</p>
  <p>The key distinction is <strong>robustness</strong>. The mean is pulled toward extreme values, so a single outlier can move it arbitrarily far. The median has a breakdown point of 50% &mdash; up to half the data can be corrupted before it becomes meaningless.</p>
  <ul>
    <li>Prefer the <strong>median</strong> for skewed or heavy-tailed data: incomes, house prices, latency, response times.</li>
    <li>Prefer the <strong>mean</strong> for roughly symmetric data, or when you need a quantity that aggregates linearly (e.g. total = mean times count, or for downstream variance/expectation math).</li>
  </ul>
  <p>A useful diagnostic: for a right-skewed distribution the mean sits to the right of the median (<M>{"\\text{mean} > \\text{median}"}</M>); for left-skewed the reverse. Equality suggests rough symmetry.</p>
</InterviewProblem>
<InterviewProblem question="What is the difference between population variance and sample variance, and why do we divide by n minus 1?" difficulty="medium" tag="Math">
  <p>Population variance divides the sum of squared deviations by <M>{"n"}</M>:</p>
  <MB>{"\\sigma^2 = \\frac{1}{n}\\sum_{i=1}^{n}(x_i - \\mu)^2"}</MB>
  <p>But in practice we do not know the true mean <M>{"\\mu"}</M>; we estimate it with the sample mean <M>{"\\bar{x}"}</M>. The deviations <M>{"x_i - \\bar{x}"}</M> are, by construction, as small as possible (the sample mean minimizes the sum of squared deviations). This makes the plug-in estimate systematically too small.</p>
  <p><strong>Bessel&apos;s correction</strong> fixes this bias by dividing by <M>{"n-1"}</M>:</p>
  <MB>{"s^2 = \\frac{1}{n-1}\\sum_{i=1}^{n}(x_i - \\bar{x})^2"}</MB>
  <p>The intuition: estimating <M>{"\\bar{x}"}</M> from the same data costs one <strong>degree of freedom</strong> &mdash; only <M>{"n-1"}</M> of the deviations are free, since they must sum to zero. Formally, one can show <M>{"\\mathbb{E}\\!\\left[\\sum (x_i-\\bar{x})^2\\right] = (n-1)\\sigma^2"}</M>, so dividing by <M>{"n-1"}</M> makes <M>{"s^2"}</M> unbiased: <M>{"\\mathbb{E}[s^2] = \\sigma^2"}</M>.</p>
  <p>Note that <M>{"s"}</M> (the standard deviation) is still slightly biased even with this correction, because the square root is nonlinear &mdash; but the variance estimate is unbiased.</p>
</InterviewProblem>
<InterviewProblem question="You are monitoring API latency and report the mean as 120ms, but users complain it feels slow. What summary statistics would you report instead, and how would you compute them at scale?" difficulty="medium" tag="Applied">
  <p>Latency is right-skewed: most requests are fast, but a long tail of slow requests dominates the user experience. The <strong>mean hides the tail</strong> &mdash; a handful of multi-second requests barely move it. What users feel is the tail, so report <strong>quantiles</strong>.</p>
  <ul>
    <li><strong>p50 (median)</strong>: typical experience.</li>
    <li><strong>p95 / p99</strong>: the slow tail &mdash; what your unluckiest users hit. SLOs are almost always written on p99, not the mean.</li>
    <li>Pair with the <strong>max</strong> and a histogram to spot multimodality (e.g. a cache-hit vs cache-miss bimodal split).</li>
  </ul>
  <p>At scale you cannot hold every request in memory or re-sort streaming data, so use an approximate-quantile sketch (e.g. t-digest or DDSketch) that gives bounded-error percentiles in a single pass with small memory.</p>
  <CodeBlock language="python" filename="latency_summary.py">{`import numpy as np

# offline / fits-in-memory
latency = np.array([...])  # ms
for q in [50, 95, 99, 99.9]:
    print(f"p{q}: {np.percentile(latency, q):.1f} ms")
print(f"mean: {latency.mean():.1f} ms")  # for contrast

# streaming / billions of requests: use a sketch
from tdigest import TDigest
digest = TDigest()
for x in latency_stream():        # one pass, O(1) memory
    digest.update(x)
p99 = digest.percentile(99)`}</CodeBlock>
  <p>The punchline for the interviewer: a single central-tendency number is the wrong tool for a skewed, user-facing metric. Report the distribution, and write SLOs on tail quantiles.</p>
</InterviewProblem>
<InterviewProblem question="Derive an online (single-pass, numerically stable) algorithm for the running mean and variance. Why not just accumulate the sum of squares?" difficulty="hard" tag="Coding">
  <p>The naive approach accumulates <M>{"\\sum x_i"}</M> and <M>{"\\sum x_i^2"}</M>, then uses <M>{"\\operatorname{Var} = \\frac{\\sum x_i^2}{n} - \\bar{x}^2"}</M>. This is one pass and O(1) memory, but <strong>numerically catastrophic</strong>: when values are large and variance is small, you subtract two huge nearly-equal numbers (catastrophic cancellation) and can even get a negative variance from floating-point error.</p>
  <p><strong>Welford&apos;s algorithm</strong> updates the mean and the sum of squared deviations <M>{"M_2"}</M> incrementally and stably. For each new value <M>{"x_n"}</M>:</p>
  <MB>{"\\delta = x_n - \\bar{x}_{n-1}, \\quad \\bar{x}_n = \\bar{x}_{n-1} + \\frac{\\delta}{n}"}</MB>
  <MB>{"M_{2,n} = M_{2,n-1} + \\delta\\,(x_n - \\bar{x}_n)"}</MB>
  <p>Then the sample variance is <M>{"s^2 = M_2 / (n-1)"}</M>. It works because the update tracks deviations from the <em>current running mean</em>, never forming the large raw sum of squares.</p>
  <CodeBlock language="python" filename="welford.py">{`def running_stats(stream):
    n = 0
    mean = 0.0
    M2 = 0.0
    for x in stream:
        n += 1
        delta = x - mean
        mean += delta / n
        delta2 = x - mean        # uses the UPDATED mean
        M2 += delta * delta2
    if n < 2:
        return mean, float("nan")
    variance = M2 / (n - 1)      # Bessel-corrected
    return mean, variance

# stable even for values like 1e9 + tiny noise,
# where the naive sum-of-squares method loses all precision`}</CodeBlock>
  <p>Bonus the interviewer may probe: Welford generalizes to a <strong>parallel/merge</strong> form (Chan&apos;s algorithm), letting you combine partial <M>{"(n, \\bar{x}, M_2)"}</M> triples from different shards &mdash; which is exactly how distributed variance is computed in Spark or pandas groupby.</p>
</InterviewProblem>

      </>
  );
}
