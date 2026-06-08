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
        Pandas is the workhorse of tabular data in Python. Almost every analysis you do
        reduces to four verbs: <strong>select</strong> columns, <strong>filter</strong> rows,
        <strong> group</strong> by a key, and <strong>transform</strong> values.
      </p>

      <KeyIdea>
        A DataFrame is a dictionary of aligned columns sharing one index. Master selecting,
        filtering, grouping, and transforming, and you can express nearly any data-wrangling
        task as a short chain of these verbs.
      </KeyIdea>

      <h2>The four verbs</h2>
      <ul>
        <li><strong>Select:</strong> pick columns with <code>df[[&quot;a&quot;, &quot;b&quot;]]</code> or rows by label/position via <code>.loc</code> and <code>.iloc</code>.</li>
        <li><strong>Filter:</strong> keep rows matching a boolean mask, e.g. <code>df[df.price &gt; 100]</code>.</li>
        <li><strong>Group:</strong> split rows into buckets by a key, apply an aggregation, combine results back.</li>
        <li><strong>Transform:</strong> map values into new ones, broadcasting back to the original shape.</li>
      </ul>

      <Basic>
        <p>
          Think of a DataFrame as a spreadsheet you talk to with code. Selecting is highlighting
          columns. Filtering is hiding rows that fail a condition. Grouping is dragging rows into
          piles by some label, then summarizing each pile (a sum, a mean, a count). Transforming
          is rewriting a column &mdash; scaling it, filling blanks, or computing a per-group statistic.
          The power comes from chaining: filter, then group, then transform, all in one readable line.
        </p>
      </Basic>

      <Advanced>
        <p>
          Grouping follows the <strong>split&ndash;apply&ndash;combine</strong> model. A <code>groupby</code>
          partitions the row index into disjoint groups keyed by one or more columns, applies a function
          per group, and concatenates the outputs. Two output shapes matter:
        </p>
        <ul>
          <li><strong>Aggregate</strong> collapses each group to one row (mean, sum), shrinking the index.</li>
          <li><strong>Transform</strong> returns a value <em>per original row</em>, preserving shape and index alignment &mdash; ideal for group-relative features like <code>(x - group_mean) / group_std</code>.</li>
        </ul>
        <p>
          Index alignment is the rigor underneath everything: operations between objects align on the
          index first, so arithmetic on misaligned indices yields <code>NaN</code> rather than silently
          mismatching positions.
        </p>
      </Advanced>

      <Callout kind="pitfall" title="Chained indexing assigns into a copy">
        Writing <code>df[df.x &gt; 0][&quot;y&quot;] = 1</code> mutates a temporary slice, not the
        original frame, and pandas warns with <code>SettingWithCopyWarning</code>. Use a single
        <code> .loc</code> call instead: <code>df.loc[df.x &gt; 0, &quot;y&quot;] = 1</code>.
      </Callout>

      <CodeBlock language="python" filename="wrangle.py">{`import pandas as pd

df = pd.DataFrame({
    "region": ["E", "W", "E", "W", "E"],
    "sales":  [100, 240, 130, 90, 70],
})

# Select + filter
big = df.loc[df["sales"] > 100, ["region", "sales"]]

# Group + aggregate: one row per region
per_region = df.groupby("region")["sales"].sum()

# Group + transform: per-row group mean, shape preserved
df["region_mean"] = df.groupby("region")["sales"].transform("mean")

# Centered feature relative to the row's own group
df["sales_centered"] = df["sales"] - df["region_mean"]
print(df)`}</CodeBlock>

      <MoreDepth>
        <p>
          Prefer vectorized operations and built-in aggregations over <code>df.apply(...,
          axis=1)</code>, which loops in Python and is often 10&ndash;100x slower. When you must
          customize per group, <code>transform</code> with a named string (<code>&quot;mean&quot;</code>)
          dispatches to a fast Cython path, while passing a Python lambda falls back to slower
          element-wise execution. Also watch dtypes: an <code>object</code>-dtype column of mixed types
          silently kills vectorization, so cast to numeric or <code>category</code> early.
        </p>
      </MoreDepth>

      <Quiz question="You want a new column giving each row's value minus the mean of its own group, keeping every original row. Which tool fits?" options={[
        { text: "groupby(...).transform('mean'), then subtract", correct: true, why: "transform returns one value per original row aligned to the index, so the subtraction broadcasts correctly." },
        { text: "groupby(...).mean()", why: "Aggregation collapses each group to a single row, losing the per-row alignment you need." },
        { text: "df.apply over axis=1", why: "It works but loops in Python and ignores group structure; far slower and clumsier." },
        { text: "A plain df.filter call", why: "filter selects labels by name or pattern; it does not compute group statistics." },
      ]} />
    </>
  );
}
