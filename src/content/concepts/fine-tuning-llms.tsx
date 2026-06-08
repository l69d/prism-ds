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
      <p>A base LLM has read the internet but follows no orders and knows nothing about your domain. Fine-tuning nudges its weights so it behaves the way you need — without paying to train a model from scratch.</p>

      <KeyIdea>Fine-tuning starts from a pretrained model and continues training on a smaller, targeted dataset. The question is not <em>whether</em> to adapt, but <strong>how many parameters you are willing to move</strong> to get there.</KeyIdea>

      <h2>Three flavors</h2>
      <p>The choices form a spectrum from heaviest to lightest:</p>
      <ul>
        <li><strong>Full fine-tuning</strong> — update every weight. Maximum capacity, but you need a fresh copy of all billions of parameters per task, plus optimizer state (often 3-4&times; the model size in memory).</li>
        <li><strong>LoRA</strong> (Low-Rank Adaptation) — freeze the base weights and train tiny added matrices. You ship a few megabytes of &quot;adapter&quot; instead of a whole new model.</li>
        <li><strong>Instruction tuning</strong> — a <em>goal</em>, not a method. Fine-tune (fully or with LoRA) on (prompt, ideal-response) pairs so the model learns to <em>follow instructions</em> rather than merely continue text.</li>
      </ul>

      <Basic>
        <p>Imagine a brilliant graduate who has read every book but never had a job. <strong>Instruction tuning</strong> is their onboarding: thousands of &quot;here&apos;s a request, here&apos;s a good answer&quot; examples teach them to actually help instead of rambling.</p>
        <p><strong>Full fine-tuning</strong> is re-educating the whole person — powerful but expensive, and you risk them forgetting old skills. <strong>LoRA</strong> is handing them a small cheat-sheet they consult on top of everything they already know: cheap, reversible, and you can swap cheat-sheets per task.</p>
      </Basic>

      <Advanced>
        <p>LoRA&apos;s insight is that the weight <em>update</em> during adaptation has low intrinsic rank. Instead of learning a full update <M>{"\\Delta W \\in \\mathbb{R}^{d \\times k}"}</M>, factor it:</p>
        <MB>{"W' = W_0 + \\Delta W = W_0 + \\frac{\\alpha}{r}\\, B A, \\quad B \\in \\mathbb{R}^{d \\times r},\; A \\in \\mathbb{R}^{r \\times k}"}</MB>
        <p>with rank <M>{"r \\ll \\min(d, k)"}</M>. Only <M>{"A"}</M> and <M>{"B"}</M> are trained; <M>{"W_0"}</M> stays frozen, so trainable parameters drop from <M>{"d k"}</M> to <M>{"r(d + k)"}</M> — often a 1000&times; reduction. The scaling <M>{"\\alpha / r"}</M> keeps the update magnitude stable as you vary <M>{"r"}</M>, and <M>{"B"}</M> is initialized to zero so training begins exactly at the base model.</p>
        <p>Instruction tuning optimizes the same supervised objective as any fine-tune — next-token cross-entropy on the response tokens — but the <em>data distribution</em> is curated demonstrations, which is what aligns format and helpfulness.</p>
      </Advanced>

      <Callout kind="pitfall" title="Catastrophic forgetting">
        Aggressive full fine-tuning on a narrow dataset can overwrite general capabilities — the model gets great at your task and worse at everything else. Lower learning rates, fewer epochs, and parameter-efficient methods like LoRA largely sidestep this by leaving base weights untouched.
      </Callout>

      <CodeBlock language="python" filename="lora_finetune.py">{`from peft import LoraConfig, get_peft_model
from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained("base-llm-7b")

# Inject low-rank adapters into the attention projections
config = LoraConfig(
    r=8,              # rank: capacity of the adapter
    lora_alpha=16,    # scaling = alpha / r
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
)
model = get_peft_model(model, config)

# Only the LoRA matrices are trainable
model.print_trainable_parameters()
# trainable: 4.2M || all: 6.7B || trainable%: 0.06
`}</CodeBlock>

      <MoreDepth>
        <p>LoRA adapters can be <strong>merged</strong> back into <M>{"W_0"}</M> after training (<M>{"W_0 + BA"}</M>), giving zero inference overhead — identical to a fully fine-tuned model at runtime. Unmerged, you can hot-swap adapters per request, serving many tasks from one base model in memory. QLoRA pushes further: quantize <M>{"W_0"}</M> to 4-bit and train LoRA on top, fine-tuning a 65B model on a single GPU. The trade-off: very high-rank knowledge injection (teaching genuinely new facts, not just behavior) still favors full fine-tuning, since low-rank updates have limited capacity to rewrite dense factual associations.</p>
      </MoreDepth>

      <Quiz question="Why does LoRA dramatically reduce the number of trainable parameters compared to full fine-tuning?" options={[
        { text: "It trains two small low-rank matrices A and B while freezing the original weights, so cost scales with r(d+k) instead of d*k.", correct: true, why: "Exactly — the low-rank factorization replaces a full d-by-k update with a tiny rank-r one." },
        { text: "It deletes most of the model's layers before training.", why: "LoRA changes nothing about the architecture's depth; all base layers remain and stay frozen." },
        { text: "It uses a smaller dataset, which is what reduces trainable parameters.", why: "Dataset size affects training cost but not the count of trainable parameters; that comes from the architecture choice." },
        { text: "It quantizes every weight to 4-bit, which is the source of the parameter savings.", why: "Quantization (as in QLoRA) saves memory on the frozen weights but is separate from LoRA's low-rank trainable-parameter reduction." },
      ]} />
    </>
  );
}
