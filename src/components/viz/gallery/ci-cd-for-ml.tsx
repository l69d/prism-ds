"use client";

import { useState, useMemo } from "react";
import { rng, gaussian } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, VizButton, ControlGroup } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";
import { range } from "@/lib/utils";

const W = 640, H = 260, PAD = 28;

type StageStatus = "pass" | "fail" | "skip";

interface Stage {
  id: string;
  label: string;
  sublabel: string;
  status: StageStatus;
  metric: string;
  detail: string;
}

function computeStages(
  dataQuality: number,
  modelAccuracy: number,
  driftThreshold: number,
  accThreshold: number,
  seed: number,
): Stage[] {
  const r = rng(seed);
  const noise = () => gaussian(r, 0, 0.03);

  // Data validation: checks null rate, schema, distribution drift
  const nullRate = (1 - dataQuality) * 0.4 + noise();
  const schemaPassed = dataQuality > 0.35;
  const distributionDrift = (1 - dataQuality) * 0.6 + Math.abs(noise());
  const dataPass = nullRate < (1 - driftThreshold) * 0.25 + 0.05 && schemaPassed && distributionDrift < driftThreshold;

  // Model training & evaluation (only runs if data passes)
  const trainedAcc = modelAccuracy + noise();
  const baselineAcc = 0.72;
  const regression = trainedAcc < baselineAcc - 0.04;
  const modelPass = dataPass && trainedAcc >= accThreshold && !regression;

  // Shadow deployment / integration tests
  const predLatencyOk = modelAccuracy > 0.5;
  const integrationPass = modelPass && predLatencyOk && trainedAcc >= accThreshold + 0.01;

  return [
    {
      id: "data",
      label: "Data Validation",
      sublabel: "schema · null rate · drift",
      status: dataPass ? "pass" : "fail",
      metric: `drift=${distributionDrift.toFixed(2)}`,
      detail: dataPass
        ? `null=${(nullRate * 100).toFixed(1)}%  drift=${distributionDrift.toFixed(2)}`
        : `FAIL: ${!schemaPassed ? "schema error" : distributionDrift >= driftThreshold ? `drift ${distributionDrift.toFixed(2)} ≥ ${driftThreshold.toFixed(2)}` : `null ${(nullRate * 100).toFixed(1)}%`}`,
    },
    {
      id: "train",
      label: "Model Evaluation",
      sublabel: "accuracy · regression guard",
      status: !dataPass ? "skip" : modelPass ? "pass" : "fail",
      metric: `acc=${trainedAcc.toFixed(3)}`,
      detail: !dataPass
        ? "skipped (data failed)"
        : modelPass
        ? `acc=${trainedAcc.toFixed(3)} ≥ ${accThreshold.toFixed(2)}`
        : regression
        ? `FAIL: regression vs baseline (acc=${trainedAcc.toFixed(3)} < ${(baselineAcc - 0.04).toFixed(2)})`
        : `FAIL: acc=${trainedAcc.toFixed(3)} < threshold ${accThreshold.toFixed(2)}`,
    },
    {
      id: "shadow",
      label: "Integration Tests",
      sublabel: "latency · shadow deploy",
      status: !modelPass ? "skip" : integrationPass ? "pass" : "fail",
      metric: predLatencyOk ? "latency OK" : "latency SLOW",
      detail: !modelPass
        ? "skipped (model failed)"
        : integrationPass
        ? "all checks green"
        : "FAIL: latency threshold or margin too tight",
    },
    {
      id: "deploy",
      label: "Deploy to Prod",
      sublabel: "canary → full rollout",
      status: !integrationPass ? "skip" : "pass",
      metric: integrationPass ? "DEPLOYED" : "BLOCKED",
      detail: integrationPass
        ? "canary 5% → 100% rollout"
        : "blocked — earlier gate failed",
    },
  ];
}

const STATUS_COLOR: Record<StageStatus, string> = {
  pass: "var(--success)",
  fail: "var(--danger)",
  skip: "var(--muted-foreground)",
};

const STATUS_BG: Record<StageStatus, string> = {
  pass: "rgba(34,197,94,0.12)",
  fail: "rgba(239,68,68,0.12)",
  skip: "rgba(100,116,139,0.08)",
};

export default function Viz() {
  const [dataQuality, setDataQuality] = useState(0.75);
  const [modelAccuracy, setModelAccuracy] = useState(0.82);
  const [driftThreshold, setDriftThreshold] = useState(0.45);
  const [accThreshold, setAccThreshold] = useState(0.78);
  const [seed, setSeed] = useState(42);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const stages = useMemo(
    () => computeStages(dataQuality, modelAccuracy, driftThreshold, accThreshold, seed),
    [dataQuality, modelAccuracy, driftThreshold, accThreshold, seed],
  );

  const passed = stages.filter((s) => s.status === "pass").length;
  const failed = stages.filter((s) => s.status === "fail").length;

  // Pipeline layout: 4 boxes evenly spaced
  const N = stages.length;
  const boxW = 124, boxH = 72, gapX = (W - 2 * PAD - N * boxW) / (N - 1);

  const stageX = (i: number) => PAD + i * (boxW + gapX);
  const stageY = H / 2 - boxH / 2;

  const highlighted = highlightId ? stages.find((s) => s.id === highlightId) : null;

  return (
    <VizFrame
      title="CI/CD for ML"
      hint="adjust quality & thresholds — watch gates open or close"
      controls={
        <div className="space-y-3">
          <ControlGroup>
            <Slider
              label="Data quality"
              min={0.1} max={1.0} step={0.05} value={dataQuality}
              onChange={setDataQuality}
              format={(v) => `${(v * 100).toFixed(0)}%`}
            />
            <Slider
              label="Model accuracy"
              min={0.55} max={0.97} step={0.01} value={modelAccuracy}
              onChange={setModelAccuracy}
              format={(v) => v.toFixed(2)}
            />
          </ControlGroup>
          <ControlGroup>
            <Slider
              label="Drift threshold"
              min={0.1} max={0.9} step={0.05} value={driftThreshold}
              onChange={setDriftThreshold}
              format={(v) => v.toFixed(2)}
            />
            <Slider
              label="Accuracy threshold"
              min={0.6} max={0.95} step={0.01} value={accThreshold}
              onChange={setAccThreshold}
              format={(v) => v.toFixed(2)}
            />
          </ControlGroup>
          <div className="flex items-center gap-3">
            <VizButton onClick={() => setSeed((s) => s + 1)}>
              <RotateCcw size={12} /> New batch
            </VizButton>
            <span className="ml-auto text-xs text-muted-foreground">
              {failed > 0
                ? <span style={{ color: "var(--danger)" }}>{failed} gate{failed > 1 ? "s" : ""} failed · blocked</span>
                : <span style={{ color: "var(--success)" }}>all {passed} gates passed · deployed</span>
              }
            </span>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Connector arrows between boxes */}
        {range(N - 1).map((i) => {
          const x1 = stageX(i) + boxW;
          const x2 = stageX(i + 1);
          const cy = H / 2;
          const nextStatus = stages[i + 1].status;
          const color = nextStatus === "skip" ? "var(--border)" : nextStatus === "fail" ? "var(--danger)" : "var(--success)";
          return (
            <g key={i}>
              <line
                x1={x1} y1={cy} x2={x2 - 8} y2={cy}
                stroke={color} strokeWidth={nextStatus === "skip" ? 1 : 2}
                strokeDasharray={nextStatus === "skip" ? "4 3" : undefined}
                opacity={nextStatus === "skip" ? 0.4 : 0.9}
              />
              <polygon
                points={`${x2 - 8},${cy - 5} ${x2},${cy} ${x2 - 8},${cy + 5}`}
                fill={color}
                opacity={nextStatus === "skip" ? 0.3 : 0.85}
              />
            </g>
          );
        })}

        {/* Stage boxes */}
        {stages.map((stage, i) => {
          const x = stageX(i);
          const isHighlighted = highlightId === stage.id;
          const color = STATUS_COLOR[stage.status];
          return (
            <g
              key={stage.id}
              style={{ cursor: "pointer" }}
              onClick={() => setHighlightId(isHighlighted ? null : stage.id)}
            >
              <rect
                x={x} y={stageY} width={boxW} height={boxH} rx={8}
                fill={isHighlighted ? STATUS_BG[stage.status] : "var(--card)"}
                stroke={color}
                strokeWidth={isHighlighted ? 2 : 1.5}
                opacity={stage.status === "skip" ? 0.5 : 1}
              />
              {/* Status indicator dot */}
              <circle
                cx={x + boxW - 14} cy={stageY + 14} r={5}
                fill={color}
                opacity={stage.status === "skip" ? 0.4 : 1}
              />
              {/* Stage label */}
              <text
                x={x + boxW / 2} y={stageY + 24}
                textAnchor="middle" fontSize="11" fontWeight="600"
                fill={stage.status === "skip" ? "var(--muted-foreground)" : "var(--foreground)"}
              >
                {stage.label}
              </text>
              {/* Sublabel */}
              <text
                x={x + boxW / 2} y={stageY + 37}
                textAnchor="middle" fontSize="9"
                fill="var(--muted-foreground)"
              >
                {stage.sublabel}
              </text>
              {/* Metric badge */}
              <text
                x={x + boxW / 2} y={stageY + 55}
                textAnchor="middle" fontSize="9" fontFamily="monospace"
                fill={color}
                opacity={stage.status === "skip" ? 0.5 : 1}
              >
                {stage.metric}
              </text>
              {/* Status text */}
              <text
                x={x + boxW / 2} y={stageY + boxH - 6}
                textAnchor="middle" fontSize="9" fontWeight="700"
                fill={color}
                opacity={stage.status === "skip" ? 0.5 : 1}
              >
                {stage.status === "pass" ? "✓ PASS" : stage.status === "fail" ? "✗ FAIL" : "— SKIP"}
              </text>
            </g>
          );
        })}

        {/* Detail tooltip for clicked stage */}
        {highlighted && (() => {
          const idx = stages.findIndex((s) => s.id === highlighted.id);
          const bx = stageX(idx) + boxW / 2;
          const tipY = stageY - 44;
          const tipW = 200, tipH = 32;
          const clampedX = Math.min(Math.max(bx - tipW / 2, PAD), W - PAD - tipW);
          return (
            <g>
              <rect
                x={clampedX} y={tipY} width={tipW} height={tipH} rx={6}
                fill="var(--card)" stroke="var(--border)" strokeWidth="1"
              />
              <text x={clampedX + tipW / 2} y={tipY + 14} textAnchor="middle" fontSize="9" fill="var(--foreground)">
                {highlighted.detail.substring(0, 36)}
              </text>
              {highlighted.detail.length > 36 && (
                <text x={clampedX + tipW / 2} y={tipY + 26} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
                  {highlighted.detail.substring(36)}
                </text>
              )}
            </g>
          );
        })()}

        {/* Bottom pipeline label */}
        <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">
          ML CI/CD Pipeline · click any stage for details
        </text>
      </svg>
    </VizFrame>
  );
}
