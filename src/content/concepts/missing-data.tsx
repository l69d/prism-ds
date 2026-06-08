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
    </>
  );
}
