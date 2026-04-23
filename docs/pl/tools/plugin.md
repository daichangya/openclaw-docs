---
read_when:
    - Instalowanie lub konfigurowanie pluginów
    - Zrozumienie zasad wykrywania i ładowania pluginów
    - Praca z pakietami pluginów zgodnymi z Codex/Claude
sidebarTitle: Install and Configure
summary: Instaluj, konfiguruj i zarządzaj pluginami OpenClaw
title: Pluginy
x-i18n:
    generated_at: "2026-04-23T13:58:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63aa1b5ed9e3aaa2117b78137a457582b00ea47d94af7da3780ddae38e8e3665
    source_path: tools/plugin.md
    workflow: 15
---

# Pluginy

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
narzędzia, Skills, mowę, transkrypcję w czasie rzeczywistym, głos w czasie rzeczywistym,
rozumienie multimediów, generowanie obrazów, generowanie wideo, pobieranie z sieci, wyszukiwanie w sieci
i nie tylko. Niektóre pluginy są **core** (dostarczane z OpenClaw), a inne
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
`clawhub:<pkg>` lub zwykła specyfikacja pakietu (najpierw ClawHub, potem awaryjnie npm).

Jeśli konfiguracja jest nieprawidłowa, instalacja zwykle kończy się bezpieczną odmową i kieruje do
`openclaw doctor --fix`. Jedynym wyjątkiem odzyskiwania jest wąska ścieżka
ponownej instalacji dostarczanego pluginu dla pluginów, które włączają
`openclaw.install.allowInvalidConfigRecovery`.

Spakowane instalacje OpenClaw nie instalują z wyprzedzeniem całego drzewa zależności wykonawczych
każdego dostarczanego pluginu. Gdy dostarczany plugin należący do OpenClaw jest aktywny na podstawie
konfiguracji pluginu, starszej konfiguracji kanału lub manifestu domyślnie włączonego, uruchamianie
naprawia tylko zadeklarowane zależności wykonawcze tego pluginu przed jego zaimportowaniem.
Pluginy zewnętrzne i niestandardowe ścieżki ładowania nadal muszą być instalowane przez
`openclaw plugins install`.

## Typy pluginów

OpenClaw rozpoznaje dwa formaty pluginów:

| Format     | Jak to działa                                                    | Przykłady                                              |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + moduł wykonawczy; działa w tym samym procesie | Oficjalne pluginy, pakiety npm społeczności            |
| **Bundle** | Układ zgodny z Codex/Claude/Cursor; mapowany na funkcje OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Oba są widoczne w `openclaw plugins list`. Szczegóły pakietów znajdziesz w [Pakiety pluginów](/pl/plugins/bundles).

Jeśli tworzysz natywny plugin, zacznij od [Tworzenie pluginów](/pl/plugins/building-plugins)
oraz [Przegląd Plugin SDK](/pl/plugins/sdk-overview).

## Oficjalne pluginy

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
    - `memory-core` — dostarczane wyszukiwanie w pamięci (domyślnie przez `plugins.slots.memory`)
    - `memory-lancedb` — instalowana na żądanie pamięć długoterminowa z automatycznym przywoływaniem/przechwytywaniem (ustaw `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Dostawcy mowy (domyślnie włączeni)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Inne">
    - `browser` — dostarczany plugin przeglądarki dla narzędzia przeglądarki, CLI `openclaw browser`, metody Gateway `browser.request`, środowiska wykonawczego przeglądarki oraz domyślnej usługi sterowania przeglądarką (domyślnie włączony; wyłącz go przed zastąpieniem)
    - `copilot-proxy` — most VS Code Copilot Proxy (domyślnie wyłączony)
  </Accordion>
</AccordionGroup>

Szukasz pluginów firm trzecich? Zobacz [Pluginy społeczności](/pl/plugins/community).

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
| `deny`           | Lista blokowanych pluginów (opcjonalnie; blokada wygrywa) |
| `load.paths`     | Dodatkowe pliki/katalogi pluginów                         |
| `slots`          | Selektory wyłącznych slotów (np. `memory`, `contextEngine`) |
| `entries.\<id\>` | Przełączniki i konfiguracja dla poszczególnych pluginów   |

Zmiany konfiguracji **wymagają ponownego uruchomienia Gateway**. Jeśli Gateway działa z obserwowaniem konfiguracji
i włączonym restartem w tym samym procesie (domyślna ścieżka `openclaw gateway`), ten
restart zwykle jest wykonywany automatycznie chwilę po zapisaniu konfiguracji.

<Accordion title="Stany pluginu: wyłączony vs brakujący vs nieprawidłowy">
  - **Wyłączony**: plugin istnieje, ale reguły włączania go wyłączyły. Konfiguracja jest zachowywana.
  - **Brakujący**: konfiguracja odwołuje się do identyfikatora pluginu, którego wykrywanie nie znalazło.
  - **Nieprawidłowy**: plugin istnieje, ale jego konfiguracja nie pasuje do zadeklarowanego schematu.
</Accordion>

## Wykrywanie i pierwszeństwo

OpenClaw skanuje pluginy w tej kolejności (wygrywa pierwsze dopasowanie):

<Steps>
  <Step title="Ścieżki konfiguracji">
    `plugins.load.paths` — jawne ścieżki do pliku lub katalogu.
  </Step>

  <Step title="Pluginy obszaru roboczego">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` i `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Globalne pluginy">
    `~/.openclaw/<plugin-root>/*.ts` i `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Dostarczane pluginy">
    Dostarczane z OpenClaw. Wiele z nich jest domyślnie włączonych (dostawcy modeli, mowy).
    Inne wymagają jawnego włączenia.
  </Step>
</Steps>

### Reguły włączania

- `plugins.enabled: false` wyłącza wszystkie pluginy
- `plugins.deny` zawsze ma pierwszeństwo przed allow
- `plugins.entries.\<id\>.enabled: false` wyłącza ten plugin
- Pluginy pochodzące z obszaru roboczego są **domyślnie wyłączone** (muszą zostać jawnie włączone)
- Dostarczane pluginy stosują wbudowany zbiór domyślnie włączonych, chyba że zostanie nadpisany
- Wyłączne sloty mogą wymusić włączenie pluginu wybranego dla tego slotu

## Sloty pluginów (wyłączne kategorie)

Niektóre kategorie są wyłączne (tylko jedna może być aktywna naraz):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // lub "none", aby wyłączyć
      contextEngine: "legacy", // lub identyfikator pluginu
    },
  },
}
```

| Slot            | Co kontroluje          | Domyślnie           |
| --------------- | ---------------------- | ------------------- |
| `memory`        | Active Memory plugin   | `memory-core`       |
| `contextEngine` | Aktywny silnik kontekstu | `legacy` (wbudowany) |

## Dokumentacja CLI

```bash
openclaw plugins list                       # skrócony spis
openclaw plugins list --enabled            # tylko załadowane pluginy
openclaw plugins list --verbose            # szczegółowe wiersze dla każdego pluginu
openclaw plugins list --json               # spis do odczytu maszynowego
openclaw plugins inspect <id>              # szczegółowe informacje
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
openclaw plugins uninstall <id>          # usunięcie wpisów konfiguracji/instalacji
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Dostarczane pluginy są dołączane do OpenClaw. Wiele z nich jest domyślnie włączonych (na przykład
dostarczani dostawcy modeli, dostarczani dostawcy mowy oraz dostarczany plugin
przeglądarki). Inne dostarczane pluginy nadal wymagają `openclaw plugins enable <id>`.

`--force` nadpisuje istniejący zainstalowany plugin lub pakiet hooków w miejscu. Użyj
`openclaw plugins update <id-or-npm-spec>` do rutynowych aktualizacji śledzonych pluginów
npm. Nie jest to obsługiwane z `--link`, które ponownie wykorzystuje ścieżkę źródłową zamiast
kopiowania do zarządzanego celu instalacji.

Gdy `plugins.allow` jest już ustawione, `openclaw plugins install` dodaje
identyfikator zainstalowanego pluginu do tej listy dozwolonych przed jego włączeniem, dzięki czemu instalacje są
natychmiast gotowe do załadowania po restarcie.

`openclaw plugins update <id-or-npm-spec>` dotyczy śledzonych instalacji. Przekazanie
specyfikacji pakietu npm z dist-tagiem lub dokładną wersją rozwiązuje nazwę pakietu
z powrotem do śledzonego rekordu pluginu i zapisuje nową specyfikację na potrzeby przyszłych aktualizacji.
Przekazanie nazwy pakietu bez wersji przenosi instalację przypiętą do dokładnej wersji z powrotem na
domyślną linię wydań rejestru. Jeśli zainstalowany plugin npm już odpowiada
rozstrzygniętej wersji i zapisanej tożsamości artefaktu, OpenClaw pomija aktualizację
bez pobierania, ponownej instalacji ani przepisywania konfiguracji.

`--pin` dotyczy tylko npm. Nie jest obsługiwane z `--marketplace`, ponieważ
instalacje z marketplace zapisują metadane źródła marketplace zamiast specyfikacji npm.

`--dangerously-force-unsafe-install` to awaryjne obejście dla fałszywie dodatnich wyników
wbudowanego skanera niebezpiecznego kodu. Pozwala kontynuować instalacje i aktualizacje
pluginów mimo wbudowanych ustaleń `critical`, ale nadal
nie omija blokad polityki pluginu `before_install` ani blokowania z powodu niepowodzenia skanowania.

Ta flaga CLI dotyczy tylko przepływów instalacji/aktualizacji pluginów. Instalacje zależności Skills
obsługiwane przez Gateway używają zamiast tego odpowiadającego nadpisania żądania `dangerouslyForceUnsafeInstall`, podczas gdy
`openclaw skills install` pozostaje osobnym przepływem pobierania/instalacji Skills z ClawHub.

Zgodne pakiety uczestniczą w tym samym przepływie list/inspect/enable/disable pluginów.
Obecna obsługa środowiska wykonawczego obejmuje bundle Skills, command-skills Claude,
domyślne ustawienia Claude `settings.json`, domyślne wartości Claude `.lsp.json` oraz deklarowane w manifeście
`lspServers`, command-skills Cursor oraz zgodne katalogi hooków Codex.

`openclaw plugins inspect <id>` zgłasza również wykryte możliwości pakietu oraz
obsługiwane lub nieobsługiwane wpisy serwerów MCP i LSP dla pluginów opartych na pakietach.

Źródłami marketplace mogą być znana nazwa marketplace Claude z
`~/.claude/plugins/known_marketplaces.json`, lokalny katalog główny marketplace lub ścieżka
`marketplace.json`, skrócony zapis GitHub, taki jak `owner/repo`, adres URL repozytorium GitHub
lub adres URL git. W przypadku zdalnych marketplace wpisy pluginów muszą pozostać wewnątrz
sklonowanego repozytorium marketplace i używać wyłącznie źródeł ścieżek względnych.

Pełne szczegóły znajdziesz w [`openclaw plugins` dokumentacji CLI](/pl/cli/plugins).

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
ale dostarczane pluginy i nowe pluginy zewnętrzne powinny traktować `register` jako
publiczny kontrakt.

Typowe metody rejestracji:

| Metoda                                  | Co rejestruje              |
| --------------------------------------- | -------------------------- |
| `registerProvider`                      | Dostawca modeli (LLM)      |
| `registerChannel`                       | Kanał czatu                |
| `registerTool`                          | Narzędzie agenta           |
| `registerHook` / `on(...)`              | Hooki cyklu życia          |
| `registerSpeechProvider`                | Zamiana tekstu na mowę / STT |
| `registerRealtimeTranscriptionProvider` | Strumieniowe STT           |
| `registerRealtimeVoiceProvider`         | Dwukierunkowy głos w czasie rzeczywistym |
| `registerMediaUnderstandingProvider`    | Analiza obrazu/audio       |
| `registerImageGenerationProvider`       | Generowanie obrazów        |
| `registerMusicGenerationProvider`       | Generowanie muzyki         |
| `registerVideoGenerationProvider`       | Generowanie wideo          |
| `registerWebFetchProvider`              | Dostawca pobierania / scrapingu z sieci |
| `registerWebSearchProvider`             | Wyszukiwanie w sieci       |
| `registerHttpRoute`                     | Endpoint HTTP              |
| `registerCommand` / `registerCli`       | Polecenia CLI             |
| `registerContextEngine`                 | Silnik kontekstu           |
| `registerService`                       | Usługa działająca w tle    |

Zachowanie strażników hooków dla typowanych hooków cyklu życia:

- `before_tool_call`: `{ block: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `before_tool_call`: `{ block: false }` nic nie robi i nie usuwa wcześniejszej blokady.
- `before_install`: `{ block: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `before_install`: `{ block: false }` nic nie robi i nie usuwa wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `message_sending`: `{ cancel: false }` nic nie robi i nie usuwa wcześniejszego anulowania.

Pełne zachowanie typowanych hooków znajdziesz w [Przegląd SDK](/pl/plugins/sdk-overview#hook-decision-semantics).

## Powiązane

- [Tworzenie pluginów](/pl/plugins/building-plugins) — utwórz własny plugin
- [Pakiety pluginów](/pl/plugins/bundles) — zgodność pakietów Codex/Claude/Cursor
- [Manifest pluginu](/pl/plugins/manifest) — schemat manifestu
- [Rejestrowanie narzędzi](/pl/plugins/building-plugins#registering-agent-tools) — dodawanie narzędzi agenta w pluginie
- [Wewnętrzne elementy pluginów](/pl/plugins/architecture) — model możliwości i potok ładowania
- [Pluginy społeczności](/pl/plugins/community) — zestawienia firm trzecich
