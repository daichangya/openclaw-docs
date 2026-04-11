---
read_when:
    - Konfigurowanie OpenClaw po raz pierwszy
    - Szukasz typowych wzorców konfiguracji
    - Przechodzenie do określonych sekcji konfiguracji
summary: 'Przegląd konfiguracji: typowe zadania, szybka konfiguracja i linki do pełnej dokumentacji referencyjnej'
title: Konfiguracja
x-i18n:
    generated_at: "2026-04-11T02:44:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: e874be80d11b9123cac6ce597ec02667fbc798f622a076f68535a1af1f0e399c
    source_path: gateway/configuration.md
    workflow: 15
---

# Konfiguracja

OpenClaw odczytuje opcjonalną konfigurację <Tooltip tip="JSON5 obsługuje komentarze i końcowe przecinki">**JSON5**</Tooltip> z pliku `~/.openclaw/openclaw.json`.

Jeśli plik nie istnieje, OpenClaw używa bezpiecznych ustawień domyślnych. Typowe powody dodania konfiguracji:

- Podłączenie kanałów i określenie, kto może wysyłać wiadomości do bota
- Ustawienie modeli, narzędzi, sandboxingu lub automatyzacji (cron, hooki)
- Dostosowanie sesji, multimediów, sieci lub interfejsu użytkownika

Zobacz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference), aby poznać wszystkie dostępne pola.

<Tip>
**Dopiero zaczynasz z konfiguracją?** Zacznij od `openclaw onboard`, aby przejść przez interaktywną konfigurację, albo zajrzyj do przewodnika [Przykłady konfiguracji](/pl/gateway/configuration-examples), aby zobaczyć kompletne konfiguracje do skopiowania i wklejenia.
</Tip>

## Minimalna konfiguracja

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Edytowanie konfiguracji

<Tabs>
  <Tab title="Interaktywny kreator">
    ```bash
    openclaw onboard       # pełny proces wdrożenia
    openclaw configure     # kreator konfiguracji
    ```
  </Tab>
  <Tab title="CLI (jednolinijkowce)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Otwórz [http://127.0.0.1:18789](http://127.0.0.1:18789) i użyj karty **Config**.
    Control UI renderuje formularz na podstawie aktywnego schematu konfiguracji, uwzględniając metadane dokumentacyjne pól `title` / `description`, a także schematy pluginów i kanałów, gdy są dostępne, z edytorem **Raw JSON** jako opcją awaryjną. W przypadku interfejsów umożliwiających szczegółowe przechodzenie i innych narzędzi gateway udostępnia także `config.schema.lookup`, aby pobrać jeden węzeł schematu ograniczony do ścieżki wraz z podsumowaniami bezpośrednich elementów podrzędnych.
  </Tab>
  <Tab title="Edycja bezpośrednia">
    Edytuj bezpośrednio plik `~/.openclaw/openclaw.json`. Gateway obserwuje ten plik i automatycznie stosuje zmiany (zobacz [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Ścisła walidacja

<Warning>
OpenClaw akceptuje tylko konfiguracje, które w pełni odpowiadają schematowi. Nieznane klucze, nieprawidłowe typy lub niepoprawne wartości powodują, że Gateway **odmawia uruchomienia**. Jedynym wyjątkiem na poziomie głównym jest `$schema` (string), dzięki czemu edytory mogą dołączać metadane JSON Schema.
</Warning>

Uwagi dotyczące narzędzi schematu:

- `openclaw config schema` wypisuje tę samą rodzinę JSON Schema, której używają Control UI i walidacja konfiguracji.
- Traktuj wynik tego schematu jako kanoniczny kontrakt w formacie czytelnym maszynowo dla pliku `openclaw.json`; ten przegląd i dokumentacja referencyjna konfiguracji go podsumowują.
- Wartości pól `title` i `description` są przenoszone do wyjścia schematu na potrzeby edytorów i narzędzi formularzy.
- Wpisy zagnieżdżonych obiektów, wieloznaczników (`*`) i elementów tablic (`[]`) dziedziczą te same metadane dokumentacyjne tam, gdzie istnieje pasująca dokumentacja pól.
- Gałęzie kompozycji `anyOf` / `oneOf` / `allOf` również dziedziczą te same metadane dokumentacyjne, dzięki czemu warianty unii/przecięcia zachowują tę samą pomoc dla pól.
- `config.schema.lookup` zwraca jedną znormalizowaną ścieżkę konfiguracji z płytkim węzłem schematu (`title`, `description`, `type`, `enum`, `const`, wspólne ograniczenia i podobne pola walidacji), dopasowanymi metadanymi wskazówek UI oraz podsumowaniami bezpośrednich elementów podrzędnych dla narzędzi szczegółowego przechodzenia.
- Schematy pluginów/kanałów w czasie działania są scalane, gdy gateway może załadować bieżący rejestr manifestów.
- `pnpm config:docs:check` wykrywa rozbieżności między artefaktami bazowymi konfiguracji używanymi w dokumentacji a bieżącą powierzchnią schematu.

Gdy walidacja się nie powiedzie:

- Gateway się nie uruchamia
- Działają tylko polecenia diagnostyczne (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Uruchom `openclaw doctor`, aby zobaczyć dokładne problemy
- Uruchom `openclaw doctor --fix` (lub `--yes`), aby zastosować poprawki

## Typowe zadania

<AccordionGroup>
  <Accordion title="Skonfiguruj kanał (WhatsApp, Telegram, Discord itp.)">
    Każdy kanał ma własną sekcję konfiguracji w `channels.<provider>`. Zobacz dedykowaną stronę kanału, aby poznać kroki konfiguracji:

    - [WhatsApp](/pl/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/pl/channels/telegram) — `channels.telegram`
    - [Discord](/pl/channels/discord) — `channels.discord`
    - [Feishu](/pl/channels/feishu) — `channels.feishu`
    - [Google Chat](/pl/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/pl/channels/msteams) — `channels.msteams`
    - [Slack](/pl/channels/slack) — `channels.slack`
    - [Signal](/pl/channels/signal) — `channels.signal`
    - [iMessage](/pl/channels/imessage) — `channels.imessage`
    - [Mattermost](/pl/channels/mattermost) — `channels.mattermost`

    Wszystkie kanały współdzielą ten sam wzorzec zasad dla wiadomości DM:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // tylko dla allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Wybierz i skonfiguruj modele">
    Ustaw model podstawowy i opcjonalne modele zapasowe:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` definiuje katalog modeli i działa jako lista dozwolonych dla `/model`.
    - Referencje modeli używają formatu `provider/model` (np. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` kontroluje skalowanie obrazów w transkryptach/narzędziach (domyślnie `1200`); niższe wartości zwykle zmniejszają zużycie tokenów vision przy zadaniach z dużą liczbą zrzutów ekranu.
    - Zobacz [Models CLI](/pl/concepts/models), aby przełączać modele na czacie, oraz [Przełączanie awaryjne modeli](/pl/concepts/model-failover), aby poznać rotację uwierzytelniania i zachowanie modeli zapasowych.
    - W przypadku niestandardowych/samodzielnie hostowanych providerów zobacz [Niestandardowi providerzy](/pl/gateway/configuration-reference#custom-providers-and-base-urls) w dokumentacji referencyjnej.

  </Accordion>

  <Accordion title="Kontroluj, kto może wysyłać wiadomości do bota">
    Dostęp do wiadomości DM jest kontrolowany osobno dla każdego kanału przez `dmPolicy`:

    - `"pairing"` (domyślnie): nieznani nadawcy otrzymują jednorazowy kod parowania do zatwierdzenia
    - `"allowlist"`: tylko nadawcy z `allowFrom` (lub sparowanego magazynu listy dozwolonych)
    - `"open"`: zezwalaj na wszystkie przychodzące wiadomości DM (wymaga `allowFrom: ["*"]`)
    - `"disabled"`: ignoruj wszystkie wiadomości DM

    W przypadku grup użyj `groupPolicy` + `groupAllowFrom` lub list dozwolonych specyficznych dla kanału.

    Zobacz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#dm-and-group-access), aby poznać szczegóły dla poszczególnych kanałów.

  </Accordion>

  <Accordion title="Skonfiguruj bramkowanie wzmianek na czacie grupowym">
    Domyślnie wiadomości grupowe **wymagają wzmianki**. Skonfiguruj wzorce dla każdego agenta:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Wzmianki w metadanych**: natywne wzmianki @ (WhatsApp tap-to-mention, Telegram @bot itp.)
    - **Wzorce tekstowe**: bezpieczne wzorce regex w `mentionPatterns`
    - Zobacz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#group-chat-mention-gating), aby poznać zastąpienia dla poszczególnych kanałów i tryb self-chat.

  </Accordion>

  <Accordion title="Ogranicz Skills dla agenta">
    Użyj `agents.defaults.skills` jako współdzielonej bazy, a następnie zastąp ustawienia konkretnych agentów za pomocą `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // dziedziczy github, weather
          { id: "docs", skills: ["docs-search"] }, // zastępuje ustawienia domyślne
          { id: "locked-down", skills: [] }, // brak Skills
        ],
      },
    }
    ```

    - Pomiń `agents.defaults.skills`, aby domyślnie nie ograniczać Skills.
    - Pomiń `agents.list[].skills`, aby dziedziczyć ustawienia domyślne.
    - Ustaw `agents.list[].skills: []`, aby nie używać żadnych Skills.
    - Zobacz [Skills](/pl/tools/skills), [Konfiguracja Skills](/pl/tools/skills-config) oraz
      [Dokumentację referencyjną konfiguracji](/pl/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Dostosuj monitorowanie kondycji kanałów gateway">
    Kontroluj, jak agresywnie gateway restartuje kanały, które wyglądają na nieaktywne:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - Ustaw `gateway.channelHealthCheckMinutes: 0`, aby globalnie wyłączyć restarty monitora kondycji.
    - `channelStaleEventThresholdMinutes` powinno być większe lub równe interwałowi sprawdzania.
    - Użyj `channels.<provider>.healthMonitor.enabled` lub `channels.<provider>.accounts.<id>.healthMonitor.enabled`, aby wyłączyć automatyczne restarty dla jednego kanału lub konta bez wyłączania monitora globalnego.
    - Zobacz [Kontrole kondycji](/pl/gateway/health), aby poznać operacyjne debugowanie, oraz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#gateway), aby zobaczyć wszystkie pola.

  </Accordion>

  <Accordion title="Skonfiguruj sesje i resetowanie">
    Sesje kontrolują ciągłość i izolację rozmów:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // zalecane dla wielu użytkowników
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (wspólna) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: globalne ustawienia domyślne routingu sesji powiązanych z wątkiem (Discord obsługuje `/focus`, `/unfocus`, `/agents`, `/session idle` i `/session max-age`).
    - Zobacz [Zarządzanie sesjami](/pl/concepts/session), aby poznać zakresy, powiązania tożsamości i zasady wysyłania.
    - Zobacz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#session), aby zobaczyć wszystkie pola.

  </Accordion>

  <Accordion title="Włącz sandboxing">
    Uruchamiaj sesje agentów w izolowanych kontenerach Docker:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    Najpierw zbuduj obraz: `scripts/sandbox-setup.sh`

    Zobacz [Sandboxing](/pl/gateway/sandboxing), aby przeczytać pełny przewodnik, oraz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#agentsdefaultssandbox), aby poznać wszystkie opcje.

  </Accordion>

  <Accordion title="Włącz push oparty na relay dla oficjalnych kompilacji iOS">
    Push oparty na relay konfiguruje się w `openclaw.json`.

    Ustaw to w konfiguracji gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Opcjonalne. Domyślnie: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    Odpowiednik w CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Co to robi:

    - Umożliwia gateway wysyłanie `push.test`, sygnałów wybudzania i wybudzeń przy ponownym połączeniu przez zewnętrzny relay.
    - Używa uprawnienia wysyłki ograniczonego do rejestracji, przekazanego dalej przez sparowaną aplikację iOS. Gateway nie potrzebuje tokena relay dla całego wdrożenia.
    - Wiąże każdą rejestrację opartą na relay z tożsamością gateway, z którą sparowano aplikację iOS, dzięki czemu inny gateway nie może ponownie użyć zapisanej rejestracji.
    - Pozostawia lokalne/ręczne kompilacje iOS przy bezpośrednim APNs. Wysyłki oparte na relay dotyczą tylko oficjalnie dystrybuowanych kompilacji, które zarejestrowały się przez relay.
    - Musi odpowiadać bazowemu URL relay osadzonemu w oficjalnej/wersji TestFlight kompilacji iOS, aby ruch rejestracji i wysyłki trafiał do tego samego wdrożenia relay.

    Przepływ end-to-end:

    1. Zainstaluj oficjalną/wersję TestFlight aplikacji iOS skompilowaną z tym samym bazowym URL relay.
    2. Skonfiguruj `gateway.push.apns.relay.baseUrl` w gateway.
    3. Sparuj aplikację iOS z gateway i pozwól połączyć się zarówno sesjom węzła, jak i operatora.
    4. Aplikacja iOS pobiera tożsamość gateway, rejestruje się w relay przy użyciu App Attest oraz potwierdzenia odbioru aplikacji, a następnie publikuje ładunek `push.apns.register` oparty na relay do sparowanego gateway.
    5. Gateway zapisuje uchwyt relay i uprawnienie wysyłki, a następnie używa ich do `push.test`, sygnałów wybudzania i wybudzeń przy ponownym połączeniu.

    Uwagi operacyjne:

    - Jeśli przełączysz aplikację iOS na inny gateway, połącz ponownie aplikację, aby mogła opublikować nową rejestrację relay powiązaną z tym gateway.
    - Jeśli wydasz nową kompilację iOS wskazującą inne wdrożenie relay, aplikacja odświeży zapisaną w pamięci podręcznej rejestrację relay zamiast ponownie używać starego źródła relay.

    Uwaga dotycząca zgodności:

    - `OPENCLAW_APNS_RELAY_BASE_URL` i `OPENCLAW_APNS_RELAY_TIMEOUT_MS` nadal działają jako tymczasowe nadpisania przez zmienne środowiskowe.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` pozostaje wyłącznie pętlą zwrotną dla środowiska programistycznego; nie utrwalaj adresów URL relay HTTP w konfiguracji.

    Zobacz [Aplikacja iOS](/pl/platforms/ios#relay-backed-push-for-official-builds), aby poznać przepływ end-to-end, oraz [Przepływ uwierzytelniania i zaufania](/pl/platforms/ios#authentication-and-trust-flow), aby zrozumieć model bezpieczeństwa relay.

  </Accordion>

  <Accordion title="Skonfiguruj heartbeat (okresowe meldowanie się)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: ciąg czasu trwania (`30m`, `2h`). Ustaw `0m`, aby wyłączyć.
    - `target`: `last` | `none` | `<channel-id>` (na przykład `discord`, `matrix`, `telegram` lub `whatsapp`)
    - `directPolicy`: `allow` (domyślnie) lub `block` dla celów heartbeat w stylu DM
    - Zobacz [Heartbeat](/pl/gateway/heartbeat), aby przeczytać pełny przewodnik.

  </Accordion>

  <Accordion title="Skonfiguruj zadania cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: usuwaj ukończone izolowane sesje uruchomień z `sessions.json` (domyślnie `24h`; ustaw `false`, aby wyłączyć).
    - `runLog`: przycinaj `cron/runs/<jobId>.jsonl` według rozmiaru i liczby zachowanych linii.
    - Zobacz [Zadania cron](/pl/automation/cron-jobs), aby poznać przegląd funkcji i przykłady CLI.

  </Accordion>

  <Accordion title="Skonfiguruj webhooki (hooki)">
    Włącz punkty końcowe webhooków HTTP w Gateway:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    Uwaga dotycząca bezpieczeństwa:
    - Traktuj całą zawartość ładunków hooków/webhooków jako niezaufane dane wejściowe.
    - Używaj dedykowanego `hooks.token`; nie używaj ponownie współdzielonego tokena Gateway.
    - Uwierzytelnianie hooków działa tylko przez nagłówki (`Authorization: Bearer ...` lub `x-openclaw-token`); tokeny w ciągu zapytania są odrzucane.
    - `hooks.path` nie może być `/`; trzymaj ruch przychodzący webhooków na dedykowanej podścieżce, takiej jak `/hooks`.
    - Pozostaw flagi obejścia niebezpiecznej zawartości wyłączone (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), chyba że prowadzisz ściśle ograniczone debugowanie.
    - Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw także `hooks.allowedSessionKeyPrefixes`, aby ograniczyć klucze sesji wybierane przez wywołującego.
    - W przypadku agentów sterowanych przez hooki preferuj mocne nowoczesne klasy modeli oraz ścisłe zasady dotyczące narzędzi (na przykład tylko wiadomości plus sandboxing, gdzie to możliwe).

    Zobacz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#hooks), aby poznać wszystkie opcje mapowania i integrację z Gmail.

  </Accordion>

  <Accordion title="Skonfiguruj routing wielu agentów">
    Uruchamiaj wielu izolowanych agentów z oddzielnymi obszarami roboczymi i sesjami:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    Zobacz [Multi-Agent](/pl/concepts/multi-agent) oraz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#multi-agent-routing), aby poznać reguły powiązań i profile dostępu dla poszczególnych agentów.

  </Accordion>

  <Accordion title="Podziel konfigurację na wiele plików ($include)">
    Użyj `$include`, aby uporządkować duże konfiguracje:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **Pojedynczy plik**: zastępuje obiekt zawierający
    - **Tablica plików**: scalana głęboko w kolejności (późniejsze wygrywają)
    - **Klucze równorzędne**: scalane po include’ach (nadpisują dołączone wartości)
    - **Zagnieżdżone include’y**: obsługiwane do 10 poziomów głębokości
    - **Ścieżki względne**: rozwiązywane względem pliku dołączającego
    - **Obsługa błędów**: czytelne błędy dla brakujących plików, błędów parsowania i cyklicznych include’ów

  </Accordion>
</AccordionGroup>

## Hot reload konfiguracji

Gateway obserwuje `~/.openclaw/openclaw.json` i automatycznie stosuje zmiany — dla większości ustawień nie jest wymagany ręczny restart.

### Tryby przeładowania

| Tryb                   | Zachowanie                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (domyślnie) | Natychmiast stosuje bezpieczne zmiany na gorąco. W przypadku krytycznych zmian automatycznie restartuje. |
| **`hot`**              | Stosuje na gorąco tylko bezpieczne zmiany. Gdy wymagany jest restart, zapisuje ostrzeżenie w logach — zajmujesz się tym ręcznie. |
| **`restart`**          | Restartuje Gateway przy każdej zmianie konfiguracji, bezpiecznej lub nie.              |
| **`off`**              | Wyłącza obserwowanie pliku. Zmiany zaczną obowiązywać przy następnym ręcznym restarcie. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Co stosuje się na gorąco, a co wymaga restartu

Większość pól stosuje się na gorąco bez przestoju. W trybie `hybrid` zmiany wymagające restartu są obsługiwane automatycznie.

| Kategoria           | Pola                                                                | Wymagany restart? |
| ------------------- | ------------------------------------------------------------------- | ----------------- |
| Kanały              | `channels.*`, `web` (WhatsApp) — wszystkie wbudowane i rozszerzeniowe kanały | Nie               |
| Agent i modele      | `agent`, `agents`, `models`, `routing`                              | Nie               |
| Automatyzacja       | `hooks`, `cron`, `agent.heartbeat`                                  | Nie               |
| Sesje i wiadomości  | `session`, `messages`                                               | Nie               |
| Narzędzia i multimedia | `tools`, `browser`, `skills`, `audio`, `talk`                    | Nie               |
| UI i inne           | `ui`, `logging`, `identity`, `bindings`                             | Nie               |
| Serwer gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)                | **Tak**           |
| Infrastruktura      | `discovery`, `canvasHost`, `plugins`                                | **Tak**           |

<Note>
`gateway.reload` i `gateway.remote` są wyjątkami — ich zmiana **nie** powoduje restartu.
</Note>

## RPC konfiguracji (aktualizacje programistyczne)

<Note>
Operacje zapisu RPC płaszczyzny sterowania (`config.apply`, `config.patch`, `update.run`) są ograniczane do **3 żądań na 60 sekund** dla każdego `deviceId+clientIp`. Po osiągnięciu limitu RPC zwraca `UNAVAILABLE` z `retryAfterMs`.
</Note>

Bezpieczny/domyślny przepływ:

- `config.schema.lookup`: sprawdź jedno poddrzewo konfiguracji ograniczone do ścieżki z płytkim węzłem schematu, dopasowanymi metadanymi wskazówek i podsumowaniami bezpośrednich elementów podrzędnych
- `config.get`: pobierz bieżący snapshot + hash
- `config.patch`: preferowana ścieżka częściowej aktualizacji
- `config.apply`: tylko pełne zastąpienie konfiguracji
- `update.run`: jawna samodzielna aktualizacja + restart

Jeśli nie zastępujesz całej konfiguracji, preferuj `config.schema.lookup`,
a następnie `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (pełne zastąpienie)">
    Waliduje + zapisuje pełną konfigurację i restartuje Gateway w jednym kroku.

    <Warning>
    `config.apply` zastępuje **całą konfigurację**. Użyj `config.patch` do częściowych aktualizacji albo `openclaw config set` dla pojedynczych kluczy.
    </Warning>

    Parametry:

    - `raw` (string) — ładunek JSON5 dla całej konfiguracji
    - `baseHash` (opcjonalnie) — hash konfiguracji z `config.get` (wymagany, gdy konfiguracja istnieje)
    - `sessionKey` (opcjonalnie) — klucz sesji dla sygnału wybudzenia po restarcie
    - `note` (opcjonalnie) — notatka dla znacznika restartu
    - `restartDelayMs` (opcjonalnie) — opóźnienie przed restartem (domyślnie 2000)

    Żądania restartu są łączone, gdy jedno jest już oczekujące/w toku, a między cyklami restartu obowiązuje 30-sekundowy czas odnowienia.

    ```bash
    openclaw gateway call config.get --params '{}'  # przechwyć payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (częściowa aktualizacja)">
    Scala częściową aktualizację z istniejącą konfiguracją (semantyka JSON merge patch):

    - Obiekty są scalane rekurencyjnie
    - `null` usuwa klucz
    - Tablice są zastępowane

    Parametry:

    - `raw` (string) — JSON5 zawierający tylko klucze do zmiany
    - `baseHash` (wymagany) — hash konfiguracji z `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — takie same jak w `config.apply`

    Zachowanie restartu odpowiada `config.apply`: oczekujące restarty są łączone, a między cyklami restartu obowiązuje 30-sekundowy czas odnowienia.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Zmienne środowiskowe

OpenClaw odczytuje zmienne środowiskowe z procesu nadrzędnego oraz z:

- `.env` z bieżącego katalogu roboczego (jeśli istnieje)
- `~/.openclaw/.env` (globalne ustawienie zapasowe)

Żaden z tych plików nie nadpisuje istniejących zmiennych środowiskowych. Możesz także ustawić w konfiguracji wbudowane zmienne środowiskowe:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Import zmiennych środowiskowych z powłoki (opcjonalne)">
  Jeśli ta funkcja jest włączona, a oczekiwane klucze nie są ustawione, OpenClaw uruchamia twoją powłokę logowania i importuje tylko brakujące klucze:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Odpowiednik jako zmienna środowiskowa: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Podstawianie zmiennych środowiskowych w wartościach konfiguracji">
  Odwołuj się do zmiennych środowiskowych w dowolnej wartości tekstowej konfiguracji za pomocą `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Zasady:

- Dopasowywane są tylko nazwy pisane wielkimi literami: `[A-Z_][A-Z0-9_]*`
- Brakujące/puste zmienne powodują błąd podczas wczytywania
- Użyj `$${VAR}`, aby uzyskać dosłowne wyjście
- Działa także w plikach `$include`
- Podstawianie w treści: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Odwołania do sekretów (env, file, exec)">
  Dla pól obsługujących obiekty SecretRef możesz użyć:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

Szczegóły SecretRef (w tym `secrets.providers` dla `env`/`file`/`exec`) znajdziesz w [Zarządzanie sekretami](/pl/gateway/secrets).
Obsługiwane ścieżki poświadczeń są wymienione w [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface).
</Accordion>

Zobacz [Środowisko](/pl/help/environment), aby poznać pełną kolejność pierwszeństwa i źródła.

## Pełna dokumentacja referencyjna

Aby zobaczyć kompletną dokumentację referencyjną wszystkich pól, przejdź do **[Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference)**.

---

_Powiązane: [Przykłady konfiguracji](/pl/gateway/configuration-examples) · [Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference) · [Doctor](/pl/gateway/doctor)_
