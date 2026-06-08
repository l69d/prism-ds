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
    <h2>Interview practice</h2>
<InterviewProblem question="A stakeholder asks for your churn model results. Walk me through how you would present them so the head of marketing can act on it." difficulty="easy" tag="Conceptual">
  <p>Lead with the <strong>decision</strong>, not the model. The head of marketing does not care about AUC; they care about which customers to target and what budget it justifies.</p>
  <ul>
    <li><strong>Open with the bottom line:</strong> &quot;We can identify the 10% of accounts most likely to churn, which contain roughly 60% of next quarter&apos;s expected churn revenue.&quot; Tie the number to dollars or customers, not to a metric.</li>
    <li><strong>Translate the metric into their unit:</strong> instead of &quot;precision at the top decile is 0.4,&quot; say &quot;of the 1,000 accounts we flag, about 400 would actually have churned, so a retention offer is worth sending if it costs less than the revenue saved.&quot;</li>
    <li><strong>Make the action explicit:</strong> who gets contacted, how the list is delivered, how often it refreshes.</li>
    <li><strong>State uncertainty honestly but bounded:</strong> give a range and the main caveat (e.g. &quot;this assumes the offer itself does not change behavior&mdash;we should A/B test it&quot;).</li>
  </ul>
  <p>Keep model internals (features, algorithm, calibration) in an appendix for the analytics partners, not in the headline slide.</p>
</InterviewProblem>
<InterviewProblem question="Your model improves AUC from 0.78 to 0.82. The product manager shrugs. How do you make the improvement land?" difficulty="medium" tag="Applied">
  <p>An AUC delta is meaningless to most stakeholders because it is not denominated in anything they own. The fix is to convert the model&apos;s ranking quality into the operating point they actually use and then into business impact.</p>
  <ul>
    <li><strong>Pin down the operating point.</strong> Find the threshold or budget the team operates at&mdash;say they can review 500 cases per day. AUC summarizes the whole ROC curve, but the PM only lives at one point on it.</li>
    <li><strong>Compute the change at that point.</strong> If at a fixed 500-case review budget recall rose from 62% to 71%, that is +9 percentage points of caught cases&mdash;far more vivid than +0.04 AUC.</li>
    <li><strong>Monetize it.</strong> Multiply caught cases by value per case minus review cost. &quot;We catch 90 more fraudulent transactions a day at the same staffing, worth about \$X per month.&quot;</li>
  </ul>
  <p>A useful rule: the value of a model improvement = expected value at the new operating point minus expected value at the old one, holding the action budget fixed.</p>
  <MB>{"\\Delta V = N\\big[\\,p(\\text{TP})\\,v_{\\text{TP}} - p(\\text{FP})\\,c_{\\text{FP}}\\,\\big]_{\\text{new}} - [\\,\\cdots\\,]_{\\text{old}}"}</MB>
  <p>Show that number, not the AUC.</p>
</InterviewProblem>
<InterviewProblem question="An executive wants a single chart that justifies deploying your model. What do you show, and why not a confusion matrix or ROC curve?" difficulty="medium" tag="Case">
  <p>For an executive audience the best single visual is usually a <strong>cumulative gains (lift) chart</strong> or a <strong>decision/cost curve</strong>, because both read directly as &quot;effort in vs. value out.&quot;</p>
  <ul>
    <li><strong>Cumulative gains:</strong> x-axis is the fraction of the population you act on (the cost/effort), y-axis is the fraction of positives captured (the payoff). The 45-degree line is random targeting; the gap above it is the model&apos;s edge. Anyone can read &quot;contact the top 20% and capture 70% of churners.&quot;</li>
    <li><strong>Why not ROC:</strong> ROC plots TPR vs FPR, which are conditional rates that executives rarely think in. It also hides class prevalence, so it can look great on a problem where acting is still not worth it.</li>
    <li><strong>Why not a raw confusion matrix:</strong> it is four absolute counts with no notion of cost asymmetry or operating budget; the viewer has to do the economics in their head.</li>
  </ul>
  <p>Annotate the chosen operating point directly on the chart and label both axes in business units. One labeled point with a dollar figure beats a technically richer plot the audience cannot decode.</p>
</InterviewProblem>
<InterviewProblem question="Write code that turns model scores into the kind of business-facing summary you would put in front of a stakeholder: a lift table by score decile." difficulty="hard" tag="Coding">
  <p>A lift-by-decile table is one of the most persuasive artifacts you can hand a non-technical stakeholder: it shows that acting on the top scores captures disproportionately many of the events, in their own counts.</p>
  <CodeBlock language="python" filename="lift_table.py">{`import numpy as np
import pandas as pd

def lift_table(y_true, scores, value_per_event=100.0, n_bins=10):
    """Rank customers by predicted score, bucket into deciles,
    and report capture and dollar value per bucket."""
    df = pd.DataFrame({"y": np.asarray(y_true), "score": np.asarray(scores)})
    # Highest scores -> decile 1 (the group you act on first)
    df = df.sort_values("score", ascending=False).reset_index(drop=True)
    df["decile"] = pd.qcut(df["score"].rank(method="first", ascending=False),
                           q=n_bins, labels=range(1, n_bins + 1))

    base_rate = df["y"].mean()
    g = df.groupby("decile", observed=True)
    out = g.agg(customers=("y", "size"),
                events=("y", "sum"),
                rate=("y", "mean")).reset_index()

    # Business-facing columns
    out["lift_vs_random"] = out["rate"] / base_rate
    out["pct_of_events"] = out["events"] / out["events"].sum()
    out["cum_pct_events"] = out["pct_of_events"].cumsum()
    out["value_captured"] = out["events"] * value_per_event
    return out

if __name__ == "__main__":
    rng = np.random.default_rng(0)
    n = 5000
    score = rng.random(n)
    # Higher score -> higher true event probability
    y = (rng.random(n) < score * 0.3).astype(int)
    table = lift_table(y, score, value_per_event=250.0)
    print(table.to_string(index=False,
          formatters={"rate": "{:.1%}".format,
                      "lift_vs_random": "{:.2f}x".format,
                      "cum_pct_events": "{:.0%}".format}))
`}</CodeBlock>
  <p>The story you tell off this table: &quot;The top decile converts at <M>{"L\\times"}</M> the base rate; act on the top three deciles and we capture the bulk of the value at a fraction of the contact cost.&quot; Notice every column a stakeholder reads&mdash;customers, events, dollars captured&mdash;is an absolute, actionable quantity, and the only ratio (<strong>lift</strong>) is framed against the intuitive baseline of random targeting.</p>
</InterviewProblem>

      </>
  );
}
