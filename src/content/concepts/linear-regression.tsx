"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { CodeBlock } from "@/components/content/code-block";
import { Quiz } from "@/components/content/quiz";
import { RegressionGradientDescent } from "@/components/viz/regression-gd";
import { InterviewProblem } from "@/components/content/interview-problem";

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
    <h2>Interview practice</h2>
<InterviewProblem question="Explain the linear regression model, its loss function, and what 'fitting' actually computes." difficulty="easy" tag="Conceptual">
  <p>The model assumes the target is a linear combination of the features plus noise:</p>
  <MB>{"y_i = \\beta_0 + \\beta_1 x_{i1} + \\dots + \\beta_p x_{ip} + \\varepsilon_i"}</MB>
  <p>The loss is the <strong>residual sum of squares</strong> &mdash; the sum of squared vertical gaps between each point and the line:</p>
  <MB>{"\\mathrm{RSS}(\\beta) = \\sum_{i=1}^{n} \\bigl(y_i - \\hat{y}_i\\bigr)^2"}</MB>
  <p>&quot;Fitting&quot; means choosing the coefficients <M>{"\\beta"}</M> that minimize this loss. Because RSS is a smooth convex function of <M>{"\\beta"}</M>, there is a single global minimum, and it has a closed-form solution. Two clarifying points interviewers like to hear:</p>
  <ul>
    <li>We square the <strong>vertical</strong> errors, not perpendicular distance &mdash; we are predicting <M>{"y"}</M> from <M>{"x"}</M>, so only the <M>{"y"}</M>-direction error counts.</li>
    <li>Squaring (vs. absolute error) makes the loss differentiable everywhere and yields the closed form, but it also makes the fit sensitive to outliers, since a large residual is penalized quadratically.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="Derive the ordinary least squares solution in matrix form. When is it not unique?" difficulty="hard" tag="Math">
  <p>Stack the data into a design matrix <M>{"X \\in \\mathbb{R}^{n \\times (p+1)}"}</M> (a leading column of ones for the intercept) and target vector <M>{"y"}</M>. The loss is:</p>
  <MB>{"\\mathrm{RSS}(\\beta) = \\lVert y - X\\beta \\rVert_2^2 = (y - X\\beta)^\\top (y - X\\beta)"}</MB>
  <p>Expand and take the gradient with respect to <M>{"\\beta"}</M>:</p>
  <MB>{"\\nabla_\\beta \\mathrm{RSS} = -2 X^\\top (y - X\\beta)"}</MB>
  <p>Set it to zero, giving the <strong>normal equations</strong>:</p>
  <MB>{"X^\\top X \\, \\hat{\\beta} = X^\\top y \\quad\\Longrightarrow\\quad \\hat{\\beta} = (X^\\top X)^{-1} X^\\top y"}</MB>
  <p>The solution is unique only when <M>{"X^\\top X"}</M> is invertible, i.e. when <M>{"X"}</M> has full column rank. It breaks when:</p>
  <ul>
    <li>Features are <strong>perfectly collinear</strong> (one column is a linear combination of others) &mdash; e.g. dummy-encoding all categories plus an intercept (the dummy-variable trap).</li>
    <li>There are <strong>more features than observations</strong> (<M>{"p > n"}</M>), so the columns cannot be independent.</li>
  </ul>
  <p>In those cases use the pseudo-inverse (minimum-norm solution) or add regularization like ridge, which replaces <M>{"X^\\top X"}</M> with <M>{"X^\\top X + \\lambda I"}</M> and is always invertible for <M>{"\\lambda > 0"}</M>.</p>
</InterviewProblem>
<InterviewProblem question="A coefficient came out as -3.2 with R-squared of 0.78. How do you interpret these, and what does NOT R-squared tell you?" difficulty="medium" tag="Conceptual">
  <p><strong>The coefficient:</strong> holding all other features fixed, a one-unit increase in that feature is associated with a <M>{"3.2"}</M>-unit <strong>decrease</strong> in the predicted target, in the original units of <M>{"y"}</M>. &quot;Holding others fixed&quot; is essential &mdash; the magnitude depends on the feature&apos;s scale, so to compare importance across features you should standardize them first or compare standardized coefficients.</p>
  <p><strong>R-squared = 0.78:</strong> the model explains 78% of the variance in <M>{"y"}</M> relative to a baseline that always predicts the mean:</p>
  <MB>{"R^2 = 1 - \\frac{\\sum_i (y_i - \\hat{y}_i)^2}{\\sum_i (y_i - \\bar{y})^2}"}</MB>
  <p>What R-squared does <strong>not</strong> tell you:</p>
  <ul>
    <li>Whether the relationship is causal &mdash; it is purely associational.</li>
    <li>Whether the fit is appropriate; a curved relationship can still have high <M>{"R^2"}</M> while residual plots reveal clear structure.</li>
    <li>Out-of-sample performance &mdash; <M>{"R^2"}</M> never decreases when you add features, so it rewards overfitting. Use adjusted <M>{"R^2"}</M> or a held-out test set instead.</li>
    <li>Whether coefficients are statistically distinguishable from zero &mdash; that needs standard errors and p-values.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="Your linear model fits training data well, but residuals fan out as fitted values grow and a few points dominate the fit. What's going on and how do you fix it?" difficulty="medium" tag="Applied">
  <p>The fanning pattern is <strong>heteroscedasticity</strong> &mdash; error variance is not constant. The few dominant points are <strong>high-leverage outliers</strong>. Both violate OLS assumptions and have concrete consequences:</p>
  <ul>
    <li>Heteroscedasticity does not bias the coefficient estimates, but it makes the usual <strong>standard errors wrong</strong>, so confidence intervals and p-values are untrustworthy.</li>
    <li>Squared loss lets a single high-leverage outlier pull the entire line toward it.</li>
  </ul>
  <p>Diagnosis and fixes:</p>
  <ul>
    <li>Plot residuals vs. fitted values (look for the funnel) and use a Q-Q plot to check normality of residuals.</li>
    <li>For heteroscedasticity: transform the target (e.g. <M>{"\\log y"}</M> when variance grows with the mean), use weighted least squares, or report heteroscedasticity-robust (Huber-White) standard errors.</li>
    <li>For outliers and leverage: inspect Cook&apos;s distance, and consider a robust regression (Huber or quantile loss) that downweights extreme residuals instead of squaring them.</li>
  </ul>
  <CodeBlock language="python" filename="diagnose.py">{`import numpy as np
import statsmodels.api as sm

X = sm.add_constant(X_features)          # add intercept column
ols = sm.OLS(y, X).fit()

# Heteroscedasticity-robust (Huber-White) standard errors
robust = ols.get_robustcov_results(cov_type="HC3")
print(robust.summary())

# Leverage and influence: large Cook's distance flags problem points
influence = ols.get_influence()
cooks_d = influence.cooks_distance[0]
flagged = np.where(cooks_d > 4 / len(y))[0]   # common rule of thumb
print("High-influence rows:", flagged)`}</CodeBlock>
</InterviewProblem>

      </>
  );
}
