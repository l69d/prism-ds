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
      <p>ARIMA is the workhorse of classical time-series forecasting: it predicts the next value from the recent past, smooths over noisy shocks, and removes trends so the series sits still long enough to model.</p>
      <KeyIdea>ARIMA bundles three simple ideas: lean on your own recent values (<strong>AR</strong>), difference away trends so the series stops drifting (<strong>I</strong>), and learn from your recent forecast errors (<strong>MA</strong>).</KeyIdea>

      <h2>The three letters</h2>
      <p>An ARIMA(p, d, q) model is fully described by three integers:</p>
      <ul>
        <li><strong>p</strong> — autoregressive order: how many past <em>values</em> feed the prediction.</li>
        <li><strong>d</strong> — differencing order: how many times you subtract the previous value to kill trend and make the series stationary.</li>
        <li><strong>q</strong> — moving-average order: how many past <em>error terms</em> feed the prediction.</li>
      </ul>

      <h2>Intuition vs. rigor</h2>
      <Basic>
        <p>Think of forecasting tomorrow&apos;s temperature. The <strong>AR</strong> part says &quot;tomorrow looks a lot like today and yesterday.&quot; The <strong>MA</strong> part says &quot;and if I was surprised yesterday (predicted 20, got 25), nudge my guess to account for that miss.&quot; The <strong>I</strong> part handles a steadily warming month: instead of modeling the raw temperature, model the day-to-day <em>change</em>, which has no drift and is far easier to predict.</p>
      </Basic>
      <Advanced>
        <p>Let <M>{"B"}</M> be the backshift operator, <M>{"B y_t = y_{t-1}"}</M>, and let the differenced series be <M>{"w_t = (1-B)^d y_t"}</M>. An ARMA(p, q) model on <M>{"w_t"}</M> is:</p>
        <MB>{"\\phi(B)\\, w_t = \\theta(B)\\, \\varepsilon_t"}</MB>
        <p>where <M>{"\\phi(B) = 1 - \\phi_1 B - \\cdots - \\phi_p B^p"}</M>, <M>{"\\theta(B) = 1 + \\theta_1 B + \\cdots + \\theta_q B^q"}</M>, and <M>{"\\varepsilon_t \\sim \\mathrm{WN}(0, \\sigma^2)"}</M> is white noise. Stationarity requires the roots of <M>{"\\phi(B)=0"}</M> to lie outside the unit circle; invertibility requires the same of <M>{"\\theta(B)=0"}</M>. Parameters are typically fit by maximum likelihood, and model order is chosen by minimizing AIC or BIC.</p>
      </Advanced>

      <Callout kind="pitfall" title="Over-differencing">
        Differencing more than necessary does not help &mdash; it injects artificial negative autocorrelation at lag 1 and inflates variance. If the lag-1 autocorrelation of the differenced series is strongly negative (near <M>{"-0.5"}</M>), you likely differenced one time too many.
      </Callout>

      <CodeBlock language="python" filename="arima.py">{`import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.stattools import adfuller

y = pd.read_csv("sales.csv", parse_dates=["date"], index_col="date")["units"]

# Check stationarity (low p-value => stationary, no differencing needed)
print("ADF p-value:", adfuller(y)[1])

# Fit ARIMA(p=2, d=1, q=2)
model = ARIMA(y, order=(2, 1, 2)).fit()
print(model.summary())

# Forecast the next 12 steps with confidence intervals
fc = model.get_forecast(steps=12)
print(fc.predicted_mean)
print(fc.conf_int())`}</CodeBlock>

      <MoreDepth>
        <p>Plain ARIMA assumes a single, fixed seasonal-free structure, but real data often has seasonality and constant variance assumptions that fail. <strong>SARIMA</strong> adds seasonal terms ARIMA(p, d, q)(P, D, Q)<M>{"_s"}</M> to capture, say, weekly or yearly cycles. When residuals show changing variance (volatility clustering in finance), ARIMA is wrong by construction &mdash; pair it with a <strong>GARCH</strong> model on the residuals, or move to a state-space / structural formulation. And remember: AIC compares models on the <em>same</em> differenced series, so you cannot use it to choose <M>{"d"}</M> &mdash; use stationarity tests for that.</p>
      </MoreDepth>

      <Quiz question="A series shows a steady upward trend. What does the 'I' (d) parameter in ARIMA do about it?" options={[
        { text: "It multiplies the series by a decay factor to shrink the trend.", why: "ARIMA does not rescale values; differencing subtracts, it does not multiply by a decay." },
        { text: "It differences the series (subtracts the previous value) to remove the trend and make it stationary.", correct: true, why: "Differencing turns a drifting series into one with a stable mean, which AR and MA terms can then model." },
        { text: "It adds more autoregressive lags to absorb the trend.", why: "Extra AR lags model dependence on past values, not trend removal; that is the job of differencing." },
        { text: "It fits a separate linear regression on time and subtracts the fitted line.", why: "That is deterministic detrending, a different technique; ARIMA's 'I' uses differencing, not a time regression." },
      ]} />
    <h2>Interview practice</h2>

<InterviewProblem question="What do the p, d, q parameters in ARIMA(p, d, q) mean, and how do you choose d?" difficulty="easy" tag="Conceptual">
  <p>ARIMA combines three pieces:</p>
  <ul>
    <li><strong>AR(p)</strong> &mdash; autoregression: the value depends on its own <M>{"p"}</M> most recent lags, <M>{"y_t = \\sum_{i=1}^{p} \\phi_i\\, y_{t-i} + \\varepsilon_t"}</M>.</li>
    <li><strong>I(d)</strong> &mdash; integration: difference the series <M>{"d"}</M> times to remove trend / non-stationarity. The differencing operator is <M>{"\\nabla y_t = y_t - y_{t-1}"}</M>.</li>
    <li><strong>MA(q)</strong> &mdash; moving average: the value depends on the last <M>{"q"}</M> forecast errors, <M>{"\\sum_{j=1}^{q} \\theta_j\\, \\varepsilon_{t-j}"}</M>.</li>
  </ul>
  <p>To pick <M>{"d"}</M>, difference until the series is stationary. Practically: run an <strong>ADF</strong> or <strong>KPSS</strong> test, and watch the ACF &mdash; a series that needs differencing shows an ACF that decays very slowly (near 1 at many lags). Most economic series need <M>{"d=1"}</M>; rarely <M>{"d=2"}</M>. Over-differencing is harmful: it introduces a unit root in the MA part (a <M>{"-1"}</M> coefficient) and inflates variance, so prefer the smallest <M>{"d"}</M> that achieves stationarity.</p>
</InterviewProblem>

<InterviewProblem question="A teammate fits ARIMA on raw monthly sales and gets great in-sample fit but terrible forecasts. Walk through how you would diagnose and fix it." difficulty="medium" tag="Applied">
  <p>Great in-sample fit with poor forecasts is the classic signature of <strong>non-stationarity left in the data</strong> plus <strong>overfitting</strong>. My checklist:</p>
  <ul>
    <li><strong>Check stationarity first.</strong> Plot the series. Monthly sales almost always have trend and seasonality, so plain ARIMA on raw levels will chase the trend in-sample but fail out-of-sample. Apply differencing (<M>{"d"}</M>) and, if there is a yearly cycle, seasonal differencing &mdash; this is really a <strong>SARIMA</strong> problem with period <M>{"m=12"}</M>.</li>
    <li><strong>Look at ACF/PACF of the differenced series</strong> to read off candidate <M>{"p"}</M> and <M>{"q"}</M>: PACF cutting off after lag <M>{"p"}</M> suggests AR; ACF cutting off after lag <M>{"q"}</M> suggests MA.</li>
    <li><strong>Penalize complexity.</strong> A model with many AR/MA terms can memorize noise. Compare candidates by <strong>AIC/BIC</strong> on the training set, not by in-sample <M>{"R^2"}</M>.</li>
    <li><strong>Validate the right way.</strong> Never use a random k-fold split on time series &mdash; it leaks the future. Use <strong>rolling-origin (walk-forward) backtesting</strong> and report out-of-sample error (MASE / sMAPE).</li>
    <li><strong>Check residuals.</strong> Residuals should be white noise: run a <strong>Ljung-Box</strong> test and inspect the residual ACF. Leftover autocorrelation means missing structure (often seasonality).</li>
  </ul>
  <p>Most likely fix here: move to seasonal differencing + SARIMA, choose orders by BIC, and confirm with walk-forward validation.</p>
</InterviewProblem>

<InterviewProblem question="Show that an MA(1) process has zero autocorrelation beyond lag 1, and derive its lag-1 autocorrelation." difficulty="hard" tag="Math">
  <p>Let <M>{"y_t = \\varepsilon_t + \\theta\\,\\varepsilon_{t-1}"}</M> with <M>{"\\varepsilon_t"}</M> white noise, mean 0, variance <M>{"\\sigma^2"}</M>, independent across time. Compute the autocovariances.</p>
  <p><strong>Variance (lag 0):</strong></p>
  <MB>{"\\gamma_0 = \\operatorname{Var}(y_t) = \\operatorname{Var}(\\varepsilon_t) + \\theta^2\\operatorname{Var}(\\varepsilon_{t-1}) = (1+\\theta^2)\\sigma^2"}</MB>
  <p><strong>Lag 1:</strong> only the shared <M>{"\\varepsilon_{t-1}"}</M> term survives, since cross terms of independent shocks have expectation 0.</p>
  <MB>{"\\gamma_1 = \\operatorname{Cov}(y_t, y_{t-1}) = \\operatorname{Cov}(\\theta\\varepsilon_{t-1},\\, \\varepsilon_{t-1}) = \\theta\\sigma^2"}</MB>
  <p><strong>Lag k &ge; 2:</strong> <M>{"y_t"}</M> and <M>{"y_{t-k}"}</M> share no common shock, so <M>{"\\gamma_k = 0"}</M>. That cutoff is exactly why a sharp drop in the ACF after lag 1 signals an MA(1). The lag-1 autocorrelation is</p>
  <MB>{"\\rho_1 = \\frac{\\gamma_1}{\\gamma_0} = \\frac{\\theta}{1+\\theta^2}"}</MB>
  <p>Note <M>{"|\\rho_1| \\le 1/2"}</M> for any real <M>{"\\theta"}</M> (max at <M>{"\\theta = \\pm 1"}</M>), and that <M>{"\\theta"}</M> and <M>{"1/\\theta"}</M> give the same <M>{"\\rho_1"}</M> &mdash; the source of the <strong>invertibility</strong> constraint <M>{"|\\theta| < 1"}</M>, which picks the unique identifiable parameterization.</p>
</InterviewProblem>

<InterviewProblem question="Write code to fit a seasonal ARIMA, run a residual white-noise check, and produce a forecast with confidence intervals." difficulty="medium" tag="Coding">
  <p>Using <strong>statsmodels</strong>. The Ljung-Box test on residuals is the key validity check &mdash; large p-values mean we failed to reject white noise (good).</p>
  <CodeBlock language="python" filename="sarima.py">{`import pandas as pd
import statsmodels.api as sm
from statsmodels.stats.diagnostic import acorr_ljungbox

# y: a pandas Series indexed by month
train, test = y.iloc[:-12], y.iloc[-12:]

# SARIMA(1,1,1)(1,1,1) with yearly seasonality (m=12)
model = sm.tsa.statespace.SARIMAX(
    train,
    order=(1, 1, 1),
    seasonal_order=(1, 1, 1, 12),
    enforce_stationarity=True,
    enforce_invertibility=True,
)
res = model.fit(disp=False)

# 1) Residual diagnostics: want LARGE p-values (residuals ~ white noise)
lb = acorr_ljungbox(res.resid, lags=[12], return_df=True)
print(lb)  # if lb_pvalue is small, structure remains -> revise orders

# 2) Forecast 12 steps with 95% prediction intervals
fc = res.get_forecast(steps=12)
mean = fc.predicted_mean
ci = fc.conf_int(alpha=0.05)
print(mean)
print(ci)

# 3) Honest accuracy on the held-out year
mae = (mean.values - test.values).__abs__().mean()
print(f"holdout MAE = {mae:.2f}")`}</CodeBlock>
  <p>In an interview, call out two things: enforce stationarity/invertibility so coefficients stay in the identifiable region, and never read in-sample fit as success &mdash; the held-out MAE and the Ljung-Box p-value are what matter. If residuals still show seasonal autocorrelation, raise the seasonal orders or let <strong>auto_arima</strong> (pmdarima) grid-search by AIC.</p>
</InterviewProblem>

      </>
  );
}
