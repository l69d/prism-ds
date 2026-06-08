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
    </>
  );
}
