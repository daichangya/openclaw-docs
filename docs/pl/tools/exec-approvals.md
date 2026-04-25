---
read_when:
    - Konfigurowanie zatwierdzeń exec lub list dozwolonych
    - Implementowanie UX zatwierdzeń exec w aplikacji macOS
    - Przegląd promptów ucieczki z sandboxa i ich konsekwencji
summary: Zatwierdzenia exec, listy dozwolonych i prompty ucieczki z sandboxa
title: Zatwierdzenia exec
x-i18n:
    generated_at: "2026-04-25T13:59:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44bf7af57d322280f6d0089207041214b1233d0c9eca99656d51fc4aed88941b
    source_path: tools/exec-approvals.md
    workflow: 15
---

Zatwierdzenia exec to **zabezpieczenie aplikacji towarzyszącej / hosta node** umożliwiające
agentowi działającemu w sandboxie uruchamianie poleceń na rzeczywistym hoście (`gateway` lub `node`). To blokada bezpieczeństwa: polecenia są dozwolone tylko wtedy, gdy polityka + lista dozwolonych + (opcjonalnie) zatwierdzenie użytkownika są zgodne. Zatwierdzenia exec nakładają się **na** politykę narzędzi i bramkowanie elevated (chyba że elevated jest ustawione na `full`, co pomija zatwierdzenia).

<Note>
Efektywna polityka to **bardziej restrykcyjna** z `tools.exec.*` i domyślnych ustawień zatwierdzeń;
jeśli pole zatwierdzeń zostanie pominięte, używana jest wartość `tools.exec`. Host exec
korzysta też z lokalnego stanu zatwierdzeń na tej maszynie — lokalne na hoście `ask: "always"`
w `~/.openclaw/exec-approvals.json` nadal będzie wymuszać prompty, nawet jeśli domyślne ustawienia sesji lub konfiguracji żądają `ask: "on-miss"`.
</Note>

## Sprawdzanie efektywnej polityki

- `openclaw approvals get`, `... --gateway`, `... --node <id|name|ip>` — pokazują żądaną politykę, źródła polityki hosta i wynik efektywny.
- `openclaw exec-policy show` — scalony widok dla maszyny lokalnej.
- `openclaw exec-policy set|preset` — synchronizuje lokalnie żądaną politykę z lokalnym plikiem zatwierdzeń hosta w jednym kroku.

Gdy zakres lokalny żąda `host=node`, `exec-policy show` zgłasza ten zakres
w czasie działania jako zarządzany przez node, zamiast udawać, że lokalny plik zatwierdzeń jest
źródłem prawdy.

Jeśli UI aplikacji towarzyszącej jest **niedostępne**, każde żądanie, które normalnie
wywołałoby prompt, jest rozstrzygane przez **ask fallback** (domyślnie: deny).

<Tip>
Natywne klienckie mechanizmy zatwierdzania w czacie mogą zasilać komunikat oczekującego zatwierdzenia
udogodnieniami specyficznymi dla kanału. Na przykład Matrix dodaje skróty reakcji (`✅`
zezwól raz, `❌` odmów, `♾️` zawsze zezwalaj), pozostawiając jednocześnie polecenia `/approve ...`
w wiadomości jako fallback.
</Tip>

## Gdzie to obowiązuje

Zatwierdzenia exec są egzekwowane lokalnie na hoście wykonania:

- **host gateway** → proces `openclaw` na maszynie Gateway
- **host node** → runner node (aplikacja towarzysząca macOS lub bezgłowy host node)

Uwaga dotycząca modelu zaufania:

- Wywołujący uwierzytelnieni względem Gateway są zaufanymi operatorami tego Gateway.
- Sparowane node rozszerzają tę zdolność zaufanego operatora na host node.
- Zatwierdzenia exec ograniczają ryzyko przypadkowego wykonania, ale nie są granicą uwierzytelniania per użytkownik.
- Zatwierdzone uruchomienia na hoście node wiążą kanoniczny kontekst wykonania: kanoniczne cwd, dokładne argv, powiązanie env jeśli istnieje oraz przypiętą ścieżkę wykonywalną, gdy ma zastosowanie.
- W przypadku skryptów powłoki i bezpośrednich wywołań plików interpretera/runtime OpenClaw próbuje także powiązać
  jeden konkretny lokalny operand plikowy. Jeśli ten powiązany plik zmieni się po zatwierdzeniu, ale przed wykonaniem,
  uruchomienie zostanie odrzucone zamiast wykonać zmodyfikowaną treść.
- To wiązanie pliku jest celowo najlepszym możliwym podejściem, a nie kompletnym modelem semantycznym każdej
  ścieżki ładowania interpretera/runtime. Jeśli tryb zatwierdzania nie może zidentyfikować dokładnie jednego konkretnego lokalnego
  pliku do powiązania, odmawia utworzenia uruchomienia opartego na zatwierdzeniu, zamiast udawać pełne pokrycie.

Podział macOS:

- **usługa hosta node** przekazuje `system.run` do **aplikacji macOS** przez lokalne IPC.
- **aplikacja macOS** egzekwuje zatwierdzenia i wykonuje polecenie w kontekście UI.

## Ustawienia i przechowywanie

Zatwierdzenia znajdują się w lokalnym pliku JSON na hoście wykonania:

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

Jeśli chcesz, aby host exec działał bez promptów zatwierdzenia, musisz otworzyć **obie** warstwy polityki:

- żądaną politykę exec w konfiguracji OpenClaw (`tools.exec.*`)
- lokalną dla hosta politykę zatwierdzeń w `~/.openclaw/exec-approvals.json`

To jest teraz domyślne zachowanie hosta, chyba że jawnie je zaostrzysz:

- `tools.exec.security`: `full` na `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Ważne rozróżnienie:

- `tools.exec.host=auto` wybiera miejsce uruchomienia exec: sandbox, jeśli jest dostępny, w przeciwnym razie gateway.
- YOLO wybiera sposób zatwierdzania host exec: `security=full` plus `ask=off`.
- Dostawcy opierający się na CLI, którzy udostępniają własny nieinteraktywny tryb uprawnień, mogą stosować tę politykę.
  Claude CLI dodaje `--permission-mode bypassPermissions`, gdy żądana polityka exec OpenClaw to
  YOLO. Nadpisz to zachowanie backendu jawnymi argumentami Claude pod
  `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs`, na przykład
  `--permission-mode default`, `acceptEdits` lub `bypassPermissions`.
- W trybie YOLO OpenClaw nie dodaje osobnej heurystycznej bramki zatwierdzania dla zaciemniania poleceń ani warstwy odrzucania skryptów przed wykonaniem ponad skonfigurowaną politykę host exec.
- `auto` nie czyni routingu gateway darmowym obejściem z sesji sandboxowanej. Żądanie per wywołanie `host=node` jest dozwolone z `auto`, a `host=gateway` jest dozwolone z `auto` tylko wtedy, gdy nie jest aktywne środowisko sandbox. Jeśli chcesz stabilnej domyślnej wartości innej niż auto, ustaw `tools.exec.host` lub użyj jawnie `/exec host=...`.

Jeśli chcesz bardziej konserwatywnej konfiguracji, zaostrz jedną z warstw z powrotem do `allowlist` / `on-miss`
lub `deny`.

Trwała konfiguracja hosta gateway „nigdy nie pytaj”:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Następnie ustaw zgodnie plik zatwierdzeń hosta:

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

Lokalny skrót do tej samej polityki hosta gateway na bieżącej maszynie:

```bash
openclaw exec-policy preset yolo
```

Ten lokalny skrót aktualizuje oba elementy:

- lokalne `tools.exec.host/security/ask`
- lokalne domyślne `~/.openclaw/exec-approvals.json`

Jest on celowo wyłącznie lokalny. Jeśli musisz zdalnie zmienić zatwierdzenia hosta gateway lub hosta node,
nadal używaj `openclaw approvals set --gateway` lub
`openclaw approvals set --node <id|name|ip>`.

W przypadku hosta node zastosuj ten sam plik zatwierdzeń na tym node:

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

Ważne ograniczenie tylko lokalne:

- `openclaw exec-policy` nie synchronizuje zatwierdzeń node
- `openclaw exec-policy set --host node` jest odrzucane
- zatwierdzenia exec dla node są pobierane z node w czasie działania, więc aktualizacje skierowane do node muszą używać `openclaw approvals --node ...`

Skrót tylko dla sesji:

- `/exec security=full ask=off` zmienia tylko bieżącą sesję.
- `/elevated full` to awaryjny skrót break-glass, który również pomija zatwierdzenia exec dla tej sesji.

Jeśli plik zatwierdzeń hosta pozostaje bardziej restrykcyjny niż konfiguracja, nadal wygrywa bardziej restrykcyjna polityka hosta.

## Pokrętła polityki

### Security (`exec.security`)

- **deny**: blokuje wszystkie żądania host exec.
- **allowlist**: pozwala tylko na polecenia z listy dozwolonych.
- **full**: pozwala na wszystko (odpowiednik elevated).

### Ask (`exec.ask`)

- **off**: nigdy nie pytaj.
- **on-miss**: pytaj tylko wtedy, gdy lista dozwolonych nie pasuje.
- **always**: pytaj o każde polecenie.
- trwałe zaufanie `allow-always` nie tłumi promptów, gdy efektywny tryb ask to `always`

### Ask fallback (`askFallback`)

Jeśli prompt jest wymagany, ale żaden UI nie jest osiągalny, fallback decyduje:

- **deny**: blokuj.
- **allowlist**: pozwalaj tylko wtedy, gdy lista dozwolonych pasuje.
- **full**: pozwalaj.

### Utwardzanie inline interpreter eval (`tools.exec.strictInlineEval`)

Gdy `tools.exec.strictInlineEval=true`, OpenClaw traktuje formy inline code-eval jako wymagające zatwierdzenia, nawet jeśli samo binarium interpretera znajduje się na liście dozwolonych.

Przykłady:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

To defense-in-depth dla loaderów interpreterów, które nie mapują się czysto na jeden stabilny operand plikowy. W trybie strict:

- te polecenia nadal wymagają jawnego zatwierdzenia;
- `allow-always` nie zapisuje dla nich automatycznie nowych wpisów listy dozwolonych.

## Lista dozwolonych (per agent)

Listy dozwolonych są **per agent**. Jeśli istnieje wielu agentów, przełącz agenta,
którego edytujesz, w aplikacji macOS. Wzorce są dopasowaniami glob.
Wzorce mogą być globami rozwiązanych ścieżek binarnych albo zwykłymi globami nazw poleceń. Zwykłe nazwy
pasują tylko do poleceń wywoływanych przez PATH, więc `rg` może pasować do `/opt/homebrew/bin/rg`,
gdy poleceniem jest `rg`, ale nie do `./rg` ani `/tmp/rg`. Użyj globu ścieżki, gdy
chcesz ufać jednej konkretnej lokalizacji binarnej.
Starsze wpisy `agents.default` są migrowane do `agents.main` podczas ładowania.
Łańcuchy powłoki, takie jak `echo ok && pwd`, nadal wymagają, aby każdy segment najwyższego poziomu spełniał reguły listy dozwolonych.

Przykłady:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Każdy wpis listy dozwolonych śledzi:

- **id** stabilny UUID używany do tożsamości w UI (opcjonalny)
- **ostatnie użycie** znacznik czasu
- **ostatnio użyte polecenie**
- **ostatnio rozwiązana ścieżka**

## Automatyczne zezwalanie na CLI Skills

Gdy włączone jest **Auto-allow skill CLIs**, pliki wykonywalne wskazane przez znane Skills
są traktowane na node jako znajdujące się na liście dozwolonych (macOS node lub bezgłowy host node). Używa to
`skills.bins` przez Gateway RPC do pobrania listy binariów skill. Wyłącz to, jeśli chcesz ścisłych ręcznych list dozwolonych.

Ważne uwagi o zaufaniu:

- To **niejawna wygodna lista dozwolonych**, oddzielna od ręcznych wpisów listy dozwolonych ścieżek.
- Jest przeznaczona dla środowisk zaufanych operatorów, gdzie Gateway i node znajdują się w tej samej granicy zaufania.
- Jeśli wymagasz ścisłego jawnego zaufania, ustaw `autoAllowSkills: false` i używaj wyłącznie ręcznych wpisów listy dozwolonych ścieżek.

## Safe bins i przekazywanie zatwierdzeń

Informacje o safe bins (szybkiej ścieżce tylko przez stdin), szczegółach wiązania interpreterów oraz o tym,
jak przekazywać prompty zatwierdzeń do Slack/Discord/Telegram (lub uruchamiać je jako natywne
klienty zatwierdzania), znajdziesz w [Exec approvals — advanced](/pl/tools/exec-approvals-advanced).

<!-- moved to /tools/exec-approvals-advanced -->

## Edycja w Control UI

Użyj karty **Control UI → Nodes → Exec approvals**, aby edytować ustawienia domyślne, nadpisania per agent
i listy dozwolonych. Wybierz zakres (Defaults lub agent), dostosuj politykę,
dodaj/usuń wzorce listy dozwolonych, a następnie kliknij **Save**. UI pokazuje metadane **last used**
dla każdego wzorca, dzięki czemu możesz utrzymać porządek na liście.

Selektor celu wybiera **Gateway** (lokalne zatwierdzenia) albo **Node**. Node
muszą reklamować `system.execApprovals.get/set` (aplikacja macOS lub bezgłowy host node).
Jeśli node nie reklamuje jeszcze zatwierdzeń exec, edytuj bezpośrednio jego lokalny
`~/.openclaw/exec-approvals.json`.

CLI: `openclaw approvals` obsługuje edycję gateway lub node (zobacz [CLI zatwierdzeń](/pl/cli/approvals)).

## Przepływ zatwierdzania

Gdy wymagany jest prompt, gateway rozsyła `exec.approval.requested` do klientów operatorów.
Control UI i aplikacja macOS rozstrzygają go przez `exec.approval.resolve`, po czym gateway przekazuje
zatwierdzone żądanie do hosta node.

Dla `host=node` żądania zatwierdzenia zawierają kanoniczny ładunek `systemRunPlan`. Gateway używa
tego planu jako autorytatywnego kontekstu polecenia/cwd/sesji przy przekazywaniu zatwierdzonych żądań `system.run`.

Ma to znaczenie przy opóźnieniu asynchronicznego zatwierdzania:

- ścieżka exec node przygotowuje z góry jeden kanoniczny plan
- rekord zatwierdzenia przechowuje ten plan i jego metadane powiązania
- po zatwierdzeniu końcowe przekazane wywołanie `system.run` ponownie używa zapisanego planu
  zamiast ufać późniejszym zmianom wywołującego
- jeśli wywołujący zmieni `command`, `rawCommand`, `cwd`, `agentId` lub
  `sessionKey` po utworzeniu żądania zatwierdzenia, gateway odrzuci
  przekazane uruchomienie jako niedopasowanie zatwierdzenia

## Zdarzenia systemowe

Cykl życia exec jest udostępniany jako komunikaty systemowe:

- `Exec running` (tylko jeśli polecenie przekroczy próg powiadomienia o uruchomieniu)
- `Exec finished`
- `Exec denied`

Są one publikowane w sesji agenta po zgłoszeniu zdarzenia przez node.
Zatwierdzenia exec hosta gateway emitują te same zdarzenia cyklu życia, gdy polecenie się zakończy (oraz opcjonalnie, gdy działa dłużej niż próg).
Execy bramkowane zatwierdzeniem używają ponownie identyfikatora zatwierdzenia jako `runId` w tych wiadomościach, co ułatwia korelację.

## Zachowanie przy odrzuconym zatwierdzeniu

Gdy asynchroniczne zatwierdzenie exec zostanie odrzucone, OpenClaw uniemożliwia agentowi ponowne użycie
wyniku z wcześniejszego uruchomienia tego samego polecenia w sesji. Powód odrzucenia
jest przekazywany wraz z jawną informacją, że żaden wynik polecenia nie jest dostępny, co powstrzymuje
agenta przed twierdzeniem, że istnieje nowy wynik, lub przed powtarzaniem odrzuconego polecenia z
nieaktualnymi rezultatami z wcześniejszego udanego uruchomienia.

## Konsekwencje

- **full** jest potężne; gdy to możliwe, preferuj listy dozwolonych.
- **ask** pozwala Ci zachować kontrolę, a jednocześnie umożliwia szybkie zatwierdzanie.
- Listy dozwolonych per agent zapobiegają przenikaniu zatwierdzeń jednego agenta do innych.
- Zatwierdzenia dotyczą tylko żądań host exec od **autoryzowanych nadawców**. Nieautoryzowani nadawcy nie mogą wydawać `/exec`.
- `/exec security=full` to wygodne ustawienie na poziomie sesji dla autoryzowanych operatorów i zgodnie z założeniem pomija zatwierdzenia. Aby twardo zablokować host exec, ustaw security zatwierdzeń na `deny` lub zablokuj narzędzie `exec` przez politykę narzędzi.

## Powiązane

<CardGroup cols={2}>
  <Card title="Exec approvals — advanced" href="/pl/tools/exec-approvals-advanced" icon="gear">
    Safe bins, wiązanie interpreterów i przekazywanie zatwierdzeń do czatu.
  </Card>
  <Card title="Narzędzie exec" href="/pl/tools/exec" icon="terminal">
    Narzędzie do wykonywania poleceń powłoki.
  </Card>
  <Card title="Tryb podwyższonych uprawnień" href="/pl/tools/elevated" icon="shield-exclamation">
    Ścieżka awaryjna break-glass, która także pomija zatwierdzenia.
  </Card>
  <Card title="Sandboxing" href="/pl/gateway/sandboxing" icon="box">
    Tryby sandboxa i dostęp do obszaru roboczego.
  </Card>
  <Card title="Bezpieczeństwo" href="/pl/gateway/security" icon="lock">
    Model bezpieczeństwa i utwardzanie.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/pl/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Kiedy używać każdej z tych kontrolek.
  </Card>
  <Card title="Skills" href="/pl/tools/skills" icon="sparkles">
    Zachowanie automatycznego zezwalania oparte na Skills.
  </Card>
</CardGroup>
