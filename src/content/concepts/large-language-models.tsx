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
    </>
  );
}
