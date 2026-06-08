"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { Quiz } from "@/components/content/quiz";
import { ClassificationMetricsExplorer } from "@/components/viz/classification-metrics";
import { InterviewProblem } from "@/components/content/interview-problem";
import { CodeBlock } from "@/components/content/code-block";

export default function ClassificationMetricsContent() {
  return (
    <>
      <p>
        Accuracy is the most reported and most misleading metric in machine learning. To evaluate a
        classifier honestly you need to understand the <strong>confusion matrix</strong> and the
        trade-off between catching positives and avoiding false alarms.
      </p>

      <KeyIdea>
        Every classification metric is just a ratio of four numbers: true/false positives and
        true/false negatives. Moving the <strong>decision threshold</strong> trades one type of error
        for the other — there is no single &quot;accuracy&quot;, only a curve of operating points.
      </KeyIdea>

      <p>
        Slide the threshold below across two overlapping score distributions. Watch the confusion
        matrix, precision, recall, and the point on the ROC curve all move together. Then change the
        class separation to see what a genuinely better model (higher AUC) looks like.
      </p>

      <ClassificationMetricsExplorer />

      <h2>The metrics that matter</h2>
      <Basic>
        <p>
          <strong>Precision</strong> answers: of everything I flagged positive, how many really were?
          <strong> Recall</strong> answers: of all the real positives, how many did I catch? You usually
          can&apos;t maximize both — being stricter raises precision but lowers recall, and vice versa.
        </p>
      </Basic>
      <Advanced>
        <p>From the confusion matrix:</p>
        <ul>
          <li><M>{"\\text{Precision} = \\frac{TP}{TP+FP}"}</M> — exactness of positive predictions.</li>
          <li><M>{"\\text{Recall (TPR)} = \\frac{TP}{TP+FN}"}</M> — coverage of actual positives.</li>
          <li><M>{"F_1 = 2\\cdot\\frac{P\\cdot R}{P+R}"}</M> — harmonic mean, punishing imbalance between them.</li>
          <li><M>{"\\text{FPR} = \\frac{FP}{FP+TN}"}</M> — the x-axis of the ROC curve.</li>
        </ul>
      </Advanced>

      <Callout kind="pitfall" title="Why accuracy lies">
        If 99% of transactions are legitimate, a model that predicts &quot;legit&quot; every time scores
        99% accuracy while catching <strong>zero</strong> fraud. On imbalanced problems, report
        precision, recall, and PR-AUC — not accuracy.
      </Callout>

      <h2>ROC vs PR curves</h2>
      <ul>
        <li><strong>ROC / AUC</strong> — TPR vs FPR across all thresholds; AUC is the probability the model ranks a random positive above a random negative. Threshold-independent.</li>
        <li><strong>Precision-Recall</strong> — far more informative when positives are rare, because it ignores the easy abundance of true negatives.</li>
      </ul>

      <MoreDepth>
        <p>
          Choosing the threshold is a <strong>business decision</strong>, not a statistical one: it
          depends on the relative cost of a false positive vs a false negative. For cancer screening you
          want high recall (don&apos;t miss a case); for spam you want high precision (don&apos;t trash
          real mail). Pick the operating point on the ROC/PR curve that minimizes expected cost — and if
          you need calibrated probabilities (not just rankings), check a <strong>reliability diagram</strong>
          and apply Platt scaling or isotonic regression.
        </p>
      </MoreDepth>

      <Quiz
        question="A medical test for a rare disease should be tuned to prioritize which metric?"
        options={[
          { text: "Precision — never raise a false alarm.", why: "Missing a real case (false negative) is usually far costlier here." },
          { text: "Recall — catch as many true cases as possible, even at the cost of some false alarms.", correct: true, why: "For screening, a missed disease is the expensive error; follow up positives with a confirmatory test." },
          { text: "Raw accuracy.", why: "With a rare disease, accuracy is dominated by true negatives and is misleading." },
          { text: "It doesn't matter which.", why: "The cost asymmetry makes the choice critical." },
        ]}
      />
    <h2>Interview practice</h2>
<InterviewProblem question="A fraud model has 99.5% accuracy. Your manager is thrilled. Why might you not be?" difficulty="easy" tag="Conceptual">
  <p>Fraud is rare, so the base rate of the negative class is already near 99.5%. A model that predicts &quot;not fraud&quot; for every transaction matches that accuracy while catching <strong>zero</strong> fraud. Accuracy is dominated by the majority class and tells you almost nothing on imbalanced problems.</p>
  <p>Go back to the confusion matrix, which is the source of truth, and report metrics conditioned on each class:</p>
  <ul>
    <li><strong>Recall</strong> (sensitivity): of the actual fraud, how much did we catch? <M>{"\\mathrm{TP}/(\\mathrm{TP}+\\mathrm{FN})"}</M></li>
    <li><strong>Precision</strong>: of what we flagged, how much was real? <M>{"\\mathrm{TP}/(\\mathrm{TP}+\\mathrm{FP})"}</M></li>
    <li><strong>PR-AUC</strong> as a single threshold-free summary, since it focuses on the positive (rare) class.</li>
  </ul>
  <p>The right metric also depends on cost: missing fraud (a false negative) is usually far more expensive than a false alarm, so recall and the dollar-weighted cost matter more than raw accuracy.</p>
</InterviewProblem>
<InterviewProblem question="Given a confusion matrix with TP=80, FP=40, FN=20, TN=860, compute precision, recall, and F1. Then explain what happens to each as you lower the decision threshold." difficulty="medium" tag="Math">
  <p>Plug into the definitions:</p>
  <MB>{"\\text{precision} = \\frac{\\mathrm{TP}}{\\mathrm{TP}+\\mathrm{FP}} = \\frac{80}{80+40} = \\frac{80}{120} \\approx 0.667"}</MB>
  <MB>{"\\text{recall} = \\frac{\\mathrm{TP}}{\\mathrm{TP}+\\mathrm{FN}} = \\frac{80}{80+20} = \\frac{80}{100} = 0.80"}</MB>
  <p>F1 is the harmonic mean, which punishes imbalance between the two:</p>
  <MB>{"F_1 = 2\\cdot\\frac{P\\cdot R}{P+R} = 2\\cdot\\frac{0.667\\cdot 0.80}{0.667+0.80} \\approx 0.727"}</MB>
  <p>Now lower the threshold. You predict positive more often, so:</p>
  <ul>
    <li>More true positives get caught and fewer slip through, so <strong>recall rises</strong> (FN falls).</li>
    <li>But you also flag more negatives, so FP climbs and <strong>precision tends to fall</strong>.</li>
  </ul>
  <p>This is the precision-recall trade-off: the threshold is a dial, not a fixed property of the model. At the extremes, threshold 0 gives recall 1 with terrible precision, and threshold 1 gives near-perfect precision with recall near 0.</p>
</InterviewProblem>
<InterviewProblem question="When would you prefer a PR curve over an ROC curve, and what does AUC actually measure?" difficulty="medium" tag="Conceptual">
  <p><strong>ROC-AUC</strong> plots true positive rate against false positive rate across all thresholds. Its value equals the probability that a randomly chosen positive is scored higher than a randomly chosen negative, a ranking quality measure. Because both axes are rates normalized within a class, ROC is <strong>insensitive to class balance</strong>.</p>
  <p>That insensitivity is also its weakness on heavy imbalance. With very few positives, the false positive rate <M>{"\\mathrm{FP}/(\\mathrm{FP}+\\mathrm{TN})"}</M> stays tiny even when FP is large in absolute terms, because TN is huge. ROC then looks deceptively good.</p>
  <ul>
    <li>Use the <strong>PR curve</strong> when positives are rare and you care about the quality of your flags (fraud, disease, ad clicks). Precision directly exposes the false-positive pain that ROC hides, and PR-AUC has a meaningful baseline equal to the positive prevalence.</li>
    <li>Use <strong>ROC</strong> when classes are roughly balanced or you want a balance-invariant comparison of ranking ability across models or datasets.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="You ship a classifier and the business says 'flag at most 5% of transactions for manual review, maximize fraud caught.' Write code to pick the threshold from a validation set." difficulty="hard" tag="Coding">
  <p>This is a constrained threshold-selection problem, not a metric report. The business fixes the <strong>review budget</strong> (alert rate &le; 5%) and wants to maximize recall under that cap. Sort by score, take the 95th percentile as the cutoff so exactly 5% are flagged, then verify the recall you achieve at that operating point.</p>
  <CodeBlock language="python" filename="pick_threshold.py">{`import numpy as np

def threshold_for_budget(y_true, scores, alert_rate=0.05):
    # Threshold = the (1 - alert_rate) quantile of scores,
    # so the top alert_rate fraction is flagged.
    thr = np.quantile(scores, 1.0 - alert_rate)
    pred = scores >= thr

    tp = np.sum(pred & (y_true == 1))
    fp = np.sum(pred & (y_true == 0))
    fn = np.sum(~pred & (y_true == 1))

    recall = tp / (tp + fn) if (tp + fn) else 0.0
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    flagged = pred.mean()
    return thr, recall, precision, flagged

# Example
rng = np.random.default_rng(0)
y = (rng.random(10000) < 0.02).astype(int)          # 2% fraud
scores = rng.random(10000) * 0.5 + y * 0.4          # fraud scores higher
thr, rec, prec, flagged = threshold_for_budget(y, scores, 0.05)
print(f"threshold={thr:.3f} recall={rec:.3f} precision={prec:.3f} flagged={flagged:.3f}")`}</CodeBlock>
  <p>Key points an interviewer wants to hear:</p>
  <ul>
    <li>Tune the threshold on <strong>validation data, never on the test set</strong>, or you leak and overstate the operating point.</li>
    <li>The quantile approach guarantees the budget constraint; you then read off recall as the objective. This traces a single point on the PR curve chosen by an external constraint.</li>
    <li>If fraud carries dollar amounts, sort by <strong>expected loss</strong> (score times amount) rather than raw score, so the 5% you review captures the most value, not just the most cases.</li>
  </ul>
</InterviewProblem>

      </>
  );
}
