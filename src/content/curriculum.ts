/* ----------------------------------------------------------------------------
   Prism curriculum spine.
   Concepts with status "live" have a full interactive lesson registered in
   src/content/registry.tsx. "soon" concepts render a structured preview page.
---------------------------------------------------------------------------- */

export type ConceptStatus = "live" | "soon";
export type Tone = "violet" | "indigo" | "cyan" | "pink";

export type Concept = {
  slug: string;
  title: string;
  blurb: string;
  minutes: number;
  status: ConceptStatus;
  hasViz?: boolean;
  objectives?: string[];
};

export type Module = {
  id: string;
  title: string;
  short: string;
  description: string;
  icon: string;
  tone: Tone;
  concepts: Concept[];
};

export const curriculum: Module[] = [
  {
    id: "foundations",
    title: "Foundations & EDA",
    short: "Foundations",
    description:
      "How data science actually works end-to-end, and how to interrogate a dataset before you model anything.",
    icon: "Compass",
    tone: "cyan",
    concepts: [
      { slug: "what-is-data-science", title: "The Data Science Lifecycle", blurb: "Roles, the CRISP-DM loop, and where every other skill slots in.", minutes: 8, status: "live",
        objectives: ["The question → data → model → decision loop", "Analyst vs ML engineer vs research roles", "Why 80% of the work is before the model"] },
      { slug: "data-types-and-structures", title: "Data Types & Structures", blurb: "Numeric, categorical, ordinal, text, time — and why the type dictates the method.", minutes: 7, status: "live" },
      { slug: "exploratory-data-analysis", title: "Exploratory Data Analysis", blurb: "The first hour with any dataset: shape, distributions, relationships, surprises.", minutes: 16, status: "live", hasViz: true,
        objectives: ["A repeatable EDA checklist", "Read a distribution: center, spread, shape, tails", "Spot relationships and Simpson-style traps", "When a summary statistic lies"] },
      { slug: "descriptive-statistics", title: "Descriptive Statistics", blurb: "Mean vs median, variance, quantiles, skew — summarising without distorting.", minutes: 10, status: "live" },
      { slug: "data-cleaning", title: "Data Cleaning", blurb: "Types, duplicates, units, encodings — turning raw data into analyzable data.", minutes: 9, status: "live" },
      { slug: "missing-data", title: "Missing Data", blurb: "MCAR/MAR/MNAR and the imputation choices that won't bias your model.", minutes: 9, status: "live" },
      { slug: "outliers-and-anomalies", title: "Outliers & Anomalies", blurb: "Detect, understand, and decide: error, rare event, or signal?", minutes: 8, status: "live" },
      { slug: "feature-scaling", title: "Feature Scaling", blurb: "Standardize, normalize, robust-scale — and which models actually care.", minutes: 7, status: "live" },
      { slug: "correlation-vs-causation", title: "Correlation vs Causation", blurb: "Why correlation is necessary, never sufficient, and how it fools people.", minutes: 8, status: "live" },
    ],
  },
  {
    id: "math",
    title: "Math & Optimization",
    short: "Math",
    description:
      "The minimal linear algebra, calculus, and optimization that the rest of ML is built on — taught visually.",
    icon: "Sigma",
    tone: "indigo",
    concepts: [
      { slug: "linear-algebra-essentials", title: "Linear Algebra Essentials", blurb: "Vectors, dot products, matrices as transformations — the language of features.", minutes: 14, status: "live" },
      { slug: "matrix-decompositions", title: "Matrix Decompositions", blurb: "Eigenvectors, SVD, and why they power PCA and recommender systems.", minutes: 12, status: "live" },
      { slug: "calculus-for-ml", title: "Calculus for ML", blurb: "Derivatives, gradients, and the chain rule — just enough to train models.", minutes: 11, status: "live" },
      { slug: "gradient-descent", title: "Gradient Descent", blurb: "The optimizer behind almost everything: roll downhill on a loss surface.", minutes: 14, status: "live", hasViz: true,
        objectives: ["Why we follow the negative gradient", "Learning rate: too small, too big, just right", "Local minima, saddle points, momentum", "Batch vs stochastic vs mini-batch"] },
      { slug: "convex-optimization", title: "Convex Optimization", blurb: "Why convexity guarantees a global optimum — and what breaks without it.", minutes: 10, status: "live" },
    ],
  },
  {
    id: "stats",
    title: "Probability & Statistics",
    short: "Stats",
    description:
      "Reasoning under uncertainty: distributions, sampling, inference, and the tests that separate signal from noise.",
    icon: "Dices",
    tone: "violet",
    concepts: [
      { slug: "probability-basics", title: "Probability Basics", blurb: "Events, conditional probability, independence, and Bayes' rule.", minutes: 12, status: "live", hasViz: true },
      { slug: "random-variables", title: "Random Variables & Expectation", blurb: "Expectation, variance, and how randomness gets a number.", minutes: 10, status: "live" },
      { slug: "probability-distributions", title: "Probability Distributions", blurb: "Normal, binomial, Poisson, exponential — shapes you'll see everywhere.", minutes: 15, status: "live", hasViz: true,
        objectives: ["PDF vs PMF vs CDF, intuitively", "How each distribution's parameters reshape it", "When each one shows up in the wild", "The 68-95-99.7 rule and tails"] },
      { slug: "central-limit-theorem", title: "Central Limit Theorem", blurb: "Why averages go normal — the result that makes inference possible.", minutes: 13, status: "live", hasViz: true,
        objectives: ["Sampling distribution of the mean", "Why it's normal regardless of the source", "Standard error and the 1/√n law", "Why the CLT underpins every confidence interval"] },
      { slug: "estimation-and-sampling", title: "Estimation & Sampling", blurb: "Point estimates, bias, variance, and what a 'good' estimator means.", minutes: 11, status: "live", hasViz: true },
      { slug: "confidence-intervals", title: "Confidence Intervals", blurb: "What '95% confident' really means — and what it doesn't.", minutes: 10, status: "live", hasViz: true },
      { slug: "hypothesis-testing", title: "Hypothesis Testing", blurb: "Null vs alternative, p-values, errors, and power — done without the dogma.", minutes: 16, status: "live", hasViz: true,
        objectives: ["Null/alternative and the logic of falsification", "What a p-value is (and the 5 things it isn't)", "Type I / Type II errors and statistical power", "Why significance ≠ importance"] },
      { slug: "common-statistical-tests", title: "Choosing a Statistical Test", blurb: "t-test, chi-square, ANOVA, non-parametrics — a decision tree.", minutes: 12, status: "live" },
      { slug: "bayesian-thinking", title: "Bayesian Thinking", blurb: "Priors, likelihoods, posteriors — updating beliefs with evidence.", minutes: 13, status: "live", hasViz: true },
      { slug: "ab-testing", title: "A/B Testing Foundations", blurb: "Designing an experiment that can actually answer your question.", minutes: 12, status: "live", hasViz: true },
    ],
  },
  {
    id: "wrangling",
    title: "Data Wrangling & SQL",
    short: "Wrangling",
    description:
      "The day-to-day craft: shaping, joining, and engineering data with pandas and SQL.",
    icon: "Database",
    tone: "cyan",
    concepts: [
      { slug: "pandas-essentials", title: "Pandas Essentials", blurb: "Select, filter, group, transform — the verbs of tabular data.", minutes: 14, status: "live" },
      { slug: "sql-for-analysis", title: "SQL for Analysis", blurb: "SELECT to window functions — the analyst's universal tool.", minutes: 15, status: "live" },
      { slug: "joins-and-aggregations", title: "Joins & Aggregations", blurb: "Inner/left/anti joins and group-bys without losing rows you needed.", minutes: 11, status: "live" },
      { slug: "reshaping-data", title: "Reshaping Data", blurb: "Long vs wide, pivot, melt — getting data into the shape a model wants.", minutes: 9, status: "live" },
      { slug: "feature-engineering", title: "Feature Engineering", blurb: "Encodings, interactions, binning, target leakage — where models are won.", minutes: 14, status: "live" },
      { slug: "working-with-dates-and-text", title: "Dates & Text Features", blurb: "Extracting signal from timestamps and raw strings.", minutes: 9, status: "live" },
    ],
  },
  {
    id: "dataviz",
    title: "Data Visualization",
    short: "Viz",
    description:
      "Turning numbers into understanding — and into decisions other people will trust.",
    icon: "BarChart3",
    tone: "pink",
    concepts: [
      { slug: "visualization-principles", title: "Visualization Principles", blurb: "Encoding, perception, and the data-ink that earns its place.", minutes: 10, status: "live" },
      { slug: "choosing-the-right-chart", title: "Choosing the Right Chart", blurb: "Match the chart to the question — comparison, distribution, relationship, trend.", minutes: 9, status: "live" },
      { slug: "storytelling-with-data", title: "Storytelling with Data", blurb: "Structure, annotation, and leading the eye to the insight.", minutes: 9, status: "live" },
    ],
  },
  {
    id: "ml",
    title: "Classical Machine Learning",
    short: "ML",
    description:
      "The workhorse algorithms — how they learn, when they break, and how to evaluate them honestly.",
    icon: "Brain",
    tone: "violet",
    concepts: [
      { slug: "ml-workflow", title: "The ML Workflow", blurb: "Split, train, validate, test — and why leakage ruins everything.", minutes: 11, status: "live" },
      { slug: "linear-regression", title: "Linear Regression", blurb: "Fit a line by minimizing squared error — the model everything builds on.", minutes: 15, status: "live", hasViz: true,
        objectives: ["The model, the loss, and the fit", "Least squares = minimizing vertical errors", "Reading coefficients and R²", "Assumptions and when they break"] },
      { slug: "logistic-regression", title: "Logistic Regression", blurb: "Linear models for classification via the sigmoid and log-loss.", minutes: 12, status: "live" },
      { slug: "regularization", title: "Regularization (L1/L2)", blurb: "Ridge, Lasso, elastic net — penalizing complexity to generalize.", minutes: 12, status: "live" },
      { slug: "decision-trees", title: "Decision Trees", blurb: "Greedy splits, impurity, and totally interpretable predictions.", minutes: 12, status: "live" },
      { slug: "ensemble-methods", title: "Ensembles: Bagging & Random Forests", blurb: "Why many weak models beat one strong one.", minutes: 12, status: "live" },
      { slug: "gradient-boosting", title: "Gradient Boosting", blurb: "XGBoost/LightGBM intuition — fit the residuals, again and again.", minutes: 13, status: "live" },
      { slug: "support-vector-machines", title: "Support Vector Machines", blurb: "Maximum-margin classifiers and the kernel trick.", minutes: 12, status: "live" },
      { slug: "k-nearest-neighbors", title: "k-Nearest Neighbors", blurb: "Predict by looking at who you're near — the laziest learner.", minutes: 8, status: "live" },
      { slug: "naive-bayes", title: "Naive Bayes", blurb: "Bayes' rule + a bold independence assumption that works shockingly well.", minutes: 9, status: "live" },
      { slug: "clustering-kmeans", title: "Clustering with k-Means", blurb: "Find structure with no labels: assign, update, repeat.", minutes: 13, status: "live", hasViz: true,
        objectives: ["The assign → recompute loop, animated", "How initialization changes the result", "Picking k with the elbow / silhouette", "When k-means fails (non-spherical clusters)"] },
      { slug: "dimensionality-reduction", title: "Dimensionality Reduction", blurb: "PCA, t-SNE, UMAP — compress features while keeping the signal.", minutes: 12, status: "live" },
      { slug: "bias-variance-tradeoff", title: "Bias-Variance Tradeoff", blurb: "The central tension of ML: underfit vs overfit, made visual.", minutes: 14, status: "live", hasViz: true,
        objectives: ["Decompose error into bias, variance, noise", "Watch a model under- then over-fit", "Why more flexibility isn't always better", "How regularization and data move the curve"] },
      { slug: "cross-validation", title: "Cross-Validation", blurb: "k-fold and friends — estimating real-world performance honestly.", minutes: 10, status: "live" },
      { slug: "classification-metrics", title: "Classification Metrics", blurb: "Accuracy lies. Precision, recall, ROC, and picking a threshold.", minutes: 15, status: "live", hasViz: true,
        objectives: ["Confusion matrix as the source of truth", "Precision vs recall and the trade-off", "Move the threshold, watch the metrics", "ROC/AUC and PR curves, and when to use each"] },
      { slug: "regression-metrics", title: "Regression Metrics", blurb: "MAE, RMSE, R², MAPE — what each rewards and punishes.", minutes: 8, status: "live" },
      { slug: "imbalanced-data", title: "Imbalanced Data", blurb: "Resampling, class weights, and metrics that survive 99% negatives.", minutes: 10, status: "live" },
      { slug: "hyperparameter-tuning", title: "Hyperparameter Tuning", blurb: "Grid, random, and Bayesian search without overfitting the validation set.", minutes: 10, status: "live" },
      { slug: "feature-selection", title: "Feature Selection", blurb: "Filter, wrapper, embedded — fewer, better features.", minutes: 9, status: "live" },
    ],
  },
  {
    id: "dl",
    title: "Deep Learning",
    short: "Deep Learning",
    description:
      "Neural networks from a single neuron to transformers — what they compute and how they learn.",
    icon: "Network",
    tone: "indigo",
    concepts: [
      { slug: "neural-networks", title: "Neural Networks", blurb: "Neurons, layers, and a forward pass you can watch fire.", minutes: 16, status: "live", hasViz: true,
        objectives: ["A neuron = weighted sum + nonlinearity", "How layers compose into a function", "Watch a forward pass propagate", "Why depth and width matter"] },
      { slug: "backpropagation", title: "Backpropagation", blurb: "The chain rule at scale — how a network assigns blame and learns.", minutes: 14, status: "live" },
      { slug: "activation-functions", title: "Activation Functions", blurb: "Sigmoid, tanh, ReLU, GELU — the nonlinearity that gives nets their power.", minutes: 10, status: "live", hasViz: true,
        objectives: ["Why linear-only networks are useless", "Compare shapes and gradients live", "Vanishing gradients and the ReLU fix", "Choosing an activation in practice"] },
      { slug: "optimizers", title: "Optimizers", blurb: "SGD, momentum, RMSProp, Adam — smarter ways downhill.", minutes: 11, status: "live" },
      { slug: "regularization-in-dl", title: "Regularization in Deep Nets", blurb: "Dropout, batch norm, early stopping, weight decay.", minutes: 11, status: "live" },
      { slug: "convolutional-networks", title: "Convolutional Networks", blurb: "Weight sharing and local filters — how machines see.", minutes: 13, status: "live" },
      { slug: "recurrent-networks", title: "Recurrent Networks", blurb: "Memory over sequences, and why long dependencies are hard.", minutes: 11, status: "live" },
      { slug: "transformers", title: "Transformers", blurb: "Self-attention and the architecture behind modern AI.", minutes: 16, status: "live" },
      { slug: "embeddings", title: "Embeddings", blurb: "Turning words, items, and users into geometry.", minutes: 10, status: "live" },
      { slug: "transfer-learning", title: "Transfer Learning", blurb: "Stand on a pretrained model's shoulders — fine-tune, don't restart.", minutes: 9, status: "live" },
    ],
  },
  {
    id: "nlp",
    title: "NLP & LLMs",
    short: "NLP / LLMs",
    description:
      "From bag-of-words to large language models, attention, and retrieval-augmented systems.",
    icon: "MessageSquare",
    tone: "cyan",
    concepts: [
      { slug: "text-preprocessing", title: "Text Preprocessing", blurb: "Tokenization, stemming, stop-words, and TF-IDF.", minutes: 10, status: "live" },
      { slug: "word-embeddings", title: "Word Embeddings", blurb: "Word2Vec, GloVe — meaning as direction in space.", minutes: 11, status: "live" },
      { slug: "attention-mechanism", title: "Attention", blurb: "Let the model decide what to focus on — the key idea behind transformers.", minutes: 13, status: "live" },
      { slug: "large-language-models", title: "Large Language Models", blurb: "Pretraining, scaling laws, and what next-token prediction buys you.", minutes: 14, status: "live" },
      { slug: "fine-tuning-llms", title: "Fine-Tuning LLMs", blurb: "Full vs LoRA vs instruction tuning — adapting a base model.", minutes: 12, status: "live" },
      { slug: "retrieval-augmented-generation", title: "Retrieval-Augmented Generation", blurb: "Ground an LLM in your data with embeddings + a vector store.", minutes: 13, status: "live" },
      { slug: "prompt-engineering", title: "Prompt Engineering", blurb: "Few-shot, chain-of-thought, and structured outputs that hold up.", minutes: 9, status: "live" },
    ],
  },
  {
    id: "timeseries",
    title: "Time Series",
    short: "Time Series",
    description:
      "Data with a clock attached — components, stationarity, and forecasting that respects time.",
    icon: "LineChart",
    tone: "pink",
    concepts: [
      { slug: "time-series-components", title: "Components of a Time Series", blurb: "Trend, seasonality, and noise — decomposing the signal.", minutes: 10, status: "live" },
      { slug: "stationarity", title: "Stationarity", blurb: "Why most models need it, how to test, and how to get there.", minutes: 10, status: "live" },
      { slug: "arima-models", title: "ARIMA & Friends", blurb: "Autoregression, differencing, moving averages — the classic toolkit.", minutes: 12, status: "live" },
      { slug: "forecasting-evaluation", title: "Evaluating Forecasts", blurb: "Backtesting, rolling windows, and never leaking the future.", minutes: 9, status: "live" },
    ],
  },
  {
    id: "causal",
    title: "Causal Inference",
    short: "Causal",
    description:
      "Moving beyond prediction to 'what happens if we intervene' — the senior-level question.",
    icon: "GitFork",
    tone: "violet",
    concepts: [
      { slug: "causal-inference", title: "Causal Inference", blurb: "Counterfactuals, DAGs, and the ladder of causation.", minutes: 13, status: "live" },
      { slug: "confounding-and-bias", title: "Confounding & Bias", blurb: "Colliders, selection bias, and why controlling for the wrong thing hurts.", minutes: 11, status: "live" },
      { slug: "ab-testing-in-practice", title: "A/B Testing in Practice", blurb: "Power, peeking, CUPED, and shipping decisions you can defend.", minutes: 12, status: "live", hasViz: true },
      { slug: "uplift-modeling", title: "Uplift Modeling", blurb: "Model the effect of a treatment, not just the outcome.", minutes: 10, status: "live" },
    ],
  },
  {
    id: "mlops",
    title: "MLOps & Production",
    short: "MLOps",
    description:
      "What separates a notebook from a system: deployment, monitoring, and scale that survives contact with reality.",
    icon: "Server",
    tone: "indigo",
    concepts: [
      { slug: "ml-system-design", title: "ML System Design", blurb: "Framing, requirements, and the architecture interview.", minutes: 14, status: "live" },
      { slug: "experiment-tracking", title: "Experiment Tracking", blurb: "Reproducibility, versioning data + models + code.", minutes: 9, status: "live" },
      { slug: "model-deployment", title: "Model Deployment", blurb: "Batch, real-time, and edge — getting a model to users.", minutes: 12, status: "live" },
      { slug: "model-serving", title: "Model Serving & APIs", blurb: "Latency, throughput, batching, and serving frameworks.", minutes: 11, status: "live" },
      { slug: "monitoring-and-drift", title: "Monitoring & Drift", blurb: "Data drift, concept drift, and knowing when to retrain.", minutes: 11, status: "live" },
      { slug: "ml-pipelines", title: "ML Pipelines", blurb: "Orchestration, DAGs, and reproducible training runs.", minutes: 10, status: "live" },
      { slug: "feature-stores", title: "Feature Stores", blurb: "Consistent features across training and serving.", minutes: 9, status: "live" },
      { slug: "scaling-ml", title: "Scaling ML", blurb: "Distributed training, sharding, and cost-aware inference.", minutes: 11, status: "live" },
      { slug: "ci-cd-for-ml", title: "CI/CD for ML", blurb: "Testing data and models, not just code.", minutes: 10, status: "live" },
      { slug: "model-governance", title: "Governance & Responsible AI", blurb: "Fairness, explainability, and audit trails.", minutes: 10, status: "live" },
    ],
  },
  {
    id: "career",
    title: "Career & Communication",
    short: "Career",
    description:
      "The skills that get the work adopted: framing problems and communicating results to humans.",
    icon: "Trophy",
    tone: "cyan",
    concepts: [
      { slug: "structuring-ds-problems", title: "Structuring DS Problems", blurb: "Turn a vague ask into a measurable, scoped project.", minutes: 9, status: "live" },
      { slug: "communicating-results", title: "Communicating Results", blurb: "Translate models into decisions stakeholders will act on.", minutes: 9, status: "live" },
      { slug: "ds-case-interviews", title: "DS Case Interviews", blurb: "A framework for product, metric, and modeling case questions.", minutes: 11, status: "live" },
    ],
  },
];

/* ----------------------------- helpers ----------------------------------- */

export const allConcepts: (Concept & { module: Module })[] = curriculum.flatMap(
  (m) => m.concepts.map((c) => ({ ...c, module: m })),
);

export function getConcept(slug: string) {
  return allConcepts.find((c) => c.slug === slug) ?? null;
}

export function getModuleOfConcept(slug: string) {
  return curriculum.find((m) => m.concepts.some((c) => c.slug === slug)) ?? null;
}

/** Previous / next concept in linear curriculum order. */
export function getAdjacent(slug: string) {
  const idx = allConcepts.findIndex((c) => c.slug === slug);
  return {
    prev: idx > 0 ? allConcepts[idx - 1] : null,
    next: idx >= 0 && idx < allConcepts.length - 1 ? allConcepts[idx + 1] : null,
  };
}

export const stats = {
  modules: curriculum.length,
  concepts: allConcepts.length,
  live: allConcepts.filter((c) => c.status === "live").length,
  interactive: allConcepts.filter((c) => c.hasViz).length,
};
