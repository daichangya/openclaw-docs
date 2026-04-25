---
read_when:
    - Konfigurowanie OpenClaw po raz pierwszy
    - Szukanie typowych wzorców konfiguracji
    - Przechodzenie do konkretnych sekcji konfiguracji
summary: 'Przegląd konfiguracji: typowe zadania, szybka konfiguracja i odnośniki do pełnej dokumentacji konfiguracji'
title: Konfiguracja
x-i18n:
    generated_at: "2026-04-25T13:46:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8ffe1972fc7680d4cfc55a24fd6fc3869af593faf8c1137369dad0dbefde43a
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw odczytuje opcjonalną konfigurację <Tooltip tip="JSON5 obsługuje komentarze i końcowe przecinki">**JSON5**</Tooltip> z `~/.openclaw/openclaw.json`.
Aktywna ścieżka konfiguracji musi być zwykłym plikiem. Układy
`openclaw.json` oparte na symlinkach nie są obsługiwane dla zapisów zarządzanych przez OpenClaw; zapis atomowy może zastąpić
ścieżkę zamiast zachować symlink. Jeśli przechowujesz konfigurację poza
domyślnym katalogiem stanu, wskaż `OPENCLAW_CONFIG_PATH` bezpośrednio na rzeczywisty plik.

Jeśli pliku brakuje, OpenClaw używa bezpiecznych ustawień domyślnych. Typowe powody dodania konfiguracji:

- Połączenie kanałów i kontrola, kto może wysyłać wiadomości do bota
- Ustawienie modeli, narzędzi, sandboxingu lub automatyzacji (Cron, hooki)
- Strojenie sesji, mediów, sieci lub UI

Zobacz [pełną dokumentację konfiguracji](/pl/gateway/configuration-reference), aby poznać wszystkie dostępne pola.

<Tip>
**Dopiero zaczynasz z konfiguracją?** Zacznij od `openclaw onboard`, aby przejść interaktywną konfigurację, albo sprawdź przewodnik [Przykłady konfiguracji](/pl/gateway/configuration-examples), aby znaleźć kompletne konfiguracje do skopiowania i wklejenia.
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
  <Tab title="Kreator interaktywny">
    ```bash
    openclaw onboard       # pełny przepływ onboardingu
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
    Control UI renderuje formularz na podstawie schematu konfiguracji na żywo, w tym metadanych dokumentacji pól
    `title` / `description`, a także schematów Pluginów i kanałów, gdy
    są dostępne, z edytorem **Raw JSON** jako wyjściem awaryjnym. Dla UI
    z drążeniem szczegółów i innych narzędzi gateway udostępnia też `config.schema.lookup`, aby
    pobrać jeden węzeł schematu o zakresie ścieżki wraz z podsumowaniami jego bezpośrednich elementów podrzędnych.
  </Tab>
  <Tab title="Edycja bezpośrednia">
    Edytuj bezpośrednio `~/.openclaw/openclaw.json`. Gateway obserwuje plik i automatycznie stosuje zmiany (zobacz [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Ścisła walidacja

<Warning>
OpenClaw akceptuje tylko konfiguracje, które w pełni pasują do schematu. Nieznane klucze, nieprawidłowe typy lub niepoprawne wartości powodują, że Gateway **odmawia uruchomienia**. Jedynym wyjątkiem na poziomie root jest `$schema` (ciąg znaków), aby edytory mogły dołączać metadane JSON Schema.
</Warning>

`openclaw config schema` wypisuje kanoniczny JSON Schema używany przez Control UI
i walidację. `config.schema.lookup` pobiera pojedynczy węzeł o zakresie ścieżki wraz z
podsumowaniami elementów podrzędnych dla narzędzi z drążeniem szczegółów. Metadane dokumentacji pól `title`/`description`
przenoszą się przez obiekty zagnieżdżone, wildcard (`*`), elementy tablic (`[]`) i gałęzie `anyOf`/
`oneOf`/`allOf`. Schematy Pluginów i kanałów środowiska uruchomieniowego są scalane, gdy
załadowany jest rejestr manifestów.

Gdy walidacja się nie powiedzie:

- Gateway się nie uruchamia
- Działają tylko polecenia diagnostyczne (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Uruchom `openclaw doctor`, aby zobaczyć dokładne problemy
- Uruchom `openclaw doctor --fix` (lub `--yes`), aby zastosować naprawy

Gateway przechowuje zaufaną ostatnią znaną dobrą kopię po każdym pomyślnym uruchomieniu.
Jeśli `openclaw.json` później nie przejdzie walidacji (albo utraci `gateway.mode`, wyraźnie
się zmniejszy lub będzie miał na początku przypadkową linię logu), OpenClaw zachowa uszkodzony plik
jako `.clobbered.*`, przywróci ostatnią znaną dobrą kopię i zapisze przyczynę odzyskania w logach.
Następna tura agenta również otrzyma ostrzeżenie o zdarzeniu systemowym, aby główny
agent nie przepisał bezmyślnie przywróconej konfiguracji. Promocja do ostatniej znanej dobrej kopii
jest pomijana, gdy kandydat zawiera zamaskowane placeholdery sekretów, takie jak `***`.
Gdy każdy problem walidacji ma zakres `plugins.entries.<id>...`, OpenClaw
nie wykonuje odzyskiwania całego pliku. Zachowuje aktywną bieżącą konfigurację i
ujawnia lokalną awarię Pluginu, aby niedopasowanie schematu Pluginu lub wersji hosta nie cofało niezwiązanych ustawień użytkownika.

## Typowe zadania

<AccordionGroup>
  <Accordion title="Skonfiguruj kanał (WhatsApp, Telegram, Discord itd.)">
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

    Wszystkie kanały współdzielą ten sam wzorzec zasad DM:

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
    Ustaw model główny i opcjonalne fallbacki:

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

    - `agents.defaults.models` definiuje katalog modeli i działa jako allowlista dla `/model`.
    - Użyj `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, aby dodać wpisy do allowlisty bez usuwania istniejących modeli. Zwykłe podmiany, które usuwałyby wpisy, są odrzucane, chyba że przekażesz `--replace`.
    - Referencje modeli używają formatu `provider/model` (np. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` kontroluje skalowanie obrazów transcript/tool w dół (domyślnie `1200`); niższe wartości zwykle zmniejszają użycie tokenów vision przy uruchomieniach z dużą liczbą zrzutów ekranu.
    - Zobacz [CLI modeli](/pl/concepts/models), aby przełączać modele na czacie, oraz [Model Failover](/pl/concepts/model-failover), aby poznać rotację uwierzytelniania i zachowanie fallbacków.
    - Dla providerów niestandardowych/samohostowanych zobacz [Providerzy niestandardowi](/pl/gateway/config-tools#custom-providers-and-base-urls) w dokumentacji konfiguracji.

  </Accordion>

  <Accordion title="Kontroluj, kto może wysyłać wiadomości do bota">
    Dostęp do DM jest kontrolowany per kanał przez `dmPolicy`:

    - `"pairing"` (domyślnie): nieznani nadawcy dostają jednorazowy kod parowania do zatwierdzenia
    - `"allowlist"`: tylko nadawcy w `allowFrom` (lub w sparowanym magazynie dozwolonych)
    - `"open"`: zezwala na wszystkie przychodzące DM (wymaga `allowFrom: ["*"]`)
    - `"disabled"`: ignoruje wszystkie DM

    Dla grup użyj `groupPolicy` + `groupAllowFrom` albo allowlist specyficznych dla kanału.

    Zobacz [pełną dokumentację konfiguracji](/pl/gateway/config-channels#dm-and-group-access), aby poznać szczegóły per kanał.

  </Accordion>

  <Accordion title="Skonfiguruj bramkowanie wzmiankami na czacie grupowym">
    Wiadomości grupowe domyślnie **wymagają wzmianki**. Skonfiguruj wzorce per agent:

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

    - **Wzmianki metadanych**: natywne @-wzmianki (WhatsApp tap-to-mention, Telegram @bot itd.)
    - **Wzorce tekstowe**: bezpieczne wzorce regex w `mentionPatterns`
    - Zobacz [pełną dokumentację konfiguracji](/pl/gateway/config-channels#group-chat-mention-gating), aby poznać nadpisania per kanał i tryb self-chat.

  </Accordion>

  <Accordion title="Ogranicz Skills per agent">
    Użyj `agents.defaults.skills` dla współdzielonej bazy, a następnie nadpisz konkretne
    agenty za pomocą `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // dziedziczy github, weather
          { id: "docs", skills: ["docs-search"] }, // zastępuje ustawienia domyślne
          { id: "locked-down", skills: [] }, // bez Skills
        ],
      },
    }
    ```

    - Pomiń `agents.defaults.skills`, aby domyślnie nie ograniczać Skills.
    - Pomiń `agents.list[].skills`, aby dziedziczyć ustawienia domyślne.
    - Ustaw `agents.list[].skills: []`, aby nie mieć żadnych Skills.
    - Zobacz [Skills](/pl/tools/skills), [konfigurację Skills](/pl/tools/skills-config) oraz
      [dokumentację konfiguracji](/pl/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Dostrój monitorowanie zdrowia kanałów gateway">
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

    - Ustaw `gateway.channelHealthCheckMinutes: 0`, aby globalnie wyłączyć restarty monitora zdrowia.
    - `channelStaleEventThresholdMinutes` powinno być większe lub równe interwałowi sprawdzania.
    - Użyj `channels.<provider>.healthMonitor.enabled` lub `channels.<provider>.accounts.<id>.healthMonitor.enabled`, aby wyłączyć automatyczne restarty dla jednego kanału lub konta bez wyłączania globalnego monitora.
    - Zobacz [Health Checks](/pl/gateway/health), aby debugować operacyjnie, oraz [pełną dokumentację konfiguracji](/pl/gateway/configuration-reference#gateway), aby poznać wszystkie pola.

  </Accordion>

  <Accordion title="Skonfiguruj sesje i resety">
    Sesje kontrolują ciągłość i izolację konwersacji:

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
    - `threadBindings`: globalne ustawienia domyślne dla routingu sesji powiązanych z wątkami (Discord obsługuje `/focus`, `/unfocus`, `/agents`, `/session idle` i `/session max-age`).
    - Zobacz [Zarządzanie sesją](/pl/concepts/session), aby poznać zakresy, powiązania tożsamości i zasady wysyłania.
    - Zobacz [pełną dokumentację konfiguracji](/pl/gateway/config-agents#session), aby poznać wszystkie pola.

  </Accordion>

  <Accordion title="Włącz sandboxing">
    Uruchamiaj sesje agentów w izolowanych środowiskach sandbox:

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

    Zobacz [Sandboxing](/pl/gateway/sandboxing), aby poznać pełny przewodnik, oraz [pełną dokumentację konfiguracji](/pl/gateway/config-agents#agentsdefaultssandbox), aby poznać wszystkie opcje.

  </Accordion>

  <Accordion title="Włącz push oparty na relay dla oficjalnych kompilacji iOS">
    Push oparty na relay jest konfigurowany w `openclaw.json`.

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

    - Pozwala gateway wysyłać `push.test`, sygnały wybudzania i wybudzenia ponownego połączenia przez zewnętrzny relay.
    - Używa uprawnienia wysyłki o zakresie rejestracji przekazywanego przez sparowaną aplikację iOS. Gateway nie potrzebuje tokenu relay obejmującego całe wdrożenie.
    - Wiąże każdą rejestrację opartą na relay z tożsamością gateway, z którą sparowała się aplikacja iOS, dzięki czemu inny gateway nie może ponownie użyć zapisanej rejestracji.
    - Utrzymuje lokalne/ręczne kompilacje iOS na bezpośrednim APNs. Wysyłki oparte na relay mają zastosowanie tylko do oficjalnych dystrybuowanych kompilacji, które zarejestrowały się przez relay.
    - Musi odpowiadać bazowemu URL relay wbudowanemu w oficjalną kompilację/TestFlight iOS, aby ruch rejestracji i wysyłki trafiał do tego samego wdrożenia relay.

    Pełny przepływ end-to-end:

    1. Zainstaluj oficjalną kompilację/TestFlight iOS skompilowaną z tym samym bazowym URL relay.
    2. Skonfiguruj `gateway.push.apns.relay.baseUrl` na gateway.
    3. Sparuj aplikację iOS z gateway i pozwól połączyć się zarówno sesjom Node, jak i operatora.
    4. Aplikacja iOS pobiera tożsamość gateway, rejestruje się w relay za pomocą App Attest oraz potwierdzenia aplikacji, a następnie publikuje ładunek `push.apns.register` oparty na relay do sparowanego gateway.
    5. Gateway zapisuje uchwyt relay i uprawnienie wysyłki, a następnie używa ich dla `push.test`, sygnałów wybudzania i wybudzeń ponownego połączenia.

    Uwagi operacyjne:

    - Jeśli przełączysz aplikację iOS na inny gateway, połącz aplikację ponownie, aby mogła opublikować nową rejestrację relay powiązaną z tym gateway.
    - Jeśli wydasz nową kompilację iOS wskazującą inne wdrożenie relay, aplikacja odświeży zapisane w pamięci podręcznej rejestracje relay zamiast ponownie używać starego źródła relay.

    Uwaga dotycząca zgodności:

    - `OPENCLAW_APNS_RELAY_BASE_URL` i `OPENCLAW_APNS_RELAY_TIMEOUT_MS` nadal działają jako tymczasowe nadpisania env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` pozostaje wyłącznie loopbackową furtką deweloperską; nie zapisuj trwałych URL relay HTTP w konfiguracji.

    Zobacz [Aplikacja iOS](/pl/platforms/ios#relay-backed-push-for-official-builds), aby poznać pełny przepływ end-to-end, oraz [Przepływ uwierzytelniania i zaufania](/pl/platforms/ios#authentication-and-trust-flow), aby poznać model bezpieczeństwa relay.

  </Accordion>

  <Accordion title="Skonfiguruj Heartbeat (okresowe meldunki)">
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
    - `directPolicy`: `allow` (domyślnie) lub `block` dla celów Heartbeat w stylu DM
    - Zobacz [Heartbeat](/pl/gateway/heartbeat), aby poznać pełny przewodnik.

  </Accordion>

  <Accordion title="Skonfiguruj zadania Cron">
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

    - `sessionRetention`: usuwa zakończone izolowane sesje uruchomień z `sessions.json` (domyślnie `24h`; ustaw `false`, aby wyłączyć).
    - `runLog`: przycina `cron/runs/<jobId>.jsonl` według rozmiaru i liczby zachowywanych linii.
    - Zobacz [Zadania Cron](/pl/automation/cron-jobs), aby poznać przegląd funkcji i przykłady CLI.

  </Accordion>

  <Accordion title="Skonfiguruj Webhooki (hooki)">
    Włącz punkty końcowe HTTP Webhooków w Gateway:

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
    - Traktuj całą zawartość ładunku hooka/Webhooka jako niezaufane dane wejściowe.
    - Używaj dedykowanego `hooks.token`; nie używaj ponownie współdzielonego tokenu Gateway.
    - Uwierzytelnianie hooków działa tylko przez nagłówek (`Authorization: Bearer ...` lub `x-openclaw-token`); tokeny w query string są odrzucane.
    - `hooks.path` nie może mieć wartości `/`; utrzymuj wejście Webhooków na dedykowanej podścieżce, takiej jak `/hooks`.
    - Pozostaw flagi omijania niebezpiecznej zawartości wyłączone (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), chyba że prowadzisz ściśle ograniczone debugowanie.
    - Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw też `hooks.allowedSessionKeyPrefixes`, aby ograniczyć klucze sesji wybierane przez wywołującego.
    - Dla agentów sterowanych hookami preferuj mocne nowoczesne poziomy modeli i ścisłą politykę narzędzi (na przykład tylko wiadomości plus sandboxing tam, gdzie to możliwe).

    Zobacz [pełną dokumentację konfiguracji](/pl/gateway/configuration-reference#hooks), aby poznać wszystkie opcje mapowania i integrację z Gmail.

  </Accordion>

  <Accordion title="Skonfiguruj routing wielu agentów">
    Uruchamiaj wiele odizolowanych agentów z osobnymi workspace'ami i sesjami:

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

    Zobacz [Multi-Agent](/pl/concepts/multi-agent) oraz [pełną dokumentację konfiguracji](/pl/gateway/config-agents#multi-agent-routing), aby poznać reguły powiązań i profile dostępu per agent.

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

    - **Pojedynczy plik**: zastępuje zawierający go obiekt
    - **Tablica plików**: jest głęboko scalana w kolejności (późniejsze wygrywają)
    - **Klucze sąsiadujące**: są scalane po include'ach (nadpisują dołączone wartości)
    - **Zagnieżdżone include'y**: obsługiwane do 10 poziomów głębokości
    - **Ścieżki względne**: rozwiązywane względem pliku dołączającego
    - **Zapisy zarządzane przez OpenClaw**: gdy zapis zmienia tylko jedną sekcję najwyższego poziomu
      opartą na include pojedynczego pliku, taką jak `plugins: { $include: "./plugins.json5" }`,
      OpenClaw aktualizuje ten dołączony plik i pozostawia `openclaw.json` bez zmian
    - **Nieobsługiwany write-through**: include'y root, tablice include'ów i include'y
      z sąsiadującymi nadpisaniami kończą się bezpieczną odmową dla zapisów zarządzanych przez OpenClaw zamiast
      spłaszczać konfigurację
    - **Obsługa błędów**: jasne błędy dla brakujących plików, błędów parsowania i cyklicznych include'ów

  </Accordion>
</AccordionGroup>

## Hot reload konfiguracji

Gateway obserwuje `~/.openclaw/openclaw.json` i automatycznie stosuje zmiany — dla większości ustawień nie jest potrzebny ręczny restart.

Bezpośrednie edycje pliku są traktowane jako niezaufane, dopóki nie przejdą walidacji. Obserwator czeka,
aż tymczasowe zapisy/zmiany nazw wykonywane przez edytor się uspokoją, odczytuje końcowy plik i odrzuca
nieprawidłowe zewnętrzne edycje, przywracając ostatnią znaną dobrą konfigurację. Zapisy konfiguracji zarządzane przez OpenClaw
używają tej samej bramki schematu przed zapisem; destrukcyjne nadpisania, takie
jak usunięcie `gateway.mode` albo zmniejszenie pliku o więcej niż połowę, są odrzucane
i zapisywane jako `.rejected.*` do inspekcji.

Wyjątkiem są lokalne awarie walidacji Pluginów: jeśli wszystkie problemy znajdują się w
`plugins.entries.<id>...`, przeładowanie zachowuje bieżącą konfigurację i raportuje problem Pluginu
zamiast przywracać `.last-good`.

Jeśli widzisz w logach `Config auto-restored from last-known-good` lub
`config reload restored last-known-good config`, sprawdź pasujący
plik `.clobbered.*` obok `openclaw.json`, popraw odrzucony ładunek, a następnie uruchom
`openclaw config validate`. Zobacz [Rozwiązywanie problemów Gateway](/pl/gateway/troubleshooting#gateway-restored-last-known-good-config),
aby poznać listę kroków odzyskiwania.

### Tryby przeładowania

| Tryb                   | Zachowanie                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (domyślnie) | Natychmiast stosuje bezpieczne zmiany na gorąco. Dla krytycznych automatycznie restartuje. |
| **`hot`**              | Stosuje na gorąco tylko bezpieczne zmiany. Gdy potrzebny jest restart, zapisuje ostrzeżenie — obsługujesz to ręcznie. |
| **`restart`**          | Restartuje Gateway przy każdej zmianie konfiguracji, bez względu na jej rodzaj.         |
| **`off`**              | Wyłącza obserwowanie pliku. Zmiany zaczną działać przy następnym ręcznym restarcie.     |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Co jest stosowane na gorąco, a co wymaga restartu

Większość pól jest stosowana na gorąco bez przestoju. W trybie `hybrid` zmiany wymagające restartu są obsługiwane automatycznie.

| Kategoria            | Pola                                                              | Wymaga restartu? |
| -------------------- | ----------------------------------------------------------------- | ---------------- |
| Kanały               | `channels.*`, `web` (WhatsApp) — wszystkie dołączone kanały i kanały Pluginów | Nie              |
| Agent i modele       | `agent`, `agents`, `models`, `routing`                            | Nie              |
| Automatyzacja        | `hooks`, `cron`, `agent.heartbeat`                                | Nie              |
| Sesje i wiadomości   | `session`, `messages`                                             | Nie              |
| Narzędzia i multimedia | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`            | Nie              |
| UI i inne            | `ui`, `logging`, `identity`, `bindings`                           | Nie              |
| Serwer Gateway       | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Tak**          |
| Infrastruktura       | `discovery`, `canvasHost`, `plugins`                              | **Tak**          |

<Note>
`gateway.reload` i `gateway.remote` są wyjątkami — ich zmiana **nie** wywołuje restartu.
</Note>

### Planowanie przeładowania

Gdy edytujesz plik źródłowy, do którego odwołuje się `$include`, OpenClaw planuje
przeładowanie na podstawie układu utworzonego w źródle, a nie spłaszczonego widoku w pamięci.
Dzięki temu decyzje hot reload (zastosowanie na gorąco vs restart) pozostają przewidywalne, nawet gdy
jedna sekcja najwyższego poziomu znajduje się we własnym dołączonym pliku, takim jak
`plugins: { $include: "./plugins.json5" }`. Planowanie przeładowania kończy się bezpieczną odmową, jeśli
układ źródłowy jest niejednoznaczny.

## RPC konfiguracji (aktualizacje programowe)

Dla narzędzi zapisujących konfigurację przez API gateway preferuj ten przepływ:

- `config.schema.lookup`, aby sprawdzić jedno poddrzewo (płytki węzeł schematu + podsumowania elementów
  podrzędnych)
- `config.get`, aby pobrać bieżącą migawkę wraz z `hash`
- `config.patch` dla częściowych aktualizacji (JSON merge patch: obiekty są scalane, `null`
  usuwa, tablice zastępują)
- `config.apply` tylko wtedy, gdy zamierzasz zastąpić całą konfigurację
- `update.run` dla jawnej samodzielnej aktualizacji i restartu

<Note>
Zapisy control-plane (`config.apply`, `config.patch`, `update.run`) są
ograniczane do 3 żądań na 60 sekund dla każdego `deviceId+clientIp`. Żądania restartu
są scalane, a następnie wymuszają 30-sekundowy czas odnowienia między cyklami restartu.
</Note>

Przykład częściowego patcha:

```bash
openclaw gateway call config.get --params '{}'  # przechwyć payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Zarówno `config.apply`, jak i `config.patch` akceptują `raw`, `baseHash`, `sessionKey`,
`note` oraz `restartDelayMs`. `baseHash` jest wymagane dla obu metod, gdy
konfiguracja już istnieje.

## Zmienne środowiskowe

OpenClaw odczytuje zmienne środowiskowe z procesu nadrzędnego oraz z:

- `.env` z bieżącego katalogu roboczego (jeśli istnieje)
- `~/.openclaw/.env` (globalna wartość zapasowa)

Żaden z tych plików nie nadpisuje istniejących zmiennych środowiskowych. Możesz też ustawiać wbudowane zmienne środowiskowe w konfiguracji:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Import zmiennych środowiskowych z powłoki (opcjonalnie)">
  Jeśli jest włączone, a oczekiwane klucze nie są ustawione, OpenClaw uruchamia Twoją powłokę logowania i importuje tylko brakujące klucze:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Odpowiednik w zmiennych środowiskowych: `OPENCLAW_LOAD_SHELL_ENV=1`
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

- Dopasowywane są tylko nazwy wielkimi literami: `[A-Z_][A-Z0-9_]*`
- Brakujące/puste zmienne powodują błąd podczas ładowania
- Użyj `$${VAR}`, aby uzyskać dosłowne wyjście
- Działa także w plikach `$include`
- Podstawianie wbudowane: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="SecretRef (env, file, exec)">
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

## Pełna dokumentacja konfiguracji

Pełną dokumentację wszystkich pól znajdziesz w **[Dokumentacja konfiguracji](/pl/gateway/configuration-reference)**.

---

_Powiązane: [Przykłady konfiguracji](/pl/gateway/configuration-examples) · [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) · [Doctor](/pl/gateway/doctor)_

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
- [Runbook Gateway](/pl/gateway)
