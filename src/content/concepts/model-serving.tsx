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
    </>
  );
}
