---
read_when:
    - Sie möchten Together AI mit OpenClaw verwenden
    - Sie benötigen die API-Key-Umgebungsvariable oder die CLI-Authentifizierungsoption
summary: Einrichtung von Together AI (Authentifizierung + Model-Auswahl)
title: Together AI
x-i18n:
    generated_at: "2026-04-05T12:54:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22aacbaadf860ce8245bba921dcc5ede9da8fd6fa1bc3cc912551aecc1ba0d71
    source_path: providers/together.md
    workflow: 15
---

# Together AI

[Together AI](https://together.ai) bietet über eine einheitliche API Zugriff auf führende Open-Source-Modelle, darunter Llama, DeepSeek, Kimi und weitere.

- Provider: `together`
- Authentifizierung: `TOGETHER_API_KEY`
- API: OpenAI-kompatibel
- Base URL: `https://api.together.xyz/v1`

## Schnellstart

1. Setzen Sie den API-Key (empfohlen: für das Gateway speichern):

```bash
openclaw onboard --auth-choice together-api-key
```

2. Setzen Sie ein Standard-Model:

```json5
{
  agents: {
    defaults: {
      model: { primary: "together/moonshotai/Kimi-K2.5" },
    },
  },
}
```

## Nicht interaktives Beispiel

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

Dadurch wird `together/moonshotai/Kimi-K2.5` als Standard-Model festgelegt.

## Hinweis zur Umgebung

Wenn das Gateway als Daemon läuft (`launchd`/`systemd`), stellen Sie sicher, dass `TOGETHER_API_KEY`
für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über
`env.shellEnv`).

## Integrierter Katalog

OpenClaw liefert derzeit diesen gebündelten Together-Katalog aus:

| Model-Referenz                                               | Name                                   | Eingabe     | Kontext    | Hinweise                         |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | Text, Bild  | 262,144    | Standard-Model; Reasoning aktiviert |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | Text        | 202,752    | Allzweck-Text-Model             |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | Text        | 131,072    | Schnelles Instruct-Model        |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | Text, Bild  | 10,000,000 | Multimodal                      |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | Text, Bild  | 20,000,000 | Multimodal                      |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | Text        | 131,072    | Allgemeines Text-Model          |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | Text        | 131,072    | Reasoning-Model                 |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | Text        | 262,144    | Sekundäres Kimi-Text-Model      |

Das Onboarding-Preset setzt `together/moonshotai/Kimi-K2.5` als Standard-Model.
