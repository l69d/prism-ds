"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { CodeBlock } from "@/components/content/code-block";
import { Quiz } from "@/components/content/quiz";

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
    </>
  );
}
