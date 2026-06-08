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
      <p>Most classical time-series models assume the future looks statistically like the past. Stationarity is the precise name for that assumption, and checking it is usually the first step in any forecasting workflow.</p>

      <KeyIdea>A series is stationary when its statistical &quot;rules of the game&quot; &mdash; mean, variance, and how points relate across time &mdash; stay constant. If those rules drift, a model fit on history won&apos;t generalize to tomorrow.</KeyIdea>

      <h2>Why models need it</h2>
      <p>Methods like ARMA estimate fixed coefficients from the whole sample. If the mean is trending upward or the variance is exploding, a single set of coefficients describes no single regime well. The estimates become biased, confidence intervals lie, and forecasts wander.</p>
      <ul>
        <li><strong>Trend</strong>: the mean changes over time (sales growing year over year).</li>
        <li><strong>Seasonality</strong>: the mean cycles predictably (more ice cream in summer).</li>
        <li><strong>Changing variance</strong>: the spread grows or shrinks (volatility clustering in markets).</li>
      </ul>

      <Basic>
        <p>Imagine measuring the temperature of a pot of water. If it is sitting at room temperature, any minute looks like any other minute &mdash; same average, same wobble. That is stationary. Now turn on the stove: the average keeps climbing. A &quot;typical&quot; reading from five minutes ago tells you little about now. Models like predictable, settled behavior, so we transform a heating-pot series back into a room-temperature-like one before fitting.</p>
      </Basic>

      <Advanced>
        <p>Strict stationarity requires the entire joint distribution to be invariant to time shifts. In practice we use <strong>weak (covariance) stationarity</strong>: the first two moments are time-invariant.</p>
        <MB>{"\\mathbb{E}[X_t] = \\mu, \\quad \\operatorname{Var}(X_t) = \\sigma^2, \\quad \\operatorname{Cov}(X_t, X_{t+h}) = \\gamma(h)"}</MB>
        <p>The autocovariance <M>{"\\gamma(h)"}</M> may depend on the lag <M>{"h"}</M> but never on absolute time <M>{"t"}</M>. A random walk <M>{"X_t = X_{t-1} + \\varepsilon_t"}</M> violates this: <M>{"\\operatorname{Var}(X_t) = t\\,\\sigma^2"}</M> grows without bound.</p>
      </Advanced>

      <h2>How to test and how to get there</h2>
      <p>Plot first. Then test: the <strong>Augmented Dickey-Fuller (ADF)</strong> test has a null of a unit root (non-stationary), while the <strong>KPSS</strong> test has a null of stationarity. Running both guards against the low power of either alone. To reach stationarity, the workhorse is <strong>differencing</strong>: model <M>{"\\nabla X_t = X_t - X_{t-1}"}</M> instead of <M>{"X_t"}</M> (the &quot;I&quot; in ARIMA). Log transforms tame growing variance; seasonal differencing removes cycles.</p>

      <CodeBlock language="python" filename="adf_check.py">{`import numpy as np
from statsmodels.tsa.stattools import adfuller, kpss

def is_stationary(x, alpha=0.05):
    adf_p = adfuller(x, autolag="AIC")[1]
    kpss_p = kpss(x, regression="c", nlags="auto")[1]
    # ADF small p -> reject unit root; KPSS large p -> keep stationary
    return adf_p < alpha and kpss_p > alpha

series = np.cumsum(np.random.randn(500))   # a random walk
print(is_stationary(series))               # False
print(is_stationary(np.diff(series)))      # True after differencing`}</CodeBlock>

      <Callout kind="pitfall" title="Over-differencing">
        Differencing more than necessary injects spurious negative autocorrelation and inflates variance. If the lag-1 autocorrelation of the differenced series is strongly negative (near -0.5), you likely differenced one time too many. Difference the minimum number of times needed to pass the tests.
      </Callout>

      <MoreDepth>
        <p>Not every non-stationary series should be differenced. A <strong>trend-stationary</strong> series (stationary around a deterministic line) is best handled by regressing out the trend, while a <strong>difference-stationary</strong> series (a unit root) needs differencing. Mistaking one for the other &mdash; the classic trend vs. unit-root debate &mdash; gives biased forecasts. Also note that two independent random walks can show a high spurious correlation; cointegration analysis exists precisely to test whether a linear combination of non-stationary series is itself stationary.</p>
      </MoreDepth>

      <Quiz question="A series passes the ADF test (rejects unit root) but also rejects the KPSS null of stationarity. What is the most reasonable read?" options={[
        { text: "The results conflict, suggesting the series may be trend-stationary or borderline; inspect the plot and consider detrending.", correct: true, why: "Conflicting ADF/KPSS verdicts commonly indicate a deterministic trend or an ambiguous case worth visual inspection." },
        { text: "The series is definitely stationary because ADF is the only test that matters.", why: "ADF has low power and a single test is not conclusive; KPSS disagreeing is a real signal." },
        { text: "You must difference the series at least three times.", why: "There is no basis for heavy differencing, and over-differencing harms the model." },
        { text: "The tests are broken and should be ignored.", why: "Disagreement is expected for borderline or trend-stationary series, not a malfunction." },
      ]} />
    </>
  );
}
