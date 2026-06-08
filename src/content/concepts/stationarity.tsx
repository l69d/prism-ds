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
    <h2>Interview practice</h2>

<InterviewProblem question="What does it mean for a time series to be stationary, and why do so many forecasting models require it?" difficulty="easy" tag="Conceptual">
  <p>A series is <strong>strictly stationary</strong> if the joint distribution of any collection of points is invariant to time shifts. In practice we use the weaker, testable notion of <strong>weak (covariance) stationarity</strong>, which requires three things:</p>
  <ul>
    <li><strong>Constant mean</strong>: <M>{"\\mathbb{E}[X_t] = \\mu"}</M> for all <M>{"t"}</M>.</li>
    <li><strong>Constant, finite variance</strong>: <M>{"\\operatorname{Var}(X_t) = \\sigma^2 < \\infty"}</M>.</li>
    <li><strong>Autocovariance depends only on the lag</strong>, not on absolute time: <M>{"\\operatorname{Cov}(X_t, X_{t+h}) = \\gamma(h)"}</M>.</li>
  </ul>
  <p>Models like ARMA assume these properties so that parameters estimated on the past are valid in the future. If the mean drifts or the variance explodes, then a single set of coefficients cannot describe the whole series, the sample statistics do not converge to stable population values, and standard errors and forecast intervals become unreliable. Worse, two unrelated trending series will look highly correlated &mdash; the classic <strong>spurious regression</strong> problem &mdash; so regressions on non-stationary data can manufacture significance out of nothing.</p>
</InterviewProblem>

<InterviewProblem question="You run an ADF test and a KPSS test on the same series and get conflicting signals. How do you interpret that, and what are the null hypotheses?" difficulty="medium" tag="Applied">
  <p>The key is that the two tests have <strong>opposite null hypotheses</strong>, so you should always read them together:</p>
  <ul>
    <li><strong>ADF (Augmented Dickey-Fuller)</strong>: null is &quot;there is a unit root&quot; (non-stationary). A small p-value lets you <strong>reject</strong> the unit root, i.e. evidence <strong>for</strong> stationarity.</li>
    <li><strong>KPSS</strong>: null is &quot;the series is (trend-)stationary&quot;. A small p-value lets you reject stationarity, i.e. evidence <strong>against</strong> it.</li>
  </ul>
  <p>The four combinations:</p>
  <ul>
    <li><strong>ADF rejects + KPSS does not reject</strong> &rarr; both agree the series is stationary.</li>
    <li><strong>ADF does not reject + KPSS rejects</strong> &rarr; both agree it is non-stationary; difference it.</li>
    <li><strong>Both reject</strong> &rarr; conflicting; the series may be <strong>trend-stationary</strong>. Detrend (regress out a deterministic trend) rather than differencing.</li>
    <li><strong>Neither rejects</strong> &rarr; the data are not informative enough; the tests lack power. Treat as inconclusive, inspect the plot and ACF, and lean on domain knowledge.</li>
  </ul>
  <p>Two practical cautions: ADF has notoriously low power against near-unit-root processes (a stationary AR(1) with <M>{"\\phi"}</M> close to 1 is hard to distinguish from a random walk), and both tests are sensitive to whether you include a constant and trend term in the specification. Always pick the deterministic terms to match what the plot shows.</p>
</InterviewProblem>

<InterviewProblem question="Show why a random walk is non-stationary, and explain why first-differencing fixes it." difficulty="medium" tag="Math">
  <p>Take the random walk <M>{"X_t = X_{t-1} + \\varepsilon_t"}</M> with <M>{"X_0 = 0"}</M> and i.i.d. shocks <M>{"\\varepsilon_t"}</M> of mean 0 and variance <M>{"\\sigma^2"}</M>. Unrolling the recursion gives a cumulative sum of shocks:</p>
  <MB>{"X_t = \\sum_{i=1}^{t} \\varepsilon_i"}</MB>
  <p>The mean is fine (<M>{"\\mathbb{E}[X_t] = 0"}</M>), but the variance grows without bound in time:</p>
  <MB>{"\\operatorname{Var}(X_t) = \\sum_{i=1}^{t} \\operatorname{Var}(\\varepsilon_i) = t\\,\\sigma^2"}</MB>
  <p>Variance depends on <M>{"t"}</M>, so the constant-variance condition fails and the series is non-stationary (it has a <strong>unit root</strong>). Now first-difference:</p>
  <MB>{"\\nabla X_t = X_t - X_{t-1} = \\varepsilon_t"}</MB>
  <p>The differenced series is just white noise &mdash; constant mean 0, constant variance <M>{"\\sigma^2"}</M>, and zero autocovariance at all non-zero lags &mdash; which is stationary. This is exactly why the &quot;I&quot; (integrated) order in ARIMA counts how many times you difference to reach stationarity. A pitfall: if a series is only trend-stationary (deterministic trend plus stationary noise), differencing it works but <strong>over-differences</strong>, injecting a non-invertible MA unit root and inflating variance &mdash; detrending is the right tool there.</p>
</InterviewProblem>

<InterviewProblem question="Write code to test a series for stationarity, make it stationary, and verify the result." difficulty="hard" tag="Coding">
  <p>A clean workflow runs both tests, applies a transformation if needed, and re-tests. We log-transform first to stabilize variance, then difference to remove a stochastic trend.</p>
  <CodeBlock language="python" filename="stationarity.py">{`import numpy as np
from statsmodels.tsa.stattools import adfuller, kpss

def report(series, name):
    # ADF: H0 = unit root (non-stationary). Small p => stationary.
    adf_p = adfuller(series, autolag="AIC")[1]
    # KPSS: H0 = stationary. Small p => non-stationary.
    kpss_p = kpss(series, regression="c", nlags="auto")[1]
    stationary = (adf_p < 0.05) and (kpss_p > 0.05)
    print(f"{name}: ADF p={adf_p:.3f}  KPSS p={kpss_p:.3f}  "
          f"-> {'STATIONARY' if stationary else 'NON-STATIONARY'}")
    return stationary

# Simulate a random walk with drift (non-stationary by construction)
rng = np.random.default_rng(0)
x = 100 + np.cumsum(rng.normal(0.5, 1.0, size=500))

report(x, "raw")
# Stabilize variance, then difference to kill the stochastic trend
x_diff = np.diff(np.log(x))
report(x_diff, "log-diff")

# Guard against over-differencing: if the lag-1 autocorrelation of the
# differenced series is strongly negative (around -0.5 or below), you have
# likely differenced one time too many.
acf1 = np.corrcoef(x_diff[:-1], x_diff[1:])[0, 1]
print(f"lag-1 autocorr after differencing: {acf1:.3f}")`}</CodeBlock>
  <p>Key points an interviewer listens for: (1) requiring <strong>both</strong> tests to agree before declaring stationarity, since their nulls are opposite; (2) log-transforming to handle multiplicative/variance growth before differencing handles the trend; and (3) explicitly checking for <strong>over-differencing</strong> via a large negative lag-1 autocorrelation, which signals you should difference one fewer time.</p>
</InterviewProblem>

      </>
  );
}
