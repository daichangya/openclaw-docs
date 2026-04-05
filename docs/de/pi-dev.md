---
read_when:
    - Arbeiten an Pi-Integrationscode oder -Tests
    - Pi-spezifische Lint-, Typecheck- und Live-Test-Abläufe ausführen
summary: 'Entwickler-Workflow für die Pi-Integration: Build, Tests und Live-Validierung'
title: Pi-Entwicklungs-Workflow
x-i18n:
    generated_at: "2026-04-05T12:48:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: f61ebe29ea38ac953a03fe848fe5ac6b6de4bace5e6955b76ae9a7d093eb0cc5
    source_path: pi-dev.md
    workflow: 15
---

# Pi-Entwicklungs-Workflow

Diese Anleitung fasst einen sinnvollen Workflow für die Arbeit an der Pi-Integration in OpenClaw zusammen.

## Type Checking und Linting

- Standardmäßiges lokales Gate: `pnpm check`
- Build-Gate: `pnpm build`, wenn die Änderung Build-Ausgabe, Packaging oder Lazy-Loading-/Modulgrenzen beeinflussen kann
- Vollständiges Landing-Gate für Pi-lastige Änderungen: `pnpm check && pnpm test`

## Pi-Tests ausführen

Führen Sie die auf Pi fokussierte Testsuite direkt mit Vitest aus:

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

Um den Live-Provider-Test einzubeziehen:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

Dies deckt die wichtigsten Pi-Unit-Suites ab:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## Manuelles Testen

Empfohlener Ablauf:

- Das Gateway im Entwicklungsmodus ausführen:
  - `pnpm gateway:dev`
- Den Agenten direkt auslösen:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Die TUI für interaktives Debugging verwenden:
  - `pnpm tui`

Für das Verhalten von Tool-Aufrufen fordern Sie eine Aktion `read` oder `exec` an, damit Sie Tool-Streaming und Payload-Verarbeitung sehen können.

## Reset auf einen sauberen Ausgangszustand

Der Status liegt unter dem OpenClaw-Statusverzeichnis. Standardmäßig ist das `~/.openclaw`. Wenn `OPENCLAW_STATE_DIR` gesetzt ist, verwenden Sie stattdessen dieses Verzeichnis.

Um alles zurückzusetzen:

- `openclaw.json` für die Konfiguration
- `agents/<agentId>/agent/auth-profiles.json` für Modell-Auth-Profile (API-Schlüssel + OAuth)
- `credentials/` für Provider-/Kanalstatus, der weiterhin außerhalb des Auth-Profil-Stores liegt
- `agents/<agentId>/sessions/` für den Sitzungsverlauf des Agenten
- `agents/<agentId>/sessions/sessions.json` für den Sitzungsindex
- `sessions/`, falls Legacy-Pfade existieren
- `workspace/`, wenn Sie einen leeren Workspace möchten

Wenn Sie nur Sitzungen zurücksetzen möchten, löschen Sie `agents/<agentId>/sessions/` für diesen Agenten. Wenn Sie Auth beibehalten möchten, lassen Sie `agents/<agentId>/agent/auth-profiles.json` und jeden Provider-Status unter `credentials/` unangetastet.

## Referenzen

- [Testing](/help/testing)
- [Getting Started](/de/start/getting-started)
