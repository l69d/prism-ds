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
      <p>A model that memorizes its training data can look brilliant and still fail on new data. Cross-validation is how we estimate real-world performance honestly, without peeking.</p>

      <KeyIdea>Never judge a model on data it learned from. Cross-validation repeatedly hides part of the data, trains on the rest, and scores on the held-out part — so every point gets a turn as an unseen test.</KeyIdea>

      <h2>The mechanics of k-fold</h2>
      <p>The most common scheme is <strong>k-fold</strong>. You split the data into <M>{"k"}</M> equal chunks (&quot;folds&quot;), then loop:</p>
      <ul>
        <li>Hold out fold <M>{"i"}</M> as the validation set.</li>
        <li>Train on the other <M>{"k-1"}</M> folds.</li>
        <li>Score the model on the held-out fold.</li>
      </ul>
      <p>Repeat for every fold, then average the <M>{"k"}</M> scores. Common variants: <strong>stratified</strong> k-fold preserves class balance in each fold, and <strong>leave-one-out</strong> (LOO) sets <M>{"k=n"}</M> so each point is its own test set.</p>

      <Basic>
        <p>Imagine studying for an exam with 50 practice questions. If you grade yourself on the same 50 you memorized, you&apos;ll score 100% and learn nothing about exam day. Instead, hide 10 questions, study the other 40, then test on the hidden 10. Rotate which 10 you hide five times and average your scores. That average is a fair guess at how you&apos;ll actually do.</p>
      </Basic>

      <Advanced>
        <p>The k-fold estimate of generalization error averages per-fold losses:</p>
        <MB>{"\\widehat{\\mathrm{CV}}_k = \\frac{1}{k} \\sum_{i=1}^{k} \\frac{1}{|F_i|} \\sum_{j \\in F_i} L\\big(y_j, \\hat{f}^{-i}(x_j)\\big)"}</MB>
        <p>where <M>{"\\hat{f}^{-i}"}</M> is the model trained with fold <M>{"F_i"}</M> removed. Larger <M>{"k"}</M> reduces bias (each model sees more data, closer to the full-data model) but raises variance and cost. LOO is nearly unbiased yet high-variance, because its <M>{"n"}</M> training sets are almost identical. The classic sweet spot is <M>{"k=5"}</M> or <M>{"k=10"}</M>, balancing bias, variance, and compute.</p>
      </Advanced>

      <Callout kind="pitfall" title="Leakage destroys honest estimates">
        Any preprocessing that learns from data — scaling, imputation, feature selection, target encoding — must happen <strong>inside</strong> each fold, fit only on the training portion. Fit it once on the whole dataset and your validation fold has already &quot;seen&quot; the test data, inflating scores.
      </Callout>

      <CodeBlock language="python" filename="kfold.py">{`from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

# Pipeline keeps scaling INSIDE each fold -> no leakage
model = make_pipeline(StandardScaler(), LogisticRegression())

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(model, X, y, cv=cv, scoring="roc_auc")

print(f"AUC: {scores.mean():.3f} +/- {scores.std():.3f}")`}</CodeBlock>

      <Callout kind="warning" title="Plain k-fold assumes i.i.d. data">
        With time series, grouped, or otherwise dependent data, random folds leak the future into the past. Use <strong>TimeSeriesSplit</strong> (train only on the past) or <strong>GroupKFold</strong> (keep a group&apos;s rows together) instead.
      </Callout>

      <MoreDepth>
        <p>When you also tune hyperparameters, a single CV loop overfits the choices: the &quot;best&quot; configuration was selected to maximize the same scores you report. The fix is <strong>nested cross-validation</strong> — an inner loop selects hyperparameters, an outer loop estimates performance of the whole selection procedure. It&apos;s expensive (<M>{"k_{out} \\times k_{in}"}</M> fits), but it&apos;s the only CV-based number you can trust as an unbiased estimate when model selection is part of the pipeline.</p>
      </MoreDepth>

      <Quiz question="In 5-fold CV, you standardize features by fitting StandardScaler on the entire dataset before splitting. What is wrong?" options={[
        { text: "Nothing — scaling is deterministic, so it cannot leak information", why: "The scaler learns the mean and standard deviation from data, including the validation rows." },
        { text: "The scaler learns statistics from validation rows, leaking test information and inflating scores", correct: true, why: "Fitting on all data lets each validation fold influence its own preprocessing, an optimistic bias. Fit inside each fold." },
        { text: "It makes training slower but the scores are still honest", why: "The issue is bias in the score, not speed; leakage makes the estimate too optimistic." },
        { text: "You should have used 10 folds instead of 5", why: "Fold count trades bias for variance but does not fix leakage from global preprocessing." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="What problem does k-fold cross-validation solve that a single train/test split does not?" difficulty="easy" tag="Conceptual">
  <p>A single hold-out split gives <strong>one</strong> noisy estimate of generalization error. With limited data, that estimate has high variance: it depends heavily on which rows happened to land in the test set, and you waste a chunk of data that never trains the model.</p>
  <p>k-fold splits the data into <M>{"k"}</M> equal folds, trains on <M>{"k-1"}</M> of them and evaluates on the held-out fold, rotating until every row has been a test point exactly once. The reported score is the mean over folds:</p>
  <MB>{"\\widehat{\\text{CV}} = \\frac{1}{k} \\sum_{i=1}^{k} L_i"}</MB>
  <p>Benefits:</p>
  <ul>
    <li>Every example contributes to both training and evaluation, so you use the data more efficiently.</li>
    <li>Averaging over <M>{"k"}</M> folds <strong>reduces the variance</strong> of the performance estimate versus one split.</li>
    <li>The spread across folds gives a rough sense of how stable the model is.</li>
  </ul>
  <p>The cost is roughly <M>{"k"}</M> times the compute, since you fit the model <M>{"k"}</M> times.</p>
</InterviewProblem>
<InterviewProblem question="You have time-series data. Why is standard k-fold wrong here, and what would you use instead?" difficulty="medium" tag="Applied">
  <p>Standard k-fold shuffles rows and lets a model train on future observations to predict the past. That is <strong>look-ahead leakage</strong>: the in-sample folds contain information that would not exist at prediction time, so CV scores are optimistically biased and collapse in production.</p>
  <p>Use a <strong>forward-chaining</strong> (expanding or rolling window) scheme that always trains on the past and tests on the future:</p>
  <ul>
    <li>Fold 1: train on <M>{"[t_1, t_m]"}</M>, test on <M>{"[t_{m+1}, t_{m+h}]"}</M>.</li>
    <li>Fold 2: train on <M>{"[t_1, t_{m+h}]"}</M>, test on the next block, and so on.</li>
  </ul>
  <p>Scikit-learn implements this as <strong>TimeSeriesSplit</strong>. Two refinements matter in quant settings:</p>
  <ul>
    <li><strong>Embargo / purge</strong>: drop a gap of samples between train and test so overlapping labels (for example a 5-day forward return) cannot leak across the boundary.</li>
    <li>Keep features strictly point-in-time: any rolling statistic must be computed using only data available at or before the timestamp.</li>
  </ul>
  <CodeBlock language="python" filename="ts_cv.py">{`from sklearn.model_selection import TimeSeriesSplit

tscv = TimeSeriesSplit(n_splits=5, gap=5)  # gap = embargo to block label overlap
for train_idx, test_idx in tscv.split(X):
    # train_idx is always a prefix; test_idx always comes after it
    model.fit(X[train_idx], y[train_idx])
    score = model.score(X[test_idx], y[test_idx])`}</CodeBlock>
</InterviewProblem>
<InterviewProblem question="A teammate scales features and selects the top-k features on the full dataset, then runs k-fold CV and reports a great score. What is wrong, and how do you fix it?" difficulty="hard" tag="Case">
  <p>This is the classic <strong>preprocessing leakage</strong> bug. By fitting the scaler and the feature selector on the <strong>entire</strong> dataset before splitting, information from every validation fold has already influenced the pipeline. The CV estimate is no longer an honest measure of out-of-sample performance, and it can be wildly optimistic, especially feature selection on wide data, where picking features by their correlation with <M>{"y"}</M> across all rows leaks the labels.</p>
  <p>The rule: <strong>everything that learns from data must be fit inside the training fold only</strong>. The fix is to wrap preprocessing and the model in a single Pipeline so each fold refits the scaler and selector on just its training portion:</p>
  <CodeBlock language="python" filename="no_leak_cv.py">{`from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score

pipe = Pipeline([
    ("scale", StandardScaler()),
    ("select", SelectKBest(f_classif, k=20)),
    ("clf", LogisticRegression(max_iter=1000)),
])

# cross_val_score refits the WHOLE pipeline on each training fold,
# so the scaler stats and the selected features never see the test fold.
scores = cross_val_score(pipe, X, y, cv=5)`}</CodeBlock>
  <p>If hyperparameters are also tuned, you need <strong>nested CV</strong>: an inner loop selects hyperparameters, an outer loop estimates generalization. Reusing one CV loop for both tuning and reporting leaks the validation folds into model selection and inflates the final number.</p>
</InterviewProblem>
<InterviewProblem question="How do you choose k, and what is the bias-variance trade-off between 5-fold, 10-fold, and leave-one-out CV?" difficulty="medium" tag="Conceptual">
  <p>The choice of <M>{"k"}</M> trades off bias, variance, and compute of the error estimate:</p>
  <ul>
    <li><strong>Small k (for example 5):</strong> each model trains on only <M>{"80\\%"}</M> of the data, so the estimate is slightly <strong>pessimistically biased</strong> (a model trained on less data looks a bit worse). But the folds are fairly independent, so variance is lower, and it is cheap.</li>
    <li><strong>Large k / LOOCV (</strong><M>{"k=n"}</M><strong>):</strong> each model trains on nearly all the data, so bias is tiny. But the <M>{"n"}</M> training sets are almost identical, so the per-fold errors are highly correlated and the <strong>variance of the averaged estimate is high</strong>. It also costs <M>{"n"}</M> fits.</li>
  </ul>
  <p>Why correlated estimates do not shrink in variance: for the mean of <M>{"k"}</M> estimates each with variance <M>{"\\sigma^2"}</M> and average pairwise correlation <M>{"\\rho"}</M>,</p>
  <MB>{"\\operatorname{Var}\\!\\left(\\frac{1}{k}\\sum_i L_i\\right) = \\frac{\\sigma^2}{k} + \\frac{k-1}{k}\\,\\rho\\,\\sigma^2"}</MB>
  <p>As <M>{"\\rho \\to 1"}</M> the second term dominates and adding folds stops helping. This is exactly LOOCV&apos;s problem. In practice <strong>k = 5 or 10 is the sweet spot</strong>; use <strong>stratified</strong> k-fold for classification to keep class ratios balanced in every fold, and <strong>repeated</strong> k-fold (different shuffles averaged) when you need an even tighter estimate.</p>
</InterviewProblem>

      </>
  );
}
