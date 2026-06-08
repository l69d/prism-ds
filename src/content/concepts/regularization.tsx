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
      <p>Regularization adds a penalty for model complexity to the loss you already minimize, trading a little training fit for a lot of generalization.</p>

      <KeyIdea>A model that fits the training data perfectly often memorizes noise. Regularization shrinks the coefficients toward zero, biasing the model toward simpler explanations that hold up on data it has never seen.</KeyIdea>

      <h2>The penalty term</h2>
      <p>Ordinary least squares minimizes only the prediction error. Regularized regression minimizes error <strong>plus</strong> a penalty on the size of the weights, controlled by a strength <M>{"\\lambda"}</M>:</p>
      <ul>
        <li><strong>L2 (Ridge)</strong> penalizes the sum of squared weights. It shrinks every coefficient smoothly toward zero but rarely makes any exactly zero.</li>
        <li><strong>L1 (Lasso)</strong> penalizes the sum of absolute weights. Its geometry drives many coefficients to exactly zero, performing automatic feature selection.</li>
        <li><strong>Elastic Net</strong> blends both, keeping Lasso&apos;s sparsity while handling groups of correlated features more gracefully.</li>
      </ul>

      <Basic>
        <p>Imagine fitting a curve to noisy dots. A complex curve wiggles through every dot, including the random ones, and predicts the next dot terribly. Regularization is a fee charged per unit of wiggliness: the optimizer now prefers a smoother curve unless the data really earns the extra complexity.</p>
        <p>Turning the knob <M>{"\\lambda"}</M> up means a steeper fee, so the model stays simpler. Turn it to zero and you are back to plain regression. Lasso&apos;s fee is harsh enough that it sets useless features&apos; weights to a flat zero, effectively deleting them.</p>
      </Basic>

      <Advanced>
        <p>For linear regression, the regularized objective is:</p>
        <MB>{"\\hat{\\mathbf{w}} = \\arg\\min_{\\mathbf{w}} \; \\lVert \\mathbf{y} - X\\mathbf{w} \\rVert_2^2 \; + \; \\lambda \\, R(\\mathbf{w})"}</MB>
        <p>where <M>{"R(\\mathbf{w}) = \\lVert \\mathbf{w} \\rVert_2^2"}</M> for Ridge and <M>{"R(\\mathbf{w}) = \\lVert \\mathbf{w} \\rVert_1"}</M> for Lasso. Ridge has a closed form, <M>{"\\hat{\\mathbf{w}} = (X^\\top X + \\lambda I)^{-1} X^\\top \\mathbf{y}"}</M>, which also fixes the singularity when <M>{"X^\\top X"}</M> is not invertible. The sparsity of L1 follows from its non-differentiable corners on the axes: the diamond-shaped constraint region touches the elliptical loss contours at vertices, where some coordinates are exactly zero. Elastic Net uses <M>{"R(\\mathbf{w}) = \\alpha \\lVert \\mathbf{w} \\rVert_1 + (1-\\alpha) \\lVert \\mathbf{w} \\rVert_2^2"}</M>.</p>
      </Advanced>

      <Callout kind="pitfall" title="Always standardize first">
        Penalties act on raw coefficient magnitudes, so a feature measured in millimeters gets punished far more than the same feature in kilometers. Standardize features to zero mean and unit variance before fitting, or the penalty silently favors whichever variables happen to have large units.
      </Callout>

      <CodeBlock language="python" filename="regularization.py">{`from sklearn.linear_model import Ridge, Lasso, ElasticNet
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import cross_val_score

# alpha is sklearn's name for lambda (penalty strength)
ridge = make_pipeline(StandardScaler(), Ridge(alpha=1.0))
lasso = make_pipeline(StandardScaler(), Lasso(alpha=0.1))
enet  = make_pipeline(StandardScaler(), ElasticNet(alpha=0.1, l1_ratio=0.5))

for name, model in [("ridge", ridge), ("lasso", lasso), ("enet", enet)]:
    score = cross_val_score(model, X, y, cv=5, scoring="r2").mean()
    print(f"{name}: CV R^2 = {score:.3f}")

# choose alpha by cross-validation, not by hand
lasso.fit(X, y)
print("nonzero coefs:", (lasso[-1].coef_ != 0).sum())`}</CodeBlock>

      <MoreDepth>
        <p>Regularization is equivalent to a Bayesian prior on the weights: L2 corresponds to a Gaussian prior (MAP estimation), and L1 to a Laplace prior. This reframes <M>{"\\lambda"}</M> as the inverse of prior variance, your stated belief about how large coefficients should be. A subtler point: when features are highly correlated, Lasso arbitrarily picks one and zeros the rest, which destabilizes interpretation across resamples. Elastic Net&apos;s L2 component shares the weight across the correlated group, giving more stable, reproducible selection.</p>
      </MoreDepth>

      <Quiz question="You fit Lasso and Ridge on the same standardized dataset with strong regularization. What distinguishes the resulting coefficient vectors?" options={[
        { text: "Lasso produces many exactly-zero coefficients while Ridge shrinks all of them but keeps them nonzero", correct: true, why: "The L1 penalty's geometry yields sparse solutions; the L2 penalty shrinks smoothly without zeroing." },
        { text: "Ridge produces sparse coefficients and Lasso shrinks all of them smoothly", why: "This reverses the two: sparsity comes from L1 (Lasso), not L2 (Ridge)." },
        { text: "Both produce identical coefficients since they minimize the same error term", why: "They share the error term but differ in penalty, giving different solutions." },
        { text: "Neither changes the coefficients because regularization only affects the intercept", why: "Regularization penalizes the feature weights; the intercept is typically left unpenalized." },
      ]} />
    <h2>Interview practice</h2>

<InterviewProblem question="What is the difference between L1 (Lasso) and L2 (Ridge) regularization, and why does L1 produce sparse solutions?" difficulty="easy" tag="Conceptual">
  <p>Both add a penalty on coefficient magnitude to the loss. Ridge adds the squared <M>{"\\ell_2"}</M> norm, Lasso adds the <M>{"\\ell_1"}</M> norm:</p>
  <MB>{"J_{\\text{ridge}}(\\beta)=\\|y-X\\beta\\|_2^2+\\lambda\\|\\beta\\|_2^2,\\qquad J_{\\text{lasso}}(\\beta)=\\|y-X\\beta\\|_2^2+\\lambda\\|\\beta\\|_1"}</MB>
  <ul>
    <li><strong>Ridge</strong> shrinks all coefficients smoothly toward zero but rarely sets any exactly to zero. It keeps every feature.</li>
    <li><strong>Lasso</strong> drives many coefficients exactly to zero, performing automatic feature selection.</li>
  </ul>
  <p>The geometric intuition: the constraint region for <M>{"\\ell_1"}</M> is a diamond (rotated square) with sharp corners on the axes, while <M>{"\\ell_2"}</M> is a smooth ball. The elliptical contours of the squared-error loss are far more likely to first touch a corner of the diamond, and a corner sits on an axis, meaning some coordinate is exactly zero. The smooth ball has no corners, so the optimum almost never lands exactly on an axis.</p>
  <p>Analytically, soft-thresholding makes this concrete: the Lasso solution for one coordinate (orthonormal design) is <M>{"\\hat{\\beta}_j=\\operatorname{sign}(z_j)\\,(|z_j|-\\lambda)_+"}</M>, which is exactly zero whenever <M>{"|z_j|\\le\\lambda"}</M>. Ridge instead scales: <M>{"\\hat{\\beta}_j=z_j/(1+\\lambda)"}</M>, never reaching zero for finite <M>{"\\lambda"}</M>.</p>
</InterviewProblem>

<InterviewProblem question="Why must you standardize features before applying L1 or L2 regularization?" difficulty="medium" tag="Applied">
  <p>The penalty is applied to coefficient magnitudes, but coefficient magnitude depends on the scale of the feature. If feature A is measured in dollars (range 0 to 1,000,000) and feature B is a fraction (range 0 to 1), then to have the same effect on the prediction, A&apos;s coefficient must be roughly a million times smaller than B&apos;s.</p>
  <ul>
    <li>The penalty <M>{"\\lambda\\sum_j \\beta_j^2"}</M> therefore barely touches the tiny coefficient on the large-scale feature and crushes the large coefficient on the small-scale feature, purely because of units.</li>
    <li>This means regularization strength is silently allocated by measurement units rather than by predictive importance, which is almost never what you want.</li>
  </ul>
  <p>The fix: standardize each feature to zero mean and unit variance (or min-max scale) so all coefficients live on a comparable scale and the penalty treats them fairly. In practice, fit the scaler on the training fold only and apply it inside a pipeline to avoid leakage. Note the intercept should not be penalized, since it only shifts predictions and carries no complexity.</p>
</InterviewProblem>

<InterviewProblem question="How would you choose lambda, and what is the bias-variance trade-off as lambda increases?" difficulty="medium" tag="Case">
  <p>As <M>{"\\lambda"}</M> grows from 0 to <M>{"\\infty"}</M>:</p>
  <ul>
    <li>At <M>{"\\lambda=0"}</M> you recover ordinary least squares: low bias, high variance, prone to overfitting (especially when features outnumber samples or are collinear).</li>
    <li>As <M>{"\\lambda\\to\\infty"}</M> all coefficients are forced toward zero: the model collapses to predicting the mean, giving high bias and near-zero variance (underfitting).</li>
    <li>The sweet spot trades a small increase in bias for a large reduction in variance, minimizing expected test error.</li>
  </ul>
  <p>To pick it, use <strong>k-fold cross-validation</strong> over a log-spaced grid of <M>{"\\lambda"}</M> values and select the one minimizing validation error. A common robustification is the <strong>one-standard-error rule</strong>: pick the largest (simplest) <M>{"\\lambda"}</M> whose CV error is within one standard error of the minimum, favoring a sparser, more stable model.</p>
  <CodeBlock language="python" filename="select_lambda.py">{`import numpy as np
from sklearn.linear_model import RidgeCV, LassoCV
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

alphas = np.logspace(-4, 4, 50)  # sklearn calls lambda "alpha"

# Ridge with built-in efficient leave-one-out CV
ridge = make_pipeline(StandardScaler(), RidgeCV(alphas=alphas))
ridge.fit(X_train, y_train)
print("ridge best alpha:", ridge[-1].alpha_)

# Lasso with 5-fold CV; coordinate descent over the path
lasso = make_pipeline(StandardScaler(), LassoCV(alphas=alphas, cv=5, n_jobs=-1))
lasso.fit(X_train, y_train)
print("lasso best alpha:", lasso[-1].alpha_)
print("features kept:", int(np.sum(lasso[-1].coef_ != 0)))`}</CodeBlock>
</InterviewProblem>

<InterviewProblem question="When would you prefer elastic net over pure Lasso, and what problem does it solve?" difficulty="hard" tag="Conceptual">
  <p>Elastic net combines both penalties:</p>
  <MB>{"J(\\beta)=\\|y-X\\beta\\|_2^2+\\lambda\\big(\\alpha\\|\\beta\\|_1+(1-\\alpha)\\|\\beta\\|_2^2\\big)"}</MB>
  <p>It exists to fix two failure modes of pure Lasso:</p>
  <ul>
    <li><strong>Groups of correlated features.</strong> When several predictors are highly correlated, Lasso tends to arbitrarily pick one and zero out the rest, which is unstable: a tiny data perturbation can flip which one survives. The <M>{"\\ell_2"}</M> term encourages a <em>grouping effect</em>, spreading weight across correlated features so they tend to enter or leave together.</li>
    <li><strong>The p &gt; n regime.</strong> When features outnumber samples, Lasso can select at most n features before it saturates. Elastic net&apos;s ridge component removes this ceiling, allowing more than n features to be retained.</li>
  </ul>
  <p>The mixing parameter <M>{"\\alpha"}</M> interpolates: <M>{"\\alpha=1"}</M> is pure Lasso, <M>{"\\alpha=0"}</M> is pure Ridge. You tune both <M>{"\\lambda"}</M> and <M>{"\\alpha"}</M> by cross-validation. Use elastic net when you want Lasso-style sparsity but your features are correlated or wide; use plain Lasso when features are roughly independent and you want the most aggressive selection.</p>
</InterviewProblem>

<InterviewProblem question="Derive the closed-form Ridge solution and show why it is always invertible even when X is rank-deficient." difficulty="hard" tag="Math">
  <p>Start from the Ridge objective and set its gradient to zero:</p>
  <MB>{"J(\\beta)=(y-X\\beta)^\\top(y-X\\beta)+\\lambda\\beta^\\top\\beta"}</MB>
  <MB>{"\\nabla_\\beta J=-2X^\\top(y-X\\beta)+2\\lambda\\beta=0"}</MB>
  <p>Rearranging gives the normal equations:</p>
  <MB>{"(X^\\top X+\\lambda I)\\,\\hat{\\beta}=X^\\top y\\quad\\Longrightarrow\\quad\\hat{\\beta}=(X^\\top X+\\lambda I)^{-1}X^\\top y"}</MB>
  <p>Why is the matrix invertible? <M>{"X^\\top X"}</M> is symmetric positive semidefinite, so its eigenvalues satisfy <M>{"\\mu_i\\ge 0"}</M>. Adding <M>{"\\lambda I"}</M> shifts every eigenvalue up by <M>{"\\lambda"}</M>, giving eigenvalues <M>{"\\mu_i+\\lambda"}</M>. For any <M>{"\\lambda>0"}</M> these are all strictly positive, so <M>{"X^\\top X+\\lambda I"}</M> is positive definite and hence invertible, even when <M>{"X^\\top X"}</M> is singular (collinear features or <M>{"p>n"}</M>).</p>
  <p>This also explains numerical stability: in the eigenbasis each coefficient is shrunk by the factor <M>{"\\mu_i/(\\mu_i+\\lambda)"}</M>. Directions with tiny eigenvalues (where OLS blows up) are damped the most, which is exactly why Ridge tames variance from near-collinear features.</p>
</InterviewProblem>

      </>
  );
}
