"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { CodeBlock } from "@/components/content/code-block";
import { Quiz } from "@/components/content/quiz";
import { BayesGridViz } from "@/components/viz/bayes-grid";

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
    </>
  );
}
