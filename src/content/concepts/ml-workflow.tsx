"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { CodeBlock } from "@/components/content/code-block";
import { Quiz } from "@/components/content/quiz";

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
    </>
  );
}
