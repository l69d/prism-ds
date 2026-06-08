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
    </>
  );
}
