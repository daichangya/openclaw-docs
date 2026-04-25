---
read_when:
    - Włączanie zamiany tekstu na mowę dla odpowiedzi
    - Konfigurowanie dostawców TTS lub limitów
    - Używanie poleceń /tts
summary: Zamiana tekstu na mowę (TTS) dla odpowiedzi wychodzących
title: Zamiana tekstu na mowę
x-i18n:
    generated_at: "2026-04-25T14:01:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0038157f631a308c8ff7f0eef9db2b2d686cd417c525ac37b9d21097c34d9b6a
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw może zamieniać odpowiedzi wychodzące na dźwięk przy użyciu ElevenLabs, Google Gemini, Gradium, Local CLI, Microsoft, MiniMax, OpenAI, Vydra, xAI lub Xiaomi MiMo.
Działa wszędzie tam, gdzie OpenClaw może wysyłać audio.

## Obsługiwane usługi

- **ElevenLabs** (dostawca główny lub zapasowy)
- **Google Gemini** (dostawca główny lub zapasowy; używa Gemini API TTS)
- **Gradium** (dostawca główny lub zapasowy; obsługuje wyjście notatek głosowych i telefonii)
- **Local CLI** (dostawca główny lub zapasowy; uruchamia skonfigurowane lokalne polecenie TTS)
- **Microsoft** (dostawca główny lub zapasowy; obecna dołączona implementacja używa `node-edge-tts`)
- **MiniMax** (dostawca główny lub zapasowy; używa API T2A v2)
- **OpenAI** (dostawca główny lub zapasowy; używany także do podsumowań)
- **Vydra** (dostawca główny lub zapasowy; współdzielony dostawca obrazów, wideo i mowy)
- **xAI** (dostawca główny lub zapasowy; używa API xAI TTS)
- **Xiaomi MiMo** (dostawca główny lub zapasowy; używa MiMo TTS przez Xiaomi chat completions)

### Uwagi o mowie Microsoft

Dołączony dostawca mowy Microsoft obecnie używa internetowej
usługi neural TTS Microsoft Edge przez bibliotekę `node-edge-tts`. Jest to usługa hostowana (nie
lokalna), używa punktów końcowych Microsoft i nie wymaga klucza API.
`node-edge-tts` udostępnia opcje konfiguracji mowy i formaty wyjściowe, ale
nie wszystkie opcje są obsługiwane przez usługę. Starsza konfiguracja i dane wejściowe dyrektyw
używające `edge` nadal działają i są normalizowane do `microsoft`.

Ponieważ ta ścieżka jest publiczną usługą webową bez opublikowanego SLA ani limitu,
traktuj ją jako best-effort. Jeśli potrzebujesz gwarantowanych limitów i wsparcia, użyj OpenAI
lub ElevenLabs.

## Opcjonalne klucze

Jeśli chcesz używać OpenAI, ElevenLabs, Google Gemini, Gradium, MiniMax, Vydra, xAI lub Xiaomi MiMo:

- `ELEVENLABS_API_KEY` (lub `XI_API_KEY`)
- `GEMINI_API_KEY` (lub `GOOGLE_API_KEY`)
- `GRADIUM_API_KEY`
- `MINIMAX_API_KEY`; MiniMax TTS akceptuje także uwierzytelnianie Token Plan przez
  `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` lub
  `MINIMAX_CODING_API_KEY`
- `OPENAI_API_KEY`
- `VYDRA_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`

Local CLI i mowa Microsoft **nie** wymagają klucza API.

Jeśli skonfigurowano wielu dostawców, najpierw używany jest wybrany dostawca, a pozostali są opcjami zapasowymi.
Automatyczne podsumowanie używa skonfigurowanego `summaryModel` (lub `agents.defaults.model.primary`),
więc ten dostawca również musi być uwierzytelniony, jeśli włączysz podsumowania.

## Linki do usług

- [Przewodnik OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Dokumentacja referencyjna OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/pl/providers/gradium)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Synteza mowy Xiaomi MiMo](/pl/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formaty wyjściowe Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Czy jest włączone domyślnie?

Nie. Auto‑TTS jest domyślnie **wyłączone**. Włącz je w konfiguracji przez
`messages.tts.auto` lub lokalnie przez `/tts on`.

Gdy `messages.tts.provider` nie jest ustawione, OpenClaw wybiera pierwszego skonfigurowanego
dostawcę mowy według kolejności automatycznego wyboru rejestru.

## Konfiguracja

Konfiguracja TTS znajduje się pod `messages.tts` w `openclaw.json`.
Pełny schemat znajduje się w [Konfiguracja Gateway](/pl/gateway/configuration).

### Minimalna konfiguracja (włączenie + dostawca)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
    },
  },
}
```

### OpenAI jako główny z ElevenLabs jako zapasowym

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Microsoft jako główny (bez klucza API)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### MiniMax jako główny

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```

Rozwiązywanie uwierzytelniania MiniMax TTS przebiega w kolejności `messages.tts.providers.minimax.apiKey`, następnie
zapisane profile OAuth/token `minimax-portal`, następnie klucze środowiskowe Token Plan
(`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
`MINIMAX_CODING_API_KEY`), a następnie `MINIMAX_API_KEY`. Gdy jawne TTS
`baseUrl` nie jest ustawione, OpenClaw może ponownie użyć skonfigurowanego hosta OAuth
`minimax-portal` dla mowy Token Plan.

### Google Gemini jako główny

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "gemini_api_key",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Google Gemini TTS używa ścieżki klucza API Gemini. Klucz API Google Cloud Console
ograniczony do Gemini API jest tutaj prawidłowy i jest to ten sam typ klucza używany
przez dołączonego dostawcę generowania obrazów Google. Kolejność rozwiązywania to
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`.

### xAI jako główny

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "xai_api_key",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
          speed: 1.0,
        },
      },
    },
  },
}
```

xAI TTS używa tej samej ścieżki `XAI_API_KEY` co dołączony dostawca modeli Grok.
Kolejność rozwiązywania to `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
Aktualne głosy live to `ara`, `eve`, `leo`, `rex`, `sal` i `una`; `eve` jest
domyślny. `language` akceptuje tag BCP-47 lub `auto`.

### Xiaomi MiMo jako główny

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          baseUrl: "https://api.xiaomimimo.com/v1",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Jasny, naturalny, konwersacyjny ton.",
        },
      },
    },
  },
}
```

Xiaomi MiMo TTS używa tej samej ścieżki `XIAOMI_API_KEY` co dołączony dostawca modeli Xiaomi.
Identyfikator dostawcy mowy to `xiaomi`; `mimo` jest akceptowane jako alias.
Tekst docelowy jest wysyłany jako wiadomość asystenta, zgodnie z kontraktem TTS Xiaomi.
Opcjonalne `style` jest wysyłane jako instrukcja użytkownika i nie jest wypowiadane.

### OpenRouter jako główny

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "openrouter_api_key",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

OpenRouter TTS używa tej samej ścieżki `OPENROUTER_API_KEY` co dołączony
dostawca modeli OpenRouter. Kolejność rozwiązywania to
`messages.tts.providers.openrouter.apiKey` ->
`models.providers.openrouter.apiKey` -> `OPENROUTER_API_KEY`.

### Local CLI jako główny

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "tts-local-cli",
      providers: {
        "tts-local-cli": {
          command: "say",
          args: ["-o", "{{OutputPath}}", "{{Text}}"],
          outputFormat: "wav",
          timeoutMs: 120000,
        },
      },
    },
  },
}
```

Local CLI TTS uruchamia skonfigurowane polecenie na hoście Gateway. Placeholdery
`{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}` i `{{OutputBase}}` są
rozwijane w `args`; jeśli nie ma placeholdera `{{Text}}`, OpenClaw zapisuje
wypowiadany tekst na stdin. `outputFormat` akceptuje `mp3`, `opus` lub `wav`.
Cele notatek głosowych są transkodowane do Ogg/Opus, a wyjście telefoniczne jest
transkodowane do surowego PCM mono 16 kHz przy użyciu `ffmpeg`. Starszy alias dostawcy
`cli` nadal działa, ale nowa konfiguracja powinna używać `tts-local-cli`.

### Gradium jako główny

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "gradium_api_key",
          baseUrl: "https://api.gradium.ai",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```

### Wyłączanie mowy Microsoft

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### Własne limity + ścieżka prefs

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### Odpowiadaj dźwiękiem tylko po przychodzącej wiadomości głosowej

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Wyłącz automatyczne podsumowanie dla długich odpowiedzi

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

Następnie uruchom:

```
/tts summary off
```

### Uwagi o polach

- `auto`: tryb auto‑TTS (`off`, `always`, `inbound`, `tagged`).
  - `inbound` wysyła audio tylko po przychodzącej wiadomości głosowej.
  - `tagged` wysyła audio tylko wtedy, gdy odpowiedź zawiera dyrektywy `[[tts:key=value]]` lub blok `[[tts:text]]...[[/tts:text]]`.
- `enabled`: starszy przełącznik (doctor migruje go do `auto`).
- `mode`: `"final"` (domyślnie) lub `"all"` (obejmuje odpowiedzi narzędzi/bloków).
- `provider`: identyfikator dostawcy mowy, taki jak `"elevenlabs"`, `"google"`, `"gradium"`, `"microsoft"`, `"minimax"`, `"openai"`, `"vydra"`, `"xai"` lub `"xiaomi"` (fallback jest automatyczny).
- Jeśli `provider` jest **nieustawiony**, OpenClaw używa pierwszego skonfigurowanego dostawcy mowy według kolejności automatycznego wyboru rejestru.
- Starsza konfiguracja `provider: "edge"` jest naprawiana przez `openclaw doctor --fix` i
  przepisywana na `provider: "microsoft"`.
- `summaryModel`: opcjonalny tani model do automatycznego podsumowania; domyślnie `agents.defaults.model.primary`.
  - Akceptuje `provider/model` lub skonfigurowany alias modelu.
- `modelOverrides`: pozwala modelowi emitować dyrektywy TTS (domyślnie włączone).
  - `allowProvider` domyślnie ma wartość `false` (przełączanie dostawcy jest opt-in).
- `providers.<id>`: ustawienia należące do dostawcy, kluczowane identyfikatorem dostawcy mowy.
- Starsze bezpośrednie bloki dostawców (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) są naprawiane przez `openclaw doctor --fix`; konfiguracja zapisywana w repozytorium powinna używać `messages.tts.providers.<id>`.
- Starsze `messages.tts.providers.edge` także jest naprawiane przez `openclaw doctor --fix`; konfiguracja zapisywana w repozytorium powinna używać `messages.tts.providers.microsoft`.
- `maxTextLength`: twardy limit danych wejściowych TTS (znaki). `/tts audio` kończy się błędem po jego przekroczeniu.
- `timeoutMs`: limit czasu żądania (ms).
- `prefsPath`: nadpisuje lokalną ścieżkę JSON prefs (dostawca/limit/podsumowanie).
- Wartości `apiKey` używają zmiennych środowiskowych jako fallbacku (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `GRADIUM_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`, `VYDRA_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`).
- `providers.elevenlabs.baseUrl`: nadpisuje bazowy adres URL API ElevenLabs.
- `providers.openai.baseUrl`: nadpisuje punkt końcowy OpenAI TTS.
  - Kolejność rozwiązywania: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Wartości inne niż domyślne są traktowane jako punkty końcowe TTS zgodne z OpenAI, więc akceptowane są niestandardowe nazwy modeli i głosów.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normalnie)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2-literowy ISO 639-1 (np. `en`, `de`)
- `providers.elevenlabs.seed`: liczba całkowita `0..4294967295` (deterministyczność best-effort)
- `providers.minimax.baseUrl`: nadpisuje bazowy adres URL API MiniMax (domyślnie `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: model TTS (domyślnie `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: identyfikator głosu (domyślnie `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: prędkość odtwarzania `0.5..2.0` (domyślnie 1.0).
- `providers.minimax.vol`: głośność `(0, 10]` (domyślnie 1.0; musi być większa od 0).
- `providers.minimax.pitch`: całkowite przesunięcie wysokości tonu `-12..12` (domyślnie 0). Wartości ułamkowe są obcinane przed wywołaniem MiniMax T2A, ponieważ API odrzuca wartości wysokości tonu niebędące liczbami całkowitymi.
- `providers.tts-local-cli.command`: lokalny plik wykonywalny lub ciąg polecenia dla CLI TTS.
- `providers.tts-local-cli.args`: argumenty polecenia; obsługuje placeholdery `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}` i `{{OutputBase}}`.
- `providers.tts-local-cli.outputFormat`: oczekiwany format wyjściowy CLI (`mp3`, `opus` lub `wav`; domyślnie `mp3` dla załączników audio).
- `providers.tts-local-cli.timeoutMs`: limit czasu polecenia w milisekundach (domyślnie `120000`).
- `providers.tts-local-cli.cwd`: opcjonalny katalog roboczy polecenia.
- `providers.tts-local-cli.env`: opcjonalne nadpisania środowiska w postaci ciągów dla polecenia.
- `providers.google.model`: model Gemini TTS (domyślnie `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: nazwa wbudowanego głosu Gemini (domyślnie `Kore`; akceptowane jest także `voice`).
- `providers.google.audioProfile`: prompt stylu w języku naturalnym dodawany przed tekstem mówionym.
- `providers.google.speakerName`: opcjonalna etykieta mówcy dodawana przed tekstem mówionym, gdy prompt TTS używa nazwanego mówcy.
- `providers.google.baseUrl`: nadpisuje bazowy adres URL Gemini API. Akceptowane jest tylko `https://generativelanguage.googleapis.com`.
  - Jeśli `messages.tts.providers.google.apiKey` jest pominięte, TTS może ponownie użyć `models.providers.google.apiKey` przed fallbackiem do env.
- `providers.gradium.baseUrl`: nadpisuje bazowy adres URL API Gradium (domyślnie `https://api.gradium.ai`).
- `providers.gradium.voiceId`: identyfikator głosu Gradium (domyślnie Emma, `YTpq7expH9539ERJ`).
- `providers.xai.apiKey`: klucz API xAI TTS (env: `XAI_API_KEY`).
- `providers.xai.baseUrl`: nadpisuje bazowy adres URL xAI TTS (domyślnie `https://api.x.ai/v1`, env: `XAI_BASE_URL`).
- `providers.xai.voiceId`: identyfikator głosu xAI (domyślnie `eve`; aktualne głosy live: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: kod języka BCP-47 lub `auto` (domyślnie `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` lub `alaw` (domyślnie `mp3`).
- `providers.xai.speed`: natywne nadpisanie prędkości dostawcy.
- `providers.xiaomi.apiKey`: klucz API Xiaomi MiMo (env: `XIAOMI_API_KEY`).
- `providers.xiaomi.baseUrl`: nadpisuje bazowy adres URL API Xiaomi MiMo (domyślnie `https://api.xiaomimimo.com/v1`, env: `XIAOMI_BASE_URL`).
- `providers.xiaomi.model`: model TTS (domyślnie `mimo-v2.5-tts`, env: `XIAOMI_TTS_MODEL`; obsługiwane jest także `mimo-v2-tts`).
- `providers.xiaomi.voice`: identyfikator głosu MiMo (domyślnie `mimo_default`, env: `XIAOMI_TTS_VOICE`).
- `providers.xiaomi.format`: `mp3` lub `wav` (domyślnie `mp3`, env: `XIAOMI_TTS_FORMAT`).
- `providers.xiaomi.style`: opcjonalna instrukcja stylu w języku naturalnym wysyłana jako wiadomość użytkownika; nie jest wypowiadana.
- `providers.openrouter.apiKey`: klucz API OpenRouter (env: `OPENROUTER_API_KEY`; może ponownie użyć `models.providers.openrouter.apiKey`).
- `providers.openrouter.baseUrl`: nadpisuje bazowy adres URL OpenRouter TTS (domyślnie `https://openrouter.ai/api/v1`; starsze `https://openrouter.ai/v1` jest normalizowane).
- `providers.openrouter.model`: identyfikator modelu OpenRouter TTS (domyślnie `hexgrad/kokoro-82m`; akceptowane jest także `modelId`).
- `providers.openrouter.voice`: specyficzny dla dostawcy identyfikator głosu (domyślnie `af_alloy`; akceptowane jest także `voiceId`).
- `providers.openrouter.responseFormat`: `mp3` lub `pcm` (domyślnie `mp3`).
- `providers.openrouter.speed`: natywne nadpisanie prędkości dostawcy.
- `providers.microsoft.enabled`: pozwala używać mowy Microsoft (domyślnie `true`; bez klucza API).
- `providers.microsoft.voice`: nazwa neuralnego głosu Microsoft (np. `en-US-MichelleNeural`).
- `providers.microsoft.lang`: kod języka (np. `en-US`).
- `providers.microsoft.outputFormat`: format wyjściowy Microsoft (np. `audio-24khz-48kbitrate-mono-mp3`).
  - Zobacz formaty wyjściowe Microsoft Speech, aby poznać prawidłowe wartości; nie wszystkie formaty są obsługiwane przez dołączony transport oparty na Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: ciągi procentowe (np. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: zapisuje napisy JSON obok pliku audio.
- `providers.microsoft.proxy`: adres URL proxy dla żądań mowy Microsoft.
- `providers.microsoft.timeoutMs`: nadpisanie limitu czasu żądania (ms).
- `edge.*`: starszy alias tych samych ustawień Microsoft. Uruchom
  `openclaw doctor --fix`, aby przepisać zapisaną konfigurację na `providers.microsoft`.

## Nadpisania sterowane przez model (domyślnie włączone)

Domyślnie model **może** emitować dyrektywy TTS dla pojedynczej odpowiedzi.
Gdy `messages.tts.auto` ma wartość `tagged`, te dyrektywy są wymagane do wyzwolenia audio.

Po włączeniu model może emitować dyrektywy `[[tts:...]]`, aby nadpisać głos
dla pojedynczej odpowiedzi, plus opcjonalny blok `[[tts:text]]...[[/tts:text]]`, aby
dostarczyć ekspresyjne tagi (śmiech, wskazówki śpiewu itp.), które powinny pojawić się tylko w
audio.

Dyrektywy `provider=...` są ignorowane, chyba że `modelOverrides.allowProvider: true`.

Przykładowy ładunek odpowiedzi:

```
Proszę bardzo.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](śmiech) Przeczytaj piosenkę jeszcze raz.[[/tts:text]]
```

Dostępne klucze dyrektyw (gdy włączone):

- `provider` (identyfikator zarejestrowanego dostawcy mowy, na przykład `openai`, `elevenlabs`, `google`, `gradium`, `minimax`, `microsoft`, `vydra`, `xai` lub `xiaomi`; wymaga `allowProvider: true`)
- `voice` (głos OpenAI, Gradium lub Xiaomi), `voiceName` / `voice_name` / `google_voice` (głos Google) lub `voiceId` (ElevenLabs / Gradium / MiniMax / xAI)
- `model` (model OpenAI TTS, identyfikator modelu ElevenLabs, model MiniMax lub model Xiaomi MiMo TTS) albo `google_model` (model Google TTS)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (głośność MiniMax, 0-10)
- `pitch` (całkowita wysokość tonu MiniMax, -12 do 12; wartości ułamkowe są obcinane przed żądaniem MiniMax)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Wyłącz wszystkie nadpisania modelu:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

Opcjonalna allowlist (włącza przełączanie dostawców przy zachowaniu konfigurowalności innych ustawień):

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## Preferencje per użytkownik

Polecenia slash zapisują lokalne nadpisania do `prefsPath` (domyślnie:
`~/.openclaw/settings/tts.json`, nadpisywane przez `OPENCLAW_TTS_PREFS` lub
`messages.tts.prefsPath`).

Zapisywane pola:

- `enabled`
- `provider`
- `maxLength` (próg podsumowania; domyślnie 1500 znaków)
- `summarize` (domyślnie `true`)

Nadpisują one `messages.tts.*` dla tego hosta.

## Formaty wyjściowe (stałe)

- **Feishu / Matrix / Telegram / WhatsApp**: odpowiedzi w formie notatek głosowych preferują Opus (`opus_48000_64` z ElevenLabs, `opus` z OpenAI).
  - 48 kHz / 64 kb/s to dobry kompromis dla wiadomości głosowych.
- **Feishu**: gdy odpowiedź w formie notatki głosowej zostanie wygenerowana jako MP3/WAV/M4A lub inny
  prawdopodobny plik audio, plugin Feishu transkoduje ją do 48 kHz Ogg/Opus przy użyciu
  `ffmpeg` przed wysłaniem natywnego dymka `audio`. Jeśli konwersja się nie powiedzie, Feishu
  otrzyma oryginalny plik jako załącznik.
- **Inne kanały**: MP3 (`mp3_44100_128` z ElevenLabs, `mp3` z OpenAI).
  - 44,1 kHz / 128 kb/s to domyślny kompromis dla klarowności mowy.
- **MiniMax**: MP3 (model `speech-2.8-hd`, częstotliwość próbkowania 32 kHz) dla zwykłych załączników audio. Dla celów notatek głosowych, takich jak Feishu i Telegram, OpenClaw transkoduje MP3 MiniMax do 48 kHz Opus przy użyciu `ffmpeg` przed dostarczeniem.
- **Xiaomi MiMo**: domyślnie MP3 lub WAV, gdy skonfigurowano. Dla celów notatek głosowych, takich jak Feishu i Telegram, OpenClaw transkoduje wyjście Xiaomi do 48 kHz Opus przy użyciu `ffmpeg` przed dostarczeniem.
- **Local CLI**: używa skonfigurowanego `outputFormat`. Cele notatek głosowych są
  konwertowane do Ogg/Opus, a wyjście telefoniczne jest konwertowane do surowego mono PCM 16 kHz
  przy użyciu `ffmpeg`.
- **Google Gemini**: Gemini API TTS zwraca surowy PCM 24 kHz. OpenClaw opakowuje go jako WAV dla załączników audio i zwraca PCM bezpośrednio dla Talk/telefonii. Natywny format notatek głosowych Opus nie jest obsługiwany na tej ścieżce.
- **Gradium**: WAV dla załączników audio, Opus dla celów notatek głosowych oraz `ulaw_8000` przy 8 kHz dla telefonii.
- **xAI**: domyślnie MP3; `responseFormat` może mieć wartość `mp3`, `wav`, `pcm`, `mulaw` lub `alaw`. OpenClaw używa wsadowego punktu końcowego REST TTS xAI i zwraca kompletny załącznik audio; strumieniowy WebSocket TTS xAI nie jest używany na tej ścieżce dostawcy. Natywny format notatek głosowych Opus nie jest obsługiwany na tej ścieżce.
- **Microsoft**: używa `microsoft.outputFormat` (domyślnie `audio-24khz-48kbitrate-mono-mp3`).
  - Dołączony transport akceptuje `outputFormat`, ale nie wszystkie formaty są dostępne w usłudze.
  - Wartości formatu wyjściowego są zgodne z formatami wyjściowymi Microsoft Speech (w tym Ogg/WebM Opus).
  - Telegram `sendVoice` akceptuje OGG/MP3/M4A; użyj OpenAI/ElevenLabs, jeśli potrzebujesz
    gwarantowanych wiadomości głosowych Opus.
  - Jeśli skonfigurowany format wyjściowy Microsoft zakończy się niepowodzeniem, OpenClaw ponowi próbę z MP3.

Formaty wyjściowe OpenAI/ElevenLabs są stałe dla kanału (patrz wyżej).

## Zachowanie auto-TTS

Po włączeniu OpenClaw:

- pomija TTS, jeśli odpowiedź już zawiera multimedia lub dyrektywę `MEDIA:`.
- pomija bardzo krótkie odpowiedzi (< 10 znaków).
- podsumowuje długie odpowiedzi, gdy ta opcja jest włączona, używając `agents.defaults.model.primary` (lub `summaryModel`).
- dołącza wygenerowane audio do odpowiedzi.

Jeśli odpowiedź przekracza `maxLength`, a podsumowanie jest wyłączone (lub brak klucza API dla
modelu podsumowującego), audio
jest pomijane i wysyłana jest zwykła odpowiedź tekstowa.

## Schemat przepływu

```
Odpowiedź -> TTS włączone?
  nie -> wyślij tekst
  tak -> zawiera multimedia / MEDIA: / krótka?
          tak -> wyślij tekst
          nie -> długość > limit?
                   nie -> TTS -> dołącz audio
                   tak -> podsumowanie włączone?
                            nie -> wyślij tekst
                            tak -> podsumuj (summaryModel lub agents.defaults.model.primary)
                                      -> TTS -> dołącz audio
```

## Użycie polecenia slash

Istnieje jedno polecenie: `/tts`.
Szczegóły włączania znajdziesz w [Slash commands](/pl/tools/slash-commands).

Uwaga dotycząca Discord: `/tts` to wbudowane polecenie Discord, więc OpenClaw rejestruje tam
`/voice` jako natywne polecenie. Tekstowe `/tts ...` nadal działa.

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Uwagi:

- Polecenia wymagają autoryzowanego nadawcy (nadal obowiązują reguły allowlist/właściciela).
- Musi być włączone `commands.text` lub natywna rejestracja poleceń.
- Konfiguracja `messages.tts.auto` akceptuje `off|always|inbound|tagged`.
- `/tts on` zapisuje lokalną preferencję TTS jako `always`; `/tts off` zapisuje ją jako `off`.
- Użyj konfiguracji, gdy chcesz domyślnych wartości `inbound` lub `tagged`.
- `limit` i `summary` są zapisywane w lokalnych prefs, a nie w głównej konfiguracji.
- `/tts audio` generuje jednorazową odpowiedź audio (nie włącza TTS).
- `/tts status` obejmuje widoczność fallbacku dla najnowszej próby:
  - udany fallback: `Fallback: <primary> -> <used>` plus `Attempts: ...`
  - niepowodzenie: `Error: ...` plus `Attempts: ...`
  - szczegółowa diagnostyka: `Attempt details: provider:outcome(reasonCode) latency`
- Błędy API OpenAI i ElevenLabs zawierają teraz sparsowane szczegóły błędu dostawcy oraz identyfikator żądania (gdy dostawca go zwraca), co jest prezentowane w błędach/logach TTS.

## Narzędzie agenta

Narzędzie `tts` zamienia tekst na mowę i zwraca załącznik audio do
dostarczenia odpowiedzi. Gdy kanałem jest Feishu, Matrix, Telegram lub WhatsApp,
audio jest dostarczane jako wiadomość głosowa, a nie jako załącznik pliku.
Feishu może na tej ścieżce transkodować wyjście TTS inne niż Opus, jeśli
`ffmpeg` jest dostępne.
Akceptuje opcjonalne pola `channel` i `timeoutMs`; `timeoutMs` to
limit czasu żądania dostawcy dla pojedynczego wywołania w milisekundach.

## Gateway RPC

Metody Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## Powiązane

- [Media overview](/pl/tools/media-overview)
- [Music generation](/pl/tools/music-generation)
- [Video generation](/pl/tools/video-generation)
