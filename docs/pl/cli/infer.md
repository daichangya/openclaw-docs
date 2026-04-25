---
read_when:
    - Dodawanie lub modyfikowanie poleceń `openclaw infer`
    - Projektowanie stabilnej automatyzacji bezgłowej opartej na możliwościach
summary: CLI infer-first dla przepływów pracy modeli, obrazów, audio, TTS, wideo, sieci i embeddingów opartych na providerach
title: CLI inferencji
x-i18n:
    generated_at: "2026-04-25T13:44:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 249c1074b48882a3beacb08839c8ac992050133fa80e731133620c17dfbbdfe0
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` to kanoniczna bezgłowa powierzchnia dla przepływów pracy inferencji opartych na providerach.

Celowo udostępnia rodziny możliwości, a nie surowe nazwy RPC gateway ani surowe identyfikatory narzędzi agenta.

## Zamień infer w Skill

Skopiuj i wklej to do agenta:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Dobry Skill oparty na infer powinien:

- mapować typowe intencje użytkownika na właściwe podpolecenie infer
- zawierać kilka kanonicznych przykładów infer dla obsługiwanych przepływów pracy
- preferować `openclaw infer ...` w przykładach i sugestiach
- unikać ponownego dokumentowania całej powierzchni infer wewnątrz treści Skill

Typowy zakres Skills skoncentrowanych na infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Dlaczego używać infer

`openclaw infer` zapewnia jedno spójne CLI do zadań inferencji opartych na providerach w OpenClaw.

Korzyści:

- Korzystaj z providerów i modeli już skonfigurowanych w OpenClaw zamiast budować jednorazowe wrappery dla każdego backendu.
- Utrzymuj przepływy pracy modeli, obrazów, transkrypcji audio, TTS, wideo, sieci i embeddingów pod jednym drzewem poleceń.
- Używaj stabilnego formatu wyjścia `--json` dla skryptów, automatyzacji i przepływów pracy sterowanych przez agentów.
- Preferuj własną powierzchnię OpenClaw, gdy zadanie sprowadza się zasadniczo do „uruchom inferencję”.
- Korzystaj ze zwykłej ścieżki lokalnej bez wymagania gateway dla większości poleceń infer.

Do kompleksowych sprawdzeń providerów preferuj `openclaw infer ...`, gdy testy
providerów na niższym poziomie są już zielone. Sprawdza ono dostarczone CLI, ładowanie konfiguracji,
rozwiązywanie domyślnego agenta, aktywację dołączonych Pluginów, naprawę zależności środowiska uruchomieniowego
oraz współdzielone środowisko uruchomieniowe możliwości przed wykonaniem żądania do providera.

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

Ta tabela mapuje typowe zadania inferencji na odpowiadające im polecenie infer.

| Zadanie                  | Polecenie                                                             | Uwagi                                                 |
| ------------------------ | --------------------------------------------------------------------- | ----------------------------------------------------- |
| Uruchom prompt tekstowy/modelu | `openclaw infer model run --prompt "..." --json`                | Domyślnie używa zwykłej ścieżki lokalnej              |
| Wygeneruj obraz          | `openclaw infer image generate --prompt "..." --json`                 | Użyj `image edit`, gdy zaczynasz od istniejącego pliku |
| Opisz plik obrazu        | `openclaw infer image describe --file ./image.png --json`             | `--model` musi być `<provider/model>` obsługującym obrazy |
| Transkrybuj audio        | `openclaw infer audio transcribe --file ./memo.m4a --json`            | `--model` musi być `<provider/model>`                 |
| Syntezuj mowę            | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` jest zorientowane na gateway             |
| Wygeneruj wideo          | `openclaw infer video generate --prompt "..." --json`                 | Obsługuje wskazówki providera, takie jak `--resolution` |
| Opisz plik wideo         | `openclaw infer video describe --file ./clip.mp4 --json`              | `--model` musi być `<provider/model>`                 |
| Przeszukaj sieć          | `openclaw infer web search --query "..." --json`                      |                                                       |
| Pobierz stronę internetową | `openclaw infer web fetch --url https://example.com --json`         |                                                       |
| Utwórz embeddingi        | `openclaw infer embedding create --text "..." --json`                 |                                                       |

## Zachowanie

- `openclaw infer ...` to podstawowa powierzchnia CLI dla tych przepływów pracy.
- Używaj `--json`, gdy dane wyjściowe będą używane przez inne polecenie lub skrypt.
- Używaj `--provider` albo `--model provider/model`, gdy wymagany jest konkretny backend.
- Dla `image describe`, `audio transcribe` i `video describe` parametr `--model` musi mieć postać `<provider/model>`.
- Dla `image describe` jawne `--model` uruchamia bezpośrednio ten provider/model. Model musi obsługiwać obrazy w katalogu modeli albo konfiguracji providera. `codex/<model>` uruchamia ograniczoną turę rozumienia obrazu Codex app-server; `openai-codex/<model>` używa ścieżki providera OpenAI Codex OAuth.
- Bezustanowe polecenia wykonania domyślnie używają trybu lokalnego.
- Polecenia zarządzające stanem przez gateway domyślnie używają gateway.
- Zwykła ścieżka lokalna nie wymaga uruchomionego gateway.
- `model run` jest jednorazowe. Serwery MCP otwarte przez środowisko uruchomieniowe agenta dla tego polecenia są wycofywane po odpowiedzi zarówno dla wykonania lokalnego, jak i `--gateway`, więc powtarzane wywołania skryptowe nie utrzymują przy życiu podrzędnych procesów stdio MCP.

## Model

Używaj `model` do inferencji tekstowej opartej na providerach oraz inspekcji modeli/providerów.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Uwagi:

- `model run` ponownie używa środowiska uruchomieniowego agenta, więc nadpisania providera/modelu zachowują się jak normalne wykonanie agenta.
- Ponieważ `model run` jest przeznaczone do bezgłowej automatyzacji, po zakończeniu polecenia nie zachowuje środowisk uruchomieniowych dołączonych MCP per sesja.
- `model auth login`, `model auth logout` i `model auth status` zarządzają zapisanym stanem uwierzytelniania providera.

## Obraz

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
- Używaj `image providers --json`, aby sprawdzić, którzy dołączeni providerzy obrazów są
  wykrywalni, skonfigurowani, wybrani oraz jakie możliwości generowania/edycji
  udostępnia każdy provider.
- Używaj `image generate --model <provider/model> --json` jako najwęższego testu smoke
  CLI na żywo dla zmian generowania obrazu. Przykład:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  Odpowiedź JSON raportuje `ok`, `provider`, `model`, `attempts` oraz zapisane
  ścieżki wyjściowe. Gdy ustawiono `--output`, końcowe rozszerzenie może być zgodne z
  typem MIME zwróconym przez providera.

- Dla `image describe` parametr `--model` musi być `<provider/model>` obsługującym obrazy.
- Dla lokalnych modeli vision Ollama najpierw pobierz model i ustaw `OLLAMA_API_KEY` na dowolną wartość zastępczą, na przykład `ollama-local`. Zobacz [Ollama](/pl/providers/ollama#vision-and-image-description).

## Audio

Używaj `audio` do transkrypcji plików.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Uwagi:

- `audio transcribe` służy do transkrypcji plików, a nie do zarządzania sesjami czasu rzeczywistego.
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

- `tts status` domyślnie używa gateway, ponieważ odzwierciedla stan TTS zarządzany przez gateway.
- Używaj `tts providers`, `tts voices` i `tts set-provider`, aby sprawdzać i konfigurować zachowanie TTS.

## Wideo

Używaj `video` do generowania i opisu.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Uwagi:

- `video generate` akceptuje `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` i `--timeout-ms` oraz przekazuje je do środowiska uruchomieniowego generowania wideo.
- Dla `video describe` parametr `--model` musi mieć postać `<provider/model>`.

## Sieć

Używaj `web` do przepływów pracy wyszukiwania i pobierania.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Uwagi:

- Używaj `web providers`, aby sprawdzać dostępnych, skonfigurowanych i wybranych providerów.

## Embedding

Używaj `embedding` do tworzenia wektorów i inspekcji providerów embeddingów.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Wyjście JSON

Polecenia infer normalizują wyjście JSON pod wspólną kopertą:

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

Dla poleceń generujących multimedia `outputs` zawiera pliki zapisane przez OpenClaw. Używaj
w automatyzacji wartości `path`, `mimeType`, `size` oraz wszelkich wymiarów specyficznych dla mediów z tej tablicy,
zamiast analizować czytelny dla człowieka stdout.

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

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Modele](/pl/concepts/models)
