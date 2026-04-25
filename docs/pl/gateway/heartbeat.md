---
read_when:
    - Dostosowywanie częstotliwości lub komunikatów Heartbeat
    - Wybieranie między Heartbeat a Cron dla zadań harmonogramowanych
summary: Wiadomości odpytywania Heartbeat i reguły powiadomień
title: Heartbeat
x-i18n:
    generated_at: "2026-04-25T13:47:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17353a03bbae7ad564548e767099f8596764e2cf9bc3d457ec9fc3482ba7d71c
    source_path: gateway/heartbeat.md
    workflow: 15
---

> **Heartbeat czy Cron?** Wskazówki, kiedy używać każdego z nich, znajdziesz w [Automation & Tasks](/pl/automation).

Heartbeat uruchamia **okresowe tury agenta** w głównej sesji, aby model mógł
sygnalizować wszystko, co wymaga uwagi, bez spamowania użytkownika.

Heartbeat to harmonogramowana tura głównej sesji — **nie** tworzy rekordów [background task](/pl/automation/tasks).
Rekordy zadań są przeznaczone dla pracy odłączonej (uruchomienia ACP, sub-agenci, izolowane zadania Cron).

Rozwiązywanie problemów: [Scheduled Tasks](/pl/automation/cron-jobs#troubleshooting)

## Szybki start (dla początkujących)

1. Pozostaw Heartbeat włączone (domyślnie `30m`, albo `1h` dla uwierzytelniania Anthropic OAuth/token, w tym ponownego użycia Claude CLI) albo ustaw własną częstotliwość.
2. Utwórz małą listę kontrolną `HEARTBEAT.md` albo blok `tasks:` w workspace agenta (opcjonalne, ale zalecane).
3. Zdecyduj, dokąd mają trafiać wiadomości Heartbeat (`target: "none"` jest domyślne; ustaw `target: "last"`, aby kierować do ostatniego kontaktu).
4. Opcjonalnie: włącz dostarczanie reasoning Heartbeat dla większej przejrzystości.
5. Opcjonalnie: użyj lekkiego kontekstu bootstrap, jeśli uruchomienia Heartbeat potrzebują tylko `HEARTBEAT.md`.
6. Opcjonalnie: włącz izolowane sesje, aby unikać wysyłania pełnej historii rozmowy przy każdym Heartbeat.
7. Opcjonalnie: ogranicz Heartbeat do aktywnych godzin (czas lokalny).

Przykładowa konfiguracja:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // jawne dostarczanie do ostatniego kontaktu (domyślnie "none")
        directPolicy: "allow", // domyślnie: allow dla celów direct/DM; ustaw "block", aby wyciszyć
        lightContext: true, // opcjonalne: wstrzykuj tylko HEARTBEAT.md z plików bootstrap
        isolatedSession: true, // opcjonalne: świeża sesja przy każdym uruchomieniu (bez historii rozmowy)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // opcjonalne: wysyłaj też osobną wiadomość `Reasoning:`
      },
    },
  },
}
```

## Ustawienia domyślne

- Interwał: `30m` (albo `1h`, gdy wykrytym trybem uwierzytelniania jest Anthropic OAuth/token, w tym ponowne użycie Claude CLI). Ustaw `agents.defaults.heartbeat.every` albo per agent `agents.list[].heartbeat.every`; użyj `0m`, aby wyłączyć.
- Treść promptu (konfigurowalna przez `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Prompt Heartbeat jest wysyłany **dosłownie** jako wiadomość użytkownika. Prompt
  systemowy zawiera sekcję „Heartbeat” tylko wtedy, gdy Heartbeat są włączone dla
  domyślnego agenta i uruchomienie jest wewnętrznie oznaczone flagą.
- Gdy Heartbeat są wyłączone przez `0m`, zwykłe uruchomienia również pomijają `HEARTBEAT.md`
  z kontekstu bootstrap, aby model nie widział instrukcji przeznaczonych wyłącznie dla Heartbeat.
- Aktywne godziny (`heartbeat.activeHours`) są sprawdzane w skonfigurowanej strefie czasowej.
  Poza tym oknem Heartbeat są pomijane aż do następnego tyknięcia wewnątrz okna.

## Do czego służy prompt Heartbeat

Domyślny prompt jest celowo szeroki:

- **Background tasks**: „Consider outstanding tasks” zachęca agenta do przeglądania
  działań następczych (skrzynka odbiorcza, kalendarz, przypomnienia, kolejka pracy) i sygnalizowania wszystkiego, co pilne.
- **Sprawdzenie człowieka**: „Checkup sometimes on your human during day time” zachęca do
  okazjonalnej lekkiej wiadomości w stylu „czy czegoś potrzebujesz?”, ale unika nocnego spamu
  dzięki użyciu skonfigurowanej lokalnej strefy czasowej (zobacz [/concepts/timezone](/pl/concepts/timezone)).

Heartbeat może reagować na zakończone [background tasks](/pl/automation/tasks), ale samo uruchomienie Heartbeat nie tworzy rekordu zadania.

Jeśli chcesz, aby Heartbeat robił coś bardzo konkretnego (np. „sprawdź statystyki Gmail PubSub”
albo „zweryfikuj stan Gateway”), ustaw `agents.defaults.heartbeat.prompt` (albo
`agents.list[].heartbeat.prompt`) na własną treść (wysyłaną dosłownie).

## Kontrakt odpowiedzi

- Jeśli nic nie wymaga uwagi, odpowiedz **`HEARTBEAT_OK`**.
- Podczas uruchomień Heartbeat OpenClaw traktuje `HEARTBEAT_OK` jako ack, gdy pojawia się
  na **początku albo końcu** odpowiedzi. Token jest usuwany, a odpowiedź zostaje
  odrzucona, jeśli pozostała treść ma **≤ `ackMaxChars`** (domyślnie: 300).
- Jeśli `HEARTBEAT_OK` pojawia się **w środku** odpowiedzi, nie jest traktowane
  w sposób szczególny.
- W przypadku alertów **nie** dołączaj `HEARTBEAT_OK`; zwracaj tylko treść alertu.

Poza Heartbeat przypadkowe `HEARTBEAT_OK` na początku/końcu wiadomości jest usuwane
i zapisywane w logach; wiadomość składająca się wyłącznie z `HEARTBEAT_OK` jest odrzucana.

## Konfiguracja

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // domyślnie: 30m (0m wyłącza)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // domyślnie: false (dostarczaj osobną wiadomość Reasoning:, gdy dostępna)
        lightContext: false, // domyślnie: false; true zachowuje tylko HEARTBEAT.md z plików bootstrap workspace
        isolatedSession: false, // domyślnie: false; true uruchamia każdy Heartbeat w świeżej sesji (bez historii rozmowy)
        target: "last", // domyślnie: none | opcje: last | none | <channel id> (rdzeniowy lub Plugin, np. "bluebubbles")
        to: "+15551234567", // opcjonalne nadpisanie odbiorcy specyficzne dla kanału
        accountId: "ops-bot", // opcjonalny identyfikator kanału dla wielu kont
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // maks. liczba znaków dozwolona po HEARTBEAT_OK
      },
    },
  },
}
```

### Zakres i pierwszeństwo

- `agents.defaults.heartbeat` ustawia globalne zachowanie Heartbeat.
- `agents.list[].heartbeat` scala się na wierzchu; jeśli jakikolwiek agent ma blok `heartbeat`, **tylko ci agenci** uruchamiają Heartbeat.
- `channels.defaults.heartbeat` ustawia domyślne ustawienia widoczności dla wszystkich kanałów.
- `channels.<channel>.heartbeat` nadpisuje ustawienia domyślne kanału.
- `channels.<channel>.accounts.<id>.heartbeat` (kanały z wieloma kontami) nadpisuje ustawienia per kanał.

### Heartbeat per agent

Jeśli jakikolwiek wpis `agents.list[]` zawiera blok `heartbeat`, **tylko ci agenci**
uruchamiają Heartbeat. Blok per agent scala się na `agents.defaults.heartbeat`
(dzięki czemu możesz ustawić wspólne wartości domyślne raz i nadpisywać je per agent).

Przykład: dwóch agentów, tylko drugi agent uruchamia Heartbeat.

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

Ogranicz Heartbeat do godzin pracy w określonej strefie czasowej:

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
          timezone: "America/New_York", // opcjonalne; używa userTimezone, jeśli ustawione, w przeciwnym razie strefy hosta
        },
      },
    },
  },
}
```

Poza tym oknem (przed 9:00 albo po 22:00 czasu wschodniego) Heartbeat są pomijane. Następne zaplanowane tyknięcie wewnątrz okna uruchomi się normalnie.

### Konfiguracja 24/7

Jeśli chcesz, aby Heartbeat działał przez całą dobę, użyj jednego z tych wzorców:

- Pomiń `activeHours` całkowicie (bez ograniczenia okna czasowego; to zachowanie domyślne).
- Ustaw pełnodobowe okno: `activeHours: { start: "00:00", end: "24:00" }`.

Nie ustawiaj tej samej godziny `start` i `end` (na przykład `08:00` do `08:00`).
Jest to traktowane jako okno o zerowej szerokości, więc Heartbeat jest zawsze pomijany.

### Przykład wielu kont

Użyj `accountId`, aby kierować do konkretnego konta na kanałach wielokontowych, takich jak Telegram:

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

- `every`: interwał Heartbeat (ciąg czasu trwania; domyślna jednostka = minuty).
- `model`: opcjonalne nadpisanie modelu dla uruchomień Heartbeat (`provider/model`).
- `includeReasoning`: gdy włączone, dostarcza również osobną wiadomość `Reasoning:`, gdy jest dostępna (ten sam kształt co `/reasoning on`).
- `lightContext`: gdy true, uruchomienia Heartbeat używają lekkiego kontekstu bootstrap i zachowują tylko `HEARTBEAT.md` z plików bootstrap workspace.
- `isolatedSession`: gdy true, każdy Heartbeat działa w świeżej sesji bez wcześniejszej historii rozmowy. Używa tego samego wzorca izolacji co Cron `sessionTarget: "isolated"`. Radykalnie obniża koszt tokenów na każdy Heartbeat. Połącz z `lightContext: true`, aby uzyskać maksymalne oszczędności. Routing dostarczania nadal używa kontekstu głównej sesji.
- `session`: opcjonalny klucz sesji dla uruchomień Heartbeat.
  - `main` (domyślnie): główna sesja agenta.
  - Jawny klucz sesji (skopiuj z `openclaw sessions --json` albo z [CLI sesji](/pl/cli/sessions)).
  - Formaty kluczy sesji: zobacz [Sessions](/pl/concepts/session) i [Groups](/pl/channels/groups).
- `target`:
  - `last`: dostarczaj do ostatnio użytego zewnętrznego kanału.
  - jawny kanał: dowolny skonfigurowany kanał lub identyfikator Plugin, na przykład `discord`, `matrix`, `telegram` albo `whatsapp`.
  - `none` (domyślnie): uruchom Heartbeat, ale **nie dostarczaj** go na zewnątrz.
- `directPolicy`: kontroluje zachowanie dostarczania direct/DM:
  - `allow` (domyślnie): zezwalaj na dostarczanie Heartbeat do direct/DM.
  - `block`: wycisz dostarczanie do direct/DM (`reason=dm-blocked`).
- `to`: opcjonalne nadpisanie odbiorcy (identyfikator specyficzny dla kanału, np. E.164 dla WhatsApp albo identyfikator czatu Telegram). Dla tematów/wątków Telegram użyj `<chatId>:topic:<messageThreadId>`.
- `accountId`: opcjonalny identyfikator konta dla kanałów wielokontowych. Gdy `target: "last"`, identyfikator konta dotyczy rozwiązanego ostatniego kanału, jeśli obsługuje konta; w przeciwnym razie jest ignorowany. Jeśli identyfikator konta nie pasuje do skonfigurowanego konta dla rozwiązanego kanału, dostarczanie jest pomijane.
- `prompt`: nadpisuje domyślną treść promptu (bez scalania).
- `ackMaxChars`: maks. liczba znaków dozwolona po `HEARTBEAT_OK` przed dostarczeniem.
- `suppressToolErrorWarnings`: gdy true, wycisza ładunki ostrzeżeń o błędach narzędzi podczas uruchomień Heartbeat.
- `activeHours`: ogranicza uruchomienia Heartbeat do okna czasowego. Obiekt z `start` (HH:MM, włącznie; użyj `00:00` dla początku dnia), `end` (HH:MM, wyłącznie; `24:00` dozwolone dla końca dnia) oraz opcjonalnym `timezone`.
  - Pominięte albo `"user"`: używa `agents.defaults.userTimezone`, jeśli ustawione, w przeciwnym razie wraca do strefy czasowej systemu hosta.
  - `"local"`: zawsze używa strefy czasowej systemu hosta.
  - Dowolny identyfikator IANA (np. `America/New_York`): używany bezpośrednio; jeśli nieprawidłowy, wraca do zachowania `"user"` powyżej.
  - `start` i `end` nie mogą być równe dla aktywnego okna; równe wartości są traktowane jako zerowa szerokość (zawsze poza oknem).
  - Poza aktywnym oknem Heartbeat są pomijane aż do następnego tyknięcia wewnątrz okna.

## Zachowanie dostarczania

- Heartbeat domyślnie działa w głównej sesji agenta (`agent:<id>:<mainKey>`),
  albo w `global`, gdy `session.scope = "global"`. Ustaw `session`, aby nadpisać na
  konkretną sesję kanału (Discord/WhatsApp/itd.).
- `session` wpływa tylko na kontekst uruchomienia; dostarczanie jest kontrolowane przez `target` i `to`.
- Aby dostarczać do konkretnego kanału/odbiorcy, ustaw `target` + `to`. Przy
  `target: "last"` dostarczanie używa ostatniego zewnętrznego kanału dla tej sesji.
- Domyślnie dostarczanie Heartbeat dopuszcza cele direct/DM. Ustaw `directPolicy: "block"`, aby wyciszyć wysyłanie do celów direct, nadal uruchamiając turę Heartbeat.
- Jeśli główna kolejka jest zajęta, Heartbeat jest pomijany i ponawiany później.
- Jeśli `target` nie rozwiązuje się do żadnego zewnętrznego celu, uruchomienie nadal się odbywa, ale
  żadna wiadomość wychodząca nie jest wysyłana.
- Jeśli `showOk`, `showAlerts` i `useIndicator` są wszystkie wyłączone, uruchomienie jest pomijane z góry jako `reason=alerts-disabled`.
- Jeśli wyłączone jest tylko dostarczanie alertów, OpenClaw nadal może uruchomić Heartbeat, zaktualizować znaczniki czasu zadań do wykonania, przywrócić znacznik czasu bezczynności sesji i wyciszyć zewnętrzny ładunek alertu.
- Jeśli rozpoznany cel Heartbeat obsługuje wskaźnik pisania, OpenClaw pokazuje pisanie, gdy
  uruchomienie Heartbeat jest aktywne. Używa tego samego celu, do którego Heartbeat wysyłałby
  wynik czatu, i jest wyłączane przez `typingMode: "never"`.
- Odpowiedzi tylko Heartbeat **nie** utrzymują sesji przy życiu; ostatnie `updatedAt`
  jest przywracane, aby wygasanie bezczynności działało normalnie.
- Historia Control UI i WebChat ukrywa prompty Heartbeat i potwierdzenia
  tylko-OK. Bazowy transkrypt sesji nadal może zawierać te tury na potrzeby audytu/odtwarzania.
- Odłączone [background tasks](/pl/automation/tasks) mogą kolejkować zdarzenie systemowe i wybudzać Heartbeat, gdy główna sesja powinna coś szybko zauważyć. To wybudzenie nie sprawia, że uruchomienie Heartbeat staje się background task.

## Kontrole widoczności

Domyślnie potwierdzenia `HEARTBEAT_OK` są wyciszane, podczas gdy treść alertów jest
dostarczana. Możesz dostosować to per kanał lub per konto:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Ukryj HEARTBEAT_OK (domyślnie)
      showAlerts: true # Pokazuj wiadomości alertów (domyślnie)
      useIndicator: true # Emituj zdarzenia wskaźników (domyślnie)
  telegram:
    heartbeat:
      showOk: true # Pokazuj potwierdzenia OK w Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Wycisz dostarczanie alertów dla tego konta
```

Pierwszeństwo: per konto → per kanał → domyślne kanału → wbudowane ustawienia domyślne.

### Co robi każda flaga

- `showOk`: wysyła potwierdzenie `HEARTBEAT_OK`, gdy model zwraca odpowiedź tylko-OK.
- `showAlerts`: wysyła treść alertu, gdy model zwraca odpowiedź inną niż OK.
- `useIndicator`: emituje zdarzenia wskaźników dla powierzchni statusu UI.

Jeśli **wszystkie trzy** mają wartość false, OpenClaw całkowicie pomija uruchomienie Heartbeat (bez wywołania modelu).

### Przykłady per kanał vs per konto

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

| Goal                                     | Config                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Zachowanie domyślne (ciche OK, alerty włączone) | _(bez potrzeby konfiguracji)_                                                            |
| Całkowicie cichy tryb (bez wiadomości, bez wskaźnika) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Tylko wskaźnik (bez wiadomości)          | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }` |
| OK tylko w jednym kanale                 | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcjonalne)

Jeśli w workspace istnieje plik `HEARTBEAT.md`, domyślny prompt mówi agentowi, aby go
odczytał. Traktuj go jak swoją „listę kontrolną Heartbeat”: małą, stabilną i
bezpieczną do dołączania co 30 minut.

W zwykłych uruchomieniach `HEARTBEAT.md` jest wstrzykiwany tylko wtedy, gdy wskazówki Heartbeat są
włączone dla domyślnego agenta. Wyłączenie częstotliwości Heartbeat przez `0m` albo
ustawienie `includeSystemPromptSection: false` pomija go ze zwykłego
kontekstu bootstrap.

Jeśli `HEARTBEAT.md` istnieje, ale jest efektywnie pusty (tylko puste linie i nagłówki
Markdown takie jak `# Heading`), OpenClaw pomija uruchomienie Heartbeat, aby oszczędzić wywołania API.
To pominięcie jest raportowane jako `reason=empty-heartbeat-file`.
Jeśli plik nie istnieje, Heartbeat nadal działa, a model decyduje, co zrobić.

Utrzymuj go w małej formie (krótka lista kontrolna lub przypomnienia), aby unikać rozrostu promptu.

Przykładowy `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it’s daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Bloki `tasks:`

`HEARTBEAT.md` obsługuje także mały strukturalny blok `tasks:` dla kontroli opartych na interwałach
wewnątrz samego Heartbeat.

Przykład:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

Zachowanie:

- OpenClaw analizuje blok `tasks:` i sprawdza każde zadanie względem jego własnego `interval`.
- Tylko zadania **due** są dołączane do promptu Heartbeat dla danego tyknięcia.
- Jeśli żadne zadania nie są due, Heartbeat jest całkowicie pomijany (`reason=no-tasks-due`), aby uniknąć zmarnowanego wywołania modelu.
- Treść spoza zadań w `HEARTBEAT.md` jest zachowywana i dołączana jako dodatkowy kontekst po liście zadań due.
- Znaczniki czasu ostatniego uruchomienia zadań są przechowywane w stanie sesji (`heartbeatTaskState`), więc interwały przetrwają zwykłe restarty.
- Znaczniki czasu zadań są przesuwane dopiero po zakończeniu normalnej ścieżki odpowiedzi Heartbeat. Pominięte uruchomienia `empty-heartbeat-file` / `no-tasks-due` nie oznaczają zadań jako ukończonych.

Tryb zadań jest przydatny, gdy chcesz, aby jeden plik Heartbeat zawierał kilka okresowych kontroli bez płacenia za wszystkie przy każdym tyknięciu.

### Czy agent może aktualizować HEARTBEAT.md?

Tak — jeśli mu to zlecisz.

`HEARTBEAT.md` to po prostu zwykły plik w workspace agenta, więc możesz powiedzieć agentowi
(w zwykłym czacie) coś w rodzaju:

- „Zaktualizuj `HEARTBEAT.md`, aby dodać codzienną kontrolę kalendarza.”
- „Przepisz `HEARTBEAT.md`, aby był krótszy i skupiał się na działaniach następczych w skrzynce odbiorczej.”

Jeśli chcesz, aby działo się to proaktywnie, możesz też dodać jawny wiersz w
swoim promptcie Heartbeat, taki jak: „If the checklist becomes stale, update HEARTBEAT.md
with a better one.”

Uwaga dotycząca bezpieczeństwa: nie umieszczaj sekretów (kluczy API, numerów telefonów, prywatnych tokenów) w
`HEARTBEAT.md` — staje się on częścią kontekstu promptu.

## Ręczne wybudzanie (na żądanie)

Możesz zakolejkować zdarzenie systemowe i wywołać natychmiastowy Heartbeat przez:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Jeśli wielu agentów ma skonfigurowany `heartbeat`, ręczne wybudzenie natychmiast uruchamia Heartbeat każdego z nich.

Użyj `--mode next-heartbeat`, aby poczekać na następne zaplanowane tyknięcie.

## Dostarczanie reasoning (opcjonalne)

Domyślnie Heartbeat dostarcza tylko końcowy ładunek „answer”.

Jeśli chcesz większej przejrzystości, włącz:

- `agents.defaults.heartbeat.includeReasoning: true`

Po włączeniu Heartbeat będzie również dostarczał osobną wiadomość poprzedzoną
`Reasoning:` (ten sam kształt co `/reasoning on`). Może to być przydatne, gdy agent
zarządza wieloma sesjami/Codex i chcesz zobaczyć, dlaczego zdecydował się
wysłać Ci sygnał — ale może też ujawniać więcej szczegółów wewnętrznych, niż chcesz. Lepiej pozostawić to
wyłączone w czatach grupowych.

## Świadomość kosztów

Heartbeat uruchamia pełne tury agenta. Krótsze interwały spalają więcej tokenów. Aby obniżyć koszty:

- Użyj `isolatedSession: true`, aby unikać wysyłania pełnej historii rozmowy (~100 tys. tokenów do ~2–5 tys. na uruchomienie).
- Użyj `lightContext: true`, aby ograniczyć pliki bootstrap tylko do `HEARTBEAT.md`.
- Ustaw tańszy `model` (np. `ollama/llama3.2:1b`).
- Utrzymuj `HEARTBEAT.md` w małej formie.
- Użyj `target: "none"`, jeśli chcesz tylko wewnętrznych aktualizacji stanu.

## Powiązane

- [Automation & Tasks](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Background Tasks](/pl/automation/tasks) — jak śledzona jest praca odłączona
- [Timezone](/pl/concepts/timezone) — jak strefa czasowa wpływa na harmonogram Heartbeat
- [Troubleshooting](/pl/automation/cron-jobs#troubleshooting) — debugowanie problemów z automatyzacją
