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
      <p>Before you run a single model, you have to know what each column actually <em>is</em>. The data type is not a storage detail&mdash;it is a contract about which operations are meaningful.</p>

      <KeyIdea>A variable&apos;s type tells you which operations are <strong>legal</strong>. You can average temperatures but not zip codes; you can rank exam grades but not subtract them. The type dictates the method.</KeyIdea>

      <h2>The five types you meet</h2>
      <ul>
        <li><strong>Numeric (continuous)</strong> &mdash; measured quantities like height or price. Arithmetic is meaningful: sums, means, distances.</li>
        <li><strong>Categorical (nominal)</strong> &mdash; unordered labels like country or color. Only equality (&quot;same or different&quot;) makes sense.</li>
        <li><strong>Ordinal</strong> &mdash; ordered labels like &quot;low / medium / high&quot;. You can rank, but the gaps are not equal.</li>
        <li><strong>Text</strong> &mdash; free-form strings; needs tokenizing or embedding before a model can use it.</li>
        <li><strong>Time</strong> &mdash; timestamps with a special structure: ordering, periodicity, and the rule that the future must never leak into the past.</li>
      </ul>

      <h2>Why it dictates the method</h2>
      <Basic>
        <p>Think of types as the units on a ruler. A numeric column has a real ruler&mdash;the distance from 10 to 20 equals the distance from 50 to 60&mdash;so a mean and a standard deviation are honest summaries. A categorical column has no ruler at all; computing the &quot;average country&quot; is nonsense, so you summarize with counts or a mode instead.</p>
        <p>Ordinal data is the tricky middle: there&apos;s an order (a 5-star review beats 3 stars) but the rungs are unevenly spaced, so you rank rather than average. Match the summary to the ruler and your analysis stays truthful.</p>
      </Basic>
      <Advanced>
        <p>Formally, types map onto Stevens&apos; <strong>levels of measurement</strong>, each admitting a larger group of permissible transformations:</p>
        <ul>
          <li><strong>Nominal:</strong> invariant under any bijection <M>{"\\phi"}</M>; only <M>{"="}</M> is defined.</li>
          <li><strong>Ordinal:</strong> invariant under monotonic <M>{"\\phi"}</M>; order is defined but differences are not.</li>
          <li><strong>Interval:</strong> invariant under <M>{"\\phi(x)=ax+b"}</M>; differences are meaningful, but ratios are not (no true zero).</li>
          <li><strong>Ratio:</strong> invariant under <M>{"\\phi(x)=ax"}</M>; a true zero makes ratios meaningful.</li>
        </ul>
        <p>A statistic is valid only if it is invariant under that level&apos;s transformations. The arithmetic mean is meaningful at interval/ratio scale because it commutes with affine maps:</p>
        <MB>{"\\frac{1}{n}\\sum_i (a x_i + b) = a\\,\\bar{x} + b"}</MB>
        <p>The median, by contrast, survives any monotonic map, so it is the natural center for ordinal data&mdash;which is exactly why misapplying a mean to ranks silently violates the scale.</p>
      </Advanced>

      <Callout kind="pitfall" title="The integer-encoding trap">
        Encoding a nominal feature as integers (Red=0, Green=1, Blue=2) and feeding it to a linear or distance-based model invents a fake order and fake distances: it claims Blue is &quot;twice&quot; Green and that Green sits between Red and Blue. Use one-hot encoding for nominal data; reserve integer labels for genuinely ordinal features.
      </Callout>

      <CodeBlock language="python" filename="encode_by_type.py">{`import pandas as pd

df = pd.DataFrame({
    "price":  [10.0, 25.0, 7.5],       # numeric (ratio)
    "color":  ["red", "green", "blue"], # nominal
    "size":   ["S", "L", "M"],          # ordinal
})

# Numeric: arithmetic is valid
print(df["price"].mean())

# Nominal: one-hot, no fake order
nominal = pd.get_dummies(df["color"], prefix="color")

# Ordinal: an ENCODED order, not arbitrary integers
order = ["S", "M", "L"]
df["size"] = pd.Categorical(df["size"], categories=order, ordered=True)
df["size_code"] = df["size"].cat.codes   # S=0, M=1, L=2 with meaning

print(pd.concat([df[["price", "size_code"]], nominal], axis=1))`}</CodeBlock>

      <MoreDepth>
        <p>Cardinality and context can shift the right treatment. A high-cardinality nominal feature (tens of thousands of user IDs) breaks one-hot encoding&mdash;you reach for target/mean encoding, hashing, or learned embeddings instead. Conversely, a numeric column with only a handful of distinct values (1&ndash;5 star ratings) often behaves more like ordinal data, and binning a continuous variable downgrades it to ordinal on purpose to capture nonlinearity. The deepest pitfall is time: its &quot;type&quot; carries an ordering constraint that no shuffle-based cross-validation respects, so a careless train/test split leaks the future and inflates every metric.</p>
      </MoreDepth>

      <Quiz question="You have a 'satisfaction' column with values Low, Medium, High. Which treatment respects its type?" options={[
        { text: "One-hot encode it, since the labels are just categories", why: "This throws away the genuine ordering (High > Medium > Low), losing real information the model could use." },
        { text: "Map to ordered codes 0/1/2 and treat as ordinal", correct: true, why: "Ordinal data has a meaningful order but unequal gaps, so an ordered encoding preserves the ranking without inventing exact distances." },
        { text: "Compute the arithmetic mean to get an 'average satisfaction'", why: "The mean assumes equal interval spacing, which ordinal data does not have; the median is the appropriate center." },
        { text: "Standardize it to zero mean and unit variance", why: "Standardization presumes a numeric/interval scale; applying it to ranks fabricates distances that don't exist." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="What is the difference between nominal, ordinal, interval, and ratio data, and why does it matter for modeling?" difficulty="easy" tag="Conceptual">
  <p>These are the four measurement scales, ordered by how much structure they carry:</p>
  <ul>
    <li><strong>Nominal</strong> (categorical, unordered): labels with no rank, e.g. country or browser. Only equality is meaningful. You can count modes but not average them.</li>
    <li><strong>Ordinal</strong>: ordered categories with unknown spacing, e.g. survey ratings &quot;poor &lt; fair &lt; good&quot;. Order is meaningful, but the gap between levels is not. Median is valid; mean is suspect.</li>
    <li><strong>Interval</strong>: numeric with meaningful gaps but no true zero, e.g. temperature in Celsius. Differences are interpretable; ratios are not (20&deg;C is not &quot;twice as hot&quot; as 10&deg;C).</li>
    <li><strong>Ratio</strong>: numeric with a true zero, e.g. counts, price, duration. Both differences and ratios are meaningful.</li>
  </ul>
  <p>Why it matters: the scale dictates valid statistics and encodings. Nominal features need one-hot or target encoding; ordinal features should keep their order (ordinal encoding); a true zero on ratio data justifies log transforms and ratio features. Treating an ordinal as nominal throws away signal, while treating a nominal ID as numeric injects a fake ordering the model will exploit.</p>
</InterviewProblem>
<InterviewProblem question="You have a categorical feature 'zip_code' with 30,000 distinct values. How would you encode it for a gradient-boosted tree model?" difficulty="medium" tag="Applied">
  <p>High-cardinality nominal features break naive encodings, so I would reason about the options:</p>
  <ul>
    <li><strong>One-hot</strong>: creates 30,000 sparse columns. This explodes memory, slows split-finding, and each binary column is so sparse that trees rarely find clean splits. Reject it here.</li>
    <li><strong>Ordinal / label encoding</strong>: maps each zip to an integer. Trees can split on it, but the integer ordering is arbitrary, so it works far better for trees than linear models. Acceptable as a baseline.</li>
    <li><strong>Target (mean) encoding</strong>: replace each zip with a smoothed estimate of the target conditional on that zip. This is usually the strongest choice for high-cardinality categoricals.</li>
  </ul>
  <p>I would use target encoding with smoothing toward the global mean to control variance on rare zips:</p>
  <MB>{"\\hat{y}_c = \\frac{n_c \\,\\bar{y}_c + m\\,\\bar{y}}{n_c + m}"}</MB>
  <p>where <M>{"n_c"}</M> is the count for category <M>{"c"}</M>, <M>{"\\bar{y}_c"}</M> its category mean, <M>{"\\bar{y}"}</M> the global mean, and <M>{"m"}</M> a smoothing strength. Critically, the encoding must be computed with <strong>out-of-fold</strong> or leave-one-out logic; encoding on the full data leaks the target into the feature and inflates validation scores. I would also collapse very rare zips into an &quot;other&quot; bucket and consider geographic rollups (first 3 digits) as an additional coarser feature.</p>
  <CodeBlock language="python" filename="target_encode.py">{`import numpy as np
import pandas as pd
from sklearn.model_selection import KFold

def oof_target_encode(df, col, target, m=20.0, n_splits=5, seed=0):
    global_mean = df[target].mean()
    encoded = pd.Series(np.nan, index=df.index)
    kf = KFold(n_splits=n_splits, shuffle=True, random_state=seed)
    for tr, va in kf.split(df):
        stats = df.iloc[tr].groupby(col)[target].agg(["mean", "count"])
        smooth = (stats["count"] * stats["mean"] + m * global_mean) / (stats["count"] + m)
        encoded.iloc[va] = df.iloc[va][col].map(smooth).fillna(global_mean)
    return encoded.astype(float)`}</CodeBlock>
</InterviewProblem>
<InterviewProblem question="A column is stored as the string '$1,250.00' for price and another as '2026-06-08' for a date. Why is correct typing a modeling decision, not just a parsing chore?" difficulty="medium" tag="Conceptual">
  <p>Because the stored representation hides the structure the model needs, and the wrong type silently degrades the model:</p>
  <ul>
    <li><strong>Price as string</strong>: left as text it becomes a high-cardinality nominal feature where &quot;$1,250.00&quot; and &quot;$1,251.00&quot; look as unrelated as two random words. Parsed to a float, the model recovers ordering, magnitude, and the ability to learn monotone or log-scaled effects.</li>
    <li><strong>Date as string</strong>: as text it is just a label per day. Parsed to a datetime it unlocks derived features that actually carry signal: day-of-week, month, is-holiday, time-since-event, and cyclical encodings. A raw date also must respect time order to avoid leakage in train/test splits.</li>
  </ul>
  <p>For cyclical fields like month or hour, distance must wrap around (December is adjacent to January). Encode with sine/cosine pairs so the model sees the wrap:</p>
  <MB>{"\\big(\\sin\\tfrac{2\\pi t}{T},\; \\cos\\tfrac{2\\pi t}{T}\\big)"}</MB>
  <p>with period <M>{"T = 12"}</M> for months. The point: typing determines the geometry the model operates in. Get the type wrong and you either inject false relationships or destroy real ones, no matter how good the algorithm is.</p>
</InterviewProblem>
<InterviewProblem question="Given a pandas DataFrame, write a routine that audits each column and proposes a type: numeric, categorical, ordinal-candidate, datetime, or free text. How do you decide?" difficulty="hard" tag="Coding">
  <p>Type inference is a heuristic problem; I lean on dtype, cardinality, parse-ability, and the ratio of unique values to rows:</p>
  <ul>
    <li><strong>Datetime</strong>: object column where a high fraction of non-null values parse as dates.</li>
    <li><strong>Numeric</strong>: numeric dtype, or an object column that fully parses to numbers after stripping currency/thousands symbols.</li>
    <li><strong>Categorical</strong>: low cardinality relative to row count (e.g. unique-ratio below a threshold or unique count under a small cap).</li>
    <li><strong>Free text</strong>: high cardinality object column with long, mostly-unique strings (likely IDs or natural language).</li>
  </ul>
  <p>Ordinal cannot be inferred from values alone, so I flag low-cardinality strings as ordinal candidates for a human to confirm the order.</p>
  <CodeBlock language="python" filename="type_audit.py">{`import pandas as pd

def propose_type(s: pd.Series, cat_unique_ratio=0.05, cat_max_unique=50):
    n = len(s)
    nn = s.dropna()
    if nn.empty:
        return "empty"
    if pd.api.types.is_numeric_dtype(s):
        return "categorical" if nn.nunique() <= 10 else "numeric"
    # try datetime
    parsed = pd.to_datetime(nn, errors="coerce")
    if parsed.notna().mean() > 0.9:
        return "datetime"
    # try numeric hidden in strings like "$1,250.00"
    cleaned = nn.astype(str).str.replace(r"[\\$,]", "", regex=True)
    as_num = pd.to_numeric(cleaned, errors="coerce")
    if as_num.notna().mean() > 0.9:
        return "numeric"
    nunique = nn.nunique()
    ratio = nunique / n
    if nunique <= cat_max_unique and ratio <= cat_unique_ratio:
        return "ordinal-candidate"   # low-card string: confirm order with a human
    return "free-text"

def audit(df: pd.DataFrame) -> pd.DataFrame:
    rows = [(c, str(df[c].dtype), df[c].nunique(dropna=True), propose_type(df[c]))
            for c in df.columns]
    return pd.DataFrame(rows, columns=["column", "dtype", "n_unique", "proposed_type"])`}</CodeBlock>
  <p>The interviewer is usually probing whether you know inference is fallible: I would never auto-apply these, only surface them as a report for review, because misclassifying an ID as numeric or an ordinal as nominal has real downstream cost.</p>
</InterviewProblem>

      </>
  );
}
