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
    </>
  );
}
