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
      <p>Before you run a single model, you have to know what each column actually <em>is</em>. The data type is not a storage detail&mdash;it is a contract about which operations are meaningful.</p>

      <KeyIdea>A variable&apos;s type tells you which operations are <strong>legal</strong>. You can average temperatures but not zip codes; you can rank exam grades but not subtract them. The type dictates the method.</KeyIdea>

      <h2>The five types you meet</h2>
      <ul>
        <li><strong>Numeric (continuous)</strong> &mdash; measured quantities like height or price. Arithmetic is meaningful: sums, means, distances.</li>
        <li><strong>Categorical (nominal)</strong> &mdash; unordered labels like country or color. Only equality (&quot;same or different&quot;) makes sense.</li>
        <li><strong>Ordinal</strong> &mdash; ordered labels like &quot;low / medium / high&quot;. You can rank, but the gaps are not equal.</li>
        <li><strong>Text</strong> &mdash; free-form strings; needs tokenizing or embedding before a model can use it.</li>
        <li><strong>Time</strong> &mdash; timestamps with a special structure: ordering, periodicity, and the rule that the future must never leak into the past.</li>
      </ul>

      <h2>Why it dictates the method</h2>
      <Basic>
        <p>Think of types as the units on a ruler. A numeric column has a real ruler&mdash;the distance from 10 to 20 equals the distance from 50 to 60&mdash;so a mean and a standard deviation are honest summaries. A categorical column has no ruler at all; computing the &quot;average country&quot; is nonsense, so you summarize with counts or a mode instead.</p>
        <p>Ordinal data is the tricky middle: there&apos;s an order (a 5-star review beats 3 stars) but the rungs are unevenly spaced, so you rank rather than average. Match the summary to the ruler and your analysis stays truthful.</p>
      </Basic>
      <Advanced>
        <p>Formally, types map onto Stevens&apos; <strong>levels of measurement</strong>, each admitting a larger group of permissible transformations:</p>
        <ul>
          <li><strong>Nominal:</strong> invariant under any bijection <M>{"\\phi"}</M>; only <M>{"="}</M> is defined.</li>
          <li><strong>Ordinal:</strong> invariant under monotonic <M>{"\\phi"}</M>; order is defined but differences are not.</li>
          <li><strong>Interval:</strong> invariant under <M>{"\\phi(x)=ax+b"}</M>; differences are meaningful, but ratios are not (no true zero).</li>
          <li><strong>Ratio:</strong> invariant under <M>{"\\phi(x)=ax"}</M>; a true zero makes ratios meaningful.</li>
        </ul>
        <p>A statistic is valid only if it is invariant under that level&apos;s transformations. The arithmetic mean is meaningful at interval/ratio scale because it commutes with affine maps:</p>
        <MB>{"\\frac{1}{n}\\sum_i (a x_i + b) = a\\,\\bar{x} + b"}</MB>
        <p>The median, by contrast, survives any monotonic map, so it is the natural center for ordinal data&mdash;which is exactly why misapplying a mean to ranks silently violates the scale.</p>
      </Advanced>

      <Callout kind="pitfall" title="The integer-encoding trap">
        Encoding a nominal feature as integers (Red=0, Green=1, Blue=2) and feeding it to a linear or distance-based model invents a fake order and fake distances: it claims Blue is &quot;twice&quot; Green and that Green sits between Red and Blue. Use one-hot encoding for nominal data; reserve integer labels for genuinely ordinal features.
      </Callout>

      <CodeBlock language="python" filename="encode_by_type.py">{`import pandas as pd

df = pd.DataFrame({
    "price":  [10.0, 25.0, 7.5],       # numeric (ratio)
    "color":  ["red", "green", "blue"], # nominal
    "size":   ["S", "L", "M"],          # ordinal
})

# Numeric: arithmetic is valid
print(df["price"].mean())

# Nominal: one-hot, no fake order
nominal = pd.get_dummies(df["color"], prefix="color")

# Ordinal: an ENCODED order, not arbitrary integers
order = ["S", "M", "L"]
df["size"] = pd.Categorical(df["size"], categories=order, ordered=True)
df["size_code"] = df["size"].cat.codes   # S=0, M=1, L=2 with meaning

print(pd.concat([df[["price", "size_code"]], nominal], axis=1))`}</CodeBlock>

      <MoreDepth>
        <p>Cardinality and context can shift the right treatment. A high-cardinality nominal feature (tens of thousands of user IDs) breaks one-hot encoding&mdash;you reach for target/mean encoding, hashing, or learned embeddings instead. Conversely, a numeric column with only a handful of distinct values (1&ndash;5 star ratings) often behaves more like ordinal data, and binning a continuous variable downgrades it to ordinal on purpose to capture nonlinearity. The deepest pitfall is time: its &quot;type&quot; carries an ordering constraint that no shuffle-based cross-validation respects, so a careless train/test split leaks the future and inflates every metric.</p>
      </MoreDepth>

      <Quiz question="You have a 'satisfaction' column with values Low, Medium, High. Which treatment respects its type?" options={[
        { text: "One-hot encode it, since the labels are just categories", why: "This throws away the genuine ordering (High > Medium > Low), losing real information the model could use." },
        { text: "Map to ordered codes 0/1/2 and treat as ordinal", correct: true, why: "Ordinal data has a meaningful order but unequal gaps, so an ordered encoding preserves the ranking without inventing exact distances." },
        { text: "Compute the arithmetic mean to get an 'average satisfaction'", why: "The mean assumes equal interval spacing, which ordinal data does not have; the median is the appropriate center." },
        { text: "Standardize it to zero mean and unit variance", why: "Standardization presumes a numeric/interval scale; applying it to ranks fabricates distances that don't exist." },
      ]} />
    </>
  );
}
