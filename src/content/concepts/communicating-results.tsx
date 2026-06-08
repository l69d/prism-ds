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
      <p>A model that nobody acts on creates zero value. The final mile of data science is not the ROC curve&nbsp;&mdash; it is translating a result into a decision a stakeholder will actually make.</p>

      <KeyIdea>Stakeholders do not buy accuracy; they buy decisions. Lead with the recommendation and the expected impact, then let the evidence support it&nbsp;&mdash; not the other way around.</KeyIdea>

      <h2>Start from the decision, not the model</h2>
      <p>Before building a single slide, ask: <strong>what will be different on Monday because of this analysis?</strong> Every result you present should map to an action, an owner, and an expected outcome. If a chart does not change what someone does, cut it.</p>
      <ul>
        <li><strong>Lead with the answer.</strong> Open with the recommendation, not the methodology. The pyramid principle: conclusion first, supporting detail on demand.</li>
        <li><strong>Quantify the stakes.</strong> &quot;The churn model flags 8% of users; intervening saves an estimated &#36;120k/quarter&quot; beats &quot;AUC of 0.84.&quot;</li>
        <li><strong>Translate metrics into business units.</strong> Convert log-loss and recall into dollars, hours, or risk that an executive already cares about.</li>
        <li><strong>Name the uncertainty honestly.</strong> A confidence interval is a trust signal, not a weakness.</li>
      </ul>

      <Basic>
        <p>Imagine you tested two ad designs. A stakeholder does not want to hear about p-values&nbsp;&mdash; they want to hear &quot;Design B got 12% more clicks, so let&apos;s switch to it; here&apos;s how sure we are.&quot; Your job is to be the translator between the math and the meeting. Tell the story in their language: what you found, why it matters in money or time, and what you recommend doing about it.</p>
      </Basic>

      <Advanced>
        <p>Frame results as expected value under a decision, not as point estimates. If action <M>{"a"}</M> yields utility <M>{"U(a, \\theta)"}</M> for unknown state <M>{"\\theta"}</M>, the rational recommendation maximizes expected utility over your posterior:</p>
        <MB>{"a^{*} = \\arg\\max_{a} \; \\mathbb{E}_{\\theta \\sim p(\\theta \\mid D)}\\big[\\, U(a, \\theta) \\,\\big]"}</MB>
        <p>This reframes &quot;is the lift significant?&quot; into &quot;does the expected gain exceed the cost of acting?&quot; A small but near-certain lift can dominate a large but noisy one once you weight by the loss of a wrong call. Reporting the full predictive distribution&nbsp;&mdash; or at least an interval&nbsp;&mdash; lets stakeholders apply their own utility, which is exactly what good communication enables.</p>
      </Advanced>

      <Callout kind="pitfall" title="The curse of knowledge">
        You spent weeks in the data, so jargon feels obvious. It is not. &quot;We regularized to control variance&quot; means nothing to a VP of Sales. Re-explain every model term in plain consequences, and never present a metric the audience cannot map to a decision.
      </Callout>

      <CodeBlock language="python" filename="impact.py">{`# Don't report the metric. Report the decision and its value.
import numpy as np

precision = 0.62          # of flagged users, fraction who truly churn
recall = 0.55             # of churners, fraction we catch
flagged = 8000            # users the model flags this quarter
true_churners = flagged * precision
intervention_cost = 5     # $ per outreach
save_rate = 0.30          # fraction of contacted churners retained
ltv = 240                 # $ lifetime value per retained user

retained = true_churners * save_rate
net_value = retained * ltv - flagged * intervention_cost

print(f"Catch {recall:.0%} of churners; intervene on {flagged:,} users.")
print(f"Estimated quarterly net value: \${net_value:,.0f}")
# -> "Estimated quarterly net value: $317,440" — a number a VP can act on.`}</CodeBlock>

      <MoreDepth>
        <p>Tailor the artifact to the audience&apos;s decision latency. An executive needs one slide and a recommendation; a fellow data scientist needs the validation strategy and failure modes; an ops team needs a runbook. The same result becomes three deliverables. Senior practitioners also pre-empt the &quot;so what would change your mind?&quot; question by stating the conditions under which the recommendation flips&nbsp;&mdash; this builds far more trust than a polished result that hides its own fragility.</p>
      </MoreDepth>

      <Quiz question="A VP asks whether to roll out your new pricing model. Which response best communicates the result?" options={[
        { text: "Our gradient-boosted model achieved a cross-validated R-squared of 0.79 with low residual autocorrelation.", why: "Technically true but untranslated; it names no decision, action, or business impact the VP can use." },
        { text: "Roll it out to the EU segment: we project +4% margin (range +1% to +6%), and the downside is bounded because we cap discounts.", why: "Correct: it leads with a recommendation, quantifies impact in business terms, states uncertainty, and bounds the risk." },
        { text: "The model is statistically significant at p < 0.01, so the effect is real and you should deploy everywhere.", why: "Significance is not impact, and 'deploy everywhere' ignores segment risk and the cost of a wrong call." },
        { text: "Here are 20 charts of feature importances; let me know if anything stands out to you.", why: "This offloads the decision onto the stakeholder and buries the recommendation under undigested detail." },
      ]} />
    </>
  );
}
