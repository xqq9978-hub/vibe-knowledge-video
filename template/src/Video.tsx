import React from "react";
import {AbsoluteFill, Easing, interpolate, interpolateColors, random, Sequence, useCurrentFrame, useVideoConfig} from "remotion";
import {GlowRoute} from "./components/GlowRoute";
import {HudCard} from "./components/HudCard";
import {SafeArea} from "./components/SafeArea";
import {Subtitle} from "./components/Subtitle";
import {Tag} from "./components/Tag";
import {TitleCard} from "./components/TitleCard";
import {ensureFonts} from "./fonts";
import {SUBTITLE_ZONE, theme} from "./theme";
import subtitles from "./data/subtitles.json";

// 示例：标题卡 + 发光沙盘模型。演示 HUD、标签、发光路线、颜色即状态、关键词字幕。
// 替换成当前项目的镜头；同一套组件既用于 `remotion still` 渲染分镜，也用于渲染动画。

const ease = {easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const};

const CityTexture: React.FC = () => {
  const {width, height} = useVideoConfig();
  const size = 46;
  const cells = [];
  for (let y = 0; y < height; y += size) for (let x = 0; x < width; x += size) {
    const r = random(`c${x}-${y}`);
    if (r > 0.55) cells.push(<rect key={`${x}-${y}`} x={x + 6} y={y + 6} width={size - 12} height={size - 12} rx={3}
      fill={r > 0.985 ? "rgba(76,208,125,0.12)" : `rgba(150,170,210,${0.015 + r * 0.03})`} />);
  }
  return <svg style={{position: "absolute", inset: 0}} width={width} height={height}>{cells}</svg>;
};

const Model: React.FC = () => {
  const frame = useCurrentFrame(); // 本 Sequence 内的帧
  const {width, height} = useVideoConfig();
  const s = Math.min(width / 1920, (height * (1 - SUBTITLE_ZONE)) / 900);
  const cx = width / 2, cy = height * (1 - SUBTITLE_ZONE) * 0.52;
  const P = (x: number, y: number): [number, number] => [cx + x * s, cy + y * s];
  const home = P(-560, 40), work = P(560, -20);
  const upper = [home, P(-360, -120), P(-120, -230), P(160, -250), P(420, -150), work];
  const lower = [home, P(-380, 180), P(-120, 260), P(160, 250), P(420, 140), work];
  const bridgeTop = P(-120, -230), bridgeBot = P(160, 250);

  const draw = interpolate(frame, [0, 45], [0, 1], ease);
  const bridge = interpolate(frame, [90, 130], [0, 1], ease);
  const jam = interpolate(frame, [190, 240], [0, 1], ease);
  const minutes = Math.round(interpolate(frame, [0, 120, 150, 190, 250], [65, 65, 40, 40, 80], ease));
  const jamColor = interpolateColors(jam, [0, 1], [theme.light, theme.red]);
  const minuteColor = minutes > 65 ? theme.red : minutes < 65 ? theme.cyanGlow : theme.gold;

  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, #121a2c 0%, ${theme.bg} 75%)`}}>
      <CityTexture />
      <GlowRoute points={upper.slice(0, 3)} frame={frame} progress={draw} color={jamColor} seed="u1" dots={30 + jam * 50} speed={0.004 - jam * 0.003} />
      <GlowRoute points={upper.slice(2)} frame={frame} progress={draw} color={theme.light} seed="u2" dots={40 - jam * 30} />
      <GlowRoute points={lower.slice(0, 4)} frame={frame} progress={draw} color={theme.light} seed="l1" dots={40 - jam * 30} />
      <GlowRoute points={lower.slice(3)} frame={frame} progress={draw} color={jamColor} seed="l2" dots={30 + jam * 50} speed={0.004 - jam * 0.003} />
      {bridge > 0 && <GlowRoute points={[bridgeTop, bridgeBot]} frame={frame} progress={bridge} color={theme.cyanGlow} seed="b" width={22} dots={50} speed={0.006} />}
      <Tag x={home[0]} y={home[1]} dy={-56} title="家" opacity={draw} />
      <Tag x={work[0]} y={work[1]} dy={-56} title="公司" opacity={draw} />
      {bridge > 0.9 && <Tag x={(bridgeTop[0] + bridgeBot[0]) / 2} y={(bridgeTop[1] + bridgeBot[1]) / 2} dx={170 * s} dy={-30 * s}
        title="新路：0 分钟" color={theme.cyanGlow} opacity={interpolate(frame, [130, 145], [0, 1], ease)} />}
      <HudCard title="你的通勤" value={minutes} unit="分钟" valueColor={minuteColor} scale={Math.max(0.8, s)}
        rows={[{label: "示意模型", value: "4000 辆车"}]} />
    </AbsoluteFill>
  );
};

export const totalFrames = Math.max(...subtitles.map((s) => s.from + s.durationInFrames));

export const Video: React.FC<{showSafeArea?: boolean}> = ({showSafeArea = false}) => {
  ensureFonts();
  return (
    <AbsoluteFill style={{background: theme.bg}}>
      <Sequence durationInFrames={100}>
        <TitleCard kicker="VIBE KNOWLEDGE · DEMO" title="示例：一个反直觉的问题" sub="替换为你的标题" />
      </Sequence>
      <Sequence from={90}>
        <Model />
      </Sequence>
      {subtitles.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.durationInFrames}>
          <Subtitle text={s.text} durationInFrames={s.durationInFrames} />
        </Sequence>
      ))}
      <SafeArea show={showSafeArea} />
    </AbsoluteFill>
  );
};
