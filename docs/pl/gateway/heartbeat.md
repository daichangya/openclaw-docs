---
read_when:
    - Dostosowywanie częstotliwości heartbeat lub komunikatów
    - Wybór między heartbeat a cron dla zaplanowanych zadań
summary: Komunikaty odpytywania heartbeat i reguły powiadomień
title: Heartbeat
x-i18n:
    generated_at: "2026-04-08T02:15:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8021d747637060eacb91ec5f75904368a08790c19f4fca32acda8c8c0a25e41
    source_path: gateway/heartbeat.md
    workflow: 15
---

# Heartbeat (Gateway)

> **Heartbeat czy Cron?** Zobacz [Automatyzacja i zadania](/pl/automation), aby dowiedzieć się, kiedy używać każdego z nich.

Heartbeat uruchamia **okresowe tury agenta** w głównej sesji, aby model mógł
zwracać uwagę na wszystko, co wymaga uwagi, bez spamowania Cię.

Heartbeat to zaplanowana tura głównej sesji — **nie** tworzy rekordów [zadań w tle](/pl/automation/tasks).
Rekordy zadań służą do pracy odłączonej (uruchomienia ACP, subagenci, izolowane zadania cron).

Rozwiązywanie problemów: [Zaplanowane zadania](/pl/automation/cron-jobs#troubleshooting)

## Szybki start (dla początkujących)

1. Pozostaw heartbeat włączony (domyślnie `30m` lub `1h` dla uwierzytelniania Anthropic OAuth/token, w tym ponownego użycia Claude CLI) albo ustaw własną częstotliwość.
2. Utwórz małą listę kontrolną `HEARTBEAT.md` lub blok `tasks:` w obszarze roboczym agenta (opcjonalne, ale zalecane).
3. Zdecyduj, gdzie mają trafiać komunikaty heartbeat (`target: "none"` jest domyślne; ustaw `target: "last"`, aby kierować je do ostatniego kontaktu).
4. Opcjonalnie: włącz dostarczanie rozumowania heartbeat dla większej przejrzystości.
5. Opcjonalnie: użyj lekkiego kontekstu początkowego, jeśli uruchomienia heartbeat potrzebują tylko `HEARTBEAT.md`.
6. Opcjonalnie: włącz izolowane sesje, aby nie wysyłać całej historii rozmowy przy każdym heartbeat.
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
        lightContext: true, // opcjonalne: wstrzykuj tylko HEARTBEAT.md z plików bootstrap kontekstu
        isolatedSession: true, // opcjonalne: świeża sesja przy każdym uruchomieniu (bez historii rozmowy)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // opcjonalne: wysyłaj też osobny komunikat `Reasoning:`
      },
    },
  },
}
```

## Ustawienia domyślne

- Interwał: `30m` (lub `1h`, gdy wykrytym trybem uwierzytelniania jest Anthropic OAuth/token, w tym ponowne użycie Claude CLI). Ustaw `agents.defaults.heartbeat.every` lub dla konkretnego agenta `agents.list[].heartbeat.every`; użyj `0m`, aby wyłączyć.
- Treść promptu (konfigurowalna przez `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Prompt heartbeat jest wysyłany **dosłownie** jako wiadomość użytkownika. Prompt
  systemowy zawiera sekcję „Heartbeat” tylko wtedy, gdy heartbeat jest włączony dla
  domyślnego agenta, a uruchomienie jest oznaczone wewnętrznie.
- Gdy heartbeat jest wyłączony przez `0m`, zwykłe uruchomienia także pomijają `HEARTBEAT.md`
  z kontekstu bootstrap, aby model nie widział instrukcji przeznaczonych wyłącznie dla heartbeat.
- Aktywne godziny (`heartbeat.activeHours`) są sprawdzane w skonfigurowanej strefie czasowej.
  Poza tym oknem heartbeat jest pomijany aż do następnego tyknięcia w obrębie okna.

## Do czego służy prompt heartbeat

Domyślny prompt jest celowo szeroki:

- **Zadania w tle**: „Rozważ zaległe zadania” zachęca agenta do przeglądu
  działań następczych (skrzynka odbiorcza, kalendarz, przypomnienia, kolejka pracy) i sygnalizowania wszystkiego, co pilne.
- **Kontakt z człowiekiem**: „Sprawdź czasem swojego człowieka w ciągu dnia” zachęca do
  okazjonalnego lekkiego komunikatu w rodzaju „czy czegoś potrzebujesz?”, ale unika nocnego spamu
  dzięki użyciu skonfigurowanej lokalnej strefy czasowej (zobacz [/concepts/timezone](/pl/concepts/timezone)).

Heartbeat może reagować na ukończone [zadania w tle](/pl/automation/tasks), ale samo uruchomienie heartbeat nie tworzy rekordu zadania.

Jeśli chcesz, aby heartbeat robił coś bardzo konkretnego (np. „sprawdź statystyki Gmail PubSub”
lub „zweryfikuj stan gateway”), ustaw `agents.defaults.heartbeat.prompt` (lub
`agents.list[].heartbeat.prompt`) na własną treść (wysyłaną dosłownie).

## Kontrakt odpowiedzi

- Jeśli nic nie wymaga uwagi, odpowiedz **`HEARTBEAT_OK`**.
- Podczas uruchomień heartbeat OpenClaw traktuje `HEARTBEAT_OK` jako potwierdzenie, gdy pojawia się
  na **początku lub końcu** odpowiedzi. Token jest usuwany, a odpowiedź
  odrzucana, jeśli pozostała treść ma **≤ `ackMaxChars`** (domyślnie: 300).
- Jeśli `HEARTBEAT_OK` pojawia się **w środku** odpowiedzi, nie jest traktowany
  specjalnie.
- W przypadku alertów **nie** dołączaj `HEARTBEAT_OK`; zwróć tylko treść alertu.

Poza heartbeat przypadkowe `HEARTBEAT_OK` na początku/końcu wiadomości jest usuwane
i logowane; wiadomość będąca wyłącznie `HEARTBEAT_OK` jest odrzucana.

## Konfiguracja

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // domyślnie: 30m (0m wyłącza)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // domyślnie: false (dostarczaj osobny komunikat Reasoning:, gdy dostępny)
        lightContext: false, // domyślnie: false; true zachowuje tylko HEARTBEAT.md z plików bootstrap obszaru roboczego
        isolatedSession: false, // domyślnie: false; true uruchamia każdy heartbeat w świeżej sesji (bez historii rozmowy)
        target: "last", // domyślnie: none | opcje: last | none | <id kanału> (rdzeń lub plugin, np. "bluebubbles")
        to: "+15551234567", // opcjonalne nadpisanie specyficzne dla kanału
        accountId: "ops-bot", // opcjonalny identyfikator kanału dla wielu kont
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // maksymalna liczba znaków dozwolona po HEARTBEAT_OK
      },
    },
  },
}
```

### Zakres i pierwszeństwo

- `agents.defaults.heartbeat` ustawia globalne zachowanie heartbeat.
- `agents.list[].heartbeat` nakłada się na to; jeśli jakikolwiek agent ma blok `heartbeat`, heartbeat uruchamiają **tylko ci agenci**.
- `channels.defaults.heartbeat` ustawia domyślną widoczność dla wszystkich kanałów.
- `channels.<channel>.heartbeat` nadpisuje ustawienia domyślne kanałów.
- `channels.<channel>.accounts.<id>.heartbeat` (kanały z wieloma kontami) nadpisuje ustawienia dla danego kanału.

### Heartbeat dla konkretnego agenta

Jeśli dowolny wpis `agents.list[]` zawiera blok `heartbeat`, heartbeat uruchamiają
**tylko ci agenci**. Blok per-agent nakłada się na `agents.defaults.heartbeat`
(dzięki czemu możesz raz ustawić wspólne wartości domyślne i nadpisać je dla poszczególnych agentów).

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
          timezone: "America/New_York", // opcjonalne; używa userTimezone, jeśli jest ustawione, w przeciwnym razie strefy hosta
        },
      },
    },
  },
}
```

Poza tym oknem (przed 9:00 lub po 22:00 czasu wschodniego) heartbeat jest pomijany. Następne zaplanowane tyknięcie w obrębie okna uruchomi się normalnie.

### Konfiguracja 24/7

Jeśli chcesz, aby heartbeat działał przez całą dobę, użyj jednego z tych wzorców:

- Całkowicie pomiń `activeHours` (brak ograniczenia okna czasowego; to zachowanie domyślne).
- Ustaw pełnodobowe okno: `activeHours: { start: "00:00", end: "24:00" }`.

Nie ustawiaj tej samej godziny dla `start` i `end` (na przykład `08:00` do `08:00`).
Jest to traktowane jako okno o zerowej szerokości, więc heartbeat jest zawsze pomijany.

### Przykład wielu kont

Użyj `accountId`, aby kierować do konkretnego konta w kanałach z wieloma kontami, takich jak Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // opcjonalne: kierowanie do konkretnego tematu/wątku
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

- `every`: interwał heartbeat (ciąg czasu trwania; domyślna jednostka = minuty).
- `model`: opcjonalne nadpisanie modelu dla uruchomień heartbeat (`provider/model`).
- `includeReasoning`: gdy włączone, dostarcza też osobny komunikat `Reasoning:`, gdy jest dostępny (ten sam format co `/reasoning on`).
- `lightContext`: gdy true, uruchomienia heartbeat używają lekkiego kontekstu bootstrap i zachowują tylko `HEARTBEAT.md` z plików bootstrap obszaru roboczego.
- `isolatedSession`: gdy true, każdy heartbeat działa w świeżej sesji bez wcześniejszej historii rozmowy. Używa tego samego wzorca izolacji co cron `sessionTarget: "isolated"`. Drastycznie zmniejsza koszt tokenów na jeden heartbeat. Połącz z `lightContext: true`, aby uzyskać maksymalne oszczędności. Routowanie dostarczania nadal używa kontekstu głównej sesji.
- `session`: opcjonalny klucz sesji dla uruchomień heartbeat.
  - `main` (domyślnie): główna sesja agenta.
  - Jawny klucz sesji (skopiuj z `openclaw sessions --json` lub z [sessions CLI](/cli/sessions)).
  - Formaty kluczy sesji: zobacz [Sesje](/pl/concepts/session) i [Grupy](/pl/channels/groups).
- `target`:
  - `last`: dostarczaj do ostatnio użytego zewnętrznego kanału.
  - jawny kanał: dowolny skonfigurowany kanał lub identyfikator pluginu, na przykład `discord`, `matrix`, `telegram` lub `whatsapp`.
  - `none` (domyślnie): uruchom heartbeat, ale **nie dostarczaj** go na zewnątrz.
- `directPolicy`: steruje zachowaniem dostarczania bezpośredniego/DM:
  - `allow` (domyślnie): zezwalaj na bezpośrednie/DM dostarczanie heartbeat.
  - `block`: wycisz dostarczanie bezpośrednie/DM (`reason=dm-blocked`).
- `to`: opcjonalne nadpisanie odbiorcy (identyfikator specyficzny dla kanału, np. E.164 dla WhatsApp lub identyfikator czatu Telegram). Dla tematów/wątków Telegram użyj `<chatId>:topic:<messageThreadId>`.
- `accountId`: opcjonalny identyfikator konta dla kanałów z wieloma kontami. Gdy `target: "last"`, identyfikator konta ma zastosowanie do rozstrzygniętego ostatniego kanału, jeśli obsługuje konta; w przeciwnym razie jest ignorowany. Jeśli identyfikator konta nie pasuje do skonfigurowanego konta dla rozstrzygniętego kanału, dostarczenie jest pomijane.
- `prompt`: nadpisuje domyślną treść promptu (bez scalania).
- `ackMaxChars`: maksymalna liczba znaków dozwolona po `HEARTBEAT_OK` przed dostarczeniem.
- `suppressToolErrorWarnings`: gdy true, wycisza ładunki ostrzeżeń o błędach narzędzi podczas uruchomień heartbeat.
- `activeHours`: ogranicza uruchomienia heartbeat do okna czasowego. Obiekt z `start` (HH:MM, włącznie; użyj `00:00` dla początku dnia), `end` (HH:MM, wyłącznie; `24:00` dozwolone dla końca dnia) oraz opcjonalnym `timezone`.
  - Pominięte lub `"user"`: używa Twojego `agents.defaults.userTimezone`, jeśli jest ustawione, w przeciwnym razie wraca do strefy czasowej systemu hosta.
  - `"local"`: zawsze używa strefy czasowej systemu hosta.
  - Dowolny identyfikator IANA (np. `America/New_York`): używany bezpośrednio; jeśli jest nieprawidłowy, wraca do zachowania `"user"` opisanego wyżej.
  - `start` i `end` nie mogą być równe dla aktywnego okna; równe wartości są traktowane jako zerowa szerokość (zawsze poza oknem).
  - Poza aktywnym oknem heartbeat jest pomijany aż do następnego tyknięcia w obrębie okna.

## Zachowanie dostarczania

- Heartbeat domyślnie działa w głównej sesji agenta (`agent:<id>:<mainKey>`),
  lub `global`, gdy `session.scope = "global"`. Ustaw `session`, aby nadpisać na
  konkretną sesję kanału (Discord/WhatsApp/itp.).
- `session` wpływa tylko na kontekst uruchomienia; dostarczaniem sterują `target` i `to`.
- Aby dostarczać do konkretnego kanału/odbiorcy, ustaw `target` + `to`. Przy
  `target: "last"` dostarczanie używa ostatniego zewnętrznego kanału dla tej sesji.
- Dostarczenia heartbeat domyślnie zezwalają na cele bezpośrednie/DM. Ustaw `directPolicy: "block"`, aby wyciszyć wysyłki do celów bezpośrednich, nadal uruchamiając turę heartbeat.
- Jeśli główna kolejka jest zajęta, heartbeat jest pomijany i ponawiany później.
- Jeśli `target` nie rozstrzyga się do zewnętrznego miejsca docelowego, uruchomienie nadal następuje, ale
  wiadomość wychodząca nie jest wysyłana.
- Jeśli `showOk`, `showAlerts` i `useIndicator` są wszystkie wyłączone, uruchomienie jest od razu pomijane jako `reason=alerts-disabled`.
- Jeśli wyłączone jest tylko dostarczanie alertów, OpenClaw nadal może uruchomić heartbeat, zaktualizować znaczniki czasu zadań należnych, przywrócić znacznik bezczynności sesji i wyciszyć zewnętrzny ładunek alertu.
- Odpowiedzi wyłącznie heartbeat **nie** utrzymują sesji przy życiu; ostatnie `updatedAt`
  jest przywracane, aby wygaśnięcie bezczynności działało normalnie.
- Odłączone [zadania w tle](/pl/automation/tasks) mogą umieszczać zdarzenie systemowe w kolejce i wybudzać heartbeat, gdy główna sesja powinna szybko coś zauważyć. Takie wybudzenie nie sprawia, że heartbeat staje się zadaniem w tle.

## Kontrola widoczności

Domyślnie potwierdzenia `HEARTBEAT_OK` są wyciszane, a treść alertów jest
dostarczana. Możesz dostosować to dla kanału lub konta:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Ukryj HEARTBEAT_OK (domyślnie)
      showAlerts: true # Pokazuj komunikaty alertów (domyślnie)
      useIndicator: true # Emituj zdarzenia wskaźnika (domyślnie)
  telegram:
    heartbeat:
      showOk: true # Pokazuj potwierdzenia OK w Telegramie
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Wycisz dostarczanie alertów dla tego konta
```

Pierwszeństwo: per-account → per-channel → domyślne kanału → wbudowane wartości domyślne.

### Co robi każda flaga

- `showOk`: wysyła potwierdzenie `HEARTBEAT_OK`, gdy model zwraca odpowiedź zawierającą tylko OK.
- `showAlerts`: wysyła treść alertu, gdy model zwraca odpowiedź inną niż OK.
- `useIndicator`: emituje zdarzenia wskaźnika dla powierzchni statusu UI.

Jeśli **wszystkie trzy** mają wartość false, OpenClaw całkowicie pomija uruchomienie heartbeat (bez wywołania modelu).

### Przykłady per-channel i per-account

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
| Zachowanie domyślne (ciche OK, alerty włączone) | _(nie jest wymagana konfiguracja)_                                                       |
| Pełna cisza (bez wiadomości, bez wskaźnika) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Tylko wskaźnik (bez wiadomości)          | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK tylko w jednym kanale                 | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcjonalnie)

Jeśli plik `HEARTBEAT.md` istnieje w obszarze roboczym, domyślny prompt mówi
agentowi, aby go przeczytał. Potraktuj go jako swoją „listę kontrolną heartbeat”: małą, stabilną i
bezpieczną do dołączania co 30 minut.

Przy zwykłych uruchomieniach `HEARTBEAT.md` jest wstrzykiwany tylko wtedy, gdy wskazówki heartbeat są
włączone dla domyślnego agenta. Wyłączenie częstotliwości heartbeat przez `0m` lub
ustawienie `includeSystemPromptSection: false` pomija go w zwykłym kontekście
bootstrap.

Jeśli `HEARTBEAT.md` istnieje, ale jest w praktyce pusty (tylko puste linie i nagłówki
Markdown takie jak `# Heading`), OpenClaw pomija uruchomienie heartbeat, aby oszczędzić wywołania API.
Takie pominięcie jest zgłaszane jako `reason=empty-heartbeat-file`.
Jeśli pliku brakuje, heartbeat nadal działa, a model decyduje, co zrobić.

Utrzymuj go w małym rozmiarze (krótka lista kontrolna lub przypomnienia), aby uniknąć rozrostu promptu.

Przykładowy `HEARTBEAT.md`:

```md
# Lista kontrolna heartbeat

- Szybki przegląd: czy w skrzynkach odbiorczych jest coś pilnego?
- Jeśli jest dzień, wykonaj lekki check-in, jeśli nic innego nie czeka.
- Jeśli zadanie jest zablokowane, zapisz _czego brakuje_ i zapytaj Petera następnym razem.
```

### Bloki `tasks:`

`HEARTBEAT.md` obsługuje także mały strukturalny blok `tasks:` dla sprawdzeń
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

- Utrzymuj alerty krótkie.
- Jeśli po wszystkich należnych zadaniach nic nie wymaga uwagi, odpowiedz HEARTBEAT_OK.
```

Zachowanie:

- OpenClaw analizuje blok `tasks:` i sprawdza każde zadanie względem jego własnego `interval`.
- Tylko **należne** zadania są dołączane do promptu heartbeat dla danego tyknięcia.
- Jeśli żadne zadania nie są należne, heartbeat jest całkowicie pomijany (`reason=no-tasks-due`), aby uniknąć zmarnowanego wywołania modelu.
- Treść spoza zadań w `HEARTBEAT.md` jest zachowywana i dołączana jako dodatkowy kontekst po liście należnych zadań.
- Znaczniki czasu ostatniego uruchomienia zadań są przechowywane w stanie sesji (`heartbeatTaskState`), więc interwały przetrwają zwykłe restarty.
- Znaczniki czasu zadań są przesuwane dopiero po tym, jak uruchomienie heartbeat zakończy normalną ścieżkę odpowiedzi. Pominięte uruchomienia `empty-heartbeat-file` / `no-tasks-due` nie oznaczają zadań jako ukończonych.

Tryb zadań jest przydatny, jeśli chcesz, aby jeden plik heartbeat zawierał kilka okresowych sprawdzeń bez płacenia za wszystkie przy każdym tyknięciu.

### Czy agent może aktualizować HEARTBEAT.md?

Tak — jeśli mu to zlecisz.

`HEARTBEAT.md` to po prostu zwykły plik w obszarze roboczym agenta, więc możesz powiedzieć
agentowi (w zwykłym czacie) coś w rodzaju:

- „Zaktualizuj `HEARTBEAT.md`, aby dodać codzienne sprawdzenie kalendarza.”
- „Przeredaguj `HEARTBEAT.md`, aby był krótszy i skupiał się na działaniach następczych ze skrzynki odbiorczej.”

Jeśli chcesz, aby działo się to proaktywnie, możesz także dodać jawną linię do
promptu heartbeat, na przykład: „Jeśli lista kontrolna się zestarzeje, zaktualizuj HEARTBEAT.md
na lepszą.”

Uwaga dotycząca bezpieczeństwa: nie umieszczaj sekretów (kluczy API, numerów telefonów, prywatnych tokenów) w
`HEARTBEAT.md` — staje się częścią kontekstu promptu.

## Ręczne wybudzenie (na żądanie)

Możesz umieścić zdarzenie systemowe w kolejce i natychmiast wyzwolić heartbeat poleceniem:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Jeśli wielu agentów ma skonfigurowany `heartbeat`, ręczne wybudzenie natychmiast uruchamia heartbeat każdego z nich.

Użyj `--mode next-heartbeat`, aby zaczekać do następnego zaplanowanego tyknięcia.

## Dostarczanie rozumowania (opcjonalnie)

Domyślnie heartbeat dostarcza tylko końcowy ładunek „answer”.

Jeśli chcesz większej przejrzystości, włącz:

- `agents.defaults.heartbeat.includeReasoning: true`

Po włączeniu heartbeat będzie również dostarczał osobną wiadomość z prefiksem
`Reasoning:` (ten sam format co `/reasoning on`). Może to być przydatne, gdy agent
zarządza wieloma sesjami/codexami i chcesz zobaczyć, dlaczego zdecydował się do Ciebie odezwać
— ale może też ujawniać więcej szczegółów wewnętrznych, niż chcesz. Lepiej pozostawić to
wyłączone w czatach grupowych.

## Świadomość kosztów

Heartbeat uruchamia pełne tury agenta. Krótsze interwały zużywają więcej tokenów. Aby obniżyć koszt:

- Użyj `isolatedSession: true`, aby uniknąć wysyłania pełnej historii rozmowy (~100K tokenów do ~2-5K na uruchomienie).
- Użyj `lightContext: true`, aby ograniczyć pliki bootstrap tylko do `HEARTBEAT.md`.
- Ustaw tańszy `model` (np. `ollama/llama3.2:1b`).
- Utrzymuj `HEARTBEAT.md` w małym rozmiarze.
- Użyj `target: "none"`, jeśli chcesz tylko wewnętrznych aktualizacji stanu.

## Powiązane

- [Automatyzacja i zadania](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania w tle](/pl/automation/tasks) — jak śledzona jest praca odłączona
- [Strefa czasowa](/pl/concepts/timezone) — jak strefa czasowa wpływa na planowanie heartbeat
- [Rozwiązywanie problemów](/pl/automation/cron-jobs#troubleshooting) — debugowanie problemów z automatyzacją
