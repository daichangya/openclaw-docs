---
read_when:
    - Chcesz wykonać wychodzące połączenie głosowe z OpenClaw.
    - Konfigurujesz lub rozwijasz plugin voice-call.
summary: 'Plugin Voice Call: połączenia wychodzące i przychodzące przez Twilio/Telnyx/Plivo (instalacja pluginu + konfiguracja + CLI)'
title: plugin Voice Call
x-i18n:
    generated_at: "2026-04-24T09:53:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6aed4e33ce090c86f43c71280f033e446f335c53d42456fdc93c9938250e9af6
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (plugin)

Połączenia głosowe dla OpenClaw przez plugin. Obsługuje powiadomienia wychodzące oraz
wieloturowe rozmowy z zasadami dla połączeń przychodzących.

Obecni dostawcy:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + transfer XML + mowa GetInput)
- `mock` (dev/bez sieci)

Szybki model działania:

- Zainstaluj plugin
- Uruchom ponownie Gateway
- Skonfiguruj w `plugins.entries.voice-call.config`
- Użyj `openclaw voicecall ...` lub narzędzia `voice_call`

## Gdzie to działa (lokalnie vs zdalnie)

Plugin Voice Call działa **wewnątrz procesu Gateway**.

Jeśli używasz zdalnego Gateway, zainstaluj/skonfiguruj plugin na **maszynie, na której działa Gateway**, a następnie uruchom ponownie Gateway, aby go załadować.

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
          provider: "twilio", // lub "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // lub TWILIO_FROM_NUMBER dla Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Publiczny klucz webhooka Telnyx z Telnyx Mission Control Portal
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

          // Zabezpieczenia Webhook (zalecane dla tuneli/proxy)
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
            provider: "openai", // opcjonalne; pierwszy zarejestrowany dostawca transkrypcji realtime, gdy nie ustawiono
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
            provider: "google", // opcjonalne; pierwszy zarejestrowany dostawca głosu realtime, gdy nie ustawiono
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

Uwagi:

- Twilio/Telnyx wymagają **publicznie dostępnego** adresu URL webhooka.
- Plivo wymaga **publicznie dostępnego** adresu URL webhooka.
- `mock` to lokalny dostawca deweloperski (bez wywołań sieciowych).
- Jeśli starsze konfiguracje nadal używają `provider: "log"`, `twilio.from` lub starszych kluczy OpenAI `streaming.*`, uruchom `openclaw doctor --fix`, aby je przepisać.
- Telnyx wymaga `telnyx.publicKey` (lub `TELNYX_PUBLIC_KEY`), chyba że `skipSignatureVerification` ma wartość true.
- `skipSignatureVerification` jest tylko do testów lokalnych.
- Jeśli używasz darmowego planu ngrok, ustaw `publicUrl` na dokładny adres URL ngrok; weryfikacja podpisu jest zawsze wymuszana.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` pozwala na webhooki Twilio z nieprawidłowymi podpisami **tylko** gdy `tunnel.provider="ngrok"` i `serve.bind` jest loopback (lokalny agent ngrok). Używaj wyłącznie do lokalnego dev.
- Adresy URL darmowego planu ngrok mogą się zmieniać lub dodawać zachowanie z interstitial; jeśli `publicUrl` się rozjedzie, podpisy Twilio będą nieprawidłowe. W środowisku produkcyjnym preferuj stabilną domenę lub Tailscale funnel.
- `realtime.enabled` uruchamia pełne rozmowy voice-to-voice; nie włączaj tego razem z `streaming.enabled`.
- Domyślne zabezpieczenia streamingu:
  - `streaming.preStartTimeoutMs` zamyka gniazda, które nigdy nie wysyłają prawidłowej ramki `start`.
- `streaming.maxPendingConnections` ogranicza łączną liczbę nieuwierzytelnionych gniazd oczekujących przed startem.
- `streaming.maxPendingConnectionsPerIp` ogranicza liczbę nieuwierzytelnionych gniazd oczekujących przed startem na źródłowy adres IP.
- `streaming.maxConnections` ogranicza łączną liczbę otwartych gniazd strumienia mediów (oczekujące + aktywne).
- Fallback środowiska wykonawczego nadal tymczasowo akceptuje te stare klucze voice-call, ale ścieżką przepisywania jest `openclaw doctor --fix`, a shim zgodności jest tymczasowy.

## Rozmowy głosowe realtime

`realtime` wybiera w pełni dupleksowego dostawcę głosu realtime dla dźwięku połączenia na żywo.
Jest to oddzielne od `streaming`, które tylko przekazuje dźwięk do dostawców
transkrypcji realtime.

Obecne zachowanie środowiska wykonawczego:

- `realtime.enabled` jest obsługiwane dla Twilio Media Streams.
- `realtime.enabled` nie można łączyć z `streaming.enabled`.
- `realtime.provider` jest opcjonalne. Jeśli nie jest ustawione, Voice Call używa pierwszego
  zarejestrowanego dostawcy głosu realtime.
- Dołączani dostawcy głosu realtime obejmują Google Gemini Live (`google`) oraz
  OpenAI (`openai`), rejestrowanych przez ich pluginy dostawców.
- Surowa konfiguracja należąca do dostawcy znajduje się w `realtime.providers.<providerId>`.
- Jeśli `realtime.provider` wskazuje niezarejestrowanego dostawcę lub w ogóle nie jest zarejestrowany
  żaden dostawca głosu realtime, Voice Call zapisuje ostrzeżenie w logu i pomija
  media realtime zamiast wywoływać błąd całego pluginu.

Domyślne ustawienia Google Gemini Live realtime:

- Klucz API: `realtime.providers.google.apiKey`, `GEMINI_API_KEY` lub
  `GOOGLE_GENERATIVE_AI_API_KEY`
- model: `gemini-2.5-flash-native-audio-preview-12-2025`
- voice: `Kore`

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
            instructions: "Mów krótko i pytaj przed użyciem narzędzi.",
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

Zobacz [dostawcę Google](/pl/providers/google) i [dostawcę OpenAI](/pl/providers/openai),
aby poznać opcje głosu realtime specyficzne dla dostawcy.

## Transkrypcja strumieniowa

`streaming` wybiera dostawcę transkrypcji realtime dla dźwięku połączenia na żywo.

Obecne zachowanie środowiska wykonawczego:

- `streaming.provider` jest opcjonalne. Jeśli nie jest ustawione, Voice Call używa pierwszego
  zarejestrowanego dostawcy transkrypcji realtime.
- Dołączani dostawcy transkrypcji realtime obejmują Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) i xAI
  (`xai`), rejestrowanych przez ich pluginy dostawców.
- Surowa konfiguracja należąca do dostawcy znajduje się w `streaming.providers.<providerId>`.
- Jeśli `streaming.provider` wskazuje niezarejestrowanego dostawcę lub w ogóle nie jest zarejestrowany
  żaden dostawca transkrypcji realtime, Voice Call zapisuje ostrzeżenie w logu i
  pomija strumieniowanie mediów zamiast wywoływać błąd całego pluginu.

Domyślne ustawienia transkrypcji strumieniowej OpenAI:

- Klucz API: `streaming.providers.openai.apiKey` lub `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Domyślne ustawienia transkrypcji strumieniowej xAI:

- Klucz API: `streaming.providers.xai.apiKey` lub `XAI_API_KEY`
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

## Oczyszczanie nieaktualnych połączeń

Użyj `staleCallReaperSeconds`, aby kończyć połączenia, które nigdy nie otrzymują terminalnego webhooka
(na przykład połączenia w trybie notify, które nigdy się nie kończą). Wartość domyślna to `0`
(wyłączone).

Zalecane zakresy:

- **Produkcja:** `120`–`300` sekund dla przepływów w stylu notify.
- Utrzymuj tę wartość **wyższą niż `maxDurationSeconds`**, aby zwykłe połączenia mogły
  się zakończyć. Dobrym punktem wyjścia jest `maxDurationSeconds + 30–60` sekund.

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

## Zabezpieczenia Webhook

Gdy przed Gateway znajduje się proxy lub tunel, plugin odtwarza
publiczny adres URL do weryfikacji podpisu. Te opcje kontrolują, którym
nagłówkom przekazywania można ufać.

`webhookSecurity.allowedHosts` tworzy listę dozwolonych hostów z nagłówków przekazywania.

`webhookSecurity.trustForwardingHeaders` ufa nagłówkom przekazywania bez listy dozwolonych hostów.

`webhookSecurity.trustedProxyIPs` ufa nagłówkom przekazywania tylko wtedy, gdy zdalny adres IP
żądania pasuje do listy.

Ochrona przed powtórzeniem webhooka jest włączona dla Twilio i Plivo. Powtórzone prawidłowe żądania webhooka
są potwierdzane, ale pomijane pod kątem skutków ubocznych.

Tury rozmów Twilio zawierają token dla każdej tury w callbackach `<Gather>`, więc
nieaktualne/powtórzone callbacki mowy nie mogą spełnić warunków nowszej oczekującej tury transkrypcji.

Nieuwierzytelnione żądania webhooka są odrzucane przed odczytem treści, gdy brakuje
wymaganych przez dostawcę nagłówków podpisu.

Webhook voice-call używa współdzielonego profilu treści przed uwierzytelnieniem (64 KB / 5 sekund)
plus limitu aktywnych żądań na IP przed weryfikacją podpisu.

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

Voice Call używa podstawowej konfiguracji `messages.tts` do
strumieniowania mowy w połączeniach. Możesz ją nadpisać w konfiguracji pluginu, używając
**tego samego kształtu** — jest ona głęboko scalana z `messages.tts`.

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

- Starsze klucze `tts.<provider>` wewnątrz konfiguracji pluginu (`openai`, `elevenlabs`, `microsoft`, `edge`) są automatycznie migrowane do `tts.providers.<provider>` podczas ładowania. W zatwierdzonej konfiguracji preferuj kształt `providers`.
- **Mowa Microsoft jest ignorowana dla połączeń głosowych** (dźwięk telefoniczny wymaga PCM; obecny transport Microsoft nie udostępnia telefonicznego wyjścia PCM).
- Podstawowy TTS jest używany, gdy włączone jest strumieniowanie mediów Twilio; w przeciwnym razie połączenia przechodzą na natywne głosy dostawcy.
- Jeśli strumień mediów Twilio jest już aktywny, Voice Call nie przechodzi awaryjnie do TwiML `<Say>`. Jeśli telefoniczny TTS jest niedostępny w tym stanie, żądanie odtwarzania kończy się niepowodzeniem zamiast mieszać dwie ścieżki odtwarzania.
- Gdy telefoniczny TTS przechodzi awaryjnie na drugiego dostawcę, Voice Call zapisuje ostrzeżenie z łańcuchem dostawców (`from`, `to`, `attempts`) na potrzeby debugowania.

### Więcej przykładów

Używaj tylko podstawowego TTS (bez nadpisania):

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

Nadpisz na ElevenLabs tylko dla połączeń (zachowaj podstawowe ustawienie gdzie indziej):

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

Nadpisz tylko model OpenAI dla połączeń (przykład głębokiego scalania):

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

Domyślna zasada połączeń przychodzących to `disabled`. Aby włączyć połączenia przychodzące, ustaw:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Cześć! Jak mogę pomóc?",
}
```

`inboundPolicy: "allowlist"` to ekran caller ID o niskim poziomie zaufania. Plugin
normalizuje wartość `From` dostarczoną przez dostawcę i porównuje ją z `allowFrom`.
Weryfikacja webhooka uwierzytelnia dostarczenie przez dostawcę i integralność ładunku,
ale nie potwierdza własności numeru dzwoniącego PSTN/VoIP. Traktuj `allowFrom` jako
filtrowanie caller ID, a nie silną tożsamość dzwoniącego.

Automatyczne odpowiedzi używają systemu agentów. Dostosuj je za pomocą:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Kontrakt wypowiedzi mówionej

W przypadku automatycznych odpowiedzi Voice Call dołącza ścisły kontrakt wypowiedzi mówionej do system prompt:

- `{"spoken":"..."}`

Następnie Voice Call defensywnie wyodrębnia tekst mowy:

- Ignoruje ładunki oznaczone jako treść rozumowania/błędu.
- Parsuje bezpośredni JSON, JSON w blokach kodu lub wbudowane klucze `"spoken"`.
- Przechodzi awaryjnie do zwykłego tekstu i usuwa prawdopodobne początkowe akapity planowania/meta.

Dzięki temu odtwarzana mowa pozostaje skupiona na tekście dla dzwoniącego i unika przeciekania tekstu planowania do dźwięku.

### Zachowanie przy uruchamianiu rozmowy

W przypadku wychodzących połączeń `conversation` obsługa pierwszej wiadomości jest powiązana ze stanem odtwarzania na żywo:

- Czyszczenie kolejki barging-in i automatyczna odpowiedź są wstrzymywane tylko wtedy, gdy początkowe powitanie jest aktywnie odtwarzane.
- Jeśli początkowe odtwarzanie zakończy się niepowodzeniem, połączenie wraca do stanu `listening`, a początkowa wiadomość pozostaje w kolejce do ponownej próby.
- Początkowe odtwarzanie dla streamingu Twilio uruchamia się po połączeniu strumienia bez dodatkowego opóźnienia.

### Grace przy rozłączeniu strumienia Twilio

Gdy strumień mediów Twilio zostaje rozłączony, Voice Call czeka `2000ms`, zanim automatycznie zakończy połączenie:

- Jeśli strumień połączy się ponownie w tym oknie, automatyczne zakończenie zostanie anulowane.
- Jeśli po upływie okresu grace żaden strumień nie zostanie ponownie zarejestrowany, połączenie zostanie zakończone, aby zapobiec zawieszonym aktywnym połączeniom.

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
openclaw voicecall latency                     # podsumowanie opóźnień tur z logów
openclaw voicecall expose --mode funnel
```

`latency` odczytuje `calls.jsonl` z domyślnej ścieżki przechowywania voice-call. Użyj
`--file <path>`, aby wskazać inny log, oraz `--last <n>`, aby ograniczyć analizę
do ostatnich N rekordów (domyślnie 200). Dane wyjściowe obejmują p50/p90/p99 dla
opóźnienia tur i czasów oczekiwania nasłuchu.

## Narzędzie agenta

Nazwa narzędzia: `voice_call`

Akcje:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

To repozytorium zawiera pasujący dokument Skills w `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## Powiązane

- [Text-to-speech](/pl/tools/tts)
- [Tryb rozmowy](/pl/nodes/talk)
- [Wybudzanie głosowe](/pl/nodes/voicewake)
