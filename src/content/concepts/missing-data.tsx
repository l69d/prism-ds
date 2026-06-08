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
      <p>Real datasets have holes. The dangerous part is not the holes themselves but <em>why</em> the values are missing, because that reason decides whether your fix is harmless or quietly biases every downstream estimate.</p>

      <KeyIdea>How you should handle a missing value depends entirely on the <strong>mechanism</strong> that produced it. The same imputation that is safe under one mechanism can systematically bias your model under another.</KeyIdea>

      <h2>The three mechanisms</h2>
      <p>Rubin&apos;s taxonomy splits missingness into three regimes, ordered from harmless to hostile:</p>
      <ul>
        <li><strong>MCAR</strong> (Missing Completely At Random): the probability of being missing is unrelated to anything. A lab sample is dropped on the floor. The observed rows are a fair random subset.</li>
        <li><strong>MAR</strong> (Missing At Random): missingness depends on <em>observed</em> data, not the missing value itself. Older patients skip a weight question more often, but once you condition on age the missingness is random.</li>
        <li><strong>MNAR</strong> (Missing Not At Random): missingness depends on the <em>unobserved</em> value itself. High earners refuse to report income. The hole carries information you cannot recover from the other columns.</li>
      </ul>

      <h2>What each one lets you do</h2>
      <Basic>
        <p>Think of it as a coin flip for &quot;is this value visible?&quot;. Under <strong>MCAR</strong> the coin is fair and independent of everything, so just dropping incomplete rows still leaves you with a representative sample. Under <strong>MAR</strong> the coin is biased by things you <em>can</em> see, so if you let the model use those visible columns it can correct for the bias. Under <strong>MNAR</strong> the coin is biased by the very thing that is hidden, so no clever fill from the other columns can fully undo the distortion. You need outside information or an explicit model of the missingness.</p>
      </Basic>
      <Advanced>
        <p>Let <M>{"Y"}</M> be the data, <M>{"R"}</M> the missingness indicator, and partition <M>{"Y = (Y_{obs}, Y_{mis})"}</M>. The mechanisms are conditions on the missingness model <M>{"P(R \\mid Y, \\phi)"}</M>:</p>
        <MB>{"\\text{MCAR}: P(R \\mid Y_{obs}, Y_{mis}, \\phi) = P(R \\mid \\phi)"}</MB>
        <MB>{"\\text{MAR}: P(R \\mid Y_{obs}, Y_{mis}, \\phi) = P(R \\mid Y_{obs}, \\phi)"}</MB>
        <p>MNAR is the residual case where <M>{"R"}</M> still depends on <M>{"Y_{mis}"}</M>. Under MAR with distinct parameters the mechanism is <em>ignorable</em>: the likelihood factorizes and you may maximize <M>{"P(Y_{obs} \\mid \\theta)"}</M> without modeling <M>{"R"}</M>. Under MNAR the mechanism is non-ignorable and unbiased estimation requires jointly modeling the data and the missingness (selection or pattern-mixture models), which rests on untestable assumptions.</p>
      </Advanced>

      <Callout kind="pitfall" title="Mean imputation is rarely innocent">
        Filling a column with its mean preserves the mean but shrinks the variance and distorts every correlation, because you have injected a spike of identical values. It biases standard errors downward even under MCAR, making your model look more confident than it is.
      </Callout>

      <h2>Practical imputation</h2>
      <p>Single imputation hides the uncertainty of the guess. <strong>Multiple imputation</strong> draws several plausible completions, fits the model on each, and pools the estimates so the between-imputation spread is folded back into the standard errors.</p>

      <CodeBlock language="python" filename="impute.py">{`import numpy as np
import pandas as pd
from sklearn.experimental import enable_iterative_imputer  # noqa
from sklearn.impute import IterativeImputer

df = pd.DataFrame({"age": [22, 35, np.nan, 41], "income": [30, np.nan, 80, 95]})

# Add a 'was-missing' flag BEFORE filling: the pattern can be predictive (MNAR).
mask = df.isna().add_suffix("_missing").astype(int)

# Iterative (MICE-style) imputation conditions each column on the others -> valid under MAR.
imp = IterativeImputer(sample_posterior=True, random_state=0)
filled = pd.DataFrame(imp.fit_transform(df), columns=df.columns)

out = pd.concat([filled, mask], axis=1)
print(out)`}</CodeBlock>

      <Callout kind="warning" title="Fit imputers on train only">
        Compute imputation statistics (means, regression coefficients) on the training fold and apply them to validation and test. Imputing before splitting leaks information across the boundary and inflates your reported scores.
      </Callout>

      <MoreDepth>
        <p>You cannot test MAR versus MNAR from the data alone, because both make identical predictions about the observed entries; they differ only over the values you never see. So the choice is a domain argument, not a statistic. A pragmatic hedge: add a binary missingness-indicator feature for each affected column. If the data are truly MNAR, that flag lets a flexible model recover part of the signal carried by the act of being missing, and if they are MAR the flag is simply uninformative and gets down-weighted.</p>
      </MoreDepth>

      <Quiz question="A survey finds that respondents with high incomes are more likely to leave the income field blank. What is the missingness mechanism, and what does it imply?" options={[
        { text: "MNAR, because missingness depends on the unobserved income value itself, so imputing from other columns alone will bias estimates.", correct: true, why: "The probability of missing depends on the very value that is hidden, which is the definition of MNAR and the non-ignorable case." },
        { text: "MCAR, because the blanks are scattered randomly across respondents.", why: "They are not random: the blanks concentrate among high earners, so the observed sample is not representative." },
        { text: "MAR, because conditioning on the other observed columns fully removes the bias.", why: "MAR requires missingness to depend only on observed values; here it depends on the missing income itself, so other columns cannot fully correct it." },
        { text: "It does not matter; mean imputation will fix it regardless of mechanism.", why: "Mean imputation shrinks variance and, under MNAR, systematically biases the income estimate toward the low end." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="Explain MCAR, MAR, and MNAR. Why does the distinction matter for whether your imputation biases the model?" difficulty="easy" tag="Conceptual">
  <p>The three mechanisms describe how the probability of a value being missing relates to the data:</p>
  <ul>
    <li><strong>MCAR (Missing Completely At Random):</strong> missingness is independent of both observed and unobserved values. A lab machine randomly drops readings. Dropping rows (complete-case analysis) is unbiased here, just less efficient.</li>
    <li><strong>MAR (Missing At Random):</strong> missingness depends only on <strong>observed</strong> data. Income is more often missing for younger respondents, but age is recorded. Conditioning on the observed variables, the missingness is random, so model-based imputation (e.g. regress income on age) recovers an unbiased estimate.</li>
    <li><strong>MNAR (Missing Not At Random):</strong> missingness depends on the <strong>unobserved</strong> value itself. High earners refuse to report income. No imputation from observed columns alone can fix this without a model of the missingness mechanism.</li>
  </ul>
  <p>The distinction matters because it determines bias. Under MCAR you can drop or impute freely. Under MAR you must impute <strong>conditional on the observed predictors</strong> or you bias estimates. Under MNAR, naive imputation (mean, regression) systematically biases the model because the missing values differ from the observed ones in a way you cannot see from the data. Crucially, MCAR is testable (compare distributions of complete vs incomplete cases), MAR is an assumption you cannot verify from the data alone, and MNAR can only be addressed with domain knowledge or sensitivity analysis.</p>
</InterviewProblem>
<InterviewProblem question="A teammate fills missing values with the column mean. What goes wrong, and what would you do instead?" difficulty="medium" tag="Applied">
  <p>Mean imputation has three well-known failure modes:</p>
  <ul>
    <li><strong>It shrinks variance.</strong> Every imputed point sits exactly at the mean, so the column&apos;s variance is understated. If <M>{"p"}</M> is the fraction missing, the imputed-sample variance is deflated by roughly a factor of <M>{"(1-p)"}</M>, which makes standard errors too small and confidence intervals too narrow.</li>
    <li><strong>It distorts covariance.</strong> Imputed rows pull correlations toward zero because the filled values carry no relationship to the other features, biasing any downstream regression coefficients.</li>
    <li><strong>It ignores the mechanism.</strong> Under MAR, the conditional mean given other features is what you want, not the unconditional mean.</li>
  </ul>
  <p>Better options, in roughly increasing sophistication:</p>
  <ul>
    <li>Add a <strong>missingness indicator</strong> column alongside any imputation, so a tree or linear model can learn that &quot;was missing&quot; is itself predictive (often it is, especially under MNAR).</li>
    <li>Use <strong>model-based / iterative imputation</strong> (MICE / <M>{"\\texttt{IterativeImputer}"}</M>, or KNN) that predicts each missing value from the other columns, preserving conditional relationships.</li>
    <li>Use <strong>multiple imputation</strong>: generate several imputed datasets, fit the model on each, and pool, so the extra uncertainty from imputation is propagated into your standard errors instead of being pretended away.</li>
    <li>For tree models like XGBoost/LightGBM, you can often leave NaNs in place; they learn a default split direction for missing values natively.</li>
  </ul>
  <p>One critical pipeline point: fit the imputer on the <strong>training fold only</strong> and apply it to validation/test, otherwise the test-set means leak into training and you overstate performance.</p>
</InterviewProblem>
<InterviewProblem question="Show that mean imputation deflates the estimated variance, and quantify by how much." difficulty="hard" tag="Math">
  <p>Take a column with <M>{"n"}</M> rows, of which <M>{"m"}</M> are observed and <M>{"n-m"}</M> are missing. Let the observed values have sample mean <M>{"\\bar{x}_{obs}"}</M> and we fill all missing entries with <M>{"\\bar{x}_{obs}"}</M>. The completed column has the same mean <M>{"\\bar{x}_{obs}"}</M> (the fills are at the mean, so they do not move it). Its variance, using the population-style divisor, is:</p>
  <MB>{"s^2_{imp} = \\frac{1}{n}\\left[\\sum_{i \\in obs}(x_i - \\bar{x}_{obs})^2 + \\sum_{i \\in miss}(\\bar{x}_{obs} - \\bar{x}_{obs})^2\\right]"}</MB>
  <p>The second sum is identically zero, so:</p>
  <MB>{"s^2_{imp} = \\frac{1}{n}\\sum_{i \\in obs}(x_i - \\bar{x}_{obs})^2 = \\frac{m}{n}\\, s^2_{obs}"}</MB>
  <p>where <M>{"s^2_{obs}"}</M> is the variance computed over just the observed values. So the imputed variance is the observed variance scaled by the observed fraction <M>{"m/n = (1-p)"}</M> for missing fraction <M>{"p"}</M>. With 30% missing, you keep only 70% of the true spread, a systematic underestimate that flows straight into deflated standard errors and overconfident inference.</p>
</InterviewProblem>
<InterviewProblem question="Implement a leak-free imputation pipeline that also adds missingness indicators, and explain why it is robust." difficulty="medium" tag="Coding">
  <p>The key ideas: fit the imputer inside a <M>{"\\texttt{Pipeline}"}</M> so it learns statistics only from training folds during cross-validation, and keep a binary flag for each imputed column so the model can exploit informative missingness.</p>
  <CodeBlock language="python" filename="impute_pipeline.py">{`import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

# add_indicator=True appends a binary "was missing" column per feature
num_imputer = SimpleImputer(strategy="median", add_indicator=True)

pre = ColumnTransformer(
    transformers=[("num", num_imputer, num_cols)],
    remainder="passthrough",
)

pipe = Pipeline([
    ("pre", pre),
    ("clf", RandomForestClassifier(n_estimators=300, random_state=0)),
])

# The imputer is re-fit on each training fold only, so test-fold
# statistics never leak into the medians used for imputation.
scores = cross_val_score(pipe, X, y, cv=5, scoring="roc_auc")
print(f"CV AUC: {scores.mean():.3f} +/- {scores.std():.3f}")
`}</CodeBlock>
  <p>Why it is robust:</p>
  <ul>
    <li><strong>No leakage:</strong> because the imputer lives in the pipeline, <M>{"\\texttt{cross\\_val\\_score}"}</M> refits it per fold; the median used to fill the held-out fold comes only from that fold&apos;s training rows.</li>
    <li><strong>Median over mean:</strong> robust to skew and outliers, which dominate many real columns (e.g. income, latency).</li>
    <li><strong>Indicators:</strong> if missingness is informative (common under MNAR), the model can use the flag directly instead of being misled by the filled value.</li>
    <li><strong>Reproducibility:</strong> the same fitted object transforms train and serve-time data identically, avoiding train/serve skew.</li>
  </ul>
</InterviewProblem>

      </>
  );
}
