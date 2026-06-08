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
    <h2>Interview practice</h2>
<InterviewProblem question="When would you choose LoRA over full fine-tuning, and what is the tradeoff?" difficulty="easy" tag="Conceptual">
  <p>Full fine-tuning updates every weight in the model, so you store and optimize all <M>{"N"}</M> parameters and end up with a full-size checkpoint per task. <strong>LoRA</strong> (Low-Rank Adaptation) freezes the base weights and learns a small low-rank update for each weight matrix.</p>
  <p>Reach for LoRA when:</p>
  <ul>
    <li><strong>Memory is tight.</strong> You skip optimizer states (Adam keeps roughly 2 extra copies of every trainable parameter), so VRAM drops dramatically.</li>
    <li><strong>You have many tasks.</strong> Each adapter is a few MB, so you can hot-swap dozens of them over one shared frozen base instead of shipping many full checkpoints.</li>
    <li><strong>Your dataset is small.</strong> Fewer trainable parameters acts as regularization and resists catastrophic forgetting of the base model&apos;s general ability.</li>
  </ul>
  <p>The tradeoff: LoRA constrains updates to a low-rank subspace, so for tasks that demand a large distribution shift from pretraining it can underperform full fine-tuning. For most domain-adaptation and instruction-style tasks the gap is small to negligible, which is why LoRA is the default in practice.</p>
</InterviewProblem>
<InterviewProblem question="A weight matrix is 4096x4096. Compare the trainable parameter count for full fine-tuning vs LoRA with rank 8." difficulty="medium" tag="Math">
  <p>Full fine-tuning trains the whole matrix <M>{"W \\in \\mathbb{R}^{d \\times d}"}</M>:</p>
  <MB>{"4096 \\times 4096 = 16{,}777{,}216 \\approx 16.8\\text{M parameters}"}</MB>
  <p>LoRA replaces the update <M>{"\\Delta W"}</M> with a product of two thin matrices <M>{"\\Delta W = B A"}</M>, where <M>{"A \\in \\mathbb{R}^{r \\times d}"}</M> and <M>{"B \\in \\mathbb{R}^{d \\times r}"}</M> with rank <M>{"r = 8"}</M>. The trainable count is:</p>
  <MB>{"d \\cdot r + r \\cdot d = 2 d r = 2 \\times 4096 \\times 8 = 65{,}536 \\approx 65.5\\text{K parameters}"}</MB>
  <p>That is a <M>{"16.78\\text{M} / 65.5\\text{K} \\approx 256\\times"}</M> reduction in trainable parameters for this one matrix, while the forward pass still uses the full <M>{"W + BA"}</M>. In general the ratio is <M>{"d/(2r)"}</M>, so the savings grow with model width and shrink as you raise the rank. Note <M>{"A"}</M> is initialized random and <M>{"B"}</M> is initialized to zero so that <M>{"BA = 0"}</M> at the start, meaning training begins exactly at the base model.</p>
</InterviewProblem>
<InterviewProblem question="Your instruction-tuned chatbot started giving worse answers on general knowledge after you fine-tuned it on a narrow support-ticket dataset. What happened and how would you fix it?" difficulty="medium" tag="Applied">
  <p>This is <strong>catastrophic forgetting</strong>: aggressively updating the weights on a narrow distribution overwrites the representations that supported broad capability. Common contributing causes are too high a learning rate, too many epochs on a small dataset, and full fine-tuning of every layer.</p>
  <p>Fixes, roughly in order of how much I would reach for them:</p>
  <ul>
    <li><strong>Use parameter-efficient tuning (LoRA / adapters).</strong> Freezing the base weights and learning a small update strongly limits how much the base behavior can drift.</li>
    <li><strong>Mix in replay data.</strong> Blend a slice of general instruction data with the support tickets so the optimizer never sees a purely narrow distribution.</li>
    <li><strong>Lower the learning rate and reduce epochs.</strong> Small datasets overfit fast; 1 to 3 epochs with a low LR and early stopping on a held-out general-knowledge eval is usually enough.</li>
    <li><strong>Evaluate on both distributions.</strong> Track in-domain accuracy and an out-of-domain regression suite every checkpoint, and pick the checkpoint that balances them rather than the lowest training loss.</li>
  </ul>
  <p>The meta-point for an interviewer: you cannot just optimize the new task loss; you must explicitly measure and protect the capabilities you care about keeping.</p>
</InterviewProblem>
<InterviewProblem question="Explain the difference between continued pretraining, supervised instruction tuning, and preference optimization (RLHF/DPO). When does each belong in a pipeline?" difficulty="hard" tag="Conceptual">
  <p>These are three stages that adapt a model along different axes:</p>
  <ul>
    <li><strong>Continued (domain) pretraining.</strong> Same next-token objective as pretraining, run on raw in-domain text (legal, biomedical, code). It teaches new <strong>knowledge and vocabulary distribution</strong> but not how to follow instructions. Use it when the base model simply has not seen enough of your domain&apos;s language.</li>
    <li><strong>Supervised instruction tuning (SFT).</strong> Train on curated <M>{"(\\text{prompt}, \\text{ideal response})"}</M> pairs with the language-modeling loss applied to the response tokens. It teaches <strong>format and behavior</strong>: follow instructions, answer in the right style, use tools. This is the workhorse stage for most product fine-tuning.</li>
    <li><strong>Preference optimization (RLHF or DPO).</strong> Uses comparisons (response A preferred over B) rather than a single gold answer. It tunes for qualities that are easy to rank but hard to write a single label for: helpfulness, harmlessness, tone. <strong>DPO</strong> optimizes the preference directly with a classification-style loss against a frozen reference policy, avoiding the separate reward model and PPO loop of classic RLHF.</li>
  </ul>
  <p>Typical order: continued pretraining (only if you have a real knowledge gap) then SFT then preference optimization. A key reason for the ordering is that SFT first puts the model in a region where its sampled responses are good enough that pairwise preference signal is meaningful. The DPO objective makes the dependence on a reference policy <M>{"\\pi_{\\text{ref}}"}</M> explicit:</p>
  <MB>{"\\mathcal{L}_{\\text{DPO}} = -\\mathbb{E}\\left[ \\log \\sigma\\!\\left( \\beta \\log \\frac{\\pi_\\theta(y_w \\mid x)}{\\pi_{\\text{ref}}(y_w \\mid x)} - \\beta \\log \\frac{\\pi_\\theta(y_l \\mid x)}{\\pi_{\\text{ref}}(y_l \\mid x)} \\right) \\right]"}</MB>
  <p>where <M>{"y_w"}</M> is the preferred and <M>{"y_l"}</M> the rejected response, and <M>{"\\beta"}</M> controls how far the tuned policy may stray from the reference. Many production cases never need this stage at all: if you can write a single correct target, SFT (often LoRA SFT) is simpler and cheaper.</p>
</InterviewProblem>

      </>
  );
}
