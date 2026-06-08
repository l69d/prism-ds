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
      <p>Most hypothesis tests are the same machine wearing different clothes: compute a statistic, compare it to what randomness alone would produce, and report how surprised you should be. The art is matching the test to your data&apos;s shape.</p>

      <KeyIdea>Pick a test by answering three questions: What kind of outcome am I measuring (numeric or categorical)? How many groups am I comparing? And do my data satisfy the test&apos;s assumptions (mainly normality and equal variance)?</KeyIdea>

      <h2>The decision tree</h2>
      <p>Trace your problem down these branches and the right test usually falls out:</p>
      <ul>
        <li><strong>Numeric outcome, one or two groups:</strong> a <strong>t-test</strong>. One-sample vs a fixed value, two-sample for independent groups, paired for before/after measurements on the same units.</li>
        <li><strong>Numeric outcome, three or more groups:</strong> <strong>ANOVA</strong> (analysis of variance), which generalizes the t-test and avoids inflating error from many pairwise comparisons.</li>
        <li><strong>Categorical outcome, counts in a table:</strong> the <strong>chi-square</strong> test of independence or goodness-of-fit.</li>
        <li><strong>Assumptions violated</strong> (skewed data, outliers, small samples): switch to a <strong>non-parametric</strong> test — Mann-Whitney U replaces the two-sample t-test, Wilcoxon signed-rank the paired t-test, and Kruskal-Wallis the one-way ANOVA.</li>
      </ul>

      <Basic>
        <p>Think of a test as a skeptic. It assumes nothing interesting is happening (the null hypothesis) and asks: &quot;If that were true, how often would I see a difference this big just by luck?&quot; That probability is the p-value. A small p-value means luck is a poor explanation, so you lean toward a real effect. The reason there are many tests is that &quot;a difference this big by luck&quot; is computed differently for averages, for spreads across many groups, and for counts in categories.</p>
      </Basic>

      <Advanced>
        <p>The two-sample t-statistic measures the gap between means relative to its standard error:</p>
        <MB>{"t = \\frac{\\bar{x}_1 - \\bar{x}_2}{s_p \\sqrt{\\tfrac{1}{n_1} + \\tfrac{1}{n_2}}}"}</MB>
        <p>One-way ANOVA instead forms an F-ratio of between-group to within-group variance, <M>{"F = \\text{MS}_{\\text{between}} / \\text{MS}_{\\text{within}}"}</M>. Chi-square sums squared deviations of observed from expected counts, <M>{"\\chi^2 = \\sum (O_i - E_i)^2 / E_i"}</M>. Each statistic has a known reference distribution under the null, so the p-value is just a tail area. Non-parametric tests replace raw values with ranks, trading some power for freedom from the normality assumption.</p>
      </Advanced>

      <Callout kind="pitfall" title="Running many t-tests instead of one ANOVA">
        Comparing every pair of four groups means six t-tests, and at the 5% level the chance of at least one false positive climbs toward 26%. ANOVA gives one omnibus test; only after it is significant should you do corrected pairwise comparisons (e.g. Tukey&apos;s HSD).
      </Callout>

      <h2>In practice</h2>
      <p>Before reaching for a t-test, glance at a histogram and check group variances. With large samples the t-test is robust to mild non-normality (thanks to the Central Limit Theorem); with tiny, skewed samples a non-parametric test is safer.</p>

      <CodeBlock language="python" filename="choose_test.py">{`from scipy import stats

# Two independent groups, numeric outcome
t, p = stats.ttest_ind(group_a, group_b, equal_var=False)  # Welch's t-test

# Three or more groups -> one-way ANOVA
f, p = stats.f_oneway(g1, g2, g3)

# Categorical: counts in a contingency table
chi2, p, dof, expected = stats.chi2_contingency(table)

# Assumptions broken? Use ranks instead
u, p = stats.mannwhitneyu(group_a, group_b)        # vs two-sample t
h, p = stats.kruskal(g1, g2, g3)                    # vs one-way ANOVA
`}</CodeBlock>

      <MoreDepth>
        <p>A significant test answers &quot;is there an effect?&quot; but not &quot;how big?&quot; Always pair the p-value with an effect size (Cohen&apos;s d, eta-squared, Cramer&apos;s V) and a confidence interval. With huge n, trivial differences become &quot;significant&quot;; with tiny n, real effects stay invisible. Also prefer Welch&apos;s t-test by default — it does not assume equal variances and loses almost nothing when they are equal, making the classic equal-variance t-test rarely worth the extra assumption.</p>
      </MoreDepth>

      <Quiz question="You compare the average conversion time across five different website designs. Each design has a roughly normal, similar-variance sample. Which test is the right first step?" options={[
        { text: "Ten separate two-sample t-tests, one per design pair", why: "Ten tests at 5% inflate the family-wise false-positive rate well above 5%; that is exactly what ANOVA avoids." },
        { text: "A one-way ANOVA", correct: true, why: "Numeric outcome across 3+ groups meeting normality and equal-variance assumptions is the textbook ANOVA case; pairwise comparisons come after, with correction." },
        { text: "A chi-square test of independence", why: "Chi-square is for categorical counts in a table, not for comparing means of a numeric outcome." },
        { text: "A Kruskal-Wallis test", why: "That is the non-parametric fallback; with normal, equal-variance data ANOVA is more powerful and is the natural first choice." },
      ]} />
    </>
  );
}
