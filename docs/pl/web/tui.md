---
read_when:
    - Chcesz przyjaznego dla początkujących przewodnika po TUI
    - 'Potrzebujesz pełnej listy funkcji TUI, poleceń i skrótów аиҳassistant to=functions.read კომენტary  彩票天天乐json  force_parallel: false} code'
summary: 'Interfejs terminalowy (TUI): połączenie z Gateway lub uruchomienie lokalnie w trybie osadzonym'
title: TUI
x-i18n:
    generated_at: "2026-04-23T10:11:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: df3ddbe41cb7d92b9cde09a4d1443d26579b4e1cfc92dce6bbc37eed4d8af8fa
    source_path: web/tui.md
    workflow: 15
---

# TUI (interfejs terminalowy)

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

- `openclaw chat` i `openclaw terminal` to aliasy dla `openclaw tui --local`.
- `--local` nie może być łączone z `--url`, `--token` ani `--password`.
- Tryb lokalny używa bezpośrednio osadzonego runtime agenta. Większość lokalnych narzędzi działa, ale funkcje dostępne tylko przez Gateway są niedostępne.

## Co widzisz

- Nagłówek: URL połączenia, bieżący agent, bieżąca sesja.
- Dziennik czatu: wiadomości użytkownika, odpowiedzi asystenta, komunikaty systemowe, karty narzędzi.
- Linia statusu: stan połączenia / uruchomienia (`connecting`, `running`, `streaming`, `idle`, `error`).
- Stopka: stan połączenia + agent + sesja + model + think / fast / verbose / trace / reasoning + liczba tokenów + deliver.
- Pole wejściowe: edytor tekstu z autouzupełnianiem.

## Model mentalny: agenci + sesje

- Agenci to unikalne identyfikatory slug (np. `main`, `research`). Gateway udostępnia ich listę.
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
  - lub w panelu Ustawienia
  - lub uruchom przez `openclaw tui --deliver`

## Selektory + nakładki

- Selektor modeli: lista dostępnych modeli i ustawienie nadpisania sesji.
- Selektor agentów: wybór innego agenta.
- Selektor sesji: pokazuje tylko sesje bieżącego agenta.
- Ustawienia: przełączanie deliver, rozwijania wyników narzędzi i widoczności thinking.

## Skróty klawiaturowe

- Enter: wyślij wiadomość
- Esc: przerwij aktywne uruchomienie
- Ctrl+C: wyczyść pole wejściowe (naciśnij dwa razy, aby wyjść)
- Ctrl+D: wyjdź
- Ctrl+L: selektor modeli
- Ctrl+G: selektor agentów
- Ctrl+P: selektor sesji
- Ctrl+O: przełącz rozwijanie wyników narzędzi
- Ctrl+T: przełącz widoczność thinking (przeładowuje historię)

## Slash commands

Podstawowe:

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
- `/abort` (przerwanie aktywnego uruchomienia)
- `/settings`
- `/exit`

Tylko tryb lokalny:

- `/auth [provider]` otwiera przepływ auth / logowania providera wewnątrz TUI.

Inne slash commands Gateway (na przykład `/context`) są przekazywane do Gateway i pokazywane jako wyjście systemowe. Zobacz [Slash commands](/pl/tools/slash-commands).

## Lokalne polecenia powłoki

- Dodaj prefiks `!` na początku wiersza, aby uruchomić lokalne polecenie powłoki na hoście TUI.
- TUI pyta raz na sesję o zgodę na lokalne wykonywanie; odmowa pozostawia `!` wyłączone dla tej sesji.
- Polecenia uruchamiane są w nowej, nieinteraktywnej powłoce w katalogu roboczym TUI (bez trwałego `cd` / env).
- Lokalne polecenia powłoki otrzymują w środowisku `OPENCLAW_SHELL=tui-local`.
- Samotne `!` jest wysyłane jako zwykła wiadomość; spacje na początku nie uruchamiają lokalnego exec.

## Naprawianie konfiguracji z lokalnego TUI

Używaj trybu lokalnego, gdy bieżąca konfiguracja już przechodzi walidację i chcesz, aby
osadzony agent sprawdził ją na tej samej maszynie, porównał z dokumentacją
i pomógł naprawić dryf bez zależności od działającego Gateway.

Jeśli `openclaw config validate` już kończy się niepowodzeniem, zacznij od `openclaw configure`
lub `openclaw doctor --fix`. `openclaw chat` nie omija zabezpieczenia
przed nieprawidłową konfiguracją.

Typowa pętla:

1. Uruchom tryb lokalny:

```bash
openclaw chat
```

2. Zapytaj agenta, co chcesz sprawdzić, na przykład:

```text
Porównaj moją konfigurację uwierzytelniania gateway z dokumentacją i zaproponuj najmniejszą poprawkę.
```

3. Używaj lokalnych poleceń powłoki dla dokładnych dowodów i walidacji:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Zastosuj wąskie zmiany przez `openclaw config set` lub `openclaw configure`, a następnie ponownie uruchom `!openclaw config validate`.
5. Jeśli Doctor zaleca automatyczną migrację lub naprawę, przejrzyj ją i uruchom `!openclaw doctor --fix`.

Wskazówki:

- Preferuj `openclaw config set` lub `openclaw configure` zamiast ręcznej edycji `openclaw.json`.
- `openclaw docs "<query>"` przeszukuje indeks aktywnej dokumentacji z tej samej maszyny.
- `openclaw config validate --json` przydaje się, gdy chcesz ustrukturyzowanych błędów schematu i SecretRef / rozwiązywalności.

## Wyniki narzędzi

- Wywołania narzędzi są pokazywane jako karty z argumentami + wynikami.
- Ctrl+O przełącza między widokiem zwiniętym / rozwiniętym.
- Gdy narzędzia działają, częściowe aktualizacje są strumieniowane do tej samej karty.

## Kolory terminala

- TUI utrzymuje tekst treści asystenta w domyślnym kolorze pierwszego planu terminala, dzięki czemu zarówno ciemne, jak i jasne terminale pozostają czytelne.
- Jeśli Twój terminal używa jasnego tła i autodetekcja jest błędna, ustaw `OPENCLAW_THEME=light` przed uruchomieniem `openclaw tui`.
- Aby zamiast tego wymusić oryginalną ciemną paletę, ustaw `OPENCLAW_THEME=dark`.

## Historia + strumieniowanie

- Po połączeniu TUI wczytuje najnowszą historię (domyślnie 200 wiadomości).
- Odpowiedzi strumieniowane są aktualizowane na miejscu aż do finalizacji.
- TUI nasłuchuje też zdarzeń narzędzi agenta, aby pokazywać bogatsze karty narzędzi.

## Szczegóły połączenia

- TUI rejestruje się w Gateway jako `mode: "tui"`.
- Ponowne połączenia pokazują komunikat systemowy; luki zdarzeń są ujawniane w dzienniku.

## Opcje

- `--local`: uruchamianie względem lokalnego osadzonego runtime agenta
- `--url <url>`: URL WebSocket Gateway (domyślnie z konfiguracji lub `ws://127.0.0.1:<port>`)
- `--token <token>`: token Gateway (jeśli wymagany)
- `--password <password>`: hasło Gateway (jeśli wymagane)
- `--session <key>`: klucz sesji (domyślnie: `main` lub `global`, gdy zakres jest globalny)
- `--deliver`: dostarczanie odpowiedzi asystenta do providera (domyślnie wyłączone)
- `--thinking <level>`: nadpisanie poziomu thinking dla wysyłek
- `--message <text>`: wyślij początkową wiadomość po połączeniu
- `--timeout-ms <ms>`: timeout agenta w ms (domyślnie zgodny z `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: liczba wpisów historii do wczytania (domyślnie `200`)

Uwaga: gdy ustawisz `--url`, TUI nie przechodzi awaryjnie do poświadczeń z konfiguracji ani środowiska.
Przekaż jawnie `--token` lub `--password`. Brak jawnych poświadczeń jest błędem.
W trybie lokalnym nie przekazuj `--url`, `--token` ani `--password`.

## Rozwiązywanie problemów

Brak wyjścia po wysłaniu wiadomości:

- Uruchom `/status` w TUI, aby potwierdzić, że Gateway jest połączony i w stanie idle / busy.
- Sprawdź logi Gateway: `openclaw logs --follow`.
- Potwierdź, że agent może działać: `openclaw status` i `openclaw models status`.
- Jeśli oczekujesz wiadomości w kanale czatu, włącz dostarczanie (`/deliver on` lub `--deliver`).

## Rozwiązywanie problemów z połączeniem

- `disconnected`: upewnij się, że Gateway działa oraz że `--url` / `--token` / `--password` są poprawne.
- Brak agentów w selektorze: sprawdź `openclaw agents list` i konfigurację routingu.
- Pusty selektor sesji: możesz być w zakresie globalnym lub nie mieć jeszcze żadnych sesji.

## Powiązane

- [UI Control](/pl/web/control-ui) — webowy interfejs sterowania
- [Config](/pl/cli/config) — sprawdzanie, walidacja i edycja `openclaw.json`
- [Doctor](/pl/cli/doctor) — prowadzone naprawy i kontrole migracji
- [Dokumentacja CLI](/pl/cli) — pełna dokumentacja poleceń CLI
