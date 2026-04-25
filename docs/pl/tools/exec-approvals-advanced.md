---
read_when:
    - Konfigurowanie bezpiecznych plików binarnych lub własnych profili safe-bin
    - Przekazywanie zatwierdzeń do Slack/Discord/Telegram lub innych kanałów czatu
    - Implementowanie natywnego klienta zatwierdzeń dla kanału
summary: 'Zaawansowane zatwierdzenia exec: bezpieczne pliki binarne, powiązanie interpretera, przekazywanie zatwierdzeń, natywne dostarczanie'
title: Zatwierdzenia exec — zaawansowane
x-i18n:
    generated_at: "2026-04-25T13:59:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5fab4a65d2d14f0d15cbe750d718b2a4e8f781a218debdb24b41be570a22d87
    source_path: tools/exec-approvals-advanced.md
    workflow: 15
---

Zaawansowane tematy dotyczące zatwierdzeń exec: szybka ścieżka `safeBins`, powiązanie interpretera/runtime
oraz przekazywanie zatwierdzeń do kanałów czatu (w tym natywne dostarczanie).
Informacje o podstawowej polityce i przepływie zatwierdzania znajdziesz w [Zatwierdzenia exec](/pl/tools/exec-approvals).

## Safe bins (tylko stdin)

`tools.exec.safeBins` definiuje małą listę plików binarnych **tylko dla stdin** (na
przykład `cut`), które mogą działać w trybie allowlist **bez** jawnych wpisów
allowlisty. Safe bins odrzucają pozycyjne argumenty plików i tokeny podobne do ścieżek, więc
mogą działać wyłącznie na przychodzącym strumieniu. Traktuj to jako wąską szybką ścieżkę dla
filtrów strumieniowych, a nie ogólną listę zaufania.

<Warning>
**Nie** dodawaj interpreterów ani plików binarnych runtime (na przykład `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) do `safeBins`. Jeśli polecenie potrafi wykonywać kod,
uruchamiać podpolecenia albo z założenia czytać pliki, preferuj jawne wpisy allowlisty
i pozostaw włączone monity o zatwierdzenie. Własne safe bins muszą definiować jawny
profil w `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Domyślne safe bins:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` i `sort` nie znajdują się na liście domyślnej. Jeśli włączysz je jawnie, zachowaj
jawne wpisy allowlisty dla ich przepływów pracy innych niż stdin. Dla `grep` w trybie safe-bin
wzorzec podawaj przez `-e`/`--regexp`; pozycyjna forma wzorca jest odrzucana,
aby operandy plików nie mogły być przemycane jako niejednoznaczne argumenty pozycyjne.

### Walidacja argv i odrzucane flagi

Walidacja jest deterministyczna wyłącznie na podstawie kształtu argv (bez sprawdzania istnienia systemu plików hosta),
co zapobiega zachowaniu typu oracle istnienia pliku wynikającemu z różnic allow/deny.
Opcje zorientowane na pliki są odrzucane dla domyślnych safe bins; opcje długie są walidowane
w trybie fail-closed (nieznane flagi i niejednoznaczne skróty są odrzucane).

Odrzucane flagi według profilu safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins wymuszają także traktowanie tokenów argv jako **dosłownego tekstu** w czasie wykonania
(brak globbingu i rozwijania `$VARS`) dla segmentów tylko-stdin, dzięki czemu wzorce
takie jak `*` lub `$HOME/...` nie mogą być używane do przemycania odczytów plików.

### Zaufane katalogi plików binarnych

Safe bins muszą być rozwiązywane z zaufanych katalogów plików binarnych (domyślnych systemowych oraz
opcjonalnych `tools.exec.safeBinTrustedDirs`). Wpisy `PATH` nigdy nie są automatycznie uznawane za zaufane.
Domyślne zaufane katalogi są celowo minimalne: `/bin`, `/usr/bin`. Jeśli
Twój plik binarny safe-bin znajduje się w ścieżkach menedżera pakietów/użytkownika (na przykład
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), dodaj je
jawnie do `tools.exec.safeBinTrustedDirs`.

### Łączenie w powłoce, wrappery i multipleksery

Łączenie w powłoce (`&&`, `||`, `;`) jest dozwolone, gdy każdy segment najwyższego poziomu
spełnia zasady allowlisty (w tym safe bins lub automatyczne dopuszczenie Skills). Przekierowania
pozostają nieobsługiwane w trybie allowlist. Substytucja poleceń (`$()` / backticks) jest
odrzucana podczas parsowania allowlisty, również wewnątrz podwójnych cudzysłowów; użyj pojedynczych
cudzysłowów, jeśli potrzebujesz dosłownego tekstu `$()`.

W zatwierdzeniach aplikacji towarzyszącej macOS surowy tekst powłoki zawierający składnię sterowania
lub rozwinięć powłoki (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) jest
traktowany jako chybienie allowlisty, chyba że sam plik binarny powłoki znajduje się na allowliście.

Dla opakowań powłoki (`bash|sh|zsh ... -c/-lc`) nadpisania env w zakresie żądania są
redukowane do małej jawnej allowlisty (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Dla decyzji `allow-always` w trybie allowlist znane wrappery dyspozycyjne (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) utrwalają wewnętrzną ścieżkę pliku wykonywalnego
zamiast ścieżki wrappera. Multipleksery powłoki (`busybox`, `toybox`) są rozpakowywane dla
apletów powłoki (`sh`, `ash` itd.) w ten sam sposób. Jeśli wrapper albo multiplexer
nie może zostać bezpiecznie rozpakowany, żaden wpis allowlisty nie jest utrwalany automatycznie.

Jeśli umieszczasz interpretery takie jak `python3` lub `node` na allowliście, preferuj
`tools.exec.strictInlineEval=true`, tak aby eval inline nadal wymagał jawnego
zatwierdzenia. W trybie strict `allow-always` nadal może utrwalać nieszkodliwe
wywołania interpretera/skryptu, ale nośniki inline-eval nie są utrwalane automatycznie.

### Safe bins a allowlista

| Temat            | `tools.exec.safeBins`                                 | Allowlista (`exec-approvals.json`)                                              |
| ---------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| Cel              | Automatyczne dopuszczanie wąskich filtrów stdin       | Jawne zaufanie dla konkretnych plików wykonywalnych                              |
| Typ dopasowania  | Nazwa pliku wykonywalnego + polityka argv safe-bin    | Glob rozwiązanej ścieżki pliku wykonywalnego albo glob samej nazwy polecenia dla poleceń wywoływanych przez PATH |
| Zakres argumentów | Ograniczony przez profil safe-bin i zasady dosłownych tokenów | Tylko dopasowanie ścieżki; argumenty są poza tym Twoją odpowiedzialnością        |
| Typowe przykłady | `head`, `tail`, `tr`, `wc`                            | `jq`, `python3`, `node`, `ffmpeg`, własne CLI                                    |
| Najlepsze użycie | Niskiego ryzyka transformacje tekstu w potokach       | Każde narzędzie o szerszym zachowaniu lub efektach ubocznych                     |

Lokalizacja konfiguracji:

- `safeBins` pochodzi z konfiguracji (`tools.exec.safeBins` albo per agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` pochodzi z konfiguracji (`tools.exec.safeBinTrustedDirs` albo per agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` pochodzi z konfiguracji (`tools.exec.safeBinProfiles` albo per agent `agents.list[].tools.exec.safeBinProfiles`). Klucze profili per agent nadpisują klucze globalne.
- Wpisy allowlisty znajdują się w lokalnym dla hosta `~/.openclaw/exec-approvals.json` pod `agents.<id>.allowlist` (albo przez Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` ostrzega przy użyciu `tools.exec.safe_bins_interpreter_unprofiled`, gdy pliki binarne interpreterów/runtime pojawiają się w `safeBins` bez jawnych profili.
- `openclaw doctor --fix` może wygenerować brakujące wpisy własnych `safeBinProfiles.<bin>` jako `{}` (po tym przejrzyj je i zaostrz). Pliki binarne interpreterów/runtime nie są scaffoldowane automatycznie.

Przykład własnego profilu:
__OC_I18N_900000__
Jeśli jawnie włączysz `jq` do `safeBins`, OpenClaw nadal odrzuca builtin `env` w trybie safe-bin,
dzięki czemu `jq -n env` nie może zrzucić środowiska procesu hosta bez jawnej ścieżki allowlisty
lub monitu o zatwierdzenie.

## Polecenia interpretera/runtime

Wykonania interpreterów/runtime oparte na zatwierdzeniach są celowo konserwatywne:

- Zawsze wiązany jest dokładny kontekst argv/cwd/env.
- Bezpośrednie skrypty powłoki i bezpośrednie formy plików runtime są w miarę możliwości wiązane z jedną konkretną lokalną migawką pliku.
- Typowe formy wrapperów menedżera pakietów, które nadal rozwiązują się do jednego bezpośredniego lokalnego pliku (na przykład
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`), są rozpakowywane przed powiązaniem.
- Jeśli OpenClaw nie potrafi zidentyfikować dokładnie jednego konkretnego lokalnego pliku dla polecenia interpretera/runtime
  (na przykład skrypty pakietów, formy eval, łańcuchy loaderów specyficznych dla runtime albo niejednoznaczne formy wielu plików),
  wykonanie oparte na zatwierdzeniu jest odrzucane zamiast twierdzić, że obejmuje semantykę,
  której faktycznie nie obejmuje.
- Dla takich przepływów preferuj sandboxing, oddzielną granicę hosta albo jawną zaufaną
  allowlistę/pełny workflow, w którym operator akceptuje szerszą semantykę runtime.

Gdy wymagane są zatwierdzenia, narzędzie exec natychmiast zwraca identyfikator zatwierdzenia. Użyj tego identyfikatora do
skorelowania późniejszych zdarzeń systemowych (`Exec finished` / `Exec denied`). Jeśli przed
timeoutem nie nadejdzie żadna decyzja, żądanie jest traktowane jako timeout zatwierdzenia i ujawniane jako przyczyna odmowy.

### Zachowanie dostarczania follow-up

Po zakończeniu zatwierdzonego asynchronicznego exec OpenClaw wysyła follow-up `agent` do tej samej sesji.

- Jeśli istnieje prawidłowy zewnętrzny cel dostarczenia (kanał dostarczalny plus docelowe `to`), dostarczenie follow-up używa tego kanału.
- W przepływach wyłącznie webchat lub sesji wewnętrznych bez zewnętrznego celu, dostarczenie follow-up pozostaje wyłącznie sesyjne (`deliver: false`).
- Jeśli wywołujący jawnie zażąda ścisłego zewnętrznego dostarczania bez możliwego do rozwiązania zewnętrznego kanału, żądanie kończy się błędem `INVALID_REQUEST`.
- Jeśli włączone jest `bestEffortDeliver` i nie można rozwiązać zewnętrznego kanału, dostarczenie jest degradowane do trybu wyłącznie sesyjnego zamiast błędu.

## Przekazywanie zatwierdzeń do kanałów czatu

Możesz przekazywać monity zatwierdzeń exec do dowolnego kanału czatu (w tym kanałów Plugin) i zatwierdzać
je przez `/approve`. Używa to zwykłego potoku dostarczania wychodzącego.

Konfiguracja:
__OC_I18N_900001__
Odpowiedź na czacie:
__OC_I18N_900002__
Polecenie `/approve` obsługuje zarówno zatwierdzenia exec, jak i zatwierdzenia Pluginów. Jeśli identyfikator nie pasuje do oczekującego zatwierdzenia exec, automatycznie sprawdza zamiast tego zatwierdzenia Pluginów.

### Przekazywanie zatwierdzeń Pluginów

Przekazywanie zatwierdzeń Pluginów używa tego samego potoku dostarczania co zatwierdzenia exec, ale ma własną
niezależną konfigurację w `approvals.plugin`. Włączanie lub wyłączanie jednej funkcji nie wpływa na drugą.
__OC_I18N_900003__
Kształt konfiguracji jest identyczny jak `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` i `targets` działają tak samo.

Kanały obsługujące współdzielone odpowiedzi interaktywne renderują te same przyciski zatwierdzeń zarówno dla zatwierdzeń exec, jak i Pluginów. Kanały bez współdzielonego interaktywnego UI wracają do zwykłego tekstu z instrukcjami `/approve`.

### Zatwierdzenia w tym samym czacie na dowolnym kanale

Gdy żądanie zatwierdzenia exec lub Plugin pochodzi z dostarczalnej powierzchni czatu, ten sam czat
może teraz domyślnie zatwierdzić je przez `/approve`. Dotyczy to kanałów takich jak Slack, Matrix i
Microsoft Teams, oprócz istniejących przepływów Web UI i terminal UI.

Ta współdzielona ścieżka polecenia tekstowego używa normalnego modelu uwierzytelniania kanału dla tej konwersacji. Jeśli
czat źródłowy może już wysyłać polecenia i odbierać odpowiedzi, żądania zatwierdzeń nie potrzebują już
osobnego natywnego adaptera dostarczania tylko po to, aby pozostać oczekujące.

Discord i Telegram także obsługują `/approve` w tym samym czacie, ale te kanały nadal używają
rozwiązanej listy zatwierdzających do autoryzacji, nawet gdy natywne dostarczanie zatwierdzeń jest wyłączone.

Dla Telegram i innych natywnych klientów zatwierdzeń wywołujących Gateway bezpośrednio,
ten fallback jest celowo ograniczony do błędów typu „nie znaleziono zatwierdzenia”.
Rzeczywista odmowa/błąd zatwierdzenia exec nie jest po cichu ponawiana jako zatwierdzenie Plugin.

### Natywne dostarczanie zatwierdzeń

Niektóre kanały mogą także działać jako natywni klienci zatwierdzeń. Natywni klienci dodają DM-y zatwierdzających, fanout do czatu źródłowego i interaktywne UX zatwierdzeń specyficzne dla kanału ponad współdzielony przepływ `/approve` w tym samym czacie.

Gdy dostępne są natywne karty/przyciski zatwierdzeń, to natywne UI jest podstawową
ścieżką widoczną dla agenta. Agent nie powinien dodatkowo powtarzać zduplikowanego zwykłego polecenia
`/approve` na czacie, chyba że wynik narzędzia mówi, że zatwierdzenia czatowe są niedostępne albo
ręczne zatwierdzenie jest jedyną pozostałą ścieżką.

Model ogólny:

- polityka exec hosta nadal decyduje, czy wymagane jest zatwierdzenie exec
- `approvals.exec` kontroluje przekazywanie monitów zatwierdzeń do innych miejsc docelowych czatu
- `channels.<channel>.execApprovals` kontroluje, czy dany kanał działa jako natywny klient zatwierdzeń

Natywni klienci zatwierdzeń automatycznie włączają dostarczanie DM-first, gdy spełnione są wszystkie poniższe warunki:

- kanał obsługuje natywne dostarczanie zatwierdzeń
- zatwierdzających można rozwiązać z jawnych `execApprovals.approvers` albo z
  udokumentowanych źródeł fallback dla tego kanału
- `channels.<channel>.execApprovals.enabled` jest nieustawione albo ma wartość `"auto"`

Ustaw `enabled: false`, aby jawnie wyłączyć natywnego klienta zatwierdzeń. Ustaw `enabled: true`, aby wymusić
jego włączenie, gdy można rozwiązać zatwierdzających. Publiczne dostarczanie do czatu źródłowego pozostaje jawnie sterowane przez
`channels.<channel>.execApprovals.target`.

FAQ: [Dlaczego istnieją dwie konfiguracje zatwierdzeń exec dla zatwierdzeń czatowych?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Ci natywni klienci zatwierdzeń dodają routing DM i opcjonalny fanout kanałowy ponad współdzielony
przepływ `/approve` w tym samym czacie oraz współdzielone przyciski zatwierdzeń.

Wspólne zachowanie:

- Slack, Matrix, Microsoft Teams i podobne dostarczalne czaty używają normalnego modelu uwierzytelniania kanału
  dla `/approve` w tym samym czacie
- gdy natywny klient zatwierdzeń włącza się automatycznie, domyślnym celem natywnego dostarczania są DM-y zatwierdzających
- w przypadku Discord i Telegram tylko rozwiązani zatwierdzający mogą zatwierdzać lub odrzucać
- zatwierdzający Discord mogą być jawni (`execApprovals.approvers`) albo wywnioskowani z `commands.ownerAllowFrom`
- zatwierdzający Telegram mogą być jawni (`execApprovals.approvers`) albo wywnioskowani z istniejącej konfiguracji właściciela (`allowFrom` oraz bezpośredniego `defaultTo`, gdy jest obsługiwane)
- zatwierdzający Slack mogą być jawni (`execApprovals.approvers`) albo wywnioskowani z `commands.ownerAllowFrom`
- natywne przyciski Slack zachowują rodzaj identyfikatora zatwierdzenia, dzięki czemu identyfikatory `plugin:` mogą rozwiązywać zatwierdzenia Pluginów
  bez drugiej lokalnej warstwy fallback Slack
- natywny routing DM/kanałów Matrix i skróty reakcji obsługują zarówno zatwierdzenia exec, jak i Pluginów;
  autoryzacja Pluginów nadal pochodzi z `channels.matrix.dm.allowFrom`
- zgłaszający nie musi być zatwierdzającym
- czat źródłowy może zatwierdzić bezpośrednio przez `/approve`, gdy ten czat już obsługuje polecenia i odpowiedzi
- natywne przyciski zatwierdzeń Discord kierują według rodzaju identyfikatora zatwierdzenia: identyfikatory `plugin:` trafiają
  bezpośrednio do zatwierdzeń Pluginów, a wszystko inne trafia do zatwierdzeń exec
- natywne przyciski zatwierdzeń Telegram podążają za tym samym ograniczonym fallbackiem exec-to-plugin co `/approve`
- gdy natywny `target` włącza dostarczanie do czatu źródłowego, monity zatwierdzeń zawierają tekst polecenia
- oczekujące zatwierdzenia exec domyślnie wygasają po 30 minutach
- jeśli żadne UI operatora ani skonfigurowany klient zatwierdzeń nie może przyjąć żądania, monit wraca do `askFallback`

Telegram domyślnie używa DM-ów zatwierdzających (`target: "dm"`). Możesz przełączyć na `channel` albo `both`, gdy
chcesz, aby monity zatwierdzeń pojawiały się również w źródłowym czacie/temacie Telegram. W przypadku tematów forum Telegram
OpenClaw zachowuje temat dla monitu zatwierdzenia i follow-up po zatwierdzeniu.

Zobacz:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Przepływ IPC macOS
__OC_I18N_900004__
Uwagi dotyczące bezpieczeństwa:

- Tryb gniazda Unix `0600`, token przechowywany w `exec-approvals.json`.
- Sprawdzanie peera o tym samym UID.
- Challenge/response (nonce + HMAC token + hash żądania) + krótki TTL.

## Powiązane

- [Zatwierdzenia exec](/pl/tools/exec-approvals) — podstawowa polityka i przepływ zatwierdzeń
- [Narzędzie exec](/pl/tools/exec)
- [Tryb podwyższonych uprawnień](/pl/tools/elevated)
- [Skills](/pl/tools/skills) — zachowanie auto-allow oparte na Skills
