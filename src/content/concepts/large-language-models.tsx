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
      <p>A large language model is a neural network trained to do one deceptively simple thing: predict the next token. Scale that objective across the internet and surprising abilities emerge for free.</p>

      <KeyIdea>To predict the next word well across all of human text, a model is forced to learn grammar, facts, reasoning, and style. Next-token prediction is a proxy task that secretly demands understanding.</KeyIdea>

      <h2>What pretraining actually does</h2>
      <p>Pretraining sweeps a Transformer over trillions of tokens, each time asking it to guess what comes next and nudging its weights toward the right answer. There are no human labels — the text <strong>is</strong> the label, because the next token is always known.</p>
      <ul>
        <li><strong>Self-supervised:</strong> no annotation needed; the data supervises itself.</li>
        <li><strong>Compression as learning:</strong> to predict well, the model must store regularities of language and world.</li>
        <li><strong>Generality:</strong> one objective produces a model usable for translation, coding, summarizing, and chat.</li>
      </ul>

      <Basic>
        <p>Imagine reading billions of sentences with the last word hidden and guessing it every time. At first you guess randomly. Slowly you notice that &quot;Paris is the capital of&quot; is almost always followed by &quot;France&quot;, that questions get answers, that code has matching brackets. By the end you have absorbed an enormous amount about how the world is described in words — not because anyone taught you facts, but because predicting text well requires knowing them.</p>
      </Basic>

      <Advanced>
        <p>Training minimizes the average cross-entropy of the next token given all previous ones, which is exactly maximizing the log-likelihood of the corpus:</p>
        <MB>{"\\mathcal{L} = -\\frac{1}{N}\\sum_{i=1}^{N} \\log p_\\theta(x_i \\mid x_{<i})"}</MB>
        <p>Performance follows empirical <strong>scaling laws</strong>: test loss falls as a power law in model size, data, and compute. With irreducible loss <M>{"L_\\infty"}</M>, one common form is</p>
        <MB>{"L(N) \\approx L_\\infty + \\left(\\frac{N_c}{N}\\right)^{\\alpha_N}"}</MB>
        <p>Chinchilla showed compute-optimal training scales parameters and tokens together, roughly <M>{"N \\propto D"}</M>, so many early models were badly under-trained on data.</p>
      </Advanced>

      <Callout kind="insight" title="Emergence is a side effect">
        Capabilities like in-context learning and chain-of-thought were never explicitly trained. They appear because they reduce next-token loss on a corpus that contains reasoning, examples, and explanations.
      </Callout>

      <CodeBlock language="python" filename="next_token_loss.py">{`import torch
import torch.nn.functional as F

# logits: model scores for each position over the vocabulary
# (batch, seq_len, vocab); targets are the *shifted* input ids.
def lm_loss(logits, input_ids):
    # predict token t+1 from tokens up to t
    logits = logits[:, :-1, :]
    targets = input_ids[:, 1:]
    # cross-entropy = -log p(true next token); this is the entire objective
    return F.cross_entropy(
        logits.reshape(-1, logits.size(-1)),
        targets.reshape(-1),
    )

# Lower loss => better next-token prediction => more "knowledge" baked in.`}</CodeBlock>

      <MoreDepth>
        <p>A raw pretrained model is a brilliant autocompleter, not an assistant — it will happily continue a prompt instead of answering it. The familiar helpful behavior comes from a second stage: supervised fine-tuning on instruction data, then preference optimization (RLHF or DPO) that aligns outputs with human ratings. Crucially, alignment does not add new knowledge; it reshapes the distribution over an already-learned capability surface, which is why a model can be steered to refuse, format, or reason without further pretraining.</p>
      </MoreDepth>

      <Quiz question="Why does pure next-token prediction end up teaching a model facts and reasoning, despite never being given labeled facts?" options={[
        { text: "Predicting the next token accurately across diverse text requires internalizing the regularities — facts, grammar, logic — that govern that text.", correct: true, why: "The proxy task is hard enough that solving it forces real structure to be learned." },
        { text: "Engineers inject a curated knowledge base into the model during pretraining.", why: "Pretraining is self-supervised on raw text; no external knowledge base is inserted." },
        { text: "Cross-entropy loss directly rewards factual correctness as a separate term.", why: "There is one objective: log-likelihood of the next token, with no separate factuality term." },
        { text: "Human annotators label the correct next word for every training example.", why: "The next token comes from the text itself, so no human labeling is needed." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="What does next-token prediction actually teach a model, and why does optimizing such a narrow objective produce broad capabilities?" difficulty="easy" tag="Conceptual">
  <p>The pretraining objective is deceptively simple: given a prefix of tokens, maximize the likelihood of the next token. Formally the model minimizes the average negative log-likelihood</p>
  <MB>{"\\mathcal{L} = -\\frac{1}{T}\\sum_{t=1}^{T} \\log p_\\theta(x_t \\mid x_{<t})"}</MB>
  <p>The reason this buys so much is that <strong>accurately predicting the next token over a huge, diverse corpus requires latent skills</strong>. To predict the last token of a proof you need arithmetic and logic; to finish a translated sentence you need a bilingual mapping; to complete a code function you need syntax and intent. Compression is the unifying lens: a model that predicts text well must have built an internal model of the structure that generated it.</p>
  <ul>
    <li><strong>It is self-supervised.</strong> The labels are the next tokens themselves, so any raw text becomes training data &mdash; this is what makes web-scale corpora usable.</li>
    <li><strong>Capabilities are emergent, not designed.</strong> No one wrote a &quot;translation loss&quot;; translation falls out because the data contains parallel text and predicting it well demands the skill.</li>
    <li><strong>The same model is autoregressive at inference.</strong> Generation just samples <M>{"x_t \\sim p_\\theta(\\cdot \\mid x_{<t})"}</M> and feeds it back, so the training and inference objectives are aligned.</li>
  </ul>
  <p>A good candidate also notes the limits: next-token prediction optimizes <strong>imitation of the corpus</strong>, not truthfulness or helpfulness &mdash; which is exactly why an instruction-tuning and RLHF stage is bolted on afterward.</p>
</InterviewProblem>
<InterviewProblem question="State the Chinchilla scaling result and use it: given a fixed compute budget, how should you trade off model size against training tokens?" difficulty="hard" tag="Math">
  <p>Empirically, loss as a function of parameters <M>{"N"}</M> and training tokens <M>{"D"}</M> is well fit by</p>
  <MB>{"L(N, D) = E + \\frac{A}{N^{\\alpha}} + \\frac{B}{D^{\\beta}}"}</MB>
  <p>where <M>{"E"}</M> is the irreducible entropy of the data and <M>{"\\alpha, \\beta \\approx 0.34"}</M>. Training compute is approximately <M>{"C \\approx 6 N D"}</M> FLOPs. To minimize loss at fixed <M>{"C"}</M> you substitute <M>{"D = C/(6N)"}</M> and minimize over <M>{"N"}</M>.</p>
  <p>Taking the derivative and setting it to zero, the optimal allocation scales as a power of compute:</p>
  <MB>{"N_{\\text{opt}} \\propto C^{a}, \\qquad D_{\\text{opt}} \\propto C^{b}, \\qquad a + b = 1"}</MB>
  <p>The Chinchilla finding is that <M>{"a \\approx b \\approx 0.5"}</M> &mdash; you should grow parameters and tokens in <strong>roughly equal proportion</strong>. The headline rule of thumb: train on about <strong>20 tokens per parameter</strong>.</p>
  <ul>
    <li><strong>The earlier GPT-3 generation was undertrained.</strong> It had 175B parameters but only ~300B tokens (~1.7 tokens/param), so it was far from compute-optimal &mdash; a smaller model trained on more data reaches lower loss at the same FLOPs.</li>
    <li><strong>Compute-optimal is not deployment-optimal.</strong> If you will serve a model to millions of users, inference cost dominates, so you deliberately go past Chinchilla &mdash; train a <strong>smaller</strong> model on <strong>far more</strong> tokens to make every forward pass cheaper, even though that point is not loss-optimal for the training budget.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="A model trained only with next-token prediction generates fluent but factually wrong, sycophantic, or unsafe text. Why does pretraining alone fail to fix this, and what is the standard alignment pipeline?" difficulty="medium" tag="Applied">
  <p>The core issue is an <strong>objective mismatch</strong>. Pretraining maximizes likelihood of the corpus, so the model learns the distribution of how text <em>is</em> written on the internet, not how a helpful, honest assistant <em>should</em> respond. If confident-but-wrong text is common in the data, the model will reproduce it. Likelihood says nothing about truth, harm, or what the user actually wanted.</p>
  <p>The standard post-training recipe layers two stages on top of the pretrained base:</p>
  <ul>
    <li><strong>Supervised fine-tuning (SFT / instruction tuning).</strong> Fine-tune on curated (instruction, ideal response) pairs. This teaches the format and behavior of following instructions, shifting the model from &quot;continue this text&quot; to &quot;answer this request.&quot;</li>
    <li><strong>Preference optimization (RLHF or DPO).</strong> Humans rank candidate responses; a reward model is trained on those preferences, and the policy is optimized to produce high-reward outputs. RLHF uses RL (e.g. PPO) with a KL penalty back to the SFT model; DPO skips the explicit reward model and optimizes the preference objective directly.</li>
  </ul>
  <p>The KL penalty matters: it keeps the policy close to the SFT model so optimization does not <strong>reward-hack</strong> into degenerate, off-distribution text that games the reward model. A subtle failure mode to mention is <strong>sycophancy</strong> &mdash; if annotators reward agreeable answers, the reward model learns to prefer flattery over correctness, so preference data quality directly bounds final behavior.</p>
</InterviewProblem>
<InterviewProblem question="Implement temperature and top-p (nucleus) sampling for next-token decoding. Explain what each knob controls." difficulty="medium" tag="Coding">
  <p>Greedy decoding (argmax) is deterministic and often repetitive. Sampling adds controlled diversity. <strong>Temperature</strong> rescales the logits before the softmax: low temperature sharpens the distribution toward the mode, high temperature flattens it. <strong>Top-p</strong> truncates the tail, keeping only the smallest set of tokens whose cumulative probability exceeds <M>{"p"}</M>, then renormalizes &mdash; so it adapts how many candidates survive to the local uncertainty.</p>
  <CodeBlock language="python" filename="sampling.py">{`import numpy as np

def sample_next(logits, temperature=1.0, top_p=1.0):
    # logits: 1D array of raw scores over the vocabulary
    logits = np.asarray(logits, dtype=np.float64)

    # Temperature: divide logits, then softmax. Lower temp -> peakier.
    z = logits / max(temperature, 1e-8)
    z -= z.max()                      # stabilize before exp
    probs = np.exp(z)
    probs /= probs.sum()

    # Top-p (nucleus): keep the smallest prefix exceeding p in cum-prob.
    order = np.argsort(probs)[::-1]   # indices, most likely first
    sorted_probs = probs[order]
    cum = np.cumsum(sorted_probs)
    keep = cum <= top_p
    keep[0] = True                    # always keep the top token
    kept_idx = order[keep]

    renorm = probs[kept_idx] / probs[kept_idx].sum()
    return int(np.random.choice(kept_idx, p=renorm))

# Example: temperature=0.7 is conservative; top_p=0.9 trims the long tail.
logits = np.array([2.0, 1.0, 0.5, -1.0, -3.0])
print(sample_next(logits, temperature=0.7, top_p=0.9))`}</CodeBlock>
  <p>Key points an interviewer wants: subtracting the max before <M>{"\\exp"}</M> prevents overflow; temperature near <M>{"0"}</M> recovers greedy decoding while large temperature approaches uniform sampling; and top-p is preferred over top-k because it keeps a <strong>variable</strong> number of tokens &mdash; many when the model is unsure, few when it is confident.</p>
</InterviewProblem>

      </>
  );
}
