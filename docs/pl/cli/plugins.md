---
read_when:
    - Chcesz zainstalować lub zarządzać Pluginami Gateway albo zgodnymi pakietami.
    - Chcesz debugować błędy ładowania Pluginów.
summary: Dokumentacja CLI dla `openclaw plugins` (`list`, `install`, `marketplace`, `uninstall`, `enable`/`disable`, `doctor`)
title: Pluginy
x-i18n:
    generated_at: "2026-04-24T15:22:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc693d5e3bc49057e1a108ba65a4dcb3bb662c00229e6fa38a0335afba8240e5
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Zarządzaj Pluginami Gateway, pakietami hooków i zgodnymi pakietami.

Powiązane:

- System Pluginów: [Pluginy](/pl/tools/plugin)
- Zgodność pakietów: [Pakiety Pluginów](/pl/plugins/bundles)
- Manifest Pluginu + schemat: [Manifest Pluginu](/pl/plugins/manifest)
- Utwardzanie zabezpieczeń: [Bezpieczeństwo](/pl/gateway/security)

## Polecenia

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Dołączone Pluginy są dostarczane z OpenClaw. Niektóre są domyślnie włączone (na przykład
dołączone providery modeli, dołączeni providery mowy oraz dołączony Plugin
przeglądarki); inne wymagają `plugins enable`.

Natywne Pluginy OpenClaw muszą zawierać `openclaw.plugin.json` z osadzonym schematem JSON
(`configSchema`, nawet jeśli jest pusty). Zgodne pakiety używają zamiast tego własnych manifestów pakietów.

`plugins list` pokazuje `Format: openclaw` albo `Format: bundle`. Dane wyjściowe verbose dla list/info
pokazują też podtyp pakietu (`codex`, `claude` albo `cursor`) oraz wykryte możliwości pakietu.

### Instalacja

```bash
openclaw plugins install <package>                      # najpierw ClawHub, potem npm
openclaw plugins install clawhub:<package>              # tylko ClawHub
openclaw plugins install <package> --force              # nadpisz istniejącą instalację
openclaw plugins install <package> --pin                # przypnij wersję
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # ścieżka lokalna
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (jawnie)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Nazwy pakietów bez prefiksu są najpierw sprawdzane w ClawHub, a potem w npm. Uwaga dotycząca bezpieczeństwa:
traktuj instalację Pluginów jak uruchamianie kodu. Preferuj przypięte wersje.

Jeśli sekcja `plugins` jest oparta na jednoplokowym `$include`, `plugins install/update/enable/disable/uninstall` zapisują zmiany do tego dołączonego pliku i pozostawiają `openclaw.json` bez zmian. Główne include, tablice include oraz include z sąsiednimi nadpisaniami kończą się bezpieczną odmową zamiast spłaszczania. Zobacz [Dołączenia konfiguracji](/pl/gateway/configuration), aby poznać obsługiwane kształty.

Jeśli konfiguracja jest nieprawidłowa, `plugins install` zwykle kończy się bezpieczną odmową i informuje, aby
najpierw uruchomić `openclaw doctor --fix`. Jedynym udokumentowanym wyjątkiem jest wąska
ścieżka odzyskiwania dla dołączonych Pluginów, dla Pluginów, które jawnie wybierają
`openclaw.install.allowInvalidConfigRecovery`.

`--force` ponownie używa istniejącego celu instalacji i nadpisuje już zainstalowany
Plugin albo pakiet hooków w miejscu. Użyj tego, gdy celowo reinstalujesz
ten sam identyfikator z nowej lokalnej ścieżki, archiwum, pakietu ClawHub albo artefaktu npm.
Do rutynowych aktualizacji już śledzonego Pluginu npm preferuj
`openclaw plugins update <id-or-npm-spec>`.

Jeśli uruchomisz `plugins install` dla identyfikatora Pluginu, który jest już zainstalowany, OpenClaw
zatrzyma się i wskaże `plugins update <id-or-npm-spec>` jako normalną ścieżkę aktualizacji,
albo `plugins install <package> --force`, gdy rzeczywiście chcesz nadpisać
bieżącą instalację z innego źródła.

`--pin` dotyczy tylko instalacji npm. Nie jest obsługiwane z `--marketplace`,
ponieważ instalacje z marketplace zapisują metadane źródła marketplace zamiast
specyfikacji npm.

`--dangerously-force-unsafe-install` to opcja awaryjna do fałszywych alarmów
wbudowanego skanera niebezpiecznego kodu. Pozwala kontynuować instalację nawet
gdy wbudowany skaner zgłasza ustalenia `critical`, ale **nie**
omija blokad polityki hooka Pluginu `before_install` i **nie** omija
błędów skanowania.

Ta flaga CLI dotyczy przepływów instalacji/aktualizacji Pluginów. Instalacje zależności umiejętności
obsługiwane przez Gateway używają odpowiadającego nadpisania żądania `dangerouslyForceUnsafeInstall`, podczas gdy `openclaw skills install` pozostaje osobnym przepływem
pobierania/instalacji umiejętności z ClawHub.

`plugins install` jest również powierzchnią instalacji dla pakietów hooków, które udostępniają
`openclaw.hooks` w `package.json`. Używaj `openclaw hooks` do filtrowanego
widoku hooków i włączania poszczególnych hooków, a nie do instalacji pakietów.

Specyfikacje npm są **tylko rejestrowe** (nazwa pakietu + opcjonalna **dokładna wersja** albo
**dist-tag**). Specyfikacje git/URL/file i zakresy semver są odrzucane. Instalacje zależności
są uruchamiane z `--ignore-scripts` dla bezpieczeństwa.

Specyfikacje bez prefiksu i `@latest` pozostają na stabilnej ścieżce. Jeśli npm rozwiąże
którekolwiek z nich do wersji prerelease, OpenClaw zatrzyma się i poprosi o jawne wyrażenie zgody za pomocą
tagu prerelease takiego jak `@beta`/`@rc` albo dokładnej wersji prerelease takiej jak
`@1.2.3-beta.4`.

Jeśli specyfikacja instalacji bez prefiksu pasuje do identyfikatora dołączonego Pluginu (na przykład `diffs`), OpenClaw
instaluje dołączony Plugin bezpośrednio. Aby zainstalować pakiet npm o tej samej
nazwie, użyj jawnej specyfikacji ze scopem (na przykład `@scope/diffs`).

Obsługiwane archiwa: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Obsługiwane są również instalacje z marketplace Claude.

Instalacje ClawHub używają jawnego lokalizatora `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw preferuje teraz również ClawHub dla bezpiecznych specyfikacji Pluginów npm bez prefiksu. Przechodzi
do npm tylko wtedy, gdy ClawHub nie ma tego pakietu albo wersji:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw pobiera archiwum pakietu z ClawHub, sprawdza reklamowaną
zgodność API Pluginu / minimalną zgodność Gateway, a następnie instaluje je zwykłą
ścieżką archiwum. Zarejestrowane instalacje zachowują metadane źródła ClawHub na potrzeby późniejszych
aktualizacji.

Użyj skrótu `plugin@marketplace`, gdy nazwa marketplace istnieje w lokalnej pamięci podręcznej rejestru Claude pod adresem `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Użyj `--marketplace`, gdy chcesz jawnie przekazać źródło marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Źródłami marketplace mogą być:

- nazwa znanego marketplace Claude z `~/.claude/plugins/known_marketplaces.json`
- lokalny katalog główny marketplace albo ścieżka `marketplace.json`
- skrót repozytorium GitHub taki jak `owner/repo`
- URL repozytorium GitHub taki jak `https://github.com/owner/repo`
- URL git

W przypadku zdalnych marketplace ładowanych z GitHub albo git wpisy Pluginów muszą pozostać
wewnątrz sklonowanego repozytorium marketplace. OpenClaw akceptuje źródła względnych ścieżek z
tego repozytorium i odrzuca HTTP(S), ścieżki bezwzględne, git, GitHub oraz inne źródła Pluginów niebędące ścieżkami z manifestów zdalnych.

W przypadku lokalnych ścieżek i archiwów OpenClaw automatycznie wykrywa:

- natywne Pluginy OpenClaw (`openclaw.plugin.json`)
- pakiety zgodne z Codex (`.codex-plugin/plugin.json`)
- pakiety zgodne z Claude (`.claude-plugin/plugin.json` albo domyślny układ komponentów Claude)
- pakiety zgodne z Cursor (`.cursor-plugin/plugin.json`)

Zgodne pakiety są instalowane do zwykłego katalogu głównego Pluginów i uczestniczą
w tym samym przepływie list/info/enable/disable. Obecnie obsługiwane są: Skills pakietów, command-skills Claude, domyślne ustawienia Claude `settings.json`, domyślne ustawienia Claude `.lsp.json` /
`lspServers` zadeklarowane w manifeście, command-skills Cursor oraz zgodne
katalogi hooków Codex; inne wykryte możliwości pakietów są
pokazywane w diagnostyce/info, ale nie są jeszcze podłączone do wykonania w czasie działania.

### Lista

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Użyj `--enabled`, aby pokazać tylko załadowane Pluginy. Użyj `--verbose`, aby przełączyć się z
widoku tabeli na wiersze szczegółów dla każdego Pluginu z metadanymi
źródła/pochodzenia/wersji/aktywacji. Użyj `--json` do odczytu maszynowego spisu oraz
diagnostyki rejestru.

`plugins list` uruchamia wykrywanie z bieżącego środowiska i konfiguracji CLI. Jest
przydatne do sprawdzania, czy Plugin jest włączony/możliwy do załadowania, ale nie jest to sonda
działającego już procesu Gateway w czasie rzeczywistym. Po zmianie kodu Pluginu,
włączenia, polityki hooków albo `plugins.load.paths` uruchom ponownie Gateway, który
obsługuje kanał, zanim zaczniesz oczekiwać uruchomienia nowego kodu `register(api)` lub hooków.
W przypadku wdrożeń zdalnych/kontenerowych upewnij się, że restartujesz faktyczny proces potomny
`openclaw gateway run`, a nie tylko proces opakowujący.

Do debugowania hooków w czasie działania:

- `openclaw plugins inspect <id> --json` pokazuje zarejestrowane hooki i diagnostykę
  z przebiegu inspekcji z załadowanym modułem.
- `openclaw gateway status --deep --require-rpc` potwierdza osiągalny Gateway,
  wskazówki dotyczące usługi/procesu, ścieżkę konfiguracji i kondycję RPC.
- Niedołączone hooki konwersacji (`llm_input`, `llm_output`, `agent_end`) wymagają
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Użyj `--link`, aby uniknąć kopiowania lokalnego katalogu (dodaje do `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` nie jest obsługiwane z `--link`, ponieważ instalacje linkowane ponownie używają
ścieżki źródłowej zamiast kopiować do zarządzanego celu instalacji.

Użyj `--pin` przy instalacjach npm, aby zapisać rozwiązaną dokładną specyfikację (`name@version`) w
`plugins.installs`, zachowując domyślne nieprzypięte zachowanie.

### Odinstalowanie

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` usuwa rekordy Pluginów z `plugins.entries`, `plugins.installs`,
listy dozwolonych Pluginów oraz wpisy linkowanych `plugins.load.paths`, gdy ma to zastosowanie.
W przypadku Pluginów aktywnej pamięci slot pamięci jest resetowany do `memory-core`.

Domyślnie odinstalowanie usuwa również katalog instalacji Pluginu w aktywnym
katalogu głównym Pluginów state-dir. Użyj
`--keep-files`, aby zachować pliki na dysku.

`--keep-config` jest obsługiwane jako przestarzały alias dla `--keep-files`.

### Aktualizacja

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Aktualizacje dotyczą śledzonych instalacji w `plugins.installs` oraz śledzonych instalacji pakietów hooków w `hooks.internal.installs`.

Gdy przekażesz identyfikator Pluginu, OpenClaw ponownie użyje zapisanej specyfikacji instalacji dla tego
Pluginu. Oznacza to, że wcześniej zapisane dist-tagi takie jak `@beta` i dokładnie przypięte
wersje będą nadal używane przy późniejszych uruchomieniach `update <id>`.

W przypadku instalacji npm możesz też przekazać jawną specyfikację pakietu npm z dist-tagiem
albo dokładną wersją. OpenClaw mapuje tę nazwę pakietu z powrotem na śledzony rekord Pluginu,
aktualizuje ten zainstalowany Plugin i zapisuje nową specyfikację npm do wykorzystania przy przyszłych
aktualizacjach opartych na identyfikatorze.

Przekazanie nazwy pakietu npm bez wersji lub tagu również mapuje z powrotem na
śledzony rekord Pluginu. Użyj tego, gdy Plugin był przypięty do dokładnej wersji i
chcesz przywrócić go do domyślnej linii wydań rejestru.

Przed aktywną aktualizacją npm OpenClaw sprawdza zainstalowaną wersję pakietu względem
metadanych rejestru npm. Jeśli zainstalowana wersja i tożsamość zapisanego artefaktu
już odpowiadają rozwiązanemu celowi, aktualizacja jest pomijana bez
pobierania, reinstalacji ani przepisywania `openclaw.json`.

Gdy istnieje zapisany hash integralności, a hash pobranego artefaktu ulegnie zmianie,
OpenClaw traktuje to jako dryf artefaktu npm. Interaktywne polecenie
`openclaw plugins update` wypisuje oczekiwane i rzeczywiste hashe oraz prosi
o potwierdzenie przed kontynuacją. Nieinteraktywne pomocnicze polecenia aktualizacji kończą się bezpieczną odmową,
chyba że wywołujący poda jawną politykę kontynuacji.

`--dangerously-force-unsafe-install` jest również dostępne dla `plugins update` jako
awaryjne nadpisanie dla fałszywych alarmów wbudowanego skanowania niebezpiecznego kodu podczas
aktualizacji Pluginów. Nadal nie omija blokad polityki Pluginu `before_install`
ani blokowania z powodu niepowodzenia skanowania i dotyczy wyłącznie aktualizacji Pluginów, a nie aktualizacji pakietów hooków.

### Inspekcja

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Dogłębna introspekcja pojedynczego Pluginu. Pokazuje tożsamość, stan ładowania, źródło,
zarejestrowane możliwości, hooki, narzędzia, polecenia, usługi, metody gateway,
trasy HTTP, flagi polityk, diagnostykę, metadane instalacji, możliwości pakietu
oraz wszelkie wykryte wsparcie dla serwerów MCP lub LSP.

Każdy Plugin jest klasyfikowany według tego, co faktycznie rejestruje w czasie działania:

- **plain-capability** — jeden typ możliwości (np. Plugin tylko z providerem)
- **hybrid-capability** — wiele typów możliwości (np. tekst + mowa + obrazy)
- **hook-only** — tylko hooki, bez możliwości ani powierzchni
- **non-capability** — narzędzia/polecenia/usługi, ale bez możliwości

Zobacz [Kształty Pluginów](/pl/plugins/architecture#plugin-shapes), aby dowiedzieć się więcej o modelu możliwości.

Flaga `--json` zwraca raport w formacie czytelnym maszynowo, odpowiedni do skryptów i
audytu.

`inspect --all` renderuje tabelę dla całej floty z kolumnami kształtu, rodzajów możliwości,
powiadomień o zgodności, możliwości pakietów i podsumowania hooków.

`info` jest aliasem dla `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` zgłasza błędy ładowania Pluginów, diagnostykę manifestu/wykrywania oraz
powiadomienia o zgodności. Gdy wszystko jest w porządku, wypisuje `No plugin issues
detected.`

W przypadku błędów kształtu modułu, takich jak brak eksportów `register`/`activate`, uruchom ponownie
z `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, aby dołączyć zwięzłe podsumowanie kształtu eksportów do
wyniku diagnostycznego.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Lista marketplace akceptuje lokalną ścieżkę marketplace, ścieżkę `marketplace.json`,
skrót GitHub taki jak `owner/repo`, URL repozytorium GitHub lub URL git. `--json`
wypisuje rozwiązaną etykietę źródła oraz sparsowany manifest marketplace i
wpisy Pluginów.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Tworzenie Pluginów](/pl/plugins/building-plugins)
- [Pluginy społeczności](/pl/plugins/community)
