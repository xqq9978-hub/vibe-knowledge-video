#!/usr/bin/env python3
"""离线合成音效（48kHz 16-bit WAV），不依赖任何现成音效素材。

预设（对应 SKILL.md 声族表）：
  pluck   小元素出现：圆润短拨弦
  swoosh  移动/旋转：跟随运动的轻滑音（可设 --duration 匹配动作时长）
  settle  停稳/完成：克制的落定音
  step    连续响应：逐级升高的短音序列（--count 音数，--interval 间隔秒）
  reveal  重要揭晓：温暖钟琴 + 简短和声

用法：
  python3 synth_sfx.py pluck -o sfx/pluck_01.wav --freq 660 --gain 0.6
  python3 synth_sfx.py step  -o sfx/step.wav --count 5 --interval 0.12
  python3 synth_sfx.py swoosh -o sfx/move.wav --duration 0.8 --direction up
每次生成都会追加记录到输出目录的 manifest.json。
"""
import argparse, json, os, wave
import numpy as np

SR = 48000


def env_adsr(n, a=0.005, d=0.1, s=0.0, r=0.1):
    t = np.arange(n) / SR
    e = np.zeros(n)
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    e[:a_n] = np.linspace(0, 1, a_n, endpoint=False)
    d_end = min(n, a_n + d_n)
    e[a_n:d_end] = np.linspace(1, s, d_end - a_n, endpoint=False)
    e[d_end:] = s
    if s > 0 and r_n > 0:
        e[-r_n:] *= np.linspace(1, 0, r_n)
    return e


def exp_decay(n, tau):
    return np.exp(-np.arange(n) / SR / tau)


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def reverb(x, mix=0.18, seed=1):
    rng = np.random.default_rng(seed)
    n = int(0.6 * SR)
    ir = rng.standard_normal(n) * exp_decay(n, 0.15)
    ir = lowpass(ir, 4000)
    ir /= np.abs(ir).sum() / 4
    wet = np.convolve(x, ir)
    dry = np.concatenate([x, np.zeros(len(wet) - len(x))])
    return (1 - mix) * dry + mix * wet


def tone(freq, dur, partials=((1, 1.0), (2, 0.35), (3, 0.12)), tau=0.15, inharm=0.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k, amp in partials:
        f = freq * k * (1 + inharm * k * k)
        out += amp * np.sin(2 * np.pi * f * t) * exp_decay(n, tau / (0.6 + 0.4 * k))
    return out


def pluck(freq=660, **_):
    x = tone(freq, 0.35, tau=0.09)
    x *= env_adsr(len(x), a=0.003, d=0.34, s=0)
    return reverb(lowpass(x, 5000), 0.12)


def swoosh(duration=0.6, direction="up", seed=7, **_):
    n = int(duration * SR)
    rng = np.random.default_rng(seed)
    noise = rng.standard_normal(n)
    t = np.linspace(0, 1, n)
    sweep = (800 + 2400 * t) if direction == "up" else (3200 - 2400 * t)
    out = np.empty(n)
    acc = 0.0
    for i in range(n):  # 时变一阶低通
        a = np.exp(-2 * np.pi * sweep[i] / SR)
        acc = (1 - a) * noise[i] + a * acc
        out[i] = acc
    out *= np.sin(np.pi * t) ** 1.5
    return reverb(out * 1.6, 0.1)


def settle(freq=330, **_):
    x = tone(freq, 0.5, partials=((1, 1.0), (2, 0.2)), tau=0.12)
    thump = np.sin(2 * np.pi * 90 * np.arange(len(x)) / SR) * exp_decay(len(x), 0.04) * 0.6
    x = (x + thump) * env_adsr(len(x), a=0.004, d=0.49, s=0)
    return reverb(lowpass(x, 3000), 0.15)


def step(freq=523.25, count=4, interval=0.12, ratio=2 ** (2 / 12), **_):
    total = int((interval * (count - 1) + 0.4) * SR)
    out = np.zeros(total)
    for i in range(count):
        note = pluck(freq * ratio ** i) * (0.75 + 0.25 * i / max(1, count - 1))
        s = int(i * interval * SR)
        e = min(total, s + len(note))
        out[s:e] += note[: e - s]
    return out


def reveal(freq=523.25, **_):
    bell = tone(freq, 1.6, partials=((1, 1.0), (2.76, 0.4), (5.4, 0.15)), tau=0.6)
    chord = sum(tone(freq * r, 1.6, partials=((1, 1), (2, 0.2)), tau=0.5) for r in (0.5, 0.749, 1.0)) * 0.35
    x = (bell + chord) * env_adsr(int(1.6 * SR), a=0.01, d=1.59, s=0)
    return reverb(lowpass(x, 6000), 0.25)


PRESETS = {"pluck": pluck, "swoosh": swoosh, "settle": settle, "step": step, "reveal": reveal}


def write_wav(path, x, gain):
    x = x / (np.abs(x).max() + 1e-9) * 0.89 * gain  # 约 -1 dBFS × gain
    fade = int(0.005 * SR)
    x[-fade:] *= np.linspace(1, 0, fade)
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    return len(x) / SR


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("preset", choices=PRESETS)
    ap.add_argument("-o", "--out", required=True)
    ap.add_argument("--freq", type=float)
    ap.add_argument("--gain", type=float, default=0.7, help="0–1，同声族用它区分强弱")
    ap.add_argument("--duration", type=float, help="swoosh 时长（秒）")
    ap.add_argument("--direction", choices=["up", "down"], default="up")
    ap.add_argument("--count", type=int, default=4)
    ap.add_argument("--interval", type=float, default=0.12)
    ap.add_argument("--seed", type=int, default=7)
    a = ap.parse_args()

    params = {k: v for k, v in vars(a).items() if k not in ("preset", "out") and v is not None}
    kw = dict(params); kw.pop("gain")
    x = PRESETS[a.preset](**kw)
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    dur = write_wav(a.out, x, a.gain)

    man_path = os.path.join(os.path.dirname(os.path.abspath(a.out)), "manifest.json")
    man = json.load(open(man_path, encoding="utf-8")) if os.path.exists(man_path) else []
    man = [m for m in man if m["file"] != os.path.basename(a.out)]
    man.append({"file": os.path.basename(a.out), "preset": a.preset, "params": params,
                "duration_s": round(dur, 3), "sample_rate": SR})
    json.dump(man, open(man_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"{a.out}  {dur:.2f}s")


if __name__ == "__main__":
    main()
