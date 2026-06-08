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
    <h2>Interview practice</h2>
<InterviewProblem question="You want to know whether average session time differs between two website variants in an A/B test. Walk through how you choose a test, and when a t-test is the wrong choice." difficulty="easy" tag="Conceptual">
  <p>The default for comparing two group means is the <strong>two-sample t-test</strong>. Walking the decision tree:</p>
  <ul>
    <li><strong>Outcome type:</strong> session time is continuous, so a mean-comparison test is appropriate (not chi-square, which is for counts/categories).</li>
    <li><strong>Number of groups:</strong> exactly two independent groups, so t-test rather than ANOVA.</li>
    <li><strong>Independence:</strong> A/B users are randomized and distinct, so the two-sample (unpaired) version applies. If we measured the same users before and after, we&apos;d use a paired t-test.</li>
    <li><strong>Variance:</strong> prefer <strong>Welch&apos;s t-test</strong> (unequal variances) by default; it costs almost nothing when variances are equal and protects you when they are not.</li>
  </ul>
  <p>When the t-test is the wrong choice: session time is usually <strong>right-skewed</strong> with a long tail. With small samples the t-test&apos;s normality assumption bites, and the mean is dominated by a few huge sessions. Better options are a <strong>Mann-Whitney U test</strong> (compares distributions/medians without normality) or a t-test on <M>{"\\log(\\text{time})"}</M>. With large <M>{"n"}</M> the CLT rescues the t-test even under skew, so the fix matters most for small samples.</p>
</InterviewProblem>
<InterviewProblem question="When do you use a chi-square test, and what is the difference between the goodness-of-fit and test-of-independence variants?" difficulty="medium" tag="Conceptual">
  <p>Chi-square tests work on <strong>categorical counts</strong>, not means. Both variants compare observed counts <M>{"O_i"}</M> to expected counts <M>{"E_i"}</M> under a null hypothesis using the same statistic:</p>
  <MB>{"\\chi^2 = \\sum_i \\frac{(O_i - E_i)^2}{E_i}"}</MB>
  <ul>
    <li><strong>Goodness-of-fit:</strong> one categorical variable. Does the observed distribution match a hypothesized one? Example: are dice rolls uniform? Expected counts come from the hypothesized proportions; degrees of freedom are <M>{"k-1"}</M> for <M>{"k"}</M> categories.</li>
    <li><strong>Test of independence:</strong> two categorical variables in a contingency table. Are they associated? Example: is plan tier independent of churn? Expected counts are <M>{"E_{ij} = \\frac{(\\text{row}_i)(\\text{col}_j)}{N}"}</M>, and degrees of freedom are <M>{"(r-1)(c-1)"}</M>.</li>
  </ul>
  <p>Key caveats interviewers probe: the test is for counts (never percentages), it assumes independent observations, and the chi-square approximation breaks when expected cells are small. A common rule is that all <M>{"E_i \\ge 5"}</M>; for a 2x2 table with small expected counts, switch to <strong>Fisher&apos;s exact test</strong>.</p>
</InterviewProblem>
<InterviewProblem question="A teammate ran ANOVA across 4 treatment groups, got p = 0.03, and concluded group A beats group D. What is wrong, and what would you do instead?" difficulty="medium" tag="Applied">
  <p>Two problems. First, a one-way <strong>ANOVA is an omnibus test</strong>: its null is that <em>all</em> group means are equal. A significant result tells you at least one group differs, but <strong>not which pair</strong>. Concluding A beats D specifically is not supported by the F-test alone.</p>
  <p>Second, naively running all <M>{"\\binom{4}{2}=6"}</M> pairwise t-tests inflates the family-wise error rate. With 6 independent tests at <M>{"\\alpha=0.05"}</M>:</p>
  <MB>{"P(\\text{at least one false positive}) = 1 - (1-0.05)^6 \\approx 0.26"}</MB>
  <p>What I&apos;d do: follow the significant ANOVA with a <strong>post-hoc test that controls for multiplicity</strong>, such as <strong>Tukey&apos;s HSD</strong> for all pairwise comparisons, or Bonferroni/Holm correction if only a few planned comparisons matter. I&apos;d also check ANOVA&apos;s assumptions (roughly normal residuals, equal variances); if variances differ, use Welch&apos;s ANOVA, and if normality is badly violated use the non-parametric <strong>Kruskal-Wallis test</strong> followed by Dunn&apos;s test.</p>
</InterviewProblem>
<InterviewProblem question="Implement a decision helper that recommends a test given the outcome type, number of groups, and whether samples are paired. Show how a normality check changes the recommendation." difficulty="hard" tag="Coding">
  <p>The core logic encodes the decision tree: categorical outcomes go to chi-square; continuous outcomes branch on the number of groups and the pairing/normality flags.</p>
  <CodeBlock language="python" filename="choose_test.py">{`from scipy import stats

def recommend_test(outcome, n_groups, paired=False, normal=True):
    """outcome: 'categorical' or 'continuous'."""
    if outcome == "categorical":
        return "chi-square (independence or goodness-of-fit)"
    # continuous outcome from here
    if n_groups == 2:
        if paired:
            return "paired t-test" if normal else "Wilcoxon signed-rank"
        return "Welch's t-test" if normal else "Mann-Whitney U"
    # 3+ groups
    return "one-way ANOVA + Tukey HSD" if normal else "Kruskal-Wallis + Dunn"

# Let the data decide 'normal' via Shapiro-Wilk on each group
def is_normal(*groups, alpha=0.05):
    # small p => reject normality
    return all(stats.shapiro(g).pvalue > alpha for g in groups)

a = [12.1, 11.8, 13.0, 12.5, 200.0]   # one huge outlier => skew
b = [10.2, 9.9, 11.1, 10.7, 10.0]
print(recommend_test("continuous", 2, paired=False, normal=is_normal(a, b)))
# -> Mann-Whitney U  (Shapiro rejects normality for group a)`}</CodeBlock>
  <p>Points to make in the interview: <strong>let assumptions drive the branch</strong> rather than always defaulting to a t-test. Shapiro-Wilk is fine for small samples but becomes hypersensitive at large <M>{"n"}</M> (it will flag trivial non-normality), so for big samples lean on the CLT and on plots/effect sizes instead of a normality p-value. Always pair the chosen test with an <strong>effect size and confidence interval</strong>, since statistical significance alone does not establish practical importance.</p>
</InterviewProblem>

      </>
  );
}
