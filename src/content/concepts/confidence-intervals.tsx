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
      <p>A confidence interval gives you a range of plausible values for an unknown quantity, plus a number that says how often that procedure works. The catch is that the &quot;95%&quot; describes the method, not any single interval you happen to compute.</p>

      <KeyIdea>A 95% confidence interval means: if you repeated the whole experiment many times, about 95% of the intervals you build this way would contain the true value. It does <strong>not</strong> mean there is a 95% chance the truth lies in your one specific interval.</KeyIdea>

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
    </>
  );
}
