---
read_when:
    - Używanie lub modyfikowanie narzędzia exec
    - Debugowanie zachowania stdin lub TTY
summary: Użycie narzędzia exec, tryby stdin i obsługa TTY
title: Narzędzie exec
x-i18n:
    generated_at: "2026-04-25T13:59:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 358f9155120382fa2b03b22e22408bdb9e51715f80c8b1701a1ff7fd05850188
    source_path: tools/exec.md
    workflow: 15
---

Uruchamiaj polecenia powłoki w obszarze roboczym. Obsługuje wykonanie na pierwszym planie i w tle przez `process`.
Jeśli `process` jest niedozwolone, `exec` działa synchronicznie i ignoruje `yieldMs`/`background`.
Sesje w tle są ograniczone do agenta; `process` widzi tylko sesje tego samego agenta.

## Parametry

<ParamField path="command" type="string" required>
Polecenie powłoki do uruchomienia.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Katalog roboczy dla polecenia.
</ParamField>

<ParamField path="env" type="object">
Nadpisania środowiska w postaci klucz/wartość scalane z odziedziczonym środowiskiem.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Automatycznie przenieś polecenie do tła po tym opóźnieniu (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Przenieś polecenie do tła natychmiast zamiast czekać na `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="1800">
Zabij polecenie po upływie tylu sekund.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Uruchom w pseudo-terminalu, gdy jest dostępny. Używaj dla CLI wymagających TTY, agentów kodujących i interfejsów terminalowych.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Gdzie wykonać. `auto` rozwiązuje się do `sandbox`, gdy aktywny jest runtime sandbox dla sesji, w przeciwnym razie do `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Tryb egzekwowania dla wykonania `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Zachowanie promptu zatwierdzania dla wykonania `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Identyfikator/nazwa Node, gdy `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Żądanie trybu podwyższonego — wyjście z sandboxu na skonfigurowaną ścieżkę hosta. `security=full` jest wymuszane tylko wtedy, gdy elevated rozwiązuje się do `full`.
</ParamField>

Uwagi:

- `host` domyślnie ma wartość `auto`: sandbox, gdy runtime sandbox jest aktywny dla sesji, w przeciwnym razie gateway.
- `auto` to domyślna strategia routingu, a nie wildcard. Dla pojedynczego wywołania `host=node` jest dozwolone z `auto`; dla pojedynczego wywołania `host=gateway` jest dozwolone tylko wtedy, gdy żaden runtime sandbox nie jest aktywny.
- Bez dodatkowej konfiguracji `host=auto` nadal „po prostu działa”: brak sandboxu oznacza, że rozwiązuje się do `gateway`; aktywny sandbox oznacza, że pozostaje w sandboxie.
- `elevated` wychodzi z sandboxu na skonfigurowaną ścieżkę hosta: domyślnie `gateway`, albo `node`, gdy `tools.exec.host=node` (lub domyślna sesji to `host=node`). Jest dostępne tylko wtedy, gdy podwyższony dostęp jest włączony dla bieżącej sesji/dostawcy.
- Zatwierdzenia `gateway`/`node` są kontrolowane przez `~/.openclaw/exec-approvals.json`.
- `node` wymaga sparowanego Node (aplikacji towarzyszącej lub bezgłowego hosta Node).
- Jeśli dostępnych jest wiele Node, ustaw `exec.node` lub `tools.exec.node`, aby wybrać jeden.
- `exec host=node` to jedyna ścieżka wykonywania powłoki dla Node; starsza otoczka `nodes.run` została usunięta.
- Na hostach innych niż Windows exec używa `SHELL`, jeśli jest ustawione; jeśli `SHELL` to `fish`, preferuje `bash` (lub `sh`)
  z `PATH`, aby uniknąć skryptów niezgodnych z fish, a następnie wraca do `SHELL`, jeśli żaden z nich nie istnieje.
- Na hostach Windows exec preferuje wykrywanie PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, a potem PATH),
  a następnie wraca do Windows PowerShell 5.1.
- Wykonanie hosta (`gateway`/`node`) odrzuca `env.PATH` i nadpisania loadera (`LD_*`/`DYLD_*`), aby
  zapobiec przejęciu binariów lub wstrzyknięciu kodu.
- OpenClaw ustawia `OPENCLAW_SHELL=exec` w środowisku uruchamianego polecenia (w tym dla PTY i wykonania w sandboxie), aby reguły powłoki/profilu mogły wykryć kontekst narzędzia exec.
- Ważne: sandboxing jest **domyślnie wyłączony**. Jeśli sandboxing jest wyłączony, niejawne `host=auto`
  rozwiązuje się do `gateway`. Jawne `host=sandbox` nadal kończy się bezpieczną odmową zamiast po cichu
  uruchamiać się na hoście gateway. Włącz sandboxing albo użyj `host=gateway` z zatwierdzeniami.
- Wstępne kontrole skryptów (dla typowych błędów składni powłoki w Python/Node) sprawdzają tylko pliki wewnątrz
  efektywnej granicy `workdir`. Jeśli ścieżka skryptu rozwiązuje się poza `workdir`, preflight jest pomijany dla
  tego pliku.
- Dla długotrwałej pracy, która zaczyna się teraz, uruchom ją raz i polegaj na automatycznym
  wybudzeniu po zakończeniu, gdy jest włączone i polecenie emituje dane wyjściowe lub kończy się błędem.
  Używaj `process` do logów, statusu, wejścia lub interwencji; nie emuluj
  harmonogramu pętlami sleep, timeout ani powtarzanym odpytywaniem.
- Do pracy, która ma się wydarzyć później lub według harmonogramu, używaj Cron zamiast
  wzorców `exec` opartych na sleep/opóźnieniu.

## Konfiguracja

- `tools.exec.notifyOnExit` (domyślnie: true): gdy true, sesje exec przeniesione do tła kolejkają zdarzenie systemowe i żądają Heartbeat przy zakończeniu.
- `tools.exec.approvalRunningNoticeMs` (domyślnie: 10000): emituje pojedyncze powiadomienie „running”, gdy exec wymagający zatwierdzenia działa dłużej niż ten czas (0 wyłącza).
- `tools.exec.host` (domyślnie: `auto`; rozwiązuje się do `sandbox`, gdy aktywny jest runtime sandbox, w przeciwnym razie do `gateway`)
- `tools.exec.security` (domyślnie: `deny` dla sandboxu, `full` dla gateway + node, gdy nieustawione)
- `tools.exec.ask` (domyślnie: `off`)
- Wykonanie hosta bez zatwierdzeń jest domyślne dla gateway + node. Jeśli chcesz zachowanie approvals/allowlist, zaostrz zarówno `tools.exec.*`, jak i politykę hosta `~/.openclaw/exec-approvals.json`; zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals#no-approval-yolo-mode).
- YOLO wynika z domyślnych ustawień polityki hosta (`security=full`, `ask=off`), a nie z `host=auto`. Jeśli chcesz wymusić routing gateway lub node, ustaw `tools.exec.host` albo użyj `/exec host=...`.
- W trybie `security=full` plus `ask=off` wykonanie hosta stosuje skonfigurowaną politykę bezpośrednio; nie ma dodatkowej heurystycznej warstwy wstępnego filtrowania zaciemnionych poleceń ani odrzucania przez script-preflight.
- `tools.exec.node` (domyślnie: nieustawione)
- `tools.exec.strictInlineEval` (domyślnie: false): gdy true, formy inline eval interpretera, takie jak `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` i `osascript -e`, zawsze wymagają jawnego zatwierdzenia. `allow-always` nadal może trwale zapisywać zaufanie dla nieszkodliwych wywołań interpretera/skryptu, ale formy inline-eval nadal proszą o zgodę za każdym razem.
- `tools.exec.pathPrepend`: lista katalogów do dodania na początek `PATH` dla uruchomień exec (tylko gateway + sandbox).
- `tools.exec.safeBins`: bezpieczne binaria tylko dla stdin, które mogą działać bez jawnych wpisów allowlist. Szczegóły zachowania znajdziesz w [Safe bins](/pl/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: dodatkowe jawne katalogi zaufane dla kontroli ścieżek wykonywalnych `safeBins`. Wpisy `PATH` nigdy nie są automatycznie uznawane za zaufane. Wbudowane wartości domyślne to `/bin` i `/usr/bin`.
- `tools.exec.safeBinProfiles`: opcjonalna niestandardowa polityka argv dla każdego safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

Przykład:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### Obsługa PATH

- `host=gateway`: scala `PATH` powłoki logowania z środowiskiem exec. Nadpisania `env.PATH` są
  odrzucane dla wykonania hosta. Sam demon nadal działa z minimalnym `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: uruchamia `sh -lc` (powłoka logowania) wewnątrz kontenera, więc `/etc/profile` może resetować `PATH`.
  OpenClaw dodaje `env.PATH` na początek po załadowaniu profilu przez wewnętrzną zmienną env (bez interpolacji powłoki);
  `tools.exec.pathPrepend` ma tu również zastosowanie.
- `host=node`: do Node wysyłane są tylko nieblokowane nadpisania env, które przekażesz. Nadpisania `env.PATH` są
  odrzucane dla wykonania hosta i ignorowane przez hosty Node. Jeśli potrzebujesz dodatkowych wpisów PATH na Node,
  skonfiguruj środowisko usługi hosta Node (systemd/launchd) albo zainstaluj narzędzia w standardowych lokalizacjach.

Powiązanie Node per agent (użyj indeksu listy agentów w konfiguracji):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: karta Nodes zawiera mały panel „Exec node binding” dla tych samych ustawień.

## Nadpisania sesji (`/exec`)

Użyj `/exec`, aby ustawić **domyślne wartości per sesja** dla `host`, `security`, `ask` i `node`.
Wyślij `/exec` bez argumentów, aby wyświetlić bieżące wartości.

Przykład:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Model autoryzacji

`/exec` jest respektowane tylko dla **autoryzowanych nadawców** (allowlisty kanałów/parowanie plus `commands.useAccessGroups`).
Aktualizuje **tylko stan sesji** i nie zapisuje konfiguracji. Aby trwale wyłączyć exec, zablokuj go przez politykę
narzędzi (`tools.deny: ["exec"]` lub per agent). Zatwierdzenia hosta nadal obowiązują, chyba że jawnie ustawisz
`security=full` i `ask=off`.

## Zatwierdzenia exec (aplikacja towarzysząca / host Node)

Agenci działający w sandboxie mogą wymagać zatwierdzenia dla każdego żądania, zanim `exec` uruchomi się na hoście gateway lub node.
Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals), aby poznać politykę, allowlistę i przepływ w interfejsie.

Gdy zatwierdzenia są wymagane, narzędzie exec zwraca natychmiast
`status: "approval-pending"` oraz identyfikator zatwierdzenia. Po zatwierdzeniu (lub odrzuceniu / upływie czasu),
Gateway emituje zdarzenia systemowe (`Exec finished` / `Exec denied`). Jeśli polecenie nadal
działa po `tools.exec.approvalRunningNoticeMs`, emitowane jest pojedyncze powiadomienie `Exec running`.
Na kanałach z natywnymi kartami/przyciskami zatwierdzania agent powinien najpierw polegać na tym
natywnym interfejsie, a ręczne polecenie `/approve` dołączać tylko wtedy, gdy wynik
narzędzia jawnie mówi, że zatwierdzenia na czacie są niedostępne lub ręczne zatwierdzenie jest
jedyną ścieżką.

## Allowlist + safe bins

Ręczne egzekwowanie allowlist dopasowuje globy rozstrzygniętych ścieżek binarnych i globy samych nazw poleceń.
Same nazwy pasują tylko do poleceń wywoływanych przez PATH, więc `rg` może pasować do
`/opt/homebrew/bin/rg`, gdy poleceniem jest `rg`, ale nie do `./rg` ani `/tmp/rg`.
Gdy `security=allowlist`, polecenia powłoki są automatycznie dozwolone tylko wtedy, gdy każdy segment pipeline
jest na allowliście albo jest safe bin. Łączenie (`;`, `&&`, `||`) i przekierowania
są odrzucane w trybie allowlist, chyba że każdy segment najwyższego poziomu spełnia
allowlistę (w tym safe bins). Przekierowania nadal nie są obsługiwane.
Trwałe zaufanie `allow-always` nie omija tej reguły: łączone polecenie nadal wymaga, aby każdy
segment najwyższego poziomu pasował.

`autoAllowSkills` to osobna ścieżka wygody w zatwierdzeniach exec. Nie jest tym samym co
ręczne wpisy allowlist ścieżek. Dla ścisłego jawnego zaufania trzymaj `autoAllowSkills` wyłączone.

Używaj tych dwóch mechanizmów do różnych zadań:

- `tools.exec.safeBins`: małe filtry strumieni tylko dla stdin.
- `tools.exec.safeBinTrustedDirs`: jawne dodatkowe zaufane katalogi dla ścieżek wykonywalnych safe-bin.
- `tools.exec.safeBinProfiles`: jawna polityka argv dla niestandardowych safe bins.
- allowlist: jawne zaufanie dla ścieżek wykonywalnych.

Nie traktuj `safeBins` jako generycznej allowlisty i nie dodawaj binariów interpreterów/runtime (na przykład `python3`, `node`, `ruby`, `bash`). Jeśli ich potrzebujesz, użyj jawnych wpisów allowlist i pozostaw prompty zatwierdzeń włączone.
`openclaw security audit` ostrzega, gdy wpisy `safeBins` dla interpreterów/runtime nie mają jawnych profili, a `openclaw doctor --fix` może wygenerować brakujące wpisy niestandardowych `safeBinProfiles`.
`openclaw security audit` i `openclaw doctor` ostrzegają również, gdy jawnie dodasz z powrotem do `safeBins` binaria o szerokim zachowaniu, takie jak `jq`.
Jeśli jawnie umieszczasz interpretery na allowliście, włącz `tools.exec.strictInlineEval`, aby formy inline code-eval nadal wymagały nowego zatwierdzenia.

Pełne szczegóły polityki i przykłady znajdziesz w [Zatwierdzenia exec](/pl/tools/exec-approvals-advanced#safe-bins-stdin-only) i [Safe bins versus allowlist](/pl/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Przykłady

Pierwszy plan:

```json
{ "tool": "exec", "command": "ls -la" }
```

Tło + odpytywanie:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Odpytywanie służy do doraźnego sprawdzania statusu, a nie do pętli oczekiwania. Jeśli automatyczne wybudzenie po zakończeniu
jest włączone, polecenie może wybudzić sesję, gdy emituje dane wyjściowe lub kończy się błędem.

Wysyłanie klawiszy (w stylu tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Zatwierdzenie (wysyła tylko CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Wklejanie (domyślnie w nawiasach bracketed):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` to podnarzędzie `exec` do ustrukturyzowanej edycji wielu plików.
Jest domyślnie włączone dla modeli OpenAI i OpenAI Codex. Używaj konfiguracji tylko
wtedy, gdy chcesz je wyłączyć albo ograniczyć do określonych modeli:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

Uwagi:

- Dostępne tylko dla modeli OpenAI/OpenAI Codex.
- Polityka narzędzi nadal obowiązuje; `allow: ["write"]` domyślnie dopuszcza `apply_patch`.
- Konfiguracja znajduje się w `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` domyślnie ma wartość `true`; ustaw `false`, aby wyłączyć narzędzie dla modeli OpenAI.
- `tools.exec.applyPatch.workspaceOnly` domyślnie ma wartość `true` (ograniczone do obszaru roboczego). Ustaw `false` tylko wtedy, gdy świadomie chcesz, aby `apply_patch` zapisywało/usunęło pliki poza katalogiem obszaru roboczego.

## Powiązane

- [Zatwierdzenia exec](/pl/tools/exec-approvals) — bramki zatwierdzeń dla poleceń powłoki
- [Sandboxing](/pl/gateway/sandboxing) — uruchamianie poleceń w środowiskach sandbox
- [Proces w tle](/pl/gateway/background-process) — długotrwałe exec i narzędzie process
- [Bezpieczeństwo](/pl/gateway/security) — polityka narzędzi i podwyższony dostęp
