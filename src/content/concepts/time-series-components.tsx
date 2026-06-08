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
    <h2>Interview practice</h2>
<InterviewProblem question="What are the components of a time series, and what is the difference between an additive and a multiplicative decomposition?" difficulty="easy" tag="Conceptual">
  <p>A classical decomposition splits a series into three pieces:</p>
  <ul>
    <li><strong>Trend</strong> — the slow, long-run direction (a smooth upward or downward drift).</li>
    <li><strong>Seasonality</strong> — a fixed-period pattern that repeats (daily, weekly, yearly), e.g. retail sales spiking every December.</li>
    <li><strong>Residual / noise</strong> — what is left after removing trend and seasonality; ideally unpredictable.</li>
  </ul>
  <p>The <strong>additive</strong> model assumes the parts add up:</p>
  <MB>{"y_t = T_t + S_t + R_t"}</MB>
  <p>The <strong>multiplicative</strong> model assumes they scale together:</p>
  <MB>{"y_t = T_t \\times S_t \\times R_t"}</MB>
  <p>Use <strong>additive</strong> when the seasonal swing has roughly constant <em>absolute</em> size regardless of the trend level. Use <strong>multiplicative</strong> when the seasonal swing grows <em>proportionally</em> with the level — the December spike is &quot;20% above trend&quot; rather than &quot;+5000 units.&quot; A multiplicative model is just an additive model on the log: taking <M>{"\\log y_t = \\log T_t + \\log S_t + \\log R_t"}</M> linearizes it, which is why analysts often log-transform before decomposing.</p>
</InterviewProblem>
<InterviewProblem question="You decompose daily web-traffic data and the residual still shows a clear weekly oscillation. What went wrong and how would you fix it?" difficulty="medium" tag="Applied">
  <p>A residual that still oscillates means the seasonal component did not capture all the periodic structure. The residual is supposed to look like noise; visible structure is a diagnostic that the model is misspecified. Common causes and fixes:</p>
  <ul>
    <li><strong>Wrong or single period.</strong> Daily web data usually has <em>multiple</em> seasonalities — a weekly cycle (period 7) <em>and</em> a yearly cycle (period 365). A simple decomposition that only removed one will leave the other in the residual. Use a method that supports multiple seasonal periods (e.g. STL applied iteratively, or MSTL / TBATS).</li>
    <li><strong>Additive vs multiplicative mismatch.</strong> If the weekly swing grows with traffic, an additive fit leaves a growing wiggle in the residual. Log-transform first or switch to a multiplicative model.</li>
    <li><strong>Over-smoothed seasonal window.</strong> If the seasonal component is estimated too rigidly (assumed constant across the whole sample) but the weekly shape actually drifts over time, the leftover drift shows up in the residual. STL has a seasonal-smoothing parameter that lets the seasonal shape evolve.</li>
    <li><strong>Calendar effects.</strong> Holidays, paydays, and month-end shift traffic in ways a pure period-7 term cannot model; add explicit calendar regressors.</li>
  </ul>
  <p>Verify the fix by re-plotting the residual and its autocorrelation function (ACF): a well-specified decomposition leaves an ACF with no significant spike at the seasonal lag.</p>
</InterviewProblem>
<InterviewProblem question="Given monthly sales, compute a 12-month centered moving average to estimate the trend, and explain why you need the centering step." difficulty="medium" tag="Math">
  <p>A moving average of the right window length averages out a full seasonal cycle, leaving the trend. For monthly data the natural window is 12. The subtlety is that 12 is <strong>even</strong>: a plain 12-term average sits <em>between</em> two months, not on a month, so you take a second 2-term average to re-center it. The standard <M>{"2 \\times 12"}</M> centered moving average for month <M>{"t"}</M> is</p>
  <MB>{"\\hat{T}_t = \\frac{1}{24}\\,y_{t-6} + \\frac{1}{12}\\sum_{k=-5}^{5} y_{t+k} + \\frac{1}{24}\\,y_{t+6}"}</MB>
  <p>The half-weights on the endpoints (<M>{"y_{t-6}"}</M> and <M>{"y_{t+6}"}</M>) are exactly what the re-centering produces, and the weights sum to 1 so the trend is unbiased in level. Centering matters because an uncentered even-length average is phase-shifted by half a step, which would misalign the estimated trend with the data and contaminate the seasonal estimate. After removing the trend (<M>{"y_t - \\hat{T}_t"}</M> for additive), you average the detrended values by calendar month to get the seasonal indices.</p>
  <CodeBlock language="python" filename="centered_ma.py">{`import numpy as np

def centered_ma_12(y):
    """2x12 centered moving average trend for monthly data."""
    n = len(y)
    trend = np.full(n, np.nan)
    for t in range(6, n - 6):
        # half weights on the two endpoints, full weight in the middle
        window = y[t - 6 : t + 7].astype(float)
        weights = np.ones(13)
        weights[0] = weights[-1] = 0.5
        trend[t] = np.dot(window, weights) / weights.sum()  # weights.sum() == 12
    return trend

# the first/last 6 points have no full window -> NaN, a known edge effect
`}</CodeBlock>
</InterviewProblem>
<InterviewProblem question="Why is correctly identifying and removing seasonality important before fitting an ARIMA model, and how does this connect to stationarity?" difficulty="hard" tag="Conceptual">
  <p>ARIMA assumes the differenced series is (weakly) <strong>stationary</strong> — constant mean, constant variance, and an autocovariance that depends only on the lag. Seasonality directly violates this: the mean of December differs systematically from the mean of June, so the unconditional mean is not constant. If you feed a seasonal series to a plain ARIMA, several things go wrong:</p>
  <ul>
    <li>The ACF and PACF used for order selection show large spikes at the seasonal lags, masking the short-lag structure you actually want to model.</li>
    <li>The model wastes parameters chasing the periodic pattern with ordinary AR/MA terms, which fit it poorly and generalize worse.</li>
    <li>Forecasts revert to a flat mean instead of reproducing the seasonal shape.</li>
  </ul>
  <p>Two standard remedies, both rooted in the decomposition view:</p>
  <ul>
    <li><strong>Seasonal differencing</strong> — model the change versus the same period last cycle, <M>{"\\nabla_s y_t = y_t - y_{t-s}"}</M> (with <M>{"s=12"}</M> for monthly). This is the &quot;S&quot; in <strong>SARIMA</strong> and removes a stochastic seasonal component while keeping the series on its original scale.</li>
    <li><strong>Deterministic deseasonalizing</strong> — subtract estimated seasonal indices (or add Fourier / dummy regressors) and model the remainder.</li>
  </ul>
  <p>The unifying idea: decomposition is not just a visualization. Each component maps to a modeling decision — trend to a differencing order <M>{"d"}</M>, seasonality to a seasonal order <M>{"(D, s)"}</M>, and the residual to the ARMA structure <M>{"(p, q)"}</M> you fit on what remains. Get the components wrong and every downstream order is biased.</p>
</InterviewProblem>

      </>
  );
}
