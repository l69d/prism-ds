"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { CodeBlock } from "@/components/content/code-block";
import { Quiz } from "@/components/content/quiz";
import { InterviewProblem } from "@/components/content/interview-problem";
import { M } from "@/components/content/math";

export default function Lesson() {
  return (
    <>
      <p>
        A chart is not the same as a story. A chart shows data; a story uses
        structure, annotation, and visual emphasis to walk a reader from
        confusion to a single, defensible conclusion.
      </p>

      <KeyIdea>
        Your job is not to display every number you have &mdash; it is to lead
        the eye to one insight and make the &quot;so what&quot; impossible to miss.
      </KeyIdea>

      <h2>The three levers</h2>
      <p>
        Effective data storytelling rests on three levers you control on top of
        the raw plot:
      </p>
      <ul>
        <li>
          <strong>Structure</strong> &mdash; the order in which ideas arrive.
          Context first (what are we looking at?), then the conflict (what
          changed or surprised us?), then the resolution (the takeaway).
        </li>
        <li>
          <strong>Annotation</strong> &mdash; words on the chart. A direct label
          beats a legend; a one-line title that states the conclusion
          (&quot;Churn doubled after the price change&quot;) beats a neutral one
          (&quot;Monthly churn&quot;).
        </li>
        <li>
          <strong>Leading the eye</strong> &mdash; using pre-attentive
          attributes (color, size, position) so the most important mark is seen
          before the reader consciously reads anything.
        </li>
      </ul>

      <Basic>
        <p>
          Imagine handing someone a line chart with twelve colored series and a
          legend. They squint, decode the legend, and give up. Now imagine the
          same chart with eleven lines in soft gray and one line in bold orange,
          labeled directly at its end, under a title that names the punchline.
          They get it in two seconds. Nothing about the data changed &mdash; you
          just decided <strong>where their attention should go</strong> and
          removed everything competing for it.
        </p>
      </Basic>

      <Advanced>
        <p>
          The mechanism is pre-attentive processing: the visual system encodes
          attributes like hue, luminance contrast, and spatial position in
          parallel within roughly 200&ndash;250 ms, before focused attention
          engages. A single deviant mark in a field of identical ones
          &quot;pops out&quot; with search time nearly independent of the number
          of distractors, whereas a target defined by a <em>conjunction</em> of
          features (e.g. &quot;the red <em>and</em> large one&quot;) forces serial
          search whose cost grows with set size. Practically: encode the one
          thing that matters with a single strong, unique channel, and keep
          everything else low-contrast so it recedes into context rather than
          competing.
        </p>
      </Advanced>

      <Callout kind="pitfall" title="Decoration is not annotation">
        Adding 3D bars, gradients, and chartjunk does not help the reader &mdash;
        it adds non-data ink that dilutes the signal. Annotation explains the
        data (an arrow pointing at the spike with the cause); decoration just
        competes with it.
      </Callout>

      <h2>Doing it in code</h2>
      <p>
        Storytelling is mostly subtraction plus a little targeted emphasis. The
        pattern below mutes the context and spotlights one series.
      </p>

      <CodeBlock language="python" filename="spotlight.py">{`import matplotlib.pyplot as plt

# series is a dict: name -> y-values, x is shared
hero = "Region B"
fig, ax = plt.subplots(figsize=(8, 4))

for name, y in series.items():
    is_hero = name == hero
    ax.plot(
        x, y,
        color="#E8612C" if is_hero else "#CCCCCC",
        linewidth=2.5 if is_hero else 1.0,
        zorder=3 if is_hero else 1,
    )
    # direct label at the line end, no legend needed
    ax.text(x[-1], y[-1], f"  {name}",
            color="#E8612C" if is_hero else "#999999",
            fontweight="bold" if is_hero else "normal",
            va="center")

# title states the conclusion, not the dimensions
ax.set_title("Region B churn doubled after the May price change", loc="left")
ax.spines[["top", "right"]].set_visible(False)  # remove non-data ink
plt.show()`}</CodeBlock>

      <Callout kind="insight" title="Title = thesis">
        If a stakeholder reads only the chart title and walks away, they should
        still leave with the correct conclusion. Treat the title as your
        one-sentence argument, not a label for the axes.
      </Callout>

      <MoreDepth>
        <p>
          Audience and medium reshape the structure. A <em>live presentation</em>
          can use the Minto/SCQA arc &mdash; build tension, then reveal &mdash;
          because you control pacing. A <em>standalone report or dashboard</em>
          is read non-linearly and asynchronously, so it must front-load the
          conclusion (BLUF: bottom line up front) and make every chart legible
          out of context. The same finding therefore wants opposite information
          ordering depending on whether you are in the room. Senior analysts
          decide the medium <em>first</em>, then design the narrative arc, rather
          than reusing one deck everywhere.
        </p>
      </MoreDepth>

      <Quiz
        question="You have a line chart comparing 10 products, but the story is about one product's collapse. What single change most improves it?"
        options={[
          { text: "Add a 3D effect and a gradient background to make it pop", why: "That is decoration / chartjunk; it adds non-data ink and competes with the signal instead of guiding the eye." },
          { text: "Gray out the other nine lines, color and directly label the one product, and retitle the chart with the conclusion", correct: true, why: "This uses pre-attentive emphasis plus structure and annotation so the key insight is seen instantly and named explicitly." },
          { text: "Increase the number of gridlines so values are easier to read precisely", why: "More gridlines add clutter and precision the story does not need; the goal is the comparison, not exact readouts." },
          { text: "Add a legend with all 10 product names in distinct colors", why: "Ten competing colors plus a legend force slow serial decoding and bury the one series that matters." },
        ]}
      />
    <h2>Interview practice</h2>
<InterviewProblem question="What does it mean to lead the eye to the insight in a chart, and name three pre-attentive cues you can use to do it?" difficulty="easy" tag="Conceptual">
  <p><strong>Leading the eye</strong> means designing a visual so the single most important comparison is the first thing a viewer notices, before they consciously read anything. You exploit <strong>pre-attentive attributes</strong> &mdash; features the visual cortex processes in under ~250ms, in parallel, without scanning.</p>
  <ul>
    <li><strong>Color/hue saturation</strong> &mdash; gray out everything except the one series that carries the message. The single saturated line reads as &quot;look here&quot;.</li>
    <li><strong>Position &amp; alignment</strong> &mdash; sorting bars by value (not alphabetically) turns &quot;which is biggest&quot; into a glance instead of a search.</li>
    <li><strong>Size/weight</strong> &mdash; a thicker line, a larger point, or bolder type encodes importance directly.</li>
  </ul>
  <p>Others include orientation, enclosure (a box around a region), and added marks (a direct label or arrow on the point that matters). The rule of thumb: <strong>de-emphasize the context, emphasize the one thing</strong>. If everything is highlighted, nothing is.</p>
</InterviewProblem>
<InterviewProblem question="Stakeholders are confused by a dashboard with 14 KPIs and a pie chart of 9 categories. How would you restructure it to actually tell a story?" difficulty="medium" tag="Applied">
  <p>The core diagnosis is <strong>no hierarchy and no narrative</strong> &mdash; 14 equally-weighted KPIs force the reader to do the analysis themselves, and a 9-slice pie defeats the one thing pies are weak at (comparing similar angles).</p>
  <ul>
    <li><strong>Start from the question, not the data.</strong> Ask &quot;what decision does this dashboard support?&quot; Pick the 1&ndash;3 metrics that drive that decision and make them the headline; demote the rest to a detail tab or remove them.</li>
    <li><strong>Impose a hierarchy.</strong> Use the inverted-pyramid / Z-pattern: the single headline number top-left, supporting trend next, granular breakdowns below the fold. Readers in Western scripts scan top-left first, so put the punchline there.</li>
    <li><strong>Replace the pie with a sorted horizontal bar chart.</strong> Humans compare lengths along a common baseline far more accurately than angles (Cleveland &amp; McGill&apos;s perceptual ranking). Sorting makes rank instantly readable.</li>
    <li><strong>Annotate the insight in words.</strong> A title like &quot;Churn rose 4pts in EU after the price change&quot; beats a generic &quot;Churn by Region&quot; &mdash; the chart should state its conclusion, not just present evidence.</li>
    <li><strong>Add a clear takeaway / call to action.</strong> Every chart earns its place by changing a decision; if removing it changes nothing, cut it.</li>
  </ul>
  <p>The reframe: a dashboard is not a data dump, it is an argument with a claim, evidence, and a recommended action.</p>
</InterviewProblem>
<InterviewProblem question="An exec says your model lifts revenue 12%. Walk through how you would present that single number honestly and persuasively without overstating it." difficulty="medium" tag="Case">
  <p>The goal is to be <strong>persuasive and trustworthy at once</strong> &mdash; a single point estimate with no context is both unconvincing to a skeptic and dangerous if it later moves.</p>
  <ul>
    <li><strong>Anchor to a baseline.</strong> 12% relative to what? Show the counterfactual (control / pre-period) next to the treatment so the lift is a visible gap, not a claim.</li>
    <li><strong>Show uncertainty, don&apos;t hide it.</strong> Present an interval, e.g. <M>{"12\\% \\pm 3\\%"}</M> at 95% confidence, so the audience sees the lift is unlikely to be noise. Quoting only the midpoint invites a later &quot;it was only 9%&quot; credibility hit.</li>
    <li><strong>State the denominator and absolute size.</strong> 12% of a small segment may be tiny in dollars; pair the percent with the absolute revenue impact so the exec can prioritize.</li>
    <li><strong>Name the assumptions and risks</strong> &mdash; novelty effects, seasonality, whether the test population generalizes. Pre-empting the objection builds more trust than burying it.</li>
    <li><strong>Lead visually with the gap.</strong> Two bars (control vs. treatment) with the delta annotated directly, error bars shown, everything else muted. The headline reads the conclusion: &quot;Treatment added \$X (+12%, 95% CI 9&ndash;15%).&quot;</li>
  </ul>
  <p>Honesty <em>is</em> the persuasion strategy here: an exec who has been burned by a confident wrong number will discount your next ten charts.</p>
</InterviewProblem>
<InterviewProblem question="Write a function that takes a list of category values and returns indices to highlight so a bar chart leads the eye to the top contributor and any outliers, returning a color list (gray for context, one accent for the focus)." difficulty="hard" tag="Coding">
  <p>The storytelling principle in code: <strong>compute which bars carry the message, color only those, mute the rest.</strong> We accent the single largest bar (the headline) and flag statistical outliers via a robust z-score using the median and MAD, which is resistant to the very outliers we want to find.</p>
  <CodeBlock language="python" filename="lead_the_eye.py">{`import numpy as np

GRAY, ACCENT, OUTLIER = "#cccccc", "#1f77b4", "#d62728"

def highlight_colors(values, z_thresh=3.5):
    """Return a per-bar color list that leads the eye.

    - The single max bar gets the ACCENT color (the headline).
    - Robust-z outliers get the OUTLIER color (worth a callout).
    - Everything else is muted GRAY context.
    """
    x = np.asarray(values, dtype=float)
    n = len(x)
    colors = [GRAY] * n

    # Robust z-score: median + MAD resist contamination by outliers.
    med = np.median(x)
    mad = np.median(np.abs(x - med))
    if mad > 0:
        # 0.6745 scales MAD to match std under normality.
        robust_z = 0.6745 * (x - med) / mad
        for i in range(n):
            if abs(robust_z[i]) > z_thresh:
                colors[i] = OUTLIER

    # The headline bar always wins the accent, even if also an outlier.
    top = int(np.argmax(x))
    colors[top] = ACCENT
    return colors

vals = [10, 12, 11, 13, 9, 48, 12]
print(highlight_colors(vals))
# bar 5 (value 48) is both the max and an outlier -> ACCENT wins`}</CodeBlock>
  <p>Why MAD instead of mean/std: a single huge bar inflates the standard deviation and can mask itself, so a plain z-score under-detects the outlier it is meant to find. The robust version keeps the &quot;what should the eye land on&quot; decision stable. The design choice that the max bar overrides the outlier color encodes a narrative priority &mdash; one clear protagonist beats two competing accents.</p>
</InterviewProblem>

      </>
  );
}
