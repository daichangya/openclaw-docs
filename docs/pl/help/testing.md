---
read_when:
    - Uruchamianie testów lokalnie lub w CI
    - Dodawanie testów regresyjnych dla błędów modeli/providerów
    - Debugowanie zachowania Gateway + agenta
summary: 'Zestaw testowy: zestawy unit/e2e/live, runnery Docker i zakres każdego testu'
title: Testowanie
x-i18n:
    generated_at: "2026-04-23T10:02:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0e9bdea78cba7e512358d2e4d428da04a2071188e74af2d5419d2c85eafe15
    source_path: help/testing.md
    workflow: 15
---

# Testowanie

OpenClaw ma trzy zestawy Vitest (unit/integration, e2e, live) oraz niewielki zestaw runnerów Docker.

Ten dokument to przewodnik „jak testujemy”:

- Co obejmuje każdy zestaw (i czego celowo _nie_ obejmuje)
- Jakie polecenia uruchamiać w typowych przepływach pracy (lokalnie, przed pushem, debugowanie)
- Jak testy live wykrywają poświadczenia oraz wybierają modele/providery
- Jak dodawać testy regresyjne dla rzeczywistych problemów modeli/providerów

## Szybki start

W większość dni:

- Pełna bramka (oczekiwana przed pushem): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Szybsze lokalne uruchomienie pełnego zestawu na maszynie z dużą ilością zasobów: `pnpm test:max`
- Bezpośrednia pętla watch Vitest: `pnpm test:watch`
- Bezpośrednie wskazywanie plików kieruje teraz także ścieżki extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Przy iteracji nad pojedynczym błędem najpierw preferuj uruchomienia celowane.
- Strona QA oparta na Dockerze: `pnpm qa:lab:up`
- Linia QA oparta na Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Gdy dotykasz testów albo chcesz mieć większą pewność:

- Bramka pokrycia: `pnpm test:coverage`
- Zestaw E2E: `pnpm test:e2e`

Przy debugowaniu rzeczywistych providerów/modeli (wymaga prawdziwych poświadczeń):

- Zestaw live (modele + sondy narzędzi/obrazów Gateway): `pnpm test:live`
- Uruchom po cichu jeden plik live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Dockerowy przegląd modeli live: `pnpm test:docker:live-models`
  - Pokrycie CI: codzienne `OpenClaw Scheduled Live And E2E Checks` i ręczne
    `OpenClaw Release Checks` wywołują wielokrotnego użytku workflow live/E2E z
    `include_live_suites: true`, co obejmuje osobne zadania Docker live model
    w macierzy podzielone według providera.
  - Przy celowanych ponownych uruchomieniach CI wywołaj `OpenClaw Live And E2E Checks (Reusable)`
    z `include_live_suites: true` oraz `live_models_only: true`.
  - Dodaj nowe sekrety providerów o wysokiej wartości sygnału do `scripts/ci-hydrate-live-auth.sh`
    oraz `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` i jego
    wywołujących workflow scheduled/release.
- Smoke test kosztów Moonshot/Kimi: przy ustawionym `MOONSHOT_API_KEY` uruchom
  `openclaw models list --provider moonshot --json`, a następnie uruchom izolowane
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  względem `moonshot/kimi-k2.6`. Zweryfikuj, że JSON raportuje Moonshot/K2.6, a
  transkrypt asystenta zapisuje znormalizowane `usage.cost`.

Wskazówka: gdy potrzebujesz tylko jednego nieudanego przypadku, preferuj zawężanie testów live przez zmienne środowiskowe allowlist opisane poniżej.

## Runnery specyficzne dla QA

Te polecenia działają obok głównych zestawów testów, gdy potrzebujesz realizmu qa-lab:

CI uruchamia QA Lab w dedykowanych workflow. `Parity gate` działa na pasujących PR-ach
oraz po ręcznym wywołaniu z mock providerami. `QA-Lab - All Lanes` działa co noc na
`main` oraz po ręcznym wywołaniu z mock parity gate, linią live Matrix i
zarządzaną przez Convex linią live Telegram jako zadaniami równoległymi. `OpenClaw Release Checks`
uruchamia te same linie przed zatwierdzeniem wydania.

- `pnpm openclaw qa suite`
  - Uruchamia scenariusze QA oparte na repo bezpośrednio na hoście.
  - Domyślnie uruchamia wiele wybranych scenariuszy równolegle z izolowanymi
    workerami gateway. `qa-channel` domyślnie używa współbieżności 4 (ograniczonej przez
    liczbę wybranych scenariuszy). Użyj `--concurrency <count>`, aby dostroić liczbę workerów,
    albo `--concurrency 1` dla starszej linii sekwencyjnej.
  - Zwraca kod różny od zera, gdy którykolwiek scenariusz się nie powiedzie. Użyj `--allow-failures`, gdy
    chcesz artefakty bez kończenia z błędem.
  - Obsługuje tryby providerów `live-frontier`, `mock-openai` i `aimock`.
    `aimock` uruchamia lokalny serwer providera oparty na AIMock dla eksperymentalnego
    pokrycia fixture i mocków protokołu bez zastępowania świadomej scenariuszy linii `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Uruchamia ten sam zestaw QA wewnątrz jednorazowej linuxowej VM Multipass.
  - Zachowuje takie samo zachowanie wyboru scenariuszy jak `qa suite` na hoście.
  - Ponownie używa tych samych flag wyboru providera/modelu co `qa suite`.
  - Przebiegi live przekazują obsługiwane wejścia auth QA, które są praktyczne dla gościa:
    klucze providerów oparte na env, ścieżkę konfiguracji providera QA live oraz `CODEX_HOME`, gdy jest obecne.
  - Katalogi wyjściowe muszą pozostać pod katalogiem głównym repo, aby gość mógł zapisywać z powrotem przez
    zamontowany workspace.
  - Zapisuje zwykły raport QA + podsumowanie oraz logi Multipass w
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Uruchamia stronę QA opartą na Dockerze do pracy QA w stylu operatora.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Buduje archiwum npm z bieżącego checkoutu, instaluje je globalnie w
    Dockerze, uruchamia nieinteraktywny onboarding klucza OpenAI API, domyślnie konfiguruje Telegram,
    weryfikuje, że włączenie Pluginu instaluje zależności runtime na żądanie, uruchamia doctor,
    i uruchamia jedną lokalną turę agenta względem mockowanego endpointu OpenAI.
  - Użyj `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, aby uruchomić tę samą linię
    instalacji pakietowej z Discord.
- `pnpm test:docker:bundled-channel-deps`
  - Pakuje i instaluje bieżący build OpenClaw w Dockerze, uruchamia Gateway
    ze skonfigurowanym OpenAI, a następnie włącza dołączone kanały/Plugins przez edycje konfiguracji.
  - Weryfikuje, że wykrywanie konfiguracji pozostawia nieskonfigurowane zależności runtime Pluginów
    nieobecne, pierwszy skonfigurowany przebieg Gateway lub doctor instaluje zależności runtime
    każdego dołączonego Pluginu na żądanie, a drugi restart nie reinstaluje zależności,
    które zostały już aktywowane.
  - Instaluje też znaną starszą bazę npm, włącza Telegram przed uruchomieniem
    `openclaw update --tag <candidate>` i weryfikuje, że
    post-update doctor w kandydacie naprawia zależności runtime dołączonych kanałów bez
    naprawy postinstall po stronie harnessu.
- `pnpm openclaw qa aimock`
  - Uruchamia tylko lokalny serwer providera AIMock do bezpośredniego smoke testowania protokołu.
- `pnpm openclaw qa matrix`
  - Uruchamia linię QA Matrix live względem jednorazowego homeservera Tuwunel opartego na Dockerze.
  - Ten host QA jest dziś tylko repo/dev. Spakowane instalacje OpenClaw nie dostarczają
    `qa-lab`, więc nie udostępniają `openclaw qa`.
  - Checkouty repo ładują dołączony runner bezpośrednio; nie jest potrzebny
    osobny krok instalacji Pluginu.
  - Tworzy trzy tymczasowe użytkowniki Matrix (`driver`, `sut`, `observer`) oraz jeden prywatny pokój, po czym uruchamia podrzędny gateway QA z prawdziwym Pluginem Matrix jako transportem SUT.
  - Domyślnie używa przypiętego stabilnego obrazu Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Nadpisz przez `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, gdy chcesz testować inny obraz.
  - Matrix nie udostępnia współdzielonych flag źródeł poświadczeń, ponieważ ta linia lokalnie tworzy jednorazowych użytkowników.
  - Zapisuje raport QA Matrix, podsumowanie, artefakt observed-events oraz połączony log wyjścia stdout/stderr w `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Uruchamia linię QA Telegram live względem prawdziwej prywatnej grupy przy użyciu tokenów bota driver i SUT z env.
  - Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` oraz `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Id grupy musi być numerycznym identyfikatorem czatu Telegram.
  - Obsługuje `--credential-source convex` dla współdzielonych poświadczeń z puli. Domyślnie używaj trybu env albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, aby przejść na współdzielone dzierżawy.
  - Zwraca kod różny od zera, gdy którykolwiek scenariusz się nie powiedzie. Użyj `--allow-failures`, gdy
    chcesz artefakty bez kończenia z błędem.
  - Wymaga dwóch różnych botów w tej samej prywatnej grupie, przy czym bot SUT musi udostępniać nazwę użytkownika Telegram.
  - Dla stabilnej obserwacji bot-do-bota włącz Bot-to-Bot Communication Mode w `@BotFather` dla obu botów i upewnij się, że bot driver może obserwować ruch botów w grupie.
  - Zapisuje raport QA Telegram, podsumowanie i artefakt observed-messages w `.artifacts/qa-e2e/...`. Scenariusze odpowiedzi obejmują RTT od żądania wysłania przez driver do zaobserwowanej odpowiedzi SUT.

Linie live transport współdzielą jeden standardowy kontrakt, aby nowe transporty nie dryfowały:

`qa-channel` pozostaje szerokim syntetycznym zestawem QA i nie jest częścią macierzy pokrycia live transport.

| Linia    | Canary | Brakowanie wzmianką | Blok allowlist | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Kontynuacja wątku | Izolacja wątku | Obserwacja reakcji | Polecenie help |
| -------- | ------ | ------------------- | -------------- | ----------------------------- | ----------------------- | ----------------- | -------------- | ------------------ | -------------- |
| Matrix   | x      | x                   | x              | x                             | x                       | x                 | x              | x                  |                |
| Telegram | x      |                     |                |                               |                         |                   |                |                    | x              |

### Współdzielone poświadczenia Telegram przez Convex (v1)

Gdy `--credential-source convex` (lub `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) jest włączone dla
`openclaw qa telegram`, QA lab pobiera wyłączną dzierżawę z puli opartej na Convex, wysyła Heartbeat
tej dzierżawy, gdy linia działa, i zwalnia dzierżawę przy zamknięciu.

Referencyjny szkielet projektu Convex:

- `qa/convex-credential-broker/`

Wymagane zmienne środowiskowe:

- `OPENCLAW_QA_CONVEX_SITE_URL` (na przykład `https://your-deployment.convex.site`)
- Jeden sekret dla wybranej roli:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` dla `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` dla `ci`
- Wybór roli poświadczeń:
  - CLI: `--credential-role maintainer|ci`
  - Domyślna wartość env: `OPENCLAW_QA_CREDENTIAL_ROLE` (domyślnie `ci` w CI, w przeciwnym razie `maintainer`)

Opcjonalne zmienne środowiskowe:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (domyślnie `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (domyślnie `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (domyślnie `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (domyślnie `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (domyślnie `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (opcjonalny trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` dopuszcza adresy URL Convex `http://` przez loopback tylko do lokalnego developmentu.

`OPENCLAW_QA_CONVEX_SITE_URL` powinno w normalnej pracy używać `https://`.

Polecenia administracyjne maintainera (dodawanie/usuwanie/listowanie puli) wymagają
konkretnie `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Pomocnicze polecenia CLI dla maintainerów:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Użyj `--json`, aby uzyskać wynik czytelny maszynowo w skryptach i narzędziach CI.

Domyślny kontrakt endpointu (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Żądanie: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sukces: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Wyczerpanie/możliwość ponowienia: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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

Kształt ładunku dla rodzaju Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` musi być ciągiem numerycznego identyfikatora czatu Telegram.
- `admin/add` waliduje ten kształt dla `kind: "telegram"` i odrzuca nieprawidłowe ładunki.

### Dodawanie kanału do QA

Dodanie kanału do systemu QA w Markdown wymaga dokładnie dwóch rzeczy:

1. Adaptera transportu dla kanału.
2. Pakietu scenariuszy, który testuje kontrakt kanału.

Nie dodawaj nowego głównego korzenia poleceń QA, jeśli współdzielony host `qa-lab` może
obsłużyć ten przepływ.

`qa-lab` zarządza współdzieloną mechaniką hosta:

- korzeniem poleceń `openclaw qa`
- uruchamianiem i zamykaniem zestawu
- współbieżnością workerów
- zapisem artefaktów
- generowaniem raportów
- wykonywaniem scenariuszy
- aliasami zgodności dla starszych scenariuszy `qa-channel`

Pluginy runnerów zarządzają kontraktem transportu:

- jak `openclaw qa <runner>` jest montowane pod współdzielonym korzeniem `qa`
- jak gateway jest konfigurowany dla tego transportu
- jak sprawdzana jest gotowość
- jak wstrzykiwane są zdarzenia przychodzące
- jak obserwowane są wiadomości wychodzące
- jak udostępniane są transkrypty i znormalizowany stan transportu
- jak wykonywane są akcje oparte na transporcie
- jak obsługiwany jest reset lub cleanup specyficzny dla transportu

Minimalny próg wdrożenia dla nowego kanału to:

1. Zachowaj `qa-lab` jako właściciela współdzielonego korzenia `qa`.
2. Zaimplementuj runner transportu na współdzielonym punkcie styku hosta `qa-lab`.
3. Zachowaj mechanikę specyficzną dla transportu wewnątrz Pluginu runnera albo harnessu kanału.
4. Zamontuj runner jako `openclaw qa <runner>` zamiast rejestrować konkurencyjny korzeń polecenia.
   Pluginy runnerów powinny deklarować `qaRunners` w `openclaw.plugin.json` i eksportować pasującą tablicę `qaRunnerCliRegistrations` z `runtime-api.ts`.
   Zachowaj lekkość `runtime-api.ts`; leniwe wykonywanie CLI i runnera powinno pozostać za oddzielnymi entrypointami.
5. Napisz lub dostosuj scenariusze Markdown w tematycznych katalogach `qa/scenarios/`.
6. Używaj generycznych helperów scenariuszy dla nowych scenariuszy.
7. Zachowaj działanie istniejących aliasów zgodności, chyba że repo prowadzi celową migrację.

Reguła decyzyjna jest ścisła:

- Jeśli zachowanie można wyrazić raz w `qa-lab`, umieść je w `qa-lab`.
- Jeśli zachowanie zależy od jednego transportu kanału, zachowaj je w tym Pluginie runnera albo harnessie Pluginu.
- Jeśli scenariusz potrzebuje nowej możliwości, z której może korzystać więcej niż jeden kanał, dodaj generyczny helper zamiast gałęzi specyficznej dla kanału w `suite.ts`.
- Jeśli zachowanie ma sens tylko dla jednego transportu, zachowaj scenariusz jako specyficzny dla transportu i zaznacz to jawnie w kontrakcie scenariusza.

Preferowane generyczne nazwy helperów dla nowych scenariuszy to:

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

Aliasy zgodności pozostają dostępne dla istniejących scenariuszy, w tym:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Nowa praca nad kanałami powinna używać generycznych nazw helperów.
Aliasy zgodności istnieją po to, by uniknąć migracji typu flag day, a nie jako model
dla tworzenia nowych scenariuszy.

## Zestawy testów (co uruchamia się gdzie)

Myśl o zestawach jako o „rosnącym realizmie” (i rosnącej zawodności/koszcie):

### Unit / integration (domyślne)

- Polecenie: `pnpm test`
- Konfiguracja: niecelowane uruchomienia używają zestawu shardów `vitest.full-*.config.ts` i mogą rozwijać wieloprojektowe shardy do konfiguracji per projekt na potrzeby równoległego planowania
- Pliki: inwentarze core/unit pod `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` oraz dopuszczone testy node w `ui` objęte przez `vitest.unit.config.ts`
- Zakres:
  - Czyste testy unit
  - Testy integracyjne in-process (auth gateway, routing, narzędzia, parsowanie, konfiguracja)
  - Deterministyczne testy regresyjne dla znanych błędów
- Oczekiwania:
  - Uruchamiają się w CI
  - Nie wymagają prawdziwych kluczy
  - Powinny być szybkie i stabilne
- Uwaga o projektach:
  - Niecelowane `pnpm test` uruchamia teraz dwanaście mniejszych konfiguracji shardów (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) zamiast jednego ogromnego natywnego procesu projektu głównego. To zmniejsza szczytowy RSS na obciążonych maszynach i zapobiega temu, by prace auto-reply/extension zagłodziły niezwiązane zestawy.
  - `pnpm test --watch` nadal używa natywnego grafu projektów z korzenia `vitest.config.ts`, ponieważ wieloshardowa pętla watch nie jest praktyczna.
  - `pnpm test`, `pnpm test:watch` i `pnpm test:perf:imports` najpierw kierują jawne cele plików/katalogów przez zawężone linie, więc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` unika pełnego kosztu startowego projektu głównego.
  - `pnpm test:changed` rozwija zmienione ścieżki git do tych samych zawężonych linii, gdy diff dotyka tylko trasowalnych plików źródłowych/testowych; edycje konfiguracji/setupu nadal wracają do szerokiego ponownego uruchomienia projektu głównego.
  - `pnpm check:changed` to normalna inteligentna lokalna bramka dla wąskiej pracy. Klasyfikuje diff do core, testów core, extensions, testów extension, apps, docs, metadanych release i tooling, po czym uruchamia pasujące linie typecheck/lint/test. Zmiany publicznego Plugin SDK i kontraktów pluginów obejmują walidację extension, ponieważ extensions zależą od tych kontraktów core. Zmiany tylko w metadanych release związane z podniesieniem wersji uruchamiają celowane kontrole wersji/konfiguracji/zależności root zamiast pełnego zestawu, z ochroną odrzucającą zmiany pakietów poza polem wersji najwyższego poziomu.
  - Lekkie importowo testy unit z agents, commands, plugins, helperów auto-reply, `plugin-sdk` i podobnych czystych obszarów narzędziowych są kierowane przez linię `unit-fast`, która pomija `test/setup-openclaw-runtime.ts`; pliki stanowe/ciężkie runtime pozostają na istniejących liniach.
  - Wybrane pliki źródłowe helperów `plugin-sdk` i `commands` również mapują uruchomienia w trybie changed do jawnych testów rodzeństwa w tych lekkich liniach, dzięki czemu edycje helperów unikają ponownego uruchamiania pełnego ciężkiego zestawu dla tego katalogu.
  - `auto-reply` ma teraz trzy dedykowane koszyki: helpery core najwyższego poziomu, testy integracyjne najwyższego poziomu `reply.*` oraz poddrzewo `src/auto-reply/reply/**`. To utrzymuje najcięższy harness odpowiedzi z dala od tanich testów status/chunk/token.
- Uwaga o embedded runnerze:
  - Gdy zmieniasz wejścia wykrywania message-tool albo kontekst runtime Compaction,
    zachowaj oba poziomy pokrycia.
  - Dodaj skoncentrowane testy regresyjne helperów dla czystych granic routingu/normalizacji.
  - Utrzymuj też zdrowie osadzonych zestawów integracyjnych runnera:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` oraz
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Te zestawy weryfikują, że identyfikatory z zakresem i zachowanie Compaction nadal przepływają
    przez prawdziwe ścieżki `run.ts` / `compact.ts`; same testy helperów nie są
    wystarczającym substytutem tych ścieżek integracyjnych.
- Uwaga o puli:
  - Bazowa konfiguracja Vitest domyślnie używa `threads`.
  - Współdzielona konfiguracja Vitest ustawia też `isolate: false` i używa nieizolowanego runnera w projektach root, konfiguracjach e2e i live.
  - Linia UI z root zachowuje swój setup `jsdom` i optimizer, ale teraz działa również na współdzielonym nieizolowanym runnerze.
  - Każdy shard `pnpm test` dziedziczy te same domyślne ustawienia `threads` + `isolate: false` ze współdzielonej konfiguracji Vitest.
  - Współdzielony launcher `scripts/run-vitest.mjs` domyślnie dodaje teraz również `--no-maglev` dla podrzędnych procesów Node Vitest, aby zmniejszyć churn kompilacji V8 podczas dużych lokalnych uruchomień. Ustaw `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, jeśli chcesz porównać zachowanie ze stockowym V8.
- Uwaga o szybkiej lokalnej iteracji:
  - `pnpm changed:lanes` pokazuje, które linie architektoniczne wywołuje diff.
  - Hook pre-commit uruchamia `pnpm check:changed --staged` po sformatowaniu/lintowaniu staged, więc commity tylko core nie płacą kosztu testów extension, chyba że dotykają publicznych kontraktów skierowanych do extension. Commity tylko w metadanych release pozostają na celowanej linii wersji/konfiguracji/zależności root.
  - Jeśli dokładny zestaw zmian staged został już zweryfikowany równymi lub silniejszymi bramkami, użyj `scripts/committer --fast "<message>" <files...>`, aby pominąć tylko ponowne uruchomienie hooka changed-scope. Format/lint staged nadal się uruchomią. Wspomnij o ukończonych bramkach w handoffie. Jest to również dopuszczalne po ponownym uruchomieniu izolowanego flaky hooka, który przejdzie ze scoped proof.
  - `pnpm test:changed` kieruje przez zawężone linie, gdy zmienione ścieżki da się czysto zmapować do mniejszego zestawu.
  - `pnpm test:max` i `pnpm test:changed:max` zachowują to samo routowanie, tylko z wyższym limitem workerów.
  - Lokalne automatyczne skalowanie workerów jest teraz celowo konserwatywne i dodatkowo wycofuje się, gdy średnie obciążenie hosta jest już wysokie, więc wiele równoległych uruchomień Vitest domyślnie wyrządza mniej szkód.
  - Bazowa konfiguracja Vitest oznacza projekty/pliki konfiguracji jako `forceRerunTriggers`, aby ponowne uruchomienia w trybie changed pozostawały poprawne przy zmianie połączeń testowych.
  - Konfiguracja pozostawia `OPENCLAW_VITEST_FS_MODULE_CACHE` włączone na obsługiwanych hostach; ustaw `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, jeśli chcesz jedną jawną lokalizację cache do bezpośredniego profilowania.
- Uwaga o debugowaniu wydajności:
  - `pnpm test:perf:imports` włącza raportowanie czasu importu Vitest oraz wynik z rozbiciem importów.
  - `pnpm test:perf:imports:changed` zawęża ten sam widok profilowania do plików zmienionych względem `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje routowane `test:changed` z natywną ścieżką projektu głównego dla tego zatwierdzonego diffu i wypisuje czas ścienny oraz macOS max RSS.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżące brudne drzewo, kierując listę zmienionych plików przez `scripts/test-projects.mjs` i główną konfigurację Vitest.
  - `pnpm test:perf:profile:main` zapisuje profil CPU głównego wątku dla startu Vitest/Vite i narzutu transformacji.
  - `pnpm test:perf:profile:runner` zapisuje profile CPU+heap runnera dla zestawu unit z wyłączoną równoległością plików.

### Stability (gateway)

- Polecenie: `pnpm test:stability:gateway`
- Konfiguracja: `vitest.gateway.config.ts`, wymuszony jeden worker
- Zakres:
  - Uruchamia prawdziwy Gateway loopback z domyślnie włączoną diagnostyką
  - Przepuszcza syntetyczne obciążenie wiadomości, pamięci i dużych payloadów gateway przez ścieżkę zdarzeń diagnostycznych
  - Odpytuje `diagnostics.stability` przez Gateway WS RPC
  - Obejmuje helpery trwałości pakietu diagnostyki stability
  - Sprawdza, że rejestrator pozostaje ograniczony, syntetyczne próbki RSS pozostają poniżej budżetu presji, a głębokości kolejek per sesja spadają z powrotem do zera
- Oczekiwania:
  - Bezpieczny dla CI i bez kluczy
  - Wąska linia do śledzenia regresji stability, a nie substytut pełnego zestawu Gateway

### E2E (smoke Gateway)

- Polecenie: `pnpm test:e2e`
- Konfiguracja: `vitest.e2e.config.ts`
- Pliki: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` oraz testy E2E dołączonych Pluginów pod `extensions/`
- Domyślne ustawienia runtime:
  - Używa Vitest `threads` z `isolate: false`, zgodnie z resztą repo.
  - Używa adaptacyjnych workerów (CI: do 2, lokalnie: domyślnie 1).
  - Domyślnie działa w trybie silent, aby zmniejszyć narzut I/O konsoli.
- Przydatne nadpisania:
  - `OPENCLAW_E2E_WORKERS=<n>`, aby wymusić liczbę workerów (ograniczoną do 16).
  - `OPENCLAW_E2E_VERBOSE=1`, aby ponownie włączyć verbose output konsoli.
- Zakres:
  - Wieloinstancyjne zachowanie end-to-end Gateway
  - Powierzchnie WebSocket/HTTP, parowanie Node i cięższe sieciowanie
- Oczekiwania:
  - Uruchamia się w CI (gdy włączone w pipeline)
  - Nie wymaga prawdziwych kluczy
  - Więcej ruchomych części niż testy unit (może być wolniejszy)

### E2E: smoke backendu OpenShell

- Polecenie: `pnpm test:e2e:openshell`
- Plik: `extensions/openshell/src/backend.e2e.test.ts`
- Zakres:
  - Uruchamia izolowany Gateway OpenShell na hoście przez Docker
  - Tworzy sandbox z tymczasowego lokalnego Dockerfile
  - Testuje backend OpenShell OpenClaw przez prawdziwe `sandbox ssh-config` + wykonanie SSH
  - Weryfikuje zdalno-kanoniczne zachowanie systemu plików przez most fs sandboxa
- Oczekiwania:
  - Tylko opt-in; nie jest częścią domyślnego uruchomienia `pnpm test:e2e`
  - Wymaga lokalnego CLI `openshell` oraz działającego demona Docker
  - Używa izolowanego `HOME` / `XDG_CONFIG_HOME`, a następnie niszczy testowy gateway i sandbox
- Przydatne nadpisania:
  - `OPENCLAW_E2E_OPENSHELL=1`, aby włączyć test przy ręcznym uruchamianiu szerszego zestawu e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, aby wskazać niestandardowe binarium CLI lub skrypt wrappera

### Live (prawdziwi providerzy + prawdziwe modele)

- Polecenie: `pnpm test:live`
- Konfiguracja: `vitest.live.config.ts`
- Pliki: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` oraz testy live dołączonych Pluginów pod `extensions/`
- Domyślnie: **włączone** przez `pnpm test:live` (ustawia `OPENCLAW_LIVE_TEST=1`)
- Zakres:
  - „Czy ten provider/model rzeczywiście działa _dzisiaj_ z prawdziwymi poświadczeniami?”
  - Wychwytywanie zmian formatów providerów, dziwactw wywołań narzędzi, problemów auth i zachowania limitów szybkości
- Oczekiwania:
  - Z założenia niestabilne w CI (prawdziwe sieci, prawdziwe polityki providerów, limity, awarie)
  - Kosztują pieniądze / zużywają limity szybkości
  - Lepiej uruchamiać zawężone podzbiory niż „wszystko”
- Uruchomienia live pobierają `~/.profile`, aby uzupełnić brakujące klucze API.
- Domyślnie uruchomienia live nadal izolują `HOME` i kopiują materiał konfiguracyjny/auth do tymczasowego katalogu testowego, aby fixture unit nie mogły modyfikować Twojego prawdziwego `~/.openclaw`.
- Ustaw `OPENCLAW_LIVE_USE_REAL_HOME=1` tylko wtedy, gdy celowo chcesz, by testy live używały Twojego prawdziwego katalogu domowego.
- `pnpm test:live` domyślnie działa teraz w cichszym trybie: zachowuje wyjście postępu `[live] ...`, ale wycisza dodatkową informację o `~/.profile` oraz wyłącza logi bootstrapu gateway/hałas Bonjour. Ustaw `OPENCLAW_LIVE_TEST_QUIET=0`, jeśli chcesz z powrotem pełne logi startowe.
- Rotacja kluczy API (specyficzna dla providera): ustaw `*_API_KEYS` w formacie przecinek/średnik albo `*_API_KEY_1`, `*_API_KEY_2` (na przykład `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) albo nadpisanie per live przez `OPENCLAW_LIVE_*_KEY`; testy ponawiają próby przy odpowiedziach z limitem szybkości.
- Wyjście postępu/Heartbeat:
  - Zestawy live emitują teraz linie postępu do stderr, dzięki czemu długie wywołania providerów są wyraźnie aktywne nawet wtedy, gdy przechwytywanie konsoli Vitest jest ciche.
  - `vitest.live.config.ts` wyłącza przechwytywanie konsoli przez Vitest, dzięki czemu linie postępu providera/gateway są natychmiast strumieniowane podczas uruchomień live.
  - Dostosuj Heartbeat dla modeli bezpośrednich przez `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Dostosuj Heartbeat gateway/probe przez `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Który zestaw powinienem uruchomić?

Użyj tej tabeli decyzyjnej:

- Edycja logiki/testów: uruchom `pnpm test` (oraz `pnpm test:coverage`, jeśli dużo zmieniłeś)
- Dotykanie sieci Gateway / protokołu WS / parowania: dodaj `pnpm test:e2e`
- Debugowanie „mój bot nie działa” / błędów specyficznych dla providera / wywołań narzędzi: uruchom zawężone `pnpm test:live`

## Live: przegląd możliwości Android Node

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skrypt: `pnpm android:test:integration`
- Cel: wywołać **każde aktualnie reklamowane polecenie** podłączonego Android Node i sprawdzić zachowanie kontraktu poleceń.
- Zakres:
  - Wstępnie przygotowana/ręczna konfiguracja (zestaw nie instaluje/nie uruchamia/nie paruje aplikacji).
  - Walidacja `node.invoke` gateway polecenie po poleceniu dla wybranego Android Node.
- Wymagane przygotowanie:
  - Aplikacja Android już podłączona + sparowana z gateway.
  - Aplikacja utrzymywana na pierwszym planie.
  - Uprawnienia/zgody na przechwytywanie przyznane dla możliwości, które mają przechodzić.
- Opcjonalne nadpisania celu:
  - `OPENCLAW_ANDROID_NODE_ID` lub `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Pełne szczegóły konfiguracji Android: [Aplikacja Android](/pl/platforms/android)

## Live: smoke modeli (klucze profilowe)

Testy live są podzielone na dwie warstwy, aby można było izolować błędy:

- „Model bezpośredni” mówi nam, czy provider/model w ogóle potrafi odpowiedzieć przy danym kluczu.
- „Smoke gateway” mówi nam, czy pełny pipeline gateway+agent działa dla tego modelu (sesje, historia, narzędzia, polityka sandboxa itd.).

### Warstwa 1: Bezpośrednia kompletacja modelu (bez gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Cel:
  - Wyliczyć wykryte modele
  - Użyć `getApiKeyForModel` do wyboru modeli, dla których masz poświadczenia
  - Uruchomić małą kompletację dla każdego modelu (oraz celowane regresje tam, gdzie trzeba)
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Ustaw `OPENCLAW_LIVE_MODELS=modern` (lub `all`, alias dla modern), aby rzeczywiście uruchomić ten zestaw; w przeciwnym razie zostanie pominięty, aby `pnpm test:live` pozostało skupione na smoke gateway
- Jak wybierać modele:
  - `OPENCLAW_LIVE_MODELS=modern`, aby uruchomić nowoczesną allowlistę (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` to alias dla nowoczesnej allowlisty
  - albo `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlista rozdzielana przecinkami)
  - Przeglądy modern/all domyślnie używają kuratorowanego limitu wysokiego sygnału; ustaw `OPENCLAW_LIVE_MAX_MODELS=0` dla wyczerpującego przeglądu modern albo dodatnią liczbę dla mniejszego limitu.
- Jak wybierać providerów:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlista rozdzielana przecinkami)
- Skąd pochodzą klucze:
  - Domyślnie: magazyn profili i fallbacki env
  - Ustaw `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić użycie **wyłącznie magazynu profili**
- Dlaczego to istnieje:
  - Oddziela „API providera jest zepsute / klucz jest nieprawidłowy” od „pipeline agenta gateway jest zepsuty”
  - Zawiera małe, izolowane regresje (przykład: OpenAI Responses/Codex Responses reasoning replay + przepływy tool-call)

### Warstwa 2: Gateway + smoke agenta dev (to, co faktycznie robi „@openclaw”)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Cel:
  - Uruchomić gateway in-process
  - Utworzyć/załatać sesję `agent:dev:*` (nadpisanie modelu per przebieg)
  - Iterować po modelach-z-kluczami i sprawdzać:
    - „sensowną” odpowiedź (bez narzędzi)
    - działanie prawdziwego wywołania narzędzia (sonda odczytu)
    - opcjonalne dodatkowe sondy narzędzi (sonda exec+read)
    - ciągłe działanie ścieżek regresji OpenAI (tylko tool-call → follow-up)
- Szczegóły sond (aby móc szybko wyjaśniać błędy):
  - sonda `read`: test zapisuje plik nonce w workspace i prosi agenta o `read` go oraz odesłanie nonce.
  - sonda `exec+read`: test prosi agenta o zapisanie nonce do pliku tymczasowego przez `exec`, a następnie odczytanie go przez `read`.
  - sonda obrazu: test dołącza wygenerowany PNG (kot + losowy kod) i oczekuje, że model zwróci `cat <CODE>`.
  - Referencja implementacji: `src/gateway/gateway-models.profiles.live.test.ts` oraz `src/gateway/live-image-probe.ts`.
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Jak wybierać modele:
  - Domyślnie: nowoczesna allowlista (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` to alias dla nowoczesnej allowlisty
  - Albo ustaw `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (lub listę rozdzielaną przecinkami), aby zawęzić
  - Przeglądy gateway modern/all domyślnie używają kuratorowanego limitu wysokiego sygnału; ustaw `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` dla wyczerpującego przeglądu modern albo dodatnią liczbę dla mniejszego limitu.
- Jak wybierać providerów (aby uniknąć „wszystko przez OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlista rozdzielana przecinkami)
- Sondy narzędzi i obrazu są w tym teście live zawsze włączone:
  - sonda `read` + sonda `exec+read` (stres narzędzi)
  - sonda obrazu działa, gdy model reklamuje obsługę wejścia obrazowego
  - Przepływ (wysoki poziom):
    - Test generuje mały PNG z napisem „CAT” + losowym kodem (`src/gateway/live-image-probe.ts`)
    - Wysyła go przez `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parsuje załączniki do `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Osadzony agent przekazuje modelowi multimodalną wiadomość użytkownika
    - Sprawdzenie: odpowiedź zawiera `cat` + kod (tolerancja OCR: drobne błędy są dopuszczalne)

Wskazówka: aby zobaczyć, co możesz testować na swojej maszynie (i dokładne identyfikatory `provider/model`), uruchom:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke backendu CLI (Claude, Codex, Gemini lub inne lokalne CLI)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Cel: zweryfikować pipeline Gateway + agent przy użyciu lokalnego backendu CLI, bez dotykania domyślnej konfiguracji.
- Domyślne ustawienia smoke specyficzne dla backendu znajdują się w definicji `cli-backend.ts` należącej do odpowiedniej extension.
- Włączanie:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Domyślne wartości:
  - Domyślny provider/model: `claude-cli/claude-sonnet-4-6`
  - Zachowanie command/args/image pochodzi z metadanych Pluginu backendu CLI będącego właścicielem.
- Nadpisania (opcjonalne):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, aby wysłać prawdziwy załącznik obrazu (ścieżki są wstrzykiwane do promptu).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, aby przekazywać ścieżki plików obrazu jako argumenty CLI zamiast wstrzykiwania ich do promptu.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (lub `"list"`), aby kontrolować sposób przekazywania argumentów obrazu, gdy ustawione jest `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, aby wysłać drugą turę i zweryfikować przepływ wznowienia.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, aby wyłączyć domyślną sondę ciągłości tej samej sesji Claude Sonnet -> Opus (ustaw `1`, aby wymusić jej włączenie, gdy wybrany model obsługuje cel przełączenia).

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

Przepisy Docker dla pojedynczego providera:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Uwagi:

- Runner Docker znajduje się w `scripts/test-live-cli-backend-docker.sh`.
- Uruchamia smoke backendu CLI live wewnątrz obrazu Docker repo jako nie-rootowy użytkownik `node`.
- Rozwiązuje metadane smoke CLI z extension będącej właścicielem, a następnie instaluje pasujący pakiet Linux CLI (`@anthropic-ai/claude-code`, `@openai/codex` lub `@google/gemini-cli`) do zapisywalnego katalogu z cache w `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (domyślnie: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` wymaga przenośnego OAuth subskrypcji Claude Code przez `~/.claude/.credentials.json` z `claudeAiOauth.subscriptionType` albo `CLAUDE_CODE_OAUTH_TOKEN` z `claude setup-token`. Najpierw potwierdza bezpośrednie `claude -p` w Dockerze, a następnie uruchamia dwie tury backendu CLI Gateway bez zachowywania zmiennych env klucza Anthropic API. Ta linia subskrypcyjna domyślnie wyłącza sondy Claude MCP/tool i image, ponieważ Claude obecnie kieruje użycie aplikacji firm trzecich przez dodatkowe rozliczanie użycia zamiast zwykłych limitów planu subskrypcji.
- Smoke backendu CLI live testuje teraz ten sam przepływ end-to-end dla Claude, Codex i Gemini: tura tekstowa, tura klasyfikacji obrazu, a następnie wywołanie narzędzia MCP `cron` weryfikowane przez Gateway CLI.
- Domyślny smoke Claude dodatkowo łata sesję z Sonnet do Opus i weryfikuje, że wznowiona sesja nadal pamięta wcześniejszą notatkę.

## Live: smoke wiązania ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Cel: zweryfikować rzeczywisty przepływ wiązania konwersacji ACP z żywym agentem ACP:
  - wysłać `/acp spawn <agent> --bind here`
  - związać syntetyczną konwersację kanału wiadomości w miejscu
  - wysłać zwykły follow-up w tej samej konwersacji
  - zweryfikować, że follow-up trafia do transkryptu związanej sesji ACP
- Włączanie:
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
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- Uwagi:
  - Ta linia używa powierzchni gateway `chat.send` z polami syntetycznej trasy pochodzenia dostępnymi tylko dla administratora, aby testy mogły dołączyć kontekst kanału wiadomości bez udawania zewnętrznego dostarczania.
  - Gdy `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nie jest ustawione, test używa wbudowanego rejestru agentów Pluginu `acpx` dla wybranego agenta harness ACP.

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

Przepisy Docker dla pojedynczych agentów:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Uwagi dotyczące Dockera:

- Runner Docker znajduje się w `scripts/test-live-acp-bind-docker.sh`.
- Domyślnie uruchamia smoke ACP bind względem wszystkich obsługiwanych żywych agentów CLI po kolei: `claude`, `codex`, potem `gemini`.
- Użyj `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` albo `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, aby zawęzić macierz.
- Pobiera `~/.profile`, przygotowuje pasujący materiał auth CLI do kontenera, instaluje `acpx` do zapisywalnego prefiksu npm, a następnie instaluje żądane CLI live (`@anthropic-ai/claude-code`, `@openai/codex` albo `@google/gemini-cli`), jeśli go brakuje.
- Wewnątrz Dockera runner ustawia `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, dzięki czemu acpx zachowuje zmienne env providera z pobranego profilu dostępne dla podrzędnego harness CLI.

## Live: smoke harnessu app-server Codex

- Cel: zweryfikować należący do Pluginu harness Codex przez zwykłą metodę gateway
  `agent`:
  - załadować dołączony Plugin `codex`
  - wybrać `OPENCLAW_AGENT_RUNTIME=codex`
  - wysłać pierwszą turę gateway agent do `codex/gpt-5.4`
  - wysłać drugą turę do tej samej sesji OpenClaw i zweryfikować, że wątek app-server
    może zostać wznowiony
  - uruchomić `/codex status` i `/codex models` przez tę samą ścieżkę poleceń gateway
  - opcjonalnie uruchomić dwie eskalowane sondy shell przeglądane przez Guardian: jedno nieszkodliwe
    polecenie, które powinno zostać zatwierdzone, i jedno fałszywe przesłanie sekretu,
    które powinno zostać odrzucone, aby agent dopytał
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Włączanie: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Domyślny model: `codex/gpt-5.4`
- Opcjonalna sonda obrazu: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Opcjonalna sonda MCP/tool: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Opcjonalna sonda Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke ustawia `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, aby uszkodzony harness Codex
  nie mógł przejść przez cichy fallback do PI.
- Auth: `OPENAI_API_KEY` z powłoki/profilu oraz opcjonalnie skopiowane
  `~/.codex/auth.json` i `~/.codex/config.toml`

Lokalny przepis:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Przepis Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Uwagi dotyczące Dockera:

- Runner Docker znajduje się w `scripts/test-live-codex-harness-docker.sh`.
- Pobiera zamontowane `~/.profile`, przekazuje `OPENAI_API_KEY`, kopiuje pliki
  auth CLI Codex, gdy są obecne, instaluje `@openai/codex` do zapisywalnego montowanego prefiksu npm,
  przygotowuje drzewo źródeł, a następnie uruchamia tylko test live Codex-harness.
- Docker domyślnie włącza sondy obrazu, MCP/tool i Guardian. Ustaw
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` albo
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` albo
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, gdy potrzebujesz węższego uruchomienia debugowego.
- Docker eksportuje również `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, zgodnie z konfiguracją
  testu live, dzięki czemu fallback `openai-codex/*` albo PI nie może ukryć regresji
  harnessu Codex.

### Zalecane przepisy live

Wąskie, jawne allowlisty są najszybsze i najmniej podatne na flaky zachowanie:

- Pojedynczy model, bezpośrednio (bez gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Pojedynczy model, smoke gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Wywoływanie narzędzi przez kilku providerów:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Skupienie na Google (klucz Gemini API + Antigravity):
  - Gemini (klucz API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Uwagi:

- `google/...` używa Gemini API (klucz API).
- `google-antigravity/...` używa mostka OAuth Antigravity (endpoint agenta w stylu Cloud Code Assist).
- `google-gemini-cli/...` używa lokalnego Gemini CLI na Twojej maszynie (oddzielne auth + specyficzne zachowanie narzędzi).
- Gemini API vs Gemini CLI:
  - API: OpenClaw wywołuje hostowane Gemini API Google przez HTTP (klucz API / auth profilu); to właśnie większość użytkowników ma na myśli, mówiąc „Gemini”.
  - CLI: OpenClaw wykonuje lokalne binarium `gemini`; ma własne auth i może zachowywać się inaczej (streaming/obsługa narzędzi/rozbieżność wersji).

## Live: macierz modeli (co obejmujemy)

Nie ma stałej „listy modeli CI” (live jest opt-in), ale to są **zalecane** modele do regularnego pokrywania na maszynie developerskiej z kluczami.

### Nowoczesny zestaw smoke (wywoływanie narzędzi + obraz)

To jest przebieg „typowych modeli”, który oczekujemy utrzymywać działający:

- OpenAI (nie-Codex): `openai/gpt-5.4` (opcjonalnie: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` oraz `google/gemini-3-flash-preview` (unikaj starszych modeli Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` oraz `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Uruchom smoke gateway z narzędziami + obrazem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baza: wywoływanie narzędzi (Read + opcjonalnie Exec)

Wybierz co najmniej jeden model z każdej rodziny providerów:

- OpenAI: `openai/gpt-5.4` (lub `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (lub `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Opcjonalne dodatkowe pokrycie (mile widziane):

- xAI: `xai/grok-4` (lub najnowszy dostępny)
- Mistral: `mistral/`… (wybierz jeden model zdolny do pracy z narzędziami, który masz włączony)
- Cerebras: `cerebras/`… (jeśli masz dostęp)
- LM Studio: `lmstudio/`… (lokalnie; wywoływanie narzędzi zależy od trybu API)

### Vision: wysyłanie obrazu (załącznik → wiadomość multimodalna)

Uwzględnij co najmniej jeden model zdolny do pracy z obrazem w `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/warianty OpenAI obsługujące vision itd.), aby przetestować sondę obrazu.

### Agregatory / alternatywne gatewaye

Jeśli masz włączone klucze, obsługujemy również testowanie przez:

- OpenRouter: `openrouter/...` (setki modeli; użyj `openclaw models scan`, aby znaleźć kandydatów zdolnych do narzędzi+obrazu)
- OpenCode: `opencode/...` dla Zen i `opencode-go/...` dla Go (auth przez `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Więcej providerów, które możesz uwzględnić w macierzy live (jeśli masz poświadczenia/konfigurację):

- Wbudowani: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Przez `models.providers` (niestandardowe endpointy): `minimax` (cloud/API) oraz dowolny proxy zgodny z OpenAI/Anthropic (LM Studio, vLLM, LiteLLM itd.)

Wskazówka: nie próbuj na sztywno wpisywać do dokumentacji „wszystkich modeli”. Autorytatywna lista to to, co zwraca `discoverModels(...)` na Twojej maszynie + jakie klucze są dostępne.

## Poświadczenia (nigdy nie commituj)

Testy live wykrywają poświadczenia tak samo jak CLI. Praktyczne konsekwencje:

- Jeśli CLI działa, testy live powinny znaleźć te same klucze.
- Jeśli test live mówi „brak poświadczeń”, debuguj to tak samo, jak debugowałbyś `openclaw models list` / wybór modelu.

- Profile auth per agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (to właśnie oznaczają „klucze profilowe” w testach live)
- Konfiguracja: `~/.openclaw/openclaw.json` (lub `OPENCLAW_CONFIG_PATH`)
- Starszy katalog stanu: `~/.openclaw/credentials/` (kopiowany do przygotowanego katalogu domowego live, gdy jest obecny, ale nie jest głównym magazynem kluczy profilowych)
- Lokalne uruchomienia live domyślnie kopiują aktywną konfigurację, pliki `auth-profiles.json` per agent, starsze `credentials/` oraz obsługiwane zewnętrzne katalogi auth CLI do tymczasowego katalogu domowego testów; przygotowane katalogi domowe live pomijają `workspace/` i `sandboxes/`, a nadpisania ścieżek `agents.*.workspace` / `agentDir` są usuwane, aby sondy pozostawały poza Twoim prawdziwym workspace hosta.

Jeśli chcesz polegać na kluczach env (np. wyeksportowanych w `~/.profile`), uruchamiaj lokalne testy po `source ~/.profile`, albo użyj runnerów Docker poniżej (mogą montować `~/.profile` do kontenera).

## Deepgram live (transkrypcja audio)

- Test: `extensions/deepgram/audio.live.test.ts`
- Włączanie: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Test: `extensions/byteplus/live.test.ts`
- Włączanie: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Opcjonalne nadpisanie modelu: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- Test: `extensions/comfy/comfy.live.test.ts`
- Włączanie: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Zakres:
  - Testuje dołączone ścieżki comfy dla obrazów, wideo i `music_generate`
  - Pomija każdą możliwość, chyba że skonfigurowano `models.providers.comfy.<capability>`
  - Przydatne po zmianach w wysyłaniu workflow comfy, pollingu, pobieraniu albo rejestracji Pluginu

## Image generation live

- Test: `test/image-generation.runtime.live.test.ts`
- Polecenie: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Zakres:
  - Wylicza każdy zarejestrowany Plugin providera generowania obrazów
  - Ładuje brakujące zmienne env providera z Twojej powłoki logowania (`~/.profile`) przed sondowaniem
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami auth, dzięki czemu nieaktualne klucze testowe w `auth-profiles.json` nie maskują prawdziwych poświadczeń z powłoki
  - Pomija providerów bez użytecznego auth/profilu/modelu
  - Uruchamia standardowe warianty generowania obrazów przez współdzieloną możliwość runtime:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Aktualnie objęci dołączeni providerzy:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić auth z magazynu profili i ignorować nadpisania tylko z env

## Music generation live

- Test: `extensions/music-generation-providers.live.test.ts`
- Włączanie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Zakres:
  - Testuje współdzieloną dołączoną ścieżkę providera generowania muzyki
  - Obecnie obejmuje Google i MiniMax
  - Ładuje zmienne env providera z Twojej powłoki logowania (`~/.profile`) przed sondowaniem
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami auth, dzięki czemu nieaktualne klucze testowe w `auth-profiles.json` nie maskują prawdziwych poświadczeń z powłoki
  - Pomija providerów bez użytecznego auth/profilu/modelu
  - Uruchamia oba zadeklarowane tryby runtime, gdy są dostępne:
    - `generate` z wejściem tylko prompt
    - `edit`, gdy provider deklaruje `capabilities.edit.enabled`
  - Aktualne pokrycie współdzielonej linii:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: osobny plik live Comfy, nie ten współdzielony przegląd
- Opcjonalne zawężanie:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Opcjonalne zachowanie auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić auth z magazynu profili i ignorować nadpisania tylko z env

## Video generation live

- Test: `extensions/video-generation-providers.live.test.ts`
- Włączanie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Zakres:
  - Testuje współdzieloną dołączoną ścieżkę providera generowania wideo
  - Domyślnie używa bezpiecznej dla wydań ścieżki smoke: providery inne niż FAL, jedno żądanie text-to-video na providera, jednosekundowy prompt z homarem oraz limit operacji per provider z `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` domyślnie)
  - Domyślnie pomija FAL, ponieważ opóźnienie kolejki po stronie providera może zdominować czas wydania; przekaż `--video-providers fal` albo `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, aby uruchomić go jawnie
  - Ładuje zmienne env providera z Twojej powłoki logowania (`~/.profile`) przed sondowaniem
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami auth, dzięki czemu nieaktualne klucze testowe w `auth-profiles.json` nie maskują prawdziwych poświadczeń z powłoki
  - Pomija providerów bez użytecznego auth/profilu/modelu
  - Domyślnie uruchamia tylko `generate`
  - Ustaw `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, aby uruchomić także zadeklarowane tryby transformacji, gdy są dostępne:
    - `imageToVideo`, gdy provider deklaruje `capabilities.imageToVideo.enabled` i wybrany provider/model akceptuje wejście lokalnego obrazu oparte na buforze we współdzielonym przeglądzie
    - `videoToVideo`, gdy provider deklaruje `capabilities.videoToVideo.enabled` i wybrany provider/model akceptuje wejście lokalnego wideo oparte na buforze we współdzielonym przeglądzie
  - Aktualni dostawcy `imageToVideo` zadeklarowani, ale pomijani we współdzielonym przeglądzie:
    - `vydra`, ponieważ dołączony `veo3` obsługuje tylko tekst, a dołączony `kling` wymaga zdalnego URL obrazu
  - Pokrycie Vydra specyficzne dla providera:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ten plik uruchamia `veo3` text-to-video oraz linię `kling`, która domyślnie używa fixture zdalnego URL obrazu
  - Aktualne pokrycie live `videoToVideo`:
    - tylko `runway`, gdy wybrany model to `runway/gen4_aleph`
  - Aktualni dostawcy `videoToVideo` zadeklarowani, ale pomijani we współdzielonym przeglądzie:
    - `alibaba`, `qwen`, `xai`, ponieważ te ścieżki obecnie wymagają zdalnych referencyjnych URL `http(s)` / MP4
    - `google`, ponieważ bieżąca współdzielona linia Gemini/Veo używa lokalnego wejścia opartego na buforze, a ta ścieżka nie jest akceptowana we współdzielonym przeglądzie
    - `openai`, ponieważ bieżąca współdzielona linia nie gwarantuje dostępu do organizacyjnie specyficznych funkcji video inpaint/remix
- Opcjonalne zawężanie:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, aby uwzględnić każdego providera w domyślnym przeglądzie, w tym FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, aby zmniejszyć limit operacji dla każdego providera na potrzeby agresywnego przebiegu smoke
- Opcjonalne zachowanie auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić auth z magazynu profili i ignorować nadpisania tylko z env

## Harness media live

- Polecenie: `pnpm test:live:media`
- Cel:
  - Uruchamia współdzielone zestawy image, music i video live przez jeden natywny dla repo entrypoint
  - Automatycznie ładuje brakujące zmienne env providera z `~/.profile`
  - Domyślnie automatycznie zawęża każdy zestaw do providerów, które obecnie mają użyteczne auth
  - Ponownie używa `scripts/test-live.mjs`, dzięki czemu zachowanie Heartbeat i quiet-mode pozostaje spójne
- Przykłady:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Runnery Docker (opcjonalne kontrole typu „działa w Linuxie”)

Te runnery Docker dzielą się na dwa koszyki:

- Runnery modeli live: `test:docker:live-models` i `test:docker:live-gateway` uruchamiają tylko odpowiadający im plik live z kluczami profilowymi wewnątrz obrazu Docker repo (`src/agents/models.profiles.live.test.ts` i `src/gateway/gateway-models.profiles.live.test.ts`), montując lokalny katalog konfiguracyjny i workspace (oraz pobierając `~/.profile`, jeśli jest zamontowany). Odpowiadające lokalne entrypointy to `test:live:models-profiles` i `test:live:gateway-profiles`.
- Runnery Docker live domyślnie używają mniejszego limitu smoke, aby pełny przegląd Docker pozostawał praktyczny:
  `test:docker:live-models` domyślnie ustawia `OPENCLAW_LIVE_MAX_MODELS=12`, a
  `test:docker:live-gateway` domyślnie ustawia `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` oraz
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Nadpisz te zmienne env, gdy
  jawnie chcesz większego, wyczerpującego skanu.
- `test:docker:all` buduje obraz Docker live raz przez `test:docker:live-build`, a następnie ponownie go używa dla dwóch linii live Docker. Buduje też jeden współdzielony obraz `scripts/e2e/Dockerfile` przez `test:docker:e2e-build` i używa go ponownie dla runnerów smoke kontenerów E2E, które testują zbudowaną aplikację.
- Runnery smoke kontenerów: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` oraz `test:docker:config-reload` uruchamiają jeden lub więcej prawdziwych kontenerów i weryfikują wyższe ścieżki integracyjne.

Runnery Docker modeli live dodatkowo bind-mountują tylko potrzebne katalogi domowe auth CLI (albo wszystkie obsługiwane, gdy przebieg nie jest zawężony), a następnie kopiują je do katalogu domowego kontenera przed uruchomieniem, aby zewnętrzny OAuth CLI mógł odświeżać tokeny bez modyfikowania magazynu auth hosta:

- Modele bezpośrednie: `pnpm test:docker:live-models` (skrypt: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (skrypt: `scripts/test-live-acp-bind-docker.sh`)
- Smoke backendu CLI: `pnpm test:docker:live-cli-backend` (skrypt: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harnessu app-server Codex: `pnpm test:docker:live-codex-harness` (skrypt: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev: `pnpm test:docker:live-gateway` (skrypt: `scripts/test-live-gateway-models-docker.sh`)
- Smoke Open WebUI live: `pnpm test:docker:openwebui` (skrypt: `scripts/e2e/openwebui-docker.sh`)
- Kreator onboardingu (TTY, pełne scaffoldowanie): `pnpm test:docker:onboard` (skrypt: `scripts/e2e/onboard-docker.sh`)
- Smoke onboardingu/kanału/agenta z archiwum npm: `pnpm test:docker:npm-onboard-channel-agent` instaluje spakowane archiwum OpenClaw globalnie w Dockerze, konfiguruje OpenAI przez onboarding z odwołaniem do env oraz domyślnie Telegram, weryfikuje, że włączenie Pluginu instaluje jego zależności runtime na żądanie, uruchamia doctor i uruchamia jedną mockowaną turę agenta OpenAI. Użyj ponownie wstępnie zbudowanego archiwum przez `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń przebudowę hosta przez `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` albo przełącz kanał przez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Sieć Gateway (dwa kontenery, auth WS + health): `pnpm test:docker:gateway-network` (skrypt: `scripts/e2e/gateway-network-docker.sh`)
- Minimalna regresja rozumowania OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (skrypt: `scripts/e2e/openai-web-search-minimal-docker.sh`) uruchamia mockowany serwer OpenAI przez Gateway, weryfikuje, że `web_search` podnosi `reasoning.effort` z `minimal` do `low`, a następnie wymusza odrzucenie schematu providera i sprawdza, że surowy szczegół pojawia się w logach Gateway.
- Most kanału MCP (zainicjalizowany Gateway + most stdio + smoke surowej ramki powiadomień Claude): `pnpm test:docker:mcp-channels` (skrypt: `scripts/e2e/mcp-channels-docker.sh`)
- Narzędzia Pi bundle MCP (prawdziwy serwer MCP stdio + smoke allow/deny osadzonego profilu Pi): `pnpm test:docker:pi-bundle-mcp-tools` (skrypt: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cleanup MCP Cron/podagenta (prawdziwy Gateway + teardown podrzędnego MCP stdio po izolowanych przebiegach Cron i jednorazowego podagenta): `pnpm test:docker:cron-mcp-cleanup` (skrypt: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install smoke + alias `/plugin` + semantyka restartu pakietu Claude): `pnpm test:docker:plugins` (skrypt: `scripts/e2e/plugins-docker.sh`)
- Smoke niezmienionej aktualizacji Pluginu: `pnpm test:docker:plugin-update` (skrypt: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke metadanych reloadu konfiguracji: `pnpm test:docker:config-reload` (skrypt: `scripts/e2e/config-reload-source-docker.sh`)
- Zależności runtime dołączonych Pluginów: `pnpm test:docker:bundled-channel-deps` domyślnie buduje mały obraz runnera Docker, buduje i pakuje OpenClaw raz na hoście, a następnie montuje to archiwum w każdym scenariuszu instalacji Linux. Użyj ponownie obrazu przez `OPENCLAW_SKIP_DOCKER_BUILD=1`, pomiń przebudowę hosta po świeżym lokalnym buildzie przez `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, albo wskaż istniejące archiwum przez `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Podczas iteracji zawęż zależności runtime dołączonych Pluginów, wyłączając niezwiązane scenariusze, na przykład:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Aby ręcznie wstępnie zbudować i używać ponownie współdzielonego obrazu built-app:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Nadpisania obrazu specyficzne dla zestawu, takie jak `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, nadal mają pierwszeństwo, gdy są ustawione. Gdy `OPENCLAW_SKIP_DOCKER_BUILD=1` wskazuje na zdalny współdzielony obraz, skrypty pobierają go, jeśli nie ma go jeszcze lokalnie. Testy Docker dla QR i instalatora zachowują własne Dockerfile, ponieważ walidują zachowanie pakietu/instalacji, a nie współdzielony runtime zbudowanej aplikacji.

Runnery Docker modeli live dodatkowo montują bieżący checkout w trybie tylko do odczytu i
przygotowują go w tymczasowym katalogu roboczym wewnątrz kontenera. Dzięki temu obraz runtime
pozostaje lekki, a jednocześnie Vitest działa na dokładnie Twoim lokalnym źródle/konfiguracji.
Krok przygotowania pomija duże lokalne cache i wyniki buildów aplikacji, takie jak
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` oraz lokalne dla aplikacji katalogi `.build` albo
wyjścia Gradle, aby uruchomienia Docker live nie spędzały minut na kopiowaniu
artefaktów specyficznych dla maszyny.
Ustawiają one również `OPENCLAW_SKIP_CHANNELS=1`, aby sondy gateway live nie uruchamiały
prawdziwych workerów kanałów Telegram/Discord itd. wewnątrz kontenera.
`test:docker:live-models` nadal uruchamia `pnpm test:live`, więc przekazuj dalej
także `OPENCLAW_LIVE_GATEWAY_*`, gdy potrzebujesz zawęzić lub wykluczyć pokrycie gateway
live z tej linii Docker.
`test:docker:openwebui` to smoke zgodności wyższego poziomu: uruchamia kontener
Gateway OpenClaw z włączonymi endpointami HTTP zgodnymi z OpenAI,
uruchamia przypięty kontener Open WebUI względem tego gateway, loguje się przez
Open WebUI, weryfikuje, że `/api/models` udostępnia `openclaw/default`, a następnie wysyła
prawdziwe żądanie czatu przez proxy `/api/chat/completions` Open WebUI.
Pierwszy przebieg może być zauważalnie wolniejszy, ponieważ Docker może potrzebować pobrać
obraz Open WebUI, a Open WebUI może potrzebować ukończyć własny cold-start setup.
Ta linia oczekuje użytecznego klucza modelu live, a `OPENCLAW_PROFILE_FILE`
(domyślnie `~/.profile`) jest podstawowym sposobem dostarczenia go w uruchomieniach dockerowych.
Udane uruchomienia wypisują niewielki ładunek JSON, taki jak `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` jest celowo deterministyczny i nie potrzebuje
prawdziwego konta Telegram, Discord ani iMessage. Uruchamia zainicjalizowany kontener
Gateway, uruchamia drugi kontener, który startuje `openclaw mcp serve`, a następnie
weryfikuje wykrywanie routowanych konwersacji, odczyty transkryptów, metadane załączników,
zachowanie kolejki zdarzeń live, routing wysyłek wychodzących oraz powiadomienia w stylu Claude dotyczące kanałów +
uprawnień przez prawdziwy most stdio MCP. Kontrola powiadomień
sprawdza bezpośrednio surowe ramki stdio MCP, dzięki czemu smoke waliduje to, co
most rzeczywiście emituje, a nie tylko to, co akurat pokazuje konkretny SDK klienta.
`test:docker:pi-bundle-mcp-tools` jest deterministyczny i nie potrzebuje klucza modelu
live. Buduje obraz Docker repo, uruchamia prawdziwy serwer sondy MCP stdio
wewnątrz kontenera, materializuje ten serwer przez osadzony runtime Pi bundle
MCP, wykonuje narzędzie, a następnie weryfikuje, że `coding` i `messaging` zachowują
narzędzia `bundle-mcp`, podczas gdy `minimal` i `tools.deny: ["bundle-mcp"]` je filtrują.
`test:docker:cron-mcp-cleanup` jest deterministyczny i nie potrzebuje klucza modelu
live. Uruchamia zainicjalizowany Gateway z prawdziwym serwerem sondy MCP stdio, wykonuje
izolowaną turę Cron oraz jednorazową turę podrzędnego procesu `/subagents spawn`, a następnie
weryfikuje, że podrzędny proces MCP kończy działanie po każdym przebiegu.

Ręczny smoke ACP plain-language thread (nie CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Zachowaj ten skrypt dla przepływów regresyjnych/debugowych. Może być ponownie potrzebny do walidacji routingu wątków ACP, więc go nie usuwaj.

Przydatne zmienne env:

- `OPENCLAW_CONFIG_DIR=...` (domyślnie: `~/.openclaw`) montowane do `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (domyślnie: `~/.openclaw/workspace`) montowane do `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (domyślnie: `~/.profile`) montowane do `/home/node/.profile` i pobierane przed uruchomieniem testów
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, aby zweryfikować wyłącznie zmienne env pobrane z `OPENCLAW_PROFILE_FILE`, z użyciem tymczasowych katalogów config/workspace i bez montowania zewnętrznych auth CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (domyślnie: `~/.cache/openclaw/docker-cli-tools`) montowane do `/home/node/.npm-global` dla cache instalacji CLI wewnątrz Dockera
- Zewnętrzne katalogi/pliki auth CLI pod `$HOME` są montowane w trybie tylko do odczytu pod `/host-auth...`, a następnie kopiowane do `/home/node/...` przed startem testów
  - Domyślne katalogi: `.minimax`
  - Domyślne pliki: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Zawężone przebiegi providerów montują tylko potrzebne katalogi/pliki wywnioskowane z `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Nadpisz ręcznie przez `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` albo listę rozdzielaną przecinkami, taką jak `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, aby zawęzić przebieg
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, aby filtrować providerów w kontenerze
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby ponownie użyć istniejącego obrazu `openclaw:local-live` dla kolejnych uruchomień, które nie wymagają przebudowy
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby upewnić się, że poświadczenia pochodzą z magazynu profili (a nie z env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, aby wybrać model udostępniany przez gateway dla smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, aby nadpisać prompt sprawdzający nonce używany przez smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, aby nadpisać przypięty tag obrazu Open WebUI

## Kontrola poprawności dokumentacji

Uruchamiaj kontrole dokumentacji po edycjach docs: `pnpm check:docs`.
Uruchamiaj pełną walidację anchorów Mintlify, gdy potrzebujesz również sprawdzeń nagłówków w obrębie strony: `pnpm docs:check-links:anchors`.

## Regresje offline (bezpieczne dla CI)

To regresje „prawdziwego pipeline” bez prawdziwych providerów:

- Wywoływanie narzędzi Gateway (mock OpenAI, prawdziwy gateway + pętla agenta): `src/gateway/gateway.test.ts` (przypadek: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Kreator Gateway (WS `wizard.start`/`wizard.next`, wymuszone zapisy config + auth): `src/gateway/gateway.test.ts` (przypadek: "runs wizard over ws and writes auth token config")

## Oceny niezawodności agenta (Skills)

Mamy już kilka bezpiecznych dla CI testów, które zachowują się jak „oceny niezawodności agenta”:

- Mockowane wywoływanie narzędzi przez prawdziwy gateway + pętlę agenta (`src/gateway/gateway.test.ts`).
- End-to-end przepływy kreatora, które walidują powiązanie sesji i efekty konfiguracji (`src/gateway/gateway.test.ts`).

Czego nadal brakuje dla Skills (zobacz [Skills](/pl/tools/skills)):

- **Decyzyjność:** gdy Skills są wymienione w prompcie, czy agent wybiera właściwe Skills (albo unika nieistotnych)?
- **Zgodność:** czy agent czyta `SKILL.md` przed użyciem i wykonuje wymagane kroki/argumenty?
- **Kontrakty przepływu pracy:** scenariusze wieloturowe, które sprawdzają kolejność narzędzi, przenoszenie historii sesji i granice sandboxa.

Przyszłe oceny powinny najpierw pozostać deterministyczne:

- Runner scenariuszy używający mock providerów do sprawdzania wywołań narzędzi + kolejności, odczytów plików Skills i powiązania sesji.
- Mały zestaw scenariuszy skupionych na Skills (użyj vs unikaj, bramkowanie, prompt injection).
- Opcjonalne oceny live (opt-in, ograniczone env) dopiero po wdrożeniu zestawu bezpiecznego dla CI.

## Testy kontraktowe (kształt pluginów i kanałów)

Testy kontraktowe weryfikują, że każdy zarejestrowany Plugin i kanał jest zgodny ze swoim
kontraktem interfejsu. Iterują po wszystkich wykrytych Pluginach i uruchamiają zestaw
sprawdzeń kształtu i zachowania. Domyślna linia unit `pnpm test` celowo
pomija te współdzielone pliki seam i smoke; uruchamiaj polecenia kontraktowe jawnie,
gdy dotykasz współdzielonych powierzchni kanałów lub providerów.

### Polecenia

- Wszystkie kontrakty: `pnpm test:contracts`
- Tylko kontrakty kanałów: `pnpm test:contracts:channels`
- Tylko kontrakty providerów: `pnpm test:contracts:plugins`

### Kontrakty kanałów

Znajdują się w `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Podstawowy kształt Pluginu (id, nazwa, możliwości)
- **setup** - Kontrakt kreatora konfiguracji
- **session-binding** - Zachowanie wiązania sesji
- **outbound-payload** - Struktura payloadu wiadomości
- **inbound** - Obsługa wiadomości przychodzących
- **actions** - Handlery akcji kanału
- **threading** - Obsługa identyfikatorów wątków
- **directory** - API katalogu/listy
- **group-policy** - Egzekwowanie polityki grup

### Kontrakty statusu providerów

Znajdują się w `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondy statusu kanałów
- **registry** - Kształt rejestru Pluginów

### Kontrakty providerów

Znajdują się w `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrakt przepływu auth
- **auth-choice** - Wybór/selekcja auth
- **catalog** - API katalogu modeli
- **discovery** - Odkrywanie Pluginów
- **loader** - Ładowanie Pluginów
- **runtime** - Runtime providera
- **shape** - Kształt/interfejs Pluginu
- **wizard** - Kreator konfiguracji

### Kiedy uruchamiać

- Po zmianie eksportów lub ścieżek podrzędnych Plugin SDK
- Po dodaniu lub modyfikacji Pluginu kanału albo providera
- Po refaktoryzacji rejestracji lub wykrywania Pluginów

Testy kontraktowe uruchamiają się w CI i nie wymagają prawdziwych kluczy API.

## Dodawanie regresji (wskazówki)

Gdy naprawiasz problem providera/modelu wykryty w live:

- Jeśli to możliwe, dodaj regresję bezpieczną dla CI (mock/stub providera albo przechwycenie dokładnej transformacji kształtu żądania)
- Jeśli z natury jest to tylko live (limity szybkości, polityki auth), utrzymuj test live wąski i opt-in przez zmienne env
- Preferuj targetowanie najmniejszej warstwy, która wychwytuje błąd:
  - błąd konwersji/odtwarzania żądania providera → test modeli bezpośrednich
  - błąd pipeline sesji/historii/narzędzi gateway → smoke gateway live albo bezpieczny dla CI test mock gateway
- Guardrail przechodzenia SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` wyprowadza jeden przykładowy cel dla każdej klasy SecretRef z metadanych rejestru (`listSecretTargetRegistryEntries()`), a następnie sprawdza, że identyfikatory exec segmentów przejścia są odrzucane.
  - Jeśli dodasz nową rodzinę celów SecretRef `includeInPlan` w `src/secrets/target-registry-data.ts`, zaktualizuj `classifyTargetClass` w tym teście. Test celowo kończy się błędem dla niesklasyfikowanych identyfikatorów celów, aby nowe klasy nie mogły zostać pominięte po cichu.
