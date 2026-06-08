"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { CodeBlock } from "@/components/content/code-block";
import { Quiz } from "@/components/content/quiz";
import { RegressionGradientDescent } from "@/components/viz/regression-gd";

export default function LinearRegressionContent() {
  return (
    <>
      <p>
        Linear regression fits the <strong>best straight line</strong> through your data. It&apos;s the
        first model most people learn, the baseline every project should beat, and the conceptual seed
        for logistic regression, neural networks, and most of modern ML.
      </p>

      <KeyIdea>
        &quot;Best&quot; means the line whose <strong>vertical distances to the points</strong>
        (the residuals) are as small as possible — specifically, the line minimizing the sum of
        <em> squared</em> residuals. Drag the line below and watch the error; then let gradient
        descent find the minimum for you.
      </KeyIdea>

      <RegressionGradientDescent />

      <h2>The model and its loss</h2>
      <Basic>
        <p>
          The model is just <strong>output = slope × input + intercept</strong>. The slope says how
          much the prediction changes per unit of input; the intercept is the prediction when the
          input is zero. We pick slope and intercept to make the pink residual lines as short as possible.
        </p>
      </Basic>
      <Advanced>
        <p>With features <M>{"\\mathbf{x}"}</M> and weights <M>{"\\mathbf{w}"}</M>, the prediction is
        {" "}<M>{"\\hat{y} = \\mathbf{w}^\\top \\mathbf{x} + b"}</M> and we minimize the mean squared error</p>
        <MB>{"\\mathcal{L}(\\mathbf{w}, b) = \\frac{1}{n}\\sum_{i=1}^{n}\\left(\\hat{y}_i - y_i\\right)^2"}</MB>
        <p>
          Because this loss is convex, there&apos;s a closed-form solution — the{" "}
          <strong>normal equations</strong> <M>{"\\mathbf{w} = (X^\\top X)^{-1} X^\\top y"}</M> — but
          gradient descent scales far better to many features and huge datasets.
        </p>
      </Advanced>

      <Callout kind="insight" title="Why squared error?">
        Squaring punishes big misses much more than small ones and gives a smooth, convex bowl
        that&apos;s easy to optimize. It also corresponds to the maximum-likelihood estimate when
        noise is Gaussian — a deep reason it shows up everywhere.
      </Callout>

      <CodeBlock language="python" filename="linreg.py">{`from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error

model = LinearRegression().fit(X_train, y_train)
pred = model.predict(X_test)

print("coef:", model.coef_, "intercept:", model.intercept_)
print("R^2 :", r2_score(y_test, pred))
print("RMSE:", mean_squared_error(y_test, pred) ** 0.5)`}</CodeBlock>

      <h2>Reading the output</h2>
      <ul>
        <li><strong>Coefficients</strong> — effect of each feature, holding others fixed (if scaled, comparable in size).</li>
        <li><strong><M>{"R^2"}</M></strong> — fraction of variance explained; 0 = no better than the mean, 1 = perfect.</li>
        <li><strong>Residual plot</strong> — should look like random noise. Patterns mean a missing non-linearity.</li>
      </ul>

      <MoreDepth>
        <p>Linear regression rests on assumptions worth checking at senior level:</p>
        <ul>
          <li><strong>Linearity</strong> — the relationship really is linear (else transform features).</li>
          <li><strong>Independence &amp; homoscedasticity</strong> — residuals are independent with constant variance.</li>
          <li><strong>No severe multicollinearity</strong> — correlated features make coefficients unstable and uninterpretable (check VIF).</li>
          <li><strong>Outliers / leverage</strong> — squared error is sensitive to extremes; consider Huber or quantile loss when tails are heavy.</li>
        </ul>
      </MoreDepth>

      <Quiz
        question="Why do we square the residuals instead of just summing them?"
        options={[
          { text: "Because squaring is faster to compute.", why: "Computation isn't the reason; absolute error is just as cheap." },
          { text: "Raw residuals cancel out (positives and negatives), and squaring penalizes large errors more while staying smooth and convex.", correct: true, why: "Exactly — and it matches Gaussian-noise maximum likelihood." },
          { text: "It makes the model non-linear.", why: "The model stays linear in its parameters; only the loss is squared." },
          { text: "To guarantee R² = 1.", why: "R² depends on the data, not the choice of loss form." },
        ]}
      />
    </>
  );
}
