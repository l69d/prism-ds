import type { ComponentType } from "react";

import C_ab_testing from "./concepts/ab-testing";
import C_ab_testing_in_practice from "./concepts/ab-testing-in-practice";
import C_activation_functions from "./concepts/activation-functions";
import C_arima_models from "./concepts/arima-models";
import C_attention_mechanism from "./concepts/attention-mechanism";
import C_backpropagation from "./concepts/backpropagation";
import C_bayesian_thinking from "./concepts/bayesian-thinking";
import C_bias_variance_tradeoff from "./concepts/bias-variance";
import C_calculus_for_ml from "./concepts/calculus-for-ml";
import C_causal_inference from "./concepts/causal-inference";
import C_central_limit_theorem from "./concepts/clt";
import C_choosing_the_right_chart from "./concepts/choosing-the-right-chart";
import C_ci_cd_for_ml from "./concepts/ci-cd-for-ml";
import C_classification_metrics from "./concepts/classification-metrics";
import C_clustering_kmeans from "./concepts/clustering-kmeans";
import C_common_statistical_tests from "./concepts/common-statistical-tests";
import C_communicating_results from "./concepts/communicating-results";
import C_confidence_intervals from "./concepts/confidence-intervals";
import C_confounding_and_bias from "./concepts/confounding-and-bias";
import C_convex_optimization from "./concepts/convex-optimization";
import C_convolutional_networks from "./concepts/convolutional-networks";
import C_correlation_vs_causation from "./concepts/correlation-vs-causation";
import C_cross_validation from "./concepts/cross-validation";
import C_data_cleaning from "./concepts/data-cleaning";
import C_data_types_and_structures from "./concepts/data-types-and-structures";
import C_decision_trees from "./concepts/decision-trees";
import C_descriptive_statistics from "./concepts/descriptive-statistics";
import C_dimensionality_reduction from "./concepts/dimensionality-reduction";
import C_ds_case_interviews from "./concepts/ds-case-interviews";
import C_embeddings from "./concepts/embeddings";
import C_ensemble_methods from "./concepts/ensemble-methods";
import C_estimation_and_sampling from "./concepts/estimation-and-sampling";
import C_experiment_tracking from "./concepts/experiment-tracking";
import C_exploratory_data_analysis from "./concepts/eda";
import C_feature_engineering from "./concepts/feature-engineering";
import C_feature_scaling from "./concepts/feature-scaling";
import C_feature_selection from "./concepts/feature-selection";
import C_feature_stores from "./concepts/feature-stores";
import C_fine_tuning_llms from "./concepts/fine-tuning-llms";
import C_forecasting_evaluation from "./concepts/forecasting-evaluation";
import C_gradient_boosting from "./concepts/gradient-boosting";
import C_gradient_descent from "./concepts/gradient-descent";
import C_hyperparameter_tuning from "./concepts/hyperparameter-tuning";
import C_hypothesis_testing from "./concepts/hypothesis-testing";
import C_imbalanced_data from "./concepts/imbalanced-data";
import C_joins_and_aggregations from "./concepts/joins-and-aggregations";
import C_k_nearest_neighbors from "./concepts/k-nearest-neighbors";
import C_large_language_models from "./concepts/large-language-models";
import C_linear_algebra_essentials from "./concepts/linear-algebra-essentials";
import C_linear_regression from "./concepts/linear-regression";
import C_logistic_regression from "./concepts/logistic-regression";
import C_matrix_decompositions from "./concepts/matrix-decompositions";
import C_missing_data from "./concepts/missing-data";
import C_ml_pipelines from "./concepts/ml-pipelines";
import C_ml_system_design from "./concepts/ml-system-design";
import C_ml_workflow from "./concepts/ml-workflow";
import C_model_deployment from "./concepts/model-deployment";
import C_model_governance from "./concepts/model-governance";
import C_model_serving from "./concepts/model-serving";
import C_monitoring_and_drift from "./concepts/monitoring-and-drift";
import C_naive_bayes from "./concepts/naive-bayes";
import C_neural_networks from "./concepts/neural-networks";
import C_optimizers from "./concepts/optimizers";
import C_outliers_and_anomalies from "./concepts/outliers-and-anomalies";
import C_pandas_essentials from "./concepts/pandas-essentials";
import C_probability_basics from "./concepts/probability-basics";
import C_probability_distributions from "./concepts/distributions";
import C_prompt_engineering from "./concepts/prompt-engineering";
import C_random_variables from "./concepts/random-variables";
import C_recurrent_networks from "./concepts/recurrent-networks";
import C_regression_metrics from "./concepts/regression-metrics";
import C_regularization from "./concepts/regularization";
import C_regularization_in_dl from "./concepts/regularization-in-dl";
import C_reshaping_data from "./concepts/reshaping-data";
import C_retrieval_augmented_generation from "./concepts/retrieval-augmented-generation";
import C_scaling_ml from "./concepts/scaling-ml";
import C_sql_for_analysis from "./concepts/sql-for-analysis";
import C_stationarity from "./concepts/stationarity";
import C_storytelling_with_data from "./concepts/storytelling-with-data";
import C_structuring_ds_problems from "./concepts/structuring-ds-problems";
import C_support_vector_machines from "./concepts/support-vector-machines";
import C_text_preprocessing from "./concepts/text-preprocessing";
import C_time_series_components from "./concepts/time-series-components";
import C_transfer_learning from "./concepts/transfer-learning";
import C_transformers from "./concepts/transformers";
import C_uplift_modeling from "./concepts/uplift-modeling";
import C_visualization_principles from "./concepts/visualization-principles";
import C_what_is_data_science from "./concepts/what-is-data-science";
import C_word_embeddings from "./concepts/word-embeddings";
import C_working_with_dates_and_text from "./concepts/working-with-dates-and-text";

/** Slug -> live lesson component. Auto-generated from src/content/concepts/. */
export const registry: Record<string, ComponentType> = {
  "ab-testing": C_ab_testing,
  "ab-testing-in-practice": C_ab_testing_in_practice,
  "activation-functions": C_activation_functions,
  "arima-models": C_arima_models,
  "attention-mechanism": C_attention_mechanism,
  "backpropagation": C_backpropagation,
  "bayesian-thinking": C_bayesian_thinking,
  "bias-variance-tradeoff": C_bias_variance_tradeoff,
  "calculus-for-ml": C_calculus_for_ml,
  "causal-inference": C_causal_inference,
  "central-limit-theorem": C_central_limit_theorem,
  "choosing-the-right-chart": C_choosing_the_right_chart,
  "ci-cd-for-ml": C_ci_cd_for_ml,
  "classification-metrics": C_classification_metrics,
  "clustering-kmeans": C_clustering_kmeans,
  "common-statistical-tests": C_common_statistical_tests,
  "communicating-results": C_communicating_results,
  "confidence-intervals": C_confidence_intervals,
  "confounding-and-bias": C_confounding_and_bias,
  "convex-optimization": C_convex_optimization,
  "convolutional-networks": C_convolutional_networks,
  "correlation-vs-causation": C_correlation_vs_causation,
  "cross-validation": C_cross_validation,
  "data-cleaning": C_data_cleaning,
  "data-types-and-structures": C_data_types_and_structures,
  "decision-trees": C_decision_trees,
  "descriptive-statistics": C_descriptive_statistics,
  "dimensionality-reduction": C_dimensionality_reduction,
  "ds-case-interviews": C_ds_case_interviews,
  "embeddings": C_embeddings,
  "ensemble-methods": C_ensemble_methods,
  "estimation-and-sampling": C_estimation_and_sampling,
  "experiment-tracking": C_experiment_tracking,
  "exploratory-data-analysis": C_exploratory_data_analysis,
  "feature-engineering": C_feature_engineering,
  "feature-scaling": C_feature_scaling,
  "feature-selection": C_feature_selection,
  "feature-stores": C_feature_stores,
  "fine-tuning-llms": C_fine_tuning_llms,
  "forecasting-evaluation": C_forecasting_evaluation,
  "gradient-boosting": C_gradient_boosting,
  "gradient-descent": C_gradient_descent,
  "hyperparameter-tuning": C_hyperparameter_tuning,
  "hypothesis-testing": C_hypothesis_testing,
  "imbalanced-data": C_imbalanced_data,
  "joins-and-aggregations": C_joins_and_aggregations,
  "k-nearest-neighbors": C_k_nearest_neighbors,
  "large-language-models": C_large_language_models,
  "linear-algebra-essentials": C_linear_algebra_essentials,
  "linear-regression": C_linear_regression,
  "logistic-regression": C_logistic_regression,
  "matrix-decompositions": C_matrix_decompositions,
  "missing-data": C_missing_data,
  "ml-pipelines": C_ml_pipelines,
  "ml-system-design": C_ml_system_design,
  "ml-workflow": C_ml_workflow,
  "model-deployment": C_model_deployment,
  "model-governance": C_model_governance,
  "model-serving": C_model_serving,
  "monitoring-and-drift": C_monitoring_and_drift,
  "naive-bayes": C_naive_bayes,
  "neural-networks": C_neural_networks,
  "optimizers": C_optimizers,
  "outliers-and-anomalies": C_outliers_and_anomalies,
  "pandas-essentials": C_pandas_essentials,
  "probability-basics": C_probability_basics,
  "probability-distributions": C_probability_distributions,
  "prompt-engineering": C_prompt_engineering,
  "random-variables": C_random_variables,
  "recurrent-networks": C_recurrent_networks,
  "regression-metrics": C_regression_metrics,
  "regularization": C_regularization,
  "regularization-in-dl": C_regularization_in_dl,
  "reshaping-data": C_reshaping_data,
  "retrieval-augmented-generation": C_retrieval_augmented_generation,
  "scaling-ml": C_scaling_ml,
  "sql-for-analysis": C_sql_for_analysis,
  "stationarity": C_stationarity,
  "storytelling-with-data": C_storytelling_with_data,
  "structuring-ds-problems": C_structuring_ds_problems,
  "support-vector-machines": C_support_vector_machines,
  "text-preprocessing": C_text_preprocessing,
  "time-series-components": C_time_series_components,
  "transfer-learning": C_transfer_learning,
  "transformers": C_transformers,
  "uplift-modeling": C_uplift_modeling,
  "visualization-principles": C_visualization_principles,
  "what-is-data-science": C_what_is_data_science,
  "word-embeddings": C_word_embeddings,
  "working-with-dates-and-text": C_working_with_dates_and_text,
};
