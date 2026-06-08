"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { Quiz } from "@/components/content/quiz";

export default function Lesson() {
  return (
    <>
      <p>Data science is not &quot;building models&quot; — it is a loop that turns a fuzzy business question into a decision someone can act on. The model is just one short step near the end.</p>

      <KeyIdea>Every data science project is a cycle: <strong>question &rarr; data &rarr; model &rarr; decision</strong>, and then back to a sharper question. Most of the value and most of the effort live in the first and last steps, not the middle.</KeyIdea>

      <h2>The CRISP-DM loop</h2>
      <p>The classic framework is <strong>CRISP-DM</strong> (Cross-Industry Standard Process for Data Mining). It names six phases you iterate through, rarely in a straight line:</p>
      <ul>
        <li><strong>Business understanding</strong> &mdash; what decision are we trying to improve, and how will we know if we did?</li>
        <li><strong>Data understanding</strong> &mdash; what do we have, how was it collected, what is missing or biased?</li>
        <li><strong>Data preparation</strong> &mdash; cleaning, joining, feature building. This is usually the largest chunk of work.</li>
        <li><strong>Modeling</strong> &mdash; fit something that maps inputs to the target.</li>
        <li><strong>Evaluation</strong> &mdash; does it actually move the business metric, not just the validation loss?</li>
        <li><strong>Deployment</strong> &mdash; ship it, monitor it, and feed what you learn back into a new question.</li>
      </ul>

      <h2>Who does what</h2>
      <p>The same loop is staffed by different roles, each owning a different slice:</p>
      <ul>
        <li><strong>Data / business analyst</strong> &mdash; lives in business + data understanding. Translates questions into metrics, builds dashboards, runs descriptive and inferential analysis. SQL and clear communication are the core skills.</li>
        <li><strong>ML engineer</strong> &mdash; owns the modeling-to-deployment edge. Cares about pipelines, latency, monitoring, and reproducibility. Treats the model as a product that must run reliably at 3 a.m.</li>
        <li><strong>Research scientist</strong> &mdash; pushes the modeling frontier itself: new architectures, causal inference, experimental design. Optimizes for novel, correct methods over shipping speed.</li>
      </ul>

      <Basic><p>Think of building a house. The &quot;model&quot; is hanging the front door &mdash; satisfying and visible, but quick. The real time goes into surveying the land (business understanding), pouring the foundation (data prep), and inspecting whether anyone can actually live in it (evaluation and deployment). A beautiful door on a cracked foundation helps no one.</p></Basic>

      <Advanced><p>The &quot;80% before the model&quot; rule has a precise cause: model performance is bounded by data quality, not algorithm choice. If labels are noisy with rate <strong>p</strong>, even a perfect classifier inherits an irreducible error near <strong>p</strong>; if the training distribution differs from deployment (covariate shift), validation accuracy systematically overstates real accuracy. No amount of hyperparameter tuning recovers signal that the data never contained. Hence rigorous teams invest disproportionately in measurement design, leakage audits, and a defensible evaluation split <em>before</em> touching a model.</p></Advanced>

      <Callout kind="pitfall" title="The most expensive mistake">Skipping straight to modeling. Teams that start by picking an algorithm before defining the decision and auditing the data routinely ship models that score well offline and fail in production &mdash; usually due to data leakage or a metric that does not match the actual business goal.</Callout>

      <MoreDepth><p>CRISP-DM&apos;s &quot;evaluation&quot; phase hides a subtle trap: <strong>metric mismatch</strong>. A model can have excellent ROC-AUC yet lose money because the cost of a false positive vastly exceeds a false negative, or because the decision is taken at a threshold the AUC never sees. Senior practitioners tie the technical metric to a business loss function early, and treat the loop&apos;s arrows as bidirectional &mdash; a surprising evaluation result often sends you all the way back to <em>business understanding</em>, not just to retune the model.</p></MoreDepth>

      <Quiz question="A team's churn model has high validation accuracy but does not reduce churn after launch. Which CRISP-DM step most likely failed?" options={[
        { text: "Modeling — they should have used a deeper neural network", why: "Accuracy was already high; a bigger model does not fix a goal/metric mismatch." },
        { text: "Business understanding / evaluation — the metric did not map to the actual decision", why: "Correct: high offline accuracy with no business impact is the classic sign that the success criterion was never tied to the real decision." },
        { text: "Data preparation — they had too many features", why: "Feature count does not explain a model that scores well offline yet fails to change the outcome." },
        { text: "Deployment — the server was too slow", why: "Latency would cause outages or errors, not a model that runs but fails to reduce churn." },
      ]} />
    </>
  );
}
