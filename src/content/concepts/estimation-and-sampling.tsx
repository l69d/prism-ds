"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { CodeBlock } from "@/components/content/code-block";
import { Quiz } from "@/components/content/quiz";
import { ConfidenceIntervalSimulator } from "@/components/viz/confidence-interval";

export default function Lesson() {
  return (
    <>
      <p>We almost never see a whole population. Instead we draw a sample and use it to guess some unknown number &mdash; a mean, a proportion, a rate. An <strong>estimator</strong> is the recipe that turns data into that guess, and our job is to know when the recipe is trustworthy.</p>

      <KeyIdea>An estimator is a random variable: feed it a different sample and it spits out a different number. &quot;Good&quot; means its scatter is centered on the truth (low bias) and tightly packed (low variance).</KeyIdea>

      <ConfidenceIntervalSimulator />

      <h2>Estimand, estimator, estimate</h2>
      <p>Keep three things separate. The <strong>estimand</strong> is the fixed-but-unknown population quantity (say, the true mean <M>{"\\mu"}</M>). The <strong>estimator</strong> is the procedure, like &quot;take the sample average.&quot; The <strong>estimate</strong> is the actual number you get from one dataset, like <M>{"42.7"}</M>.</p>
      <ul>
        <li><strong>Bias</strong> &mdash; on average across many samples, does the estimator land on the truth?</li>
        <li><strong>Variance</strong> &mdash; how much does the estimate jump around from sample to sample?</li>
        <li><strong>Consistency</strong> &mdash; does it converge to the truth as the sample grows?</li>
      </ul>

      <h2>How it works</h2>
      <Basic>
        <p>Imagine guessing the average height of a city by measuring 30 people. Do it again with a fresh 30 and you get a slightly different number. <strong>Bias</strong> is whether your guesses cluster around the real average or are systematically too high. <strong>Variance</strong> is how widely those guesses spread. A great estimator is like a tight, well-aimed cluster of darts: centered on the bullseye and bunched together. More data usually shrinks the spread without moving the center.</p>
      </Basic>
      <Advanced>
        <p>For an estimator <M>{"\\hat{\\theta}"}</M> of <M>{"\\theta"}</M>, bias and mean squared error decompose cleanly:</p>
        <MB>{"\\operatorname{Bias}(\\hat{\\theta}) = \\mathbb{E}[\\hat{\\theta}] - \\theta"}</MB>
        <MB>{"\\operatorname{MSE}(\\hat{\\theta}) = \\operatorname{Var}(\\hat{\\theta}) + \\operatorname{Bias}(\\hat{\\theta})^2"}</MB>
        <p>The sample mean <M>{"\\bar{X}"}</M> is unbiased with variance <M>{"\\sigma^2/n"}</M>. The sample variance uses <M>{"n-1"}</M> in the denominator precisely so that <M>{"\\mathbb{E}[s^2] = \\sigma^2"}</M> &mdash; Bessel&apos;s correction removes the downward bias from estimating <M>{"\\mu"}</M> with <M>{"\\bar{X}"}</M>.</p>
      </Advanced>

      <Callout kind="pitfall" title="Unbiased is not always best">
        Minimizing MSE can favor a slightly biased estimator with much lower variance. Shrinkage methods like ridge regression deliberately add bias to cut variance &mdash; and win on prediction error.
      </Callout>

      <CodeBlock language="python" filename="estimators.py">{`import numpy as np

rng = np.random.default_rng(0)
mu, sigma, n = 5.0, 2.0, 30

# Estimate the mean from many independent samples
means = [rng.normal(mu, sigma, n).mean() for _ in range(10_000)]

print(f"avg estimate : {np.mean(means):.3f}")   # ~5.0  -> low bias
print(f"std of estimate: {np.std(means):.3f}")  # ~sigma/sqrt(n) = 0.365
`}</CodeBlock>

      <MoreDepth>
        <p>The standard error <M>{"\\sigma/\\sqrt{n}"}</M> shrinks only as <M>{"\\sqrt{n}"}</M>: cutting the error in half costs <strong>four times</strong> the data. This square-root wall is why power analysis matters before you collect, and why the Cram&eacute;r&ndash;Rao lower bound &mdash; the smallest variance any unbiased estimator can achieve &mdash; is the real benchmark for &quot;efficient.&quot;</p>
      </MoreDepth>

      <Quiz question="Why does the sample variance divide by n-1 instead of n?" options={[
        { text: "To make the standard deviation larger for safety", why: "It is not a safety margin; it is an exact correction for a specific bias." },
        { text: "It corrects the downward bias from estimating the mean with the sample mean", correct: true, why: "Using the sample mean instead of the true mu shrinks deviations; dividing by n-1 makes E[s^2] = sigma^2." },
        { text: "Because n-1 counts the number of data points", why: "There are n data points; n-1 is the degrees of freedom, not a count of observations." },
        { text: "To reduce the variance of the estimator", why: "Bessel's correction targets bias, not variance; it actually slightly increases variance." },
      ]} />
    </>
  );
}
