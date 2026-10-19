# 视频工程结构

每个视频单独建一个工程目录，不放在 Skill 目录里。

```text
<项目名>/
├── project-state.md      # 当前阶段、选择与批准记录
├── facts.md              # 知识点、来源、核实状态
├── storyboard.md         # 分镜表
├── beat-plan.csv         # 卡点表
├── subtitles.json        # 字幕与时长
├── assets/               # 用户提供的参考、音乐（按授权使用）
├── storyboard/           # 分镜大图、前后图、总览拼图
├── sfx/                  # 合成音效 WAV 与 manifest.json
├── src/                  # Remotion 源码（从 template/ 复制）
├── package.json
├── package-lock.json
└── out/                  # 预览与成片
```

## project-state.md 模板

```markdown
# 项目状态

- 当前阶段：1 选题 / 2 分镜 / 3 动画与声音 / 验收
- 主题：
- 画幅与尺寸：
- 目标片长：
- 风格参考：（用户提供 / 默认风格）
- 分镜版本：v1
- 制作模式：（先做前20秒 / 直接全片 / 未选）
- 背景音乐：（文件名 / 明确不用 / 未提供）

## 批准记录
| 时间 | 阶段 | 用户原话或选择 | 版本 |
|---|---|---|---|

## 修改记录与受影响项

## 待确认事项
```

## beat-plan.csv 表头

```csv
event,seconds,frame,shot,action,sfx,confidence,basis
```

`frame = round(seconds * 30)`；`confidence` 填 high / medium / low。
