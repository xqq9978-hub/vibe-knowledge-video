#!/usr/bin/env python3
"""按字数计算字幕时长并生成 subtitles.json。

规则：时长 = max(最短秒数, 字数 / 每秒字数 + 0.5)，超出每屏字数上限时报警。
输入：每行一句的文本文件，可用 [[金:词]] [[红:词]] [[青:词]] 标记高亮（不计入字数）。行尾可写 " | +1.0" 为复杂内容额外加时。

用法：
  python3 subtitle_timing.py lines.txt -o subtitles.json [--orientation landscape|portrait] [--start 0]
"""
import argparse, json, re, sys

def strip_markup(s):
    return re.sub(r"\[\[[^:\]]+:([^\]]+)\]\]", r"\1", s)

def count_chars(s):
    s = strip_markup(s)
    return len(re.sub(r"[\s，。、！？：；“”‘’《》（）,.!?:;\"'()\-—…]", "", s))

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("input")
    ap.add_argument("-o", "--out", default="subtitles.json")
    ap.add_argument("--orientation", choices=["landscape", "portrait"], default="landscape")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--cps", type=float, default=5.0, help="每秒阅读字数")
    ap.add_argument("--min", type=float, default=2.0)
    ap.add_argument("--start", type=float, default=0.0)
    a = ap.parse_args()
    limit = 18 if a.orientation == "landscape" else 14

    items, t, warn = [], a.start, 0
    for ln, raw in enumerate(open(a.input, encoding="utf-8"), 1):
        raw = raw.strip()
        if not raw:
            continue
        extra = 0.0
        if "|" in raw:
            raw, ex = raw.rsplit("|", 1)
            raw = raw.strip()
            extra = float(ex.strip().lstrip("+") or 0)
        n = count_chars(raw)
        dur = max(a.min, n / a.cps + 0.5) + extra
        if n > limit:
            warn += 1
            print(f"⚠ 第{ln}行 {n} 字，超过每屏 {limit} 字上限：{raw}", file=sys.stderr)
        items.append({"text": raw, "chars": n, "start_s": round(t, 2), "duration_s": round(dur, 2),
                      "from": round(t * a.fps), "durationInFrames": round(dur * a.fps)})
        t += dur
    json.dump(items, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"{len(items)} 句，总时长 {t - a.start:.1f}s（{round((t - a.start) * a.fps)} 帧），超长 {warn} 句 → {a.out}")

if __name__ == "__main__":
    main()
