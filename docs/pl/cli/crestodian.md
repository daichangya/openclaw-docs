---
read_when:
    - Uruchamiasz `openclaw` bez polecenia i chcesz zrozumieć Crestodian
    - Potrzebujesz bezkonfiguracyjnego i bezpiecznego sposobu na sprawdzenie lub naprawę OpenClaw
    - Projektujesz lub włączasz tryb ratunkowy kanału wiadomości
summary: Dokumentacja CLI i model bezpieczeństwa dla Crestodian, pomocnika do bezkonfiguracyjnej bezpiecznej konfiguracji i naprawy
title: Crestodian
x-i18n:
    generated_at: "2026-04-26T11:25:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: aafa46de3c2df2ec4b0b16a0955bb9afc76df92d5ebb928077bb5007118e037c
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

Crestodian to lokalny pomocnik OpenClaw do konfiguracji, naprawy i zarządzania ustawieniami. Został
zaprojektowany tak, aby pozostać dostępny, gdy normalna ścieżka agenta jest uszkodzona.

Uruchomienie `openclaw` bez polecenia uruchamia Crestodian w interaktywnym terminalu.
Uruchomienie `openclaw crestodian` uruchamia tego samego pomocnika jawnie.

## Co pokazuje Crestodian

Przy uruchomieniu interaktywny Crestodian otwiera tę samą powłokę TUI używaną przez
`openclaw tui`, ale z backendem czatu Crestodian. Dziennik czatu zaczyna się od krótkiego
powitania:

- kiedy uruchomić Crestodian
- jakiego modelu lub deterministycznej ścieżki planera Crestodian faktycznie używa
- poprawność konfiguracji i domyślny agent
- osiągalność Gateway z pierwszego testu uruchomieniowego
- następne działanie debugowania, które Crestodian może wykonać

Nie zrzuca sekretów ani nie ładuje poleceń CLI Plugin tylko po to, aby się uruchomić. TUI
nadal udostępnia zwykły nagłówek, dziennik czatu, linię stanu, stopkę, autouzupełnianie
i kontrolki edytora.

Użyj `status`, aby wyświetlić szczegółowy inwentarz ze ścieżką konfiguracji, ścieżkami docs/source,
lokalnymi testami CLI, obecnością kluczy API, agentami, modelem i szczegółami Gateway.

Crestodian używa tego samego wykrywania odwołań OpenClaw co zwykli agenci. W checkoutcie Git
wskazuje na lokalne `docs/` i lokalne drzewo źródłowe. W instalacji pakietu npm
używa dołączonej dokumentacji pakietu i linkuje do
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), z jawną
wskazówką, aby sprawdzić kod źródłowy, gdy dokumentacja nie wystarcza.

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
- żaden agent nie został jeszcze skonfigurowany

`openclaw --help` i `openclaw --version` nadal używają zwykłych szybkich ścieżek.
Nieinteraktywne `openclaw` kończy działanie krótkim komunikatem zamiast wyświetlać główną
pomoc, ponieważ produktem bez polecenia jest Crestodian.

## Operacje i zatwierdzanie

Crestodian używa typowanych operacji zamiast doraźnie edytować konfigurację.

Operacje tylko do odczytu mogą być uruchamiane natychmiast:

- pokaż przegląd
- wyświetl listę agentów
- pokaż status modelu/backendu
- uruchom kontrole statusu lub zdrowia
- sprawdź osiągalność Gateway
- uruchom doctor bez interaktywnych poprawek
- sprawdź poprawność konfiguracji
- pokaż ścieżkę dziennika audytu

Operacje trwałe wymagają zatwierdzenia w rozmowie w trybie interaktywnym, chyba że
przekażesz `--yes` dla polecenia bezpośredniego:

- zapis konfiguracji
- uruchomienie `config set`
- ustawianie obsługiwanych wartości SecretRef przez `config set-ref`
- uruchomienie bootstrapu konfiguracji/onboardingu
- zmiana domyślnego modelu
- uruchomienie, zatrzymanie lub ponowne uruchomienie Gateway
- tworzenie agentów
- uruchamianie napraw doctor, które przepisują konfigurację lub stan

Zastosowane zapisy są rejestrowane w:

```text
~/.openclaw/audit/crestodian.jsonl
```

Wykrywanie nie jest objęte audytem. Rejestrowane są tylko zastosowane operacje i zapisy.

`openclaw onboard --modern` uruchamia Crestodian jako nowoczesny podgląd onboardingu.
Zwykłe `openclaw onboard` nadal uruchamia klasyczny onboarding.

## Bootstrap konfiguracji

`setup` to bootstrap onboardingu w stylu chat-first. Zapisuje wyłącznie przez typowane
operacje konfiguracji i najpierw prosi o zatwierdzenie.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Gdy żaden model nie jest skonfigurowany, setup wybiera pierwszy użyteczny backend w tej
kolejności i informuje Cię, co wybrał:

- istniejący jawny model, jeśli jest już skonfigurowany
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Jeśli żaden nie jest dostępny, setup nadal zapisuje domyślny workspace i pozostawia
model nieustawiony. Zainstaluj lub zaloguj się do Codex/Claude Code albo udostępnij
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, a następnie uruchom setup ponownie.

## Planner wspomagany modelem

Crestodian zawsze uruchamia się w trybie deterministycznym. Dla nieprecyzyjnych poleceń,
których parser deterministyczny nie rozumie, lokalny Crestodian może wykonać jedną ograniczoną
turę planera przez zwykłe ścieżki środowiska uruchomieniowego OpenClaw. Najpierw używa
skonfigurowanego modelu OpenClaw. Jeśli żaden skonfigurowany model nie jest jeszcze użyteczny,
może przełączyć się na lokalne środowiska uruchomieniowe już obecne na maszynie:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- harness serwera aplikacji Codex: `openai/gpt-5.5` z `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

Planner wspomagany modelem nie może bezpośrednio modyfikować konfiguracji. Musi przetłumaczyć
żądanie na jedno z typowanych poleceń Crestodian, a następnie obowiązują zwykłe reguły
zatwierdzania i audytu. Crestodian wypisuje użyty model i zinterpretowane
polecenie, zanim cokolwiek uruchomi. Zapasowe tury planera bez konfiguracji są
tymczasowe, z wyłączonymi narzędziami tam, gdzie dane środowisko to obsługuje, i używają
tymczasowego workspace/sesji.

Tryb ratunkowy kanału wiadomości nie używa planera wspomaganego modelem. Zdalny
tryb ratunkowy pozostaje deterministyczny, aby uszkodzona lub skompromitowana normalna ścieżka
agenta nie mogła zostać użyta jako edytor konfiguracji.

## Przełączanie do agenta

Użyj selektora w języku naturalnym, aby opuścić Crestodian i otworzyć zwykłe TUI:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` i `openclaw terminal` nadal otwierają zwykłe
TUI agenta bezpośrednio. Nie uruchamiają Crestodian.

Po przełączeniu do zwykłego TUI użyj `/crestodian`, aby wrócić do Crestodian.
Możesz dodać dalsze żądanie:

```text
/crestodian
/crestodian restart gateway
```

Przełączenia agenta wewnątrz TUI pozostawiają ślad, że `/crestodian` jest dostępne.

## Tryb ratunkowy wiadomości

Tryb ratunkowy wiadomości to punkt wejścia Crestodian dla kanałów wiadomości. Jest przeznaczony
na sytuację, gdy Twój normalny agent nie działa, ale zaufany kanał, taki jak WhatsApp,
nadal odbiera polecenia.

Obsługiwane polecenie tekstowe:

- `/crestodian <request>`

Przepływ operatora:

```text
Ty, w zaufanym DM właściciela: /crestodian status
OpenClaw: Tryb ratunkowy Crestodian. Gateway osiągalny: nie. Konfiguracja poprawna: nie.
Ty: /crestodian restart gateway
OpenClaw: Plan: ponownie uruchomić Gateway. Odpowiedz /crestodian yes, aby zastosować.
Ty: /crestodian yes
OpenClaw: Zastosowano. Wpis audytu zapisany.
```

Tworzenie agentów można także kolejkować z lokalnego promptu lub trybu ratunkowego:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Zdalny tryb ratunkowy to powierzchnia administracyjna. Należy traktować go jak zdalną
naprawę konfiguracji, a nie jak zwykły czat.

Kontrakt bezpieczeństwa dla zdalnego trybu ratunkowego:

- Wyłączony, gdy aktywne jest sandboxing. Jeśli agent/sesja działa w sandboxie,
  Crestodian musi odmówić zdalnego trybu ratunkowego i wyjaśnić, że wymagana jest
  lokalna naprawa przez CLI.
- Domyślny efektywny stan to `auto`: zezwalaj na zdalny tryb ratunkowy tylko w zaufanej
  pracy YOLO, gdzie środowisko uruchomieniowe ma już niesandboxowane lokalne uprawnienia.
- Wymagaj jawnej tożsamości właściciela. Tryb ratunkowy nie może akceptować reguł
  nadawcy z wildcardem, otwartych zasad grupowych, nieuwierzytelnionych Webhook ani
  anonimowych kanałów.
- Domyślnie tylko DM-y właściciela. Tryb ratunkowy w grupach/kanałach wymaga jawnego opt-in.
- Zdalny tryb ratunkowy nie może otworzyć lokalnego TUI ani przełączyć do interaktywnej
  sesji agenta. Do przekazania agentowi użyj lokalnego `openclaw`.
- Trwałe zapisy nadal wymagają zatwierdzenia, nawet w trybie ratunkowym.
- Każdą zastosowaną operację ratunkową obejmij audytem. Tryb ratunkowy kanału wiadomości
  rejestruje kanał, konto, nadawcę i metadane adresu źródłowego. Operacje zmieniające
  konfigurację zapisują także hashe konfiguracji przed i po zmianie.
- Nigdy nie ujawniaj sekretów. Sprawdzanie SecretRef powinno raportować dostępność, a nie
  wartości.
- Jeśli Gateway działa, preferuj typowane operacje Gateway. Jeśli Gateway nie działa,
  używaj tylko minimalnej lokalnej powierzchni naprawczej, która nie zależy od zwykłej pętli agenta.

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

- `"auto"`: domyślnie. Zezwalaj tylko wtedy, gdy efektywne środowisko uruchomieniowe jest YOLO, a
  sandboxing jest wyłączony.
- `false`: nigdy nie zezwalaj na tryb ratunkowy kanału wiadomości.
- `true`: jawnie zezwalaj na tryb ratunkowy, gdy przejdą kontrole właściciela/kanału. To
  nadal nie może omijać odmowy wynikającej z sandboxingu.

Domyślna postawa YOLO dla `"auto"` to:

- tryb sandbox rozwiązuje się do `off`
- `tools.exec.security` rozwiązuje się do `full`
- `tools.exec.ask` rozwiązuje się do `off`

Zdalny tryb ratunkowy jest objęty ścieżką Docker:

```bash
pnpm test:docker:crestodian-rescue
```

Zapasowy lokalny planner bez konfiguracji jest objęty przez:

```bash
pnpm test:docker:crestodian-planner
```

Opcjonalny smoke test powierzchni poleceń kanału na żywo sprawdza `/crestodian status` oraz
trwały roundtrip zatwierdzenia przez handler ratunkowy:

```bash
pnpm test:live:crestodian-rescue-channel
```

Świeża konfiguracja od zera przez Crestodian jest objęta przez:

```bash
pnpm test:docker:crestodian-first-run
```

Ta ścieżka startuje z pustym katalogiem stanu, kieruje samo `openclaw` do Crestodian,
ustawia domyślny model, tworzy dodatkowego agenta, konfiguruje Discord przez
włączenie Plugin plus token SecretRef, sprawdza poprawność konfiguracji i kontroluje
dziennik audytu. QA Lab ma także scenariusz oparty na repo dla tego samego przepływu Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Doctor](/pl/cli/doctor)
- [TUI](/pl/cli/tui)
- [Sandbox](/pl/cli/sandbox)
- [Bezpieczeństwo](/pl/cli/security)
