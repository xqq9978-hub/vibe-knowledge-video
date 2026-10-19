# 视频工程模板

```bash
npm install
npm run studio                                      # 预览
npx remotion still Main-16x9 storyboard/shot01.png --frame=60
npx remotion render Main-16x9 out/final.mp4
```

- 镜头写在 `src/Video.tsx`，风格在 `src/theme.ts`，字幕在 `src/data/subtitles.json`（可由 `scripts/subtitle_timing.py` 生成）。
- 组件：`Subtitle`（`[[金:词]]` 上色）、`HudCard`、`Tag`、`GlowRoute`、`TitleCard`，风格色板在 `theme.ts`。
- 字体放 `public/fonts/`（NotoSansSC-Medium/Bold.otf、NotoSerifSC-Bold.otf、Oswald-Bold.ttf），缺失时回退到系统字体；音乐和音效放 `public/`，用 `staticFile()` 引用。
- 自检安全区：`npx remotion still Main-16x9 check.png --frame=60 --props='{"showSafeArea":true}'`
