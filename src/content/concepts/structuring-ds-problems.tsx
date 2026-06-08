"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { Quiz } from "@/components/content/quiz";

export default function Lesson() {
  return (
    <>
      <p>The hardest part of most data-science work is not the model &mdash; it is turning a fuzzy request like &quot;reduce churn&quot; into something you can actually measure, scope, and ship.</p>

      <KeyIdea>A well-structured problem names the decision being made, the unit of analysis, the target you predict, and the metric you optimize &mdash; before any data is touched.</KeyIdea>

      <h2>From vague ask to scoped project</h2>
      <p>Stakeholders speak in outcomes (&quot;keep customers happy&quot;); models need a precise statement. Bridge the gap by pinning down five things:</p>
      <ul>
        <li><strong>Decision</strong>: what action changes based on the output? (e.g. who gets a retention offer.)</li>
        <li><strong>Unit</strong>: one row = one what? (a user-month, a transaction, a session.)</li>
        <li><strong>Target</strong>: the exact label, with its time window. (&quot;churned within 30 days of period end.&quot;)</li>
        <li><strong>Metric</strong>: how success is judged, tied to the decision, not just accuracy.</li>
        <li><strong>Baseline &amp; constraints</strong>: what beating &quot;do nothing&quot; means, plus latency, cost, and fairness limits.</li>
      </ul>

      <Basic>
        <p>Think of it like writing a recipe before cooking. &quot;Make it tasty&quot; is useless to a kitchen; &quot;a 12-inch margherita, 7 minutes at 250&deg;C, judged by 8 testers&quot; is a plan anyone can execute and check. In DS, the recipe is: the prediction, the row it&apos;s made on, when it&apos;s evaluated, and the number that says whether you won.</p>
      </Basic>

      <Advanced>
        <p>Formalize the ask as a decision problem. You choose an action <M>{"a"}</M> from a set <M>{"\\mathcal{A}"}</M> given features <M>{"x"}</M> to minimize expected loss against the true state <M>{"y"}</M>:</p>
        <MB>{"a^\\star(x) = \\arg\\min_{a \\in \\mathcal{A}} \; \\mathbb{E}_{y \\sim p(y \\mid x)}\\big[ L(y, a) \\big]"}</MB>
        <p>The chosen <M>{"L"}</M> encodes the business asymmetry: if missing a churner costs ten times a wasted offer, that 10:1 ratio belongs in <M>{"L"}</M>, not in an after-the-fact threshold tweak. Defining <M>{"L"}</M>, <M>{"\\mathcal{A}"}</M>, and the unit of <M>{"x"}</M> up front is what makes the project measurable.</p>
      </Advanced>

      <Callout kind="pitfall" title="Leakage hides in the target window">
        If your target is &quot;churn in the next 30 days&quot; but a feature includes the cancellation-survey response, you have leaked the future into the present. Always anchor features to a cutoff time strictly before the label window.
      </Callout>

      <Callout kind="insight" title="Pick the metric the decision feels">
        Accuracy can be 95% while your model is useless on a 5%-positive problem. Choose a metric &mdash; precision@k, recall at a fixed alert budget, expected profit &mdash; that moves when the real decision improves.
      </Callout>

      <MoreDepth>
        <p>Senior practitioners often reframe the problem entirely rather than answer the literal ask. &quot;Predict churn&quot; is rarely the goal; the goal is &quot;allocate a limited retention budget for maximum saved revenue.&quot; That reframing turns a classification task into a constrained uplift problem &mdash; you want customers whose behavior <em>changes</em> with the offer, not those most likely to churn regardless. Structuring this correctly up front can matter more than any modeling choice downstream.</p>
      </MoreDepth>

      <Quiz question="A PM asks you to 'predict which users will churn so we can send retention offers.' Which reframing best structures this as a measurable project?" options={[
        { text: "Maximize classification accuracy on a churn label.", why: "Accuracy ignores the 10:1 class imbalance and the cost asymmetry of the actual decision." },
        { text: "Rank users by the uplift in retention from an offer, subject to a fixed budget, evaluated on saved revenue.", correct: true, why: "It ties the target (uplift), the constraint (budget), and the metric (saved revenue) directly to the decision being made." },
        { text: "Build the most complex model possible to capture churn patterns.", why: "Model complexity is a means, not a problem definition; it sets no measurable success criterion." },
        { text: "Predict the exact churn date for every user.", why: "Over-specifies the target beyond what the offer decision needs and is far harder to label reliably." },
      ]} />
    </>
  );
}
