"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { CodeBlock } from "@/components/content/code-block";
import { Quiz } from "@/components/content/quiz";
import { KMeansPlayground } from "@/components/viz/kmeans";

export default function KMeansContent() {
  return (
    <>
      <p>
        k-Means is the go-to algorithm for <strong>unsupervised</strong> learning — finding structure
        in data with no labels. Give it the number of groups <M>{"k"}</M>, and it partitions your points
        into <M>{"k"}</M> clusters by repeatedly answering two questions.
      </p>

      <KeyIdea>
        Repeat until nothing changes: (1) <strong>assign</strong> every point to its nearest centroid,
        then (2) <strong>move</strong> each centroid to the average of its assigned points. That&apos;s the
        entire algorithm — and it&apos;s guaranteed to converge.
      </KeyIdea>

      <p>
        Step through it below. Watch the centroids (the crosses) jump to the middle of their colored
        points, which reassigns some points, which moves the centroids again — until it settles.
      </p>

      <KMeansPlayground />

      <h2>The loop in detail</h2>
      <Basic>
        <p>
          Start by dropping <M>{"k"}</M> centroids at random. Color each point by whichever centroid is
          closest. Then slide each centroid to the center of its color. Some points are now closer to a
          different centroid, so recolor — and repeat. It stops when no point changes color.
        </p>
      </Basic>
      <Advanced>
        <p>k-Means minimizes the <strong>within-cluster sum of squares</strong> (inertia):</p>
        <MB>{"J = \\sum_{i=1}^{k} \\sum_{x \\in C_i} \\lVert x - \\mu_i \\rVert^2"}</MB>
        <p>
          The assign and update steps are coordinate descent on <M>{"J"}</M>, so it never increases —
          guaranteeing convergence, though only to a <strong>local</strong> optimum that depends on
          initialization. <strong>k-means++</strong> seeding spreads initial centroids apart to land
          near better optima far more reliably than random starts.
        </p>
      </Advanced>

      <Callout kind="warning" title="You have to choose k">
        k-Means won&apos;t tell you how many clusters exist. Use the <strong>elbow method</strong> (plot
        inertia vs k and look for the bend) or the <strong>silhouette score</strong> (how well-separated
        clusters are) to choose. Click &quot;new data&quot; and &quot;re-init&quot; above to see how much
        the starting points matter.
      </Callout>

      <CodeBlock language="python" filename="kmeans.py">{`from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

X = StandardScaler().fit_transform(X)   # scale first — k-means uses distances!

km = KMeans(n_clusters=3, n_init="auto", random_state=0).fit(X)
labels = km.labels_
print("inertia:", km.inertia_)`}</CodeBlock>

      <MoreDepth>
        <p>k-Means makes strong assumptions that break in practice:</p>
        <ul>
          <li><strong>Spherical, equal-size clusters</strong> — it fails on elongated or nested shapes. Use DBSCAN, spectral, or Gaussian mixtures instead.</li>
          <li><strong>Distance-based</strong> — unscaled features let large-range columns dominate. Always standardize.</li>
          <li><strong>Sensitive to outliers</strong> — means get dragged; consider k-medoids.</li>
          <li><strong>Curse of dimensionality</strong> — Euclidean distance loses meaning in very high dimensions; reduce first (PCA/UMAP).</li>
        </ul>
      </MoreDepth>

      <Quiz
        question="You run k-means twice on the same data and get different clusters. Why?"
        options={[
          { text: "k-means is non-deterministic by design and the result is meaningless.", why: "It's deterministic given a seed; the issue is the starting point." },
          { text: "Different random initial centroids led to different local optima.", correct: true, why: "Exactly — use k-means++ and multiple restarts (n_init) to mitigate." },
          { text: "The data changed.", why: "Same data — the variation comes from initialization." },
          { text: "k-means ignores the data entirely.", why: "It very much uses the data; it just converges to a local optimum." },
        ]}
      />
    </>
  );
}
