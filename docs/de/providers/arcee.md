---
read_when:
    - Sie möchten Arcee AI mit OpenClaw verwenden
    - Sie benötigen die Env-Var für den API-Schlüssel oder die CLI-Auth-Auswahl
summary: Einrichtung von Arcee AI (Auth + Modellauswahl)
title: Arcee AI
x-i18n:
    generated_at: "2026-04-07T06:18:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb04909a708fec08dd2c8c863501b178f098bc4818eaebad38aea264157969d8
    source_path: providers/arcee.md
    workflow: 15
---

# Arcee AI

[Arcee AI](https://arcee.ai) bietet Zugriff auf die Trinity-Familie von Mixture-of-Experts-Modellen über eine OpenAI-kompatible API. Alle Trinity-Modelle sind unter Apache 2.0 lizenziert.

Auf Arcee-AI-Modelle kann direkt über die Arcee-Plattform oder über [OpenRouter](/de/providers/openrouter) zugegriffen werden.

- Anbieter: `arcee`
- Auth: `ARCEEAI_API_KEY` (direkt) oder `OPENROUTER_API_KEY` (über OpenRouter)
- API: OpenAI-kompatibel
- Basis-URL: `https://api.arcee.ai/api/v1` (direkt) oder `https://openrouter.ai/api/v1` (OpenRouter)

## Schnellstart

1. Holen Sie sich einen API-Schlüssel von [Arcee AI](https://chat.arcee.ai/) oder [OpenRouter](https://openrouter.ai/keys).

2. Setzen Sie den API-Schlüssel (empfohlen: für das Gateway speichern):

```bash
# Direkt (Arcee-Plattform)
openclaw onboard --auth-choice arceeai-api-key

# Über OpenRouter
openclaw onboard --auth-choice arceeai-openrouter
```

3. Legen Sie ein Standardmodell fest:

```json5
{
  agents: {
    defaults: {
      model: { primary: "arcee/trinity-large-thinking" },
    },
  },
}
```

## Nicht interaktives Beispiel

```bash
# Direkt (Arcee-Plattform)
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice arceeai-api-key \
  --arceeai-api-key "$ARCEEAI_API_KEY"

# Über OpenRouter
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice arceeai-openrouter \
  --openrouter-api-key "$OPENROUTER_API_KEY"
```

## Hinweis zur Umgebung

Wenn das Gateway als Daemon ausgeführt wird (`launchd`/`systemd`), stellen Sie sicher, dass `ARCEEAI_API_KEY`
(oder `OPENROUTER_API_KEY`) diesem Prozess zur Verfügung steht (zum Beispiel in
`~/.openclaw/.env` oder über `env.shellEnv`).

## Integrierter Katalog

OpenClaw liefert derzeit diesen gebündelten Arcee-Katalog aus:

| Modellreferenz                 | Name                   | Eingabe | Kontext | Kosten (ein/aus pro 1 Mio.) | Hinweise                                  |
| ------------------------------ | ---------------------- | ------- | ------- | --------------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text    | 256K    | $0.25 / $0.90               | Standardmodell; Reasoning aktiviert       |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text    | 128K    | $0.25 / $1.00               | Allgemeiner Einsatzzweck; 400B Parameter, 13B aktiv |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text    | 128K    | $0.045 / $0.15              | Schnell und kosteneffizient; Function Calling |

Dieselben Modellreferenzen funktionieren sowohl für direkte als auch für OpenRouter-Einrichtungen (zum Beispiel `arcee/trinity-large-thinking`).

Die Onboarding-Voreinstellung setzt `arcee/trinity-large-thinking` als Standardmodell.

## Unterstützte Funktionen

- Streaming
- Tool-Verwendung / Function Calling
- Strukturierte Ausgabe (JSON-Modus und JSON-Schema)
- Erweitertes Thinking (Trinity Large Thinking)
