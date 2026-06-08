"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { CodeBlock } from "@/components/content/code-block";
import { Quiz } from "@/components/content/quiz";
import { KMeansPlayground } from "@/components/viz/kmeans";
import { InterviewProblem } from "@/components/content/interview-problem";

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
    <h2>Interview practice</h2>
<InterviewProblem question="What objective does k-means minimize, and why is the algorithm guaranteed to converge?" difficulty="easy" tag="Conceptual">
  <p>k-means minimizes the <strong>within-cluster sum of squares</strong> (inertia): the total squared Euclidean distance from each point to its assigned centroid.</p>
  <MB>{"J = \\sum_{k=1}^{K} \\sum_{x_i \\in C_k} \\lVert x_i - \\mu_k \\rVert^2"}</MB>
  <p>The standard (Lloyd&apos;s) algorithm is coordinate descent on this objective, alternating two steps that each can only <strong>decrease or hold</strong> <M>{"J"}</M>:</p>
  <ul>
    <li><strong>Assign:</strong> with centroids fixed, sending each point to its nearest centroid is the assignment that minimizes its contribution to <M>{"J"}</M>.</li>
    <li><strong>Update:</strong> with assignments fixed, the centroid that minimizes the squared distance to a set of points is exactly their mean &mdash; that is why centroids are means.</li>
  </ul>
  <p>Because <M>{"J"}</M> is bounded below by zero and never increases, and there are only finitely many possible assignments, the loop must converge in a finite number of steps. Note the catch: it converges to a <strong>local</strong> minimum, not necessarily the global one.</p>
</InterviewProblem>
<InterviewProblem question="A colleague runs k-means twice with the same k and gets two different clusterings. Explain why, and how you would make the result reliable." difficulty="medium" tag="Applied">
  <p>The difference comes from <strong>random initialization</strong>. Because the objective is non-convex, the centroids you start from determine which local minimum you fall into. Different random seeds land in different basins, so the same <M>{"k"}</M> can yield different partitions and different final inertia.</p>
  <p>Practical fixes:</p>
  <ul>
    <li><strong>Multiple restarts:</strong> run several times with different seeds and keep the run with the lowest inertia. In scikit-learn this is the <strong>n_init</strong> parameter.</li>
    <li><strong>Smarter seeding:</strong> use <strong>k-means++</strong>, which spreads initial centroids out by sampling each new center with probability proportional to its squared distance from the nearest existing center. This both speeds convergence and gives a provable expected-cost guarantee.</li>
    <li><strong>Standardize features first</strong> so no single high-variance feature dominates the Euclidean distance and destabilizes the result.</li>
  </ul>
  <CodeBlock language="python" filename="stable_kmeans.py">{`from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

Xs = StandardScaler().fit_transform(X)

# k-means++ seeding + 10 restarts -> reproducible, low-inertia result
km = KMeans(n_clusters=4, init="k-means++", n_init=10, random_state=0)
labels = km.fit_predict(Xs)
print("best inertia:", km.inertia_)`}</CodeBlock>
</InterviewProblem>
<InterviewProblem question="How do you choose k? Contrast the elbow method with the silhouette score." difficulty="medium" tag="Conceptual">
  <p>There is no label to validate against, so you rely on internal heuristics.</p>
  <p><strong>Elbow method:</strong> plot inertia versus <M>{"k"}</M>. Inertia always falls as <M>{"k"}</M> grows (with <M>{"k = n"}</M> it hits zero), so you do not minimize it &mdash; you look for the &quot;elbow&quot; where the marginal drop flattens, signaling that extra clusters stop buying much. The weakness is that the elbow is often ambiguous.</p>
  <p><strong>Silhouette score:</strong> for each point compute</p>
  <MB>{"s_i = \\frac{b_i - a_i}{\\max(a_i, b_i)}"}</MB>
  <p>where <M>{"a_i"}</M> is the mean distance to points in its own cluster and <M>{"b_i"}</M> is the mean distance to the nearest other cluster. The score ranges in <M>{"[-1, 1]"}</M>: near <M>{"1"}</M> means tight and well-separated, near <M>{"0"}</M> means on a boundary, negative means likely misassigned. You pick the <M>{"k"}</M> that maximizes the average silhouette.</p>
  <p>In short: the elbow is a quick eyeball on compactness only, while silhouette balances <strong>cohesion against separation</strong> and gives a single number to maximize, so it is usually the stronger default.</p>
</InterviewProblem>
<InterviewProblem question="Give a concrete dataset where k-means fails badly, explain why, and name an algorithm that handles it." difficulty="hard" tag="Case">
  <p>Classic failure: <strong>two concentric rings</strong> (or two interleaving half-moons). Visually there are two clusters, but k-means recovers neither.</p>
  <p>Why it fails &mdash; three assumptions baked into the objective are violated:</p>
  <ul>
    <li><strong>Spherical, convex clusters.</strong> Minimizing squared Euclidean distance to a centroid carves space into a <strong>Voronoi diagram</strong> &mdash; convex polytopes. A ring is not convex, so no centroid placement can isolate it; k-means slices both rings into pie wedges instead.</li>
    <li><strong>Similar cluster sizes and densities.</strong> The mean-based update is pulled toward dense regions, so it mishandles clusters of very different spread or count.</li>
    <li><strong>Meaningful Euclidean distance.</strong> The right notion here is connectivity along the manifold, not straight-line distance through empty space.</li>
  </ul>
  <p>Better tools: <strong>DBSCAN</strong> (density-based, follows arbitrary shapes and labels outliers as noise) or <strong>spectral clustering</strong> (build a similarity graph, embed via its Laplacian eigenvectors, then run k-means in that space where the rings become linearly separable). A <strong>Gaussian mixture</strong> with full covariances relaxes the spherical assumption to elliptical but still cannot bend around a ring.</p>
</InterviewProblem>

      </>
  );
}
