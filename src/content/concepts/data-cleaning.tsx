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
    <h2>Interview practice</h2>
<InterviewProblem question="Your CRM export has a customer_name column where the same person appears as 'Acme Inc.', 'ACME INC', and 'Acme  Inc' (double space). A naive df.drop_duplicates() leaves all three. Why, and how do you actually deduplicate?" difficulty="easy" tag="Conceptual">
  <p><strong>Why naive dedup fails:</strong> <strong>drop_duplicates</strong> compares values byte-for-byte. &quot;Acme Inc.&quot;, &quot;ACME INC&quot;, and &quot;Acme  Inc&quot; are three distinct strings (different case, punctuation, whitespace), so none collide and nothing is dropped. Exact-match dedup only catches records that are <strong>already identical</strong>; real-world duplicates almost never are.</p>
  <p><strong>The fix is to deduplicate on a normalized key, not the raw value:</strong></p>
  <ul>
    <li>Build a canonical key: lowercase, strip leading/trailing whitespace, collapse internal runs of whitespace to a single space, and remove or standardize punctuation.</li>
    <li>Drop duplicates on that key, keeping the original display value of one row.</li>
    <li>For fuzzier cases (&quot;Acme&quot; vs &quot;Acme Corporation&quot;) exact normalization is not enough; you need <strong>fuzzy matching</strong> (token-set ratio, trigram similarity) or a learned record-linkage / entity-resolution model.</li>
  </ul>
  <CodeBlock language="python" filename="dedup.py">{`import re

def canonical(s):
    s = s.strip().lower()
    s = re.sub(r"[^\\w\\s]", "", s)   # drop punctuation
    s = re.sub(r"\\s+", " ", s)       # collapse whitespace
    return s

df["key"] = df["customer_name"].map(canonical)
clean = df.drop_duplicates(subset="key", keep="first").drop(columns="key")`}</CodeBlock>
  <p>The judgment point interviewers want to hear: <strong>normalization is destructive</strong>, so build the key in a side column and dedupe on it rather than overwriting the original name you may still want to display.</p>
</InterviewProblem>
<InterviewProblem question="A 'revenue' column comes in as the object dtype with values like '$1,200.50', '(450.00)', and 'N/A'. Walk through how you'd convert it to a clean numeric column, and name the traps." difficulty="medium" tag="Applied">
  <p>The column is <strong>object</strong> dtype because at least one value is non-numeric, which forces pandas to store the whole column as Python strings. The goal is a float column with correct signs and proper missing values.</p>
  <p><strong>Step by step:</strong></p>
  <ul>
    <li><strong>Diagnose first.</strong> Look at the unique non-numeric tokens before transforming. Hidden formats (accounting negatives in parentheses, currency symbols, thousands separators, unicode minus signs, trailing spaces) each need handling.</li>
    <li><strong>Strip formatting characters:</strong> remove the currency symbol and thousands commas.</li>
    <li><strong>Convert accounting negatives:</strong> values wrapped in parentheses like &quot;(450.00)&quot; mean <M>{"-450.00"}</M>. Detect the parentheses and negate.</li>
    <li><strong>Coerce to numeric</strong> with <strong>errors=&quot;coerce&quot;</strong> so junk like &quot;N/A&quot; becomes <strong>NaN</strong> instead of crashing.</li>
    <li><strong>Audit what became NaN</strong> so you do not silently turn a parse failure into a missing value you later impute as if it were genuinely absent.</li>
  </ul>
  <CodeBlock language="python" filename="parse_revenue.py">{`import pandas as pd

s = df["revenue"].astype(str).str.strip()
neg = s.str.startswith("(") & s.str.endswith(")")
s = s.str.replace(r"[(),$]", "", regex=True)

rev = pd.to_numeric(s, errors="coerce")
rev[neg] = -rev[neg]

# audit: which rows failed to parse?
bad = df.loc[rev.isna() & df["revenue"].notna(), "revenue"].unique()
print("unparsed tokens:", bad)
df["revenue"] = rev`}</CodeBlock>
  <p><strong>Traps interviewers probe for:</strong> the parentheses-negative convention (easy to drop the sign entirely); conflating &quot;failed to parse&quot; with &quot;truly missing&quot;; and forgetting that <strong>errors=&quot;coerce&quot;</strong> silently swallows new bad formats in future data, so the audit step belongs in a recurring data-quality check, not just a one-off notebook.</p>
</InterviewProblem>
<InterviewProblem question="You read a CSV and some rows show garbled characters like 'café' rendered as 'cafÃ©'. What's the root cause, and how do you fix it without corrupting other rows?" difficulty="medium" tag="Conceptual">
  <p><strong>Root cause: an encoding mismatch (mojibake).</strong> The bytes were written in one encoding and read in another. Classic case: the file is UTF-8, where &quot;é&quot; is two bytes, but it was decoded as Latin-1 / Windows-1252, which interprets each of those bytes as a separate visible character (&quot;Ã&quot; + &quot;©&quot;). The data is not lost; it is being <strong>decoded with the wrong codec.</strong></p>
  <p><strong>How to fix:</strong></p>
  <ul>
    <li><strong>Detect the true encoding</strong> rather than guessing. Inspect raw bytes or use a detector (chardet / charset-normalizer). Confirm by re-reading with the candidate encoding and checking that accented words look right.</li>
    <li><strong>Re-read with the correct codec</strong>, e.g. <strong>pd.read_csv(path, encoding=&quot;utf-8&quot;)</strong>. Reading correctly from the start is far safer than patching strings afterward.</li>
    <li>If you are handed an already-decoded, half-garbled string and cannot re-read the source, a repair library like <strong>ftfy</strong> can fix mojibake. Avoid blind <strong>.encode(&quot;latin-1&quot;).decode(&quot;utf-8&quot;)</strong> round-trips across the whole column: rows that were never broken can themselves be corrupted by that operation, so apply repair only where it is actually needed.</li>
  </ul>
  <p>The key insight: fix the encoding at the <strong>read boundary</strong>. Encoding is a property of bytes-to-text decoding, so the cleanest fix is upstream (read with the right codec), and any post-hoc string surgery risks damaging the rows that were fine.</p>
</InterviewProblem>
<InterviewProblem question="A sensor logs temperature; about 3% of readings are exactly -999, a documented 'no reading' sentinel. You're computing the mean to feed a model. What goes wrong if you ignore this, and what's the principled cleaning step?" difficulty="hard" tag="Math">
  <p><strong>What goes wrong:</strong> <M>{"-999"}</M> is a <strong>sentinel value</strong>, not a real measurement. If you treat it as numeric data, it poisons every aggregate. With a fraction <M>{"p = 0.03"}</M> of sentinels, a true mean <M>{"\\mu_{\\text{true}}"}</M> over valid readings becomes:</p>
  <MB>{"\\bar{x}_{\\text{naive}} = (1-p)\\,\\mu_{\\text{true}} + p\\,(-999)"}</MB>
  <p>So the bias from including the sentinel is:</p>
  <MB>{"\\text{bias} = \\bar{x}_{\\text{naive}} - \\mu_{\\text{true}} = p\\,(-999 - \\mu_{\\text{true}})"}</MB>
  <p>If real temperatures average around <M>{"20"}</M>, the bias is <M>{"0.03 \\times (-999 - 20) \\approx -30.6"}</M> degrees, dragging a true mean of <M>{"20"}</M> down to roughly <M>{"-10.6"}</M>. The variance is inflated even more because the sentinel sits enormously far from the bulk of the data, so any model standardizing on this column gets garbage scale.</p>
  <p><strong>Principled cleaning step:</strong></p>
  <ul>
    <li><strong>Convert the sentinel to an explicit missing value</strong> first: replace <M>{"-999"}</M> with <strong>NaN</strong>. Now aggregates like <strong>.mean()</strong> skip it by default and the bias disappears.</li>
    <li><strong>Decide on missingness deliberately.</strong> Compute statistics on valid readings only, then choose an imputation strategy appropriate to the downstream model, and ideally add a <strong>was_missing</strong> indicator column so the model can learn whether absence is informative (a stuck/offline sensor may correlate with conditions).</li>
  </ul>
  <CodeBlock language="python" filename="sentinel.py">{`import numpy as np

df["temp"] = df["temp"].replace(-999, np.nan)
df["temp_missing"] = df["temp"].isna().astype(int)

mu = df["temp"].mean()          # now over valid readings only
df["temp"] = df["temp"].fillna(mu)`}</CodeBlock>
  <p>The interview-grade point: always reconcile a column against its <strong>data dictionary</strong>. Magic numbers like <M>{"-999"}</M>, <M>{"9999"}</M>, or <M>{"0"}</M> standing in for &quot;unknown&quot; are silent landmines, and the fix is to make missingness explicit before any math touches the column.</p>
</InterviewProblem>

      </>
  );
}
