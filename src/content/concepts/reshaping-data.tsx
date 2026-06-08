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
    <h2>Interview practice</h2>

<InterviewProblem question="Explain the difference between long (tidy) and wide data formats. When does each one make sense?" difficulty="easy" tag="Conceptual">
  <p>The same information can be laid out two ways:</p>
  <ul>
    <li><strong>Wide</strong>: one row per entity, and each variable (or each time point, category, etc.) gets its own column. Example: one row per patient with columns <strong>bp_jan</strong>, <strong>bp_feb</strong>, <strong>bp_mar</strong>. Compact and human-readable; good for spreadsheets and for many ML models that expect one feature vector per row.</li>
    <li><strong>Long (tidy)</strong>: one row per observation, with key columns naming the variable and a single value column. The same patients become rows like (<strong>patient</strong>, <strong>month</strong>, <strong>bp</strong>). Each variable is a column, each observation is a row, each cell is one value.</li>
  </ul>
  <p>Long form is the canonical &quot;tidy&quot; layout: it composes cleanly with group-by aggregations, filters, and most plotting libraries (e.g. plot bp over month, colored by patient, in one call). Wide form is better when you want a single feature row per entity to feed a model, or for a compact report.</p>
  <p>Rule of thumb: <strong>analyze and aggregate in long form, then pivot to wide right before modeling or display.</strong> A new measurement type in long form just adds rows; in wide form it forces a schema change (a new column), which is why pipelines usually keep the durable storage long.</p>
</InterviewProblem>

<InterviewProblem question="A teammate has daily sensor readings in long format with columns (device_id, date, metric, value) where metric is one of temp, humidity, pressure. The model needs one row per (device_id, date) with temp/humidity/pressure as separate features. How would you reshape it, and what edge cases would you check?" difficulty="medium" tag="Applied">
  <p>This is a long-to-wide reshape: the <strong>metric</strong> column becomes the new column headers and <strong>value</strong> fills the cells, keyed on (device_id, date).</p>
  <CodeBlock language="python" filename="reshape.py">{`import pandas as pd

# long: one row per (device_id, date, metric)
wide = df.pivot_table(
    index=["device_id", "date"],
    columns="metric",
    values="value",
    aggfunc="mean",   # collapse accidental duplicates instead of crashing
).reset_index()

# columns are now: device_id, date, humidity, pressure, temp
wide.columns.name = None`}</CodeBlock>
  <p>Edge cases I would check before trusting the result:</p>
  <ul>
    <li><strong>Duplicate keys.</strong> If a device logs <strong>temp</strong> twice on the same date, plain <strong>pivot</strong> raises &quot;Index contains duplicate entries&quot;. <strong>pivot_table</strong> with an explicit <strong>aggfunc</strong> (mean/last) handles it, but I would first investigate <em>why</em> duplicates exist rather than silently averaging.</li>
    <li><strong>Missing metrics.</strong> If a device reported temp but not humidity on a given day, that cell becomes <strong>NaN</strong>. I decide deliberately: leave NaN, forward-fill in time, or drop incomplete rows depending on the model.</li>
    <li><strong>Dtype and ordering.</strong> Pivoting can scramble column order and turn the index into a MultiIndex; I reset the index and fix column names so downstream code is stable.</li>
    <li><strong>Unexpected metric values.</strong> A typo like &quot;Temp&quot; vs &quot;temp&quot; silently creates an extra column, so I normalize the category set first.</li>
  </ul>
</InterviewProblem>

<InterviewProblem question="You have a wide table of monthly returns: columns are date, asset_A, asset_B, ..., asset_Z. You need it in long form (date, asset, return) to feed a panel regression and to compute a cross-sectional rank each month. Write the reshape and explain why long form helps here." difficulty="medium" tag="Coding">
  <p>Wide-to-long is a <strong>melt</strong> (a.k.a. unpivot): the asset columns collapse into one key column and one value column, while <strong>date</strong> stays as an identifier.</p>
  <CodeBlock language="python" filename="melt.py">{`import pandas as pd

long = wide.melt(
    id_vars="date",          # kept as-is
    var_name="asset",        # former column names land here
    value_name="return",     # former cell values land here
)
# long: date | asset | return  (rows = dates x assets)

# cross-sectional rank within each date is now a clean group-by
long["xs_rank"] = (
    long.groupby("date")["return"]
        .rank(pct=True)
)`}</CodeBlock>
  <p>Why long form is the right shape here:</p>
  <ul>
    <li><strong>Panel structure becomes explicit.</strong> A panel regression wants (entity, time, value) rows; melt gives exactly that, and adding asset-level or date-level features is just a join.</li>
    <li><strong>Cross-sectional ops are one group-by.</strong> Ranking assets within each date is a <strong>groupby(&quot;date&quot;).rank()</strong> in long form. In wide form the same thing means ranking across columns row-by-row, which is awkward and error-prone.</li>
    <li><strong>It scales to new assets.</strong> A new asset is new rows, not a code change. Wide form needs the model and every transform to know the column list.</li>
  </ul>
  <p>Note: <strong>melt then pivot</strong> are inverses. You often round-trip: melt to compute per-date statistics in long form, then pivot back to wide if a specific model needs an asset-per-column matrix.</p>
</InterviewProblem>

<InterviewProblem question="A pivot from N long rows produces a wide table that is mostly empty (very sparse). Explain why the wide cell count can blow up, quantify it, and give two ways to avoid materializing a giant dense matrix." difficulty="hard" tag="Math">
  <p>Pivoting on a key column with index cardinality <M>{"R"}</M> (distinct row keys) and pivot-column cardinality <M>{"C"}</M> (distinct values that become columns) produces a dense grid of</p>
  <MB>{"R \\times C \\text{ cells.}"}</MB>
  <p>But the long table only had <M>{"N"}</M> actual observations, so the fraction of cells that are non-missing is the <strong>density</strong>:</p>
  <MB>{"\\rho = \\frac{N}{R \\times C}."}</MB>
  <p>When every (row, column) pair is observed, <M>{"N = R \\times C"}</M> and <M>{"\\rho = 1"}</M>. But high-cardinality keys make this explode: if you pivot user behavior with <M>{"R = 10^6"}</M> users against <M>{"C = 10^5"}</M> distinct product IDs, the dense grid is <M>{"10^{11}"}</M> cells even if <M>{"N"}</M> is only, say, <M>{"10^7"}</M> events. Then</p>
  <MB>{"\\rho = \\frac{10^7}{10^{11}} = 10^{-4},"}</MB>
  <p>i.e. 99.99% of the materialized matrix is wasted NaN. Memory scales with <M>{"R\\times C"}</M> (the dense product), not with <M>{"N"}</M> (the real data) — that is the trap.</p>
  <p>Two ways to avoid materializing the dense grid:</p>
  <ul>
    <li><strong>Stay long, or use a sparse representation.</strong> Keep the data in long (key, key, value) form, whose size is <M>{"O(N)"}</M>, and only pivot the small slice you actually need. If you genuinely need the matrix (e.g. for a recommender), build a <strong>sparse</strong> matrix (CSR/COO) that stores only the <M>{"N"}</M> non-zeros, not <M>{"R\\times C"}</M> cells.</li>
    <li><strong>Reduce cardinality before pivoting.</strong> Cap <M>{"C"}</M> by keeping the top-k columns and bucketing the long tail into an &quot;other&quot; column, or aggregate the pivot column into coarser categories. Shrinking <M>{"C"}</M> shrinks the dense product linearly.</li>
  </ul>
  <p>The key insight: a pivot trades a tall-thin table of size <M>{"O(N)"}</M> for a short-fat one of size <M>{"O(R\\times C)"}</M>, and when the data is sparse those two are wildly different.</p>
</InterviewProblem>

      </>
  );
}
