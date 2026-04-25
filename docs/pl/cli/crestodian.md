---
read_when:
    - Uruchamiasz openclaw bez polecenia i chcesz zrozumieć Crestodian
    - Potrzebujesz bezpiecznego bezkonfiguracyjnego sposobu na sprawdzenie lub naprawę OpenClaw
    - Projektujesz lub włączasz tryb ratunkowy kanału wiadomości
summary: Dokumentacja CLI i model bezpieczeństwa dla Crestodian, pomocnika do bezpiecznej konfiguracji bezkonfiguracyjnej i naprawy
title: Crestodian
x-i18n:
    generated_at: "2026-04-25T13:43:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebcd6a72f78134fa572a85acc6c2f0381747a27fd6be84269c273390300bb533
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

Crestodian to lokalny pomocnik OpenClaw do konfiguracji, naprawy i zarządzania ustawieniami. Został
zaprojektowany tak, aby pozostawać dostępny, gdy normalna ścieżka agenta jest uszkodzona.

Uruchomienie `openclaw` bez polecenia uruchamia Crestodian w interaktywnym terminalu.
Uruchomienie `openclaw crestodian` uruchamia tego samego pomocnika jawnie.

## Co pokazuje Crestodian

Przy uruchomieniu interaktywny Crestodian otwiera tę samą powłokę TUI, której używa
`openclaw tui`, ale z backendem czatu Crestodian. Dziennik czatu zaczyna się od krótkiego
powitania:

- kiedy uruchomić Crestodian
- jakiego modelu lub deterministycznej ścieżki planera Crestodian faktycznie używa
- poprawność konfiguracji i domyślny agent
- osiągalność Gateway z pierwszego testu przy uruchomieniu
- następna akcja debugowania, którą Crestodian może wykonać

Nie zrzuca sekretów ani nie ładuje poleceń CLI Plugin tylko po to, by się uruchomić. TUI
nadal zapewnia zwykły nagłówek, dziennik czatu, linię statusu, stopkę, autouzupełnianie
i kontrolki edytora.

Użyj `status`, aby zobaczyć szczegółowy spis obejmujący ścieżkę konfiguracji, ścieżki dokumentacji/źródeł,
lokalne testy CLI, obecność kluczy API, agentów, model i szczegóły Gateway.

Crestodian używa tego samego wykrywania referencji OpenClaw co zwykli agenci. W checkout Git
wskazuje na lokalne `docs/` i lokalne drzewo źródeł. W instalacji pakietu npm
używa dołączonej dokumentacji pakietu i linkuje do
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), z jawną
wskazówką, aby sprawdzać źródła, gdy dokumentacja nie wystarcza.

## Przykłady

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

W TUI Crestodian:

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Bezpieczne uruchamianie

Ścieżka uruchamiania Crestodian jest celowo mała. Może działać, gdy:

- brakuje `openclaw.json`
- `openclaw.json` jest nieprawidłowy
- Gateway nie działa
- rejestracja poleceń Plugin jest niedostępna
- nie skonfigurowano jeszcze żadnego agenta

`openclaw --help` i `openclaw --version` nadal używają zwykłych szybkich ścieżek.
Nieinteraktywne `openclaw` kończy działanie z krótkim komunikatem zamiast wyświetlać pomoc
główną, ponieważ produktem bez polecenia jest Crestodian.

## Operacje i zatwierdzanie

Crestodian używa operacji typowanych zamiast doraźnie edytować konfigurację.

Operacje tylko do odczytu mogą być wykonywane od razu:

- pokaż przegląd
- wyświetl listę agentów
- pokaż status modelu/backendu
- uruchom kontrole statusu lub zdrowia
- sprawdź osiągalność Gateway
- uruchom doctor bez interaktywnych poprawek
- zweryfikuj konfigurację
- pokaż ścieżkę dziennika audytu

Operacje trwałe wymagają zatwierdzenia konwersacyjnego w trybie interaktywnym, chyba że
przekażesz `--yes` dla polecenia bezpośredniego:

- zapis konfiguracji
- uruchom `config set`
- ustaw obsługiwane wartości SecretRef przez `config set-ref`
- uruchom bootstrap konfiguracji/onboardingu
- zmień model domyślny
- uruchom, zatrzymaj lub uruchom ponownie Gateway
- twórz agentów
- uruchom naprawy doctor, które przepisują konfigurację lub stan

Zastosowane zapisy są rejestrowane w:

```text
~/.openclaw/audit/crestodian.jsonl
```

Wykrywanie nie jest audytowane. Rejestrowane są tylko zastosowane operacje i zapisy.

`openclaw onboard --modern` uruchamia Crestodian jako nowoczesny podgląd onboardingu.
Zwykłe `openclaw onboard` nadal uruchamia klasyczny onboarding.

## Bootstrap konfiguracji

`setup` to onboarding bootstrap z podejściem chat-first. Zapisuje tylko przez typowane
operacje konfiguracji i najpierw prosi o zatwierdzenie.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Gdy nie skonfigurowano modelu, setup wybiera pierwszy użyteczny backend w tej
kolejności i informuje, co wybrał:

- istniejący jawny model, jeśli już skonfigurowany
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Jeśli żaden nie jest dostępny, setup nadal zapisuje domyślny workspace i pozostawia
model nieustawiony. Zainstaluj lub zaloguj się do Codex/Claude Code albo udostępnij
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, a następnie uruchom setup ponownie.

## Planner wspomagany modelem

Crestodian zawsze uruchamia się w trybie deterministycznym. W przypadku nieprecyzyjnych poleceń, których
deterministyczny parser nie rozumie, lokalny Crestodian może wykonać jeden ograniczony krok planera
przez zwykłe ścieżki wykonawcze OpenClaw. Najpierw używa
skonfigurowanego modelu OpenClaw. Jeśli żaden skonfigurowany model nie jest jeszcze użyteczny,
może wrócić do lokalnych środowisk wykonawczych już obecnych na komputerze:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- harness serwera aplikacji Codex: `openai/gpt-5.5` z `embeddedHarness.runtime: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

Planner wspomagany modelem nie może bezpośrednio modyfikować konfiguracji. Musi przetłumaczyć
żądanie na jedno z typowanych poleceń Crestodian, a następnie obowiązują zwykłe reguły
zatwierdzania i audytu. Crestodian wypisuje model, którego użył, oraz zinterpretowane
polecenie, zanim cokolwiek uruchomi. Zapasowe kroki planera bez konfiguracji są
tymczasowe, z wyłączonymi narzędziami tam, gdzie środowisko wykonawcze to obsługuje, i używają
tymczasowego workspace/sesji.

Tryb ratunkowy kanału wiadomości nie używa planera wspomaganego modelem. Zdalny
tryb ratunkowy pozostaje deterministyczny, aby uszkodzona lub przejęta zwykła ścieżka agenta
nie mogła być używana jako edytor konfiguracji.

## Przełączanie do agenta

Użyj selektora języka naturalnego, aby opuścić Crestodian i otworzyć zwykłe TUI:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` i `openclaw terminal` nadal otwierają bezpośrednio zwykłe
TUI agenta. Nie uruchamiają Crestodian.

Po przełączeniu do zwykłego TUI użyj `/crestodian`, aby wrócić do Crestodian.
Możesz dołączyć kolejne żądanie:

```text
/crestodian
/crestodian restart gateway
```

Przełączenia agentów wewnątrz TUI zostawiają ślad, że `/crestodian` jest dostępne.

## Tryb ratunkowy wiadomości

Tryb ratunkowy wiadomości to punkt wejścia kanału wiadomości do Crestodian. Jest przeznaczony
na sytuację, gdy zwykły agent nie działa, ale zaufany kanał, taki jak WhatsApp,
nadal odbiera polecenia.

Obsługiwane polecenie tekstowe:

- `/crestodian <request>`

Przepływ operatora:

```text
Ty, w zaufanej wiadomości prywatnej właściciela: /crestodian status
OpenClaw: Tryb ratunkowy Crestodian. Gateway osiągalny: nie. Konfiguracja poprawna: nie.
Ty: /crestodian restart gateway
OpenClaw: Plan: uruchomić ponownie Gateway. Odpowiedz /crestodian yes, aby zastosować.
Ty: /crestodian yes
OpenClaw: Zastosowano. Wpis audytu został zapisany.
```

Tworzenie agentów może być również kolejkowane z lokalnego promptu albo z trybu ratunkowego:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Zdalny tryb ratunkowy to powierzchnia administracyjna. Musi być traktowany jak zdalna naprawa
konfiguracji, a nie jak zwykły czat.

Kontrakt bezpieczeństwa dla zdalnego trybu ratunkowego:

- Wyłączony, gdy aktywne jest sandboxing. Jeśli agent/sesja jest sandboxed,
  Crestodian musi odmówić zdalnego trybu ratunkowego i wyjaśnić, że wymagana
  jest lokalna naprawa przez CLI.
- Domyślny stan efektywny to `auto`: zezwalaj na zdalny tryb ratunkowy tylko w zaufanym trybie YOLO,
  gdzie środowisko wykonawcze ma już niesandboxowane lokalne uprawnienia.
- Wymagaj jawnej tożsamości właściciela. Tryb ratunkowy nie może akceptować reguł
  wildcard nadawcy, otwartej polityki grup, nieuwierzytelnionych Webhook lub anonimowych kanałów.
- Domyślnie tylko wiadomości prywatne właściciela. Tryb ratunkowy w grupie/kanale wymaga jawnego opt-in
  i nadal powinien kierować monity o zatwierdzenie do wiadomości prywatnej właściciela.
- Zdalny tryb ratunkowy nie może otwierać lokalnego TUI ani przełączać do interaktywnej sesji agenta.
  Do przekazania do agenta użyj lokalnego `openclaw`.
- Trwałe zapisy nadal wymagają zatwierdzenia, nawet w trybie ratunkowym.
- Audytuj każdą zastosowaną operację ratunkową, w tym kanał, konto, nadawcę,
  klucz sesji, operację, hash konfiguracji przed i hash konfiguracji po.
- Nigdy nie wyświetlaj sekretów. Inspekcja SecretRef powinna raportować dostępność, a nie
  wartości.
- Jeśli Gateway działa, preferuj typowane operacje Gateway. Jeśli Gateway
  nie działa, używaj tylko minimalnej lokalnej powierzchni naprawy, która nie zależy
  od zwykłej pętli agenta.

Kształt konfiguracji:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled` powinno akceptować:

- `"auto"`: domyślnie. Zezwalaj tylko wtedy, gdy efektywne środowisko wykonawcze jest YOLO i
  sandboxing jest wyłączony.
- `false`: nigdy nie zezwalaj na tryb ratunkowy kanału wiadomości.
- `true`: jawnie zezwalaj na tryb ratunkowy, gdy kontrole właściciela/kanału przejdą. To
  nadal nie może omijać odmowy związanej z sandboxing.

Domyślna postawa YOLO dla `"auto"` to:

- tryb sandbox rozstrzyga się do `off`
- `tools.exec.security` rozstrzyga się do `full`
- `tools.exec.ask` rozstrzyga się do `off`

Zdalny tryb ratunkowy jest objęty ścieżką Docker:

```bash
pnpm test:docker:crestodian-rescue
```

Lokalny fallback planera bez konfiguracji jest objęty przez:

```bash
pnpm test:docker:crestodian-planner
```

Opcjonalny smoke test powierzchni poleceń kanału na żywo sprawdza `/crestodian status` oraz
trwały roundtrip zatwierdzenia przez handler trybu ratunkowego:

```bash
pnpm test:live:crestodian-rescue-channel
```

Świeża konfiguracja bez konfiguracji przez Crestodian jest objęta przez:

```bash
pnpm test:docker:crestodian-first-run
```

Ta ścieżka zaczyna się od pustego katalogu stanu, kieruje zwykłe `openclaw` do Crestodian,
ustawia model domyślny, tworzy dodatkowego agenta, konfiguruje Discord przez
włączenie Plugin plus token SecretRef, weryfikuje konfigurację i sprawdza dziennik
audytu. QA Lab ma też scenariusz oparty na repo dla tego samego przepływu Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Doctor](/pl/cli/doctor)
- [TUI](/pl/cli/tui)
- [Sandbox](/pl/cli/sandbox)
- [Security](/pl/cli/security)
