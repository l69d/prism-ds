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
      <p>Training a model means tweaking its knobs until its predictions stop being wrong. Calculus is the math that tells you which direction to turn each knob, and by how much.</p>

      <KeyIdea>A derivative measures how a tiny nudge to an input changes the output. The gradient bundles those nudges for every parameter at once, and it always points in the direction of steepest increase &mdash; so to shrink the loss, step the opposite way.</KeyIdea>

      <h2>From slope to gradient</h2>
      <p>A model has a <strong>loss</strong> <M>{"L"}</M> that scores how bad its predictions are. We want the parameters that make <M>{"L"}</M> small. The three tools we need:</p>
      <ul>
        <li><strong>Derivative</strong>: for one parameter, <M>{"dL/dw"}</M> is the slope of loss vs. that weight.</li>
        <li><strong>Gradient</strong>: stack the partial derivatives into a vector <M>{"\\nabla L"}</M> &mdash; one slope per parameter.</li>
        <li><strong>Chain rule</strong>: networks are functions of functions, so derivatives multiply layer by layer. This is exactly what backpropagation computes.</li>
      </ul>

      <Basic>
        <p>Imagine standing on a foggy hillside where altitude is your error. You can&apos;t see the valley, but you <em>can</em> feel the slope under your feet. The gradient is that felt slope. Take a small step downhill, feel again, repeat. That loop &mdash; feel, step, repeat &mdash; is gradient descent, and it is essentially how every neural network learns.</p>
        <p>The chain rule is the bookkeeping for blame: if a late layer made an error, the chain rule says how much each earlier layer contributed, so each one knows how to adjust.</p>
      </Basic>

      <Advanced>
        <p>The derivative is the limit of the difference quotient:</p>
        <MB>{"\\frac{dL}{dw} = \\lim_{h \\to 0} \\frac{L(w + h) - L(w)}{h}"}</MB>
        <p>For a parameter vector <M>{"\\mathbf{w} \\in \\mathbb{R}^n"}</M>, the gradient collects all partials:</p>
        <MB>{"\\nabla L = \\left( \\frac{\\partial L}{\\partial w_1}, \\dots, \\frac{\\partial L}{\\partial w_n} \\right)"}</MB>
        <p>Gradient descent updates with learning rate <M>{"\\eta"}</M>:</p>
        <MB>{"\\mathbf{w}_{t+1} = \\mathbf{w}_t - \\eta \\, \\nabla L(\\mathbf{w}_t)"}</MB>
        <p>For a composition <M>{"L = f(g(w))"}</M>, the chain rule multiplies local derivatives, <M>{"\\frac{dL}{dw} = f'(g(w)) \\cdot g'(w)"}</M>, which backprop applies repeatedly across layers.</p>
      </Advanced>

      <Callout kind="insight" title="Why the negative gradient">
        The gradient points toward the steepest <em>increase</em> of the loss. Since we want to minimize, we move in the opposite direction. The learning rate controls how big each step is &mdash; too large overshoots, too small crawls.
      </Callout>

      <h2>It is automatic now</h2>
      <p>You rarely differentiate by hand. Frameworks build a computation graph and apply the chain rule for you &mdash; that is <strong>automatic differentiation</strong>.</p>

      <CodeBlock language="python" filename="grad.py">{`import torch

# A weight we want to optimize
w = torch.tensor(3.0, requires_grad=True)

# Loss: minimized at w = 2
loss = (w - 2) ** 2

loss.backward()          # chain rule, automatically
print(w.grad)            # dL/dw = 2*(w-2) = 2.0

# One manual gradient-descent step
with torch.no_grad():
    w -= 0.1 * w.grad    # w -> 2.8, closer to the minimum
`}</CodeBlock>

      <Callout kind="pitfall" title="Vanishing gradients">
        Multiplying many small local derivatives through deep networks can drive the gradient toward zero, so early layers barely learn. Activations like ReLU, residual connections, and normalization exist largely to keep gradients alive.
      </Callout>

      <MoreDepth>
        <p>The gradient is a row in the <strong>Jacobian</strong>, and its rate of change is the <strong>Hessian</strong> (the matrix of second derivatives). Second-order methods use the Hessian to rescale steps for faster convergence, but storing an <M>{"n \\times n"}</M> matrix is infeasible for billion-parameter models &mdash; which is why first-order optimizers like Adam, which cheaply approximate curvature using running averages of gradients and their squares, dominate deep learning in practice.</p>
      </MoreDepth>

      <Quiz question="In gradient descent, why do we subtract the gradient instead of adding it?" options={[
        { text: "Subtracting normalizes the gradient to unit length", why: "Subtraction does not change magnitude; normalization is a separate, optional step." },
        { text: "The gradient points toward steepest increase, so its negative points toward decrease", correct: true, why: "Right: to minimize loss we move opposite the direction of steepest ascent." },
        { text: "Adding the gradient would make the learning rate negative", why: "The learning rate is a chosen positive scalar; the sign comes from the update rule, not from it." },
        { text: "Subtraction is required for the chain rule to apply", why: "The chain rule computes the gradient; it is independent of whether we then add or subtract it." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="What is a gradient, and why does gradient descent step in the negative gradient direction?" difficulty="easy" tag="Conceptual">
  <p>For a scalar loss <M>{"L(\\theta)"}</M> with parameter vector <M>{"\\theta \\in \\mathbb{R}^n"}</M>, the gradient <M>{"\\nabla L"}</M> is the vector of partial derivatives:</p>
  <MB>{"\\nabla L = \\left[\\frac{\\partial L}{\\partial \\theta_1}, \\dots, \\frac{\\partial L}{\\partial \\theta_n}\\right]^\\top"}</MB>
  <p>It points in the direction of <strong>steepest ascent</strong>, and its magnitude is the rate of increase in that direction. To <strong>minimize</strong> the loss we move opposite to it:</p>
  <MB>{"\\theta \\leftarrow \\theta - \\eta\\,\\nabla L(\\theta)"}</MB>
  <p>Key intuition: by a first-order Taylor expansion, <M>{"L(\\theta + \\delta) \\approx L(\\theta) + \\nabla L^\\top \\delta"}</M>. For a fixed step length, the choice of <M>{"\\delta"}</M> that decreases <M>{"L"}</M> the most is <M>{"\\delta \\propto -\\nabla L"}</M>, since that makes the inner product as negative as possible. The learning rate <M>{"\\eta"}</M> controls step size: too large overshoots and diverges, too small crawls.</p>
</InterviewProblem>
<InterviewProblem question="Derive the gradient of the logistic regression cross-entropy loss with respect to the weights." difficulty="medium" tag="Math">
  <p>Let <M>{"z = w^\\top x + b"}</M>, prediction <M>{"\\hat{y} = \\sigma(z) = \\frac{1}{1+e^{-z}}"}</M>, and per-example loss for label <M>{"y \\in \\{0,1\\}"}</M>:</p>
  <MB>{"L = -\\big[y\\log\\hat{y} + (1-y)\\log(1-\\hat{y})\\big]"}</MB>
  <p>Apply the chain rule through <M>{"L \\to \\hat{y} \\to z \\to w"}</M>. First the loss w.r.t. the prediction:</p>
  <MB>{"\\frac{\\partial L}{\\partial \\hat{y}} = -\\frac{y}{\\hat{y}} + \\frac{1-y}{1-\\hat{y}}"}</MB>
  <p>Then the sigmoid derivative, which has a clean form:</p>
  <MB>{"\\frac{\\partial \\hat{y}}{\\partial z} = \\sigma(z)\\,(1-\\sigma(z)) = \\hat{y}(1-\\hat{y})"}</MB>
  <p>Multiplying, the awkward terms cancel beautifully:</p>
  <MB>{"\\frac{\\partial L}{\\partial z} = \\hat{y} - y"}</MB>
  <p>Finally, since <M>{"\\partial z / \\partial w = x"}</M>:</p>
  <MB>{"\\frac{\\partial L}{\\partial w} = (\\hat{y} - y)\\,x, \\qquad \\frac{\\partial L}{\\partial b} = \\hat{y} - y"}</MB>
  <p>The takeaway interviewers want: the gradient is the prediction error scaled by the input. This same <M>{"\\hat{y} - y"}</M> form shows up in linear regression with MSE and in softmax classification with cross-entropy, which is why these losses pair so naturally with their output activations.</p>
</InterviewProblem>
<InterviewProblem question="A model's training loss is stuck on a plateau and barely moves. Explain the calculus-level causes and how you would diagnose them." difficulty="hard" tag="Applied">
  <p>A plateau means gradients are near zero or are not producing useful updates. Walk through the candidate causes:</p>
  <ul>
    <li><strong>Vanishing gradients.</strong> With saturating activations like sigmoid or tanh, <M>{"\\sigma'(z) = \\hat{y}(1-\\hat{y})"}</M> peaks at only <M>{"0.25"}</M> and collapses toward 0 when <M>{"|z|"}</M> is large. Backprop multiplies these per layer, so deep nets shrink the signal geometrically. Fix with ReLU-family activations, residual connections, or normalization.</li>
    <li><strong>Flat regions and saddle points.</strong> In high dimensions, critical points where <M>{"\\nabla L \\approx 0"}</M> are far more often saddles than true minima. The Hessian has mixed-sign eigenvalues, so first-order methods stall. Momentum or Adam helps escape by accumulating velocity.</li>
    <li><strong>Learning rate too small.</strong> Steps <M>{"\\eta \\nabla L"}</M> are tiny, so progress is real but glacial. Distinguish this from a genuine plateau by checking whether loss decreases at all over many steps.</li>
    <li><strong>Dead units.</strong> ReLU neurons stuck at negative pre-activations have derivative 0 and never recover, killing their gradient contribution permanently.</li>
  </ul>
  <p>Diagnosis steps: log the gradient norm per layer (a vanishing norm in early layers confirms the first cause); do a learning-rate range test; inspect activation statistics for saturation or dead units; and check whether a momentum-based optimizer breaks the stall, which points to a saddle rather than a true minimum.</p>
</InterviewProblem>
<InterviewProblem question="Verify an analytic gradient with numerical differentiation. Write the gradient check." difficulty="medium" tag="Coding">
  <p>The standard sanity check before trusting backprop is to compare the analytic gradient against a finite-difference estimate. Use the <strong>centered</strong> difference, whose error is <M>{"O(h^2)"}</M> versus <M>{"O(h)"}</M> for the one-sided version:</p>
  <MB>{"\\frac{\\partial L}{\\partial \\theta_i} \\approx \\frac{L(\\theta + h\\,e_i) - L(\\theta - h\\,e_i)}{2h}"}</MB>
  <CodeBlock language="python" filename="grad_check.py">{`import numpy as np

def grad_check(loss_fn, analytic_grad_fn, theta, h=1e-5):
    """Compare analytic gradient to a centered finite difference."""
    analytic = analytic_grad_fn(theta)
    numeric = np.zeros_like(theta)
    for i in range(theta.size):
        step = np.zeros_like(theta)
        step[i] = h
        numeric[i] = (loss_fn(theta + step) - loss_fn(theta - step)) / (2 * h)
    # relative error is scale-invariant; ~1e-7 is a pass, >1e-4 is a bug
    denom = np.maximum(np.abs(analytic) + np.abs(numeric), 1e-12)
    rel_err = np.abs(analytic - numeric) / denom
    return rel_err.max()

# Example: L(theta) = sum(theta**2), grad = 2*theta
theta = np.array([1.0, -2.0, 0.5])
err = grad_check(lambda t: np.sum(t**2),
                 lambda t: 2 * t,
                 theta)
print(f"max relative error: {err:.2e}")  # ~1e-10`}</CodeBlock>
  <p>Practical notes interviewers probe: choose <M>{"h"}</M> around <M>{"10^{-5}"}</M> to balance truncation error (large <M>{"h"}</M>) against floating-point cancellation (tiny <M>{"h"}</M>); use <strong>relative</strong> error, not absolute, so the threshold is scale-free; and disable randomness like dropout during the check so both evaluations see the same function.</p>
</InterviewProblem>

      </>
  );
}
