---
read_when:
    - An Pi-Integrationscode oder -Tests arbeiten
    - Pi-spezifische Lint-, Typecheck- und Live-Test-Abläufe ausführen
summary: 'Entwickler-Workflow für die Pi-Integration: Build, Tests und Live-Validierung'
title: Pi-Entwicklungs-Workflow
x-i18n:
    generated_at: "2026-04-24T06:46:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb626bf21bc731b8ca7bb2a48692e17c8b93f2b6ffa471ed9e70d9c91cd57149
    source_path: pi-dev.md
    workflow: 15
---

Dieser Leitfaden fasst einen sinnvollen Workflow für die Arbeit an der Pi-Integration in OpenClaw zusammen.

## Typecheck und Linting

- Standardmäßiges lokales Gate: `pnpm check`
- Build-Gate: `pnpm build`, wenn die Änderung Build-Ausgabe, Packaging oder Lazy-Loading-/Modulgrenzen beeinflussen kann
- Vollständiges Landing-Gate für Pi-lastige Änderungen: `pnpm check && pnpm test`

## Pi-Tests ausführen

Führen Sie die Pi-fokussierte Testmenge direkt mit Vitest aus:

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

Um die Live-Prüfung des Anbieters einzubeziehen:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

Damit werden die wichtigsten Pi-Unit-Suites abgedeckt:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## Manuelles Testen

Empfohlener Ablauf:

- Gateway im Dev-Modus ausführen:
  - `pnpm gateway:dev`
- Agenten direkt auslösen:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- TUI für interaktives Debugging verwenden:
  - `pnpm tui`

Für das Verhalten von Tool-Aufrufen fordern Sie eine Aktion mit `read` oder `exec` an, damit Sie Tool-Streaming und Payload-Verarbeitung sehen können.

## Zurücksetzen auf einen sauberen Zustand

Der Zustand liegt unter dem OpenClaw-State-Verzeichnis. Standard ist `~/.openclaw`. Wenn `OPENCLAW_STATE_DIR` gesetzt ist, verwenden Sie stattdessen dieses Verzeichnis.

Um alles zurückzusetzen:

- `openclaw.json` für die Konfiguration
- `agents/<agentId>/agent/auth-profiles.json` für Modell-Auth-Profile (API-Schlüssel + OAuth)
- `credentials/` für Anbieter-/Channel-Zustand, der noch außerhalb des Auth-Profile-Store lebt
- `agents/<agentId>/sessions/` für den Sitzungsverlauf des Agenten
- `agents/<agentId>/sessions/sessions.json` für den Sitzungsindex
- `sessions/`, falls Legacy-Pfade existieren
- `workspace/`, wenn Sie einen leeren Workspace möchten

Wenn Sie nur Sitzungen zurücksetzen möchten, löschen Sie `agents/<agentId>/sessions/` für diesen Agenten. Wenn Sie Auth beibehalten möchten, lassen Sie `agents/<agentId>/agent/auth-profiles.json` und jeglichen Anbieterzustand unter `credentials/` bestehen.

## Referenzen

- [Tests](/de/help/testing)
- [Erste Schritte](/de/start/getting-started)

## Verwandt

- [Pi-Integrationsarchitektur](/de/pi)
