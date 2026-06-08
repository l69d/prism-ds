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
    <h2>Interview practice</h2>
<InterviewProblem question="What is the difference between .loc and .iloc, and why does chained indexing like df[df.a > 0]['b'] = 1 fail silently?" difficulty="easy" tag="Conceptual">
  <p><strong>.loc</strong> is label-based: it selects by the index and column <em>names</em>. <strong>.iloc</strong> is integer-position based: it selects by 0-based row and column <em>position</em>, exactly like a NumPy array. They diverge whenever the index is not a clean <M>{"0..n-1"}</M> range &mdash; for example after a filter or a custom string index.</p>
  <p>The chained-assignment trap comes from doing two indexing operations in a row. <strong>df[df.a &gt; 0]</strong> may return a <em>copy</em> rather than a view, so the subsequent <strong>[&apos;b&apos;] = 1</strong> writes into that throwaway copy and the original frame is never touched. Pandas warns with a <strong>SettingWithCopyWarning</strong> because it cannot guarantee whether you got a view or a copy.</p>
  <p>The fix is to do the selection and assignment in a single <strong>.loc</strong> call so pandas resolves rows and columns together:</p>
  <CodeBlock language="python" filename="indexing.py">{`# Wrong: chained indexing, may not stick
df[df.a > 0]['b'] = 1

# Right: single .loc call, rows and column at once
df.loc[df.a > 0, 'b'] = 1`}</CodeBlock>
</InterviewProblem>
<InterviewProblem question="A teammate's groupby aggregation is slow and uses a Python loop over groups. How would you compute, per customer, the share of each transaction relative to that customer's total spend?" difficulty="medium" tag="Applied">
  <p>The key insight is that this is a <strong>transform</strong>, not an aggregate. An aggregate (<strong>groupby(...).sum()</strong>) collapses each group to one row; a transform returns a Series <em>aligned to the original index</em>, so it broadcasts the per-group total back onto every row. That lets you avoid both the explicit loop and a separate merge.</p>
  <CodeBlock language="python" filename="share.py">{`# customer total broadcast to each row, then divide
grp = df.groupby('customer_id')['amount']
df['cust_total'] = grp.transform('sum')
df['share'] = df['amount'] / df['cust_total']`}</CodeBlock>
  <p>Why this beats the loop:</p>
  <ul>
    <li><strong>Vectorized:</strong> the aggregation runs in C over the whole frame instead of N Python iterations, typically orders of magnitude faster.</li>
    <li><strong>Index-aligned:</strong> <strong>transform</strong> guarantees the result lines up row-for-row, so the division is safe even if rows are unsorted.</li>
    <li><strong>Composable:</strong> the same pattern handles group means for centering, group counts, or ranks via <strong>transform(&apos;mean&apos;)</strong>, <strong>transform(&apos;count&apos;)</strong>, etc.</li>
  </ul>
  <p>One caveat: if <strong>cust_total</strong> can be zero (a customer with refunds netting to 0), guard the division to avoid <M>{"\\pm\\infty"}</M> or <strong>NaN</strong> leaking into downstream features.</p>
</InterviewProblem>
<InterviewProblem question="Explain how pandas handles missing data with NaN. Why does df.sum() skip NaN but df + df propagate it, and how does this interact with groupby?" difficulty="medium" tag="Conceptual">
  <p>Pandas represents missing floats as <strong>NaN</strong> (IEEE-754 not-a-number). The behavior splits along two paths:</p>
  <ul>
    <li><strong>Reductions skip by default:</strong> <strong>sum</strong>, <strong>mean</strong>, <strong>std</strong> take <strong>skipna=True</strong>, so they ignore <strong>NaN</strong> and compute over the present values. This is why a column with one missing entry still returns a finite mean.</li>
    <li><strong>Element-wise ops propagate:</strong> arithmetic like <strong>df + df</strong> follows NaN math &mdash; any operation touching <strong>NaN</strong> yields <strong>NaN</strong>, since <M>{"\\text{NaN} + x = \\text{NaN}"}</M>.</li>
    <li><strong>groupby drops NaN keys:</strong> rows whose <em>grouping key</em> is <strong>NaN</strong> are excluded from all groups by default. Pass <strong>dropna=False</strong> to keep them as their own group.</li>
  </ul>
  <p>The practical danger is silent sample-size drift: <strong>mean</strong> over a column with missingness is computed on a smaller, possibly biased subset. Always check <strong>df.isna().mean()</strong> per column and decide explicitly between dropping, imputing, or modeling the missingness before trusting an aggregate.</p>
</InterviewProblem>
<InterviewProblem question="Given an events table with columns user_id, ts, action, write pandas to find each user's first session-converting action, where a session breaks after 30 minutes of inactivity." difficulty="hard" tag="Coding">
  <p>This is a classic sessionization plus first-match problem. The plan: sort within each user by time, compute the gap to the previous event, start a new session whenever the gap exceeds the threshold, then pick the first converting row per user.</p>
  <CodeBlock language="python" filename="sessionize.py">{`import pandas as pd

df = df.sort_values(['user_id', 'ts'])

# gap to previous event, within user
gap = df.groupby('user_id')['ts'].diff()

# new session when gap > 30 min (NaT for first row counts as a break)
new_session = (gap > pd.Timedelta(minutes=30)) | gap.isna()

# cumulative session counter, restarted per user via groupby+cumsum
df['session_id'] = new_session.groupby(df['user_id']).cumsum()

# first converting action per user
converted = df[df['action'] == 'purchase']
first_conv = (converted
              .sort_values(['user_id', 'ts'])
              .groupby('user_id', as_index=False)
              .first())`}</CodeBlock>
  <p>Why each step matters:</p>
  <ul>
    <li><strong>Sort first:</strong> <strong>diff</strong> and <strong>cumsum</strong> are order-dependent; without sorting the session boundaries are meaningless.</li>
    <li><strong>diff within group:</strong> <strong>groupby(...).diff()</strong> resets at each user so the last event of user A never bleeds into user B.</li>
    <li><strong>cumsum of the boolean break:</strong> each <strong>True</strong> increments the running session number, giving a stable per-session label &mdash; an idiom worth memorizing.</li>
    <li><strong>NaT handling:</strong> the first event per user has a <strong>NaT</strong> gap, so we explicitly mark it as a session start.</li>
  </ul>
  <p>Complexity is dominated by the sort at <M>{"O(n \\log n)"}</M>; the groupby passes are linear. For very large tables you would push the same logic to a SQL window function or a columnar engine, but the algorithm is identical.</p>
</InterviewProblem>

      </>
  );
}
