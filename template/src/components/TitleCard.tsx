import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {theme} from "../theme";

/** 标题卡：放射光芒背景 + 英文副标题 + 金色衬线标题。 */
export const TitleCard: React.FC<{title: string; kicker?: string; sub?: string}> = ({title, kicker, sub}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 20], [0, 1], {extrapolateRight: "clamp"});
  const blur = interpolate(f, [0, 24], [12, 0], {extrapolateRight: "clamp"});
  const rays = Array.from({length: 36}).map((_, i) => `rgba(215,179,112,${i % 2 ? 0 : 0.035}) ${i * 10}deg ${(i + 1) * 10}deg`).join(",");
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 45%, #1a1712 0%, ${theme.bgDeep} 70%)`}}>
      <AbsoluteFill style={{background: `conic-gradient(from ${f * 0.05}deg at 50% 45%, ${rays})`, opacity: 0.9}} />
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 28, opacity: o}}>
        {kicker && <div style={{fontFamily: theme.serif, fontSize: 24, letterSpacing: "0.45em", color: theme.muted}}>{kicker}</div>}
        <div style={{fontFamily: theme.serif, fontWeight: 700, fontSize: 104, filter: `blur(${blur}px)`,
          background: `linear-gradient(180deg, ${theme.goldTo}, ${theme.goldFrom})`, WebkitBackgroundClip: "text",
          color: "transparent", textShadow: "0 0 40px rgba(215,179,112,0.25)"}}>{title}</div>
        {sub && <div style={{fontFamily: theme.serif, fontSize: 26, letterSpacing: "0.3em", color: theme.muted}}>{sub}</div>}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
