"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { CodeBlock } from "@/components/content/code-block";
import { Quiz } from "@/components/content/quiz";
import { BayesGridViz } from "@/components/viz/bayes-grid";
import { InterviewProblem } from "@/components/content/interview-problem";

export default function Lesson() {
  return (
    <>
      <p>Probability is the grammar of uncertainty. It lets us reason carefully about events we cannot predict, update our beliefs when evidence arrives, and tell the difference between a coincidence and a real signal.</p>

      <KeyIdea>Conditional probability is just probability restricted to a smaller world. Once you observe that <M>{"B"}</M> happened, you throw away every outcome where it didn&apos;t and renormalize what remains.</KeyIdea>

      <BayesGridViz />

      <h2>The building blocks</h2>
      <p>An <strong>event</strong> is a set of outcomes, and its probability is a number in <M>{"[0, 1]"}</M>. From there, three ideas do almost all the work:</p>
      <ul>
        <li><strong>Conditional probability</strong>: the chance of <M>{"A"}</M> given that <M>{"B"}</M> is known to have occurred.</li>
        <li><strong>Independence</strong>: <M>{"A"}</M> and <M>{"B"}</M> are independent when knowing one tells you nothing about the other.</li>
        <li><strong>Bayes&apos; rule</strong>: the machine that flips a conditional probability around, turning <M>{"P(\\text{data} \\mid \\text{hypothesis})"}</M> into <M>{"P(\\text{hypothesis} \\mid \\text{data})"}</M>.</li>
      </ul>

      <Basic>
        <p>Imagine a deck of cards. The probability of drawing a king is <M>{"4/52"}</M>. Now someone peeks and tells you the card is a face card. Suddenly your world shrunk to just 12 cards, and the chance it&apos;s a king jumped to <M>{"4/12"}</M>. That update is conditional probability. Independence is the opposite situation: if a friend flips a coin in another room, learning the result changes nothing about your card draw.</p>
      </Basic>

      <Advanced>
        <p>Formally, for events with <M>{"P(B) > 0"}</M>:</p>
        <MB>{"P(A \\mid B) = \\frac{P(A \\cap B)}{P(B)}"}</MB>
        <p>Independence means <M>{"P(A \\cap B) = P(A)\\,P(B)"}</M>, which is equivalent to <M>{"P(A \\mid B) = P(A)"}</M>. Bayes&apos; rule follows by writing the joint two ways:</p>
        <MB>{"P(H \\mid D) = \\frac{P(D \\mid H)\\,P(H)}{P(D)}, \\quad P(D) = \\sum_i P(D \\mid H_i)\\,P(H_i)"}</MB>
        <p>The denominator is the law of total probability, which averages the likelihood over every hypothesis to give the marginal evidence.</p>
      </Advanced>

      <Callout kind="pitfall" title="The base-rate trap">
        A test that is 99% accurate for a disease affecting 1 in 10,000 people will still flag mostly healthy individuals. A positive result barely moves your belief because the prior is tiny. Always multiply the likelihood by the prior, never read the accuracy alone.
      </Callout>

      <CodeBlock language="python" filename="bayes.py">{`# Disease test: prior 0.0001, sensitivity 0.99, specificity 0.99
prior = 1e-4
sens, spec = 0.99, 0.99

p_pos = sens * prior + (1 - spec) * (1 - prior)   # total prob of a positive
posterior = sens * prior / p_pos                  # Bayes' rule

print(round(posterior, 4))   # 0.0098 -> still under 1% despite "99% accurate"`}</CodeBlock>

      <MoreDepth>
        <p>Pairwise independence does not imply mutual independence. You can construct three events where every pair is independent yet the triple satisfies <M>{"P(A \\cap B \\cap C) \\neq P(A)\\,P(B)\\,P(C)"}</M>. In ML this matters for the naive Bayes classifier, which assumes features are conditionally independent given the label. That assumption is usually false, yet the classifier often still ranks classes correctly because the decision boundary tolerates miscalibrated probabilities.</p>
      </MoreDepth>

      <Quiz question="A test is 90% sensitive and 90% specific for a condition with a 1% base rate. Roughly how likely is it that a person who tests positive actually has the condition?" options={[
        { text: "About 90%", why: "This confuses test accuracy with posterior probability; it ignores the tiny prior." },
        { text: "About 8%", correct: true, why: "Bayes gives 0.9*0.01 / (0.9*0.01 + 0.1*0.99) about 0.083, because the large healthy population produces many false positives." },
        { text: "About 50%", why: "There is no symmetry here; the low base rate pulls the posterior far below 50%." },
        { text: "About 1%", why: "That is the prior; a positive result does raise belief somewhat, just not to 90%." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="What does it mean for two events to be independent, and how is that different from being mutually exclusive?" difficulty="easy" tag="Conceptual">
  <p><strong>Independence</strong> means knowing that one event happened tells you nothing about the other: <M>{"P(A \\mid B) = P(A)"}</M>, equivalently <M>{"P(A \\cap B) = P(A)\\,P(B)"}</M>.</p>
  <p><strong>Mutual exclusivity</strong> means the events cannot both happen: <M>{"P(A \\cap B) = 0"}</M>.</p>
  <p>These are nearly opposite ideas. If <M>{"A"}</M> and <M>{"B"}</M> are mutually exclusive and both have positive probability, then learning <M>{"B"}</M> occurred forces <M>{"P(A \\mid B) = 0 \\neq P(A)"}</M>, so they are <strong>dependent</strong>. The only way events can be both independent and mutually exclusive is if at least one has probability zero. A common interview trap is to treat &quot;disjoint&quot; and &quot;independent&quot; as synonyms; they almost never coincide.</p>
</InterviewProblem>
<InterviewProblem question="A disease affects 1 in 1000 people. A test is 99% sensitive and 95% specific. A random person tests positive. What's the probability they actually have the disease?" difficulty="medium" tag="Math">
  <p>This is base-rate reasoning via Bayes&apos; rule. Let <M>{"D"}</M> be having the disease and <M>{"+"}</M> a positive test.</p>
  <ul>
    <li>Prior: <M>{"P(D) = 0.001"}</M></li>
    <li>Sensitivity: <M>{"P(+ \\mid D) = 0.99"}</M></li>
    <li>Specificity: <M>{"P(- \\mid \\neg D) = 0.95"}</M>, so the false-positive rate is <M>{"P(+ \\mid \\neg D) = 0.05"}</M></li>
  </ul>
  <p>By the law of total probability the unconditional positive rate is:</p>
  <MB>{"P(+) = (0.99)(0.001) + (0.05)(0.999) = 0.00099 + 0.04995 = 0.05094"}</MB>
  <p>Then Bayes&apos; rule gives the posterior:</p>
  <MB>{"P(D \\mid +) = \\frac{P(+ \\mid D)\\,P(D)}{P(+)} = \\frac{0.00099}{0.05094} \\approx 0.0194"}</MB>
  <p>So only about <strong>1.9%</strong> of positives are true cases. The takeaway interviewers want: when the base rate is tiny, even a very accurate test produces mostly false positives, because the huge healthy population generates far more false positives than the small sick population generates true positives.</p>
</InterviewProblem>
<InterviewProblem question="Pairwise independence does not imply mutual independence. Construct a counterexample." difficulty="hard" tag="Math">
  <p>Take two independent fair coin flips <M>{"X_1, X_2 \\in \\{0,1\\}"}</M> and define a third variable as their XOR: <M>{"X_3 = X_1 \\oplus X_2"}</M>. Consider the three events <M>{"A_i = \\{X_i = 1\\}"}</M>, each with probability <M>{"1/2"}</M>.</p>
  <p><strong>Pairwise:</strong> any two of these are independent. For example <M>{"P(A_1 \\cap A_3) = P(X_1 = 1, X_2 = 0) = 1/4 = P(A_1)P(A_3)"}</M>, and similarly for the other pairs by symmetry.</p>
  <p><strong>Jointly:</strong> they are <em>not</em> independent. Knowing any two values fixes the third, since <M>{"X_3 = X_1 \\oplus X_2"}</M>. Concretely:</p>
  <MB>{"P(A_1 \\cap A_2 \\cap A_3) = P(X_1 = 1, X_2 = 1, X_1 \\oplus X_2 = 1) = 0"}</MB>
  <p>but mutual independence would require <M>{"P(A_1)P(A_2)P(A_3) = 1/8 \\neq 0"}</M>. So pairwise independence holds while mutual independence fails. This is why &quot;all features are pairwise uncorrelated&quot; is a much weaker condition than joint independence.</p>
</InterviewProblem>
<InterviewProblem question="Estimate P(disease | positive) by Monte Carlo simulation instead of solving Bayes' rule analytically." difficulty="medium" tag="Coding">
  <p>Simulation is a quick sanity check on a Bayes derivation, and the pattern generalizes to models too complex to solve by hand. Sample a population, generate test outcomes from the conditional rates, then condition by filtering.</p>
  <CodeBlock language="python" filename="bayes_sim.py">{`import numpy as np
rng = np.random.default_rng(0)

N = 10_000_000
prevalence, sensitivity, specificity = 0.001, 0.99, 0.95

has_disease = rng.random(N) < prevalence

# P(+|D) = sensitivity ; P(+|~D) = 1 - specificity
p_positive = np.where(has_disease, sensitivity, 1 - specificity)
tested_positive = rng.random(N) < p_positive

# Condition on the positive subset, then take the disease rate
posterior = has_disease[tested_positive].mean()
print(round(posterior, 4))   # ~0.0194, matching Bayes' rule
`}</CodeBlock>
  <p>The key move is <strong>conditioning by filtering</strong>: <M>{"P(D \\mid +)"}</M> is just the disease frequency <em>within the subgroup that tested positive</em>. The simulated answer converges to the analytic <M>{"\\approx 0.019"}</M>, and the gap shrinks like <M>{"1/\\sqrt{N}"}</M> as you raise the sample size.</p>
</InterviewProblem>

      </>
  );
}
