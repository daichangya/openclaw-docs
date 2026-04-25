---
read_when:
    - Chcesz przyjazny dla początkujących przewodnik po TUI
    - Potrzebujesz pełnej listy funkcji, poleceń i skrótów TUI
summary: 'Terminal UI (TUI): połącz z Gateway lub uruchom lokalnie w trybie osadzonym'
title: TUI
x-i18n:
    generated_at: "2026-04-25T14:01:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6eaa938fb3a50b7478341fe51cafb09e352f6d3cb402373222153ed93531a5f5
    source_path: web/tui.md
    workflow: 15
---

## Szybki start

### Tryb Gateway

1. Uruchom Gateway.

```bash
openclaw gateway
```

2. Otwórz TUI.

```bash
openclaw tui
```

3. Wpisz wiadomość i naciśnij Enter.

Zdalny Gateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Użyj `--password`, jeśli Twój Gateway używa uwierzytelniania hasłem.

### Tryb lokalny

Uruchom TUI bez Gateway:

```bash
openclaw chat
# lub
openclaw tui --local
```

Uwagi:

- `openclaw chat` i `openclaw terminal` to aliasy `openclaw tui --local`.
- `--local` nie może być łączone z `--url`, `--token` ani `--password`.
- Tryb lokalny używa bezpośrednio osadzonego runtime agenta. Większość lokalnych narzędzi działa, ale funkcje tylko dla Gateway są niedostępne.
- `openclaw` i `openclaw crestodian` również używają tej powłoki TUI, a Crestodian działa jako lokalny backend czatu do konfiguracji i napraw.

## Co widzisz

- Nagłówek: URL połączenia, bieżący agent, bieżąca sesja.
- Log czatu: wiadomości użytkownika, odpowiedzi asystenta, komunikaty systemowe, karty narzędzi.
- Linia statusu: stan połączenia/uruchomienia (łączenie, uruchomione, streaming, idle, błąd).
- Stopka: stan połączenia + agent + sesja + model + think/fast/verbose/trace/reasoning + liczba tokenów + deliver.
- Wejście: edytor tekstu z autouzupełnianiem.

## Model mentalny: agenci + sesje

- Agenci to unikalne slugi (np. `main`, `research`). Gateway udostępnia ich listę.
- Sesje należą do bieżącego agenta.
- Klucze sesji są przechowywane jako `agent:<agentId>:<sessionKey>`.
  - Jeśli wpiszesz `/session main`, TUI rozwinie to do `agent:<currentAgent>:main`.
  - Jeśli wpiszesz `/session agent:other:main`, jawnie przełączysz się do sesji tego agenta.
- Zakres sesji:
  - `per-sender` (domyślnie): każdy agent ma wiele sesji.
  - `global`: TUI zawsze używa sesji `global` (selektor może być pusty).
- Bieżący agent + sesja są zawsze widoczne w stopce.

## Wysyłanie + dostarczanie

- Wiadomości są wysyłane do Gateway; dostarczanie do providerów jest domyślnie wyłączone.
- Włącz dostarczanie:
  - `/deliver on`
  - albo przez panel Settings
  - albo uruchamiając `openclaw tui --deliver`

## Selektory + nakładki

- Selektor modeli: lista dostępnych modeli i ustawienie nadpisania sesji.
- Selektor agentów: wybór innego agenta.
- Selektor sesji: pokazuje tylko sesje bieżącego agenta.
- Settings: przełączanie deliver, rozwijania wyników narzędzi i widoczności myślenia.

## Skróty klawiaturowe

- Enter: wyślij wiadomość
- Esc: przerwij aktywne uruchomienie
- Ctrl+C: wyczyść wejście (naciśnij dwa razy, aby wyjść)
- Ctrl+D: wyjdź
- Ctrl+L: selektor modeli
- Ctrl+G: selektor agentów
- Ctrl+P: selektor sesji
- Ctrl+O: przełącz rozwijanie wyników narzędzi
- Ctrl+T: przełącz widoczność myślenia (przeładowuje historię)

## Slash commandy

Rdzeniowe:

- `/help`
- `/status`
- `/agent <id>` (lub `/agents`)
- `/session <key>` (lub `/sessions`)
- `/model <provider/model>` (lub `/models`)

Sterowanie sesją:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Cykl życia sesji:

- `/new` lub `/reset` (reset sesji)
- `/abort` (przerywa aktywne uruchomienie)
- `/settings`
- `/exit`

Tylko w trybie lokalnym:

- `/auth [provider]` otwiera przepływ auth/logowania providera wewnątrz TUI.

Inne slash commandy Gateway (na przykład `/context`) są przekazywane do Gateway i pokazywane jako wyjście systemowe. Zobacz [Slash commands](/pl/tools/slash-commands).

## Lokalne polecenia powłoki

- Poprzedź linię `!`, aby uruchomić lokalne polecenie powłoki na hoście TUI.
- TUI pyta raz na sesję o zgodę na lokalne wykonanie; odmowa utrzymuje `!` jako wyłączone dla tej sesji.
- Polecenia są uruchamiane w świeżej, nieinteraktywnej powłoce w katalogu roboczym TUI (brak trwałego `cd`/env).
- Lokalne polecenia powłoki otrzymują `OPENCLAW_SHELL=tui-local` w swoim środowisku.
- Samotne `!` jest wysyłane jako zwykła wiadomość; początkowe spacje nie uruchamiają lokalnego exec.

## Naprawa konfiguracji z lokalnego TUI

Używaj trybu lokalnego, gdy bieżąca konfiguracja już przechodzi walidację i chcesz, aby
osadzony agent sprawdził ją na tej samej maszynie, porównał z dokumentacją
i pomógł naprawić dryf bez zależności od działającego Gateway.

Jeśli `openclaw config validate` już zwraca błąd, zacznij od `openclaw configure`
albo `openclaw doctor --fix`. `openclaw chat` nie omija ochrony przed nieprawidłową konfiguracją.

Typowa pętla:

1. Uruchom tryb lokalny:

```bash
openclaw chat
```

2. Zapytaj agenta, co chcesz sprawdzić, na przykład:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Użyj lokalnych poleceń powłoki dla dokładnych dowodów i walidacji:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Wprowadź wąskie zmiany za pomocą `openclaw config set` lub `openclaw configure`, a następnie ponownie uruchom `!openclaw config validate`.
5. Jeśli Doctor zaleca automatyczną migrację lub naprawę, przejrzyj ją i uruchom `!openclaw doctor --fix`.

Wskazówki:

- Preferuj `openclaw config set` lub `openclaw configure` zamiast ręcznej edycji `openclaw.json`.
- `openclaw docs "<query>"` przeszukuje indeks dokumentacji na żywo z tej samej maszyny.
- `openclaw config validate --json` jest przydatne, gdy chcesz mieć ustrukturyzowane błędy schematu i SecretRef/rozwiązywalności.

## Wyniki narzędzi

- Wywołania narzędzi są pokazywane jako karty z args + wynikami.
- Ctrl+O przełącza między widokiem zwiniętym/rozwiniętym.
- Gdy narzędzia działają, częściowe aktualizacje streamują do tej samej karty.

## Kolory terminala

- TUI zachowuje tekst odpowiedzi asystenta w domyślnym kolorze pierwszego planu terminala, dzięki czemu zarówno ciemne, jak i jasne terminale pozostają czytelne.
- Jeśli Twój terminal używa jasnego tła, a automatyczne wykrywanie jest błędne, ustaw `OPENCLAW_THEME=light` przed uruchomieniem `openclaw tui`.
- Aby zamiast tego wymusić oryginalną ciemną paletę, ustaw `OPENCLAW_THEME=dark`.

## Historia + streaming

- Po połączeniu TUI ładuje najnowszą historię (domyślnie 200 wiadomości).
- Odpowiedzi strumieniowane aktualizują się w miejscu aż do finalizacji.
- TUI nasłuchuje również zdarzeń narzędzi agenta, aby pokazywać bogatsze karty narzędzi.

## Szczegóły połączenia

- TUI rejestruje się w Gateway jako `mode: "tui"`.
- Ponowne połączenia pokazują komunikat systemowy; luki zdarzeń są ujawniane w logu.

## Opcje

- `--local`: uruchamia względem lokalnego osadzonego runtime agenta
- `--url <url>`: URL WebSocket Gateway (domyślnie z konfiguracji albo `ws://127.0.0.1:<port>`)
- `--token <token>`: token Gateway (jeśli wymagany)
- `--password <password>`: hasło Gateway (jeśli wymagane)
- `--session <key>`: klucz sesji (domyślnie: `main`, albo `global`, gdy zakres jest globalny)
- `--deliver`: dostarcza odpowiedzi asystenta do providera (domyślnie wyłączone)
- `--thinking <level>`: nadpisuje poziom myślenia dla wysyłek
- `--message <text>`: wysyła początkową wiadomość po połączeniu
- `--timeout-ms <ms>`: timeout agenta w ms (domyślnie z `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: liczba wpisów historii do załadowania (domyślnie `200`)

Uwaga: gdy ustawisz `--url`, TUI nie wraca do poświadczeń z konfiguracji ani środowiska.
Przekaż jawnie `--token` albo `--password`. Brak jawnych poświadczeń jest błędem.
W trybie lokalnym nie przekazuj `--url`, `--token` ani `--password`.

## Rozwiązywanie problemów

Brak wyniku po wysłaniu wiadomości:

- Uruchom `/status` w TUI, aby potwierdzić, że Gateway jest połączony i idle/busy.
- Sprawdź logi Gateway: `openclaw logs --follow`.
- Potwierdź, że agent może działać: `openclaw status` i `openclaw models status`.
- Jeśli oczekujesz wiadomości w kanale czatu, włącz dostarczanie (`/deliver on` lub `--deliver`).

## Rozwiązywanie problemów z połączeniem

- `disconnected`: upewnij się, że Gateway działa, a `--url/--token/--password` są poprawne.
- Brak agentów w selektorze: sprawdź `openclaw agents list` i swoją konfigurację routingu.
- Pusty selektor sesji: możesz być w zakresie globalnym albo nie mieć jeszcze żadnych sesji.

## Powiązane

- [Control UI](/pl/web/control-ui) — webowy interfejs sterowania
- [Config](/pl/cli/config) — sprawdzanie, walidacja i edycja `openclaw.json`
- [Doctor](/pl/cli/doctor) — naprawy z przewodnikiem i kontrole migracji
- [CLI Reference](/pl/cli) — pełna dokumentacja poleceń CLI
