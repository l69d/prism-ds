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
      <p>Modern models outgrow a single GPU on two axes: the data is too big to train on quickly, and the weights are too big to fit in one device&apos;s memory. Scaling ML is the craft of splitting both across many machines without wrecking accuracy or your budget.</p>

      <KeyIdea>Scaling is about deciding <strong>what to split</strong> (the batch, the layers, or the tensors) so each device does useful work, while keeping the cost of synchronizing them small relative to the cost of computing.</KeyIdea>

      <h2>The three ways to split</h2>
      <ul>
        <li><strong>Data parallelism</strong>: every device holds a full copy of the model and processes a different slice of the batch. Gradients are averaged across devices each step (an all-reduce). Simple and the default when the model fits in memory.</li>
        <li><strong>Tensor (sharding) parallelism</strong>: a single large layer&apos;s weight matrix is split across devices, each computing part of the matmul. Used when one layer is too big for one GPU.</li>
        <li><strong>Pipeline parallelism</strong>: different layers live on different devices, and micro-batches flow through like an assembly line to keep everyone busy.</li>
      </ul>
      <p>Real systems combine all three (&quot;3D parallelism&quot;) plus optimizer-state sharding (ZeRO / FSDP) to train models with hundreds of billions of parameters.</p>

      <Basic>
        <p>Picture grading 10,000 exams. <strong>Data parallel</strong>: hire 10 graders, give each 1,000 exams, then average the class statistics at the end. <strong>Tensor parallel</strong>: one exam is so huge that two graders split each page. <strong>Pipeline parallel</strong>: grader A does question 1, hands the paper to grader B for question 2, and so on. The art is keeping graders busy instead of waiting on each other.</p>
      </Basic>

      <Advanced>
        <p>Data-parallel speedup is governed by the communication-to-computation ratio. With <M>{"N"}</M> devices, ring all-reduce moves about <M>{"2(N-1)/N"}</M> times the gradient size per step, roughly constant in <M>{"N"}</M>, so it scales well. Efficiency is</p>
        <MB>{"E = \\frac{T_{\\text{comp}}}{T_{\\text{comp}} + T_{\\text{comm}}}"}</MB>
        <p>Larger global batches improve <M>{"E"}</M> but degrade generalization unless you scale the learning rate (linear scaling rule, <M>{"\\eta \\propto B"}</M>) with warmup. ZeRO/FSDP shards the optimizer states, gradients, and parameters, cutting per-device memory from <M>{"\\Theta(P)"}</M> toward <M>{"\\Theta(P/N)"}</M> for <M>{"P"}</M> parameters, trading extra communication for the saved memory.</p>
      </Advanced>

      <Callout kind="pitfall" title="Bigger batches are not free accuracy">
        Doubling devices to double the global batch can stall learning: the gradient noise that helps escape sharp minima shrinks. Scale the learning rate and add warmup, or you will see lower final accuracy despite faster steps.
      </Callout>

      <h2>Cost-aware inference</h2>
      <p>Training is one-off; inference runs forever, so it dominates lifetime cost. Levers that matter: <strong>quantization</strong> (FP16/INT8/INT4 weights), <strong>batching</strong> requests to amortize memory bandwidth, <strong>KV-cache</strong> reuse for autoregressive models, and <strong>distillation</strong> to a smaller student. The metric to optimize is cost per useful prediction, not raw latency.</p>

      <CodeBlock language="python" filename="fsdp_data_parallel.py">{`import torch
from torch.distributed.fsdp import FullyShardedDataParallel as FSDP

# Each process owns one GPU; gradients all-reduced, params/optimizer sharded.
model = build_transformer().cuda()
model = FSDP(model)  # shards params across the process group

opt = torch.optim.AdamW(model.parameters(), lr=3e-4)

for batch in dataloader:          # each rank sees a different shard of data
    out = model(batch.x.cuda())
    loss = loss_fn(out, batch.y.cuda())
    loss.backward()               # triggers reduce-scatter of gradients
    opt.step()
    opt.zero_grad()`}</CodeBlock>

      <MoreDepth>
        <p>Strong vs. weak scaling matters when you report numbers. <strong>Weak scaling</strong> (grow the problem with the machine) usually looks great because each device stays saturated. <strong>Strong scaling</strong> (fix the problem, add devices) hits Amdahl&apos;s law fast: communication and the un-parallelizable serial fraction cap your speedup. A model that &quot;scales to 1024 GPUs&quot; in a paper is almost always weak scaling, so check before promising a deadline that more hardware will shorten a fixed job.</p>
      </MoreDepth>

      <Quiz question="Your model fits comfortably on one GPU but training is too slow. You add 8 GPUs. Which strategy is the natural first choice, and what must you adjust?" options={[
        { text: "Tensor parallelism, splitting each weight matrix across the 8 GPUs", why: "Tensor parallelism is for layers too big for one device; here the model already fits, so it adds communication overhead for no benefit." },
        { text: "Data parallelism, scaling the learning rate (with warmup) for the larger global batch", correct: true, why: "Data parallelism is the default when the model fits; the 8x larger global batch needs learning-rate scaling plus warmup to preserve accuracy." },
        { text: "Pipeline parallelism, placing different layers on different GPUs", why: "Pipeline parallelism targets models too large for one device and introduces bubble overhead; unnecessary when the model already fits." },
        { text: "Nothing special—just replicate the model and keep the same learning rate", why: "Replicating is right, but keeping the same LR with an 8x batch usually hurts final accuracy; you must scale the LR and warm up." },
      ]} />
    </>
  );
}
