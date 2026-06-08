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
    </>
  );
}
