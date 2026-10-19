import React from "react";
import {AbsoluteFill, useVideoConfig} from "remotion";
import {SUBTITLE_ZONE} from "../theme";

/** 调试用：显示字幕安全区。渲染分镜自检时可临时打开。 */
export const SafeArea: React.FC<{show?: boolean}> = ({show = false}) => {
  const {height} = useVideoConfig();
  if (!show) return null;
  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      <div style={{position: "absolute", left: 0, right: 0, bottom: 0, height: height * SUBTITLE_ZONE,
        border: "2px dashed rgba(255,92,92,0.8)", background: "rgba(255,92,92,0.08)"}} />
    </AbsoluteFill>
  );
};
