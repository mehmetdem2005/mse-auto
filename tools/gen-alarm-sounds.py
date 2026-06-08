#!/usr/bin/env python3
"""Watcher — 100 sentetik alarm sesi üreticisi (bağımlılık: numpy).
WAV (16 kHz, 16-bit, mono) dosyaları + tipli TS katalog üretir.
Sesler sentetik başlangıç tonlarıdır; lisanslı paketlerle değiştirilebilir.
Yeniden üretmek için: python tools/gen-alarm-sounds.py
"""
import math, wave, struct, os
import numpy as np

SR = 16000
OUT = os.path.join("apps", "mobile", "assets", "sounds")
TS = os.path.join("apps", "mobile", "src", "lib", "alarm-sounds.ts")
os.makedirs(OUT, exist_ok=True)

def env(n, atk=0.005, rel=0.08):
    e = np.ones(n)
    a = int(SR * atk); r = int(SR * rel)
    if a > 0: e[:a] = np.linspace(0, 1, a)
    if r > 0: e[-r:] = np.linspace(1, 0, r)
    return e

def t_arr(dur): return np.arange(int(SR * dur)) / SR

def sine(f, t): return np.sin(2 * np.pi * f * t)
def square(f, t): return np.sign(np.sin(2 * np.pi * f * t))
def tri(f, t): return 2 * np.abs(2 * (f * t - np.floor(f * t + 0.5))) - 1

def sweep(f0, f1, dur):
    t = t_arr(dur)
    ph = 2 * np.pi * (f0 * t + (f1 - f0) / (2 * dur) * t * t)
    return np.sin(ph), t

def warble(fc, fm, depth, dur):
    t = t_arr(dur)
    return np.sin(2 * np.pi * fc * t + depth * np.sin(2 * np.pi * fm * t)), t

def pulse(f, rate, duty, dur, wave_fn=sine):
    t = t_arr(dur)
    gate = ((t * rate) % 1.0 < duty).astype(float)
    return wave_fn(f, t) * gate, t

def arp(freqs, dur, wave_fn=sine):
    seg = dur / len(freqs)
    parts = []
    for fr in freqs:
        tt = t_arr(seg)
        parts.append(wave_fn(fr, tt) * env(len(tt), 0.004, 0.02))
    return np.concatenate(parts)

def write_wav(path, y):
    y = y / (np.max(np.abs(y)) + 1e-9) * 0.72
    pcm = (y * 32767).astype(np.int16)
    with wave.open(path, "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.tobytes())

# Nota frekansları (A4=440); basit pentatonik havuz
NOTE = lambda n: 440 * 2 ** ((n - 69) / 12)
SCALE = [57, 60, 62, 64, 67, 69, 72, 74]  # A,C,D,E,G,A,C,D

catalog = []
idx = 0

def add(cat, name, y):
    global idx
    idx += 1
    fid = f"alarm-{idx:03d}"
    fn = f"{fid}.wav"
    write_wav(os.path.join(OUT, fn), y)
    catalog.append((fid, name, cat, fn))

# 1) Klasik (16): sine/square bip + bip desenleri
base = [523, 587, 659, 698, 784, 880, 988, 1047]
for i in range(16):
    f = base[i % len(base)] * (1 + 0.5 * (i // len(base)))
    if i % 2 == 0:
        d = 1.0; t = t_arr(d); y = sine(f, t) * env(len(t))
    else:
        y, _ = pulse(f, rate=4, duty=0.5, dur=1.1, wave_fn=square)
    add("Klasik", f"Klasik {i + 1:02d}", y)

# 2) Dijital (16): kısa blip/arp (square/tri)
for i in range(16):
    seq = [SCALE[(i + k) % len(SCALE)] for k in range(3 + i % 2)]
    freqs = [NOTE(n) for n in seq]
    y = arp(freqs, 1.0, wave_fn=square if i % 2 else tri)
    add("Dijital", f"Dijital {i + 1:02d}", y)

# 3) Yükselen (12): sweep up
for i in range(12):
    f0 = 300 + i * 30; f1 = 1200 + i * 120
    y, t = sweep(f0, f1, 1.0); y = y * env(len(t))
    add("Yükselen", f"Yükselen {i + 1:02d}", y)

# 4) Alçalan (12): sweep down
for i in range(12):
    f0 = 1600 - i * 60; f1 = 400 - min(i * 10, 200)
    y, t = sweep(f0, max(f1, 120), 1.0); y = y * env(len(t))
    add("Alçalan", f"Alçalan {i + 1:02d}", y)

# 5) Siren (12): warble / oscillating
for i in range(12):
    fc = 700 + i * 40; fm = 3 + i * 0.8; depth = 4 + i * 0.6
    y, t = warble(fc, fm, depth, 1.2); y = y * env(len(t), 0.01, 0.05)
    add("Siren", f"Siren {i + 1:02d}", y)

# 6) Darbe (16): ritmik pulse train
for i in range(16):
    f = 600 + (i % 8) * 80; rate = 6 + i % 6; duty = 0.3 + 0.1 * (i % 3)
    y, t = pulse(f, rate=rate, duty=duty, dur=1.1, wave_fn=sine if i % 2 else square)
    y = y * env(len(t), 0.003, 0.03)
    add("Darbe", f"Darbe {i + 1:02d}", y)

# 7) Melodi (16): kısa melodik arpejler
for i in range(16):
    start = i % len(SCALE)
    seq = [SCALE[(start + k * 2) % len(SCALE)] for k in range(4)]
    if i % 2: seq = seq[::-1]
    y = arp([NOTE(n) for n in seq], 1.2, wave_fn=sine if i % 3 else tri)
    add("Melodi", f"Melodi {i + 1:02d}", y)

# TS katalog
cats = []
for _, _, c, _ in catalog:
    if c not in cats: cats.append(c)
lines = [
    "// OTOMATİK ÜRETİLDİ — tools/gen-alarm-sounds.py. Elle düzenleme.",
    "// Sentetik başlangıç alarm tonları; lisanslı paketlerle değiştirilebilir.",
    "export interface AlarmSound {",
    "  id: string;",
    "  name: string;",
    "  category: string;",
    "  file: string;",
    "}",
    "",
    "export const ALARM_SOUNDS: AlarmSound[] = [",
]
for fid, name, cat, fn in catalog:
    lines.append(f'  {{ id: "{fid}", name: "{name}", category: "{cat}", file: "{fn}" }},')
lines.append("];")
lines.append("")
lines.append(f'export const DEFAULT_ALARM_SOUND_ID = "{catalog[0][0]}";')
lines.append("export const ALARM_CATEGORIES: string[] = [" + ", ".join(f'"{c}"' for c in cats) + "];")
lines.append("")
open(TS, "w", encoding="utf-8").write("\n".join(lines))

total = sum(os.path.getsize(os.path.join(OUT, f"{c[0]}.wav")) for c in catalog)
print(f"{len(catalog)} ses üretildi · kategori: {cats}")
print(f"toplam boyut: {total/1024/1024:.2f} MB · katalog: {TS}")
