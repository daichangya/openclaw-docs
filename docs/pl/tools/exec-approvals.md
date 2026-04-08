---
read_when:
    - Konfigurowanie zatwierdzeń exec lub list dozwolonych
    - Implementowanie UX zatwierdzeń exec w aplikacji macOS
    - Przeglądanie promptów wyjścia z sandboxa i ich konsekwencji
summary: Zatwierdzenia exec, listy dozwolonych i prompty wyjścia z sandboxa
title: Zatwierdzenia exec
x-i18n:
    generated_at: "2026-04-08T02:19:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6041929185bab051ad873cc4822288cb7d6f0470e19e7ae7a16b70f76dfc2cd9
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Zatwierdzenia exec

Zatwierdzenia exec to **zabezpieczenie aplikacji towarzyszącej / hosta węzła** pozwalające agentowi działającemu w sandboxie uruchamiać
polecenia na rzeczywistym hoście (`gateway` lub `node`). Potraktuj to jak blokadę bezpieczeństwa:
polecenia są dozwolone tylko wtedy, gdy polityka + lista dozwolonych + (opcjonalne) zatwierdzenie użytkownika są zgodne.
Zatwierdzenia exec są **dodatkiem** do polityki narzędzi i kontroli elevated (chyba że elevated jest ustawione na `full`, co pomija zatwierdzenia).
Efektywna polityka jest **bardziej rygorystyczną** z `tools.exec.*` i domyślnych ustawień zatwierdzeń; jeśli pole zatwierdzeń zostanie pominięte, używana jest wartość `tools.exec`.
Exec hosta używa również lokalnego stanu zatwierdzeń na tej maszynie. Lokalne dla hosta
`ask: "always"` w `~/.openclaw/exec-approvals.json` nadal wyświetla prompty, nawet jeśli
domyślne ustawienia sesji lub konfiguracji żądają `ask: "on-miss"`.
Użyj `openclaw approvals get`, `openclaw approvals get --gateway` lub
`openclaw approvals get --node <id|name|ip>`, aby sprawdzić żądaną politykę,
źródła polityki hosta i wynik efektywny.

Jeśli interfejs aplikacji towarzyszącej **nie jest dostępny**, każde żądanie wymagające promptu jest
rozstrzygane przez **ask fallback** (domyślnie: deny).

Natywni klienci zatwierdzeń w czacie mogą również udostępniać specyficzne dla kanału elementy interakcji w
wiadomości oczekującego zatwierdzenia. Na przykład Matrix może dodawać skróty reakcji do
promptu zatwierdzenia (`✅` pozwól raz, `❌` odrzuć i `♾️` pozwól zawsze, gdy dostępne),
jednocześnie pozostawiając polecenia `/approve ...` w wiadomości jako rozwiązanie zapasowe.

## Gdzie to ma zastosowanie

Zatwierdzenia exec są egzekwowane lokalnie na hoście wykonania:

- **host gateway** → proces `openclaw` na maszynie gateway
- **host node** → runner węzła (aplikacja towarzysząca macOS lub bezgłowy host węzła)

Uwaga dotycząca modelu zaufania:

- Wywołujący uwierzytelnieni przez Gateway są zaufanymi operatorami dla tego Gateway.
- Sparowane węzły rozszerzają tę zdolność zaufanego operatora na host node.
- Zatwierdzenia exec zmniejszają ryzyko przypadkowego wykonania, ale nie są granicą uwierzytelniania per użytkownik.
- Zatwierdzone uruchomienia na hoście node wiążą kanoniczny kontekst wykonania: kanoniczne cwd, dokładne argv, powiązanie env
  gdy występuje oraz przypiętą ścieżkę do pliku wykonywalnego, gdy ma to zastosowanie.
- Dla skryptów powłoki i bezpośrednich wywołań plików interpreterów/runtime OpenClaw również próbuje powiązać
  jeden konkretny lokalny operand pliku. Jeśli ten powiązany plik zmieni się po zatwierdzeniu, ale przed wykonaniem,
  uruchomienie zostanie odrzucone zamiast wykonać zmienioną treść.
- To powiązanie pliku jest celowo realizowane według zasady best-effort, a nie jako pełny model semantyczny każdego
  interpretera/runtime i ścieżki ładowania. Jeśli tryb zatwierdzania nie potrafi zidentyfikować dokładnie jednego konkretnego lokalnego
  pliku do powiązania, odmawia wygenerowania uruchomienia opartego na zatwierdzeniu zamiast udawać pełne pokrycie.

Podział na macOS:

- **usługa hosta node** przekazuje `system.run` do **aplikacji macOS** przez lokalne IPC.
- **aplikacja macOS** egzekwuje zatwierdzenia i wykonuje polecenie w kontekście UI.

## Ustawienia i przechowywanie

Zatwierdzenia są przechowywane w lokalnym pliku JSON na hoście wykonania:

`~/.openclaw/exec-approvals.json`

Przykładowy schemat:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Tryb „YOLO” bez zatwierdzeń

Jeśli chcesz, aby exec hosta działał bez promptów zatwierdzania, musisz otworzyć **obie** warstwy polityki:

- żądaną politykę exec w konfiguracji OpenClaw (`tools.exec.*`)
- lokalną dla hosta politykę zatwierdzeń w `~/.openclaw/exec-approvals.json`

Jest to teraz domyślne zachowanie hosta, chyba że jawnie je zaostrzysz:

- `tools.exec.security`: `full` na `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Ważne rozróżnienie:

- `tools.exec.host=auto` wybiera miejsce uruchomienia exec: sandbox, jeśli dostępny, w przeciwnym razie gateway.
- YOLO wybiera sposób zatwierdzania exec hosta: `security=full` plus `ask=off`.
- W trybie YOLO OpenClaw nie dodaje osobnej heurystycznej bramki zatwierdzeń dla maskowania poleceń ponad skonfigurowaną politykę exec hosta.
- `auto` nie sprawia, że routing do gateway staje się darmowym obejściem z sesji działającej w sandboxie. Żądanie per wywołanie `host=node` jest dozwolone z `auto`, a `host=gateway` jest dozwolone z `auto` tylko wtedy, gdy nie jest aktywne środowisko sandbox. Jeśli chcesz stabilnej domyślnej wartości innej niż auto, ustaw `tools.exec.host` lub użyj jawnie `/exec host=...`.

Jeśli chcesz bardziej konserwatywnej konfiguracji, zaostrz z powrotem dowolną warstwę do `allowlist` / `on-miss`
lub `deny`.

Trwała konfiguracja hosta gateway „nigdy nie pytaj”:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Następnie ustaw plik zatwierdzeń hosta zgodnie z tym:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Dla hosta node zastosuj zamiast tego ten sam plik zatwierdzeń na tym węźle:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Skrót tylko dla sesji:

- `/exec security=full ask=off` zmienia tylko bieżącą sesję.
- `/elevated full` to skrót awaryjny, który również pomija zatwierdzenia exec dla tej sesji.

Jeśli plik zatwierdzeń hosta pozostaje bardziej rygorystyczny niż konfiguracja, nadal wygrywa bardziej rygorystyczna polityka hosta.

## Przełączniki polityki

### Security (`exec.security`)

- **deny**: zablokuj wszystkie żądania exec hosta.
- **allowlist**: zezwalaj tylko na polecenia z listy dozwolonych.
- **full**: zezwalaj na wszystko (odpowiednik elevated).

### Ask (`exec.ask`)

- **off**: nigdy nie wyświetlaj promptu.
- **on-miss**: wyświetl prompt tylko wtedy, gdy lista dozwolonych nie pasuje.
- **always**: wyświetlaj prompt dla każdego polecenia.
- trwałe zaufanie `allow-always` nie tłumi promptów, gdy efektywny tryb ask to `always`

### Ask fallback (`askFallback`)

Jeśli prompt jest wymagany, ale żaden UI nie jest osiągalny, fallback decyduje:

- **deny**: blokuj.
- **allowlist**: zezwalaj tylko wtedy, gdy lista dozwolonych pasuje.
- **full**: zezwalaj.

### Wzmocnienie eval inline dla interpreterów (`tools.exec.strictInlineEval`)

Gdy `tools.exec.strictInlineEval=true`, OpenClaw traktuje formy eval kodu inline jako wymagające zatwierdzenia, nawet jeśli sam plik wykonywalny interpretera znajduje się na liście dozwolonych.

Przykłady:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

To obrona warstwowa dla loaderów interpreterów, które nie mapują się czysto do jednego stabilnego operandu pliku. W trybie ścisłym:

- te polecenia nadal wymagają jawnego zatwierdzenia;
- `allow-always` nie zapisuje automatycznie dla nich nowych wpisów listy dozwolonych.

## Allowlist (per agent)

Listy dozwolonych są **per agent**. Jeśli istnieje wielu agentów, przełącz, którego agenta
edytujesz w aplikacji macOS. Wzorce są **niezależnymi od wielkości liter dopasowaniami glob**.
Wzorce powinny rozwiązywać się do **ścieżek plików wykonywalnych** (wpisy zawierające tylko basename są ignorowane).
Starsze wpisy `agents.default` są migrowane do `agents.main` podczas ładowania.
Łańcuchy powłoki, takie jak `echo ok && pwd`, nadal wymagają, aby każdy segment najwyższego poziomu spełniał reguły listy dozwolonych.

Przykłady:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Każdy wpis listy dozwolonych śledzi:

- **id** stabilny UUID używany jako tożsamość w UI (opcjonalnie)
- **last used** znacznik czasu
- **last used command**
- **last resolved path**

## Auto-allow skill CLIs

Gdy **Auto-allow skill CLIs** jest włączone, pliki wykonywalne wskazywane przez znane Skills
są traktowane jako wpisy listy dozwolonych na węzłach (węzeł macOS lub bezgłowy host węzła). Używa to
`skills.bins` przez Gateway RPC do pobrania listy plików binarnych skill. Wyłącz to, jeśli chcesz rygorystycznych ręcznych list dozwolonych.

Ważne uwagi dotyczące zaufania:

- To **niejawna wygodna lista dozwolonych**, oddzielna od ręcznych wpisów listy dozwolonych opartych na ścieżkach.
- Jest przeznaczona dla zaufanych środowisk operatora, w których Gateway i node znajdują się w tej samej granicy zaufania.
- Jeśli potrzebujesz rygorystycznego jawnego zaufania, pozostaw `autoAllowSkills: false` i używaj tylko ręcznych wpisów listy dozwolonych opartych na ścieżkach.

## Safe bins (tylko stdin)

`tools.exec.safeBins` definiuje małą listę plików binarnych **tylko stdin** (na przykład `cut`),
które mogą działać w trybie allowlist **bez** jawnych wpisów listy dozwolonych. Safe bins odrzucają
pozycyjne argumenty plików i tokeny podobne do ścieżek, więc mogą działać tylko na przychodzącym strumieniu.
Traktuj to jako wąską szybką ścieżkę dla filtrów strumieni, a nie ogólną listę zaufania.
**Nie** dodawaj interpreterów ani plików binarnych runtime (na przykład `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) do `safeBins`.
Jeśli polecenie potrafi wykonywać eval kodu, uruchamiać podpolecenia lub z założenia czytać pliki, preferuj jawne wpisy listy dozwolonych i pozostaw włączone prompty zatwierdzeń.
Niestandardowe safe bins muszą definiować jawny profil w `tools.exec.safeBinProfiles.<bin>`.
Walidacja jest deterministyczna wyłącznie na podstawie kształtu argv (bez sprawdzania istnienia systemu plików hosta), co
zapobiega zachowaniu typu oracle istnienia plików wynikającemu z różnic allow/deny.
Opcje zorientowane na pliki są odrzucane dla domyślnych safe bins (na przykład `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
Safe bins egzekwują również jawne polityki flag per plik binarny dla opcji, które łamią zachowanie wyłącznie stdin
(na przykład `sort -o/--output/--compress-program` i rekursywne flagi grep).
Długie opcje są walidowane w trybie fail-closed w trybie safe-bin: nieznane flagi i niejednoznaczne
skróty są odrzucane.
Odrzucane flagi według profilu safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins wymuszają również traktowanie tokenów argv jako **dosłownego tekstu** podczas wykonywania (bez globbingu
i bez rozwijania `$VARS`) dla segmentów tylko stdin, więc wzorce takie jak `*` lub `$HOME/...` nie mogą zostać
użyte do przemycenia odczytu plików.
Safe bins muszą również rozwiązywać się z zaufanych katalogów plików binarnych (domyślne katalogi systemowe plus opcjonalne
`tools.exec.safeBinTrustedDirs`). Wpisy `PATH` nigdy nie są automatycznie zaufane.
Domyślne zaufane katalogi safe-bin są celowo minimalne: `/bin`, `/usr/bin`.
Jeśli Twój plik wykonywalny safe-bin znajduje się w ścieżkach menedżera pakietów/użytkownika (na przykład
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), dodaj je jawnie
do `tools.exec.safeBinTrustedDirs`.
Łączenie poleceń powłoki i przekierowania nie są automatycznie dozwolone w trybie allowlist.

Łączenie poleceń powłoki (`&&`, `||`, `;`) jest dozwolone, gdy każdy segment najwyższego poziomu spełnia zasady listy dozwolonych
(w tym safe bins lub auto-allow skill). Przekierowania nadal nie są obsługiwane w trybie allowlist.
Podstawianie poleceń (`$()` / backticks) jest odrzucane podczas parsowania allowlist, również wewnątrz
cudzysłowów; użyj pojedynczych cudzysłowów, jeśli potrzebujesz dosłownego tekstu `$()`.
W zatwierdzeniach aplikacji towarzyszącej macOS surowy tekst powłoki zawierający składnię sterowania lub rozwijania powłoki
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) jest traktowany jako brak dopasowania listy dozwolonych, chyba że
sam plik binarny powłoki znajduje się na liście dozwolonych.
Dla wrapperów powłoki (`bash|sh|zsh ... -c/-lc`) nadpisania env ograniczone do zakresu żądania są redukowane do
małej jawnej listy dozwolonych (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Dla decyzji allow-always w trybie allowlist znane wrappery dispatch
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) utrwalają ścieżki wewnętrznych plików wykonywalnych zamiast ścieżek wrapperów. Multipleksery powłoki (`busybox`, `toybox`) są również odpakowywane dla apletów powłoki (`sh`, `ash`,
itd.), tak aby utrwalane były ścieżki wewnętrznych plików wykonywalnych zamiast plików binarnych multipleksera. Jeśli wrapper lub
multiplekser nie może zostać bezpiecznie odpakowany, żaden wpis listy dozwolonych nie jest utrwalany automatycznie.
Jeśli dodajesz do listy dozwolonych interpretery takie jak `python3` lub `node`, preferuj `tools.exec.strictInlineEval=true`, aby eval inline nadal wymagał jawnego zatwierdzenia. W trybie ścisłym `allow-always` może nadal utrwalać niegroźne wywołania interpreterów/skryptów, ale nośniki eval inline nie są utrwalane automatycznie.

Domyślne safe bins:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` i `sort` nie znajdują się na liście domyślnej. Jeśli jawnie je włączysz, zachowaj jawne wpisy listy dozwolonych dla
ich przepływów pracy innych niż stdin.
Dla `grep` w trybie safe-bin podawaj wzorzec za pomocą `-e`/`--regexp`; forma wzorca pozycyjnego jest
odrzucana, aby operandy plików nie mogły zostać przemycone jako niejednoznaczne argumenty pozycyjne.

### Safe bins versus allowlist

| Temat            | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                            |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Cel              | Automatyczne zezwalanie na wąskie filtry stdin         | Jawne zaufanie określonym plikom wykonywalnym                |
| Typ dopasowania  | Nazwa pliku wykonywalnego + polityka argv safe-bin     | Wzorzec glob rozwiązanego do ścieżki pliku wykonywalnego     |
| Zakres argumentów| Ograniczony profilem safe-bin i regułami tokenów dosłownych | Tylko dopasowanie ścieżki; odpowiedzialność za argumenty spoczywa poza tym na Tobie |
| Typowe przykłady | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, niestandardowe CLI        |
| Najlepsze użycie | Niskiego ryzyka transformacje tekstu w pipeline’ach    | Każde narzędzie o szerszym zachowaniu lub skutkach ubocznych |

Lokalizacja konfiguracji:

- `safeBins` pochodzi z konfiguracji (`tools.exec.safeBins` lub per agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` pochodzi z konfiguracji (`tools.exec.safeBinTrustedDirs` lub per agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` pochodzi z konfiguracji (`tools.exec.safeBinProfiles` lub per agent `agents.list[].tools.exec.safeBinProfiles`). Klucze profili per agent nadpisują klucze globalne.
- wpisy listy dozwolonych znajdują się w lokalnym dla hosta `~/.openclaw/exec-approvals.json` pod `agents.<id>.allowlist` (lub przez Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` ostrzega `tools.exec.safe_bins_interpreter_unprofiled`, gdy interpretery/pliki runtime pojawiają się w `safeBins` bez jawnych profili.
- `openclaw doctor --fix` może wygenerować brakujące wpisy niestandardowych `safeBinProfiles.<bin>` jako `{}` (następnie je przejrzyj i zaostrz). Pliki binarne interpreterów/runtime nie są generowane automatycznie.

Przykład niestandardowego profilu:
__OC_I18N_900004__
Jeśli jawnie dodasz `jq` do `safeBins`, OpenClaw nadal odrzuca builtin `env` w trybie safe-bin,
więc `jq -n env` nie może zrzucić środowiska procesu hosta bez jawnej ścieżki z listy dozwolonych
lub promptu zatwierdzenia.

## Edycja w Control UI

Użyj karty **Control UI → Nodes → Exec approvals**, aby edytować wartości domyślne, nadpisania
per agent i listy dozwolonych. Wybierz zakres (Defaults lub agent), dostosuj politykę,
dodaj/usuń wzorce listy dozwolonych, a następnie kliknij **Save**. UI pokazuje metadane **last used**
dla każdego wzorca, aby ułatwić utrzymanie porządku na liście.

Selektor celu wybiera **Gateway** (lokalne zatwierdzenia) lub **Node**. Węzły
muszą ogłaszać `system.execApprovals.get/set` (aplikacja macOS lub bezgłowy host węzła).
Jeśli węzeł nie ogłasza jeszcze zatwierdzeń exec, edytuj bezpośrednio jego lokalny
`~/.openclaw/exec-approvals.json`.

CLI: `openclaw approvals` obsługuje edycję gateway lub node (zobacz [CLI zatwierdzeń](/cli/approvals)).

## Przepływ zatwierdzania

Gdy prompt jest wymagany, gateway rozgłasza `exec.approval.requested` do klientów operatora.
Control UI i aplikacja macOS rozwiązują to przez `exec.approval.resolve`, a następnie gateway przekazuje
zatwierdzone żądanie do hosta node.

Dla `host=node` żądania zatwierdzeń zawierają kanoniczny payload `systemRunPlan`. Gateway używa
tego planu jako autorytatywnego kontekstu polecenia/cwd/sesji podczas przekazywania zatwierdzonych żądań `system.run`.

To ma znaczenie przy opóźnieniach asynchronicznego zatwierdzania:

- ścieżka node exec przygotowuje z góry jeden kanoniczny plan
- rekord zatwierdzenia przechowuje ten plan i jego metadane powiązania
- po zatwierdzeniu końcowe przekazane wywołanie `system.run` używa ponownie zapisanego planu
  zamiast ufać późniejszym zmianom wywołującego
- jeśli wywołujący zmieni `command`, `rawCommand`, `cwd`, `agentId` lub
  `sessionKey` po utworzeniu żądania zatwierdzenia, gateway odrzuci
  przekazane uruchomienie jako niedopasowanie zatwierdzenia

## Polecenia interpreterów/runtime

Uruchomienia interpreterów/runtime oparte na zatwierdzeniach są celowo konserwatywne:

- Dokładny kontekst argv/cwd/env jest zawsze wiązany.
- Formy bezpośrednich skryptów powłoki i bezpośrednich plików runtime są według zasady best-effort wiązane z jednym konkretnym snapshotem lokalnego
  pliku.
- Typowe formy wrapperów menedżerów pakietów, które nadal rozwiązują się do jednego bezpośredniego lokalnego pliku (na przykład
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`), są odpakowywane przed powiązaniem.
- Jeśli OpenClaw nie potrafi zidentyfikować dokładnie jednego konkretnego lokalnego pliku dla polecenia interpretera/runtime
  (na przykład skrypty pakietów, formy eval, łańcuchy loaderów specyficzne dla runtime lub niejednoznaczne formy
  wieloplikowe), wykonanie oparte na zatwierdzeniu jest odrzucane zamiast deklarować pokrycie semantyczne, którego
  faktycznie nie ma.
- Dla takich przepływów pracy preferuj sandboxing, oddzielną granicę hosta lub jawny zaufany
  przepływ allowlist/full, w którym operator akceptuje szerszą semantykę runtime.

Gdy zatwierdzenia są wymagane, narzędzie exec natychmiast zwraca identyfikator zatwierdzenia. Użyj tego identyfikatora, aby
powiązać późniejsze zdarzenia systemowe (`Exec finished` / `Exec denied`). Jeśli żadna decyzja nie nadejdzie przed upływem
limitu czasu, żądanie jest traktowane jako timeout zatwierdzenia i prezentowane jako powód odmowy.

### Zachowanie dostarczania follow-up

Po zakończeniu zatwierdzonego asynchronicznego exec OpenClaw wysyła turn `agent` follow-up do tej samej sesji.

- Jeśli istnieje prawidłowy zewnętrzny cel dostarczenia (kanał dostarczalny plus cel `to`), dostarczenie follow-up używa tego kanału.
- W przepływach wyłącznie webchat lub sesji wewnętrznych bez celu zewnętrznego dostarczenie follow-up pozostaje tylko w sesji (`deliver: false`).
- Jeśli wywołujący jawnie żąda rygorystycznego zewnętrznego dostarczenia, ale nie ma możliwego do rozwiązania zewnętrznego kanału, żądanie kończy się błędem `INVALID_REQUEST`.
- Jeśli włączono `bestEffortDeliver` i nie można rozwiązać zewnętrznego kanału, dostarczenie jest degradowane do trybu tylko sesyjnego zamiast zakończyć się błędem.

Okno dialogowe potwierdzenia zawiera:

- polecenie + argumenty
- cwd
- identyfikator agenta
- rozwiązaną ścieżkę pliku wykonywalnego
- metadane hosta + polityki

Akcje:

- **Allow once** → uruchom teraz
- **Always allow** → dodaj do listy dozwolonych + uruchom
- **Deny** → zablokuj

## Przekazywanie zatwierdzeń do kanałów czatu

Możesz przekazywać prompty zatwierdzeń exec do dowolnego kanału czatu (w tym kanałów pluginów) i zatwierdzać
je za pomocą `/approve`. Używa to zwykłego pipeline dostarczania wychodzącego.

Konfiguracja:
__OC_I18N_900005__
Odpowiedź w czacie:
__OC_I18N_900006__
Polecenie `/approve` obsługuje zarówno zatwierdzenia exec, jak i zatwierdzenia pluginów. Jeśli identyfikator nie pasuje do oczekującego zatwierdzenia exec, automatycznie sprawdza zatwierdzenia pluginów.

### Przekazywanie zatwierdzeń pluginów

Przekazywanie zatwierdzeń pluginów używa tego samego pipeline dostarczania co zatwierdzenia exec, ale ma własną
niezależną konfigurację w `approvals.plugin`. Włączenie lub wyłączenie jednej z nich nie wpływa na drugą.
__OC_I18N_900007__
Kształt konfiguracji jest identyczny jak `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` i `targets` działają tak samo.

Kanały obsługujące współdzielone odpowiedzi interaktywne renderują te same przyciski zatwierdzeń zarówno dla zatwierdzeń exec, jak i
pluginów. Kanały bez współdzielonego interaktywnego UI przechodzą na zwykły tekst z instrukcjami `/approve`.

### Zatwierdzenia w tym samym czacie na dowolnym kanale

Gdy żądanie zatwierdzenia exec lub pluginu pochodzi z dostarczalnej powierzchni czatu, ten sam czat
może teraz domyślnie zatwierdzić je przez `/approve`. Dotyczy to kanałów takich jak Slack, Matrix i
Microsoft Teams, oprócz istniejących już przepływów Web UI i terminal UI.

Ta współdzielona ścieżka polecenia tekstowego używa zwykłego modelu uwierzytelniania kanału dla tej rozmowy. Jeśli
czat źródłowy może już wysyłać polecenia i otrzymywać odpowiedzi, żądania zatwierdzeń nie potrzebują już
oddzielnego natywnego adaptera dostarczania tylko po to, by pozostać oczekujące.

Discord i Telegram również obsługują `/approve` w tym samym czacie, ale te kanały nadal używają swoich
rozwiązanych list zatwierdzających do autoryzacji, nawet gdy natywne dostarczanie zatwierdzeń jest wyłączone.

Dla Telegram i innych natywnych klientów zatwierdzeń, które wywołują Gateway bezpośrednio,
ten fallback jest celowo ograniczony do błędów typu „zatwierdzenie nie znalezione”. Rzeczywista
odmowa/błąd zatwierdzenia exec nie wykonuje po cichu ponownej próby jako zatwierdzenie pluginu.

### Natywne dostarczanie zatwierdzeń

Niektóre kanały mogą także działać jako natywni klienci zatwierdzeń. Natywni klienci dodają DM zatwierdzających, fanout czatu źródłowego
oraz specyficzny dla kanału interaktywny UX zatwierdzeń ponad współdzielony przepływ `/approve`
w tym samym czacie.

Gdy natywne karty/przyciski zatwierdzeń są dostępne, ten natywny UI jest główną
ścieżką skierowaną do agenta. Agent nie powinien również powielać zwykłego polecenia czatu
`/approve`, chyba że wynik narzędzia mówi, że zatwierdzenia w czacie są niedostępne albo
ręczne zatwierdzenie jest jedyną pozostałą ścieżką.

Model ogólny:

- polityka hosta exec nadal decyduje, czy zatwierdzenie exec jest wymagane
- `approvals.exec` kontroluje przekazywanie promptów zatwierdzeń do innych miejsc docelowych czatu
- `channels.<channel>.execApprovals` kontroluje, czy dany kanał działa jako natywny klient zatwierdzeń

Natywni klienci zatwierdzeń automatycznie włączają dostarczanie najpierw do DM, gdy wszystkie poniższe warunki są spełnione:

- kanał obsługuje natywne dostarczanie zatwierdzeń
- zatwierdzający mogą zostać rozwiązani z jawnych `execApprovals.approvers` lub udokumentowanych źródeł fallback dla
  tego kanału
- `channels.<channel>.execApprovals.enabled` jest nieustawione lub ma wartość `"auto"`

Ustaw `enabled: false`, aby jawnie wyłączyć natywnego klienta zatwierdzeń. Ustaw `enabled: true`, aby wymusić
jego włączenie, gdy zatwierdzający się rozwiązują. Publiczne dostarczanie do czatu źródłowego pozostaje jawne przez
`channels.<channel>.execApprovals.target`.

FAQ: [Dlaczego istnieją dwie konfiguracje zatwierdzeń exec dla zatwierdzeń w czacie?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Ci natywni klienci zatwierdzeń dodają routing DM i opcjonalny fanout do kanału ponad współdzielony
przepływ `/approve` w tym samym czacie oraz współdzielone przyciski zatwierdzeń.

Współdzielone zachowanie:

- Slack, Matrix, Microsoft Teams i podobne dostarczalne czaty używają zwykłego modelu uwierzytelniania kanału
  dla `/approve` w tym samym czacie
- gdy natywny klient zatwierdzeń włącza się automatycznie, domyślnym celem natywnego dostarczania są DM zatwierdzających
- w przypadku Discord i Telegram tylko rozwiązani zatwierdzający mogą zatwierdzać lub odrzucać
- zatwierdzający Discord mogą być jawni (`execApprovals.approvers`) lub wywnioskowani z `commands.ownerAllowFrom`
- zatwierdzający Telegram mogą być jawni (`execApprovals.approvers`) lub wywnioskowani z istniejącej konfiguracji właściciela (`allowFrom`, plus `defaultTo` dla wiadomości bezpośrednich, gdy jest obsługiwane)
- zatwierdzający Slack mogą być jawni (`execApprovals.approvers`) lub wywnioskowani z `commands.ownerAllowFrom`
- natywne przyciski Slack zachowują rodzaj identyfikatora zatwierdzenia, więc identyfikatory `plugin:` mogą rozwiązywać zatwierdzenia pluginów
  bez drugiej lokalnej warstwy fallback w Slack
- natywny routing DM/kanału Matrix i skróty reakcji obsługują zarówno zatwierdzenia exec, jak i pluginów;
  autoryzacja pluginów nadal pochodzi z `channels.matrix.dm.allowFrom`
- osoba żądająca nie musi być zatwierdzającym
- czat źródłowy może zatwierdzać bezpośrednio przez `/approve`, gdy dany czat już obsługuje polecenia i odpowiedzi
- natywne przyciski zatwierdzeń Discord routują według rodzaju identyfikatora zatwierdzenia: identyfikatory `plugin:` trafiają
  bezpośrednio do zatwierdzeń pluginów, wszystko inne trafia do zatwierdzeń exec
- natywne przyciski zatwierdzeń Telegram stosują ten sam ograniczony fallback exec→plugin co `/approve`
- gdy natywny `target` włącza dostarczanie do czatu źródłowego, prompty zatwierdzeń zawierają tekst polecenia
- oczekujące zatwierdzenia exec domyślnie wygasają po 30 minutach
- jeśli żaden interfejs operatora ani skonfigurowany klient zatwierdzeń nie może przyjąć żądania, prompt przechodzi do `askFallback`

Telegram domyślnie używa DM zatwierdzających (`target: "dm"`). Możesz przełączyć na `channel` lub `both`, gdy
chcesz, aby prompty zatwierdzeń pojawiały się również w źródłowym czacie/temacie Telegram. Dla tematów forum Telegram
OpenClaw zachowuje temat dla promptu zatwierdzenia i follow-up po zatwierdzeniu.

Zobacz:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Przepływ IPC macOS
__OC_I18N_900008__
Uwagi dotyczące bezpieczeństwa:

- Tryb gniazda Unix `0600`, token przechowywany w `exec-approvals.json`.
- Sprawdzenie peera z tym samym UID.
- Challenge/response (nonce + token HMAC + hash żądania) + krótki TTL.

## Zdarzenia systemowe

Cykl życia exec jest ujawniany jako komunikaty systemowe:

- `Exec running` (tylko jeśli polecenie przekracza próg powiadomienia o uruchomieniu)
- `Exec finished`
- `Exec denied`

Są one publikowane do sesji agenta po zgłoszeniu zdarzenia przez węzeł.
Zatwierdzenia exec na hoście gateway emitują ten sam cykl życia zdarzeń, gdy polecenie się kończy (oraz opcjonalnie, gdy działa dłużej niż próg).
Exec objęte zatwierdzeniem używają ponownie identyfikatora zatwierdzenia jako `runId` w tych komunikatach, aby ułatwić korelację.

## Zachowanie po odrzuceniu zatwierdzenia

Gdy asynchroniczne zatwierdzenie exec zostanie odrzucone, OpenClaw uniemożliwia agentowi ponowne użycie
wyniku z jakiegokolwiek wcześniejszego uruchomienia tego samego polecenia w sesji. Powód odrzucenia
jest przekazywany z jawną wskazówką, że nie ma dostępnych danych wyjściowych polecenia, co zatrzymuje
agenta przed twierdzeniem, że istnieją nowe dane wyjściowe, lub przed powtarzaniem odrzuconego polecenia z
nieaktualnymi wynikami z wcześniejszego udanego uruchomienia.

## Konsekwencje

- **full** daje szerokie uprawnienia; gdy to możliwe, preferuj listy dozwolonych.
- **ask** pozwala Ci zachować kontrolę, jednocześnie umożliwiając szybkie zatwierdzenia.
- Listy dozwolonych per agent zapobiegają przenikaniu zatwierdzeń jednego agenta do innych.
- Zatwierdzenia mają zastosowanie tylko do żądań exec hosta od **autoryzowanych nadawców**. Nieautoryzowani nadawcy nie mogą wydawać `/exec`.
- `/exec security=full` to wygodna opcja na poziomie sesji dla autoryzowanych operatorów i z założenia pomija zatwierdzenia.
  Aby twardo zablokować exec hosta, ustaw security zatwierdzeń na `deny` lub zablokuj narzędzie `exec` przez politykę narzędzi.

Powiązane:

- [Narzędzie exec](/pl/tools/exec)
- [Tryb elevated](/pl/tools/elevated)
- [Skills](/pl/tools/skills)

## Powiązane

- [Exec](/pl/tools/exec) — narzędzie do wykonywania poleceń powłoki
- [Sandboxing](/pl/gateway/sandboxing) — tryby sandbox i dostęp do obszaru roboczego
- [Bezpieczeństwo](/pl/gateway/security) — model bezpieczeństwa i utwardzanie
- [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) — kiedy używać każdego z nich
