---
read_when:
    - Uruchamianie testów lokalnie lub w CI
    - Dodawanie testów regresji dla błędów modeli/dostawców
    - Debugowanie działania Gateway i agentów
summary: 'Zestaw testowy: pakiety unit/e2e/live, uruchamianie w Dockerze oraz zakres każdego testu'
title: Testowanie
x-i18n:
    generated_at: "2026-04-23T14:55:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbec4996699577321116c94f60c01d205d7594ed41aca27c821f1c3d65a7dca3
    source_path: help/testing.md
    workflow: 15
---

# Testowanie

OpenClaw ma trzy pakiety Vitest (unit/integration, e2e, live) oraz niewielki zestaw uruchomień w Dockerze.

Ten dokument to przewodnik „jak testujemy”:

- Co obejmuje każdy pakiet (i czego celowo _nie_ obejmuje)
- Jakie polecenia uruchamiać w typowych workflow (lokalnie, przed push, debugowanie)
- Jak testy live wykrywają poświadczenia oraz wybierają modele/dostawców
- Jak dodawać testy regresji dla rzeczywistych problemów modeli/dostawców

## Szybki start

Na co dzień:

- Pełna bramka (oczekiwana przed push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Szybsze lokalne uruchomienie pełnego pakietu na wydajnej maszynie: `pnpm test:max`
- Bezpośrednia pętla watch Vitest: `pnpm test:watch`
- Bezpośrednie wskazywanie plików obsługuje teraz również ścieżki rozszerzeń/kanałów: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Gdy iterujesz nad pojedynczą awarią, najpierw wybieraj uruchomienia ukierunkowane.
- Strona QA oparta na Dockerze: `pnpm qa:lab:up`
- Linia QA oparta na Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Gdy modyfikujesz testy albo chcesz mieć większą pewność:

- Bramka pokrycia: `pnpm test:coverage`
- Pakiet E2E: `pnpm test:e2e`

Podczas debugowania rzeczywistych dostawców/modeli (wymaga prawdziwych poświadczeń):

- Pakiet live (modele + sondy narzędzi/obrazów Gateway): `pnpm test:live`
- Ciche uruchomienie jednego pliku live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Sweep modeli live w Dockerze: `pnpm test:docker:live-models`
  - Każdy wybrany model uruchamia teraz turę tekstową oraz małą sondę w stylu odczytu pliku.
    Modele, których metadane deklarują wejście `image`, uruchamiają też małą turę obrazu.
    Wyłącz dodatkowe sondy za pomocą `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` lub
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, gdy izolujesz awarie dostawcy.
  - Pokrycie w CI: codzienne `OpenClaw Scheduled Live And E2E Checks` oraz ręczne
    `OpenClaw Release Checks` wywołują wielokrotnego użytku workflow live/E2E z
    `include_live_suites: true`, co obejmuje osobne zadania macierzowe Docker live model
    podzielone według dostawcy.
  - Do ukierunkowanych ponownych uruchomień w CI wyślij `OpenClaw Live And E2E Checks (Reusable)`
    z `include_live_suites: true` oraz `live_models_only: true`.
  - Dodaj nowe sekrety dostawców o wysokim sygnale do `scripts/ci-hydrate-live-auth.sh`
    oraz `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` i ich
    wywołujących workflow harmonogramu/wydania.
- Smoke test kosztów Moonshot/Kimi: z ustawionym `MOONSHOT_API_KEY` uruchom
  `openclaw models list --provider moonshot --json`, a następnie odizolowane
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  względem `moonshot/kimi-k2.6`. Sprawdź, że JSON raportuje Moonshot/K2.6 oraz że
  transkrypt asystenta przechowuje znormalizowane `usage.cost`.

Wskazówka: gdy potrzebujesz tylko jednego nieudanego przypadku, zawężaj testy live przez zmienne środowiskowe allowlist opisane poniżej.

## Uruchomienia specyficzne dla QA

Te polecenia znajdują się obok głównych pakietów testowych, gdy potrzebujesz realizmu qa-lab:

CI uruchamia QA Lab w dedykowanych workflow. `Parity gate` działa dla pasujących PR-ów
i z ręcznego wyzwalania z mockowanymi dostawcami. `QA-Lab - All Lanes` działa nocnie na
`main` oraz z ręcznego wyzwalania z mockowaną bramką zgodności, linią live Matrix
i linią live Telegram zarządzaną przez Convex jako zadaniami równoległymi. `OpenClaw Release Checks`
uruchamia te same linie przed zatwierdzeniem wydania.

- `pnpm openclaw qa suite`
  - Uruchamia scenariusze QA oparte na repo bezpośrednio na hoście.
  - Domyślnie uruchamia równolegle wiele wybranych scenariuszy z izolowanymi
    workerami Gateway. `qa-channel` domyślnie używa współbieżności 4 (ograniczonej
    przez liczbę wybranych scenariuszy). Użyj `--concurrency <count>`, aby dostroić liczbę
    workerów, lub `--concurrency 1` dla starszej linii szeregowej.
  - Kończy się kodem niezerowym, gdy którykolwiek scenariusz zakończy się niepowodzeniem. Użyj `--allow-failures`, gdy
    chcesz artefaktów bez kończenia z kodem błędu.
  - Obsługuje tryby dostawców `live-frontier`, `mock-openai` oraz `aimock`.
    `aimock` uruchamia lokalny serwer dostawcy oparty na AIMock dla eksperymentalnego
    pokrycia fixture i mocków protokołu bez zastępowania świadomej scenariuszy
    linii `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Uruchamia ten sam pakiet QA wewnątrz jednorazowej maszyny wirtualnej Multipass Linux.
  - Zachowuje to samo zachowanie wyboru scenariuszy co `qa suite` na hoście.
  - Ponownie wykorzystuje te same flagi wyboru dostawcy/modelu co `qa suite`.
  - Uruchomienia live przekazują obsługiwane wejścia uwierzytelniania QA praktyczne dla gościa:
    klucze dostawców oparte na env, ścieżkę konfiguracji dostawcy QA live oraz `CODEX_HOME`,
    jeśli jest obecne.
  - Katalogi wyjściowe muszą pozostawać pod katalogiem głównym repo, aby gość mógł zapisywać z powrotem przez
    zamontowany workspace.
  - Zapisuje zwykły raport i podsumowanie QA oraz logi Multipass w
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Uruchamia stronę QA opartą na Dockerze do pracy QA w stylu operatorskim.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Buduje tarball npm z bieżącego checkoutu, instaluje go globalnie w
    Dockerze, uruchamia nieinteraktywny onboarding klucza API OpenAI, domyślnie konfiguruje Telegram,
    sprawdza, że włączenie pluginu instaluje zależności uruchomieniowe na żądanie,
    uruchamia doctor i uruchamia jedną lokalną turę agenta względem mockowanego endpointu OpenAI.
  - Użyj `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, aby uruchomić tę samą linię
    instalacji pakietowej z Discord.
- `pnpm test:docker:bundled-channel-deps`
  - Pakuje i instaluje bieżący build OpenClaw w Dockerze, uruchamia Gateway
    ze skonfigurowanym OpenAI, a następnie włącza bundlowane kanały/pluginy przez
    edycje konfiguracji.
  - Weryfikuje, że wykrywanie konfiguracji pozostawia nieobecne zależności uruchomieniowe
    nieskonfigurowanych pluginów, że pierwsze skonfigurowane uruchomienie Gateway lub doctor
    instaluje zależności uruchomieniowe każdego bundlowanego pluginu na żądanie, oraz że
    drugie ponowne uruchomienie nie reinstaluje zależności, które zostały już aktywowane.
  - Instaluje też znaną starszą bazę npm, włącza Telegram przed uruchomieniem
    `openclaw update --tag <candidate>` i weryfikuje, że doctor po aktualizacji kandydata
    naprawia zależności uruchomieniowe bundlowanych kanałów bez naprawy postinstall
    po stronie harnessu.
- `pnpm openclaw qa aimock`
  - Uruchamia tylko lokalny serwer dostawcy AIMock do bezpośredniego smoke testowania protokołu.
- `pnpm openclaw qa matrix`
  - Uruchamia linię QA Matrix live względem jednorazowego homeserwera Tuwunel opartego na Dockerze.
  - Ten host QA jest dziś dostępny tylko dla repo/dev. Spakowane instalacje OpenClaw nie dostarczają
    `qa-lab`, więc nie udostępniają `openclaw qa`.
  - Checkouty repo ładują bundlowany runner bezpośrednio; nie jest potrzebny osobny krok instalacji pluginu.
  - Tworzy trzy tymczasowe konta Matrix (`driver`, `sut`, `observer`) oraz jeden prywatny pokój, po czym uruchamia podrzędny proces QA gateway z rzeczywistym pluginem Matrix jako transportem SUT.
  - Domyślnie używa przypiętego stabilnego obrazu Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Nadpisz przez `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, gdy musisz testować inny obraz.
  - Matrix nie udostępnia współdzielonych flag źródła poświadczeń, ponieważ linia tworzy lokalnie jednorazowych użytkowników.
  - Zapisuje raport Matrix QA, podsumowanie, artefakt observed-events oraz połączony log wyjścia stdout/stderr w `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Uruchamia linię QA Telegram live względem rzeczywistej prywatnej grupy przy użyciu tokenów bota driver i SUT z env.
  - Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` oraz `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Id grupy musi być numerycznym identyfikatorem czatu Telegram.
  - Obsługuje `--credential-source convex` dla współdzielonych, pulowanych poświadczeń. Domyślnie używaj trybu env albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, aby włączyć dzierżawy z puli.
  - Kończy się kodem niezerowym, gdy którykolwiek scenariusz zakończy się niepowodzeniem. Użyj `--allow-failures`, gdy
    chcesz artefaktów bez kończenia z kodem błędu.
  - Wymaga dwóch różnych botów w tej samej prywatnej grupie, przy czym bot SUT musi udostępniać nazwę użytkownika Telegram.
  - Dla stabilnej obserwacji bot-do-bota włącz Bot-to-Bot Communication Mode w `@BotFather` dla obu botów i upewnij się, że bot driver może obserwować ruch botów w grupie.
  - Zapisuje raport Telegram QA, podsumowanie i artefakt observed-messages w `.artifacts/qa-e2e/...`. Scenariusze odpowiedzi obejmują RTT od żądania wysłania przez driver do zaobserwowanej odpowiedzi SUT.

Linie transportu live współdzielą jeden standardowy kontrakt, aby nowe transporty nie dryfowały:

`qa-channel` pozostaje szerokim syntetycznym pakietem QA i nie jest częścią macierzy pokrycia transportów live.

| Linia    | Canary | Bramka wzmianek | Blokada allowlist | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Kontynuacja wątku | Izolacja wątku | Obserwacja reakcji | Polecenie pomocy |
| -------- | ------ | --------------- | ----------------- | ----------------------------- | ----------------------- | ----------------- | -------------- | ------------------ | ---------------- |
| Matrix   | x      | x               | x                 | x                             | x                       | x                 | x              | x                  |                  |
| Telegram | x      |                 |                   |                               |                         |                   |                |                    | x                |

### Współdzielone poświadczenia Telegram przez Convex (v1)

Gdy `--credential-source convex` (lub `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) jest włączone dla
`openclaw qa telegram`, QA lab uzyskuje wyłączną dzierżawę z puli opartej na Convex, wysyła heartbeat
tej dzierżawy podczas działania linii i zwalnia dzierżawę przy zamknięciu.

Referencyjny szkielet projektu Convex:

- `qa/convex-credential-broker/`

Wymagane zmienne środowiskowe:

- `OPENCLAW_QA_CONVEX_SITE_URL` (na przykład `https://your-deployment.convex.site`)
- Jeden sekret dla wybranej roli:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` dla `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` dla `ci`
- Wybór roli poświadczeń:
  - CLI: `--credential-role maintainer|ci`
  - Domyślne env: `OPENCLAW_QA_CREDENTIAL_ROLE` (domyślnie `ci` w CI, w przeciwnym razie `maintainer`)

Opcjonalne zmienne środowiskowe:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (domyślnie `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (domyślnie `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (domyślnie `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (domyślnie `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (domyślnie `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (opcjonalny trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` pozwala na loopbackowe adresy URL Convex `http://` tylko do lokalnego developmentu.

`OPENCLAW_QA_CONVEX_SITE_URL` powinien używać `https://` w normalnej pracy.

Polecenia administracyjne maintainera (dodawanie/usuwanie/listowanie puli) wymagają
konkretnie `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Pomocnicze polecenia CLI dla maintainerów:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Użyj `--json` dla wyjścia czytelnego maszynowo w skryptach i narzędziach CI.

Domyślny kontrakt endpointu (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Żądanie: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sukces: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Wyczerpane/do ponowienia: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Żądanie: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Sukces: `{ status: "ok" }` (lub puste `2xx`)
- `POST /release`
  - Żądanie: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Sukces: `{ status: "ok" }` (lub puste `2xx`)
- `POST /admin/add` (tylko sekret maintainera)
  - Żądanie: `{ kind, actorId, payload, note?, status? }`
  - Sukces: `{ status: "ok", credential }`
- `POST /admin/remove` (tylko sekret maintainera)
  - Żądanie: `{ credentialId, actorId }`
  - Sukces: `{ status: "ok", changed, credential }`
  - Ochrona aktywnej dzierżawy: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (tylko sekret maintainera)
  - Żądanie: `{ kind?, status?, includePayload?, limit? }`
  - Sukces: `{ status: "ok", credentials, count }`

Kształt payloadu dla rodzaju Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` musi być ciągiem znaków z numerycznym identyfikatorem czatu Telegram.
- `admin/add` waliduje ten kształt dla `kind: "telegram"` i odrzuca nieprawidłowe payloady.

### Dodawanie kanału do QA

Dodanie kanału do markdownowego systemu QA wymaga dokładnie dwóch rzeczy:

1. Adaptera transportu dla kanału.
2. Pakietu scenariuszy, który sprawdza kontrakt kanału.

Nie dodawaj nowego głównego korzenia poleceń QA, gdy współdzielony host `qa-lab` może
obsługiwać ten przepływ.

`qa-lab` zarządza współdzieloną mechaniką hosta:

- korzeniem poleceń `openclaw qa`
- uruchamianiem i zamykaniem pakietu
- współbieżnością workerów
- zapisem artefaktów
- generowaniem raportów
- wykonywaniem scenariuszy
- aliasami zgodności dla starszych scenariuszy `qa-channel`

Pluginy runnerów zarządzają kontraktem transportu:

- jak `openclaw qa <runner>` jest montowane pod współdzielonym korzeniem `qa`
- jak Gateway jest konfigurowany dla tego transportu
- jak sprawdzana jest gotowość
- jak wstrzykiwane są zdarzenia przychodzące
- jak obserwowane są wiadomości wychodzące
- jak udostępniane są transkrypty i znormalizowany stan transportu
- jak wykonywane są akcje oparte na transporcie
- jak obsługiwany jest reset lub czyszczenie specyficzne dla transportu

Minimalny próg wdrożenia dla nowego kanału to:

1. Zachowaj `qa-lab` jako właściciela współdzielonego korzenia `qa`.
2. Zaimplementuj runner transportu na współdzielonym punkcie styku hosta `qa-lab`.
3. Zachowaj mechanikę specyficzną dla transportu wewnątrz pluginu runnera lub harnessu kanału.
4. Zamontuj runner jako `openclaw qa <runner>` zamiast rejestrować konkurencyjne główne polecenie.
   Pluginy runnerów powinny deklarować `qaRunners` w `openclaw.plugin.json` i eksportować pasującą tablicę `qaRunnerCliRegistrations` z `runtime-api.ts`.
   Zachowaj lekkość `runtime-api.ts`; leniwe CLI i wykonywanie runnera powinny pozostać za oddzielnymi entrypointami.
5. Twórz lub dostosowuj scenariusze markdown w tematycznych katalogach `qa/scenarios/`.
6. Dla nowych scenariuszy używaj generycznych helperów scenariuszy.
7. Utrzymuj działanie istniejących aliasów zgodności, chyba że repo przeprowadza celową migrację.

Reguła decyzyjna jest ścisła:

- Jeśli zachowanie da się wyrazić raz w `qa-lab`, umieść je w `qa-lab`.
- Jeśli zachowanie zależy od transportu jednego kanału, pozostaw je w pluginie tego runnera lub harnessie pluginu.
- Jeśli scenariusz potrzebuje nowej możliwości, z której może skorzystać więcej niż jeden kanał, dodaj generyczny helper zamiast gałęzi specyficznej dla kanału w `suite.ts`.
- Jeśli zachowanie ma sens tylko dla jednego transportu, zachowaj scenariusz jako specyficzny dla transportu i wyraźnie zaznacz to w kontrakcie scenariusza.

Preferowane nazwy generycznych helperów dla nowych scenariuszy to:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Aliasów zgodności nadal można używać w istniejących scenariuszach, w tym:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Nowa praca nad kanałami powinna używać generycznych nazw helperów.
Aliasy zgodności istnieją po to, aby uniknąć migracji typu flag day, a nie jako model
dla tworzenia nowych scenariuszy.

## Pakiety testowe (co uruchamia się gdzie)

Myśl o tych pakietach jako o „rosnącym realizmie” (i rosnącej zawodności/koszcie):

### Unit / integration (domyślne)

- Polecenie: `pnpm test`
- Konfiguracja: uruchomienia bez wskazanego celu używają zestawu shardów `vitest.full-*.config.ts` i mogą rozwijać wieloprojektowe shardy do konfiguracji per projekt w celu równoległego planowania
- Pliki: inwentarze core/unit w `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` oraz testy Node z białej listy `ui`, objęte przez `vitest.unit.config.ts`
- Zakres:
  - Czyste testy jednostkowe
  - Testy integracyjne w procesie (uwierzytelnianie gateway, routing, narzędzia, parsowanie, konfiguracja)
  - Deterministyczne regresje dla znanych błędów
- Oczekiwania:
  - Uruchamiane w CI
  - Nie wymagają prawdziwych kluczy
  - Powinny być szybkie i stabilne
- Uwaga o projektach:
  - Niewskazane `pnpm test` uruchamia teraz dwanaście mniejszych konfiguracji shardów (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) zamiast jednego ogromnego natywnego procesu projektu root. To zmniejsza szczytowy RSS na obciążonych maszynach i zapobiega temu, by prace `auto-reply`/rozszerzeń zagłodziły niezwiązane pakiety.
  - `pnpm test --watch` nadal używa natywnego grafu projektów root `vitest.config.ts`, ponieważ pętla watch z wieloma shardami nie jest praktyczna.
  - `pnpm test`, `pnpm test:watch` oraz `pnpm test:perf:imports` najpierw kierują jawne cele plików/katalogów do zawężonych linii, więc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` unika kosztu pełnego startu projektu root.
  - `pnpm test:changed` rozwija zmienione ścieżki gita do tych samych zawężonych linii, gdy diff dotyka wyłącznie routowalnych plików źródłowych/testowych; edycje konfiguracji/setup nadal wracają do szerokiego ponownego uruchomienia projektu root.
  - `pnpm check:changed` to normalna inteligentna lokalna bramka dla wąskich zmian. Klasyfikuje diff do core, testów core, rozszerzeń, testów rozszerzeń, aplikacji, dokumentacji, metadanych wydania i narzędzi, a następnie uruchamia pasujące linie typecheck/lint/test. Zmiany w publicznym Plugin SDK i kontraktach pluginów obejmują walidację rozszerzeń, ponieważ rozszerzenia zależą od tych kontraktów core. Zmiany wersji wyłącznie w metadanych wydania uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności root zamiast pełnego pakietu, z ochroną odrzucającą zmiany w pakietach poza polem wersji najwyższego poziomu.
  - Lekkie importowo testy jednostkowe z agents, commands, plugins, helperów `auto-reply`, `plugin-sdk` i podobnych obszarów czystych utili trafiają do linii `unit-fast`, która pomija `test/setup-openclaw-runtime.ts`; pliki stanowe/ciężkie uruchomieniowo pozostają na istniejących liniach.
  - Wybrane pliki źródłowe helperów `plugin-sdk` i `commands` również mapują uruchomienia trybu changed do jawnych sąsiednich testów w tych lekkich liniach, dzięki czemu edycje helperów nie wymuszają ponownego uruchamiania całego ciężkiego pakietu dla tego katalogu.
  - `auto-reply` ma teraz trzy dedykowane koszyki: główne helpery core najwyższego poziomu, testy integracyjne najwyższego poziomu `reply.*` oraz poddrzewo `src/auto-reply/reply/**`. Dzięki temu najcięższa praca harnessu odpowiedzi nie trafia do tanich testów status/chunk/token.
- Uwaga o Embedded runner:
  - Gdy zmieniasz wejścia wykrywania narzędzi wiadomości lub kontekst uruchomieniowy Compaction,
    utrzymuj oba poziomy pokrycia.
  - Dodawaj ukierunkowane regresje helperów dla granic czystego routingu/normalizacji.
  - Utrzymuj też zdrowie pakietów integracyjnych embedded runner:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` oraz
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Te pakiety weryfikują, że zakresowane identyfikatory i zachowanie Compaction nadal przepływają
    przez rzeczywiste ścieżki `run.ts` / `compact.ts`; same testy helperów nie są
    wystarczającym zamiennikiem tych ścieżek integracyjnych.
- Uwaga o puli:
  - Bazowa konfiguracja Vitest domyślnie używa teraz `threads`.
  - Współdzielona konfiguracja Vitest ustawia też na stałe `isolate: false` i używa nieizolowanego runnera we wszystkich projektach root, konfiguracjach e2e i live.
  - Główna linia UI zachowuje konfigurację `jsdom` i optimizer, ale teraz również działa na współdzielonym nieizolowanym runnerze.
  - Każdy shard `pnpm test` dziedziczy te same domyślne ustawienia `threads` + `isolate: false` ze współdzielonej konfiguracji Vitest.
  - Współdzielony launcher `scripts/run-vitest.mjs` domyślnie dodaje teraz również `--no-maglev` dla podrzędnych procesów Node Vitest, aby ograniczyć churn kompilacji V8 podczas dużych lokalnych uruchomień. Ustaw `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, jeśli chcesz porównać zachowanie ze standardowym V8.
- Uwaga o szybkiej iteracji lokalnej:
  - `pnpm changed:lanes` pokazuje, które linie architektoniczne uruchamia diff.
  - Hook pre-commit uruchamia `pnpm check:changed --staged` po sformatowaniu/lintowaniu staged, więc commity tylko do core nie płacą kosztu testów rozszerzeń, chyba że dotykają publicznych kontraktów skierowanych do rozszerzeń. Commity wyłącznie do metadanych wydania pozostają na ukierunkowanej linii wersja/konfiguracja/zależności root.
  - Jeśli dokładny zestaw staged change został już zwalidowany równymi lub silniejszymi bramkami, użyj `scripts/committer --fast "<message>" <files...>`, aby pominąć tylko ponowne uruchomienie hooka changed-scope. Staged format/lint nadal się uruchamiają. W handoff wspomnij o ukończonych bramkach. Jest to również akceptowalne po ponownym uruchomieniu odizolowanej niestabilnej awarii hooka, jeśli przejdzie z dowodem w zawężonym zakresie.
  - `pnpm test:changed` kieruje przez zawężone linie, gdy zmienione ścieżki czysto mapują się na mniejszy pakiet.
  - `pnpm test:max` i `pnpm test:changed:max` zachowują to samo zachowanie routingu, tylko z wyższym limitem workerów.
  - Automatyczne skalowanie lokalnych workerów jest teraz celowo konserwatywne i dodatkowo wycofuje się, gdy średnie obciążenie hosta jest już wysokie, więc wiele równoczesnych uruchomień Vitest domyślnie wyrządza mniej szkód.
  - Bazowa konfiguracja Vitest oznacza teraz pliki projektów/konfiguracji jako `forceRerunTriggers`, aby ponowne uruchomienia trybu changed pozostawały poprawne przy zmianach w okablowaniu testów.
  - Konfiguracja utrzymuje włączone `OPENCLAW_VITEST_FS_MODULE_CACHE` na obsługiwanych hostach; ustaw `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, jeśli chcesz mieć jedną jawną lokalizację cache do bezpośredniego profilowania.
- Uwaga o debugowaniu wydajności:
  - `pnpm test:perf:imports` włącza raportowanie czasu importu Vitest oraz wyjście z rozbiciem importów.
  - `pnpm test:perf:imports:changed` zawęża ten sam widok profilowania do plików zmienionych od `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje kierowane `test:changed` z natywną ścieżką projektu root dla tego zatwierdzonego diffu i wypisuje wall time oraz macOS max RSS.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżące brudne drzewo, kierując listę zmienionych plików przez `scripts/test-projects.mjs` i konfigurację root Vitest.
  - `pnpm test:perf:profile:main` zapisuje profil CPU głównego wątku dla narzutu startu i transformacji Vitest/Vite.
  - `pnpm test:perf:profile:runner` zapisuje profile CPU+heap runnera dla pakietu unit z wyłączoną równoległością plików.

### Stability (gateway)

- Polecenie: `pnpm test:stability:gateway`
- Konfiguracja: `vitest.gateway.config.ts`, wymuszony jeden worker
- Zakres:
  - Uruchamia rzeczywisty loopback Gateway z domyślnie włączoną diagnostyką
  - Przepuszcza syntetyczny churn wiadomości gateway, pamięci i dużych payloadów przez ścieżkę zdarzeń diagnostycznych
  - Odpytuje `diagnostics.stability` przez Gateway WS RPC
  - Obejmuje helpery utrwalania pakietu diagnostycznej stabilności
  - Sprawdza, że rejestrator pozostaje ograniczony, syntetyczne próbki RSS pozostają poniżej budżetu presji, a głębokości kolejek per sesja spadają z powrotem do zera
- Oczekiwania:
  - Bezpieczne dla CI i bez kluczy
  - Wąska linia do dalszej pracy nad regresjami stabilności, a nie zamiennik pełnego pakietu Gateway

### E2E (smoke gateway)

- Polecenie: `pnpm test:e2e`
- Konfiguracja: `vitest.e2e.config.ts`
- Pliki: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` oraz testy E2E bundlowanych pluginów w `extensions/`
- Domyślne ustawienia uruchomieniowe:
  - Używa Vitest `threads` z `isolate: false`, zgodnie z resztą repo.
  - Używa adaptacyjnych workerów (CI: do 2, lokalnie: domyślnie 1).
  - Domyślnie działa w trybie silent, aby ograniczyć narzut I/O konsoli.
- Przydatne nadpisania:
  - `OPENCLAW_E2E_WORKERS=<n>`, aby wymusić liczbę workerów (maksymalnie 16).
  - `OPENCLAW_E2E_VERBOSE=1`, aby ponownie włączyć szczegółowe wyjście konsoli.
- Zakres:
  - Zachowanie end-to-end wieloinstancyjnego gateway
  - Powierzchnie WebSocket/HTTP, parowanie Node oraz cięższa komunikacja sieciowa
- Oczekiwania:
  - Uruchamiane w CI (gdy są włączone w pipeline)
  - Nie wymagają prawdziwych kluczy
  - Mają więcej ruchomych części niż testy jednostkowe (mogą być wolniejsze)

### E2E: smoke backendu OpenShell

- Polecenie: `pnpm test:e2e:openshell`
- Plik: `extensions/openshell/src/backend.e2e.test.ts`
- Zakres:
  - Uruchamia odizolowany gateway OpenShell na hoście przez Docker
  - Tworzy sandbox z tymczasowego lokalnego Dockerfile
  - Testuje backend OpenShell OpenClaw przez rzeczywiste `sandbox ssh-config` + wykonanie SSH
  - Weryfikuje zdalno-kanoniczne zachowanie systemu plików przez most fs sandboxu
- Oczekiwania:
  - Tylko opt-in; nie jest częścią domyślnego uruchomienia `pnpm test:e2e`
  - Wymaga lokalnego CLI `openshell` oraz działającego demona Docker
  - Używa odizolowanych `HOME` / `XDG_CONFIG_HOME`, a następnie niszczy testowy gateway i sandbox
- Przydatne nadpisania:
  - `OPENCLAW_E2E_OPENSHELL=1`, aby włączyć test przy ręcznym uruchamianiu szerszego pakietu e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, aby wskazać niestandardowy binarny plik CLI lub skrypt wrappera

### Live (rzeczywiści dostawcy + rzeczywiste modele)

- Polecenie: `pnpm test:live`
- Konfiguracja: `vitest.live.config.ts`
- Pliki: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` oraz testy live bundlowanych pluginów w `extensions/`
- Domyślnie: **włączone** przez `pnpm test:live` (ustawia `OPENCLAW_LIVE_TEST=1`)
- Zakres:
  - „Czy ten dostawca/model faktycznie działa _dzisiaj_ z prawdziwymi poświadczeniami?”
  - Wychwytywanie zmian formatów dostawców, osobliwości wywołań narzędzi, problemów z uwierzytelnianiem i zachowań limitów szybkości
- Oczekiwania:
  - Celowo niestabilne w CI (rzeczywiste sieci, rzeczywiste polityki dostawców, limity, awarie)
  - Kosztują pieniądze / zużywają limity szybkości
  - Lepiej uruchamiać zawężone podzbiory niż „wszystko”
- Uruchomienia live pobierają `~/.profile`, aby przechwycić brakujące klucze API.
- Domyślnie uruchomienia live nadal izolują `HOME` i kopiują materiał config/auth do tymczasowego katalogu testowego home, aby fixture unit nie mogły modyfikować rzeczywistego `~/.openclaw`.
- Ustaw `OPENCLAW_LIVE_USE_REAL_HOME=1` tylko wtedy, gdy celowo chcesz, aby testy live używały rzeczywistego katalogu domowego.
- `pnpm test:live` domyślnie działa teraz w cichszym trybie: zachowuje wyjście postępu `[live] ...`, ale ukrywa dodatkową informację o `~/.profile` i wycisza logi bootstrapu gateway / komunikaty Bonjour. Ustaw `OPENCLAW_LIVE_TEST_QUIET=0`, jeśli chcesz przywrócić pełne logi startowe.
- Rotacja kluczy API (specyficzna dla dostawcy): ustaw `*_API_KEYS` w formacie z przecinkami/średnikami lub `*_API_KEY_1`, `*_API_KEY_2` (na przykład `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) albo nadpisanie per live przez `OPENCLAW_LIVE_*_KEY`; testy ponawiają próby przy odpowiedziach rate limit.
- Wyjście postępu/heartbeat:
  - Pakiety live emitują teraz linie postępu do stderr, aby długie wywołania dostawców były widocznie aktywne nawet wtedy, gdy przechwytywanie konsoli Vitest jest ciche.
  - `vitest.live.config.ts` wyłącza przechwytywanie konsoli Vitest, więc linie postępu dostawcy/gateway są strumieniowane natychmiast podczas uruchomień live.
  - Dostosuj heartbeat bezpośrednich modeli przez `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Dostosuj heartbeat gateway/sond przez `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Który pakiet powinienem uruchomić?

Użyj tej tabeli decyzyjnej:

- Edytujesz logikę/testy: uruchom `pnpm test` (oraz `pnpm test:coverage`, jeśli dużo zmieniłeś)
- Dotykasz sieci gateway / protokołu WS / parowania: dodaj `pnpm test:e2e`
- Debugujesz „mój bot nie działa” / awarie specyficzne dla dostawcy / wywoływanie narzędzi: uruchom zawężone `pnpm test:live`

## Live: sweep możliwości Node Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skrypt: `pnpm android:test:integration`
- Cel: wywołać **każde polecenie aktualnie ogłaszane** przez podłączony Node Android i potwierdzić zachowanie kontraktu poleceń.
- Zakres:
  - Wstępnie przygotowana/ręczna konfiguracja (pakiet nie instaluje/nie uruchamia/nie paruje aplikacji).
  - Walidacja `node.invoke` gateway polecenie po poleceniu dla wybranego Node Android.
- Wymagane wstępne przygotowanie:
  - Aplikacja Android jest już podłączona i sparowana z gateway.
  - Aplikacja pozostaje na pierwszym planie.
  - Uprawnienia/zgoda na przechwytywanie zostały nadane dla możliwości, które mają przechodzić.
- Opcjonalne nadpisania celu:
  - `OPENCLAW_ANDROID_NODE_ID` lub `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Pełne szczegóły konfiguracji Android: [Aplikacja Android](/pl/platforms/android)

## Live: smoke modeli (klucze profili)

Testy live są podzielone na dwie warstwy, aby można było izolować awarie:

- „Direct model” mówi nam, czy dostawca/model w ogóle potrafi odpowiedzieć przy danym kluczu.
- „Gateway smoke” mówi nam, czy pełny pipeline gateway+agent działa dla tego modelu (sesje, historia, narzędzia, polityka sandboxu itd.).

### Warstwa 1: Bezpośrednie completion modelu (bez gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Cel:
  - Wyliczyć wykryte modele
  - Użyć `getApiKeyForModel`, aby wybrać modele, dla których masz poświadczenia
  - Uruchomić małe completion na model dla każdego modelu (oraz ukierunkowane regresje tam, gdzie to potrzebne)
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Ustaw `OPENCLAW_LIVE_MODELS=modern` (lub `all`, alias dla modern), aby faktycznie uruchomić ten pakiet; w przeciwnym razie zostanie pominięty, by `pnpm test:live` pozostawało skupione na smoke gateway
- Jak wybierać modele:
  - `OPENCLAW_LIVE_MODELS=modern`, aby uruchomić nowoczesną allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` to alias dla nowoczesnej allowlist
  - albo `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist oddzielona przecinkami)
  - Sweepy modern/all domyślnie używają wyselekcjonowanego limitu wysokiego sygnału; ustaw `OPENCLAW_LIVE_MAX_MODELS=0` dla wyczerpującego sweepu modern albo wartość dodatnią dla mniejszego limitu.
- Jak wybierać dostawców:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist oddzielona przecinkami)
- Skąd pochodzą klucze:
  - Domyślnie: store profili i fallbacki env
  - Ustaw `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić wyłącznie **store profili**
- Dlaczego to istnieje:
  - Oddziela „API dostawcy jest zepsute / klucz jest nieprawidłowy” od „pipeline agenta gateway jest zepsuty”
  - Zawiera małe, odizolowane regresje (przykład: przepływy OpenAI Responses/Codex Responses reasoning replay + tool-call)

### Warstwa 2: Gateway + smoke agenta dev (to, co faktycznie robi „@openclaw”)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Cel:
  - Uruchomić gateway w procesie
  - Utworzyć/załatać sesję `agent:dev:*` (nadpisanie modelu na uruchomienie)
  - Iterować po modelach-z-kluczami i potwierdzić:
    - „znaczącą” odpowiedź (bez narzędzi)
    - że działa rzeczywiste wywołanie narzędzia (sonda odczytu)
    - opcjonalne dodatkowe sondy narzędzi (sonda exec+read)
    - że ścieżki regresji OpenAI (tylko tool-call → follow-up) nadal działają
- Szczegóły sond (aby dało się szybko wyjaśniać awarie):
  - Sonda `read`: test zapisuje plik nonce w workspace i prosi agenta, aby go `read` i odesłał nonce.
  - Sonda `exec+read`: test prosi agenta, aby przez `exec` zapisał nonce do pliku tymczasowego, a następnie przez `read` go odczytał.
  - Sonda obrazu: test dołącza wygenerowany PNG (kot + losowy kod) i oczekuje, że model zwróci `cat <CODE>`.
  - Referencja implementacji: `src/gateway/gateway-models.profiles.live.test.ts` oraz `src/gateway/live-image-probe.ts`.
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Jak wybierać modele:
  - Domyślnie: nowoczesna allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` to alias dla nowoczesnej allowlist
  - Albo ustaw `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (lub listę oddzieloną przecinkami), aby zawęzić
  - Sweepy gateway modern/all domyślnie używają wyselekcjonowanego limitu wysokiego sygnału; ustaw `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` dla wyczerpującego sweepu modern albo wartość dodatnią dla mniejszego limitu.
- Jak wybierać dostawców (unikaj „wszystko z OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist oddzielona przecinkami)
- Sondy narzędzi i obrazu są zawsze włączone w tym teście live:
  - sonda `read` + sonda `exec+read` (obciążenie narzędzi)
  - sonda obrazu działa, gdy model deklaruje obsługę wejścia obrazu
  - Przepływ (wysoki poziom):
    - Test generuje mały PNG z „CAT” + losowym kodem (`src/gateway/live-image-probe.ts`)
    - Wysyła go przez `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parsuje załączniki do `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded agent przekazuje multimodalną wiadomość użytkownika do modelu
    - Asercja: odpowiedź zawiera `cat` + kod (tolerancja OCR: drobne błędy są dozwolone)

Wskazówka: aby zobaczyć, co możesz testować na swojej maszynie (i dokładne identyfikatory `provider/model`), uruchom:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke backendu CLI (Claude, Codex, Gemini lub inne lokalne CLI)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Cel: zwalidować pipeline Gateway + agent z użyciem lokalnego backendu CLI, bez dotykania domyślnej konfiguracji.
- Domyślne ustawienia smoke specyficzne dla backendu znajdują się w należącej do niego definicji `cli-backend.ts` rozszerzenia.
- Włączanie:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Domyślne ustawienia:
  - Domyślny dostawca/model: `claude-cli/claude-sonnet-4-6`
  - Zachowanie command/args/image pochodzi z metadanych pluginu właściciela backendu CLI.
- Nadpisania (opcjonalne):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, aby wysłać rzeczywisty załącznik obrazu (ścieżki są wstrzykiwane do promptu).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, aby przekazywać ścieżki plików obrazów jako argumenty CLI zamiast wstrzykiwania do promptu.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (lub `"list"`), aby kontrolować sposób przekazywania argumentów obrazów, gdy ustawiono `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, aby wysłać drugą turę i zwalidować przepływ wznowienia.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, aby wyłączyć domyślną sondę ciągłości tej samej sesji Claude Sonnet -> Opus (ustaw `1`, aby wymusić jej włączenie, gdy wybrany model obsługuje cel przełączenia).

Przykład:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Recepta Docker:

```bash
pnpm test:docker:live-cli-backend
```

Recepty Docker dla pojedynczego dostawcy:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Uwagi:

- Runner Docker znajduje się w `scripts/test-live-cli-backend-docker.sh`.
- Uruchamia smoke live CLI-backend wewnątrz obrazu Docker repo jako nieuprzywilejowany użytkownik `node`.
- Rozwiązuje metadane smoke CLI z rozszerzenia właściciela, a następnie instaluje pasujący pakiet Linux CLI (`@anthropic-ai/claude-code`, `@openai/codex` lub `@google/gemini-cli`) do zapisywalnego prefiksu z cache pod `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (domyślnie: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` wymaga przenośnego OAuth subskrypcji Claude Code przez `~/.claude/.credentials.json` z `claudeAiOauth.subscriptionType` albo `CLAUDE_CODE_OAUTH_TOKEN` z `claude setup-token`. Najpierw potwierdza bezpośrednie `claude -p` w Dockerze, a następnie uruchamia dwie tury Gateway CLI-backend bez zachowywania zmiennych env klucza API Anthropic. Ta linia subskrypcji domyślnie wyłącza sondy Claude MCP/tool i image, ponieważ Claude obecnie kieruje użycie aplikacji firm trzecich przez rozliczanie extra-usage zamiast zwykłych limitów planu subskrypcji.
- Smoke live CLI-backend testuje teraz ten sam pełny przepływ end-to-end dla Claude, Codex i Gemini: tura tekstowa, tura klasyfikacji obrazu, a następnie wywołanie narzędzia MCP `cron` zweryfikowane przez gateway CLI.
- Domyślny smoke Claude dodatkowo łata sesję z Sonnet do Opus i sprawdza, czy wznowiona sesja nadal pamięta wcześniejszą notatkę.

## Live: smoke dowiązania ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Cel: zwalidować rzeczywisty przepływ dowiązania rozmowy ACP z live agentem ACP:
  - wysłać `/acp spawn <agent> --bind here`
  - dowiązać syntetyczną rozmowę kanału wiadomości w miejscu
  - wysłać zwykły follow-up w tej samej rozmowie
  - zweryfikować, że follow-up trafia do transkryptu dowiązanej sesji ACP
- Włączanie:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Domyślne ustawienia:
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
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- Uwagi:
  - Ta linia używa powierzchni gateway `chat.send` z polami syntetycznej trasy pochodzenia tylko dla administratora, aby testy mogły dołączyć kontekst kanału wiadomości bez udawania zewnętrznego dostarczenia.
  - Gdy `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nie jest ustawione, test używa wbudowanego rejestru agentów pluginu `acpx` dla wybranego agenta harnessu ACP.

Przykład:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Recepta Docker:

```bash
pnpm test:docker:live-acp-bind
```

Recepty Docker dla pojedynczego agenta:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Uwagi dotyczące Dockera:

- Runner Docker znajduje się w `scripts/test-live-acp-bind-docker.sh`.
- Domyślnie uruchamia smoke ACP bind kolejno dla wszystkich obsługiwanych live agentów CLI: `claude`, `codex`, a następnie `gemini`.
- Użyj `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` lub `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, aby zawęzić macierz.
- Pobiera `~/.profile`, przygotowuje pasujący materiał uwierzytelniania CLI w kontenerze, instaluje `acpx` do zapisywalnego prefiksu npm, a następnie instaluje wymagane live CLI (`@anthropic-ai/claude-code`, `@openai/codex` lub `@google/gemini-cli`), jeśli go brakuje.
- Wewnątrz Dockera runner ustawia `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, aby acpx zachował zmienne env dostawcy z pobranego profilu dostępne dla podrzędnego harnessu CLI.

## Live: smoke harnessu Codex app-server

- Cel: zwalidować należący do pluginu harness Codex przez zwykłą metodę
  gateway `agent`:
  - załadować bundlowany plugin `codex`
  - wybrać `OPENCLAW_AGENT_RUNTIME=codex`
  - wysłać pierwszą turę gateway agent do `codex/gpt-5.4`
  - wysłać drugą turę do tej samej sesji OpenClaw i zweryfikować, że wątek app-server
    może zostać wznowiony
  - uruchomić `/codex status` i `/codex models` przez tę samą ścieżkę
    poleceń gateway
  - opcjonalnie uruchomić dwie sondy powłoki eskalowane po przeglądzie Guardian: jedno nieszkodliwe
    polecenie, które powinno zostać zatwierdzone, oraz jedno fałszywe wysłanie sekretu,
    które powinno zostać odrzucone, aby agent dopytał
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Włączanie: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Domyślny model: `codex/gpt-5.4`
- Opcjonalna sonda obrazu: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Opcjonalna sonda MCP/tool: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Opcjonalna sonda Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke ustawia `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, aby zepsuty harness Codex
  nie mógł przejść przez ciche fallback do PI.
- Auth: `OPENAI_API_KEY` z powłoki/profilu oraz opcjonalnie skopiowane
  `~/.codex/auth.json` i `~/.codex/config.toml`

Lokalna recepta:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Recepta Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Uwagi dotyczące Dockera:

- Runner Docker znajduje się w `scripts/test-live-codex-harness-docker.sh`.
- Pobiera zamontowane `~/.profile`, przekazuje `OPENAI_API_KEY`, kopiuje pliki auth CLI Codex,
  jeśli są obecne, instaluje `@openai/codex` do zapisywalnego zamontowanego prefiksu npm,
  przygotowuje drzewo źródeł, a następnie uruchamia tylko live test harnessu Codex.
- Docker domyślnie włącza sondy obrazu, MCP/tool i Guardian. Ustaw
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` lub
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` albo
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, gdy potrzebujesz węższego uruchomienia
  debugowego.
- Docker eksportuje też `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, zgodnie z konfiguracją
  live testu, aby fallback `openai-codex/*` lub PI nie mógł ukryć regresji
  harnessu Codex.

### Zalecane recepty live

Wąskie, jawne allowlist są najszybsze i najmniej podatne na niestabilność:

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
- `google-antigravity/...` używa mostu OAuth Antigravity (endpoint agenta w stylu Cloud Code Assist).
- `google-gemini-cli/...` używa lokalnego Gemini CLI na Twojej maszynie (osobne auth + osobliwości narzędziowe).
- Gemini API vs Gemini CLI:
  - API: OpenClaw wywołuje hostowane Gemini API Google przez HTTP (auth przez klucz API / profil); to właśnie większość użytkowników ma na myśli, mówiąc „Gemini”.
  - CLI: OpenClaw wywołuje lokalny binarny plik `gemini`; ma własne auth i może zachowywać się inaczej (streaming/obsługa narzędzi/rozjazd wersji).

## Live: macierz modeli (co obejmujemy)

Nie ma stałej „listy modeli CI” (live jest opt-in), ale to są **zalecane** modele do regularnego pokrywania na maszynie deweloperskiej z kluczami.

### Zestaw nowoczesnego smoke (wywoływanie narzędzi + obraz)

To jest uruchomienie „wspólnych modeli”, które oczekujemy utrzymać w działaniu:

- OpenAI (bez Codex): `openai/gpt-5.4` (opcjonalnie: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` oraz `google/gemini-3-flash-preview` (unikaj starszych modeli Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` oraz `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Uruchom smoke gateway z narzędziami + obrazem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Bazowy zestaw: wywoływanie narzędzi (Read + opcjonalnie Exec)

Wybierz przynajmniej jeden na rodzinę dostawców:

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

### Vision: wysyłanie obrazu (załącznik → wiadomość multimodalna)

Uwzględnij co najmniej jeden model z obsługą obrazu w `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/warianty OpenAI obsługujące vision itd.), aby przetestować sondę obrazu.

### Agregatory / alternatywne gateway

Jeśli masz włączone klucze, obsługujemy też testowanie przez:

- OpenRouter: `openrouter/...` (setki modeli; użyj `openclaw models scan`, aby znaleźć kandydatów z obsługą narzędzi+obrazu)
- OpenCode: `opencode/...` dla Zen oraz `opencode-go/...` dla Go (auth przez `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Więcej dostawców, których możesz uwzględnić w macierzy live (jeśli masz creds/config):

- Wbudowani: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Przez `models.providers` (własne endpointy): `minimax` (cloud/API) oraz dowolny proxy zgodny z OpenAI/Anthropic (LM Studio, vLLM, LiteLLM itd.)

Wskazówka: nie próbuj kodować na sztywno „wszystkich modeli” w dokumentacji. Autorytatywną listą jest to, co zwraca `discoverModels(...)` na Twojej maszynie + jakie klucze są dostępne.

## Poświadczenia (nigdy nie commituj)

Testy live wykrywają poświadczenia w taki sam sposób jak CLI. Praktyczne konsekwencje:

- Jeśli CLI działa, testy live powinny znaleźć te same klucze.
- Jeśli test live mówi „brak creds”, debuguj to tak samo, jak debugowałbyś `openclaw models list` / wybór modelu.

- Profile auth per agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (to właśnie oznaczają „profile keys” w testach live)
- Konfiguracja: `~/.openclaw/openclaw.json` (lub `OPENCLAW_CONFIG_PATH`)
- Starszy katalog stanu: `~/.openclaw/credentials/` (kopiowany do przygotowanego katalogu domowego live, jeśli istnieje, ale nie jest głównym store kluczy profili)
- Lokalne uruchomienia live domyślnie kopiują aktywną konfigurację, pliki `auth-profiles.json` per agent, starsze `credentials/` oraz obsługiwane zewnętrzne katalogi auth CLI do tymczasowego katalogu domowego testu; przygotowane katalogi domowe live pomijają `workspace/` i `sandboxes/`, a nadpisania ścieżek `agents.*.workspace` / `agentDir` są usuwane, aby sondy nie działały w Twoim rzeczywistym workspace hosta.

Jeśli chcesz polegać na kluczach env (np. eksportowanych w `~/.profile`), uruchamiaj testy lokalne po `source ~/.profile` albo użyj runnerów Docker poniżej (mogą montować `~/.profile` do kontenera).

## Live Deepgram (transkrypcja audio)

- Test: `extensions/deepgram/audio.live.test.ts`
- Włączanie: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live BytePlus coding plan

- Test: `extensions/byteplus/live.test.ts`
- Włączanie: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Opcjonalne nadpisanie modelu: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live mediów workflow ComfyUI

- Test: `extensions/comfy/comfy.live.test.ts`
- Włączanie: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Zakres:
  - Testuje bundlowane ścieżki comfy image, video i `music_generate`
  - Pomija każdą możliwość, jeśli `models.providers.comfy.<capability>` nie jest skonfigurowane
  - Przydatne po zmianie wysyłania workflow comfy, odpytywania, pobierania lub rejestracji pluginu

## Live generowania obrazów

- Test: `test/image-generation.runtime.live.test.ts`
- Polecenie: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Zakres:
  - Wylicza każdy zarejestrowany plugin dostawcy generowania obrazów
  - Ładuje brakujące zmienne env dostawców z powłoki logowania (`~/.profile`) przed sondowaniem
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami auth, aby nieaktualne klucze testowe w `auth-profiles.json` nie maskowały rzeczywistych poświadczeń powłoki
  - Pomija dostawców bez używalnego auth/profilu/modelu
  - Uruchamia standardowe warianty generowania obrazów przez współdzieloną możliwość runtime:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Aktualnie objęci bundlowani dostawcy:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `vydra`
  - `xai`
- Opcjonalne zawężanie:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- Opcjonalne zachowanie auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić auth ze store profili i ignorować nadpisania wyłącznie z env

## Live generowania muzyki

- Test: `extensions/music-generation-providers.live.test.ts`
- Włączanie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Zakres:
  - Testuje współdzieloną bundlowaną ścieżkę dostawców generowania muzyki
  - Obecnie obejmuje Google i MiniMax
  - Ładuje zmienne env dostawców z powłoki logowania (`~/.profile`) przed sondowaniem
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami auth, aby nieaktualne klucze testowe w `auth-profiles.json` nie maskowały rzeczywistych poświadczeń powłoki
  - Pomija dostawców bez używalnego auth/profilu/modelu
  - Uruchamia oba zadeklarowane tryby runtime, gdy są dostępne:
    - `generate` z wejściem opartym wyłącznie na prompt
    - `edit`, gdy dostawca deklaruje `capabilities.edit.enabled`
  - Aktualne pokrycie współdzielonej linii:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: osobny plik live Comfy, nie ten współdzielony sweep
- Opcjonalne zawężanie:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Opcjonalne zachowanie auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić auth ze store profili i ignorować nadpisania wyłącznie z env

## Live generowania wideo

- Test: `extensions/video-generation-providers.live.test.ts`
- Włączanie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Zakres:
  - Testuje współdzieloną bundlowaną ścieżkę dostawców generowania wideo
  - Domyślnie używa bezpiecznej dla wydania ścieżki smoke: dostawcy bez FAL, jedno żądanie text-to-video na dostawcę, jednosekundowy prompt z homarem oraz limit operacji per dostawca z `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (domyślnie `180000`)
  - Domyślnie pomija FAL, ponieważ opóźnienie kolejki po stronie dostawcy może dominować czas wydania; przekaż `--video-providers fal` lub `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, aby uruchomić go jawnie
  - Ładuje zmienne env dostawców z powłoki logowania (`~/.profile`) przed sondowaniem
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami auth, aby nieaktualne klucze testowe w `auth-profiles.json` nie maskowały rzeczywistych poświadczeń powłoki
  - Pomija dostawców bez używalnego auth/profilu/modelu
  - Domyślnie uruchamia tylko `generate`
  - Ustaw `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, aby uruchamiać również zadeklarowane tryby transformacji, gdy są dostępne:
    - `imageToVideo`, gdy dostawca deklaruje `capabilities.imageToVideo.enabled`, a wybrany dostawca/model akceptuje lokalne wejście obrazu oparte na buforze we współdzielonym sweepie
    - `videoToVideo`, gdy dostawca deklaruje `capabilities.videoToVideo.enabled`, a wybrany dostawca/model akceptuje lokalne wejście wideo oparte na buforze we współdzielonym sweepie
  - Obecni dostawcy `imageToVideo` zadeklarowani, ale pomijani we współdzielonym sweepie:
    - `vydra`, ponieważ bundlowany `veo3` jest tylko tekstowy, a bundlowany `kling` wymaga zdalnego adresu URL obrazu
  - Pokrycie specyficzne dla dostawcy Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ten plik uruchamia `veo3` text-to-video oraz linię `kling`, która domyślnie używa fixture zdalnego URL obrazu
  - Aktualne pokrycie live `videoToVideo`:
    - tylko `runway`, gdy wybrany model to `runway/gen4_aleph`
  - Obecni dostawcy `videoToVideo` zadeklarowani, ale pomijani we współdzielonym sweepie:
    - `alibaba`, `qwen`, `xai`, ponieważ te ścieżki obecnie wymagają referencyjnych URL `http(s)` / MP4
    - `google`, ponieważ bieżąca współdzielona linia Gemini/Veo używa lokalnego wejścia opartego na buforze i ta ścieżka nie jest akceptowana we współdzielonym sweepie
    - `openai`, ponieważ bieżąca współdzielona linia nie gwarantuje dostępu do org-specyficznego video inpaint/remix
- Opcjonalne zawężanie:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, aby uwzględnić każdego dostawcę w domyślnym sweepie, w tym FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, aby zmniejszyć limit operacji każdego dostawcy dla agresywnego uruchomienia smoke
- Opcjonalne zachowanie auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić auth ze store profili i ignorować nadpisania wyłącznie z env

## Harness live mediów

- Polecenie: `pnpm test:live:media`
- Cel:
  - Uruchamia współdzielone pakiety live dla obrazów, muzyki i wideo przez jeden natywny dla repo entrypoint
  - Automatycznie ładuje brakujące zmienne env dostawców z `~/.profile`
  - Domyślnie automatycznie zawęża każdy pakiet do dostawców, którzy aktualnie mają używalne auth
  - Ponownie wykorzystuje `scripts/test-live.mjs`, więc heartbeat i zachowanie trybu quiet pozostają spójne
- Przykłady:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Runnery Docker (opcjonalne kontrole „działa w Linuxie”)

Te runnery Docker dzielą się na dwa koszyki:

- Runnery live modeli: `test:docker:live-models` i `test:docker:live-gateway` uruchamiają tylko pasujący plik live z kluczami profili wewnątrz obrazu Docker repo (`src/agents/models.profiles.live.test.ts` i `src/gateway/gateway-models.profiles.live.test.ts`), montując lokalny katalog config i workspace (oraz pobierając `~/.profile`, jeśli jest zamontowany). Pasujące lokalne entrypointy to `test:live:models-profiles` i `test:live:gateway-profiles`.
- Runnery Docker live domyślnie używają mniejszego limitu smoke, aby pełny sweep Docker pozostawał praktyczny:
  `test:docker:live-models` domyślnie używa `OPENCLAW_LIVE_MAX_MODELS=12`, a
  `test:docker:live-gateway` domyślnie używa `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` oraz
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Nadpisz te zmienne env, gdy
  jawnie chcesz większego, wyczerpującego skanu.
- `test:docker:all` buduje obraz live Docker raz przez `test:docker:live-build`, a następnie ponownie go używa dla dwóch linii Docker live. Buduje też jeden współdzielony obraz `scripts/e2e/Dockerfile` przez `test:docker:e2e-build` i ponownie go używa dla runnerów smoke kontenerów E2E, które testują zbudowaną aplikację.
- Runnery smoke kontenerów: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` oraz `test:docker:config-reload` uruchamiają jeden lub więcej rzeczywistych kontenerów i weryfikują ścieżki integracji wyższego poziomu.

Runnery Docker live modeli montują też tylko potrzebne katalogi auth CLI (lub wszystkie obsługiwane, gdy uruchomienie nie jest zawężone), a następnie kopiują je do katalogu domowego kontenera przed uruchomieniem, aby zewnętrzne OAuth CLI mogło odświeżać tokeny bez modyfikowania store auth hosta:

- Bezpośrednie modele: `pnpm test:docker:live-models` (skrypt: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (skrypt: `scripts/test-live-acp-bind-docker.sh`)
- Smoke backendu CLI: `pnpm test:docker:live-cli-backend` (skrypt: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harnessu Codex app-server: `pnpm test:docker:live-codex-harness` (skrypt: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev: `pnpm test:docker:live-gateway` (skrypt: `scripts/test-live-gateway-models-docker.sh`)
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (skrypt: `scripts/e2e/openwebui-docker.sh`)
- Kreator onboardingu (TTY, pełne scaffoldowanie): `pnpm test:docker:onboard` (skrypt: `scripts/e2e/onboard-docker.sh`)
- Smoke onboardingu/kanału/agenta z tarballem npm: `pnpm test:docker:npm-onboard-channel-agent` instaluje spakowany tarball OpenClaw globalnie w Dockerze, konfiguruje OpenAI przez onboarding env-ref oraz domyślnie Telegram, weryfikuje, że włączenie pluginu instaluje zależności uruchomieniowe na żądanie, uruchamia doctor i wykonuje jedną mockowaną turę agenta OpenAI. Użyj ponownie wstępnie zbudowanego tarballa przez `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń przebudowę hosta przez `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` albo przełącz kanał przez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Sieć gateway (dwa kontenery, auth WS + health): `pnpm test:docker:gateway-network` (skrypt: `scripts/e2e/gateway-network-docker.sh`)
- Minimalna regresja reasoning OpenAI Responses `web_search`: `pnpm test:docker:openai-web-search-minimal` (skrypt: `scripts/e2e/openai-web-search-minimal-docker.sh`) uruchamia mockowany serwer OpenAI przez Gateway, weryfikuje, że `web_search` podnosi `reasoning.effort` z `minimal` do `low`, a następnie wymusza odrzucenie przez schemat dostawcy i sprawdza, że surowy szczegół pojawia się w logach Gateway.
- Most kanału MCP (seedowany Gateway + most stdio + surowy smoke klatki powiadomień Claude): `pnpm test:docker:mcp-channels` (skrypt: `scripts/e2e/mcp-channels-docker.sh`)
- Narzędzia MCP pakietu Pi (rzeczywisty serwer stdio MCP + smoke allow/deny osadzonego profilu Pi): `pnpm test:docker:pi-bundle-mcp-tools` (skrypt: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Czyszczenie MCP Cron/subagent (rzeczywisty Gateway + teardown potomka stdio MCP po odizolowanych uruchomieniach cron i jednorazowego subagenta): `pnpm test:docker:cron-mcp-cleanup` (skrypt: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginy (smoke instalacji + alias `/plugin` + semantyka restartu pakietu Claude): `pnpm test:docker:plugins` (skrypt: `scripts/e2e/plugins-docker.sh`)
- Smoke niezmienionej aktualizacji pluginu: `pnpm test:docker:plugin-update` (skrypt: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke metadanych reloadu config: `pnpm test:docker:config-reload` (skrypt: `scripts/e2e/config-reload-source-docker.sh`)
- Zależności uruchomieniowe bundlowanych pluginów: `pnpm test:docker:bundled-channel-deps` domyślnie buduje mały obraz runnera Docker, raz buduje i pakuje OpenClaw na hoście, a następnie montuje ten tarball w każdym scenariuszu instalacji Linux. Użyj ponownie obrazu przez `OPENCLAW_SKIP_DOCKER_BUILD=1`, pomiń przebudowę hosta po świeżym lokalnym buildzie przez `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` albo wskaż istniejący tarball przez `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Zawężaj zależności uruchomieniowe bundlowanych pluginów podczas iteracji, wyłączając niezwiązane scenariusze, na przykład:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Aby ręcznie wstępnie zbudować i ponownie wykorzystać współdzielony obraz zbudowanej aplikacji:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Nadpisania obrazu specyficzne dla pakietu, takie jak `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, nadal mają pierwszeństwo, jeśli są ustawione. Gdy `OPENCLAW_SKIP_DOCKER_BUILD=1` wskazuje na zdalny współdzielony obraz, skrypty pobierają go, jeśli nie jest jeszcze dostępny lokalnie. Testy Docker dla QR i instalatora zachowują własne Dockerfile, ponieważ walidują zachowanie pakietu/instalacji, a nie współdzielone środowisko wykonawcze zbudowanej aplikacji.

Runnery Docker live modeli montują również bieżący checkout tylko do odczytu i
przygotowują go w tymczasowym katalogu roboczym wewnątrz kontenera. Dzięki temu obraz runtime
pozostaje niewielki, a jednocześnie Vitest nadal działa na dokładnie Twoim lokalnym źródle/konfiguracji.
Krok przygotowania pomija duże lokalne cache i wyniki buildów aplikacji, takie jak
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` oraz lokalne dla aplikacji katalogi `.build` lub
wyniki Gradle, aby uruchomienia Docker live nie traciły minut na kopiowanie
artefaktów specyficznych dla maszyny.
Ustawiają też `OPENCLAW_SKIP_CHANNELS=1`, aby sondy gateway live nie uruchamiały
rzeczywistych workerów kanałów Telegram/Discord/itd. wewnątrz kontenera.
`test:docker:live-models` nadal uruchamia `pnpm test:live`, więc przekaż również
`OPENCLAW_LIVE_GATEWAY_*`, gdy musisz zawęzić lub wykluczyć pokrycie gateway
live z tej linii Docker.
`test:docker:openwebui` to smoke kompatybilności wyższego poziomu: uruchamia
kontener gateway OpenClaw z włączonymi punktami końcowymi HTTP zgodnymi z OpenAI,
uruchamia przypięty kontener Open WebUI względem tego gateway, loguje się przez
Open WebUI, weryfikuje, że `/api/models` udostępnia `openclaw/default`, a następnie wysyła
rzeczywiste żądanie czatu przez proxy `/api/chat/completions` Open WebUI.
Pierwsze uruchomienie może być zauważalnie wolniejsze, ponieważ Docker może potrzebować pobrać
obraz Open WebUI, a samo Open WebUI może potrzebować dokończyć własną zimną inicjalizację.
Ta linia oczekuje używalnego klucza live modelu, a `OPENCLAW_PROFILE_FILE`
(domyślnie `~/.profile`) jest podstawowym sposobem dostarczenia go w uruchomieniach dockerowych.
Udane uruchomienia wypisują mały payload JSON, taki jak `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` jest celowo deterministyczne i nie wymaga
rzeczywistego konta Telegram, Discord ani iMessage. Uruchamia seedowany
kontener Gateway, uruchamia drugi kontener, który wywołuje `openclaw mcp serve`, a następnie
weryfikuje routowane wykrywanie rozmów, odczyty transkryptów, metadane załączników,
zachowanie kolejki zdarzeń live, routing wysyłania wychodzącego oraz powiadomienia kanału +
uprawnień w stylu Claude przez rzeczywisty most stdio MCP. Kontrola powiadomień
bezpośrednio sprawdza surowe ramki stdio MCP, więc smoke waliduje to, co most
faktycznie emituje, a nie tylko to, co akurat udostępnia konkretny SDK klienta.
`test:docker:pi-bundle-mcp-tools` jest deterministyczne i nie wymaga klucza
live modelu. Buduje obraz Docker repo, uruchamia rzeczywisty serwer sondy stdio MCP
wewnątrz kontenera, materializuje ten serwer przez osadzony runtime Pi bundle
MCP, wykonuje narzędzie, a następnie weryfikuje, że `coding` i `messaging` zachowują
narzędzia `bundle-mcp`, podczas gdy `minimal` i `tools.deny: ["bundle-mcp"]` je filtrują.
`test:docker:cron-mcp-cleanup` jest deterministyczne i nie wymaga klucza live modelu.
Uruchamia seedowany Gateway z rzeczywistym serwerem sondy stdio MCP, wykonuje
odizolowaną turę Cron oraz jednorazową turę potomną `/subagents spawn`, a następnie
weryfikuje, że podrzędny proces MCP kończy działanie po każdym uruchomieniu.

Ręczny smoke wątku ACP w prostym języku (nie CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Zachowaj ten skrypt do workflow regresji/debugowania. Może być ponownie potrzebny do walidacji routingu wątków ACP, więc go nie usuwaj.

Przydatne zmienne env:

- `OPENCLAW_CONFIG_DIR=...` (domyślnie: `~/.openclaw`) montowane do `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (domyślnie: `~/.openclaw/workspace`) montowane do `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (domyślnie: `~/.profile`) montowane do `/home/node/.profile` i pobierane przed uruchomieniem testów
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, aby zweryfikować wyłącznie zmienne env pobrane z `OPENCLAW_PROFILE_FILE`, z użyciem tymczasowych katalogów config/workspace i bez montowania zewnętrznych auth CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (domyślnie: `~/.cache/openclaw/docker-cli-tools`) montowane do `/home/node/.npm-global` dla cache instalacji CLI wewnątrz Dockera
- Zewnętrzne katalogi/pliki auth CLI w `$HOME` są montowane tylko do odczytu pod `/host-auth...`, a następnie kopiowane do `/home/node/...` przed startem testów
  - Domyślne katalogi: `.minimax`
  - Domyślne pliki: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Zawężone uruchomienia dostawców montują tylko potrzebne katalogi/pliki wywnioskowane z `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Nadpisz ręcznie przez `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` albo listę rozdzielaną przecinkami, np. `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, aby zawęzić uruchomienie
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, aby filtrować dostawców w kontenerze
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby ponownie użyć istniejącego obrazu `openclaw:local-live` przy ponownych uruchomieniach, które nie wymagają przebudowy
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby upewnić się, że poświadczenia pochodzą ze store profili (a nie z env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, aby wybrać model udostępniany przez gateway dla smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, aby nadpisać prompt sprawdzania nonce używany przez smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, aby nadpisać przypięty tag obrazu Open WebUI

## Spójność dokumentacji

Po edycji dokumentacji uruchom kontrole dokumentacji: `pnpm check:docs`.
Uruchom pełną walidację kotwic Mintlify, gdy potrzebujesz również kontroli nagłówków na stronie: `pnpm docs:check-links:anchors`.

## Regresje offline (bezpieczne dla CI)

To regresje „rzeczywistego pipeline” bez rzeczywistych dostawców:

- Wywoływanie narzędzi gateway (mock OpenAI, rzeczywista pętla gateway + agent): `src/gateway/gateway.test.ts` (przypadek: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Kreator gateway (WS `wizard.start`/`wizard.next`, wymuszony zapis config + auth): `src/gateway/gateway.test.ts` (przypadek: "runs wizard over ws and writes auth token config")

## Ewalucje niezawodności agenta (Skills)

Mamy już kilka testów bezpiecznych dla CI, które zachowują się jak „ewaluacje niezawodności agenta”:

- Mockowane wywoływanie narzędzi przez rzeczywistą pętlę gateway + agent (`src/gateway/gateway.test.ts`).
- Przepływy end-to-end kreatora, które walidują okablowanie sesji i skutki konfiguracji (`src/gateway/gateway.test.ts`).

Czego nadal brakuje dla Skills (zobacz [Skills](/pl/tools/skills)):

- **Podejmowanie decyzji:** gdy Skills są wymienione w prompcie, czy agent wybiera właściwy skill (albo unika nieistotnych)?
- **Zgodność:** czy agent czyta `SKILL.md` przed użyciem i wykonuje wymagane kroki/argumenty?
- **Kontrakty workflow:** scenariusze wieloturowe, które potwierdzają kolejność narzędzi, przenoszenie historii sesji oraz granice sandboxu.

Przyszłe ewaluacje powinny najpierw pozostać deterministyczne:

- Runner scenariuszy wykorzystujący mockowanych dostawców do potwierdzania wywołań narzędzi i ich kolejności, odczytów plików skill oraz okablowania sesji.
- Mały pakiet scenariuszy skoncentrowanych na skillach (użycie vs unikanie, bramkowanie, prompt injection).
- Opcjonalne ewaluacje live (opt-in, bramkowane env) dopiero po wdrożeniu pakietu bezpiecznego dla CI.

## Testy kontraktowe (kształt pluginów i kanałów)

Testy kontraktowe weryfikują, że każdy zarejestrowany plugin i kanał jest zgodny ze swoim
kontraktem interfejsu. Iterują po wszystkich wykrytych pluginach i uruchamiają pakiet
asercji kształtu i zachowania. Domyślna linia unit `pnpm test` celowo
pomija te współdzielone pliki seam i smoke; uruchamiaj polecenia kontraktowe jawnie,
gdy dotykasz współdzielonych powierzchni kanałów lub dostawców.

### Polecenia

- Wszystkie kontrakty: `pnpm test:contracts`
- Tylko kontrakty kanałów: `pnpm test:contracts:channels`
- Tylko kontrakty dostawców: `pnpm test:contracts:plugins`

### Kontrakty kanałów

Znajdują się w `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Podstawowy kształt pluginu (id, name, capabilities)
- **setup** - Kontrakt kreatora konfiguracji
- **session-binding** - Zachowanie dowiązania sesji
- **outbound-payload** - Struktura payloadu wiadomości
- **inbound** - Obsługa wiadomości przychodzących
- **actions** - Handlery akcji kanału
- **threading** - Obsługa identyfikatorów wątków
- **directory** - API katalogu/listy
- **group-policy** - Wymuszanie polityki grupowej

### Kontrakty statusu dostawców

Znajdują się w `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondy statusu kanału
- **registry** - Kształt rejestru pluginów

### Kontrakty dostawców

Znajdują się w `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrakt przepływu auth
- **auth-choice** - Wybór/selekcja auth
- **catalog** - API katalogu modeli
- **discovery** - Wykrywanie pluginów
- **loader** - Ładowanie pluginów
- **runtime** - Runtime dostawcy
- **shape** - Kształt/interfejs pluginu
- **wizard** - Kreator konfiguracji

### Kiedy uruchamiać

- Po zmianie eksportów lub podścieżek plugin-sdk
- Po dodaniu lub modyfikacji pluginu kanału lub dostawcy
- Po refaktorze rejestracji lub wykrywania pluginów

Testy kontraktowe są uruchamiane w CI i nie wymagają prawdziwych kluczy API.

## Dodawanie regresji (wskazówki)

Gdy naprawiasz problem dostawcy/modelu wykryty w live:

- Jeśli to możliwe, dodaj regresję bezpieczną dla CI (mock/stub dostawcy albo przechwycenie dokładnej transformacji kształtu żądania)
- Jeśli z natury da się to testować tylko w live (limity szybkości, polityki auth), zachowaj test live wąski i opt-in przez zmienne env
- Preferuj najmniejszą warstwę, która wychwytuje błąd:
  - błąd konwersji/odtwarzania żądania dostawcy → test bezpośrednich modeli
  - błąd pipeline sesji/historii/narzędzi gateway → smoke gateway live lub bezpieczny dla CI mockowany test gateway
- Zabezpieczenie przechodzenia SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` wyprowadza jeden próbkowany cel na klasę SecretRef z metadanych rejestru (`listSecretTargetRegistryEntries()`), a następnie potwierdza, że identyfikatory exec segmentów przechodzenia są odrzucane.
  - Jeśli dodasz nową rodzinę celów SecretRef `includeInPlan` w `src/secrets/target-registry-data.ts`, zaktualizuj `classifyTargetClass` w tym teście. Test celowo kończy się niepowodzeniem dla niesklasyfikowanych identyfikatorów celów, aby nowych klas nie dało się pominąć po cichu.
