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
    <h2>Interview practice</h2>
<InterviewProblem question="Explain the difference between data parallelism and model parallelism. When do you reach for each?" difficulty="easy" tag="Conceptual">
  <p><strong>Data parallelism:</strong> every worker holds a full copy of the model but processes a different shard of the batch. After the backward pass, gradients are averaged across workers (an <strong>all-reduce</strong>) so every replica stays in sync. This is the default because it is simple and scales throughput nearly linearly until communication dominates.</p>
  <p><strong>Model parallelism:</strong> the model itself is split across devices because it does not fit in one accelerator&apos;s memory. Two flavors:</p>
  <ul>
    <li><strong>Tensor parallelism</strong> splits individual layers (e.g. a matmul) across devices, with collectives inside each forward pass &mdash; heavy communication, so it wants fast intra-node links like NVLink.</li>
    <li><strong>Pipeline parallelism</strong> assigns whole layer-groups (stages) to different devices and streams micro-batches through, trading a &quot;bubble&quot; of idle time for lower communication.</li>
  </ul>
  <p><strong>Rule of thumb:</strong> use data parallelism when the model fits on one device and you just want speed. Reach for model/tensor/pipeline parallelism (often combined, &quot;3D parallelism&quot;) only when parameters plus optimizer state plus activations exceed device memory. ZeRO/FSDP is a middle ground: it shards optimizer state, gradients, and parameters across data-parallel workers, giving model-parallel memory savings while keeping a data-parallel programming model.</p>
</InterviewProblem>
<InterviewProblem question="A 7B-parameter model is trained with the Adam optimizer in mixed precision. Estimate the GPU memory just for parameters and optimizer state, and explain why a 24GB GPU is not enough." difficulty="medium" tag="Math">
  <p>Let <M>{"P = 7\\times 10^9"}</M> parameters. Mixed-precision Adam typically keeps several copies:</p>
  <ul>
    <li>fp16 parameters: <M>{"2P"}</M> bytes</li>
    <li>fp16 gradients: <M>{"2P"}</M> bytes</li>
    <li>fp32 master copy of parameters: <M>{"4P"}</M> bytes</li>
    <li>fp32 Adam first moment <M>{"m"}</M>: <M>{"4P"}</M> bytes</li>
    <li>fp32 Adam second moment <M>{"v"}</M>: <M>{"4P"}</M> bytes</li>
  </ul>
  <p>That is <M>{"16P"}</M> bytes of model + optimizer state:</p>
  <MB>{"16 \\times 7\\times 10^9 = 1.12\\times 10^{11}\\ \\text{bytes} \\approx 112\\ \\text{GB}"}</MB>
  <p>This already dwarfs a single 24GB GPU &mdash; and we have not even counted <strong>activations</strong>, which scale with batch size and sequence length and are often the largest term during the forward/backward pass. This is exactly why you need sharding (ZeRO/FSDP splits that 16P across <M>{"N"}</M> workers, roughly <M>{"16P/N"}</M> each), activation checkpointing to trade compute for activation memory, and/or offloading state to CPU/NVMe.</p>
</InterviewProblem>
<InterviewProblem question="You are serving a recommendation model. p50 latency is fine but p99 spikes badly and GPU utilization is low. How do you diagnose and fix this cost-effectively?" difficulty="hard" tag="Applied">
  <p><strong>Diagnose first.</strong> Low GPU utilization with bad tail latency usually means requests arrive one at a time and the GPU sits idle between them, while occasional bursts queue up. Check: per-stage timing (preprocessing vs inference vs postprocessing), queue depth, batch sizes actually hitting the GPU, and whether the spikes correlate with cold starts, GC pauses, or large inputs.</p>
  <p><strong>Fixes, cheapest first:</strong></p>
  <ul>
    <li><strong>Dynamic batching:</strong> add a short queue (e.g. 5&ndash;10 ms window) so the server groups concurrent requests into one GPU call. This raises utilization and throughput dramatically; the small added wait usually improves p99 because requests stop starving for the device.</li>
    <li><strong>Right-size and quantize:</strong> use fp16/int8 (or distillation) to cut compute and memory bandwidth, the usual bottleneck for inference.</li>
    <li><strong>Separate the tail causes:</strong> pin model load to avoid cold starts, cap max input size, and move heavy preprocessing off the GPU thread.</li>
    <li><strong>Autoscale on the right metric:</strong> scale on queue depth or batch-wait time, not raw CPU. Add a small replica buffer so bursts do not blow the tail.</li>
    <li><strong>Cache:</strong> for recommendations, embeddings and popular candidate scores are highly cacheable; a cache hit avoids the GPU entirely.</li>
  </ul>
  <p>The key insight is that tail latency and low utilization are two symptoms of the same problem &mdash; an unbatched, bursty request pattern &mdash; and dynamic batching addresses both before you spend money on more hardware.</p>
</InterviewProblem>
<InterviewProblem question="In synchronous data-parallel training, why does gradient all-reduce become the bottleneck as you add workers, and what techniques reduce its cost?" difficulty="medium" tag="Conceptual">
  <p>In synchronous SGD every step ends with averaging gradients across all workers. The classic <strong>ring all-reduce</strong> moves a volume of data proportional to the model size and is roughly independent of worker count in bandwidth terms, but its <strong>latency</strong> and synchronization grow with the number of workers, and any single slow worker (a straggler) stalls the whole step. As compute per device gets faster, the fixed communication of <M>{"2(N-1)/N \\times \\text{(gradient bytes)}"}</M> per worker starts to dominate the step time.</p>
  <p>Techniques that help:</p>
  <ul>
    <li><strong>Gradient bucketing + overlap:</strong> fire all-reduce on early-layer gradients while later layers are still computing backward, hiding communication under compute.</li>
    <li><strong>Larger global batch:</strong> fewer, bigger steps amortize the per-step sync cost (paired with a tuned LR warmup so accuracy holds).</li>
    <li><strong>Mixed precision / gradient compression:</strong> all-reducing fp16 (or quantized) gradients halves the bytes on the wire.</li>
    <li><strong>Topology-aware collectives:</strong> use fast intra-node links (NVLink) before crossing slower inter-node network, and group accordingly.</li>
    <li><strong>Mitigate stragglers:</strong> balanced sharding and, if you can tolerate it, asynchronous or local-SGD variants that sync less often.</li>
  </ul>
</InterviewProblem>

      </>
  );
}
