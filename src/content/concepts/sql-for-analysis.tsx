"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { CodeBlock } from "@/components/content/code-block";
import { Quiz } from "@/components/content/quiz";
import { InterviewProblem } from "@/components/content/interview-problem";
import { MB } from "@/components/content/math";

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
    <h2>Interview practice</h2>
<InterviewProblem question="What is the difference between WHERE and HAVING, and when does each get evaluated?" difficulty="easy" tag="Conceptual">
  <p><strong>WHERE</strong> filters individual rows <strong>before</strong> aggregation; <strong>HAVING</strong> filters groups <strong>after</strong> aggregation. They run at different stages of the logical query pipeline:</p>
  <ul>
    <li><strong>FROM / JOIN</strong> &rarr; assemble rows</li>
    <li><strong>WHERE</strong> &rarr; drop rows that fail a row-level predicate (cannot reference aggregates like <strong>COUNT()</strong>)</li>
    <li><strong>GROUP BY</strong> &rarr; collapse rows into groups</li>
    <li><strong>HAVING</strong> &rarr; drop whole groups using aggregate predicates</li>
    <li><strong>SELECT &rarr; ORDER BY &rarr; LIMIT</strong></li>
  </ul>
  <p>A common interview trap: &quot;filter for customers with more than 5 orders.&quot; That predicate is on an aggregate, so it must live in HAVING, not WHERE. Conversely, filtering to <strong>only 2024 orders</strong> before counting belongs in WHERE so the aggregate is computed over the right rows. Pushing row filters into WHERE is also faster, because fewer rows reach the GROUP BY.</p>
  <CodeBlock language="python" filename="where_vs_having.py">{`-- 2024 orders only (WHERE), then keep heavy buyers (HAVING)
SELECT customer_id, COUNT(*) AS n_orders
FROM orders
WHERE order_date >= '2024-01-01'   -- pre-aggregation, per row
GROUP BY customer_id
HAVING COUNT(*) > 5                 -- post-aggregation, per group
ORDER BY n_orders DESC;`}</CodeBlock>
</InterviewProblem>
<InterviewProblem question="A LEFT JOIN of orders to a filtered customers table returns fewer rows than expected. The candidate put a customer-region filter in the WHERE clause. Diagnose and fix." difficulty="medium" tag="Applied">
  <p>This is the classic &quot;a WHERE on the right table silently turns your LEFT JOIN into an INNER JOIN&quot; bug. With a LEFT JOIN, unmatched left rows survive but get <strong>NULL</strong> in every right-table column. A WHERE predicate like <strong>c.region = &apos;EU&apos;</strong> then evaluates to NULL (not TRUE) for those unmatched rows, so they get dropped &mdash; defeating the purpose of the outer join.</p>
  <p>The fix is to move the right-table filter into the <strong>ON</strong> clause, so it constrains <strong>which rows match</strong> rather than which survive:</p>
  <CodeBlock language="python" filename="join_filter.py">{`-- WRONG: WHERE silently drops unmatched orders
SELECT o.order_id, c.region
FROM orders o
LEFT JOIN customers c ON c.customer_id = o.customer_id
WHERE c.region = 'EU';          -- NULL region rows eliminated

-- RIGHT: filter lives in ON; all orders kept
SELECT o.order_id, c.region
FROM orders o
LEFT JOIN customers c
  ON c.customer_id = o.customer_id
 AND c.region = 'EU';           -- non-EU/unmatched -> region is NULL`}</CodeBlock>
  <p><strong>Rule of thumb:</strong> a predicate on the <strong>left</strong> (preserved) table can sit in WHERE; a predicate on the <strong>right</strong> table of a LEFT JOIN almost always belongs in ON unless you deliberately want INNER-JOIN semantics. The one legitimate WHERE use is the anti-join pattern <strong>WHERE c.customer_id IS NULL</strong> to find orders with no matching customer.</p>
</InterviewProblem>
<InterviewProblem question="Compute each employee's running total of salary spend within their department, ordered by hire date, and also rank employees by salary within department. Explain ROW_NUMBER vs RANK vs DENSE_RANK." difficulty="medium" tag="Coding">
  <p>Window functions compute a value <strong>per row</strong> over a related set of rows (the &quot;window&quot;) without collapsing them like GROUP BY does. <strong>PARTITION BY</strong> defines the groups; <strong>ORDER BY</strong> inside the window defines row order; the frame (default <strong>RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</strong>) defines the running window.</p>
  <CodeBlock language="python" filename="window_funcs.py">{`SELECT
  emp_id,
  dept_id,
  salary,
  -- running total of salary by hire order within dept
  SUM(salary) OVER (
    PARTITION BY dept_id
    ORDER BY hire_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_dept_spend,
  ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rn,
  RANK()       OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rnk,
  DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS drnk
FROM employees;`}</CodeBlock>
  <p>The three ranking functions differ on how they treat ties:</p>
  <ul>
    <li><strong>ROW_NUMBER</strong> &mdash; always unique (1,2,3,4); ties broken arbitrarily (or by extra ORDER BY keys).</li>
    <li><strong>RANK</strong> &mdash; ties share a rank, then it <strong>skips</strong> (1,1,3,4): two top earners both rank 1, next is 3.</li>
    <li><strong>DENSE_RANK</strong> &mdash; ties share a rank with <strong>no gaps</strong> (1,1,2,3).</li>
  </ul>
  <p>Use ROW_NUMBER to deduplicate (&quot;keep the latest record per key&quot;: filter <strong>rn = 1</strong>), and RANK / DENSE_RANK for leaderboards where ties should be honored. Note you cannot put a window function in WHERE &mdash; wrap the query in a CTE or subquery and filter on the computed column outside.</p>
</InterviewProblem>
<InterviewProblem question="Write a query that, for each user, returns the number of days between their first and second purchase (NULL if they purchased only once). Then describe how you would compute a 7-day retention rate." difficulty="hard" tag="Case">
  <p>The gap-to-second-purchase is a textbook use of <strong>LAG/LEAD</strong> or row-numbered self-comparison. Rank each user&apos;s purchases by date, pivot the first two, and difference them:</p>
  <CodeBlock language="python" filename="second_purchase_gap.py">{`WITH ranked AS (
  SELECT
    user_id,
    purchase_date,
    ROW_NUMBER() OVER (
      PARTITION BY user_id ORDER BY purchase_date
    ) AS seq
  FROM purchases
)
SELECT
  f.user_id,
  -- NULL automatically when there is no second purchase
  (s.purchase_date - f.purchase_date) AS days_to_second
FROM      ranked f
LEFT JOIN ranked s
  ON s.user_id = f.user_id AND s.seq = 2
WHERE f.seq = 1;`}</CodeBlock>
  <p>The LEFT JOIN preserves single-purchase users and yields NULL for their gap, exactly as required. (In MySQL use <strong>DATEDIFF</strong>; in some engines use <strong>LEAD(purchase_date) OVER (...)</strong> instead of the self-join.)</p>
  <p><strong>7-day retention</strong> measures the share of a signup cohort that takes a qualifying action within 7 days of joining. The pattern:</p>
  <ul>
    <li>Define the cohort: each user&apos;s <strong>signup_date</strong> (often bucketed by signup week).</li>
    <li>Join activity events and keep those where <strong>event_date</strong> falls in <strong>(signup_date, signup_date + 7]</strong>.</li>
    <li>Per cohort, divide distinct retained users by the cohort size.</li>
  </ul>
  <MB>{"\\text{retention}_{7d} = \\frac{|\\{u : \\exists\\, \\text{event in } (t_u,\\, t_u+7]\\}|}{|\\text{cohort}|}"}</MB>
  <p>Use <strong>COUNT(DISTINCT user_id)</strong> in the numerator so a user with many events is counted once, and a <strong>LEFT JOIN</strong> from the cohort so users with zero events still appear (counting as not-retained) rather than being dropped &mdash; otherwise retention is biased upward.</p>
</InterviewProblem>

      </>
  );
}
