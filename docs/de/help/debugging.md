---
read_when:
    - Sie müssen die rohe Modellausgabe auf Leakage im Reasoning untersuchen.
    - Sie möchten das Gateway im Watch-Modus ausführen, während Sie iterieren.
    - Sie benötigen einen reproduzierbaren Debugging-Workflow.
summary: 'Debugging-Tools: Watch-Modus, rohe Modell-Streams und Nachverfolgung von Leakage im Reasoning'
title: Debugging
x-i18n:
    generated_at: "2026-04-12T23:28:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc31ce9b41e92a14c4309f32df569b7050b18024f83280930e53714d3bfcd5cc
    source_path: help/debugging.md
    workflow: 15
---

# Debugging

Diese Seite behandelt Debugging-Helfer für Streaming-Ausgaben, insbesondere wenn ein
Provider Reasoning mit normalem Text vermischt.

## Laufzeit-Debug-Overrides

Verwenden Sie `/debug` im Chat, um **nur zur Laufzeit** gültige Konfigurations-Overrides zu setzen (im Speicher, nicht auf der Festplatte).
`/debug` ist standardmäßig deaktiviert; aktivieren Sie es mit `commands.debug: true`.
Das ist praktisch, wenn Sie schwer auffindbare Einstellungen umschalten müssen, ohne `openclaw.json` zu bearbeiten.

Beispiele:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` löscht alle Overrides und kehrt zur auf der Festplatte gespeicherten Konfiguration zurück.

## Sitzungs-Trace-Ausgabe

Verwenden Sie `/trace`, wenn Sie in einer Sitzung plugin-eigene Trace-/Debug-Zeilen sehen möchten,
ohne den vollständigen Verbose-Modus einzuschalten.

Beispiele:

```text
/trace
/trace on
/trace off
```

Verwenden Sie `/trace` für Plugin-Diagnosen wie Active-Memory-Debug-Zusammenfassungen.
Verwenden Sie weiterhin `/verbose` für normale ausführliche Status-/Tool-Ausgaben und
weiterhin `/debug` für Konfigurations-Overrides, die nur zur Laufzeit gelten.

## Gateway-Watch-Modus

Für schnelle Iteration führen Sie das Gateway unter dem Dateiwächter aus:

```bash
pnpm gateway:watch
```

Dies entspricht:

```bash
node scripts/watch-node.mjs gateway --force
```

Der Wächter startet bei build-relevanten Dateien unter `src/`, Quellcodedateien von Extensions,
`package.json` und `openclaw.plugin.json`-Metadaten von Extensions, `tsconfig.json`,
`package.json` und `tsdown.config.ts` neu. Änderungen an Extension-Metadaten starten das
Gateway neu, ohne einen `tsdown`-Neuaufbau zu erzwingen; Änderungen an Quellcode und Konfiguration
bauen weiterhin zuerst `dist` neu.

Fügen Sie beliebige Gateway-CLI-Flags nach `gateway:watch` hinzu; sie werden bei
jedem Neustart weitergereicht. Wenn derselbe Watch-Befehl für dasselbe Repo-/Flag-Set
erneut ausgeführt wird, ersetzt er jetzt den älteren Wächter, statt doppelte
Wächter-Elternprozesse zu hinterlassen.

## Dev-Profil + Dev-Gateway (`--dev`)

Verwenden Sie das Dev-Profil, um den Zustand zu isolieren und eine sichere, wegwerfbare
Umgebung für das Debugging zu starten. Es gibt **zwei** `--dev`-Flags:

- **Globales `--dev` (Profil):** isoliert den Zustand unter `~/.openclaw-dev` und
  setzt den Gateway-Port standardmäßig auf `19001` (abgeleitete Ports verschieben sich entsprechend).
- **`gateway --dev`:** weist das Gateway an, automatisch eine Standardkonfiguration +
  Workspace zu erstellen, wenn sie fehlen (und `BOOTSTRAP.md` zu überspringen).

Empfohlener Ablauf (Dev-Profil + Dev-Bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Falls Sie noch keine globale Installation haben, führen Sie die CLI über `pnpm openclaw ...` aus.

Das bewirkt:

1. **Profilisolierung** (globales `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (Browser/Canvas verschieben sich entsprechend)

2. **Dev-Bootstrap** (`gateway --dev`)
   - Schreibt eine minimale Konfiguration, wenn sie fehlt (`gateway.mode=local`, bind loopback).
   - Setzt `agent.workspace` auf den Dev-Workspace.
   - Setzt `agent.skipBootstrap=true` (kein `BOOTSTRAP.md`).
   - Initialisiert die Workspace-Dateien, falls sie fehlen:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Standardidentität: **C3‑PO** (Protokolldroide).
   - Überspringt Kanal-Provider im Dev-Modus (`OPENCLAW_SKIP_CHANNELS=1`).

Reset-Ablauf (Neustart von Grund auf):

```bash
pnpm gateway:dev:reset
```

Hinweis: `--dev` ist ein **globales** Profil-Flag und wird von einigen Runnern verschluckt.
Wenn Sie es explizit angeben müssen, verwenden Sie die Umgebungsvariablenform:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` löscht Konfiguration, Anmeldedaten, Sitzungen und den Dev-Workspace (mit
`trash`, nicht `rm`) und erstellt dann die Standard-Dev-Umgebung neu.

Tipp: Wenn bereits ein Nicht-Dev-Gateway läuft (launchd/systemd), stoppen Sie es zuerst:

```bash
openclaw gateway stop
```

## Raw-Stream-Logging (OpenClaw)

OpenClaw kann den **rohen Assistenten-Stream** protokollieren, bevor irgendeine Filterung/Formatierung erfolgt.
Das ist die beste Möglichkeit zu sehen, ob Reasoning als Klartext-Deltas ankommt
(oder als separate Thinking-Blöcke).

Aktivieren Sie es über die CLI:

```bash
pnpm gateway:watch --raw-stream
```

Optionaler Pfad-Override:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Entsprechende Umgebungsvariablen:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Standarddatei:

`~/.openclaw/logs/raw-stream.jsonl`

## Raw-Chunk-Logging (pi-mono)

Um **rohe OpenAI-kompatible Chunks** zu erfassen, bevor sie in Blöcke geparst werden,
stellt pi-mono einen separaten Logger bereit:

```bash
PI_RAW_STREAM=1
```

Optionaler Pfad:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Standarddatei:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Hinweis: Dies wird nur von Prozessen ausgegeben, die den
> `openai-completions`-Provider von pi-mono verwenden.

## Sicherheitshinweise

- Raw-Stream-Logs können vollständige Prompts, Tool-Ausgaben und Benutzerdaten enthalten.
- Bewahren Sie Logs lokal auf und löschen Sie sie nach dem Debugging.
- Wenn Sie Logs weitergeben, entfernen Sie vorher Geheimnisse und personenbezogene Daten.
