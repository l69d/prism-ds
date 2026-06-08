"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { Quiz } from "@/components/content/quiz";
import { InterviewProblem } from "@/components/content/interview-problem";
import { CodeBlock } from "@/components/content/code-block";

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
    <h2>Interview practice</h2>
<InterviewProblem question="A product manager says 'users seem unhappy with search — can you look into it with data?' Walk me through how you'd turn that into a scoped, measurable project." difficulty="easy" tag="Case">
  <p>The ask is vague on three axes: <strong>who</strong>, <strong>what outcome</strong>, and <strong>what success looks like</strong>. I&apos;d structure it before touching data.</p>
  <ul>
    <li><strong>Clarify the business goal.</strong> &quot;Unhappy&quot; is a proxy. Is the real concern retention, revenue, or support load? Pin the one north-star metric the team owns.</li>
    <li><strong>Translate to a measurable target.</strong> Turn &quot;unhappy with search&quot; into something observable: zero-result rate, search-to-click rate, reformulation rate, or search-session abandonment. Pick the metric that most directly moves the business goal.</li>
    <li><strong>Scope the population and window.</strong> Which surface (web vs app), which users (new vs returning), what time range? A scoped slice beats a boil-the-ocean analysis.</li>
    <li><strong>Decide diagnosis vs prediction.</strong> Here the ask is diagnostic (&quot;look into it&quot;), so the deliverable is a ranked list of drivers, not a model. State that explicitly so nobody expects a deployed classifier.</li>
    <li><strong>Define done.</strong> &quot;A one-page readout naming the top 2-3 failure modes by volume, each with an estimated impact on the north-star metric and a candidate fix.&quot;</li>
  </ul>
  <p>The pattern: <strong>business goal &rarr; observable metric &rarr; scoped population &rarr; problem type &rarr; concrete deliverable</strong>. Naming the deliverable up front is what prevents scope creep.</p>
</InterviewProblem>
<InterviewProblem question="Why is choosing the wrong success metric one of the most expensive mistakes in framing a DS problem, and how do you guard against it?" difficulty="medium" tag="Conceptual">
  <p>Because everything downstream optimizes the metric you wrote down, not the outcome you wanted. If the metric is misaligned, a &quot;successful&quot; model can actively hurt the business — this is <strong>Goodhart&apos;s law</strong>: when a measure becomes a target, it stops being a good measure.</p>
  <ul>
    <li><strong>Proxy gaps.</strong> Optimizing click-through-rate on recommendations can promote clickbait that tanks long-term retention. The proxy (clicks) diverged from the goal (satisfied, returning users).</li>
    <li><strong>Threshold blindness.</strong> Optimizing raw accuracy on a fraud problem that is 99% legitimate rewards a model that never flags fraud.</li>
    <li><strong>Single-metric tunnel vision.</strong> A latency win that quietly drops recall may pass the headline metric while breaking the product.</li>
  </ul>
  <p>Guards I use:</p>
  <ul>
    <li>Separate the <strong>true goal metric</strong> (often slow/lagging, e.g. 30-day retention) from <strong>proxy metrics</strong> the model can train on, and verify the proxy actually correlates with the goal.</li>
    <li>Pair the optimization metric with <strong>guardrail metrics</strong> that must not regress (e.g. optimize recall subject to precision &ge; 0.8).</li>
    <li>Tie the metric to a <strong>decision and its costs</strong>. If a false negative costs 10x a false positive, encode that in the objective rather than reporting a symmetric score.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="Leadership wants to 'use ML to reduce customer churn.' How do you decide what to actually build, and how would you frame the loss to reflect that a retention offer is cheap but losing a customer is expensive?" difficulty="hard" tag="Applied">
  <p>First I&apos;d reframe: the goal is not &quot;predict churn,&quot; it&apos;s <strong>maximize retained value net of intervention cost</strong>. Prediction is only useful if there&apos;s an action — a retention offer — that we can target. So the real project is &quot;rank customers by expected value of intervening.&quot;</p>
  <ul>
    <li><strong>Define the label and horizon precisely.</strong> Churn within what window (e.g. no purchase in 60 days)? Ambiguous labels make the whole project unmeasurable.</li>
    <li><strong>Identify the decision.</strong> For each at-risk customer, send an offer or not. That decision, not the probability, is the deliverable.</li>
    <li><strong>Encode the asymmetry in the objective.</strong> Let <M>{"p"}</M> be predicted churn probability, <M>{"V"}</M> the customer&apos;s lifetime value saved if retained, <M>{"c"}</M> the offer cost, and <M>{"\\varepsilon"}</M> the uplift (how much the offer reduces churn). Expected value of intervening:</li>
  </ul>
  <MB>{"\\mathbb{E}[\\text{intervene}] = p \\cdot \\varepsilon \\cdot V - c"}</MB>
  <p>We act when this is positive, i.e. when <M>{"p \\cdot \\varepsilon \\cdot V > c"}</M>. This pushes the project from a churn classifier toward an <strong>uplift / value-ranking</strong> framing: a confidently-churning customer who would leave anyway has low <M>{"\\varepsilon"}</M> and isn&apos;t worth an offer.</p>
  <p>For training a probability model, the cost-sensitive analogue is a <strong>weighted log-loss</strong> where the weight reflects the dollar stakes of each error:</p>
  <MB>{"\\mathcal{L} = -\\frac{1}{n}\\sum_{i} \\Big[ w_1\\, y_i \\log \\hat{p}_i + w_0\\,(1 - y_i)\\log(1 - \\hat{p}_i) \\Big]"}</MB>
  <p>with <M>{"w_1 \\gg w_0"}</M> because missing a true churner (false negative) forfeits <M>{"V"}</M>, while a false positive only wastes <M>{"c"}</M>. Setting <M>{"w_1/w_0 \\approx V/c"}</M> makes the loss reflect the actual decision economics rather than treating both errors as equal.</p>
  <p><strong>Define done:</strong> a ranked target list plus an A/B holdout to measure realized retained value minus offer spend — not just AUC, which would let us optimize a metric disconnected from the dollars.</p>
</InterviewProblem>
<InterviewProblem question="Write a small framework function that, given an estimated cost matrix, returns the probability threshold at which intervening becomes worthwhile — to make the 'what threshold do we ship?' question concrete." difficulty="medium" tag="Coding">
  <p>Scoping a problem includes turning &quot;when do we act?&quot; into a number. With per-decision costs, the optimal threshold isn&apos;t 0.5 — it&apos;s wherever the expected cost of acting equals the expected cost of not acting. For a positive prediction we pay <M>{"c_{fp}"}</M> if wrong; for a negative we pay <M>{"c_{fn}"}</M> if wrong. Acting is worth it when <M>{"p\\,c_{fn} \\ge (1-p)\\,c_{fp}"}</M>, giving the break-even threshold below.</p>
  <CodeBlock language="python" filename="threshold.py">{`def break_even_threshold(c_fp: float, c_fn: float) -> float:
    """Probability threshold above which acting beats not acting.

    c_fp: cost of a false positive (acted, didn't need to)
    c_fn: cost of a false negative (didn't act, should have)
    Derivation: act when p * c_fn >= (1 - p) * c_fp
                => p >= c_fp / (c_fp + c_fn)
    """
    if c_fp < 0 or c_fn < 0 or (c_fp + c_fn) == 0:
        raise ValueError("costs must be non-negative and not both zero")
    return c_fp / (c_fp + c_fn)


# Churn: missing a churner (c_fn) costs 10x a wasted offer (c_fp)
t = break_even_threshold(c_fp=1.0, c_fn=10.0)
print(round(t, 3))   # 0.091 -> intervene even on low-probability churners
`}</CodeBlock>
  <p>The teaching point: a default 0.5 threshold silently assumes symmetric costs. When <M>{"c_{fn} = 10\\,c_{fp}"}</M>, the right threshold drops to about <strong>0.091</strong>, so we&apos;d offer retention to anyone above a 9% churn probability. Making this explicit during framing turns a hand-wavy &quot;flag risky customers&quot; into a defensible, cost-aware decision rule.</p>
</InterviewProblem>

      </>
  );
}
