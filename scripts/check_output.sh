#!/usr/bin/env bash
# 成片检查：可解码、规格、音轨、响度、峰值、抽帧拼图。
# 用法：bash check_output.sh out/final.mp4 [期望宽 期望高 期望fps] [抽帧间隔秒]
set -euo pipefail
f="${1:?用法: check_output.sh video.mp4 [W H FPS] [INTERVAL]}"
W="${2:-1920}"; H="${3:-1080}"; FPS="${4:-30}"; INT="${5:-2}"
dir="$(dirname "$f")/check_$(basename "${f%.*}")"; mkdir -p "$dir"
ok=0; bad=0
pass(){ echo "✔ $1"; ok=$((ok+1)); }
fail(){ echo "✘ $1"; bad=$((bad+1)); }

echo "== 规格 =="
w=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of default=nw=1:nk=1 "$f")
h=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of default=nw=1:nk=1 "$f")
r=$(ffprobe -v error -select_streams v:0 -show_entries stream=avg_frame_rate -of default=nw=1:nk=1 "$f")
d=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$f")
a=$(ffprobe -v error -select_streams a -show_entries stream=codec_name -of default=nw=1:nk=1 "$f" | head -1)
fps=$(python3 -c "n,d='$r'.split('/');print(round(int(n)/int(d),3))")
[[ "$w" == "$W" && "$h" == "$H" ]] && pass "尺寸 ${w}x${h}" || fail "尺寸 ${w}x${h}，期望 ${W}x${H}"
python3 -c "import sys;sys.exit(0 if abs($fps-$FPS)<0.01 else 1)" && pass "帧率 $fps" || fail "帧率 $fps，期望 $FPS"
echo "  时长 ${d}s（$(python3 -c "print(round($d*$FPS))") 帧）"
[[ -n "$a" ]] && pass "音轨 $a" || fail "没有音轨"

echo "== 完整解码 =="
if ffmpeg -v error -i "$f" -f null - 2>"$dir/decode_errors.txt" && [[ ! -s "$dir/decode_errors.txt" ]]; then
  pass "全片可解码"; else fail "解码有错误，见 $dir/decode_errors.txt"; fi

if [[ -n "$a" ]]; then
  echo "== 响度与峰值 =="
  ln=$(ffmpeg -hide_banner -nostats -i "$f" -af loudnorm=I=-14:TP=-1:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
  I=$(echo "$ln" | python3 -c "import json,sys;print(json.load(sys.stdin)['input_i'])")
  TP=$(echo "$ln" | python3 -c "import json,sys;print(json.load(sys.stdin)['input_tp'])")
  echo "  综合响度 ${I} LUFS（目标约 -14），真峰值 ${TP} dBTP（目标 ≤ -1）"
  python3 -c "import sys;sys.exit(0 if abs($I+14)<=2 else 1)" && pass "响度在 -16~-12 LUFS" || fail "响度偏离目标"
  python3 -c "import sys;sys.exit(0 if $TP<=-1.0 else 1)" && pass "真峰值 ≤ -1 dBTP" || fail "真峰值过高，可能削波"
  tail_db=$(ffmpeg -hide_banner -nostats -sseof -1 -i "$f" -af volumedetect -f null - 2>&1 | grep max_volume | awk '{print $5}')
  echo "  最后1秒最大音量 ${tail_db} dB（若音乐应自然收尾，此值不应是突然的高电平截断）"
fi

echo "== 抽帧 =="
ffmpeg -v error -y -i "$f" -vf "fps=1/$INT,scale=480:-1" "$dir/frame_%03d.png"
n=$(ls "$dir"/frame_*.png | wc -l)
cols=6
ffmpeg -v error -y -pattern_type glob -i "$dir/frame_*.png" -vf "tile=${cols}x$(( (n+cols-1)/cols )):padding=6:color=0x222222" -frames:v 1 "$dir/contact_sheet.png"
pass "每 ${INT}s 抽帧 $n 张 → $dir/contact_sheet.png"

echo "== 结果：通过 $ok 项，失败 $bad 项 =="
echo "未自动检查：知识准确性、画面与字幕语义、阅读时间、镜头接缝、卡点对齐，需人工查看抽帧和关键帧。"
exit $(( bad > 0 ? 1 : 0 ))
