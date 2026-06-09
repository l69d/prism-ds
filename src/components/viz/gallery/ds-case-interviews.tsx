"use client";

import { useState, useMemo } from "react";
import { range } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { SegButton, VizButton } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";

const W = 620, H = 296, PAD = 28;
type CaseType = "metric" | "experiment" | "modeling";
interface Choice { text: string; score: number; insight: string }
interface Step { id: string; label: string; question: string; choices: Choice[] }

const FW: Record<CaseType, { title: string; steps: Step[] }> = {
  metric: { title: "Metric Drop", steps: [
    { id: "a", label: "1 Clarify", question: "DAU dropped 15% overnight. First you ask…",
      choices: [
        { text: "Which platform / segment?", score: 3, insight: "Segment first — isolates scope fast." },
        { text: "Jump straight into SQL", score: 0, insight: "Premature — you'll pull the wrong slice." },
        { text: "Is the metric definition correct?", score: 2, insight: "Good sanity check, but segment first." },
    ]},
    { id: "b", label: "2 Decompose", question: "Mobile DAU dropped, desktop fine. You split by…",
      choices: [
        { text: "New users vs retained users", score: 3, insight: "Acquisition vs retention isolates cause." },
        { text: "Feature A vs Feature B usage", score: 1, insight: "Too granular without a hypothesis first." },
        { text: "Check for data pipeline bug", score: 2, insight: "Smart, but decompose before investigating." },
    ]},
    { id: "c", label: "3 Hypothesize", question: "New-user mobile drop is biggest. Top hypothesis?",
      choices: [
        { text: "App store update broke onboarding", score: 3, insight: "Release change + new users = perfect fit." },
        { text: "Seasonal effect", score: 1, insight: "Possible, but hard to explain a sudden drop." },
        { text: "Competitor launched a campaign", score: 2, insight: "Valid, but check internal causes first." },
    ]},
    { id: "d", label: "4 Recommend", question: "Onboarding crash rate spiked in v2.3.1. You say…",
      choices: [
        { text: "Rollback + monitor + post-mortem", score: 3, insight: "Immediate fix + process is correct." },
        { text: "A/B test the fix before rolling back", score: 0, insight: "Never A/B test a crash fix — ship it." },
        { text: "Email affected users first", score: 1, insight: "Nice, but fix first, communicate second." },
    ]},
  ]},
  experiment: { title: "A/B Experiment", steps: [
    { id: "a", label: "1 Clarify", question: "PM wants to test a new checkout flow. First ask…",
      choices: [
        { text: "What metric are we optimizing?", score: 3, insight: "No metric = no experiment. Nail it first." },
        { text: "How long should we run it?", score: 1, insight: "Duration depends on power — not first." },
        { text: "What traffic split should we use?", score: 1, insight: "Depends on power analysis — not first." },
    ]},
    { id: "b", label: "2 Size", question: "Metric is checkout CVR. You determine sample size via…",
      choices: [
        { text: "Power analysis: MDE + α + β → n", score: 3, insight: "Correct. This is the only rigorous path." },
        { text: "Run for exactly 1 week as standard", score: 0, insight: "Arbitrary. Size determines duration, not vice versa." },
        { text: "50/50 split is always correct", score: 1, insight: "Common but not always power-optimal." },
    ]},
    { id: "c", label: "3 Threats", question: "Which design threat matters most for checkout?",
      choices: [
        { text: "SUTVA: shared cart / cross-contamination", score: 3, insight: "One user can affect another's checkout." },
        { text: "Novelty effect inflating conversion", score: 2, insight: "Real risk for UI changes — monitor it." },
        { text: "Simpson's paradox in results", score: 1, insight: "Important at readout, not design phase." },
    ]},
    { id: "d", label: "4 Readout", question: "p=0.04 (α=0.05), lift = +0.3% CVR. You say…",
      choices: [
        { text: "Significant but tiny — check business value", score: 3, insight: "Statistical ≠ practical. Always check effect size." },
        { text: "Ship it — we got significance!", score: 0, insight: "Never skip practical significance. $-impact first." },
        { text: "Run longer to be more certain", score: 1, insight: "Peeking error — boundary was pre-committed." },
    ]},
  ]},
  modeling: { title: "ML Modeling", steps: [
    { id: "a", label: "1 Clarify", question: "Build a churn model. Your first question is…",
      choices: [
        { text: "What action do predictions drive?", score: 3, insight: "Model serves a decision. Know the action first." },
        { text: "What data is available?", score: 2, insight: "Important, but action determines label definition." },
        { text: "XGBoost or deep learning?", score: 0, insight: "Way too early for algorithm choice." },
    ]},
    { id: "b", label: "2 Formulate", question: "Predictions trigger retention offers. Define churn as…",
      choices: [
        { text: "No purchase in 30 days (= offer lead time)", score: 3, insight: "Label window = actionable window. Perfect." },
        { text: "Account deletion", score: 0, insight: "Too late — the offer can't help at that point." },
        { text: "Below-average usage last week", score: 1, insight: "Too noisy and not aligned to offer trigger." },
    ]},
    { id: "c", label: "3 Evaluate", question: "Retention offers cost $5 each. Best eval metric?",
      choices: [
        { text: "Precision-recall at business threshold", score: 3, insight: "Cost asymmetry → precision-recall, not accuracy." },
        { text: "Accuracy", score: 0, insight: "Imbalanced + cost asymmetry → accuracy misleads." },
        { text: "AUC-ROC", score: 2, insight: "Good for ranking; still threshold-agnostic." },
    ]},
    { id: "d", label: "4 Monitor", question: "Model is live. Most important thing to monitor?",
      choices: [
        { text: "Feature distribution shift (input drift)", score: 3, insight: "Input drift → silent prediction decay. #1 risk." },
        { text: "Server prediction latency", score: 1, insight: "Infra concern, not model health." },
        { text: "Accuracy on historical test set", score: 0, insight: "Historical test set cannot catch future drift." },
    ]},
  ]},
};

const SCORE_COLOR = (s: number) => s === 3 ? "var(--success)" : s >= 2 ? "var(--warning)" : "var(--danger)";

export default function Viz() {
  const [caseType, setCaseType] = useState<CaseType>("metric");
  const [stepIdx, setStepIdx] = useState(0);
  const [picks, setPicks] = useState<Record<string, number>>({});

  const fw = FW[caseType];
  const steps = fw.steps;
  const cur = steps[stepIdx];
  const pickedIdx = picks[cur.id];
  const totalScore = useMemo(
    () => steps.reduce((a, s) => a + (picks[s.id] !== undefined ? s.choices[picks[s.id]].score : 0), 0),
    [steps, picks]
  );
  const maxScore = steps.length * 3;
  const pct = totalScore / maxScore;
  const allDone = steps.every((s) => picks[s.id] !== undefined);
  const scoreColor = SCORE_COLOR(pct >= 0.8 ? 3 : pct >= 0.5 ? 2 : 1);

  function reset() { setPicks({}); setStepIdx(0); }
  function handleCase(c: CaseType) { setCaseType(c); setPicks({}); setStepIdx(0); }
  function pick(ci: number) { setPicks((p) => ({ ...p, [cur.id]: ci })); }

  const barW = W - 2 * PAD;
  const stepW = barW / steps.length;

  return (
    <VizFrame
      title="DS Case Interview Framework"
      hint="pick your answer at each stage"
      controls={
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(["metric", "experiment", "modeling"] as CaseType[]).map((c) => (
              <SegButton key={c} active={caseType === c} onClick={() => handleCase(c)}>
                {FW[c].title}
              </SegButton>
            ))}
            <VizButton onClick={reset} className="ml-auto"><RotateCcw size={12} /> Restart</VizButton>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-background/60 px-3 py-2 text-center text-xs">
            {([["Score", `${totalScore} / ${maxScore}`, "var(--foreground)"], ["Coverage", `${(pct*100).toFixed(0)}%`, scoreColor], ["Step", `${stepIdx+1} / ${steps.length}`, "var(--foreground)"]] as [string, string, string][]).map(([l, v, c]) => (
              <div key={l} className="space-y-0.5">
                <div className="font-mono" style={{ color: c }}>{v}</div>
                <div className="text-[10px] text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Step progress tabs */}
        {steps.map((s, i) => {
          const x = PAD + i * stepW;
          const p = picks[s.id];
          const fill = p === undefined ? (i === stepIdx ? "var(--brand-cyan)" : "var(--border)") : SCORE_COLOR(s.choices[p].score);
          return (
            <g key={s.id} style={{ cursor: "pointer" }} onClick={() => setStepIdx(i)}>
              <rect x={x+2} y={PAD} width={stepW-4} height={14} rx={4} fill={fill} opacity={i === stepIdx ? 1 : 0.55} />
              <text x={x+stepW/2} y={PAD+9.5} textAnchor="middle" fontSize="8" fontWeight={i===stepIdx?"700":"400"}
                fill={p!==undefined||i===stepIdx ? "var(--background)" : "var(--muted-foreground)"}>{s.label}</text>
            </g>
          );
        })}
        {/* Score fill bar */}
        <rect x={PAD} y={PAD+18} width={barW} height={4} rx={2} fill="var(--border)" />
        <rect x={PAD} y={PAD+18} width={barW*pct} height={4} rx={2} fill={scoreColor} />

        {/* Question */}
        <rect x={PAD} y={PAD+30} width={W-2*PAD} height={34} rx={6} fill="var(--card)" stroke="var(--border)" />
        <text x={W/2} y={PAD+46} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--foreground)">{cur.question}</text>
        <text x={W/2} y={PAD+58} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">{cur.label} — {fw.title}</text>

        {/* Choices */}
        {cur.choices.map((c, ci) => {
          const cy = PAD + 74 + ci * 42;
          const sel = pickedIdx === ci;
          const sc = SCORE_COLOR(c.score);
          return (
            <g key={ci} style={{ cursor: "pointer" }} onClick={() => pick(ci)}>
              <rect x={PAD} y={cy} width={W-2*PAD} height={34} rx={5}
                fill={sel ? sc : "var(--card)"} opacity={sel ? 0.12 : 1}
                stroke={sel ? sc : "var(--border)"} strokeWidth={sel ? 1.5 : 1} />
              {range(3).map((di) => (
                <circle key={di} cx={PAD+11+di*9} cy={cy+17} r={3.2}
                  fill={sel && di < c.score ? sc : "var(--border)"} />
              ))}
              <text x={PAD+40} y={cy+14} fontSize="10" fill="var(--foreground)" fontWeight={sel?"600":"400"}>{c.text}</text>
              <text x={PAD+40} y={cy+27} fontSize="9" fill={sel ? sc : "var(--muted-foreground)"}>
                {sel ? c.insight : "click to select"}
              </text>
            </g>
          );
        })}

        {/* Next arrow */}
        {pickedIdx !== undefined && stepIdx < steps.length-1 && (
          <g style={{ cursor: "pointer" }} onClick={() => setStepIdx((i) => i+1)}>
            <rect x={W-PAD-60} y={H-20} width={60} height={17} rx={5} fill="var(--brand-cyan)" opacity="0.9" />
            <text x={W-PAD-30} y={H-8} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--background)">Next →</text>
          </g>
        )}

        {/* Final verdict */}
        {allDone && (
          <text x={W/2} y={H-5} textAnchor="middle" fontSize="10" fontWeight="600" fill={scoreColor}>
            {pct>=0.8 ? "Strong — framework covered well." : pct>=0.5 ? "Decent, but gaps remain. Try again." : "Needs work — review the framework order."}
          </text>
        )}
      </svg>
    </VizFrame>
  );
}
