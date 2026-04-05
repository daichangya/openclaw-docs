---
read_when:
    - Sie möchten Groq mit OpenClaw verwenden
    - Sie benötigen die env var für den API-Schlüssel oder die CLI-Authentifizierungsoption
summary: Groq-Einrichtung (Authentifizierung + Modellauswahl)
title: Groq
x-i18n:
    generated_at: "2026-04-05T12:53:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e27532cafcdaf1ac336fa310e08e4e3245d2d0eb0e94e0bcf42c532c6a9a80b
    source_path: providers/groq.md
    workflow: 15
---

# Groq

[Groq](https://groq.com) bietet ultraschnelle Inferenz auf Open-Source-Modellen
(Llama, Gemma, Mistral und mehr) mit benutzerdefinierter LPU-Hardware. OpenClaw verbindet sich
über die OpenAI-kompatible API mit Groq.

- Provider: `groq`
- Authentifizierung: `GROQ_API_KEY`
- API: OpenAI-kompatibel

## Schnellstart

1. Holen Sie sich einen API-Schlüssel von [console.groq.com/keys](https://console.groq.com/keys).

2. Setzen Sie den API-Schlüssel:

```bash
export GROQ_API_KEY="gsk_..."
```

3. Legen Sie ein Standardmodell fest:

```json5
{
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Beispiel für eine Konfigurationsdatei

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Audiotranskription

Groq bietet außerdem schnelle Whisper-basierte Audiotranskription. Wenn Groq als
Provider für Medienverständnis konfiguriert ist, verwendet OpenClaw das Modell `whisper-large-v3-turbo`
von Groq, um Sprachnachrichten über die gemeinsame Oberfläche `tools.media.audio`
zu transkribieren.

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

## Hinweis zur Umgebung

Wenn das Gateway als Daemon ausgeführt wird (`launchd`/`systemd`), stellen Sie sicher, dass `GROQ_API_KEY`
für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über
`env.shellEnv`).

## Hinweise zu Audio

- Gemeinsamer Konfigurationspfad: `tools.media.audio`
- Standard-Base-URL für Groq-Audio: `https://api.groq.com/openai/v1`
- Standard-Audiomodell für Groq: `whisper-large-v3-turbo`
- Die Audiotranskription von Groq verwendet den OpenAI-kompatiblen Pfad `/audio/transcriptions`

## Verfügbare Modelle

Der Modellkatalog von Groq ändert sich häufig. Führen Sie `openclaw models list | grep groq`
aus, um die aktuell verfügbaren Modelle zu sehen, oder prüfen Sie
[console.groq.com/docs/models](https://console.groq.com/docs/models).

Beliebte Optionen sind:

- **Llama 3.3 70B Versatile** - universell einsetzbar, großer Kontext
- **Llama 3.1 8B Instant** - schnell, leichtgewichtig
- **Gemma 2 9B** - kompakt, effizient
- **Mixtral 8x7B** - MoE-Architektur, starke Reasoning-Fähigkeiten

## Links

- [Groq Console](https://console.groq.com)
- [API-Dokumentation](https://console.groq.com/docs)
- [Modellliste](https://console.groq.com/docs/models)
- [Preise](https://groq.com/pricing)
