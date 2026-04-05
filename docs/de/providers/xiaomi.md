---
read_when:
    - Sie möchten Xiaomi-MiMo-Modelle in OpenClaw verwenden
    - Sie benötigen die Einrichtung von XIAOMI_API_KEY
summary: Xiaomi-MiMo-Modelle mit OpenClaw verwenden
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-05T12:54:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2533fa99b29070e26e0e1fbde924e1291c89b1fbc2537451bcc0eb677ea6949
    source_path: providers/xiaomi.md
    workflow: 15
---

# Xiaomi MiMo

Xiaomi MiMo ist die API-Plattform für **MiMo**-Modelle. OpenClaw verwendet den
OpenAI-kompatiblen Endpunkt von Xiaomi mit API-Key-Authentifizierung. Erstellen Sie Ihren API-Schlüssel in der
[Xiaomi-MiMo-Konsole](https://platform.xiaomimimo.com/#/console/api-keys) und konfigurieren Sie dann den
gebündelten Provider `xiaomi` mit diesem Schlüssel.

## Integrierter Katalog

- Base URL: `https://api.xiaomimimo.com/v1`
- API: `openai-completions`
- Authentifizierung: `Bearer $XIAOMI_API_KEY`

| Modellreferenz         | Eingabe     | Kontext   | Max. Ausgabe | Hinweise                     |
| ---------------------- | ----------- | --------- | ------------ | ---------------------------- |
| `xiaomi/mimo-v2-flash` | text        | 262,144   | 8,192        | Standardmodell               |
| `xiaomi/mimo-v2-pro`   | text        | 1,048,576 | 32,000       | Mit Reasoning                |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144   | 32,000       | Multimodal mit Reasoning     |

## CLI-Einrichtung

```bash
openclaw onboard --auth-choice xiaomi-api-key
# oder nicht interaktiv
openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
```

## Konfigurations-Snippet

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

## Hinweise

- Standard-Modellreferenz: `xiaomi/mimo-v2-flash`.
- Zusätzliche integrierte Modelle: `xiaomi/mimo-v2-pro`, `xiaomi/mimo-v2-omni`.
- Der Provider wird automatisch eingefügt, wenn `XIAOMI_API_KEY` gesetzt ist (oder ein Auth-Profil vorhanden ist).
- Siehe [/concepts/model-providers](/de/concepts/model-providers) für Provider-Regeln.
