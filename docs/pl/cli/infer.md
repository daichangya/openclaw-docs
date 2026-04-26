---
read_when:
    - Dodawanie lub modyfikowanie poleceń `openclaw infer`
    - Projektowanie stabilnej bezgłowej automatyzacji możliwości
summary: CLI infer-first dla przepływów modeli, obrazów, audio, TTS, wideo, web i embeddingów opartych na dostawcy
title: CLI inferencji
x-i18n:
    generated_at: "2026-04-26T11:26:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf07b306d80535b58d811aa33c0bbe2ecac57b22c3ab27f6f2ae6518ceb21e49
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` to kanoniczna bezgłowa powierzchnia dla przepływów inferencji opartych na dostawcy.

Celowo udostępnia rodziny możliwości, a nie surowe nazwy RPC Gateway ani surowe identyfikatory narzędzi agenta.

## Zamień infer w Skill

Skopiuj i wklej to do agenta:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Dobry Skill oparty na infer powinien:

- mapować typowe intencje użytkownika na właściwe podpolecenie infer
- zawierać kilka kanonicznych przykładów infer dla obsługiwanych przepływów
- preferować `openclaw infer ...` w przykładach i sugestiach
- unikać ponownego dokumentowania całej powierzchni infer w treści Skill

Typowy zakres Skill skoncentrowanego na infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Dlaczego warto używać infer

`openclaw infer` zapewnia jedno spójne CLI do zadań inferencji opartych na dostawcy w OpenClaw.

Korzyści:

- Używaj dostawców i modeli już skonfigurowanych w OpenClaw zamiast budować jednorazowe wrappery dla każdego backendu.
- Utrzymuj przepływy modeli, obrazów, transkrypcji audio, TTS, wideo, web i embeddingów w jednym drzewie poleceń.
- Używaj stabilnego kształtu wyjścia `--json` dla skryptów, automatyzacji i przepływów sterowanych przez agentów.
- Preferuj własną powierzchnię OpenClaw, gdy zadanie sprowadza się zasadniczo do „uruchom inferencję”.
- Używaj zwykłej lokalnej ścieżki bez wymagania Gateway dla większości poleceń infer.

W przypadku kompleksowych sprawdzeń dostawców preferuj `openclaw infer ...`, gdy testy
dostawcy na niższym poziomie są już zielone. Ćwiczy to dostarczone CLI, ładowanie konfiguracji,
rozwiązywanie domyślnego agenta, aktywację dołączonych Pluginów, naprawę zależności środowiska
uruchomieniowego oraz współdzielone środowisko wykonawcze możliwości przed wykonaniem żądania do dostawcy.

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

Ta tabela mapuje typowe zadania inferencyjne na odpowiadające im polecenie infer.

| Zadanie                 | Polecenie                                                             | Uwagi                                                |
| ----------------------- | --------------------------------------------------------------------- | ---------------------------------------------------- |
| Uruchom prompt tekstowy/modelowy | `openclaw infer model run --prompt "..." --json`              | Domyślnie używa zwykłej lokalnej ścieżki             |
| Wygeneruj obraz         | `openclaw infer image generate --prompt "..." --json`                 | Użyj `image edit`, gdy punktem wyjścia jest istniejący plik |
| Opisz plik obrazu       | `openclaw infer image describe --file ./image.png --json`             | `--model` musi być obrazowym `<provider/model>`      |
| Transkrybuj audio       | `openclaw infer audio transcribe --file ./memo.m4a --json`            | `--model` musi mieć postać `<provider/model>`        |
| Syntezuj mowę           | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` jest zorientowane na Gateway            |
| Wygeneruj wideo         | `openclaw infer video generate --prompt "..." --json`                 | Obsługuje podpowiedzi dostawcy takie jak `--resolution` |
| Opisz plik wideo        | `openclaw infer video describe --file ./clip.mp4 --json`              | `--model` musi mieć postać `<provider/model>`        |
| Przeszukaj web          | `openclaw infer web search --query "..." --json`                      |                                                      |
| Pobierz stronę web      | `openclaw infer web fetch --url https://example.com --json`           |                                                      |
| Utwórz embeddingi       | `openclaw infer embedding create --text "..." --json`                 |                                                      |

## Zachowanie

- `openclaw infer ...` to podstawowa powierzchnia CLI dla tych przepływów.
- Używaj `--json`, gdy wynik będzie konsumowany przez inne polecenie lub skrypt.
- Używaj `--provider` albo `--model provider/model`, gdy wymagany jest konkretny backend.
- Dla `image describe`, `audio transcribe` i `video describe` `--model` musi mieć postać `<provider/model>`.
- Dla `image describe` jawne `--model` uruchamia bezpośrednio ten dostawca/model. Model musi obsługiwać obrazy w katalogu modeli albo konfiguracji dostawcy. `codex/<model>` uruchamia ograniczoną turę rozumienia obrazu przez serwer aplikacji Codex; `openai-codex/<model>` używa ścieżki dostawcy OpenAI Codex OAuth.
- Bezstanowe polecenia wykonawcze domyślnie działają lokalnie.
- Polecenia ze stanem zarządzanym przez Gateway domyślnie działają przez Gateway.
- Zwykła lokalna ścieżka nie wymaga uruchomionego Gateway.
- `model run` jest jednorazowe. Serwery MCP otwarte przez środowisko wykonawcze agenta dla tego polecenia są zamykane po odpowiedzi zarówno przy wykonaniu lokalnym, jak i z `--gateway`, więc powtarzane wywołania skryptowe nie pozostawiają przy życiu podrzędnych procesów stdio MCP.

## Model

Używaj `model` do inferencji tekstowej opartej na dostawcy oraz inspekcji modeli/dostawców.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Uwagi:

- `model run` ponownie używa środowiska wykonawczego agenta, więc nadpisania dostawcy/modelu zachowują się jak przy zwykłym wykonaniu agenta.
- Ponieważ `model run` jest przeznaczone do bezgłowej automatyzacji, nie zachowuje per-sesyjnych dołączonych środowisk MCP po zakończeniu polecenia.
- `model auth login`, `model auth logout` i `model auth status` zarządzają zapisanym stanem uwierzytelniania dostawcy.

## Obraz

Używaj `image` do generowania, edycji i opisu.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Uwagi:

- Używaj `image edit`, gdy punktem wyjścia są istniejące pliki wejściowe.
- Używaj `--size`, `--aspect-ratio` lub `--resolution` z `image edit` dla
  dostawców/modeli obsługujących podpowiedzi geometrii przy edycji z użyciem obrazu referencyjnego.
- Używaj `--output-format png --background transparent` z
  `--model openai/gpt-image-1.5` dla wyjścia OpenAI PNG z przezroczystym tłem;
  `--openai-background` pozostaje dostępne jako alias specyficzny dla OpenAI. Dostawcy,
  którzy nie deklarują obsługi tła, zgłaszają tę podpowiedź jako zignorowane nadpisanie.
- Używaj `image providers --json`, aby sprawdzić, którzy dołączeni dostawcy obrazów są
  wykrywalni, skonfigurowani, wybrani oraz jakie możliwości generowania/edycji
  udostępnia każdy dostawca.
- Używaj `image generate --model <provider/model> --json` jako najwęższego aktywnego
  testu dymnego CLI dla zmian w generowaniu obrazów. Przykład:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  Odpowiedź JSON raportuje `ok`, `provider`, `model`, `attempts` i zapisane
  ścieżki wyjściowe. Gdy ustawiono `--output`, końcowe rozszerzenie może zależeć
  od typu MIME zwróconego przez dostawcę.

- Dla `image describe` `--model` musi być obrazowym `<provider/model>`.
- Dla lokalnych modeli vision Ollama najpierw pobierz model i ustaw `OLLAMA_API_KEY` na dowolną wartość zastępczą, na przykład `ollama-local`. Zobacz [Ollama](/pl/providers/ollama#vision-and-image-description).

## Audio

Używaj `audio` do transkrypcji plików.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Uwagi:

- `audio transcribe` służy do transkrypcji plików, a nie zarządzania sesjami czasu rzeczywistego.
- `--model` musi mieć postać `<provider/model>`.

## TTS

Używaj `tts` do syntezy mowy i stanu dostawcy TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Uwagi:

- `tts status` domyślnie używa Gateway, ponieważ odzwierciedla stan TTS zarządzany przez Gateway.
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

- `video generate` akceptuje `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` i `--timeout-ms` i przekazuje je do środowiska wykonawczego generowania wideo.
- Dla `video describe` `--model` musi mieć postać `<provider/model>`.

## Web

Używaj `web` do przepływów wyszukiwania i pobierania.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Uwagi:

- Używaj `web providers`, aby sprawdzać dostępnych, skonfigurowanych i wybranych dostawców.

## Embedding

Używaj `embedding` do tworzenia wektorów i inspekcji dostawców embeddingów.

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
`path`, `mimeType`, `size` oraz wszelkich wymiarów specyficznych dla mediów w tej tablicy
na potrzeby automatyzacji zamiast analizować czytelne dla człowieka stdout.

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

- [Dokumentacja referencyjna CLI](/pl/cli)
- [Modele](/pl/concepts/models)
