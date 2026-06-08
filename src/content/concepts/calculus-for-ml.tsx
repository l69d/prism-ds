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
    </>
  );
}
