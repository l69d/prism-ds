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
      <p>
        A time series is rarely one clean signal. It is usually a few simpler
        patterns stacked on top of each other, plus some randomness. Pulling
        them apart is called <strong>decomposition</strong>.
      </p>

      <KeyIdea>
        Most series can be read as three layers: a slow drift
        (<strong>trend</strong>), a repeating calendar pattern
        (<strong>seasonality</strong>), and whatever is left over
        (<strong>noise</strong>). Model what repeats, and treat the rest as
        uncertainty.
      </KeyIdea>

      <h2>The three components</h2>
      <ul>
        <li>
          <strong>Trend</strong> — the long-run direction. Are values generally
          rising, falling, or flat over months and years?
        </li>
        <li>
          <strong>Seasonality</strong> — a pattern that repeats on a fixed
          period: hotter every summer, more retail sales every December, more
          traffic every weekday morning.
        </li>
        <li>
          <strong>Noise</strong> (or the <em>remainder</em>) — the irregular
          fluctuation left after trend and seasonality are removed. Good models
          leave behind noise that looks structureless.
        </li>
      </ul>

      <Basic>
        <p>
          Think of monthly ice-cream sales. Over a decade the store grows, so
          sales drift upward &mdash; that is the trend. Every July sales spike
          and every January they slump &mdash; that is seasonality. One random
          rainy July that hurt sales is noise. If you can describe the drift and
          the repeating bumps, you can forecast next July fairly well, and you
          stop being surprised by the regular swings.
        </p>
      </Basic>

      <Advanced>
        <p>
          Two standard forms combine the components. The
          <strong> additive</strong> model assumes the seasonal swing has a
          roughly constant size:
        </p>
        <MB>{"y_t = T_t + S_t + R_t"}</MB>
        <p>
          The <strong>multiplicative</strong> model assumes the swing grows with
          the level (a 10% holiday bump, not a fixed +500 units):
        </p>
        <MB>{"y_t = T_t \\times S_t \\times R_t"}</MB>
        <p>
          A multiplicative series becomes additive under a log transform, since
          <M>{"\\log(T_t S_t R_t) = \\log T_t + \\log S_t + \\log R_t"}</M>.
          Classical decomposition estimates <M>{"T_t"}</M> with a centered
          moving average of window equal to the seasonal period
          <M>{"m"}</M>, then averages the detrended values within each season to
          get <M>{"S_t"}</M>, leaving <M>{"R_t"}</M>. Robust modern methods like
          STL use loess smoothing and let the seasonal shape evolve over time.
        </p>
      </Advanced>

      <Callout kind="pitfall" title="Additive vs multiplicative is not cosmetic">
        If the seasonal swings clearly fan out as the series rises, an additive
        model will under-fit peaks and over-fit troughs. Either switch to
        multiplicative or log-transform first &mdash; otherwise your residuals
        will still carry obvious seasonal structure.
      </Callout>

      <CodeBlock language="python" filename="decompose.py">{`import pandas as pd
from statsmodels.tsa.seasonal import STL

# series: a pandas Series with a monthly DatetimeIndex
stl = STL(series, period=12, robust=True)
res = stl.fit()

trend      = res.trend       # slow drift
seasonal   = res.seasonal    # repeating 12-month shape
remainder  = res.resid       # what is left = noise

# A healthy decomposition: remainder has no visible pattern.
print(remainder.describe())
`}</CodeBlock>

      <Callout kind="insight" title="Decomposition is a diagnostic, not just a model">
        Even when you forecast with something else, decomposing first tells you
        what to model: a strong seasonal term means you need seasonal features
        or a seasonal model; structure left in the remainder means you missed
        something.
      </Callout>

      <MoreDepth>
        <p>
          Real series often hide a fourth element: a <strong>cyclical</strong>
          component &mdash; multi-year ups and downs (like business cycles) whose
          period is <em>not</em> fixed. Classical decomposition folds cycles into
          the trend because it cannot separate a non-periodic wobble from drift.
          That is fine for short-horizon forecasts but dangerous for long ones:
          extrapolating a &quot;trend&quot; that is actually the upswing of a cycle
          will overshoot badly when the cycle turns. When the period itself
          drifts, prefer state-space or STL-style methods that allow the seasonal
          and trend terms to evolve rather than assuming them rigid.
        </p>
      </MoreDepth>

      <Quiz
        question="Sales swing by roughly +/-15% around the trend every December, and the absolute size of that swing grows as overall sales grow. Which decomposition fits best?"
        options={[
          { text: "Multiplicative (or additive on log-transformed data)", correct: true, why: "A swing proportional to the level is exactly the multiplicative case, and taking logs turns it into an additive one." },
          { text: "Purely additive on the raw data", why: "Additive assumes a constant-size swing, so it would mis-fit the growing peaks and troughs." },
          { text: "No decomposition is possible because the swing changes size", why: "A changing swing size is normal; it just points to the multiplicative form rather than ruling decomposition out." },
          { text: "Trend-only, since seasonality varies", why: "There is a clear, regular December pattern, so dropping the seasonal component throws away real structure." },
        ]}
      />
    </>
  );
}
