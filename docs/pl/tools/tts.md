---
read_when:
    - Włączanie zamiany tekstu na mowę dla odpowiedzi
    - Konfigurowanie dostawcy TTS, łańcucha awaryjnego lub persony
    - Używanie poleceń lub dyrektyw /tts
sidebarTitle: Text to speech (TTS)
summary: Zamiana tekstu na mowę dla odpowiedzi wychodzących — dostawcy, persony, polecenia z ukośnikiem i wyjście per kanał
title: Zamiana tekstu na mowę
x-i18n:
    generated_at: "2026-04-26T11:43:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 199a84fde8f7fd380667a39c448ac8158e0aab071b77be41b87431d10d8b4219
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw może konwertować odpowiedzi wychodzące na audio u **13 dostawców mowy**
i dostarczać natywne wiadomości głosowe w Feishu, Matrix, Telegram i WhatsApp,
załączniki audio wszędzie indziej oraz strumienie PCM/Ulaw dla telefonii i Talk.

## Szybki start

<Steps>
  <Step title="Wybierz dostawcę">
    OpenAI i ElevenLabs to najbardziej niezawodne opcje hostowane. Microsoft i
    local CLI działają bez klucza API. Pełną listę znajdziesz w [macierzy dostawców](#supported-providers).
  </Step>
  <Step title="Ustaw klucz API">
    Wyeksportuj zmienną środowiskową dla swojego dostawcy (na przykład `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft i local CLI nie wymagają klucza.
  </Step>
  <Step title="Włącz w konfiguracji">
    Ustaw `messages.tts.auto: "always"` i `messages.tts.provider`:

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

  </Step>
  <Step title="Wypróbuj na czacie">
    `/tts status` pokazuje bieżący stan. `/tts audio Hello from OpenClaw`
    wysyła jednorazową odpowiedź audio.
  </Step>
</Steps>

<Note>
Auto-TTS jest domyślnie **wyłączone**. Gdy `messages.tts.provider` nie jest ustawione,
OpenClaw wybiera pierwszego skonfigurowanego dostawcę zgodnie z kolejnością automatycznego wyboru w rejestrze.
</Note>

## Obsługiwani dostawcy

| Dostawca         | Uwierzytelnianie                                                                                                 | Uwagi                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Azure Speech** | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (także `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)        | Natywne wyjście notatek głosowych Ogg/Opus i telefonii.                |
| **ElevenLabs**   | `ELEVENLABS_API_KEY` lub `XI_API_KEY`                                                                            | Klonowanie głosu, wielojęzyczność, deterministyczność przez `seed`.    |
| **Google Gemini**| `GEMINI_API_KEY` lub `GOOGLE_API_KEY`                                                                            | TTS Gemini API; obsługa person przez `promptTemplate: "audio-profile-v1"`. |
| **Gradium**      | `GRADIUM_API_KEY`                                                                                                | Wyjście notatek głosowych i telefonii.                                 |
| **Inworld**      | `INWORLD_API_KEY`                                                                                                | Strumieniowe API TTS. Natywne notatki głosowe Opus i telefonia PCM.    |
| **Local CLI**    | brak                                                                                                             | Uruchamia skonfigurowane lokalne polecenie TTS.                        |
| **Microsoft**    | brak                                                                                                             | Publiczne Edge neural TTS przez `node-edge-tts`. Tryb best-effort, bez SLA. |
| **MiniMax**      | `MINIMAX_API_KEY` (lub Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)   | API T2A v2. Domyślnie `speech-2.8-hd`.                                 |
| **OpenAI**       | `OPENAI_API_KEY`                                                                                                 | Używany także do auto-summary; obsługuje personę `instructions`.       |
| **OpenRouter**   | `OPENROUTER_API_KEY` (może używać także `models.providers.openrouter.apiKey`)                                   | Domyślny model `hexgrad/kokoro-82m`.                                   |
| **Volcengine**   | `VOLCENGINE_TTS_API_KEY` lub `BYTEPLUS_SEED_SPEECH_API_KEY` (starsze AppID/token: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | HTTP API BytePlus Seed Speech.                                      |
| **Vydra**        | `VYDRA_API_KEY`                                                                                                  | Współdzielony dostawca obrazów, wideo i mowy.                          |
| **xAI**          | `XAI_API_KEY`                                                                                                    | Wsadowe TTS xAI. Natywny notatka głosowa Opus **nie** jest obsługiwana. |
| **Xiaomi MiMo**  | `XIAOMI_API_KEY`                                                                                                 | TTS MiMo przez Xiaomi chat completions.                                |

Jeśli skonfigurowano wielu dostawców, najpierw używany jest wybrany dostawca, a
pozostali są opcjami awaryjnymi. Auto-summary używa `summaryModel` (lub
`agents.defaults.model.primary`), więc ten dostawca również musi być uwierzytelniony,
jeśli pozostawisz podsumowania włączone.

<Warning>
Dołączony dostawca **Microsoft** używa usługi Microsoft Edge online neural TTS
przez `node-edge-tts`. To publiczna usługa internetowa bez opublikowanego
SLA ani limitów — traktuj ją jako best-effort. Starszy identyfikator dostawcy `edge` jest
normalizowany do `microsoft`, a `openclaw doctor --fix` przepisuje zapisaną
konfigurację; nowe konfiguracje powinny zawsze używać `microsoft`.
</Warning>

## Konfiguracja

Konfiguracja TTS znajduje się w `messages.tts` w `~/.openclaw/openclaw.json`. Wybierz
preset i dostosuj blok dostawcy:

<Tabs>
  <Tab title="Azure Speech">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "azure-speech",
      providers: {
        "azure-speech": {
          apiKey: "${AZURE_SPEECH_KEY}",
          region: "eastus",
          voice: "en-US-JennyNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          voiceNoteOutputFormat: "ogg-24khz-16bit-mono-opus",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Google Gemini">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "${GEMINI_API_KEY}",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          // Opcjonalne prompty stylu w języku naturalnym:
          // audioProfile: "Mów spokojnym tonem gospodarza podcastu.",
          // speakerName: "Alex",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Gradium">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "${GRADIUM_API_KEY}",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Inworld">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "inworld",
      providers: {
        inworld: {
          apiKey: "${INWORLD_API_KEY}",
          modelId: "inworld-tts-1.5-max",
          voiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Local CLI">
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
  </Tab>
  <Tab title="Microsoft (bez klucza)">
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
          rate: "+0%",
          pitch: "+0%",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="MiniMax">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "${MINIMAX_API_KEY}",
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
  </Tab>
  <Tab title="OpenAI + ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      providers: {
        openai: {
          apiKey: "${OPENAI_API_KEY}",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
          voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0.0, useSpeakerBoost: true, speed: 1.0 },
          applyTextNormalization: "auto",
          languageCode: "en",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenRouter">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "${OPENROUTER_API_KEY}",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Volcengine">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "${VOLCENGINE_TTS_API_KEY}",
          resourceId: "seed-tts-1.0",
          voice: "en_female_anna_mars_bigtts",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="xAI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "${XAI_API_KEY}",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Xiaomi MiMo">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "${XIAOMI_API_KEY}",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

### Nadpisania głosu per agent

Użyj `agents.list[].tts`, gdy jeden agent ma mówić innym dostawcą,
głosem, modelem, personą lub trybem auto-TTS. Blok agenta jest scalany głęboko z
`messages.tts`, więc poświadczenia dostawcy mogą pozostać w globalnej konfiguracji dostawcy:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: { apiKey: "${ELEVENLABS_API_KEY}", model: "eleven_multilingual_v2" },
      },
    },
  },
  agents: {
    list: [
      {
        id: "reader",
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

Aby przypiąć personę per agent, ustaw `agents.list[].tts.persona` obok konfiguracji
dostawcy — nadpisuje ona globalne `messages.tts.persona` tylko dla tego agenta.

Kolejność priorytetów dla odpowiedzi automatycznych, `/tts audio`, `/tts status` i
narzędzia agenta `tts`:

1. `messages.tts`
2. aktywne `agents.list[].tts`
3. nadpisanie kanału, gdy kanał obsługuje `channels.<channel>.tts`
4. nadpisanie konta, gdy kanał przekazuje `channels.<channel>.accounts.<id>.tts`
5. lokalne preferencje `/tts` dla tego hosta
6. dyrektywy inline `[[tts:...]]`, gdy włączone są [nadpisania sterowane przez model](#model-driven-directives)

Nadpisania kanału i konta używają tego samego kształtu co `messages.tts` i
są głęboko scalane z wcześniejszymi warstwami, więc współdzielone poświadczenia dostawcy mogą pozostać w
`messages.tts`, podczas gdy kanał lub konto bota zmienia tylko głos, model, personę
lub tryb auto:

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { apiKey: "${OPENAI_API_KEY}", model: "gpt-4o-mini-tts" },
      },
    },
  },
  channels: {
    feishu: {
      accounts: {
        english: {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## Persony

**Persona** to stabilna tożsamość głosowa, którą można deterministycznie stosować
u różnych dostawców. Może preferować jednego dostawcę, definiować niezależny od dostawcy zamiar promptu
i zawierać powiązania specyficzne dla dostawcy dla głosów, modeli, szablonów
promptów, seedów i ustawień głosu.

### Minimalna persona

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Narrator",
          provider: "elevenlabs",
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL", modelId: "eleven_multilingual_v2" },
          },
        },
      },
    },
  },
}
```

### Pełna persona (prompt niezależny od dostawcy)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Suchy, ciepły brytyjski narrator w stylu lokaja.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "Genialny brytyjski lokaj. Suchy, dowcipny, ciepły, czarujący, ekspresyjny emocjonalnie, nigdy generyczny.",
            scene: "Ciche nocne gabinetowe wnętrze. Narracja close-mic dla zaufanego operatora.",
            sampleContext: "Mówca odpowiada na prywatną prośbę techniczną z krótką pewnością i suchym ciepłem.",
            style: "Wyrafinowany, powściągliwy, lekko rozbawiony.",
            accent: "Brytyjski angielski.",
            pacing: "Mierzone tempo, z krótkimi dramatycznymi pauzami.",
            constraints: ["Nie odczytuj na głos wartości konfiguracji.", "Nie wyjaśniaj persony."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              voiceName: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", voice: "cedar" },
            elevenlabs: {
              voiceId: "voice_id",
              modelId: "eleven_multilingual_v2",
              seed: 42,
              voiceSettings: {
                stability: 0.65,
                similarityBoost: 0.8,
                style: 0.25,
                useSpeakerBoost: true,
                speed: 0.95,
              },
            },
          },
        },
      },
    },
  },
}
```

### Rozwiązywanie persony

Aktywna persona jest wybierana deterministycznie:

1. lokalna preferencja `/tts persona <id>`, jeśli jest ustawiona.
2. `messages.tts.persona`, jeśli jest ustawione.
3. Brak persony.

Wybór dostawcy działa według zasady najpierw jawne ustawienia:

1. Bezpośrednie nadpisania (CLI, gateway, Talk, dozwolone dyrektywy TTS).
2. lokalna preferencja `/tts provider <id>`.
3. `provider` aktywnej persony.
4. `messages.tts.provider`.
5. Automatyczny wybór z rejestru.

Dla każdej próby dostawcy OpenClaw scala konfiguracje w tej kolejności:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Zaufane nadpisania żądania
4. Dozwolone nadpisania TTS emitowane przez model

### Jak dostawcy używają promptów persony

Pola promptu persony (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) są **niezależne od dostawcy**. Każdy dostawca sam decyduje, jak
ich użyć:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Opakowuje pola promptu persony w strukturę promptu Gemini TTS **tylko wtedy**, gdy
    efektywna konfiguracja dostawcy Google ustawia `promptTemplate: "audio-profile-v1"`
    lub `personaPrompt`. Starsze pola `audioProfile` i `speakerName` są
    nadal dodawane na początku jako tekst promptu specyficzny dla Google. Inline tagi audio, takie jak
    `[whispers]` lub `[laughs]`, wewnątrz bloku `[[tts:text]]` są zachowywane
    wewnątrz transkryptu Gemini; OpenClaw nie generuje tych tagów.
  </Accordion>
  <Accordion title="OpenAI">
    Mapuje pola promptu persony do pola żądania `instructions` **tylko wtedy**, gdy
    nie skonfigurowano jawnego `instructions` dla OpenAI. Jawne `instructions`
    zawsze ma pierwszeństwo.
  </Accordion>
  <Accordion title="Inni dostawcy">
    Używają tylko powiązań persony specyficznych dla dostawcy w
    `personas.<id>.providers.<provider>`. Pola promptu persony są ignorowane,
    chyba że dostawca implementuje własne mapowanie promptu persony.
  </Accordion>
</AccordionGroup>

### Polityka awaryjna

`fallbackPolicy` kontroluje zachowanie, gdy persona **nie ma powiązania** dla
próbowanego dostawcy:

| Polityka            | Zachowanie                                                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona`  | **Domyślnie.** Pola promptu niezależne od dostawcy pozostają dostępne; dostawca może ich użyć lub je zignorować.                              |
| `provider-defaults` | Persona jest pomijana podczas przygotowania promptu dla tej próby; dostawca używa swoich neutralnych ustawień domyślnych, a fallback do innych dostawców trwa dalej. |
| `fail`              | Pomiń próbę dla tego dostawcy z `reasonCode: "not_configured"` i `personaBinding: "missing"`. Dostawcy awaryjni nadal są próbowani.          |

Całe żądanie TTS kończy się niepowodzeniem tylko wtedy, gdy **każda** próba dostawcy zostanie pominięta
lub zakończy się błędem.

## Dyrektywy sterowane przez model

Domyślnie asystent **może** emitować dyrektywy `[[tts:...]]`, aby nadpisać
głos, model lub prędkość dla pojedynczej odpowiedzi, plus opcjonalny
blok `[[tts:text]]...[[/tts:text]]` dla ekspresyjnych wskazówek, które powinny pojawić się
tylko w audio:

```text
Proszę bardzo.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](śmieje się) Przeczytaj piosenkę jeszcze raz.[[/tts:text]]
```

Gdy `messages.tts.auto` ma wartość `"tagged"`, **dyrektywy są wymagane**, aby wywołać
audio. Strumieniowe dostarczanie bloków usuwa dyrektywy z widocznego tekstu, zanim
kanał je zobaczy, nawet jeśli są podzielone między sąsiednie bloki.

`provider=...` jest ignorowane, chyba że ustawiono `modelOverrides.allowProvider: true`. Gdy
odpowiedź deklaruje `provider=...`, pozostałe klucze w tej dyrektywie są parsowane
tylko przez tego dostawcę; nieobsługiwane klucze są usuwane i zgłaszane jako ostrzeżenia
dyrektywy TTS.

**Dostępne klucze dyrektyw:**

- `provider` (identyfikator zarejestrowanego dostawcy; wymaga `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (głośność MiniMax, 0–10)
- `pitch` (liczba całkowita wysokości tonu MiniMax, od −12 do 12; wartości ułamkowe są obcinane)
- `emotion` (tag emocji Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Całkowicie wyłącz nadpisania sterowane przez model:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Zezwalaj na przełączanie dostawcy, pozostawiając konfigurowalne inne ustawienia:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Polecenia z ukośnikiem

Jedno polecenie `/tts`. Na Discord OpenClaw rejestruje również `/voice`, ponieważ
`/tts` jest wbudowanym poleceniem Discord — tekstowe `/tts ...` nadal działa.

```text
/tts off | on | status
/tts chat on | off | default
/tts latest
/tts provider <id>
/tts persona <id> | off
/tts limit <chars>
/tts summary off
/tts audio <text>
```

<Note>
Polecenia wymagają autoryzowanego nadawcy (obowiązują zasady allowlist/owner) oraz
muszą być włączone `commands.text` lub rejestracja poleceń natywnych.
</Note>

Uwagi o zachowaniu:

- `/tts on` zapisuje lokalną preferencję TTS jako `always`; `/tts off` zapisuje ją jako `off`.
- `/tts chat on|off|default` zapisuje auto-TTS override o zakresie sesji dla bieżącego czatu.
- `/tts persona <id>` zapisuje lokalną preferencję persony; `/tts persona off` ją czyści.
- `/tts latest` odczytuje najnowszą odpowiedź asystenta z bieżącej transkrypcji sesji i wysyła ją jednorazowo jako audio. Zapisuje tylko hash tej odpowiedzi w wpisie sesji, aby tłumić duplikaty wysyłek głosowych.
- `/tts audio` generuje jednorazową odpowiedź audio (**nie** włącza TTS).
- `limit` i `summary` są przechowywane w **lokalnych preferencjach**, a nie w głównej konfiguracji.
- `/tts status` zawiera diagnostykę fallback dla ostatniej próby — `Fallback: <primary> -> <used>`, `Attempts: ...` oraz szczegóły per próba (`provider:outcome(reasonCode) latency`).
- `/status` pokazuje aktywny tryb TTS oraz skonfigurowanego dostawcę, model, głos i oczyszczone metadane niestandardowego punktu końcowego, gdy TTS jest włączone.

## Preferencje per użytkownik

Polecenia z ukośnikiem zapisują lokalne nadpisania do `prefsPath`. Wartość domyślna to
`~/.openclaw/settings/tts.json`; nadpisz ją przez zmienną środowiskową `OPENCLAW_TTS_PREFS`
lub `messages.tts.prefsPath`.

| Zapisane pole | Efekt                                      |
| ------------- | ------------------------------------------ |
| `auto`        | Lokalny override auto-TTS (`always`, `off`, …) |
| `provider`    | Lokalny override podstawowego dostawcy     |
| `persona`     | Lokalny override persony                   |
| `maxLength`   | Próg podsumowania (domyślnie `1500` znaków) |
| `summarize`   | Przełącznik podsumowania (domyślnie `true`) |

Nadpisują one efektywną konfigurację z `messages.tts` plus aktywny
blok `agents.list[].tts` dla tego hosta.

## Formaty wyjściowe (stałe)

Dostarczanie głosu TTS zależy od możliwości kanału. Plugin kanałów ogłaszają,
czy TTS w stylu wiadomości głosowej powinno prosić dostawców o natywny cel `voice-note`, czy
zachować zwykłą syntezę `audio-file` i tylko oznaczyć zgodne wyjście do
dostarczenia głosowego.

- **Kanały obsługujące notatki głosowe**: odpowiedzi w formie notatek głosowych preferują Opus (`opus_48000_64` z ElevenLabs, `opus` z OpenAI).
  - 48 kHz / 64 kb/s to dobry kompromis dla wiadomości głosowych.
- **Feishu / WhatsApp**: gdy odpowiedź w formie notatki głosowej zostanie wygenerowana jako MP3/WebM/WAV/M4A
  lub inny prawdopodobny plik audio, Plugin kanału transkoduje ją do 48 kHz
  Ogg/Opus za pomocą `ffmpeg` przed wysłaniem natywnej wiadomości głosowej. WhatsApp wysyła
  wynik przez ładunek Baileys `audio` z `ptt: true` oraz
  `audio/ogg; codecs=opus`. Jeśli konwersja się nie powiedzie, Feishu otrzyma oryginalny
  plik jako załącznik; wysyłka WhatsApp zakończy się błędem zamiast opublikowania niezgodnego
  ładunku PTT.
- **BlueBubbles**: utrzymuje syntezę dostawcy na zwykłej ścieżce audio-file; wyjścia MP3
  i CAF są oznaczane do dostarczenia jako memo głosowe iMessage.
- **Inne kanały**: MP3 (`mp3_44100_128` z ElevenLabs, `mp3` z OpenAI).
  - 44,1 kHz / 128 kb/s to domyślny balans dla wyrazistości mowy.
- **MiniMax**: MP3 (model `speech-2.8-hd`, częstotliwość próbkowania 32 kHz) dla zwykłych załączników audio. Dla celów notatek głosowych ogłaszanych przez kanał OpenClaw transkoduje MP3 z MiniMax do 48 kHz Opus przy użyciu `ffmpeg` przed dostarczeniem, gdy kanał ogłasza obsługę transkodowania.
- **Xiaomi MiMo**: domyślnie MP3 lub WAV, jeśli skonfigurowano. Dla celów notatek głosowych ogłaszanych przez kanał OpenClaw transkoduje wyjście Xiaomi do 48 kHz Opus przy użyciu `ffmpeg` przed dostarczeniem, gdy kanał ogłasza obsługę transkodowania.
- **Local CLI**: używa skonfigurowanego `outputFormat`. Cele notatek głosowych są
  konwertowane do Ogg/Opus, a wyjście telefoniczne jest konwertowane do surowego 16 kHz mono PCM
  przy użyciu `ffmpeg`.
- **Google Gemini**: TTS Gemini API zwraca surowy 24 kHz PCM. OpenClaw opakowuje go jako WAV dla załączników audio, transkoduje do 48 kHz Opus dla celów notatek głosowych i zwraca PCM bezpośrednio dla Talk/telefonii.
- **Gradium**: WAV dla załączników audio, Opus dla celów notatek głosowych oraz `ulaw_8000` przy 8 kHz dla telefonii.
- **Inworld**: MP3 dla zwykłych załączników audio, natywne `OGG_OPUS` dla celów notatek głosowych oraz surowe `PCM` przy 22050 Hz dla Talk/telefonii.
- **xAI**: domyślnie MP3; `responseFormat` może mieć wartość `mp3`, `wav`, `pcm`, `mulaw` lub `alaw`. OpenClaw używa wsadowego punktu końcowego REST TTS xAI i zwraca kompletny załącznik audio; strumieniowy Webhook TTS xAI nie jest używany na tej ścieżce dostawcy. Natywny format notatek głosowych Opus nie jest obsługiwany na tej ścieżce.
- **Microsoft**: używa `microsoft.outputFormat` (domyślnie `audio-24khz-48kbitrate-mono-mp3`).
  - Dołączony transport akceptuje `outputFormat`, ale nie wszystkie formaty są dostępne w usłudze.
  - Wartości formatu wyjściowego są zgodne z formatami wyjściowymi Microsoft Speech (w tym Ogg/WebM Opus).
  - Telegram `sendVoice` akceptuje OGG/MP3/M4A; użyj OpenAI/ElevenLabs, jeśli potrzebujesz
    gwarantowanych wiadomości głosowych Opus.
  - Jeśli skonfigurowany format wyjściowy Microsoft zakończy się błędem, OpenClaw ponowi próbę z MP3.

Formaty wyjściowe OpenAI/ElevenLabs są stałe per kanał (zobacz wyżej).

## Zachowanie auto-TTS

Gdy `messages.tts.auto` jest włączone, OpenClaw:

- Pomija TTS, jeśli odpowiedź zawiera już media lub dyrektywę `MEDIA:`.
- Pomija bardzo krótkie odpowiedzi (poniżej 10 znaków).
- Podsumowuje długie odpowiedzi, gdy podsumowania są włączone, używając
  `summaryModel` (lub `agents.defaults.model.primary`).
- Dołącza wygenerowane audio do odpowiedzi.
- W `mode: "final"` nadal wysyła TTS tylko audio dla strumieniowanych odpowiedzi końcowych
  po zakończeniu strumienia tekstu; wygenerowane media przechodzą przez tę samą
  normalizację mediów kanału co zwykłe załączniki odpowiedzi.

Jeśli odpowiedź przekracza `maxLength`, a podsumowanie jest wyłączone (lub brak klucza API dla
modelu podsumowania), audio jest pomijane i wysyłana jest zwykła odpowiedź tekstowa.

```text
Odpowiedź -> TTS włączone?
  nie  -> wyślij tekst
  tak  -> zawiera media / MEDIA: / jest krótka?
          tak -> wyślij tekst
          nie -> długość > limit?
                   nie -> TTS -> dołącz audio
                   tak -> podsumowanie włączone?
                            nie -> wyślij tekst
                            tak -> podsumuj -> TTS -> dołącz audio
```

## Formaty wyjściowe per kanał

| Cel                                   | Format                                                                                                                                    |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | Odpowiedzi jako notatki głosowe preferują **Opus** (`opus_48000_64` z ElevenLabs, `opus` z OpenAI). 48 kHz / 64 kb/s równoważy wyrazistość i rozmiar. |
| Inne kanały                           | **MP3** (`mp3_44100_128` z ElevenLabs, `mp3` z OpenAI). 44,1 kHz / 128 kb/s to domyślna wartość dla mowy.                               |
| Talk / telefonia                      | Natywny dla dostawcy **PCM** (Inworld 22050 Hz, Google 24 kHz) lub `ulaw_8000` z Gradium dla telefonii.                                 |

Uwagi per dostawca:

- **Feishu / WhatsApp transkodowanie:** Gdy odpowiedź jako notatka głosowa trafia jako MP3/WebM/WAV/M4A, Plugin kanału transkoduje ją do 48 kHz Ogg/Opus przy użyciu `ffmpeg`. WhatsApp wysyła przez Baileys z `ptt: true` i `audio/ogg; codecs=opus`. Jeśli konwersja się nie powiedzie: Feishu awaryjnie dołącza oryginalny plik; wysyłka WhatsApp kończy się błędem zamiast publikowania niezgodnego ładunku PTT.
- **MiniMax / Xiaomi MiMo:** Domyślnie MP3 (32 kHz dla MiniMax `speech-2.8-hd`); transkodowane do 48 kHz Opus dla celów notatek głosowych przez `ffmpeg`.
- **Local CLI:** Używa skonfigurowanego `outputFormat`. Cele notatek głosowych są konwertowane do Ogg/Opus, a wyjście telefoniczne do surowego 16 kHz mono PCM.
- **Google Gemini:** Zwraca surowy 24 kHz PCM. OpenClaw opakowuje go jako WAV dla załączników, transkoduje do 48 kHz Opus dla celów notatek głosowych i zwraca PCM bezpośrednio dla Talk/telefonii.
- **Inworld:** Załączniki MP3, natywne notatki głosowe `OGG_OPUS`, surowe `PCM` 22050 Hz dla Talk/telefonii.
- **xAI:** Domyślnie MP3; `responseFormat` może mieć wartość `mp3|wav|pcm|mulaw|alaw`. Używa wsadowego punktu końcowego REST xAI — strumieniowy Webhook TTS **nie** jest używany. Natywny format notatek głosowych Opus **nie** jest obsługiwany.
- **Microsoft:** Używa `microsoft.outputFormat` (domyślnie `audio-24khz-48kbitrate-mono-mp3`). Telegram `sendVoice` akceptuje OGG/MP3/M4A; użyj OpenAI/ElevenLabs, jeśli potrzebujesz gwarantowanych wiadomości głosowych Opus. Jeśli skonfigurowany format Microsoft zakończy się błędem, OpenClaw ponowi próbę z MP3.

Formaty wyjściowe OpenAI i ElevenLabs są stałe per kanał, jak wymieniono powyżej.

## Dokumentacja pól

<AccordionGroup>
  <Accordion title="Najwyższego poziomu messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Tryb auto-TTS. `inbound` wysyła audio tylko po przychodzącej wiadomości głosowej; `tagged` wysyła audio tylko wtedy, gdy odpowiedź zawiera dyrektywy `[[tts:...]]` lub blok `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Starszy przełącznik. `openclaw doctor --fix` migruje to do `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` obejmuje odpowiedzi narzędzi/bloków oprócz odpowiedzi końcowych.
    </ParamField>
    <ParamField path="provider" type="string">
      Identyfikator dostawcy mowy. Gdy nie jest ustawiony, OpenClaw używa pierwszego skonfigurowanego dostawcy zgodnie z kolejnością automatycznego wyboru w rejestrze. Starsze `provider: "edge"` jest przepisywane na `"microsoft"` przez `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      Aktywny identyfikator persony z `personas`. Normalizowany do małych liter.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Stabilna tożsamość głosowa. Pola: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Zobacz [Persony](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Tani model do auto-summary; domyślnie `agents.defaults.model.primary`. Akceptuje `provider/model` lub skonfigurowany alias modelu.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Zezwala modelowi na emitowanie dyrektyw TTS. `enabled` domyślnie ma wartość `true`; `allowProvider` domyślnie ma wartość `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Ustawienia należące do dostawcy kluczowane identyfikatorem dostawcy mowy. Starsze bezpośrednie bloki (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) są przepisywane przez `openclaw doctor --fix`; zapisuj tylko `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      Twardy limit znaków wejściowych dla TTS. `/tts audio` kończy się błędem po jego przekroczeniu.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      Limit czasu żądania w milisekundach.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Nadpisuje ścieżkę lokalnego JSON preferencji (dostawca/limit/podsumowanie). Domyślnie `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Zmienne środowiskowe: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` lub `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Region Azure Speech (np. `eastus`). Zmienne środowiskowe: `AZURE_SPEECH_REGION` lub `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Opcjonalne nadpisanie punktu końcowego Azure Speech (alias `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">Azure voice ShortName. Domyślnie `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">Kod języka SSML. Domyślnie `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` dla standardowego audio. Domyślnie `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` dla wyjścia notatek głosowych. Domyślnie `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Awaryjnie używa `ELEVENLABS_API_KEY` lub `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Identyfikator modelu (np. `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">Identyfikator głosu ElevenLabs.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (każde `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = normalnie).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Tryb normalizacji tekstu.</ParamField>
    <ParamField path="languageCode" type="string">2-literowy ISO 639-1 (np. `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Liczba całkowita `0..4294967295` dla deterministyczności best-effort.</ParamField>
    <ParamField path="baseUrl" type="string">Nadpisuje bazowy URL API ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Awaryjnie używa `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Jeśli pominięto, TTS może ponownie użyć `models.providers.google.apiKey` przed fallbackiem do zmiennych środowiskowych.</ParamField>
    <ParamField path="model" type="string">Model Gemini TTS. Domyślnie `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">Nazwa wbudowanego głosu Gemini. Domyślnie `Kore`. Alias: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Prompt stylu w języku naturalnym dodawany przed wypowiadanym tekstem.</ParamField>
    <ParamField path="speakerName" type="string">Opcjonalna etykieta mówcy dodawana przed wypowiadanym tekstem, gdy prompt używa nazwanego mówcy.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Ustaw `audio-profile-v1`, aby opakować aktywne pola promptu persony w deterministyczną strukturę promptu Gemini TTS.</ParamField>
    <ParamField path="personaPrompt" type="string">Dodatkowy tekst promptu persony specyficzny dla Google, dodawany do Director's Notes szablonu.</ParamField>
    <ParamField path="baseUrl" type="string">Akceptowane jest tylko `https://generativelanguage.googleapis.com`.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Zmienna środowiskowa: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Domyślnie `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">Domyślnie Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">Zmienna środowiskowa: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Domyślnie `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Domyślnie `inworld-tts-1.5-max`. Także: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">Domyślnie `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">Temperatura próbkowania `0..2`.</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">Lokalny plik wykonywalny lub ciąg polecenia dla CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">Argumenty polecenia. Obsługuje placeholdery `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Oczekiwany format wyjściowy CLI. Domyślnie `mp3` dla załączników audio.</ParamField>
    <ParamField path="timeoutMs" type="number">Limit czasu polecenia w milisekundach. Domyślnie `120000`.</ParamField>
    <ParamField path="cwd" type="string">Opcjonalny katalog roboczy polecenia.</ParamField>
    <ParamField path="env" type="Record<string, string>">Opcjonalne nadpisania środowiska dla polecenia.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (bez klucza API)">
    <ParamField path="enabled" type="boolean" default="true">Zezwala na użycie mowy Microsoft.</ParamField>
    <ParamField path="voice" type="string">Nazwa neural voice Microsoft (np. `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">Kod języka (np. `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Format wyjściowy Microsoft. Domyślnie `audio-24khz-48kbitrate-mono-mp3`. Nie wszystkie formaty są obsługiwane przez dołączony transport oparty na Edge.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Ciągi procentowe (np. `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Zapisuje napisy JSON obok pliku audio.</ParamField>
    <ParamField path="proxy" type="string">URL proxy dla żądań mowy Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Nadpisanie limitu czasu żądania (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Starszy alias. Uruchom `openclaw doctor --fix`, aby przepisać zapisaną konfigurację do `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Awaryjnie używa `MINIMAX_API_KEY`. Uwierzytelnianie Token Plan przez `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` lub `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Domyślnie `https://api.minimax.io`. Zmienna środowiskowa: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Domyślnie `speech-2.8-hd`. Zmienna środowiskowa: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">Domyślnie `English_expressive_narrator`. Zmienna środowiskowa: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Domyślnie `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Domyślnie `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Liczba całkowita `-12..12`. Domyślnie `0`. Wartości ułamkowe są obcinane przed żądaniem.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Awaryjnie używa `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Identyfikator modelu OpenAI TTS (np. `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">Nazwa głosu (np. `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">Jawne pole OpenAI `instructions`. Gdy jest ustawione, pola promptu persony **nie** są automatycznie mapowane.</ParamField>
    <ParamField path="baseUrl" type="string">
      Nadpisuje punkt końcowy OpenAI TTS. Kolejność rozwiązywania: config → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Wartości inne niż domyślna są traktowane jako punkty końcowe TTS zgodne z OpenAI, więc niestandardowe nazwy modeli i głosów są akceptowane.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Zmienna środowiskowa: `OPENROUTER_API_KEY`. Może ponownie używać `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">Domyślnie `https://openrouter.ai/api/v1`. Starsze `https://openrouter.ai/v1` jest normalizowane.</ParamField>
    <ParamField path="model" type="string">Domyślnie `hexgrad/kokoro-82m`. Alias: `modelId`.</ParamField>
    <ParamField path="voice" type="string">Domyślnie `af_alloy`. Alias: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Domyślnie `mp3`.</ParamField>
    <ParamField path="speed" type="number">Nadpisanie prędkości natywnej dla dostawcy.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Zmienne środowiskowe: `VOLCENGINE_TTS_API_KEY` lub `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Domyślnie `seed-tts-1.0`. Zmienna środowiskowa: `VOLCENGINE_TTS_RESOURCE_ID`. Użyj `seed-tts-2.0`, gdy Twój projekt ma uprawnienie do TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Nagłówek app key. Domyślnie `aGjiRDfUWi`. Zmienna środowiskowa: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Nadpisuje punkt końcowy HTTP Seed Speech TTS. Zmienna środowiskowa: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">Typ głosu. Domyślnie `en_female_anna_mars_bigtts`. Zmienna środowiskowa: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">Współczynnik prędkości natywny dla dostawcy.</ParamField>
    <ParamField path="emotion" type="string">Tag emocji natywny dla dostawcy.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Starsze pola Volcengine Speech Console. Zmienne środowiskowe: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (domyślnie `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Zmienna środowiskowa: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Domyślnie `https://api.x.ai/v1`. Zmienna środowiskowa: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">Domyślnie `eve`. Głosy live: `ara`, `eve`, `leo`, `rex`, `sal`, `una`.</ParamField>
    <ParamField path="language" type="string">Kod języka BCP-47 lub `auto`. Domyślnie `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Domyślnie `mp3`.</ParamField>
    <ParamField path="speed" type="number">Nadpisanie prędkości natywnej dla dostawcy.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Zmienna środowiskowa: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Domyślnie `https://api.xiaomimimo.com/v1`. Zmienna środowiskowa: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Domyślnie `mimo-v2.5-tts`. Zmienna środowiskowa: `XIAOMI_TTS_MODEL`. Obsługuje także `mimo-v2-tts`.</ParamField>
    <ParamField path="voice" type="string">Domyślnie `mimo_default`. Zmienna środowiskowa: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Domyślnie `mp3`. Zmienna środowiskowa: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Opcjonalna instrukcja stylu w języku naturalnym wysyłana jako wiadomość użytkownika; nie jest wypowiadana.</ParamField>
  </Accordion>
</AccordionGroup>

## Narzędzie agenta

Narzędzie `tts` konwertuje tekst na mowę i zwraca załącznik audio do
dostarczenia odpowiedzi. W Feishu, Matrix, Telegram i WhatsApp audio jest
dostarczane jako wiadomość głosowa zamiast załącznika plikowego. Feishu i
WhatsApp mogą na tej ścieżce transkodować wyjście TTS niebędące Opus, gdy `ffmpeg` jest
dostępne.

WhatsApp wysyła audio przez Baileys jako notatkę głosową PTT (`audio` z
`ptt: true`) i wysyła widoczny tekst **oddzielnie** od audio PTT, ponieważ
klienty nie renderują konsekwentnie podpisów przy notatkach głosowych.

Narzędzie akceptuje opcjonalne pola `channel` i `timeoutMs`; `timeoutMs` to
limit czasu żądania dostawcy per wywołanie w milisekundach.

## Gateway RPC

| Metoda            | Cel                                      |
| ----------------- | ---------------------------------------- |
| `tts.status`      | Odczyt bieżącego stanu TTS i ostatniej próby. |
| `tts.enable`      | Ustawia lokalną preferencję auto na `always`. |
| `tts.disable`     | Ustawia lokalną preferencję auto na `off`.    |
| `tts.convert`     | Jednorazowe tekst → audio.               |
| `tts.setProvider` | Ustawia lokalną preferencję dostawcy.    |
| `tts.setPersona`  | Ustawia lokalną preferencję persony.     |
| `tts.providers`   | Wyświetla listę skonfigurowanych dostawców i ich stan. |

## Linki do usług

- [Przewodnik OpenAI text-to-speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Dokumentacja OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Dostawca Azure Speech](/pl/providers/azure-speech)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Uwierzytelnianie ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/pl/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/pl/providers/volcengine#text-to-speech)
- [Synteza mowy Xiaomi MiMo](/pl/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formaty wyjściowe Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI text to speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Powiązane

- [Przegląd mediów](/pl/tools/media-overview)
- [Generowanie muzyki](/pl/tools/music-generation)
- [Generowanie wideo](/pl/tools/video-generation)
- [Polecenia z ukośnikiem](/pl/tools/slash-commands)
- [Plugin Voice Call](/pl/plugins/voice-call)
