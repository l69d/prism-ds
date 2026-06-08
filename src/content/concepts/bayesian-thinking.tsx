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
      <p>Bayesian thinking treats probability as a measure of belief that you revise as evidence arrives. You start with what you thought before, weigh how surprising the data is, and end with an updated view.</p>

      <KeyIdea>A posterior belief is your prior belief reweighted by how well each hypothesis predicted the data you actually saw.</KeyIdea>

      <h2>The three ingredients</h2>
      <p>Every Bayesian update combines three quantities:</p>
      <ul>
        <li><strong>Prior</strong> <M>{"P(H)"}</M> — what you believed about a hypothesis before seeing the data.</li>
        <li><strong>Likelihood</strong> <M>{"P(D \\mid H)"}</M> — how probable the observed data is, assuming the hypothesis is true.</li>
        <li><strong>Posterior</strong> <M>{"P(H \\mid D)"}</M> — your revised belief after folding in the evidence.</li>
      </ul>

      <Basic>
        <p>Imagine a rare disease affecting 1 in 1000 people, and a test that is 99&#37; accurate. You test positive. It feels like you almost certainly have it &mdash; but most positives come from the huge healthy crowd, not the tiny sick group. The base rate (the prior) dominates, so your true chance is closer to 9&#37; than 99&#37;. Bayesian thinking forces you to ask not just &quot;how accurate is the test?&quot; but &quot;how rare was the thing to begin with?&quot;</p>
      </Basic>

      <Advanced>
        <p>Bayes&apos; theorem rearranges the definition of conditional probability:</p>
        <MB>{"P(H \\mid D) = \\frac{P(D \\mid H)\\, P(H)}{P(D)}, \\qquad P(D) = \\sum_i P(D \\mid H_i)\\, P(H_i)"}</MB>
        <p>The denominator <M>{"P(D)"}</M> is the marginal likelihood (the evidence) and simply normalizes the posterior to sum to one. Because it does not depend on <M>{"H"}</M>, we often write the proportional form, which is enough to compare or sample hypotheses:</p>
        <MB>{"P(H \\mid D) \\propto P(D \\mid H)\\, P(H)"}</MB>
      </Advanced>

      <Callout kind="pitfall" title="Ignoring the base rate">
        The most common Bayesian error is anchoring on the likelihood (test accuracy) while forgetting the prior (how common the hypothesis is). A strong test on a rare event still yields mostly false positives.
      </Callout>

      <h2>Updating in code</h2>
      <CodeBlock language="python" filename="disease_test.py">{`# Posterior probability of disease given a positive test
prior = 0.001          # P(disease)
sensitivity = 0.99     # P(positive | disease)
false_positive = 0.01  # P(positive | healthy)

p_pos = sensitivity * prior + false_positive * (1 - prior)
posterior = sensitivity * prior / p_pos
print(f"P(disease | positive) = {posterior:.3f}")  # ~0.090

# A second independent positive test: yesterday's posterior is today's prior
prior = posterior
p_pos = sensitivity * prior + false_positive * (1 - prior)
posterior = sensitivity * prior / p_pos
print(f"after second test = {posterior:.3f}")  # ~0.908`}</CodeBlock>

      <MoreDepth>
        <p>With <strong>conjugate priors</strong> the update has a closed form: a Beta prior on a coin&apos;s bias paired with Binomial data yields a Beta posterior, so you just add successes and failures to the prior&apos;s pseudo-counts. When no conjugate shortcut exists, you approximate the posterior with MCMC (e.g. Hamiltonian Monte Carlo) or variational inference. A subtle trap: an overconfident prior with near-zero mass on the truth can take an enormous amount of data to overcome &mdash; calibrate priors deliberately.</p>
      </MoreDepth>

      <Quiz question="A test is 99% accurate for a disease that affects 1 in 1000 people. You test positive. Why is your actual probability of having the disease far below 99%?" options={[
        { text: "The test result is unreliable and should be ignored", why: "The test is informative; it raised your odds ~90x. It just starts from a tiny base rate." },
        { text: "The low prior (base rate) means most positives come from the large healthy group", correct: true, why: "With so few truly sick people, the small false-positive rate applied to the huge healthy group produces most of the positives." },
        { text: "99% accuracy already accounts for the prior", why: "Accuracy is the likelihood term; it says nothing about how common the disease is." },
        { text: "Bayes' theorem does not apply to medical tests", why: "Bayes' theorem applies directly; combining the prior and likelihood is exactly how you get the posterior." },
      ]} />
    </>
  );
}
