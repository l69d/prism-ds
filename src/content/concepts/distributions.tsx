"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { Quiz } from "@/components/content/quiz";
import { DistributionExplorer } from "@/components/viz/distribution-explorer";

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
    </>
  );
}
