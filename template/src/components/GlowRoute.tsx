import React from "react";
import {random} from "remotion";
import {theme} from "../theme";

/** 发光路线：半透明管道 + 流动光点。光点代表实体（车流、人流），密度/速度表示流量与快慢。
 * points 为折线顶点；progress 0–1 控制路线绘制进度；frame 驱动光点流动（确定性）。 */
export const GlowRoute: React.FC<{
  points: [number, number][];
  frame: number;
  color?: string;
  progress?: number;
  dots?: number;
  speed?: number; // 每帧移动的路线比例
  width?: number;
  seed?: string;
}> = ({points, frame, color = theme.light, progress = 1, dots = 60, speed = 0.002, width = 16, seed = "r"}) => {
  const segs = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  const total = segs.reduce((a, b) => a + b, 0);
  const at = (t: number): [number, number] => {
    let d = t * total;
    for (let i = 0; i < segs.length; i++) {
      if (d <= segs[i] || i === segs.length - 1) {
        const k = segs[i] ? Math.min(1, d / segs[i]) : 0;
        return [points[i][0] + (points[i + 1][0] - points[i][0]) * k, points[i][1] + (points[i + 1][1] - points[i][1]) * k];
      }
      d -= segs[i];
    }
    return points[points.length - 1];
  };
  const path = points.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
  const id = `glow-${seed}`;
  return (
    <svg style={{position: "absolute", inset: 0, overflow: "visible"}} width="100%" height="100%">
      <defs>
        <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={6} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d={path} fill="none" stroke={color} strokeOpacity={0.18} strokeWidth={width} strokeLinecap="round"
        strokeLinejoin="round" pathLength={1} strokeDasharray={`${progress} 1`} />
      <path d={path} fill="none" stroke={color} strokeOpacity={0.55} strokeWidth={2} pathLength={1}
        strokeDasharray={`${progress} 1`} filter={`url(#${id})`} />
      {Array.from({length: dots}).map((_, i) => {
        const t = (random(`${seed}-${i}`) + frame * speed) % 1;
        if (t > progress) return null;
        const [x, y] = at(t);
        const off = (random(`${seed}-o-${i}`) - 0.5) * width * 0.5;
        return <circle key={i} cx={x} cy={y + off} r={2.6} fill={color} filter={`url(#${id})`} />;
      })}
    </svg>
  );
};
