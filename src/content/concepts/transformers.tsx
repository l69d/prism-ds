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
      <p>Transformers are the architecture behind nearly every modern large model &mdash; from chatbots to protein folders. Their core trick is <strong>self-attention</strong>: letting every element of a sequence look at every other element and decide what is relevant.</p>

      <KeyIdea>Instead of reading a sequence left-to-right, a transformer lets each token directly query all other tokens and blend their information by learned relevance. Context is gathered in one parallel step, not passed along a chain.</KeyIdea>

      <h2>Why attention?</h2>
      <p>Older recurrent models processed words one at a time, squeezing all past context into a single hidden state. Long-range dependencies decayed and training could not be parallelized. Attention fixes both: any token can reach any other in a single step, and the whole sequence is processed at once.</p>
      <ul>
        <li><strong>Query, Key, Value:</strong> each token emits a query (what am I looking for), a key (what I offer), and a value (the content to share).</li>
        <li><strong>Relevance scores:</strong> a query is compared against every key to produce weights.</li>
        <li><strong>Weighted blend:</strong> each token&apos;s output is a weighted sum of all values.</li>
      </ul>

      <Basic>
        <p>Imagine reading the sentence &quot;The animal didn&apos;t cross the street because <em>it</em> was tired.&quot; To resolve <em>it</em>, you glance back at &quot;animal&quot;, not &quot;street&quot;. Attention does exactly this: for every word, the model asks &quot;which other words matter to me right now?&quot; and pulls in their meaning, weighted by how relevant they are. Stack many of these lookups and the model builds rich, context-aware representations.</p>
      </Basic>

      <Advanced>
        <p>Scaled dot-product attention packs queries, keys, and values into matrices <M>{"Q, K, V"}</M> and computes:</p>
        <MB>{"\\text{Attention}(Q,K,V) = \\text{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{d_k}}\\right)V"}</MB>
        <p>The scaling by <M>{"\\sqrt{d_k}"}</M> keeps the dot products from growing large and pushing the softmax into saturated regions where gradients vanish. <strong>Multi-head attention</strong> runs <M>{"h"}</M> such projections in parallel so different heads capture different relationships, then concatenates them. Since attention is order-agnostic, <strong>positional encodings</strong> are added to inputs so the model knows token order.</p>
      </Advanced>

      <Callout kind="pitfall" title="Attention is quadratic">
        Self-attention compares every token with every other token, so cost grows as <M>{"O(n^2)"}</M> in sequence length. Doubling the context roughly quadruples compute and memory &mdash; the main reason long-context models need specialized tricks like sparse or linear attention.
      </Callout>

      <CodeBlock language="python" filename="attention.py">{`import torch
import torch.nn.functional as F

def attention(q, k, v):
    # q, k, v: (batch, seq_len, d_k)
    d_k = q.size(-1)
    scores = q @ k.transpose(-2, -1) / d_k ** 0.5  # (batch, seq, seq)
    weights = F.softmax(scores, dim=-1)            # relevance per token
    return weights @ v                             # weighted blend of values

x = torch.randn(1, 5, 16)   # one sequence of 5 tokens, dim 16
out = attention(x, x, x)    # self-attention: q = k = v = x
print(out.shape)            # torch.Size([1, 5, 16])`}</CodeBlock>

      <MoreDepth>
        <p>The original transformer was an encoder-decoder for translation, but most modern LLMs are <strong>decoder-only</strong> with <em>causal</em> masking: a token may attend only to earlier positions, enforced by setting future scores to <M>{"-\\infty"}</M> before the softmax. This single change turns attention into an autoregressive next-token predictor &mdash; the entire basis of GPT-style generation, all from the same building block.</p>
      </MoreDepth>

      <Quiz question="Why is the dot product inside attention divided by the square root of the key dimension?" options={[
        { text: "To normalize the values into probabilities", why: "The softmax handles normalization; the scaling acts before it on the raw scores." },
        { text: "To keep dot-product magnitudes from saturating the softmax and killing gradients", correct: true, why: "Large d_k inflates dot products, pushing softmax into flat regions with tiny gradients; scaling counteracts this." },
        { text: "To reduce the quadratic memory cost of attention", why: "Scaling does not change the O(n^2) cost; it only rescales the scores." },
        { text: "To encode positional information into the sequence", why: "Position is supplied separately via positional encodings, not by this scaling." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="Why is scaled dot-product attention scaled by 1/sqrt(d_k)? What breaks without it?" difficulty="easy" tag="Conceptual">
  <p>Attention computes <M>{"\\text{softmax}\\!\\left(\\frac{QK^\\top}{\\sqrt{d_k}}\\right)V"}</M>. The scaling controls the magnitude of the logits before the softmax.</p>
  <p>Assume each component of <M>{"q"}</M> and <M>{"k"}</M> is independent with mean 0 and variance 1. Their dot product is <M>{"q\\cdot k = \\sum_{i=1}^{d_k} q_i k_i"}</M>, which has mean 0 and variance <M>{"d_k"}</M> (a sum of <M>{"d_k"}</M> independent terms each of variance 1). So the standard deviation grows like <M>{"\\sqrt{d_k}"}</M>.</p>
  <p>Without scaling, for large <M>{"d_k"}</M> the logits become large in magnitude, pushing softmax into a near-one-hot regime. There the gradient is tiny (saturated softmax), so learning stalls. Dividing by <M>{"\\sqrt{d_k}"}</M> normalizes the variance of the logits back to roughly 1, keeping the softmax in a well-conditioned range with healthy gradients.</p>
</InterviewProblem>
<InterviewProblem question="What is the time and memory complexity of self-attention in sequence length n, and how do you scale to long sequences?" difficulty="medium" tag="Conceptual">
  <p>For a sequence of length <M>{"n"}</M> with model dimension <M>{"d"}</M>, forming the attention matrix <M>{"QK^\\top"}</M> produces an <M>{"n\\times n"}</M> score matrix. Both the compute and the materialized memory are <M>{"O(n^2 d)"}</M> and <M>{"O(n^2)"}</M> respectively. This quadratic term dominates for long contexts.</p>
  <p>Approaches to scale:</p>
  <ul>
    <li><strong>FlashAttention:</strong> exact attention computed in tiles so the <M>{"n\\times n"}</M> matrix is never fully written to HBM. Compute stays <M>{"O(n^2)"}</M> but memory drops to <M>{"O(n)"}</M> and it is far faster due to fewer memory reads/writes.</li>
    <li><strong>Sparse / local attention:</strong> each token attends to a window or a strided pattern (Longformer, BigBird), reducing cost toward <M>{"O(n\\,w)"}</M> for window <M>{"w"}</M>.</li>
    <li><strong>Linear / kernelized attention:</strong> approximate softmax with a kernel feature map so the computation reassociates to <M>{"O(n d^2)"}</M> (Performer, Linear Transformers).</li>
    <li><strong>KV cache + chunking at inference:</strong> store past keys/values so each new token costs <M>{"O(n d)"}</M> rather than recomputing the whole prefix.</li>
  </ul>
  <p>State the exact-vs-approximate tradeoff: FlashAttention keeps results identical and is usually the first choice; approximate methods trade a little accuracy for sub-quadratic scaling at extreme lengths.</p>
</InterviewProblem>
<InterviewProblem question="Why do Transformers need positional encodings, and why does multi-head attention help over a single large head?" difficulty="medium" tag="Conceptual">
  <p><strong>Positional encodings:</strong> self-attention is permutation-equivariant. The output for a token is a weighted sum over all tokens, and those weights depend only on content via <M>{"QK^\\top"}</M>, not on order. Shuffle the inputs and you get the correspondingly shuffled outputs with identical values, so the model cannot tell &quot;dog bites man&quot; from &quot;man bites dog&quot;. Adding positional information (sinusoidal, learned absolute, or relative schemes like RoPE) injects order so attention can condition on position as well as content.</p>
  <p><strong>Multi-head:</strong> a single head produces one softmax distribution per query, so it can only average information one way. Splitting the model dimension into <M>{"h"}</M> heads lets each head learn a different projection of <M>{"Q, K, V"}</M> and thus attend to different relationships (one head tracking syntax, another coreference, another local context). The heads run in parallel and are concatenated, giving the model multiple representation subspaces at roughly the same total compute as one big head of dimension <M>{"d"}</M> (each head is dimension <M>{"d/h"}</M>).</p>
</InterviewProblem>
<InterviewProblem question="Implement single-head scaled dot-product self-attention with a causal mask in NumPy." difficulty="hard" tag="Coding">
  <p>The causal mask sets future positions to <M>{"-\\infty"}</M> before the softmax so each position attends only to itself and earlier tokens. We subtract the row max for numerical stability before exponentiating.</p>
  <CodeBlock language="python" filename="attention.py">{`import numpy as np

def softmax(x, axis=-1):
    x = x - np.max(x, axis=axis, keepdims=True)  # stability
    e = np.exp(x)
    return e / np.sum(e, axis=axis, keepdims=True)

def causal_self_attention(X, Wq, Wk, Wv):
    # X: (n, d_model)   Wq, Wk, Wv: (d_model, d_k)
    Q = X @ Wq                      # (n, d_k)
    K = X @ Wk                      # (n, d_k)
    V = X @ Wv                      # (n, d_k)

    d_k = Q.shape[-1]
    scores = (Q @ K.T) / np.sqrt(d_k)   # (n, n)

    # causal mask: position i may not see j > i
    n = X.shape[0]
    mask = np.triu(np.ones((n, n), dtype=bool), k=1)  # True above diagonal
    scores = np.where(mask, -np.inf, scores)

    weights = softmax(scores, axis=-1)  # (n, n), rows sum to 1
    return weights @ V                  # (n, d_k)

# sanity check
np.random.seed(0)
X = np.random.randn(4, 8)
Wq = np.random.randn(8, 8); Wk = np.random.randn(8, 8); Wv = np.random.randn(8, 8)
out = causal_self_attention(X, Wq, Wk, Wv)
print(out.shape)  # (4, 8)`}</CodeBlock>
  <p>Key points an interviewer probes: subtracting the row max before <M>{"\\exp"}</M> avoids overflow; the mask is applied to <strong>logits</strong> (set to <M>{"-\\infty"}</M>) not to weights, so masked positions get exactly zero probability; and the first row attends only to itself, confirming causality. Extending to multi-head means reshaping <M>{"Q,K,V"}</M> to <M>{"(h, n, d/h)"}</M>, running this per head, then concatenating.</p>
</InterviewProblem>

      </>
  );
}
