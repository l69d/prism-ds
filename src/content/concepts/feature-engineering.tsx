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
      <p>Feature engineering is the craft of reshaping raw columns into signals a model can actually use. The same algorithm can win or lose a competition based purely on how you encode, combine, and bin its inputs.</p>

      <KeyIdea>A model can only fit the geometry you hand it. Feature engineering bends raw data into a shape where the patterns become linearly &mdash; or at least easily &mdash; separable.</KeyIdea>

      <h2>The core moves</h2>
      <p>Most practical gains come from a small toolbox applied with judgment:</p>
      <ul>
        <li><strong>Encodings</strong> turn categories into numbers: one-hot for low cardinality, target/mean encoding for high cardinality, ordinal when order is real.</li>
        <li><strong>Interactions</strong> multiply or combine features so the model sees joint effects, e.g. <M>{"\\text{price} \\times \\text{quantity}"}</M>, that a linear model cannot infer alone.</li>
        <li><strong>Binning</strong> discretizes continuous values into buckets, taming outliers and letting tree splits or linear coefficients capture nonlinearity.</li>
        <li><strong>Transforms</strong> like <M>{"\\log(1+x)"}</M> compress skewed, heavy-tailed columns toward symmetry.</li>
      </ul>

      <h2>Why it works</h2>
      <Basic><p>Think of a model as a tenant who can only rearrange the furniture you put in the room. If you hand it &quot;date of birth&quot; it struggles, but if you compute &quot;age in years&quot; the relationship to, say, income becomes obvious. Good features pre-digest the world so the model spends its capacity on patterns, not on reconstructing arithmetic you could have done for it.</p></Basic>
      <Advanced><p>For a linear model <M>{"\\hat{y} = \\mathbf{w}^\\top \\phi(\\mathbf{x})"}</M>, the feature map <M>{"\\phi"}</M> defines the hypothesis space entirely. Adding an interaction term lifts the input into a higher-dimensional space where a hyperplane can separate what was curved before:</p><MB>{"\\phi(x_1, x_2) = (x_1,\; x_2,\; x_1 x_2,\; x_1^2,\; x_2^2)"}</MB><p>This is the explicit cousin of the kernel trick. Trees are invariant to monotone transforms of a single feature, so binning helps them less &mdash; but engineered <em>interactions</em> still matter because a tree must spend depth to discover them.</p></Advanced>

      <Callout kind="pitfall" title="Target leakage hides in plain sight">Mean-encoding a category using the whole dataset leaks the target into the features: each row borrows its own label through the group average. Validation scores look brilliant, then production collapses. Compute encodings inside cross-validation folds (out-of-fold) and fit every transform on training data only.</Callout>

      <CodeBlock language="python" filename="encode.py">{`import numpy as np
from sklearn.model_selection import KFold

def out_of_fold_target_encode(df, cat_col, target, n_splits=5):
    """Leak-free mean encoding: each fold encoded by the OTHER folds."""
    encoded = np.zeros(len(df))
    kf = KFold(n_splits=n_splits, shuffle=True, random_state=0)
    global_mean = df[target].mean()
    for train_idx, val_idx in kf.split(df):
        means = df.iloc[train_idx].groupby(cat_col)[target].mean()
        encoded[val_idx] = df.iloc[val_idx][cat_col].map(means).fillna(global_mean)
    return encoded`}</CodeBlock>

      <MoreDepth><p>High-cardinality target encoding overfits rare categories, so blend each group mean toward the global prior with smoothing: <M>{"\\tilde{\\mu}_g = \\frac{n_g \\bar{y}_g + \\alpha \\bar{y}}{n_g + \\alpha}"}</M>, where small groups (<M>{"n_g \\ll \\alpha"}</M>) shrink toward the global mean. This is empirical Bayes in disguise &mdash; <M>{"\\alpha"}</M> is a pseudo-count expressing how much you trust the prior.</p></MoreDepth>

      <Quiz question="Why must target encoding be computed out-of-fold?" options={[
        { text: "It runs faster when split across folds", why: "Performance is not the concern; out-of-fold work is usually slower, not faster." },
        { text: "Encoding a row with its own label leaks the target and inflates validation scores", correct: true, why: "Using the full-data group mean lets each row see its own target, producing optimistic scores that vanish in production." },
        { text: "Out-of-fold encoding removes the need for a test set", why: "You still need a held-out test set; cross-validated encoding only prevents leakage within training." },
        { text: "It converts categories into one-hot vectors automatically", why: "Out-of-fold encoding is about leakage, not about the encoding type; it still produces a single numeric column." },
      ]} />
    </>
  );
}
