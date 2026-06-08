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
      <p>A large language model is a fixed function; the only lever you control at inference time is the text you feed it. Prompt engineering is the craft of shaping that text so the model&apos;s most probable continuation is the one you actually want.</p>

      <KeyIdea>The model never &quot;understands&quot; your task abstractly &mdash; it pattern-matches your prompt against its training distribution. Good prompts move your request into a region where the right answer is the likeliest next token.</KeyIdea>

      <h2>Three workhorse techniques</h2>
      <p>Most reliable prompting reduces to combining three ideas:</p>
      <ul>
        <li><strong>Few-shot</strong>: show 2&ndash;5 input/output examples so the model infers the format and the mapping from demonstrations rather than from instructions alone.</li>
        <li><strong>Chain-of-thought (CoT)</strong>: ask the model to reason step by step before answering, which lets it spend tokens computing intermediate results instead of guessing the final answer in one shot.</li>
        <li><strong>Structured output</strong>: constrain the response to a schema (JSON, a tagged block) so a downstream program can parse it deterministically.</li>
      </ul>

      <Basic>
        <p>Think of the model as an extremely well-read intern who has read everything but remembers nothing about your specific job. If you say &quot;classify this,&quot; it guesses what you mean. If you show three worked examples first, it copies the pattern. If you say &quot;think it through, then give the answer,&quot; it slows down and makes fewer careless mistakes. And if you say &quot;reply only as JSON with keys label and confidence,&quot; you get something your code can read every time instead of a chatty paragraph.</p>
      </Basic>

      <Advanced>
        <p>Formally the model defines a distribution over the next token given the full context, and generation samples from it autoregressively:</p>
        <MB>{"p(y \\mid x) = \\prod_{t=1}^{T} p_\\theta(y_t \\mid x, y_{<t})"}</MB>
        <p>Few-shot prompting prepends demonstrations <M>{"(x_i, y_i)"}</M> to the context so the conditioning becomes <M>{"p_\\theta(y \\mid x_1, y_1, \\dots, x_k, y_k, x)"}</M>; this is in-context learning, where gradient-free adaptation happens purely through attention over the examples. Chain-of-thought inserts a latent reasoning sequence <M>{"z"}</M> and approximates marginalizing over it:</p>
        <MB>{"p(y \\mid x) = \\sum_{z} p(y \\mid z, x)\\, p(z \\mid x) \;\\approx\; p(y \\mid \\hat{z}, x)"}</MB>
        <p>Because each emitted reasoning token is fed back as input, CoT effectively increases the serial computation depth available per query &mdash; the model can realize functions it cannot compute in a single forward pass.</p>
      </Advanced>

      <h2>Where it matters</h2>
      <p>In production pipelines, prompts are an interface contract. Structured outputs let you chain an LLM step into deterministic code; few-shot examples pin down edge-case formatting; CoT raises accuracy on arithmetic, multi-hop, and tool-use tasks. The cost is tokens and latency, so you trade reasoning depth against price.</p>

      <Callout kind="pitfall" title="Don&apos;t parse a model that was told to explain">
        If you ask for chain-of-thought AND a clean JSON answer in the same response, the reasoning text often leaks into your parser. Separate them: let the model reason inside a tagged block, then emit the schema last, or make a second call that extracts only the final field.
      </Callout>

      <CodeBlock language="python" filename="structured_cot.py">{`# Few-shot + chain-of-thought + a parseable final block.
from anthropic import Anthropic
import json, re

client = Anthropic()

SYSTEM = "You label support tickets. Reason briefly, then output one JSON object."

FEWSHOT = """Ticket: "Charged twice for one order."
Reasoning: Mentions duplicate charge -> billing dispute.
{"label": "billing", "urgency": "high"}

Ticket: "How do I reset my password?"
Reasoning: Routine account help, no money at risk.
{"label": "account", "urgency": "low"}"""

def classify(ticket: str) -> dict:
    msg = client.messages.create(
        model="claude-opus-4-8",  # check /claude-api skill for current ids
        max_tokens=300,
        system=SYSTEM,
        messages=[{"role": "user",
                   "content": f"{FEWSHOT}\\n\\nTicket: \\"{ticket}\\"\\nReasoning:"}],
    )
    text = msg.content[0].text
    # Take the LAST JSON object so reasoning text never confuses the parser.
    match = re.findall(r"\\{[^{}]*\\}", text)
    return json.loads(match[-1])

print(classify("My card was declined but I was still billed."))`}</CodeBlock>

      <MoreDepth>
        <p>Few-shot is not free accuracy: example selection and ordering matter, and models exhibit a recency bias toward the last demonstration and a majority-label bias when classes are imbalanced in your shots. CoT can also <em>hurt</em> on tasks where the answer is immediate (it adds variance and tokens), and the verbalized reasoning is not guaranteed to be faithful &mdash; the model may produce a plausible explanation that did not actually drive the answer. Treat the reasoning trace as an accuracy aid, not as an audit trail. For hard guarantees, prefer constrained decoding or schema-validated tool calls over free-text JSON, and version your prompts the way you version code.</p>
      </MoreDepth>

      <Quiz question="Why does chain-of-thought prompting often improve accuracy on multi-step reasoning tasks?" options={[
        { text: "It retrains the model&apos;s weights on the new examples at inference time.", why: "In-context prompting changes no weights; there is no gradient update during generation." },
        { text: "Emitted reasoning tokens are fed back as context, giving the model more serial compute steps before committing to an answer.", correct: true, why: "Each generated token conditions the next, so writing intermediate steps lets the model compute results it cannot reach in one forward pass." },
        { text: "It forces the output into a strict JSON schema that the model cannot violate.", why: "That describes structured output / constrained decoding, not chain-of-thought, which produces free-text reasoning." },
        { text: "It reduces the number of tokens generated, lowering latency and error.", why: "CoT increases token count and latency; the benefit comes from added reasoning steps, not from brevity." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="What is the difference between zero-shot, few-shot, and chain-of-thought prompting, and when would you reach for each?" difficulty="easy" tag="Conceptual">
  <p><strong>Zero-shot</strong> gives only the instruction and trusts the model&apos;s pretrained priors: &quot;Classify the sentiment of this review.&quot; It is cheapest in tokens and best when the task is common and the output format is simple.</p>
  <p><strong>Few-shot</strong> prepends a handful of input&rarr;output exemplars before the real query. The exemplars do two jobs: they pin down the <strong>output format</strong> and they disambiguate the <strong>task definition</strong> (e.g. your idiosyncratic label set). Reach for it when the model keeps drifting in format, when labels are non-obvious, or when you cannot fine-tune.</p>
  <p><strong>Chain-of-thought (CoT)</strong> asks the model to produce intermediate reasoning before the answer (&quot;think step by step&quot;). It helps on multi-step problems &mdash; arithmetic, logic, multi-hop QA &mdash; because it lets the model spend more forward-pass compute and condition each token on its own prior reasoning.</p>
  <ul>
    <li>Heuristic: simple/common task &rarr; zero-shot; format or label ambiguity &rarr; few-shot; multi-step reasoning &rarr; CoT (often combined: few-shot CoT).</li>
    <li>Costs: each exemplar and each reasoning token is paid for on <strong>every</strong> call, so CoT and large few-shot prompts trade latency and money for accuracy.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="You need an LLM to return JSON your downstream parser can consume, but ~8% of responses are malformed (extra prose, trailing commas, hallucinated keys). How would you drive that failure rate down?" difficulty="medium" tag="Applied">
  <p>Treat it as an engineering problem, not a prompting trick. Layer defenses from cheapest to strongest:</p>
  <ul>
    <li><strong>Constrain at decode time first.</strong> If the provider supports it, use a real structured-output mode (JSON schema / grammar-constrained or tool-call &quot;function&quot; arguments). This makes invalid JSON essentially impossible because the decoder can only emit tokens the grammar permits &mdash; far more reliable than asking nicely.</li>
    <li><strong>Specify the schema explicitly</strong> with field names, types, and an example object. Few-shot examples of the exact JSON shape sharply reduce drift, especially for optional vs required fields.</li>
    <li><strong>Suppress the prose.</strong> Tell it to output only the object, no markdown fences, no commentary. Set a stop sequence and, if needed, prefill the assistant turn with an opening brace so the model cannot start with chatter.</li>
    <li><strong>Validate and repair.</strong> Parse with a schema validator (e.g. Pydantic). On failure, send the validator&apos;s error back in a short repair turn &mdash; one retry recovers most residual cases.</li>
  </ul>
  <p>Measure it: log a <strong>schema-valid rate</strong> on a held-out set and treat any regression as a release blocker. Lowering temperature also tightens format adherence at a small cost to diversity.</p>
  <CodeBlock language="python" filename="structured_output.py">{`from pydantic import BaseModel, ValidationError
import json

class Review(BaseModel):
    sentiment: str   # "positive" | "negative" | "neutral"
    score: float     # 0..1

def parse_or_repair(raw, ask_model):
    try:
        return Review.model_validate_json(raw)
    except ValidationError as e:
        # one cheap repair turn: hand the error back to the model
        fixed = ask_model(
            "Your JSON was invalid. Errors:\\n"
            + str(e)
            + "\\nReturn ONLY corrected JSON, no prose:\\n"
            + raw
        )
        return Review.model_validate_json(fixed)
`}</CodeBlock>
</InterviewProblem>
<InterviewProblem question="A teammate claims chain-of-thought always improves accuracy, so they enable it everywhere. Why is that wrong, and how would you decide where CoT actually pays off?" difficulty="medium" tag="Conceptual">
  <p>CoT is not a free win &mdash; it is a compute-for-accuracy trade with real downsides:</p>
  <ul>
    <li><strong>No gain (or loss) on simple tasks.</strong> For lookup or single-step classification, extra reasoning adds latency and tokens while occasionally <strong>rationalizing</strong> a wrong answer it would otherwise have gotten right.</li>
    <li><strong>The reasoning is not a faithful audit trail.</strong> The stated steps can be post-hoc and still land on a wrong answer, so do not treat CoT text as ground-truth explanation.</li>
    <li><strong>Cost and latency scale with reasoning length</strong> on every call, which matters for high-QPS or budget-bound systems.</li>
    <li><strong>Leakage risk.</strong> Verbose reasoning may surface intermediate content you did not want in the final output unless you separate &quot;thinking&quot; from the user-facing answer.</li>
  </ul>
  <p>Decide empirically: build an eval set, run with and without CoT, and compare accuracy <strong>and</strong> cost/latency. Keep CoT only where the accuracy lift clears your latency/cost budget &mdash; typically multi-step math, logic, planning, and multi-hop retrieval. For everything else, prefer zero- or few-shot. If you want the accuracy without the verbose output, consider self-consistency (sample several reasoning paths, majority-vote the answer) where the gain justifies the extra samples.</p>
</InterviewProblem>
<InterviewProblem question="You build a few-shot classifier with k exemplars in the prompt. Costs are rising. Given an input prompt of P tokens plus E tokens per exemplar and an output of O tokens, write the per-call token cost and reason about how to cut it without hurting accuracy." difficulty="hard" tag="Math">
  <p>With <M>{"k"}</M> exemplars, every call processes the instruction, all exemplars, the query, and the generated output. If input and output are priced at <M>{"c_{in}"}</M> and <M>{"c_{out}"}</M> per token:</p>
  <MB>{"\\text{cost} = c_{in}\\,(P + kE) + c_{out}\\,O"}</MB>
  <p>The exemplar term <M>{"c_{in}\\,kE"}</M> is paid on <strong>every single call</strong>, so it dominates at scale. Levers, cheapest first:</p>
  <ul>
    <li><strong>Prompt caching.</strong> The instruction and exemplars are a fixed prefix. Caching it changes the recurring exemplar cost from full price to a small cached-read price <M>{"c_{cache}\\ll c_{in}"}</M>, giving roughly <M>{"c_{cache}\\,(P+kE) + c_{in}\\,Q + c_{out}\\,O"}</M> where <M>{"Q"}</M> is the per-call query length. This is usually the single biggest win and costs no accuracy.</li>
    <li><strong>Shrink k.</strong> Few-shot accuracy typically rises fast for the first few exemplars then plateaus, so the marginal exemplar past the knee buys little. Sweep <M>{"k"}</M> on a held-out set and pick the smallest <M>{"k"}</M> within a tolerance of peak accuracy.</li>
    <li><strong>Choose exemplars better.</strong> Diverse, hard, correctly-labeled exemplars beat many redundant easy ones, so a smaller curated set can match a larger random one.</li>
    <li><strong>Distill.</strong> If volume is high and the task is stable, fine-tune a smaller model on the few-shot behavior &mdash; that folds the exemplars into the weights, dropping <M>{"kE"}</M> to zero per call.</li>
  </ul>
  <p>Numeric feel: at <M>{"P=200"}</M>, <M>{"E=80"}</M>, <M>{"k=10"}</M>, the exemplars are <M>{"800"}</M> of <M>{"1000"}</M> input tokens &mdash; 80% of input cost is the fixed prefix, which is exactly the part caching makes nearly free.</p>
</InterviewProblem>

      </>
  );
}
