"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { Quiz } from "@/components/content/quiz";
import { BiasVarianceExplorer } from "@/components/viz/bias-variance";

export default function BiasVarianceContent() {
  return (
    <>
      <p>
        The bias-variance tradeoff is the central tension in machine learning. Make a model too
        simple and it <strong>underfits</strong>; make it too flexible and it <strong>overfits</strong>.
        The art is finding the sweet spot that generalizes to new data.
      </p>

      <KeyIdea>
        <strong>Bias</strong> is error from wrong assumptions — the model is too rigid to capture the
        pattern. <strong>Variance</strong> is error from sensitivity to the particular training sample —
        the model memorizes noise. You can almost always trade one for the other; you want their sum minimized.
      </KeyIdea>

      <p>
        Increase the polynomial degree below. At degree 1 the model is too stiff (high bias). Push it
        high and it wiggles through every noisy point (high variance) — train error keeps dropping while
        test error turns back up. That U-shaped test curve is the whole story.
      </p>

      <BiasVarianceExplorer />

      <h2>Underfit vs overfit</h2>
      <Basic>
        <p>
          An <strong>underfit</strong> model is wrong in the same way everywhere — a straight line
          through a curve. An <strong>overfit</strong> model is right on the training data and wrong
          on everything else — it learned the noise, not the signal. The tell is the gap: low training
          error but high test error means overfitting.
        </p>
      </Basic>
      <Advanced>
        <p>For squared-error loss, expected test error decomposes exactly:</p>
        <MB>{"\\mathbb{E}\\big[(y-\\hat{f}(x))^2\\big] = \\underbrace{\\text{Bias}[\\hat{f}]^2}_{\\text{too rigid}} + \\underbrace{\\text{Var}[\\hat{f}]}_{\\text{too sensitive}} + \\underbrace{\\sigma^2}_{\\text{irreducible}}"}</MB>
        <p>
          The <M>{"\\sigma^2"}</M> term is noise you can never remove. Increasing model complexity
          lowers bias but raises variance; the optimum is where the two derivatives cancel.
        </p>
      </Advanced>

      <Callout kind="pitfall" title="The symptom you'll actually see">
        A big gap between training and validation score = overfitting (high variance). Both scores
        bad and close together = underfitting (high bias). Diagnose with a <strong>learning curve</strong>
        before reaching for fixes.
      </Callout>

      <h2>How to move along the curve</h2>
      <ul>
        <li><strong>Reduce variance</strong> — more data, regularization, simpler model, bagging, dropout, early stopping.</li>
        <li><strong>Reduce bias</strong> — a more expressive model, better features, less regularization, boosting.</li>
      </ul>

      <MoreDepth>
        <p>
          Modern deep learning complicates the classic picture: hugely over-parameterized networks
          can have near-zero training error yet still generalize, a phenomenon called{" "}
          <strong>double descent</strong> — test error falls, rises near the interpolation threshold,
          then falls again as capacity grows further. The tradeoff still governs, but implicit
          regularization (from SGD, architecture, and scale) reshapes where the optimum sits.
        </p>
      </MoreDepth>

      <Quiz
        question="Your model scores 0.99 on training data but 0.61 on validation. What's happening, and what helps?"
        options={[
          { text: "Underfitting — use a more complex model.", why: "Underfitting shows low scores on both sets, not a huge gap." },
          { text: "Overfitting — add regularization or more data.", correct: true, why: "The large train/val gap is the signature of high variance." },
          { text: "The data is perfect — ship it.", why: "Validation at 0.61 means it won't generalize." },
          { text: "Nothing — training score is all that matters.", why: "Training score alone is meaningless; generalization is the goal." },
        ]}
      />
    </>
  );
}
