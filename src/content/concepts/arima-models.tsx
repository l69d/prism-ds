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
    </>
  );
}
