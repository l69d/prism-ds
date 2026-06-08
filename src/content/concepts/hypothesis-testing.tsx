"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { Quiz } from "@/components/content/quiz";
import { HypothesisTestViz } from "@/components/viz/hypothesis-test";
import { InterviewProblem } from "@/components/content/interview-problem";
import { CodeBlock } from "@/components/content/code-block";

export default function HypothesisTestingContent() {
  return (
    <>
      <p>
        Hypothesis testing is a disciplined way to answer one question:{" "}
        <strong>could this result plausibly be just noise?</strong> You assume nothing interesting
        is happening (the null hypothesis), then ask how surprising your data would be in that world.
      </p>

      <KeyIdea>
        Start by assuming <strong>no effect</strong> (<M>{"H_0"}</M>). Compute how likely you&apos;d see
        data <em>at least this extreme</em> if that were true — that&apos;s the p-value. If it&apos;s small
        enough, the &quot;no effect&quot; story becomes implausible and you reject it.
      </KeyIdea>

      <p>
        Below is the null distribution — the spread of results you&apos;d expect if there were truly no
        effect. The red tails are the p-value. Notice what happens to the <em>same</em> observed effect
        as you increase the sample size: the null narrows, and noise stops being a viable excuse.
      </p>

      <HypothesisTestViz />

      <h2>The vocabulary, demystified</h2>
      <ul>
        <li><strong>Null hypothesis <M>{"H_0"}</M></strong> — the boring default: no difference, no effect.</li>
        <li><strong>Alternative <M>{"H_1"}</M></strong> — what you suspect is actually true.</li>
        <li><strong>p-value</strong> — probability of data this extreme <em>if <M>{"H_0"}</M> were true</em>.</li>
        <li><strong>Significance level <M>{"\\alpha"}</M></strong> — your threshold for &quot;surprising enough&quot; (often 0.05).</li>
      </ul>

      <Callout kind="pitfall" title="What a p-value is NOT">
        It is <strong>not</strong> the probability that <M>{"H_0"}</M> is true. It&apos;s not the
        probability your result happened by chance. And a small p-value doesn&apos;t mean a{" "}
        <em>large</em> or important effect — only an unlikely-under-null one.
      </Callout>

      <h2>Two ways to be wrong</h2>
      <Basic>
        <p>
          A <strong>false positive</strong> (Type I) is crying wolf — declaring an effect that
          isn&apos;t real. A <strong>false negative</strong> (Type II) is missing a real effect.
          Lowering your threshold to avoid false positives makes false negatives more likely — there&apos;s
          always a trade-off.
        </p>
      </Basic>
      <Advanced>
        <p>
          <strong>Type I error</strong> rate is <M>{"\\alpha"}</M>; <strong>Type II</strong> is
          {" "}<M>{"\\beta"}</M>, and <strong>power</strong> is <M>{"1-\\beta"}</M> — the probability of
          detecting a real effect of a given size. Power rises with effect size, sample size, and
          {" "}<M>{"\\alpha"}</M>, and falls with variance. Run a <strong>power analysis before</strong>
          {" "}collecting data to choose <M>{"n"}</M>; an underpowered study that finds nothing tells you
          almost nothing.
        </p>
      </Advanced>

      <MoreDepth>
        <p>
          With large <M>{"n"}</M>, <strong>everything becomes statistically significant</strong> — even
          effects too tiny to matter. Always report an <strong>effect size</strong> and a{" "}
          <strong>confidence interval</strong> alongside the p-value. And beware{" "}
          <strong>p-hacking</strong>: testing many hypotheses and reporting the one that crossed 0.05.
          If you run 20 independent tests at <M>{"\\alpha=0.05"}</M>, you expect one false positive by
          chance alone — correct for multiple comparisons (Bonferroni, Benjamini-Hochberg).
        </p>
      </MoreDepth>

      <Quiz
        question="Your A/B test returns p = 0.03. Which statement is correct?"
        options={[
          { text: "There's a 3% chance the result is due to chance.", why: "Common misreading — the p-value is conditional on H₀ being true." },
          { text: "If there were truly no difference, you'd see data this extreme about 3% of the time.", correct: true, why: "That's the precise definition of a p-value." },
          { text: "The effect is large.", why: "Significance ≠ magnitude. A tiny effect can be significant with enough data." },
          { text: "There's a 97% chance the alternative is true.", why: "The p-value is not the probability of any hypothesis." },
        ]}
      />
    <h2>Interview practice</h2>
<InterviewProblem question="A teammate says 'the p-value is 0.03, so there's a 97% chance our new ranking model is better.' What's wrong with that statement?" difficulty="easy" tag="Conceptual">
  <p>The p-value is <strong>not</strong> the probability that a hypothesis is true. It is computed <em>assuming the null is true</em>: it is the probability of seeing data at least as extreme as what we observed, given <M>{"H_0"}</M>.</p>
  <p>Formally, with test statistic <M>{"T"}</M> and observed value <M>{"t_{obs}"}</M> for a one-sided test:</p>
  <MB>{"p = P(T \\geq t_{obs} \\mid H_0)"}</MB>
  <p>So <M>{"p = 0.03"}</M> means: <em>if the new model were truly no better</em>, we&apos;d see a result this favorable only 3% of the time. The five things a p-value is NOT:</p>
  <ul>
    <li>NOT <M>{"P(H_0 \\mid \\text{data})"}</M> &mdash; that requires a prior and Bayes&apos; rule.</li>
    <li>NOT the probability the result was due to chance.</li>
    <li>NOT the probability of making a wrong decision.</li>
    <li>NOT a measure of effect size or practical importance.</li>
    <li>NOT replicable as-is &mdash; a second study won&apos;t give the same p.</li>
  </ul>
  <p>The correct framing: &quot;under the assumption of no improvement, this data would be fairly surprising.&quot; To talk about the probability the model is better, you need a Bayesian posterior, not a p-value.</p>
</InterviewProblem>
<InterviewProblem question="Define Type I error, Type II error, and power. If you cut your significance level from 0.05 to 0.01 with everything else fixed, what happens to each?" difficulty="medium" tag="Conceptual">
  <p>Frame the four outcomes against the truth:</p>
  <ul>
    <li><strong>Type I error</strong> (false positive): rejecting <M>{"H_0"}</M> when it is true. Its rate is <M>{"\\alpha"}</M>.</li>
    <li><strong>Type II error</strong> (false negative): failing to reject <M>{"H_0"}</M> when it is false. Its rate is <M>{"\\beta"}</M>.</li>
    <li><strong>Power</strong> <M>{"= 1 - \\beta"}</M>: the probability of correctly detecting a real effect.</li>
  </ul>
  <p>Lowering <M>{"\\alpha"}</M> from 0.05 to 0.01 raises the bar for rejection, so:</p>
  <ul>
    <li>Type I error rate <strong>drops</strong> (that&apos;s the definition of <M>{"\\alpha"}</M>).</li>
    <li>Type II error rate <strong>rises</strong> &mdash; you reject less often, so you miss more true effects.</li>
    <li>Power <strong>falls</strong>, since power <M>{"= 1 - \\beta"}</M>.</li>
  </ul>
  <p>There is a fundamental tradeoff between <M>{"\\alpha"}</M> and <M>{"\\beta"}</M> at fixed sample size. The only way to push both down at once is to increase <M>{"n"}</M> (or the effect size, or reduce variance). This is exactly why power analysis sizes experiments <em>before</em> running them.</p>
</InterviewProblem>
<InterviewProblem question="You run an A/B test on a 0.1% baseline conversion rate. With 20,000 users per arm you get p = 0.001 for a lift from 0.10% to 0.12%. The PM wants to ship. What do you say?" difficulty="hard" tag="Applied">
  <p>This is the classic &quot;significance is not importance&quot; trap. Two separate questions: is the effect real, and is it worth shipping?</p>
  <p><strong>Statistical significance.</strong> A tiny p only says the lift is unlikely under <M>{"H_0"}</M>. With large <M>{"n"}</M>, even microscopic differences become significant because the standard error shrinks like <M>{"1/\\sqrt{n}"}</M>:</p>
  <MB>{"SE = \\sqrt{\\frac{p_A(1-p_A)}{n} + \\frac{p_B(1-p_B)}{n}}"}</MB>
  <p><strong>Practical importance.</strong> The absolute lift is 0.02 percentage points &mdash; a 20% relative gain, but on a tiny base. Report a <strong>confidence interval on the effect</strong>, not just p, and weigh it against costs: engineering, latency, novelty effects, and whether the metric is even the true business objective.</p>
  <p>Other red flags I&apos;d check before shipping:</p>
  <ul>
    <li>With a 0.1% base, conversion counts are tiny (~20 per arm) &mdash; verify the normal approximation holds or use an exact test.</li>
    <li>Was this the only metric tested? Multiple comparisons inflate false positives; correct with Bonferroni or Benjamini&ndash;Hochberg.</li>
    <li>Did the test stop the moment it hit significance? Peeking inflates Type I error; use a pre-registered horizon or sequential testing.</li>
    <li>Are guardrail metrics (revenue, retention) neutral?</li>
  </ul>
  <p>My answer: &quot;Significant, yes; meaningful, maybe. Show me the CI on absolute lift and the impact on the headline business metric before we commit.&quot;</p>
</InterviewProblem>
<InterviewProblem question="Write a permutation test from scratch to compare two groups' means without assuming normality, and explain what the resulting p-value means." difficulty="medium" tag="Coding">
  <p>A permutation test builds the null distribution empirically: if <M>{"H_0"}</M> (no difference) holds, group labels are exchangeable, so we shuffle them many times and see how often the shuffled difference is as extreme as the observed one.</p>
  <CodeBlock language="python" filename="permutation_test.py">{`import numpy as np

def permutation_test(a, b, n_perm=10_000, seed=0):
    rng = np.random.default_rng(seed)
    a, b = np.asarray(a), np.asarray(b)
    observed = a.mean() - b.mean()

    pooled = np.concatenate([a, b])
    n_a = len(a)
    count = 0
    for _ in range(n_perm):
        rng.shuffle(pooled)
        diff = pooled[:n_a].mean() - pooled[n_a:].mean()
        # two-sided: count shuffles at least as extreme
        if abs(diff) >= abs(observed):
            count += 1

    # +1 in num & denom: never report p = 0 (the observed
    # labeling is itself a valid permutation)
    p_value = (count + 1) / (n_perm + 1)
    return observed, p_value

control = [0.10, 0.12, 0.09, 0.11, 0.13]
treat   = [0.14, 0.15, 0.13, 0.16, 0.12]
obs, p = permutation_test(control, treat)
print(f"observed diff = {obs:.4f}, p = {p:.4f}")`}</CodeBlock>
  <p>The p-value is the fraction of random relabelings whose mean difference is at least as extreme as the observed one. It directly estimates <M>{"P(|T| \\geq |t_{obs}| \\mid H_0)"}</M> with no distributional assumptions &mdash; that&apos;s the appeal versus a t-test on small or skewed samples. Adding 1 to numerator and denominator keeps p strictly positive and gives a valid (slightly conservative) test.</p>
</InterviewProblem>

      </>
  );
}
