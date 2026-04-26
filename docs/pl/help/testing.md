---
read_when:
    - Uruchamianie testów lokalnie lub w CI
    - Dodawanie testów regresji dla błędów modeli/providerów
    - Debugowanie zachowania Gateway + agenta
summary: 'Zestaw testowy: pakiety unit/e2e/live, runnery Docker i zakres każdego testu'
title: Testowanie
x-i18n:
    generated_at: "2026-04-26T11:33:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 46c01493284511d99c37a18fc695cc0af19f87eb6d99eb2ef1beec331c290155
    source_path: help/testing.md
    workflow: 15
---

OpenClaw ma trzy pakiety Vitest (unit/integration, e2e, live) oraz niewielki zestaw
runnerów Docker. Ten dokument to przewodnik „jak testujemy”:

- Co obejmuje każdy pakiet (i czego celowo _nie_ obejmuje).
- Które polecenia uruchamiać w typowych przepływach pracy (lokalnie, przed push, debugowanie).
- Jak testy live wykrywają poświadczenia i wybierają modele/providerów.
- Jak dodawać regresje dla rzeczywistych problemów modeli/providerów.

## Szybki start

W większości dni:

- Pełna bramka (oczekiwana przed push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Szybsze lokalne uruchomienie pełnego pakietu na wydajnej maszynie: `pnpm test:max`
- Bezpośrednia pętla watch Vitest: `pnpm test:watch`
- Bezpośrednie targetowanie plików obejmuje teraz także ścieżki extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Gdy iterujesz nad pojedynczym błędem, najpierw preferuj uruchomienia ukierunkowane.
- Strona QA oparta na Docker: `pnpm qa:lab:up`
- Ścieżka QA oparta na Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Gdy zmieniasz testy albo chcesz większej pewności:

- Bramka pokrycia: `pnpm test:coverage`
- Pakiet E2E: `pnpm test:e2e`

Podczas debugowania rzeczywistych providerów/modeli (wymaga prawdziwych poświadczeń):

- Pakiet live (testy modeli + narzędzi/obrazów Gateway): `pnpm test:live`
- Ciche targetowanie jednego pliku live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Sweep modeli live w Docker: `pnpm test:docker:live-models`
  - Każdy wybrany model uruchamia teraz turę tekstową oraz mały test w stylu odczytu pliku.
    Modele, których metadane reklamują wejście `image`, uruchamiają również małą turę obrazu.
    Wyłącz dodatkowe testy przez `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` lub
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, gdy izolujesz awarie providera.
  - Pokrycie CI: codzienne `OpenClaw Scheduled Live And E2E Checks` oraz ręczne
    `OpenClaw Release Checks` wywołują workflow wielokrotnego użytku live/E2E z
    `include_live_suites: true`, które zawiera osobne zadania matrycy Docker live model
    shardowane według providera.
  - Dla ukierunkowanych ponownych uruchomień CI wywołaj `OpenClaw Live And E2E Checks (Reusable)`
    z `include_live_suites: true` i `live_models_only: true`.
  - Dodawaj nowe sekrety providerów o wysokiej wartości sygnału do `scripts/ci-hydrate-live-auth.sh` oraz do `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` i jego wywołań harmonogramu/wydania.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Uruchamia ścieżkę Docker live względem ścieżki Codex app-server, wiąże syntetyczny
    Slack DM przez `/codex bind`, wykonuje `/codex fast` i
    `/codex permissions`, a następnie weryfikuje, że zwykła odpowiedź i załącznik
    obrazu przechodzą przez natywne powiązanie pluginu zamiast ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Uruchamia tury agenta Gateway przez harness app-server Codex należący do pluginu,
    weryfikuje `/codex status` i `/codex models`, a domyślnie wykonuje też testy image,
    cron MCP, sub-agent i Guardian. Wyłącz test sub-agent przez
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, gdy izolujesz inne awarie
    app-server Codex. Dla ukierunkowanego sprawdzenia sub-agent wyłącz pozostałe testy:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    To kończy działanie po teście sub-agent, chyba że
    ustawiono `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opcjonalny test belt-and-suspenders dla powierzchni polecenia rescue
    kanału wiadomości. Wykonuje `/crestodian status`, ustawia trwałą zmianę
    modelu w kolejce, odpowiada `/crestodian yes` i weryfikuje ścieżkę zapisu audytu/konfiguracji.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Uruchamia Crestodian w kontenerze bez konfiguracji z fałszywym Claude CLI na `PATH`
    i weryfikuje, że rozmyty fallback planera przekłada się na audytowany typowany zapis konfiguracji.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Startuje od pustego katalogu stanu OpenClaw, kieruje gołe `openclaw` do
    Crestodian, stosuje zapisy setup/model/agent/Discord plugin + SecretRef,
    waliduje konfigurację i weryfikuje wpisy audytu. Ta sama ścieżka setup Ring 0 jest
    również pokryta w QA Lab przez
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: przy ustawionym `MOONSHOT_API_KEY` uruchom
  `openclaw models list --provider moonshot --json`, a następnie izolowane
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  względem `moonshot/kimi-k2.6`. Zweryfikuj, że JSON raportuje Moonshot/K2.6 oraz że
  transkrypt asystenta przechowuje znormalizowane `usage.cost`.

Wskazówka: gdy potrzebujesz tylko jednego nieudanego przypadku, preferuj zawężanie testów live przez zmienne env allowlisty opisane poniżej.

## Runnery specyficzne dla QA

Te polecenia działają obok głównych pakietów testowych, gdy potrzebujesz realizmu QA-lab:

CI uruchamia QA Lab w dedykowanych workflow. `Parity gate` działa na pasujących PR
oraz z ręcznego dispatch z mock providerami. `QA-Lab - All Lanes` działa nocnie na
`main` oraz z ręcznego dispatch z mock parity gate, live Matrix lane i
zarządzaną przez Convex live ścieżką Telegram jako zadania równoległe. `OpenClaw Release Checks`
uruchamia te same ścieżki przed zatwierdzeniem wydania.

- `pnpm openclaw qa suite`
  - Uruchamia scenariusze QA oparte na repo bezpośrednio na hoście.
  - Domyślnie uruchamia wiele wybranych scenariuszy równolegle z izolowanymi
    workerami Gateway. `qa-channel` domyślnie używa współbieżności 4 (ograniczonej
    liczbą wybranych scenariuszy). Użyj `--concurrency <count>`, aby dostroić liczbę workerów,
    lub `--concurrency 1` dla starszej ścieżki szeregowej.
  - Kończy się kodem niezerowym, gdy którykolwiek scenariusz zakończy się błędem. Użyj `--allow-failures`, gdy
    chcesz artefaktów bez błędnego kodu wyjścia.
  - Obsługuje tryby providera `live-frontier`, `mock-openai` i `aimock`.
    `aimock` uruchamia lokalny serwer providera oparty na AIMock dla eksperymentalnego
    pokrycia fixture i mockowania protokołu bez zastępowania ścieżki `mock-openai`
    świadomej scenariuszy.
- `pnpm openclaw qa suite --runner multipass`
  - Uruchamia ten sam pakiet QA wewnątrz jednorazowej Linux VM Multipass.
  - Zachowuje to samo zachowanie wyboru scenariuszy co `qa suite` na hoście.
  - Ponownie używa tych samych flag wyboru providera/modelu co `qa suite`.
  - Uruchomienia live przekazują obsługiwane wejścia auth QA, które są praktyczne dla gościa:
    klucze providerów oparte na env, ścieżkę konfiguracji QA live provider oraz `CODEX_HOME`, gdy jest obecne.
  - Katalogi wyjściowe muszą pozostać pod katalogiem głównym repo, aby gość mógł zapisywać z powrotem przez
    zamontowany workspace.
  - Zapisuje standardowy raport + podsumowanie QA oraz logi Multipass w
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Uruchamia stronę QA opartą na Docker do pracy QA w stylu operatora.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Buduje npm tarball z bieżącego checkoutu, instaluje go globalnie w
    Docker, uruchamia nieinteraktywny onboarding klucza API OpenAI, domyślnie konfiguruje Telegram,
    weryfikuje, że włączenie pluginu instaluje zależności runtime na żądanie,
    uruchamia doctor i jedną lokalną turę agenta względem mockowanego endpointu OpenAI.
  - Użyj `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, aby uruchomić tę samą
    ścieżkę instalacji pakietowej z Discord.
- `pnpm test:docker:session-runtime-context`
  - Uruchamia deterministyczny Docker smoke z wbudowaną aplikacją dla osadzonych transkryptów
    kontekstu runtime. Weryfikuje, że ukryty kontekst runtime OpenClaw jest utrwalany jako
    niestandardowa wiadomość niewyświetlana zamiast wyciekać do widocznej tury użytkownika,
    a następnie seeduje uszkodzoną sesję JSONL i weryfikuje, że
    `openclaw doctor --fix` przepisuje ją do aktywnej gałęzi z kopią zapasową.
- `pnpm test:docker:npm-telegram-live`
  - Instaluje opublikowany pakiet OpenClaw w Docker, uruchamia onboarding
    zainstalowanego pakietu, konfiguruje Telegram przez zainstalowane CLI, a następnie ponownie używa
    ścieżki live Telegram QA z tym zainstalowanym pakietem jako Gateway SUT.
  - Domyślnie używa `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Używa tych samych poświadczeń Telegram w env albo tego samego źródła poświadczeń Convex co
    `pnpm openclaw qa telegram`. Dla automatyzacji CI/wydania ustaw
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` oraz
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli. Jeśli
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli Convex są obecne w CI,
    wrapper Docker wybiera Convex automatycznie.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` nadpisuje współdzielone
    `OPENCLAW_QA_CREDENTIAL_ROLE` tylko dla tej ścieżki.
  - GitHub Actions udostępnia tę ścieżkę jako ręczny workflow maintainera
    `NPM Telegram Beta E2E`. Nie uruchamia się przy merge. Workflow używa
    środowiska `qa-live-shared` i dzierżaw poświadczeń CI Convex.
- `pnpm test:docker:bundled-channel-deps`
  - Pakuje i instaluje bieżący build OpenClaw w Docker, uruchamia Gateway
    ze skonfigurowanym OpenAI, a następnie włącza dołączone kanały/pluginy przez
    edycje konfiguracji.
  - Weryfikuje, że wykrywanie setup pozostawia brakujące zależności runtime
    nieskonfigurowanego pluginu nieobecne, że pierwsze skonfigurowane uruchomienie Gateway lub doctor
    instaluje zależności runtime każdego dołączonego pluginu na żądanie, a drugi restart
    nie reinstaluje zależności, które zostały już aktywowane.
  - Instaluje również znaną starszą bazę npm, włącza Telegram przed uruchomieniem
    `openclaw update --tag <candidate>` i weryfikuje, że doctor po aktualizacji kandydata
    naprawia zależności runtime dołączonego kanału bez naprawy postinstall po stronie harnessu.
- `pnpm test:parallels:npm-update`
  - Uruchamia smoke natywnej aktualizacji pakietowej w gościach Parallels. Każda
    wybrana platforma najpierw instaluje żądany pakiet bazowy, a następnie uruchamia
    zainstalowane polecenie `openclaw update` w tym samym gościu i weryfikuje zainstalowaną
    wersję, stan aktualizacji, gotowość Gateway i jedną lokalną turę agenta.
  - Użyj `--platform macos`, `--platform windows` albo `--platform linux`, gdy iterujesz nad jednym gościem. Użyj `--json` dla ścieżki artefaktu podsumowania i statusu per ścieżka.
  - Ścieżka OpenAI domyślnie używa `openai/gpt-5.5` jako dowodu live agent-turn.
    Przekaż `--model <provider/model>` albo ustaw
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, gdy celowo walidujesz inny model OpenAI.
  - Owiń długie lokalne uruchomienia timeoutem hosta, aby zacięcia transportu Parallels nie
    zużyły reszty okna testowego:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrypt zapisuje zagnieżdżone logi ścieżek w `/tmp/openclaw-parallels-npm-update.*`.
    Sprawdź `windows-update.log`, `macos-update.log` lub `linux-update.log`,
    zanim uznasz, że zewnętrzny wrapper się zawiesił.
  - Aktualizacja Windows może spędzić 10–15 minut w doctor po aktualizacji / naprawie zależności runtime na zimnym gościu; to nadal zdrowe zachowanie, gdy zagnieżdżony log debug npm się przesuwa.
  - Nie uruchamiaj tego zbiorczego wrappera równolegle z indywidualnymi ścieżkami smoke Parallels dla macOS, Windows lub Linux. Współdzielą stan VM i mogą kolidować przy odtwarzaniu snapshotu, serwowaniu pakietu lub stanie Gateway gościa.
  - Dowód po aktualizacji uruchamia normalną powierzchnię dołączonego pluginu, ponieważ
    fasady możliwości, takie jak mowa, generowanie obrazów i rozumienie
    multimediów, są ładowane przez dołączone API runtime nawet wtedy, gdy sama
    tura agenta sprawdza tylko prostą odpowiedź tekstową.

- `pnpm openclaw qa aimock`
  - Uruchamia tylko lokalny serwer providera AIMock do bezpośredniego testowania smoke protokołu.
- `pnpm openclaw qa matrix`
  - Uruchamia ścieżkę live QA Matrix względem jednorazowego homeserwera Tuwunel opartego na Docker.
  - Ten host QA jest dziś tylko repo/dev. Spakowane instalacje OpenClaw nie dostarczają
    `qa-lab`, więc nie udostępniają `openclaw qa`.
  - Checkouty repo ładują dołączony runner bezpośrednio; nie jest potrzebny
    osobny krok instalacji pluginu.
  - Tworzy trzy tymczasowe użytkowniki Matrix (`driver`, `sut`, `observer`) oraz jeden prywatny pokój, a następnie uruchamia proces potomny QA gateway z prawdziwym pluginem Matrix jako transportem SUT.
  - Domyślnie używa przypiętego stabilnego obrazu Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Nadpisz przez `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, gdy chcesz przetestować inny obraz.
  - Matrix nie udostępnia współdzielonych flag źródła poświadczeń, ponieważ ta ścieżka lokalnie tworzy jednorazowych użytkowników.
  - Zapisuje raport QA Matrix, podsumowanie, artefakt observed-events oraz połączony log wyjścia stdout/stderr w `.artifacts/qa-e2e/...`.
  - Domyślnie emituje postęp i wymusza twardy timeout uruchomienia przez `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (domyślnie 30 minut). Czyszczenie jest ograniczone przez `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS`, a błędy zawierają polecenie odzyskiwania `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Uruchamia ścieżkę live QA Telegram względem prawdziwej prywatnej grupy przy użyciu tokenów bota driver i SUT z env.
  - Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` i `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Identyfikator grupy musi być numerycznym identyfikatorem czatu Telegram.
  - Obsługuje `--credential-source convex` dla współdzielonych poświadczeń z puli. Domyślnie używaj trybu env albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, aby włączyć współdzielone dzierżawy.
  - Kończy się kodem niezerowym, gdy którykolwiek scenariusz zakończy się błędem. Użyj `--allow-failures`, gdy
    chcesz artefaktów bez błędnego kodu wyjścia.
  - Wymaga dwóch różnych botów w tej samej prywatnej grupie, przy czym bot SUT musi udostępniać nazwę użytkownika Telegram.
  - Aby uzyskać stabilną obserwację bot-do-bot, włącz Bot-to-Bot Communication Mode w `@BotFather` dla obu botów i upewnij się, że bot driver może obserwować ruch botów w grupie.
  - Zapisuje raport QA Telegram, podsumowanie i artefakt observed-messages w `.artifacts/qa-e2e/...`. Scenariusze odpowiedzi zawierają RTT od żądania wysłania drivera do zaobserwowanej odpowiedzi SUT.

Ścieżki live transport używają jednego standardowego kontraktu, aby nowe transporty nie rozjeżdżały się:

`qa-channel` pozostaje szerokim syntetycznym pakietem QA i nie jest częścią macierzy pokrycia live transport.

| Ścieżka  | Canary | Bramkowanie wzmianek | Blokada allowlisty | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Follow-up w wątku | Izolacja wątku | Obserwacja reakcji | Polecenie pomocy |
| -------- | ------ | -------------------- | ------------------ | ----------------------------- | ----------------------- | ----------------- | -------------- | ------------------ | ---------------- |
| Matrix   | x      | x                    | x                  | x                             | x                       | x                 | x              | x                  |                  |
| Telegram | x      |                      |                    |                               |                         |                   |                |                    | x                |

### Współdzielone poświadczenia Telegram przez Convex (v1)

Gdy dla `openclaw qa telegram` włączone jest `--credential-source convex` (lub `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`), QA lab pobiera wyłączną dzierżawę z puli opartej na Convex, wysyła Heartbeat dla tej dzierżawy podczas działania ścieżki i zwalnia dzierżawę przy zamknięciu.

Referencyjny szkielet projektu Convex:

- `qa/convex-credential-broker/`

Wymagane zmienne env:

- `OPENCLAW_QA_CONVEX_SITE_URL` (na przykład `https://your-deployment.convex.site`)
- Jeden sekret dla wybranej roli:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` dla `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` dla `ci`
- Wybór roli poświadczeń:
  - CLI: `--credential-role maintainer|ci`
  - Domyślna wartość env: `OPENCLAW_QA_CREDENTIAL_ROLE` (domyślnie `ci` w CI, w przeciwnym razie `maintainer`)

Opcjonalne zmienne env:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (domyślnie `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (domyślnie `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (domyślnie `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (domyślnie `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (domyślnie `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (opcjonalny identyfikator śledzenia)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` dopuszcza adresy URL Convex `http://` na local loopback tylko do lokalnego developmentu.

`OPENCLAW_QA_CONVEX_SITE_URL` powinno używać `https://` podczas normalnej pracy.

Polecenia administracyjne maintainera (dodawanie/usuwanie/listowanie puli) wymagają
konkretnie `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Pomocniki CLI dla maintainerów:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Użyj `doctor` przed uruchomieniami live, aby sprawdzić URL strony Convex, sekrety brokera,
prefiks endpointu, timeout HTTP i osiągalność admin/list bez wypisywania
wartości sekretów. Użyj `--json` dla wyjścia czytelnego maszynowo w skryptach i narzędziach CI.

Domyślny kontrakt endpointu (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Żądanie: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sukces: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Wyczerpanie/powtórzenie: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
- `groupId` musi być ciągiem będącym numerycznym identyfikatorem czatu Telegram.
- `admin/add` waliduje ten kształt dla `kind: "telegram"` i odrzuca nieprawidłowe payloady.

### Dodawanie kanału do QA

Dodanie kanału do markdownowego systemu QA wymaga dokładnie dwóch rzeczy:

1. Adaptera transportu dla kanału.
2. Pakietu scenariuszy, który wykonuje kontrakt kanału.

Nie dodawaj nowego najwyższego poziomu polecenia QA, gdy współdzielony host `qa-lab` może obsłużyć ten przepływ.

`qa-lab` zarządza współdzieloną mechaniką hosta:

- głównym poleceniem `openclaw qa`
- uruchamianiem i zamykaniem pakietu
- współbieżnością workerów
- zapisem artefaktów
- generowaniem raportów
- wykonywaniem scenariuszy
- aliasami zgodności dla starszych scenariuszy `qa-channel`

Pluginy runnerów zarządzają kontraktem transportu:

- sposobem montowania `openclaw qa <runner>` pod współdzielonym głównym poleceniem `qa`
- sposobem konfigurowania Gateway dla tego transportu
- sposobem sprawdzania gotowości
- sposobem wstrzykiwania zdarzeń przychodzących
- sposobem obserwowania wiadomości wychodzących
- sposobem udostępniania transkryptów i znormalizowanego stanu transportu
- sposobem wykonywania akcji opartych na transporcie
- sposobem obsługi resetu lub czyszczenia specyficznego dla transportu

Minimalny próg wdrożenia dla nowego kanału to:

1. Zachowaj `qa-lab` jako właściciela współdzielonego głównego polecenia `qa`.
2. Zaimplementuj runner transportu na współdzielonym seamu hosta `qa-lab`.
3. Zachowaj mechanikę specyficzną dla transportu wewnątrz pluginu runnera lub harnessu kanału.
4. Zamontuj runner jako `openclaw qa <runner>` zamiast rejestrować konkurencyjne główne polecenie.
   Pluginy runnerów powinny deklarować `qaRunners` w `openclaw.plugin.json` i eksportować pasującą tablicę `qaRunnerCliRegistrations` z `runtime-api.ts`.
   Zachowaj lekkość `runtime-api.ts`; lazy CLI i wykonanie runnera powinny pozostać za osobnymi entrypointami.
5. Twórz lub dostosowuj scenariusze markdown w tematycznych katalogach `qa/scenarios/`.
6. Używaj generycznych helperów scenariuszy dla nowych scenariuszy.
7. Utrzymuj działanie istniejących aliasów zgodności, chyba że repo wykonuje celową migrację.

Reguła decyzji jest ścisła:

- Jeśli zachowanie można wyrazić raz w `qa-lab`, umieść je w `qa-lab`.
- Jeśli zachowanie zależy od jednego transportu kanału, zachowaj je w pluginie runnera lub harnessie pluginu.
- Jeśli scenariusz potrzebuje nowej możliwości, z której może korzystać więcej niż jeden kanał, dodaj generyczny helper zamiast gałęzi specyficznej dla kanału w `suite.ts`.
- Jeśli zachowanie ma sens tylko dla jednego transportu, zachowaj scenariusz jako specyficzny dla transportu i wyraźnie to zaznacz w kontrakcie scenariusza.

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

Aliasów zgodności nadal można używać dla istniejących scenariuszy, w tym:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Nowe prace nad kanałami powinny używać generycznych nazw helperów.
Aliasy zgodności istnieją, aby uniknąć migracji typu flag day, a nie jako model
dla tworzenia nowych scenariuszy.

## Pakiety testowe (co działa gdzie)

Myśl o pakietach jak o „rosnącym realizmie” (i rosnącej podatności na flaky/kosztach):

### Unit / integration (domyślnie)

- Polecenie: `pnpm test`
- Konfiguracja: nietargetowane uruchomienia używają zestawu shardów `vitest.full-*.config.ts` i mogą rozwijać wieloprojektowe shardy do konfiguracji per projekt dla równoległego harmonogramowania
- Pliki: inwentarze core/unit w `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` oraz testy node z allowlisty `ui` objęte przez `vitest.unit.config.ts`
- Zakres:
  - Czyste testy unit
  - Testy integracyjne w procesie (auth Gateway, routing, tooling, parsowanie, konfiguracja)
  - Deterministyczne regresje znanych błędów
- Oczekiwania:
  - Uruchamiane w CI
  - Nie wymagają prawdziwych kluczy
  - Powinny być szybkie i stabilne

<AccordionGroup>
  <Accordion title="Projekty, shardy i zakresowane ścieżki">

    - Nietargetowane `pnpm test` uruchamia dwanaście mniejszych konfiguracji shardów (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) zamiast jednego ogromnego natywnego procesu projektu głównego. Zmniejsza to szczytowe RSS na obciążonych maszynach i zapobiega zagłodzeniu niepowiązanych pakietów przez pracę auto-reply/extension.
    - `pnpm test --watch` nadal używa natywnego grafu projektów z głównego `vitest.config.ts`, ponieważ pętla watch dla wielu shardów nie jest praktyczna.
    - `pnpm test`, `pnpm test:watch` i `pnpm test:perf:imports` najpierw kierują jawne cele plików/katalogów przez zakresowane ścieżki, więc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` unika kosztu pełnego uruchamiania projektu głównego.
    - `pnpm test:changed` rozwija zmienione ścieżki git do tych samych zakresowanych ścieżek, gdy diff dotyka tylko routowalnych plików źródłowych/testowych; edycje config/setup nadal wracają do szerokiego ponownego uruchomienia projektu głównego.
    - `pnpm check:changed` to normalna inteligentna lokalna bramka dla wąskich zmian. Klasyfikuje diff do kategorii core, testy core, extensions, testy extension, apps, docs, metadata wydania, narzędzia live Docker i tooling, a następnie uruchamia odpowiadające im ścieżki typecheck/lint/test. Zmiany publicznego Plugin SDK i kontraktów pluginów obejmują jedno przejście walidacji extension, ponieważ extension zależą od tych kontraktów core. Bumpy wersji tylko w metadata wydania uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności root zamiast pełnego pakietu, z zabezpieczeniem odrzucającym zmiany pakietów poza polem wersji najwyższego poziomu.
    - Edycje live Docker ACP harness uruchamiają ukierunkowaną lokalną bramkę: składnię shell dla skryptów auth live Docker, dry-run planisty live Docker, testy jednostkowe ACP bind i testy extension ACPX. Zmiany `package.json` są uwzględniane tylko wtedy, gdy diff ogranicza się do `scripts["test:docker:live-*"]`; zmiany zależności, eksportów, wersji i innych powierzchni pakietu nadal używają szerszych zabezpieczeń.
    - Testy unit o lekkich importach z agents, commands, plugins, pomocników auto-reply, `plugin-sdk` i podobnych czystych obszarów utility przechodzą przez ścieżkę `unit-fast`, która pomija `test/setup-openclaw-runtime.ts`; pliki stanowe/runtime-heavy pozostają na istniejących ścieżkach.
    - Wybrane pliki pomocnicze źródeł `plugin-sdk` i `commands` mapują też uruchomienia changed-mode do jawnych testów sąsiednich w tych lekkich ścieżkach, dzięki czemu edycje helperów nie wymagają ponownego uruchamiania całego ciężkiego pakietu dla tego katalogu.
    - `auto-reply` ma dedykowane koszyki dla pomocników core najwyższego poziomu, testów integracyjnych najwyższego poziomu `reply.*` oraz poddrzewa `src/auto-reply/reply/**`. CI dodatkowo dzieli poddrzewo reply na shardy agent-runner, dispatch i commands/state-routing, aby jeden koszyk z ciężkimi importami nie przejmował całego ogona Node.

  </Accordion>

  <Accordion title="Pokrycie embedded runner">

    - Gdy zmieniasz wejścia odkrywania narzędzia message lub kontekst
      runtime Compaction, utrzymuj oba poziomy pokrycia.
    - Dodawaj ukierunkowane regresje helperów dla czystych granic routingu i normalizacji.
    - Utrzymuj w dobrym stanie pakiety integracyjne embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` i
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Te pakiety weryfikują, że scoped ids i zachowanie Compaction nadal
      przepływają przez rzeczywiste ścieżki `run.ts` / `compact.ts`; testy tylko helperów
      nie są wystarczającym zamiennikiem dla tych ścieżek integracyjnych.

  </Accordion>

  <Accordion title="Domyślne ustawienia puli i izolacji Vitest">

    - Bazowa konfiguracja Vitest domyślnie używa `threads`.
    - Współdzielona konfiguracja Vitest wymusza `isolate: false` i używa
      nieizolowanego runnera w projektach root, konfiguracjach e2e i live.
    - Główna ścieżka UI zachowuje ustawienia `jsdom` i optimizer, ale działa również na
      współdzielonym nieizolowanym runnerze.
    - Każdy shard `pnpm test` dziedziczy te same domyślne ustawienia `threads` + `isolate: false`
      ze współdzielonej konfiguracji Vitest.
    - `scripts/run-vitest.mjs` domyślnie dodaje `--no-maglev` dla procesów potomnych Node
      Vitest, aby zmniejszyć churn kompilacji V8 podczas dużych lokalnych uruchomień.
      Ustaw `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, aby porównać ze standardowym
      zachowaniem V8.

  </Accordion>

  <Accordion title="Szybka lokalna iteracja">

    - `pnpm changed:lanes` pokazuje, które ścieżki architektoniczne wyzwala diff.
    - Hook pre-commit dotyczy tylko formatowania. Ponownie stage’uje sformatowane pliki i
      nie uruchamia lint, typecheck ani testów.
    - Uruchamiaj `pnpm check:changed` jawnie przed przekazaniem lub push, gdy
      potrzebujesz inteligentnej lokalnej bramki. Zmiany publicznego Plugin SDK i kontraktów pluginów
      obejmują jedno przejście walidacji extension.
    - `pnpm test:changed` kieruje przez zakresowane ścieżki, gdy zmienione ścieżki
      dają się czysto odwzorować na mniejszy pakiet.
    - `pnpm test:max` i `pnpm test:changed:max` zachowują to samo zachowanie routingu,
      tylko z wyższym limitem workerów.
    - Automatyczne lokalne skalowanie workerów jest celowo konserwatywne i cofa się,
      gdy średnie obciążenie hosta jest już wysokie, dzięki czemu wiele równoczesnych
      uruchomień Vitest domyślnie wyrządza mniej szkód.
    - Bazowa konfiguracja Vitest oznacza pliki projektów/konfiguracji jako
      `forceRerunTriggers`, aby ponowne uruchomienia changed-mode pozostawały poprawne, gdy
      zmienia się okablowanie testów.
    - Konfiguracja utrzymuje `OPENCLAW_VITEST_FS_MODULE_CACHE` w stanie włączonym na obsługiwanych
      hostach; ustaw `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, jeśli chcesz
      jedną jawną lokalizację cache do bezpośredniego profilowania.

  </Accordion>

  <Accordion title="Debugowanie wydajności">

    - `pnpm test:perf:imports` włącza raportowanie czasu importów Vitest oraz
      wyjście breakdown importów.
    - `pnpm test:perf:imports:changed` zawęża ten sam widok profilowania do
      plików zmienionych od `origin/main`.
    - Dane czasowe shardów są zapisywane do `.artifacts/vitest-shard-timings.json`.
      Uruchomienia całej konfiguracji używają ścieżki konfiguracji jako klucza; shardy CI oparte
      na include-pattern dołączają nazwę sharda, aby filtrowane shardy można było śledzić
      osobno.
    - Gdy jeden gorący test nadal spędza większość czasu na importach startowych,
      trzymaj ciężkie zależności za wąskim lokalnym seamem `*.runtime.ts` i
      mockuj ten seam bezpośrednio zamiast głęboko importować helpery runtime tylko
      po to, by przekazać je przez `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje routowane
      `test:changed` z natywną ścieżką projektu głównego dla tego zatwierdzonego diffu
      i wypisuje wall time oraz macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżące
      brudne drzewo, kierując listę zmienionych plików przez
      `scripts/test-projects.mjs` i główną konfigurację Vitest.
    - `pnpm test:perf:profile:main` zapisuje profil CPU głównego wątku dla
      narzutu startu i transformacji Vitest/Vite.
    - `pnpm test:perf:profile:runner` zapisuje profile CPU+heap runnera dla
      pakietu unit przy wyłączonej równoległości plików.

  </Accordion>
</AccordionGroup>

### Stabilność (Gateway)

- Polecenie: `pnpm test:stability:gateway`
- Konfiguracja: `vitest.gateway.config.ts`, wymuszone do jednego workera
- Zakres:
  - Uruchamia rzeczywisty Gateway loopback z domyślnie włączoną diagnostyką
  - Przepuszcza syntetyczny ruch wiadomości, pamięci i dużych payloadów Gateway przez ścieżkę zdarzeń diagnostycznych
  - Odpytuje `diagnostics.stability` przez Gateway WS RPC
  - Obejmuje helpery utrwalania pakietu stabilności diagnostyki
  - Sprawdza, że rejestrator pozostaje ograniczony, syntetyczne próbki RSS pozostają poniżej budżetu presji, a głębokości kolejek per sesja wracają do zera
- Oczekiwania:
  - Bezpieczne dla CI i bez kluczy
  - Wąska ścieżka do dalszych działań po regresjach stabilności, a nie zamiennik pełnego pakietu Gateway

### E2E (smoke Gateway)

- Polecenie: `pnpm test:e2e`
- Konfiguracja: `vitest.e2e.config.ts`
- Pliki: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` oraz testy E2E dołączonych pluginów w `extensions/`
- Domyślne ustawienia runtime:
  - Używa Vitest `threads` z `isolate: false`, zgodnie z resztą repo.
  - Używa adaptacyjnych workerów (CI: maksymalnie 2, lokalnie: domyślnie 1).
  - Domyślnie działa w trybie silent, aby zmniejszyć narzut I/O konsoli.
- Przydatne nadpisania:
  - `OPENCLAW_E2E_WORKERS=<n>`, aby wymusić liczbę workerów (limit 16).
  - `OPENCLAW_E2E_VERBOSE=1`, aby ponownie włączyć szczegółowe wyjście konsoli.
- Zakres:
  - Zachowanie end-to-end wielu instancji Gateway
  - Powierzchnie WebSocket/HTTP, parowanie Node i cięższy networking
- Oczekiwania:
  - Uruchamiane w CI (gdy włączone w pipeline)
  - Nie wymagają prawdziwych kluczy
  - Więcej ruchomych części niż testy unit (mogą być wolniejsze)

### E2E: smoke backendu OpenShell

- Polecenie: `pnpm test:e2e:openshell`
- Plik: `extensions/openshell/src/backend.e2e.test.ts`
- Zakres:
  - Uruchamia izolowany OpenShell gateway na hoście przez Docker
  - Tworzy sandbox z tymczasowego lokalnego Dockerfile
  - Wykonuje backend OpenShell OpenClaw przez rzeczywiste `sandbox ssh-config` + SSH exec
  - Weryfikuje zdalno-kanoniczne zachowanie systemu plików przez most fs sandboxa
- Oczekiwania:
  - Tylko opt-in; nie jest częścią domyślnego uruchomienia `pnpm test:e2e`
  - Wymaga lokalnego CLI `openshell` i działającego daemona Docker
  - Używa izolowanych `HOME` / `XDG_CONFIG_HOME`, a następnie niszczy testowy gateway i sandbox
- Przydatne nadpisania:
  - `OPENCLAW_E2E_OPENSHELL=1`, aby włączyć test przy ręcznym uruchamianiu szerszego pakietu e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, aby wskazać niestandardowe binarium CLI lub skrypt wrappera

### Live (prawdziwi providerzy + prawdziwe modele)

- Polecenie: `pnpm test:live`
- Konfiguracja: `vitest.live.config.ts`
- Pliki: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` oraz testy live dołączonych pluginów w `extensions/`
- Domyślnie: **włączone** przez `pnpm test:live` (ustawia `OPENCLAW_LIVE_TEST=1`)
- Zakres:
  - „Czy ten provider/model rzeczywiście działa _dzisiaj_ z prawdziwymi poświadczeniami?”
  - Wychwytywanie zmian formatu providera, dziwactw wywoływania narzędzi, problemów auth i zachowania limitów zapytań
- Oczekiwania:
  - Z założenia nie są stabilne w CI (prawdziwe sieci, prawdziwe polityki providerów, limity, awarie)
  - Kosztują pieniądze / zużywają limity zapytań
  - Preferuj uruchamianie zawężonych podzbiorów zamiast „wszystkiego”
- Uruchomienia live pobierają `~/.profile`, aby znaleźć brakujące klucze API.
- Domyślnie uruchomienia live nadal izolują `HOME` i kopiują materiał config/auth do tymczasowego testowego katalogu domowego, aby fixture unit nie mogły modyfikować twojego prawdziwego `~/.openclaw`.
- Ustaw `OPENCLAW_LIVE_USE_REAL_HOME=1` tylko wtedy, gdy celowo chcesz, aby testy live używały twojego prawdziwego katalogu domowego.
- `pnpm test:live` domyślnie działa teraz w cichszym trybie: zachowuje wyjście postępu `[live] ...`, ale ukrywa dodatkową informację o `~/.profile` i wycisza logi bootstrap Gateway / szum Bonjour. Ustaw `OPENCLAW_LIVE_TEST_QUIET=0`, jeśli chcesz z powrotem pełne logi startowe.
- Rotacja kluczy API (specyficzna dla providera): ustaw `*_API_KEYS` w formacie rozdzielanym przecinkami/średnikami lub `*_API_KEY_1`, `*_API_KEY_2` (na przykład `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) albo nadpisanie per live przez `OPENCLAW_LIVE_*_KEY`; testy ponawiają się przy odpowiedziach rate limit.
- Wyjście postępu/heartbeat:
  - Pakiety live emitują teraz linie postępu na stderr, dzięki czemu długie wywołania providerów są wyraźnie aktywne nawet wtedy, gdy przechwytywanie konsoli Vitest jest ciche.
  - `vitest.live.config.ts` wyłącza przechwytywanie konsoli Vitest, dzięki czemu linie postępu providera/Gateway są strumieniowane natychmiast podczas uruchomień live.
  - Dostosuj Heartbeat dla modeli bezpośrednich przez `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Dostosuj Heartbeat dla Gateway/testów przez `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Który pakiet powinienem uruchomić?

Użyj tej tabeli decyzyjnej:

- Edycja logiki/testów: uruchom `pnpm test` (oraz `pnpm test:coverage`, jeśli zmieniłeś dużo)
- Dotykanie networkingu Gateway / protokołu WS / parowania: dodaj `pnpm test:e2e`
- Debugowanie „mój bot nie działa” / awarii specyficznych dla providera / wywoływania narzędzi: uruchom zawężone `pnpm test:live`

## Testy live (dotykające sieci)

Dla macierzy modeli live, smoke backendu CLI, smoke ACP, harnessu Codex app-server
oraz wszystkich testów live providerów mediów (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — plus obsługi poświadczeń dla uruchomień live — zobacz
[Testowanie — pakiety live](/pl/help/testing-live).

## Runnery Docker (opcjonalne kontrole „działa w Linux”)

Te runnery Docker dzielą się na dwa koszyki:

- Runnery modeli live: `test:docker:live-models` i `test:docker:live-gateway` uruchamiają tylko odpowiadający im plik live z kluczem profilu wewnątrz obrazu Docker repo (`src/agents/models.profiles.live.test.ts` i `src/gateway/gateway-models.profiles.live.test.ts`), montując twój lokalny katalog konfiguracji i workspace (oraz ładując `~/.profile`, jeśli jest zamontowany). Odpowiadające lokalne entrypointy to `test:live:models-profiles` i `test:live:gateway-profiles`.
- Runnery Docker live domyślnie używają mniejszego limitu smoke, aby pełny sweep Docker pozostawał praktyczny:
  `test:docker:live-models` domyślnie używa `OPENCLAW_LIVE_MAX_MODELS=12`, a
  `test:docker:live-gateway` domyślnie używa `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` i
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Nadpisz te zmienne env, gdy
  jawnie chcesz większy, wyczerpujący skan.
- `test:docker:all` buduje obraz live Docker raz przez `test:docker:live-build`, a następnie ponownie używa go dla ścieżek live Docker. Buduje też jeden współdzielony obraz `scripts/e2e/Dockerfile` przez `test:docker:e2e-build` i ponownie używa go dla runnerów smoke E2E w kontenerze, które wykonują zbudowaną aplikację. Agregat używa ważonego lokalnego scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` steruje liczbą slotów procesów, a limity zasobów pilnują, aby ciężkie ścieżki live, npm-install i multi-service nie startowały jednocześnie. Domyślne wartości to 10 slotów, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` i `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; dostrajaj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` lub `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` tylko wtedy, gdy host Docker ma większy zapas zasobów. Runner domyślnie wykonuje Docker preflight, usuwa stare kontenery OpenClaw E2E, wypisuje status co 30 sekund, zapisuje czasy pomyślnych ścieżek do `.artifacts/docker-tests/lane-timings.json` i używa tych czasów, aby przy późniejszych uruchomieniach startować najdłuższe ścieżki jako pierwsze. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wypisać ważony manifest ścieżek bez budowania lub uruchamiania Docker.
- Runnery smoke kontenerów: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` i `test:docker:config-reload` uruchamiają jeden lub więcej prawdziwych kontenerów i weryfikują ścieżki integracyjne wyższego poziomu.

Runnery Docker dla modeli live dodatkowo bind-mountują tylko potrzebne katalogi auth CLI (albo wszystkie obsługiwane, gdy uruchomienie nie jest zawężone), a następnie kopiują je do katalogu domowego kontenera przed uruchomieniem, aby OAuth zewnętrznego CLI mógł odświeżać tokeny bez modyfikowania hostowego magazynu auth:

- Modele bezpośrednie: `pnpm test:docker:live-models` (skrypt: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (skrypt: `scripts/test-live-acp-bind-docker.sh`; domyślnie obejmuje Claude, Codex i Gemini, z rygorystycznym pokryciem Droid/OpenCode przez `pnpm test:docker:live-acp-bind:droid` i `pnpm test:docker:live-acp-bind:opencode`)
- Smoke backendu CLI: `pnpm test:docker:live-cli-backend` (skrypt: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harnessu Codex app-server: `pnpm test:docker:live-codex-harness` (skrypt: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev: `pnpm test:docker:live-gateway` (skrypt: `scripts/test-live-gateway-models-docker.sh`)
- Smoke Open WebUI live: `pnpm test:docker:openwebui` (skrypt: `scripts/e2e/openwebui-docker.sh`)
- Kreator onboardingu (TTY, pełne scaffoldowanie): `pnpm test:docker:onboard` (skrypt: `scripts/e2e/onboard-docker.sh`)
- Smoke onboardingu/kanału/agenta z npm tarball: `pnpm test:docker:npm-onboard-channel-agent` instaluje spakowany tarball OpenClaw globalnie w Docker, konfiguruje OpenAI przez onboarding env-ref oraz domyślnie Telegram, weryfikuje, że doctor naprawia aktywowane zależności runtime pluginu, i uruchamia jedną mockowaną turę agenta OpenAI. Użyj wcześniej zbudowanego tarballa ponownie przez `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń przebudowę hosta przez `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` albo przełącz kanał przez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke przełączania kanału aktualizacji: `pnpm test:docker:update-channel-switch` instaluje spakowany tarball OpenClaw globalnie w Docker, przełącza z pakietu `stable` na git `dev`, weryfikuje, że utrwalony kanał i plugin po aktualizacji działają, a następnie przełącza z powrotem na pakiet `stable` i sprawdza stan aktualizacji.
- Smoke kontekstu runtime sesji: `pnpm test:docker:session-runtime-context` weryfikuje utrwalanie ukrytego kontekstu runtime w transkrypcie oraz naprawę doctor dla dotkniętych zduplikowanych gałęzi przepisywania promptów.
- Smoke globalnej instalacji Bun: `bash scripts/e2e/bun-global-install-smoke.sh` pakuje bieżące drzewo, instaluje je przez `bun install -g` w izolowanym katalogu domowym i weryfikuje, że `openclaw infer image providers --json` zwraca dołączonych providerów image zamiast się zawieszać. Użyj wcześniej zbudowanego tarballa ponownie przez `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń build hosta przez `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` albo skopiuj `dist/` ze zbudowanego obrazu Docker przez `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` współdzieli jeden cache npm między kontenerami root, update i direct-npm. Smoke update domyślnie używa npm `latest` jako stabilnej bazy przed aktualizacją do kandydata tarball. Kontrole installera bez roota utrzymują izolowany cache npm, aby wpisy cache należące do roota nie maskowały zachowania instalacji lokalnej użytkownika. Ustaw `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, aby ponownie użyć cache root/update/direct-npm między lokalnymi ponownymi uruchomieniami.
- Install Smoke CI pomija duplikat bezpośredniej globalnej aktualizacji npm przez `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; uruchom skrypt lokalnie bez tego env, gdy potrzebne jest pokrycie bezpośredniego `npm install -g`.
- Smoke CLI usuwania współdzielonego workspace agentów: `pnpm test:docker:agents-delete-shared-workspace` (skrypt: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) domyślnie buduje obraz z głównego Dockerfile, seeduje dwóch agentów z jednym workspace w izolowanym katalogu domowym kontenera, uruchamia `agents delete --json` i weryfikuje prawidłowy JSON oraz zachowanie zachowanego workspace. Użyj ponownie obrazu install-smoke przez `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Networking Gateway (dwa kontenery, auth WS + health): `pnpm test:docker:gateway-network` (skrypt: `scripts/e2e/gateway-network-docker.sh`)
- Smoke snapshotu Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (skrypt: `scripts/e2e/browser-cdp-snapshot-docker.sh`) buduje źródłowy obraz E2E plus warstwę Chromium, uruchamia Chromium z surowym CDP, wykonuje `browser doctor --deep` i weryfikuje, że snapshoty ról CDP obejmują adresy URL linków, elementy klikalne promowane przez kursor, ref iframe oraz metadane ramek.
- Regresja OpenAI Responses web_search minimal reasoning: `pnpm test:docker:openai-web-search-minimal` (skrypt: `scripts/e2e/openai-web-search-minimal-docker.sh`) uruchamia mockowany serwer OpenAI przez Gateway, weryfikuje, że `web_search` podnosi `reasoning.effort` z `minimal` do `low`, a następnie wymusza odrzucenie przez schemat providera i sprawdza, że surowy szczegół pojawia się w logach Gateway.
- Most kanału MCP (seedowany Gateway + most stdio + smoke surowej ramki powiadomienia Claude): `pnpm test:docker:mcp-channels` (skrypt: `scripts/e2e/mcp-channels-docker.sh`)
- Narzędzia Pi bundle MCP (prawdziwy serwer MCP stdio + smoke allow/deny osadzonego profilu Pi): `pnpm test:docker:pi-bundle-mcp-tools` (skrypt: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Czyszczenie cron/subagent MCP (prawdziwy Gateway + zamykanie potomka MCP stdio po izolowanych uruchomieniach cron i jednorazowego subagenta): `pnpm test:docker:cron-mcp-cleanup` (skrypt: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginy (smoke instalacji, instalacja/deinstalacja ClawHub, aktualizacje marketplace i włączanie/inspekcja pakietu Claude): `pnpm test:docker:plugins` (skrypt: `scripts/e2e/plugins-docker.sh`)
  Ustaw `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, aby pominąć blok live ClawHub, albo nadpisz domyślny pakiet przez `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` i `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`.
- Smoke bez zmian aktualizacji pluginu: `pnpm test:docker:plugin-update` (skrypt: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke metadanych reloadu konfiguracji: `pnpm test:docker:config-reload` (skrypt: `scripts/e2e/config-reload-source-docker.sh`)
- Zależności runtime dołączonych pluginów: `pnpm test:docker:bundled-channel-deps` domyślnie buduje mały obraz runnera Docker, buduje i pakuje OpenClaw raz na hoście, a następnie montuje ten tarball do każdego scenariusza instalacji Linux. Użyj ponownie obrazu przez `OPENCLAW_SKIP_DOCKER_BUILD=1`, pomiń przebudowę hosta po świeżym lokalnym buildzie przez `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, albo wskaż istniejący tarball przez `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Pełny agregat Docker prepackuje ten tarball raz, a następnie sharduje kontrole dołączonych kanałów na niezależne ścieżki, w tym osobne ścieżki aktualizacji dla Telegram, Discord, Slack, Feishu, memory-lancedb i ACPX. Użyj `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, aby zawęzić macierz kanałów przy bezpośrednim uruchamianiu ścieżki bundled, albo `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, aby zawęzić scenariusz aktualizacji. Ta ścieżka weryfikuje również, że `channels.<id>.enabled=false` i `plugins.entries.<id>.enabled=false` wyłączają naprawę doctor/zależności runtime.
- Zawężaj zależności runtime dołączonych pluginów podczas iteracji, wyłączając niepowiązane scenariusze, na przykład:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Aby ręcznie zbudować wcześniej i ponownie użyć współdzielonego obrazu built-app:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Nadpisania obrazów specyficzne dla pakietu, takie jak `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, nadal mają pierwszeństwo, gdy są ustawione. Gdy `OPENCLAW_SKIP_DOCKER_BUILD=1` wskazuje na zdalny współdzielony obraz, skrypty pobierają go, jeśli nie jest jeszcze lokalnie dostępny. Testy QR i instalatora w Docker zachowują własne Dockerfile, ponieważ walidują zachowanie pakietu/instalacji, a nie współdzielony runtime built-app.

Runnery Docker modeli live również bind-mountują bieżący checkout w trybie tylko do odczytu i
stage’ują go do tymczasowego katalogu roboczego wewnątrz kontenera. Dzięki temu obraz runtime
pozostaje lekki, a Vitest nadal działa dokładnie na twoim lokalnym źródle/konfiguracji.
Krok staging pomija duże lokalne cache i wyniki buildów aplikacji, takie jak
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` oraz lokalne dla aplikacji katalogi `.build` lub
wyjścia Gradle, dzięki czemu uruchomienia Docker live nie spędzają minut na kopiowaniu
artefaktów specyficznych dla maszyny.
Ustawiają też `OPENCLAW_SKIP_CHANNELS=1`, aby testy Gateway live nie uruchamiały
prawdziwych workerów kanałów Telegram/Discord/itp. wewnątrz kontenera.
`test:docker:live-models` nadal uruchamia `pnpm test:live`, więc przekazuj
także `OPENCLAW_LIVE_GATEWAY_*`, gdy chcesz zawęzić lub wykluczyć pokrycie Gateway
live z tej ścieżki Docker.
`test:docker:openwebui` to smoke zgodności wyższego poziomu: uruchamia
kontener Gateway OpenClaw z włączonymi punktami końcowymi HTTP zgodnymi z OpenAI,
uruchamia przypięty kontener Open WebUI względem tego Gateway, loguje się przez
Open WebUI, weryfikuje, że `/api/models` udostępnia `openclaw/default`, a następnie wysyła
prawdziwe żądanie czatu przez proxy `/api/chat/completions` Open WebUI.
Pierwsze uruchomienie może być wyraźnie wolniejsze, ponieważ Docker może potrzebować pobrać
obraz Open WebUI, a Open WebUI może potrzebować zakończyć własną konfigurację cold-start.
Ta ścieżka oczekuje używalnego klucza live modelu, a `OPENCLAW_PROFILE_FILE`
(domyslnie `~/.profile`) to główny sposób jego dostarczenia w uruchomieniach w Docker.
Pomyślne uruchomienia wypisują mały payload JSON, taki jak `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` jest celowo deterministyczne i nie potrzebuje
prawdziwego konta Telegram, Discord ani iMessage. Uruchamia seedowany kontener
Gateway, startuje drugi kontener uruchamiający `openclaw mcp serve`, a następnie
weryfikuje wykrywanie kierowanych rozmów, odczyty transkryptów, metadane załączników,
zachowanie kolejki zdarzeń na żywo, routing wysyłek wychodzących oraz powiadomienia kanału +
uprawnień w stylu Claude przez rzeczywisty most MCP stdio. Kontrola powiadomień
sprawdza bezpośrednio surowe ramki MCP stdio, dzięki czemu smoke waliduje to, co
most faktycznie emituje, a nie tylko to, co akurat udostępnia określony SDK klienta.
`test:docker:pi-bundle-mcp-tools` jest deterministyczne i nie potrzebuje klucza
live modelu. Buduje obraz Docker repo, uruchamia prawdziwy serwer testowy MCP stdio
wewnątrz kontenera, materializuje ten serwer przez osadzony runtime MCP pakietu Pi,
wykonuje narzędzie, a następnie weryfikuje, że `coding` i `messaging` zachowują
narzędzia `bundle-mcp`, podczas gdy `minimal` i `tools.deny: ["bundle-mcp"]` je filtrują.
`test:docker:cron-mcp-cleanup` jest deterministyczne i nie potrzebuje klucza
live modelu. Uruchamia seedowany Gateway z prawdziwym serwerem testowym MCP stdio,
wykonuje izolowaną turę cron i jednorazową turę potomną `/subagents spawn`, a następnie weryfikuje,
że proces potomny MCP kończy działanie po każdym uruchomieniu.

Ręczny smoke wątku ACP w jawnym języku (nie w CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Zachowaj ten skrypt dla przepływów regresji/debugowania. Może znów być potrzebny do walidacji routingu wątków ACP, więc go nie usuwaj.

Przydatne zmienne env:

- `OPENCLAW_CONFIG_DIR=...` (domyślnie: `~/.openclaw`) montowane do `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (domyślnie: `~/.openclaw/workspace`) montowane do `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (domyślnie: `~/.profile`) montowane do `/home/node/.profile` i ładowane przed uruchomieniem testów
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, aby zweryfikować tylko zmienne env załadowane z `OPENCLAW_PROFILE_FILE`, używając tymczasowych katalogów config/workspace i bez montowania zewnętrznego auth CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (domyślnie: `~/.cache/openclaw/docker-cli-tools`) montowane do `/home/node/.npm-global` dla cache’owanych instalacji CLI wewnątrz Docker
- Zewnętrzne katalogi/pliki auth CLI pod `$HOME` są montowane jako tylko do odczytu pod `/host-auth...`, a następnie kopiowane do `/home/node/...` przed startem testów
  - Domyślne katalogi: `.minimax`
  - Domyślne pliki: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Zawężone uruchomienia providerów montują tylko potrzebne katalogi/pliki wywnioskowane z `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Nadpisanie ręczne przez `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` lub listę rozdzielaną przecinkami, np. `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, aby zawęzić uruchomienie
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, aby filtrować providerów w kontenerze
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby ponownie użyć istniejącego obrazu `openclaw:local-live` dla ponownych uruchomień, które nie wymagają przebudowy
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby upewnić się, że poświadczenia pochodzą z magazynu profilu (a nie z env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, aby wybrać model udostępniany przez Gateway dla smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, aby nadpisać prompt sprawdzania nonce używany przez smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, aby nadpisać przypięty tag obrazu Open WebUI

## Kontrola poprawności docs

Po edycjach docs uruchom kontrole docs: `pnpm check:docs`.
Uruchom pełną walidację anchorów Mintlify, gdy potrzebujesz też sprawdzenia nagłówków wewnątrz strony: `pnpm docs:check-links:anchors`.

## Regresja offline (bezpieczna dla CI)

To regresje „real pipeline” bez prawdziwych providerów:

- Wywoływanie narzędzi Gateway (mock OpenAI, prawdziwy Gateway + pętla agenta): `src/gateway/gateway.test.ts` (przypadek: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Kreator Gateway (WS `wizard.start`/`wizard.next`, zapis konfiguracji + wymuszone auth): `src/gateway/gateway.test.ts` (przypadek: "runs wizard over ws and writes auth token config")

## Ewaluacje niezawodności agenta (Skills)

Mamy już kilka testów bezpiecznych dla CI, które zachowują się jak „ewaluacje niezawodności agenta”:

- Mockowane wywoływanie narzędzi przez rzeczywisty Gateway + pętlę agenta (`src/gateway/gateway.test.ts`).
- End-to-end przepływy kreatora, które walidują okablowanie sesji i efekty konfiguracji (`src/gateway/gateway.test.ts`).

Czego nadal brakuje dla Skills (zobacz [Skills](/pl/tools/skills)):

- **Podejmowanie decyzji:** gdy Skills są wymienione w promptcie, czy agent wybiera właściwy Skill (albo unika nieistotnych)?
- **Zgodność:** czy agent odczytuje `SKILL.md` przed użyciem i wykonuje wymagane kroki/argumenty?
- **Kontrakty workflow:** scenariusze wieloturowe, które sprawdzają kolejność narzędzi, przenoszenie historii sesji i granice sandboxa.

Przyszłe ewaluacje powinny najpierw pozostać deterministyczne:

- Runner scenariuszy używający mock providerów do sprawdzania wywołań narzędzi + kolejności, odczytów plików Skill i okablowania sesji.
- Mały pakiet scenariuszy skoncentrowanych na Skills (użyj vs unikaj, bramkowanie, prompt injection).
- Opcjonalne ewaluacje live (opt-in, sterowane env) dopiero po wdrożeniu pakietu bezpiecznego dla CI.

## Testy kontraktowe (kształt pluginu i kanału)

Testy kontraktowe weryfikują, że każdy zarejestrowany plugin i kanał jest zgodny ze swoim
kontraktem interfejsu. Iterują po wszystkich wykrytych pluginach i uruchamiają pakiet
asercji kształtu i zachowania. Domyślna ścieżka unit `pnpm test` celowo
pomija te współdzielone pliki seam i smoke; uruchamiaj polecenia kontraktowe jawnie,
gdy dotykasz współdzielonych powierzchni kanału lub providera.

### Polecenia

- Wszystkie kontrakty: `pnpm test:contracts`
- Tylko kontrakty kanałów: `pnpm test:contracts:channels`
- Tylko kontrakty providerów: `pnpm test:contracts:plugins`

### Kontrakty kanałów

Znajdują się w `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - podstawowy kształt pluginu (id, name, capabilities)
- **setup** - kontrakt kreatora konfiguracji
- **session-binding** - zachowanie wiązania sesji
- **outbound-payload** - struktura payloadu wiadomości
- **inbound** - obsługa wiadomości przychodzących
- **actions** - handlery akcji kanału
- **threading** - obsługa identyfikatorów wątków
- **directory** - API katalogu/listy
- **group-policy** - wymuszanie polityki grup

### Kontrakty statusu providerów

Znajdują się w `src/plugins/contracts/*.contract.test.ts`.

- **status** - testy statusu kanałów
- **registry** - kształt rejestru pluginów

### Kontrakty providerów

Znajdują się w `src/plugins/contracts/*.contract.test.ts`:

- **auth** - kontrakt przepływu auth
- **auth-choice** - wybór/selekcja auth
- **catalog** - API katalogu modeli
- **discovery** - wykrywanie pluginów
- **loader** - ładowanie pluginów
- **runtime** - runtime providera
- **shape** - kształt/interfejs pluginu
- **wizard** - kreator konfiguracji

### Kiedy uruchamiać

- Po zmianie eksportów lub podścieżek plugin-sdk
- Po dodaniu lub modyfikacji pluginu kanału lub providera
- Po refaktoryzacji rejestracji pluginów lub discovery

Testy kontraktowe działają w CI i nie wymagają prawdziwych kluczy API.

## Dodawanie regresji (wskazówki)

Gdy naprawiasz problem providera/modelu wykryty w live:

- Jeśli to możliwe, dodaj regresję bezpieczną dla CI (mock/stub providera lub przechwycenie dokładnej transformacji kształtu żądania)
- Jeśli problem z natury dotyczy tylko live (limity zapytań, polityki auth), utrzymuj test live wąski i opt-in przez zmienne env
- Preferuj targetowanie najmniejszej warstwy, która wychwytuje błąd:
  - błąd konwersji/powtórzenia żądania providera → bezpośredni test modeli
  - błąd w pipeline sesji/historii/narzędzi Gateway → smoke Gateway live lub bezpieczny dla CI test mock Gateway
- Zabezpieczenie przechodzenia SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` wyprowadza jeden próbkowany cel dla każdej klasy SecretRef z metadanych rejestru (`listSecretTargetRegistryEntries()`), a następnie sprawdza, że identyfikatory exec z segmentami traversal są odrzucane.
  - Jeśli dodajesz nową rodzinę targetów SecretRef `includeInPlan` w `src/secrets/target-registry-data.ts`, zaktualizuj `classifyTargetClass` w tym teście. Test celowo kończy się błędem przy niesklasyfikowanych identyfikatorach targetów, aby nie dało się po cichu pominąć nowych klas.

## Powiązane

- [Testowanie live](/pl/help/testing-live)
- [CI](/pl/ci)
