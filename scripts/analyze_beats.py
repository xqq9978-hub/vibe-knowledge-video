#!/usr/bin/env python3
"""分析背景音乐：时长、BPM 估计、拍点、重拍候选、能量段落。

结果只是估计，必须结合波形图和试听核对。
依赖：ffmpeg、numpy；matplotlib 可选（生成波形图）。

用法：
  python3 analyze_beats.py music.mp3 --out analysis/ [--fps 30] [--min-bpm 60 --max-bpm 180]
输出：
  analysis.json        全部结果
  beat-plan.draft.csv  重拍候选与段落起点草稿（需人工补全镜头和动作）
  waveform.png         波形、能量与拍点（有 matplotlib 时）
"""
import argparse, csv, json, os, subprocess, sys
import numpy as np

SR = 22050
HOP = 512


def load_audio(path):
    cmd = ["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"]
    try:
        raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    except FileNotFoundError:
        sys.exit("需要 ffmpeg，请先安装。")
    except subprocess.CalledProcessError as e:
        sys.exit("无法解码音频：" + e.stderr.decode(errors="ignore"))
    y = np.frombuffer(raw, dtype=np.float32)
    if y.size == 0:
        sys.exit("音频为空。")
    return y


def onset_envelope(y):
    n_fft = 2048
    win = np.hanning(n_fft)
    pad = np.pad(y, (n_fft // 2, n_fft // 2))
    frames = 1 + (len(pad) - n_fft) // HOP
    idx = np.arange(n_fft)[None, :] + HOP * np.arange(frames)[:, None]
    spec = np.abs(np.fft.rfft(pad[idx] * win, axis=1))
    logspec = np.log1p(100 * spec)
    flux = np.maximum(0, np.diff(logspec, axis=0)).sum(axis=1)
    flux = np.concatenate([[0], flux])
    flux -= np.convolve(flux, np.ones(16) / 16, mode="same")  # 去除缓慢趋势
    flux = np.maximum(flux, 0)
    if flux.max() > 0:
        flux /= flux.max()
    rms = np.sqrt((pad[idx] ** 2).mean(axis=1))
    return flux, rms


def estimate_tempo(env, min_bpm, max_bpm):
    fps = SR / HOP
    env = env - env.mean()
    ac = np.correlate(env, env, mode="full")[len(env) - 1:]
    lags = np.arange(len(ac))
    lo, hi = int(fps * 60 / max_bpm), int(fps * 60 / min_bpm)
    hi = min(hi, len(ac) - 1)
    bpms = 60 * fps / np.maximum(lags[lo:hi + 1], 1)
    weight = np.exp(-0.5 * (np.log2(bpms / 120) / 0.9) ** 2)  # 轻微偏好 120 附近
    score = ac[lo:hi + 1] * weight
    order = np.argsort(score)[::-1]
    best_lag = lags[lo + order[0]]
    cands = []
    for i in order:
        b = float(60 * fps / lags[lo + i])
        if all(abs(b - c) > 3 for c in cands):
            cands.append(b)
        if len(cands) == 3:
            break
    return 60 * fps / best_lag, [round(c, 1) for c in cands]


def track_beats(env, bpm, tightness=100):
    """Ellis 动态规划拍点跟踪。"""
    fps = SR / HOP
    period = fps * 60 / bpm
    n = len(env)
    score = env.copy()
    back = -np.ones(n, dtype=int)
    for t in range(n):
        lo, hi = int(t - 2 * period), int(t - period / 2)
        if hi <= 0:
            continue
        lo = max(lo, 0)
        prev = np.arange(lo, hi)
        pen = -tightness * (np.log((t - prev) / period)) ** 2
        cand = score[prev] + pen
        j = int(np.argmax(cand))
        score[t] = env[t] + cand[j]
        back[t] = prev[j]
    tail = max(1, int(period))
    t = int(np.argmax(score[-tail:])) + n - tail
    beats = []
    while t >= 0:
        beats.append(t)
        t = back[t]
    return np.array(beats[::-1])


def downbeat_phase(env, beats, meter=4):
    if len(beats) < meter * 2:
        return 0, [0.0] * meter
    strengths = []
    for p in range(meter):
        sel = beats[p::meter]
        strengths.append(float(env[sel].mean()))
    return int(np.argmax(strengths)), strengths


def sections(rms, min_len_s=4.0):
    fps = SR / HOP
    db = 20 * np.log10(rms + 1e-9)
    w = int(fps * 2)
    smooth = np.convolve(db, np.ones(w) / w, mode="same")
    diff = np.abs(smooth[w:] - smooth[:-w])
    out, last = [0.0], 0.0
    thr = max(3.0, np.percentile(diff, 95))
    for i in np.argsort(diff)[::-1]:
        if diff[i] < thr:
            break
        t = (i + w / 2) / fps
        if t > len(rms) / fps - min_len_s / 2:
            continue
        if all(abs(t - s) >= min_len_s for s in out):
            out.append(round(float(t), 2))
    return sorted(out)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("audio")
    ap.add_argument("--out", default="analysis")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--meter", type=int, default=4)
    ap.add_argument("--min-bpm", type=float, default=60)
    ap.add_argument("--max-bpm", type=float, default=180)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)

    y = load_audio(a.audio)
    dur = len(y) / SR
    env, rms = onset_envelope(y)
    bpm, cands = estimate_tempo(env, a.min_bpm, a.max_bpm)
    beats = track_beats(env, bpm)
    hop_s = HOP / SR
    beat_t = beats * hop_s
    if len(beat_t) > 2:
        bpm_tracked = 60 / np.median(np.diff(beat_t))
    else:
        bpm_tracked = bpm
    phase, strengths = downbeat_phase(env, beats, a.meter)
    down = beat_t[phase::a.meter]
    st = np.array(strengths)
    contrast = float((st.max() - np.median(st)) / (st.mean() + 1e-9))
    down_conf = "high" if contrast > 0.35 else "medium" if contrast > 0.15 else "low"
    secs = sections(rms)
    peak = float(np.abs(y).max())

    result = {
        "file": os.path.basename(a.audio),
        "duration_s": round(dur, 3),
        "duration_frames": round(dur * a.fps),
        "fps": a.fps,
        "bpm_estimate": round(float(bpm_tracked), 1),
        "bpm_candidates": cands,
        "note": "BPM、拍点、重拍均为算法估计，可能存在半速/倍速或相位误差，需结合波形与试听核对。",
        "beats_s": [round(float(t), 3) for t in beat_t],
        "downbeat_candidates_s": [round(float(t), 3) for t in down],
        "downbeat_confidence": down_conf,
        "downbeat_phase_strengths": [round(s, 3) for s in strengths],
        "section_starts_s": secs,
        "sample_peak": round(peak, 3),
    }
    with open(os.path.join(a.out, "analysis.json"), "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    rows = [("section_start", t, "high" if i == 0 else "medium") for i, t in enumerate(secs)]
    rows += [("downbeat", float(t), down_conf) for t in down]
    rows.sort(key=lambda r: r[1])
    with open(os.path.join(a.out, "beat-plan.draft.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["event", "seconds", "frame", "shot", "action", "sfx", "confidence", "basis"])
        for ev, t, conf in rows:
            w.writerow([ev, f"{t:.3f}", round(t * a.fps), "", "", "", conf, "analyze_beats.py"])

    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        fig, ax = plt.subplots(2, 1, figsize=(16, 6), sharex=True)
        tt = np.arange(len(y))[::50] / SR
        ax[0].plot(tt, y[::50], lw=0.3, color="#555")
        for t in down:
            ax[0].axvline(t, color="#ff5c5c", lw=0.8, alpha=0.7)
        for t in secs:
            ax[0].axvline(t, color="#3fa7f5", lw=2)
        ax[0].set_title(f"waveform  red=downbeat candidates  blue=section starts  ~{bpm_tracked:.1f} BPM")
        te = np.arange(len(env)) * hop_s
        ax[1].plot(te, env, lw=0.5, color="#333")
        ax[1].vlines(beat_t, 0, 1, color="#ffc93c", lw=0.6)
        ax[1].set_title("onset strength + beats (yellow)")
        ax[1].set_xlabel("seconds")
        fig.tight_layout()
        fig.savefig(os.path.join(a.out, "waveform.png"), dpi=110)
    except ImportError:
        print("未安装 matplotlib，跳过波形图。")

    print(json.dumps({k: result[k] for k in ("duration_s", "bpm_estimate", "bpm_candidates", "downbeat_confidence", "section_starts_s")}, ensure_ascii=False))


if __name__ == "__main__":
    main()
