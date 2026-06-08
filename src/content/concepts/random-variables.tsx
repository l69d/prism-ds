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
      <p>A random variable is just a rule that attaches a number to every outcome of a random process. Once randomness wears a number, we can average it, measure its spread, and reason about it with algebra.</p>

      <KeyIdea>A random variable turns &quot;what happened&quot; into a number; expectation is the long-run average of that number, and variance measures how far the number typically strays from it.</KeyIdea>

      <h2>From outcomes to numbers</h2>
      <p>Flip a coin: the outcome is heads or tails, but if you define <M>{"X = 1"}</M> for heads and <M>{"X = 0"}</M> for tails, you now have a number you can do math with. Random variables come in two flavors:</p>
      <ul>
        <li><strong>Discrete</strong> &mdash; takes countable values (a die roll, a click count), described by a probability mass function.</li>
        <li><strong>Continuous</strong> &mdash; takes values on a range (a wait time, a height), described by a probability density function.</li>
      </ul>

      <h2>Expectation and variance</h2>
      <p>The <strong>expectation</strong> is the probability-weighted average: each value pulls the mean toward itself in proportion to how likely it is. The <strong>variance</strong> is the expected squared distance from that mean &mdash; small variance means predictable, large variance means volatile.</p>

      <Basic>
        <p>Think of expectation as the &quot;balance point&quot; of the distribution. If you ran the experiment a million times and averaged the numbers, you&apos;d land near the expectation. Variance asks a different question: even if the average is fine, do individual results swing wildly or hug the center? A casino can have a positive expected profit per bet yet still need a big cash buffer because the variance is large.</p>
      </Basic>

      <Advanced>
        <p>For a discrete variable with values <M>{"x_i"}</M> and probabilities <M>{"p_i"}</M>:</p>
        <MB>{"\\mathbb{E}[X] = \\sum_i x_i\\, p_i, \\qquad \\mathrm{Var}(X) = \\mathbb{E}\\big[(X-\\mathbb{E}[X])^2\\big]"}</MB>
        <p>The continuous analog replaces the sum with an integral against the density <M>{"f(x)"}</M>:</p>
        <MB>{"\\mathbb{E}[X] = \\int_{-\\infty}^{\\infty} x\\, f(x)\\, dx"}</MB>
        <p>Two workhorse identities follow. The computational form of variance,</p>
        <MB>{"\\mathrm{Var}(X) = \\mathbb{E}[X^2] - \\big(\\mathbb{E}[X]\\big)^2"}</MB>
        <p>and the linearity of expectation, <M>{"\\mathbb{E}[aX + bY] = a\\,\\mathbb{E}[X] + b\\,\\mathbb{E}[Y]"}</M>, which holds even when <M>{"X"}</M> and <M>{"Y"}</M> are dependent.</p>
      </Advanced>

      <Callout kind="insight" title="Linearity is a superpower">
        Expectation adds even for dependent variables, but variance does not: <M>{"\\mathrm{Var}(X+Y) = \\mathrm{Var}(X) + \\mathrm{Var}(Y) + 2\\,\\mathrm{Cov}(X,Y)"}</M>. The covariance term only vanishes when the variables are uncorrelated.
      </Callout>

      <CodeBlock language="python" filename="expectation.py">{`import numpy as np

# Estimate E[X] and Var(X) for a fair die by simulation
rng = np.random.default_rng(0)
rolls = rng.integers(1, 7, size=1_000_000)

print("E[X]  ~", rolls.mean())        # ~3.5 (analytic: 3.5)
print("Var(X)~", rolls.var())         # ~2.9167 (analytic: 35/12)

# Exact computation from the pmf
values = np.arange(1, 7)
probs = np.full(6, 1 / 6)
mean = (values * probs).sum()
var = ((values ** 2) * probs).sum() - mean ** 2
print("exact:", mean, var)`}</CodeBlock>

      <Callout kind="pitfall" title="The mean is not the typical value">
        For skewed or heavy-tailed distributions, the expectation can sit in a region you rarely observe. Average income exceeds median income because a few huge values drag the mean up. Always pair the mean with the variance and the shape.
      </Callout>

      <MoreDepth>
        <p>Expectation can fail to exist. For a Cauchy distribution the defining integral does not converge, so <M>{"\\mathbb{E}[X]"}</M> is undefined &mdash; and the sample mean of Cauchy draws never settles down no matter how much data you collect, because the Law of Large Numbers requires a finite mean. This is why robust statistics (medians, trimmed means) matter for heavy-tailed real-world data where the variance, or even the mean, may be infinite.</p>
      </MoreDepth>

      <Quiz question="You define X = 1 for heads and X = 0 for tails on a biased coin with P(heads) = 0.3. What is E[X]?" options={[
        { text: "0.5, because there are two outcomes", why: "That assumes a fair coin; expectation must use the actual probabilities." },
        { text: "0.3", correct: true, why: "E[X] = 1 times 0.3 + 0 times 0.7 = 0.3, the probability-weighted average." },
        { text: "0.7", why: "That is P(tails), but tails maps to the value 0, contributing nothing to the mean." },
        { text: "1, because heads is coded as 1", why: "The value 1 only occurs 30% of the time, so it cannot be the average." },
      ]} />
    <h2>Interview practice</h2>

<InterviewProblem question="What is the difference between a discrete and a continuous random variable, and what does expectation mean for each?" difficulty="easy" tag="Conceptual">
  <p>A <strong>random variable</strong> maps outcomes of a random experiment to numbers. A <strong>discrete</strong> one takes countably many values (a die roll, a click count) and is described by a probability mass function <M>{"p(x)=P(X=x)"}</M>. A <strong>continuous</strong> one takes values on an interval (a latency in seconds) and is described by a density <M>{"f(x)"}</M>, where probabilities are areas: <M>{"P(a\\le X\\le b)=\\int_a^b f(x)\\,dx"}</M>.</p>
  <p>Expectation is the probability-weighted &quot;center of mass&quot; in both cases:</p>
  <MB>{"\\mathbb{E}[X]=\\sum_x x\\,p(x) \\qquad\\text{or}\\qquad \\mathbb{E}[X]=\\int_{-\\infty}^{\\infty} x\\,f(x)\\,dx"}</MB>
  <p>Two things interviewers like to hear: for a continuous variable <M>{"P(X=x)=0"}</M> for any single point, and the expectation is a fixed <strong>parameter</strong> of the distribution, not the random average you compute from a finite sample (that is the sample mean, an estimate of it).</p>
</InterviewProblem>

<InterviewProblem question="Derive the variance shortcut Var(X) = E[X^2] - (E[X])^2, then prove Var(aX + b) = a^2 Var(X)." difficulty="medium" tag="Math">
  <p>Start from the definition and expand the square inside the expectation, using linearity of <M>{"\\mathbb{E}"}</M> and the fact that <M>{"\\mu=\\mathbb{E}[X]"}</M> is a constant:</p>
  <MB>{"\\operatorname{Var}(X)=\\mathbb{E}[(X-\\mu)^2]=\\mathbb{E}[X^2-2\\mu X+\\mu^2]=\\mathbb{E}[X^2]-2\\mu\\,\\mathbb{E}[X]+\\mu^2"}</MB>
  <p>Since <M>{"\\mathbb{E}[X]=\\mu"}</M>, the last two terms collapse to <M>{"-2\\mu^2+\\mu^2=-\\mu^2"}</M>, giving the shortcut:</p>
  <MB>{"\\operatorname{Var}(X)=\\mathbb{E}[X^2]-\\mu^2=\\mathbb{E}[X^2]-(\\mathbb{E}[X])^2"}</MB>
  <p>For the affine transform, note <M>{"\\mathbb{E}[aX+b]=a\\mu+b"}</M>, so the centered quantity is <M>{"(aX+b)-(a\\mu+b)=a(X-\\mu)"}</M>. Then:</p>
  <MB>{"\\operatorname{Var}(aX+b)=\\mathbb{E}[a^2(X-\\mu)^2]=a^2\\,\\operatorname{Var}(X)"}</MB>
  <p>Key takeaways: the additive shift <M>{"b"}</M> vanishes (variance is location-invariant), the scale comes out squared, and variance is never negative because it is the expectation of a square.</p>
</InterviewProblem>

<InterviewProblem question="A model scores leads and you only act when the score exceeds a threshold. The payoff per lead is a random variable X with E[X] = 2 and Var(X) = 9. How would you reason about the expected profit and risk of a campaign over n = 100 independent leads?" difficulty="medium" tag="Applied">
  <p>Model total profit as <M>{"S=\\sum_{i=1}^{n} X_i"}</M> with i.i.d. leads. Expectation is linear and needs no independence:</p>
  <MB>{"\\mathbb{E}[S]=n\\,\\mathbb{E}[X]=100\\times 2=200"}</MB>
  <p>Variance adds across <strong>independent</strong> terms (the cross-covariances are zero):</p>
  <MB>{"\\operatorname{Var}(S)=n\\,\\operatorname{Var}(X)=100\\times 9=900,\\qquad \\text{SD}(S)=\\sqrt{900}=30"}</MB>
  <p>So expected profit is 200 with a standard deviation of 30. Note the <strong>signal-to-noise scaling</strong>: the mean grows like <M>{"n"}</M> but the SD only like <M>{"\\sqrt{n}"}</M>, so the relative spread <M>{"\\text{SD}/\\mathbb{E}=30/200=15\\%"}</M> shrinks as the campaign gets larger. In an interview, flag the load-bearing assumption: if leads are <strong>correlated</strong> (e.g. same market shock), positive covariance inflates the variance well above <M>{"n\\,\\operatorname{Var}(X)"}</M>, and the risk estimate above is too optimistic.</p>
</InterviewProblem>

<InterviewProblem question="Write code to verify E[X] and Var(X) for a custom discrete distribution by Monte Carlo, and confirm it matches the closed-form values." difficulty="hard" tag="Coding">
  <p>The pattern that signals competence: compute the theoretical moments from the pmf, simulate, and show the empirical estimates converge. We also report the standard error of the mean estimate so the comparison is principled rather than eyeballed.</p>
  <CodeBlock language="python" filename="rv_moments.py">{`import numpy as np

rng = np.random.default_rng(0)

# A custom discrete random variable: values and their probabilities
vals  = np.array([-1.0, 0.0, 2.0, 5.0])
probs = np.array([0.4, 0.3, 0.2, 0.1])
assert np.isclose(probs.sum(), 1.0)

# Closed-form moments from the pmf
mean_true = np.sum(vals * probs)
ex2_true  = np.sum(vals**2 * probs)
var_true  = ex2_true - mean_true**2
print(f"theory: E[X]={mean_true:.4f}  Var(X)={var_true:.4f}")

# Monte Carlo estimate
n = 1_000_000
samples = rng.choice(vals, size=n, p=probs)
mean_hat = samples.mean()
var_hat  = samples.var()              # divides by n (population variance)

# Standard error of the mean estimate: SD(X)/sqrt(n)
se = samples.std(ddof=1) / np.sqrt(n)
print(f"MC:     E[X]={mean_hat:.4f} +/- {se:.4f}  Var(X)={var_hat:.4f}")

assert abs(mean_hat - mean_true) < 5 * se   # within ~5 standard errors
`}</CodeBlock>
  <p>Talking points an interviewer rewards: the Monte Carlo mean is itself a random variable whose error shrinks like <M>{"1/\\sqrt{n}"}</M> (so 4x the samples halves the error), and <strong>population vs sample variance</strong> matters: NumPy&apos;s <strong>.var()</strong> divides by <M>{"n"}</M> while the unbiased estimator uses <M>{"n-1"}</M> (pass <strong>ddof=1</strong>). The assertion uses the standard error rather than a hard-coded tolerance, which is the right way to test a stochastic result.</p>
</InterviewProblem>

      </>
  );
}
