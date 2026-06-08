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
      <p>
        Fraud, disease, defaults, and click-throughs share a problem: the event you care about
        is rare. When 99% of examples are negative, a model can score 99% accuracy by predicting
        &quot;no&quot; every single time &mdash; and be completely useless.
      </p>

      <KeyIdea>
        Accuracy is a trap on imbalanced data. The fix is two-fold: change the <strong>metric</strong>
        so the rare class counts, and change the <strong>training signal</strong> (via resampling or
        class weights) so the model stops ignoring it.
      </KeyIdea>

      <h2>Why the majority class wins by default</h2>
      <p>
        Most loss functions average error over every example. If positives are 1% of the data, getting
        them all wrong barely moves the average loss, so gradient descent happily collapses toward the
        majority. The model isn&apos;t broken &mdash; it&apos;s optimizing exactly what you asked, just not
        what you meant.
      </p>

      <h2>The three levers</h2>
      <ul>
        <li><strong>Metrics:</strong> swap accuracy for precision, recall, F1, or PR-AUC, which focus on the positive class.</li>
        <li><strong>Resampling:</strong> oversample the minority (e.g. SMOTE) or undersample the majority to rebalance the training set.</li>
        <li><strong>Class weights:</strong> tell the loss to penalize minority mistakes more, so one rare miss costs as much as many common ones.</li>
      </ul>

      <Basic>
        <p>
          Imagine a classroom where 99 students speak quietly and 1 shouts. If you only optimize for
          &quot;getting most voices right,&quot; you can ignore the shouter entirely. To make the model
          listen, either <strong>clone the shouter</strong> until they&apos;re a real fraction of the room
          (oversampling), <strong>send most quiet students home</strong> (undersampling), or
          <strong> turn up a microphone</strong> just for the rare voice (class weights). All three force
          the learner to pay attention to the case that actually matters.
        </p>
      </Basic>

      <Advanced>
        <p>
          Class weighting rescales the loss. For weighted cross-entropy with class weight
          <M>{"w_c"}</M>:
        </p>
        <MB>{"\\mathcal{L} = -\\frac{1}{N}\\sum_{i=1}^{N} w_{y_i}\\,\\log p_\\theta(y_i \\mid x_i)"}</MB>
        <p>
          A common &quot;balanced&quot; choice sets <M>{"w_c = \\frac{N}{K\\,n_c}"}</M>, where
          <M>{"n_c"}</M> is the count of class <M>{"c"}</M> and <M>{"K"}</M> the number of classes &mdash;
          inversely proportional to frequency. Note that resampling and weighting both distort the base
          rate, so the model&apos;s output probabilities are no longer calibrated to the true prior
          <M>{"\\pi"}</M>. If you need true posteriors, recalibrate with the prior-correction adjustment
          to the logit:
        </p>
        <MB>{"\\log\\frac{p_{\\text{true}}}{1-p_{\\text{true}}} = \\log\\frac{p_{\\text{train}}}{1-p_{\\text{train}}} + \\log\\frac{\\pi}{1-\\pi} - \\log\\frac{r}{1-r}"}</MB>
        <p>
          where <M>{"r"}</M> is the positive rate used during training.
        </p>
      </Advanced>

      <Callout kind="pitfall" title="Resample only the training fold">
        SMOTE or random oversampling must happen <strong>inside</strong> cross-validation, after the
        train/validation split. Resampling before splitting leaks synthetic neighbors of validation
        points into training, inflating your scores. Always wrap resampling in a pipeline so it refits
        per fold.
      </Callout>

      <CodeBlock language="python" filename="imbalanced.py">{`from imblearn.pipeline import Pipeline
from imblearn.over_sampling import SMOTE
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score

# Option A: SMOTE inside the CV pipeline (no leakage)
pipe = Pipeline([
    ("smote", SMOTE(random_state=0)),
    ("clf", LogisticRegression(max_iter=1000)),
])
# Score on PR-AUC, which ignores true negatives entirely
ap = cross_val_score(pipe, X, y, scoring="average_precision", cv=5)
print("PR-AUC:", ap.mean())

# Option B: no resampling at all -- just reweight the loss
clf = LogisticRegression(class_weight="balanced", max_iter=1000)
clf.fit(X_train, y_train)`}</CodeBlock>

      <MoreDepth>
        <p>
          Rebalancing fixes <em>attention</em>, not <em>information</em>. If the minority class is rare
          AND poorly separated, oversampling just memorizes a handful of points and overfits; SMOTE in
          high dimensions interpolates into empty space and can manufacture noise. Before reaching for
          resampling, ask whether the real lever is a <strong>decision threshold</strong> tuned to your
          cost ratio, better features, or simply collecting more positives. Often the cleanest solution
          is to leave the data alone, predict calibrated probabilities, and move the threshold to match
          the asymmetric cost of false negatives versus false positives.
        </p>
      </MoreDepth>

      <Quiz question="Your fraud model gets 99.2% accuracy but catches almost no fraud. What is the best first move?" options={[
        { text: "Trust the accuracy and ship it", why: "99.2% accuracy is exactly what a constant 'not fraud' predictor scores when fraud is 0.8% of cases -- it tells you nothing about fraud detection." },
        { text: "Evaluate with PR-AUC or recall and rebalance via class weights or resampling", correct: true, why: "These metrics expose performance on the rare positive class, and reweighting/resampling forces the model to learn it." },
        { text: "Add more layers to the model", why: "Capacity isn't the bottleneck; the loss is dominated by the majority class regardless of model size." },
        { text: "Apply SMOTE to the full dataset before splitting", why: "Resampling before the split leaks synthetic neighbors into validation, giving falsely optimistic scores." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="Your fraud classifier hits 99.5% accuracy on a dataset that is 99.5% legitimate transactions. Your manager is thrilled. Why are you not?" difficulty="easy" tag="Conceptual">
  <p>A model that predicts &quot;legitimate&quot; for every transaction scores exactly 99.5% accuracy while catching <strong>zero</strong> fraud. Accuracy is dominated by the majority class, so it tells you almost nothing about the minority class you actually care about.</p>
  <p>What to report instead:</p>
  <ul>
    <li><strong>Precision</strong> <M>{"= \\frac{TP}{TP+FP}"}</M>: of the transactions flagged as fraud, how many really were.</li>
    <li><strong>Recall</strong> <M>{"= \\frac{TP}{TP+FN}"}</M>: of all real fraud, how much we caught.</li>
    <li><strong>PR-AUC</strong> (area under the precision-recall curve) rather than ROC-AUC. ROC-AUC can look deceptively high under heavy imbalance because the false-positive rate has a huge negative denominator, so large absolute numbers of false positives barely move it. PR curves keep the rare positives in the denominator and expose that weakness.</li>
  </ul>
  <p>The right metric also depends on cost: missing fraud (FN) and blocking a real customer (FP) have very different dollar values, so a cost-weighted metric or a chosen operating point usually beats any single threshold-free number.</p>
</InterviewProblem>
<InterviewProblem question="Walk me through how you would handle a 1:200 class imbalance, and explain the tradeoffs of oversampling, undersampling, SMOTE, and class weights." difficulty="medium" tag="Applied">
  <p>First, decide whether imbalance is even a problem. Many learners (calibrated logistic regression, gradient boosting) handle skew fine if you evaluate with the right metric and tune the decision threshold. So step one is a baseline with no resampling, judged on PR-AUC and a cost-aware threshold.</p>
  <p>If the minority signal is genuinely being drowned out, the main levers are:</p>
  <ul>
    <li><strong>Random oversampling</strong> (duplicate minority rows): cheap, but exact duplicates encourage overfitting because the model can memorize them.</li>
    <li><strong>Random undersampling</strong> (drop majority rows): fast and shrinks training time, but throws away data and information; works best when the majority is huge and redundant.</li>
    <li><strong>SMOTE</strong> (synthesize new minority points by interpolating between near neighbors): adds variety instead of duplicates, but can create unrealistic samples in feature space, bridges into majority regions near class borders, and is unreliable with categorical or high-dimensional features.</li>
    <li><strong>Class weights / cost-sensitive learning</strong> (scale the loss for minority errors, e.g. <M>{"\\texttt{class\\_weight='balanced'}"}</M>): no data fabrication, touches only the objective, and is usually my first choice because it is the cleanest way to tell the model that minority errors hurt more.</li>
  </ul>
  <p>Two rules that catch people out:</p>
  <ul>
    <li><strong>Resample inside cross-validation, only on the training fold.</strong> If you SMOTE or oversample before the split, synthetic or duplicated points leak across folds and validation scores become fiction.</li>
    <li><strong>Resampling distorts the base rate, so it miscalibrates probabilities.</strong> If you need trustworthy probabilities (for thresholds or expected-cost decisions), prefer class weights, or recalibrate afterward.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="A model has recall 0.90 and precision 0.05 on a fraud problem with 0.5% prevalence. Compute the F1 score, and explain why precision is so low even though the model is good at finding fraud." difficulty="medium" tag="Math">
  <p>F1 is the harmonic mean of precision and recall:</p>
  <MB>{"F_1 = 2\\cdot\\frac{P\\cdot R}{P+R} = 2\\cdot\\frac{0.05\\times 0.90}{0.05+0.90} = \\frac{0.09}{0.95} \\approx 0.095"}</MB>
  <p>So F1 is about <strong>0.095</strong> &mdash; the harmonic mean is dragged toward the smaller term, exposing the precision problem that accuracy would have hidden.</p>
  <p>Why is precision so low? Imagine 100,000 transactions with 0.5% fraud, so 500 fraud and 99,500 legitimate. Recall 0.90 means we catch <M>{"0.90\\times 500 = 450"}</M> true positives. Suppose the model flags even 1% of legitimate transactions as fraud: that is <M>{"0.01\\times 99{,}500 \\approx 995"}</M> false positives. Then:</p>
  <MB>{"P = \\frac{TP}{TP+FP} = \\frac{450}{450+995} \\approx 0.31"}</MB>
  <p>To land near precision 0.05, the false-positive rate only needs to be a few percent. The lesson: when positives are rare, even a tiny <strong>false-positive rate</strong> produces a flood of false positives <em>relative to</em> the small number of true positives, so precision collapses. This is exactly why ROC-AUC can look fine while PR-AUC and precision do not.</p>
</InterviewProblem>
<InterviewProblem question="Implement a leak-free training and evaluation pipeline for imbalanced data: resample only on the training fold inside cross-validation, and tune the decision threshold to maximize F1." difficulty="hard" tag="Coding">
  <p>The two traps are (1) resampling before the split, which leaks synthetic minority points across folds, and (2) leaving the threshold at the default 0.5, which is rarely optimal under imbalance. An <M>{"\\texttt{imblearn}"}</M> pipeline keeps resampling strictly inside each fold, and we sweep the threshold on out-of-fold scores.</p>
  <CodeBlock language="python" filename="imbalanced_pipeline.py">{`import numpy as np
from imblearn.pipeline import Pipeline
from imblearn.over_sampling import SMOTE
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.metrics import f1_score, precision_recall_curve

# SMOTE lives INSIDE the pipeline, so it only ever sees the training fold.
pipe = Pipeline([
    ("smote", SMOTE(random_state=0)),
    ("clf", LogisticRegression(max_iter=1000, class_weight="balanced")),
])

# Stratified folds preserve the rare-class ratio in every split.
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=0)

# Out-of-fold predicted probabilities: each row is scored by a model
# that never trained on it (and never on its synthetic neighbors).
proba = cross_val_predict(pipe, X, y, cv=cv, method="predict_proba")[:, 1]

# Tune the threshold on the OOF scores to maximize F1.
prec, rec, thr = precision_recall_curve(y, proba)
f1 = 2 * prec * rec / (prec + rec + 1e-12)
best = np.nanargmax(f1[:-1])          # last point has no threshold
best_threshold = thr[best]

print(f"Best threshold: {best_threshold:.3f}  F1: {f1[best]:.3f}")

# Apply the chosen operating point.
y_pred = (proba >= best_threshold).astype(int)
print("Final F1:", f1_score(y, y_pred))`}</CodeBlock>
  <p>Key points an interviewer wants to hear: <strong>StratifiedKFold</strong> keeps the minority ratio stable per fold; SMOTE is a <strong>pipeline step</strong> so it is refit per fold and never touches validation rows; the threshold is chosen on <strong>out-of-fold</strong> scores, not on the training data; and if calibrated probabilities matter downstream, you would drop SMOTE in favor of class weights plus a calibration step, since resampling shifts the base rate and biases the probabilities upward.</p>
</InterviewProblem>

      </>
  );
}
