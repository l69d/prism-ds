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
        When you read the sentence &quot;the animal didn&apos;t cross the street because it was
        too tired,&quot; you instantly know &quot;it&quot; means the animal, not the street. Attention is
        the mechanism that lets a model do the same: for every word, decide which other words matter.
      </p>

      <KeyIdea>
        Attention computes a weighted average of values, where the weights say how relevant each
        token is to the one currently being processed. The model <strong>learns what to focus on</strong>
        instead of being forced to compress everything into a single fixed vector.
      </KeyIdea>

      <h2>Queries, keys, and values</h2>
      <p>
        Every token is projected into three vectors. Think of a library lookup:
      </p>
      <ul>
        <li><strong>Query</strong> — what the current token is looking for.</li>
        <li><strong>Key</strong> — a label advertising what each token offers.</li>
        <li><strong>Value</strong> — the actual content each token contributes.</li>
      </ul>
      <p>
        A token compares its query against every key to get relevance scores, turns those scores
        into probabilities, and then blends the values accordingly. High match means a big slice of
        that token&apos;s value flows in.
      </p>

      <Basic>
        <p>
          Imagine summarizing a meeting. For each sentence you write, you skim the whole transcript
          and pull harder from the parts that are on-topic and lightly from the rest. Attention does
          exactly this per token: it builds each token&apos;s new representation by mixing in information
          from all other tokens, weighted by how related they are. Nothing forces a fixed window or
          left-to-right chain, so a word can grab context from anywhere in the sequence in one step.
        </p>
      </Basic>

      <Advanced>
        <p>
          Scaled dot-product attention over queries <M>{"Q"}</M>, keys <M>{"K"}</M>, and values
          <M>{" V"}</M> (rows are tokens, dimension <M>{"d_k"}</M>) is:
        </p>
        <MB>{"\\text{Attention}(Q,K,V) = \\text{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{d_k}}\\right) V"}</MB>
        <p>
          The <M>{"QK^{\\top}"}</M> matrix holds every pairwise score; the softmax normalizes each
          row to a probability distribution over tokens. The <M>{"\\sqrt{d_k}"}</M> divisor keeps
          dot products from growing with dimension, which would otherwise push softmax into saturated,
          near-zero-gradient regions. Multi-head attention runs <M>{"h"}</M> of these in parallel
          on learned sub-projections and concatenates them, letting different heads specialize
          (syntax, coreference, position) before a final linear mix.
        </p>
      </Advanced>

      <Callout kind="insight" title="Why transformers replaced RNNs">
        Attention has a constant path length between any two tokens, so gradients flow directly
        instead of decaying through dozens of recurrent steps. It is also fully parallel across the
        sequence, which is what made training on web-scale corpora practical.
      </Callout>

      <CodeBlock language="python" filename="attention.py">{`import numpy as np

def softmax(x):
    x = x - x.max(axis=-1, keepdims=True)
    e = np.exp(x)
    return e / e.sum(axis=-1, keepdims=True)

def attention(Q, K, V):
    d_k = Q.shape[-1]
    scores = Q @ K.T / np.sqrt(d_k)   # pairwise relevance
    weights = softmax(scores)         # rows sum to 1
    return weights @ V                # weighted blend of values

# 3 tokens, 4-dim embeddings
Q = K = V = np.random.randn(3, 4)
print(attention(Q, K, V).shape)       # (3, 4)`}</CodeBlock>

      <MoreDepth>
        <p>
          The exact softmax attention above costs <M>{"O(n^2)"}</M> in both time and memory because
          of the full score matrix, which is the real bottleneck for long contexts. FlashAttention
          keeps the math identical but tiles the computation to avoid materializing the
          <M>{" n \\times n"}</M> matrix, trading recomputation for memory bandwidth. Separately,
          causal (decoder) attention masks future positions by setting their scores to
          <M>{" -\\infty"}</M> before the softmax, so a token can never peek ahead during generation.
        </p>
      </MoreDepth>

      <Quiz
        question="What is the role of the softmax in scaled dot-product attention?"
        options={[
          { text: "It turns the pairwise relevance scores into nonnegative weights that sum to 1, so the output is a convex blend of the value vectors.", correct: true, why: "Softmax normalizes each row of QKᵀ into a probability distribution used to mix the values." },
          { text: "It projects each token into separate query, key, and value vectors.", why: "Those projections are separate learned linear layers applied before any scores are computed." },
          { text: "It prevents the model from attending to future tokens during generation.", why: "That is the job of the causal mask, applied before the softmax, not the softmax itself." },
          { text: "It divides the dot products by the square root of the key dimension.", why: "The √dₖ scaling is a fixed division applied to the scores, independent of the softmax." },
        ]}
      />
    </>
  );
}
