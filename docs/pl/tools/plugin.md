---
read_when:
    - Instalowanie lub konfigurowanie plugin
    - Zrozumienie zasad wykrywania i ładowania plugin
    - Praca z bundlami plugin zgodnymi z Codex/Claude
sidebarTitle: Install and Configure
summary: Instalowanie, konfigurowanie i zarządzanie plugin OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-23T10:10:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc944b53654552ca5cf6132c6ef16c71745a7bffc249daccaee40c513e04209c
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Plugins rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
narzędzia, Skills, mowę, transkrypcję realtime, głos realtime,
rozumienie mediów, generowanie obrazów, generowanie wideo, web fetch, web
search i inne. Niektóre plugin są **core** (dostarczane z OpenClaw), inne
są **zewnętrzne** (publikowane w npm przez społeczność).

## Szybki start

<Steps>
  <Step title="Sprawdź, co jest załadowane">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Zainstaluj plugin">
    ```bash
    # Z npm
    openclaw plugins install @openclaw/voice-call

    # Z lokalnego katalogu lub archiwum
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Zrestartuj Gateway">
    ```bash
    openclaw gateway restart
    ```

    Następnie skonfiguruj w `plugins.entries.\<id\>.config` w swoim pliku config.

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

Jeśli config jest nieprawidłowy, instalacja zwykle kończy się bezpieczną odmową i wskazuje
`openclaw doctor --fix`. Jedynym wyjątkiem odzyskiwania jest wąska ścieżka ponownej instalacji dołączonego plugin
dla plugin, które wybiorą opt-in do
`openclaw.install.allowInvalidConfigRecovery`.

Spakowane instalacje OpenClaw nie instalują od razu całego
drzewa zależności runtime każdego dołączonego plugin. Gdy dołączony plugin należący do OpenClaw jest aktywny z
configu plugin, starszego configu kanału albo manifestu włączonego domyślnie, start
naprawia tylko zadeklarowane zależności runtime tego plugin, zanim go zaimportuje.
Zewnętrzne plugin i niestandardowe ścieżki ładowania nadal muszą być instalowane przez
`openclaw plugins install`.

## Typy plugin

OpenClaw rozpoznaje dwa formaty plugin:

| Format     | Jak działa                                                       | Przykłady                                              |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + moduł runtime; wykonuje się w procesie  | Oficjalne plugin, pakiety npm społeczności             |
| **Bundle** | Układ zgodny z Codex/Claude/Cursor; mapowany na funkcje OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Oba pojawiają się w `openclaw plugins list`. Szczegóły bundle znajdziesz w [Plugin Bundles](/pl/plugins/bundles).

Jeśli piszesz natywny plugin, zacznij od [Building Plugins](/pl/plugins/building-plugins)
i [Plugin SDK Overview](/pl/plugins/sdk-overview).

## Oficjalne plugin

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

  <Accordion title="Plugin pamięci">
    - `memory-core` — dołączone wyszukiwanie pamięci (domyślnie przez `plugins.slots.memory`)
    - `memory-lancedb` — instalowana na żądanie pamięć długoterminowa z auto-recall/capture (ustaw `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Dostawcy mowy (domyślnie włączeni)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Inne">
    - `browser` — dołączony plugin Browser dla narzędzia browser, CLI `openclaw browser`, metody gateway `browser.request`, runtime browser i domyślnej usługi sterowania Browser (domyślnie włączony; wyłącz przed zastąpieniem)
    - `copilot-proxy` — most VS Code Copilot Proxy (domyślnie wyłączony)
  </Accordion>
</AccordionGroup>

Szukasz plugin zewnętrznych? Zobacz [Community Plugins](/pl/plugins/community).

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

| Pole             | Opis                                                      |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Główny przełącznik (domyślnie: `true`)                    |
| `allow`          | Lista dozwolonych plugin (opcjonalna)                     |
| `deny`           | Lista odmów plugin (opcjonalna; deny ma pierwszeństwo)    |
| `load.paths`     | Dodatkowe pliki/katalogi plugin                           |
| `slots`          | Selektory wyłącznych slotów (np. `memory`, `contextEngine`) |
| `entries.\<id\>` | Przełączniki + config per plugin                          |

Zmiany configu **wymagają restartu Gatewaya**. Jeśli Gateway działa z obserwacją configu
+ restartem w procesie (domyślna ścieżka `openclaw gateway`), ten
restart zwykle jest wykonywany automatycznie chwilę po zapisaniu configu.

<Accordion title="Stany plugin: disabled vs missing vs invalid">
  - **Disabled**: plugin istnieje, ale reguły włączania go wyłączyły. Config jest zachowywany.
  - **Missing**: config odwołuje się do identyfikatora plugin, którego wykrywanie nie znalazło.
  - **Invalid**: plugin istnieje, ale jego config nie pasuje do zadeklarowanego schema.
</Accordion>

## Wykrywanie i pierwszeństwo

OpenClaw skanuje plugin w tej kolejności (wygrywa pierwsze dopasowanie):

<Steps>
  <Step title="Ścieżki configu">
    `plugins.load.paths` — jawne ścieżki plików lub katalogów.
  </Step>

  <Step title="Plugin workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` i `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin globalne">
    `~/.openclaw/<plugin-root>/*.ts` i `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Dołączone plugin">
    Dostarczane z OpenClaw. Wiele z nich jest domyślnie włączonych (dostawcy modeli, mowa).
    Inne wymagają jawnego włączenia.
  </Step>
</Steps>

### Zasady włączania

- `plugins.enabled: false` wyłącza wszystkie plugin
- `plugins.deny` zawsze ma pierwszeństwo przed allow
- `plugins.entries.\<id\>.enabled: false` wyłącza ten plugin
- Plugin pochodzące z workspace są **domyślnie wyłączone** (muszą zostać jawnie włączone)
- Dołączone plugin podążają za wbudowanym zbiorem domyślnie włączonych, chyba że zostaną nadpisane
- Wyłączne sloty mogą wymusić włączenie wybranego plugin dla tego slotu

## Sloty plugin (wyłączne kategorie)

Niektóre kategorie są wyłączne (tylko jedna aktywna naraz):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // lub "none", aby wyłączyć
      contextEngine: "legacy", // lub identyfikator plugin
    },
  },
}
```

| Slot            | Co kontroluje           | Domyślnie           |
| --------------- | ----------------------- | ------------------- |
| `memory`        | Aktywny plugin pamięci  | `memory-core`       |
| `contextEngine` | Aktywny silnik kontekstu | `legacy` (wbudowany) |

## Dokumentacja CLI

```bash
openclaw plugins list                       # zwięzły spis
openclaw plugins list --enabled            # tylko załadowane plugin
openclaw plugins list --verbose            # szczegółowe linie per plugin
openclaw plugins list --json               # spis czytelny dla maszyn
openclaw plugins inspect <id>              # szczegóły
openclaw plugins inspect <id> --json       # czytelne dla maszyn
openclaw plugins inspect --all             # tabela dla całej floty
openclaw plugins info <id>                 # alias inspect
openclaw plugins doctor                    # diagnostyka

openclaw plugins install <package>         # instalacja (najpierw ClawHub, potem npm)
openclaw plugins install clawhub:<pkg>     # instalacja tylko z ClawHub
openclaw plugins install <spec> --force    # nadpisuje istniejącą instalację
openclaw plugins install <path>            # instalacja z lokalnej ścieżki
openclaw plugins install -l <path>         # link (bez kopiowania) do developmentu
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # zapisuje dokładną rozwiązaną specyfikację npm
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # aktualizacja jednego plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # aktualizacja wszystkich
openclaw plugins uninstall <id>          # usuwa rekordy configu/instalacji
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Dołączone plugin są dostarczane z OpenClaw. Wiele z nich jest domyślnie włączonych (na przykład
dołączeni dostawcy modeli, dołączeni dostawcy mowy i dołączony plugin
Browser). Inne dołączone plugin nadal wymagają `openclaw plugins enable <id>`.

`--force` nadpisuje istniejący zainstalowany plugin lub hook pack na miejscu. Użyj
`openclaw plugins update <id-or-npm-spec>` do rutynowych aktualizacji śledzonych plugin npm.
Nie jest obsługiwane z `--link`, które ponownie wykorzystuje ścieżkę źródłową zamiast
kopiować nad zarządzany cel instalacji.

`openclaw plugins update <id-or-npm-spec>` dotyczy śledzonych instalacji. Przekazanie
specyfikacji pakietu npm z dist-tag lub dokładną wersją rozwiązuje nazwę pakietu
z powrotem do śledzonego rekordu plugin i zapisuje nową specyfikację dla przyszłych aktualizacji.
Przekazanie nazwy pakietu bez wersji przenosi dokładnie przypiętą instalację z powrotem do
domyślnej linii wydań rejestru. Jeśli zainstalowany plugin npm już pasuje
do rozwiązanej wersji i zapisanej tożsamości artefaktu, OpenClaw pomija aktualizację
bez pobierania, ponownej instalacji ani przepisywania configu.

`--pin` dotyczy tylko npm. Nie jest obsługiwane z `--marketplace`, ponieważ
instalacje marketplace zapisują metadane źródła marketplace zamiast specyfikacji npm.

`--dangerously-force-unsafe-install` to break-glass override dla fałszywie
dodatnich wyników wbudowanego skanera niebezpiecznego kodu. Pozwala kontynuować instalacje plugin
i aktualizacje plugin mimo wbudowanych ustaleń `critical`, ale nadal
nie omija blokad polityki plugin `before_install` ani blokowania przy błędach skanowania.

Ta flaga CLI dotyczy tylko przepływów instalacji/aktualizacji plugin. Instalacje zależności Skills
oparte na Gatewayu używają zamiast tego odpowiedniego nadpisania żądania `dangerouslyForceUnsafeInstall`, podczas gdy `openclaw skills install` pozostaje oddzielnym przepływem pobierania/instalacji Skills z ClawHub.

Zgodne bundlery uczestniczą w tym samym przepływie plugin list/inspect/enable/disable.
Obecna obsługa runtime obejmuje bundle Skills, command-skills Claude,
domyślne ustawienia Claude `settings.json`, domyślne serwery Claude `.lsp.json` i deklarowane w manifeście `lspServers`, command-skills Cursor oraz zgodne katalogi hook Codex.

`openclaw plugins inspect <id>` raportuje także wykryte możliwości bundle oraz
obsługiwane lub nieobsługiwane wpisy serwerów MCP i LSP dla plugin opartych na bundle.

Źródłami Marketplace mogą być nazwa znanego marketplace Claude z
`~/.claude/plugins/known_marketplaces.json`, lokalny katalog główny marketplace lub
ścieżka `marketplace.json`, skrót GitHub typu `owner/repo`, URL repozytorium GitHub
albo URL git. Dla zdalnych marketplace wpisy plugin muszą pozostawać wewnątrz
sklonowanego repozytorium marketplace i używać tylko źródeł opartych na ścieżkach względnych.

Pełne szczegóły znajdziesz w [dokumentacji CLI `openclaw plugins`](/pl/cli/plugins).

## Przegląd API plugin

Natywne plugin eksportują obiekt entry udostępniający `register(api)`. Starsze
plugin mogą nadal używać `activate(api)` jako starszego aliasu, ale nowe plugin powinny
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
plugin. Loader nadal używa fallbacku do `activate(api)` dla starszych plugin,
ale dołączone plugin i nowe zewnętrzne plugin powinny traktować `register` jako
kontrakt publiczny.

Typowe metody rejestracji:

| Metoda                                  | Co rejestruje               |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Dostawca modelu (LLM)       |
| `registerChannel`                       | Kanał czatu                 |
| `registerTool`                          | Narzędzie agenta            |
| `registerHook` / `on(...)`              | Hooki cyklu życia           |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | Streaming STT               |
| `registerRealtimeVoiceProvider`         | Dwukierunkowy głos realtime |
| `registerMediaUnderstandingProvider`    | Analiza obrazu/audio        |
| `registerImageGenerationProvider`       | Generowanie obrazów         |
| `registerMusicGenerationProvider`       | Generowanie muzyki          |
| `registerVideoGenerationProvider`       | Generowanie wideo           |
| `registerWebFetchProvider`              | Dostawca web fetch / scrape |
| `registerWebSearchProvider`             | Wyszukiwanie webowe         |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Komendy CLI                 |
| `registerContextEngine`                 | Silnik kontekstu            |
| `registerService`                       | Usługa w tle                |

Zachowanie ochrony hook dla typowanych hooków cyklu życia:

- `before_tool_call`: `{ block: true }` jest terminalne; handlery o niższym priorytecie są pomijane.
- `before_tool_call`: `{ block: false }` nic nie robi i nie usuwa wcześniejszej blokady.
- `before_install`: `{ block: true }` jest terminalne; handlery o niższym priorytecie są pomijane.
- `before_install`: `{ block: false }` nic nie robi i nie usuwa wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest terminalne; handlery o niższym priorytecie są pomijane.
- `message_sending`: `{ cancel: false }` nic nie robi i nie usuwa wcześniejszego anulowania.

Pełne zachowanie typowanych hooków znajdziesz w [SDK Overview](/pl/plugins/sdk-overview#hook-decision-semantics).

## Powiązane

- [Building Plugins](/pl/plugins/building-plugins) — twórz własny plugin
- [Plugin Bundles](/pl/plugins/bundles) — zgodność bundli Codex/Claude/Cursor
- [Plugin Manifest](/pl/plugins/manifest) — schema manifestu
- [Registering Tools](/pl/plugins/building-plugins#registering-agent-tools) — dodawanie narzędzi agenta w plugin
- [Plugin Internals](/pl/plugins/architecture) — model capabilities i potok ładowania
- [Community Plugins](/pl/plugins/community) — listy zewnętrzne
