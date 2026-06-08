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
    </>
  );
}
