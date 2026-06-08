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
    </>
  );
}
