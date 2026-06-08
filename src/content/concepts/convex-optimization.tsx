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
    <h2>Interview practice</h2>

<InterviewProblem question="What does convexity buy you in optimization, and what specifically breaks when a problem is non-convex?" difficulty="easy" tag="Conceptual">
  <p>A set is convex if the line segment between any two points in it stays inside the set; a function is convex if the chord between any two points on its graph lies on or above the graph. Formally, for <M>{"\\lambda \\in [0,1]"}</M>:</p>
  <MB>{"f(\\lambda x + (1-\\lambda) y) \\le \\lambda f(x) + (1-\\lambda) f(y)"}</MB>
  <p>The key payoff: <strong>for a convex objective over a convex feasible set, any local minimum is also a global minimum.</strong> So a method that just walks downhill (gradient descent, Newton, interior point) cannot get stuck in a bad valley &mdash; once it stops, you are done. You also get certifiable optimality: the KKT conditions are sufficient, not just necessary.</p>
  <p>When the problem is non-convex, that guarantee evaporates:</p>
  <ul>
    <li><strong>Multiple local minima</strong> &mdash; the solution you reach depends on initialization, so you typically need restarts and have no proof you found the best one.</li>
    <li><strong>Saddle points and plateaus</strong> trap or slow first-order methods.</li>
    <li><strong>No optimality certificate</strong> &mdash; KKT points may be saddles or local maxima, so satisfying them tells you little.</li>
  </ul>
  <p>This is exactly why we love linear/logistic regression, SVMs, and LASSO (convex) and treat deep nets (non-convex) as a different game requiring SGD heuristics, momentum, and luck with initialization.</p>
</InterviewProblem>

<InterviewProblem question="Prove that the logistic regression negative log-likelihood is convex in the weights." difficulty="hard" tag="Math">
  <p>For a single example with label <M>{"y \\in \\{0,1\\}"}</M> and features <M>{"x"}</M>, let <M>{"z = w^\\top x"}</M> and <M>{"\\sigma(z) = 1/(1+e^{-z})"}</M>. The per-example loss is:</p>
  <MB>{"\\ell(w) = -y\\log\\sigma(z) - (1-y)\\log(1-\\sigma(z))"}</MB>
  <p>Using <M>{"\\log\\sigma(z) = -\\log(1+e^{-z})"}</M> and <M>{"\\log(1-\\sigma(z)) = -z-\\log(1+e^{-z})"}</M>, this simplifies to the softplus form:</p>
  <MB>{"\\ell(w) = \\log\\bigl(1+e^{z}\\bigr) - y\\,z"}</MB>
  <p>The <M>{"-yz"}</M> term is linear in <M>{"w"}</M> (hence convex). For the rest, compute derivatives in <M>{"z"}</M>. The first derivative is <M>{"\\sigma(z) - y"}</M>, and the second is:</p>
  <MB>{"\\frac{d^2\\ell}{dz^2} = \\sigma(z)\\bigl(1-\\sigma(z)\\bigr) > 0"}</MB>
  <p>So <M>{"\\ell"}</M> is convex as a function of the scalar <M>{"z"}</M>. Since <M>{"z = w^\\top x"}</M> is an affine function of <M>{"w"}</M>, and convexity is preserved under composition with an affine map, <M>{"\\ell"}</M> is convex in <M>{"w"}</M>. The full objective is a sum over examples (plus an optional <M>{"\\ell_2"}</M> penalty <M>{"\\tfrac{\\lambda}{2}\\lVert w\\rVert^2"}</M>, which is strictly convex), and <strong>a sum of convex functions is convex</strong>. Adding the ridge term makes it <strong>strictly</strong> convex, guaranteeing a unique global minimizer.</p>
  <p>Equivalently in matrix form, the Hessian is <M>{"X^\\top S X"}</M> with <M>{"S"}</M> the diagonal matrix of <M>{"\\sigma(z_i)(1-\\sigma(z_i)) > 0"}</M> entries, which is positive semidefinite &mdash; the second-order certificate of convexity.</p>
</InterviewProblem>

<InterviewProblem question="A teammate frames a clustering objective and reports that the loss differs across runs with the same data. They ask if the optimizer is buggy. How do you respond, and how would you make the problem better behaved?" difficulty="medium" tag="Applied">
  <p>The first thing to check is whether the objective is even convex &mdash; run-to-run variation in the final loss is the textbook symptom of a <strong>non-convex landscape with multiple local minima</strong>, not a bug. Classic k-means minimizes within-cluster sum of squares jointly over assignments and centroids, which is non-convex (it is combinatorial in the assignments), so Lloyd&apos;s algorithm only finds a local optimum that depends on the seed.</p>
  <p>I would explain this and then attack it on two fronts:</p>
  <ul>
    <li><strong>Mitigate the non-convexity:</strong> use many random restarts and keep the best objective (<strong>k-means++</strong> seeding dramatically reduces bad local minima), and fix the random seed for reproducibility when comparing.</li>
    <li><strong>Reformulate toward convexity if it matters:</strong> a convex relaxation (e.g. an SDP relaxation of k-means, or switching to a convex clustering / fused-LASSO formulation that penalizes pairwise centroid differences) gives a single global optimum at the cost of more compute.</li>
  </ul>
  <p>The teaching point: before debugging the optimizer, classify the objective. If it is convex and you see variation, suspect the code; if it is non-convex, the variation is expected and the fix is better initialization, restarts, or a convex reformulation &mdash; not chasing a phantom bug.</p>
</InterviewProblem>

<InterviewProblem question="Implement projected gradient descent to solve a simple convex problem and confirm it converges to the known global optimum." difficulty="medium" tag="Coding">
  <p>Minimize <M>{"f(x) = \\tfrac{1}{2}\\lVert x - a\\rVert^2"}</M> subject to <M>{"x \\ge 0"}</M> (a convex objective over a convex set). Because both are convex, projected gradient descent must reach the unique global minimum, which is just <M>{"\\max(a, 0)"}</M> coordinatewise &mdash; projecting the unconstrained optimum <M>{"a"}</M> onto the feasible set.</p>
  <CodeBlock language="python" filename="pgd.py">{`import numpy as np

rng = np.random.default_rng(0)
a = rng.normal(size=5)              # unconstrained optimum is a
x = np.zeros(5)                     # feasible start
lr = 0.5                            # step < 2/L with L=1 guarantees descent

for _ in range(200):
    grad = x - a                   # gradient of 0.5*||x-a||^2
    x = x - lr * grad              # gradient step
    x = np.maximum(x, 0.0)         # projection onto x >= 0

global_opt = np.maximum(a, 0.0)    # closed-form global minimizer
print("converged:", np.allclose(x, global_opt, atol=1e-6))
print(x)
print(global_opt)`}</CodeBlock>
  <p>The step size matters: for an <M>{"L"}</M>-smooth convex <M>{"f"}</M> (here <M>{"L=1"}</M>), any constant step <M>{"\\eta < 2/L"}</M> guarantees convergence, and the projection step is valid because projecting onto a convex set is non-expansive &mdash; it never increases the distance to the optimum. The reason we can <strong>assert</strong> the answer against a closed form is precisely the convexity guarantee: there is exactly one minimum, so &quot;a local solution&quot; and &quot;the global solution&quot; coincide. If you tried this trick on a non-convex objective, the closed-form check would fail because the iterate could land in any of several valleys.</p>
</InterviewProblem>

      </>
  );
}
