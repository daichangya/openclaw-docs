---
read_when:
    - Sie möchten OpenClaw mit einem lokalen SGLang-Server ausführen
    - Sie möchten OpenAI-kompatible `/v1`-Endpunkte mit Ihren eigenen Models verwenden
summary: OpenClaw mit SGLang ausführen (OpenAI-kompatibler selbst gehosteter Server)
title: SGLang
x-i18n:
    generated_at: "2026-04-05T12:53:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9850277c6c5e318e60237688b4d8a5b1387d4e9586534ae2eb6ad953abba8948
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLang kann Open-Source-Modelle über eine **OpenAI-kompatible** HTTP-API bereitstellen.
OpenClaw kann sich über die API `openai-completions` mit SGLang verbinden.

OpenClaw kann verfügbare Modelle aus SGLang auch **automatisch erkennen**, wenn Sie
sich mit `SGLANG_API_KEY` dafür anmelden (jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt)
und Sie keinen expliziten Eintrag `models.providers.sglang` definieren.

## Schnellstart

1. Starten Sie SGLang mit einem OpenAI-kompatiblen Server.

Ihre Base URL sollte `/v1`-Endpunkte bereitstellen (zum Beispiel `/v1/models`,
`/v1/chat/completions`). SGLang läuft häufig unter:

- `http://127.0.0.1:30000/v1`

2. Aktivieren Sie es (jeder Wert funktioniert, wenn keine Authentifizierung konfiguriert ist):

```bash
export SGLANG_API_KEY="sglang-local"
```

3. Führen Sie das Onboarding aus und wählen Sie `SGLang`, oder setzen Sie direkt ein Model:

```bash
openclaw onboard
```

```json5
{
  agents: {
    defaults: {
      model: { primary: "sglang/your-model-id" },
    },
  },
}
```

## Model-Erkennung (impliziter Provider)

Wenn `SGLANG_API_KEY` gesetzt ist (oder ein Auth-Profil vorhanden ist) und Sie **nicht**
`models.providers.sglang` definieren, fragt OpenClaw Folgendes ab:

- `GET http://127.0.0.1:30000/v1/models`

und wandelt die zurückgegebenen IDs in Model-Einträge um.

Wenn Sie `models.providers.sglang` explizit setzen, wird die automatische Erkennung übersprungen und
Sie müssen Models manuell definieren.

## Explizite Konfiguration (manuelle Models)

Verwenden Sie eine explizite Konfiguration, wenn:

- SGLang auf einem anderen Host/Port läuft.
- Sie Werte für `contextWindow`/`maxTokens` festlegen möchten.
- Ihr Server einen echten API-Key erfordert (oder Sie Header kontrollieren möchten).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Fehlerbehebung

- Prüfen Sie, ob der Server erreichbar ist:

```bash
curl http://127.0.0.1:30000/v1/models
```

- Wenn Requests mit Authentifizierungsfehlern fehlschlagen, setzen Sie einen echten `SGLANG_API_KEY`, der zu
  Ihrer Serverkonfiguration passt, oder konfigurieren Sie den Provider explizit unter
  `models.providers.sglang`.

## Verhalten im Proxy-Stil

SGLang wird als OpenAI-kompatibles `/v1`-Backend im Proxy-Stil behandelt, nicht als
nativer OpenAI-Endpunkt.

- natives, nur für OpenAI geltendes Request-Shaping wird hier nicht angewendet
- kein `service_tier`, kein Responses-`store`, keine Prompt-Cache-Hinweise und kein
  Payload-Shaping für OpenAI-Reasoning-Kompatibilität
- versteckte OpenClaw-Attribution-Header (`originator`, `version`, `User-Agent`)
  werden bei benutzerdefinierten SGLang-Base-URLs nicht eingefügt
