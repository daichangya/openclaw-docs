---
read_when:
    - Pierwsza konfiguracja OpenClaw
    - Szukanie typowych wzorców konfiguracji
    - Przechodzenie do konkretnych sekcji konfiguracji
summary: 'Przegląd konfiguracji: typowe zadania, szybka konfiguracja i linki do pełnej dokumentacji referencyjnej'
title: Konfiguracja
x-i18n:
    generated_at: "2026-04-26T11:29:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc1148b93c00d30e34aad0ffb5e1d4dae5438a195a531f5247bbc9a261142350
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw odczytuje opcjonalną konfigurację <Tooltip tip="JSON5 obsługuje komentarze i końcowe przecinki">**JSON5**</Tooltip> z `~/.openclaw/openclaw.json`.
Aktywna ścieżka konfiguracji musi być zwykłym plikiem. Układy z
symlinkowanym `openclaw.json` nie są obsługiwane dla zapisów wykonywanych przez OpenClaw;
zapis atomowy może zastąpić ścieżkę zamiast zachować symlink. Jeśli trzymasz
konfigurację poza domyślnym katalogiem stanu, skieruj `OPENCLAW_CONFIG_PATH`
bezpośrednio na rzeczywisty plik.

Jeśli pliku brakuje, OpenClaw używa bezpiecznych ustawień domyślnych. Typowe powody, aby dodać konfigurację:

- Podłączenie kanałów i kontrola, kto może wysyłać wiadomości do bota
- Ustawienie modeli, narzędzi, sandboxingu lub automatyzacji (Cron, hooki)
- Dostrojenie sesji, multimediów, sieci lub UI

Zobacz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference), aby poznać wszystkie dostępne pola.

Agenci i automatyzacje powinni używać `config.schema.lookup`, aby przed edycją konfiguracji sprawdzić dokładną dokumentację na poziomie pól. Użyj tej strony jako przewodnika zorientowanego na zadania, a [Dokumentacji referencyjnej konfiguracji](/pl/gateway/configuration-reference) do szerszej mapy pól i ustawień domyślnych.

<Tip>
**Dopiero zaczynasz z konfiguracją?** Zacznij od `openclaw onboard` dla interaktywnej konfiguracji albo zajrzyj do przewodnika [Przykłady konfiguracji](/pl/gateway/configuration-examples), aby zobaczyć kompletne konfiguracje do skopiowania i wklejenia.
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
    openclaw onboard       # pełny przepływ onboardingu
    openclaw configure     # kreator konfiguracji
    ```
  </Tab>
  <Tab title="CLI (jednowierszowce)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Otwórz [http://127.0.0.1:18789](http://127.0.0.1:18789) i użyj karty **Config**.
    Control UI renderuje formularz na podstawie schematu aktywnej konfiguracji, w tym metadanych dokumentacji pól
    `title` / `description`, a także schematów pluginów i kanałów, gdy
    są dostępne, z edytorem **Raw JSON** jako wyjściem awaryjnym. Dla narzędzi
    z interfejsem drill-down i innych narzędzi gateway udostępnia również `config.schema.lookup`, aby
    pobrać jeden węzeł schematu ograniczony do ścieżki oraz podsumowania jego bezpośrednich dzieci.
  </Tab>
  <Tab title="Bezpośrednia edycja">
    Edytuj bezpośrednio `~/.openclaw/openclaw.json`. Gateway obserwuje plik i automatycznie stosuje zmiany (zobacz [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Ścisła walidacja

<Warning>
OpenClaw akceptuje tylko konfiguracje, które w pełni odpowiadają schematowi. Nieznane klucze, nieprawidłowe typy lub nieprawidłowe wartości powodują, że Gateway **odmawia uruchomienia**. Jedynym wyjątkiem na poziomie głównym jest `$schema` (ciąg), aby edytory mogły dołączać metadane JSON Schema.
</Warning>

`openclaw config schema` wypisuje kanoniczny JSON Schema używany przez Control UI
i walidację. `config.schema.lookup` pobiera pojedynczy węzeł ograniczony do ścieżki oraz
podsumowania dzieci dla narzędzi drill-down. Metadane dokumentacji pól `title`/`description`
przenoszą się przez obiekty zagnieżdżone, wildcard (`*`), elementy tablic (`[]`) oraz gałęzie `anyOf`/
`oneOf`/`allOf`. Schematy pluginów i kanałów runtime są scalane, gdy
załadowany jest rejestr manifestów.

Gdy walidacja się nie powiedzie:

- Gateway nie uruchamia się
- Działają tylko polecenia diagnostyczne (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Uruchom `openclaw doctor`, aby zobaczyć dokładne problemy
- Uruchom `openclaw doctor --fix` (lub `--yes`), aby zastosować naprawy

Gateway zachowuje zaufaną kopię ostatniej poprawnej konfiguracji po każdym udanym uruchomieniu.
Jeśli `openclaw.json` później nie przejdzie walidacji (albo utraci `gateway.mode`, gwałtownie
się skurczy lub będzie mieć na początku przypadkową linię logu), OpenClaw zachowa uszkodzony plik
jako `.clobbered.*`, przywróci ostatnią poprawną kopię i zaloguje przyczynę odzyskania.
Następna tura agenta również otrzyma ostrzeżenie jako zdarzenie systemowe, aby główny
agent nie nadpisał bezmyślnie przywróconej konfiguracji. Promocja do ostatniej poprawnej kopii
jest pomijana, gdy kandydat zawiera zredagowane placeholdery sekretów, takie jak `***`.
Gdy każdy problem walidacji ogranicza się do `plugins.entries.<id>...`, OpenClaw
nie wykonuje odzyskiwania całego pliku. Utrzymuje bieżącą konfigurację jako aktywną i
ujawnia lokalny błąd pluginu, aby niedopasowanie schematu pluginu lub wersji hosta
nie mogło cofnąć niepowiązanych ustawień użytkownika.

## Typowe zadania

<AccordionGroup>
  <Accordion title="Konfigurowanie kanału (WhatsApp, Telegram, Discord itp.)">
    Każdy kanał ma własną sekcję konfiguracji pod `channels.<provider>`. Zobacz dedykowaną stronę kanału, aby poznać kroki konfiguracji:

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

    Wszystkie kanały współdzielą ten sam wzorzec polityki DM:

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

  <Accordion title="Wybór i konfiguracja modeli">
    Ustaw model primary i opcjonalne fallbacki:

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

    - `agents.defaults.models` definiuje katalog modeli i działa jako allowlist dla `/model`.
    - Użyj `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, aby dodać wpisy do allowlist bez usuwania istniejących modeli. Zwykłe zastąpienia, które usunęłyby wpisy, są odrzucane, chyba że przekażesz `--replace`.
    - Referencje modeli używają formatu `provider/model` (np. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` kontroluje skalowanie obrazów w transkryptach/narzędziach (domyślnie `1200`); niższe wartości zwykle zmniejszają zużycie tokenów vision w przebiegach z dużą liczbą zrzutów ekranu.
    - Zobacz [CLI modeli](/pl/concepts/models), aby przełączać modele w czacie, oraz [Awaryjne przełączanie modeli](/pl/concepts/model-failover), aby poznać rotację uwierzytelniania i zachowanie fallback.
    - W przypadku niestandardowych/self-hosted dostawców zobacz [Niestandardowi dostawcy](/pl/gateway/config-tools#custom-providers-and-base-urls) w dokumentacji referencyjnej.

  </Accordion>

  <Accordion title="Kontrola, kto może wysyłać wiadomości do bota">
    Dostęp DM jest kontrolowany per kanał przez `dmPolicy`:

    - `"pairing"` (domyślnie): nieznani nadawcy dostają jednorazowy kod parowania do zatwierdzenia
    - `"allowlist"`: tylko nadawcy z `allowFrom` (lub sparowanego magazynu dozwolonych)
    - `"open"`: zezwala na wszystkie przychodzące DM (wymaga `allowFrom: ["*"]`)
    - `"disabled"`: ignoruje wszystkie DM

    Dla grup użyj `groupPolicy` + `groupAllowFrom` albo list dozwolonych specyficznych dla kanału.

    Szczegóły per kanał znajdziesz w [pełnej dokumentacji referencyjnej](/pl/gateway/config-channels#dm-and-group-access).

  </Accordion>

  <Accordion title="Konfigurowanie bramkowania wzmianek w czacie grupowym">
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

    - **Wzmianki w metadanych**: natywne @-wzmianki (WhatsApp tap-to-mention, Telegram @bot itp.)
    - **Wzorce tekstowe**: bezpieczne wzorce regex w `mentionPatterns`
    - Zobacz [pełną dokumentację referencyjną](/pl/gateway/config-channels#group-chat-mention-gating), aby poznać nadpisania per kanał i tryb self-chat.

  </Accordion>

  <Accordion title="Ograniczanie Skills per agent">
    Użyj `agents.defaults.skills` dla współdzielonej bazy, a następnie nadpisz konkretne
    agenty przez `agents.list[].skills`:

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
    - Zobacz [Skills](/pl/tools/skills), [Konfiguracja Skills](/pl/tools/skills-config) oraz
      [Dokumentację referencyjną konfiguracji](/pl/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Dostrajanie monitorowania kondycji kanałów Gateway">
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

    - Ustaw `gateway.channelHealthCheckMinutes: 0`, aby globalnie wyłączyć restarty monitorowania kondycji.
    - `channelStaleEventThresholdMinutes` powinno być większe lub równe interwałowi sprawdzania.
    - Użyj `channels.<provider>.healthMonitor.enabled` lub `channels.<provider>.accounts.<id>.healthMonitor.enabled`, aby wyłączyć automatyczne restarty dla jednego kanału lub konta bez wyłączania globalnego monitora.
    - Zobacz [Kontrole kondycji](/pl/gateway/health), aby debugować operacyjnie, oraz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#gateway), aby poznać wszystkie pola.

  </Accordion>

  <Accordion title="Konfiguracja sesji i resetów">
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

    - `dmScope`: `main` (wspólne) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: globalne ustawienia domyślne dla routingu sesji powiązanych z wątkami (Discord obsługuje `/focus`, `/unfocus`, `/agents`, `/session idle` i `/session max-age`).
    - Zobacz [Zarządzanie sesją](/pl/concepts/session), aby poznać zakresowanie, powiązania tożsamości i politykę wysyłania.
    - Zobacz [pełną dokumentację referencyjną](/pl/gateway/config-agents#session), aby poznać wszystkie pola.

  </Accordion>

  <Accordion title="Włączanie sandboxingu">
    Uruchamiaj sesje agentów w izolowanych runtime’ach sandbox:

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

    Zobacz [Sandboxing](/pl/gateway/sandboxing), aby przeczytać pełny przewodnik, oraz [pełną dokumentację referencyjną](/pl/gateway/config-agents#agentsdefaultssandbox), aby poznać wszystkie opcje.

  </Accordion>

  <Accordion title="Włączanie push opartych na relay dla oficjalnych kompilacji iOS">
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

    Odpowiednik CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Co to robi:

    - Pozwala gateway wysyłać `push.test`, sygnały wybudzania i wybudzenia ponownego połączenia przez zewnętrzny relay.
    - Używa uprawnienia wysyłki ograniczonego do rejestracji, przekazywanego przez sparowaną aplikację iOS. Gateway nie potrzebuje tokenu relay dla całego wdrożenia.
    - Powiązuje każdą rejestrację opartą na relay z tożsamością gateway, z którą sparowała się aplikacja iOS, dzięki czemu inny gateway nie może ponownie użyć zapisanej rejestracji.
    - Pozostawia lokalne/ręczne kompilacje iOS przy bezpośrednim APNs. Wysyłki oparte na relay dotyczą tylko oficjalnych dystrybuowanych kompilacji, które zarejestrowały się przez relay.
    - Musi odpowiadać bazowemu URL relay zaszytemu w oficjalnej/TestFlight kompilacji iOS, aby ruch rejestracji i wysyłki trafiał do tego samego wdrożenia relay.

    Przepływ end-to-end:

    1. Zainstaluj oficjalną/TestFlight kompilację iOS skompilowaną z tym samym bazowym URL relay.
    2. Skonfiguruj `gateway.push.apns.relay.baseUrl` na gateway.
    3. Sparuj aplikację iOS z gateway i pozwól połączyć się zarówno sesjom Node, jak i operatora.
    4. Aplikacja iOS pobiera tożsamość gateway, rejestruje się w relay z użyciem App Attest i pokwitowania aplikacji, a następnie publikuje ładunek `push.apns.register` oparty na relay do sparowanego gateway.
    5. Gateway zapisuje uchwyt relay i uprawnienie wysyłki, a następnie używa ich do `push.test`, sygnałów wybudzania i wybudzeń ponownego połączenia.

    Uwagi operacyjne:

    - Jeśli przełączysz aplikację iOS na inny gateway, połącz aplikację ponownie, aby mogła opublikować nową rejestrację relay powiązaną z tym gateway.
    - Jeśli wydasz nową kompilację iOS wskazującą inne wdrożenie relay, aplikacja odświeży swoją buforowaną rejestrację relay zamiast ponownie używać starego źródła relay.

    Uwaga o zgodności:

    - `OPENCLAW_APNS_RELAY_BASE_URL` i `OPENCLAW_APNS_RELAY_TIMEOUT_MS` nadal działają jako tymczasowe nadpisania env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` pozostaje wyjściem awaryjnym do developmentu ograniczonym wyłącznie do loopback; nie zapisuj URL-i relay HTTP w konfiguracji.

    Zobacz [Aplikacja iOS](/pl/platforms/ios#relay-backed-push-for-official-builds), aby poznać przepływ end-to-end, oraz [Przepływ uwierzytelniania i zaufania](/pl/platforms/ios#authentication-and-trust-flow), aby poznać model bezpieczeństwa relay.

  </Accordion>

  <Accordion title="Konfigurowanie Heartbeat (okresowe meldowanie się)">
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
    - Zobacz [Heartbeat](/pl/gateway/heartbeat), aby przeczytać pełny przewodnik.

  </Accordion>

  <Accordion title="Konfigurowanie zadań Cron">
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

    - `sessionRetention`: przycinanie ukończonych sesji izolowanych uruchomień z `sessions.json` (domyślnie `24h`; ustaw `false`, aby wyłączyć).
    - `runLog`: przycinanie `cron/runs/<jobId>.jsonl` według rozmiaru i liczby zachowywanych linii.
    - Zobacz [Zadania Cron](/pl/automation/cron-jobs), aby poznać przegląd funkcji i przykłady CLI.

  </Accordion>

  <Accordion title="Konfigurowanie Webhooków (hooków)">
    Włącz punkty końcowe Webhooków HTTP na Gateway:

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
    - Traktuj całą zawartość ładunków hook/Webhook jako niezaufane dane wejściowe.
    - Używaj dedykowanego `hooks.token`; nie używaj ponownie współdzielonego tokenu Gateway.
    - Uwierzytelnianie hooków działa wyłącznie przez nagłówki (`Authorization: Bearer ...` lub `x-openclaw-token`); tokeny w query string są odrzucane.
    - `hooks.path` nie może być równe `/`; utrzymuj ingress Webhooków na dedykowanej podścieżce, takiej jak `/hooks`.
    - Utrzymuj wyłączone flagi omijania niebezpiecznej zawartości (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), chyba że prowadzisz ściśle ograniczone debugowanie.
    - Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw też `hooks.allowedSessionKeyPrefixes`, aby ograniczyć klucze sesji wybierane przez wywołującego.
    - Dla agentów sterowanych hookami preferuj mocne nowoczesne poziomy modeli i ścisłą politykę narzędzi (na przykład tylko wiadomości plus sandboxing tam, gdzie to możliwe).

    Zobacz [pełną dokumentację referencyjną](/pl/gateway/configuration-reference#hooks), aby poznać wszystkie opcje mapowania i integrację z Gmail.

  </Accordion>

  <Accordion title="Konfigurowanie routingu wielu agentów">
    Uruchamiaj wiele izolowanych agentów z osobnymi workspace’ami i sesjami:

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

    Zobacz [Multi-Agent](/pl/concepts/multi-agent) oraz [pełną dokumentację referencyjną](/pl/gateway/config-agents#multi-agent-routing), aby poznać reguły powiązań i profile dostępu per agent.

  </Accordion>

  <Accordion title="Dzielenie konfiguracji na wiele plików ($include)">
    Użyj `$include`, aby organizować duże konfiguracje:

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
    - **Tablica plików**: głębokie scalenie w kolejności (późniejsze wygrywa)
    - **Klucze sąsiednie**: scalane po include’ach (nadpisują dołączone wartości)
    - **Zagnieżdżone include’y**: obsługiwane do 10 poziomów głębokości
    - **Ścieżki względne**: rozwiązywane względem pliku dołączającego
    - **Zapisy wykonywane przez OpenClaw**: gdy zapis zmienia tylko jedną sekcję najwyższego poziomu
      opartą na include pojedynczego pliku, taką jak `plugins: { $include: "./plugins.json5" }`,
      OpenClaw aktualizuje ten dołączony plik i pozostawia `openclaw.json` bez zmian
    - **Nieobsługiwane zapisy przez include**: include’y w katalogu głównym, tablice include oraz include’y
      z nadpisaniami sąsiadującymi kończą się odmową dla zapisów wykonywanych przez OpenClaw zamiast
      spłaszczać konfigurację
    - **Obsługa błędów**: czytelne błędy dla brakujących plików, błędów parsowania i cyklicznych include’ów

  </Accordion>
</AccordionGroup>

## Hot reload konfiguracji

Gateway obserwuje `~/.openclaw/openclaw.json` i automatycznie stosuje zmiany — dla większości ustawień nie jest potrzebny ręczny restart.

Bezpośrednie edycje pliku są traktowane jako niezaufane, dopóki nie przejdą walidacji. Obserwator czeka,
aż ustabilizuje się szum tymczasowych zapisów/zmian nazw wykonywanych przez edytor, odczytuje
końcowy plik i odrzuca nieprawidłowe zewnętrzne edycje, przywracając ostatnią poprawną konfigurację. Zapisy konfiguracji
wykonywane przez OpenClaw używają tej samej bramki schematu przed zapisem; destrukcyjne nadpisania, takie
jak usunięcie `gateway.mode` lub zmniejszenie pliku o więcej niż połowę, są odrzucane
i zapisywane jako `.rejected.*` do inspekcji.

Wyjątkiem są lokalne błędy walidacji pluginów: jeśli wszystkie problemy znajdują się pod
`plugins.entries.<id>...`, przeładowanie zachowuje bieżącą konfigurację i zgłasza problem pluginu
zamiast przywracać `.last-good`.

Jeśli widzisz w logach `Config auto-restored from last-known-good` lub
`config reload restored last-known-good config`, sprawdź pasujący
plik `.clobbered.*` obok `openclaw.json`, napraw odrzucony ładunek, a następnie uruchom
`openclaw config validate`. Zobacz [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-restored-last-known-good-config),
aby poznać listę kontrolną odzyskiwania.

### Tryby przeładowania

| Tryb                   | Zachowanie                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (domyślnie) | Natychmiast stosuje na gorąco bezpieczne zmiany. Dla krytycznych automatycznie wykonuje restart. |
| **`hot`**              | Stosuje na gorąco tylko bezpieczne zmiany. Loguje ostrzeżenie, gdy potrzebny jest restart — obsługujesz go samodzielnie. |
| **`restart`**          | Restartuje Gateway przy każdej zmianie konfiguracji, bezpiecznej lub nie.              |
| **`off`**              | Wyłącza obserwowanie pliku. Zmiany zaczną działać przy następnym ręcznym restarcie.    |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Co stosuje się na gorąco, a co wymaga restartu

Większość pól stosuje się na gorąco bez przestoju. W trybie `hybrid` zmiany wymagające restartu są obsługiwane automatycznie.

| Kategoria          | Pola                                                              | Czy potrzebny restart? |
| ------------------ | ----------------------------------------------------------------- | ---------------------- |
| Kanały             | `channels.*`, `web` (WhatsApp) — wszystkie wbudowane kanały i kanały pluginów | Nie                    |
| Agent i modele     | `agent`, `agents`, `models`, `routing`                            | Nie                    |
| Automatyzacja      | `hooks`, `cron`, `agent.heartbeat`                                | Nie                    |
| Sesje i wiadomości | `session`, `messages`                                             | Nie                    |
| Narzędzia i multimedia | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`          | Nie                    |
| UI i różne         | `ui`, `logging`, `identity`, `bindings`                           | Nie                    |
| Serwer Gateway     | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Tak**                |
| Infrastruktura     | `discovery`, `canvasHost`, `plugins`                              | **Tak**                |

<Note>
`gateway.reload` i `gateway.remote` są wyjątkami — ich zmiana **nie** powoduje restartu.
</Note>

### Planowanie przeładowania

Gdy edytujesz plik źródłowy, do którego odwołuje się `$include`, OpenClaw planuje
przeładowanie na podstawie układu utworzonego w źródle, a nie spłaszczonego widoku w pamięci.
Dzięki temu decyzje hot-reload (stosowanie na gorąco vs restart) pozostają przewidywalne nawet wtedy, gdy
pojedyncza sekcja najwyższego poziomu znajduje się we własnym dołączonym pliku, takim jak
`plugins: { $include: "./plugins.json5" }`. Planowanie przeładowania kończy się odmową, jeśli
układ źródłowy jest niejednoznaczny.

## RPC konfiguracji (aktualizacje programistyczne)

Dla narzędzi zapisujących konfigurację przez API gateway preferowany jest ten przepływ:

- `config.schema.lookup`, aby sprawdzić jedno poddrzewo (płytki węzeł schematu + podsumowania
  dzieci)
- `config.get`, aby pobrać bieżący snapshot wraz z `hash`
- `config.patch` dla częściowych aktualizacji (JSON merge patch: obiekty są scalane, `null`
  usuwa, tablice są zastępowane)
- `config.apply` tylko wtedy, gdy zamierzasz zastąpić całą konfigurację
- `update.run` dla jawnej self-update i restartu

Agenci powinni traktować `config.schema.lookup` jako pierwszy przystanek dla dokładnej
dokumentacji i ograniczeń na poziomie pól. Używaj [Dokumentacji referencyjnej konfiguracji](/pl/gateway/configuration-reference),
gdy potrzebna jest szersza mapa konfiguracji, wartości domyślne lub linki do dedykowanych
dokumentacji referencyjnych podsystemów.

<Note>
Zapisy control-plane (`config.apply`, `config.patch`, `update.run`) są
ograniczane do 3 żądań na 60 sekund na `deviceId+clientIp`. Żądania restartu są scalane,
a następnie wymuszają 30-sekundowy cooldown między cyklami restartu.
</Note>

Przykład częściowej poprawki:

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
- `~/.openclaw/.env` (globalne ustawienie zapasowe)

Żaden z tych plików nie nadpisuje istniejących zmiennych środowiskowych. Możesz też ustawić zmienne env inline w konfiguracji:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Import shell env (opcjonalnie)">
  Jeśli ta opcja jest włączona i oczekiwane klucze nie są ustawione, OpenClaw uruchamia Twoją powłokę logowania i importuje tylko brakujące klucze:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Odpowiednik zmiennej env: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Podstawianie zmiennych env w wartościach konfiguracji">
  Odwołuj się do zmiennych env w dowolnej wartości ciągu w konfiguracji za pomocą `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Reguły:

- Dopasowywane są tylko nazwy wielkimi literami: `[A-Z_][A-Z0-9_]*`
- Brakujące/puste zmienne powodują błąd podczas ładowania
- Użyj `$${VAR}`, aby uzyskać dosłowne wyjście
- Działa także w plikach `$include`
- Podstawianie inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

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

Pełną dokumentację referencyjną wszystkich pól znajdziesz w **[Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference)**.

---

_Powiązane: [Przykłady konfiguracji](/pl/gateway/configuration-examples) · [Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference) · [Doctor](/pl/gateway/doctor)_

## Powiązane

- [Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference)
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
- [Runbook Gateway](/pl/gateway)
