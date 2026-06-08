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
    <h2>Interview practice</h2>

<InterviewProblem question="A model trained on transaction data uses a raw Unix timestamp as a feature and performs poorly. Why, and how would you re-engineer it?" difficulty="easy" tag="Conceptual">
  <p>A raw timestamp (or even a parsed date treated as a single integer) is almost monotonic and unbounded, so a tree splits it into &quot;before/after some instant&quot; and a linear model fits a single slope across all of history. Neither captures the thing that usually matters: <strong>cyclical and calendar structure</strong>.</p>
  <p>Decompose the timestamp into features that expose recurring patterns:</p>
  <ul>
    <li><strong>Calendar parts:</strong> hour, day-of-week, day-of-month, week-of-year, month, quarter, year.</li>
    <li><strong>Boolean flags:</strong> is_weekend, is_month_start/end, is_holiday, is_business_hour.</li>
    <li><strong>Cyclical encodings</strong> for periodic parts so that the model knows hour 23 is adjacent to hour 0 (see the next problem).</li>
    <li><strong>Elapsed-time features:</strong> days since signup, days until contract renewal, time since last event (recency).</li>
  </ul>
  <p>Keeping a coarse trend term (e.g. year, or days-since-epoch) is still useful for genuine secular drift, but it should sit <strong>alongside</strong> the decomposed features, not replace them.</p>
</InterviewProblem>

<InterviewProblem question="You one-hot encode hour-of-day. A colleague says to use sine and cosine transforms instead. Explain the motivation and write the encoding." difficulty="medium" tag="Coding">
  <p>One-hot encoding of an hour throws away the <strong>ordering and the wrap-around</strong>: it treats 23:00 and 00:00 as no more similar than 23:00 and 12:00, and it costs 24 columns. A cyclic feature should satisfy &quot;distance 0 hours apart = distance 24 hours apart.&quot; Map the value onto a circle with period <M>{"T"}</M> (here <M>{"T = 24"}</M>):</p>
  <MB>{"x_{\\sin} = \\sin\\!\\left(\\frac{2\\pi t}{T}\\right), \\qquad x_{\\cos} = \\cos\\!\\left(\\frac{2\\pi t}{T}\\right)"}</MB>
  <p>The pair <M>{"(x_{\\sin}, x_{\\cos})"}</M> is a point on the unit circle, so hour 23 and hour 0 land next to each other. Two columns replace twenty-four, and both linear models and distance-based methods now see the cyclic geometry.</p>
  <CodeBlock language="python" filename="cyclic_encode.py">{`import numpy as np
import pandas as pd

def add_cyclic(df, col, period):
    radians = 2 * np.pi * df[col] / period
    df[f"{col}_sin"] = np.sin(radians)
    df[f"{col}_cos"] = np.cos(radians)
    return df

df = pd.DataFrame({"ts": pd.to_datetime(
    ["2026-06-08 23:30", "2026-06-09 00:15"])})
df["hour"] = df["ts"].dt.hour          # 23, 0
df = add_cyclic(df, "hour", period=24)
# the two rows are now near each other in (sin, cos) space`}</CodeBlock>
  <p>Caveat: trees do not need this (they can carve the circle with enough splits), and the encoding only helps when the relationship is truly periodic, not for a one-off calendar event.</p>
</InterviewProblem>

<InterviewProblem question="You join clickstream events to a daily sales table on date, and your churn model gets a great offline AUC that collapses in production. The dates are the suspect. What went wrong?" difficulty="hard" tag="Case">
  <p>Date-based feature engineering is the classic source of <strong>temporal leakage</strong>. The usual culprits:</p>
  <ul>
    <li><strong>Future information in &quot;current&quot; features.</strong> Aggregates like &quot;average spend in the month&quot; computed over the full calendar month include days after the prediction timestamp. Any rolling/window feature must be strictly causal: only data with timestamp <M>{"\\le"}</M> the decision time.</li>
    <li><strong>Time-zone and date-boundary mismatches.</strong> Events stored in UTC joined to sales bucketed in local time shift records across the midnight boundary, silently moving signal between the label window and the feature window.</li>
    <li><strong>Label window overlapping the feature window.</strong> If churn is defined over the next 30 days but features are pulled up to the label date, the model peeks at the outcome period.</li>
    <li><strong>Random train/test split instead of a time-based split.</strong> A random split lets the model train on future rows and test on past ones, inflating offline AUC versus a forward-chained (out-of-time) validation.</li>
  </ul>
  <p>Fixes: define an explicit <strong>cutoff timestamp</strong> per training example, build every feature only from data at or before it, normalize all timestamps to a single time zone before joining, and validate with a rolling/expanding time-based split so the offline setup mirrors the live one.</p>
</InterviewProblem>

<InterviewProblem question="Given a column of free-text product descriptions, what cheap text features would you extract before reaching for embeddings, and when do bag-of-words style features beat them?" difficulty="medium" tag="Applied">
  <p>Start with features that are interpretable, fast, and strong baselines:</p>
  <ul>
    <li><strong>Structural/length features:</strong> character count, word count, average word length, digit count, uppercase ratio, punctuation/special-char counts. These alone catch spam and low-quality listings.</li>
    <li><strong>Pattern flags via regex:</strong> presence of a price, URL, email, phone number, units (&quot;kg&quot;, &quot;ml&quot;), or model numbers.</li>
    <li><strong>Bag-of-words / TF-IDF</strong> over uni- and bi-grams after lowercasing, stripping accents, and tokenizing. TF-IDF down-weights ubiquitous tokens via <M>{"\\text{tfidf}(t,d) = \\text{tf}(t,d)\\cdot\\log\\frac{N}{\\,df(t)\\,}"}</M>.</li>
    <li><strong>Categorical extractions:</strong> brand or category parsed out of the string, then target/one-hot encoded.</li>
  </ul>
  <p>Sparse bag-of-words / TF-IDF features <strong>beat dense embeddings</strong> when: the vocabulary is domain-specific and small, you need an interpretable, auditable model, the dataset is modest (linear models on sparse features are hard to overfit and train in seconds), or exact keyword presence carries the signal. Reach for embeddings when meaning and synonymy matter (&quot;laptop&quot; vs &quot;notebook computer&quot;), when you have enough data to learn from them, and when you can afford the compute and the loss of interpretability.</p>
</InterviewProblem>

      </>
  );
}
