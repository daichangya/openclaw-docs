---
read_when:
    - Dostosowywanie częstotliwości heartbeat lub treści komunikatów
    - Podejmowanie decyzji między heartbeat a cron dla zadań harmonogramowanych
summary: Komunikaty sondowania heartbeat i reguły powiadomień
title: Heartbeat
x-i18n:
    generated_at: "2026-04-11T02:44:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4485072148753076d909867a623696829bf4a82dcd0479b95d5d0cae43100b0
    source_path: gateway/heartbeat.md
    workflow: 15
---

# Heartbeat (Gateway)

> **Heartbeat czy cron?** Wskazówki, kiedy używać każdego z nich, znajdziesz w [Automatyzacja i zadania](/pl/automation).

Heartbeat uruchamia **okresowe tury agenta** w głównej sesji, aby model mógł
zasygnalizować wszystko, co wymaga uwagi, bez zasypywania Cię wiadomościami.

Heartbeat to zaplanowana tura głównej sesji — **nie** tworzy rekordów [zadań w tle](/pl/automation/tasks).
Rekordy zadań są przeznaczone dla pracy odłączonej (uruchomienia ACP, subagenci, izolowane zadania cron).

Rozwiązywanie problemów: [Zadania harmonogramowane](/pl/automation/cron-jobs#troubleshooting)

## Szybki start (dla początkujących)

1. Zostaw heartbeat włączony (domyślnie `30m`, lub `1h` dla uwierzytelniania Anthropic OAuth/token, w tym ponownego użycia Claude CLI) albo ustaw własną częstotliwość.
2. Utwórz małą listę kontrolną `HEARTBEAT.md` lub blok `tasks:` w przestrzeni roboczej agenta (opcjonalne, ale zalecane).
3. Zdecyduj, dokąd mają trafiać wiadomości heartbeat (`target: "none"` to wartość domyślna; ustaw `target: "last"`, aby kierować je do ostatniego kontaktu).
4. Opcjonalnie: włącz dostarczanie uzasadnienia heartbeat dla większej przejrzystości.
5. Opcjonalnie: użyj lekkiego kontekstu bootstrap, jeśli uruchomienia heartbeat potrzebują tylko `HEARTBEAT.md`.
6. Opcjonalnie: włącz izolowane sesje, aby uniknąć wysyłania pełnej historii rozmowy przy każdym heartbeat.
7. Opcjonalnie: ogranicz heartbeat do aktywnych godzin (czas lokalny).

Przykładowa konfiguracja:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // jawne dostarczanie do ostatniego kontaktu (domyślnie "none")
        directPolicy: "allow", // domyślnie: zezwalaj na cele bezpośrednie/DM; ustaw "block", aby je wyciszyć
        lightContext: true, // opcjonalne: wstrzykuj tylko HEARTBEAT.md z plików bootstrap
        isolatedSession: true, // opcjonalne: świeża sesja przy każdym uruchomieniu (bez historii rozmowy)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // opcjonalne: wyślij też osobną wiadomość `Reasoning:`
      },
    },
  },
}
```

## Wartości domyślne

- Interwał: `30m` (lub `1h`, gdy wykrytym trybem uwierzytelniania jest Anthropic OAuth/token, w tym ponowne użycie Claude CLI). Ustaw `agents.defaults.heartbeat.every` lub dla konkretnego agenta `agents.list[].heartbeat.every`; użyj `0m`, aby wyłączyć.
- Treść promptu (konfigurowalna przez `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Prompt heartbeat jest wysyłany **dosłownie** jako wiadomość użytkownika. Prompt systemowy zawiera sekcję „Heartbeat” tylko wtedy, gdy heartbeat jest włączony dla domyślnego agenta, a uruchomienie jest oznaczone wewnętrznie.
- Gdy heartbeat jest wyłączony przez `0m`, zwykłe uruchomienia również pomijają `HEARTBEAT.md` w kontekście bootstrap, aby model nie widział instrukcji tylko dla heartbeat.
- Aktywne godziny (`heartbeat.activeHours`) są sprawdzane w skonfigurowanej strefie czasowej.
  Poza tym oknem heartbeat są pomijane aż do kolejnego taktu wewnątrz okna.

## Do czego służy prompt heartbeat

Domyślny prompt jest celowo ogólny:

- **Zadania w tle**: „Consider outstanding tasks” zachęca agenta do przeglądu
  oczekujących działań następczych (skrzynka odbiorcza, kalendarz, przypomnienia, kolejka pracy) i sygnalizowania wszystkiego, co pilne.
- **Kontakt z człowiekiem**: „Checkup sometimes on your human during day time” zachęca
  do okazjonalnej lekkiej wiadomości w stylu „czy czegoś potrzebujesz?”, ale unika nocnego spamu
  dzięki użyciu skonfigurowanej lokalnej strefy czasowej (zobacz [/concepts/timezone](/pl/concepts/timezone)).

Heartbeat może reagować na ukończone [zadania w tle](/pl/automation/tasks), ale samo uruchomienie heartbeat nie tworzy rekordu zadania.

Jeśli chcesz, aby heartbeat robił coś bardzo konkretnego (np. „sprawdzaj statystyki Gmail PubSub”
lub „weryfikuj stan gateway”), ustaw `agents.defaults.heartbeat.prompt` (lub
`agents.list[].heartbeat.prompt`) na niestandardową treść (wysyłaną dosłownie).

## Kontrakt odpowiedzi

- Jeśli nic nie wymaga uwagi, odpowiedz **`HEARTBEAT_OK`**.
- Podczas uruchomień heartbeat OpenClaw traktuje `HEARTBEAT_OK` jako potwierdzenie, gdy pojawia się
  na **początku lub końcu** odpowiedzi. Token jest usuwany, a odpowiedź jest
  odrzucana, jeśli pozostała treść ma **≤ `ackMaxChars`** (domyślnie: 300).
- Jeśli `HEARTBEAT_OK` pojawi się **w środku** odpowiedzi, nie jest traktowane
  w specjalny sposób.
- W przypadku alertów **nie** dołączaj `HEARTBEAT_OK`; zwróć tylko tekst alertu.

Poza heartbeat przypadkowe `HEARTBEAT_OK` na początku/końcu wiadomości jest usuwane
i logowane; wiadomość składająca się wyłącznie z `HEARTBEAT_OK` jest odrzucana.

## Konfiguracja

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // domyślnie: 30m (0m wyłącza)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // domyślnie: false (dostarcz oddzielną wiadomość Reasoning:, gdy jest dostępna)
        lightContext: false, // domyślnie: false; true zachowuje tylko HEARTBEAT.md z plików bootstrap przestrzeni roboczej
        isolatedSession: false, // domyślnie: false; true uruchamia każdy heartbeat w świeżej sesji (bez historii rozmowy)
        target: "last", // domyślnie: none | opcje: last | none | <id kanału> (głównego lub pluginu, np. "bluebubbles")
        to: "+15551234567", // opcjonalne nadpisanie specyficzne dla kanału
        accountId: "ops-bot", // opcjonalny identyfikator kanału dla wielu kont
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // maksymalna liczba znaków dozwolona po HEARTBEAT_OK
      },
    },
  },
}
```

### Zakres i priorytet

- `agents.defaults.heartbeat` ustawia globalne zachowanie heartbeat.
- `agents.list[].heartbeat` scala się na wierzchu; jeśli jakikolwiek agent ma blok `heartbeat`, heartbeat uruchamiają **tylko ci agenci**.
- `channels.defaults.heartbeat` ustawia domyślne reguły widoczności dla wszystkich kanałów.
- `channels.<channel>.heartbeat` nadpisuje domyślne ustawienia kanałów.
- `channels.<channel>.accounts.<id>.heartbeat` (kanały z wieloma kontami) nadpisuje ustawienia dla konkretnego kanału.

### Heartbeat dla konkretnego agenta

Jeśli jakikolwiek wpis `agents.list[]` zawiera blok `heartbeat`, heartbeat uruchamiają
**tylko ci agenci**. Blok dla konkretnego agenta scala się na wierzchu `agents.defaults.heartbeat`
(dzięki czemu możesz raz ustawić współdzielone wartości domyślne i nadpisywać je dla poszczególnych agentów).

Przykład: dwóch agentów, heartbeat uruchamia tylko drugi agent.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // jawne dostarczanie do ostatniego kontaktu (domyślnie "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Przykład aktywnych godzin

Ogranicz heartbeat do godzin pracy w określonej strefie czasowej:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // jawne dostarczanie do ostatniego kontaktu (domyślnie "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // opcjonalne; używa userTimezone użytkownika, jeśli jest ustawiona, w przeciwnym razie strefy hosta
        },
      },
    },
  },
}
```

Poza tym oknem (przed 9:00 lub po 22:00 czasu wschodniego) heartbeat są pomijane. Następny zaplanowany takt wewnątrz okna uruchomi się normalnie.

### Konfiguracja 24/7

Jeśli chcesz, aby heartbeat działał przez cały dzień, użyj jednego z tych wzorców:

- Całkowicie pomiń `activeHours` (bez ograniczenia okna czasowego; to zachowanie domyślne).
- Ustaw całodniowe okno: `activeHours: { start: "00:00", end: "24:00" }`.

Nie ustawiaj tej samej godziny `start` i `end` (na przykład `08:00` do `08:00`).
Jest to traktowane jako okno o zerowej szerokości, więc heartbeat są zawsze pomijane.

### Przykład wielu kont

Użyj `accountId`, aby kierować do konkretnego konta na kanałach z wieloma kontami, takich jak Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // opcjonalne: kieruj do konkretnego tematu/wątku
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Uwagi do pól

- `every`: interwał heartbeat (ciąg czasu trwania; domyślną jednostką są minuty).
- `model`: opcjonalne nadpisanie modelu dla uruchomień heartbeat (`provider/model`).
- `includeReasoning`: po włączeniu dostarcza także oddzielną wiadomość `Reasoning:`, gdy jest dostępna (ten sam format co `/reasoning on`).
- `lightContext`: gdy ma wartość true, uruchomienia heartbeat używają lekkiego kontekstu bootstrap i zachowują tylko `HEARTBEAT.md` z plików bootstrap przestrzeni roboczej.
- `isolatedSession`: gdy ma wartość true, każde uruchomienie heartbeat działa w świeżej sesji bez wcześniejszej historii rozmowy. Używa tego samego wzorca izolacji co cron `sessionTarget: "isolated"`. Znacznie zmniejsza koszt tokenów na heartbeat. Połącz z `lightContext: true`, aby uzyskać maksymalne oszczędności. Trasowanie dostarczania nadal używa kontekstu głównej sesji.
- `session`: opcjonalny klucz sesji dla uruchomień heartbeat.
  - `main` (domyślnie): główna sesja agenta.
  - Jawny klucz sesji (skopiuj z `openclaw sessions --json` lub z [CLI sesji](/cli/sessions)).
  - Format kluczy sesji: zobacz [Sesje](/pl/concepts/session) i [Grupy](/pl/channels/groups).
- `target`:
  - `last`: dostarcz do ostatnio użytego zewnętrznego kanału.
  - jawny kanał: dowolny skonfigurowany kanał lub identyfikator pluginu, na przykład `discord`, `matrix`, `telegram` lub `whatsapp`.
  - `none` (domyślnie): uruchom heartbeat, ale **nie dostarczaj** go na zewnątrz.
- `directPolicy`: kontroluje zachowanie dostarczania bezpośredniego/DM:
  - `allow` (domyślnie): zezwalaj na dostarczanie heartbeat do celów bezpośrednich/DM.
  - `block`: wycisz dostarczanie bezpośrednie/DM (`reason=dm-blocked`).
- `to`: opcjonalne nadpisanie odbiorcy (identyfikator specyficzny dla kanału, np. E.164 dla WhatsApp lub identyfikator czatu Telegram). Dla tematów/wątków Telegram użyj `<chatId>:topic:<messageThreadId>`.
- `accountId`: opcjonalny identyfikator konta dla kanałów z wieloma kontami. Gdy `target: "last"`, identyfikator konta dotyczy rozwiązanego ostatniego kanału, jeśli obsługuje konta; w przeciwnym razie jest ignorowany. Jeśli identyfikator konta nie pasuje do skonfigurowanego konta dla rozwiązanego kanału, dostarczenie jest pomijane.
- `prompt`: nadpisuje domyślną treść promptu (bez scalania).
- `ackMaxChars`: maksymalna liczba znaków dozwolona po `HEARTBEAT_OK` przed dostarczeniem.
- `suppressToolErrorWarnings`: gdy ma wartość true, wycisza payloady ostrzeżeń o błędach narzędzi podczas uruchomień heartbeat.
- `activeHours`: ogranicza uruchomienia heartbeat do okna czasowego. Obiekt z `start` (HH:MM, włącznie; użyj `00:00` dla początku dnia), `end` (HH:MM, wyłącznie; `24:00` dozwolone dla końca dnia) oraz opcjonalnym `timezone`.
  - Pominięte lub `"user"`: używa `agents.defaults.userTimezone`, jeśli jest ustawione, w przeciwnym razie wraca do strefy czasowej systemu hosta.
  - `"local"`: zawsze używa strefy czasowej systemu hosta.
  - Dowolny identyfikator IANA (np. `America/New_York`): używany bezpośrednio; jeśli jest nieprawidłowy, następuje powrót do zachowania `"user"` opisanego wyżej.
  - `start` i `end` nie mogą być równe dla aktywnego okna; równe wartości są traktowane jako zerowa szerokość (zawsze poza oknem).
  - Poza aktywnym oknem heartbeat są pomijane aż do kolejnego taktu wewnątrz okna.

## Zachowanie dostarczania

- Heartbeat domyślnie uruchamiają się w głównej sesji agenta (`agent:<id>:<mainKey>`),
  albo w `global`, gdy `session.scope = "global"`. Ustaw `session`, aby nadpisać to
  na konkretną sesję kanału (Discord/WhatsApp/itd.).
- `session` wpływa tylko na kontekst uruchomienia; dostarczanie jest kontrolowane przez `target` i `to`.
- Aby dostarczać do konkretnego kanału/odbiorcy, ustaw `target` + `to`. Przy
  `target: "last"` dostarczanie używa ostatniego zewnętrznego kanału dla tej sesji.
- Dostarczanie heartbeat domyślnie zezwala na cele bezpośrednie/DM. Ustaw `directPolicy: "block"`, aby wyciszyć wysyłkę do celów bezpośrednich, nadal uruchamiając turę heartbeat.
- Jeśli główna kolejka jest zajęta, heartbeat jest pomijany i ponawiany później.
- Jeśli `target` nie rozwiązuje się do żadnego zewnętrznego miejsca docelowego, uruchomienie nadal następuje, ale żadna wiadomość wychodząca nie jest wysyłana.
- Jeśli `showOk`, `showAlerts` i `useIndicator` są wszystkie wyłączone, uruchomienie jest pomijane od razu jako `reason=alerts-disabled`.
- Jeśli wyłączone jest tylko dostarczanie alertów, OpenClaw nadal może uruchomić heartbeat, zaktualizować znaczniki czasu zadań wymagających wykonania, przywrócić znacznik czasu bezczynności sesji i wyciszyć zewnętrzny payload alertu.
- Odpowiedzi tylko heartbeat **nie** utrzymują sesji przy życiu; ostatnie `updatedAt`
  jest przywracane, aby wygaszanie bezczynności działało normalnie.
- Odłączone [zadania w tle](/pl/automation/tasks) mogą umieścić w kolejce zdarzenie systemowe i wybudzić heartbeat, gdy główna sesja powinna szybko coś zauważyć. Takie wybudzenie nie sprawia, że uruchomienie heartbeat staje się zadaniem w tle.

## Kontrola widoczności

Domyślnie potwierdzenia `HEARTBEAT_OK` są wyciszane, a treść alertów jest
dostarczana. Możesz dostosować to dla każdego kanału lub konta:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Ukryj HEARTBEAT_OK (domyślnie)
      showAlerts: true # Pokazuj komunikaty alertów (domyślnie)
      useIndicator: true # Emituj zdarzenia wskaźnika (domyślnie)
  telegram:
    heartbeat:
      showOk: true # Pokazuj potwierdzenia OK na Telegramie
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Wycisz dostarczanie alertów dla tego konta
```

Priorytet: dla konta → dla kanału → domyślne ustawienia kanałów → wbudowane wartości domyślne.

### Co robi każda flaga

- `showOk`: wysyła potwierdzenie `HEARTBEAT_OK`, gdy model zwróci odpowiedź zawierającą tylko OK.
- `showAlerts`: wysyła treść alertu, gdy model zwróci odpowiedź inną niż OK.
- `useIndicator`: emituje zdarzenia wskaźnika dla powierzchni statusu UI.

Jeśli **wszystkie trzy** mają wartość false, OpenClaw całkowicie pomija uruchomienie heartbeat (bez wywołania modelu).

### Przykłady dla kanału i konta

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # wszystkie konta Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # wycisz alerty tylko dla konta ops
  telegram:
    heartbeat:
      showOk: true
```

### Typowe wzorce

| Cel                                      | Konfiguracja                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Zachowanie domyślne (ciche OK, alerty włączone) | _(konfiguracja nie jest potrzebna)_                                                |
| Całkowicie cicho (bez wiadomości, bez wskaźnika) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Tylko wskaźnik (bez wiadomości)          | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }` |
| OK tylko w jednym kanale                 | `channels.telegram.heartbeat: { showOk: true }`                                         |

## HEARTBEAT.md (opcjonalnie)

Jeśli w przestrzeni roboczej istnieje plik `HEARTBEAT.md`, domyślny prompt mówi agentowi,
aby go odczytał. Potraktuj go jak swoją „listę kontrolną heartbeat”: małą, stabilną i
bezpieczną do dołączania co 30 minut.

Przy zwykłych uruchomieniach `HEARTBEAT.md` jest wstrzykiwany tylko wtedy, gdy wskazówki heartbeat są
włączone dla domyślnego agenta. Wyłączenie częstotliwości heartbeat przez `0m` lub
ustawienie `includeSystemPromptSection: false` pomija go w zwykłym kontekście bootstrap.

Jeśli `HEARTBEAT.md` istnieje, ale jest w praktyce pusty (tylko puste wiersze i nagłówki Markdown,
takie jak `# Heading`), OpenClaw pomija uruchomienie heartbeat, aby oszczędzić wywołania API.
To pominięcie jest zgłaszane jako `reason=empty-heartbeat-file`.
Jeśli pliku nie ma, heartbeat nadal się uruchamia, a model decyduje, co zrobić.

Utrzymuj go w małym rozmiarze (krótka lista kontrolna lub przypomnienia), aby uniknąć rozrostu promptu.

Przykładowy `HEARTBEAT.md`:

```md
# Lista kontrolna heartbeat

- Szybki przegląd: czy w skrzynkach odbiorczych jest coś pilnego?
- Jeśli jest dzień, zrób lekkie sprawdzenie, jeśli nic innego nie czeka.
- Jeśli zadanie jest zablokowane, zapisz _czego brakuje_ i zapytaj Petera następnym razem.
```

### Bloki `tasks:`

`HEARTBEAT.md` obsługuje również mały uporządkowany blok `tasks:` dla kontroli
opartych na interwałach wewnątrz samego heartbeat.

Przykład:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Sprawdź pilne nieprzeczytane e-maile i oznacz wszystko, co jest wrażliwe czasowo."
- name: calendar-scan
  interval: 2h
  prompt: "Sprawdź nadchodzące spotkania, które wymagają przygotowania lub działań następczych."

# Dodatkowe instrukcje

- Alerty mają być krótkie.
- Jeśli po wszystkich zadaniach wymagających wykonania nic nie wymaga uwagi, odpowiedz HEARTBEAT_OK.
```

Zachowanie:

- OpenClaw analizuje blok `tasks:` i sprawdza każde zadanie względem jego własnego `interval`.
- Tylko zadania **wymagające wykonania** są dołączane do promptu heartbeat dla danego taktu.
- Jeśli żadne zadania nie wymagają wykonania, heartbeat jest całkowicie pomijany (`reason=no-tasks-due`), aby uniknąć zmarnowanego wywołania modelu.
- Treść spoza zadań w `HEARTBEAT.md` jest zachowywana i dołączana jako dodatkowy kontekst po liście zadań wymagających wykonania.
- Znaczniki czasu ostatniego uruchomienia zadań są przechowywane w stanie sesji (`heartbeatTaskState`), więc interwały przetrwają zwykłe restarty.
- Znaczniki czasu zadań są przesuwane dopiero po tym, jak uruchomienie heartbeat zakończy normalną ścieżkę odpowiedzi. Pominięte uruchomienia `empty-heartbeat-file` / `no-tasks-due` nie oznaczają zadań jako ukończonych.

Tryb zadań jest przydatny, gdy chcesz, aby jeden plik heartbeat zawierał kilka okresowych kontroli bez ponoszenia kosztu wszystkich przy każdym takcie.

### Czy agent może aktualizować HEARTBEAT.md?

Tak — jeśli mu to zlecisz.

`HEARTBEAT.md` to po prostu zwykły plik w przestrzeni roboczej agenta, więc możesz powiedzieć agentowi
(w zwykłej rozmowie) coś w rodzaju:

- „Zaktualizuj `HEARTBEAT.md`, aby dodać codzienne sprawdzanie kalendarza.”
- „Przepisz `HEARTBEAT.md`, żeby był krótszy i skupiał się na działaniach następczych w skrzynce odbiorczej.”

Jeśli chcesz, aby działo się to proaktywnie, możesz też dodać jawną linijkę do
promptu heartbeat, na przykład: „Jeśli lista kontrolna stanie się nieaktualna, zaktualizuj HEARTBEAT.md
na lepszą.”

Uwaga dotycząca bezpieczeństwa: nie umieszczaj sekretów (kluczy API, numerów telefonów, prywatnych tokenów) w
`HEARTBEAT.md` — staje się on częścią kontekstu promptu.

## Ręczne wybudzanie (na żądanie)

Możesz umieścić w kolejce zdarzenie systemowe i natychmiast wywołać heartbeat poleceniem:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Jeśli wielu agentów ma skonfigurowany `heartbeat`, ręczne wybudzenie natychmiast uruchomi heartbeat każdego z nich.

Użyj `--mode next-heartbeat`, aby poczekać na następny zaplanowany takt.

## Dostarczanie uzasadnienia (opcjonalnie)

Domyślnie heartbeat dostarcza tylko końcowy payload „odpowiedzi”.

Jeśli chcesz większej przejrzystości, włącz:

- `agents.defaults.heartbeat.includeReasoning: true`

Po włączeniu heartbeat będą też dostarczać osobną wiadomość poprzedzoną
`Reasoning:` (ten sam format co `/reasoning on`). Może to być przydatne, gdy agent
zarządza wieloma sesjami/codexami i chcesz zobaczyć, dlaczego zdecydował się wysłać
wiadomość — ale może też ujawnić więcej szczegółów wewnętrznych, niż chcesz. Lepiej pozostawić to
wyłączone w czatach grupowych.

## Świadomość kosztów

Heartbeat uruchamiają pełne tury agenta. Krótsze interwały zużywają więcej tokenów. Aby zmniejszyć koszt:

- Użyj `isolatedSession: true`, aby uniknąć wysyłania pełnej historii rozmowy (~100 tys. tokenów do ~2–5 tys. na uruchomienie).
- Użyj `lightContext: true`, aby ograniczyć pliki bootstrap tylko do `HEARTBEAT.md`.
- Ustaw tańszy `model` (np. `ollama/llama3.2:1b`).
- Utrzymuj `HEARTBEAT.md` w małym rozmiarze.
- Użyj `target: "none"`, jeśli chcesz tylko wewnętrznych aktualizacji stanu.

## Powiązane

- [Automatyzacja i zadania](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania w tle](/pl/automation/tasks) — jak śledzona jest praca odłączona
- [Strefa czasowa](/pl/concepts/timezone) — jak strefa czasowa wpływa na harmonogram heartbeat
- [Rozwiązywanie problemów](/pl/automation/cron-jobs#troubleshooting) — debugowanie problemów z automatyzacją
