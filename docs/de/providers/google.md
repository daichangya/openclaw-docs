---
read_when:
    - Sie möchten Google-Gemini-Modelle mit OpenClaw verwenden
    - Sie benötigen den API-Schlüssel oder den OAuth-Authentifizierungsablauf
summary: Einrichtung von Google Gemini (API-Schlüssel + OAuth, Bilderzeugung, Medienverständnis, Websuche)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-05T12:53:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa3c4326e83fad277ae4c2cb9501b6e89457afcfa7e3e1d57ae01c9c0c6846e2
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Das Google-Plugin bietet Zugriff auf Gemini-Modelle über Google AI Studio sowie
Bilderzeugung, Medienverständnis (Bild/Audio/Video) und Websuche über
Gemini Grounding.

- Provider: `google`
- Authentifizierung: `GEMINI_API_KEY` oder `GOOGLE_API_KEY`
- API: Google Gemini API
- Alternativer Provider: `google-gemini-cli` (OAuth)

## Schnellstart

1. Legen Sie den API-Schlüssel fest:

```bash
openclaw onboard --auth-choice gemini-api-key
```

2. Legen Sie ein Standardmodell fest:

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

Ein alternativer Provider `google-gemini-cli` verwendet PKCE-OAuth anstelle eines API-
Schlüssels. Dies ist eine inoffizielle Integration; einige Benutzer berichten von
Kontoeinschränkungen. Verwendung auf eigenes Risiko.

- Standardmodell: `google-gemini-cli/gemini-3.1-pro-preview`
- Alias: `gemini-cli`
- Installationsvoraussetzung: lokale Gemini CLI verfügbar als `gemini`
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

Wenn OAuth-Anfragen von Gemini CLI nach der Anmeldung fehlschlagen, setzen Sie
`GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host und
versuchen Sie es erneut.

Wenn die Anmeldung fehlschlägt, bevor der Browser-Ablauf startet, stellen Sie sicher, dass der lokale Befehl `gemini`
installiert ist und sich im `PATH` befindet. OpenClaw unterstützt sowohl Homebrew-Installationen
als auch globale npm-Installationen, einschließlich gängiger Windows-/npm-Layouts.

Hinweise zur JSON-Nutzung von Gemini CLI:

- Antworttext stammt aus dem CLI-JSON-Feld `response`.
- Nutzung fällt auf `stats` zurück, wenn die CLI `usage` leer lässt.
- `stats.cached` wird in OpenClaw `cacheRead` normalisiert.
- Wenn `stats.input` fehlt, leitet OpenClaw Eingabe-Tokens aus
  `stats.input_tokens - stats.cached` ab.

## Funktionen

| Funktion                  | Unterstützt      |
| ------------------------- | ---------------- |
| Chat Completions          | Ja               |
| Bilderzeugung             | Ja               |
| Bildverständnis           | Ja               |
| Audio-Transkription       | Ja               |
| Videoverständnis          | Ja               |
| Websuche (Grounding)      | Ja               |
| Thinking/Reasoning        | Ja (Gemini 3.1+) |

## Direkte Wiederverwendung des Gemini-Cache

Für direkte Gemini-API-Ausführungen (`api: "google-generative-ai"`) übergibt OpenClaw jetzt
einen konfigurierten `cachedContent`-Handle an Gemini-Anfragen.

- Konfigurieren Sie Parameter pro Modell oder global mit entweder
  `cachedContent` oder dem alten `cached_content`
- Wenn beide vorhanden sind, hat `cachedContent` Vorrang
- Beispielwert: `cachedContents/prebuilt-context`
- Die Nutzungsdaten eines Gemini-Cache-Treffers werden in OpenClaw `cacheRead` normalisiert aus
  dem Upstream-Wert `cachedContentTokenCount`

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

## Bilderzeugung

Der gebündelte Provider `google` für Bilderzeugung verwendet standardmäßig
`google/gemini-3.1-flash-image-preview`.

- Unterstützt auch `google/gemini-3-pro-image-preview`
- Erzeugen: bis zu 4 Bilder pro Anfrage
- Bearbeitungsmodus: aktiviert, bis zu 5 Eingabebilder
- Geometriesteuerungen: `size`, `aspectRatio` und `resolution`

Der reine OAuth-Provider `google-gemini-cli` ist eine separate Oberfläche für Textinferenz.
Bilderzeugung, Medienverständnis und Gemini Grounding bleiben beim
Provider-ID `google`.

## Hinweis zur Umgebung

Wenn das Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass `GEMINI_API_KEY`
diesem Prozess zur Verfügung steht (zum Beispiel in `~/.openclaw/.env` oder über
`env.shellEnv`).
