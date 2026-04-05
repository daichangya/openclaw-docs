---
read_when:
    - Du möchtest OpenClaw mit einem lokalen vLLM-Server verwenden
    - Du möchtest OpenAI-kompatible `/v1`-Endpunkte mit deinen eigenen Modellen verwenden
summary: OpenClaw mit vLLM ausführen (OpenAI-kompatibler lokaler Server)
title: vLLM
x-i18n:
    generated_at: "2026-04-05T12:54:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebde34d0453586d10340680b8d51465fdc98bd28e8a96acfaeb24606886b50f4
    source_path: providers/vllm.md
    workflow: 15
---

# vLLM

vLLM kann Open-Source-Modelle (und einige benutzerdefinierte Modelle) über eine **OpenAI-kompatible** HTTP-API bereitstellen. OpenClaw kann sich über die API `openai-completions` mit vLLM verbinden.

OpenClaw kann verfügbare Modelle aus vLLM außerdem **automatisch erkennen**, wenn du dich mit `VLLM_API_KEY` dafür entscheidest (jeder Wert funktioniert, wenn dein Server keine Authentifizierung erzwingt) und keinen expliziten Eintrag `models.providers.vllm` definierst.

## Schnellstart

1. Starte vLLM mit einem OpenAI-kompatiblen Server.

Deine Base-URL sollte `/v1`-Endpunkte bereitstellen (z. B. `/v1/models`, `/v1/chat/completions`). vLLM läuft üblicherweise unter:

- `http://127.0.0.1:8000/v1`

2. Opt-in aktivieren (jeder Wert funktioniert, wenn keine Authentifizierung konfiguriert ist):

```bash
export VLLM_API_KEY="vllm-local"
```

3. Ein Modell auswählen (ersetze dies durch eine deiner vLLM-Modell-IDs):

```json5
{
  agents: {
    defaults: {
      model: { primary: "vllm/your-model-id" },
    },
  },
}
```

## Modell-Discovery (impliziter Provider)

Wenn `VLLM_API_KEY` gesetzt ist (oder ein Auth-Profil existiert) und du **nicht** `models.providers.vllm` definierst, fragt OpenClaw Folgendes ab:

- `GET http://127.0.0.1:8000/v1/models`

…und wandelt die zurückgegebenen IDs in Modelleinträge um.

Wenn du `models.providers.vllm` explizit setzt, wird die automatische Erkennung übersprungen und du musst Modelle manuell definieren.

## Explizite Konfiguration (manuelle Modelle)

Verwende eine explizite Konfiguration, wenn:

- vLLM auf einem anderen Host/Port läuft.
- Du Werte für `contextWindow`/`maxTokens` festlegen möchtest.
- Dein Server einen echten API-Key erfordert (oder du Header selbst steuern möchtest).

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Lokales vLLM-Modell",
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

- Prüfen, ob der Server erreichbar ist:

```bash
curl http://127.0.0.1:8000/v1/models
```

- Wenn Anfragen mit Authentifizierungsfehlern fehlschlagen, setze einen echten `VLLM_API_KEY`, der zu deiner Serverkonfiguration passt, oder konfiguriere den Provider explizit unter `models.providers.vllm`.

## Verhalten im Proxy-Stil

vLLM wird als OpenAI-kompatibles `/v1`-Backend im Proxy-Stil behandelt, nicht als nativer OpenAI-Endpunkt.

- natives request shaping nur für OpenAI wird hier nicht angewendet
- kein `service_tier`, kein Responses-`store`, keine Prompt-Cache-Hinweise und keine Formung von OpenAI-Reasoning-Kompatibilitäts-Payloads
- versteckte OpenClaw-Attributions-Header (`originator`, `version`, `User-Agent`) werden bei benutzerdefinierten vLLM-Base-URLs nicht eingefügt
