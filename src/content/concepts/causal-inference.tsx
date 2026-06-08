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
    <h2>Interview practice</h2>
<InterviewProblem question="Explain the difference between correlation and causation using the language of potential outcomes. What is the fundamental problem of causal inference?" difficulty="easy" tag="Conceptual">
  <p>For a binary treatment <M>{"T"}</M>, each unit has two <strong>potential outcomes</strong>: <M>{"Y(1)"}</M> if treated and <M>{"Y(0)"}</M> if not. The individual causal effect is <M>{"Y(1) - Y(0)"}</M>.</p>
  <p>The <strong>fundamental problem of causal inference</strong> is that we only ever observe one of the two for each unit: <M>{"Y = T\\,Y(1) + (1-T)\\,Y(0)"}</M>. The counterfactual is missing, so the individual effect is never directly observable.</p>
  <p>A correlation tells us <M>{"E[Y \\mid T=1] - E[Y \\mid T=0]"}</M>, an <strong>observational</strong> contrast. A causal effect is <M>{"E[Y(1)] - E[Y(0)]"}</M>. These coincide only when treatment assignment is independent of the potential outcomes, i.e. <M>{"\\{Y(0), Y(1)\\} \\perp T"}</M>, which randomization guarantees but observational data does not. The gap between them is <strong>confounding</strong> (and selection) bias.</p>
</InterviewProblem>
<InterviewProblem question="What is Pearl's ladder of causation, and why can a model trained only on observational data not answer interventional questions without extra assumptions?" difficulty="medium" tag="Conceptual">
  <p>Pearl describes three rungs of increasing causal power:</p>
  <ul>
    <li><strong>Association</strong> (&quot;seeing&quot;): <M>{"P(Y \\mid X)"}</M>. Pure prediction. This is all standard supervised ML reaches.</li>
    <li><strong>Intervention</strong> (&quot;doing&quot;): <M>{"P(Y \\mid do(X))"}</M> &mdash; the distribution of <M>{"Y"}</M> if we forcibly set <M>{"X"}</M>, severing the arrows into <M>{"X"}</M>.</li>
    <li><strong>Counterfactuals</strong> (&quot;imagining&quot;): <M>{"P(Y_x \\mid X=x', Y=y')"}</M> &mdash; what <M>{"Y"}</M> would have been for a specific unit had <M>{"X"}</M> differed, given what actually happened.</li>
  </ul>
  <p>The key point: <M>{"P(Y \\mid X)"}</M> and <M>{"P(Y \\mid do(X))"}</M> are generally <strong>not equal</strong>. Conditioning passively lets information flow through confounders; intervening cuts those paths. A confounder <M>{"Z"}</M> with <M>{"Z \\to X"}</M> and <M>{"Z \\to Y"}</M> creates a backdoor that inflates the observed association.</p>
  <p>Observational data only identifies rung 1. To climb to rung 2 you need a <strong>causal model</strong> (a DAG plus assumptions like ignorability / no unmeasured confounding) so the <M>{"do"}</M>-operator can be rewritten in terms of observed conditional distributions &mdash; e.g. the backdoor adjustment formula. Without such structural assumptions, the data alone are silent about interventions.</p>
</InterviewProblem>
<InterviewProblem question="You have a DAG with treatment T, outcome Y, an observed confounder Z (Z to T and Z to Y), and a collider C (T to C and Y to C). Which variables do you adjust for to estimate the causal effect of T on Y, and what happens if you naively control for everything?" difficulty="hard" tag="Applied">
  <p>Use the <strong>backdoor criterion</strong>. A valid adjustment set <M>{"S"}</M> must block every backdoor path (paths into <M>{"T"}</M>) and contain no descendants of <M>{"T"}</M>.</p>
  <ul>
    <li>The backdoor path <M>{"T \\leftarrow Z \\to Y"}</M> is open and must be blocked, so we <strong>condition on <M>{"Z"}</M></strong>.</li>
    <li>The collider <M>{"C"}</M> is a descendant of <M>{"T"}</M> and sits on the path <M>{"T \\to C \\leftarrow Y"}</M>. This path is <strong>already blocked</strong> because a collider blocks a path when left alone. <strong>Conditioning on <M>{"C"}</M> would open it</strong>, inducing a spurious <M>{"T"}</M>&ndash;<M>{"Y"}</M> association (collider / selection bias). So we must <strong>not</strong> adjust for <M>{"C"}</M>.</li>
  </ul>
  <p>Hence the valid set is <M>{"S = \\{Z\\}"}</M>. &quot;Control for everything&quot; is wrong: throwing the collider into a regression opens a non-causal path and biases the estimate. The identified effect is the backdoor adjustment:</p>
  <MB>{"P(Y \\mid do(T=t)) = \\sum_{z} P(Y \\mid T=t, Z=z)\\,P(Z=z)"}</MB>
  <p>Equivalently, the average treatment effect is the confounder-weighted difference in conditional means.</p>
</InterviewProblem>
<InterviewProblem question="In a randomized A/B test, write code to estimate the average treatment effect and explain why randomization lets you skip confounder adjustment. Then sketch how the estimate would change under a regression-adjustment (CUPED-style) improvement." difficulty="medium" tag="Coding">
  <p>Randomization makes <M>{"T \\perp \\{Y(0), Y(1)\\}"}</M> by design, so there are no open backdoor paths and the simple difference in means is unbiased for the ATE:</p>
  <MB>{"\\widehat{\\text{ATE}} = \\bar{Y}_{T=1} - \\bar{Y}_{T=0}"}</MB>
  <CodeBlock language="python" filename="ate_ab_test.py">{`import numpy as np
from scipy import stats

def estimate_ate(y, t):
    """Difference-in-means ATE for a randomized experiment.
    y: outcomes, t: binary treatment indicator."""
    y1, y0 = y[t == 1], y[t == 0]
    ate = y1.mean() - y0.mean()
    # Welch standard error (unequal variances)
    se = np.sqrt(y1.var(ddof=1) / len(y1) + y0.var(ddof=1) / len(y0))
    z = ate / se
    p = 2 * (1 - stats.norm.cdf(abs(z)))
    return ate, se, p

# Regression adjustment with a pre-experiment covariate x (CUPED idea):
# regress y on t and a centered covariate to soak up outcome variance.
def estimate_ate_adjusted(y, t, x):
    x_c = x - x.mean()                 # center so the t coef stays the ATE
    X = np.column_stack([np.ones_like(t), t, x_c])
    beta, *_ = np.linalg.lstsq(X, y, rcond=None)
    return beta[1]                     # coefficient on t is the adjusted ATE
`}</CodeBlock>
  <p>The covariate <M>{"x"}</M> (a pre-experiment metric) is not a confounder here &mdash; because of randomization it is balanced across arms, so adjusting for it does not change the <strong>expected</strong> estimate. What it does is reduce residual variance, shrinking the standard error and tightening the confidence interval. This is why variance-reduction techniques like CUPED accelerate experiments without introducing bias.</p>
</InterviewProblem>

      </>
  );
}
