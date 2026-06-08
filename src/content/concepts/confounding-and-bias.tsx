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
    </>
  );
}
