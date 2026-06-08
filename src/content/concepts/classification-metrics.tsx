"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M } from "@/components/content/math";
import { Quiz } from "@/components/content/quiz";
import { ClassificationMetricsExplorer } from "@/components/viz/classification-metrics";

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
    </>
  );
}
