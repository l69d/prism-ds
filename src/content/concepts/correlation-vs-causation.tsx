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
    </>
  );
}
