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
      <p>A raw timestamp like <strong>2026-06-08 14:32:00</strong> or a free-text string like <strong>&quot;Order #A-118 shipped&quot;</strong> is almost useless to a model as-is. The skill is turning these into numeric columns that capture the signal hiding inside.</p>

      <KeyIdea>A model cannot learn from a string. Your job is to decompose timestamps into their periodic parts and turn text into counts, flags, or vectors so the patterns become learnable features.</KeyIdea>

      <h2>Why timestamps need decomposing</h2>
      <p>Human behavior is <strong>cyclical</strong>: it repeats by hour, day-of-week, and month. A single integer like a Unix epoch buries all of that structure, so we split a timestamp into separate features:</p>
      <ul>
        <li><strong>Calendar parts</strong>: year, month, day, hour, day-of-week.</li>
        <li><strong>Flags</strong>: is_weekend, is_holiday, is_month_end.</li>
        <li><strong>Deltas</strong>: days since signup, time since last purchase.</li>
      </ul>

      <h2>Turning text into features</h2>
      <p>For short strings, simple extractions often win: length, word count, presence of a keyword, or a regex-extracted code. For real language you reach for bag-of-words, TF-IDF, or embeddings.</p>

      <Basic><p>Think of a date as a wristwatch with separate dials. The hour dial, the weekday dial, and the month dial each tell a different story. If you only read the running second-count, you miss that &quot;Friday 6pm&quot; behaves like every other Friday 6pm. Splitting the dials lets the model see &quot;this is a weekend evening&quot; instead of one giant meaningless number. Text works the same way: instead of feeding the whole sentence, you pull out the parts that matter, like how long it is or whether it contains the word &quot;refund&quot;.</p></Basic>

      <Advanced><p>Cyclical features have a discontinuity: hour 23 and hour 0 are adjacent in reality but maximally far apart numerically. Encode them on a circle with sine and cosine so the distance respects the wrap-around:</p>
      <MB>{"x_{\\sin} = \\sin\\left(\\frac{2\\pi h}{24}\\right), \\quad x_{\\cos} = \\cos\\left(\\frac{2\\pi h}{24}\\right)"}</MB>
      <p>For text, TF-IDF weights a term <M>{"t"}</M> in document <M>{"d"}</M> as the product of term frequency and inverse document frequency:</p>
      <MB>{"w_{t,d} = \\mathrm{tf}(t,d) \\cdot \\log\\frac{N}{1 + \\mathrm{df}(t)}"}</MB>
      <p>where <M>{"N"}</M> is the number of documents and <M>{"\\mathrm{df}(t)"}</M> is how many contain <M>{"t"}</M>. Rare-but-present terms get up-weighted; ubiquitous words like &quot;the&quot; get crushed toward zero.</p></Advanced>

      <Callout kind="pitfall" title="Beware naive ordinal encoding of cycles">Encoding month as 1 through 12 tells the model December (12) is &quot;far&quot; from January (1), when they are neighbors. Use sine/cosine pairs or one-hot for cyclical fields, not a raw integer.</Callout>

      <CodeBlock language="python" filename="features.py">{`import numpy as np
import pandas as pd

df = pd.DataFrame({"ts": pd.to_datetime(["2026-06-08 14:32", "2026-12-31 23:05"]),
                   "note": ["Order #A-118 shipped", "refund issued late"]})

# --- Date features ---
df["hour"] = df["ts"].dt.hour
df["dow"] = df["ts"].dt.dayofweek          # 0 = Monday
df["is_weekend"] = df["dow"] >= 5
df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)

# --- Text features ---
df["n_words"] = df["note"].str.split().str.len()
df["has_refund"] = df["note"].str.contains("refund", case=False)
df["order_id"] = df["note"].str.extract(r"#([A-Z]-\\d+)")
print(df)`}</CodeBlock>

      <MoreDepth><p>The subtle trap is <strong>leakage through time</strong>. Features like &quot;days since last event&quot; or TF-IDF&apos;s document-frequency must be computed only from data available at prediction time. If you fit TF-IDF on the full corpus including the test set, future documents leak vocabulary statistics into training. Likewise, fit calendar-derived aggregates (e.g., per-weekday means) on training folds only, then apply them forward. Always treat time as a one-way street.</p></MoreDepth>

      <Quiz question="Why encode the hour of day with sin/cos instead of a single integer 0-23?" options={[
        { text: "It reduces the number of columns from two to one.", why: "It actually creates two columns, not fewer." },
        { text: "It makes hour 23 and hour 0 numerically close, respecting the daily wrap-around.", correct: true, why: "Sin/cos place adjacent hours close on a circle, fixing the 23-to-0 discontinuity." },
        { text: "It converts the hour into a probability between 0 and 1.", why: "Sin/cos range over [-1, 1] and are not probabilities." },
        { text: "It removes the need to extract day-of-week.", why: "Hour and day-of-week capture different cycles; one does not replace the other." },
      ]} />
    </>
  );
}
