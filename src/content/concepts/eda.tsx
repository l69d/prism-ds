"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { CodeBlock } from "@/components/content/code-block";
import { Quiz } from "@/components/content/quiz";
import { CorrelationExplorer } from "@/components/viz/correlation-explorer";

export default function EdaContent() {
  return (
    <>
      <p>
        Exploratory Data Analysis (EDA) is the first hour you spend with any dataset — before
        a single model. The goal is simple: <strong>understand what you&apos;re holding</strong> so
        that every later decision (cleaning, features, model choice) is informed rather than guessed.
      </p>

      <KeyIdea>
        Models can only ever be as good as your understanding of the data. EDA is where you
        find the broken column, the suspicious spike, and the relationship that becomes your
        best feature — long before the model would have failed silently on them.
      </KeyIdea>

      <h2>The four questions EDA answers</h2>
      <p>Every good exploration loops over four questions about each column and each pair of columns:</p>
      <ul>
        <li><strong>Shape</strong> — what does the distribution look like? Symmetric, skewed, bimodal, spiky?</li>
        <li><strong>Center &amp; spread</strong> — where do values sit and how far do they vary?</li>
        <li><strong>Relationships</strong> — how do columns move together?</li>
        <li><strong>Oddities</strong> — missing values, impossible values, outliers, duplicates.</li>
      </ul>

      <Basic>
        <p>
          You don&apos;t need fancy statistics to start. Plot a histogram of every numeric column
          and a bar chart of every category. Your eyes will catch most problems faster than any
          summary number — a column that should be positive but isn&apos;t, two values where you
          expected a smooth curve, a giant bar for &quot;unknown&quot;.
        </p>
      </Basic>
      <Advanced>
        <p>
          Quantify shape with the <strong>third and fourth moments</strong>: skewness measures
          asymmetry, excess kurtosis measures tail-heaviness. Prefer <strong>robust statistics</strong>
          (median, IQR, MAD) when tails are heavy — a single outlier can dominate the mean and
          variance. Compare the mean and median: a large gap is an instant skew detector.
        </p>
      </Advanced>

      <h2>Why you must plot, not just summarize</h2>
      <p>
        The most important lesson in all of EDA: <strong>summary statistics can be identical for
        completely different data</strong>. Toggle to Anscombe&apos;s Quartet below — four datasets
        with the same mean, variance, correlation, and regression line, yet one is a clean line,
        one is a curve, one has a single outlier driving everything, and one is a vertical strip.
      </p>

      <CorrelationExplorer />

      <Callout kind="pitfall" title="Statistics without a plot will fool you">
        A correlation of 0.82 sounds strong — but it could be a tidy linear trend <em>or</em> a
        single leverage point dragging the line. Always look at the scatter before you trust the number.
      </Callout>

      <h2>A repeatable EDA checklist</h2>
      <ol>
        <li>Shape &amp; size: rows, columns, dtypes, memory.</li>
        <li>Missingness: how much, and is it random or structured?</li>
        <li>Univariate: a histogram / bar for every column.</li>
        <li>Bivariate: correlations, scatter plots, group-by summaries vs the target.</li>
        <li>Sanity: ranges, units, duplicates, impossible values.</li>
      </ol>

      <CodeBlock language="python" filename="quick_eda.py">{`import pandas as pd

df = pd.read_csv("data.csv")

# 1. shape & types
print(df.shape)
df.info()

# 2. missingness, sorted
print((df.isna().mean() * 100).round(1).sort_values(ascending=False))

# 3. univariate summaries
df.describe(include="all").T

# 4. relationships with the target
df.corr(numeric_only=True)["target"].sort_values()

# 5. ALWAYS plot
df.hist(figsize=(12, 8), bins=30)`}</CodeBlock>

      <MoreDepth>
        <p>
          Two senior-level traps live inside EDA itself:
        </p>
        <ul>
          <li>
            <strong>Simpson&apos;s paradox</strong> — a trend that holds in aggregate can reverse
            within every subgroup. Always check whether a relationship survives conditioning on
            an obvious confounder.
          </li>
          <li>
            <strong>Data leakage during exploration</strong> — if you peek at the test set, or
            engineer features using statistics computed over the full dataset, you leak future
            information. Split first, explore the training set, and treat the test set as if it
            doesn&apos;t exist yet.
          </li>
        </ul>
      </MoreDepth>

      <Quiz
        question="Two columns have a Pearson correlation of 0.0. What can you safely conclude?"
        options={[
          { text: "They are independent.", why: "Zero linear correlation does not imply independence." },
          { text: "There is no linear relationship — but there could still be a strong non-linear one (e.g. a parabola).", correct: true, why: "Pearson only measures the linear component. Always plot." },
          { text: "One causes the other.", why: "Correlation never establishes causation, and here it's even zero." },
          { text: "The data is clean.", why: "Correlation says nothing about data quality." },
        ]}
      />
    </>
  );
}
