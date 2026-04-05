---
read_when:
    - Sie möchten Deepgram-Speech-to-Text für Audioanhänge verwenden
    - Sie benötigen ein kurzes Deepgram-Konfigurationsbeispiel
summary: Deepgram-Transkription für eingehende Sprachnachrichten
title: Deepgram
x-i18n:
    generated_at: "2026-04-05T12:52:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: dabd1f6942c339fbd744fbf38040b6a663b06ddf4d9c9ee31e3ac034de9e79d9
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (Audio-Transkription)

Deepgram ist eine Speech-to-Text-API. In OpenClaw wird sie für die **Transkription eingehender Audio-/Sprachnachrichten** über `tools.media.audio` verwendet.

Wenn aktiviert, lädt OpenClaw die Audiodatei zu Deepgram hoch und injiziert das Transkript in die Antwort-Pipeline (`{{Transcript}}` + `[Audio]`-Block). Dies ist **kein Streaming**;
es verwendet den Endpunkt für voraufgezeichnete Transkription.

Website: [https://deepgram.com](https://deepgram.com)  
Dokumentation: [https://developers.deepgram.com](https://developers.deepgram.com)

## Schnellstart

1. Legen Sie Ihren API-Schlüssel fest:

```
DEEPGRAM_API_KEY=dg_...
```

2. Aktivieren Sie den Provider:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

## Optionen

- `model`: Deepgram-Modell-ID (Standard: `nova-3`)
- `language`: Sprachhinweis (optional)
- `tools.media.audio.providerOptions.deepgram.detect_language`: Spracherkennung aktivieren (optional)
- `tools.media.audio.providerOptions.deepgram.punctuate`: Zeichensetzung aktivieren (optional)
- `tools.media.audio.providerOptions.deepgram.smart_format`: intelligente Formatierung aktivieren (optional)

Beispiel mit Sprache:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
      },
    },
  },
}
```

Beispiel mit Deepgram-Optionen:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        providerOptions: {
          deepgram: {
            detect_language: true,
            punctuate: true,
            smart_format: true,
          },
        },
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

## Hinweise

- Die Authentifizierung folgt der Standardreihenfolge für Provider-Authentifizierung; `DEEPGRAM_API_KEY` ist der einfachste Weg.
- Überschreiben Sie Endpunkte oder Header mit `tools.media.audio.baseUrl` und `tools.media.audio.headers`, wenn Sie einen Proxy verwenden.
- Die Ausgabe folgt denselben Audioregeln wie bei anderen Providern (Größenbeschränkungen, Timeouts, Transkript-Injektion).
