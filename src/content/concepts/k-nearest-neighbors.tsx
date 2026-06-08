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
      <p>
        k-Nearest Neighbors (kNN) makes a prediction for a new point by finding
        the training examples closest to it and letting them vote. There is no
        equation to fit, no weights to learn &mdash; it simply memorizes the data.
      </p>

      <KeyIdea>
        Things that are close together in feature space tend to share a label.
        To classify a point, ask its <strong>k</strong> nearest neighbors and go
        with the majority.
      </KeyIdea>

      <h2>How it works</h2>
      <p>
        kNN is called a <strong>lazy learner</strong> because training does
        almost nothing &mdash; it just stores the data. All the work happens at
        prediction time:
      </p>
      <ul>
        <li>Compute the distance from the query point to every training point.</li>
        <li>Keep the <strong>k</strong> closest ones (the neighbors).</li>
        <li>For classification, take a majority vote; for regression, average their values.</li>
      </ul>

      <Basic>
        <p>
          Imagine you move to a new neighborhood and want to guess whether a
          house is expensive. You look at the few houses nearest to it: if most
          are pricey, you guess pricey. Small <strong>k</strong> (like 1) trusts
          the single closest neighbor &mdash; sensitive but jumpy. Large
          <strong> k</strong> smooths things out by polling a bigger crowd, but
          can blur fine boundaries. The right <strong>k</strong> balances the two.
        </p>
      </Basic>

      <Advanced>
        <p>
          Given a query <M>{"\\mathbf{x}"}</M>, define its neighborhood
          <M>{"\\,N_k(\\mathbf{x})"}</M> as the k training points minimizing a
          distance metric &mdash; commonly Euclidean:
        </p>
        <MB>{"d(\\mathbf{x}, \\mathbf{x}_i) = \\sqrt{\\sum_{j=1}^{p} (x_j - x_{ij})^2}"}</MB>
        <p>The classification rule is a majority vote over the neighborhood:</p>
        <MB>{"\\hat{y}(\\mathbf{x}) = \\arg\\max_{c} \\sum_{i \\in N_k(\\mathbf{x})} \\mathbb{1}(y_i = c)"}</MB>
        <p>
          As <M>{"n \\to \\infty"}</M> with <M>{"k \\to \\infty"}</M> and
          <M>{"\\,k/n \\to 0"}</M>, the kNN error is bounded by twice the Bayes
          error rate &mdash; a remarkable consistency guarantee for such a simple
          method.
        </p>
      </Advanced>

      <Callout kind="pitfall" title="Scale your features first">
        Distance is dominated by whatever feature has the largest range. If
        income is in dollars (thousands) and age is in years (tens), income
        swamps age. Always standardize or normalize features before running kNN.
      </Callout>

      <CodeBlock language="python" filename="knn.py">{`from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline

# Scaling INSIDE the pipeline is essential for distance-based kNN
clf = make_pipeline(
    StandardScaler(),
    KNeighborsClassifier(n_neighbors=5, weights="distance"),
)
clf.fit(X_train, y_train)
print(clf.score(X_test, y_test))`}</CodeBlock>

      <MoreDepth>
        <p>
          kNN suffers from the <strong>curse of dimensionality</strong>: in high
          dimensions, distances concentrate &mdash; the nearest and farthest
          points become almost equidistant, so &quot;nearest&quot; loses meaning.
          It is also slow at inference (every prediction scans the whole training
          set), which motivates spatial indexes like KD-trees and ball-trees, and
          approximate methods like HNSW that power modern vector search.
        </p>
      </MoreDepth>

      <Quiz question="Why must features usually be standardized before applying kNN?" options={[
        { text: "Because kNN cannot handle negative numbers", why: "False; kNN works fine with negative values." },
        { text: "Because the distance metric lets large-scale features dominate the neighbor calculation", correct: true, why: "Unscaled features with big ranges overwhelm the distance, distorting which points count as nearest." },
        { text: "Because standardization speeds up the training phase", why: "kNN barely trains; standardization is about meaningful distances, not training speed." },
        { text: "Because it removes the need to choose k", why: "Scaling and choosing k are independent; you still must pick k." },
      ]} />
    </>
  );
}
