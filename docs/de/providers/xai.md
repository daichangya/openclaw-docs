---
read_when:
    - Sie möchten Grok-Modelle in OpenClaw verwenden
    - Sie konfigurieren xAI-Authentifizierung oder Modell-IDs
summary: Grok-Modelle von xAI in OpenClaw verwenden
title: xAI
x-i18n:
    generated_at: "2026-04-05T12:54:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: d11f27b48c69eed6324595977bca3506c7709424eef64cc73899f8d049148b82
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw liefert ein gebündeltes Provider-Plugin `xai` für Grok-Modelle mit.

## Einrichtung

1. Erstellen Sie einen API-Schlüssel in der xAI-Konsole.
2. Setzen Sie `XAI_API_KEY`, oder führen Sie aus:

```bash
openclaw onboard --auth-choice xai-api-key
```

3. Wählen Sie ein Modell wie dieses:

```json5
{
  agents: { defaults: { model: { primary: "xai/grok-4" } } },
}
```

OpenClaw verwendet jetzt die xAI-Responses-API als gebündelten xAI-Transport. Derselbe
`XAI_API_KEY` kann auch für `web_search` mit Grok, erstklassiges `x_search`
und entferntes `code_execution` verwendet werden.
Wenn Sie einen xAI-Schlüssel unter `plugins.entries.xai.config.webSearch.apiKey`
speichern, verwendet der gebündelte xAI-Modell-Provider diesen Schlüssel jetzt ebenfalls als Fallback.
Das Tuning für `code_execution` befindet sich unter `plugins.entries.xai.config.codeExecution`.

## Aktueller gebündelter Modellkatalog

OpenClaw enthält jetzt standardmäßig diese xAI-Modellfamilien:

- `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`
- `grok-4`, `grok-4-0709`
- `grok-4-fast`, `grok-4-fast-non-reasoning`
- `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`
- `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning`
- `grok-code-fast-1`

Das Plugin löst auch neuere IDs vom Typ `grok-4*` und `grok-code-fast*` per Weiterleitung auf, wenn
sie derselben API-Form folgen.

Hinweise zu schnellen Modellen:

- `grok-4-fast`, `grok-4-1-fast` und die Varianten `grok-4.20-beta-*` sind die
  aktuellen bildfähigen Grok-Referenzen im gebündelten Katalog.
- `/fast on` oder `agents.defaults.models["xai/<model>"].params.fastMode: true`
  schreibt native xAI-Anfragen wie folgt um:
  - `grok-3` -> `grok-3-fast`
  - `grok-3-mini` -> `grok-3-mini-fast`
  - `grok-4` -> `grok-4-fast`
  - `grok-4-0709` -> `grok-4-fast`

Veraltete Kompatibilitäts-Aliase werden weiterhin auf die kanonischen gebündelten IDs normalisiert. Zum
Beispiel:

- `grok-4-fast-reasoning` -> `grok-4-fast`
- `grok-4-1-fast-reasoning` -> `grok-4-1-fast`
- `grok-4.20-reasoning` -> `grok-4.20-beta-latest-reasoning`
- `grok-4.20-non-reasoning` -> `grok-4.20-beta-latest-non-reasoning`

## Web Search

Der gebündelte Web-Search-Provider `grok` verwendet ebenfalls `XAI_API_KEY`:

```bash
openclaw config set tools.web.search.provider grok
```

## Bekannte Einschränkungen

- Die Authentifizierung ist derzeit nur per API-Schlüssel möglich. Einen xAI-OAuth-/Device-Code-Flow gibt es in OpenClaw noch nicht.
- `grok-4.20-multi-agent-experimental-beta-0304` wird auf dem normalen xAI-Provider-Pfad nicht unterstützt, da dafür eine andere Upstream-API-Oberfläche erforderlich ist als für den standardmäßigen xAI-Transport von OpenClaw.

## Hinweise

- OpenClaw wendet xAI-spezifische Kompatibilitätskorrekturen für Tool-Schemas und Tool-Calls automatisch auf dem gemeinsamen Runner-Pfad an.
- Native xAI-Anfragen verwenden standardmäßig `tool_stream: true`. Setzen Sie
  `agents.defaults.models["xai/<model>"].params.tool_stream` auf `false`, um
  dies zu deaktivieren.
- Der gebündelte xAI-Wrapper entfernt nicht unterstützte strikte Tool-Schema-Flags und
  Reasoning-Nutzlastschlüssel, bevor native xAI-Anfragen gesendet werden.
- `web_search`, `x_search` und `code_execution` werden als OpenClaw-Tools bereitgestellt. OpenClaw aktiviert das jeweils benötigte xAI-Built-in innerhalb jeder Tool-Anfrage, anstatt alle nativen Tools an jeden Chat-Turn anzuhängen.
- `x_search` und `code_execution` gehören dem gebündelten xAI-Plugin und sind nicht fest im Kern der Modell-Laufzeit codiert.
- `code_execution` ist entfernte xAI-Sandbox-Ausführung, nicht lokales [`exec`](/tools/exec).
- Einen umfassenderen Überblick über Provider finden Sie unter [Modell-Provider](/providers/index).
