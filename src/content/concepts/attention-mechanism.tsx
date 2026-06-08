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
    <h2>Interview practice</h2>

<InterviewProblem question="Explain scaled dot-product attention. Why divide by the square root of the key dimension?" difficulty="easy" tag="Conceptual">
  <p>Attention lets each query token build a weighted average over value vectors, where the weights come from how well the query matches each key. The full operation is:</p>
  <MB>{"\\operatorname{Attention}(Q,K,V) = \\operatorname{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{d_k}}\\right)V"}</MB>
  <p>The scaling by <M>{"\\sqrt{d_k}"}</M> controls the variance of the logits before the softmax. Assume each entry of <M>{"q"}</M> and <M>{"k"}</M> is independent with zero mean and unit variance. Then a raw dot product has variance proportional to the dimension:</p>
  <MB>{"\\operatorname{Var}\\!\\left(\\sum_{i=1}^{d_k} q_i k_i\\right) = d_k"}</MB>
  <p>For large <M>{"d_k"}</M> the logits become large in magnitude, which pushes the softmax into a near one-hot regime where gradients vanish (the function saturates). Dividing by <M>{"\\sqrt{d_k}"}</M> rescales the variance back to roughly <strong>1</strong>, keeping the softmax in a sensitive range and gradients healthy.</p>
</InterviewProblem>

<InterviewProblem question="Self-attention is permutation-equivariant. What problem does that cause for language, and how do transformers fix it?" difficulty="medium" tag="Conceptual">
  <p>If you shuffle the input tokens, plain self-attention produces the same set of outputs in shuffled order &mdash; it has no built-in notion of position. The attention weight between two tokens depends only on their content, not on where they sit. For language that is fatal: &quot;dog bites man&quot; and &quot;man bites dog&quot; would be indistinguishable to the attention layer.</p>
  <p>Transformers inject order through <strong>positional encodings</strong>. Common approaches:</p>
  <ul>
    <li><strong>Sinusoidal</strong> encodings added to the embeddings &mdash; fixed functions of position and frequency, so the model can attend by relative offset.</li>
    <li><strong>Learned absolute</strong> position embeddings &mdash; a trainable vector per position.</li>
    <li><strong>Rotary (RoPE)</strong> and other relative schemes &mdash; rotate query and key vectors by an angle proportional to position, so the dot product encodes relative distance directly. This generalizes better to longer contexts.</li>
  </ul>
  <p>Once position information is present, the layer is no longer permutation-equivariant and word order matters.</p>
</InterviewProblem>

<InterviewProblem question="Why is multi-head attention better than a single attention head of the same total width?" difficulty="medium" tag="Conceptual">
  <p>A single head computes one softmax-weighted average. Because softmax tends to concentrate mass, one head can effectively track only one relationship at a time. Multi-head attention splits the model dimension into <M>{"h"}</M> subspaces, runs attention independently in each, then concatenates and projects:</p>
  <MB>{"\\operatorname{MultiHead}(Q,K,V) = \\operatorname{Concat}(\\text{head}_1,\\dots,\\text{head}_h)\\,W^{O}"}</MB>
  <p>Benefits:</p>
  <ul>
    <li><strong>Multiple relations at once</strong> &mdash; one head can track syntactic agreement while another tracks coreference, because each head has its own <M>{"W^Q, W^K, W^V"}</M> projections.</li>
    <li><strong>Different representation subspaces</strong> &mdash; each head attends over a lower-dimensional <M>{"d_k = d_{model}/h"}</M> projection, capturing distinct features.</li>
    <li><strong>Roughly equal cost</strong> &mdash; total parameters and FLOPs are about the same as one wide head, so the expressiveness gain is nearly free.</li>
  </ul>
  <p>A common follow-up: it does <strong>not</strong> increase the theoretical receptive field (every head already sees all tokens); it increases the diversity of what those tokens are compared on.</p>
</InterviewProblem>

<InterviewProblem question="Your transformer is too slow on long documents. Explain the cost of self-attention and one technique to reduce it. Then implement masked self-attention from scratch." difficulty="hard" tag="Coding">
  <p>The bottleneck is the attention score matrix <M>{"QK^{\\top}"}</M>, which is <M>{"n \\times n"}</M> for sequence length <M>{"n"}</M>. Both time and memory are:</p>
  <MB>{"O(n^2 \\cdot d)"}</MB>
  <p>so doubling the context quadruples the cost. Mitigations include <strong>sparse / local attention</strong> (each token attends to a window or a few global tokens, giving <M>{"O(n \\cdot w \\cdot d)"}</M>), <strong>low-rank / kernel approximations</strong> (Linformer, Performer, linear attention, <M>{"O(n \\cdot d^2)"}</M>), and <strong>FlashAttention</strong>, which keeps the math exact but tiles the computation to avoid materializing the full <M>{"n \\times n"}</M> matrix in slow memory, cutting memory to <M>{"O(n)"}</M> and speeding up the IO-bound kernel.</p>
  <p>Here is a minimal causal (masked) self-attention forward pass, where each position may only attend to itself and earlier positions:</p>
  <CodeBlock language="python" filename="masked_attention.py">{`import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)   # stability
    e = np.exp(x)
    return e / e.sum(axis=axis, keepdims=True)

def masked_self_attention(X, Wq, Wk, Wv):
    # X: (n, d_model). Returns (n, d_v).
    Q = X @ Wq                      # (n, d_k)
    K = X @ Wk                      # (n, d_k)
    V = X @ Wv                      # (n, d_v)

    d_k = Q.shape[-1]
    scores = Q @ K.T / np.sqrt(d_k)  # (n, n)

    # Causal mask: forbid attending to future positions.
    n = scores.shape[0]
    future = np.triu(np.ones((n, n), dtype=bool), k=1)
    scores[future] = -np.inf         # softmax sends these to 0

    weights = softmax(scores, axis=-1)  # (n, n), rows sum to 1
    return weights @ V                  # (n, d_v)

# quick shape check
n, d_model, d_k = 4, 8, 5
rng = np.random.default_rng(0)
X  = rng.normal(size=(n, d_model))
Wq = rng.normal(size=(d_model, d_k))
Wk = rng.normal(size=(d_model, d_k))
Wv = rng.normal(size=(d_model, d_k))
out = masked_self_attention(X, Wq, Wk, Wv)
print(out.shape)   # (4, 5)`}</CodeBlock>
  <p>Key implementation details interviewers probe: subtract the row max before <M>{"\\exp"}</M> for numerical stability, set masked logits to <M>{"-\\infty"}</M> (not zero) so they vanish after softmax, and confirm each output row is a convex combination of the value rows (weights are non-negative and sum to one).</p>
</InterviewProblem>

      </>
  );
}
