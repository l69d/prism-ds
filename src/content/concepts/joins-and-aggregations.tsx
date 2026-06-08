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
    </>
  );
}
