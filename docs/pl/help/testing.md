---
read_when:
    - Uruchamianie testów lokalnie lub w CI
    - Dodawanie regresji dla błędów modeli/dostawców
    - Debugowanie zachowania gateway + agenta
summary: 'Pakiet testów: zestawy unit/e2e/live, uruchamianie w Dockerze i zakres każdego testu'
title: Testowanie
x-i18n:
    generated_at: "2026-04-08T02:17:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ace2c19bfc350780475f4348264a4b55be2b4ccbb26f0d33b4a6af34510943b5
    source_path: help/testing.md
    workflow: 15
---

# Testowanie

OpenClaw ma trzy zestawy Vitest (unit/integration, e2e, live) oraz niewielki zestaw uruchomień w Dockerze.

Ten dokument to przewodnik „jak testujemy”:

- Co obejmuje każdy zestaw (i czego celowo _nie_ obejmuje)
- Jakie polecenia uruchamiać w typowych przepływach pracy (lokalnie, przed pushem, debugowanie)
- Jak testy live wykrywają poświadczenia i wybierają modele/dostawców
- Jak dodawać regresje dla rzeczywistych problemów modeli/dostawców

## Szybki start

W większość dni:

- Pełna bramka (oczekiwana przed pushem): `pnpm build && pnpm check && pnpm test`
- Szybsze lokalne uruchomienie pełnego zestawu na wydajnej maszynie: `pnpm test:max`
- Bezpośrednia pętla watch Vitest: `pnpm test:watch`
- Bezpośrednie kierowanie na plik teraz obsługuje też ścieżki extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Strona QA wsparta Dockerem: `pnpm qa:lab:up`

Gdy dotykasz testów lub chcesz mieć większą pewność:

- Bramka pokrycia: `pnpm test:coverage`
- Zestaw E2E: `pnpm test:e2e`

Podczas debugowania rzeczywistych dostawców/modeli (wymaga prawdziwych poświadczeń):

- Zestaw live (modele + sondy narzędzi/obrazów gateway): `pnpm test:live`
- Ciche uruchomienie jednego pliku live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Wskazówka: gdy potrzebujesz tylko jednego nieudanego przypadku, zawęź testy live za pomocą zmiennych środowiskowych allowlist opisanych poniżej.

## Zestawy testów (co uruchamia się gdzie)

Potraktuj zestawy jako „rosnący realizm” (i rosnącą niestabilność/koszt):

### Unit / integration (domyślne)

- Polecenie: `pnpm test`
- Konfiguracja: dziesięć sekwencyjnych uruchomień shardów (`vitest.full-*.config.ts`) na istniejących zakresowych projektach Vitest
- Pliki: inwentarze core/unit w `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` oraz dozwolone testy node `ui` objęte przez `vitest.unit.config.ts`
- Zakres:
  - Czyste testy jednostkowe
  - Testy integracyjne w procesie (auth gateway, routing, narzędzia, parsowanie, konfiguracja)
  - Deterministyczne regresje znanych błędów
- Oczekiwania:
  - Uruchamiają się w CI
  - Nie wymagają prawdziwych kluczy
  - Powinny być szybkie i stabilne
- Uwaga o projektach:
  - Niekierowane `pnpm test` uruchamia teraz jedenaście mniejszych konfiguracji shardów (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) zamiast jednego ogromnego natywnego procesu root-project. Zmniejsza to szczytowe RSS na obciążonych maszynach i zapobiega temu, by prace `auto-reply`/extension blokowały niezwiązane zestawy.
  - `pnpm test --watch` nadal używa natywnego grafu projektów root `vitest.config.ts`, ponieważ wieloszardowa pętla watch nie jest praktyczna.
  - `pnpm test`, `pnpm test:watch` i `pnpm test:perf:imports` kierują jawne cele plików/katalogów najpierw przez zakresowe ścieżki, więc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` unika kosztu pełnego startu root project.
  - `pnpm test:changed` rozwija zmienione ścieżki git do tych samych zakresowych ścieżek, gdy diff dotyczy tylko routowalnych plików źródłowych/testowych; edycje config/setup nadal wracają do szerokiego ponownego uruchomienia root-project.
  - Wybrane testy `plugin-sdk` i `commands` także są kierowane przez dedykowane lekkie ścieżki, które pomijają `test/setup-openclaw-runtime.ts`; pliki stanowe/ciężkie runtime pozostają na istniejących ścieżkach.
  - Wybrane pliki źródłowe helperów `plugin-sdk` i `commands` także mapują uruchomienia w trybie changed do jawnych testów sąsiednich w tych lekkich ścieżkach, więc edycje helperów unikają ponownego uruchamiania pełnego ciężkiego zestawu dla tego katalogu.
  - `auto-reply` ma teraz trzy dedykowane koszyki: helpery najwyższego poziomu rdzenia, integracyjne testy najwyższego poziomu `reply.*` oraz poddrzewo `src/auto-reply/reply/**`. Dzięki temu najcięższa praca harnessu reply nie trafia do tanich testów status/chunk/token.
- Uwaga o osadzonym runnerze:
  - Gdy zmieniasz wejścia wykrywania narzędzi wiadomości lub kontekst runtime kompaktowania,
    zachowaj oba poziomy pokrycia.
  - Dodaj ukierunkowane regresje helperów dla czystych granic routingu/normalizacji.
  - Utrzymuj też w zdrowiu osadzone zestawy integracyjne:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` oraz
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Te zestawy weryfikują, że zakresowe identyfikatory i zachowanie kompaktowania nadal przepływają
    przez rzeczywiste ścieżki `run.ts` / `compact.ts`; testy tylko helperów nie są
    wystarczającym zamiennikiem dla tych ścieżek integracyjnych.
- Uwaga o puli:
  - Bazowa konfiguracja Vitest domyślnie używa teraz `threads`.
  - Współdzielona konfiguracja Vitest ustawia też `isolate: false` i używa nieizolowanego runnera w root projects, konfiguracjach e2e i live.
  - Ścieżka root UI zachowuje konfigurację i optymalizator `jsdom`, ale teraz działa również na współdzielonym nieizolowanym runnerze.
  - Każdy shard `pnpm test` dziedziczy te same ustawienia `threads` + `isolate: false` ze współdzielonej konfiguracji Vitest.
  - Współdzielony launcher `scripts/run-vitest.mjs` domyślnie dodaje teraz także `--no-maglev` dla podrzędnych procesów Node Vitest, aby zmniejszyć churn kompilacji V8 podczas dużych lokalnych uruchomień. Ustaw `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, jeśli chcesz porównać zachowanie ze standardowym V8.
- Uwaga o szybkiej lokalnej iteracji:
  - `pnpm test:changed` kieruje przez zakresowe ścieżki, gdy zmienione ścieżki dają się czysto zmapować na mniejszy zestaw.
  - `pnpm test:max` i `pnpm test:changed:max` zachowują to samo kierowanie, tylko z wyższym limitem workerów.
  - Lokalne automatyczne skalowanie workerów jest teraz celowo konserwatywne i także wycofuje się, gdy średnie obciążenie hosta jest już wysokie, więc wiele równoległych uruchomień Vitest domyślnie powoduje mniej szkód.
  - Bazowa konfiguracja Vitest oznacza pliki projektów/konfiguracji jako `forceRerunTriggers`, aby ponowne uruchomienia w trybie changed były poprawne, gdy zmienia się okablowanie testów.
  - Konfiguracja utrzymuje `OPENCLAW_VITEST_FS_MODULE_CACHE` w stanie włączonym na obsługiwanych hostach; ustaw `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, jeśli chcesz jedną jawną lokalizację cache do bezpośredniego profilowania.
- Uwaga o debugowaniu wydajności:
  - `pnpm test:perf:imports` włącza raportowanie czasu importów Vitest oraz wyjście rozbicia importów.
  - `pnpm test:perf:imports:changed` zawęża ten sam widok profilowania do plików zmienionych względem `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje routowane `test:changed` z natywną ścieżką root-project dla tego zatwierdzonego diffu i wypisuje wall time oraz maksymalne RSS na macOS.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżące brudne drzewo, kierując listę zmienionych plików przez `scripts/test-projects.mjs` i konfigurację root Vitest.
  - `pnpm test:perf:profile:main` zapisuje profil CPU głównego wątku dla narzutu startu i transformacji Vitest/Vite.
  - `pnpm test:perf:profile:runner` zapisuje profile CPU+heap runnera dla zestawu unit przy wyłączonej równoległości plików.

### E2E (smoke gateway)

- Polecenie: `pnpm test:e2e`
- Konfiguracja: `vitest.e2e.config.ts`
- Pliki: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Domyślne ustawienia runtime:
  - Używa `threads` Vitest z `isolate: false`, zgodnie z resztą repozytorium.
  - Używa adaptacyjnych workerów (CI: do 2, lokalnie: domyślnie 1).
  - Domyślnie działa w trybie silent, aby zmniejszyć narzut I/O konsoli.
- Przydatne nadpisania:
  - `OPENCLAW_E2E_WORKERS=<n>` aby wymusić liczbę workerów (maksymalnie 16).
  - `OPENCLAW_E2E_VERBOSE=1` aby ponownie włączyć szczegółowe wyjście konsoli.
- Zakres:
  - Zachowanie end-to-end wielu instancji gateway
  - Powierzchnie WebSocket/HTTP, parowanie węzłów i cięższa komunikacja sieciowa
- Oczekiwania:
  - Uruchamia się w CI (gdy włączone w pipeline)
  - Nie wymaga prawdziwych kluczy
  - Ma więcej ruchomych części niż testy jednostkowe (może być wolniejszy)

### E2E: smoke backendu OpenShell

- Polecenie: `pnpm test:e2e:openshell`
- Plik: `test/openshell-sandbox.e2e.test.ts`
- Zakres:
  - Uruchamia odizolowany gateway OpenShell na hoście przez Docker
  - Tworzy sandbox z tymczasowego lokalnego Dockerfile
  - Testuje backend OpenShell OpenClaw przez prawdziwe `sandbox ssh-config` + SSH exec
  - Weryfikuje zdalnie kanoniczne zachowanie systemu plików przez most fs sandboxa
- Oczekiwania:
  - Tylko opt-in; nie jest częścią domyślnego uruchomienia `pnpm test:e2e`
  - Wymaga lokalnego CLI `openshell` oraz działającego demona Docker
  - Używa odizolowanych `HOME` / `XDG_CONFIG_HOME`, a następnie niszczy testowy gateway i sandbox
- Przydatne nadpisania:
  - `OPENCLAW_E2E_OPENSHELL=1` aby włączyć test podczas ręcznego uruchamiania szerszego zestawu e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` aby wskazać niestandardowy binarny plik CLI lub skrypt opakowujący

### Live (prawdziwi dostawcy + prawdziwe modele)

- Polecenie: `pnpm test:live`
- Konfiguracja: `vitest.live.config.ts`
- Pliki: `src/**/*.live.test.ts`
- Domyślnie: **włączone** przez `pnpm test:live` (ustawia `OPENCLAW_LIVE_TEST=1`)
- Zakres:
  - „Czy ten dostawca/model naprawdę działa _dzisiaj_ z prawdziwymi poświadczeniami?”
  - Wykrywanie zmian formatów dostawców, osobliwości wywołań narzędzi, problemów auth i zachowania limitów szybkości
- Oczekiwania:
  - Z założenia niestabilne w CI (prawdziwe sieci, prawdziwe zasady dostawców, limity, awarie)
  - Kosztują pieniądze / zużywają limity szybkości
  - Lepiej uruchamiać zawężone podzbiory niż „wszystko”
- Uruchomienia live wczytują `~/.profile`, aby pobrać brakujące klucze API.
- Domyślnie uruchomienia live nadal izolują `HOME` i kopiują materiał config/auth do tymczasowego katalogu domowego testu, tak aby fixture unit nie mogły modyfikować twojego prawdziwego `~/.openclaw`.
- Ustaw `OPENCLAW_LIVE_USE_REAL_HOME=1` tylko wtedy, gdy świadomie chcesz, aby testy live używały twojego prawdziwego katalogu domowego.
- `pnpm test:live` domyślnie działa teraz ciszej: zachowuje wyjście postępu `[live] ...`, ale wycisza dodatkową informację o `~/.profile` i wyłącza logi bootstrapu gateway / szum Bonjour. Ustaw `OPENCLAW_LIVE_TEST_QUIET=0`, jeśli chcesz przywrócić pełne logi startowe.
- Rotacja kluczy API (specyficzna dla dostawcy): ustaw `*_API_KEYS` w formacie z przecinkami/średnikami albo `*_API_KEY_1`, `*_API_KEY_2` (na przykład `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) albo per-live override przez `OPENCLAW_LIVE_*_KEY`; testy ponawiają próby po odpowiedziach z limitem szybkości.
- Wyjście postępu/heartbeatów:
  - Zestawy live wypisują teraz linie postępu do stderr, aby długie wywołania dostawców były widocznie aktywne nawet wtedy, gdy przechwytywanie konsoli Vitest jest ciche.
  - `vitest.live.config.ts` wyłącza przechwytywanie konsoli Vitest, więc linie postępu dostawcy/gateway są strumieniowane natychmiast podczas uruchomień live.
  - Dostosuj heartbeaty bezpośredniego modelu przez `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Dostosuj heartbeaty gateway/probe przez `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Który zestaw powinienem uruchomić?

Użyj tej tabeli decyzyjnej:

- Edycja logiki/testów: uruchom `pnpm test` (oraz `pnpm test:coverage`, jeśli zmieniło się dużo)
- Dotykanie komunikacji gateway / protokołu WS / parowania: dodaj `pnpm test:e2e`
- Debugowanie „mój bot nie działa” / awarii specyficznych dla dostawcy / wywoływania narzędzi: uruchom zawężone `pnpm test:live`

## Live: przegląd możliwości węzła Androida

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skrypt: `pnpm android:test:integration`
- Cel: wywołać **każde aktualnie reklamowane polecenie** podłączonego węzła Androida i potwierdzić zachowanie kontraktu poleceń.
- Zakres:
  - Konfiguracja wstępna/ręczna (zestaw nie instaluje, nie uruchamia ani nie paruje aplikacji).
  - Walidacja `node.invoke` gateway polecenie po poleceniu dla wybranego węzła Androida.
- Wymagana wstępna konfiguracja:
  - Aplikacja Android jest już połączona i sparowana z gateway.
  - Aplikacja pozostaje na pierwszym planie.
  - Uprawnienia/zgoda na przechwytywanie są przyznane dla możliwości, które mają przejść.
- Opcjonalne nadpisania celu:
  - `OPENCLAW_ANDROID_NODE_ID` lub `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Pełne szczegóły konfiguracji Androida: [Aplikacja Android](/pl/platforms/android)

## Live: smoke modeli (klucze profilu)

Testy live są podzielone na dwie warstwy, aby można było izolować awarie:

- „Model bezpośredni” mówi nam, czy dostawca/model w ogóle potrafi odpowiedzieć z danym kluczem.
- „Smoke gateway” mówi nam, czy pełny pipeline gateway+agent działa dla tego modelu (sesje, historia, narzędzia, polityka sandboxa itd.).

### Warstwa 1: bezpośrednie completion modelu (bez gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Cel:
  - Wyliczyć wykryte modele
  - Użyć `getApiKeyForModel` do wyboru modeli, do których masz poświadczenia
  - Wykonać małe completion dla każdego modelu (oraz ukierunkowane regresje tam, gdzie potrzeba)
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Ustaw `OPENCLAW_LIVE_MODELS=modern` (lub `all`, alias dla modern), aby faktycznie uruchomić ten zestaw; w przeciwnym razie jest pomijany, aby `pnpm test:live` pozostawało skupione na smoke gateway
- Jak wybierać modele:
  - `OPENCLAW_LIVE_MODELS=modern`, aby uruchomić nowoczesną allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` jest aliasem dla nowoczesnej allowlist
  - albo `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist rozdzielana przecinkami)
- Jak wybierać dostawców:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist rozdzielana przecinkami)
- Skąd pochodzą klucze:
  - Domyślnie: magazyn profili i zapasowe zmienne środowiskowe
  - Ustaw `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić użycie **wyłącznie magazynu profili**
- Dlaczego to istnieje:
  - Oddziela „API dostawcy jest uszkodzone / klucz jest nieprawidłowy” od „pipeline agenta gateway jest uszkodzony”
  - Zawiera małe, izolowane regresje (przykład: OpenAI Responses/Codex Responses reasoning replay + przepływy tool-call)

### Warstwa 2: smoke gateway + dev agent (to, co faktycznie robi „@openclaw”)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Cel:
  - Uruchomić gateway w procesie
  - Utworzyć/poprawić sesję `agent:dev:*` (nadpisanie modelu na każde uruchomienie)
  - Iterować po modelach-z-kluczami i potwierdzać:
    - „sensowną” odpowiedź (bez narzędzi)
    - że działa prawdziwe wywołanie narzędzia (sonda read)
    - opcjonalne dodatkowe sondy narzędzi (sonda exec+read)
    - że ścieżki regresji OpenAI (tylko tool-call → follow-up) nadal działają
- Szczegóły sond (aby dało się szybko wyjaśnić awarie):
  - sonda `read`: test zapisuje plik nonce w workspace i prosi agenta, aby go `read` i odesłał nonce.
  - sonda `exec+read`: test prosi agenta, aby zapisał nonce do pliku tymczasowego przez `exec`, a następnie odczytał go przez `read`.
  - sonda obrazu: test dołącza wygenerowany PNG (kot + losowy kod) i oczekuje, że model zwróci `cat <CODE>`.
  - Odniesienie implementacyjne: `src/gateway/gateway-models.profiles.live.test.ts` oraz `src/gateway/live-image-probe.ts`.
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Jak wybierać modele:
  - Domyślnie: nowoczesna allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` jest aliasem dla nowoczesnej allowlist
  - Albo ustaw `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (lub listę rozdzielaną przecinkami), aby zawęzić
- Jak wybierać dostawców (unikaj „wszystko z OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist rozdzielana przecinkami)
- Sondy narzędzi + obrazów są zawsze włączone w tym teście live:
  - sonda `read` + sonda `exec+read` (obciążenie narzędzi)
  - sonda obrazu uruchamia się, gdy model reklamuje obsługę wejścia obrazowego
  - Przepływ (na wysokim poziomie):
    - Test generuje mały PNG z „CAT” + losowym kodem (`src/gateway/live-image-probe.ts`)
    - Wysyła go przez `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parsuje załączniki do `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Osadzony agent przekazuje multimodalną wiadomość użytkownika do modelu
    - Potwierdzenie: odpowiedź zawiera `cat` + kod (tolerancja OCR: drobne błędy są dopuszczalne)

Wskazówka: aby zobaczyć, co możesz testować na swojej maszynie (i dokładne identyfikatory `provider/model`), uruchom:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke backendu CLI (Claude, Codex, Gemini lub inne lokalne CLI)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Cel: zweryfikować pipeline Gateway + agent z użyciem lokalnego backendu CLI, bez dotykania domyślnej konfiguracji.
- Domyślne ustawienia smoke specyficzne dla backendu znajdują się przy definicji `cli-backend.ts` należącej do danej extension.
- Włączenie:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Domyślne wartości:
  - Domyślny dostawca/model: `claude-cli/claude-sonnet-4-6`
  - Zachowanie polecenia/argumentów/obrazu pochodzi z metadanych wtyczki backendu CLI.
- Nadpisania (opcjonalne):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, aby wysłać prawdziwy załącznik obrazu (ścieżki są wstrzykiwane do promptu).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, aby przekazywać ścieżki plików obrazu jako argumenty CLI zamiast przez wstrzykiwanie do promptu.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (lub `"list"`), aby kontrolować sposób przekazywania argumentów obrazu, gdy ustawiono `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, aby wysłać drugą turę i zweryfikować przepływ wznowienia.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, aby wyłączyć domyślną sondę ciągłości tej samej sesji Claude Sonnet -> Opus (ustaw `1`, aby wymusić ją, gdy wybrany model obsługuje cel przełączenia).

Przykład:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Przepis Docker:

```bash
pnpm test:docker:live-cli-backend
```

Przepisy Docker dla pojedynczego dostawcy:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Uwagi:

- Runner Docker znajduje się w `scripts/test-live-cli-backend-docker.sh`.
- Uruchamia smoke live backendu CLI wewnątrz obrazu Docker repozytorium jako nieuprzywilejowany użytkownik `node`.
- Rozwiązuje metadane smoke CLI z należącej do niego extension, a następnie instaluje odpowiadający pakiet Linux CLI (`@anthropic-ai/claude-code`, `@openai/codex` lub `@google/gemini-cli`) do zapisywalnego prefiksu cache w `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (domyślnie: `~/.cache/openclaw/docker-cli-tools`).
- Smoke live backendu CLI testuje teraz ten sam pełny przepływ end-to-end dla Claude, Codex i Gemini: tura tekstowa, tura klasyfikacji obrazu, a następnie wywołanie narzędzia MCP `cron` zweryfikowane przez gateway CLI.
- Domyślny smoke Claude dodatkowo poprawia sesję z Sonnet do Opus i weryfikuje, że wznowiona sesja nadal pamięta wcześniejszą notatkę.

## Live: smoke powiązania ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Cel: zweryfikować rzeczywisty przepływ bind rozmowy ACP z live agentem ACP:
  - wysłać `/acp spawn <agent> --bind here`
  - powiązać syntetyczną rozmowę kanału wiadomości w miejscu
  - wysłać zwykły follow-up w tej samej rozmowie
  - zweryfikować, że follow-up trafia do transkryptu powiązanej sesji ACP
- Włączenie:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Domyślne wartości:
  - Agenci ACP w Dockerze: `claude,codex,gemini`
  - Agent ACP dla bezpośredniego `pnpm test:live ...`: `claude`
  - Syntetyczny kanał: kontekst rozmowy w stylu Slack DM
  - Backend ACP: `acpx`
- Nadpisania:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Uwagi:
  - Ta ścieżka używa powierzchni gateway `chat.send` z polami syntetycznej ścieżki źródłowej dostępnymi tylko dla administratora, dzięki czemu testy mogą dołączać kontekst kanału wiadomości bez udawania dostarczenia zewnętrznego.
  - Gdy `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nie jest ustawione, test używa wbudowanego rejestru agentów wtyczki `acpx` dla wybranego agenta harness ACP.

Przykład:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Przepis Docker:

```bash
pnpm test:docker:live-acp-bind
```

Przepisy Docker dla pojedynczego agenta:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Uwagi Docker:

- Runner Docker znajduje się w `scripts/test-live-acp-bind-docker.sh`.
- Domyślnie uruchamia smoke bind ACP dla wszystkich obsługiwanych live agentów CLI po kolei: `claude`, `codex`, potem `gemini`.
- Użyj `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` lub `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, aby zawęzić macierz.
- Wczytuje `~/.profile`, przygotowuje odpowiadający materiał auth CLI do kontenera, instaluje `acpx` do zapisywalnego prefiksu npm, a następnie instaluje wymagane live CLI (`@anthropic-ai/claude-code`, `@openai/codex` lub `@google/gemini-cli`), jeśli go brakuje.
- Wewnątrz Dockera runner ustawia `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, aby `acpx` zachował zmienne środowiskowe dostawcy z wczytanego profilu dostępne dla podrzędnego CLI harnessu.

### Zalecane przepisy live

Wąskie, jawne allowlisty są najszybsze i najmniej podatne na niestabilność:

- Pojedynczy model, bezpośrednio (bez gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Pojedynczy model, smoke gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Wywoływanie narzędzi przez kilku dostawców:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Skupienie na Google (klucz API Gemini + Antigravity):
  - Gemini (klucz API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Uwagi:

- `google/...` używa Gemini API (klucz API).
- `google-antigravity/...` używa mostu OAuth Antigravity (punkt końcowy agenta w stylu Cloud Code Assist).
- `google-gemini-cli/...` używa lokalnego Gemini CLI na twojej maszynie (osobne auth + osobliwości narzędzi).
- Gemini API vs Gemini CLI:
  - API: OpenClaw wywołuje hostowane Gemini API Google przez HTTP (auth przez klucz API / profil); to właśnie większość użytkowników ma na myśli, mówiąc „Gemini”.
  - CLI: OpenClaw wywołuje lokalny binarny plik `gemini`; ma własne auth i może zachowywać się inaczej (streaming/obsługa narzędzi/rozjazd wersji).

## Live: macierz modeli (co obejmujemy)

Nie ma stałej „listy modeli CI” (live jest opt-in), ale to są **zalecane** modele do regularnego obejmowania na maszynie deweloperskiej z kluczami.

### Zestaw smoke nowoczesny (wywoływanie narzędzi + obraz)

To jest uruchomienie „typowych modeli”, które oczekujemy utrzymywać jako działające:

- OpenAI (nie-Codex): `openai/gpt-5.4` (opcjonalnie: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` i `google/gemini-3-flash-preview` (unikaj starszych modeli Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` i `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Uruchom smoke gateway z narzędziami + obrazem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Bazowa linia: wywoływanie narzędzi (Read + opcjonalny Exec)

Wybierz co najmniej jeden model z każdej rodziny dostawców:

- OpenAI: `openai/gpt-5.4` (lub `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (lub `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Opcjonalne dodatkowe pokrycie (mile widziane):

- xAI: `xai/grok-4` (lub najnowszy dostępny)
- Mistral: `mistral/`… (wybierz jeden model z obsługą „tools”, który masz włączony)
- Cerebras: `cerebras/`… (jeśli masz dostęp)
- LM Studio: `lmstudio/`… (lokalne; wywoływanie narzędzi zależy od trybu API)

### Vision: wysyłanie obrazów (załącznik → wiadomość multimodalna)

Uwzględnij co najmniej jeden model obsługujący obrazy w `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/warianty OpenAI z obsługą vision itd.), aby przetestować sondę obrazu.

### Agregatory / alternatywne gateway

Jeśli masz włączone klucze, obsługujemy też testowanie przez:

- OpenRouter: `openrouter/...` (setki modeli; użyj `openclaw models scan`, aby znaleźć kandydatów z obsługą narzędzi+obrazów)
- OpenCode: `opencode/...` dla Zen oraz `opencode-go/...` dla Go (auth przez `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Więcej dostawców, których możesz dodać do macierzy live (jeśli masz poświadczenia/konfigurację):

- Wbudowani: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Przez `models.providers` (niestandardowe punkty końcowe): `minimax` (cloud/API) oraz dowolny proxy zgodny z OpenAI/Anthropic (LM Studio, vLLM, LiteLLM itd.)

Wskazówka: nie próbuj wpisywać na sztywno „wszystkich modeli” w dokumentacji. Autorytatywną listą jest to, co zwraca `discoverModels(...)` na twojej maszynie + jakie klucze są dostępne.

## Poświadczenia (nigdy nie commituj)

Testy live wykrywają poświadczenia tak samo jak CLI. W praktyce oznacza to:

- Jeśli CLI działa, testy live powinny znaleźć te same klucze.
- Jeśli test live mówi „brak poświadczeń”, debuguj to tak samo, jak debugowałbyś `openclaw models list` / wybór modelu.

- Profile auth per agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (to właśnie oznaczają „klucze profilu” w testach live)
- Konfiguracja: `~/.openclaw/openclaw.json` (lub `OPENCLAW_CONFIG_PATH`)
- Starszy katalog stanu: `~/.openclaw/credentials/` (kopiowany do przygotowanego katalogu domowego live, jeśli istnieje, ale nie jest głównym magazynem kluczy profilu)
- Lokalne uruchomienia live domyślnie kopiują aktywną konfigurację, pliki `auth-profiles.json` wszystkich agentów, starszy katalog `credentials/` oraz obsługiwane zewnętrzne katalogi auth CLI do tymczasowego katalogu domowego testu; przygotowane katalogi live pomijają `workspace/` i `sandboxes/`, a nadpisania ścieżek `agents.*.workspace` / `agentDir` są usuwane, aby sondy nie trafiały do twojego prawdziwego host workspace.

Jeśli chcesz polegać na kluczach środowiskowych (np. wyeksportowanych w `~/.profile`), uruchamiaj lokalne testy po `source ~/.profile` albo użyj runnerów Docker poniżej (mogą montować `~/.profile` do kontenera).

## Deepgram live (transkrypcja audio)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Włączenie: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Test: `src/agents/byteplus.live.test.ts`
- Włączenie: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Opcjonalne nadpisanie modelu: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- Test: `extensions/comfy/comfy.live.test.ts`
- Włączenie: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Zakres:
  - Testuje dołączone ścieżki comfy dla obrazów, wideo i `music_generate`
  - Pomija każdą możliwość, jeśli `models.providers.comfy.<capability>` nie jest skonfigurowane
  - Przydatne po zmianie wysyłania workflow comfy, odpytywania, pobierania lub rejestracji wtyczki

## Live generowania obrazów

- Test: `src/image-generation/runtime.live.test.ts`
- Polecenie: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Zakres:
  - Wylicza każdą zarejestrowaną wtyczkę dostawcy generowania obrazów
  - Przed sondowaniem wczytuje brakujące zmienne środowiskowe dostawcy z twojej powłoki logowania (`~/.profile`)
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami auth, dzięki czemu stare testowe klucze w `auth-profiles.json` nie maskują prawdziwych poświadczeń z powłoki
  - Pomija dostawców bez użytecznego auth/profilu/modelu
  - Uruchamia standardowe warianty generowania obrazów przez współdzieloną możliwość runtime:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Aktualnie objęci dołączeni dostawcy:
  - `openai`
  - `google`
- Opcjonalne zawężenie:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Opcjonalne zachowanie auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić auth z magazynu profili i ignorować nadpisania tylko-env

## Live generowania muzyki

- Test: `extensions/music-generation-providers.live.test.ts`
- Włączenie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Zakres:
  - Testuje współdzieloną ścieżkę dołączonych dostawców generowania muzyki
  - Obecnie obejmuje Google i MiniMax
  - Przed sondowaniem wczytuje zmienne środowiskowe dostawców z twojej powłoki logowania (`~/.profile`)
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami auth, dzięki czemu stare testowe klucze w `auth-profiles.json` nie maskują prawdziwych poświadczeń z powłoki
  - Pomija dostawców bez użytecznego auth/profilu/modelu
  - Uruchamia oba zadeklarowane tryby runtime, gdy są dostępne:
    - `generate` z wejściem opartym tylko na prompt
    - `edit`, gdy dostawca deklaruje `capabilities.edit.enabled`
  - Aktualne pokrycie współdzielonej ścieżki:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: osobny plik live Comfy, nie ten współdzielony przegląd
- Opcjonalne zawężenie:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Opcjonalne zachowanie auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić auth z magazynu profili i ignorować nadpisania tylko-env

## Live generowania wideo

- Test: `extensions/video-generation-providers.live.test.ts`
- Włączenie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Zakres:
  - Testuje współdzieloną ścieżkę dołączonych dostawców generowania wideo
  - Przed sondowaniem wczytuje zmienne środowiskowe dostawców z twojej powłoki logowania (`~/.profile`)
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami auth, dzięki czemu stare testowe klucze w `auth-profiles.json` nie maskują prawdziwych poświadczeń z powłoki
  - Pomija dostawców bez użytecznego auth/profilu/modelu
  - Uruchamia oba zadeklarowane tryby runtime, gdy są dostępne:
    - `generate` z wejściem opartym tylko na prompt
    - `imageToVideo`, gdy dostawca deklaruje `capabilities.imageToVideo.enabled` i wybrany dostawca/model akceptuje wejście lokalnego obrazu opartego na buforze we współdzielonym przeglądzie
    - `videoToVideo`, gdy dostawca deklaruje `capabilities.videoToVideo.enabled` i wybrany dostawca/model akceptuje wejście lokalnego wideo opartego na buforze we współdzielonym przeglądzie
  - Aktualni dostawcy `imageToVideo` zadeklarowani, ale pomijani we współdzielonym przeglądzie:
    - `vydra`, ponieważ dołączony `veo3` obsługuje tylko tekst, a dołączony `kling` wymaga zdalnego URL obrazu
  - Pokrycie Vydra specyficzne dla dostawcy:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ten plik uruchamia `veo3` text-to-video oraz ścieżkę `kling`, która domyślnie używa fixture zdalnego URL obrazu
  - Aktualne pokrycie live `videoToVideo`:
    - tylko `runway`, gdy wybrany model to `runway/gen4_aleph`
  - Aktualni dostawcy `videoToVideo` zadeklarowani, ale pomijani we współdzielonym przeglądzie:
    - `alibaba`, `qwen`, `xai`, ponieważ te ścieżki obecnie wymagają zdalnych referencyjnych URL `http(s)` / MP4
    - `google`, ponieważ obecna współdzielona ścieżka Gemini/Veo używa lokalnego wejścia opartego na buforze i ta ścieżka nie jest akceptowana we współdzielonym przeglądzie
    - `openai`, ponieważ obecna współdzielona ścieżka nie gwarantuje dostępu do specyficznych dla organizacji funkcji video inpaint/remix
- Opcjonalne zawężenie:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- Opcjonalne zachowanie auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić auth z magazynu profili i ignorować nadpisania tylko-env

## Harness live dla mediów

- Polecenie: `pnpm test:live:media`
- Cel:
  - Uruchamia współdzielone zestawy live dla obrazów, muzyki i wideo przez jeden natywny dla repo entrypoint
  - Automatycznie wczytuje brakujące zmienne środowiskowe dostawców z `~/.profile`
  - Domyślnie automatycznie zawęża każdy zestaw do dostawców, którzy aktualnie mają użyteczne auth
  - Ponownie używa `scripts/test-live.mjs`, więc zachowanie heartbeatów i trybu cichego pozostaje spójne
- Przykłady:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Uruchomienia w Dockerze (opcjonalne sprawdzenia typu „działa w Linuksie”)

Te uruchomienia Dockera dzielą się na dwa koszyki:

- Uruchomienia live modeli: `test:docker:live-models` i `test:docker:live-gateway` uruchamiają tylko odpowiadający im plik live z kluczami profilu wewnątrz obrazu Docker repozytorium (`src/agents/models.profiles.live.test.ts` i `src/gateway/gateway-models.profiles.live.test.ts`), montując lokalny katalog config i workspace (oraz wczytując `~/.profile`, jeśli został zamontowany). Odpowiadające lokalne entrypointy to `test:live:models-profiles` i `test:live:gateway-profiles`.
- Uruchomienia Docker live domyślnie mają mniejszy limit smoke, aby pełny przegląd Dockera pozostawał praktyczny:
  `test:docker:live-models` domyślnie ustawia `OPENCLAW_LIVE_MAX_MODELS=12`, a
  `test:docker:live-gateway` domyślnie ustawia `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` oraz
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Nadpisz te zmienne środowiskowe, gdy
  świadomie chcesz większego, wyczerpującego skanu.
- `test:docker:all` buduje obraz Docker live tylko raz przez `test:docker:live-build`, a następnie ponownie używa go dla dwóch ścieżek live Docker.
- Runnery smoke kontenerów: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` oraz `test:docker:plugins` uruchamiają jeden lub więcej prawdziwych kontenerów i weryfikują ścieżki integracji wyższego poziomu.

Runnery Docker live modeli także montują tylko potrzebne katalogi auth CLI (lub wszystkie obsługiwane, gdy uruchomienie nie jest zawężone), a następnie kopiują je do katalogu domowego kontenera przed startem, tak aby OAuth zewnętrznego CLI mógł odświeżać tokeny bez modyfikowania hostowego magazynu auth:

- Modele bezpośrednie: `pnpm test:docker:live-models` (skrypt: `scripts/test-live-models-docker.sh`)
- Smoke bind ACP: `pnpm test:docker:live-acp-bind` (skrypt: `scripts/test-live-acp-bind-docker.sh`)
- Smoke backendu CLI: `pnpm test:docker:live-cli-backend` (skrypt: `scripts/test-live-cli-backend-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (skrypt: `scripts/test-live-gateway-models-docker.sh`)
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (skrypt: `scripts/e2e/openwebui-docker.sh`)
- Kreator onboardingu (TTY, pełne scaffoldowanie): `pnpm test:docker:onboard` (skrypt: `scripts/e2e/onboard-docker.sh`)
- Sieć gateway (dwa kontenery, auth WS + health): `pnpm test:docker:gateway-network` (skrypt: `scripts/e2e/gateway-network-docker.sh`)
- Most kanałów MCP (zainicjalizowany Gateway + most stdio + smoke surowej ramki powiadomień Claude): `pnpm test:docker:mcp-channels` (skrypt: `scripts/e2e/mcp-channels-docker.sh`)
- Wtyczki (smoke instalacji + alias `/plugin` + semantyka restartu pakietu Claude): `pnpm test:docker:plugins` (skrypt: `scripts/e2e/plugins-docker.sh`)

Runnery Docker live modeli także montują bieżący checkout tylko do odczytu i
przygotowują go w tymczasowym katalogu roboczym wewnątrz kontenera. Dzięki temu obraz runtime
pozostaje mały, a mimo to Vitest działa na twoich dokładnych lokalnych źródłach/configu.
Krok przygotowania pomija duże lokalne cache i wyniki buildów aplikacji, takie jak
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` oraz lokalne dla aplikacji katalogi `.build` lub
wyniki Gradle, dzięki czemu uruchomienia Docker live nie tracą minut na kopiowanie
artefaktów specyficznych dla maszyny.
Ustawiają też `OPENCLAW_SKIP_CHANNELS=1`, aby sondy gateway live nie uruchamiały
prawdziwych workerów kanałów Telegram/Discord/itd. wewnątrz kontenera.
`test:docker:live-models` nadal uruchamia `pnpm test:live`, więc przekazuj także
`OPENCLAW_LIVE_GATEWAY_*`, gdy chcesz zawęzić lub wykluczyć pokrycie gateway
live z tej ścieżki Docker.
`test:docker:openwebui` to smoke kompatybilności wyższego poziomu: uruchamia
kontener gateway OpenClaw z włączonymi punktami końcowymi HTTP zgodnymi z OpenAI,
uruchamia przypięty kontener Open WebUI przeciwko temu gateway, loguje się przez
Open WebUI, weryfikuje, że `/api/models` udostępnia `openclaw/default`, a następnie wysyła
prawdziwe żądanie czatu przez proxy `/api/chat/completions` Open WebUI.
Pierwsze uruchomienie może być zauważalnie wolniejsze, ponieważ Docker może potrzebować pobrać
obraz Open WebUI, a Open WebUI może potrzebować dokończyć własną konfigurację cold-start.
Ta ścieżka oczekuje działającego klucza live modelu, a `OPENCLAW_PROFILE_FILE`
(`~/.profile` domyślnie) jest podstawowym sposobem dostarczenia go w uruchomieniach z Dockerem.
Udane uruchomienia wypisują mały ładunek JSON, taki jak `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` jest celowo deterministyczny i nie wymaga
prawdziwego konta Telegram, Discord ani iMessage. Uruchamia zainicjalizowany kontener
Gateway, uruchamia drugi kontener, który startuje `openclaw mcp serve`, a następnie
weryfikuje wykrywanie routowanych rozmów, odczyty transkryptów, metadane załączników,
zachowanie kolejki zdarzeń live, routing wysyłek wychodzących oraz powiadomienia w stylu Claude o kanałach +
uprawnieniach przez prawdziwy most stdio MCP. Kontrola powiadomień
bada bezpośrednio surowe ramki stdio MCP, więc smoke weryfikuje to, co most
faktycznie emituje, a nie tylko to, co akurat udostępnia konkretny SDK klienta.

Ręczny smoke zwykłego wątku ACP w naturalnym języku (nie CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Zachowaj ten skrypt do przepływów regresji/debugowania. Może znów być potrzebny do walidacji routingu wątków ACP, więc go nie usuwaj.

Przydatne zmienne środowiskowe:

- `OPENCLAW_CONFIG_DIR=...` (domyślnie: `~/.openclaw`) montowane do `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (domyślnie: `~/.openclaw/workspace`) montowane do `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (domyślnie: `~/.profile`) montowane do `/home/node/.profile` i wczytywane przed uruchomieniem testów
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (domyślnie: `~/.cache/openclaw/docker-cli-tools`) montowane do `/home/node/.npm-global` dla buforowanych instalacji CLI wewnątrz Dockera
- Zewnętrzne katalogi/pliki auth CLI w `$HOME` są montowane tylko do odczytu pod `/host-auth...`, a następnie kopiowane do `/home/node/...` przed startem testów
  - Domyślne katalogi: `.minimax`
  - Domyślne pliki: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Zawężone uruchomienia dostawców montują tylko potrzebne katalogi/pliki wywnioskowane z `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Ręczne nadpisanie: `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` lub lista rozdzielana przecinkami, np. `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, aby zawęzić uruchomienie
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, aby filtrować dostawców wewnątrz kontenera
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby upewnić się, że poświadczenia pochodzą z magazynu profili (a nie ze środowiska)
- `OPENCLAW_OPENWEBUI_MODEL=...`, aby wybrać model udostępniany przez gateway dla smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, aby nadpisać prompt kontroli nonce używany przez smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, aby nadpisać przypięty tag obrazu Open WebUI

## Kontrola dokumentacji

Po edycji dokumentacji uruchom kontrole dokumentów: `pnpm check:docs`.
Uruchom pełną walidację anchorów Mintlify, gdy potrzebujesz też kontroli nagłówków w obrębie strony: `pnpm docs:check-links:anchors`.

## Regresja offline (bezpieczna dla CI)

To są regresje „rzeczywistego pipeline” bez prawdziwych dostawców:

- Wywoływanie narzędzi gateway (mock OpenAI, prawdziwa pętla gateway + agent): `src/gateway/gateway.test.ts` (przypadek: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Kreator gateway (WS `wizard.start`/`wizard.next`, zapis config + wymuszone auth): `src/gateway/gateway.test.ts` (przypadek: "runs wizard over ws and writes auth token config")

## Ewalucje niezawodności agenta (Skills)

Mamy już kilka bezpiecznych dla CI testów, które działają jak „ewaluacje niezawodności agenta”:

- Mock wywoływania narzędzi przez prawdziwą pętlę gateway + agent (`src/gateway/gateway.test.ts`).
- Pełne przepływy kreatora, które walidują okablowanie sesji i efekty konfiguracji (`src/gateway/gateway.test.ts`).

Czego nadal brakuje dla Skills (zobacz [Skills](/pl/tools/skills)):

- **Podejmowanie decyzji:** gdy skille są wymienione w promptcie, czy agent wybiera właściwy skill (albo unika nieistotnych)?
- **Zgodność:** czy agent odczytuje `SKILL.md` przed użyciem i wykonuje wymagane kroki/argumenty?
- **Kontrakty workflow:** scenariusze wieloturowe potwierdzające kolejność narzędzi, przenoszenie historii sesji i granice sandboxa.

Przyszłe ewaluacje powinny najpierw pozostać deterministyczne:

- Runner scenariuszy używający mockowanych dostawców do potwierdzania wywołań narzędzi + kolejności, odczytów plików skillów i okablowania sesji.
- Mały zestaw scenariuszy skupionych na skillach (użyć vs unikać, bramkowanie, wstrzykiwanie promptu).
- Opcjonalne ewaluacje live (opt-in, bramkowane env) dopiero po wdrożeniu zestawu bezpiecznego dla CI.

## Testy kontraktów (kształt wtyczek i kanałów)

Testy kontraktów weryfikują, że każda zarejestrowana wtyczka i każdy kanał są zgodne ze swoim
kontraktem interfejsu. Iterują po wszystkich wykrytych wtyczkach i uruchamiają zestaw
asercji kształtu i zachowania. Domyślna ścieżka unit `pnpm test` celowo
pomija te współdzielone pliki seam i smoke; uruchamiaj polecenia kontraktów jawnie,
gdy dotykasz współdzielonych powierzchni kanałów lub dostawców.

### Polecenia

- Wszystkie kontrakty: `pnpm test:contracts`
- Tylko kontrakty kanałów: `pnpm test:contracts:channels`
- Tylko kontrakty dostawców: `pnpm test:contracts:plugins`

### Kontrakty kanałów

Znajdują się w `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Podstawowy kształt wtyczki (id, nazwa, możliwości)
- **setup** - Kontrakt kreatora konfiguracji
- **session-binding** - Zachowanie wiązania sesji
- **outbound-payload** - Struktura ładunku wiadomości
- **inbound** - Obsługa wiadomości przychodzących
- **actions** - Handlery akcji kanału
- **threading** - Obsługa identyfikatorów wątków
- **directory** - API katalogu/listy
- **group-policy** - Egzekwowanie polityki grup

### Kontrakty statusu dostawców

Znajdują się w `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondy statusu kanału
- **registry** - Kształt rejestru wtyczek

### Kontrakty dostawców

Znajdują się w `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrakt przepływu auth
- **auth-choice** - Wybór/selekcja auth
- **catalog** - API katalogu modeli
- **discovery** - Wykrywanie wtyczek
- **loader** - Ładowanie wtyczek
- **runtime** - Runtime dostawcy
- **shape** - Kształt/interfejs wtyczki
- **wizard** - Kreator konfiguracji

### Kiedy uruchamiać

- Po zmianie eksportów lub subpathów `plugin-sdk`
- Po dodaniu lub modyfikacji kanału albo wtyczki dostawcy
- Po refaktoryzacji rejestracji lub wykrywania wtyczek

Testy kontraktów uruchamiają się w CI i nie wymagają prawdziwych kluczy API.

## Dodawanie regresji (wskazówki)

Gdy naprawiasz problem dostawcy/modelu wykryty w live:

- Jeśli to możliwe, dodaj regresję bezpieczną dla CI (mock/stub dostawcy albo uchwycenie dokładnej transformacji kształtu żądania)
- Jeśli z natury jest to tylko live (limity szybkości, polityki auth), utrzymaj test live wąski i opt-in przez zmienne środowiskowe
- Preferuj celowanie w najmniejszą warstwę, która wykryje błąd:
  - błąd konwersji/odtwarzania żądania dostawcy → test modeli bezpośrednich
  - błąd pipeline sesji/historii/narzędzi gateway → live smoke gateway albo bezpieczny dla CI test mock gateway
- Zabezpieczenie przechodzenia SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` wyprowadza jeden przykładowy cel na klasę SecretRef z metadanych rejestru (`listSecretTargetRegistryEntries()`), a następnie potwierdza, że identyfikatory exec z segmentami przejścia są odrzucane.
  - Jeśli dodasz nową rodzinę celów SecretRef `includeInPlan` w `src/secrets/target-registry-data.ts`, zaktualizuj `classifyTargetClass` w tym teście. Test celowo kończy się niepowodzeniem dla niesklasyfikowanych identyfikatorów celów, aby nie dało się po cichu pominąć nowych klas.
