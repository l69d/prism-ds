"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { CodeBlock } from "@/components/content/code-block";
import { Quiz } from "@/components/content/quiz";
import { BetaPosteriorViz } from "@/components/viz/beta-posterior";
import { InterviewProblem } from "@/components/content/interview-problem";

export default function Lesson() {
  return (
    <>
      <p>Bayesian thinking treats probability as a measure of belief that you revise as evidence arrives. You start with what you thought before, weigh how surprising the data is, and end with an updated view.</p>

      <KeyIdea>A posterior belief is your prior belief reweighted by how well each hypothesis predicted the data you actually saw.</KeyIdea>

      <BetaPosteriorViz />

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
    <h2>Interview practice</h2>
<InterviewProblem question="Explain Bayes' theorem and the role of prior, likelihood, and posterior in plain language." difficulty="easy" tag="Conceptual">
  <p>Bayes&apos; theorem tells you how to update a belief once you see evidence. For a hypothesis <M>{"H"}</M> and data <M>{"D"}</M>:</p>
  <MB>{"P(H \\mid D) = \\frac{P(D \\mid H)\\, P(H)}{P(D)}"}</MB>
  <ul>
    <li><strong>Prior</strong> <M>{"P(H)"}</M>: what you believed about the hypothesis before seeing the data.</li>
    <li><strong>Likelihood</strong> <M>{"P(D \\mid H)"}</M>: how probable the observed data is if the hypothesis were true. Note it is a function of <M>{"H"}</M> for fixed <M>{"D"}</M>, and need not sum to one over <M>{"H"}</M>.</li>
    <li><strong>Posterior</strong> <M>{"P(H \\mid D)"}</M>: your updated belief after combining prior and evidence.</li>
    <li><strong>Evidence</strong> <M>{"P(D)=\\sum_H P(D\\mid H)P(H)"}</M>: a normalizing constant that makes the posterior a valid distribution.</li>
  </ul>
  <p>The intuition to state out loud: posterior is proportional to likelihood times prior. Strong evidence overwhelms a weak prior; with little data the prior dominates.</p>
</InterviewProblem>
<InterviewProblem question="A disease affects 1 in 1000 people. A test is 99% sensitive and 95% specific. A random person tests positive — what is the probability they have the disease?" difficulty="medium" tag="Math">
  <p>This is the classic base-rate question. Let <M>{"D"}</M> be having the disease and <M>{"+"}</M> a positive test. We want <M>{"P(D \\mid +)"}</M>.</p>
  <ul>
    <li>Prior: <M>{"P(D)=0.001"}</M>, so <M>{"P(\\neg D)=0.999"}</M>.</li>
    <li>Sensitivity: <M>{"P(+\\mid D)=0.99"}</M>.</li>
    <li>Specificity 95% means false positive rate <M>{"P(+\\mid \\neg D)=0.05"}</M>.</li>
  </ul>
  <p>Apply Bayes:</p>
  <MB>{"P(D\\mid +)=\\frac{0.99\\times 0.001}{0.99\\times 0.001 + 0.05\\times 0.999}"}</MB>
  <MB>{"=\\frac{0.00099}{0.00099 + 0.04995}=\\frac{0.00099}{0.05094}\\approx 0.0194"}</MB>
  <p>So only about <strong>1.9%</strong>. The takeaway interviewers want: even an accurate test gives a low posterior when the base rate is tiny, because the huge healthy population produces far more false positives than the rare sick population produces true positives. This is why screening high-risk subgroups (a higher prior) is far more informative.</p>
</InterviewProblem>
<InterviewProblem question="You run an A/B test on a conversion rate. How would a Bayesian approach differ from a frequentist p-value, and what would you actually report?" difficulty="medium" tag="Applied">
  <p>Model each variant&apos;s conversion rate <M>{"\\theta"}</M> with a Beta prior. Because Beta is conjugate to the Binomial, after observing <M>{"s"}</M> successes in <M>{"n"}</M> trials the posterior is closed form:</p>
  <MB>{"\\theta \\sim \\text{Beta}(\\alpha_0 + s,\; \\beta_0 + n - s)"}</MB>
  <p>Key differences to articulate:</p>
  <ul>
    <li>The frequentist p-value answers &quot;how surprising is this data if the variants were equal?&quot; The Bayesian posterior answers the question the business actually asks: &quot;what is the probability that B beats A?&quot; computed as <M>{"P(\\theta_B > \\theta_A)"}</M>.</li>
    <li>Bayesian inference gives a full posterior, so you can report a credible interval and the expected uplift, and quantify the loss of choosing wrong (expected loss / risk).</li>
    <li>Optional stopping is much less dangerous: you can peek at the posterior continuously, whereas repeated p-value testing inflates the false positive rate unless you correct for it.</li>
    <li>A weakly informative prior (for example <M>{"\\text{Beta}(1,1)"}</M>) regularizes tiny samples and avoids the wild estimates a raw ratio gives early on.</li>
  </ul>
  <p>I would report <M>{"P(\\theta_B>\\theta_A)"}</M>, the posterior mean uplift with a 95% credible interval, and the expected loss of shipping B, then ship when the win probability clears a pre-agreed threshold and expected loss is below a tolerance.</p>
</InterviewProblem>
<InterviewProblem question="Implement a Beta-Binomial update and estimate P(theta_B > theta_A) for an A/B test by Monte Carlo." difficulty="hard" tag="Coding">
  <p>With a conjugate Beta prior the posterior is just the prior plus the success and failure counts, so no MCMC is needed. We sample from each posterior and compare.</p>
  <CodeBlock language="python" filename="bayes_ab.py">{`import numpy as np

def posterior(prior_a, prior_b, successes, trials):
    """Beta-Binomial conjugate update -> posterior Beta params."""
    return prior_a + successes, prior_b + (trials - successes)

def prob_b_beats_a(a_succ, a_n, b_succ, b_n,
                   prior_a=1.0, prior_b=1.0, draws=200_000, seed=0):
    rng = np.random.default_rng(seed)
    aA, bA = posterior(prior_a, prior_b, a_succ, a_n)
    aB, bB = posterior(prior_a, prior_b, b_succ, b_n)
    samples_A = rng.beta(aA, bA, draws)
    samples_B = rng.beta(aB, bB, draws)
    p_b_wins = np.mean(samples_B > samples_A)
    uplift = samples_B - samples_A
    # expected loss of shipping B when it is actually worse
    expected_loss = np.mean(np.maximum(samples_A - samples_B, 0.0))
    return p_b_wins, uplift.mean(), np.percentile(uplift, [2.5, 97.5]), expected_loss

# A: 120/1000, B: 150/1000
p, mean_uplift, ci, loss = prob_b_beats_a(120, 1000, 150, 1000)
print(f"P(B>A)        = {p:.3f}")
print(f"mean uplift   = {mean_uplift:.4f}")
print(f"95% CI uplift = [{ci[0]:.4f}, {ci[1]:.4f}]")
print(f"expected loss = {loss:.5f}")`}</CodeBlock>
  <p>Talking points: the update is <M>{"O(1)"}</M> because of conjugacy; Monte Carlo error on the probability scales like <M>{"1/\\sqrt{\\text{draws}}"}</M>, so a few hundred thousand draws gives three reliable decimals. Ship B when <M>{"P(\\theta_B>\\theta_A)"}</M> exceeds your threshold and expected loss is under tolerance.</p>
</InterviewProblem>

      </>
  );
}
