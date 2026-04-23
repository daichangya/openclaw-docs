---
read_when:
    - Planowanie zadań w tle lub wybudzeń
    - Podłączanie zewnętrznych wyzwalaczy (Webhooki, Gmail) do OpenClaw
    - Wybór między Heartbeat a Cron dla zaplanowanych zadań
summary: Zaplanowane zadania, Webhooki i wyzwalacze Gmail PubSub dla harmonogramu Gateway
title: Zaplanowane zadania
x-i18n:
    generated_at: "2026-04-23T09:55:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9565b73efc151c991ee6a1029c887c35d8673736913ddc5cdcfae09a4652f86
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Zaplanowane zadania (Cron)

Cron to wbudowany harmonogram Gateway. Utrwala zadania, wybudza agenta we właściwym czasie i może dostarczać wynik z powrotem do kanału czatu lub punktu końcowego Webhooka.

## Szybki start

```bash
# Add a one-shot reminder
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# Check your jobs
openclaw cron list
openclaw cron show <job-id>

# See run history
openclaw cron runs --id <job-id>
```

## Jak działa cron

- Cron działa **wewnątrz procesu Gateway** (nie wewnątrz modelu).
- Definicje zadań są utrwalane w `~/.openclaw/cron/jobs.json`, więc restarty nie powodują utraty harmonogramów.
- Stan wykonania w czasie działania jest utrwalany obok w `~/.openclaw/cron/jobs-state.json`. Jeśli śledzisz definicje cron w git, śledź `jobs.json`, a `jobs-state.json` dodaj do gitignore.
- Po rozdzieleniu starsze wersje OpenClaw mogą odczytać `jobs.json`, ale mogą traktować zadania jako świeże, ponieważ pola środowiska uruchomieniowego znajdują się teraz w `jobs-state.json`.
- Wszystkie wykonania cron tworzą rekordy [zadań w tle](/pl/automation/tasks).
- Zadania jednorazowe (`--at`) są domyślnie automatycznie usuwane po pomyślnym zakończeniu.
- Izolowane uruchomienia cron po zakończeniu działania w miarę możliwości zamykają śledzone karty/procesy przeglądarki dla sesji `cron:<jobId>`, aby odłączona automatyzacja przeglądarki nie pozostawiała osieroconych procesów.
- Izolowane uruchomienia cron chronią też przed nieaktualnymi odpowiedziami potwierdzającymi. Jeśli pierwszy wynik to tylko tymczasowa aktualizacja statusu (`on it`, `pulling everything together` i podobne wskazówki), a żadne podrzędne uruchomienie subagenta nie odpowiada już za końcową odpowiedź, OpenClaw ponawia prompt raz, aby uzyskać właściwy wynik przed dostarczeniem.

<a id="maintenance"></a>

Uzgadnianie zadań dla cron jest własnością środowiska uruchomieniowego: aktywne zadanie cron pozostaje aktywne, dopóki środowisko wykonawcze cron nadal śledzi to zadanie jako uruchomione, nawet jeśli nadal istnieje stary wiersz sesji potomnej.
Gdy środowisko uruchomieniowe przestaje być właścicielem zadania i upłynie 5-minutowe okno karencji, konserwacja może oznaczyć zadanie jako `lost`.

## Typy harmonogramu

| Rodzaj  | Flaga CLI | Opis                                                         |
| ------- | --------- | ------------------------------------------------------------ |
| `at`    | `--at`    | Jednorazowy znacznik czasu (ISO 8601 lub względny, np. `20m`) |
| `every` | `--every` | Stały interwał                                               |
| `cron`  | `--cron`  | 5-polowe lub 6-polowe wyrażenie cron z opcjonalnym `--tz`    |

Znaczniki czasu bez strefy czasowej są traktowane jako UTC. Dodaj `--tz America/New_York` dla harmonogramu według lokalnego czasu ściennego.

Powtarzające się wyrażenia uruchamiane o pełnej godzinie są automatycznie rozpraszane do 5 minut, aby ograniczyć skoki obciążenia. Użyj `--exact`, aby wymusić precyzyjne wyzwalanie, lub `--stagger 30s` dla jawnego okna.

### Dzień miesiąca i dzień tygodnia używają logiki OR

Wyrażenia cron są parsowane przez [croner](https://github.com/Hexagon/croner). Gdy zarówno pola dnia miesiąca, jak i dnia tygodnia nie są symbolami wieloznacznymi, croner dopasowuje, gdy pasuje **którekolwiek** z pól — a nie oba. To standardowe zachowanie Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

To uruchamia się około 5–6 razy w miesiącu zamiast 0–1 razy w miesiącu. OpenClaw używa tutaj domyślnego zachowania OR z Croner. Aby wymagać obu warunków, użyj modyfikatora dnia tygodnia `+` z Croner (`0 9 15 * +1`) albo ustaw harmonogram według jednego pola i sprawdzaj drugie w prompcie lub poleceniu zadania.

## Style wykonania

| Styl            | Wartość `--session` | Uruchamiane w            | Najlepsze do                    |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Sesja główna    | `main`              | Następny cykl Heartbeat  | Przypomnienia, zdarzenia systemowe |
| Izolowane       | `isolated`          | Dedykowane `cron:<jobId>` | Raporty, zadania w tle          |
| Bieżąca sesja   | `current`           | Powiązane przy tworzeniu | Powtarzalna praca zależna od kontekstu |
| Sesja własna    | `session:custom-id` | Trwała nazwana sesja     | Przepływy pracy budujące historię |

Zadania **sesji głównej** umieszczają zdarzenie systemowe w kolejce i opcjonalnie wybudzają Heartbeat (`--wake now` lub `--wake next-heartbeat`). Zadania **izolowane** uruchamiają dedykowany cykl agenta ze świeżą sesją. **Sesje własne** (`session:xxx`) zachowują kontekst między uruchomieniami, umożliwiając przepływy pracy takie jak codzienne standupy budujące na wcześniejszych podsumowaniach.

Dla zadań izolowanych zamykanie środowiska uruchomieniowego obejmuje teraz także czyszczenie przeglądarki dla tej sesji cron w miarę możliwości. Błędy czyszczenia są ignorowane, aby rzeczywisty wynik cron nadal miał pierwszeństwo.

Izolowane uruchomienia cron usuwają też wszystkie dołączone instancje środowiska uruchomieniowego MCP utworzone dla zadania przez współdzieloną ścieżkę czyszczenia środowiska. Jest to zgodne z tym, jak klienci MCP dla sesji głównej i sesji własnych są zamykani, dzięki czemu izolowane zadania cron nie powodują wycieków potomnych procesów stdio ani długotrwałych połączeń MCP między uruchomieniami.

Gdy izolowane uruchomienia cron orkiestrują subagentów, dostarczenie preferuje także końcowy wynik potomny zamiast nieaktualnego tymczasowego tekstu rodzica. Jeśli potomkowie nadal działają, OpenClaw pomija tę częściową aktualizację rodzica zamiast ją ogłaszać.

### Opcje ładunku dla zadań izolowanych

- `--message`: tekst promptu (wymagany dla izolowanych)
- `--model` / `--thinking`: nadpisania modelu i poziomu myślenia
- `--light-context`: pomiń wstrzykiwanie plików bootstrap obszaru roboczego
- `--tools exec,read`: ogranicz, których narzędzi może używać zadanie

`--model` używa wybranego dozwolonego modelu dla tego zadania. Jeśli żądany model nie jest dozwolony, cron zapisuje ostrzeżenie do logu i zamiast tego wraca do wyboru modelu agenta/domyślnego dla zadania. Skonfigurowane łańcuchy zapasowe nadal obowiązują, ale zwykłe nadpisanie modelu bez jawnej listy zapasowej dla zadania nie dopina już głównego modelu agenta jako ukrytego dodatkowego celu ponownych prób.

Kolejność pierwszeństwa wyboru modelu dla zadań izolowanych jest następująca:

1. Nadpisanie modelu hooka Gmail (gdy uruchomienie pochodzi z Gmail i to nadpisanie jest dozwolone)
2. `model` w ładunku zadania
3. Zapisane nadpisanie modelu sesji cron
4. Wybór modelu agenta/domyślnego

Tryb szybki również podąża za rozstrzygniętym wyborem aktywnym. Jeśli wybrana konfiguracja modelu ma `params.fastMode`, izolowany cron domyślnie używa tej wartości. Zapisane nadpisanie `fastMode` sesji nadal ma pierwszeństwo nad konfiguracją w obie strony.

Jeśli izolowane uruchomienie trafi na przekazanie aktywnego przełączenia modelu, cron ponowi próbę z przełączonym dostawcą/modelem i utrwali ten aktywny wybór przed ponowną próbą. Gdy przełączenie przenosi także nowy profil uwierzytelniania, cron utrwala również to nadpisanie profilu uwierzytelniania. Ponowne próby są ograniczone: po pierwszej próbie i 2 ponownych próbach przełączenia cron przerywa zamiast zapętlać się bez końca.

## Dostarczanie i wynik

| Tryb       | Co się dzieje                                                       |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Awaryjnie dostarcza końcowy tekst do celu, jeśli agent go nie wysłał |
| `webhook`  | Wysyła ładunek zdarzenia zakończenia metodą POST na URL             |
| `none`     | Brak awaryjnego dostarczania przez wykonawcę                        |

Użyj `--announce --channel telegram --to "-1001234567890"` do dostarczenia do kanału. Dla tematów forum Telegram użyj `-1001234567890:topic:123`. Cele Slack/Discord/Mattermost powinny używać jawnych prefiksów (`channel:<id>`, `user:<id>`).

Dla zadań izolowanych dostarczanie do czatu jest współdzielone. Jeśli trasa czatu jest dostępna, agent może użyć narzędzia `message` nawet wtedy, gdy zadanie używa `--no-deliver`. Jeśli agent wyśle do skonfigurowanego/bieżącego celu, OpenClaw pomija awaryjne ogłoszenie. W przeciwnym razie `announce`, `webhook` i `none` kontrolują tylko to, co wykonawca robi z końcową odpowiedzią po cyklu agenta.

Powiadomienia o błędach korzystają z osobnej ścieżki celu:

- `cron.failureDestination` ustawia globalną wartość domyślną dla powiadomień o błędach.
- `job.delivery.failureDestination` nadpisuje to dla konkretnego zadania.
- Jeśli żadne z nich nie jest ustawione, a zadanie już dostarcza przez `announce`, powiadomienia o błędach wracają teraz domyślnie do tego podstawowego celu `announce`.
- `delivery.failureDestination` jest obsługiwane tylko dla zadań z `sessionTarget="isolated"`, chyba że podstawowym trybem dostarczania jest `webhook`.

## Przykłady CLI

Jednorazowe przypomnienie (sesja główna):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

Powtarzalne zadanie izolowane z dostarczaniem:

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Zadanie izolowane z nadpisaniem modelu i myślenia:

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --announce
```

## Webhooki

Gateway może udostępniać punkty końcowe HTTP Webhook dla zewnętrznych wyzwalaczy. Włącz w konfiguracji:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Uwierzytelnianie

Każde żądanie musi zawierać token hooka w nagłówku:

- `Authorization: Bearer <token>` (zalecane)
- `x-openclaw-token: <token>`

Tokeny w query string są odrzucane.

### POST /hooks/wake

Umieszcza zdarzenie systemowe w kolejce dla sesji głównej:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (wymagane): opis zdarzenia
- `mode` (opcjonalne): `now` (domyślnie) lub `next-heartbeat`

### POST /hooks/agent

Uruchamia izolowany cykl agenta:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

Pola: `message` (wymagane), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Mapowane hooki (POST /hooks/\<name\>)

Własne nazwy hooków są rozstrzygane przez `hooks.mappings` w konfiguracji. Mapowania mogą przekształcać dowolne ładunki w działania `wake` lub `agent` przy użyciu szablonów lub transformacji kodem.

### Bezpieczeństwo

- Utrzymuj punkty końcowe hooków za loopback, tailnetem lub zaufanym reverse proxy.
- Używaj dedykowanego tokenu hooka; nie używaj ponownie tokenów uwierzytelniania gateway.
- Utrzymuj `hooks.path` na dedykowanej ścieżce podrzędnej; `/` jest odrzucane.
- Ustaw `hooks.allowedAgentIds`, aby ograniczyć jawne trasowanie `agentId`.
- Utrzymuj `hooks.allowRequestSessionKey=false`, chyba że potrzebujesz sesji wybieranych przez wywołującego.
- Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw także `hooks.allowedSessionKeyPrefixes`, aby ograniczyć dozwolone kształty kluczy sesji.
- Ładunki hooków są domyślnie opakowane granicami bezpieczeństwa.

## Integracja Gmail PubSub

Podłącz wyzwalacze skrzynki Gmail do OpenClaw przez Google PubSub.

**Wymagania wstępne**: CLI `gcloud`, `gog` (gogcli), włączone hooki OpenClaw, Tailscale dla publicznego punktu końcowego HTTPS.

### Konfiguracja przez kreator (zalecane)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

To zapisuje konfigurację `hooks.gmail`, włącza preset Gmail i używa Tailscale Funnel dla punktu końcowego push.

### Automatyczne uruchamianie Gateway

Gdy `hooks.enabled=true` i ustawione jest `hooks.gmail.account`, Gateway uruchamia `gog gmail watch serve` podczas startu i automatycznie odnawia obserwację. Ustaw `OPENCLAW_SKIP_GMAIL_WATCHER=1`, aby zrezygnować.

### Ręczna jednorazowa konfiguracja

1. Wybierz projekt GCP, który jest właścicielem klienta OAuth używanego przez `gog`:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Utwórz temat i przyznaj Gmail uprawnienia do push:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. Uruchom obserwację:

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

### Nadpisanie modelu Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## Zarządzanie zadaniami

```bash
# List all jobs
openclaw cron list

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Uwaga dotycząca nadpisania modelu:

- `openclaw cron add|edit --model ...` zmienia wybrany model zadania.
- Jeśli model jest dozwolony, dokładnie ten dostawca/model trafia do izolowanego
  uruchomienia agenta.
- Jeśli nie jest dozwolony, cron zapisuje ostrzeżenie i wraca do domyślnego
  wyboru modelu agenta dla zadania.
- Skonfigurowane łańcuchy zapasowe nadal obowiązują, ale zwykłe nadpisanie `--model`
  bez jawnej listy zapasowej dla zadania nie przechodzi już dalej do głównego modelu
  agenta jako cichego dodatkowego celu ponownych prób.

## Konfiguracja

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

Pomocniczy plik stanu środowiska uruchomieniowego jest wyprowadzany z `cron.store`: magazyn `.json`, taki jak
`~/clawd/cron/jobs.json`, używa `~/clawd/cron/jobs-state.json`, natomiast ścieżka magazynu
bez przyrostka `.json` dopina `-state.json`.

Wyłącz cron: `cron.enabled: false` lub `OPENCLAW_SKIP_CRON=1`.

**Ponowne próby dla zadań jednorazowych**: błędy przejściowe (limit żądań, przeciążenie, sieć, błąd serwera) są ponawiane do 3 razy z wykładniczym opóźnieniem. Błędy trwałe wyłączają zadanie natychmiast.

**Ponowne próby dla zadań cyklicznych**: wykładnicze opóźnienie (od 30 s do 60 min) między ponownymi próbami. Opóźnienie jest resetowane po następnym pomyślnym uruchomieniu.

**Konserwacja**: `cron.sessionRetention` (domyślnie `24h`) przycina wpisy sesji izolowanych uruchomień. `cron.runLog.maxBytes` / `cron.runLog.keepLines` automatycznie przycinają pliki logów uruchomień.

## Rozwiązywanie problemów

### Sekwencja poleceń

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

### Cron się nie uruchamia

- Sprawdź `cron.enabled` oraz zmienną środowiskową `OPENCLAW_SKIP_CRON`.
- Potwierdź, że Gateway działa nieprzerwanie.
- Dla harmonogramów `cron` zweryfikuj strefę czasową (`--tz`) względem strefy czasowej hosta.
- `reason: not-due` w wyniku uruchomienia oznacza, że ręczne uruchomienie zostało sprawdzone przez `openclaw cron run <jobId> --due`, a termin zadania jeszcze nie nadszedł.

### Cron uruchomił się, ale nic nie zostało dostarczone

- Tryb dostarczania `none` oznacza, że nie należy oczekiwać awaryjnego wysłania przez wykonawcę. Agent może
  nadal wysyłać bezpośrednio za pomocą narzędzia `message`, gdy dostępna jest trasa czatu.
- Brakujący/nieprawidłowy cel dostarczania (`channel`/`to`) oznacza, że wysyłka wychodząca została pominięta.
- Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że dostarczenie zostało zablokowane przez poświadczenia.
- Jeśli izolowane uruchomienie zwraca tylko cichy token (`NO_REPLY` / `no_reply`),
  OpenClaw pomija bezpośrednie dostarczanie wychodzące, a także awaryjną
  ścieżkę podsumowania w kolejce, więc nic nie jest publikowane z powrotem na czacie.
- Jeśli agent sam powinien wysłać wiadomość użytkownikowi, sprawdź, czy zadanie ma użyteczną
  trasę (`channel: "last"` z poprzednim czatem lub jawny kanał/cel).

### Pułapki związane ze strefą czasową

- Cron bez `--tz` używa strefy czasowej hosta Gateway.
- Harmonogramy `at` bez strefy czasowej są traktowane jako UTC.
- `activeHours` Heartbeat używa skonfigurowanego rozstrzygania strefy czasowej.

## Powiązane

- [Automatyzacja i zadania](/pl/automation) — przegląd wszystkich mechanizmów automatyzacji
- [Zadania w tle](/pl/automation/tasks) — rejestr zadań dla wykonań cron
- [Heartbeat](/pl/gateway/heartbeat) — okresowe cykle sesji głównej
- [Strefa czasowa](/pl/concepts/timezone) — konfiguracja strefy czasowej
