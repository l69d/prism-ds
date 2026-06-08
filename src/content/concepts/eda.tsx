"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { CodeBlock } from "@/components/content/code-block";
import { Quiz } from "@/components/content/quiz";
import { CorrelationExplorer } from "@/components/viz/correlation-explorer";
import { InterviewProblem } from "@/components/content/interview-problem";
import { M, MB } from "@/components/content/math";

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
    <h2>Interview practice</h2>
<InterviewProblem question="Walk me through your EDA checklist for a brand-new dataset. What do you look at in the first hour?" difficulty="easy" tag="Conceptual">
  <p>A good answer is a repeatable routine, not a grab-bag. Go from coarse to fine:</p>
  <ul>
    <li><strong>Shape and types.</strong> Row and column counts, dtype of each column, and memory footprint. Are categoricals stored as strings, dates as text, IDs as floats? This catches schema surprises before they cost you.</li>
    <li><strong>Missingness.</strong> Per-column null rates and, crucially, the <strong>pattern</strong> of nulls. Are they missing completely at random, or clustered in certain rows or time windows? Missingness is often a signal, not noise.</li>
    <li><strong>Univariate distributions.</strong> For each numeric column: center, spread, shape, tails. For each categorical: cardinality and the frequency of the top levels. Flag constant columns and near-duplicate columns.</li>
    <li><strong>Bivariate and target relationships.</strong> Correlation heatmap for numerics, grouped summaries against the target. This is where leakage and the strongest predictors first show up.</li>
    <li><strong>Sanity and surprises.</strong> Duplicate rows, impossible values (negative ages, future dates), sentinel codes like <M>{"-999"}</M> masquerading as numbers, and unit mismatches.</li>
  </ul>
  <p>The point of the checklist is that you cover the same ground every time, so you never ship a model on data you never actually looked at.</p>
</InterviewProblem>
<InterviewProblem question="You compute the mean of a feature and it looks reasonable, but the model underperforms. How can a summary statistic lie, and what do you check instead?" difficulty="medium" tag="Conceptual">
  <p>A single number compresses a whole distribution, so it hides anything the distribution does beyond its center. Common ways the mean misleads:</p>
  <ul>
    <li><strong>Skew and tails.</strong> Income, latency, and counts are right-skewed; the mean sits well above the typical value. Compare mean to median: a large gap signals skew, and you should report the median plus a few quantiles instead.</li>
    <li><strong>Multimodality.</strong> Two clusters at <M>{"10"}</M> and <M>{"90"}</M> average to <M>{"50"}</M>, a value almost no record actually takes. Only a histogram or density plot reveals this.</li>
    <li><strong>Outliers and sentinels.</strong> A handful of <M>{"-999"}</M> placeholders or data-entry errors drag the mean; the median barely moves.</li>
    <li><strong>Mixed populations.</strong> The overall mean can hide opposite behavior in subgroups (the Simpson trap).</li>
  </ul>
  <p>So never trust center alone. Look at the full picture, center, spread, shape, and tails:</p>
  <CodeBlock language="python" filename="describe.py">{`import numpy as np

def profile(x):
    x = np.asarray(x, dtype=float)
    x = x[~np.isnan(x)]
    q = np.percentile(x, [1, 25, 50, 75, 99])
    return {
        "mean": x.mean(),
        "median": q[2],
        "std": x.std(ddof=1),
        "iqr": q[3] - q[1],          # robust spread
        "p1_p99": (q[0], q[4]),      # tail behavior
        "skew_hint": x.mean() - q[2],  # mean minus median
    }`}</CodeBlock>
  <p>If <strong>mean</strong> and <strong>median</strong> diverge, or the IQR is tiny while the p1/p99 range is huge, the mean was lying and you likely need a transform (log), winsorizing, or subgroup analysis.</p>
</InterviewProblem>
<InterviewProblem question="A drug appears to help patients in the overall data, but when you split by disease severity it hurts in both the mild group and the severe group. What is going on and how do you catch it during EDA?" difficulty="hard" tag="Case">
  <p>This is <strong>Simpson&apos;s paradox</strong>: an association that reverses sign once you condition on a confounder. It happens because the grouping variable (severity) is correlated with both the treatment assignment and the outcome.</p>
  <p>Concretely, suppose severe patients are both <strong>more likely to get the drug</strong> and <strong>more likely to do badly regardless of treatment</strong>. Pooling the groups lets the &quot;drug&quot; column act as a proxy for &quot;was severe,&quot; so the drug inherits the bad baseline of severe cases, or the reverse, depending on how the mixing weights fall. The aggregate trend is then a weighted blend that need not match either within-group trend.</p>
  <p>Make the mechanism explicit. Within group <M>{"g"}</M> the treatment effect is the difference in conditional means, but the pooled difference also carries a composition term:</p>
  <MB>{"\\Delta_{\\text{pooled}} = \\underbrace{\\sum_g w_g\\,\\Delta_g}_{\\text{within-group effect}} + \\underbrace{\\text{(differences in group mix between treated and control)}}_{\\text{confounding term}}"}</MB>
  <p>When the confounding term dominates, <M>{"\\Delta_{\\text{pooled}}"}</M> can flip sign relative to every <M>{"\\Delta_g"}</M>.</p>
  <p>How to catch it during EDA:</p>
  <ul>
    <li><strong>Always disaggregate.</strong> Before reporting any headline effect, recompute it within plausible confounders (severity, region, time, device). If the sign or magnitude changes, you have found a trap.</li>
    <li><strong>Check the assignment balance.</strong> Cross-tabulate treatment against the suspected confounder. Imbalance (severe patients over-represented in one arm) is the red flag.</li>
    <li><strong>Trust the stratified estimate.</strong> The within-group effects answer the causal question; the pooled number is contaminated. Report the within-severity effects, or use a model that adjusts for severity.</li>
  </ul>
  <CodeBlock language="python" filename="simpson_check.py">{`import pandas as pd

# Overall effect can mislead; stratify by the confounder
overall = df.groupby("treated")["recovered"].mean()
print("Pooled:", overall[1] - overall[0])

by_sev = (df.groupby(["severity", "treated"])["recovered"]
            .mean().unstack())
by_sev["within_effect"] = by_sev[1] - by_sev[0]
print(by_sev)

# Red flag: assignment is not balanced across the confounder
print(pd.crosstab(df["severity"], df["treated"], normalize="index"))`}</CodeBlock>
  <p>The lesson: EDA is not just plotting one variable at a time. A relationship is only trustworthy once you have checked it holds within the subgroups that could explain it away.</p>
</InterviewProblem>
<InterviewProblem question="Given a numeric column, how would you decide whether a value is a genuine outlier you should investigate versus expected heavy-tail behavior?" difficulty="medium" tag="Applied">
  <p>The mistake is applying one rule blindly. The right move depends on the shape of the distribution.</p>
  <ul>
    <li><strong>If the column is roughly symmetric,</strong> the z-score rule is reasonable: flag points beyond about <M>{"3"}</M> standard deviations. But the mean and std are themselves inflated by outliers, so prefer a robust version using the median and MAD: flag when <M>{"|x_i - \\operatorname{median}| / (1.4826\\,\\text{MAD}) > 3.5"}</M>.</li>
    <li><strong>If the column is skewed</strong> (income, durations, counts), a symmetric rule will flag half the right tail as &quot;outliers&quot; even though that tail is real. Use the IQR rule, points outside <M>{"[Q_1 - 1.5\\,\\text{IQR},\; Q_3 + 1.5\\,\\text{IQR}]"}</M>, or transform first (log) and then assess on the transformed scale where the bulk looks symmetric.</li>
    <li><strong>Always ask whether it is a data error or a real extreme.</strong> A sentinel like <M>{"-999"}</M>, an impossible value, or a unit slip (grams logged as kilograms) is a defect to fix. A genuine whale customer or a flash-crash tick is real signal you must model, not delete.</li>
  </ul>
  <p>So the decision rule is: pick the flagging method that matches the distribution&apos;s shape, then triage each flagged point by <strong>plausibility</strong>, not just by how far it sits from the center. Heavy tails are a property to respect; errors are a property to remove.</p>
</InterviewProblem>

      </>
  );
}
