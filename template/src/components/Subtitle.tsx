import React from "react";
import {interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {highlight, SUBTITLE_ZONE, theme} from "../theme";

/** 解析 "给路网[[金:多加一条路]]，可能让所有人[[红:更慢]]" */
const parse = (text: string) =>
  text.split(/(\[\[[^:\]]+:[^\]]+\]\])/).filter(Boolean).map((part) => {
    const m = part.match(/^\[\[([^:\]]+):([^\]]+)\]\]$/);
    return m ? {t: m[2], color: highlight[m[1]] ?? theme.gold} : {t: part, color: undefined};
  });

/** 底部居中单行字幕，半透明深色底条。放在 <Sequence> 里使用。 */
export const Subtitle: React.FC<{text: string; durationInFrames: number}> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const portrait = height > width;
  const fade = 6;
  const opacity = interpolate(frame, [0, fade, durationInFrames - fade, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{position: "absolute", left: 0, right: 0, bottom: 0, height: height * SUBTITLE_ZONE,
      display: "flex", alignItems: "center", justifyContent: "center", opacity}}>
      <div style={{fontFamily: theme.sans, fontWeight: 700, fontSize: portrait ? 58 : 54, lineHeight: 1.3,
        color: theme.text, background: theme.subtitleBg, padding: "10px 28px", borderRadius: 12,
        letterSpacing: "0.04em", maxWidth: "84%", textAlign: "center"}}>
        {parse(text).map((p, i) => (
          <span key={i} style={p.color ? {color: p.color} : undefined}>{p.t}</span>
        ))}
      </div>
    </div>
  );
};
