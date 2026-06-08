"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { CodeBlock } from "@/components/content/code-block";
import { Quiz } from "@/components/content/quiz";
import { ConfidenceIntervalSimulator } from "@/components/viz/confidence-interval";
import { InterviewProblem } from "@/components/content/interview-problem";

export default function Lesson() {
  return (
    <>
      <p>A confidence interval gives you a range of plausible values for an unknown quantity, plus a number that says how often that procedure works. The catch is that the &quot;95%&quot; describes the method, not any single interval you happen to compute.</p>

      <KeyIdea>A 95% confidence interval means: if you repeated the whole experiment many times, about 95% of the intervals you build this way would contain the true value. It does <strong>not</strong> mean there is a 95% chance the truth lies in your one specific interval.</KeyIdea>

      <ConfidenceIntervalSimulator />

      <h2>What it estimates</h2>
      <p>You almost never know a population&apos;s true mean. You collect a sample, compute a sample mean, and that estimate jitters from sample to sample. A confidence interval wraps your estimate in a margin that reflects that jitter:</p>
      <ul>
        <li><strong>Center</strong> — your point estimate (e.g. the sample mean).</li>
        <li><strong>Width</strong> — driven by the standard error, which shrinks as your sample grows.</li>
        <li><strong>Confidence level</strong> — how aggressively you widen the interval to catch the truth.</li>
      </ul>

      <h2>How it works</h2>
      <Basic><p>Imagine fishing with a net of fixed size. The fish (the true value) sits at one fixed spot. Each sample is a cast of the net at a slightly different position. A 95% confidence procedure is a net sized so that 95 out of 100 casts land over the fish. Once you have made your single cast, the net either covers the fish or it does not, you just can&apos;t see which. The 95% is a property of your casting technique, not of the cast sitting in front of you.</p></Basic>
      <Advanced><p>For a sample mean with known-ish spread, the interval is the estimate plus or minus a critical value times the standard error:</p>
      <MB>{"\\bar{x} \\pm z_{1-\\alpha/2} \\cdot \\frac{s}{\\sqrt{n}}"}</MB>
      <p>Here <M>{"z_{1-\\alpha/2} \\approx 1.96"}</M> for 95%, <M>{"s"}</M> is the sample standard deviation, and <M>{"n"}</M> is the sample size. With small samples and unknown variance, swap the normal quantile for a Student-t quantile with <M>{"n-1"}</M> degrees of freedom. The width scales as <M>{"1/\\sqrt{n}"}</M>: to halve it you must quadruple your data.</p></Advanced>

      <Callout kind="pitfall" title="The probability is in the procedure">For a fixed interval like [4.1, 5.3], the true mean is already either inside or outside, there is no randomness left. Saying &quot;there&apos;s a 95% probability the mean is in here&quot; treats a fixed unknown as random. The randomness lived in the sampling, before you computed the bounds.</Callout>

      <CodeBlock language="python" filename="ci.py">{`import numpy as np
from scipy import stats

rng = np.random.default_rng(0)
sample = rng.normal(loc=50, scale=10, size=40)

mean = sample.mean()
se = sample.std(ddof=1) / np.sqrt(len(sample))
t = stats.t.ppf(0.975, df=len(sample) - 1)   # 95% two-sided

lo, hi = mean - t * se, mean + t * se
print(f"95% CI: [{lo:.2f}, {hi:.2f}]")        # true mean (50) usually inside`}</CodeBlock>

      <MoreDepth><p>Coverage is only nominal when the model assumptions hold. Skew, heavy tails, or dependence between observations can make a &quot;95%&quot; interval cover far less than 95% of the time. When formulas are shaky, bootstrap intervals resample the data thousands of times to approximate the sampling distribution directly. And beware selective reporting: if you build many intervals and showcase only the narrow or surprising ones, your effective coverage collapses, the multiplicity has to be accounted for.</p></MoreDepth>

      <Quiz question="A study reports a 95% confidence interval of [2.1, 4.8] for an effect. Which statement is correct?" options={[
        { text: "There is a 95% probability the true effect lies between 2.1 and 4.8.", why: "Once computed, the interval is fixed and the true effect is a fixed unknown; the 95% describes the long-run procedure, not this one interval." },
        { text: "If the study were repeated many times, about 95% of such intervals would contain the true effect.", correct: true, why: "This is the correct frequentist meaning: the 95% is a coverage property of the interval-building method across repeated samples." },
        { text: "95% of the data points fall between 2.1 and 4.8.", why: "A confidence interval bounds the estimate of a parameter, not the spread of individual data values." },
        { text: "We are 95% sure the next observation will fall between 2.1 and 4.8.", why: "That describes a prediction interval for a new observation, which is different and typically wider than a confidence interval for the mean." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="A colleague says 'there's a 95% probability the true mean lies inside my 95% confidence interval.' Is that right?" difficulty="easy" tag="Conceptual">
  <p>No &mdash; this is the single most common misinterpretation. In the frequentist framing the true parameter <M>{"\\mu"}</M> is a fixed (unknown) constant, not random. The <strong>interval</strong> is the random object: it shifts from sample to sample.</p>
  <p>The correct statement is about the <strong>procedure</strong>, not any one interval: if you repeated the experiment many times and built a 95% CI each time, about 95% of those intervals would contain <M>{"\\mu"}</M>.</p>
  <ul>
    <li>For the one interval you actually computed, <M>{"\\mu"}</M> is either in it or not &mdash; the &quot;probability&quot; is 0 or 1, you just don&apos;t know which.</li>
    <li>The 95% is the long-run coverage of the method, a property assigned <strong>before</strong> you see the data.</li>
    <li>If you genuinely want a probability statement about <M>{"\\mu"}</M> given your data, that is a <strong>Bayesian credible interval</strong>, which requires a prior and answers a different question.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="Derive the standard 95% confidence interval for a population mean and explain when you use z vs t." difficulty="medium" tag="Math">
  <p>Start from the sampling distribution of the mean. For i.i.d. draws with mean <M>{"\\mu"}</M> and variance <M>{"\\sigma^2"}</M>, the CLT gives:</p>
  <MB>{"\\bar{X} \\approx \\mathcal{N}\\!\\left(\\mu, \; \\frac{\\sigma^2}{n}\\right)"}</MB>
  <p>so the standardized statistic is approximately standard normal:</p>
  <MB>{"Z = \\frac{\\bar{X} - \\mu}{\\sigma / \\sqrt{n}} \\sim \\mathcal{N}(0,1)"}</MB>
  <p>Pick critical value <M>{"z_{0.975} \\approx 1.96"}</M> so that <M>{"P(-1.96 \\le Z \\le 1.96) = 0.95"}</M>, then invert to isolate <M>{"\\mu"}</M>:</p>
  <MB>{"\\bar{X} \\pm 1.96 \\, \\frac{\\sigma}{\\sqrt{n}}"}</MB>
  <p>The two regimes:</p>
  <ul>
    <li><strong>z-interval</strong>: when <M>{"\\sigma"}</M> is known (rare in practice) or <M>{"n"}</M> is large enough that estimating it barely matters.</li>
    <li><strong>t-interval</strong>: when you estimate <M>{"\\sigma"}</M> with the sample standard deviation <M>{"s"}</M>. The extra uncertainty fattens the tails, so you use <M>{"t_{n-1}"}</M>: <M>{"\\bar{X} \\pm t_{n-1,\\,0.975}\\, s / \\sqrt{n}"}</M>. For small <M>{"n"}</M> the t critical value is noticeably larger than 1.96 (e.g. ~2.26 at <M>{"n=10"}</M>); as <M>{"n \\to \\infty"}</M> it converges back to z.</li>
  </ul>
  <p>Key driver: width scales like <M>{"1/\\sqrt{n}"}</M>, so quartering the interval costs 16x the data.</p>
</InterviewProblem>
<InterviewProblem question="You need a CI for the median session duration, which is heavily right-skewed, and you don't trust a closed-form formula. How do you build one?" difficulty="medium" tag="Applied">
  <p>Use the <strong>bootstrap</strong>. It makes no normality assumption and works for any statistic (median, 90th percentile, ratio of means) where the analytic standard error is ugly or unknown.</p>
  <ul>
    <li>Resample <M>{"n"}</M> observations <strong>with replacement</strong> from your data, compute the median, and repeat <M>{"B"}</M> times (say 10,000).</li>
    <li>The spread of those <M>{"B"}</M> medians estimates the sampling distribution of the median.</li>
    <li>For a 95% <strong>percentile bootstrap</strong> CI, take the 2.5th and 97.5th percentiles of the bootstrap statistics.</li>
  </ul>
  <CodeBlock language="python" filename="bootstrap_ci.py">{`import numpy as np

def bootstrap_ci(x, stat=np.median, B=10000, alpha=0.05, seed=0):
    rng = np.random.default_rng(seed)
    x = np.asarray(x)
    n = len(x)
    boot = np.empty(B)
    for b in range(B):
        sample = x[rng.integers(0, n, size=n)]  # resample with replacement
        boot[b] = stat(sample)
    lo, hi = np.quantile(boot, [alpha / 2, 1 - alpha / 2])
    return lo, hi

durations = np.random.exponential(scale=30, size=500)  # skewed data
print(bootstrap_ci(durations))`}</CodeBlock>
  <p>Caveats worth saying out loud: the bootstrap still needs the original sample to be representative, it struggles at extreme quantiles or tiny <M>{"n"}</M>, and the basic percentile method can be biased &mdash; the BCa (bias-corrected and accelerated) variant fixes much of that.</p>
</InterviewProblem>
<InterviewProblem question="An A/B test shows a +2.1% lift in conversion with 95% CI [-0.3%, +4.5%]. Stakeholders want to ship. What do you tell them, and how does this connect to hypothesis testing?" difficulty="hard" tag="Case">
  <p>The headline number is positive, but the interval <strong>straddles zero</strong>, so the result is not statistically significant at the 5% level. There is a direct duality: a 95% CI for the difference contains zero <strong>if and only if</strong> the corresponding two-sided test fails to reject <M>{"H_0: \\text{lift}=0"}</M> at <M>{"\\alpha=0.05"}</M>. So this is equivalent to <M>{"p > 0.05"}</M>.</p>
  <p>What I would actually communicate:</p>
  <ul>
    <li><strong>Don&apos;t overclaim.</strong> The data are consistent with anything from a slight loss (&minus;0.3%) to a solid win (+4.5%). We cannot rule out &quot;no effect.&quot;</li>
    <li><strong>Reframe around the decision, not the p-value.</strong> The right question is whether the downside risk is tolerable and the expected value is positive. Pair the CI with the cost of being wrong and the cost of waiting.</li>
    <li><strong>The interval is wide because we&apos;re underpowered.</strong> Width <M>{"\\propto 1/\\sqrt{n}"}</M>, so the fix is more samples or longer runtime; a power calculation tells us how much to detect a lift of business interest.</li>
    <li><strong>Beware practical vs statistical significance.</strong> Even if we later get a significant +0.4%, ask whether that clears the launch threshold.</li>
    <li><strong>Watch for peeking.</strong> If they&apos;ve been checking the dashboard daily, the nominal 95% coverage is broken by multiple looks; use sequential / always-valid CIs to monitor honestly.</li>
  </ul>
  <p>Bottom line: the CI is a richer summary than a yes/no significance verdict &mdash; it quantifies <strong>how uncertain</strong> we are, which is exactly what a ship/no-ship decision needs.</p>
</InterviewProblem>

      </>
  );
}
