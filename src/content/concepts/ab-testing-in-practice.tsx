"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { CodeBlock } from "@/components/content/code-block";
import { Quiz } from "@/components/content/quiz";
import { ABTestSimulator } from "@/components/viz/ab-test-simulator";
import { InterviewProblem } from "@/components/content/interview-problem";

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
    <h2>Interview practice</h2>
<InterviewProblem question="What is statistical power, and how do the four levers (effect size, variance, sample size, alpha) trade off when you size an experiment?" difficulty="easy" tag="Conceptual">
  <p>Power is the probability of detecting a true effect of a given size, i.e. <M>{"1-\\beta"}</M> where <M>{"\\beta"}</M> is the false-negative rate. A standard target is 80% power at <M>{"\\alpha=0.05"}</M>.</p>
  <p>For a two-sample test of means, the required per-arm sample size scales as:</p>
  <MB>{"n \\approx \\frac{2\\,(z_{1-\\alpha/2}+z_{1-\\beta})^2\\,\\sigma^2}{\\delta^2}"}</MB>
  <p>where <M>{"\\delta"}</M> is the minimum detectable effect (MDE) and <M>{"\\sigma^2"}</M> the metric variance. The trade-offs:</p>
  <ul>
    <li><strong>Smaller MDE</strong> costs sample quadratically: halving <M>{"\\delta"}</M> needs roughly <M>{"4\\times"}</M> the users.</li>
    <li><strong>Higher variance</strong> demands more users linearly, which is exactly why variance-reduction (CUPED, stratification) is so valuable.</li>
    <li><strong>Lower alpha</strong> (stricter false-positive control) raises <M>{"z_{1-\\alpha/2}"}</M> and so increases <M>{"n"}</M>.</li>
    <li><strong>Higher power</strong> raises <M>{"z_{1-\\beta}"}</M> and also increases <M>{"n"}</M>.</li>
  </ul>
  <p>The interview point: you never &quot;just run it longer&quot; without committing to an MDE up front. Pick the smallest effect worth shipping, then the math fixes the runtime.</p>
</InterviewProblem>
<InterviewProblem question="Your PM checks the dashboard daily and wants to call the test the moment p drops below 0.05. Explain why peeking inflates the false-positive rate and what you would do instead." difficulty="medium" tag="Conceptual">
  <p>A fixed-horizon p-value is only valid if you look once, at the pre-committed sample size. Each interim look is another chance for noise to cross the threshold, so the test statistic does a random walk and the family-wise error rate balloons. With naive daily peeking over a typical run, the true false-positive rate climbs from 5% to well above 20-30%.</p>
  <p>Intuition: under <M>{"H_0"}</M> the running p-value is not monotone; it wanders and dips. &quot;Stop the first time it dips below 0.05&quot; is optional-stopping, which guarantees you eventually cross by chance.</p>
  <p>What to do instead:</p>
  <ul>
    <li><strong>Sequential / always-valid methods</strong> &mdash; group sequential boundaries (O&apos;Brien-Fleming, Pocock) or anytime-valid confidence sequences (mSPRT, e-values). These spend the <M>{"\\alpha"}</M> budget across looks so you can monitor continuously and stop early legitimately.</li>
    <li><strong>Pre-register a fixed horizon</strong> and only read out at the end if you must use a fixed-horizon test.</li>
    <li>If a dashboard must show running results, mark them as not-yet-significant and gate the ship decision on the sanctioned readout.</li>
  </ul>
  <p>The defensible answer is: decide the stopping rule before you start, and use a method whose validity survives the way you actually look at the data.</p>
</InterviewProblem>
<InterviewProblem question="Explain CUPED. Why does it reduce variance without biasing the treatment estimate, and how much variance can it remove?" difficulty="hard" tag="Math">
  <p>CUPED (Controlled-experiment Using Pre-Experiment Data) regresses out a pre-experiment covariate <M>{"X"}</M> &mdash; usually the same metric measured before randomization &mdash; from the outcome <M>{"Y"}</M>. Define the adjusted metric:</p>
  <MB>{"Y^{\\mathrm{cuped}} = Y - \\theta\\,(X - \\bar{X})"}</MB>
  <p>The optimal coefficient is the one that minimizes the variance of the adjusted metric:</p>
  <MB>{"\\theta^\\star = \\frac{\\operatorname{Cov}(Y, X)}{\\operatorname{Var}(X)}"}</MB>
  <p><strong>Unbiased:</strong> because <M>{"X"}</M> is measured <em>before</em> randomization, its distribution is identical in treatment and control in expectation, so <M>{"\\mathbb{E}[X-\\bar{X}]=0"}</M> in each arm. Subtracting it shifts both arm means by the same expected amount, leaving the treatment difference <M>{"\\mathbb{E}[Y_T]-\\mathbb{E}[Y_C]"}</M> unchanged.</p>
  <p><strong>Variance reduction:</strong> plugging in <M>{"\\theta^\\star"}</M> gives</p>
  <MB>{"\\operatorname{Var}(Y^{\\mathrm{cuped}}) = \\operatorname{Var}(Y)\\,(1-\\rho^2)"}</MB>
  <p>where <M>{"\\rho"}</M> is the correlation between the pre-period and in-experiment metric. So a covariate correlated at <M>{"\\rho=0.7"}</M> removes about <M>{"1-0.49=51\\%"}</M> of the variance &mdash; equivalent to roughly doubling your sample size for free. The closer the pre-period metric tracks the outcome, the bigger the win, which is why per-user historical metrics are such good covariates.</p>
</InterviewProblem>
<InterviewProblem question="You shipped a feature; the experiment was flat overall, but the engagement segment is +3% significant. The team wants to ship to that segment. How do you decide, and what guardrails do you set?" difficulty="hard" tag="Case">
  <p>The headline risk is a post-hoc subgroup that is really noise. Walk through it:</p>
  <ul>
    <li><strong>Was the segment pre-registered?</strong> If you sliced many segments after the fact, multiple comparisons mean one will look significant by chance. Apply a correction (Bonferroni / Benjamini-Hochberg) across all slices you actually looked at, or treat the finding as hypothesis-generating only.</li>
    <li><strong>Sanity-check the experiment.</strong> Run an SRM (sample-ratio mismatch) chi-square on the arm split &mdash; a flat overall result hiding a strong segment is a classic symptom of a bucketing or logging bug. If SRM fails, nothing else is trustworthy.</li>
    <li><strong>Is the segment well-defined and targetable?</strong> If &quot;engaged users&quot; is defined using in-experiment behavior, it can be affected by treatment, so conditioning on it induces selection bias. Use only pre-treatment attributes to define the segment.</li>
    <li><strong>Effect size and cost.</strong> Is +3% above your MDE for that segment, or is the segment so small the CI is huge? Check the power for that slice, not the overall test.</li>
  </ul>
  <p>The defensible decision: do not ship on a post-hoc slice. Pre-register the segment hypothesis and run a confirmatory experiment targeting just that pre-treatment-defined segment, powered for the +3% you saw. If it replicates, ship; if not, you dodged a false positive. The interviewer is testing whether you can resist a tempting-but-uncontrolled result.</p>
</InterviewProblem>

      </>
  );
}
