---
read_when:
    - Chcesz zainstalować lub zarządzać Pluginami Gateway albo zgodnymi pakietami bundli
    - Chcesz debugować błędy ładowania Pluginów
summary: Dokumentacja CLI dla `openclaw plugins` (listowanie, instalacja, marketplace, odinstalowanie, włączanie/wyłączanie, doctor)
title: plugins
x-i18n:
    generated_at: "2026-04-23T09:59:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 469364823c0766f6534c5d7eee963877f98fe23ecfa45251696a34ef65d57599
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Zarządzaj Pluginami Gateway, pakietami hooków i zgodnymi bundlami.

Powiązane:

- System Pluginów: [Plugins](/pl/tools/plugin)
- Zgodność bundli: [Plugin bundles](/pl/plugins/bundles)
- Manifest Pluginu + schema: [Plugin manifest](/pl/plugins/manifest)
- Utwardzanie bezpieczeństwa: [Security](/pl/gateway/security)

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

Bundled Pluginy są dostarczane z OpenClaw. Niektóre są domyślnie włączone (na przykład
bundled dostawcy modeli, bundled dostawcy mowy oraz bundled Plugin
przeglądarki); inne wymagają `plugins enable`.

Natywne Pluginy OpenClaw muszą dostarczać `openclaw.plugin.json` z osadzonym JSON
Schema (`configSchema`, nawet jeśli jest puste). Zgodne bundle używają zamiast tego własnych
manifestów bundla.

`plugins list` pokazuje `Format: openclaw` lub `Format: bundle`. Szczegółowe wyjście list/info
pokazuje też podtyp bundla (`codex`, `claude` lub `cursor`) oraz wykryte możliwości
bundla.

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

Nieskwalifikowane nazwy pakietów są najpierw sprawdzane w ClawHub, a potem w npm. Uwaga bezpieczeństwa:
traktuj instalacje Pluginów jak uruchamianie kodu. Preferuj przypięte wersje.

Jeśli sekcja `plugins` jest oparta na jednoplikowym `$include`, `plugins install/update/enable/disable/uninstall` zapisują bezpośrednio do tego dołączonego pliku i pozostawiają `openclaw.json` bez zmian. Include w root, tablice include oraz include z sąsiednimi nadpisaniami kończą się trybem fail-closed zamiast spłaszczenia. Zobacz [Config includes](/pl/gateway/configuration), aby poznać obsługiwane kształty.

Jeśli konfiguracja jest nieprawidłowa, `plugins install` normalnie kończy się trybem fail-closed i informuje, aby
najpierw uruchomić `openclaw doctor --fix`. Jedynym udokumentowanym wyjątkiem jest wąska
ścieżka odzyskiwania dla bundled Pluginów, dla Pluginów, które jawnie włączają
`openclaw.install.allowInvalidConfigRecovery`.

`--force` ponownie używa istniejącego celu instalacji i nadpisuje już zainstalowany
Plugin lub pakiet hooków w miejscu. Używaj tego, gdy celowo reinstalujesz
ten sam identyfikator z nowej lokalnej ścieżki, archiwum, pakietu ClawHub lub artefaktu npm.
W przypadku rutynowych aktualizacji już śledzonego Pluginu npm preferuj
`openclaw plugins update <id-or-npm-spec>`.

Jeśli uruchomisz `plugins install` dla identyfikatora Pluginu, który jest już zainstalowany, OpenClaw
zatrzyma się i wskaże `plugins update <id-or-npm-spec>` dla zwykłej aktualizacji,
albo `plugins install <package> --force`, gdy rzeczywiście chcesz nadpisać
bieżącą instalację z innego źródła.

`--pin` dotyczy tylko instalacji npm. Nie jest obsługiwane z `--marketplace`,
ponieważ instalacje z marketplace zapisują metadane źródła marketplace zamiast
specyfikacji npm.

`--dangerously-force-unsafe-install` to opcja awaryjna dla fałszywych trafień
we wbudowanym skanerze niebezpiecznego kodu. Pozwala kontynuować instalację nawet
gdy wbudowany skaner zgłasza znaleziska `critical`, ale **nie**
omija blokad polityki hooka Pluginu `before_install` i **nie** omija
błędów skanowania.

Ta flaga CLI dotyczy przepływów instalacji/aktualizacji Pluginów. Instalacje zależności Skills
obsługiwane przez Gateway używają odpowiadającego im nadpisania żądania `dangerouslyForceUnsafeInstall`, natomiast `openclaw skills install` pozostaje osobnym przepływem
pobierania/instalacji Skills z ClawHub.

`plugins install` jest także powierzchnią instalacji dla pakietów hooków, które udostępniają
`openclaw.hooks` w `package.json`. Używaj `openclaw hooks` do filtrowanego
widoku hooków i włączania poszczególnych hooków, a nie do instalacji pakietów.

Specyfikacje npm są **tylko rejestrowe** (nazwa pakietu + opcjonalna **dokładna wersja** lub
**dist-tag**). Specyfikacje git/URL/file oraz zakresy semver są odrzucane. Instalacje
zależności działają z `--ignore-scripts` dla bezpieczeństwa.

Nieskwalifikowane specyfikacje i `@latest` pozostają na stabilnej ścieżce. Jeśli npm rozwiąże
którekolwiek z nich do wersji przedpremierowej, OpenClaw zatrzyma się i poprosi o jawne wyrażenie zgody
za pomocą tagu prerelease, takiego jak `@beta`/`@rc`, lub dokładnej wersji prerelease, takiej jak
`@1.2.3-beta.4`.

Jeśli nieskwalifikowana specyfikacja instalacji pasuje do identyfikatora bundled Pluginu (na przykład `diffs`), OpenClaw
instaluje bundled Plugin bezpośrednio. Aby zainstalować pakiet npm o tej samej
nazwie, użyj jawnej specyfikacji zakresowej (na przykład `@scope/diffs`).

Obsługiwane archiwa: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Obsługiwane są także instalacje z marketplace Claude.

Instalacje z ClawHub używają jawnego lokatora `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw preferuje teraz także ClawHub dla nieskwalifikowanych, bezpiecznych dla npm specyfikacji Pluginów. Wraca
do npm tylko wtedy, gdy ClawHub nie ma tego pakietu lub wersji:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw pobiera archiwum pakietu z ClawHub, sprawdza reklamowaną
zgodność API Pluginu / minimalną zgodność z Gateway, a następnie instaluje go przez zwykłą
ścieżkę archiwum. Zapisane instalacje zachowują metadane źródła ClawHub do późniejszych
aktualizacji.

Użyj skrótu `plugin@marketplace`, gdy nazwa marketplace istnieje w lokalnej pamięci podręcznej rejestru Claude pod `~/.claude/plugins/known_marketplaces.json`:

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
- lokalny root marketplace lub ścieżka `marketplace.json`
- skrót repozytorium GitHub, taki jak `owner/repo`
- URL repozytorium GitHub, taki jak `https://github.com/owner/repo`
- URL git

W przypadku zdalnych marketplace ładowanych z GitHub lub git wpisy Pluginów muszą pozostawać
wewnątrz sklonowanego repozytorium marketplace. OpenClaw akceptuje względne źródła ścieżek z
tego repozytorium i odrzuca HTTP(S), ścieżki bezwzględne, git, GitHub i inne źródła
Pluginów niebędące ścieżkami z manifestów zdalnych.

Dla lokalnych ścieżek i archiwów OpenClaw automatycznie wykrywa:

- natywne Pluginy OpenClaw (`openclaw.plugin.json`)
- bundle zgodne z Codex (`.codex-plugin/plugin.json`)
- bundle zgodne z Claude (`.claude-plugin/plugin.json` lub domyślny układ komponentów Claude)
- bundle zgodne z Cursor (`.cursor-plugin/plugin.json`)

Zgodne bundle są instalowane do zwykłego root Pluginów i uczestniczą w
tym samym przepływie list/info/enable/disable. Obecnie obsługiwane są: bundle Skills, Claude
command-skills, domyślne ustawienia Claude `settings.json`, Claude `.lsp.json` /
domyślne `lspServers` zadeklarowane w manifeście, Cursor command-skills oraz zgodne
katalogi hooków Codex; inne wykryte możliwości bundla są pokazywane w diagnostyce/info, ale nie są jeszcze podłączone do wykonania w runtime.

### Listowanie

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Użyj `--enabled`, aby pokazać tylko załadowane Pluginy. Użyj `--verbose`, aby przełączyć się z
widoku tabeli na szczegółowe linie per Plugin z metadanymi źródła/pochodzenia/wersji/aktywacji. Użyj `--json`, aby uzyskać odczytywalny maszynowo spis oraz diagnostykę rejestru.

Użyj `--link`, aby uniknąć kopiowania lokalnego katalogu (dodaje do `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` nie jest obsługiwane z `--link`, ponieważ instalacje linkowane ponownie używają
ścieżki źródłowej zamiast kopiować do zarządzanego celu instalacji.

Użyj `--pin` przy instalacjach npm, aby zapisać rozwiązaną dokładną specyfikację (`name@version`) w
`plugins.installs`, zachowując domyślne nieprzypięte działanie.

### Odinstalowanie

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` usuwa rekordy Pluginów z `plugins.entries`, `plugins.installs`,
listy dozwolonych Pluginów oraz wpisów linkowanych `plugins.load.paths`, gdy ma to zastosowanie.
Dla Pluginów Active Memory slot pamięci wraca do `memory-core`.

Domyślnie odinstalowanie usuwa także katalog instalacji Pluginu w aktywnym
root Pluginów katalogu stanu. Użyj
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

Aktualizacje są stosowane do śledzonych instalacji w `plugins.installs` oraz śledzonych instalacji
pakietów hooków w `hooks.internal.installs`.

Gdy przekażesz identyfikator Pluginu, OpenClaw ponownie używa zapisanej specyfikacji instalacji dla tego
Pluginu. Oznacza to, że wcześniej zapisane dist-tagi, takie jak `@beta`, oraz dokładnie przypięte
wersje nadal będą używane w późniejszych uruchomieniach `update <id>`.

Dla instalacji npm możesz także przekazać jawną specyfikację pakietu npm z dist-tagiem
lub dokładną wersją. OpenClaw rozwiązuje tę nazwę pakietu z powrotem do śledzonego rekordu Pluginu,
aktualizuje ten zainstalowany Plugin i zapisuje nową specyfikację npm do przyszłych
aktualizacji opartych na identyfikatorze.

Przekazanie nazwy pakietu npm bez wersji lub tagu także rozwiązuje się z powrotem do
śledzonego rekordu Pluginu. Użyj tego, gdy Plugin był przypięty do dokładnej wersji i
chcesz przenieść go z powrotem na domyślną linię wydań rejestru.

Przed aktywną aktualizacją npm OpenClaw sprawdza zainstalowaną wersję pakietu względem metadanych rejestru npm. Jeśli zainstalowana wersja i zapisana tożsamość artefaktu
już odpowiadają rozwiązanemu celowi, aktualizacja jest pomijana bez
pobierania, reinstalacji lub przepisywania `openclaw.json`.

Gdy istnieje zapisany hash integralności, a hash pobranego artefaktu się zmienia,
OpenClaw traktuje to jako drift artefaktu npm. Interaktywne polecenie
`openclaw plugins update` wypisuje oczekiwane i rzeczywiste hashe oraz prosi
o potwierdzenie przed kontynuacją. Nieinteraktywne pomocniki aktualizacji kończą się trybem fail-closed,
chyba że wywołujący poda jawną politykę kontynuacji.

`--dangerously-force-unsafe-install` jest także dostępne w `plugins update` jako
opcja awaryjna dla fałszywych trafień skanowania niebezpiecznego kodu podczas
aktualizacji Pluginów. Nadal nie omija blokad polityki `before_install` Pluginu
ani blokady przy błędach skanowania i dotyczy wyłącznie aktualizacji Pluginów,
a nie aktualizacji pakietów hooków.

### Inspekcja

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Głęboka introspekcja pojedynczego Pluginu. Pokazuje tożsamość, stan ładowania, źródło,
zarejestrowane możliwości, hooki, narzędzia, polecenia, usługi, metody Gateway,
trasy HTTP, flagi polityki, diagnostykę, metadane instalacji, możliwości bundla
oraz wszelkie wykryte wsparcie MCP lub serwera LSP.

Każdy Plugin jest klasyfikowany według tego, co faktycznie rejestruje w runtime:

- **plain-capability** — jeden typ możliwości (na przykład Plugin tylko z dostawcą)
- **hybrid-capability** — wiele typów możliwości (na przykład tekst + mowa + obrazy)
- **hook-only** — tylko hooki, bez możliwości ani powierzchni
- **non-capability** — narzędzia/polecenia/usługi, ale bez możliwości

Więcej o modelu możliwości znajdziesz w [Kształty Pluginów](/pl/plugins/architecture#plugin-shapes).

Flaga `--json` zwraca raport czytelny maszynowo, odpowiedni do skryptów i
audytu.

`inspect --all` renderuje tabelę dla całej floty z kolumnami kształtu, typów możliwości,
uwag o zgodności, możliwości bundla i podsumowania hooków.

`info` to alias `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` zgłasza błędy ładowania Pluginów, diagnostykę manifestu/wykrywania oraz
uwagi o zgodności. Gdy wszystko jest w porządku, wypisuje `No plugin issues
detected.`

W przypadku błędów kształtu modułu, takich jak brak eksportów `register`/`activate`, uruchom ponownie
z `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, aby uwzględnić zwarte podsumowanie kształtu eksportów w
wyniku diagnostycznym.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

`marketplace list` akceptuje lokalną ścieżkę marketplace, ścieżkę `marketplace.json`,
skrót GitHub typu `owner/repo`, URL repozytorium GitHub lub URL git. `--json`
wypisuje rozwiązaną etykietę źródła oraz sparsowany manifest marketplace i
wpisy Pluginów.
