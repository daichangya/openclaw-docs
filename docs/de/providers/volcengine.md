---
read_when:
    - Sie möchten Volcano Engine oder Doubao-Modelle mit OpenClaw verwenden
    - Sie benötigen die Einrichtung des Volcengine-API-Keys
summary: Einrichtung von Volcano Engine (Doubao-Modelle, allgemeine und Coding-Endpunkte)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-05T12:54:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85d9e737e906cd705fb31479d6b78d92b68c9218795ea9667516c1571dcaaf3a
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine (Doubao)

Der Volcengine-Provider bietet Zugriff auf Doubao-Modelle und Drittanbieter-Modelle,
die auf Volcano Engine gehostet werden, mit separaten Endpunkten für allgemeine und Coding-
Workloads.

- Provider: `volcengine` (allgemein) + `volcengine-plan` (Coding)
- Authentifizierung: `VOLCANO_ENGINE_API_KEY`
- API: OpenAI-kompatibel

## Schnellstart

1. Den API-Key setzen:

```bash
openclaw onboard --auth-choice volcengine-api-key
```

2. Ein Standard-Model festlegen:

```json5
{
  agents: {
    defaults: {
      model: { primary: "volcengine-plan/ark-code-latest" },
    },
  },
}
```

## Nicht interaktives Beispiel

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

## Provider und Endpunkte

| Provider          | Endpunkt                                 | Anwendungsfall |
| ----------------- | ---------------------------------------- | -------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`       | Allgemeine Modelle |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Coding-Modelle |

Beide Provider werden mit einem einzigen API-Key konfiguriert. Das Setup registriert beide
automatisch.

## Verfügbare Modelle

Allgemeiner Provider (`volcengine`):

| Model-Referenz                               | Name                            | Eingabe     | Kontext |
| -------------------------------------------- | ------------------------------- | ----------- | ------- |
| `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | Text, Bild  | 256,000 |
| `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | Text, Bild  | 256,000 |
| `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | Text, Bild  | 256,000 |
| `volcengine/glm-4-7-251222`                  | GLM 4.7                         | Text, Bild  | 200,000 |
| `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | Text, Bild  | 128,000 |

Coding-Provider (`volcengine-plan`):

| Model-Referenz                                    | Name                     | Eingabe | Kontext |
| ------------------------------------------------- | ------------------------ | ------- | ------- |
| `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | Text    | 256,000 |
| `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | Text    | 256,000 |
| `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | Text    | 200,000 |
| `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | Text    | 256,000 |
| `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | Text    | 256,000 |
| `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | Text    | 256,000 |

`openclaw onboard --auth-choice volcengine-api-key` setzt derzeit
`volcengine-plan/ark-code-latest` als Standard-Model und registriert gleichzeitig
den allgemeinen `volcengine`-Katalog.

Während der Auswahl von Models in Onboarding/Konfiguration bevorzugt die Volcengine-Authentifizierungsoption
sowohl Zeilen `volcengine/*` als auch `volcengine-plan/*`. Wenn diese Modelle noch nicht
geladen sind, greift OpenClaw stattdessen auf den ungefilterten Katalog zurück, anstatt einen
leeren providerbezogenen Picker anzuzeigen.

## Hinweis zur Umgebung

Wenn das Gateway als Daemon läuft (`launchd`/`systemd`), stellen Sie sicher, dass
`VOLCANO_ENGINE_API_KEY` für diesen Prozess verfügbar ist (zum Beispiel in
`~/.openclaw/.env` oder über `env.shellEnv`).
