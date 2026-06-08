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
    </>
  );
}
