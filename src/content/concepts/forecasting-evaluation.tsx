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
      <p>A forecast is only as trustworthy as the test that produced it. Evaluating forecasts means simulating how a model would have performed if it had been deployed in the past, using only the information available at each moment.</p>

      <KeyIdea>At every point where you score a prediction, the model must have seen <strong>only</strong> the data that existed up to that point. The moment future information leaks backward, your error estimate becomes a fantasy.</KeyIdea>

      <h2>Why ordinary cross-validation fails</h2>
      <p>Random k-fold cross-validation shuffles rows and trains on a mix of past and future. For time series this is fatal: predicting Tuesday using Wednesday and Thursday is trivial and meaningless. Time has a direction, and your evaluation must respect it.</p>
      <ul>
        <li><strong>Backtesting</strong>: replay history forward, retraining or re-forecasting at each step as new data &quot;arrives.&quot;</li>
        <li><strong>Expanding window</strong>: the training set grows over time, always starting from the beginning.</li>
        <li><strong>Rolling window</strong>: the training set is a fixed-length window that slides forward, discarding the oldest data.</li>
      </ul>

      <Basic>
        <p>Imagine you are a weather forecaster on January 1st. You can use every observation up to today to predict tomorrow, then you wait, see what actually happened, write down your error, and step forward one day. You repeat this across the whole calendar. Averaging those honest, one-step-ahead errors tells you how good you really are. You are <em>never</em> allowed to peek at a day that has not happened yet.</p>
      </Basic>

      <Advanced>
        <p>Formally, define the information set <M>{"\\mathcal{F}_t"}</M> as all data observable up to time <M>{"t"}</M>. A valid forecast for horizon <M>{"h"}</M> is a function of <M>{"\\mathcal{F}_t"}</M> only, written <M>{"\\hat{y}_{t+h\\mid t} = f(\\mathcal{F}_t)"}</M>. The rolling pseudo-out-of-sample error aggregates over an evaluation period:</p>
        <MB>{"\\text{MSFE} = \\frac{1}{T - t_0} \\sum_{t=t_0}^{T-h} \\left( y_{t+h} - \\hat{y}_{t+h\\mid t} \\right)^2"}</MB>
        <p>Comparing two models, the Diebold-Mariano test asks whether the mean loss differential <M>{"d_t = L(e^{(1)}_t) - L(e^{(2)}_t)"}</M> is significantly nonzero, using a HAC variance estimate to handle autocorrelated errors.</p>
      </Advanced>

      <Callout kind="pitfall" title="The leakage that hides in plain sight">
        Fitting a scaler, imputing missing values, or selecting features on the full dataset before splitting all leak future statistics into the training set. Every preprocessing step must be fit inside the training window only, then applied to the test window.
      </Callout>

      <CodeBlock language="python" filename="rolling_backtest.py">{`import numpy as np

def rolling_backtest(y, fit_predict, window=200, horizon=1):
    """Slide a fixed window forward; forecast h steps ahead each time."""
    errors = []
    for t in range(window, len(y) - horizon + 1):
        train = y[t - window:t]          # past only
        yhat = fit_predict(train, horizon)  # fit, then forecast
        actual = y[t + horizon - 1]
        errors.append(actual - yhat)
    errors = np.array(errors)
    return {
        "rmse": np.sqrt(np.mean(errors ** 2)),
        "mae": np.mean(np.abs(errors)),
        "n": len(errors),
    }`}</CodeBlock>

      <MoreDepth>
        <p>Beware comparing many models on one backtest: the best score is partly luck, so the winner&apos;s out-of-sample edge is upward-biased (the data-snooping problem). White&apos;s Reality Check and the Hansen SPA test correct for this by bootstrapping over the full set of candidates. Also watch for <strong>look-ahead in the target itself</strong>: revised macro data, survivorship-filtered universes, and label windows that overlap test windows all inflate scores in ways no clean train/test split will reveal.</p>
      </MoreDepth>

      <Quiz question="Why is standard random k-fold cross-validation inappropriate for evaluating a time-series forecast?" options={[
        { text: "It uses too few folds to estimate variance reliably.", why: "Fold count is unrelated; the problem is temporal ordering, not sample size." },
        { text: "It can place future observations in the training set and past ones in the test set, leaking information.", correct: true, why: "Shuffling breaks the time ordering, letting the model learn from the future it is supposed to predict." },
        { text: "It always overfits because time series are non-stationary.", why: "Non-stationarity is a separate concern; even stationary series are mis-evaluated by shuffled folds." },
        { text: "It requires more data than a rolling window does.", why: "Data requirements are not the issue; the violation of temporal causality is." },
      ]} />
    </>
  );
}
