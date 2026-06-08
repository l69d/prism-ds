"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { CodeBlock } from "@/components/content/code-block";
import { Quiz } from "@/components/content/quiz";

export default function Lesson() {
  return (
    <>
      <p>SQL is the language analysts use to ask questions of structured data. From a single <strong>SELECT</strong> to a windowed running total, almost every analytical question reduces to a handful of composable operations.</p>

      <KeyIdea>SQL is declarative: you describe <em>what</em> result you want, not <em>how</em> to compute it. The engine&apos;s optimizer figures out the fastest plan, so your job is to express the question precisely.</KeyIdea>

      <h2>The core operations</h2>
      <p>Most analysis is built from a small, ordered vocabulary:</p>
      <ul>
        <li><strong>FROM / JOIN</strong> — choose and combine tables on matching keys.</li>
        <li><strong>WHERE</strong> — filter individual rows before grouping.</li>
        <li><strong>GROUP BY</strong> — collapse rows into buckets, then <strong>aggregate</strong> with COUNT, SUM, AVG.</li>
        <li><strong>HAVING</strong> — filter the <em>groups</em> after aggregation.</li>
        <li><strong>ORDER BY / LIMIT</strong> — sort and trim the final output.</li>
      </ul>
      <p>A subtle but crucial point: the engine processes clauses in a logical order (FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY) that differs from how you write them. That is why a column alias defined in SELECT often cannot be used in WHERE.</p>

      <Basic>
        <p>Think of a table as a spreadsheet. <strong>WHERE</strong> is hiding rows you do not care about. <strong>GROUP BY</strong> is making a pivot table: all the rows for &quot;California&quot; collapse into one summary row. <strong>JOIN</strong> is VLOOKUP done right, matching rows across two sheets by a shared key. Window functions are the magic column where each row can peek at its neighbors without collapsing anything.</p>
      </Basic>

      <Advanced>
        <p>Window functions are the analyst&apos;s power tool. Unlike GROUP BY, they compute over a partition <em>without</em> reducing the row count. The general form is:</p>
        <CodeBlock language="sql" filename="window.sql">{`func() OVER (
  PARTITION BY group_col
  ORDER BY sort_col
  ROWS BETWEEN ... AND ...
)`}</CodeBlock>
        <p>This enables running totals, per-group rankings, and lag/lead comparisons. Ranking has three variants worth distinguishing: <strong>ROW_NUMBER</strong> assigns a unique integer; <strong>RANK</strong> leaves gaps after ties (1, 1, 3); <strong>DENSE_RANK</strong> does not (1, 1, 2). Choosing the wrong one silently corrupts top-N reporting.</p>
      </Advanced>

      <h2>Where it matters</h2>
      <p>SQL runs <em>inside</em> the database, next to the data. Pushing a filter or aggregation into SQL moves megabytes instead of gigabytes across the wire, and the columnar engines behind warehouses (BigQuery, Snowflake, DuckDB) parallelize it for free. This is why a well-written query routinely outperforms pulling raw rows into pandas.</p>

      <Callout kind="pitfall" title="The silent NULL trap">
        Comparisons with NULL return UNKNOWN, not TRUE or FALSE. So <strong>WHERE status != &apos;active&apos;</strong> drops rows where status is NULL — often not what you intended. Use <strong>IS DISTINCT FROM</strong> or <strong>COALESCE</strong>. Likewise, COUNT(column) ignores NULLs while COUNT(*) does not.
      </Callout>

      <CodeBlock language="python" filename="cohort_revenue.py">{`import duckdb

# Each customer's running revenue and rank within their region
query = """
SELECT
    region,
    customer_id,
    order_date,
    amount,
    SUM(amount) OVER (
        PARTITION BY customer_id
        ORDER BY order_date
        ROWS UNBOUNDED PRECEDING
    ) AS running_total,
    RANK() OVER (
        PARTITION BY region
        ORDER BY amount DESC
    ) AS spend_rank
FROM orders
WHERE order_date >= '2026-01-01'
ORDER BY region, spend_rank
"""

df = duckdb.sql(query).df()  # runs in-process, no server needed
print(df.head())`}</CodeBlock>

      <MoreDepth>
        <p>A common performance footgun is the <strong>correlated subquery</strong> — a subquery in SELECT that re-executes per outer row, turning an O(n) scan into O(n&sup2;). Modern optimizers often rewrite these as joins or window functions, but not always. When a query crawls, check the EXPLAIN plan for a nested loop where you expected a hash join, and rewrite the correlated subquery as a window function or a single GROUP BY join. The result is identical; the cost differs by orders of magnitude.</p>
      </MoreDepth>

      <Quiz question="You want each employee's salary alongside the average salary of their department, keeping one row per employee. Which approach fits best?" options={[
        { text: "GROUP BY department", why: "This collapses each department to a single row, so you lose the per-employee detail you need to keep." },
        { text: "AVG(salary) OVER (PARTITION BY department)", correct: true, why: "A window function computes the department average while preserving every individual employee row." },
        { text: "A WHERE clause filtering on the average", why: "WHERE filters rows; it cannot attach a per-group aggregate as a new column, and it runs before aggregation." },
        { text: "ORDER BY department, salary", why: "Sorting arranges rows but computes no average and adds no comparison column." },
      ]} />
    </>
  );
}
