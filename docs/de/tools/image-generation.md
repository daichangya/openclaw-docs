---
read_when:
    - Bilder über den Agenten generieren
    - Provider und Models für die Bildgenerierung konfigurieren
    - Die Parameter des Tools `image_generate` verstehen
summary: Bilder mit konfigurierten Providern generieren und bearbeiten (OpenAI, Google Gemini, fal, MiniMax)
title: Bildgenerierung
x-i18n:
    generated_at: "2026-04-05T12:57:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: d38a8a583997ceff6523ce4f51808c97a2b59fe4e5a34cf79cdcb70d7e83aec2
    source_path: tools/image-generation.md
    workflow: 15
---

# Bildgenerierung

Das Tool `image_generate` ermöglicht dem Agenten, mit Ihren konfigurierten Providern Bilder zu erstellen und zu bearbeiten. Generierte Bilder werden automatisch als Medienanhänge in der Antwort des Agenten bereitgestellt.

<Note>
Das Tool erscheint nur, wenn mindestens ein Provider für Bildgenerierung verfügbar ist. Wenn `image_generate` in den Tools Ihres Agenten nicht angezeigt wird, konfigurieren Sie `agents.defaults.imageGenerationModel` oder richten Sie einen API-Key für einen Provider ein.
</Note>

## Schnellstart

1. Setzen Sie einen API-Key für mindestens einen Provider (zum Beispiel `OPENAI_API_KEY` oder `GEMINI_API_KEY`).
2. Legen Sie optional Ihr bevorzugtes Model fest:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: "openai/gpt-image-1",
    },
  },
}
```

3. Fragen Sie den Agenten: _"Generate an image of a friendly lobster mascot."_

Der Agent ruft `image_generate` automatisch auf. Keine Allowlist für Tools nötig — es ist standardmäßig aktiviert, wenn ein Provider verfügbar ist.

## Unterstützte Provider

| Provider | Standard-Model                 | Unterstützung für Bearbeitung | API-Key                                              |
| -------- | ------------------------------ | ----------------------------- | ---------------------------------------------------- |
| OpenAI   | `gpt-image-1`                  | Ja (bis zu 5 Bilder)          | `OPENAI_API_KEY`                                     |
| Google   | `gemini-3.1-flash-image-preview` | Ja                          | `GEMINI_API_KEY` oder `GOOGLE_API_KEY`               |
| fal      | `fal-ai/flux/dev`              | Ja                            | `FAL_KEY`                                            |
| MiniMax  | `image-01`                     | Ja (Subjektreferenz)          | `MINIMAX_API_KEY` oder MiniMax OAuth (`minimax-portal`) |

Verwenden Sie `action: "list"`, um verfügbare Provider und Models zur Laufzeit zu prüfen:

```
/tool image_generate action=list
```

## Tool-Parameter

| Parameter     | Typ      | Beschreibung                                                                          |
| ------------- | -------- | ------------------------------------------------------------------------------------- |
| `prompt`      | string   | Prompt für die Bildgenerierung (erforderlich für `action: "generate"`)                |
| `action`      | string   | `"generate"` (Standard) oder `"list"` zum Prüfen von Providern                        |
| `model`       | string   | Override für Provider/Model, z. B. `openai/gpt-image-1`                               |
| `image`       | string   | Einzelner Referenzbildpfad oder URL für den Bearbeitungsmodus                         |
| `images`      | string[] | Mehrere Referenzbilder für den Bearbeitungsmodus (bis zu 5)                           |
| `size`        | string   | Größenhinweis: `1024x1024`, `1536x1024`, `1024x1536`, `1024x1792`, `1792x1024`        |
| `aspectRatio` | string   | Seitenverhältnis: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | Auflösungshinweis: `1K`, `2K` oder `4K`                                               |
| `count`       | number   | Anzahl der zu generierenden Bilder (1–4)                                              |
| `filename`    | string   | Hinweis für den Ausgabedateinamen                                                     |

Nicht alle Provider unterstützen alle Parameter. Das Tool übergibt, was jeder Provider unterstützt, und ignoriert den Rest.

## Konfiguration

### Model-Auswahl

```json5
{
  agents: {
    defaults: {
      // String form: primary model only
      imageGenerationModel: "google/gemini-3.1-flash-image-preview",

      // Object form: primary + ordered fallbacks
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Reihenfolge der Provider-Auswahl

Beim Generieren eines Bildes versucht OpenClaw Provider in dieser Reihenfolge:

1. **Parameter `model`** aus dem Tool-Aufruf (wenn der Agent einen angibt)
2. **`imageGenerationModel.primary`** aus der Konfiguration
3. **`imageGenerationModel.fallbacks`** in Reihenfolge
4. **Automatische Erkennung** — verwendet nur authentifizierungsgestützte Standardwerte von Providern:
   - zuerst den aktuellen Standard-Provider
   - verbleibende registrierte Provider für Bildgenerierung in Provider-ID-Reihenfolge

Wenn ein Provider fehlschlägt (Authentifizierungsfehler, Rate Limit usw.), wird automatisch der nächste Kandidat versucht. Wenn alle fehlschlagen, enthält der Fehler Details aus jedem Versuch.

Hinweise:

- Die automatische Erkennung ist authentifizierungsbewusst. Ein Provider-Standard gelangt nur dann in die Kandidatenliste,
  wenn OpenClaw diesen Provider tatsächlich authentifizieren kann.
- Verwenden Sie `action: "list"`, um die aktuell registrierten Provider, ihre
  Standard-Models und Hinweise zu Authentifizierungs-Env-Variablen zu prüfen.

### Bildbearbeitung

OpenAI, Google, fal und MiniMax unterstützen die Bearbeitung von Referenzbildern. Übergeben Sie einen Referenzbildpfad oder eine URL:

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI und Google unterstützen bis zu 5 Referenzbilder über den Parameter `images`. fal und MiniMax unterstützen 1.

MiniMax-Bildgenerierung ist über beide gebündelten MiniMax-Authentifizierungspfade verfügbar:

- `minimax/image-01` für API-Key-Setups
- `minimax-portal/image-01` für OAuth-Setups

## Fähigkeiten der Provider

| Fähigkeit             | OpenAI               | Google               | fal                 | MiniMax                     |
| --------------------- | -------------------- | -------------------- | ------------------- | --------------------------- |
| Generieren            | Ja (bis zu 4)        | Ja (bis zu 4)        | Ja (bis zu 4)       | Ja (bis zu 9)               |
| Bearbeiten/Referenz   | Ja (bis zu 5 Bilder) | Ja (bis zu 5 Bilder) | Ja (1 Bild)         | Ja (1 Bild, Subjektreferenz) |
| Größensteuerung       | Ja                   | Ja                   | Ja                  | Nein                        |
| Seitenverhältnis      | Nein                 | Ja                   | Ja (nur Generierung) | Ja                         |
| Auflösung (1K/2K/4K)  | Nein                 | Ja                   | Ja                  | Nein                        |

## Verwandt

- [Tools Overview](/tools) — alle verfügbaren Agent-Tools
- [Configuration Reference](/de/gateway/configuration-reference#agent-defaults) — Konfiguration `imageGenerationModel`
- [Models](/de/concepts/models) — Model-Konfiguration und Failover
