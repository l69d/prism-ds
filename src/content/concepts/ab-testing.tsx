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
      <p>
        An A/B test (a randomized controlled experiment) is how data-driven teams establish{" "}
        <strong>causation</strong>: randomly split users into a control (A) and a variant (B),
        change one thing, and measure the difference. Done right it&apos;s the gold standard. Done
        wrong it produces confident, expensive nonsense.
      </p>

      <KeyIdea>
        Randomization makes the two groups statistically identical <em>except</em> for the change you
        made — so any reliable difference in the metric is <strong>caused</strong> by that change.
        Everything else in A/B testing is about not fooling yourself with noise.
      </KeyIdea>

      <ABTestSimulator />

      <h2>Anatomy of an experiment</h2>
      <ul>
        <li><strong>Hypothesis</strong> — a specific, falsifiable prediction (&quot;a shorter checkout raises conversion&quot;).</li>
        <li><strong>Unit of randomization</strong> — usually the user (not the session), so a person sees a consistent experience.</li>
        <li><strong>Primary metric / OEC</strong> — the one Overall Evaluation Criterion you&apos;ll decide on, chosen <em>before</em> launch.</li>
        <li><strong>Guardrail metrics</strong> — things that must not get worse (latency, crashes, revenue, unsubscribes).</li>
      </ul>

      <Basic>
        <p>
          Think of it like a fair coin flip assigning each user to A or B. Because assignment is random,
          the groups are alike in every way — age, device, intent — so if B converts more, the new
          design is the reason, not a fluke of who landed where.
        </p>
      </Basic>
      <Advanced>
        <p>
          Formally, randomization makes treatment assignment <strong>independent of potential outcomes</strong>,
          so the difference in means is an unbiased estimate of the average treatment effect
          {" "}<M>{"\\tau = \\mathbb{E}[Y(1) - Y(0)]"}</M>. For two proportions we test{" "}
          <M>{"H_0: p_B = p_A"}</M> with the statistic
        </p>
        <MB>{"z = \\frac{\\hat{p}_B - \\hat{p}_A}{\\sqrt{\\hat{p}(1-\\hat{p})\\left(\\tfrac{1}{n_A}+\\tfrac{1}{n_B}\\right)}}"}</MB>
        <p>where <M>{"\\hat{p}"}</M> is the pooled rate. The variance — and thus the sample size you need — depends on the baseline rate and the effect you want to detect.</p>
      </Advanced>

      <h2>Designing it: power, MDE, and duration</h2>
      <p>
        Before launching, run a <strong>power analysis</strong> (third tab above). You choose the
        <strong> minimum detectable effect</strong> (MDE) — the smallest lift worth caring about — and a
        target power (usually 80%), and it tells you the sample size and therefore the duration.
      </p>
      <Callout kind="warning" title="Run full weeks">
        Traffic and behaviour follow weekly cycles (weekday vs weekend, payday). Always run for whole
        weeks and pre-commit to the duration, or you bake seasonality into your result.
      </Callout>

      <h2>The loopholes that fool people</h2>
      <Callout kind="pitfall" title="Peeking / optional stopping">
        Checking the p-value repeatedly and stopping the instant it dips below 0.05 inflates your false
        positive rate from 5% to 20–30%+. The middle tab above demonstrates this on an A/A test (no real
        effect). Fix: a fixed horizon, or proper <strong>sequential testing</strong> (mSPRT, group-sequential).
      </Callout>
      <Callout kind="pitfall" title="Multiple comparisons">
        Test 20 variants or metrics at <M>{"\\alpha = 0.05"}</M> and you expect one false &quot;winner&quot;
        by chance. Correct with Bonferroni or Benjamini-Hochberg, and pre-register a single primary metric.
      </Callout>
      <Callout kind="pitfall" title="Sample Ratio Mismatch (SRM)">
        If you split 50/50 but observe 51/49 with large traffic, your randomization or logging is broken —
        a chi-square test on the split will flag it. An SRM invalidates the whole experiment; never ignore it.
      </Callout>
      <ul>
        <li><strong>Novelty &amp; primacy effects</strong> — users react to <em>change</em> itself; early lifts can decay. Watch the trend over time, not just the total.</li>
        <li><strong>Simpson&apos;s paradox</strong> — an overall win can hide losses in every segment (or vice-versa) if the mix shifts. Check key segments.</li>
        <li><strong>p-hacking / HARKing</strong> — slicing until something is &quot;significant&quot;, then telling a story around it. Decide the analysis before seeing the data.</li>
        <li><strong>Twyman&apos;s law</strong> — any result that looks too good is probably an instrumentation bug. Investigate surprises before celebrating.</li>
      </ul>

      <h2>Industry conventions &amp; procedure</h2>
      <ul>
        <li><strong>A/A test</strong> first to validate the pipeline (you should get ~5% false positives, no more).</li>
        <li><strong>Ramp up</strong> exposure gradually (1% → 5% → 50%) with automatic guardrail alerts before full rollout.</li>
        <li><strong>CUPED</strong> — use pre-experiment data to reduce variance, often cutting required sample size by 30–50%.</li>
        <li><strong>Holdouts</strong> — keep a long-term control to measure cumulative and novelty-adjusted impact.</li>
        <li>Report an <strong>effect size with a confidence interval</strong>, plus practical (not just statistical) significance.</li>
      </ul>

      <CodeBlock language="python" filename="ab_test.py">{`import numpy as np
from statsmodels.stats.proportion import proportions_ztest
from statsmodels.stats.power import NormalIndPower

# --- analyze a finished test ---
conv = np.array([1180, 1290])      # conversions A, B
n    = np.array([12000, 12000])    # users per arm
stat, p = proportions_ztest(conv, n)
print(f"z={stat:.2f}  p={p:.4f}")

# --- plan the next one: users per arm for a +5% relative lift ---
from statsmodels.stats.proportion import proportion_effectsize
eff = proportion_effectsize(0.10, 0.105)
n_per_arm = NormalIndPower().solve_power(eff, power=0.8, alpha=0.05, alternative="two-sided")
print(f"need ~{n_per_arm:,.0f} users per arm")`}</CodeBlock>

      <MoreDepth>
        <p>
          Senior-level concerns go beyond the t-test. <strong>CUPED</strong> regresses out a pre-period
          covariate <M>{"X"}</M>, replacing <M>{"Y"}</M> with <M>{"Y - \\theta(X - \\bar{X})"}</M> where
          {" "}<M>{"\\theta"}</M> minimizes variance — pure variance reduction, no bias. In marketplaces and
          social products, <strong>interference</strong> (network effects, shared inventory) breaks the
          independence assumption; cluster or <strong>switchback</strong> randomization helps. And report
          <strong> heterogeneous treatment effects</strong> — a flat average can hide that you helped one
          segment and hurt another, which is where the real product decisions live.
        </p>
      </MoreDepth>

      <Quiz
        question="An experiment hits p = 0.04 on day 3 of a planned 14-day test. What should you do?"
        options={[
          { text: "Stop now and ship — it's significant.", why: "That's peeking / optional stopping, which inflates the false-positive rate far above 5%." },
          { text: "Keep running to the pre-committed horizon, then decide.", correct: true, why: "Fixed-horizon (or a proper sequential method) keeps the error rate honest." },
          { text: "Lower alpha to 0.01 and re-check tomorrow.", why: "Ad-hoc threshold changes mid-flight don't fix the peeking problem." },
          { text: "Add more variants to be sure.", why: "More comparisons make false positives more likely, not less." },
        ]}
      />
    </>
  );
}
