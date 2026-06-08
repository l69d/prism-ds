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
      <p>A good chart is not decoration; it is an argument made visible. The choices you make about how to map numbers onto pixels decide what your reader sees first, trusts most, and remembers.</p>

      <KeyIdea>A visualization maps data values to visual channels. The whole game is choosing channels the eye reads accurately, and spending ink only where it carries information.</KeyIdea>

      <h2>Encoding: data to visual channels</h2>
      <p>Every value in your data must be turned into something visible: a position, a length, an angle, an area, or a color. These are <strong>visual channels</strong>, and the human eye is not equally good at decoding all of them.</p>
      <ul>
        <li><strong>Position on a common scale</strong> is read most accurately. This is why scatter plots and dot plots are so effective.</li>
        <li><strong>Length</strong> (bars) comes next, which is why bar charts beat pie charts.</li>
        <li><strong>Angle and area</strong> (pie slices, bubble sizes) are read poorly. We routinely misjudge them by large factors.</li>
        <li><strong>Color hue</strong> is great for categories but terrible for ordered magnitudes; use a sequential luminance ramp for quantities instead.</li>
      </ul>

      <h2>Data-ink: earn every pixel</h2>
      <p>Tufte&apos;s principle is that the ratio of ink devoted to data over total ink should be high. Gridlines, heavy borders, drop shadows, and 3D effects are usually <strong>chartjunk</strong> &mdash; they add cognitive load without adding meaning. Strip them until removing more would erase information.</p>

      <Basic>
        <p>Imagine describing your data to a friend across a noisy room. You would point at things (position), not whisper subtle shades of red. Pick the loudest, clearest signal: put the most important comparison on the axes, use bars for sizes, and reserve color for one or two meaningful groups. If a line, box, or gradient does not help your friend understand faster, erase it.</p>
      </Basic>

      <Advanced>
        <p>Cleveland and McGill ranked channels by measured decoding accuracy. A useful way to think about it: a channel introduces perceptual error, and Stevens&apos; power law says perceived magnitude relates to true magnitude as a power function.</p>
        <MB>{"\\psi(I) = k \\, I^{\\,a}"}</MB>
        <p>Here <M>{"\\psi"}</M> is perceived intensity and <M>{"I"}</M> is the actual stimulus. For length, the exponent <M>{"a \\approx 1"}</M> (near-faithful); for area, <M>{"a \\approx 0.7"}</M>, so a circle with twice the area is perceived as only about <M>{"2^{0.7} \\approx 1.6"}</M> times larger. That systematic underestimation is exactly why area-encoded charts mislead, and why you should size bubbles by area, never by radius.</p>
      </Advanced>

      <Callout kind="pitfall" title="The truncated bar axis">
        Bar length encodes magnitude, so a bar chart whose y-axis does not start at zero exaggerates differences and breaks the encoding. Line charts can start elsewhere because they encode change via position and slope, not length.
      </Callout>

      <CodeBlock language="python" filename="data_ink.py">{`import matplotlib.pyplot as plt

categories = ["A", "B", "C", "D"]
values = [23, 17, 35, 29]

fig, ax = plt.subplots()
ax.bar(categories, values, color="#4C78A8")

# Spend ink only on data: strip chartjunk
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)
ax.set_ylim(0, max(values) * 1.1)   # honest baseline at zero
ax.set_ylabel("count")
plt.tight_layout()
plt.show()`}</CodeBlock>

      <MoreDepth>
        <p>Channel effectiveness is task-dependent, not absolute. Position dominates for precise value comparison, but for spotting outliers or clusters at a glance, a well-chosen color or saturation channel can win because it triggers <strong>pre-attentive</strong> processing &mdash; the target pops out in roughly constant time regardless of how many items are on screen. Match the channel to the question the reader will ask, and remember accessibility: about 8% of men have red-green color deficiency, so never let hue alone carry critical meaning.</p>
      </MoreDepth>

      <Quiz question="You must show the precise difference in revenue across 12 products. Which encoding will let readers compare values most accurately?" options={[
        { text: "A pie chart, one slice per product", why: "Pie slices use angle and area, the least accurately decoded channels, especially with many similar values." },
        { text: "A bar chart with bars on a common zero baseline", correct: true, why: "Bars use length on a common scale, near the top of the perceptual accuracy ranking, and a zero baseline keeps the length encoding honest." },
        { text: "A bubble chart sized by revenue", why: "Area is decoded with an exponent near 0.7, so readers systematically underestimate larger values." },
        { text: "A single-hue heatmap colored by revenue", why: "Color magnitude is read imprecisely; it is good for patterns, not exact comparisons." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="Why are position and length better visual encodings than color hue or area for quantitative comparison?" difficulty="easy" tag="Conceptual">
  <p>Cleveland and McGill ranked elementary perceptual tasks by how accurately people decode them. The ordering, most to least accurate, is roughly:</p>
  <ul>
    <li><strong>Position</strong> on a common scale (e.g. dots aligned on one axis).</li>
    <li><strong>Length</strong> and position on non-aligned scales (bar charts).</li>
    <li><strong>Angle / slope</strong> (pie slices, line steepness).</li>
    <li><strong>Area</strong> (bubble size).</li>
    <li><strong>Volume, color saturation / hue</strong> (heatmaps, color-coded magnitude).</li>
  </ul>
  <p>People judge position to within a few percent, but estimate area with large systematic error: doubling a value often looks like a much smaller increase because the eye underweights area. Color hue is worse still because it is not perceptually ordered, your brain has no innate sense that orange is &quot;more than&quot; green. So for a quantitative comparison that must be read precisely, map the value to position or length (a dot plot or bar chart) and reserve color and area for categorical labels or secondary, approximate dimensions.</p>
</InterviewProblem>
<InterviewProblem question="A stakeholder shows a 3D pie chart of model error split across 7 customer segments and asks which segment is worst. Critique the chart and propose a better one." difficulty="medium" tag="Applied">
  <p>The 3D pie is close to the worst possible choice for this question. Problems:</p>
  <ul>
    <li><strong>Angle and area are weak encodings.</strong> Comparing 7 wedges by angle is far less accurate than comparing 7 bars by length, and viewers cannot reliably rank slices that are close in size.</li>
    <li><strong>3D perspective distorts magnitude.</strong> The tilt makes front slices look bigger than rear slices of equal value, so the &quot;worst&quot; segment may just be the one drawn in front. This is pure chartjunk that actively misleads.</li>
    <li><strong>No natural ordering.</strong> Pie slices around a circle have no sorted reading order, so the eye cannot scan from worst to best.</li>
  </ul>
  <p>Better: a <strong>horizontal bar chart sorted descending by error</strong>, one bar per segment, value labels at the bar ends. This uses length on a common baseline (the top perceptual encoding), the sort answers &quot;which is worst&quot; in one glance, and labels let the reader recover exact numbers. If you must show share-of-total as well, a sorted bar still beats a pie because it preserves both ranking and magnitude. Reserve pie charts for the rare case of 2-3 parts of an obvious whole.</p>
</InterviewProblem>
<InterviewProblem question="Define Tufte's data-ink ratio and explain why maximizing it blindly can hurt a chart." difficulty="medium" tag="Conceptual">
  <p>The data-ink ratio is the fraction of a graphic&apos;s ink (pixels) devoted to encoding actual data, versus decoration, redundant gridlines, heavy borders, and backgrounds:</p>
  <MB>{"\\text{data-ink ratio} = \\frac{\\text{ink used to represent data}}{\\text{total ink used in the graphic}}"}</MB>
  <p>Tufte&apos;s prescription is to maximize it: erase non-data ink and redundant data ink until removing more would lose information. This kills gradient fills, 3D bevels, and dark gridlines, leaving the data itself in focus.</p>
  <p>But pushed to the extreme it backfires. A small amount of &quot;redundant&quot; ink improves comprehension:</p>
  <ul>
    <li>Faint gridlines and reference lines let readers recover values and anchor comparisons.</li>
    <li>Direct labels on lines remove the cognitive cost of bouncing to a legend.</li>
    <li>Light shading or a benchmark band can encode context (a target, a normal range) that the bare data points cannot.</li>
  </ul>
  <p>So the real objective is not the maximum ratio but the maximum <strong>information transmitted per unit of reader effort</strong>. Remove ink that does not help decoding; keep ink that does, even when it is technically redundant.</p>
</InterviewProblem>
<InterviewProblem question="You must color-code a choropleth of disease incidence rates for a public dashboard. How do you choose the color scale, and what mistakes would you avoid?" difficulty="hard" tag="Case">
  <p>The key insight is that the data is <strong>sequential</strong> (a single magnitude from low to high), so the color scale must also be sequential and, critically, <strong>perceptually uniform</strong>: equal steps in the data should look like equal steps in color.</p>
  <ul>
    <li><strong>Use a perceptually uniform sequential scale</strong> such as viridis, magma, or a single-hue light-to-dark ramp. These vary monotonically in lightness, so the ordering survives grayscale printing and reads correctly to most color-vision-deficient viewers.</li>
    <li><strong>Avoid the rainbow / jet scale.</strong> It is not monotonic in lightness, so it manufactures false boundaries (the cyan-to-green band looks like a sharp edge) and hides real gradients (the yellow region looks uniform). It also fails for colorblind readers.</li>
    <li><strong>Do not use a diverging scale</strong> (red-white-blue) unless there is a meaningful midpoint such as deviation from a national average. Forcing a diverging palette on plain incidence implies a center that does not exist.</li>
    <li><strong>Normalize the quantity.</strong> Map incidence <M>{"\\textit{rate}"}</M> (cases per 100k), not raw counts, or the map just reproduces population density.</li>
    <li><strong>Choose classing carefully.</strong> Equal-interval bins are distorted by skew and outliers; quantile bins equalize area but can hide magnitude. State the binning and consider a continuous scale with a clear legend.</li>
    <li><strong>Account for the area-perception bias.</strong> Large rural regions dominate the visual field even at low rates; pair the choropleth with a population-weighted view (e.g. a cartogram or a bar chart) so geography does not overstate importance.</li>
  </ul>
  <p>In code, a defensible default with matplotlib:</p>
  <CodeBlock language="python" filename="choropleth.py">{`import matplotlib.pyplot as plt

# rate = cases per 100k, already computed per region
gdf.plot(
    column="rate",
    cmap="viridis",        # perceptually uniform, colorblind-safe, prints in grayscale
    scheme="quantiles",    # equal-count bins; state this in the caption
    k=5,
    legend=True,
    edgecolor="white",     # thin separators, not heavy borders (high data-ink ratio)
    linewidth=0.3,
)
plt.title("Disease incidence (cases per 100k)")
plt.axis("off")          # map frame ticks carry no information here
plt.show()`}</CodeBlock>
</InterviewProblem>

      </>
  );
}
