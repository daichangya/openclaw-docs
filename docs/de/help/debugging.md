---
read_when:
    - Sie müssen rohe Modellausgaben auf Leakage bei Reasoning untersuchen
    - Sie möchten das Gateway im Watch-Modus ausführen, während Sie iterieren
    - Sie benötigen einen reproduzierbaren Debugging-Ablauf
summary: 'Debugging-Tools: Watch-Modus, rohe Modell-Streams und Nachverfolgung von Leakage bei Reasoning'
title: Debugging
x-i18n:
    generated_at: "2026-04-05T12:44:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: f90d944ecc2e846ca0b26a162126ceefb3a3c6cf065c99b731359ec79d4289e3
    source_path: help/debugging.md
    workflow: 15
---

# Debugging

Diese Seite behandelt Debugging-Helfer für Streaming-Ausgaben, insbesondere wenn ein
Provider Reasoning mit normalem Text vermischt.

## Runtime-Debug-Überschreibungen

Verwenden Sie `/debug` im Chat, um **nur zur Laufzeit gültige** Konfigurationsüberschreibungen festzulegen (im Speicher, nicht auf der Festplatte).
`/debug` ist standardmäßig deaktiviert; aktivieren Sie es mit `commands.debug: true`.
Das ist nützlich, wenn Sie seltene Einstellungen umschalten müssen, ohne `openclaw.json` zu bearbeiten.

Beispiele:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` löscht alle Überschreibungen und kehrt zur auf der Festplatte gespeicherten Konfiguration zurück.

## Gateway-Watch-Modus

Für schnelle Iteration führen Sie das Gateway unter dem Datei-Watcher aus:

```bash
pnpm gateway:watch
```

Das wird abgebildet auf:

```bash
node scripts/watch-node.mjs gateway --force
```

Der Watcher startet bei Build-relevanten Dateien unter `src/`, Quelldateien von Erweiterungen,
`package.json` und `openclaw.plugin.json`-Metadaten von Erweiterungen, `tsconfig.json`,
`package.json` und `tsdown.config.ts` neu. Änderungen an Erweiterungsmetadaten starten das
Gateway neu, ohne einen `tsdown`-Rebuild zu erzwingen; Änderungen an Quellcode und Konfiguration
erstellen `dist` weiterhin zuerst neu.

Fügen Sie beliebige Gateway-CLI-Flags nach `gateway:watch` hinzu; sie werden bei
jedem Neustart weitergereicht.

## Dev-Profil + Dev-Gateway (`--dev`)

Verwenden Sie das Dev-Profil, um den Status zu isolieren und eine sichere, wegwerfbare Umgebung für
das Debugging hochzufahren. Es gibt **zwei** `--dev`-Flags:

- **Globales `--dev` (Profil):** isoliert den Status unter `~/.openclaw-dev` und
  setzt den Gateway-Port standardmäßig auf `19001` (abgeleitete Ports verschieben sich entsprechend).
- **`gateway --dev`: weist das Gateway an, bei Bedarf automatisch eine Standardkonfiguration +
  einen Workspace zu erstellen** (und `BOOTSTRAP.md` zu überspringen).

Empfohlener Ablauf (Dev-Profil + Dev-Bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Wenn Sie noch keine globale Installation haben, führen Sie die CLI über `pnpm openclaw ...` aus.

Was das bewirkt:

1. **Profilisolierung** (globales `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (Browser/Canvas verschieben sich entsprechend)

2. **Dev-Bootstrap** (`gateway --dev`)
   - Schreibt bei Bedarf eine minimale Konfiguration (`gateway.mode=local`, Bind an loopback).
   - Setzt `agent.workspace` auf den Dev-Workspace.
   - Setzt `agent.skipBootstrap=true` (kein `BOOTSTRAP.md`).
   - Befüllt bei Bedarf die Workspace-Dateien:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Standardidentität: **C3‑PO** (Protokolldroide).
   - Überspringt Kanal-Provider im Dev-Modus (`OPENCLAW_SKIP_CHANNELS=1`).

Reset-Ablauf (frischer Start):

```bash
pnpm gateway:dev:reset
```

Hinweis: `--dev` ist ein **globales** Profil-Flag und wird von einigen Runnern geschluckt.
Wenn Sie es explizit angeben müssen, verwenden Sie die Form mit der Env-Variable:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` löscht Konfiguration, Anmeldedaten, Sitzungen und den Dev-Workspace (mit
`trash`, nicht `rm`) und erstellt dann die Standard-Dev-Einrichtung erneut.

Tipp: Wenn bereits ein Nicht-Dev-Gateway läuft (launchd/systemd), stoppen Sie es zuerst:

```bash
openclaw gateway stop
```

## Logging des rohen Streams (OpenClaw)

OpenClaw kann den **rohen Assistant-Stream** vor jeglicher Filterung/Formatierung protokollieren.
Das ist der beste Weg, um zu sehen, ob Reasoning als einfache Text-Deltas
(oder als separate Thinking-Blöcke) ankommt.

Aktivieren Sie es per CLI:

```bash
pnpm gateway:watch --raw-stream
```

Optionale Pfadüberschreibung:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Entsprechende Env-Variablen:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Standarddatei:

`~/.openclaw/logs/raw-stream.jsonl`

## Logging roher Chunks (pi-mono)

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
> Provider `openai-completions` von pi-mono verwenden.

## Sicherheitshinweise

- Logs roher Streams können vollständige Prompts, Tool-Ausgaben und Benutzerdaten enthalten.
- Bewahren Sie Logs lokal auf und löschen Sie sie nach dem Debugging.
- Wenn Sie Logs weitergeben, entfernen Sie vorher Secrets und PII.
