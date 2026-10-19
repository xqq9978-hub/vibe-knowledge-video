import React from "react";
import {theme} from "../theme";

/** 左上角 HUD：时间戳（value="1990", caption="纽约 · 地球日"）或实时数据面板（加 unit、rows）。 */
export const HudCard: React.FC<{
  title?: string;
  value: string | number;
  unit?: string;
  caption?: string;
  valueColor?: string;
  rows?: {label: string; value: string; color?: string}[];
  scale?: number;
}> = ({title, value, unit, caption, valueColor = theme.gold, rows = [], scale = 1}) => (
  <div style={{position: "absolute", left: 44 * scale, top: 40 * scale, minWidth: 300 * scale,
    padding: `${18 * scale}px ${24 * scale}px`, background: theme.panel, border: `1.5px solid ${theme.panelBorder}`,
    borderRadius: 14 * scale, fontFamily: theme.sans, color: theme.text}}>
    {title && <div style={{fontSize: 20 * scale, color: theme.muted, marginBottom: 4 * scale}}>{title}</div>}
    <div style={{display: "flex", alignItems: "baseline", gap: 10 * scale}}>
      <span style={{fontFamily: theme.number, fontWeight: 700, fontSize: 76 * scale, lineHeight: 1,
        color: valueColor, fontVariantNumeric: "tabular-nums"}}>{value}</span>
      {unit && <span style={{fontSize: 26 * scale, fontWeight: 700}}>{unit}</span>}
    </div>
    {caption && <div style={{fontSize: 22 * scale, fontWeight: 700, marginTop: 8 * scale}}>{caption}</div>}
    {rows.map((r) => (
      <div key={r.label} style={{display: "flex", justifyContent: "space-between", gap: 24 * scale,
        fontSize: 20 * scale, marginTop: 8 * scale}}>
        <span style={{color: theme.muted}}>{r.label}</span>
        <span style={{fontWeight: 700, color: r.color ?? theme.text, fontVariantNumeric: "tabular-nums"}}>{r.value}</span>
      </div>
    ))}
  </div>
);
