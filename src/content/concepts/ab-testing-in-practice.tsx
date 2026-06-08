"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { CodeBlock } from "@/components/content/code-block";
import { Quiz } from "@/components/content/quiz";
import { ABTestSimulator } from "@/components/viz/ab-test-simulator";

export default function Lesson() {
  return (
    <>
      <p>An A/B test is a randomized experiment that turns a product hunch into a defensible causal claim. But running one well is mostly about discipline: sizing it, not peeking, and squeezing out noise.</p>

      <KeyIdea>Randomization buys you causality for free; everything else in A/B testing is about controlling error rates so the ship/no-ship decision survives scrutiny.</KeyIdea>

      <ABTestSimulator />

      <h2>Power: sizing the experiment before you run it</h2>
      <p>Before launch you commit to a sample size. Too small and a real win hides in the noise; too large and you waste traffic and time. The four levers are the false-positive rate <M>{"\\alpha"}</M>, the false-negative rate <M>{"\\beta"}</M>, the minimum detectable effect (MDE), and the metric&apos;s variance.</p>
      <ul>
        <li><strong>Power</strong> is <M>{"1-\\beta"}</M>, your probability of detecting a true effect of the MDE size.</li>
        <li>Smaller effects need quadratically more users: halving the MDE roughly quadruples the required <M>{"n"}</M>.</li>
        <li>Fix <M>{"\\alpha"}</M>, power, and MDE <em>up front</em>, then do not move the goalposts.</li>
      </ul>

      <Basic>
        <p>Think of it like weighing two nearly identical bags of flour on a shaky scale. If you put a tiny pinch on one side, you need many weighings to be sure it&apos;s heavier. A bigger difference, a steadier scale, or more weighings all make the call easier. &quot;Power&quot; is just your chance of correctly noticing the heavier bag when it really is heavier.</p>
      </Basic>

      <Advanced>
        <p>For a two-sample comparison of means with equal allocation, the per-arm sample size for significance <M>{"\\alpha"}</M> and power <M>{"1-\\beta"}</M> is approximately:</p>
        <MB>{"n \\approx \\frac{2\\,\\sigma^2\\,(z_{1-\\alpha/2} + z_{1-\\beta})^2}{\\delta^2}"}</MB>
        <p>where <M>{"\\delta"}</M> is the MDE and <M>{"\\sigma^2"}</M> the metric variance. The <M>{"\\delta^2"}</M> in the denominator is why detecting subtle lifts is so expensive, and why variance reduction pays off directly.</p>
      </Advanced>

      <h2>Peeking and CUPED</h2>
      <p>Two practices separate amateurs from analysts you can trust. <strong>Don&apos;t peek</strong> at significance repeatedly on a fixed-horizon test, and <strong>reduce variance</strong> with pre-experiment data via CUPED.</p>
      <p>CUPED (Controlled-experiment Using Pre-Experiment Data) regresses out a covariate measured <em>before</em> the experiment, such as each user&apos;s pre-period spend, which is unaffected by the treatment but strongly predicts the outcome.</p>

      <Callout kind="pitfall" title="Peeking inflates false positives">
        Checking a fixed-horizon test every day and stopping the moment p &lt; 0.05 can push your true false-positive rate well above 5 percent. Either commit to the sample size, or use a sequential method (alpha-spending, group-sequential, or always-valid confidence sequences) designed for continuous monitoring.
      </Callout>

      <CodeBlock language="python" filename="cuped.py">{`import numpy as np

# y: outcome during experiment; x: SAME metric in the pre-period (a covariate)
def cuped_adjust(y, x):
    x = x - x.mean()                       # center the covariate
    theta = np.cov(y, x)[0, 1] / np.var(x) # optimal coefficient
    return y - theta * x                   # variance-reduced outcome

# Apply per arm, then run your usual t-test on the adjusted values.
# theta is estimated on pooled data; the adjustment is unbiased because
# x is independent of treatment assignment.
y_adj = cuped_adjust(y, x_pre)
`}</CodeBlock>

      <MoreDepth>
        <p>CUPED reduces variance by a factor of <M>{"1-\\rho^2"}</M>, where <M>{"\\rho"}</M> is the correlation between the pre-period covariate and the outcome. With <M>{"\\rho = 0.7"}</M> you cut variance roughly in half, equivalent to doubling your sample for free. The covariate <em>must</em> be pre-treatment; using anything measured during the experiment can absorb the treatment effect itself and bias the estimate. A senior pitfall: if randomization is imbalanced on the covariate (small samples), CUPED also corrects for that chance imbalance, which is a bonus, not the main goal.</p>
      </MoreDepth>

      <Quiz question="Why must the CUPED covariate be measured before the experiment starts?" options={[
        { text: "Because pre-period data is always less noisy than experiment data", why: "Noise level is not the issue; the timing requirement is about avoiding contamination by the treatment." },
        { text: "Because a covariate measured during the experiment can be affected by the treatment, biasing the adjusted estimate", correct: true, why: "Right: a pre-treatment covariate is independent of assignment, so subtracting it removes variance without removing or distorting the treatment effect." },
        { text: "Because regression requires the covariate and outcome to be measured at different times", why: "Regression has no such requirement; ordinary least squares works fine on contemporaneous variables." },
        { text: "Because it lets you peek at the results early without inflating alpha", why: "CUPED is about variance reduction; it does nothing to fix the multiple-looks problem that causes peeking inflation." },
      ]} />
    </>
  );
}
