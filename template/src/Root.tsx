import React from "react";
import {Composition} from "remotion";
import {Video, totalFrames} from "./Video";

export const FPS = 30;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main-16x9" component={Video} durationInFrames={totalFrames} fps={FPS} width={1920} height={1080} />
    <Composition id="Main-9x16" component={Video} durationInFrames={totalFrames} fps={FPS} width={1080} height={1920} />
  </>
);
