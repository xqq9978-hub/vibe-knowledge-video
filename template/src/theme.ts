// "夜景沙盘"默认风格，对应 references/default-style.md。使用用户参考风格时修改这里。
export const theme = {
  bg: "#0B111F",
  bgDeep: "#0B0A0B",
  light: "#F9F2DA", // 主光、正常状态
  text: "#ECE8DE", // 字幕文字
  gold: "#D7B370", // 重点、标题
  goldFrom: "#B19566",
  goldTo: "#E6CF9A",
  cyan: "#5EA6BA", // 新事物
  cyanGlow: "#4FC3E0",
  red: "#E44E48", // 变差、警示
  green: "#4CD07D", // 少量使用
  muted: "#8E8A80",
  panel: "rgba(16,20,32,0.72)",
  panelBorder: "rgba(215,179,112,0.22)",
  subtitleBg: "rgba(18,18,22,0.6)",
  sans: "'Noto Sans SC', 'Noto Sans CJK SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  serif: "'Noto Serif SC', 'Noto Serif CJK SC', 'Songti SC', serif",
  number: "'Oswald', 'Barlow Condensed', 'Noto Sans SC', sans-serif",
};

/** 字幕高亮色：在字幕文本里写 [[金:词]] [[红:词]] [[青:词]] */
export const highlight: Record<string, string> = {金: theme.gold, 红: theme.red, 青: theme.cyanGlow, 绿: theme.green};

/** 字幕安全区：底部高度比例。主体对象和标签不要进入这块区域。 */
export const SUBTITLE_ZONE = 0.16;
