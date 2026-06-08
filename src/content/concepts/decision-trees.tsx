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
    <h2>Interview practice</h2>
<InterviewProblem question="What does a decision tree actually optimize at each split, and why is the procedure called greedy?" difficulty="easy" tag="Conceptual">
  <p>At each node the tree searches over every feature and every candidate threshold for the single split that most reduces a node-impurity measure. For classification the two common measures are Gini impurity and entropy:</p>
  <MB>{"G(t) = 1 - \\sum_{k} p_k^2, \\qquad H(t) = -\\sum_{k} p_k \\log_2 p_k"}</MB>
  <p>where <M>{"p_k"}</M> is the fraction of class <M>{"k"}</M> in node <M>{"t"}</M>. The split is scored by the weighted impurity of the children, and the tree picks the split with the largest decrease:</p>
  <MB>{"\\Delta = I(t) - \\frac{n_L}{n} I(t_L) - \\frac{n_R}{n} I(t_R)"}</MB>
  <p>It is <strong>greedy</strong> because it commits to the locally best split at each node without looking ahead. It never reconsiders an earlier split to see whether a worse split now would enable a much better one later, so the resulting tree is not guaranteed to be the globally optimal tree (finding that is NP-hard). For regression the same idea applies with variance / mean-squared-error reduction replacing impurity.</p>
</InterviewProblem>
<InterviewProblem question="Compute the information gain of a candidate split. Parent node has 10 positives and 10 negatives; one child gets 8 positives and 2 negatives, the other gets 2 positives and 8 negatives." difficulty="medium" tag="Math">
  <p>Use entropy. The parent is perfectly balanced, so its entropy is maximal:</p>
  <MB>{"H(\\text{parent}) = -\\tfrac{1}{2}\\log_2 \\tfrac{1}{2} - \\tfrac{1}{2}\\log_2 \\tfrac{1}{2} = 1 \\text{ bit}"}</MB>
  <p>Each child has 10 samples with an 8/2 split, so both children share the same entropy:</p>
  <MB>{"H(\\text{child}) = -0.8\\log_2 0.8 - 0.2\\log_2 0.2 \\approx 0.722 \\text{ bits}"}</MB>
  <p>The weighted child entropy is <M>{"\\tfrac{10}{20}(0.722) + \\tfrac{10}{20}(0.722) = 0.722"}</M>, so the information gain is:</p>
  <MB>{"IG = 1 - 0.722 = 0.278 \\text{ bits}"}</MB>
  <p>Intuition check: the split turned two coin-flip nodes into two confident 80/20 nodes, so it is genuinely informative but not perfect. A clean split (all positives one side, all negatives the other) would give child entropy 0 and the maximum gain of 1 bit.</p>
</InterviewProblem>
<InterviewProblem question="A single decision tree overfits badly on your tabular dataset. Walk through how you would diagnose and fix it." difficulty="medium" tag="Applied">
  <p>First confirm it is overfitting: a large gap between near-perfect training accuracy and much lower validation accuracy is the signature. A fully grown tree memorizes the training set because it can keep splitting until every leaf is pure.</p>
  <p>Then control complexity with regularization on the tree itself:</p>
  <ul>
    <li><strong>max_depth</strong> &mdash; cap how deep the tree grows.</li>
    <li><strong>min_samples_leaf / min_samples_split</strong> &mdash; require enough samples before a node is allowed to split, which stops the tree from carving out tiny leaves that fit noise.</li>
    <li><strong>max_leaf_nodes</strong> &mdash; bound total leaves directly.</li>
    <li><strong>cost-complexity pruning (ccp_alpha)</strong> &mdash; grow fully, then prune back the subtrees whose accuracy gain does not justify their added size, choosing <M>{"\\alpha"}</M> by cross-validation.</li>
  </ul>
  <p>Tune these with cross-validation rather than eyeballing a single split. If a single tree still underperforms, the honest fix is usually to stop relying on one tree: bagging (random forest) averages many decorrelated deep trees to cut variance, and boosting (gradient boosting) builds shallow trees sequentially to cut bias. You trade away the perfect interpretability of one tree for substantially better generalization.</p>
</InterviewProblem>
<InterviewProblem question="Why are split-based (mean-decrease-in-impurity) feature importances misleading, and what would you use instead?" difficulty="hard" tag="Conceptual">
  <p>Impurity-based importances sum the weighted impurity reduction each feature produces across all splits. Two well-known biases distort them:</p>
  <ul>
    <li><strong>Cardinality / high-variance bias.</strong> Features with many distinct values (continuous or high-cardinality categoricals) offer more candidate split points, so they can reduce impurity on the training data partly by chance. They look important even when they carry no real signal &mdash; a random unique-ID column can rank highly.</li>
    <li><strong>Computed on training data.</strong> The reductions are measured on the same data the tree was fit to, so they reward overfitting splits rather than predictive value on unseen data.</li>
    <li><strong>Correlated features split the credit arbitrarily.</strong> If two features are redundant, the tree uses one and the other looks worthless, even though either alone is informative.</li>
  </ul>
  <p>A more trustworthy alternative is <strong>permutation importance</strong> measured on held-out data: fit the model, record the validation score, then shuffle one feature&apos;s values and measure how much the score drops. A feature the model truly relies on causes a large drop when scrambled. It is model-agnostic and computed out-of-sample. For attributing individual predictions, SHAP values give a consistent, theoretically grounded decomposition.</p>
  <CodeBlock language="python" filename="permutation_importance.py">{`from sklearn.inspection import permutation_importance
from sklearn.tree import DecisionTreeClassifier

tree = DecisionTreeClassifier(max_depth=6, random_state=0).fit(X_train, y_train)

# Permutation importance on the VALIDATION set, not the training set
result = permutation_importance(
    tree, X_val, y_val,
    n_repeats=20, random_state=0, scoring="roc_auc",
)

for i in result.importances_mean.argsort()[::-1]:
    mean = result.importances_mean[i]
    std = result.importances_std[i]
    print(f"{feature_names[i]:20s} {mean:.4f} +/- {std:.4f}")`}</CodeBlock>
</InterviewProblem>

      </>
  );
}
