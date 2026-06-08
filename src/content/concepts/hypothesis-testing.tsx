"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M } from "@/components/content/math";
import { Quiz } from "@/components/content/quiz";
import { HypothesisTestViz } from "@/components/viz/hypothesis-test";

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
    </>
  );
}
