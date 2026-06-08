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
      <p>A decision tree predicts by asking a sequence of yes/no questions about the features, funneling each example down to a leaf that holds a prediction. It is one of the few models you can read like a flowchart.</p>

      <KeyIdea>A tree greedily picks the one feature-and-threshold split that most reduces impurity at each node, then recurses, carving the feature space into axis-aligned boxes that each predict a single constant.</KeyIdea>

      <h2>How it grows</h2>
      <p>Training is recursive. At each node the algorithm scans every feature and every candidate threshold, scores how well each split separates the data, keeps the best one, and repeats on the two children until a stopping rule fires.</p>
      <ul>
        <li><strong>Split criterion:</strong> for classification, Gini impurity or entropy; for regression, variance (mean squared error) of the target.</li>
        <li><strong>Greedy:</strong> the best split is chosen locally at each node, with no backtracking — so the tree is not guaranteed globally optimal.</li>
        <li><strong>Stopping:</strong> max depth, minimum samples per leaf, or no split that improves purity.</li>
      </ul>

      <Basic>
        <p>Imagine sorting fruit. Your first question might be &quot;is it heavier than 150 grams?&quot; That one cut already separates most melons from most berries. Then within each pile you ask another question, like color or texture, until each final pile is almost entirely one fruit. The tree learns those questions automatically, always choosing the question that makes the resulting piles as pure as possible.</p>
      </Basic>

      <Advanced>
        <p>Gini impurity for a node with class proportions <M>{"p_k"}</M> is</p>
        <MB>{"G = \\sum_{k=1}^{K} p_k (1 - p_k) = 1 - \\sum_{k=1}^{K} p_k^2"}</MB>
        <p>A split is scored by the impurity drop it produces, weighting children by their sample fraction:</p>
        <MB>{"\\Delta = G_{\\text{parent}} - \\frac{n_L}{n} G_L - \\frac{n_R}{n} G_R"}</MB>
        <p>The algorithm chooses the split maximizing <M>{"\\Delta"}</M>. Entropy <M>{"H = -\\sum_k p_k \\log_2 p_k"}</M> is an alternative; the corresponding drop is the information gain. Because evaluating every threshold on every feature at every node is feasible, growth runs in roughly <M>{"O(n d \\log n)"}</M> time for <M>{"n"}</M> samples and <M>{"d"}</M> features.</p>
      </Advanced>

      <Callout kind="pitfall" title="Trees overfit by default">
        An unconstrained tree keeps splitting until every leaf is pure, memorizing noise and producing a jagged, high-variance boundary. Always constrain depth or leaf size, or prune — and prefer ensembles like random forests or gradient boosting when raw accuracy matters.
      </Callout>

      <CodeBlock language="python" filename="tree.py">{`from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.datasets import load_iris

X, y = load_iris(return_X_y=True)

# Constrain depth to fight overfitting; the tree stays readable.
clf = DecisionTreeClassifier(criterion="gini", max_depth=3, random_state=0)
clf.fit(X, y)

# Inspect the actual decision rules.
print(export_text(clf, feature_names=load_iris().feature_names))
print("feature importances:", clf.feature_importances_)`}</CodeBlock>

      <MoreDepth>
        <p>Splits are axis-aligned, so a tree approximates a diagonal boundary with a staircase, needing many splits where a single oblique cut would do. Feature importances (the total impurity reduction a feature contributes) are biased toward high-cardinality and continuous features, since they offer more candidate thresholds — prefer permutation importance for honest attribution. This instability is exactly why bagging works: averaging many decorrelated trees cancels the variance that a single greedy tree cannot escape.</p>
      </MoreDepth>

      <Quiz question="Why does a single decision tree tend to overfit if grown without constraints?" options={[
        { text: "It minimizes a convex loss that has many local minima", why: "Tree growth is greedy and combinatorial, not convex optimization; overfitting is unrelated to local minima here." },
        { text: "It keeps splitting until leaves are pure, fitting noise as if it were signal", why: "Correct — unconstrained growth drives training impurity to zero by carving ever-smaller boxes around individual noisy points.", correct: true },
        { text: "It averages too many weak learners, blurring the signal", why: "A single tree averages nothing; that description fits an underfit ensemble, not an overfit tree." },
        { text: "It uses L2 regularization that is too weak", why: "Standard trees have no weight-decay term; they are controlled by depth and leaf-size limits, not L2." },
      ]} />
    </>
  );
}
