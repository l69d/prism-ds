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
    <h2>Interview practice</h2>
<InterviewProblem question="What is target leakage in feature engineering, and how does it usually sneak in?" difficulty="easy" tag="Conceptual">
  <p><strong>Target leakage</strong> happens when a feature contains information that would not be available at prediction time, often because it is derived (directly or indirectly) from the label. The model looks brilliant offline and collapses in production.</p>
  <p>Common sources:</p>
  <ul>
    <li><strong>Leaky columns:</strong> a field like &quot;account_closed_reason&quot; when predicting churn — it only exists after the outcome.</li>
    <li><strong>Fit-before-split:</strong> computing means, scalers, or target encodings on the <strong>full</strong> dataset, then splitting. Test-row statistics bleed into training.</li>
    <li><strong>Future windows:</strong> aggregating over a time window that extends past the prediction timestamp.</li>
    <li><strong>Train/test contamination:</strong> deduplicating, imputing, or oversampling before the split.</li>
  </ul>
  <p>The discipline: fit every transformer on the <strong>training fold only</strong> and apply it to validation/test, and ask of every feature &quot;would I literally have this value at scoring time?&quot;</p>
</InterviewProblem>
<InterviewProblem question="A categorical feature has 50,000 unique values (e.g. zip code). How would you encode it for a gradient-boosted model without leaking the target?" difficulty="medium" tag="Applied">
  <p>One-hot is out — 50k sparse columns explode memory and the model cannot split usefully on rare levels. The strong default is <strong>target (mean) encoding</strong>, but it leaks unless done carefully.</p>
  <p><strong>Naive target encoding</strong> replaces each level with the mean label for that level:</p>
  <MB>{"\\hat{y}_{c} = \\frac{1}{n_c} \\sum_{i: x_i = c} y_i"}</MB>
  <p>For a zip that appears once, this just memorizes that row&apos;s label — pure leakage. Fix it on two fronts:</p>
  <ul>
    <li><strong>Smoothing</strong> toward the global mean <M>{"\\mu"}</M>, so rare levels are pulled to the prior:</li>
  </ul>
  <MB>{"\\hat{y}_{c} = \\frac{n_c \\,\\bar{y}_c + m\\,\\mu}{n_c + m}"}</MB>
  <ul>
    <li>where <M>{"\\bar{y}_c"}</M> is the in-level mean, <M>{"n_c"}</M> the level count, and <M>{"m"}</M> a smoothing strength.</li>
    <li><strong>Out-of-fold encoding:</strong> compute each row&apos;s encoding from the <strong>other</strong> folds (K-fold or leave-one-out), never its own row, so the target value of a row never informs its own feature.</li>
  </ul>
  <CodeBlock language="python" filename="target_encode.py">{`import numpy as np
from sklearn.model_selection import KFold

def kfold_target_encode(x, y, m=20, n_splits=5, seed=0):
    """Out-of-fold smoothed mean encoding (no leakage)."""
    x = np.asarray(x); y = np.asarray(y, dtype=float)
    out = np.zeros(len(x))
    mu = y.mean()
    kf = KFold(n_splits=n_splits, shuffle=True, random_state=seed)
    for tr, va in kf.split(x):
        # stats from the TRAIN fold only
        levels = {}
        for c in np.unique(x[tr]):
            mask = x[tr] == c
            n_c = mask.sum()
            mean_c = y[tr][mask].mean()
            levels[c] = (n_c * mean_c + m * mu) / (n_c + m)
        # apply to the held-out fold
        out[va] = [levels.get(c, mu) for c in x[va]]
    return out`}</CodeBlock>
  <p>Alternatives worth naming: <strong>hashing</strong> (fixed-width, collision-tolerant), <strong>frequency/count encoding</strong>, or letting a model like CatBoost do ordered target statistics natively.</p>
</InterviewProblem>
<InterviewProblem question="Tree-based models can split on a feature repeatedly, so they should capture interactions automatically. When does manually engineering interaction or ratio features still help?" difficulty="medium" tag="Conceptual">
  <p>True that a deep tree can approximate <M>{"x_1 \\times x_2"}</M> via nested axis-aligned splits, but &quot;can in principle&quot; is not &quot;will efficiently.&quot; Hand-built features still pay off when:</p>
  <ul>
    <li><strong>The interaction is a smooth ratio or product.</strong> A staircase of splits approximating <M>{"\\text{debt}/\\text{income}"}</M> needs many nodes and lots of data; the explicit ratio is one clean feature the model can split on directly.</li>
    <li><strong>Data is limited.</strong> Each additional split depth costs samples. Encoding domain knowledge up front reduces the effective complexity the model must learn.</li>
    <li><strong>The model is linear or additive.</strong> Linear/GAM/logistic models cannot represent interactions at all without explicit cross terms.</li>
    <li><strong>Interpretability matters.</strong> A single &quot;price_per_sqft&quot; feature is far more legible to stakeholders than a tangle of co-splits.</li>
  </ul>
  <p>The flip side: do not blindly cross every pair. Polynomial expansion of <M>{"d"}</M> features gives <M>{"\\binom{d}{2}"}</M> pairs and inflates variance and compute. Add interactions guided by domain intuition or by inspecting which pairs the trees already co-split on.</p>
</InterviewProblem>
<InterviewProblem question="When is binning (discretizing) a continuous feature a good idea versus a bad one, and what is the standard leakage trap with supervised binning?" difficulty="hard" tag="Case">
  <p><strong>When binning helps:</strong></p>
  <ul>
    <li>The relationship is strongly <strong>non-monotonic or threshold-like</strong> (e.g. risk that spikes only for ages under 25 and over 70) and your model is linear — bins let a linear model bend.</li>
    <li>You want <strong>robustness to outliers</strong> and a smoother, more stable signal (binning caps extreme leverage).</li>
    <li><strong>Interpretability / regulatory</strong> reasons — scorecards and WOE-based credit models are built on bins.</li>
  </ul>
  <p><strong>When it hurts:</strong></p>
  <ul>
    <li>With trees/GBMs it usually <strong>destroys information</strong> — the model already chooses optimal split points, and coarse bins throw away resolution.</li>
    <li>Too few bins underfits; too many bins overfit and leave sparse bins with noisy estimates.</li>
    <li>Hard boundaries make two near-identical values (just across a cut point) land in different bins — a discontinuity that may not exist in reality.</li>
  </ul>
  <p><strong>The leakage trap:</strong> <strong>supervised</strong> binning — choosing cut points to maximize separation of the target (optimal/WOE binning, or anything that looks at <M>{"y"}</M>) — must be fit on the <strong>training fold only</strong>. If you pick bin edges using the whole dataset, the test labels influenced the boundaries and your validation score is optimistic. Even unsupervised quantile binning has a milder version: compute the quantile edges on train and apply the <strong>same</strong> edges to test, never re-fit per split.</p>
  <p>Default stance: for GBMs, skip binning and let the trees split; reach for binning when you specifically need linearity-friendliness, monotonic WOE scorecards, or outlier robustness — and always fit edges out-of-sample.</p>
</InterviewProblem>

      </>
  );
}
