---
read_when:
    - Instalowanie lub konfigurowanie Pluginów
    - Zrozumienie reguł wykrywania i ładowania Pluginów
    - Praca z pakietami Pluginów zgodnymi z Codex/Claude
sidebarTitle: Install and Configure
summary: Instaluj, konfiguruj i zarządzaj Pluginami OpenClaw
title: Pluginy
x-i18n:
    generated_at: "2026-04-25T14:00:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54a902eabd90e54e769429770cd56e1d89a8bb50aff4b9ed8a9f68d6685b77a8
    source_path: tools/plugin.md
    workflow: 15
---

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
harnessy agentów, narzędzia, Skills, mowę, transkrypcję w czasie rzeczywistym, głos w czasie rzeczywistym,
rozumienie mediów, generowanie obrazów, generowanie wideo, pobieranie z sieci, wyszukiwanie w sieci
i więcej. Niektóre Pluginy są **core** (dostarczane z OpenClaw), a inne
są **zewnętrzne** (publikowane na npm przez społeczność).

## Szybki start

<Steps>
  <Step title="Sprawdź, co jest załadowane">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Zainstaluj Plugin">
    ```bash
    # Z npm
    openclaw plugins install @openclaw/voice-call

    # Z lokalnego katalogu lub archiwum
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Uruchom ponownie Gateway">
    ```bash
    openclaw gateway restart
    ```

    Następnie skonfiguruj w `plugins.entries.\<id\>.config` w pliku konfiguracyjnym.

  </Step>
</Steps>

Jeśli wolisz sterowanie natywne dla czatu, włącz `commands.plugins: true` i użyj:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Ścieżka instalacji używa tego samego resolvera co CLI: lokalna ścieżka/archiwum, jawne
`clawhub:<pkg>` albo zwykła specyfikacja pakietu (najpierw ClawHub, potem fallback do npm).

Jeśli konfiguracja jest nieprawidłowa, instalacja zwykle bezpiecznie kończy się błędem i kieruje do
`openclaw doctor --fix`. Jedynym wyjątkiem odzyskiwania jest wąska ścieżka ponownej instalacji Pluginu dołączonego
dla Pluginów, które włączają
`openclaw.install.allowInvalidConfigRecovery`.

Pakietowe instalacje OpenClaw nie instalują od razu całego drzewa zależności wykonawczych każdego dołączonego Pluginu.
Gdy dołączony Plugin należący do OpenClaw jest aktywny z konfiguracji Pluginów,
starszej konfiguracji kanału lub manifestu domyślnie włączonego, naprawa przy starcie instaluje tylko
zadeklarowane zależności wykonawcze tego Pluginu przed jego importem.
Jawne wyłączenie nadal ma pierwszeństwo: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` oraz `channels.<id>.enabled: false`
zapobiegają automatycznej naprawie dołączonych zależności wykonawczych dla tego Pluginu/kanału.
Zewnętrzne Pluginy i niestandardowe ścieżki ładowania nadal muszą być instalowane przez
`openclaw plugins install`.

## Typy Pluginów

OpenClaw rozpoznaje dwa formaty Pluginów:

| Format     | Jak działa                                                       | Przykłady                                              |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + moduł wykonawczy; wykonuje się in-process | Oficjalne Pluginy, pakiety npm społeczności          |
| **Bundle** | Układ zgodny z Codex/Claude/Cursor; mapowany na funkcje OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Oba pojawiają się w `openclaw plugins list`. Szczegóły pakietów znajdziesz w [Pakiety Pluginów](/pl/plugins/bundles).

Jeśli piszesz natywny Plugin, zacznij od [Tworzenie Pluginów](/pl/plugins/building-plugins)
i [Przegląd Plugin SDK](/pl/plugins/sdk-overview).

## Oficjalne Pluginy

### Instalowalne (npm)

| Plugin          | Pakiet                 | Dokumentacja                         |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/pl/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/pl/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/pl/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/pl/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/pl/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/pl/plugins/zalouser)   |

### Core (dostarczane z OpenClaw)

<AccordionGroup>
  <Accordion title="Dostawcy modeli (domyślnie włączeni)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Pluginy pamięci">
    - `memory-core` — dołączone wyszukiwanie pamięci (domyślnie przez `plugins.slots.memory`)
    - `memory-lancedb` — instalowana na żądanie pamięć długoterminowa z automatycznym przywoływaniem/przechwytywaniem (ustaw `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Dostawcy mowy (domyślnie włączeni)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Inne">
    - `browser` — dołączony Plugin przeglądarki dla narzędzia przeglądarki, CLI `openclaw browser`, metody Gateway `browser.request`, środowiska wykonawczego przeglądarki i domyślnej usługi sterowania przeglądarką (domyślnie włączony; wyłącz przed zastąpieniem)
    - `copilot-proxy` — most VS Code Copilot Proxy (domyślnie wyłączony)
  </Accordion>
</AccordionGroup>

Szukasz Pluginów firm trzecich? Zobacz [Pluginy społeczności](/pl/plugins/community).

## Konfiguracja

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Field            | Description                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Główny przełącznik (domyślnie: `true`)                    |
| `allow`          | Lista dozwolonych Pluginów (opcjonalnie)                  |
| `deny`           | Lista blokowanych Pluginów (opcjonalnie; deny wygrywa)    |
| `load.paths`     | Dodatkowe pliki/katalogi Pluginów                         |
| `slots`          | Selektory wyłącznych slotów (np. `memory`, `contextEngine`) |
| `entries.\<id\>` | Przełączniki i konfiguracja per Plugin                    |

Zmiany konfiguracji **wymagają ponownego uruchomienia gateway**. Jeśli Gateway działa z obserwacją konfiguracji
i restartem in-process (domyślna ścieżka `openclaw gateway`),
ten restart zwykle wykonywany jest automatycznie chwilę po zapisaniu konfiguracji.
Nie ma obsługiwanej ścieżki hot-reload dla natywnego kodu wykonawczego Pluginów ani hooków cyklu życia;
uruchom ponownie proces Gateway, który obsługuje aktywny kanał, zanim zaczniesz oczekiwać, że zaktualizowany kod
`register(api)`, hooki `api.on(...)`, narzędzia, usługi lub hooki dostawcy/runtime zaczną działać.

`openclaw plugins list` to lokalny snapshot CLI/konfiguracji. Plugin oznaczony tam jako `loaded`
oznacza, że Plugin jest wykrywalny i ładowalny z konfiguracji/plików widocznych dla tego
wywołania CLI. Nie dowodzi to, że już działający zdalny proces potomny Gateway
zrestartował się do tego samego kodu Pluginu. W konfiguracjach VPS/kontenerowych z procesami opakowującymi
wysyłaj restarty do rzeczywistego procesu `openclaw gateway run` lub użyj
`openclaw gateway restart` względem działającego Gateway.

<Accordion title="Stany Pluginów: disabled vs missing vs invalid">
  - **Disabled**: Plugin istnieje, ale reguły włączania go wyłączyły. Konfiguracja zostaje zachowana.
  - **Missing**: konfiguracja odwołuje się do identyfikatora Pluginu, którego wykrywanie nie znalazło.
  - **Invalid**: Plugin istnieje, ale jego konfiguracja nie pasuje do zadeklarowanego schematu.
</Accordion>

## Wykrywanie i priorytet

OpenClaw skanuje Pluginy w tej kolejności (pierwsze dopasowanie wygrywa):

<Steps>
  <Step title="Ścieżki konfiguracji">
    `plugins.load.paths` — jawne ścieżki plików lub katalogów.
  </Step>

  <Step title="Pluginy obszaru roboczego">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` i `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Globalne Pluginy">
    `~/.openclaw/<plugin-root>/*.ts` i `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Dołączone Pluginy">
    Dostarczane z OpenClaw. Wiele z nich jest domyślnie włączonych (dostawcy modeli, mowa).
    Inne wymagają jawnego włączenia.
  </Step>
</Steps>

### Reguły włączania

- `plugins.enabled: false` wyłącza wszystkie Pluginy
- `plugins.deny` zawsze ma pierwszeństwo przed allow
- `plugins.entries.\<id\>.enabled: false` wyłącza ten Plugin
- Pluginy pochodzące z obszaru roboczego są **domyślnie wyłączone** (muszą zostać jawnie włączone)
- Dołączone Pluginy podążają za wbudowanym zestawem domyślnie włączonym, chyba że zostaną nadpisane
- Wyłączne sloty mogą wymusić włączenie wybranego Pluginu dla danego slotu
- Niektóre dołączone Pluginy opt-in są włączane automatycznie, gdy konfiguracja wskazuje
  powierzchnię należącą do Pluginu, taką jak odwołanie do modelu dostawcy, konfiguracja kanału lub
  runtime harnessu
- Trasy Codex z rodziny OpenAI zachowują oddzielne granice Pluginów:
  `openai-codex/*` należy do Pluginu OpenAI, podczas gdy dołączony Plugin
  serwera aplikacji Codex jest wybierany przez `embeddedHarness.runtime: "codex"` lub starsze
  odwołania do modeli `codex/*`

## Rozwiązywanie problemów z hookami runtime

Jeśli Plugin pojawia się w `plugins list`, ale efekty uboczne `register(api)` lub hooki
nie działają w aktywnym ruchu czatu, najpierw sprawdź:

- Uruchom `openclaw gateway status --deep --require-rpc` i potwierdź, że aktywne
  URL Gateway, profil, ścieżka konfiguracji i proces to te, które edytujesz.
- Uruchom ponownie aktywny Gateway po instalacji/konfiguracji/zmianach kodu Pluginu. W kontenerach
  opakowujących PID 1 może być tylko supervisorem; uruchom ponownie lub wyślij sygnał do procesu potomnego
  `openclaw gateway run`.
- Użyj `openclaw plugins inspect <id> --json`, aby potwierdzić rejestracje hooków i
  diagnostykę. Niedołączone hooki konwersacji, takie jak `llm_input`,
  `llm_output` i `agent_end`, wymagają
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Do przełączania modeli preferuj `before_model_resolve`. Uruchamia się przed rozwiązaniem
  modelu dla tur agenta; `llm_output` działa dopiero po tym, jak próba modelu
  wygeneruje wynik asystenta.
- Aby uzyskać dowód efektywnego modelu sesji, użyj `openclaw sessions` lub
  powierzchni sesji/statusu Gateway, a podczas debugowania ładunków dostawcy uruchom
  Gateway z `--raw-stream --raw-stream-path <path>`.

## Sloty Pluginów (wyłączne kategorie)

Niektóre kategorie są wyłączne (tylko jedna może być aktywna naraz):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // lub "none", aby wyłączyć
      contextEngine: "legacy", // lub identyfikator Pluginu
    },
  },
}
```

| Slot            | Co kontroluje          | Domyślnie           |
| --------------- | ---------------------- | ------------------- |
| `memory`        | Aktywny Plugin pamięci | `memory-core`       |
| `contextEngine` | Aktywny silnik kontekstu | `legacy` (wbudowany) |

## Dokumentacja CLI

```bash
openclaw plugins list                       # zwarty spis
openclaw plugins list --enabled            # tylko załadowane Pluginy
openclaw plugins list --verbose            # szczegółowe linie per Plugin
openclaw plugins list --json               # spis w formacie czytelnym maszynowo
openclaw plugins inspect <id>              # szczegóły szczegółowe
openclaw plugins inspect <id> --json       # format czytelny maszynowo
openclaw plugins inspect --all             # tabela dla całej floty
openclaw plugins info <id>                 # alias inspect
openclaw plugins doctor                    # diagnostyka

openclaw plugins install <package>         # instalacja (najpierw ClawHub, potem npm)
openclaw plugins install clawhub:<pkg>     # instalacja tylko z ClawHub
openclaw plugins install <spec> --force    # nadpisanie istniejącej instalacji
openclaw plugins install <path>            # instalacja z lokalnej ścieżki
openclaw plugins install -l <path>         # linkowanie (bez kopiowania) do celów deweloperskich
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # zapisanie dokładnie rozstrzygniętej specyfikacji npm
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # aktualizacja jednego Pluginu
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # aktualizacja wszystkich
openclaw plugins uninstall <id>          # usunięcie konfiguracji/rekordów instalacji
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Dołączone Pluginy są dostarczane z OpenClaw. Wiele z nich jest domyślnie włączonych (na przykład
dołączeni dostawcy modeli, dołączeni dostawcy mowy oraz dołączony Plugin
przeglądarki). Inne dołączone Pluginy nadal wymagają `openclaw plugins enable <id>`.

`--force` nadpisuje istniejący zainstalowany Plugin lub pakiet hooków na miejscu. Użyj
`openclaw plugins update <id-or-npm-spec>` do rutynowych aktualizacji śledzonych Pluginów
npm. Nie jest to obsługiwane razem z `--link`, które ponownie używa ścieżki źródłowej zamiast
kopiować na zarządzany cel instalacji.

Gdy `plugins.allow` jest już ustawione, `openclaw plugins install` dodaje
identyfikator zainstalowanego Pluginu do tej listy dozwolonych przed jego włączeniem, dzięki czemu instalacje są
natychmiast ładowalne po restarcie.

`openclaw plugins update <id-or-npm-spec>` dotyczy śledzonych instalacji. Przekazanie
specyfikacji pakietu npm z dist-tag lub dokładną wersją powoduje rozstrzygnięcie nazwy pakietu
z powrotem do śledzonego rekordu Pluginu i zapisanie nowej specyfikacji dla przyszłych aktualizacji.
Przekazanie nazwy pakietu bez wersji przenosi dokładnie przypiętą instalację z powrotem na
domyślną linię wydań rejestru. Jeśli zainstalowany Plugin npm już odpowiada
rozstrzygniętej wersji i zapisanej tożsamości artefaktu, OpenClaw pomija aktualizację
bez pobierania, ponownej instalacji ani przepisywania konfiguracji.

`--pin` dotyczy tylko npm. Nie jest obsługiwane z `--marketplace`, ponieważ
instalacje marketplace zapisują metadane źródła marketplace zamiast specyfikacji npm.

`--dangerously-force-unsafe-install` to awaryjne nadpisanie dla fałszywych
pozytywów z wbudowanego skanera niebezpiecznego kodu. Pozwala kontynuować instalacje
i aktualizacje Pluginów mimo wbudowanych ustaleń `critical`, ale nadal
nie omija blokad polityki Pluginu `before_install` ani blokowania z powodu niepowodzenia skanowania.

Ta flaga CLI dotyczy tylko przepływów instalacji/aktualizacji Pluginów. Instalacje zależności Skill
obsługiwane przez Gateway używają zamiast tego odpowiadającego nadpisania żądania `dangerouslyForceUnsafeInstall`, natomiast `openclaw skills install` pozostaje oddzielnym przepływem
pobierania/instalacji Skill z ClawHub.

Zgodne pakiety uczestniczą w tym samym przepływie list/inspect/enable/disable
Pluginów. Bieżąca obsługa runtime obejmuje Skill z pakietów, command-skills Claude,
domyślne ustawienia Claude `settings.json`, domyślne wpisy Claude `.lsp.json` i
`lspServers` zadeklarowane w manifeście, command-skills Cursor oraz zgodne katalogi hooków Codex.

`openclaw plugins inspect <id>` zgłasza też wykryte możliwości pakietu oraz
obsługiwane lub nieobsługiwane wpisy serwerów MCP i LSP dla Pluginów opartych na pakietach.

Źródła marketplace mogą być nazwą znanego marketplace Claude z
`~/.claude/plugins/known_marketplaces.json`, lokalnym katalogiem głównym marketplace lub
ścieżką `marketplace.json`, skrótem GitHub takim jak `owner/repo`, URL repozytorium GitHub
albo URL git. W przypadku zdalnych marketplace wpisy Pluginów muszą pozostawać wewnątrz
sklonowanego repozytorium marketplace i używać wyłącznie źródeł ścieżek względnych.

Pełne szczegóły znajdziesz w [dokumentacji CLI `openclaw plugins`](/pl/cli/plugins).

## Przegląd API Pluginów

Natywne Pluginy eksportują obiekt entry, który udostępnia `register(api)`. Starsze
Pluginy mogą nadal używać `activate(api)` jako starszego aliasu, ale nowe Pluginy powinny
używać `register`.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw ładuje obiekt entry i wywołuje `register(api)` podczas aktywacji
Pluginu. Loader nadal przechodzi awaryjnie do `activate(api)` dla starszych Pluginów,
ale dołączone Pluginy i nowe zewnętrzne Pluginy powinny traktować `register` jako
publiczny kontrakt.

`api.registrationMode` informuje Plugin, dlaczego jego entry jest ładowane:

| Mode            | Meaning                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Aktywacja runtime. Rejestruje narzędzia, hooki, usługi, polecenia, trasy i inne aktywne efekty uboczne.                         |
| `discovery`     | Odkrywanie możliwości tylko do odczytu. Rejestruje dostawców i metadane; zaufany kod entry Pluginu może się załadować, ale pomija aktywne efekty uboczne. |
| `setup-only`    | Ładowanie metadanych konfiguracji kanału przez lekkie entry konfiguracji.                                                        |
| `setup-runtime` | Ładowanie konfiguracji kanału, które wymaga również entry runtime.                                                                |
| `cli-metadata`  | Tylko zbieranie metadanych poleceń CLI.                                                                                           |

Entry Pluginów, które otwierają gniazda, bazy danych, procesy robocze w tle lub długotrwałych
klientów, powinny chronić te efekty uboczne warunkiem `api.registrationMode === "full"`.
Ładowania discovery są cache’owane oddzielnie od ładowań aktywacyjnych i nie zastępują
działającego rejestru Gateway. Discovery nie aktywuje, ale nie jest wolne od importu:
OpenClaw może ewaluować zaufane entry Pluginu lub moduł Pluginu kanału, aby zbudować
snapshot. Utrzymuj górne poziomy modułów lekkie i wolne od efektów ubocznych, a klientów sieciowych,
podprocesy, listenery, odczyty poświadczeń i uruchamianie usług przenieś
za ścieżki pełnego runtime.

Typowe metody rejestracji:

| Method                                  | What it registers             |
| --------------------------------------- | ----------------------------- |
| `registerProvider`                      | Dostawca modeli (LLM)         |
| `registerChannel`                       | Kanał czatu                   |
| `registerTool`                          | Narzędzie agenta              |
| `registerHook` / `on(...)`              | Hooki cyklu życia             |
| `registerSpeechProvider`                | Zamiana tekstu na mowę / STT  |
| `registerRealtimeTranscriptionProvider` | Strumieniowe STT              |
| `registerRealtimeVoiceProvider`         | Dwukierunkowy głos realtime   |
| `registerMediaUnderstandingProvider`    | Analiza obrazów/audio         |
| `registerImageGenerationProvider`       | Generowanie obrazów           |
| `registerMusicGenerationProvider`       | Generowanie muzyki            |
| `registerVideoGenerationProvider`       | Generowanie wideo             |
| `registerWebFetchProvider`              | Dostawca pobierania / scrapingu z sieci |
| `registerWebSearchProvider`             | Wyszukiwanie w sieci          |
| `registerHttpRoute`                     | Endpoint HTTP                 |
| `registerCommand` / `registerCli`       | Polecenia CLI                 |
| `registerContextEngine`                 | Silnik kontekstu              |
| `registerService`                       | Usługa w tle                  |

Zachowanie guardów hooków dla typowanych hooków cyklu życia:

- `before_tool_call`: `{ block: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `before_tool_call`: `{ block: false }` nic nie robi i nie usuwa wcześniejszej blokady.
- `before_install`: `{ block: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `before_install`: `{ block: false }` nic nie robi i nie usuwa wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `message_sending`: `{ cancel: false }` nic nie robi i nie usuwa wcześniejszego anulowania.

Natywne uruchomienia serwera aplikacji Codex mostkują natywne zdarzenia narzędzi Codex z powrotem do tej
powierzchni hooków. Pluginy mogą blokować natywne narzędzia Codex przez `before_tool_call`,
obserwować wyniki przez `after_tool_call` i uczestniczyć w zatwierdzeniach
Codex `PermissionRequest`. Most nie przepisuje jeszcze natywnych
argumentów narzędzi Codex. Dokładna granica obsługi runtime Codex znajduje się w
[kontrakcie obsługi Codex harness v1](/pl/plugins/codex-harness#v1-support-contract).

Pełne zachowanie typowanych hooków znajdziesz w [przeglądzie SDK](/pl/plugins/sdk-overview#hook-decision-semantics).

## Powiązane

- [Tworzenie Pluginów](/pl/plugins/building-plugins) — utwórz własny Plugin
- [Pakiety Pluginów](/pl/plugins/bundles) — zgodność pakietów Codex/Claude/Cursor
- [Manifest Pluginu](/pl/plugins/manifest) — schemat manifestu
- [Rejestrowanie narzędzi](/pl/plugins/building-plugins#registering-agent-tools) — dodawanie narzędzi agenta w Pluginie
- [Wewnętrzna architektura Pluginów](/pl/plugins/architecture) — model możliwości i pipeline ładowania
- [Pluginy społeczności](/pl/plugins/community) — listy firm trzecich
