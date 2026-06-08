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
      <p>Joins stitch two tables together on a shared key; aggregations collapse many rows into one summary per group. Most real analysis is some dance between these two operations.</p>

      <KeyIdea>A join is a controlled multiplication of rows, and the join type is just a policy for what to do with keys that fail to match. Pick the wrong policy and you either silently drop rows or silently duplicate them.</KeyIdea>

      <h2>The four joins you actually use</h2>
      <p>Imagine an <strong>orders</strong> table and a <strong>customers</strong> table linked by <code>customer_id</code>. The join type decides which rows survive when a key exists in one table but not the other:</p>
      <ul>
        <li><strong>Inner join</strong>: keep only rows where the key matches on both sides. Unmatched rows vanish.</li>
        <li><strong>Left join</strong>: keep every row from the left table; fill missing right-side columns with <code>NULL</code>. This is how you enrich without losing rows.</li>
        <li><strong>Anti join</strong>: keep left rows that have <em>no</em> match on the right. Perfect for &quot;which customers never ordered?&quot;</li>
        <li><strong>Outer (full) join</strong>: keep everything from both sides, padding with <code>NULL</code> where a match is missing.</li>
      </ul>

      <Basic>
        <p>Think of a join like looking people up in a phone book. An <strong>inner join</strong> is &quot;give me only the people I can find&quot;. A <strong>left join</strong> is &quot;give me all my contacts, and add their phone number if I can find it, otherwise leave it blank&quot;. An <strong>anti join</strong> is &quot;give me the contacts I could <em>not</em> find a number for&quot;. The choice is entirely about which non-matches you keep.</p>
        <p>Aggregation is the opposite move: instead of widening rows, you bucket them. &quot;Total spend per customer&quot; groups all of one customer&apos;s orders and reduces them to a single number.</p>
      </Basic>

      <Advanced>
        <p>Formally, an inner join is a filtered Cartesian product. For tables <M>{"R"}</M> and <M>{"S"}</M> joined on predicate <M>{"\\theta"}</M>:</p>
        <MB>{"R \\bowtie_{\\theta} S = \\sigma_{\\theta}(R \\times S)"}</MB>
        <p>The output cardinality is governed by key multiplicity. If a left key matches <M>{"k"}</M> right rows, that left row is emitted <M>{"k"}</M> times. With many-to-many keys the result can blow up to:</p>
        <MB>{"|R \\bowtie S| = \\sum_{v} m_R(v)\\, m_S(v)"}</MB>
        <p>where <M>{"m_R(v)"}</M> is the number of rows in <M>{"R"}</M> with key value <M>{"v"}</M>. A left join then unions in the unmatched left rows padded with nulls, and an anti join is exactly the set difference <M>{"R - \\pi_R(R \\bowtie S)"}</M>.</p>
      </Advanced>

      <Callout kind="pitfall" title="Fan-out: the silent row explosion">
        If your join key is not unique on the right side, a left join will <strong>duplicate</strong> left rows once per match. Sum a revenue column afterward and your totals are inflated. Always check key uniqueness before joining, or aggregate the right table to one row per key first.
      </Callout>

      <h2>Joins meet aggregations</h2>
      <p>The classic pattern is join-then-group-by: attach a dimension, then summarize. The subtle part is ordering. Aggregating <em>before</em> the join (pre-rolling each table to one row per key) keeps cardinality under control; aggregating <em>after</em> a fan-out double-counts.</p>

      <CodeBlock language="python" filename="join_agg.py">{`import pandas as pd

customers = pd.DataFrame({"customer_id": [1, 2, 3], "region": ["EU", "US", "EU"]})
orders = pd.DataFrame({"customer_id": [1, 1, 2], "amount": [50, 70, 30]})

# Left join: keep all customers, even customer 3 with no orders
enriched = customers.merge(orders, on="customer_id", how="left")
# customer 3 gets NaN amount -> still in the result, not dropped

# Anti join: customers who never ordered
ordered_ids = orders["customer_id"].unique()
never = customers[~customers["customer_id"].isin(ordered_ids)]  # customer 3

# Group-by AFTER the join, with NaN-safe sum
spend = (enriched.groupby("region")["amount"]
                 .sum(min_count=1)
                 .reset_index())
print(spend)`}</CodeBlock>

      <MoreDepth>
        <p>Watch how nulls interact with grouping. A <code>GROUP BY</code> on a column containing nulls bundles all nulls into a single group, while aggregate functions like <code>SUM</code> and <code>AVG</code> silently <em>skip</em> nulls (so an average over five rows with two nulls divides by three, not five). After a left join this means &quot;missing&quot; and &quot;present but null&quot; become indistinguishable downstream. The senior habit: aggregate each side to a guaranteed one-row-per-key grain before joining, so the join is provably one-to-one and fan-out is impossible by construction.</p>
      </MoreDepth>

      <Quiz question="You left-join an orders table onto a products table on product_id, where a product can appear in many orders, then SUM the product's list_price. Why is the total wrong?" options={[
        { text: "The left join dropped products that were never ordered", why: "A left join keeps all left rows; dropping unmatched rows is what an inner join does." },
        { text: "Each product row fans out once per order, so list_price is summed multiple times", why: "Correct: many-to-many fan-out duplicates the left rows, inflating any sum of left-side columns." },
        { text: "SUM ignores NULLs, so the total is too low", why: "Skipping NULLs would understate, not overstate, and is not the issue caused by fan-out duplication." },
        { text: "GROUP BY collapsed all NULL keys into one bucket", why: "Null-key bucketing is a real quirk but unrelated to a price total inflated by row duplication." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="What is the difference between an inner join and a left join, and what trap does a left join still leave you exposed to?" difficulty="easy" tag="Conceptual">
  <p>An <strong>inner join</strong> keeps only rows whose key appears in <em>both</em> tables, so any unmatched row on either side silently disappears. A <strong>left join</strong> keeps every row from the left table and fills the right-side columns with NULL when there is no match, so you never lose left rows.</p>
  <p>The trap: a left join protects you from losing rows, but it does <strong>not</strong> protect you from <em>gaining</em> them. If the right table has duplicate keys (a one-to-many relationship you assumed was one-to-one), each left row fans out into multiple rows. A <M>{"100"}</M>-row customer table left-joined to an orders table can come back with <M>{"10{,}000"}</M> rows.</p>
  <ul>
    <li>Always check the <strong>cardinality</strong> of the join key on the right side before joining (is it unique?).</li>
    <li>After the join, verify row count: a left join should yield <M>{"\\ge"}</M> the left row count, and exactly equal only if the right key is unique.</li>
    <li>If you wanted at-most-one match but the right side has dupes, dedupe or aggregate the right table to one row per key first.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="You join a fact table to a dimension table and your aggregate revenue suddenly doubles. Walk through how you would diagnose and fix this." difficulty="medium" tag="Applied">
  <p>Doubled (or otherwise inflated) measures after a join are the classic symptom of an unintended <strong>many-to-many fan-out</strong>: a key that you treated as unique on the dimension side actually has duplicates, so each fact row is matched multiple times and its revenue is counted more than once.</p>
  <p>Diagnosis steps:</p>
  <ul>
    <li><strong>Count before and after.</strong> Record the fact table row count, then the post-join row count. If it grew, rows were duplicated.</li>
    <li><strong>Find the offending key.</strong> Group the dimension table by the join key and look for any group with count <M>{"> 1"}</M>. Those are your duplicate keys.</li>
    <li><strong>Confirm the multiplier.</strong> If the inflation factor is exactly 2x, the duplicated keys typically have two rows each (e.g., a product that appears under two regions or two effective-date versions).</li>
  </ul>
  <CodeBlock language="python" filename="diagnose_fanout.py">{`import pandas as pd

# 1. Did the join inflate rows?
n_before = len(fact)
joined = fact.merge(dim, on="product_id", how="left")
print("before:", n_before, "after:", len(joined))  # after > before == fan-out

# 2. Which dimension keys are not unique?
dupes = dim["product_id"].value_counts()
print(dupes[dupes > 1])

# 3. Fix A: collapse the dimension to one row per key BEFORE joining
dim_unique = dim.drop_duplicates(subset="product_id", keep="last")
clean = fact.merge(dim_unique, on="product_id", how="left", validate="m:1")
# validate="m:1" raises if the right side is still not unique`}</CodeBlock>
  <p>The robust fix is to make the dimension exactly one row per key (dedupe, or pick the correct version via an effective-date filter), then re-join. The <strong>validate</strong> argument to <strong>merge</strong> turns &quot;I assume this is many-to-one&quot; into an assertion the code checks for you, so the bug fails loudly instead of silently doubling a KPI.</p>
</InterviewProblem>
<InterviewProblem question="In SQL, what is the difference between filtering in WHERE versus HAVING, and why does putting a condition on an aggregate in WHERE fail?" difficulty="medium" tag="Conceptual">
  <p>The two clauses run at different stages of query execution. The logical order is roughly: <strong>FROM/JOIN</strong>, then <strong>WHERE</strong>, then <strong>GROUP BY</strong>, then <strong>HAVING</strong>, then <strong>SELECT</strong>, then <strong>ORDER BY</strong>.</p>
  <ul>
    <li><strong>WHERE</strong> filters individual rows <em>before</em> grouping, so it can only reference raw columns. It cannot see <M>{"\\text{COUNT}(*)"}</M> or <M>{"\\text{SUM}(x)"}</M> because those do not exist yet.</li>
    <li><strong>HAVING</strong> filters whole groups <em>after</em> aggregation, so it can reference aggregate expressions like <M>{"\\text{COUNT}(*) > 5"}</M>.</li>
  </ul>
  <p>Writing <strong>WHERE COUNT(*) &gt; 5</strong> errors because at WHERE time the rows have not been collapsed into groups yet, so the aggregate is undefined. Performance corollary: push every row-level predicate you can into <strong>WHERE</strong> so you aggregate fewer rows, and reserve <strong>HAVING</strong> only for conditions that genuinely depend on the aggregate.</p>
  <CodeBlock language="python" filename="where_vs_having.sql.py">{`query = """
SELECT customer_id, COUNT(*) AS n_orders, SUM(amount) AS total
FROM orders
WHERE status = 'completed'        -- row-level filter, runs first
GROUP BY customer_id
HAVING SUM(amount) > 1000          -- group-level filter, runs after aggregation
ORDER BY total DESC
"""`}</CodeBlock>
</InterviewProblem>
<InterviewProblem question="You have a transactions table and a flagged_accounts table. Write logic to return all transactions belonging to accounts that are NOT flagged, and explain why an anti-join beats NOT IN here." difficulty="hard" tag="Coding">
  <p>This is an <strong>anti-join</strong>: keep left rows that have <em>no</em> match on the right. The idiomatic SQL pattern is a LEFT JOIN followed by a NULL check on the right key; in pandas it is a left merge with an indicator.</p>
  <CodeBlock language="python" filename="anti_join.py">{`import pandas as pd

# pandas anti-join via indicator
merged = transactions.merge(
    flagged_accounts[["account_id"]].drop_duplicates(),
    on="account_id", how="left", indicator=True,
)
clean = merged[merged["_merge"] == "left_only"].drop(columns="_merge")

# Equivalent SQL:
sql = """
SELECT t.*
FROM transactions t
LEFT JOIN flagged_accounts f ON t.account_id = f.account_id
WHERE f.account_id IS NULL          -- no match found  =>  not flagged
"""`}</CodeBlock>
  <p>Why prefer the anti-join over <strong>NOT IN (SELECT account_id FROM flagged_accounts)</strong>:</p>
  <ul>
    <li><strong>NULL safety.</strong> If <strong>flagged_accounts.account_id</strong> contains even one NULL, the entire <strong>NOT IN</strong> predicate evaluates to UNKNOWN for every row and returns <em>zero</em> rows. This is a famously silent, data-dependent bug. The LEFT JOIN / IS NULL pattern is immune to it.</li>
    <li><strong>Performance.</strong> Most optimizers execute <strong>NOT IN</strong> with a NULL-capable subquery less efficiently than a hash anti-join; <strong>NOT EXISTS</strong> or the LEFT JOIN form usually plans better.</li>
    <li><strong>Fan-out control.</strong> Because we deduplicate the right key first and only test for NULL, the anti-join never multiplies transaction rows even if an account were flagged multiple times.</li>
  </ul>
  <p>Note the deduplication of <strong>account_id</strong> on the right: without it, an account flagged twice would still be excluded correctly (it has a match either way), but deduping keeps the merge a clean many-to-one and avoids needless intermediate rows.</p>
</InterviewProblem>

      </>
  );
}
