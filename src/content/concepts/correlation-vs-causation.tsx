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
      <p>Two variables that move together are <strong>correlated</strong>; a change in one that actually produces a change in the other is <strong>causal</strong>. The gap between these two ideas is where most bad data-science conclusions are born.</p>

      <KeyIdea>Correlation is necessary but never sufficient for causation. If X causes Y you will usually see them correlate, but a correlation alone is consistent with reverse causation, a common cause, or pure chance.</KeyIdea>

      <h2>Why a correlation is not enough</h2>
      <p>Suppose you observe that ice-cream sales and drowning deaths rise together. Three rival explanations all fit the same data:</p>
      <ul>
        <li><strong>Direct cause</strong>: ice cream causes drownings (implausible here, but the data can&apos;t rule it out on its own).</li>
        <li><strong>Reverse cause</strong>: drownings somehow drive ice-cream sales.</li>
        <li><strong>Confounder</strong>: hot weather raises both. This third variable is the real driver, and it is the most common trap.</li>
      </ul>
      <p>The correlation coefficient cannot distinguish these stories. Only the <strong>data-generating process</strong> can, and that is something you reason about, not something you read off a scatter plot.</p>

      <Basic>
        <p>Think of correlation as &quot;these two tend to show up together.&quot; That is genuinely useful for prediction: if you only want to <em>guess</em> drownings and you know ice-cream sales, the correlation helps. But the moment you want to <em>act</em> — &quot;ban ice cream to save lives&quot; — you need causation, and that is a totally different question. Prediction asks &quot;what comes with what?&quot; Intervention asks &quot;what happens if I change this?&quot;</p>
      </Basic>

      <Advanced>
        <p>Pearson correlation measures only linear co-movement:</p>
        <MB>{"\\rho_{XY} = \\frac{\\operatorname{Cov}(X,Y)}{\\sigma_X \\, \\sigma_Y}"}</MB>
        <p>It is symmetric, so <M>{"\\rho_{XY} = \\rho_{YX}"}</M> carries no directional information. A confounder <M>{"Z"}</M> that influences both <M>{"X"}</M> and <M>{"Y"}</M> induces a spurious association even when the structural effect of <M>{"X"}</M> on <M>{"Y"}</M> is exactly zero. Causation is properly expressed with the do-operator: <M>{"P(Y \\mid \\operatorname{do}(X))"}</M> is generally not equal to the observational <M>{"P(Y \\mid X)"}</M>. They coincide only when there is no confounding, which is exactly what randomized assignment buys you by cutting every arrow into <M>{"X"}</M>.</p>
      </Advanced>

      <Callout kind="pitfall" title="The confounder trap">
        Before claiming X drives Y, ask: is there a Z that plausibly causes both? Adjusting for the right confounders (stratifying, matching, or regression) can reveal the true relationship — but adjusting for the wrong variable (a collider or mediator) can manufacture a fake one.
      </Callout>

      <CodeBlock language="python" filename="spurious.py">{`import numpy as np

rng = np.random.default_rng(0)
n = 1000

# Z = temperature is the hidden common cause of both
temperature = rng.normal(size=n)
ice_cream   = 2.0 * temperature + rng.normal(size=n)
drownings   = 1.5 * temperature + rng.normal(size=n)
# Note: ice_cream never enters drownings -> zero true effect

# Raw correlation looks strong and "causal"
print(np.corrcoef(ice_cream, drownings)[0, 1])  # ~0.77

# Condition on the confounder: regress out temperature, then correlate residuals
def residual(y, x):
    beta = np.cov(x, y)[0, 1] / np.var(x)
    return y - beta * x

r_ice = residual(ice_cream, temperature)
r_drown = residual(drownings, temperature)
print(np.corrcoef(r_ice, r_drown)[0, 1])  # ~0.0 -> association vanishes`}</CodeBlock>

      <MoreDepth>
        <p>The gold standard for causal claims is the randomized controlled trial, because random assignment severs the link between treatment and any confounder. When you cannot randomize, causal inference offers observational tools — instrumental variables, difference-in-differences, regression discontinuity, and propensity-score matching — but each rests on assumptions (exogeneity, parallel trends, no unmeasured confounding) that are <strong>untestable from the data alone</strong>. The deepest lesson: causal conclusions always require causal assumptions you bring from outside the dataset. No amount of clever statistics conjures causation from correlation by itself.</p>
      </MoreDepth>

      <Quiz question="You find that cities with more firefighters have more fire damage. What is the most likely explanation?" options={[
        { text: "Firefighters cause fire damage, so the city should hire fewer of them", why: "This confuses correlation with causation and ignores the obvious common cause." },
        { text: "A confounder — the size of the fire — drives both the number of firefighters dispatched and the damage", correct: true, why: "Bigger fires summon more firefighters and cause more damage; the confounder explains the link with no direct causal arrow between the two." },
        { text: "The correlation is too weak to mean anything", why: "The relationship can be strong and still non-causal; strength does not establish direction or mechanism." },
        { text: "Fire damage causes more firefighters to exist", why: "Reverse causation per incident is implausible at the city level and still misses the shared driver, the fire&apos;s severity." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="Explain why correlation is necessary but not sufficient for causation, and name the three ways a correlation can arise without X causing Y." difficulty="easy" tag="Conceptual">
  <p>If X truly causes Y, then (under most data-generating processes) X and Y will move together, so an observed association is <strong>necessary</strong> evidence consistent with causation. But an association is <strong>not sufficient</strong>: many non-causal mechanisms produce the same statistical signature.</p>
  <p>A correlation between X and Y can arise without X causing Y through:</p>
  <ul>
    <li><strong>Reverse causation</strong> &mdash; Y actually causes X (e.g. more police correlates with more crime because crime drives police deployment).</li>
    <li><strong>Confounding</strong> &mdash; a common cause Z drives both X and Y (ice-cream sales and drownings both rise with summer heat Z).</li>
    <li><strong>Selection / collider bias or coincidence</strong> &mdash; conditioning on a common effect induces a spurious link, or the correlation is pure chance from many comparisons.</li>
  </ul>
  <p>The practical upshot: an observed <M>{"\\rho \\neq 0"}</M> rules nothing in; you need a design (randomization, instrument, natural experiment) that breaks the alternative explanations.</p>
</InterviewProblem>
<InterviewProblem question="A PM sees that users who use the in-app chat feature have 30% higher retention and wants to push everyone into chat. How would you tell whether chat causes retention?" difficulty="medium" tag="Applied">
  <p>The headline number is a classic <strong>self-selection</strong> trap: engaged users both adopt chat and retain better, so the common cause &quot;engagement&quot; can produce the gap with zero causal effect of chat. Steps to disentangle it:</p>
  <ul>
    <li><strong>Gold standard &mdash; randomize.</strong> Run an A/B test that nudges a random subset toward chat (or gates the feature). The treatment-vs-control retention difference is then an unbiased causal estimate because assignment is independent of engagement.</li>
    <li><strong>If a clean experiment is impossible</strong>, approximate it observationally: adjust for pre-treatment confounders (prior session count, tenure, plan tier) via regression, matching, or propensity-score weighting &mdash; comparing chat vs non-chat users <strong>with similar baseline engagement</strong>.</li>
    <li><strong>Look for a natural experiment / instrument</strong> &mdash; e.g. a staggered rollout where some users got chat earlier for reasons unrelated to their engagement (difference-in-differences).</li>
    <li><strong>Sanity checks</strong>: only condition on <strong>pre-treatment</strong> variables (controlling for a post-chat outcome is a collider that biases you), and check whether the effect is implausibly large versus a known benchmark.</li>
  </ul>
  <p>Recommendation to the PM: do not force-migrate on the 30% figure; ship a randomized rollout and read the lift.</p>
</InterviewProblem>
<InterviewProblem question="Construct a numeric example where X and Y are positively correlated overall but the correlation flips sign within every subgroup. What is this called and what causes it?" difficulty="hard" tag="Math">
  <p>This is <strong>Simpson&apos;s paradox</strong>, driven by a confounder Z that is correlated with both the group assignment and the outcome.</p>
  <p>Suppose Z is a department. Within each department, more applications (X) lead to a <strong>lower</strong> acceptance rate (Y) &mdash; a negative within-group slope. But hard-to-enter departments attract both <strong>more</strong> applicants and have <strong>lower</strong> rates, so pooling across departments creates a spurious positive link between volume and... let me make it concrete with admission rates:</p>
  <MB>{"\\text{Dept A: } 80/100 = 0.80, \\quad \\text{Dept B (men): } 30/100 = 0.30"}</MB>
  <MB>{"\\text{Dept A (women): } 70/90 \\approx 0.78, \\quad \\text{Dept B (women): } 20/110 \\approx 0.18"}</MB>
  <p>Per department men are admitted at a higher rate than women (0.80 vs 0.78 in A; 0.30 vs 0.18 in B). But pool the totals:</p>
  <MB>{"\\text{men: } \\frac{80+30}{100+100} = 0.55, \\quad \\text{women: } \\frac{70+20}{90+110} = 0.45"}</MB>
  <p>Here the pooled gap (0.55 vs 0.45) happens to agree, but small reweighting of group sizes can flip it: if women disproportionately apply to the low-admit department, the <strong>aggregate</strong> can show women favored even though every department favors them, or vice versa. The lesson: a weighted average over a confounder Z is not the within-Z effect. The correct causal quantity is the <strong>conditional</strong> (within-Z) comparison, or a covariate-adjusted estimate &mdash; never the raw pooled correlation.</p>
</InterviewProblem>
<InterviewProblem question="Write code to demonstrate a spurious correlation created entirely by a confounder, and show that controlling for the confounder makes it vanish." difficulty="medium" tag="Coding">
  <p>We simulate a pure-confounding DAG: <M>{"Z \\to X"}</M> and <M>{"Z \\to Y"}</M>, with <strong>no edge</strong> from X to Y. The marginal correlation between X and Y will be large and positive; the partial correlation given Z will be ~0.</p>
  <CodeBlock language="python" filename="confounding_demo.py">{`import numpy as np
from numpy.polynomial import polynomial as P

rng = np.random.default_rng(0)
n = 10_000

# Confounder Z drives both X and Y. There is NO causal X -> Y edge.
Z = rng.normal(size=n)
X = 2.0 * Z + rng.normal(size=n)        # X depends only on Z (+ noise)
Y = 3.0 * Z + rng.normal(size=n)        # Y depends only on Z (+ noise)

def corr(a, b):
    return np.corrcoef(a, b)[0, 1]

print("raw corr(X, Y):", round(corr(X, Y), 3))   # ~0.86, looks causal

# Partial correlation: regress Z out of both, correlate the residuals.
def residualize(target, control):
    beta = np.polyfit(control, target, 1)        # slope, intercept
    return target - np.polyval(beta, control)

rx = residualize(X, Z)
ry = residualize(Y, Z)
print("partial corr(X, Y | Z):", round(corr(rx, ry), 3))  # ~0.0
`}</CodeBlock>
  <p>The raw correlation is ~0.86 &mdash; strong enough to fool a dashboard &mdash; yet once Z is regressed out of both variables the residual (partial) correlation collapses to ~0, exposing that X never influenced Y. This is the computational form of &quot;adjust for the confounder.&quot; The catch in real data: you can only residualize the confounders you measured, which is why randomization (it balances <strong>unmeasured</strong> confounders too) remains the gold standard.</p>
</InterviewProblem>

      </>
  );
}
