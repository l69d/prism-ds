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
        Every supervised ML project follows the same skeleton: split your data, train on one slice,
        tune on another, and judge yourself on a slice you never touched. Get the bookkeeping wrong and
        your model will look brilliant in development and fall apart in production.
      </p>

      <KeyIdea>
        The test set is a one-time, honesty check. The moment any information from it influences your
        model or your decisions, your reported accuracy becomes fiction.
      </KeyIdea>

      <h2>The three splits</h2>
      <p>
        We carve the labelled data into three disjoint roles. Each answers a different question:
      </p>
      <ul>
        <li><strong>Train</strong> — the model fits its parameters here. It is allowed to memorize this.</li>
        <li><strong>Validation</strong> — used to pick hyperparameters and compare models. You look at it many times.</li>
        <li><strong>Test</strong> — touched once, at the very end, to estimate real-world performance.</li>
      </ul>
      <p>
        A typical split is 60/20/20, though with lots of data the validation and test slices can be
        proportionally smaller. With little data, <strong>k-fold cross-validation</strong> reuses every
        example for both training and validation across rotating folds.
      </p>

      <Basic>
        <p>
          Think of studying for an exam. The <strong>training set</strong> is the textbook you read and
          re-read. The <strong>validation set</strong> is the practice quizzes you use to decide how to
          study. The <strong>test set</strong> is the real exam, sealed until exam day. If you peek at the
          exam beforehand, your score tells you nothing about how much you actually learned. Leakage is
          exactly that peek &mdash; test information sneaking into your study somehow, so your grade is
          inflated and meaningless.
        </p>
      </Basic>

      <Advanced>
        <p>
          We want an unbiased estimate of the generalization error,
          the expected loss over the true data distribution:
        </p>
        <MB>{"R(f) = \\mathbb{E}_{(x,y) \\sim \\mathcal{D}}\\,[\\,L(f(x), y)\\,]"}</MB>
        <p>
          The test set gives an empirical estimate <M>{"\\hat{R}_{\\text{test}}(f) = \\frac{1}{n} \\sum_{i=1}^{n} L(f(x_i), y_i)"}</M>.
          This is unbiased only if <M>{"f"}</M> was chosen <strong>independently</strong> of the test
          points. Every time you select a model based on validation performance, you optimize over that
          set, so <M>{"\\hat{R}_{\\text{val}}"}</M> becomes optimistically biased. Reusing the test set
          to make decisions does the same thing to it &mdash; this is why it stays sealed.
        </p>
      </Advanced>

      <h2>Where leakage hides</h2>
      <p>
        Leakage is when information that would be unavailable at prediction time slips into training. The
        classic offender is fitting preprocessing on the whole dataset before splitting:
      </p>

      <Callout kind="pitfall" title="Fit transforms on train only">
        Scalers, imputers, encoders, and feature selectors must be <strong>fit</strong> on the training
        fold and merely <strong>applied</strong> to validation and test. Computing the mean for
        standardization over all rows leaks the test distribution into training.
      </Callout>

      <CodeBlock language="python" filename="workflow.py">{`from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

# Split FIRST, before any fitting
X_tr, X_test, y_tr, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y)

# Pipeline ties the scaler's fit to the training fold only,
# so cross-validation never leaks test statistics.
pipe = make_pipeline(StandardScaler(), LogisticRegression())
pipe.fit(X_tr, y_tr)            # scaler.fit uses ONLY X_tr
print(pipe.score(X_test, y_test))  # touched once`}</CodeBlock>

      <MoreDepth>
        <p>
          Subtle leakage usually comes from <strong>structure in the data</strong>, not preprocessing.
          With time series, a random split lets the model train on the future and test on the past &mdash;
          always split chronologically. With grouped data (multiple rows per patient, user, or stock),
          random splitting puts the same entity in both train and test, so use group-aware splits like
          <strong> GroupKFold</strong>. And in long projects, the test set silently degrades through
          repeated reuse; treating Kaggle-style public leaderboards as a private test set is how teams
          overfit to the leaderboard.
        </p>
      </MoreDepth>

      <Quiz question="You standardize all features using the mean and standard deviation of the entire dataset, then split into train and test. What's wrong?" options={[
        { text: "Nothing — standardizing before splitting is the recommended order.", why: "It is the opposite: fitting any transform before the split contaminates the test data." },
        { text: "Test-set statistics leak into the scaler, so your test score is optimistically biased.", correct: true, why: "The mean and std were computed using test rows, so training implicitly saw the test distribution — classic data leakage." },
        { text: "Standardization should never be applied to test data at all.", why: "You must apply it to test data, just using parameters fit only on train." },
        { text: "It only matters for tree models, which are scale-sensitive.", why: "Trees are scale-invariant; the leakage problem is about fitting on test rows, independent of model type." },
      ]} />
    <h2>Interview practice</h2>

<InterviewProblem question="Walk me through why we need three splits (train, validation, test) instead of just train and test." difficulty="easy" tag="Conceptual">
  <p>Each split answers a different question, and collapsing them quietly inflates your reported performance.</p>
  <ul>
    <li><strong>Train</strong> fits the model parameters (weights, splits, coefficients).</li>
    <li><strong>Validation</strong> tunes the things you choose by hand: hyperparameters, feature sets, model family, the decision threshold. Every time you look at validation performance and change something, you are fitting to it.</li>
    <li><strong>Test</strong> is touched exactly once, at the very end, to get an honest estimate of generalization.</li>
  </ul>
  <p>If you only had train and test, then the moment you used the test set to pick a hyperparameter you would be optimizing against it. After enough comparisons you are <strong>overfitting the test set</strong> through selection, and its number stops being an unbiased estimate of real-world performance. The validation set absorbs all that tuning bias so the test set stays clean.</p>
  <p>In practice with limited data, the validation step is often replaced by <strong>k-fold cross-validation</strong> on the train portion, but the rule survives: the test set is locked away until you are done choosing.</p>
</InterviewProblem>

<InterviewProblem question="A teammate scales features with StandardScaler fit on the full dataset, then splits into train and test and reports great results. What is wrong, and how big a deal is it?" difficulty="medium" tag="Applied">
  <p>This is <strong>data leakage via preprocessing</strong>. Fitting the scaler on the full dataset means the mean and standard deviation it subtracts are computed using the test rows. Information about the test distribution has leaked into the training pipeline, so the reported score is optimistic and will not hold in production, where future data was never available at fit time.</p>
  <p>The fix is to fit any data-dependent transform on the training fold only, then apply (transform, not refit) to validation and test:</p>
  <CodeBlock language="python" filename="leakage_fix.py">{`from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Pipeline guarantees the scaler is fit ONLY on training data
# inside each CV fold and at final fit time.
pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", LogisticRegression(max_iter=1000)),
])
pipe.fit(X_train, y_train)          # scaler learns mean/std from train only
print(pipe.score(X_test, y_test))   # honest estimate`}</CodeBlock>
  <p>How big a deal it is depends: with simple centering and lots of data the inflation is tiny, but with target-derived features, imputation, feature selection, or oversampling done before the split, it can be enormous, sometimes turning a coin-flip model into one that looks near-perfect. The safe default is to put every fitted transform inside a <strong>Pipeline</strong> so cross-validation re-fits it per fold.</p>
</InterviewProblem>

<InterviewProblem question="You are forecasting next month's sales from historical data. Explain why a random 80/20 split is wrong here and what you would do instead." difficulty="hard" tag="Case">
  <p>A random split is wrong because it breaks the arrow of time. With random shuffling, training rows from <strong>after</strong> a test row can land in the training set, so the model effectively peeks into the future. That is <strong>temporal leakage</strong>: at prediction time in production you will never have access to later data, so a randomly-split evaluation overstates accuracy.</p>
  <p>Instead use a <strong>time-based split</strong>: train on the earliest period, validate and test on strictly later periods. For tuning, use <strong>forward-chaining (rolling/expanding-window) cross-validation</strong> rather than k-fold:</p>
  <ul>
    <li>Fold 1: train on months 1-6, validate on month 7.</li>
    <li>Fold 2: train on months 1-7, validate on month 8.</li>
    <li>Fold 3: train on months 1-8, validate on month 9, and so on.</li>
  </ul>
  <p>The validation window always sits after the training window, mirroring deployment. Other time-series leak traps to call out:</p>
  <ul>
    <li><strong>Feature lookahead:</strong> rolling means, normalization stats, or target encodings must use only data up to time <M>{"t"}</M>, never the whole series.</li>
    <li><strong>Gap/embargo:</strong> if a label at time <M>{"t"}</M> depends on a window ending at <M>{"t+k"}</M>, leave a gap between train and test so overlapping windows do not leak.</li>
    <li><strong>Group leakage:</strong> if the same store or customer appears repeatedly, you may also need group-aware splitting so one entity is not in both train and test.</li>
  </ul>
  <p>Bottom line: the split must reproduce the information available at prediction time. For temporal problems that means respecting chronology end to end.</p>
</InterviewProblem>

<InterviewProblem question="Your model gets 0.92 cross-validation accuracy but 0.74 on the held-out test set. Give a structured diagnosis." difficulty="medium" tag="Applied">
  <p>A large CV-to-test gap means the CV estimate was optimistic. I would work through the likely causes in order of how common they are:</p>
  <ul>
    <li><strong>Leakage inside CV.</strong> If preprocessing (scaling, imputation, feature selection, SMOTE, target encoding) was done once on all training data before cross-validation, every fold saw information it should not have, inflating CV. Refit everything inside the CV loop via a Pipeline and recheck.</li>
    <li><strong>Distribution shift.</strong> If the test set comes from a different time period or population than train (covariate or label shift), CV on the training distribution will not predict test performance. Compare feature distributions across the two sets.</li>
    <li><strong>Test set too small.</strong> A 0.74 on a small test set has wide error bars; a few mislabeled or unlucky rows move it a lot. Report a confidence interval and consider repeated splits.</li>
    <li><strong>Tuning overfit to CV.</strong> Trying many hyperparameter combos and picking the best CV score is itself selection bias; the chosen config rode the noise. Nested CV gives a cleaner estimate.</li>
    <li><strong>Improper fold structure.</strong> Grouped or temporal data split randomly leaks correlated rows across folds, so CV looks great while the truly out-of-sample test does not.</li>
  </ul>
  <p>I would trust the <strong>test number more</strong> as the honest estimate and treat the gap as a signal that the validation protocol, not just the model, needs fixing.</p>
</InterviewProblem>

      </>
  );
}
