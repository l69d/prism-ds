"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, linspace } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, ControlGroup } from "@/components/viz/controls";
import { range } from "@/lib/utils";

const W = 640, H = 320, PAD = 28;

// Network architecture: 5 layers (pretrained) + 1 task head
const LAYER_SIZES = [4, 8, 8, 6, 6, 3];
const N_LAYERS = LAYER_SIZES.length; // 6 total layers (0..5)
const TOTAL_PRETRAINED = N_LAYERS - 1; // layers 0..4 are pretrained body; layer 5 is head (always trainable)

function layerX(l: number): number {
  return PAD + (l / (N_LAYERS - 1)) * (W - 2 * PAD);
}
function nodeY(count: number, i: number): number {
  return H / 2 + (i - (count - 1) / 2) * (H / (count + 1));
}

// Simulate accuracy: more unfrozen layers + more data = better, with diminishing returns
function simulateAccuracy(unfreeze: number, dataN: number, taskSimilar: boolean): number {
  const taskBonus = taskSimilar ? 0.12 : 0;
  // frozen features carry most signal; unfreezing helps when data is sufficient
  const dataFactor = 1 - Math.exp(-dataN / 200);
  const freezeBonus = (TOTAL_PRETRAINED - unfreeze) * 0.025; // frozen = regularization benefit (small data)
  const unfreezeBonus = unfreeze * 0.04 * dataFactor;         // unfreezing helps when data is large
  const base = 0.55 + taskBonus + freezeBonus + unfreezeBonus;
  return Math.min(0.97, Math.max(0.42, base));
}

export default function Viz() {
  const [unfreeze, setUnfreeze] = useState(1);
  const [dataN, setDataN] = useState(150);
  const [task, setTask] = useState<"similar" | "different">("similar");

  const accuracy = useMemo(
    () => simulateAccuracy(unfreeze, dataN, task === "similar"),
    [unfreeze, dataN, task],
  );

  // Generate stable node positions via seed
  const nodeData = useMemo(() => {
    const r = rng(42);
    return LAYER_SIZES.map((count, l) =>
      range(count).map((i) => ({
        x: layerX(l),
        y: nodeY(count, i) + gaussian(r, 0, 2),
      })),
    );
  }, []);

  // A layer is frozen if it's in the pretrained body AND not among the last `unfreeze` pretrained layers
  // Layer 5 (head) is ALWAYS trainable
  const isLayerFrozen = (l: number): boolean => {
    if (l === N_LAYERS - 1) return false; // head always trainable
    const pretrainedIdx = l; // layers 0..4 are pretrained
    const frozenCount = TOTAL_PRETRAINED - unfreeze;
    return pretrainedIdx < frozenCount;
  };

  // Loss curve data: shows convergence speed
  const lossCurve = useMemo(() => {
    const r = rng(99 + unfreeze * 7 + Math.floor(dataN / 50));
    return linspace(0, 1, 40).map((t) => {
      const noise = gaussian(r, 0, 0.012);
      const decayRate = 3 + unfreeze * 0.5 + dataN * 0.005;
      return Math.max(0.05, 0.8 * Math.exp(-decayRate * t) + 0.08 + noise);
    });
  }, [unfreeze, dataN]);

  // Mini loss chart layout
  const CW = 148, CH = 90, CP = 18;
  const lossMax = 0.85;
  const lx = (i: number) => CP + (i / (lossCurve.length - 1)) * (CW - CP - 6);
  const ly = (v: number) => CH - CP - ((Math.min(v, lossMax) / lossMax) * (CH - CP - 8));
  const lossPath = lossCurve.map((v, i) => `${lx(i).toFixed(1)},${ly(v).toFixed(1)}`).join(" L");

  const frozenCount = TOTAL_PRETRAINED - unfreeze;
  const pct = Math.round(accuracy * 100);
  const accColor = pct >= 82 ? "var(--success)" : pct >= 68 ? "var(--warning)" : "var(--danger)";

  return (
    <VizFrame
      title="Transfer Learning"
      hint="unfreeze layers and watch accuracy change"
      controls={
        <div className="space-y-4">
          <ControlGroup>
            <Slider
              label="Unfreeze layers (fine-tune)"
              min={0}
              max={TOTAL_PRETRAINED}
              step={1}
              value={unfreeze}
              onChange={(v) => setUnfreeze(v)}
              format={(v) => `${v} / ${TOTAL_PRETRAINED}`}
            />
            <Slider
              label="New-task training samples"
              min={20}
              max={600}
              step={10}
              value={dataN}
              onChange={(v) => setDataN(v)}
              format={(v) => `${v}`}
            />
          </ControlGroup>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted-foreground">Task similarity:</span>
            <SegButton active={task === "similar"} onClick={() => setTask("similar")}>Similar domain</SegButton>
            <SegButton active={task === "different"} onClick={() => setTask("different")}>Different domain</SegButton>
            <span className="ml-auto text-xs text-muted-foreground">
              val accuracy{" "}
              <span className="font-mono font-semibold text-sm" style={{ color: accColor }}>
                {pct}%
              </span>
            </span>
          </div>
        </div>
      }
    >
      <div className="flex gap-4 items-start">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full flex-1">
          {/* Background bands: frozen vs trainable */}
          {range(N_LAYERS - 1).map((l) => {
            const x0 = layerX(l) - 22;
            const x1 = layerX(l + 1) + 22;
            const frozen = isLayerFrozen(l) && isLayerFrozen(l + 1);
            return frozen ? (
              <rect key={`band-${l}`} x={x0} y={PAD} width={x1 - x0} height={H - 2 * PAD}
                fill="var(--muted)" opacity="0.18" rx="6" />
            ) : null;
          })}

          {/* Edges between layers */}
          {range(N_LAYERS - 1).map((l) =>
            nodeData[l].map((src, i) =>
              nodeData[l + 1].slice(0, Math.min(4, nodeData[l + 1].length)).map((dst, j) => {
                const frozen = isLayerFrozen(l);
                return (
                  <line key={`e-${l}-${i}-${j}`}
                    x1={src.x} y1={src.y} x2={dst.x} y2={dst.y}
                    stroke={frozen ? "var(--muted-foreground)" : "var(--brand-indigo)"}
                    strokeWidth="0.8"
                    opacity={frozen ? 0.12 : 0.22}
                  />
                );
              })
            )
          )}

          {/* Nodes */}
          {nodeData.map((nodes, l) =>
            nodes.map((nd, i) => {
              const frozen = isLayerFrozen(l);
              const isHead = l === N_LAYERS - 1;
              const fill = isHead
                ? "var(--brand-cyan)"
                : frozen
                ? "var(--muted-foreground)"
                : "var(--brand-indigo)";
              const r = l === 0 ? 5 : isHead ? 7 : 5.5;
              return (
                <circle key={`n-${l}-${i}`}
                  cx={nd.x} cy={nd.y} r={r}
                  fill={fill}
                  stroke="var(--background)"
                  strokeWidth="1.5"
                  opacity={frozen ? 0.45 : 1}
                />
              );
            })
          )}

          {/* Lock icons (text) for frozen layers */}
          {range(N_LAYERS - 1).map((l) =>
            isLayerFrozen(l) ? (
              <text key={`lock-${l}`} x={layerX(l)} y={PAD - 8}
                textAnchor="middle" fontSize="11" fill="var(--muted-foreground)" opacity="0.7">
                🔒
              </text>
            ) : null
          )}

          {/* Layer labels */}
          {range(N_LAYERS).map((l) => {
            const label = l === 0 ? "input" : l === N_LAYERS - 1 ? "head" : `layer ${l}`;
            const frozen = isLayerFrozen(l);
            return (
              <text key={`lbl-${l}`} x={layerX(l)} y={H - 6}
                textAnchor="middle" fontSize="9"
                fill={frozen ? "var(--muted-foreground)" : l === N_LAYERS - 1 ? "var(--brand-cyan)" : "var(--brand-indigo)"}
                opacity={frozen ? 0.6 : 1}
              >
                {label}
              </text>
            );
          })}

          {/* Pretrained label */}
          <text x={(layerX(0) + layerX(TOTAL_PRETRAINED - 1)) / 2} y={12}
            textAnchor="middle" fontSize="9" fill="var(--muted-foreground)" opacity="0.8">
            ← pretrained body ({frozenCount} frozen, {unfreeze} fine-tuned) →
          </text>
        </svg>

        {/* Mini loss chart */}
        <div className="shrink-0 rounded-xl border border-border bg-card p-2 mt-1">
          <div className="mb-1 text-[10px] font-medium text-muted-foreground">training loss</div>
          <svg viewBox={`0 0 ${CW} ${CH}`} width={CW} height={CH}>
            <line x1={CP} y1={CH - CP} x2={CW - 4} y2={CH - CP} stroke="var(--border)" strokeWidth="1" />
            <line x1={CP} y1={8} x2={CP} y2={CH - CP} stroke="var(--border)" strokeWidth="1" />
            <path d={`M${lossPath}`} fill="none" stroke="var(--brand-indigo)" strokeWidth="2" />
            <circle cx={lx(lossCurve.length - 1)} cy={ly(lossCurve[lossCurve.length - 1])} r="3"
              fill="var(--brand-indigo)" />
            <text x={CP + 2} y={CH - CP + 10} fontSize="8" fill="var(--muted-foreground)">epochs →</text>
          </svg>
          <div className="mt-1 flex flex-col gap-0.5 text-[10px] text-muted-foreground">
            <span>
              <span className="font-semibold" style={{ color: "var(--brand-indigo)" }}>■</span> fine-tune loss
            </span>
            <span className="text-[9px]">
              {unfreeze === 0 ? "head only (fastest)" : unfreeze === TOTAL_PRETRAINED ? "full model (slowest)" : `${unfreeze} layers unfrozen`}
            </span>
          </div>
        </div>
      </div>
    </VizFrame>
  );
}
