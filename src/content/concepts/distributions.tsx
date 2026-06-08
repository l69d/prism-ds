"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { Quiz } from "@/components/content/quiz";
import { DistributionExplorer } from "@/components/viz/distribution-explorer";
import { InterviewProblem } from "@/components/content/interview-problem";
import { CodeBlock } from "@/components/content/code-block";

export default function DistributionsContent() {
  return (
    <>
      <p>
        A probability distribution is a <strong>recipe for randomness</strong> — it tells you which
        values are likely and which are rare. Recognising a handful of common shapes lets you reason
        about data, choose the right model, and know what &quot;normal&quot; behaviour looks like.
      </p>

      <KeyIdea>
        Four distributions cover a huge fraction of real problems: the <strong>Normal</strong> for
        sums and measurements, the <strong>Binomial</strong> for counts of successes, the
        <strong> Poisson</strong> for rare events over time, and the <strong>Exponential</strong>
        for waiting times. Play with each below to feel how its parameters reshape it.
      </KeyIdea>

      <DistributionExplorer />

      <h2>Reading a distribution</h2>
      <Basic>
        <p>
          The <strong>height</strong> of the curve shows how likely values near that point are. The
          <strong> peak</strong> is the most common value; the <strong>width</strong> shows how spread
          out the data is. For the bell-shaped normal, about 68% of values fall within one standard
          deviation of the mean, 95% within two, and 99.7% within three.
        </p>
      </Basic>
      <Advanced>
        <p>
          For continuous variables the curve is a <strong>probability density function</strong> (PDF);
          probabilities are <em>areas</em> under it, so <M>{"P(a \\le X \\le b) = \\int_a^b f(x)\\,dx"}</M>.
          For discrete variables it&apos;s a <strong>probability mass function</strong> (PMF) and each bar
          is an actual probability. The <strong>CDF</strong> <M>{"F(x) = P(X \\le x)"}</M> accumulates them.
        </p>
        <p>The normal density is</p>
        <MB>{"f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}}\\, e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}"}</MB>
      </Advanced>

      <h2>When each one shows up</h2>
      <ul>
        <li><strong>Normal</strong> — heights, measurement error, anything that&apos;s a sum of many small effects (that&apos;s the CLT).</li>
        <li><strong>Binomial</strong> — &quot;how many of n trials succeeded?&quot; Conversions out of visitors, heads in coin flips.</li>
        <li><strong>Poisson</strong> — &quot;how many events in a fixed window?&quot; Support tickets per hour, typos per page.</li>
        <li><strong>Exponential</strong> — &quot;how long until the next event?&quot; Time between arrivals; it&apos;s memoryless.</li>
      </ul>

      <Callout kind="insight" title="Binomial → Poisson → Normal">
        These aren&apos;t separate worlds. A Binomial with large <M>{"n"}</M> and small <M>{"p"}</M>
        {" "}approaches a Poisson with <M>{"\\lambda = np"}</M>; a Binomial with large <M>{"n"}</M>
        {" "}approaches a Normal. Watch it happen by raising <em>n</em> in the explorer.
      </Callout>

      <MoreDepth>
        <p>
          Real data is often heavier-tailed than the normal — incomes, file sizes, and market
          returns follow <strong>log-normal</strong> or <strong>power-law</strong> distributions where
          extreme events are far more common than a normal would predict. Fitting a normal to such
          data badly underestimates tail risk. Check tails with a <strong>Q-Q plot</strong> before
          assuming normality.
        </p>
      </MoreDepth>

      <Quiz
        question="A website gets on average 3 sign-ups per hour, arriving independently. Which distribution models the number of sign-ups in the next hour?"
        options={[
          { text: "Normal", why: "Normal is continuous; counts of rare events are discrete." },
          { text: "Poisson with λ = 3", correct: true, why: "Counts of independent events in a fixed interval are Poisson; λ is the average rate." },
          { text: "Binomial with p = 3", why: "p is a probability and can't exceed 1." },
          { text: "Exponential with λ = 3", why: "Exponential models the time until the next sign-up, not the count." },
        ]}
      />
    <h2>Interview practice</h2>
<InterviewProblem question="What is the difference between a PDF, a PMF, and a CDF? Why is the PDF value not a probability?" difficulty="easy" tag="Conceptual">
  <p>A <strong>PMF</strong> (probability mass function) applies to discrete variables: <M>{"p(x) = P(X = x)"}</M> directly gives the probability of each outcome, and the values sum to 1.</p>
  <p>A <strong>PDF</strong> (probability density function) applies to continuous variables. Here <M>{"f(x)"}</M> is a <strong>density</strong>, not a probability — for a continuous variable any single point has probability 0. Probability only comes from integrating over an interval:</p>
  <MB>{"P(a \\le X \\le b) = \\int_a^b f(x)\\,dx"}</MB>
  <p>Because <M>{"f(x)"}</M> is probability per unit of <M>{"x"}</M>, it can exceed 1 (e.g. a Uniform on <M>{"[0, 0.5]"}</M> has height 2). What must equal 1 is the total area under the curve.</p>
  <p>A <strong>CDF</strong> unifies both: <M>{"F(x) = P(X \\le x)"}</M>. It is the running sum of the PMF or the integral of the PDF, is non-decreasing, and runs from 0 to 1. The CDF is the most general object because it is defined for any random variable.</p>
</InterviewProblem>
<InterviewProblem question="A server gets on average 3 requests per second. What's the probability of seeing zero requests in a given second, and what's the distribution of the gap between consecutive requests?" difficulty="medium" tag="Applied">
  <p>Counts of independent events arriving at a constant average rate over a fixed window follow a <strong>Poisson</strong> distribution. With rate <M>{"\\lambda = 3"}</M> per second:</p>
  <MB>{"P(X = k) = \\frac{\\lambda^k e^{-\\lambda}}{k!}, \\qquad P(X = 0) = e^{-3} \\approx 0.0498"}</MB>
  <p>So about a 5% chance of an idle second. The <strong>waiting time between events</strong> from the same process is <strong>Exponential</strong> with the same rate:</p>
  <MB>{"f(t) = \\lambda e^{-\\lambda t}, \\qquad P(T > t) = e^{-\\lambda t}"}</MB>
  <p>This is the deep link interviewers probe: Poisson counts and Exponential gaps are two views of the <strong>same</strong> point process. The Exponential is <strong>memoryless</strong> — having waited 2 seconds tells you nothing about the remaining wait, which is why it models &quot;time until next failure / arrival&quot; so often.</p>
  <CodeBlock language="python" filename="poisson_exp.py">{`from scipy import stats
import numpy as np

lam = 3.0  # average events per second

# P(zero requests in one second)
print(stats.poisson.pmf(0, mu=lam))        # ~0.0498

# Inter-arrival gaps: Exponential(rate=lam) -> scipy uses scale=1/lam
print(stats.expon.mean(scale=1/lam))       # 0.333 s expected gap
print(stats.expon.sf(0.5, scale=1/lam))    # P(gap > 0.5s) = e^{-1.5}

# Sanity check: counts of simulated arrivals are ~Poisson(lam)
gaps = stats.expon.rvs(scale=1/lam, size=100_000, random_state=0)
arrivals = np.cumsum(gaps)
counts = np.histogram(arrivals, bins=np.arange(0, arrivals[-1], 1))[0]
print(counts.mean(), counts.var())         # both ~3 (mean == var for Poisson)`}</CodeBlock>
</InterviewProblem>
<InterviewProblem question="State the 68-95-99.7 rule. A latency metric is Normal with mean 200ms and SD 20ms — what fraction of requests exceed 260ms, and why is assuming Normality risky here?" difficulty="medium" tag="Math">
  <p>For a Normal distribution, roughly <strong>68%</strong> of mass lies within <M>{"\\pm 1\\sigma"}</M>, <strong>95%</strong> within <M>{"\\pm 2\\sigma"}</M>, and <strong>99.7%</strong> within <M>{"\\pm 3\\sigma"}</M> of the mean.</p>
  <p>Here 260ms is <M>{"(260 - 200)/20 = 3"}</M> standard deviations above the mean. By the rule, 99.7% lies within <M>{"\\pm 3\\sigma"}</M>, so 0.3% lies outside both tails; by symmetry the upper tail alone is about <strong>0.15%</strong> of requests.</p>
  <MB>{"P(X > 260) = P\\!\\left(Z > 3\\right) \\approx 0.00135"}</MB>
  <p>The risk: real latency is almost never Normal. It is <strong>right-skewed and heavy-tailed</strong> — bounded below by network physics, with a long tail from retries, GC pauses, and cold starts. A Normal model badly <strong>underestimates the tail</strong>, so your true p99 / p999 will be far worse than 3-sigma math suggests. For latency, report empirical percentiles, not Gaussian tail probabilities.</p>
</InterviewProblem>
<InterviewProblem question="When does a Binomial distribution converge to a Poisson, and when to a Normal? Why does this matter in practice?" difficulty="hard" tag="Conceptual">
  <p>A Binomial <M>{"\\text{Bin}(n, p)"}</M> counts successes in <M>{"n"}</M> independent trials. It has two famous limits:</p>
  <ul>
    <li><strong>Poisson limit (rare events):</strong> when <M>{"n \\to \\infty"}</M>, <M>{"p \\to 0"}</M> with <M>{"np = \\lambda"}</M> fixed, <M>{"\\text{Bin}(n,p) \\to \\text{Poisson}(\\lambda)"}</M>. This is why Poisson models rare-but-many situations: clicks among millions of impressions, defects per batch, fraud per transaction.</li>
    <li><strong>Normal limit (CLT / de Moivre-Laplace):</strong> when <M>{"n"}</M> is large and <M>{"p"}</M> is not near 0 or 1, <M>{"\\text{Bin}(n,p) \\approx \\mathcal{N}(np,\\, np(1-p))"}</M>. A common rule of thumb is <M>{"np \\ge 10"}</M> and <M>{"n(1-p) \\ge 10"}</M>.</li>
  </ul>
  <p>Why it matters: it tells you which approximation is valid for a given regime. For a conversion rate of <M>{"p = 0.3"}</M> over <M>{"n = 1000"}</M> visitors, <M>{"np = 300"}</M> — use the Normal approximation to build a confidence interval for the rate. For <M>{"p = 0.0002"}</M> click-through over the same <M>{"n"}</M>, <M>{"np = 0.2"}</M> — the Normal approximation is terrible (it would assign mass to negative counts), so use Poisson instead. Picking the wrong limit gives wrong error bars and bad A/B-test conclusions.</p>
</InterviewProblem>

      </>
  );
}
