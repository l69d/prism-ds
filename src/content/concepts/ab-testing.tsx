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
      <p>An A/B test compares two versions of something &mdash; a button, an algorithm, a price &mdash; by randomly splitting users into groups and measuring a metric. The hard part isn&apos;t running it; it&apos;s designing it so the result actually means something.</p>

      <KeyIdea>Randomization is the whole trick: if you assign users to A or B by coin flip, the two groups differ only by chance plus your change &mdash; so any reliable gap in the metric must be caused by the change.</KeyIdea>

      <h2>Why randomize?</h2>
      <p>Without random assignment, the groups differ in ways you can&apos;t see. If you let users pick, or ship the new version only to power users, you&apos;ve confounded the treatment with who they are. Randomization breaks that link: it balances both the variables you measured and the ones you forgot, on average.</p>
      <ul>
        <li><strong>Control group (A):</strong> the existing experience, your baseline.</li>
        <li><strong>Treatment group (B):</strong> the change you want to evaluate.</li>
        <li><strong>One metric, decided up front:</strong> conversion rate, revenue per user, click-through.</li>
      </ul>

      <h2>How the decision works</h2>
      <Basic>
        <p>Even if A and B were truly identical, the two groups would still show slightly different rates &mdash; that&apos;s just luck of who landed where. The question is whether the gap you observed is bigger than luck can plausibly explain. A statistical test answers exactly that: it asks &quot;if the change did nothing, how surprising is a gap this large?&quot; If the answer is &quot;very surprising,&quot; you conclude the change had a real effect.</p>
      </Basic>
      <Advanced>
        <p>You set a null hypothesis that the two conversion rates are equal, <M>{"H_0: p_A = p_B"}</M>, and compute a test statistic. For two proportions the pooled two-sample z-test uses</p>
        <MB>{"z = \\frac{\\hat{p}_B - \\hat{p}_A}{\\sqrt{\\hat{p}(1-\\hat{p})\\left(\\frac{1}{n_A} + \\frac{1}{n_B}\\right)}}"}</MB>
        <p>where <M>{"\\hat{p}"}</M> is the pooled rate. The p-value is <M>{"P(|Z| \\geq |z| \\mid H_0)"}</M>. You reject <M>{"H_0"}</M> when it falls below your significance level <M>{"\\alpha"}</M> (commonly 0.05), which caps your false-positive rate. Crucially, <M>{"\\alpha"}</M> and the sample size must be fixed <em>before</em> you look at the data.</p>
      </Advanced>

      <Callout kind="pitfall" title="Peeking kills your guarantees">
        Checking the p-value every day and stopping the moment it dips below 0.05 inflates your false-positive rate far above 5%. Each peek is another chance for noise to cross the line. Fix the sample size in advance, or use a sequential test designed for repeated looks.
      </Callout>

      <h2>Power and sample size</h2>
      <p>A test that&apos;s too small can&apos;t detect a real effect &mdash; it has low <strong>power</strong>. Before launching, decide the smallest effect worth caring about and compute how many users you need to detect it with, say, 80% probability.</p>

      <CodeBlock language="python" filename="sample_size.py">{`from statsmodels.stats.power import NormalIndPower
from statsmodels.stats.proportion import proportion_effectsize

# baseline 10% conversion; we care about a lift to 11%
effect = proportion_effectsize(0.11, 0.10)

n = NormalIndPower().solve_power(
    effect_size=effect,
    alpha=0.05,      # false-positive rate
    power=0.80,      # chance of catching a real lift
    ratio=1.0,       # equal-sized groups
)
print(f"Need ~{int(n)} users per group")  # ~14,750`}</CodeBlock>

      <Callout kind="insight" title="Significance is not importance">
        A huge sample can make a 0.01% lift &quot;statistically significant&quot; while being commercially worthless. Always report the effect size and a confidence interval, not just whether p &lt; 0.05.
      </Callout>

      <MoreDepth>
        <p>Real traffic violates the textbook assumption that observations are independent. The same user returns across days, sessions cluster within accounts, and network effects let treatment leak into control. The fix is to randomize at the unit you actually analyze &mdash; usually the user, not the page view &mdash; and to use cluster-robust standard errors or a CUPED-style variance reduction that regresses out pre-experiment behavior. Ignoring clustering quietly shrinks your standard errors and manufactures significance that won&apos;t replicate.</p>
      </MoreDepth>

      <Quiz question="Halfway through a two-week test you see p = 0.04 and stop early, declaring the winner. What's the main problem?" options={[
        { text: "Stopping early is fine because the p-value already crossed 0.05", why: "The threshold being crossed once is exactly the trap; early stopping changes what that threshold guarantees." },
        { text: "Repeatedly peeking and stopping at the first significant result inflates the false-positive rate above the nominal alpha", correct: true, why: "Each look is another shot at random noise crossing the line, so the true false-positive rate exceeds your stated alpha unless you planned for it." },
        { text: "Two weeks is always too short for any A/B test", why: "Duration depends on traffic and the required sample size; there is no universal minimum." },
        { text: "A p-value of 0.04 is too close to 0.05 to ever trust", why: "0.04 is a valid result under a properly fixed design; the issue here is the optional stopping, not the exact value." },
      ]} />
    </>
  );
}
