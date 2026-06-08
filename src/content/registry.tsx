import type { ComponentType } from "react";

import EdaContent from "./concepts/eda";
import DistributionsContent from "./concepts/distributions";
import CltContent from "./concepts/clt";
import HypothesisTestingContent from "./concepts/hypothesis-testing";
import LinearRegressionContent from "./concepts/linear-regression";
import GradientDescentContent from "./concepts/gradient-descent";
import BiasVarianceContent from "./concepts/bias-variance";
import KMeansContent from "./concepts/clustering-kmeans";
import ClassificationMetricsContent from "./concepts/classification-metrics";
import NeuralNetworksContent from "./concepts/neural-networks";
import ActivationFunctionsContent from "./concepts/activation-functions";

/** Slug -> live lesson component. Concepts not here render the ComingSoon preview. */
export const registry: Record<string, ComponentType> = {
  "exploratory-data-analysis": EdaContent,
  "probability-distributions": DistributionsContent,
  "central-limit-theorem": CltContent,
  "hypothesis-testing": HypothesisTestingContent,
  "linear-regression": LinearRegressionContent,
  "gradient-descent": GradientDescentContent,
  "bias-variance-tradeoff": BiasVarianceContent,
  "clustering-kmeans": KMeansContent,
  "classification-metrics": ClassificationMetricsContent,
  "neural-networks": NeuralNetworksContent,
  "activation-functions": ActivationFunctionsContent,
};
