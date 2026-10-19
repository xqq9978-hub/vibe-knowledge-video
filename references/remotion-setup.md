# Remotion 环境与渲染

## 1. 检查环境

```bash
node -v      # 需要 Node 18 及以上
ffmpeg -version && ffprobe -version
python3 -c "import numpy; print(numpy.__version__)"
fc-list | grep -i "Noto Sans SC"   # 可选，模板会优先加载 public/ 中的字体
```

缺少 numpy 时：`pip install numpy`。缺少 ffmpeg 时按系统安装（macOS：`brew install ffmpeg`；Ubuntu：`sudo apt install ffmpeg`）。

## 2. 创建工程

```bash
cp -r <skill目录>/template <项目名>
cd <项目名>
npm install          # 首次需要联网，之后生成 package-lock.json
```

字体（SIL OFL 许可，可从 Google Fonts 下载）放到 `public/fonts/`：`NotoSansSC-Medium.otf`、`NotoSansSC-Bold.otf`、`NotoSerifSC-Bold.otf`、`Oswald-Bold.ttf`。缺失时回退到系统字体（见 `src/theme.ts` 字体栈）。

## 3. 切换画幅

`src/Root.tsx` 已注册两个合成：
- `Main-16x9`：1920×1080
- `Main-9x16`：1080×1920

镜头内容写在 `src/Video.tsx`，用 `useVideoConfig()` 读取宽高做自适应布局。

## 4. 预览与渲染

```bash
npx remotion studio                                   # 浏览器预览
npx remotion still Main-16x9 storyboard/shot01.png --frame=45   # 分镜静帧
npx remotion render Main-16x9 out/preview20.mp4 --frames=0-599 # 前20秒
npx remotion render Main-16x9 out/final.mp4                     # 全片
```

分镜总览拼图：
```bash
magick montage storyboard/shot*.png -tile 4x -geometry 480x270+8+8 -background "#222" storyboard/overview.png
# 或：ffmpeg -pattern_type glob -i 'storyboard/shot*.png' -vf "scale=480:-1,tile=4x3" storyboard/overview.png
```

## 5. 确定性要求

- 所有动画只依赖 `useCurrentFrame()`；随机数用 `random("seed")`。
- 用 `delayRender`/`continueRender`（模板已对字体处理）等资源就绪。
- 不用 CSS `animation`/`transition`、`Date.now()`、`Math.random()`。

## 6. 加入音频

```tsx
import {Audio, Sequence, staticFile} from "remotion";
<Audio src={staticFile("music/vibe-knowledge-tune.wav")} volume={(f) => duck(f)} />
<Sequence from={beatFrame}><Audio src={staticFile("sfx/pluck_01.wav")} /></Sequence>
```

音乐和音效文件放在 `public/`，通过 `staticFile()` 引用。使用本地音乐 Vibe Knowledge Tune 时：

```bash
mkdir -p public/music && cp <skill目录>/assets/music/vibe-knowledge-tune.wav public/music/
```

## 7. 常见问题

| 现象 | 处理 |
|---|---|
| 打包时报 `typescript.sys.readFile` 未定义 | TypeScript 7 与当前 Remotion 打包器不兼容，安装 TypeScript 5：`npm i -D typescript@5` |
| 提示 Remotion 包版本不一致 | 所有 `remotion`、`@remotion/*` 固定为同一版本，去掉 `^` |
| 中文显示为方块 | 确认 `public/fonts/` 下的字体存在，或系统已安装 Noto Sans SC / Noto Serif SC |
| 渲染结果每次不同 | 检查是否用了 `Math.random()`、`Date.now()` 或 CSS 动画 |
