---
read_when:
    - Zmiana transkrypcji audio lub obsługi multimediów.
summary: Jak przychodzące audio/notatki głosowe są pobierane, transkrybowane i wstrzykiwane do odpowiedzi
title: Audio i notatki głosowe
x-i18n:
    generated_at: "2026-04-25T13:50:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc48787be480fbd19d26f18ac42a15108be89104e6aa56e60a94bd62b1b0cba0
    source_path: nodes/audio.md
    workflow: 15
---

# Audio / notatki głosowe (2026-01-17)

## Co działa

- **Rozumienie multimediów (audio)**: jeśli rozumienie audio jest włączone (lub wykrywane automatycznie), OpenClaw:
  1. Lokalizuje pierwszy załącznik audio (ścieżka lokalna lub URL) i pobiera go w razie potrzeby.
  2. Wymusza `maxBytes` przed wysłaniem do każdego wpisu modelu.
  3. Uruchamia pierwszy kwalifikujący się wpis modelu w kolejności (dostawca lub CLI).
  4. Jeśli zakończy się błędem lub zostanie pominięty (rozmiar/timeout), próbuje następnego wpisu.
  5. Po powodzeniu zastępuje `Body` blokiem `[Audio]` i ustawia `{{Transcript}}`.
- **Parsowanie poleceń**: gdy transkrypcja się powiedzie, `CommandBody`/`RawBody` są ustawiane na transkrypt, więc slash commands nadal działają.
- **Szczegółowe logowanie**: w trybie `--verbose` logujemy, kiedy uruchamia się transkrypcja i kiedy zastępuje treść.

## Automatyczne wykrywanie (domyślnie)

Jeśli **nie skonfigurujesz modeli**, a `tools.media.audio.enabled` **nie** jest ustawione na `false`,
OpenClaw automatycznie wykrywa w tej kolejności i zatrzymuje się na pierwszej działającej opcji:

1. **Aktywny model odpowiedzi**, gdy jego dostawca obsługuje rozumienie audio.
2. **Lokalne CLI** (jeśli są zainstalowane)
   - `sherpa-onnx-offline` (wymaga `SHERPA_ONNX_MODEL_DIR` z encoder/decoder/joiner/tokens)
   - `whisper-cli` (z `whisper-cpp`; używa `WHISPER_CPP_MODEL` lub dołączonego modelu tiny)
   - `whisper` (Python CLI; automatycznie pobiera modele)
3. **Gemini CLI** (`gemini`) przy użyciu `read_many_files`
4. **Auth dostawcy**
   - Najpierw próbowane są skonfigurowane wpisy `models.providers.*`, które obsługują audio
   - Kolejność dołączonego fallbacku: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Aby wyłączyć automatyczne wykrywanie, ustaw `tools.media.audio.enabled: false`.
Aby dostosować działanie, ustaw `tools.media.audio.models`.
Uwaga: wykrywanie binariów działa metodą best-effort na macOS/Linux/Windows; upewnij się, że CLI jest w `PATH` (rozwijamy `~`) albo ustaw jawny model CLI z pełną ścieżką do polecenia.

## Przykłady konfiguracji

### Dostawca + fallback CLI (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### Tylko dostawca z bramkowaniem zakresu

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### Tylko dostawca (Deepgram)

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

### Tylko dostawca (Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### Tylko dostawca (SenseAudio)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
      },
    },
  },
}
```

### Echo transkryptu na czat (opcjonalne)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // domyślnie false
        echoFormat: '📝 "{transcript}"', // opcjonalne, obsługuje {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Uwagi i limity

- Auth dostawcy podąża za standardową kolejnością auth modelu (profile auth, zmienne env, `models.providers.*.apiKey`).
- Szczegóły konfiguracji Groq: [Groq](/pl/providers/groq).
- Deepgram pobiera `DEEPGRAM_API_KEY`, gdy używane jest `provider: "deepgram"`.
- Szczegóły konfiguracji Deepgram: [Deepgram (transkrypcja audio)](/pl/providers/deepgram).
- Szczegóły konfiguracji Mistral: [Mistral](/pl/providers/mistral).
- SenseAudio pobiera `SENSEAUDIO_API_KEY`, gdy używane jest `provider: "senseaudio"`.
- Szczegóły konfiguracji SenseAudio: [SenseAudio](/pl/providers/senseaudio).
- Dostawcy audio mogą nadpisywać `baseUrl`, `headers` i `providerOptions` przez `tools.media.audio`.
- Domyślny limit rozmiaru to 20 MB (`tools.media.audio.maxBytes`). Zbyt duże audio jest pomijane dla tego modelu i próbowany jest następny wpis.
- Małe/puste pliki audio poniżej 1024 bajtów są pomijane przed transkrypcją dostawcy/CLI.
- Domyślne `maxChars` dla audio jest **nieustawione** (pełny transkrypt). Ustaw `tools.media.audio.maxChars` lub `maxChars` dla konkretnego wpisu, aby przyciąć wynik.
- Domyślny automatyczny wybór OpenAI to `gpt-4o-mini-transcribe`; ustaw `model: "gpt-4o-transcribe"` dla wyższej dokładności.
- Użyj `tools.media.audio.attachments`, aby przetwarzać wiele notatek głosowych (`mode: "all"` + `maxAttachments`).
- Transkrypt jest dostępny w szablonach jako `{{Transcript}}`.
- `tools.media.audio.echoTranscript` jest domyślnie wyłączone; włącz je, aby wysłać potwierdzenie transkryptu z powrotem do czatu źródłowego przed przetwarzaniem przez agenta.
- `tools.media.audio.echoFormat` dostosowuje tekst echo (placeholder: `{transcript}`).
- Stdout CLI ma limit (5 MB); utrzymuj zwięzłe wyjście CLI.

### Obsługa środowiska proxy

Transkrypcja audio oparta na dostawcy respektuje standardowe zmienne env dla wychodzącego proxy:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Jeśli nie są ustawione żadne zmienne env proxy, używany jest bezpośredni ruch wychodzący. Jeśli konfiguracja proxy jest błędna, OpenClaw loguje ostrzeżenie i przechodzi fallbackiem do bezpośredniego fetch.

## Wykrywanie wzmianek w grupach

Gdy dla czatu grupowego ustawione jest `requireMention: true`, OpenClaw transkrybuje audio **przed** sprawdzeniem wzmianek. Dzięki temu notatki głosowe mogą być przetwarzane nawet wtedy, gdy zawierają wzmianki.

**Jak to działa:**

1. Jeśli wiadomość głosowa nie ma tekstowej treści, a grupa wymaga wzmianek, OpenClaw wykonuje „preflight” transkrypcji.
2. Transkrypt jest sprawdzany pod kątem wzorców wzmianek (np. `@BotName`, wyzwalacze emoji).
3. Jeśli zostanie znaleziona wzmianka, wiadomość przechodzi przez pełny pipeline odpowiedzi.
4. Transkrypt jest używany do wykrywania wzmianek, dzięki czemu notatki głosowe mogą przejść przez bramkę wzmianek.

**Zachowanie fallbacku:**

- Jeśli transkrypcja nie powiedzie się podczas preflightu (timeout, błąd API itd.), wiadomość jest przetwarzana na podstawie wykrywania wzmianek tylko w tekście.
- Dzięki temu wiadomości mieszane (tekst + audio) nigdy nie są błędnie odrzucane.

**Rezygnacja dla grupy/tematu Telegram per grupa:**

- Ustaw `channels.telegram.groups.<chatId>.disableAudioPreflight: true`, aby pominąć kontrolę wzmianek w preflightowym transkrypcie dla tej grupy.
- Ustaw `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`, aby nadpisywać dla tematu (`true`, aby pominąć, `false`, aby wymusić włączenie).
- Domyślnie jest to `false` (preflight włączony, gdy pasują warunki bramkowania wzmianek).

**Przykład:** Użytkownik wysyła notatkę głosową z treścią „Hej @Claude, jaka jest pogoda?” w grupie Telegram z `requireMention: true`. Notatka głosowa jest transkrybowana, wzmianka zostaje wykryta, a agent odpowiada.

## Pułapki

- Reguły zakresu używają zasady pierwszego dopasowania. `chatType` jest normalizowane do `direct`, `group` albo `room`.
- Upewnij się, że Twoje CLI kończy się kodem 0 i wypisuje zwykły tekst; JSON trzeba przekształcić przez `jq -r .text`.
- Dla `parakeet-mlx`, jeśli podasz `--output-dir`, OpenClaw odczytuje `<output-dir>/<media-basename>.txt`, gdy `--output-format` ma wartość `txt` (lub jest pominięte); formaty wyjściowe inne niż `txt` przechodzą fallbackiem do parsowania stdout.
- Utrzymuj rozsądne limity czasu (`timeoutSeconds`, domyślnie 60 s), aby nie blokować kolejki odpowiedzi.
- Transkrypcja preflight przetwarza tylko **pierwszy** załącznik audio do wykrywania wzmianek. Dodatkowe audio jest przetwarzane w głównej fazie rozumienia multimediów.

## Powiązane

- [Rozumienie multimediów](/pl/nodes/media-understanding)
- [Talk mode](/pl/nodes/talk)
- [Voice wake](/pl/nodes/voicewake)
