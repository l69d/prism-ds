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
      <p>High-dimensional data is hard to plot, slow to model, and riddled with redundant columns. Dimensionality reduction squeezes many features into a few while preserving the structure that matters.</p>

      <KeyIdea>Real data rarely fills its high-dimensional box uniformly &mdash; it clusters near a much lower-dimensional surface. Reduction finds that surface and re-expresses each point with far fewer numbers.</KeyIdea>

      <h2>The three workhorses</h2>
      <p>Each method answers a different question about what &quot;keeping the signal&quot; means:</p>
      <ul>
        <li><strong>PCA</strong> &mdash; linear. Finds the directions of greatest variance and projects onto them. Fast, reversible, great for compression and denoising.</li>
        <li><strong>t-SNE</strong> &mdash; nonlinear, for visualization. Preserves local neighborhoods so clusters pop in 2D, but distances between clusters are not meaningful.</li>
        <li><strong>UMAP</strong> &mdash; nonlinear too, faster than t-SNE, and better at keeping some global structure while still revealing clusters.</li>
      </ul>

      <h2>How it works</h2>
      <Basic>
        <p>Imagine photographing a 3D object. The shadow it casts on a wall is a 2D summary &mdash; pick the angle that keeps the object&apos;s shape most recognizable and you lose the least information.</p>
        <p>PCA picks that angle automatically: it rotates the data so the first axis points along the direction where points spread out the most, the second along the next-most spread, and so on. Drop the low-spread axes and you have fewer columns that still capture the overall shape.</p>
      </Basic>
      <Advanced>
        <p>PCA diagonalizes the covariance matrix. Center the data so <M>{"\\mathbf{X}"}</M> has zero-mean columns, then form the covariance and take its eigendecomposition:</p>
        <MB>{"\\mathbf{C} = \\tfrac{1}{n-1}\\mathbf{X}^\\top\\mathbf{X} = \\mathbf{V}\\boldsymbol{\\Lambda}\\mathbf{V}^\\top"}</MB>
        <p>The eigenvectors in <M>{"\\mathbf{V}"}</M> are the principal directions; eigenvalues <M>{"\\lambda_i"}</M> give the variance along each. Keeping the top <M>{"k"}</M> gives the projection <M>{"\\mathbf{Z} = \\mathbf{X}\\mathbf{V}_k"}</M>, which minimizes reconstruction error <M>{"\\lVert \\mathbf{X} - \\mathbf{Z}\\mathbf{V}_k^\\top \\rVert_F^2"}</M> among all rank-<M>{"k"}</M> linear maps (Eckart&ndash;Young). t-SNE instead minimizes the KL divergence between pairwise neighbor probabilities in high and low dimensions, prioritizing local fidelity over global geometry.</p>
      </Advanced>

      <Callout kind="pitfall" title="Cluster sizes and gaps in t-SNE/UMAP lie">
        The area of a t-SNE or UMAP blob and the distance between blobs are largely artifacts of the algorithm and its hyperparameters (perplexity, n_neighbors). Use them to <em>spot</em> clusters, never to measure how big or how far apart they are.
      </Callout>

      <CodeBlock language="python" filename="reduce.py">{`from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import umap

# ALWAYS standardize first for PCA — it is scale-sensitive
X = StandardScaler().fit_transform(X_raw)

# Linear compression: keep enough components for 95% variance
pca = PCA(n_components=0.95).fit(X)
X_pca = pca.transform(X)
print("kept", pca.n_components_, "of", X.shape[1], "dims")
print("explained variance:", pca.explained_variance_ratio_.sum().round(3))

# Nonlinear 2D embedding for visualization only
X_2d = umap.UMAP(n_neighbors=15, min_dist=0.1).fit_transform(X)`}</CodeBlock>

      <MoreDepth>
        <p>A subtle trap: t-SNE and UMAP have no honest <code>transform</code> for downstream modeling. Their embeddings are non-parametric and unstable across runs and seeds, so fitting a classifier on a t-SNE projection and then embedding new test points is statistically unsound &mdash; you cannot reproduce the same coordinate frame. Reserve them for exploration. For a learnable, invertible nonlinear reduction you can deploy, reach for an autoencoder or kernel PCA. And remember PCA assumes variance equals signal: if your informative direction has small variance (e.g., a faint but discriminative feature) PCA will happily discard it, which is why supervised methods like LDA exist.</p>
      </MoreDepth>

      <Quiz question="You run t-SNE on a dataset and see two tight clusters far apart on the plot. What can you safely conclude?" options={[
        { text: "The two clusters are roughly equal in size since their blobs look similar", why: "Blob area in t-SNE is an artifact of the embedding, not a measure of cluster size." },
        { text: "There appear to be two distinct neighborhood structures in the data", correct: true, why: "t-SNE preserves local neighborhoods, so well-separated blobs reliably indicate distinct local groupings worth investigating." },
        { text: "The clusters are far apart in the original feature space because they are far apart on the plot", why: "Inter-cluster distances in t-SNE are not faithful to original distances and should not be read quantitatively." },
        { text: "You can project new test points into this same plot to classify them", why: "t-SNE has no stable, reproducible transform for unseen points; embeddings vary across runs." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="What does PCA actually optimize, and why do we center (and often scale) the data first?" difficulty="easy" tag="Conceptual">
  <p>PCA finds an orthogonal set of directions (principal components) that capture the maximum variance in the data. The first component is the unit vector <M>{"w"}</M> maximizing the variance of the projection <M>{"w^\\top x"}</M>; each subsequent component does the same subject to being orthogonal to the previous ones.</p>
  <p>Equivalently, PCA is the eigendecomposition of the covariance matrix <M>{"\\Sigma = \\frac{1}{n} X^\\top X"}</M> (on centered <M>{"X"}</M>): the eigenvectors are the components and the eigenvalues are the variance explained along each.</p>
  <ul>
    <li><strong>Centering</strong> is mandatory. The objective is about variance around the mean. If you skip mean-subtraction, the first &quot;component&quot; gets dragged toward the data&apos;s offset from the origin rather than its direction of spread.</li>
    <li><strong>Scaling</strong> (standardizing each feature to unit variance) matters when features are on different units. Variance is not scale-invariant, so a feature measured in dollars (range 0&ndash;100000) will dominate one measured in fractions (range 0&ndash;1) purely because of units, not importance. Use the correlation matrix instead of the covariance matrix when scales differ.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="How do you choose the number of components to keep, and how would you defend that choice to a skeptical stakeholder?" difficulty="medium" tag="Applied">
  <p>There is no single rule; pick a criterion that matches the downstream goal:</p>
  <ul>
    <li><strong>Explained-variance threshold.</strong> Keep the smallest <M>{"k"}</M> such that the cumulative ratio <M>{"\\sum_{i=1}^{k}\\lambda_i / \\sum_j \\lambda_j"}</M> exceeds a target (commonly 90&ndash;95%). Simple and defensible for compression.</li>
    <li><strong>Scree / elbow.</strong> Plot eigenvalues in descending order and cut where the curve flattens. Visual but subjective.</li>
    <li><strong>Downstream validation.</strong> If PCA feeds a classifier or regressor, treat <M>{"k"}</M> as a hyperparameter and pick it by cross-validated task performance, not by variance. The variance retained is not the same as the predictive signal retained.</li>
    <li><strong>Parallel analysis / Kaiser rule.</strong> Keep components whose eigenvalues exceed those expected from random/permuted data (more principled than Kaiser&apos;s &quot;eigenvalue &gt; 1&quot;).</li>
  </ul>
  <p>To a stakeholder: show the cumulative-variance curve, state that you retain (say) 95% of variance with a fraction of the original features, and confirm that model accuracy on a held-out set is preserved within noise. That ties the abstract choice to a metric they care about.</p>
  <CodeBlock language="python" filename="choose_k.py">{`import numpy as np
from sklearn.decomposition import PCA

# X is already standardized (zero mean, unit variance per column)
pca = PCA().fit(X)
cum = np.cumsum(pca.explained_variance_ratio_)
k = int(np.argmax(cum >= 0.95) + 1)   # smallest k reaching 95%
print(f"Need {k} components for 95% variance")

# Refit keeping only k, then transform
X_reduced = PCA(n_components=k).fit_transform(X)`}</CodeBlock>
</InterviewProblem>
<InterviewProblem question="A colleague runs t-SNE, sees two tight clusters far apart, and concludes the classes are well separated and one cluster is twice as 'spread out' as the other. What's wrong with this reasoning?" difficulty="hard" tag="Conceptual">
  <p>Both conclusions over-read the plot. t-SNE preserves <strong>local</strong> neighborhood structure, not global geometry, so the embedding distances and densities are not faithful summaries of the original space.</p>
  <ul>
    <li><strong>Cluster sizes are not meaningful.</strong> t-SNE adapts its per-point bandwidth so that each point has roughly the same effective number of neighbors (set by <em>perplexity</em>). Dense and sparse regions get expanded or contracted to equalize, so a visually &quot;bigger&quot; cluster does not mean more variance.</li>
    <li><strong>Distances between clusters are not meaningful.</strong> The gap between two clusters in a t-SNE plot says little about their true separation; well-separated blobs can appear at arbitrary distances depending on perplexity and initialization.</li>
    <li><strong>Apparent clusters can be artifacts.</strong> At low perplexity or too few iterations, t-SNE can fracture a single group into several blobs, or create structure in pure noise.</li>
    <li><strong>It is non-deterministic and hyperparameter-sensitive.</strong> Different random seeds, perplexities, and learning rates yield different pictures. Always inspect several settings before drawing conclusions.</li>
  </ul>
  <p>The right framing: t-SNE (and UMAP) are exploratory <em>visualization</em> tools to suggest hypotheses about local structure, not to quantify separation or spread. To claim separability, validate with a classifier or a metric computed in the original/feature space, not from the 2D coordinates.</p>
</InterviewProblem>
<InterviewProblem question="Given the SVD of the centered data matrix X = U S V^T, show how to obtain the principal components, the projected scores, and the variance explained by each component." difficulty="hard" tag="Math">
  <p>Let <M>{"X \\in \\mathbb{R}^{n \\times d}"}</M> be mean-centered with the thin SVD</p>
  <MB>{"X = U S V^\\top, \\qquad U^\\top U = I,\; V^\\top V = I,\; S = \\operatorname{diag}(s_1,\\dots,s_r)."}</MB>
  <p>The (unbiased-ish) covariance is</p>
  <MB>{"\\Sigma = \\frac{1}{n} X^\\top X = \\frac{1}{n} V S U^\\top U S V^\\top = V \\left(\\frac{S^2}{n}\\right) V^\\top."}</MB>
  <p>This is exactly the eigendecomposition of <M>{"\\Sigma"}</M>. Therefore:</p>
  <ul>
    <li>The <strong>principal directions</strong> are the right singular vectors &mdash; the columns of <M>{"V"}</M>.</li>
    <li>The <strong>variance explained</strong> by component <M>{"i"}</M> is the eigenvalue <M>{"\\lambda_i = s_i^2 / n"}</M>, so the ratio is <M>{"s_i^2 / \\sum_j s_j^2"}</M>.</li>
    <li>The <strong>scores</strong> (data in PC coordinates) are <M>{"T = X V = U S"}</M>. The <M>{"k"}</M>-dimensional reduction keeps the first <M>{"k"}</M> columns: <M>{"T_k = U_k S_k"}</M>.</li>
  </ul>
  <p>Why this matters in practice: computing PCA via SVD of <M>{"X"}</M> is more numerically stable than forming <M>{"X^\\top X"}</M> explicitly, because squaring the matrix squares its condition number and amplifies round-off in the small singular values.</p>
</InterviewProblem>

      </>
  );
}
