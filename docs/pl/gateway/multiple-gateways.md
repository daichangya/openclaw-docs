---
read_when:
    - Uruchamianie więcej niż jednego Gateway na tej samej maszynie.
    - Potrzebujesz odizolowanej konfiguracji/stanu/portów dla każdego Gateway.
summary: Uruchamianie wielu Gateway OpenClaw na jednym hoście (izolacja, porty i profile)
title: Wiele Gatewayów
x-i18n:
    generated_at: "2026-04-25T13:48:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6477a16dc55b694cb73ad6b5140e94529071bad8fc2100ecca88daaa31f9c3c0
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

W większości konfiguracji należy używać jednego Gateway, ponieważ pojedynczy Gateway może obsługiwać wiele połączeń komunikacyjnych i agentów. Jeśli potrzebujesz silniejszej izolacji lub nadmiarowości (np. rescue bota), uruchom osobne Gatewaye z odizolowanymi profilami/portami.

## Najbardziej zalecana konfiguracja

Dla większości użytkowników najprostsza konfiguracja rescue bota to:

- pozostawienie głównego bota na domyślnym profilu
- uruchomienie rescue bota z `--profile rescue`
- użycie całkowicie osobnego bota Telegram dla konta rescue
- utrzymywanie rescue bota na innym porcie bazowym, takim jak `19789`

Dzięki temu rescue bot jest odizolowany od głównego bota, więc może debugować lub stosować
zmiany konfiguracji, jeśli główny bot nie działa. Zachowaj co najmniej 20 portów odstępu między
portami bazowymi, aby pochodne porty browser/canvas/CDP nigdy się nie zderzyły.

## Szybki start rescue bota

Używaj tego jako domyślnej ścieżki, chyba że masz silny powód, by zrobić coś
innego:

```bash
# Rescue bot (osobny bot Telegram, osobny profil, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Jeśli Twój główny bot już działa, zazwyczaj to wszystko, czego potrzebujesz.

Podczas `openclaw --profile rescue onboard`:

- użyj osobnego tokena bota Telegram
- zachowaj profil `rescue`
- użyj portu bazowego co najmniej 20 wyższego niż dla głównego bota
- zaakceptuj domyślny obszar roboczy rescue, chyba że już zarządzasz własnym

Jeśli onboarding już zainstalował usługę rescue, końcowe
`gateway install` nie jest potrzebne.

## Dlaczego to działa

Rescue bot pozostaje niezależny, ponieważ ma własne:

- profil/konfigurację
- katalog stanu
- obszar roboczy
- port bazowy (plus porty pochodne)
- token bota Telegram

W większości konfiguracji używaj całkowicie osobnego bota Telegram dla profilu rescue:

- łatwo utrzymać go jako wyłącznie operatorski
- osobny token i tożsamość bota
- niezależność od instalacji kanału/aplikacji głównego bota
- prosta ścieżka odzyskiwania oparta na DM, gdy główny bot jest uszkodzony

## Co zmienia `--profile rescue onboard`

`openclaw --profile rescue onboard` używa normalnego przepływu onboardingu, ale
zapisuje wszystko w osobnym profilu.

W praktyce oznacza to, że rescue bot dostaje własne:

- plik konfiguracji
- katalog stanu
- obszar roboczy (domyślnie `~/.openclaw/workspace-rescue`)
- nazwę zarządzanej usługi

Poza tym prompty są takie same jak przy zwykłym onboardingu.

## Ogólna konfiguracja wielu Gatewayów

Powyższy układ rescue bota to najłatwiejsza opcja domyślna, ale ten sam wzorzec izolacji
działa dla dowolnej pary lub grupy Gatewayów na jednym hoście.

W bardziej ogólnej konfiguracji nadaj każdemu dodatkowemu Gatewayowi własny nazwany profil i
własny port bazowy:

```bash
# główny (profil domyślny)
openclaw setup
openclaw gateway --port 18789

# dodatkowy gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Jeśli chcesz, aby oba Gatewaye używały nazwanych profili, to też działa:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Usługi stosują ten sam wzorzec:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Użyj szybkiego startu rescue bota, gdy chcesz mieć zapasową ścieżkę operatorską. Użyj
ogólnego wzorca profili, gdy chcesz mieć wiele długotrwale działających Gatewayów dla
różnych kanałów, tenantów, obszarów roboczych lub ról operacyjnych.

## Lista kontrolna izolacji

Zachowaj unikalność tych elementów dla każdej instancji Gateway:

- `OPENCLAW_CONFIG_PATH` — plik konfiguracji dla instancji
- `OPENCLAW_STATE_DIR` — sesje, dane uwierzytelniające, cache dla instancji
- `agents.defaults.workspace` — katalog główny obszaru roboczego dla instancji
- `gateway.port` (lub `--port`) — unikalny dla każdej instancji
- pochodne porty browser/canvas/CDP

Jeśli będą współdzielone, wystąpią konflikty konfiguracji i portów.

## Mapowanie portów (pochodne)

Port bazowy = `gateway.port` (lub `OPENCLAW_GATEWAY_PORT` / `--port`).

- port usługi sterowania przeglądarką = baza + 2 (tylko loopback)
- host canvas jest serwowany przez serwer HTTP Gateway (ten sam port co `gateway.port`)
- porty Browser profile CDP są automatycznie przydzielane z zakresu `browser.controlPort + 9 .. + 108`

Jeśli nadpisujesz którykolwiek z nich w konfiguracji lub env, muszą pozostać unikalne dla każdej instancji.

## Uwagi o Browser/CDP (częsta pułapka)

- **Nie** przypinaj `browser.cdpUrl` do tych samych wartości w wielu instancjach.
- Każda instancja potrzebuje własnego portu sterowania przeglądarką i własnego zakresu CDP (pochodnego od portu gateway).
- Jeśli potrzebujesz jawnych portów CDP, ustaw `browser.profiles.<name>.cdpPort` dla każdej instancji.
- Zdalny Chrome: użyj `browser.profiles.<name>.cdpUrl` (dla każdego profilu, dla każdej instancji).

## Przykład ręcznego env

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## Szybkie kontrole

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Interpretacja:

- `gateway status --deep` pomaga wykryć przestarzałe usługi launchd/systemd/schtasks ze starszych instalacji.
- Tekst ostrzeżenia `gateway probe`, taki jak `multiple reachable gateways detected`, jest oczekiwany tylko wtedy, gdy celowo uruchamiasz więcej niż jeden odizolowany gateway.

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Blokada Gateway](/pl/gateway/gateway-lock)
- [Konfiguracja](/pl/gateway/configuration)
