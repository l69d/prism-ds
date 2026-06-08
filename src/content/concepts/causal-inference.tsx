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
      <p>Causal inference is the discipline of answering &quot;what would happen if I changed this?&quot; from data that only shows what already happened. It is what turns a dashboard into a decision.</p>

      <KeyIdea>A causal effect compares a unit&apos;s outcome under treatment against the same unit&apos;s outcome had it not been treated. That second world never happened — the missing counterfactual is the entire problem.</KeyIdea>

      <h2>The ladder of causation</h2>
      <p>Judea Pearl frames causal questions as three rungs, each strictly more powerful than the last:</p>
      <ul>
        <li><strong>Association</strong> — &quot;What is <M>{"P(Y \\mid X)"}</M>?&quot; Seeing. Pure pattern-matching that any correlation or supervised model can do.</li>
        <li><strong>Intervention</strong> — &quot;What is <M>{"P(Y \\mid do(X))"}</M>?&quot; Doing. The effect of <em>setting</em> a variable, not merely observing it.</li>
        <li><strong>Counterfactuals</strong> — &quot;Would Y have happened had X been different, given what actually occurred?&quot; Imagining. The top rung, needed for attribution and blame.</li>
      </ul>
      <p>A pure prediction model lives on rung one. No amount of data alone climbs higher — you need a <strong>causal model</strong> encoding which variables affect which.</p>

      <h2>DAGs encode your assumptions</h2>
      <p>A directed acyclic graph (DAG) draws an arrow from cause to effect. It makes your beliefs explicit and tells you exactly which variables to adjust for. A <strong>confounder</strong> (a common cause of treatment and outcome) opens a spurious path you must block; a <strong>collider</strong> (a common effect) is a path you must <em>not</em> open by conditioning on it.</p>

      <Basic>
        <p>Imagine you want to know if a new drug helps. The honest test is the same patient living two lives: one where they take the pill, one where they don&apos;t, everything else identical. You only ever see one life. Causal inference is the art of reconstructing the missing life — usually by finding people who are otherwise similar but differed on the treatment, often through a coin flip (randomization) so nothing systematic separates the two groups.</p>
      </Basic>

      <Advanced>
        <p>Using Rubin potential outcomes, each unit has <M>{"Y_i(1)"}</M> and <M>{"Y_i(0)"}</M>; the individual effect is <M>{"\\tau_i = Y_i(1) - Y_i(0)"}</M>. We observe only <M>{"Y_i = T_i Y_i(1) + (1-T_i) Y_i(0)"}</M>. The estimand of interest is the average treatment effect:</p>
        <MB>{"\\text{ATE} = \\mathbb{E}[Y(1) - Y(0)]"}</MB>
        <p>This is identifiable from observational data only under <strong>ignorability</strong>, <M>{"(Y(1), Y(0)) \\perp T \\mid X"}</M>, plus positivity <M>{"0 < P(T=1 \\mid X) < 1"}</M>. Then adjustment recovers it:</p>
        <MB>{"\\text{ATE} = \\mathbb{E}_X\\big[\\mathbb{E}[Y \\mid T=1, X] - \\mathbb{E}[Y \\mid T=0, X]\\big]"}</MB>
        <p>Randomization makes <M>{"T \\perp (Y(1), Y(0))"}</M> by design, so the naive difference in means is unbiased with no <M>{"X"}</M> at all.</p>
      </Advanced>

      <Callout kind="pitfall" title="Do not adjust for a collider">
        Conditioning on a common effect of two variables creates a fake association between them. Controlling for &quot;was hospitalized&quot; when studying two diseases, or for a post-treatment variable, can invert your conclusion. Drawing the DAG first tells you which controls help and which sabotage.
      </Callout>

      <CodeBlock language="python" filename="ate.py">{`import numpy as np

rng = np.random.default_rng(0)
n = 5000

# X is a confounder: it pushes both treatment AND outcome
X = rng.normal(size=n)
p = 1 / (1 + np.exp(-X))            # sicker patients more likely treated
T = rng.binomial(1, p)
# True treatment effect is +2; X adds 3 on top
Y = 2.0 * T + 3.0 * X + rng.normal(size=n)

# Naive difference is biased by the confounder
naive = Y[T == 1].mean() - Y[T == 0].mean()
print(round(naive, 2))             # > 2, inflated

# Adjust for X (here: include it in a linear model)
A = np.column_stack([np.ones(n), T, X])
beta, *_ = np.linalg.lstsq(A, Y, rcond=None)
print(round(beta[1], 2))           # ~2.0 -> true effect recovered`}</CodeBlock>

      <MoreDepth>
        <p>Ignorability is <strong>untestable</strong> from the data: you can never prove there is no hidden confounder. This is why design beats adjustment. When randomization is impossible, quasi-experimental tools exploit external structure — instrumental variables (a nudge that affects treatment but not the outcome directly), difference-in-differences (parallel-trends), and regression discontinuity (a sharp cutoff). Each trades the no-unmeasured-confounding assumption for a different, sometimes more credible one. Sensitivity analysis then asks: how strong would a lurking confounder have to be to overturn the result? A conclusion that survives a large hypothetical confounder is far more trustworthy than a point estimate alone.</p>
      </MoreDepth>

      <Quiz question="You run a regression of recovery on a treatment and find a strong positive coefficient. Sicker patients were more likely to get the treatment. What must you do for the estimate to reflect the causal effect?" options={[
        { text: "Nothing — a large coefficient with a small p-value already proves causation", why: "Statistical significance speaks to noise, not to confounding; the bias is systematic and survives any sample size." },
        { text: "Adjust for the confounders (like baseline severity) that affect both who gets treated and who recovers", correct: true, why: "Blocking the confounding path via the backdoor criterion is exactly what identifies the effect when randomization is absent." },
        { text: "Also condition on a post-treatment variable like a mid-study lab result to be safe", why: "That is often a collider or mediator; conditioning on it opens spurious paths or removes part of the real effect." },
        { text: "Collect far more data so the confounding averages out", why: "Confounding is bias, not variance; more data shrinks the confidence interval around the wrong number." },
      ]} />
    </>
  );
}
