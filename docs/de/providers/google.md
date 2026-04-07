---
read_when:
    - Sie möchten Google-Gemini-Modelle mit OpenClaw verwenden
    - Sie benötigen den API-Schlüssel- oder OAuth-Authentifizierungsablauf
summary: Einrichtung von Google Gemini (API-Schlüssel + OAuth, Bildgenerierung, Medienverständnis, Websuche)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-07T06:18:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36cc7c7d8d19f6d4a3fb223af36c8402364fc309d14ffe922bd004203ceb1754
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Das Google-Plugin bietet Zugriff auf Gemini-Modelle über Google AI Studio sowie
Bildgenerierung, Medienverständnis (Bild/Audio/Video) und Websuche über
Gemini Grounding.

- Provider: `google`
- Auth: `GEMINI_API_KEY` oder `GOOGLE_API_KEY`
- API: Google Gemini API
- Alternativer Provider: `google-gemini-cli` (OAuth)

## Schnellstart

1. Setzen Sie den API-Schlüssel:

```bash
openclaw onboard --auth-choice gemini-api-key
```

2. Setzen Sie ein Standardmodell:

```json5
{
  agents: {
    defaults: {
      model: { primary: "google/gemini-3.1-pro-preview" },
    },
  },
}
```

## Nicht interaktives Beispiel

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice gemini-api-key \
  --gemini-api-key "$GEMINI_API_KEY"
```

## OAuth (Gemini CLI)

Ein alternativer Provider `google-gemini-cli` verwendet PKCE-OAuth statt eines API-
Schlüssels. Dies ist eine inoffizielle Integration; einige Benutzer berichten von
Kontoeinschränkungen. Verwendung auf eigenes Risiko.

- Standardmodell: `google-gemini-cli/gemini-3.1-pro-preview`
- Alias: `gemini-cli`
- Installationsvoraussetzung: lokale Gemini CLI muss als `gemini` verfügbar sein
  - Homebrew: `brew install gemini-cli`
  - npm: `npm install -g @google/gemini-cli`
- Anmeldung:

```bash
openclaw models auth login --provider google-gemini-cli --set-default
```

Umgebungsvariablen:

- `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
- `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

(Oder die Varianten `GEMINI_CLI_*`.)

Wenn Gemini-CLI-OAuth-Anfragen nach der Anmeldung fehlschlagen, setzen Sie
`GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host und
versuchen Sie es erneut.

Wenn die Anmeldung fehlschlägt, bevor der Browser-Ablauf startet, stellen Sie sicher, dass der lokale `gemini`-
Befehl installiert und auf `PATH` verfügbar ist. OpenClaw unterstützt sowohl Homebrew-Installationen
als auch globale npm-Installationen, einschließlich gängiger Windows-/npm-Layouts.

Hinweise zur JSON-Nutzung der Gemini CLI:

- Antworttext stammt aus dem JSON-Feld `response` der CLI.
- Die Nutzung greift auf `stats` zurück, wenn die CLI `usage` leer lässt.
- `stats.cached` wird in OpenClaw `cacheRead` normalisiert.
- Wenn `stats.input` fehlt, leitet OpenClaw Eingabetokens aus
  `stats.input_tokens - stats.cached` ab.

## Fähigkeiten

| Fähigkeit | Unterstützt |
| ---------------------- | ----------------- |
| Chat-Completions | Ja |
| Bildgenerierung | Ja |
| Musikgenerierung | Ja |
| Bildverständnis | Ja |
| Audiotranskription | Ja |
| Videoverständnis | Ja |
| Websuche (Grounding) | Ja |
| Thinking/Reasoning | Ja (Gemini 3.1+) |

## Direkte Wiederverwendung des Gemini-Cache

Für direkte Gemini-API-Ausführungen (`api: "google-generative-ai"`) reicht OpenClaw jetzt
einen konfigurierten `cachedContent`-Handle an Gemini-Anfragen weiter.

- Konfigurieren Sie modellbezogene oder globale Parameter mit entweder
  `cachedContent` oder dem Legacy-Wert `cached_content`
- Wenn beide vorhanden sind, hat `cachedContent` Vorrang
- Beispielwert: `cachedContents/prebuilt-context`
- Die Nutzungsdaten für Gemini-Cache-Treffer werden in OpenClaw von
  `cachedContentTokenCount` aus dem Upstream in `cacheRead` normalisiert

Beispiel:

```json5
{
  agents: {
    defaults: {
      models: {
        "google/gemini-2.5-pro": {
          params: {
            cachedContent: "cachedContents/prebuilt-context",
          },
        },
      },
    },
  },
}
```

## Bildgenerierung

Der gebündelte Bildgenerierungs-Provider `google` verwendet standardmäßig
`google/gemini-3.1-flash-image-preview`.

- Unterstützt auch `google/gemini-3-pro-image-preview`
- Generieren: bis zu 4 Bilder pro Anfrage
- Bearbeitungsmodus: aktiviert, bis zu 5 Eingabebilder
- Geometriesteuerungen: `size`, `aspectRatio` und `resolution`

Der reine OAuth-Provider `google-gemini-cli` ist eine separate Oberfläche für Textinferenz.
Bildgenerierung, Medienverständnis und Gemini Grounding verbleiben unter der
Provider-ID `google`.

So verwenden Sie Google als Standard-Bildprovider:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

Siehe [Image Generation](/de/tools/image-generation) für die gemeinsamen Tool-
Parameter, Providerauswahl und Failover-Verhalten.

## Videogenerierung

Das gebündelte Plugin `google` registriert außerdem Videogenerierung über das gemeinsame
Tool `video_generate`.

- Standard-Videomodell: `google/veo-3.1-fast-generate-preview`
- Modi: Text-zu-Video, Bild-zu-Video und Abläufe mit einzelner Video-Referenz
- Unterstützt `aspectRatio`, `resolution` und `audio`
- Aktuelle Begrenzung der Dauer: **4 bis 8 Sekunden**

So verwenden Sie Google als Standard-Videoprovider:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

Siehe [Video Generation](/de/tools/video-generation) für die gemeinsamen Tool-
Parameter, Providerauswahl und Failover-Verhalten.

## Musikgenerierung

Das gebündelte Plugin `google` registriert außerdem Musikgenerierung über das gemeinsame
Tool `music_generate`.

- Standard-Musikmodell: `google/lyria-3-clip-preview`
- Unterstützt auch `google/lyria-3-pro-preview`
- Prompt-Steuerungen: `lyrics` und `instrumental`
- Ausgabeformat: standardmäßig `mp3`, zusätzlich `wav` für `google/lyria-3-pro-preview`
- Referenzeingaben: bis zu 10 Bilder
- Sitzungsbasierte Ausführungen werden über den gemeinsamen Task-/Status-Ablauf entkoppelt, einschließlich `action: "status"`

So verwenden Sie Google als Standard-Musikprovider:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

Siehe [Music Generation](/de/tools/music-generation) für die gemeinsamen Tool-
Parameter, Providerauswahl und Failover-Verhalten.

## Hinweis zur Umgebung

Wenn das Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass `GEMINI_API_KEY`
diesem Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über
`env.shellEnv`).
