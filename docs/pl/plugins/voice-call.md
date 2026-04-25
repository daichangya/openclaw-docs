---
read_when:
    - Chcesz wykonać połączenie głosowe wychodzące z OpenClaw
    - Konfigurujesz lub rozwijasz Plugin voice-call
summary: 'Plugin Voice Call: połączenia wychodzące + przychodzące przez Twilio/Telnyx/Plivo (instalacja Plugin + konfiguracja + CLI)'
title: Plugin Voice Call
x-i18n:
    generated_at: "2026-04-25T13:55:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb396c6e346590b742c4d0f0e4f9653982da78fc40b9650760ed10d6fcd5710c
    source_path: plugins/voice-call.md
    workflow: 15
---

Połączenia głosowe dla OpenClaw przez Plugin. Obsługuje połączenia wychodzące i
wieloturowe rozmowy z politykami przychodzącymi.

Obecni dostawcy:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + transfer XML + GetInput speech)
- `mock` (dev/bez sieci)

Szybki model mentalny:

- Zainstaluj Plugin
- Uruchom ponownie Gateway
- Skonfiguruj w `plugins.entries.voice-call.config`
- Użyj `openclaw voicecall ...` albo narzędzia `voice_call`

## Gdzie to działa (lokalnie vs zdalnie)

Plugin Voice Call działa **wewnątrz procesu Gateway**.

Jeśli używasz zdalnego Gateway, zainstaluj/skonfiguruj Plugin na **maszynie, na której działa Gateway**, a następnie uruchom ponownie Gateway, aby go załadować.

## Instalacja

### Opcja A: instalacja z npm (zalecane)

```bash
openclaw plugins install @openclaw/voice-call
```

Następnie uruchom ponownie Gateway.

### Opcja B: instalacja z lokalnego folderu (dev, bez kopiowania)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Następnie uruchom ponownie Gateway.

## Konfiguracja

Ustaw konfigurację w `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // albo "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // albo TWILIO_FROM_NUMBER dla Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Klucz publiczny webhook Telnyx z portalu Telnyx Mission Control
            // (ciąg Base64; można też ustawić przez TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Serwer Webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Bezpieczeństwo Webhook (zalecane dla tuneli/proxy)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Publiczna ekspozycja (wybierz jedną)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // opcjonalne; pierwszy zarejestrowany dostawca realtime transcription, gdy nieustawione
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // opcjonalne, jeśli ustawiono OPENAI_API_KEY
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },

          realtime: {
            enabled: false,
            provider: "google", // opcjonalne; pierwszy zarejestrowany dostawca realtime voice, gdy nieustawione
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

Sprawdź konfigurację przed testowaniem z prawdziwym dostawcą:

```bash
openclaw voicecall setup
```

Domyślne dane wyjściowe są czytelne w logach czatu i sesjach terminala. Sprawdzają,
czy Plugin jest włączony, czy dostawca i poświadczenia są obecne, czy ekspozycja Webhook
jest skonfigurowana i czy aktywny jest tylko jeden tryb audio. Użyj
`openclaw voicecall setup --json` dla skryptów.

W przypadku Twilio, Telnyx i Plivo setup musi rozwiązać się do publicznego adresu URL Webhook. Jeśli
skonfigurowany `publicUrl`, adres URL tunelu, adres URL Tailscale albo fallback serve rozwiązuje się do
loopback albo prywatnej przestrzeni sieciowej, setup kończy się błędem zamiast uruchamiać dostawcę,
który nie może odbierać rzeczywistych Webhook od operatora.

Aby wykonać smoke test bez niespodzianek, uruchom:

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"
```

Drugie polecenie nadal jest dry run. Dodaj `--yes`, aby wykonać krótkie połączenie
wychodzące notify:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

Uwagi:

- Twilio/Telnyx wymagają **publicznie osiągalnego** adresu URL Webhook.
- Plivo wymaga **publicznie osiągalnego** adresu URL Webhook.
- `mock` to lokalny dostawca deweloperski (bez wywołań sieciowych).
- Jeśli starsze konfiguracje nadal używają `provider: "log"`, `twilio.from` albo starszych kluczy `streaming.*` OpenAI, uruchom `openclaw doctor --fix`, aby je przepisać.
- Telnyx wymaga `telnyx.publicKey` (albo `TELNYX_PUBLIC_KEY`), chyba że `skipSignatureVerification` ma wartość true.
- `skipSignatureVerification` służy tylko do lokalnych testów.
- Jeśli używasz darmowego planu ngrok, ustaw `publicUrl` na dokładny adres URL ngrok; weryfikacja sygnatur jest zawsze wymuszana.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` dopuszcza Webhook Twilio z nieprawidłowymi sygnaturami **tylko** wtedy, gdy `tunnel.provider="ngrok"` i `serve.bind` to loopback (lokalny agent ngrok). Używaj tylko do lokalnego dev.
- Adresy URL darmowego planu ngrok mogą się zmieniać albo dodawać zachowanie pośrednie; jeśli `publicUrl` się rozjedzie, sygnatury Twilio będą niepoprawne. W produkcji preferuj stabilną domenę albo Tailscale funnel.
- `realtime.enabled` uruchamia pełne rozmowy voice-to-voice; nie włączaj go razem z `streaming.enabled`.
- Domyślne ustawienia bezpieczeństwa dla streaming:
  - `streaming.preStartTimeoutMs` zamyka gniazda, które nigdy nie wysyłają prawidłowej ramki `start`.
- `streaming.maxPendingConnections` ogranicza łączną liczbę nieuwierzytelnionych gniazd przed startem.
- `streaming.maxPendingConnectionsPerIp` ogranicza liczbę nieuwierzytelnionych gniazd przed startem dla jednego źródłowego IP.
- `streaming.maxConnections` ogranicza łączną liczbę otwartych gniazd strumieni mediów (oczekujące + aktywne).
- Fallback runtime nadal na razie akceptuje te stare klucze voice-call, ale ścieżką przepisywania jest `openclaw doctor --fix`, a shim zgodności jest tymczasowy.

## Rozmowy głosowe w czasie rzeczywistym

`realtime` wybiera pełnodupleksowego dostawcę realtime voice dla dźwięku połączeń na żywo.
Jest to oddzielne od `streaming`, które przekazuje dźwięk tylko do dostawców
realtime transcription.

Bieżące zachowanie runtime:

- `realtime.enabled` jest obsługiwane dla Twilio Media Streams.
- `realtime.enabled` nie może być łączone z `streaming.enabled`.
- `realtime.provider` jest opcjonalne. Gdy nie jest ustawione, Voice Call używa pierwszego
  zarejestrowanego dostawcy realtime voice.
- Dołączeni dostawcy realtime voice obejmują Google Gemini Live (`google`) i
  OpenAI (`openai`), zarejestrowane przez ich Plugin dostawców.
- Surowa konfiguracja należąca do dostawcy znajduje się w `realtime.providers.<providerId>`.
- Voice Call domyślnie udostępnia współdzielone narzędzie realtime `openclaw_agent_consult`.
  Model realtime może je wywołać, gdy dzwoniący potrzebuje głębszego
  reasoning, bieżących informacji albo zwykłych narzędzi OpenClaw.
- `realtime.toolPolicy` kontroluje uruchomienie consult:
  - `safe-read-only`: ujawnij narzędzie consult i ogranicz zwykłego agenta do
    `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` i
    `memory_get`.
  - `owner`: ujawnij narzędzie consult i pozwól zwykłemu agentowi używać normalnej polityki narzędzi agenta.
  - `none`: nie ujawniaj narzędzia consult. Niestandardowe `realtime.tools` są nadal
    przekazywane do dostawcy realtime.
- Klucze sesji consult ponownie używają istniejącej sesji voice, gdy jest dostępna, a potem
  wracają do numeru telefonu dzwoniącego/odbiorcy, tak aby kolejne wywołania consult zachowywały
  kontekst podczas połączenia.
- Jeśli `realtime.provider` wskazuje na niezarejestrowanego dostawcę albo żaden dostawca
  realtime voice nie jest w ogóle zarejestrowany, Voice Call zapisuje ostrzeżenie w logach i
  pomija media realtime zamiast wyłączać cały Plugin.

Domyślne ustawienia Google Gemini Live realtime:

- Klucz API: `realtime.providers.google.apiKey`, `GEMINI_API_KEY` albo
  `GOOGLE_GENERATIVE_AI_API_KEY`
- model: `gemini-2.5-flash-native-audio-preview-12-2025`
- głos: `Kore`

Przykład:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          allowFrom: ["+15550005678"],
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Speak briefly. Call openclaw_agent_consult before using deeper tools.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                apiKey: "${GEMINI_API_KEY}",
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

Użyj zamiast tego OpenAI:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          realtime: {
            enabled: true,
            provider: "openai",
            providers: {
              openai: {
                apiKey: "${OPENAI_API_KEY}",
              },
            },
          },
        },
      },
    },
  },
}
```

Zobacz [Google provider](/pl/providers/google) i [OpenAI provider](/pl/providers/openai),
aby poznać opcje realtime voice specyficzne dla dostawcy.

## Streaming transcription

`streaming` wybiera dostawcę realtime transcription dla dźwięku połączeń na żywo.

Bieżące zachowanie runtime:

- `streaming.provider` jest opcjonalne. Gdy nie jest ustawione, Voice Call używa pierwszego
  zarejestrowanego dostawcy realtime transcription.
- Dołączeni dostawcy realtime transcription obejmują Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) i xAI
  (`xai`), zarejestrowane przez ich Plugin dostawców.
- Surowa konfiguracja należąca do dostawcy znajduje się w `streaming.providers.<providerId>`.
- Jeśli `streaming.provider` wskazuje na niezarejestrowanego dostawcę albo żaden dostawca
  realtime transcription nie jest w ogóle zarejestrowany, Voice Call zapisuje ostrzeżenie w logach i
  pomija strumieniowanie mediów zamiast wyłączać cały Plugin.

Domyślne ustawienia OpenAI streaming transcription:

- Klucz API: `streaming.providers.openai.apiKey` albo `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Domyślne ustawienia xAI streaming transcription:

- Klucz API: `streaming.providers.xai.apiKey` albo `XAI_API_KEY`
- endpoint: `wss://api.x.ai/v1/stt`
- `encoding`: `mulaw`
- `sampleRate`: `8000`
- `endpointingMs`: `800`
- `interimResults`: `true`

Przykład:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "openai",
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // opcjonalne, jeśli ustawiono OPENAI_API_KEY
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
          },
        },
      },
    },
  },
}
```

Użyj zamiast tego xAI:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "xai",
            streamPath: "/voice/stream",
            providers: {
              xai: {
                apiKey: "${XAI_API_KEY}", // opcjonalne, jeśli ustawiono XAI_API_KEY
                endpointingMs: 800,
                language: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

Starsze klucze są nadal automatycznie migrowane przez `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Reaper nieaktualnych połączeń

Użyj `staleCallReaperSeconds`, aby kończyć połączenia, które nigdy nie otrzymują terminal Webhook
(na przykład połączenia w trybie notify, które nigdy się nie kończą). Wartość domyślna to `0`
(wyłączone).

Zalecane zakresy:

- **Produkcja:** `120`–`300` sekund dla przepływów w stylu notify.
- Utrzymuj tę wartość **wyższą niż `maxDurationSeconds`**, aby zwykłe połączenia mogły
  się zakończyć. Dobry punkt startowy to `maxDurationSeconds + 30–60` sekund.

Przykład:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Bezpieczeństwo Webhook

Gdy przed Gateway stoi proxy albo tunel, Plugin rekonstruuje
publiczny adres URL na potrzeby weryfikacji sygnatur. Te opcje kontrolują, którym
nagłówkom forwarded można ufać.

`webhookSecurity.allowedHosts` tworzy listę dozwolonych hostów z nagłówków forwarding.

`webhookSecurity.trustForwardingHeaders` ufa nagłówkom forwarded bez listy dozwolonych.

`webhookSecurity.trustedProxyIPs` ufa nagłówkom forwarded tylko wtedy, gdy adres IP
zdalnego żądania pasuje do listy.

Ochrona przed replay Webhook jest włączona dla Twilio i Plivo. Ponownie odtworzone prawidłowe żądania Webhook
są potwierdzane, ale ich skutki uboczne są pomijane.

Tury rozmowy Twilio zawierają token per turn w callbackach `<Gather>`, więc
nieaktualne/odtworzone callbacki mowy nie mogą zaspokoić nowszej oczekującej tury transkryptu.

Nieuwierzytelnione żądania Webhook są odrzucane przed odczytem body, gdy brakuje
wymaganych nagłówków sygnatur dostawcy.

Webhook voice-call używa współdzielonego profilu body pre-auth (64 KB / 5 sekund)
oraz limitu in-flight per IP przed weryfikacją sygnatur.

Przykład ze stabilnym publicznym hostem:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## TTS dla połączeń

Voice Call używa głównej konfiguracji `messages.tts` do
strumieniowania mowy w połączeniach. Możesz ją nadpisać w konfiguracji Plugin, używając
**tego samego kształtu** — jest głęboko scalana z `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

Uwagi:

- Starsze klucze `tts.<provider>` wewnątrz konfiguracji Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) są naprawiane przez `openclaw doctor --fix`; zapisana konfiguracja powinna używać `tts.providers.<provider>`.
- **Mowa Microsoft jest ignorowana dla połączeń głosowych** (dźwięk telefoniczny wymaga PCM; obecny transport Microsoft nie ujawnia wyjścia PCM telefonii).
- Główne TTS jest używane, gdy włączone jest strumieniowanie mediów Twilio; w przeciwnym razie połączenia wracają do natywnych głosów dostawcy.
- Jeśli strumień mediów Twilio jest już aktywny, Voice Call nie wraca do TwiML `<Say>`. Jeśli TTS telefonii jest niedostępne w tym stanie, żądanie odtwarzania kończy się błędem zamiast mieszać dwie ścieżki odtwarzania.
- Gdy TTS telefonii wraca do wtórnego dostawcy, Voice Call zapisuje ostrzeżenie z łańcuchem dostawców (`from`, `to`, `attempts`) do debugowania.
- Gdy barge-in Twilio albo teardown strumienia czyści oczekującą kolejkę TTS, zakolejkowane
  żądania odtwarzania rozliczają się zamiast zawieszać dzwoniących, którzy czekają na
  zakończenie odtwarzania.

### Więcej przykładów

Używaj tylko głównego TTS (bez nadpisania):

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```

Nadpisz na ElevenLabs tylko dla połączeń (zachowaj główne ustawienie domyślne gdzie indziej):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```

Nadpisz tylko model OpenAI dla połączeń (przykład deep-merge):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```

## Połączenia przychodzące

Domyślna wartość inboundPolicy to `disabled`. Aby włączyć połączenia przychodzące, ustaw:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` to filtr caller-ID o niskim poziomie pewności. Plugin
normalizuje dostarczoną przez dostawcę wartość `From` i porównuje ją z `allowFrom`.
Weryfikacja Webhook uwierzytelnia dostarczenie przez dostawcę i integralność ładunku, ale
nie dowodzi własności numeru dzwoniącego PSTN/VoIP. Traktuj `allowFrom` jako
filtrowanie caller-ID, a nie silną tożsamość dzwoniącego.

Automatyczne odpowiedzi używają systemu agenta. Dostrajaj za pomocą:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Kontrakt odpowiedzi mówionej

Dla automatycznych odpowiedzi Voice Call dołącza ścisły kontrakt wyniku mówionego do promptu systemowego:

- `{"spoken":"..."}`

Voice Call następnie defensywnie wyodrębnia tekst mowy:

- Ignoruje ładunki oznaczone jako treść reasoning/error.
- Parsuje bezpośredni JSON, JSON w fenced block albo inline klucze `"spoken"`.
- Wraca do zwykłego tekstu i usuwa prawdopodobne akapity wstępne planowania/meta.

Dzięki temu odtwarzana mowa pozostaje skupiona na tekście przeznaczonym dla dzwoniącego i nie wycieka do audio tekst planowania.

### Zachowanie startowe rozmowy

Dla połączeń wychodzących `conversation` obsługa pierwszej wiadomości jest powiązana ze stanem odtwarzania na żywo:

- Czyszczenie kolejki przy barge-in i automatyczna odpowiedź są tłumione tylko wtedy, gdy początkowe powitanie jest aktywnie odtwarzane.
- Jeśli początkowe odtwarzanie się nie powiedzie, połączenie wraca do `listening`, a początkowa wiadomość pozostaje zakolejkowana do ponownej próby.
- Początkowe odtwarzanie dla Twilio streaming uruchamia się przy połączeniu strumienia bez dodatkowego opóźnienia.
- Barge-in przerywa aktywne odtwarzanie i czyści zakolejkowane, ale jeszcze nieodtwarzane wpisy TTS Twilio. Wyczyszczone wpisy rozliczają się jako pominięte, dzięki czemu dalsza logika odpowiedzi może kontynuować bez czekania na dźwięk, który nigdy się nie odtworzy.
- Rozmowy realtime voice używają własnej tury otwierającej strumienia realtime. Voice Call nie publikuje starszej aktualizacji TwiML `<Say>` dla tej początkowej wiadomości, dzięki czemu sesje wychodzące `<Connect><Stream>` pozostają podłączone.

### Grace przy rozłączeniu strumienia Twilio

Gdy strumień mediów Twilio się rozłącza, Voice Call czeka `2000ms`, zanim automatycznie zakończy połączenie:

- Jeśli strumień połączy się ponownie w tym oknie, auto-end jest anulowane.
- Jeśli po upływie grace period żaden strumień nie zostanie ponownie zarejestrowany, połączenie jest kończone, aby zapobiec utkniętym aktywnym połączeniom.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias dla call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # podsumuj opóźnienie tury z logów
openclaw voicecall expose --mode funnel
```

`latency` odczytuje `calls.jsonl` z domyślnej ścieżki storage voice-call. Użyj
`--file <path>`, aby wskazać inny log, i `--last <n>`, aby ograniczyć analizę
do ostatnich N rekordów (domyślnie 200). Dane wyjściowe obejmują p50/p90/p99 dla
opóźnienia tury i czasu oczekiwania listen.

## Narzędzie agenta

Nazwa narzędzia: `voice_call`

Akcje:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

To repo dostarcza pasujący dokument skill w `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## Powiązane

- [Text-to-speech](/pl/tools/tts)
- [Tryb Talk](/pl/nodes/talk)
- [Voice wake](/pl/nodes/voicewake)
