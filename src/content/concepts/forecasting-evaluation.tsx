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
    <h2>Interview practice</h2>
<InterviewProblem question="Why can't you use ordinary k-fold cross-validation to evaluate a time-series forecaster, and what do you use instead?" difficulty="easy" tag="Conceptual">
  <p>Standard k-fold shuffles rows and lets the model train on points that come <strong>after</strong> the points it is scored on. That leaks the future: the model sees tomorrow to predict today, which is impossible in production and produces wildly optimistic error estimates. Time series also have autocorrelation, so a random validation point is often nearly identical to a neighbouring training point.</p>
  <p>Instead use evaluation schemes that respect chronological order:</p>
  <ul>
    <li><strong>Rolling / expanding-window backtest</strong>: train on <M>{"[t_0, t]"}</M>, forecast <M>{"[t+1, t+h]"}</M>, then slide forward. Training set always precedes the test horizon.</li>
    <li><strong>Expanding window</strong> keeps all history; <strong>sliding (fixed) window</strong> uses only the last <M>{"w"}</M> observations, which adapts faster to regime change but uses less data.</li>
    <li>Optionally insert an <strong>embargo / purge gap</strong> between train and test so leakage through engineered features (e.g. a 30-day moving average) cannot bridge the boundary.</li>
  </ul>
  <p>You aggregate the error over all folds to get an out-of-sample estimate that mirrors how the model would actually have been deployed.</p>
</InterviewProblem>
<InterviewProblem question="A teammate reports a backtest with test RMSE far below training RMSE and a near-perfect equity curve. Walk through how you would diagnose look-ahead leakage." difficulty="medium" tag="Applied">
  <p>Test error below training error on a non-trivial series is a red flag: out-of-sample is normally harder, not easier. The usual cause is the future leaking into features or the split. I would check, roughly in order:</p>
  <ul>
    <li><strong>Target definition</strong>: is the label computed from data that is only known later (e.g. predicting day <M>{"t"}</M>&apos;s return but the feature uses day <M>{"t+1"}</M>&apos;s close)? Off-by-one alignment is the single most common bug.</li>
    <li><strong>Feature pipeline fit on the full set</strong>: scalers, PCA, target encoding, or imputation fit on all rows before splitting see test-period statistics. Fit transforms <strong>inside</strong> each training fold only.</li>
    <li><strong>Centered / non-causal windows</strong>: a centered rolling mean or a future-anchored <M>{"\\texttt{shift}(-k)"}</M> pulls future values into the present. Every transform must be backward-looking.</li>
    <li><strong>Resampling / interpolation</strong> that fills gaps using later observations.</li>
    <li><strong>Hyperparameter selection on the test set</strong>, or reusing the same test window many times until something looks good (multiple-comparisons leakage).</li>
  </ul>
  <p>The decisive test: re-run the backtest forcing strict temporal separation with an embargo gap, and confirm the gain disappears. If it does, the &quot;edge&quot; was leakage. I would also sanity-check against a naive baseline; a real model should beat a naive forecast, not just look pretty.</p>
</InterviewProblem>
<InterviewProblem question="Why is MAPE a problematic forecast metric, and what would you report instead?" difficulty="medium" tag="Math">
  <p>Mean Absolute Percentage Error is defined as</p>
  <MB>{"\\text{MAPE} = \\frac{100\\%}{n}\\sum_{i=1}^{n}\\left|\\frac{y_i - \\hat{y}_i}{y_i}\\right|"}</MB>
  <p>Its failures all come from the <M>{"y_i"}</M> in the denominator:</p>
  <ul>
    <li>It is <strong>undefined or explodes</strong> when actuals are zero or near zero (common in intermittent demand).</li>
    <li>It is <strong>asymmetric</strong>: it penalizes over-forecasts more than under-forecasts, because the error is divided by the actual. A forecast that is too low is bounded at 100%, while too-high forecasts are unbounded. This biases models toward under-forecasting.</li>
  </ul>
  <p>Better choices depend on the goal: <strong>MAE</strong> for an absolute-error view, <strong>RMSE</strong> when large misses matter more, and <strong>MASE</strong> (Mean Absolute Scaled Error) for a scale-free, interpretable metric:</p>
  <MB>{"\\text{MASE} = \\frac{\\frac{1}{n}\\sum_i |y_i - \\hat{y}_i|}{\\frac{1}{T-m}\\sum_{t=m+1}^{T} |y_t - y_{t-m}|}"}</MB>
  <p>The denominator is the in-sample MAE of a naive (seasonal) forecast, so <M>{"\\text{MASE} < 1"}</M> means you beat naive. If you need a symmetric percentage, <strong>sMAPE</strong> is a partial fix, though it has its own quirks.</p>
</InterviewProblem>
<InterviewProblem question="Implement an expanding-window backtest that returns the out-of-sample RMSE for a one-step-ahead forecaster, with an embargo gap." difficulty="hard" tag="Coding">
  <p>The key invariants: the training slice always ends before the test point, an embargo gap separates them so leaky features cannot bridge the split, and the model is refit each step. We compare against a naive last-value baseline so the number is interpretable.</p>
  <CodeBlock language="python" filename="backtest.py">{`import numpy as np

def expanding_backtest(y, fit_predict, start, embargo=0):
    """One-step-ahead expanding-window backtest.

    y           : 1D array of observations, chronological order.
    fit_predict : fn(train_array) -> scalar forecast for the next step.
    start       : index of the first point we score (need >= start history).
    embargo     : gap (in steps) inserted between train end and the test point.
    """
    y = np.asarray(y, dtype=float)
    preds, actuals, naive = [], [], []

    for t in range(start, len(y)):
        # Train only on data strictly before the embargo gap.
        train_end = t - embargo
        if train_end <= 0:
            continue
        train = y[:train_end]            # never touches y[t]

        yhat = fit_predict(train)        # model's one-step forecast
        preds.append(yhat)
        actuals.append(y[t])
        naive.append(train[-1])          # last-value baseline

    preds, actuals, naive = map(np.asarray, (preds, actuals, naive))
    rmse = np.sqrt(np.mean((actuals - preds) ** 2))
    rmse_naive = np.sqrt(np.mean((actuals - naive) ** 2))
    return {"rmse": rmse, "rmse_naive": rmse_naive,
            "skill": 1 - rmse / rmse_naive}  # >0 means we beat naive
`}</CodeBlock>
  <p>Notes a strong candidate would call out: <strong>train never indexes <M>{"t"}</M></strong> (no leakage), the embargo widens the train/test gap so a rolling feature of width <M>{"w"}</M> needs <M>{"\\text{embargo} \\geq w"}</M> to be safe, refitting each step is realistic but expensive (you might refit periodically in practice), and reporting a <strong>skill score</strong> versus the naive baseline is more honest than a raw RMSE, which is unitful and hard to judge in isolation.</p>
</InterviewProblem>

      </>
  );
}
