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
    </>
  );
}
