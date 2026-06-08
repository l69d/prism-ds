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
      <p>A chart is not decoration &mdash; it is an answer to a question. Before you pick a bar or a line, decide what you are actually asking of the data.</p>

      <KeyIdea>Pick the chart from the question, not the data type. Comparison, distribution, relationship, and trend each map to a small family of charts that the human eye can read accurately.</KeyIdea>

      <h2>Four questions, four families</h2>
      <p>Almost every everyday plot serves one of four intents. Naming the intent first eliminates most bad choices instantly.</p>
      <ul>
        <li><strong>Comparison</strong> &mdash; which category is bigger? Use a <strong>bar chart</strong>. Length along a common baseline is the most accurately decoded visual channel.</li>
        <li><strong>Distribution</strong> &mdash; how is one variable spread? Use a <strong>histogram</strong> or <strong>box plot</strong> to expose shape, center, and outliers.</li>
        <li><strong>Relationship</strong> &mdash; do two variables move together? Use a <strong>scatter plot</strong> to read correlation, clusters, and nonlinearity.</li>
        <li><strong>Trend</strong> &mdash; how does a value change over ordered time? Use a <strong>line chart</strong>, where connecting points implies continuity.</li>
      </ul>

      <h2>Why the eye matters</h2>
      <Basic><p>Some shapes are easy to judge and some are hard. People compare <strong>lengths</strong> and <strong>positions</strong> very accurately, but they are bad at comparing <strong>angles</strong> and <strong>areas</strong>. That is exactly why a bar chart usually beats a pie chart: it is hard to tell whether one pie slice is 22% or 27%, but trivial to see which bar is taller.</p></Basic>
      <Advanced><p>Cleveland and McGill ranked elementary perceptual tasks by accuracy: position on a common scale beats length, which beats angle, which beats area and color saturation. If a viewer must estimate a quantity <M>{"q"}</M> from a visual channel, the perceived value <M>{"\\hat{q}"}</M> follows Stevens&apos; power law:</p><MB>{"\\hat{q} = k\\,q^{\\,\\beta}"}</MB><p>For length <M>{"\\beta \\approx 1"}</M> (faithful), but for area <M>{"\\beta \\approx 0.7"}</M> and for volume <M>{"\\beta \\approx 0.6"}</M>, so large values are systematically underestimated. Encoding magnitude as area in a bubble chart bakes this bias into every reading.</p></Advanced>

      <Callout kind="pitfall" title="The pie chart trap">Pie charts force angle and area comparisons, the two least accurate channels. They only work passably for two or three parts that sum to a whole. For more than that, a sorted bar chart is almost always clearer.</Callout>

      <h2>A quick decision in code</h2>
      <CodeBlock language="python" filename="choose_chart.py">{`def choose_chart(question: str) -> str:
    rules = {
        "comparison": "bar chart (length on a common baseline)",
        "distribution": "histogram or box plot (shape + outliers)",
        "relationship": "scatter plot (correlation, clusters)",
        "trend": "line chart (ordered time on the x-axis)",
    }
    return rules.get(question, "clarify the question first")

# A line chart only makes sense if x is ordered and continuous.
print(choose_chart("trend"))   # line chart (ordered time on the x-axis)
print(choose_chart("comparison"))  # bar chart (length on a common baseline)`}</CodeBlock>

      <Callout kind="warning" title="Truncated axes mislead">A bar chart must start its value axis at zero, because the bar&apos;s length encodes the magnitude. A line chart may zoom the axis to reveal small movements, since it encodes change, not absolute size. Mixing these conventions is a classic way to deceive.</Callout>

      <MoreDepth><p>The four-family rule covers two-variable thinking; real datasets often need a third. Add dimensions in order of perceptual cost: a <strong>facet</strong> (small multiples) is read almost as accurately as the base chart, color hue handles a few categories, and only then reach for size or shape. Beware double-encoding noise &mdash; a heatmap of a correlation matrix is a relationship view, but if you sort its rows by a clustering, you have silently added a fifth question (grouping) that the reader must be told about.</p></MoreDepth>

      <Quiz question="You want to show how monthly revenue evolved over three years. Which chart fits the question best?" options={[
        { text: "A pie chart of each month's share", why: "Pie charts answer 'parts of a whole' and destroy the time ordering that a trend needs." },
        { text: "A line chart with months on the x-axis", correct: true, why: "Trend over ordered time is exactly what a line chart encodes; connecting points implies continuity." },
        { text: "A scatter plot of revenue vs. month index", why: "Scatter answers relationship between two variables; it omits the connecting line that makes a temporal trend legible." },
        { text: "A box plot of all monthly values", why: "A box plot summarizes a distribution and discards the time order entirely." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="You have a single numeric column (say, customer ages). A teammate makes a pie chart of it. What went wrong, and what would you use instead?" difficulty="easy" tag="Conceptual">
  <p>A pie chart encodes <strong>parts of a whole</strong> across a few categories. Age is a continuous variable, so there is no natural set of slices, and binning it into a pie destroys the shape of the data (skew, modes, outliers).</p>
  <p>The question being asked is about a <strong>distribution</strong>, so reach for:</p>
  <ul>
    <li><strong>Histogram</strong> &mdash; shows where mass concentrates and whether the data is multimodal.</li>
    <li><strong>Box plot or violin</strong> &mdash; compact summary of median, spread, and outliers; great when comparing the distribution across groups.</li>
    <li><strong>ECDF</strong> &mdash; reads off quantiles directly and is robust to bin-width choices.</li>
  </ul>
  <p>The general rule: first name the <strong>question</strong> (comparison, distribution, relationship, or trend), then pick the chart family that answers it. Pie charts only fit the narrow &quot;composition of one whole into a handful of parts&quot; case.</p>
</InterviewProblem>
<InterviewProblem question="A PM wants to show how monthly revenue changed over three years and asks for a bar chart. When is a line chart the better call, and why?" difficulty="medium" tag="Applied">
  <p>Both can show the values, but they signal different things about the data&apos;s structure.</p>
  <ul>
    <li><strong>Line chart</strong> is right here. Time is an ordered, continuous axis, and the line connects adjacent months so the eye reads the <strong>trend</strong> &mdash; slope, momentum, seasonality &mdash; which is exactly the &quot;how did it change&quot; question.</li>
    <li><strong>Bar chart</strong> emphasizes discrete, independent magnitudes you compare side by side (revenue by region this quarter). With 36 monthly bars the chart gets noisy and the connection between consecutive points is lost.</li>
  </ul>
  <p>Practical refinements:</p>
  <ul>
    <li>If they really care about month-to-month change rather than level, plot the <strong>delta</strong> or percent change &mdash; that may justify bars (including diverging bars around zero).</li>
    <li>Don&apos;t force the y-axis to start at zero for a line trend if it crushes the signal; do start bars at zero, since bar length encodes magnitude and a truncated axis is misleading.</li>
    <li>For strong seasonality, a 12-month rolling average overlaid on the raw line separates trend from cycle.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="You want to visualize the relationship between ad spend and conversions across 2 million rows. A scatter plot is a solid mush of overlapping points. How do you fix the chart, and what would make you switch to a different chart entirely?" difficulty="hard" tag="Case">
  <p>The scatter plot is the correct <strong>family</strong> &mdash; you&apos;re asking a relationship question between two numeric variables &mdash; but at this scale <strong>overplotting</strong> hides density: a region with a thousand points looks the same as one with ten.</p>
  <p>Fixes that keep the scatter intent:</p>
  <ul>
    <li><strong>Alpha blending</strong> (low opacity) so overlapping points accumulate into darker, denser regions.</li>
    <li><strong>2D binning</strong> &mdash; hexbin or a 2D histogram &mdash; which maps point density to color and scales to millions of rows.</li>
    <li><strong>Subsampling</strong> a random few thousand points, often enough to read the shape.</li>
    <li>Color by a <strong>local density estimate</strong> (KDE) and add a fitted trend line or LOWESS to summarize the relationship.</li>
  </ul>
  <p>Switch charts entirely when the underlying question changes:</p>
  <ul>
    <li>If one variable is really categorical (spend bucket), the question becomes &quot;compare conversion distributions across buckets&quot; &mdash; use grouped box/violin plots.</li>
    <li>If you only care about the summary trend, a <strong>binned line</strong> (mean conversions per spend decile with confidence bands) is far more legible than 2M dots.</li>
  </ul>
  <CodeBlock language="python" filename="density_chart.py">{`import numpy as np
import matplotlib.pyplot as plt

# 2M-row relationship: hexbin beats a raw scatter when points overlap
spend = np.random.gamma(2.0, 50.0, size=2_000_000)
conv  = 0.4 * spend + np.random.normal(0, 30, size=spend.size)

fig, ax = plt.subplots()
hb = ax.hexbin(spend, conv, gridsize=60, cmap="viridis", bins="log")
fig.colorbar(hb, label="log10(count)")  # density, not just points

# Summarize the trend: mean conv per spend decile
deciles = np.quantile(spend, np.linspace(0, 1, 11))
centers = 0.5 * (deciles[:-1] + deciles[1:])
means = [conv[(spend >= lo) & (spend < hi)].mean()
         for lo, hi in zip(deciles[:-1], deciles[1:])]
ax.plot(centers, means, color="white", marker="o", label="decile mean")
ax.set_xlabel("ad spend"); ax.set_ylabel("conversions"); ax.legend()`}</CodeBlock>
</InterviewProblem>
<InterviewProblem question="Your model outputs a 12x12 confusion matrix and you must show it to stakeholders. Why is a heatmap usually the right encoding, and what is the most common mistake people make with it?" difficulty="medium" tag="Conceptual">
  <p>A confusion matrix is a 2D table of counts indexed by (true class, predicted class). The question is &quot;where does the model confuse classes?&quot; &mdash; a <strong>relationship over a grid</strong>. A heatmap maps each cell&apos;s value to color, so off-diagonal hot spots immediately reveal which class pairs get mixed up. Bars or lines can&apos;t show a 12x12 grid compactly.</p>
  <p>The most common mistake is showing <strong>raw counts</strong> when classes are imbalanced: a populous class lights up the whole map and a rare-but-badly-misclassified class stays invisible. Fix it by <strong>normalizing each row</strong> so cell <M>{"(i,j)"}</M> shows <M>{"P(\\hat{y}=j \\mid y=i)"}</M>:</p>
  <MB>{"C^{\\text{norm}}_{ij} = \\frac{C_{ij}}{\\sum_{k} C_{ik}}"}</MB>
  <p>Now every row sums to 1, the diagonal reads as per-class recall, and color is comparable across classes regardless of support. Other good practices: use a <strong>sequential</strong> (not rainbow) colormap so magnitude is monotonic, and annotate cells with the numeric value for precise reading.</p>
</InterviewProblem>

      </>
  );
}
