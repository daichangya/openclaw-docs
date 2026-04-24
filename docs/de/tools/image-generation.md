---
read_when:
    - Bilder über den Agenten generieren
    - Provider und Modelle für Bildgenerierung konfigurieren
    - Die Parameter des Tools `image_generate` verstehen
summary: Bilder mit konfigurierten Providern generieren und bearbeiten (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Bildgenerierung
x-i18n:
    generated_at: "2026-04-24T07:03:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51ffc32165c5e25925460f95f3a6e674a004e6640b7a4b9e88d025eb40943b4b
    source_path: tools/image-generation.md
    workflow: 15
---

Mit dem Tool `image_generate` kann der Agent Bilder mit Ihren konfigurierten Providern erstellen und bearbeiten. Generierte Bilder werden automatisch als Medienanhänge in der Antwort des Agenten zugestellt.

<Note>
Das Tool erscheint nur, wenn mindestens ein Provider für Bildgenerierung verfügbar ist. Wenn Sie `image_generate` nicht in den Tools Ihres Agenten sehen, konfigurieren Sie `agents.defaults.imageGenerationModel`, richten Sie einen API-Schlüssel für einen Provider ein oder melden Sie sich mit OpenAI Codex OAuth an.
</Note>

## Schnellstart

1. Setzen Sie für mindestens einen Provider einen API-Schlüssel (zum Beispiel `OPENAI_API_KEY`, `GEMINI_API_KEY` oder `OPENROUTER_API_KEY`) oder melden Sie sich mit OpenAI Codex OAuth an.
2. Setzen Sie optional Ihr bevorzugtes Modell:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
      },
    },
  },
}
```

Codex OAuth verwendet dieselbe Modellreferenz `openai/gpt-image-2`. Wenn ein
OAuth-Profil `openai-codex` konfiguriert ist, leitet OpenClaw Bildanfragen
über dasselbe OAuth-Profil weiter, statt zuerst `OPENAI_API_KEY` zu versuchen.
Explizite benutzerdefinierte Bildkonfiguration unter `models.providers.openai`, etwa ein API-Schlüssel oder
eine benutzerdefinierte/Azure-Base-URL, aktiviert wieder den direkten OpenAI-Images-API-Pfad.
Für OpenAI-kompatible LAN-Endpunkte wie LocalAI behalten Sie die benutzerdefinierte
`models.providers.openai.baseUrl` bei und aktivieren Sie explizit
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; private/interne
Bild-Endpunkte bleiben standardmäßig blockiert.

3. Fragen Sie den Agenten: _„Generiere ein Bild eines freundlichen Roboter-Maskottchens.“_

Der Agent ruft `image_generate` automatisch auf. Kein Allowlisting für Tools erforderlich — es ist standardmäßig aktiviert, wenn ein Provider verfügbar ist.

## Unterstützte Provider

| Provider   | Standardmodell                          | Bearbeitungsunterstützung          | Auth                                                   |
| ---------- | --------------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| OpenAI     | `gpt-image-2`                           | Ja (bis zu 4 Bilder)               | `OPENAI_API_KEY` oder OpenAI Codex OAuth               |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Ja (bis zu 5 Eingabebilder)        | `OPENROUTER_API_KEY`                                   |
| Google     | `gemini-3.1-flash-image-preview`        | Ja                                 | `GEMINI_API_KEY` oder `GOOGLE_API_KEY`                 |
| fal        | `fal-ai/flux/dev`                       | Ja                                 | `FAL_KEY`                                              |
| MiniMax    | `image-01`                              | Ja (Referenzmotiv)                 | `MINIMAX_API_KEY` oder MiniMax OAuth (`minimax-portal`) |
| ComfyUI    | `workflow`                              | Ja (1 Bild, workflow-konfiguriert) | `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` für Cloud   |
| Vydra      | `grok-imagine`                          | Nein                               | `VYDRA_API_KEY`                                        |
| xAI        | `grok-imagine-image`                    | Ja (bis zu 5 Bilder)               | `XAI_API_KEY`                                          |

Verwenden Sie `action: "list"`, um zur Laufzeit verfügbare Provider und Modelle zu prüfen:

```
/tool image_generate action=list
```

## Tool-Parameter

<ParamField path="prompt" type="string" required>
Prompt für die Bildgenerierung. Erforderlich für `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
Verwenden Sie `"list"`, um zur Laufzeit verfügbare Provider und Modelle zu prüfen.
</ParamField>

<ParamField path="model" type="string">
Überschreibung für Provider/Modell, z. B. `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
Pfad oder URL eines einzelnen Referenzbildes für den Bearbeitungsmodus.
</ParamField>

<ParamField path="images" type="string[]">
Mehrere Referenzbilder für den Bearbeitungsmodus (bis zu 5).
</ParamField>

<ParamField path="size" type="string">
Hinweis auf die Größe: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>

<ParamField path="aspectRatio" type="string">
Seitenverhältnis: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
Hinweis auf die Auflösung.
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
Qualitätshinweis, wenn der Provider dies unterstützt.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
Hinweis auf das Ausgabeformat, wenn der Provider dies unterstützt.
</ParamField>

<ParamField path="count" type="number">
Anzahl der zu generierenden Bilder (1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
Optionales Timeout für Provider-Anfragen in Millisekunden.
</ParamField>

<ParamField path="filename" type="string">
Hinweis auf den Ausgabedateinamen.
</ParamField>

<ParamField path="openai" type="object">
Nur für OpenAI: Hinweise zu `background`, `moderation`, `outputCompression` und `user`.
</ParamField>

Nicht alle Provider unterstützen alle Parameter. Wenn ein Fallback-Provider eine nahe Geometrieoption statt der exakt angeforderten unterstützt, ordnet OpenClaw vor dem Senden auf die nächstunterstützte Größe, das nächstunterstützte Seitenverhältnis oder die nächstunterstützte Auflösung um. Nicht unterstützte Ausgabehinweise wie `quality` oder `outputFormat` werden für Provider entfernt, die keine Unterstützung deklarieren, und im Tool-Ergebnis gemeldet.

Tool-Ergebnisse melden die angewendeten Einstellungen. Wenn OpenClaw bei einem Provider-Fallback Geometrie umordnet, spiegeln die zurückgegebenen Werte `size`, `aspectRatio` und `resolution` wider, was tatsächlich gesendet wurde, und `details.normalization` erfasst die Übersetzung von angefordert zu angewendet.

## Konfiguration

### Modellauswahl

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### Reihenfolge der Providerauswahl

Beim Generieren eines Bildes versucht OpenClaw Provider in dieser Reihenfolge:

1. **Parameter `model`** aus dem Tool-Aufruf (wenn der Agent eines angibt)
2. **`imageGenerationModel.primary`** aus der Konfiguration
3. **`imageGenerationModel.fallbacks`** in der angegebenen Reihenfolge
4. **Automatische Erkennung** — verwendet nur auth-gestützte Standardwerte von Providern:
   - zuerst den aktuellen Standard-Provider
   - dann die übrigen registrierten Provider für Bildgenerierung in Reihenfolge der Provider-ID

Wenn ein Provider fehlschlägt (Auth-Fehler, Rate-Limit usw.), wird automatisch der nächste Kandidat versucht. Wenn alle fehlschlagen, enthält der Fehler Details zu jedem Versuch.

Hinweise:

- Automatische Erkennung ist auth-bewusst. Ein Provider-Standard gelangt nur dann in die Kandidatenliste, wenn OpenClaw diesen Provider tatsächlich authentifizieren kann.
- Automatische Erkennung ist standardmäßig aktiviert. Setzen Sie
  `agents.defaults.mediaGenerationAutoProviderFallback: false`, wenn die Bild-
  generierung nur die expliziten Einträge `model`, `primary` und `fallbacks`
  verwenden soll.
- Verwenden Sie `action: "list"`, um die aktuell registrierten Provider, deren
  Standardmodelle und Hinweise zu Auth-Umgebungsvariablen zu prüfen.

### Bildbearbeitung

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI und xAI unterstützen die Bearbeitung von Referenzbildern. Übergeben Sie einen Pfad oder eine URL zu einem Referenzbild:

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google und xAI unterstützen bis zu 5 Referenzbilder über den Parameter `images`. fal, MiniMax und ComfyUI unterstützen 1.

### OpenRouter-Bildmodelle

Die Bildgenerierung mit OpenRouter verwendet denselben `OPENROUTER_API_KEY` und läuft über die OpenRouter-Chat-Completions-API für Bilder. Wählen Sie OpenRouter-Bildmodelle mit dem Präfix `openrouter/`:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw leitet `prompt`, `count`, Referenzbilder und Gemini-kompatible Hinweise zu `aspectRatio` / `resolution` an OpenRouter weiter. Zu den aktuellen integrierten Kurzformen für OpenRouter-Bildmodelle gehören `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview` und `openai/gpt-5.4-image-2`; verwenden Sie `action: "list"`, um zu sehen, was Ihr konfiguriertes Plugin bereitstellt.

### OpenAI `gpt-image-2`

Die Bildgenerierung mit OpenAI verwendet standardmäßig `openai/gpt-image-2`. Wenn ein
OAuth-Profil `openai-codex` konfiguriert ist, verwendet OpenClaw dasselbe OAuth-
Profil, das auch von Codex-Subscription-Chatmodellen genutzt wird, und sendet die Bildanfrage
über das Codex-Responses-Backend; es fällt für diese Anfrage nicht stillschweigend auf
`OPENAI_API_KEY` zurück. Um Routing über die direkte OpenAI-Images-API zu erzwingen,
konfigurieren Sie `models.providers.openai` ausdrücklich mit einem API-Schlüssel, einer benutzerdefinierten Base-URL
oder einem Azure-Endpunkt. Das ältere
Modell `openai/gpt-image-1` kann weiterhin explizit ausgewählt werden, aber neue OpenAI-
Anfragen zur Bildgenerierung und Bildbearbeitung sollten `gpt-image-2` verwenden.

`gpt-image-2` unterstützt sowohl Text-zu-Bild-Generierung als auch Bearbeitung mit Referenzbildern
über dasselbe Tool `image_generate`. OpenClaw leitet `prompt`,
`count`, `size`, `quality`, `outputFormat` und Referenzbilder an OpenAI weiter.
OpenAI erhält `aspectRatio` oder `resolution` nicht direkt; wenn möglich,
ordnet OpenClaw diese auf eine unterstützte `size` um, andernfalls meldet das Tool sie als
ignorierte Überschreibungen.

OpenAI-spezifische Optionen befinden sich unter dem Objekt `openai`:

```json
{
  "quality": "low",
  "outputFormat": "jpeg",
  "openai": {
    "background": "opaque",
    "moderation": "low",
    "outputCompression": 60,
    "user": "end-user-42"
  }
}
```

`openai.background` akzeptiert `transparent`, `opaque` oder `auto`; transparente
Ausgaben erfordern `outputFormat` `png` oder `webp`. `openai.outputCompression`
gilt für JPEG-/WebP-Ausgaben.

Ein 4K-Landschaftsbild generieren:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

Zwei quadratische Bilder generieren:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

Ein lokales Referenzbild bearbeiten:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

Mit mehreren Referenzen bearbeiten:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Um OpenAI-Bildgenerierung über eine Azure-OpenAI-Deployment statt
`api.openai.com` zu routen, siehe [Azure OpenAI endpoints](/de/providers/openai#azure-openai-endpoints)
in der Dokumentation zum OpenAI-Provider.

MiniMax-Bildgenerierung ist über beide gebündelten MiniMax-Auth-Pfade verfügbar:

- `minimax/image-01` für Setups mit API-Schlüssel
- `minimax-portal/image-01` für OAuth-Setups

## Provider-Fähigkeiten

| Fähigkeit             | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Generieren            | Ja (bis zu 4)        | Ja (bis zu 4)        | Ja (bis zu 4)       | Ja (bis zu 9)              | Ja (workflowdefinierte Ausgaben)   | Ja (1)  | Ja (bis zu 4)        |
| Bearbeiten/Referenz   | Ja (bis zu 5 Bilder) | Ja (bis zu 5 Bilder) | Ja (1 Bild)         | Ja (1 Bild, Motivreferenz) | Ja (1 Bild, workflowkonfiguriert)  | Nein    | Ja (bis zu 5 Bilder) |
| Größensteuerung       | Ja (bis zu 4K)       | Ja                   | Ja                  | Nein                       | Nein                               | Nein    | Nein                 |
| Seitenverhältnis      | Nein                 | Ja                   | Ja (nur Generieren) | Ja                         | Nein                               | Nein    | Ja                   |
| Auflösung (1K/2K/4K)  | Nein                 | Ja                   | Ja                  | Nein                       | Nein                               | Nein    | Ja (1K/2K)           |

### xAI `grok-imagine-image`

Der gebündelte xAI-Provider verwendet `/v1/images/generations` für Anfragen nur mit Prompt
und `/v1/images/edits`, wenn `image` oder `images` vorhanden ist.

- Modelle: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Anzahl: bis zu 4
- Referenzen: ein `image` oder bis zu fünf `images`
- Seitenverhältnisse: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Auflösungen: `1K`, `2K`
- Ausgaben: werden als von OpenClaw verwaltete Bildanhänge zurückgegeben

OpenClaw stellt absichtlich keine xAI-nativen Parameter wie `quality`, `mask`, `user` oder
zusätzliche native-only-Seitenverhältnisse bereit, solange diese Steuerelemente im gemeinsamen
providerübergreifenden Vertrag von `image_generate` nicht existieren.

## Verwandt

- [Tools Overview](/de/tools) — alle verfügbaren Agent-Tools
- [fal](/de/providers/fal) — Einrichtung des fal-Providers für Bild und Video
- [ComfyUI](/de/providers/comfy) — Einrichtung von lokalem ComfyUI und Comfy Cloud Workflow
- [Google (Gemini)](/de/providers/google) — Einrichtung des Gemini-Providers für Bilder
- [MiniMax](/de/providers/minimax) — Einrichtung des MiniMax-Providers für Bilder
- [OpenAI](/de/providers/openai) — Einrichtung des OpenAI-Images-Providers
- [Vydra](/de/providers/vydra) — Einrichtung von Vydra für Bild, Video und Sprache
- [xAI](/de/providers/xai) — Einrichtung von Grok für Bild, Video, Suche, Codeausführung und TTS
- [Configuration Reference](/de/gateway/config-agents#agent-defaults) — Konfiguration von `imageGenerationModel`
- [Models](/de/concepts/models) — Modellkonfiguration und Failover
