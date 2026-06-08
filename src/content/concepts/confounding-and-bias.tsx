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
      <p>
        Adding a control variable feels safe &mdash; more adjustment, less bias, right? Not always. Some variables
        you should control for; others you must leave alone, or you will manufacture a correlation that does not exist.
      </p>

      <KeyIdea>
        Whether a variable removes bias or creates it depends on its causal role. Adjust for common causes
        (confounders); never adjust for common effects (colliders). The arrows decide, not the data.
      </KeyIdea>

      <h2>Three structures, three rules</h2>
      <p>
        Every third variable <M>{"Z"}</M> sitting between a treatment <M>{"X"}</M> and an outcome <M>{"Y"}</M>
        plays one of three roles, and each calls for a different action:
      </p>
      <ul>
        <li><strong>Confounder</strong> (<M>{"X \\leftarrow Z \\rightarrow Y"}</M>): a common cause. <strong>Control for it</strong> &mdash; otherwise its influence masquerades as a causal effect of <M>{"X"}</M>.</li>
        <li><strong>Mediator</strong> (<M>{"X \\rightarrow Z \\rightarrow Y"}</M>): on the causal path. Controlling for it blocks part of the very effect you want to measure.</li>
        <li><strong>Collider</strong> (<M>{"X \\rightarrow Z \\leftarrow Y"}</M>): a common effect. <strong>Do not control for it</strong> &mdash; conditioning on it opens a spurious path between <M>{"X"}</M> and <M>{"Y"}</M>.</li>
      </ul>

      <Basic>
        <p>
          Imagine two unrelated things, talent and looks, that both help an actor get famous. Among famous actors,
          the talented ones often are not the best-looking, and the gorgeous ones are often mediocre actors &mdash;
          because either trait alone was enough to get them noticed. By looking only at the famous (conditioning on
          the collider, fame), you invent a negative correlation between talent and looks that does not exist in
          the general population. <strong>Selection bias is just collider bias caused by who ends up in your sample.</strong>
        </p>
      </Basic>

      <Advanced>
        <p>
          Formally, a path is <em>blocked</em> if it contains a non-collider that you conditioned on, or a collider
          that you did <em>not</em> condition on (and none of its descendants). <M>{"X"}</M> and <M>{"Y"}</M> are
          d-separated given a set <M>{"S"}</M> when every path between them is blocked, which implies conditional
          independence:
        </p>
        <MB>{"X \\perp\\!\\!\\!\\perp Y \\mid S \\quad \\text{whenever } X \\text{ and } Y \\text{ are d-separated by } S"}</MB>
        <p>
          The collider rule inverts the usual intuition: an unconditioned collider blocks its path, so conditioning
          on it (or on a descendant) <em>unblocks</em> it. The valid adjustment set for an effect is given by the
          back-door criterion: choose <M>{"S"}</M> that blocks every back-door path <M>{"X \\leftarrow \\cdots \\rightarrow Y"}</M>
          while containing no descendant of <M>{"X"}</M>.
        </p>
      </Advanced>

      <Callout kind="pitfall" title="The garbage-can regression">
        Throwing every available covariate into a model is not conservative &mdash; it is reckless. If even one of
        those covariates is a collider or a mediator, your estimate becomes biased. &quot;Control for everything&quot;
        is not a safe default.
      </Callout>

      <CodeBlock language="python" filename="collider_bias.py">{`import numpy as np

rng = np.random.default_rng(0)
n = 10_000

# Talent and looks are independent in the population.
talent = rng.normal(size=n)
looks = rng.normal(size=n)

# Fame is a COLLIDER: both traits cause it.
fame_score = talent + looks + rng.normal(size=n)
famous = fame_score > 1.5  # selection: keep only the famous

print("population corr:", np.corrcoef(talent, looks)[0, 1])
# ~0.0 : truly independent

print("among famous:", np.corrcoef(talent[famous], looks[famous])[0, 1])
# strongly negative : conditioning on the collider invented it`}</CodeBlock>

      <MoreDepth>
        <p>
          M-bias is the trap that breaks the &quot;just adjust for pre-treatment variables&quot; heuristic. If
          <M>{"Z"}</M> is a pre-treatment collider on a path <M>{"X \\leftarrow U_1 \\rightarrow Z \\leftarrow U_2 \\rightarrow Y"}</M>
          with unobserved <M>{"U_1, U_2"}</M>, then <M>{"Z"}</M> precedes treatment yet adjusting for it opens a
          biasing path. Temporal order alone cannot tell you what to control for &mdash; only the causal graph can.
        </p>
      </MoreDepth>

      <Quiz
        question="A study finds that among hospitalized patients, smoking is negatively associated with COVID severity. Why might this be misleading?"
        options={[
          { text: "Smoking genuinely protects against severe COVID", why: "There is no plausible mechanism; the association is an artifact of the analysis, not a causal effect." },
          { text: "Hospitalization is a collider: both smoking and COVID raise admission odds, so conditioning on it induces a spurious negative link", correct: true, why: "Selecting on a common effect (admission) opens a non-causal path between the two causes, exactly collider bias." },
          { text: "The sample is simply too small to trust", why: "Sample size addresses variance, not the structural bias from conditioning on a collider." },
          { text: "Smoking is a confounder that was not controlled for", why: "A confounder is a common cause of both variables; here the issue is a common effect (a collider), the opposite structure." },
        ]}
      />
    <h2>Interview practice</h2>
<InterviewProblem question="What is the difference between a confounder and a collider, and why must you control for one but not the other?" difficulty="easy" tag="Conceptual">
  <p>Both relate the treatment <M>{"X"}</M> and outcome <M>{"Y"}</M> to a third variable <M>{"Z"}</M>, but the arrows point in opposite ways.</p>
  <ul>
    <li><strong>Confounder:</strong> a common cause, <M>{"X \\leftarrow Z \\rightarrow Y"}</M>. It opens a non-causal &quot;back-door&quot; path that flows into your estimate of the <M>{"X \\to Y"}</M> effect. You <strong>must</strong> adjust for it (condition, stratify, or match) to close that path.</li>
    <li><strong>Collider:</strong> a common effect, <M>{"X \\rightarrow Z \\leftarrow Y"}</M>. The path through <M>{"Z"}</M> is naturally <strong>blocked</strong>. Conditioning on <M>{"Z"}</M> (or a descendant of it) <strong>opens</strong> it, inducing a spurious association between <M>{"X"}</M> and <M>{"Y"}</M> even when none exists.</li>
  </ul>
  <p>So the rule is the reverse of intuition: adjusting for &quot;more variables&quot; is not always safer. Controlling for a confounder removes bias; controlling for a collider creates it. The fix is to draw the causal DAG first and adjust only for the set that blocks all back-door paths without conditioning on colliders or their descendants.</p>
</InterviewProblem>
<InterviewProblem question="A health study finds that among hospitalized patients, smokers have LOWER rates of a certain disease than non-smokers, even though smoking causes the disease in the general population. Explain what is happening." difficulty="medium" tag="Case">
  <p>This is <strong>collider (selection) bias</strong>, the classic Berkson&apos;s paradox. Hospitalization is a common effect of both smoking and the disease: being a smoker raises your chance of being hospitalized (for other reasons), and having the disease also raises it. So the DAG is <M>{"\\text{Smoking} \\rightarrow \\text{Hospitalized} \\leftarrow \\text{Disease}"}</M>.</p>
  <p>By studying only hospitalized patients, you have <strong>conditioned on the collider</strong>. Among the hospitalized, if a non-smoker is in the hospital, they are more likely to be there <em>because of</em> the disease (they lacked the smoking pathway). A smoker could have been admitted for a smoking-related reason instead, so given admission, smokers need the disease &quot;less&quot; to explain their presence. This manufactures a negative within-sample association that reverses the true positive causal effect.</p>
  <p>The lesson: a non-random sampling filter that depends on both the exposure and the outcome will distort, and can even flip, the observed relationship. The remedy is to sample from the general population, or to model and reweight the selection process rather than analyze the filtered cohort as if it were representative.</p>
</InterviewProblem>
<InterviewProblem question="In a linear model Y = a*X + b*Z + noise where Z is a confounder, derive the omitted-variable bias when you regress Y on X alone, and state its sign." difficulty="hard" tag="Math">
  <p>Suppose the true data-generating process is</p>
  <MB>{"Y = \\alpha X + \\beta Z + \\varepsilon, \\qquad \\mathbb{E}[\\varepsilon \\mid X, Z] = 0"}</MB>
  <p>but you fit the short regression of <M>{"Y"}</M> on <M>{"X"}</M> only. The OLS slope you estimate converges to</p>
  <MB>{"\\hat{\\alpha}_{\\text{short}} \;\\xrightarrow{p}\; \\frac{\\operatorname{Cov}(X, Y)}{\\operatorname{Var}(X)}"}</MB>
  <p>Substitute the true model into the covariance:</p>
  <MB>{"\\operatorname{Cov}(X, Y) = \\alpha\\operatorname{Var}(X) + \\beta\\operatorname{Cov}(X, Z) + \\operatorname{Cov}(X,\\varepsilon)"}</MB>
  <p>The last term is zero by exogeneity. Dividing through by <M>{"\\operatorname{Var}(X)"}</M>:</p>
  <MB>{"\\hat{\\alpha}_{\\text{short}} \;\\xrightarrow{p}\; \\alpha + \\beta\\,\\frac{\\operatorname{Cov}(X, Z)}{\\operatorname{Var}(X)} = \\alpha + \\beta\\,\\delta"}</MB>
  <p>where <M>{"\\delta"}</M> is the slope of regressing the omitted <M>{"Z"}</M> on <M>{"X"}</M>. The bias is the product <M>{"\\beta\\,\\delta"}</M>: it depends on <strong>how strongly</strong> <M>{"Z"}</M> affects <M>{"Y"}</M> (<M>{"\\beta"}</M>) and <strong>how correlated</strong> <M>{"Z"}</M> is with <M>{"X"}</M> (<M>{"\\delta"}</M>). The sign of the bias is the sign of <M>{"\\beta\\,\\delta"}</M>: same-sign <M>{"\\beta,\\delta"}</M> inflate the estimate, opposite signs deflate it. If either <M>{"\\beta = 0"}</M> (Z does not affect Y) or <M>{"\\delta = 0"}</M> (Z uncorrelated with X), the bias vanishes, which is exactly why a true confounder must satisfy both arrows.</p>
</InterviewProblem>
<InterviewProblem question="You suspect a feature in your dataset is a collider. Write code to demonstrate how conditioning on it induces a spurious correlation between two independent variables." difficulty="medium" tag="Coding">
  <p>Generate two genuinely independent causes, build a collider as their (noisy) sum, then compare the raw correlation against the correlation within a slice of the collider.</p>
  <CodeBlock language="python" filename="collider_demo.py">{`import numpy as np

rng = np.random.default_rng(0)
n = 100_000

# X and Y are independent by construction
x = rng.normal(size=n)
y = rng.normal(size=n)

# C is a collider: a common effect of both X and Y
c = x + y + rng.normal(scale=0.1, size=n)

# 1) Unconditional correlation: should be ~0
raw = np.corrcoef(x, y)[0, 1]
print(f"corr(X, Y) overall: {raw:.3f}")

# 2) Condition on the collider by slicing to a narrow band of C
mask = np.abs(c) < 0.1          # roughly "C is held fixed"
cond = np.corrcoef(x[mask], y[mask])[0, 1]
print(f"corr(X, Y) | C fixed: {cond:.3f}")
`}</CodeBlock>
  <p>The overall correlation is essentially zero, but inside the slice it is strongly <strong>negative</strong>: once their sum is pinned near a constant, a larger <M>{"X"}</M> forces a smaller <M>{"Y"}</M>. This is the bias mechanism in miniature. The practical takeaway for ML is that adding a downstream feature (one caused by both your target and a predictor) to a model, or filtering rows on such a variable, can fabricate relationships and wreck out-of-sample generalization and any causal interpretation of the coefficients.</p>
</InterviewProblem>

      </>
  );
}
