"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { Quiz } from "@/components/content/quiz";
import { InterviewProblem } from "@/components/content/interview-problem";
import { M, MB } from "@/components/content/math";

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
    <h2>Interview practice</h2>
<InterviewProblem question="Walk me through the CRISP-DM lifecycle. Where do most projects actually fail, and why?" difficulty="easy" tag="Conceptual">
  <p>CRISP-DM is the canonical loop that maps onto the <strong>question &rarr; data &rarr; model &rarr; decision</strong> framing:</p>
  <ul>
    <li><strong>Business understanding</strong> &mdash; turn a fuzzy goal into a measurable question and a decision it will drive.</li>
    <li><strong>Data understanding</strong> &mdash; find, profile, and sanity-check the raw data; learn its quirks.</li>
    <li><strong>Data preparation</strong> &mdash; clean, join, impute, and engineer features. This is usually the bulk of the effort.</li>
    <li><strong>Modeling</strong> &mdash; fit candidate models and tune them.</li>
    <li><strong>Evaluation</strong> &mdash; check the model against the <em>business</em> metric, not just the loss.</li>
    <li><strong>Deployment</strong> &mdash; ship it, monitor it, and feed learnings back to the start.</li>
  </ul>
  <p>The arrows are a loop, not a line &mdash; you constantly revisit earlier stages. Most failures are <strong>not</strong> modeling failures. They cluster at the ends: a vague or misframed question (you optimized the wrong thing), and data/deployment (leakage, drift, or a model that never reaches a real decision). A 0.95 AUC model that answers the wrong question is worthless.</p>
</InterviewProblem>
<InterviewProblem question="A PM says 'use ML to reduce customer churn.' How would you scope this into the lifecycle before writing any model code?" difficulty="medium" tag="Case">
  <p>I would resist jumping to a classifier and first nail down the front of the loop, because the framing determines everything downstream.</p>
  <ul>
    <li><strong>The decision</strong>: what action follows a prediction? A retention offer? If so, the useful target is not just &quot;will churn&quot; but &quot;will churn <em>and</em> can be saved by an offer&quot; (uplift), and the value is the incremental retained margin minus offer cost.</li>
    <li><strong>Define churn precisely</strong>: voluntary cancel vs. lapsed usage vs. failed payment? Pick a labeling window (e.g. no activity for 30 days within the next 60).</li>
    <li><strong>Unit and horizon</strong>: predict per-customer per-month? How far ahead must the alert fire to act?</li>
    <li><strong>Data &amp; leakage</strong>: build features only from information available <em>before</em> the prediction time; exclude post-churn signals like cancellation confirmation emails.</li>
    <li><strong>Success metric</strong>: tie evaluation to dollars (expected retained revenue, ROI of the campaign), with a model metric like PR-AUC as a proxy because churn is imbalanced.</li>
    <li><strong>Baseline first</strong>: a rule (&quot;contacted support twice + low usage&quot;) gives a floor the model must beat to justify itself.</li>
  </ul>
  <p>Only after this do I build features and fit a model. The framing work <em>is</em> the job; the model is the easy part.</p>
</InterviewProblem>
<InterviewProblem question="Compare the data analyst, ML engineer, and research scientist roles across the lifecycle. Who owns deployment?" difficulty="medium" tag="Conceptual">
  <p>The roles overlap but center on different stages of the same loop:</p>
  <ul>
    <li><strong>Data / product analyst</strong> &mdash; lives in business understanding, data understanding, and evaluation. Frames questions, runs EDA, builds dashboards and experiments (A/B tests), and translates results back into decisions. Optimizes for <em>insight and influence</em>.</li>
    <li><strong>ML engineer</strong> &mdash; owns the path from a working model to a reliable production system: feature pipelines, training infrastructure, serving, latency, and monitoring for drift. Optimizes for <em>robustness and scale</em>, and typically <strong>owns deployment</strong>.</li>
    <li><strong>Research scientist</strong> &mdash; pushes the modeling and evaluation frontier: novel methods, careful experimental design, and rigorous metrics. Optimizes for <em>correctness and novelty</em>, often further from production.</li>
  </ul>
  <p>At a small company one person may span all three; at a large one the handoffs between them are where bugs hide, so clear contracts (feature definitions, eval metrics, monitoring SLAs) matter more than any single role.</p>
</InterviewProblem>
<InterviewProblem question="Your offline model has AUC 0.92 but the launched feature shows no lift in the business metric. Diagnose, using the lifecycle as your map." difficulty="hard" tag="Case">
  <p>High offline AUC with zero online lift is the classic &quot;great model, no decision value&quot; gap. I would walk the loop backwards and forwards to localize it.</p>
  <ul>
    <li><strong>Metric mismatch (evaluation &harr; business)</strong>: AUC measures ranking, but the decision may depend on calibrated probabilities or on the top-k slice. If we act only on the top 1%, evaluate precision@1% and the actual lift in <em>that</em> slice, not global AUC.</li>
    <li><strong>Train/serve skew (data prep &harr; deployment)</strong>: features computed differently or with different freshness in production than in training. Check feature distributions offline vs. online.</li>
    <li><strong>Leakage (data understanding)</strong>: a feature that was available at training time but not at decision time inflated offline AUC. Re-audit each feature&apos;s availability relative to prediction time.</li>
    <li><strong>The model isn&apos;t the bottleneck (business understanding)</strong>: maybe predictions are accurate but the downstream action is weak &mdash; the retention offer no one redeems, or the alert that fires too late to act. Good prediction, broken decision.</li>
    <li><strong>Experiment design</strong>: is the A/B test powered? No detectable lift can mean small true effect plus too few samples, not zero effect.</li>
  </ul>
  <p>The expected business value, not the loss, is what I am actually maximizing. Roughly,</p>
  <MB>{"\\mathbb{E}[\\text{value}] = \\sum_{a} P(\\text{act} = a \\mid \\hat{y})\\,\\big(\\text{benefit}(a) - \\text{cost}(a)\\big)"}</MB>
  <p>A model can lift <M>{"\\hat{y}"}</M> accuracy yet leave this sum unchanged if the action policy, costs, or the served features break the chain from prediction to decision.</p>
</InterviewProblem>

      </>
  );
}
