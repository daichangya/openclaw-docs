---
read_when:
    - '`openclaw infer`-Befehle hinzufügen oder ändern'
    - Stabile Headless-Automatisierung für Fähigkeiten entwerfen
summary: Infer-first-CLI für providergestützte Workflows mit Modell, Bild, Audio, TTS, Video, Web und Embeddings
title: Inference-CLI
x-i18n:
    generated_at: "2026-04-24T06:31:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a5a2ca9da4b5c26fbd61c271801d50a3d533bd4cc8430aa71f65e2cdc4fdee6
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` ist die kanonische Headless-Oberfläche für providergestützte Inference-Workflows.

Es stellt absichtlich Fähigkeitsfamilien bereit, nicht rohe Gateway-RPC-Namen und nicht rohe Agenten-Tool-IDs.

## Infer in eine Skill verwandeln

Kopieren Sie dies und fügen Sie es bei einem Agenten ein:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Eine gute infer-basierte Skill sollte:

- häufige Benutzerabsichten dem richtigen Infer-Unterbefehl zuordnen
- einige kanonische Infer-Beispiele für die abgedeckten Workflows enthalten
- in Beispielen und Vorschlägen `openclaw infer ...` bevorzugen
- vermeiden, die gesamte Infer-Oberfläche im Skill-Text erneut zu dokumentieren

Typische infer-fokussierte Skill-Abdeckung:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Warum Infer verwenden

`openclaw infer` bietet eine einheitliche CLI für providergestützte Inference-Aufgaben innerhalb von OpenClaw.

Vorteile:

- Verwenden Sie die in OpenClaw bereits konfigurierten Provider und Modelle, statt einmalige Wrapper für jedes Backend zu verdrahten.
- Halten Sie Modell-, Bild-, Audiotranskriptions-, TTS-, Video-, Web- und Embedding-Workflows unter einem einzigen Befehlsbaum zusammen.
- Verwenden Sie eine stabile `--json`-Ausgabeform für Skripte, Automatisierung und agentengesteuerte Workflows.
- Bevorzugen Sie eine OpenClaw-Oberfläche erster Klasse, wenn die Aufgabe im Kern „Inference ausführen“ ist.
- Verwenden Sie den normalen lokalen Pfad, ohne dass für die meisten Infer-Befehle das Gateway erforderlich ist.

## Befehlsbaum

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## Häufige Aufgaben

Diese Tabelle ordnet häufige Inference-Aufgaben dem entsprechenden Infer-Befehl zu.

| Aufgabe                  | Befehl                                                                | Hinweise                                              |
| ------------------------ | --------------------------------------------------------------------- | ----------------------------------------------------- |
| Einen Text-/Modell-Prompt ausführen | `openclaw infer model run --prompt "..." --json`                       | Verwendet standardmäßig den normalen lokalen Pfad     |
| Ein Bild erzeugen        | `openclaw infer image generate --prompt "..." --json`                 | Verwenden Sie `image edit`, wenn Sie von einer vorhandenen Datei ausgehen |
| Eine Bilddatei beschreiben | `openclaw infer image describe --file ./image.png --json`              | `--model` muss ein bildfähiges `<provider/model>` sein |
| Audio transkribieren     | `openclaw infer audio transcribe --file ./memo.m4a --json`            | `--model` muss `<provider/model>` sein                |
| Sprache synthetisieren   | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` ist gatewayorientiert                    |
| Ein Video erzeugen       | `openclaw infer video generate --prompt "..." --json`                 |                                                       |
| Eine Videodatei beschreiben | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model` muss `<provider/model>` sein                |
| Das Web durchsuchen      | `openclaw infer web search --query "..." --json`                      |                                                       |
| Eine Webseite abrufen    | `openclaw infer web fetch --url https://example.com --json`           |                                                       |
| Embeddings erzeugen      | `openclaw infer embedding create --text "..." --json`                 |                                                       |

## Verhalten

- `openclaw infer ...` ist die primäre CLI-Oberfläche für diese Workflows.
- Verwenden Sie `--json`, wenn die Ausgabe von einem anderen Befehl oder Skript verarbeitet wird.
- Verwenden Sie `--provider` oder `--model provider/model`, wenn ein bestimmtes Backend erforderlich ist.
- Für `image describe`, `audio transcribe` und `video describe` muss `--model` die Form `<provider/model>` verwenden.
- Für `image describe` führt ein explizites `--model` diesen Provider/dieses Modell direkt aus. Das Modell muss im Modellkatalog oder in der Provider-Konfiguration bildfähig sein. `codex/<model>` führt einen begrenzten Bildverständnis-Turn des Codex-App-Servers aus; `openai-codex/<model>` verwendet den OAuth-Provider-Pfad von OpenAI Codex.
- Zustandslose Ausführungsbefehle verwenden standardmäßig lokal.
- Vom Gateway verwaltete Statusbefehle verwenden standardmäßig Gateway.
- Der normale lokale Pfad erfordert kein laufendes Gateway.

## Modell

Verwenden Sie `model` für providergestützte Text-Inference sowie Modell-/Provider-Inspektion.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Hinweise:

- `model run` verwendet die Agentenlaufzeit erneut, sodass sich Provider-/Modellüberschreibungen wie bei normaler Agentenausführung verhalten.
- `model auth login`, `model auth logout` und `model auth status` verwalten den gespeicherten Auth-Status des Providers.

## Bild

Verwenden Sie `image` für Erzeugung, Bearbeitung und Beschreibung.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Hinweise:

- Verwenden Sie `image edit`, wenn Sie von vorhandenen Eingabedateien ausgehen.
- Für `image describe` muss `--model` ein bildfähiges `<provider/model>` sein.
- Ziehen Sie bei lokalen Ollama-Vision-Modellen das Modell zuerst und setzen Sie `OLLAMA_API_KEY` auf einen beliebigen Platzhalterwert, zum Beispiel `ollama-local`. Siehe [Ollama](/de/providers/ollama#vision-and-image-description).

## Audio

Verwenden Sie `audio` für Dateitranskription.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Hinweise:

- `audio transcribe` ist für Dateitranskription gedacht, nicht für Echtzeit-Sitzungsverwaltung.
- `--model` muss `<provider/model>` sein.

## TTS

Verwenden Sie `tts` für Sprachsynthese und den TTS-Provider-Status.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Hinweise:

- `tts status` verwendet standardmäßig Gateway, da es den vom Gateway verwalteten TTS-Status widerspiegelt.
- Verwenden Sie `tts providers`, `tts voices` und `tts set-provider`, um das TTS-Verhalten zu prüfen und zu konfigurieren.

## Video

Verwenden Sie `video` für Erzeugung und Beschreibung.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Hinweise:

- `--model` muss für `video describe` `<provider/model>` sein.

## Web

Verwenden Sie `web` für Such- und Abruf-Workflows.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Hinweise:

- Verwenden Sie `web providers`, um verfügbare, konfigurierte und ausgewählte Provider zu prüfen.

## Embedding

Verwenden Sie `embedding` für Vektorerzeugung und die Prüfung von Embedding-Providern.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON-Ausgabe

Infer-Befehle normalisieren die JSON-Ausgabe unter einer gemeinsamen Hülle:

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

Felder der obersten Ebene sind stabil:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

## Häufige Fallstricke

```bash
# Schlecht
openclaw infer media image generate --prompt "friendly lobster"

# Gut
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Schlecht
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Gut
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Hinweise

- `openclaw capability ...` ist ein Alias für `openclaw infer ...`.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Modelle](/de/concepts/models)
