"use client";

import { useState, useMemo } from "react";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, ControlGroup } from "@/components/viz/controls";
import { clamp } from "@/lib/utils";

const W = 640, H = 310, PAD = 30;

type Frame = "technical" | "business" | "recommendation";

const TOTAL = 1000;
const ACTUAL_CHURN = 200;
const VALUE_PER_SAVE = 480;
const OUTREACH_COST = 40;

export default function Viz() {
  const [threshold, setThreshold] = useState(0.5);
  const [frame, setFrame] = useState<Frame>("technical");

  const stats = useMemo(() => {
    const sensitivity = clamp(1 - threshold * 1.1, 0.18, 0.95);
    const specificity = clamp(0.55 + threshold * 0.55, 0.55, 0.99);
    const tp = Math.round(ACTUAL_CHURN * sensitivity);
    const fn = ACTUAL_CHURN - tp;
    const fp = Math.round((TOTAL - ACTUAL_CHURN) * (1 - specificity));
    const tn = TOTAL - ACTUAL_CHURN - fp;
    const precision = tp / (tp + fp || 1);
    const recall = tp / (tp + fn || 1);
    const f1 = (2 * precision * recall) / (precision + recall || 1);
    const accuracy = (tp + tn) / TOTAL;
    const flagged = tp + fp;
    const revenue = tp * VALUE_PER_SAVE - flagged * OUTREACH_COST;
    const maxRevenue = ACTUAL_CHURN * VALUE_PER_SAVE - ACTUAL_CHURN * OUTREACH_COST;
    const efficiency = clamp(revenue / maxRevenue, 0, 1);
    return { tp, fn, fp, tn, precision, recall, f1, accuracy, flagged, revenue, efficiency };
  }, [threshold]);

  const barW = (W - PAD * 2 - 16) / 4;

  const confusionColors = [
    { label: "True Pos", val: stats.tp, fill: "var(--success)", subtitle: "Caught churn" },
    { label: "False Pos", val: stats.fp, fill: "var(--warning)", subtitle: "False alarm" },
    { label: "False Neg", val: stats.fn, fill: "var(--danger)", subtitle: "Missed churn" },
    { label: "True Neg", val: stats.tn, fill: "var(--brand-cyan)", subtitle: "Correctly kept" },
  ];

  const maxVal = TOTAL - ACTUAL_CHURN;
  const sy = (v: number) => PAD + (1 - v / maxVal) * (H - PAD * 2);
  const barH = (v: number) => (v / maxVal) * (H - PAD * 2);

  const frameMessage: Record<Frame, { title: string; lines: string[]; score: string; scoreLabel: string; color: string }> = {
    technical: {
      title: "Model Report",
      lines: [
        `Accuracy: ${(stats.accuracy * 100).toFixed(1)}%`,
        `Precision: ${(stats.precision * 100).toFixed(1)}%`,
        `Recall: ${(stats.recall * 100).toFixed(1)}%`,
        `F1 Score: ${(stats.f1 * 100).toFixed(1)}%`,
      ],
      score: (stats.f1 * 100).toFixed(1) + "%",
      scoreLabel: "F1 Score",
      color: "var(--brand-cyan)",
    },
    business: {
      title: "Business Impact",
      lines: [
        `Customers flagged: ${stats.flagged}`,
        `Churners caught: ${stats.tp} of ${ACTUAL_CHURN}`,
        `Outreach cost: $${(stats.flagged * OUTREACH_COST).toLocaleString()}`,
        `Net revenue saved: $${Math.max(0, stats.revenue).toLocaleString()}`,
      ],
      score: stats.revenue > 0 ? "$" + Math.max(0, stats.revenue).toLocaleString() : "$0",
      scoreLabel: "Net value",
      color: stats.revenue > 0 ? "var(--success)" : "var(--danger)",
    },
    recommendation: {
      title: "Stakeholder Recommendation",
      lines: threshold < 0.3
        ? ["Flag everyone at low confidence.", "High false alarm rate strains ops.", "Consider: raise threshold or triage."]
        : threshold > 0.72
        ? ["Very selective — misses ~half of churners.", "Low outreach cost, but large revenue leak.", "Consider: lower threshold to catch more."]
        : [
            `Flag top ${stats.flagged} at-risk customers.`,
            `Expected ROI: ${stats.efficiency > 0 ? ((stats.efficiency) * 100).toFixed(0) + "% of max value" : "negative — re-evaluate"}`,
            "Confidence: model ready for pilot.",
          ],
      score: threshold < 0.3 ? "Risky" : threshold > 0.72 ? "Too strict" : "Actionable",
      scoreLabel: "Readiness",
      color: threshold < 0.3 || threshold > 0.72 ? "var(--warning)" : "var(--success)",
    },
  };

  const msg = frameMessage[frame];

  return (
    <VizFrame
      title="Communicating Results"
      hint="Switch frames to see how the same model sounds to different audiences"
      controls={
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Audience frame</div>
          <div className="flex flex-wrap gap-1.5">
            <SegButton active={frame === "technical"} onClick={() => setFrame("technical")}>Technical</SegButton>
            <SegButton active={frame === "business"} onClick={() => setFrame("business")}>Business</SegButton>
            <SegButton active={frame === "recommendation"} onClick={() => setFrame("recommendation")}>Action</SegButton>
          </div>
          <ControlGroup>
            <Slider
              label="Decision threshold"
              min={0.1} max={0.9} step={0.01} value={threshold}
              onChange={setThreshold}
              format={(v) => v.toFixed(2)}
            />
          </ControlGroup>
          <div className="rounded-lg border border-border bg-card p-3 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">{msg.title}</div>
            {msg.lines.map((l, i) => (
              <div key={i} className="text-xs text-foreground leading-snug">{l}</div>
            ))}
            <div className="pt-1 border-t border-border flex items-baseline gap-2">
              <span className="text-base font-bold font-mono" style={{ color: msg.color }}>{msg.score}</span>
              <span className="text-xs text-muted-foreground">{msg.scoreLabel}</span>
            </div>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Y-axis gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const yv = maxVal * t;
          return (
            <g key={t}>
              <line x1={PAD} y1={sy(yv)} x2={W - PAD} y2={sy(yv)} stroke="var(--border)" strokeWidth={0.5} />
              <text x={PAD - 4} y={sy(yv) + 4} fontSize={8} textAnchor="end" fill="var(--muted-foreground)">
                {Math.round(yv)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {confusionColors.map((item, i) => {
          const x = PAD + i * (barW + 4);
          const h = barH(item.val);
          const y = sy(item.val);
          const isKey = frame === "business"
            ? (i === 0 || i === 3)
            : frame === "recommendation"
            ? (i === 0)
            : true;
          const dimmed = !isKey;
          return (
            <g key={i}>
              <rect
                x={x} y={y} width={barW} height={h}
                fill={item.fill}
                opacity={dimmed ? 0.22 : 0.88}
                rx={3}
              />
              <text x={x + barW / 2} y={y - 5} fontSize={9} textAnchor="middle"
                fill={dimmed ? "var(--muted-foreground)" : "var(--foreground)"}
                fontWeight={dimmed ? "400" : "600"}
                opacity={dimmed ? 0.5 : 1}
              >
                {item.val}
              </text>
              <text x={x + barW / 2} y={H - PAD + 13} fontSize={8.5} textAnchor="middle" fill="var(--muted-foreground)">
                {item.label}
              </text>
              <text x={x + barW / 2} y={H - PAD + 23} fontSize={7.5} textAnchor="middle" fill="var(--muted-foreground)" opacity={0.65}>
                {item.subtitle}
              </text>
            </g>
          );
        })}

        {/* Frame-specific annotation overlay */}
        {frame === "business" && stats.revenue > 0 && (
          <g>
            <rect x={PAD} y={PAD - 18} width={260} height={16} fill="var(--success)" opacity={0.12} rx={3} />
            <text x={PAD + 6} y={PAD - 7} fontSize={9} fill="var(--success)" fontWeight="600">
              Net: ${stats.revenue.toLocaleString()} saved — {(stats.efficiency * 100).toFixed(0)}% of theoretical max
            </text>
          </g>
        )}
        {frame === "business" && stats.revenue <= 0 && (
          <g>
            <rect x={PAD} y={PAD - 18} width={200} height={16} fill="var(--danger)" opacity={0.12} rx={3} />
            <text x={PAD + 6} y={PAD - 7} fontSize={9} fill="var(--danger)" fontWeight="600">
              Outreach costs exceed revenue — threshold too low
            </text>
          </g>
        )}
        {frame === "recommendation" && (
          <g>
            <rect x={PAD} y={PAD - 18} width={280} height={16} fill={msg.color} opacity={0.12} rx={3} />
            <text x={PAD + 6} y={PAD - 7} fontSize={9} fill={msg.color} fontWeight="600">
              {msg.score === "Actionable"
                ? `Recommend: contact ${stats.flagged} customers — estimated $${Math.max(0, stats.revenue).toLocaleString()} return`
                : msg.score === "Risky"
                ? "Too many false alarms — reduce scope before launch"
                : `Missing ${stats.fn} churners — $${(stats.fn * VALUE_PER_SAVE).toLocaleString()} revenue at risk`}
            </text>
          </g>
        )}
        {frame === "technical" && (
          <g>
            <rect x={PAD} y={PAD - 18} width={260} height={16} fill="var(--brand-cyan)" opacity={0.1} rx={3} />
            <text x={PAD + 6} y={PAD - 7} fontSize={9} fill="var(--brand-cyan)" fontWeight="600">
              F1: {(stats.f1 * 100).toFixed(1)}% · Precision: {(stats.precision * 100).toFixed(1)}% · Recall: {(stats.recall * 100).toFixed(1)}%
            </text>
          </g>
        )}

        {/* Threshold label */}
        <text x={W - PAD} y={H - PAD + 13} fontSize={8} textAnchor="end" fill="var(--muted-foreground)">
          threshold = {threshold.toFixed(2)}
        </text>
      </svg>
    </VizFrame>
  );
}
