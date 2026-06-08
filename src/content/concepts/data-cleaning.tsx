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
      <p>Raw data almost never arrives ready to analyze. Columns are stored as text when they should be numbers, the same entity appears under three spellings, and a stray character corrupts a whole file. Cleaning is the unglamorous work of making data <em>mean what it claims to mean</em>.</p>

      <KeyIdea>A model can only be as honest as its inputs. Every silent type coercion, duplicate row, or mixed unit is a lie your analysis will faithfully amplify.</KeyIdea>

      <h2>The four classic failure modes</h2>
      <p>Most cleaning work falls into a handful of recurring categories:</p>
      <ul>
        <li><strong>Types.</strong> A price stored as the string &quot;1,200&quot; will not add, sort, or average correctly. You must parse it into a numeric type, deciding how to handle the comma and any non-numeric junk.</li>
        <li><strong>Duplicates.</strong> The same observation recorded twice inflates counts and biases every aggregate. Exact duplicates are easy; near-duplicates (&quot;ACME Inc&quot; vs &quot;Acme, Inc.&quot;) require fuzzy matching.</li>
        <li><strong>Units.</strong> Mixing kilograms and pounds, or USD and EUR, in one column produces numbers that are individually valid but collectively meaningless.</li>
        <li><strong>Encodings.</strong> A file saved as Latin-1 but read as UTF-8 turns &quot;café&quot; into mojibake. Choosing the wrong encoding silently mangles text.</li>
      </ul>

      <Basic>
        <p>Think of cleaning like sorting a box of mixed coins before counting. If some are pennies labeled as quarters (wrong type), some are counted twice (duplicates), some are foreign currency (wrong units), and a few are smudged beyond recognition (bad encoding), your total will be wrong no matter how carefully you add. You fix the coins first, then count.</p>
      </Basic>

      <Advanced>
        <p>Cleaning is a set of transformations <M>{"T"}</M> applied to a raw table <M>{"D_{\\text{raw}}"}</M> to recover an idealized <M>{"D^{*}"}</M>. We want each step to be <strong>idempotent</strong> and <strong>order-aware</strong>: applying it twice changes nothing, but order can matter (deduplicate before imputing, or you average phantom rows).</p>
        <MB>{"D^{*} = (T_k \\circ \\cdots \\circ T_2 \\circ T_1)(D_{\\text{raw}}), \\quad T_i \\circ T_i = T_i"}</MB>
        <p>For deduplication, define a key function <M>{"\\kappa(r)"}</M> over rows <M>{"r"}</M>; exact dedup keeps one representative per equivalence class. Fuzzy dedup instead clusters rows where a similarity <M>{"s(r_i, r_j) > \\tau"}</M> (e.g. Jaro-Winkler), trading false merges against missed duplicates as you tune <M>{"\\tau"}</M>.</p>
      </Advanced>

      <Callout kind="pitfall" title="Coercion that fails silently">
        Parsing a numeric column with errors set to coerce will turn every unparseable value into a missing value without warning. You can lose 10% of a column and never notice. Always check how many values became null after a type conversion.
      </Callout>

      <CodeBlock language="python" filename="clean.py">{`import pandas as pd

df = pd.read_csv("sales.csv", encoding="utf-8")

# 1. Types: strip thousands separators, then parse to numeric.
df["price"] = (df["price"].astype(str)
                 .str.replace(",", "", regex=False))
df["price"] = pd.to_numeric(df["price"], errors="coerce")
lost = df["price"].isna().sum()
print(f"{lost} prices failed to parse")  # audit the coercion

# 2. Units: normalize lbs -> kg before any aggregation.
mask = df["unit"] == "lb"
df.loc[mask, "weight"] *= 0.453592
df["unit"] = "kg"

# 3. Duplicates: collapse on a stable business key.
df["name_key"] = df["name"].str.lower().str.strip()
df = df.drop_duplicates(subset=["name_key", "date"])
`}</CodeBlock>

      <Callout kind="insight" title="Clean is a contract, not a state">
        Cleaned data is only clean relative to a set of assumptions (this column is positive, dates are ISO-8601, IDs are unique). Encode those assumptions as automated validation checks so new data is held to the same standard.
      </Callout>

      <MoreDepth>
        <p>Beware data leakage during cleaning. If you impute, standardize, or fit a fuzzy-matching threshold using statistics computed over the <em>entire</em> dataset, including the test set, you leak future information into training. Cleaning steps that learn parameters (means, scalers, category vocabularies, dedup thresholds) must be <strong>fit on train only</strong> and then applied to validation and test, exactly like any model. The safe pattern is to wrap them in a pipeline that respects the train/test split.</p>
      </MoreDepth>

      <Quiz question="You convert a text column to numbers using errors='coerce' and your downstream averages look fine. What is the most important thing to check?" options={[
        { text: "How many values became null during the coercion", correct: true, why: "Coerce silently turns unparseable strings into nulls; a large null count means you dropped real data without any error." },
        { text: "Whether the column is sorted", why: "Sort order has no bearing on whether the parse succeeded or lost values." },
        { text: "The number of columns in the dataframe", why: "Column count is unrelated to whether values within one column parsed correctly." },
        { text: "That the file ends with a newline", why: "Trailing newlines are a formatting detail and do not affect numeric coercion of a column." },
      ]} />
    </>
  );
}
