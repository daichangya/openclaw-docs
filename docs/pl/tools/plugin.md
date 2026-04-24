---
read_when:
    - Instalowanie lub konfigurowanie pluginów
    - Zrozumienie zasad wykrywania i ładowania pluginów
    - Praca z pakietami pluginów zgodnymi z Codex/Claude
sidebarTitle: Install and Configure
summary: Instaluj, konfiguruj i zarządzaj pluginami OpenClaw
title: Pluginy
x-i18n:
    generated_at: "2026-04-24T15:22:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 947bb7ffc13280fd63f79bb68cb18a37c6614144b91a83afd38e5ac3c5187aed
    source_path: tools/plugin.md
    workflow: 15
---

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
agent harnesses, narzędzia, Skills, mowę, transkrypcję w czasie rzeczywistym, głos
w czasie rzeczywistym, rozumienie mediów, generowanie obrazów, generowanie
wideo, pobieranie z sieci, wyszukiwanie w sieci i nie tylko. Niektóre pluginy są **core** (dostarczane z OpenClaw), a inne
są **zewnętrzne** (publikowane w npm przez społeczność).

## Szybki start

<Steps>
  <Step title="Zobacz, co jest załadowane">
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

  <Step title="Uruchom ponownie Gateway">
    ```bash
    openclaw gateway restart
    ```

    Następnie skonfiguruj w `plugins.entries.\<id\>.config` w swoim pliku konfiguracyjnym.

  </Step>
</Steps>

Jeśli wolisz sterowanie natywne dla czatu, włącz `commands.plugins: true` i użyj:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Ścieżka instalacji używa tego samego resolvera co CLI: lokalna ścieżka/archiwum, jawne
`clawhub:<pkg>` lub zwykła specyfikacja pakietu (najpierw ClawHub, potem fallback do npm).

Jeśli konfiguracja jest nieprawidłowa, instalacja zwykle kończy się bezpieczną odmową i wskazuje
`openclaw doctor --fix`. Jedynym wyjątkiem odzyskiwania jest wąska ścieżka
ponownej instalacji pluginu dostarczanego w pakiecie dla pluginów, które korzystają z
`openclaw.install.allowInvalidConfigRecovery`.

Instalacje OpenClaw dostarczane jako pakiet nie instalują od razu całego drzewa zależności
uruchomieniowych każdego dołączonego pluginu. Gdy dołączony plugin należący do OpenClaw jest aktywny przez
konfigurację pluginu, starszą konfigurację kanału lub manifest domyślnie włączony,
uruchamianie naprawia tylko zadeklarowane zależności uruchomieniowe tego pluginu przed jego importem.
Zewnętrzne pluginy i niestandardowe ścieżki ładowania nadal muszą być instalowane przez
`openclaw plugins install`.

## Typy pluginów

OpenClaw rozpoznaje dwa formaty pluginów:

| Format     | Jak to działa                                                      | Przykłady                                              |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + moduł uruchomieniowy; wykonuje się w procesie | Oficjalne pluginy, pakiety npm społeczności            |
| **Bundle** | Układ zgodny z Codex/Claude/Cursor; mapowany na funkcje OpenClaw   | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Oba pojawiają się w `openclaw plugins list`. Zobacz [Plugin Bundles](/pl/plugins/bundles), aby poznać szczegóły pakietów.

Jeśli piszesz natywny plugin, zacznij od [Building Plugins](/pl/plugins/building-plugins)
oraz [Plugin SDK Overview](/pl/plugins/sdk-overview).

## Oficjalne pluginy

### Instalowalne (npm)

| Plugin          | Pakiet                 | Dokumentacja                        |
| --------------- | ---------------------- | ----------------------------------- |
| Matrix          | `@openclaw/matrix`     | [Matrix](/pl/channels/matrix)          |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/pl/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/pl/channels/nostr)            |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/pl/plugins/voice-call)   |
| Zalo            | `@openclaw/zalo`       | [Zalo](/pl/channels/zalo)              |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/pl/plugins/zalouser)  |

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
    - `browser` — dołączony plugin przeglądarki dla narzędzia browser, CLI `openclaw browser`, metody Gateway `browser.request`, środowiska uruchomieniowego przeglądarki i domyślnej usługi sterowania przeglądarką (domyślnie włączony; wyłącz go przed zastąpieniem)
    - `copilot-proxy` — most VS Code Copilot Proxy (domyślnie wyłączony)
  </Accordion>
</AccordionGroup>

Szukasz pluginów firm trzecich? Zobacz [Community Plugins](/pl/plugins/community).

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
| `allow`          | Lista dozwolonych pluginów (opcjonalnie)                  |
| `deny`           | Lista zablokowanych pluginów (opcjonalnie; `deny` wygrywa) |
| `load.paths`     | Dodatkowe pliki/katalogi pluginów                         |
| `slots`          | Selektory wyłącznych slotów (np. `memory`, `contextEngine`) |
| `entries.\<id\>` | Przełączniki i konfiguracja dla poszczególnych pluginów   |

Zmiany konfiguracji **wymagają ponownego uruchomienia Gateway**. Jeśli Gateway działa z
obserwowaniem konfiguracji i włączonym restartem w procesie (domyślna ścieżka `openclaw gateway`),
to ponowne uruchomienie jest zwykle wykonywane automatycznie chwilę po zapisaniu konfiguracji.
Nie ma obsługiwanej ścieżki hot-reload dla natywnego kodu uruchomieniowego pluginów ani hooków
cyklu życia; uruchom ponownie proces Gateway, który obsługuje aktywny kanał, zanim
zaczniesz oczekiwać, że zaktualizowany kod `register(api)`, hooki `api.on(...)`, narzędzia, usługi lub
hooki dostawcy/środowiska uruchomieniowego zaczną działać.

`openclaw plugins list` to lokalny snapshot CLI/konfiguracji. Plugin oznaczony tam jako `loaded`
oznacza, że plugin można wykryć i załadować z konfiguracji/plików widocznych dla
tego wywołania CLI. Nie dowodzi to, że już działający zdalny proces potomny Gateway
został ponownie uruchomiony do tego samego kodu pluginu. W konfiguracjach VPS/kontenerów z procesami
opakowującymi wysyłaj restarty do właściwego procesu `openclaw gateway run` lub użyj
`openclaw gateway restart` wobec działającego Gateway.

<Accordion title="Stany pluginu: wyłączony vs brakujący vs nieprawidłowy">
  - **Wyłączony**: plugin istnieje, ale reguły włączania go wyłączyły. Konfiguracja jest zachowywana.
  - **Brakujący**: konfiguracja odwołuje się do identyfikatora pluginu, którego wykrywanie nie znalazło.
  - **Nieprawidłowy**: plugin istnieje, ale jego konfiguracja nie odpowiada zadeklarowanemu schematowi.
</Accordion>

## Wykrywanie i pierwszeństwo

OpenClaw skanuje pluginy w tej kolejności (pierwsze dopasowanie wygrywa):

<Steps>
  <Step title="Ścieżki konfiguracji">
    `plugins.load.paths` — jawne ścieżki do pliku lub katalogu.
  </Step>

  <Step title="Pluginy workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` i `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Globalne pluginy">
    `~/.openclaw/<plugin-root>/*.ts` i `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Dołączone pluginy">
    Dostarczane z OpenClaw. Wiele z nich jest domyślnie włączonych (dostawcy modeli, mowa).
    Inne wymagają jawnego włączenia.
  </Step>
</Steps>

### Reguły włączania

- `plugins.enabled: false` wyłącza wszystkie pluginy
- `plugins.deny` zawsze wygrywa nad allow
- `plugins.entries.\<id\>.enabled: false` wyłącza ten plugin
- Pluginy pochodzące z workspace są **domyślnie wyłączone** (muszą zostać jawnie włączone)
- Dołączone pluginy stosują wbudowany domyślny zestaw włączonych, chyba że zostanie nadpisany
- Wyłączne sloty mogą wymusić włączenie pluginu wybranego dla tego slotu
- Niektóre dołączone pluginy opt-in są włączane automatycznie, gdy konfiguracja wskazuje
  powierzchnię należącą do pluginu, taką jak odwołanie do modelu dostawcy, konfiguracja kanału lub
  środowisko uruchomieniowe harness
- Trasy Codex z rodziny OpenAI zachowują oddzielne granice pluginów:
  `openai-codex/*` należy do pluginu OpenAI, podczas gdy dołączony plugin
  serwera aplikacji Codex jest wybierany przez `embeddedHarness.runtime: "codex"` lub starsze
  odwołania do modeli `codex/*`

## Rozwiązywanie problemów z Runtime Hooks

Jeśli plugin pojawia się w `plugins list`, ale efekty uboczne `register(api)` lub hooki
nie działają w aktywnym ruchu czatu, sprawdź najpierw te elementy:

- Uruchom `openclaw gateway status --deep --require-rpc` i potwierdź, że aktywny
  URL Gateway, profil, ścieżka konfiguracji i proces to te, które edytujesz.
- Uruchom ponownie aktywny Gateway po zmianach instalacji/konfiguracji/kodu pluginu. W kontenerach
  opakowujących PID 1 może być tylko supervisorem; uruchom ponownie lub wyślij sygnał do potomnego
  procesu `openclaw gateway run`.
- Użyj `openclaw plugins inspect <id> --json`, aby potwierdzić rejestracje hooków i
  diagnostykę. Niedołączone hooki konwersacji, takie jak `llm_input`,
  `llm_output` i `agent_end`, wymagają
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Do przełączania modeli preferuj `before_model_resolve`. Uruchamia się przed
  rozstrzygnięciem modelu dla tur agenta; `llm_output` uruchamia się dopiero po tym, jak próba modelu
  wygeneruje odpowiedź asystenta.
- Aby uzyskać dowód skutecznego modelu sesji, użyj `openclaw sessions` lub
  powierzchni sesji/statusu Gateway, a podczas debugowania ładunków dostawcy uruchom
  Gateway z `--raw-stream --raw-stream-path <path>`.

## Sloty pluginów (wyłączne kategorie)

Niektóre kategorie są wyłączne (w danym czasie aktywna może być tylko jedna):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // lub "none", aby wyłączyć
      contextEngine: "legacy", // lub id pluginu
    },
  },
}
```

| Slot            | Co kontroluje          | Domyślnie           |
| --------------- | ---------------------- | ------------------- |
| `memory`        | Aktywny plugin pamięci | `memory-core`       |
| `contextEngine` | Aktywny silnik kontekstu | `legacy` (wbudowany) |

## Dokumentacja CLI

```bash
openclaw plugins list                       # zwarta lista zasobów
openclaw plugins list --enabled            # tylko załadowane pluginy
openclaw plugins list --verbose            # wiersze ze szczegółami dla każdego pluginu
openclaw plugins list --json               # lista zasobów do odczytu maszynowego
openclaw plugins inspect <id>              # szczegóły szczegółowe
openclaw plugins inspect <id> --json       # format do odczytu maszynowego
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
openclaw plugins install <spec> --pin      # zapisanie dokładnej rozstrzygniętej specyfikacji npm
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # aktualizacja jednego pluginu
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # aktualizacja wszystkich
openclaw plugins uninstall <id>          # usunięcie rekordów konfiguracji/instalacji
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Dołączone pluginy są dostarczane z OpenClaw. Wiele z nich jest domyślnie włączonych (na przykład
dołączoni dostawcy modeli, dołączoni dostawcy mowy oraz dołączony plugin
browser). Inne dołączone pluginy nadal wymagają `openclaw plugins enable <id>`.

`--force` nadpisuje istniejący zainstalowany plugin lub pakiet hooków na miejscu. Do
rutynowych aktualizacji śledzonych pluginów npm używaj
`openclaw plugins update <id-or-npm-spec>`. Ta opcja nie jest obsługiwana z `--link`, które ponownie używa ścieżki źródłowej zamiast
kopiowania do zarządzanego celu instalacji.

Gdy `plugins.allow` jest już ustawione, `openclaw plugins install` dodaje
identyfikator zainstalowanego pluginu do tej listy dozwolonych przed jego włączeniem, dzięki czemu instalacje są
natychmiast możliwe do załadowania po restarcie.

`openclaw plugins update <id-or-npm-spec>` dotyczy śledzonych instalacji. Przekazanie
specyfikacji pakietu npm z dist-tag lub dokładną wersją rozwiązuje nazwę pakietu
z powrotem do śledzonego rekordu pluginu i zapisuje nową specyfikację do przyszłych aktualizacji.
Przekazanie nazwy pakietu bez wersji przenosi dokładnie przypiętą instalację z powrotem na
domyślną linię wydań rejestru. Jeśli zainstalowany plugin npm już odpowiada
rozwiązanej wersji i zapisanej tożsamości artefaktu, OpenClaw pomija aktualizację
bez pobierania, ponownej instalacji ani przepisywania konfiguracji.

`--pin` dotyczy tylko npm. Nie jest obsługiwane z `--marketplace`, ponieważ
instalacje z marketplace zachowują metadane źródła marketplace zamiast specyfikacji npm.

`--dangerously-force-unsafe-install` to awaryjne obejście typu break-glass dla fałszywie
pozytywnych wyników wbudowanego skanera niebezpiecznego kodu. Pozwala kontynuować instalacje pluginów
i aktualizacje pluginów mimo wbudowanych ustaleń `critical`, ale nadal
nie omija blokad zasad pluginu `before_install` ani blokowania przy błędzie skanowania.

Ta flaga CLI dotyczy tylko przepływów instalacji/aktualizacji pluginów. Instalacje zależności Skills
realizowane przez Gateway używają zamiast tego odpowiadającego nadpisania żądania
`dangerouslyForceUnsafeInstall`, podczas gdy `openclaw skills install` pozostaje oddzielnym przepływem
pobierania/instalacji Skills z ClawHub.

Zgodne pakiety uczestniczą w tym samym przepływie list/inspect/enable/disable pluginów.
Obecna obsługa uruchomieniowa obejmuje bundle Skills, Claude command-skills,
domyślne ustawienia Claude `settings.json`, domyślne wpisy Claude `.lsp.json` i deklarowane w manifeście
`lspServers`, Cursor command-skills oraz zgodne katalogi hooków Codex.

`openclaw plugins inspect <id>` raportuje również wykryte możliwości pakietu oraz
obsługiwane lub nieobsługiwane wpisy serwerów MCP i LSP dla pluginów opartych na pakietach.

Źródła marketplace mogą być nazwą znanego marketplace Claude z
`~/.claude/plugins/known_marketplaces.json`, lokalnym katalogiem głównym marketplace lub
ścieżką `marketplace.json`, skrótem GitHub takim jak `owner/repo`, adresem URL repozytorium GitHub
albo adresem URL git. W przypadku zdalnych marketplace wpisy pluginów muszą pozostać wewnątrz
sklonowanego repozytorium marketplace i używać wyłącznie względnych źródeł ścieżek.

Pełne szczegóły znajdziesz w [dokumentacji CLI `openclaw plugins`](/pl/cli/plugins).

## Przegląd API pluginów

Natywne pluginy eksportują obiekt wejściowy, który udostępnia `register(api)`. Starsze
pluginy mogą nadal używać `activate(api)` jako starszego aliasu, ale nowe pluginy powinny
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

OpenClaw ładuje obiekt wejściowy i wywołuje `register(api)` podczas aktywacji
pluginu. Loader nadal wraca do `activate(api)` dla starszych pluginów,
ale dołączone pluginy i nowe zewnętrzne pluginy powinny traktować `register` jako
publiczny kontrakt.

Typowe metody rejestracji:

| Metoda                                  | Co rejestruje               |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Dostawca modeli (LLM)       |
| `registerChannel`                       | Kanał czatu                 |
| `registerTool`                          | Narzędzie agenta            |
| `registerHook` / `on(...)`              | Hooki cyklu życia           |
| `registerSpeechProvider`                | Zamiana tekstu na mowę / STT |
| `registerRealtimeTranscriptionProvider` | Strumieniowe STT            |
| `registerRealtimeVoiceProvider`         | Dwukierunkowy głos w czasie rzeczywistym |
| `registerMediaUnderstandingProvider`    | Analiza obrazu/dźwięku      |
| `registerImageGenerationProvider`       | Generowanie obrazów         |
| `registerMusicGenerationProvider`       | Generowanie muzyki          |
| `registerVideoGenerationProvider`       | Generowanie wideo           |
| `registerWebFetchProvider`              | Dostawca pobierania / scrapowania z sieci |
| `registerWebSearchProvider`             | Wyszukiwanie w sieci        |
| `registerHttpRoute`                     | Punkt końcowy HTTP          |
| `registerCommand` / `registerCli`       | Polecenia CLI              |
| `registerContextEngine`                 | Silnik kontekstu            |
| `registerService`                       | Usługa działająca w tle     |

Zachowanie strażników hooków dla typowanych hooków cyklu życia:

- `before_tool_call`: `{ block: true }` jest terminalne; handlery o niższym priorytecie są pomijane.
- `before_tool_call`: `{ block: false }` nic nie robi i nie usuwa wcześniejszej blokady.
- `before_install`: `{ block: true }` jest terminalne; handlery o niższym priorytecie są pomijane.
- `before_install`: `{ block: false }` nic nie robi i nie usuwa wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest terminalne; handlery o niższym priorytecie są pomijane.
- `message_sending`: `{ cancel: false }` nic nie robi i nie usuwa wcześniejszego anulowania.

Pełne informacje o zachowaniu typowanych hooków znajdziesz w [SDK Overview](/pl/plugins/sdk-overview#hook-decision-semantics).

## Powiązane

- [Building Plugins](/pl/plugins/building-plugins) — utwórz własny plugin
- [Plugin Bundles](/pl/plugins/bundles) — zgodność pakietów Codex/Claude/Cursor
- [Plugin Manifest](/pl/plugins/manifest) — schemat manifestu
- [Registering Tools](/pl/plugins/building-plugins#registering-agent-tools) — dodawanie narzędzi agenta w pluginie
- [Plugin Internals](/pl/plugins/architecture) — model możliwości i pipeline ładowania
- [Community Plugins](/pl/plugins/community) — listy pluginów firm trzecich
