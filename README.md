# Vibe 知识大赏视频 Skill

用 [Remotion](https://www.remotion.dev/) 制作**无旁白、中文字幕**的原创知识科普短片。支持 16:9 横屏（1920×1080）和 9:16 竖屏（1080×1920），30fps。

默认视觉风格"夜景沙盘"：深海军蓝夜景底、发光路线与流动光点、颜色即状态、左上角 HUD 数据卡、带引线标签、关键词上色字幕、金色衬线标题卡。模板已内置这些组件，开箱即可渲染。

## 工作流程

| 阶段 | 做什么 | 交付 | 核对点 |
|---|---|---|---|
| 1 选题 | 推荐10题并精选3题；已有主题则直接确认 | 选题清单 | 确认主题、画幅、片长 |
| 2 分镜 | 核实知识，设计字幕与画面，用 Remotion 渲染真实静帧 | 总览拼图、每镜大图、前后对比图、分镜表 | 批准分镜 + 选择制作模式 + 提供音乐 |
| 3 动画与声音 | 分析音乐卡点，逐帧动画，代码合成音效，混音检查 | MP4、Remotion 工程、卡点表、检查报告 | 验收成片 |

阶段3可以选择**先做前20秒**预览，确认后再做全片；也可以**直接做全片**（仍会先做内部短段检查）。

## 安装

把整个 `vibe-knowledge-video` 文件夹放进你所用助手的技能目录，确保 `SKILL.md` 直接位于该文件夹下：

| 助手 | 路径 |
|---|---|
| Claude Code | `~/.claude/skills/vibe-knowledge-video/` |
| Codex | `~/.codex/skills/vibe-knowledge-video/` |

```bash
git clone https://github.com/<你的用户名>/vibe-knowledge-video.git ~/.claude/skills/vibe-knowledge-video
```

也可以直接让 AI 帮你安装：

```text
请把 https://github.com/<你的用户名>/vibe-knowledge-video 安装为我的技能（skills）。
```

已有同名技能时请先备份。

## 使用

```text
使用 vibe-knowledge-video 技能帮我做一条知识短片。
先推荐10个选题，每个阶段都和我确认。
```

使用本地背景音乐（先把文件放进 `assets/music/`，见该目录 README）：

```text
使用 vibe-knowledge-video 技能帮我做一条知识短片，
背景音乐用本地的 Vibe Knowledge Tune。
```

Codex 中可以写 `$vibe-knowledge-video`。你可以提供主题、喜欢的视频或图片、背景音乐和目标片长；不要提供密钥或密码。

## 背景音乐（需自己准备）

由于版权原因，**本仓库不附带任何音乐**。使用前请自己准备一首背景音乐，放到：

```text
assets/music/vibe-knowledge-tune.wav
```

去哪里找？详见 [references/music-guide.md](references/music-guide.md)，简单来说：

1. **可商用曲库（最推荐）**：剪映"可商用"音乐、YouTube 音频库、Pixabay Music、Free Music Archive。
2. **抖音站内音乐**：在抖音收藏喜欢的配乐，去正规渠道找同一首用于制作；发布时选用站内同名音乐。
3. **从视频中分离音频**：用剪映的"提取音乐"或 ffmpeg，只限你有权使用的视频。

⚠️ 能下载不等于有授权。别人视频里的配乐用于公开发布，或上传到 GitHub 再分发，都可能侵权。

不需要提前放好音乐：AI 在第1阶段会提醒你提前准备，真正需要时（第3阶段）如果找不到音乐，会暂停并提示你上传。你可以把音频直接发到对话里、告诉 AI 文件路径，或放进 `assets/music/`。

## 环境要求

助手需要能执行本地代码、读写文件、查看图片，最好还能联网检索。

- Node.js 18+（Remotion 4，TypeScript 5）
- ffmpeg / ffprobe
- Python 3.9+，numpy；matplotlib 可选（画波形图）
- 字体（均为 SIL OFL 开源许可，下载后放进工程 `public/fonts/`；缺失时回退到系统字体）：
  - `NotoSansSC-Medium.otf`、`NotoSansSC-Bold.otf`（字幕、标签）
  - `NotoSerifSC-Bold.otf`（标题、金句）
  - `Oswald-Bold.ttf`（HUD 大数字）

只能文字对话的环境无法交付真实视频。

## 文件结构

```text
vibe-knowledge-video/
├── SKILL.md                    # 三阶段流程与核对规则（助手读取）
├── README.md
├── agents/openai.yaml          # Codex 显示信息
├── assets/music/
│   └── README.md               # 本地音乐放置说明（仓库不附带音乐）
├── references/
│   ├── prompts.md              # 各阶段提示词
│   ├── default-style.md        # 默认视觉风格
│   ├── remotion-setup.md       # 环境、渲染、常见问题
│   ├── music-guide.md          # 背景音乐获取与版权说明
│   └── project-template.md     # 视频工程结构与状态模板
├── scripts/
│   ├── analyze_beats.py        # 音乐 BPM、拍点、重拍、段落分析
│   ├── synth_sfx.py            # 代码合成音效（5种声族预设）
│   ├── subtitle_timing.py      # 按字数计算字幕时长
│   └── check_output.sh         # 成片规格、响度、峰值、抽帧检查
└── template/                   # Remotion 工程模板（横竖屏两种合成）
    └── src/components/
        ├── Subtitle.tsx        # 底条字幕，支持 [[金:词]] 关键词上色
        ├── HudCard.tsx         # 左上角时间戳 / 实时数据卡
        ├── Tag.tsx             # 带引线的贴附标签
        ├── GlowRoute.tsx       # 发光路线 + 流动光点（确定性）
        ├── TitleCard.tsx       # 放射光金色标题卡
        └── SafeArea.tsx        # 字幕安全区调试层
```

### 脚本速查

```bash
python3 scripts/analyze_beats.py assets/music/vibe-knowledge-tune.wav --out analysis/
python3 scripts/synth_sfx.py pluck -o sfx/pluck_01.wav --gain 0.6
python3 scripts/subtitle_timing.py lines.txt -o src/data/subtitles.json --orientation portrait
bash scripts/check_output.sh out/final.mp4 1920 1080 30
```

## 不包含的内容

仓库不包含参考原片、任何音乐、字体文件、生成的视频、依赖或缓存（见 `.gitignore`）。每个视频工程应建在 Skill 目录之外。

## 风格来源

默认风格是对抖音创作者 **Iwanau** 的作品《多修一条路，为什么反而更堵？》的设计语言分析（配色、版式、HUD、字幕和镜头节奏），见 `references/default-style.md`。仓库**不包含**原片、截图、水印或其他任何素材，模板组件全部原创实现。请用它做原创内容，不要冒充原作者，也不要复刻原片。

## 许可

本项目由**智构**以 [MIT License](LICENSE) 开源。

- Remotion 对部分公司有商业授权要求，详见其[许可说明](https://www.remotion.dev/license)。
- 仓库不附带音乐；使用者自己放入的音乐，需自行确认使用权限。
- 字体等第三方素材遵守各自许可；用户提供的音乐只在其拥有的使用权限内使用。

本技能不保证视频获得平台流量，也不会编造热度数据。
