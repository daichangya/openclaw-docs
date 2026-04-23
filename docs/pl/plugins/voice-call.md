---
read_when:
    - Chcesz wykonać wychodzące połączenie głosowe z OpenClaw
    - Konfigurujesz lub rozwijasz plugin voice-call
summary: 'Plugin Voice Call: połączenia wychodzące i przychodzące przez Twilio/Telnyx/Plivo (instalacja pluginu + konfiguracja + CLI)'
title: Plugin Voice Call
x-i18n:
    generated_at: "2026-04-23T10:06:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fbfe1aba459dd4fbe1b5c100430ff8cbe8987d7d34b875d115afcaee6e56412
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (plugin)

Połączenia głosowe dla OpenClaw przez plugin. Obsługuje powiadomienia wychodzące i
wieloturowe rozmowy z politykami połączeń przychodzących.

Obecni dostawcy:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + transfer XML + GetInput speech)
- `mock` (deweloperski/bez sieci)

Szybki model mentalny:

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

### Opcja B: instalacja z lokalnego folderu (dewelopersko, bez kopiowania)

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
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Klucz publiczny webhooka Telnyx z Telnyx Mission Control Portal
            // (ciąg Base64; można też ustawić przez TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Serwer webhooków
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Bezpieczeństwo webhooków (zalecane dla tuneli/proxy)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Publiczne wystawienie (wybierz jedno)
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
        },
      },
    },
  },
}
```

Uwagi:

- Twilio/Telnyx wymagają **publicznie osiągalnego** adresu URL webhooka.
- Plivo wymaga **publicznie osiągalnego** adresu URL webhooka.
- `mock` to lokalny dostawca deweloperski (bez wywołań sieciowych).
- Jeśli starsze konfiguracje nadal używają `provider: "log"`, `twilio.from` lub starszych kluczy OpenAI `streaming.*`, uruchom `openclaw doctor --fix`, aby je przepisać.
- Telnyx wymaga `telnyx.publicKey` (lub `TELNYX_PUBLIC_KEY`), chyba że `skipSignatureVerification` ma wartość true.
- `skipSignatureVerification` jest tylko do testów lokalnych.
- Jeśli używasz darmowego planu ngrok, ustaw `publicUrl` na dokładny adres URL ngrok; weryfikacja podpisu jest zawsze wymuszana.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` zezwala na webhooki Twilio z nieprawidłowymi podpisami **tylko** gdy `tunnel.provider="ngrok"` i `serve.bind` to loopback (lokalny agent ngrok). Używaj tylko do lokalnego developmentu.
- Adresy URL darmowego planu ngrok mogą się zmieniać lub dodawać zachowanie z ekranem pośrednim; jeśli `publicUrl` się rozjedzie, podpisy Twilio przestaną działać. W środowisku produkcyjnym preferuj stabilną domenę lub Tailscale funnel.
- Domyślne ustawienia bezpieczeństwa streamingu:
  - `streaming.preStartTimeoutMs` zamyka gniazda, które nigdy nie wysyłają prawidłowej ramki `start`.
- `streaming.maxPendingConnections` ogranicza łączną liczbę nieuwierzytelnionych gniazd przed startem.
- `streaming.maxPendingConnectionsPerIp` ogranicza liczbę nieuwierzytelnionych gniazd przed startem na źródłowy adres IP.
- `streaming.maxConnections` ogranicza łączną liczbę otwartych gniazd strumienia multimediów (oczekujących + aktywnych).
- Fallback runtime nadal tymczasowo akceptuje te stare klucze `voice-call`, ale ścieżką przepisu jest `openclaw doctor --fix`, a shim zgodności jest tymczasowy.

## Streaming transcription

`streaming` wybiera dostawcę realtime transcription dla dźwięku połączeń na żywo.

Obecne zachowanie runtime:

- `streaming.provider` jest opcjonalne. Gdy nie jest ustawione, Voice Call używa pierwszego
  zarejestrowanego dostawcy realtime transcription.
- Dołączeni dostawcy realtime transcription obejmują Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) i xAI
  (`xai`), rejestrowanych przez ich pluginy dostawców.
- Surowa konfiguracja należąca do dostawcy znajduje się w `streaming.providers.<providerId>`.
- Jeśli `streaming.provider` wskazuje na niezarejestrowanego dostawcę albo żaden dostawca
  realtime transcription nie jest w ogóle zarejestrowany, Voice Call zapisuje ostrzeżenie w logach i
  pomija streaming multimediów zamiast kończyć działanie całego pluginu.

Domyślne ustawienia streaming transcription OpenAI:

- Klucz API: `streaming.providers.openai.apiKey` lub `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Domyślne ustawienia streaming transcription xAI:

- Klucz API: `streaming.providers.xai.apiKey` lub `XAI_API_KEY`
- punkt końcowy: `wss://api.x.ai/v1/stt`
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

## Stale call reaper

Użyj `staleCallReaperSeconds`, aby kończyć połączenia, które nigdy nie otrzymują końcowego webhooka
(na przykład połączenia w trybie notify, które nigdy się nie kończą). Domyślna wartość to `0`
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

## Bezpieczeństwo webhooków

Gdy przed Gateway znajduje się proxy lub tunel, plugin rekonstruuje
publiczny adres URL do weryfikacji podpisu. Te opcje kontrolują, którym nagłówkom forwarded można ufać.

`webhookSecurity.allowedHosts` tworzy allowlistę hostów z nagłówków forwarding.

`webhookSecurity.trustForwardingHeaders` ufa nagłówkom forwarding bez allowlisty.

`webhookSecurity.trustedProxyIPs` ufa nagłówkom forwarding tylko wtedy, gdy
zdalny adres IP żądania pasuje do listy.

Ochrona przed odtwarzaniem webhooków jest włączona dla Twilio i Plivo. Odtworzone prawidłowe
żądania webhooków są potwierdzane, ale pomijane przy skutkach ubocznych.

Tury rozmowy Twilio zawierają token dla każdej tury w callbackach `<Gather>`, więc
stare/odtworzone callbacki mowy nie mogą zaspokoić nowszej oczekującej tury transkryptu.

Nieuwierzytelnione żądania webhooków są odrzucane przed odczytem ciała, gdy brakuje
wymaganych nagłówków podpisu dla danego dostawcy.

Webhook `voice-call` używa współdzielonego profilu ciała przed uwierzytelnieniem (64 KB / 5 sekund)
oraz limitu jednoczesnych żądań na IP przed weryfikacją podpisu.

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
strumieniowego odtwarzania mowy w połączeniach. Możesz ją nadpisać w konfiguracji pluginu
przy użyciu **tego samego kształtu** — jest głęboko scalana z `messages.tts`.

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

- Starsze klucze `tts.<provider>` w konfiguracji pluginu (`openai`, `elevenlabs`, `microsoft`, `edge`) są automatycznie migrowane przy ładowaniu do `tts.providers.<provider>`. W zapisanej konfiguracji preferuj kształt `providers`.
- **Microsoft speech jest ignorowane dla połączeń głosowych** (dźwięk telefoniczny wymaga PCM; obecny transport Microsoft nie udostępnia wyjścia PCM dla telefonii).
- Podstawowe TTS jest używane, gdy włączony jest streaming multimediów Twilio; w przeciwnym razie połączenia wracają do natywnych głosów dostawcy.
- Jeśli strumień multimediów Twilio jest już aktywny, Voice Call nie wraca do TwiML `<Say>`. Jeśli telefoniczne TTS jest niedostępne w tym stanie, żądanie odtwarzania kończy się niepowodzeniem zamiast mieszać dwie ścieżki odtwarzania.
- Gdy telefoniczne TTS wraca do pomocniczego dostawcy, Voice Call zapisuje ostrzeżenie z łańcuchem dostawców (`from`, `to`, `attempts`) do debugowania.

### Więcej przykładów

Użyj tylko podstawowego TTS (bez nadpisania):

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

Nadpisz na ElevenLabs tylko dla połączeń (zachowaj podstawową wartość domyślną gdzie indziej):

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

Domyślną polityką przychodzącą jest `disabled`. Aby włączyć połączenia przychodzące, ustaw:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Cześć! Jak mogę pomóc?",
}
```

`inboundPolicy: "allowlist"` to filtr po Caller ID o niskim poziomie pewności. Plugin
normalizuje dostarczoną przez dostawcę wartość `From` i porównuje ją z `allowFrom`.
Weryfikacja webhooka uwierzytelnia dostarczenie przez dostawcę i integralność ładunku, ale
nie dowodzi własności numeru dzwoniącego PSTN/VoIP. Traktuj `allowFrom` jako
filtrowanie Caller ID, a nie silną tożsamość dzwoniącego.

Automatyczne odpowiedzi używają systemu agentów. Dostrajaj za pomocą:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Kontrakt danych wyjściowych mowy

Dla automatycznych odpowiedzi Voice Call dołącza do promptu systemowego ścisły kontrakt danych wyjściowych mowy:

- `{"spoken":"..."}`

Następnie Voice Call defensywnie wyodrębnia tekst mowy:

- Ignoruje ładunki oznaczone jako treść rozumowania/błędu.
- Parsuje bezpośredni JSON, JSON w blokach fenced albo klucze `"spoken"` inline.
- Wraca do zwykłego tekstu i usuwa prawdopodobne akapity wprowadzające planowanie/metadane.

Dzięki temu odtwarzana mowa pozostaje skupiona na tekście skierowanym do rozmówcy i unika wycieku tekstu planowania do audio.

### Zachowanie uruchamiania rozmowy

Dla połączeń wychodzących `conversation` obsługa pierwszej wiadomości jest powiązana ze stanem odtwarzania na żywo:

- Czyszczenie kolejki barge-in i automatyczna odpowiedź są tłumione tylko wtedy, gdy początkowe powitanie jest aktywnie odtwarzane.
- Jeśli początkowe odtwarzanie zakończy się niepowodzeniem, połączenie wraca do `listening`, a początkowa wiadomość pozostaje w kolejce do ponownej próby.
- Początkowe odtwarzanie dla streamingu Twilio rozpoczyna się po połączeniu strumienia bez dodatkowego opóźnienia.

### Grace period po rozłączeniu strumienia Twilio

Gdy strumień multimediów Twilio zostanie rozłączony, Voice Call czeka `2000ms`, zanim automatycznie zakończy połączenie:

- Jeśli strumień połączy się ponownie w tym oknie, automatyczne zakończenie zostaje anulowane.
- Jeśli po upływie okresu grace żaden strumień nie zostanie ponownie zarejestrowany, połączenie zostaje zakończone, aby zapobiec zawieszonym aktywnym połączeniom.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias dla call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # podsumowuje opóźnienie tur na podstawie logów
openclaw voicecall expose --mode funnel
```

`latency` odczytuje `calls.jsonl` z domyślnej ścieżki przechowywania voice-call. Użyj
`--file <path>`, aby wskazać inny log, oraz `--last <n>`, aby ograniczyć analizę
do ostatnich N rekordów (domyślnie 200). Dane wyjściowe obejmują p50/p90/p99 dla
opóźnienia tur i czasu oczekiwania nasłuchu.

## Narzędzie agenta

Nazwa narzędzia: `voice_call`

Działania:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `end_call` (callId)
- `get_status` (callId)

To repozytorium dostarcza pasujący dokument Skills w `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
