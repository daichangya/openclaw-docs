---
read_when:
    - Uruchamianie testów lokalnie lub w CI
    - Dodawanie testów regresyjnych dla błędów modeli/dostawców
    - Debugowanie zachowania gateway + agenta
summary: 'Zestaw testowy: zestawy unit/e2e/live, runnery Docker i zakres każdego testu'
title: Testowanie
x-i18n:
    generated_at: "2026-04-25T13:49:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8352a695890b2bef8d15337c6371f33363222ec371f91dd0e6a8ba84cccbbc8
    source_path: help/testing.md
    workflow: 15
---

OpenClaw ma trzy zestawy Vitest (unit/integration, e2e, live) oraz mały zestaw
runnerów Docker. Ten dokument to przewodnik „jak testujemy”:

- Co obejmuje każdy zestaw (i czego celowo _nie_ obejmuje).
- Które polecenia uruchamiać dla typowych przepływów pracy (lokalnie, przed push, debugowanie).
- Jak testy live wykrywają poświadczenia oraz wybierają modele/dostawców.
- Jak dodawać regresje dla rzeczywistych problemów modeli/dostawców.

## Szybki start

Na co dzień:

- Pełna bramka (oczekiwana przed push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Szybsze lokalne uruchomienie pełnego zestawu na wydajnej maszynie: `pnpm test:max`
- Bezpośrednia pętla watch Vitest: `pnpm test:watch`
- Bezpośrednie wskazywanie plików obsługuje teraz także ścieżki extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Przy iteracji nad pojedynczą awarią najpierw preferuj uruchomienia ukierunkowane.
- Witryna QA oparta na Docker: `pnpm qa:lab:up`
- Linia QA oparta na Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Gdy zmieniasz testy albo chcesz mieć większą pewność:

- Bramka pokrycia: `pnpm test:coverage`
- Zestaw E2E: `pnpm test:e2e`

Podczas debugowania rzeczywistych dostawców/modeli (wymaga prawdziwych poświadczeń):

- Zestaw live (modele + sondy narzędzi/obrazów gateway): `pnpm test:live`
- Uruchom cicho jeden plik live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Skan modeli live w Docker: `pnpm test:docker:live-models`
  - Każdy wybrany model uruchamia teraz turę tekstową oraz małą sondę w stylu odczytu pliku.
    Modele, których metadane deklarują wejście `image`, uruchamiają też małą turę obrazową.
    Wyłącz dodatkowe sondy przez `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` lub
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, gdy izolujesz awarie dostawców.
  - Pokrycie CI: codzienne `OpenClaw Scheduled Live And E2E Checks` oraz ręczne
    `OpenClaw Release Checks` wywołują współużywany workflow live/E2E z
    `include_live_suites: true`, który zawiera osobne zadania macierzy Docker live modeli
    podzielone według dostawcy.
  - Dla ukierunkowanych ponownych uruchomień CI wyślij `OpenClaw Live And E2E Checks (Reusable)`
    z `include_live_suites: true` i `live_models_only: true`.
  - Dodaj nowe sekrety dostawców o wysokiej wartości sygnałowej do `scripts/ci-hydrate-live-auth.sh`
    oraz `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` i jego
    wywołań schedule/release.
- Native Codex powiązany czat smoke: `pnpm test:docker:live-codex-bind`
  - Uruchamia linię Docker live względem ścieżki serwera aplikacji Codex, wiąże syntetyczny
    Slack DM przez `/codex bind`, wykonuje `/codex fast` i
    `/codex permissions`, a następnie sprawdza, że zwykła odpowiedź i załącznik obrazu
    przechodzą przez natywne powiązanie Plugin zamiast ACP.
- Smoke polecenia ratunkowego Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Opcjonalna kontrola typu belt-and-suspenders dla powierzchni polecenia ratunkowego kanału wiadomości.
    Wykonuje `/crestodian status`, umieszcza w kolejce trwałą zmianę modelu,
    odpowiada `/crestodian yes` i weryfikuje ścieżkę audytu/zapisu konfiguracji.
- Smoke planera Crestodian w Docker: `pnpm test:docker:crestodian-planner`
  - Uruchamia Crestodian w kontenerze bez konfiguracji z fałszywym Claude CLI na `PATH`
    i sprawdza, że rozmyty fallback planera przekłada się na audytowany typowany zapis konfiguracji.
- Smoke pierwszego uruchomienia Crestodian w Docker: `pnpm test:docker:crestodian-first-run`
  - Startuje z pustego katalogu stanu OpenClaw, kieruje samo `openclaw` do
    Crestodian, stosuje zapisy setup/model/agent/Discord Plugin + SecretRef,
    waliduje konfigurację i weryfikuje wpisy audytu. Ta sama ścieżka konfiguracji Ring 0
    jest także objęta w QA Lab przez
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke kosztów Moonshot/Kimi: przy ustawionym `MOONSHOT_API_KEY` uruchom
  `openclaw models list --provider moonshot --json`, a następnie uruchom izolowane
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  względem `moonshot/kimi-k2.6`. Sprawdź, że JSON raportuje Moonshot/K2.6 i że
  transkrypt asystenta przechowuje znormalizowane `usage.cost`.

Wskazówka: gdy potrzebujesz tylko jednego awaryjnego przypadku, preferuj zawężanie testów live przez zmienne środowiskowe allowlist opisane poniżej.

## Runnery specyficzne dla QA

Te polecenia działają obok głównych zestawów testowych, gdy potrzebujesz realizmu QA-lab:

CI uruchamia QA Lab w dedykowanych workflow. `Parity gate` uruchamia się dla pasujących PR
oraz z ręcznego dispatch z mockowanymi dostawcami. `QA-Lab - All Lanes` uruchamia się co noc na
`main` oraz z ręcznego dispatch z mockowanym parity gate, linią live Matrix i
zarządzaną przez Convex linią live Telegram jako zadaniami równoległymi. `OpenClaw Release Checks`
uruchamia te same linie przed zatwierdzeniem wydania.

- `pnpm openclaw qa suite`
  - Uruchamia scenariusze QA oparte na repo bezpośrednio na hoście.
  - Domyślnie uruchamia wiele wybranych scenariuszy równolegle z izolowanymi
    workerami gateway. `qa-channel` domyślnie używa współbieżności 4 (ograniczonej przez
    liczbę wybranych scenariuszy). Użyj `--concurrency <count>`, aby dostroić liczbę
    workerów, albo `--concurrency 1` dla starszej linii sekwencyjnej.
  - Zwraca kod różny od zera, gdy jakikolwiek scenariusz zakończy się niepowodzeniem. Użyj `--allow-failures`, jeśli
    chcesz artefaktów bez błędnego kodu wyjścia.
  - Obsługuje tryby dostawców `live-frontier`, `mock-openai` i `aimock`.
    `aimock` uruchamia lokalny serwer dostawcy oparty na AIMock dla eksperymentalnego pokrycia
    fixture i mocków protokołu bez zastępowania świadomej scenariuszy linii `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Uruchamia ten sam zestaw QA wewnątrz jednorazowej Linux VM Multipass.
  - Zachowuje ten sam sposób wyboru scenariuszy co `qa suite` na hoście.
  - Ponownie używa tych samych flag wyboru dostawcy/modelu co `qa suite`.
  - Uruchomienia live przekazują obsługiwane dane uwierzytelniające QA praktyczne dla gościa:
    klucze dostawców oparte na env, ścieżkę konfiguracji dostawcy QA live oraz `CODEX_HOME`,
    jeśli jest obecne.
  - Katalogi wyjściowe muszą pozostawać pod katalogiem głównym repo, aby gość mógł zapisywać z powrotem przez
    zamontowaną przestrzeń roboczą.
  - Zapisuje zwykły raport i podsumowanie QA oraz logi Multipass w
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Uruchamia witrynę QA opartą na Docker do pracy operatorskiej QA.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Buduje tarball npm z bieżącego checkout, instaluje go globalnie w
    Docker, uruchamia nieinteraktywny onboarding OpenAI z kluczem API, domyślnie konfiguruje Telegram,
    sprawdza, że włączenie Plugin instaluje zależności środowiska wykonawczego na żądanie,
    uruchamia doctor i wykonuje jedną lokalną turę agenta względem mockowanego punktu końcowego OpenAI.
  - Użyj `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, aby uruchomić tę samą linię
    instalacji pakietowej z Discord.
- `pnpm test:docker:npm-telegram-live`
  - Instaluje opublikowany pakiet OpenClaw w Docker, uruchamia onboarding
    zainstalowanego pakietu, konfiguruje Telegram przez zainstalowane CLI, a następnie ponownie używa
    linii QA live Telegram z tym zainstalowanym pakietem jako SUT Gateway.
  - Domyślnie używa `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Używa tych samych poświadczeń Telegram z env albo źródła poświadczeń Convex co
    `pnpm openclaw qa telegram`. Dla automatyzacji CI/release ustaw
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` oraz
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli. Jeśli
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli Convex są obecne w CI,
    wrapper Docker automatycznie wybiera Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` nadpisuje współdzielone
    `OPENCLAW_QA_CREDENTIAL_ROLE` tylko dla tej linii.
  - GitHub Actions udostępnia tę linię jako ręczny workflow maintainera
    `NPM Telegram Beta E2E`. Nie uruchamia się przy merge. Workflow używa środowiska
    `qa-live-shared` i dzierżaw poświadczeń CI Convex.
- `pnpm test:docker:bundled-channel-deps`
  - Pakuje i instaluje bieżący build OpenClaw w Docker, uruchamia Gateway
    ze skonfigurowanym OpenAI, a następnie włącza dołączone kanały/Plugin przez edycję config.
  - Weryfikuje, że wykrywanie setup pozostawia nieskonfigurowane zależności środowiska wykonawczego Plugin
    nieobecne, że pierwsze skonfigurowane uruchomienie Gateway lub doctor instaluje
    zależności środowiska wykonawczego każdego dołączonego Plugin na żądanie oraz że drugie ponowne uruchomienie nie reinstaluje zależności już aktywowanych.
  - Instaluje także znaną starszą bazę npm, włącza Telegram przed uruchomieniem
    `openclaw update --tag <candidate>` i weryfikuje, że naprawa doctor po aktualizacji
    kandydata przywraca zależności środowiska wykonawczego dołączonych kanałów bez
    naprawy postinstall po stronie harness.
- `pnpm test:parallels:npm-update`
  - Uruchamia smoke aktualizacji natywnej instalacji pakietowej w gościach Parallels. Każda
    wybrana platforma najpierw instaluje żądany pakiet bazowy, następnie uruchamia
    zainstalowane polecenie `openclaw update` w tym samym gościu i weryfikuje zainstalowaną
    wersję, status aktualizacji, gotowość gateway oraz jedną lokalną turę agenta.
  - Użyj `--platform macos`, `--platform windows` albo `--platform linux`, gdy iterujesz nad jednym gościem. Użyj `--json`, aby uzyskać ścieżkę artefaktu podsumowania i status dla każdej linii.
  - Owiń długie lokalne uruchomienia w timeout hosta, aby zastoje transportu Parallels nie
    zużyły reszty okna testowego:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrypt zapisuje zagnieżdżone logi linii w `/tmp/openclaw-parallels-npm-update.*`.
    Sprawdź `windows-update.log`, `macos-update.log` albo `linux-update.log`,
    zanim uznasz, że zewnętrzny wrapper się zawiesił.
  - Aktualizacja Windows może spędzić 10 do 15 minut na naprawie doctor/zależności środowiska wykonawczego po aktualizacji na zimnym gościu; to nadal jest zdrowe, gdy zagnieżdżony log debug npm się przesuwa.
  - Nie uruchamiaj tego zbiorczego wrappera równolegle z indywidualnymi liniami smoke Parallels
    dla macOS, Windows lub Linux. Współdzielą stan VM i mogą kolidować przy
    odtwarzaniu snapshotu, udostępnianiu pakietów albo stanie gateway gościa.
  - Dowód po aktualizacji uruchamia zwykłą powierzchnię dołączonego Plugin, ponieważ
    fasady możliwości, takie jak mowa, generowanie obrazów i rozumienie
    multimediów, są ładowane przez dołączone API środowiska wykonawczego, nawet gdy sama
    tura agenta sprawdza tylko prostą odpowiedź tekstową.

- `pnpm openclaw qa aimock`
  - Uruchamia tylko lokalny serwer dostawcy AIMock do bezpośrednich testów smoke protokołu.
- `pnpm openclaw qa matrix`
  - Uruchamia linię QA Matrix live względem jednorazowego homeservera Tuwunel opartego na Docker.
  - Ten host QA jest dziś przeznaczony tylko dla repo/dev. Spakowane instalacje OpenClaw nie zawierają
    `qa-lab`, więc nie udostępniają `openclaw qa`.
  - Checkouty repo ładują dołączony runner bezpośrednio; nie jest potrzebny oddzielny krok instalacji Plugin.
  - Tworzy trzy tymczasowe użytkowniki Matrix (`driver`, `sut`, `observer`) oraz jeden prywatny pokój, a następnie uruchamia proces potomny QA gateway z prawdziwym Plugin Matrix jako transportem SUT.
  - Domyślnie używa przypiętego stabilnego obrazu Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Nadpisz przez `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, gdy musisz przetestować inny obraz.
  - Matrix nie udostępnia współdzielonych flag źródła poświadczeń, ponieważ ta linia lokalnie tworzy tymczasowych użytkowników.
  - Zapisuje raport QA Matrix, podsumowanie, artefakt observed-events oraz połączony log wyjścia stdout/stderr w `.artifacts/qa-e2e/...`.
  - Domyślnie emituje postęp i wymusza twardy timeout uruchomienia przez `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (domyślnie 30 minut). Czyszczenie jest ograniczone przez `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS`, a awarie zawierają polecenie odzyskiwania `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Uruchamia linię QA Telegram live względem rzeczywistej prywatnej grupy przy użyciu tokenów bota driver i SUT z env.
  - Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` i `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Identyfikator grupy musi być numerycznym identyfikatorem czatu Telegram.
  - Obsługuje `--credential-source convex` dla współdzielonych poświadczeń z puli. Domyślnie używaj trybu env albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, aby włączyć dzierżawy z puli.
  - Zwraca kod różny od zera, gdy jakikolwiek scenariusz zakończy się niepowodzeniem. Użyj `--allow-failures`, gdy
    chcesz artefaktów bez błędnego kodu wyjścia.
  - Wymaga dwóch różnych botów w tej samej prywatnej grupie, przy czym bot SUT musi udostępniać nazwę użytkownika Telegram.
  - Dla stabilnej obserwacji bot-bot włącz Bot-to-Bot Communication Mode w `@BotFather` dla obu botów i upewnij się, że bot driver może obserwować ruch botów w grupie.
  - Zapisuje raport QA Telegram, podsumowanie i artefakt observed-messages w `.artifacts/qa-e2e/...`. Scenariusze odpowiedzi obejmują RTT od żądania wysłania przez driver do zaobserwowanej odpowiedzi SUT.

Linie transportu live współdzielą jeden standardowy kontrakt, aby nowe transporty nie rozchodziły się:

`qa-channel` pozostaje szerokim syntetycznym zestawem QA i nie jest częścią macierzy pokrycia transportów live.

| Linia    | Canary | Bramka wzmianek | Blokada allowlist | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Follow-up wątku | Izolacja wątku | Obserwacja reakcji | Polecenie help |
| -------- | ------ | --------------- | ----------------- | ----------------------------- | ----------------------- | --------------- | -------------- | ------------------ | -------------- |
| Matrix   | x      | x               | x                 | x                             | x                       | x               | x              | x                  |                |
| Telegram | x      |                 |                   |                               |                         |                 |                |                    | x              |

### Współdzielone poświadczenia Telegram przez Convex (v1)

Gdy dla `openclaw qa telegram` włączone jest `--credential-source convex` (lub `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab pozyskuje wyłączną dzierżawę z puli opartej na Convex, wysyła Heartbeat tej
dzierżawy podczas działania linii i zwalnia dzierżawę przy wyłączeniu.

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
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (opcjonalny identyfikator śledzenia)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` zezwala na loopback `http://` dla URL-i Convex wyłącznie do lokalnego programowania.

`OPENCLAW_QA_CONVEX_SITE_URL` w normalnej pracy powinno używać `https://`.

Polecenia administracyjne maintainera (dodawanie/usuwanie/listowanie puli) wymagają
konkretnie `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Pomocnicze polecenia CLI dla maintainerów:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Użyj `doctor` przed uruchomieniami live, aby sprawdzić URL witryny Convex, sekrety brokera,
prefiks punktu końcowego, timeout HTTP i osiągalność admin/list bez wypisywania
wartości sekretów. Użyj `--json`, aby uzyskać wyjście czytelne maszynowo w skryptach i narzędziach CI.

Domyślny kontrakt punktu końcowego (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Żądanie: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sukces: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Wyczerpane/ponawialne: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
  - Zabezpieczenie aktywnej dzierżawy: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (tylko sekret maintainera)
  - Żądanie: `{ kind?, status?, includePayload?, limit? }`
  - Sukces: `{ status: "ok", credentials, count }`

Kształt payloadu dla rodzaju Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` musi być ciągiem będącym numerycznym identyfikatorem czatu Telegram.
- `admin/add` waliduje ten kształt dla `kind: "telegram"` i odrzuca nieprawidłowe payloady.

### Dodawanie kanału do QA

Dodanie kanału do systemu QA opartego na Markdown wymaga dokładnie dwóch rzeczy:

1. Adaptera transportu dla kanału.
2. Pakietu scenariuszy, który wykonuje kontrakt kanału.

Nie dodawaj nowego najwyższego poziomu root poleceń QA, gdy współdzielony host `qa-lab`
może zarządzać tym przepływem.

`qa-lab` zarządza współdzieloną mechaniką hosta:

- root poleceń `openclaw qa`
- uruchamianiem i zamykaniem zestawu
- współbieżnością workerów
- zapisem artefaktów
- generowaniem raportów
- wykonywaniem scenariuszy
- aliasami zgodności dla starszych scenariuszy `qa-channel`

Plugin runnerów zarządzają kontraktem transportu:

- w jaki sposób `openclaw qa <runner>` jest montowane pod współdzielonym root `qa`
- jak gateway jest konfigurowany dla tego transportu
- jak sprawdzana jest gotowość
- jak wstrzykiwane są zdarzenia przychodzące
- jak obserwowane są wiadomości wychodzące
- jak ujawniane są transkrypty i znormalizowany stan transportu
- jak wykonywane są akcje oparte na transporcie
- jak obsługiwany jest reset lub czyszczenie specyficzne dla transportu

Minimalny próg adopcji dla nowego kanału to:

1. Zachowaj `qa-lab` jako właściciela współdzielonego root `qa`.
2. Zaimplementuj runner transportu na współdzielonej warstwie hosta `qa-lab`.
3. Zachowaj mechanikę specyficzną dla transportu wewnątrz Plugin runnera albo harnessu kanału.
4. Montuj runner jako `openclaw qa <runner>` zamiast rejestrować konkurencyjny root poleceń.
   Plugin runnerów powinny deklarować `qaRunners` w `openclaw.plugin.json` i eksportować pasującą tablicę `qaRunnerCliRegistrations` z `runtime-api.ts`.
   Zachowaj lekkość `runtime-api.ts`; leniwe CLI i wykonywanie runnera powinny pozostać za oddzielnymi entrypointami.
5. Twórz lub adaptuj scenariusze Markdown w tematycznych katalogach `qa/scenarios/`.
6. Używaj ogólnych pomocników scenariuszy dla nowych scenariuszy.
7. Zachowuj działanie istniejących aliasów zgodności, chyba że repo przeprowadza zamierzoną migrację.

Reguła decyzyjna jest ścisła:

- Jeśli zachowanie można wyrazić raz w `qa-lab`, umieść je w `qa-lab`.
- Jeśli zachowanie zależy od jednego transportu kanału, zachowaj je w Plugin runnera lub harnessie Plugin.
- Jeśli scenariusz potrzebuje nowej możliwości, z której może skorzystać więcej niż jeden kanał, dodaj ogólny helper zamiast rozgałęzienia specyficznego dla kanału w `suite.ts`.
- Jeśli zachowanie ma sens tylko dla jednego transportu, zachowaj scenariusz jako specyficzny dla tego transportu i jasno zaznacz to w kontrakcie scenariusza.

Preferowane nazwy ogólnych helperów dla nowych scenariuszy to:

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

Nowe prace nad kanałami powinny używać ogólnych nazw helperów.
Aliasy zgodności istnieją po to, aby uniknąć migracji typu flag day, a nie jako model
dla tworzenia nowych scenariuszy.

## Zestawy testowe (co uruchamia się gdzie)

Myśl o zestawach jako o „rosnącym realizmie” (oraz rosnącej niestabilności/koszcie):

### Unit / integration (domyślne)

- Polecenie: `pnpm test`
- Konfiguracja: uruchomienia nieukierunkowane używają zestawu shardów `vitest.full-*.config.ts` i mogą rozwijać shardy wieloprojektowe do konfiguracji per projekt w celu równoległego harmonogramowania
- Pliki: inwentarze core/unit pod `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` oraz dozwolone testy node w `ui` objęte przez `vitest.unit.config.ts`
- Zakres:
  - Czyste testy jednostkowe
  - Testy integracyjne w procesie (autoryzacja gateway, routing, narzędzia, parsowanie, konfiguracja)
  - Deterministyczne regresje dla znanych błędów
- Oczekiwania:
  - Uruchamia się w CI
  - Nie wymaga prawdziwych kluczy
  - Powinno być szybkie i stabilne

<AccordionGroup>
  <Accordion title="Projekty, shardy i linie zakresowe">

    - Nieukierunkowane `pnpm test` uruchamia dwanaście mniejszych konfiguracji shardów (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) zamiast jednego ogromnego natywnego procesu root-project. To zmniejsza szczytowe RSS na obciążonych maszynach i zapobiega temu, by prace auto-reply/extension zagłodziły niezwiązane zestawy.
    - `pnpm test --watch` nadal używa natywnego grafu projektów root `vitest.config.ts`, ponieważ pętla watch dla wielu shardów nie jest praktyczna.
    - `pnpm test`, `pnpm test:watch` i `pnpm test:perf:imports` najpierw kierują jawne cele plików/katalogów przez linie zakresowe, więc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` unika kosztu pełnego uruchomienia root project.
    - `pnpm test:changed` rozwija zmienione ścieżki git do tych samych linii zakresowych, gdy diff dotyka tylko routowalnych plików źródłowych/testowych; edycje config/setup nadal wracają do szerokiego ponownego uruchomienia root-project.
    - `pnpm check:changed` to normalna inteligentna lokalna bramka dla wąskich zmian. Klasyfikuje diff do kategorii core, testy core, extensions, testy extension, apps, docs, metadane wydania i tooling, a następnie uruchamia pasujące linie typecheck/lint/test. Zmiany publicznego Plugin SDK i kontraktów plugin obejmują jeden przebieg walidacji extension, ponieważ extensions zależą od tych kontraktów core. Zmiany wersji obejmujące wyłącznie metadane wydania uruchamiają ukierunkowane sprawdzenia wersji/config/zależności głównych zamiast pełnego zestawu, z zabezpieczeniem odrzucającym zmiany pakietów poza polem wersji najwyższego poziomu.
    - Lekkie pod względem importów testy jednostkowe z obszarów agents, commands, plugins, pomocników auto-reply, `plugin-sdk` i podobnych czysto użytkowych części są kierowane przez linię `unit-fast`, która pomija `test/setup-openclaw-runtime.ts`; pliki ciężkie stanowo/runtime pozostają na istniejących liniach.
    - Wybrane pliki źródłowe pomocników `plugin-sdk` i `commands` także mapują uruchomienia trybu changed do jawnych testów sąsiednich w tych lekkich liniach, więc edycje helperów unikają ponownego uruchamiania pełnego ciężkiego zestawu dla tego katalogu.
    - `auto-reply` ma trzy dedykowane koszyki: pomocniki core najwyższego poziomu, testy integracyjne `reply.*` najwyższego poziomu oraz poddrzewo `src/auto-reply/reply/**`. Dzięki temu najcięższe prace harnessu reply są oddzielone od tanich testów status/chunk/token.

  </Accordion>

  <Accordion title="Pokrycie osadzonego runnera">

    - Gdy zmieniasz wejścia wykrywania message-tool lub kontekst środowiska wykonawczego Compaction,
      zachowuj oba poziomy pokrycia.
    - Dodawaj ukierunkowane regresje helperów dla czystych granic routingu i normalizacji.
    - Utrzymuj zdrowie zestawów integracyjnych osadzonego runnera:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` oraz
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Te zestawy weryfikują, że identyfikatory o ograniczonym zakresie i zachowanie Compaction nadal przepływają
      przez rzeczywiste ścieżki `run.ts` / `compact.ts`; testy wyłącznie helperów
      nie są wystarczającym zamiennikiem dla tych ścieżek integracyjnych.

  </Accordion>

  <Accordion title="Domyślne ustawienia puli Vitest i izolacji">

    - Bazowa konfiguracja Vitest domyślnie używa `threads`.
    - Współdzielona konfiguracja Vitest wymusza `isolate: false` i używa
      nieizolowanego runnera w projektach root, konfiguracjach e2e i live.
    - Główna linia UI zachowuje konfigurację `jsdom` i optimizer, ale także działa na
      współdzielonym nieizolowanym runnerze.
    - Każdy shard `pnpm test` dziedziczy te same domyślne ustawienia `threads` + `isolate: false`
      ze współdzielonej konfiguracji Vitest.
    - `scripts/run-vitest.mjs` domyślnie dodaje `--no-maglev` dla procesów potomnych Node Vitest,
      aby zmniejszyć churn kompilacji V8 podczas dużych lokalnych uruchomień.
      Ustaw `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, aby porównać ze standardowym
      zachowaniem V8.

  </Accordion>

  <Accordion title="Szybka lokalna iteracja">

    - `pnpm changed:lanes` pokazuje, które linie architektoniczne uruchamia diff.
    - Hook pre-commit odpowiada tylko za formatowanie. Ponownie dodaje sformatowane pliki do stage
      i nie uruchamia lint, typecheck ani testów.
    - Uruchom jawnie `pnpm check:changed` przed przekazaniem lub push, gdy
      potrzebujesz inteligentnej lokalnej bramki. Zmiany publicznego Plugin SDK i kontraktów plugin
      obejmują jeden przebieg walidacji extension.
    - `pnpm test:changed` kieruje przez linie zakresowe, gdy zmienione ścieżki
      jednoznacznie mapują się do mniejszego zestawu.
    - `pnpm test:max` i `pnpm test:changed:max` zachowują ten sam routing,
      tylko z wyższym limitem workerów.
    - Automatyczne skalowanie workerów lokalnych jest celowo konserwatywne i wycofuje się,
      gdy średnie obciążenie hosta jest już wysokie, więc wiele równoczesnych
      uruchomień Vitest domyślnie szkodzi mniej.
    - Bazowa konfiguracja Vitest oznacza pliki projektów/konfiguracji jako
      `forceRerunTriggers`, aby ponowne uruchomienia trybu changed pozostawały poprawne,
      gdy zmienia się okablowanie testów.
    - Konfiguracja utrzymuje włączone `OPENCLAW_VITEST_FS_MODULE_CACHE` na obsługiwanych
      hostach; ustaw `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, jeśli chcesz
      jednej jawnej lokalizacji cache do bezpośredniego profilowania.

  </Accordion>

  <Accordion title="Debugowanie wydajności">

    - `pnpm test:perf:imports` włącza raportowanie czasu importu Vitest oraz
      wyjście rozbicia importów.
    - `pnpm test:perf:imports:changed` ogranicza ten sam widok profilowania do
      plików zmienionych względem `origin/main`.
    - Gdy jeden gorący test nadal spędza większość czasu na importach startowych,
      trzymaj ciężkie zależności za wąską lokalną warstwą `*.runtime.ts` i
      mockuj tę warstwę bezpośrednio zamiast głęboko importować pomocniki runtime tylko
      po to, by przekazać je przez `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje kierowane
      `test:changed` z natywną ścieżką root-project dla tego zatwierdzonego diffu
      i wypisuje wall time oraz maksymalne RSS na macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżące
      brudne drzewo, kierując listę zmienionych plików przez
      `scripts/test-projects.mjs` i główną konfigurację Vitest.
    - `pnpm test:perf:profile:main` zapisuje profil CPU głównego wątku dla
      narzutu startu i transformacji Vitest/Vite.
    - `pnpm test:perf:profile:runner` zapisuje profile CPU+heap runnera dla
      zestawu unit z wyłączoną równoległością plików.

  </Accordion>
</AccordionGroup>

### Stabilność (gateway)

- Polecenie: `pnpm test:stability:gateway`
- Konfiguracja: `vitest.gateway.config.ts`, wymuszone do jednego workera
- Zakres:
  - Uruchamia rzeczywisty Gateway na local loopback z domyślnie włączoną diagnostyką
  - Przepycha syntetyczne obciążenie wiadomościami, pamięcią i dużymi payloadami gateway przez ścieżkę zdarzeń diagnostycznych
  - Odpytuje `diagnostics.stability` przez WS RPC Gateway
  - Obejmuje helpery trwałości pakietu diagnostycznej stabilności
  - Sprawdza, że rejestrator pozostaje ograniczony, syntetyczne próbki RSS pozostają poniżej budżetu nacisku, a głębokości kolejek per sesja wracają do zera
- Oczekiwania:
  - Bezpieczne dla CI i bez kluczy
  - Wąska linia do dalszych działań po regresji stabilności, nie zamiennik pełnego zestawu Gateway

### E2E (smoke gateway)

- Polecenie: `pnpm test:e2e`
- Konfiguracja: `vitest.e2e.config.ts`
- Pliki: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` oraz testy E2E dołączonych Plugin pod `extensions/`
- Domyślne ustawienia środowiska wykonawczego:
  - Używa Vitest `threads` z `isolate: false`, zgodnie z resztą repo.
  - Używa adaptacyjnych workerów (CI: do 2, lokalnie: domyślnie 1).
  - Domyślnie działa w trybie cichym, aby zmniejszyć narzut I/O konsoli.
- Przydatne nadpisania:
  - `OPENCLAW_E2E_WORKERS=<n>`, aby wymusić liczbę workerów (ograniczoną do 16).
  - `OPENCLAW_E2E_VERBOSE=1`, aby ponownie włączyć szczegółowe wyjście konsoli.
- Zakres:
  - Zachowanie end-to-end wielu instancji gateway
  - Powierzchnie WebSocket/HTTP, parowanie Node i cięższe przypadki sieciowe
- Oczekiwania:
  - Uruchamia się w CI (gdy włączone w pipeline)
  - Nie wymaga prawdziwych kluczy
  - Ma więcej ruchomych części niż testy jednostkowe (może być wolniejsze)

### E2E: smoke backendu OpenShell

- Polecenie: `pnpm test:e2e:openshell`
- Plik: `extensions/openshell/src/backend.e2e.test.ts`
- Zakres:
  - Uruchamia izolowany gateway OpenShell na hoście przez Docker
  - Tworzy piaskownicę z tymczasowego lokalnego Dockerfile
  - Testuje backend OpenShell OpenClaw przez rzeczywiste `sandbox ssh-config` + SSH exec
  - Weryfikuje zdalnie kanoniczne zachowanie systemu plików przez most fs piaskownicy
- Oczekiwania:
  - Tylko opt-in; nie jest częścią domyślnego uruchomienia `pnpm test:e2e`
  - Wymaga lokalnego CLI `openshell` oraz działającego demona Docker
  - Używa izolowanych `HOME` / `XDG_CONFIG_HOME`, a następnie niszczy testowy gateway i piaskownicę
- Przydatne nadpisania:
  - `OPENCLAW_E2E_OPENSHELL=1`, aby włączyć test podczas ręcznego uruchamiania szerszego zestawu e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, aby wskazać niestandardowe binarium CLI lub skrypt wrappera

### Live (prawdziwi dostawcy + prawdziwe modele)

- Polecenie: `pnpm test:live`
- Konfiguracja: `vitest.live.config.ts`
- Pliki: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` oraz testy live dołączonych Plugin pod `extensions/`
- Domyślnie: **włączone** przez `pnpm test:live` (ustawia `OPENCLAW_LIVE_TEST=1`)
- Zakres:
  - „Czy ten dostawca/model naprawdę działa _dzisiaj_ z prawdziwymi poświadczeniami?”
  - Wychwytuje zmiany formatu dostawców, niuanse wywołań narzędzi, problemy z autoryzacją i zachowanie limitów żądań
- Oczekiwania:
  - Z założenia niestabilne w CI (prawdziwe sieci, rzeczywiste polityki dostawców, limity, awarie)
  - Kosztuje pieniądze / zużywa limity żądań
  - Zamiast „wszystkiego” preferuj uruchamianie zawężonych podzbiorów
- Uruchomienia live pobierają `~/.profile`, aby uzupełnić brakujące klucze API.
- Domyślnie uruchomienia live nadal izolują `HOME` i kopiują materiał config/auth do tymczasowego katalogu domowego testu, aby fixture unit nie mogły modyfikować prawdziwego `~/.openclaw`.
- Ustaw `OPENCLAW_LIVE_USE_REAL_HOME=1` tylko wtedy, gdy celowo chcesz, aby testy live używały Twojego prawdziwego katalogu domowego.
- `pnpm test:live` domyślnie działa teraz ciszej: zachowuje wyjście postępu `[live] ...`, ale ukrywa dodatkowy komunikat `~/.profile` i wycisza logi startowe gateway/hałas Bonjour. Ustaw `OPENCLAW_LIVE_TEST_QUIET=0`, jeśli chcesz z powrotem pełne logi uruchomienia.
- Rotacja kluczy API (specyficzna dla dostawcy): ustaw `*_API_KEYS` w formacie z przecinkami/średnikami albo `*_API_KEY_1`, `*_API_KEY_2` (na przykład `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) albo nadpisanie per live przez `OPENCLAW_LIVE_*_KEY`; testy ponawiają próbę przy odpowiedziach rate limit.
- Wyjście postępu/Heartbeat:
  - Zestawy live emitują teraz wiersze postępu do stderr, dzięki czemu długie wywołania dostawców są widocznie aktywne nawet wtedy, gdy przechwytywanie konsoli Vitest jest ciche.
  - `vitest.live.config.ts` wyłącza przechwytywanie konsoli Vitest, więc wiersze postępu dostawcy/gateway są strumieniowane natychmiast podczas uruchomień live.
  - Dostosuj Heartbeat bezpośredniego modelu przez `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Dostosuj Heartbeat gateway/sond przez `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Który zestaw powinienem uruchomić?

Użyj tej tabeli decyzyjnej:

- Edytujesz logikę/testy: uruchom `pnpm test` (oraz `pnpm test:coverage`, jeśli zmieniłeś dużo)
- Dotykasz sieci gateway / protokołu WS / parowania: dodaj `pnpm test:e2e`
- Debugujesz „mój bot nie działa” / awarie specyficzne dla dostawcy / wywoływanie narzędzi: uruchom zawężone `pnpm test:live`

## Testy live (dotykające sieci)

Dla macierzy modeli live, smoke backendów CLI, smoke ACP, harnessu serwera aplikacji Codex
i wszystkich testów live dostawców mediów (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — oraz obsługi poświadczeń dla uruchomień live — zobacz
[Testowanie — zestawy live](/pl/help/testing-live).

## Runnery Docker (opcjonalne kontrole typu „działa w Linux”)

Te runnery Docker dzielą się na dwa koszyki:

- Runnery live-model: `test:docker:live-models` i `test:docker:live-gateway` uruchamiają tylko pasujący im plik live z kluczem profilu wewnątrz obrazu Docker repo (`src/agents/models.profiles.live.test.ts` i `src/gateway/gateway-models.profiles.live.test.ts`), montując lokalny katalog config i przestrzeń roboczą (oraz pobierając `~/.profile`, jeśli jest zamontowany). Pasujące lokalne entrypointy to `test:live:models-profiles` i `test:live:gateway-profiles`.
- Runnery Docker live domyślnie używają mniejszego limitu smoke, aby pełny sweep Docker pozostawał praktyczny:
  `test:docker:live-models` domyślnie ustawia `OPENCLAW_LIVE_MAX_MODELS=12`, a
  `test:docker:live-gateway` domyślnie ustawia `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` oraz
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Nadpisz te zmienne env, gdy
  jawnie chcesz większego, wyczerpującego skanu.
- `test:docker:all` buduje obraz live Docker raz przez `test:docker:live-build`, a następnie ponownie używa go dla linii live Docker. Buduje też jeden współdzielony obraz `scripts/e2e/Dockerfile` przez `test:docker:e2e-build` i ponownie używa go dla runnerów smoke kontenerów E2E, które testują zbudowaną aplikację. Zbiorczy runner używa ważonego lokalnego harmonogramu: `OPENCLAW_DOCKER_ALL_PARALLELISM` kontroluje sloty procesów, a limity zasobów zapobiegają jednoczesnemu uruchamianiu wszystkich ciężkich linii live, npm-install i wielousługowych. Domyślnie są to 10 slotów, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` i `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; dostrajaj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` lub `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` tylko wtedy, gdy host Docker ma większy zapas zasobów. Runner domyślnie wykonuje Docker preflight, usuwa nieaktualne kontenery OpenClaw E2E, wypisuje status co 30 sekund, przechowuje czasy udanych linii w `.artifacts/docker-tests/lane-timings.json` i używa tych czasów do wcześniejszego uruchamiania dłuższych linii przy kolejnych wykonaniach. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wypisać ważony manifest linii bez budowania i uruchamiania Docker.
- Runnery smoke kontenerów: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` i `test:docker:config-reload` uruchamiają jeden lub więcej rzeczywistych kontenerów i weryfikują ścieżki integracji wyższego poziomu.

Runnery Docker live-model również montują tylko potrzebne katalogi domowe autoryzacji CLI (lub wszystkie obsługiwane, gdy uruchomienie nie jest zawężone), a następnie kopiują je do katalogu domowego kontenera przed uruchomieniem, aby zewnętrzne CLI OAuth mogło odświeżać tokeny bez modyfikowania magazynu autoryzacji hosta:

- Modele bezpośrednie: `pnpm test:docker:live-models` (skrypt: `scripts/test-live-models-docker.sh`)
- Smoke powiązania ACP: `pnpm test:docker:live-acp-bind` (skrypt: `scripts/test-live-acp-bind-docker.sh`; domyślnie obejmuje Claude, Codex i Gemini, z rygorystycznym pokryciem OpenCode przez `pnpm test:docker:live-acp-bind:opencode`)
- Smoke backendu CLI: `pnpm test:docker:live-cli-backend` (skrypt: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harnessu serwera aplikacji Codex: `pnpm test:docker:live-codex-harness` (skrypt: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev: `pnpm test:docker:live-gateway` (skrypt: `scripts/test-live-gateway-models-docker.sh`)
- Smoke Open WebUI live: `pnpm test:docker:openwebui` (skrypt: `scripts/e2e/openwebui-docker.sh`)
- Kreator onboardingu (TTY, pełne rusztowanie): `pnpm test:docker:onboard` (skrypt: `scripts/e2e/onboard-docker.sh`)
- Smoke onboardingu/kanału/agenta z tarballa npm: `pnpm test:docker:npm-onboard-channel-agent` instaluje spakowany tarball OpenClaw globalnie w Docker, konfiguruje OpenAI przez onboarding env-ref oraz domyślnie Telegram, sprawdza, że doctor naprawia aktywowane zależności runtime Plugin, i uruchamia jedną mockowaną turę agenta OpenAI. Użyj ponownie wcześniej zbudowanego tarballa przez `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń przebudowę hosta przez `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, albo zmień kanał przez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke globalnej instalacji Bun: `bash scripts/e2e/bun-global-install-smoke.sh` pakuje bieżące drzewo, instaluje je przez `bun install -g` w izolowanym katalogu domowym i sprawdza, że `openclaw infer image providers --json` zwraca dołączonych dostawców obrazów zamiast zawieszać się. Użyj ponownie wcześniej zbudowanego tarballa przez `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń build hosta przez `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, albo skopiuj `dist/` z zbudowanego obrazu Docker przez `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke instalatora Docker: `bash scripts/test-install-sh-docker.sh` współdzieli jeden cache npm między kontenerami root, update i direct-npm. Smoke aktualizacji domyślnie używa npm `latest` jako stabilnej bazy przed aktualizacją do tarballa kandydata. Sprawdzenia instalatora bez uprawnień root utrzymują izolowany cache npm, aby wpisy cache należące do root nie maskowały zachowania lokalnej instalacji użytkownika. Ustaw `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, aby ponownie wykorzystać cache root/update/direct-npm między lokalnymi ponownymi uruchomieniami.
- CI Install Smoke pomija zduplikowaną bezpośrednią globalną aktualizację npm przez `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; uruchom skrypt lokalnie bez tej zmiennej env, gdy potrzebne jest pokrycie bezpośredniego `npm install -g`.
- Smoke CLI usuwania współdzielonej przestrzeni roboczej agentów: `pnpm test:docker:agents-delete-shared-workspace` (skrypt: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) domyślnie buduje obraz z głównego Dockerfile, tworzy seed dla dwóch agentów z jedną przestrzenią roboczą w izolowanym katalogu domowym kontenera, uruchamia `agents delete --json` i weryfikuje poprawny JSON oraz zachowanie zachowania przestrzeni roboczej. Użyj ponownie obrazu install-smoke przez `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Sieć Gateway (dwa kontenery, autoryzacja WS + health): `pnpm test:docker:gateway-network` (skrypt: `scripts/e2e/gateway-network-docker.sh`)
- Minimalna regresja reasoning OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (skrypt: `scripts/e2e/openai-web-search-minimal-docker.sh`) uruchamia mockowany serwer OpenAI przez Gateway, weryfikuje, że `web_search` podnosi `reasoning.effort` z `minimal` do `low`, a następnie wymusza odrzucenie schematu przez dostawcę i sprawdza, że surowy szczegół pojawia się w logach Gateway.
- Most kanałów MCP (Gateway z seedem + most stdio + surowy smoke ramek powiadomień Claude): `pnpm test:docker:mcp-channels` (skrypt: `scripts/e2e/mcp-channels-docker.sh`)
- Narzędzia MCP pakietu Pi (rzeczywisty serwer stdio MCP + smoke allow/deny osadzonego profilu Pi): `pnpm test:docker:pi-bundle-mcp-tools` (skrypt: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Czyszczenie MCP cron/subagent (rzeczywisty Gateway + teardown potomka stdio MCP po izolowanym cron i jednorazowych uruchomieniach subagenta): `pnpm test:docker:cron-mcp-cleanup` (skrypt: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke instalacji + alias `/plugin` + semantyka restartu pakietu Claude): `pnpm test:docker:plugins` (skrypt: `scripts/e2e/plugins-docker.sh`)
- Smoke braku zmian przy aktualizacji Plugin: `pnpm test:docker:plugin-update` (skrypt: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke metadanych przeładowania konfiguracji: `pnpm test:docker:config-reload` (skrypt: `scripts/e2e/config-reload-source-docker.sh`)
- Zależności runtime dołączonych Plugin: `pnpm test:docker:bundled-channel-deps` domyślnie buduje mały obraz runnera Docker, buduje i pakuje OpenClaw raz na hoście, a następnie montuje ten tarball w każdym scenariuszu instalacji Linux. Użyj obrazu ponownie przez `OPENCLAW_SKIP_DOCKER_BUILD=1`, pomiń przebudowę hosta po świeżym lokalnym buildzie przez `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, albo wskaż istniejący tarball przez `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Pełny zbiorczy runner Docker pakuje ten tarball raz, a następnie dzieli sprawdzenia dołączonych kanałów na niezależne linie, w tym oddzielne linie aktualizacji dla Telegram, Discord, Slack, Feishu, memory-lancedb i ACPX. Użyj `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, aby zawęzić macierz kanałów przy bezpośrednim uruchamianiu tej linii, albo `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, aby zawęzić scenariusz aktualizacji. Linia weryfikuje też, że `channels.<id>.enabled=false` i `plugins.entries.<id>.enabled=false` tłumią naprawę doctor/zależności runtime.
- Zawężaj zależności runtime dołączonych Plugin podczas iteracji, wyłączając niezwiązane scenariusze, na przykład:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Aby ręcznie zbudować i ponownie wykorzystać współdzielony obraz built-app:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Specyficzne dla zestawu nadpisania obrazów, takie jak `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, nadal mają pierwszeństwo, gdy są ustawione. Gdy `OPENCLAW_SKIP_DOCKER_BUILD=1` wskazuje zdalny współdzielony obraz, skrypty pobierają go, jeśli nie jest jeszcze dostępny lokalnie. Testy Docker QR i instalatora zachowują własne Dockerfile, ponieważ walidują zachowanie pakietu/instalacji, a nie współdzielone środowisko wykonawcze built-app.

Runnery Docker live-model również montują bieżący checkout tylko do odczytu i
tymczasowo przygotowują go w katalogu roboczym wewnątrz kontenera. Dzięki temu obraz środowiska wykonawczego
pozostaje lekki, a Vitest nadal działa dokładnie na lokalnym źródle/config.
Krok przygotowania pomija duże lokalne cache i wyniki budowania aplikacji, takie
jak `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` oraz lokalne dla aplikacji katalogi `.build`
lub wyjścia Gradle, dzięki czemu uruchomienia Docker live nie tracą minut na kopiowanie
artefaktów specyficznych dla maszyny.
Ustawiają też `OPENCLAW_SKIP_CHANNELS=1`, aby sondy gateway live nie uruchamiały
rzeczywistych workerów kanałów Telegram/Discord/itd. wewnątrz kontenera.
`test:docker:live-models` nadal uruchamia `pnpm test:live`, więc przekazuj
również `OPENCLAW_LIVE_GATEWAY_*`, gdy chcesz zawęzić albo wykluczyć pokrycie gateway
live z tej linii Docker.
`test:docker:openwebui` to smoke zgodności wyższego poziomu: uruchamia
kontener gateway OpenClaw z włączonymi punktami końcowymi HTTP zgodnymi z OpenAI,
uruchamia przypięty kontener Open WebUI względem tego gateway, loguje się przez
Open WebUI, sprawdza, że `/api/models` udostępnia `openclaw/default`, a następnie wysyła
rzeczywiste żądanie czatu przez proxy `/api/chat/completions` Open WebUI.
Pierwsze uruchomienie może być zauważalnie wolniejsze, ponieważ Docker może potrzebować pobrać
obraz Open WebUI, a samo Open WebUI może potrzebować zakończyć własną konfigurację cold-start.
Ta linia oczekuje używalnego klucza modelu live, a `OPENCLAW_PROFILE_FILE`
(dom yślnie `~/.profile`) jest podstawowym sposobem dostarczenia go w uruchomieniach z Docker.
Udane uruchomienia wypisują mały payload JSON, taki jak `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` jest celowo deterministyczny i nie wymaga
rzeczywistego konta Telegram, Discord ani iMessage. Uruchamia kontener
Gateway z seedem, uruchamia drugi kontener, który uruchamia `openclaw mcp serve`, a następnie
weryfikuje wykrywanie trasowanych rozmów, odczyty transkryptów, metadane załączników,
zachowanie kolejki zdarzeń live, routing wysyłek wychodzących oraz powiadomienia kanału +
uprawnień w stylu Claude przez rzeczywisty most stdio MCP. Kontrola powiadomień
sprawdza bezpośrednio surowe ramki stdio MCP, więc smoke waliduje to, co
most rzeczywiście emituje, a nie tylko to, co akurat ujawnia konkretne SDK klienta.
`test:docker:pi-bundle-mcp-tools` jest deterministyczny i nie wymaga
klucza modelu live. Buduje obraz Docker repo, uruchamia rzeczywisty serwer sondy stdio MCP
wewnątrz kontenera, materializuje ten serwer przez osadzone środowisko wykonawcze Pi bundle
MCP, wykonuje narzędzie, a następnie weryfikuje, że `coding` i `messaging` zachowują
narzędzia `bundle-mcp`, podczas gdy `minimal` i `tools.deny: ["bundle-mcp"]` je filtrują.
`test:docker:cron-mcp-cleanup` jest deterministyczny i nie wymaga klucza modelu live.
Uruchamia Gateway z seedem z rzeczywistym serwerem sondy stdio MCP, wykonuje
izolowaną turę cron oraz jednorazową turę potomną `/subagents spawn`, a następnie sprawdza,
że proces potomny MCP kończy się po każdym uruchomieniu.

Ręczny smoke ACP dla wątku w prostym języku (nie CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Zachowaj ten skrypt dla przepływów regresji/debugowania. Może być ponownie potrzebny do walidacji routingu wątków ACP, więc go nie usuwaj.

Przydatne zmienne env:

- `OPENCLAW_CONFIG_DIR=...` (domyślnie: `~/.openclaw`) montowane do `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (domyślnie: `~/.openclaw/workspace`) montowane do `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (domyślnie: `~/.profile`) montowane do `/home/node/.profile` i pobierane przed uruchomieniem testów
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, aby zweryfikować wyłącznie zmienne env pobrane z `OPENCLAW_PROFILE_FILE`, z użyciem tymczasowych katalogów config/przestrzeni roboczej i bez montowania zewnętrznej autoryzacji CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (domyślnie: `~/.cache/openclaw/docker-cli-tools`) montowane do `/home/node/.npm-global` dla buforowanych instalacji CLI wewnątrz Docker
- Zewnętrzne katalogi/pliki autoryzacji CLI pod `$HOME` są montowane tylko do odczytu pod `/host-auth...`, a następnie kopiowane do `/home/node/...` przed rozpoczęciem testów
  - Domyślne katalogi: `.minimax`
  - Domyślne pliki: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Zawężone uruchomienia dostawców montują tylko potrzebne katalogi/pliki wywnioskowane z `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Nadpisz ręcznie przez `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` albo listę rozdzieloną przecinkami, taką jak `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, aby zawęzić uruchomienie
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, aby filtrować dostawców wewnątrz kontenera
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby ponownie użyć istniejącego obrazu `openclaw:local-live` przy ponownych uruchomieniach, które nie wymagają przebudowy
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby upewnić się, że poświadczenia pochodzą z magazynu profilu (a nie env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, aby wybrać model udostępniany przez gateway dla smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, aby nadpisać prompt sprawdzania nonce używany przez smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, aby nadpisać przypięty tag obrazu Open WebUI

## Spójność dokumentacji

Po edycjach dokumentacji uruchom sprawdzenia docs: `pnpm check:docs`.
Uruchom pełną walidację anchorów Mintlify, gdy potrzebujesz też sprawdzeń nagłówków w obrębie strony: `pnpm docs:check-links:anchors`.

## Regresje offline (bezpieczne dla CI)

To są regresje „rzeczywistego pipeline” bez prawdziwych dostawców:

- Wywoływanie narzędzi Gateway (mock OpenAI, rzeczywista pętla gateway + agent): `src/gateway/gateway.test.ts` (przypadek: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Kreator Gateway (WS `wizard.start`/`wizard.next`, wymuszone zapisy config + auth): `src/gateway/gateway.test.ts` (przypadek: "runs wizard over ws and writes auth token config")

## Ewalucje niezawodności agentów (Skills)

Mamy już kilka bezpiecznych dla CI testów, które zachowują się jak „ewaluacje niezawodności agentów”:

- Mockowane wywoływanie narzędzi przez rzeczywistą pętlę gateway + agent (`src/gateway/gateway.test.ts`).
- Przepływy kreatora end-to-end, które walidują okablowanie sesji i efekty konfiguracji (`src/gateway/gateway.test.ts`).

Czego nadal brakuje dla Skills (zobacz [Skills](/pl/tools/skills)):

- **Podejmowanie decyzji:** gdy Skills są wymienione w prompcie, czy agent wybiera właściwy Skill (albo unika nieistotnych)?
- **Zgodność:** czy agent czyta `SKILL.md` przed użyciem i przestrzega wymaganych kroków/argumentów?
- **Kontrakty przepływu pracy:** scenariusze wieloturowe, które potwierdzają kolejność narzędzi, przenoszenie historii sesji i granice piaskownicy.

Przyszłe ewaluacje powinny pozostać najpierw deterministyczne:

- Runner scenariuszy używający mockowanych dostawców do potwierdzania wywołań narzędzi + ich kolejności, odczytów plików Skill i okablowania sesji.
- Mały zestaw scenariuszy skoncentrowanych na Skills (użyj vs unikaj, gating, prompt injection).
- Opcjonalne ewaluacje live (opt-in, ograniczane przez env) dopiero po wdrożeniu zestawu bezpiecznego dla CI.

## Testy kontraktowe (kształt pluginów i kanałów)

Testy kontraktowe weryfikują, że każdy zarejestrowany plugin i kanał jest zgodny ze swoim
kontraktem interfejsu. Iterują po wszystkich wykrytych pluginach i uruchamiają zestaw
asercji dotyczących kształtu i zachowania. Domyślna linia unit `pnpm test` celowo
pomija te współdzielone pliki seam i smoke; uruchamiaj polecenia kontraktów jawnie,
gdy dotykasz współdzielonych powierzchni kanałów lub dostawców.

### Polecenia

- Wszystkie kontrakty: `pnpm test:contracts`
- Tylko kontrakty kanałów: `pnpm test:contracts:channels`
- Tylko kontrakty dostawców: `pnpm test:contracts:plugins`

### Kontrakty kanałów

Znajdują się w `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Podstawowy kształt pluginu (id, nazwa, możliwości)
- **setup** - Kontrakt kreatora konfiguracji
- **session-binding** - Zachowanie powiązania sesji
- **outbound-payload** - Struktura payloadu wiadomości
- **inbound** - Obsługa wiadomości przychodzących
- **actions** - Handlery akcji kanału
- **threading** - Obsługa identyfikatorów wątków
- **directory** - API katalogu/składu
- **group-policy** - Egzekwowanie polityki grup

### Kontrakty statusu dostawców

Znajdują się w `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondy statusu kanałów
- **registry** - Kształt rejestru Plugin

### Kontrakty dostawców

Znajdują się w `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrakt przepływu autoryzacji
- **auth-choice** - Wybór/selekcja autoryzacji
- **catalog** - API katalogu modeli
- **discovery** - Wykrywanie Plugin
- **loader** - Ładowanie Plugin
- **runtime** - Środowisko wykonawcze dostawcy
- **shape** - Kształt/interfejs Plugin
- **wizard** - Kreator konfiguracji

### Kiedy uruchamiać

- Po zmianie eksportów lub subścieżek plugin-sdk
- Po dodaniu lub modyfikacji kanału albo Plugin dostawcy
- Po refaktoryzacji rejestracji Plugin lub wykrywania

Testy kontraktowe uruchamiają się w CI i nie wymagają prawdziwych kluczy API.

## Dodawanie regresji (wskazówki)

Gdy naprawiasz problem dostawcy/modelu wykryty na live:

- Jeśli to możliwe, dodaj regresję bezpieczną dla CI (mock/stub dostawcy albo uchwycenie dokładnej transformacji kształtu żądania)
- Jeśli problem z natury dotyczy tylko live (limity żądań, polityki autoryzacji), utrzymuj test live wąski i opt-in przez zmienne env
- Preferuj celowanie w najmniejszą warstwę, która wykrywa błąd:
  - błąd konwersji/odtwarzania żądania dostawcy → bezpośredni test modeli
  - błąd potoku sesji/historii/narzędzi gateway → smoke gateway live albo bezpieczny dla CI test mockowanego gateway
- Zabezpieczenie przechodzenia SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` wyprowadza jeden przykładowy cel na klasę SecretRef z metadanych rejestru (`listSecretTargetRegistryEntries()`), a następnie potwierdza, że identyfikatory exec segmentów przechodzenia są odrzucane.
  - Jeśli dodasz nową rodzinę celów SecretRef `includeInPlan` w `src/secrets/target-registry-data.ts`, zaktualizuj `classifyTargetClass` w tym teście. Test celowo kończy się błędem dla niesklasyfikowanych identyfikatorów celów, aby nie dało się cicho pominąć nowych klas.

## Powiązane

- [Testowanie live](/pl/help/testing-live)
- [CI](/pl/ci)
