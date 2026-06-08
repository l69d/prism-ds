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
    <h2>Interview practice</h2>
<InterviewProblem question="What is the difference between bias and variance of an estimator, and what does the bias-variance decomposition of mean squared error tell us?" difficulty="easy" tag="Conceptual">
  <p>An estimator <M>{"\\hat{\\theta}"}</M> is a function of the data that targets an unknown parameter <M>{"\\theta"}</M>. Two properties describe how good it is:</p>
  <ul>
    <li><strong>Bias</strong>: how far the estimator is off on average, <M>{"\\operatorname{Bias}(\\hat{\\theta}) = \\mathbb{E}[\\hat{\\theta}] - \\theta"}</M>. An estimator with zero bias is called <strong>unbiased</strong>.</li>
    <li><strong>Variance</strong>: how much the estimate jumps around across different samples, <M>{"\\operatorname{Var}(\\hat{\\theta}) = \\mathbb{E}\\big[(\\hat{\\theta} - \\mathbb{E}[\\hat{\\theta}])^2\\big]"}</M>.</li>
  </ul>
  <p>The mean squared error of the estimator splits cleanly into these two pieces:</p>
  <MB>{"\\operatorname{MSE}(\\hat{\\theta}) = \\mathbb{E}\\big[(\\hat{\\theta} - \\theta)^2\\big] = \\operatorname{Bias}(\\hat{\\theta})^2 + \\operatorname{Var}(\\hat{\\theta})"}</MB>
  <p>The lesson: low bias is not enough. A biased estimator with much smaller variance can have lower total error, which is exactly why regularized (shrinkage) estimators often beat the unbiased ones in practice. A &quot;good&quot; estimator is usually one that minimizes MSE, not one that is merely unbiased.</p>
</InterviewProblem>
<InterviewProblem question="Why does the sample variance use n minus 1 in the denominator instead of n? Show that n minus 1 gives an unbiased estimate." difficulty="medium" tag="Math">
  <p>The intuition: the sample mean <M>{"\\bar{X}"}</M> is the value that minimizes the sum of squared deviations, so deviations measured from <M>{"\\bar{X}"}</M> are systematically smaller than deviations from the true mean <M>{"\\mu"}</M>. Dividing by <M>{"n"}</M> would therefore underestimate the true variance. Dividing by <M>{"n-1"}</M> (Bessel&apos;s correction) exactly fixes the downward bias.</p>
  <p>Proof for i.i.d. draws with mean <M>{"\\mu"}</M> and variance <M>{"\\sigma^2"}</M>. Start from the algebraic identity:</p>
  <MB>{"\\sum_{i=1}^n (X_i - \\bar{X})^2 = \\sum_{i=1}^n (X_i - \\mu)^2 - n(\\bar{X} - \\mu)^2"}</MB>
  <p>Take expectations of both sides. Each <M>{"\\mathbb{E}[(X_i-\\mu)^2] = \\sigma^2"}</M>, and <M>{"\\mathbb{E}[(\\bar{X}-\\mu)^2] = \\operatorname{Var}(\\bar{X}) = \\sigma^2/n"}</M>:</p>
  <MB>{"\\mathbb{E}\\Big[\\sum_{i=1}^n (X_i - \\bar{X})^2\\Big] = n\\sigma^2 - n\\cdot\\frac{\\sigma^2}{n} = (n-1)\\sigma^2"}</MB>
  <p>So defining <M>{"S^2 = \\frac{1}{n-1}\\sum (X_i-\\bar{X})^2"}</M> gives <M>{"\\mathbb{E}[S^2] = \\sigma^2"}</M> exactly. The deeper reason for <M>{"n-1"}</M>: estimating <M>{"\\mu"}</M> with <M>{"\\bar{X}"}</M> &quot;costs&quot; one degree of freedom, leaving <M>{"n-1"}</M> independent pieces of information about spread.</p>
  <p>Caveat worth mentioning: <M>{"S^2"}</M> is unbiased for the variance, but <M>{"S"}</M> (its square root) is <strong>not</strong> an unbiased estimate of <M>{"\\sigma"}</M>, because the square root is a nonlinear (concave) transform and Jensen&apos;s inequality kicks in.</p>
</InterviewProblem>
<InterviewProblem question="You need a confidence interval for a complicated statistic (say, the median ratio of two skewed metrics) where you do not know the sampling distribution. How would you do it, and what are the assumptions?" difficulty="medium" tag="Applied">
  <p>Use the <strong>bootstrap</strong>. The core idea: the empirical distribution of your sample is your best estimate of the population, so resampling from your own data with replacement mimics drawing fresh samples from the population.</p>
  <ul>
    <li>Draw <M>{"B"}</M> resamples (e.g. <M>{"B=10{,}000"}</M>), each of size <M>{"n"}</M>, sampling <strong>with replacement</strong> from the observed data.</li>
    <li>Recompute the statistic on each resample, giving a bootstrap distribution <M>{"\\hat{\\theta}^{*}_1,\\dots,\\hat{\\theta}^{*}_B"}</M>.</li>
    <li>Read off a 95% interval. The simplest version is the <strong>percentile interval</strong>: the 2.5th and 97.5th percentiles of the bootstrap values.</li>
  </ul>
  <CodeBlock language="python" filename="bootstrap_ci.py">{`import numpy as np

def bootstrap_ci(x, y, stat, B=10000, alpha=0.05, seed=0):
    rng = np.random.default_rng(seed)
    n = len(x)
    boot = np.empty(B)
    for b in range(B):
        idx = rng.integers(0, n, size=n)   # resample with replacement
        boot[b] = stat(x[idx], y[idx])     # recompute on the resample
    lo, hi = np.quantile(boot, [alpha / 2, 1 - alpha / 2])
    return lo, hi

median_ratio = lambda a, b: np.median(a) / np.median(b)
print(bootstrap_ci(metric_a, metric_b, median_ratio))`}</CodeBlock>
  <p><strong>Assumptions and caveats to raise in the interview:</strong></p>
  <ul>
    <li>Observations should be roughly i.i.d.; for time series or clustered data you must use a <strong>block bootstrap</strong> or resample whole clusters, or the intervals will be too narrow.</li>
    <li>The bootstrap struggles with extreme-order statistics (min/max) and very small <M>{"n"}</M>, where the empirical distribution is a poor stand-in for the population.</li>
    <li>The basic percentile interval can be biased; <strong>BCa</strong> (bias-corrected and accelerated) intervals correct for bias and skew and are usually the better default.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="Define a consistent estimator and an efficient estimator. Can an estimator be unbiased but not consistent, or biased but consistent? Give an example of each." difficulty="hard" tag="Conceptual">
  <p><strong>Consistency</strong> is an asymptotic (large-<M>{"n"}</M>) property: <M>{"\\hat{\\theta}_n"}</M> is consistent if it converges in probability to the true value as the sample grows, <M>{"\\hat{\\theta}_n \\xrightarrow{p} \\theta"}</M>. A clean sufficient condition is that both bias and variance go to zero, i.e. <M>{"\\operatorname{MSE}(\\hat{\\theta}_n) \\to 0"}</M>.</p>
  <p><strong>Efficiency</strong> is about variance among a class of estimators. An unbiased estimator is efficient if it attains the smallest possible variance, the <strong>Cramer-Rao lower bound</strong> <M>{"\\operatorname{Var}(\\hat{\\theta}) \\ge 1/I(\\theta)"}</M>, where <M>{"I(\\theta)"}</M> is the Fisher information. Such an estimator is the minimum-variance unbiased estimator (MVUE).</p>
  <p>The two properties are independent, and here are the corner cases:</p>
  <ul>
    <li><strong>Unbiased but NOT consistent</strong>: estimate <M>{"\\mu"}</M> by just using the first observation, <M>{"\\hat{\\mu} = X_1"}</M>. It is unbiased (<M>{"\\mathbb{E}[X_1] = \\mu"}</M>) but its variance stays <M>{"\\sigma^2"}</M> no matter how much data you collect, so it never converges. More data does not help.</li>
    <li><strong>Biased but consistent</strong>: the maximum-likelihood variance <M>{"\\hat{\\sigma}^2 = \\frac{1}{n}\\sum (X_i-\\bar{X})^2"}</M> has bias <M>{"-\\sigma^2/n"}</M>, so it is biased for every finite <M>{"n"}</M>, yet the bias vanishes as <M>{"n\\to\\infty"}</M> and it converges to <M>{"\\sigma^2"}</M>. Consistent but not unbiased.</li>
  </ul>
  <p>Takeaway: unbiasedness is a finite-sample statement, consistency is an asymptotic one, and efficiency ranks estimators by variance. A strong estimator is consistent and, ideally, efficient; perfect unbiasedness is often the property you trade away first.</p>
</InterviewProblem>

      </>
  );
}
