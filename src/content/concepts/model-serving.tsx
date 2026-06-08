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
      <p>Training a model is only half the job. Serving is the engineering of turning a trained artifact into a fast, reliable endpoint that answers requests under real-world load.</p>

      <KeyIdea>Latency is how long one request waits; throughput is how many requests you finish per second. Batching trades a little latency for a lot of throughput &mdash; and the two are almost always in tension.</KeyIdea>

      <h2>The four levers</h2>
      <ul>
        <li><strong>Latency</strong> &mdash; time from request to response. Usually reported as a percentile (p50, p95, p99), not a mean, because tail behavior is what users feel.</li>
        <li><strong>Throughput</strong> &mdash; completed requests (or tokens) per second. This is what you pay for on a GPU.</li>
        <li><strong>Batching</strong> &mdash; grouping several requests into one forward pass so the hardware stays busy.</li>
        <li><strong>Frameworks</strong> &mdash; servers like TorchServe, Triton, vLLM, or TF Serving that handle queuing, batching, and concurrency for you.</li>
      </ul>

      <Basic>
        <p>Imagine a coffee shop. <strong>Latency</strong> is how long one customer waits. <strong>Throughput</strong> is how many customers the shop serves per hour. If the barista makes drinks one at a time, each customer is fast but the line crawls. If the barista waits to collect five orders and makes them together on one big machine, each individual waits a bit longer, but far more drinks come out per hour. That waiting-to-group is <strong>batching</strong>, and a <strong>serving framework</strong> is the manager who decides how long to wait and how to staff the counter.</p>
      </Basic>

      <Advanced>
        <p>GPUs are throughput machines: a batch of size <M>{"B"}</M> often costs barely more wall-clock time than a batch of one, because the kernel launch and memory transfer overheads amortize. So per-request cost drops roughly as</p>
        <MB>{"\\text{cost per request} \\approx \\frac{t_{\\text{fixed}}}{B} + t_{\\text{marginal}}"}</MB>
        <p>Dynamic batching adds a queue with a max wait window <M>{"\\tau"}</M>: requests accumulate until either <M>{"B_{\\max}"}</M> arrive or <M>{"\\tau"}</M> elapses. A request&apos;s latency is then its own compute time plus up to <M>{"\\tau"}</M> of queueing. By Little&apos;s Law, mean queue occupancy <M>{"L = \\lambda W"}</M> ties arrival rate <M>{"\\lambda"}</M> to wait <M>{"W"}</M>, so a system near saturation sees latency explode non-linearly &mdash; tail percentiles blow up long before mean utilization hits 100%.</p>
      </Advanced>

      <Callout kind="pitfall" title="Don't optimize the mean">
        Averaging latency hides the tail. A p50 of 40ms with a p99 of 2s means 1 in 100 users has a terrible experience &mdash; and at scale that is millions of bad requests. Always set SLOs on p95 or p99.
      </Callout>

      <h2>What a framework gives you</h2>
      <p>Production serving frameworks bundle the unglamorous-but-essential parts: request queuing, dynamic batching, concurrent model instances, GPU memory management, health checks, and metrics. For LLMs, <strong>vLLM</strong> adds <strong>continuous (in-flight) batching</strong> and PagedAttention so newly arrived sequences join a running batch instead of waiting for it to drain.</p>

      <CodeBlock language="python" filename="serve.py">{`from fastapi import FastAPI
import torch, asyncio

app = FastAPI()
model = torch.jit.load("model.pt").eval().cuda()

# Simple dynamic batcher: collect requests for up to TAU seconds.
queue: list = []
TAU, B_MAX = 0.005, 32  # 5 ms window, 32-sample cap

async def batched_infer(x):
    fut = asyncio.get_event_loop().create_future()
    queue.append((x, fut))
    if len(queue) == 1:
        asyncio.create_task(flush())
    return await fut

async def flush():
    await asyncio.sleep(TAU)
    batch = queue[:B_MAX]; del queue[:B_MAX]
    xs = torch.stack([b[0] for b in batch]).cuda()
    with torch.no_grad():
        ys = model(xs).cpu()          # one forward pass, many requests
    for (_, fut), y in zip(batch, ys):
        fut.set_result(y)

@app.post("/predict")
async def predict(x: list[float]):
    y = await batched_infer(torch.tensor(x))
    return {"pred": y.tolist()}`}</CodeBlock>

      <MoreDepth>
        <p>The hardest tail latency comes from <strong>head-of-line blocking</strong> with static batching: a batch finishes only when its slowest member does, so one long generation stalls every co-batched request. Continuous batching fixes this by evicting finished sequences and admitting new ones each decode step. Beyond that, real systems separate the <strong>prefill</strong> (compute-bound, processes the prompt) and <strong>decode</strong> (memory-bandwidth-bound, one token at a time) phases &mdash; sometimes onto different GPU pools &mdash; because batching strategies that help one phase hurt the other.</p>
      </MoreDepth>

      <Quiz question="A team reports their model server has 'great latency' citing a 30ms average, but users complain it feels slow and unreliable. What is the most likely diagnosis?" options={[
        { text: "The mean hides a heavy tail; p95/p99 latency is probably very high", correct: true, why: "Averages mask tail behavior, which is exactly what users experience as occasional slowness; SLOs should target high percentiles." },
        { text: "Throughput is too high, which always increases per-user latency", why: "Higher throughput via batching can raise latency slightly, but it does not by itself explain a few users seeing terrible response times." },
        { text: "The model is too accurate and should be made smaller", why: "Accuracy is unrelated to perceived latency reliability; the symptom points to variance in response time, not model size." },
        { text: "They should switch from percentiles to the mean for clearer reporting", why: "This is backwards &mdash; the mean is the misleading metric here; percentiles reveal the tail problem." },
      ]} />
    <h2>Interview practice</h2>

<InterviewProblem question="Explain the difference between latency and throughput in model serving, and why optimizing one can hurt the other." difficulty="easy" tag="Conceptual">
  <p><strong>Latency</strong> is the time to serve a single request end-to-end (often reported as p50/p95/p99 tail percentiles). <strong>Throughput</strong> is how many requests the system completes per unit time (QPS). They are related but distinct: a system can have low latency yet low throughput (one request at a time), or high throughput yet high tail latency (large batches).</p>
  <p>The tension comes mainly from <strong>batching</strong>. GPUs are throughput machines: running one request leaves most of the hardware idle, so the per-request cost is dominated by fixed overhead. Grouping many requests into one matrix multiply amortizes that overhead and pushes throughput up dramatically. But a request that arrives just after a batch starts must wait for the batch window to fill and for the whole batch to finish, which inflates its latency.</p>
  <ul>
    <li><strong>Optimize for latency</strong> (interactive apps, ad ranking): small or no batches, more replicas, accept lower hardware utilization.</li>
    <li><strong>Optimize for throughput</strong> (offline scoring, embedding backfills): large batches, fewer machines, accept higher per-item latency.</li>
  </ul>
  <p>In practice you set an SLO such as &quot;p99 under 50 ms&quot; and then maximize throughput <em>subject to</em> that constraint, rather than treating either number in isolation.</p>
</InterviewProblem>

<InterviewProblem question="You serve a model on a single GPU. Each request takes 8 ms to compute alone, but a batch of up to 32 runs in 20 ms total. Requests arrive at 1500 QPS. How would you set the batching policy, and what is the rough latency?" difficulty="medium" tag="Math">
  <p>First check whether the GPU can keep up at all. Without batching, each request needs 8 ms, so one GPU sustains at most <M>{"1000 / 8 = 125"}</M> QPS. That is far below 1500 QPS, so naive serving collapses; we <strong>must</strong> batch.</p>
  <p>With dynamic batching, a batch of 32 finishes in 20 ms, giving a throughput ceiling of:</p>
  <MB>{"\\frac{32 \\text{ requests}}{20 \\text{ ms}} = 1600 \\text{ QPS}"}</MB>
  <p>That just exceeds the 1500 QPS load, so one GPU is feasible but tight. The service time per batch is 20 ms, and to gather 32 requests at 1500 QPS we wait at most:</p>
  <MB>{"t_{\\text{fill}} = \\frac{32}{1500 \\text{ /s}} \\approx 21 \\text{ ms}"}</MB>
  <p>So a request near the front of a batch waits ~21 ms to fill plus 20 ms to compute (~41 ms), while a request at the back waits mostly just the 20 ms compute. Because utilization (1500/1600 ≈ 94%) is high, a queue forms and tail latency degrades fast under any burst.</p>
  <p><strong>Policy:</strong> use a max batch size of 32 with a short timeout (e.g. 5-10 ms) so partially-full batches still flush under bursty traffic, trading a little throughput for bounded tail latency. Given the thin 6% headroom, I would add a second GPU replica so each runs near 50% utilization, which collapses queueing delay and protects p99.</p>
</InterviewProblem>

<InterviewProblem question="What is continuous (in-flight) batching for LLM inference, and why is it a bigger win than static batching for autoregressive models?" difficulty="hard" tag="Conceptual">
  <p>Autoregressive LLMs generate one token per forward pass, and different requests want different numbers of output tokens. With <strong>static batching</strong>, you assemble a batch, run all sequences together, and the batch is not released until the <em>longest</em> sequence finishes. A request that wanted 10 tokens sits idle while a neighbor generates 2000, so GPU slots are wasted and short requests inherit long-request latency.</p>
  <p><strong>Continuous batching</strong> operates at the granularity of a single decode step rather than a whole sequence. After each step the scheduler:</p>
  <ul>
    <li>Evicts any sequence that hit its stop token or max length and returns it immediately.</li>
    <li>Admits newly arrived requests into the freed slots for the very next step.</li>
  </ul>
  <p>This keeps the batch dimension full at almost every step, so GPU utilization stays high and finished requests are not held hostage by their batch-mates. It is what frameworks like vLLM and TGI use, and it typically delivers several-fold higher throughput at the same latency.</p>
  <p>It pairs naturally with <strong>PagedAttention</strong>-style KV-cache management: because sequences enter and leave continuously, the KV cache must be allocated in small reusable blocks rather than one contiguous slab per request, which avoids fragmentation and lets you pack more concurrent sequences into fixed GPU memory.</p>
</InterviewProblem>

<InterviewProblem question="Sketch a FastAPI serving endpoint with micro-batching: incoming requests are queued and flushed either when the batch is full or after a short timeout. What are the correctness pitfalls?" difficulty="hard" tag="Coding">
  <p>The idea is to decouple request arrival from model execution. Each request hands its input to a shared queue and waits on a future; a background loop drains the queue, runs the model once per batch, and resolves the futures by position.</p>
  <CodeBlock language="python" filename="serve.py">{`import asyncio
from fastapi import FastAPI

app = FastAPI()
MAX_BATCH = 32
MAX_WAIT_S = 0.01  # 10 ms

queue: asyncio.Queue = asyncio.Queue()

async def batch_worker():
    while True:
        # Block for the first item so we never busy-spin.
        first = await queue.get()
        batch = [first]
        try:
            # Greedily pull more, but cap the total wait.
            while len(batch) < MAX_BATCH:
                item = await asyncio.wait_for(queue.get(), MAX_WAIT_S)
                batch.append(item)
        except asyncio.TimeoutError:
            pass  # window expired; run a partial batch

        inputs = [x for x, _ in batch]
        outputs = run_model(inputs)  # one batched forward pass
        for (_, fut), out in zip(batch, outputs):
            fut.set_result(out)

@app.on_event("startup")
async def _start():
    asyncio.create_task(batch_worker())

@app.post("/predict")
async def predict(payload: dict):
    loop = asyncio.get_running_loop()
    fut = loop.create_future()
    await queue.put((payload["x"], fut))
    return {"y": await fut}
`}</CodeBlock>
  <p><strong>Pitfalls to call out:</strong></p>
  <ul>
    <li><strong>Ordering:</strong> outputs must map back to the exact request that produced each input. The <M>{"\\texttt{zip}"}</M> by position works only if the model preserves row order; never sort or dedupe silently.</li>
    <li><strong>Exceptions:</strong> if <M>{"\\texttt{run\\_model}"}</M> throws, every waiting future hangs forever. Wrap inference in try/except and call <M>{"\\texttt{fut.set\\_exception}"}</M> on each so one bad batch does not stall all clients.</li>
    <li><strong>Timeouts and backpressure:</strong> clients need their own deadline, and the queue should be bounded so an overloaded server sheds load (return 503) instead of growing memory without limit.</li>
    <li><strong>Blocking the event loop:</strong> a synchronous CPU/GPU call inside the async worker freezes all of FastAPI. Run the model in a thread/process executor or a dedicated inference server so the event loop stays responsive.</li>
  </ul>
</InterviewProblem>

      </>
  );
}
