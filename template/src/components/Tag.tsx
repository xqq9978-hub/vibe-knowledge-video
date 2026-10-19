import React from "react";
import {theme} from "../theme";

/** 带引线的贴附标签：(x, y) 是被指向的点，(dx, dy) 是标签相对偏移。 */
export const Tag: React.FC<{x: number; y: number; dx?: number; dy?: number; title: string; sub?: string;
  color?: string; opacity?: number}> = ({x, y, dx = 0, dy = -60, title, sub, color = theme.text, opacity = 1}) => {
  const lx = x + dx, ly = y + dy;
  return (
    <>
      {(dx !== 0 || dy !== 0) && (
        <svg style={{position: "absolute", inset: 0, overflow: "visible", opacity}} width="100%" height="100%">
          <line x1={x} y1={y} x2={lx} y2={ly} stroke={theme.muted} strokeWidth={1.5} />
          <circle cx={x} cy={y} r={4} fill={theme.light} />
        </svg>
      )}
      <div style={{position: "absolute", left: lx, top: ly, transform: "translate(-50%, -50%)", opacity,
        background: theme.panel, border: `1px solid rgba(255,255,255,0.18)`, borderRadius: 8,
        padding: "6px 14px", fontFamily: theme.sans, textAlign: "center", whiteSpace: "nowrap"}}>
        <div style={{fontSize: 26, fontWeight: 700, color}}>{title}</div>
        {sub && <div style={{fontSize: 17, color: theme.muted, marginTop: 2}}>{sub}</div>}
      </div>
    </>
  );
};
