"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M } from "@/components/content/math";
import { CodeBlock } from "@/components/content/code-block";
import { Quiz } from "@/components/content/quiz";

export default function Lesson() {
  return (
    <>
      <p>The same data can live in many shapes, and the shape decides what is easy to do with it. Reshaping is the act of moving values between rows and columns so the table matches the question you want to ask.</p>

      <KeyIdea>Long and wide are two views of the <strong>same</strong> information. <strong>Pivot</strong> goes long &rarr; wide (one column&apos;s categories become columns); <strong>melt</strong> goes wide &rarr; long (columns collapse into rows).</KeyIdea>

      <h2>Long vs wide</h2>
      <p>Imagine sales for three stores across three months. In <strong>wide</strong> form, each month is its own column, so one row fully describes a store. In <strong>long</strong> (tidy) form, every measurement gets its own row with an identifier column and a value column.</p>
      <ul>
        <li><strong>Wide</strong>: human-friendly, compact, good for reports and spreadsheets.</li>
        <li><strong>Long</strong>: machine-friendly, every observation is one row &mdash; ideal for grouping, plotting, and most modeling APIs.</li>
      </ul>

      <Basic>
        <p>Think of a class gradebook. The <strong>wide</strong> version has one row per student and a column per subject &mdash; easy to read at a glance. The <strong>long</strong> version has one row per (student, subject) pair: <code>Ana, Math, 88</code>. Pivoting turns the long list back into the grid; melting flattens the grid into the list. No information is created or destroyed &mdash; you are just relabeling where each number sits.</p>
      </Basic>

      <Advanced>
        <p>Reshaping is a relational projection plus a key rearrangement. Long form is the canonical normalized representation: each row is keyed by an index set <M>{"(i, k)"}</M> with a single value <M>{"v"}</M>. A pivot is a group-by over the index <M>{"i"}</M> that spreads the category column <M>{"k"}</M> into the column axis, requiring <M>{"(i, k)"}</M> to be <strong>unique</strong> &mdash; otherwise the pivot is ambiguous and you must supply an aggregation function, making it a true <M>{"\\text{groupby} \\to \\text{aggregate}"}</M> pivot table. Melt is the inverse: given identifier columns and value columns, it produces the long relation <M>{"(\\text{id}, \\text{variable}, \\text{value})"}</M>, exactly undoing a pivot when the mapping was bijective.</p>
      </Advanced>

      <Callout kind="pitfall" title="Duplicate keys break a pivot">
        If the index/column pair is not unique, a plain pivot raises an error. You either need a finer index, or you must aggregate (mean, sum, count) &mdash; which is a pivot_table, not a lossless pivot. Decide which one you actually want.
      </Callout>

      <h2>Why it matters in practice</h2>
      <p>Most plotting and modeling libraries expect long, tidy data: one column you map to color, one to the x-axis, one to the value. But many models and feature stores want wide matrices where each column is a feature. Reshaping is the bridge between these worlds, and you will do it constantly when building features from event logs or time series.</p>

      <CodeBlock language="python" filename="reshape.py">{`import pandas as pd

# Long (tidy): one row per observation
long = pd.DataFrame({
    "store": ["A", "A", "B", "B"],
    "month": ["Jan", "Feb", "Jan", "Feb"],
    "sales": [10, 14, 7, 9],
})

# Long -> wide: months become columns
wide = long.pivot(index="store", columns="month", values="sales")
# columns: Feb, Jan ; rows: A, B

# Wide -> long: collapse month columns back into rows
back = wide.reset_index().melt(
    id_vars="store", var_name="month", value_name="sales"
)

# Duplicate keys? aggregate instead of pivot
table = long.pivot_table(
    index="store", values="sales", aggfunc="mean"
)`}</CodeBlock>

      <MoreDepth>
        <p>Watch the index. <code>pivot</code> pushes the chosen key into the row index and the category into a column index, often creating a MultiIndex on the columns; forgetting to <code>reset_index()</code> before melting then drops or duplicates identifiers. Also note that melt is not perfectly invertible if you melt only a subset of value columns or if dtypes were mixed (the unified <code>value</code> column upcasts to <code>object</code>). In big pipelines, prefer doing reshapes once, near the source, and caching the long form &mdash; repeated pivots over large frames are memory-heavy because the output width grows with the cardinality of the spread column.</p>
      </MoreDepth>

      <Quiz question="You have a long table keyed by (user_id, event_date) with multiple rows for the same user on the same date. You try to pivot event_date into columns. What happens and what should you do?" options={[
        { text: "The pivot succeeds and keeps the first value silently.", why: "A plain pivot does not silently pick one row; duplicate index/column pairs are an error, not a silent choice." },
        { text: "The plain pivot fails on duplicate keys; use pivot_table with an aggfunc.", correct: true, why: "Non-unique (index, column) pairs make a lossless pivot ambiguous, so you must aggregate with pivot_table (e.g. sum or mean)." },
        { text: "You must melt first, then it will pivot cleanly.", why: "Melting makes the data longer, not unique; the duplicate (user, date) pairs remain and the pivot is still ambiguous." },
        { text: "Pivot averages duplicate values automatically by default.", why: "Plain pivot performs no aggregation; only pivot_table aggregates, and you must specify the function." },
      ]} />
    </>
  );
}
