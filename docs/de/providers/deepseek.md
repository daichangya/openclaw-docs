---
read_when:
    - Sie möchten DeepSeek mit OpenClaw verwenden
    - Sie benötigen die API-Key-Umgebungsvariable oder die CLI-Authentifizierungsoption
summary: DeepSeek-Einrichtung (Authentifizierung + Model-Auswahl)
x-i18n:
    generated_at: "2026-04-05T12:52:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35f339ca206399496ce094eb8350e0870029ce9605121bcf86c4e9b94f3366c6
    source_path: providers/deepseek.md
    workflow: 15
---

# DeepSeek

[DeepSeek](https://www.deepseek.com) bietet leistungsstarke KI-Modelle mit einer OpenAI-kompatiblen API.

- Provider: `deepseek`
- Authentifizierung: `DEEPSEEK_API_KEY`
- API: OpenAI-kompatibel
- Base URL: `https://api.deepseek.com`

## Schnellstart

Setzen Sie den API-Key (empfohlen: für das Gateway speichern):

```bash
openclaw onboard --auth-choice deepseek-api-key
```

Dadurch werden Sie zur Eingabe Ihres API-Keys aufgefordert und `deepseek/deepseek-chat` als Standard-Model festgelegt.

## Nicht interaktives Beispiel

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice deepseek-api-key \
  --deepseek-api-key "$DEEPSEEK_API_KEY" \
  --skip-health \
  --accept-risk
```

## Hinweis zur Umgebung

Wenn das Gateway als Daemon läuft (`launchd`/`systemd`), stellen Sie sicher, dass `DEEPSEEK_API_KEY`
für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über
`env.shellEnv`).

## Integrierter Katalog

| Model-Referenz               | Name              | Eingabe | Kontext | Max. Ausgabe | Hinweise                                          |
| ---------------------------- | ----------------- | ------- | ------- | ------------ | ------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | Text    | 131,072 | 8,192        | Standard-Model; Nicht-Thinking-Oberfläche von DeepSeek V3.2 |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | Text    | 131,072 | 65,536       | Reasoning-aktivierte V3.2-Oberfläche              |

Beide gebündelten Modelle deklarieren derzeit in der Quelle Kompatibilität mit Streaming-Usage.

Holen Sie sich Ihren API-Key unter [platform.deepseek.com](https://platform.deepseek.com/api_keys).
