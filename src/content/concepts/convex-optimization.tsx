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
      <p>
        Most optimization is hard because a function can have many valleys, and gradient descent
        only ever feels the slope right under its feet. Convexity is the special structure that
        removes this trap entirely.
      </p>

      <KeyIdea>
        In a convex problem, every local minimum is automatically the global minimum &mdash; so
        any method that rolls downhill is guaranteed to find the best answer.
      </KeyIdea>

      <h2>What makes a function convex</h2>
      <p>
        A function is <strong>convex</strong> if the line segment connecting any two points on its
        graph never dips below the graph itself. The set you optimize over must also be convex:
        for any two feasible points, every point on the segment between them is feasible too.
      </p>
      <ul>
        <li><strong>Bowl shape:</strong> think of a single smooth basin with no separate dips.</li>
        <li><strong>No bad valleys:</strong> there is nowhere to get stuck except the true bottom.</li>
        <li><strong>Closed under the right operations:</strong> sums of convex functions, and a convex function composed with an affine map, stay convex.</li>
      </ul>

      <Basic>
        <p>
          Imagine pouring water into a perfectly round salad bowl. No matter where the first drop
          lands, it slides down to the same lowest point. A non-convex landscape is more like a
          mountain range full of separate ponds &mdash; water trapped in a high pond never reaches
          the deepest lake. Convex optimization is the promise that your landscape is a single
          bowl, so &quot;just go downhill&quot; always wins.
        </p>
      </Basic>

      <Advanced>
        <p>The formal first-order condition for a differentiable function is that it lies above all of its tangent planes:</p>
        <MB>{"f(\\mathbf{y}) \\ge f(\\mathbf{x}) + \\nabla f(\\mathbf{x})^\\top (\\mathbf{y} - \\mathbf{x}) \\quad \\forall\\, \\mathbf{x}, \\mathbf{y}"}</MB>
        <p>For twice-differentiable functions this is equivalent to the Hessian being positive semidefinite everywhere:</p>
        <MB>{"\\nabla^2 f(\\mathbf{x}) \\succeq 0"}</MB>
        <p>
          The defining inequality itself is Jensen&apos;s: for <M>{"\\theta \\in [0,1]"}</M>,
          <M>{"f(\\theta \\mathbf{x} + (1-\\theta)\\mathbf{y}) \\le \\theta f(\\mathbf{x}) + (1-\\theta) f(\\mathbf{y})"}</M>.
          From the first-order condition, if <M>{"\\nabla f(\\mathbf{x}^\\star) = 0"}</M> then
          <M>{"f(\\mathbf{y}) \\ge f(\\mathbf{x}^\\star)"}</M> for all <M>{"\\mathbf{y}"}</M> &mdash; a stationary point is globally optimal.
        </p>
      </Advanced>

      <Callout kind="insight" title="Why this is a big deal">
        Convexity converts optimization from a search for the best of many candidate optima into
        the certification of a single one. That is why classic models &mdash; linear regression,
        ridge/lasso, logistic regression, and SVMs &mdash; are reliable: their loss surfaces are
        convex, so the fitted solution is provably the best fit, not a lucky local one.
      </Callout>

      <h2>Where it matters in practice</h2>
      <p>
        Many workhorse machine-learning losses are convex in the parameters. When they are, you get
        reproducibility (the same data gives the same optimum regardless of initialization) and you
        can trust convergence diagnostics. Deep networks are the famous exception: their losses are
        deeply non-convex, which is why initialization, learning-rate schedules, and tricks like
        batch normalization matter so much.
      </p>

      <CodeBlock language="python" filename="convex_check.py">{`import numpy as np

# Logistic-regression loss is convex in w; gradient descent finds THE optimum.
def loss(w, X, y):
    z = X @ w
    return np.mean(np.log1p(np.exp(z)) - y * z)  # convex in w

def grad(w, X, y):
    p = 1 / (1 + np.exp(-X @ w))
    return X.T @ (p - y) / len(y)

rng = np.random.default_rng(0)
X = rng.normal(size=(200, 3)); y = (X[:, 0] > 0).astype(float)

# Two different starts converge to the same minimizer (convexity).
def fit(w0, lr=0.5, steps=2000):
    w = w0.copy()
    for _ in range(steps):
        w -= lr * grad(w, X, y)
    return w

a = fit(np.zeros(3))
b = fit(rng.normal(size=3))
print(np.allclose(a, b, atol=1e-3))  # True: same global optimum
`}</CodeBlock>

      <Callout kind="pitfall" title="Convex in what, exactly?">
        Convexity is always relative to specific variables. A neural network&apos;s loss may be
        convex in the final linear layer&apos;s weights while being wildly non-convex in the full
        parameter set. Always ask: convex with respect to <em>which</em> variables, holding which
        others fixed?
      </Callout>

      <MoreDepth>
        <p>
          The deeper power of convexity is duality. Every convex program has a dual whose optimum
          lower-bounds the primal; under mild conditions (Slater&apos;s condition) the gap is zero
          &mdash; <strong>strong duality</strong>. This gives you a certificate: the dual solution
          proves your primal answer is optimal without re-searching the space. The KKT conditions
          then become both necessary and sufficient for optimality, which is exactly what powers
          interior-point methods and the SVM&apos;s support-vector representation. Crucially, the
          practical line is not convex versus non-convex but whether you can <em>recognize and
          model</em> your problem as convex &mdash; disciplined convex programming (CVXPY) exists to
          help you stay inside this regime by construction.
        </p>
      </MoreDepth>

      <Quiz question="Why does convexity guarantee that gradient descent finds the global optimum?" options={[
        { text: "Because the gradient is always zero, so there is nothing to optimize", why: "The gradient is not always zero; it is zero only at the optimum." },
        { text: "Because in a convex function every local minimum is also the global minimum, so any stationary point downhill is the best one", correct: true, why: "Convexity rules out separate valleys, so the first-order stationarity condition certifies global optimality." },
        { text: "Because convex functions have no minimum, so any point is acceptable", why: "Convex functions can absolutely have minima; convexity does not remove them." },
        { text: "Because gradient descent uses a fixed learning rate that prevents overshooting", why: "Learning rate affects convergence speed, not whether local minima are global; that is the structural role of convexity." },
      ]} />
    </>
  );
}
