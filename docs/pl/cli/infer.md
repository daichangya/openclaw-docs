---
read_when:
    - Dodawanie lub modyfikowanie poleceń `openclaw infer`
    - Projektowanie stabilnej, bezobsługowej automatyzacji możliwości
summary: CLI infer-first dla przepływów pracy opartych na providerach dla modeli, obrazów, audio, TTS, wideo, web i embeddingów
title: CLI Inference
x-i18n:
    generated_at: "2026-04-23T09:58:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: e57d2438d0da24e1ed880bbacd244ede4af56beba4ac1baa3f2a1e393e641c9c
    source_path: cli/infer.md
    workflow: 15
---

# CLI Inference

`openclaw infer` to kanoniczna bezobsługowa powierzchnia dla przepływów pracy inferencji opartych na providerach.

Celowo udostępnia rodziny możliwości, a nie surowe nazwy RPC Gateway ani surowe ID narzędzi agentów.

## Zamień infer w skill

Skopiuj i wklej to do agenta:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Dobry skill oparty na infer powinien:

- mapować typowe intencje użytkownika na właściwe podpolecenie infer
- zawierać kilka kanonicznych przykładów infer dla obsługiwanych przepływów pracy
- preferować `openclaw infer ...` w przykładach i sugestiach
- unikać ponownego dokumentowania całej powierzchni infer w treści skilla

Typowy zakres skilla skupionego na infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Dlaczego warto używać infer

`openclaw infer` zapewnia jedno spójne CLI dla zadań inferencji opartych na providerach w OpenClaw.

Korzyści:

- Używaj providerów i modeli już skonfigurowanych w OpenClaw zamiast tworzyć jednorazowe wrappery dla każdego backendu.
- Utrzymuj przepływy pracy dla modeli, obrazów, transkrypcji audio, TTS, wideo, web i embeddingów w jednym drzewie poleceń.
- Używaj stabilnego kształtu wyjścia `--json` dla skryptów, automatyzacji i przepływów pracy sterowanych przez agentów.
- Preferuj pierwszorzędną powierzchnię OpenClaw, gdy zadanie sprowadza się zasadniczo do „uruchom inferencję”.
- Używaj normalnej ścieżki lokalnej bez konieczności uruchamiania Gateway dla większości poleceń infer.

## Drzewo poleceń

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

## Typowe zadania

Ta tabela mapuje typowe zadania inferencyjne na odpowiadające im polecenia infer.

| Zadanie                 | Polecenie                                                             | Uwagi                                                 |
| ----------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| Uruchom prompt tekstowy/modelowy | `openclaw infer model run --prompt "..." --json`              | Domyślnie używa normalnej ścieżki lokalnej            |
| Wygeneruj obraz         | `openclaw infer image generate --prompt "..." --json`                 | Użyj `image edit`, gdy zaczynasz od istniejącego pliku |
| Opisz plik obrazu       | `openclaw infer image describe --file ./image.png --json`             | `--model` musi być `<provider/model>` obsługującym obrazy |
| Transkrybuj audio       | `openclaw infer audio transcribe --file ./memo.m4a --json`            | `--model` musi być `<provider/model>`                 |
| Syntezuj mowę           | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` jest zorientowane na Gateway             |
| Wygeneruj wideo         | `openclaw infer video generate --prompt "..." --json`                 |                                                       |
| Opisz plik wideo        | `openclaw infer video describe --file ./clip.mp4 --json`              | `--model` musi być `<provider/model>`                 |
| Wyszukaj w web          | `openclaw infer web search --query "..." --json`                      |                                                       |
| Pobierz stronę web      | `openclaw infer web fetch --url https://example.com --json`           |                                                       |
| Utwórz embeddingi       | `openclaw infer embedding create --text "..." --json`                 |                                                       |

## Zachowanie

- `openclaw infer ...` to podstawowa powierzchnia CLI dla tych przepływów pracy.
- Używaj `--json`, gdy wynik będzie konsumowany przez inne polecenie lub skrypt.
- Używaj `--provider` lub `--model provider/model`, gdy wymagany jest konkretny backend.
- Dla `image describe`, `audio transcribe` i `video describe` `--model` musi mieć postać `<provider/model>`.
- Dla `image describe` jawne `--model` uruchamia bezpośrednio ten provider/model. Model musi obsługiwać obrazy w katalogu modeli lub konfiguracji providera.
- Bezstanowe polecenia wykonawcze domyślnie działają lokalnie.
- Polecenia stanu zarządzanego przez Gateway domyślnie działają przez Gateway.
- Normalna ścieżka lokalna nie wymaga uruchomionego Gateway.

## Model

Używaj `model` do inferencji tekstowej opartej na providerach oraz inspekcji modeli/providerów.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.4 --json
```

Uwagi:

- `model run` ponownie wykorzystuje runtime agenta, więc nadpisania providerów/modeli zachowują się jak w zwykłym wykonaniu agenta.
- `model auth login`, `model auth logout` i `model auth status` zarządzają zapisanym stanem uwierzytelniania providera.

## Image

Używaj `image` do generowania, edycji i opisu.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Uwagi:

- Używaj `image edit`, gdy zaczynasz od istniejących plików wejściowych.
- Dla `image describe` `--model` musi być `<provider/model>` obsługującym obrazy.
- Dla lokalnych modeli vision Ollama najpierw pobierz model i ustaw `OLLAMA_API_KEY` na dowolną wartość zastępczą, na przykład `ollama-local`. Zobacz [Ollama](/pl/providers/ollama#vision-and-image-description).

## Audio

Używaj `audio` do transkrypcji plików.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Uwagi:

- `audio transcribe` służy do transkrypcji plików, a nie do zarządzania sesjami realtime.
- `--model` musi mieć postać `<provider/model>`.

## TTS

Używaj `tts` do syntezy mowy i stanu providera TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Uwagi:

- `tts status` domyślnie używa Gateway, ponieważ odzwierciedla stan TTS zarządzany przez Gateway.
- Używaj `tts providers`, `tts voices` i `tts set-provider` do inspekcji i konfiguracji zachowania TTS.

## Video

Używaj `video` do generowania i opisu.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Uwagi:

- Dla `video describe` `--model` musi mieć postać `<provider/model>`.

## Web

Używaj `web` do przepływów pracy wyszukiwania i pobierania.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Uwagi:

- Używaj `web providers`, aby sprawdzić dostępnych, skonfigurowanych i wybranych providerów.

## Embedding

Używaj `embedding` do tworzenia wektorów i inspekcji providerów embeddingów.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Wyjście JSON

Polecenia infer normalizują wyjście JSON we wspólnej obwiedni:

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

Pola najwyższego poziomu są stabilne:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

## Typowe pułapki

```bash
# Źle
openclaw infer media image generate --prompt "friendly lobster"

# Dobrze
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Źle
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Dobrze
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Uwagi

- `openclaw capability ...` to alias dla `openclaw infer ...`.
