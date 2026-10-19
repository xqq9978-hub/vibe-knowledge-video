import {continueRender, delayRender, staticFile} from "remotion";

// 可选字体文件放在 public/fonts/，缺失时回退到系统字体（见 theme.ts 的字体栈）。
const FONTS: {family: string; file: string; weight: string}[] = [
  {family: "Noto Sans SC", file: "NotoSansSC-Medium.otf", weight: "500"},
  {family: "Noto Sans SC", file: "NotoSansSC-Bold.otf", weight: "700"},
  {family: "Noto Serif SC", file: "NotoSerifSC-Bold.otf", weight: "700"},
  {family: "Oswald", file: "Oswald-Bold.ttf", weight: "700"},
];

let loaded = false;
export const ensureFonts = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const handle = delayRender("加载字体");
  Promise.all(
    FONTS.map((f) =>
      new FontFace(f.family, `url(${staticFile("fonts/" + f.file)})`, {weight: f.weight})
        .load()
        .then((face) => document.fonts.add(face))
        .catch(() => console.warn(`未找到 public/fonts/${f.file}，使用系统字体`)),
    ),
  )
    .then(() => document.fonts.ready)
    .then(() => continueRender(handle));
};
