---
read_when:
    - Planowanie zadań w tle lub wybudzeń
    - Podłączanie zewnętrznych wyzwalaczy (Webhooki, Gmail) do OpenClaw
    - Wybór między Heartbeat a Cron dla zaplanowanych zadań
summary: Zaplanowane zadania, Webhooki i wyzwalacze Gmail PubSub dla harmonogramu Gateway
title: Zaplanowane zadania
x-i18n:
    generated_at: "2026-04-25T13:41:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ed4dc7222b601b37d98cf1575ced7fd865987882a8c5b28245c5d2423b4cc56
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron to wbudowany harmonogram Gateway. Utrwala zadania, wybudza agenta we właściwym czasie i może dostarczać wynik z powrotem do kanału czatu lub punktu końcowego Webhook.

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
- Definicje zadań są utrwalane w `~/.openclaw/cron/jobs.json`, więc ponowne uruchomienia nie powodują utraty harmonogramów.
- Stan wykonania w czasie działania jest utrwalany obok, w `~/.openclaw/cron/jobs-state.json`. Jeśli śledzisz definicje crona w git, śledź `jobs.json`, a `jobs-state.json` dodaj do gitignore.
- Po rozdzieleniu starsze wersje OpenClaw mogą odczytać `jobs.json`, ale mogą traktować zadania jako nowe, ponieważ pola wykonania w czasie działania są teraz przechowywane w `jobs-state.json`.
- Wszystkie wykonania crona tworzą rekordy [zadań w tle](/pl/automation/tasks).
- Zadania jednorazowe (`--at`) są domyślnie automatycznie usuwane po pomyślnym zakończeniu.
- Izolowane uruchomienia crona po zakończeniu wykonania podejmują próbę zamknięcia śledzonych kart/procesów przeglądarki dla swojej sesji `cron:<jobId>`, dzięki czemu odłączona automatyzacja przeglądarki nie pozostawia osieroconych procesów.
- Izolowane uruchomienia crona chronią też przed nieaktualnymi odpowiedziami potwierdzającymi. Jeśli
  pierwszy wynik jest tylko tymczasową aktualizacją statusu (`on it`, `pulling everything
together` i podobne wskazówki), a żadne podrzędne uruchomienie subagenta nie jest nadal
  odpowiedzialne za końcową odpowiedź, OpenClaw ponawia prompt jeden raz, aby uzyskać
  właściwy wynik przed dostarczeniem.

<a id="maintenance"></a>

Uzgadnianie zadań dla crona jest zarządzane przez środowisko wykonawcze: aktywne zadanie crona pozostaje aktywne, dopóki
środowisko wykonawcze crona nadal śledzi to zadanie jako uruchomione, nawet jeśli nadal istnieje stary wiersz sesji podrzędnej.
Gdy środowisko wykonawcze przestaje zarządzać zadaniem i upłynie 5-minutowe okno karencji, mechanizm utrzymania może
oznaczyć zadanie jako `lost`.

## Typy harmonogramów

| Rodzaj  | Flaga CLI | Opis                                                    |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Jednorazowy znacznik czasu (ISO 8601 lub względny, np. `20m`) |
| `every` | `--every` | Stały interwał                                          |
| `cron`  | `--cron`  | 5-polowe lub 6-polowe wyrażenie cron z opcjonalnym `--tz` |

Znaczniki czasu bez strefy czasowej są traktowane jako UTC. Dodaj `--tz America/New_York`, aby użyć harmonogramu według lokalnego czasu ściennego.

Powtarzające się wyrażenia dla początku godziny są automatycznie rozpraszane w oknie do 5 minut, aby ograniczyć skoki obciążenia. Użyj `--exact`, aby wymusić dokładny czas, albo `--stagger 30s`, aby ustawić jawne okno.

### Dzień miesiąca i dzień tygodnia używają logiki OR

Wyrażenia cron są parsowane przez [croner](https://github.com/Hexagon/croner). Gdy zarówno pole dnia miesiąca, jak i dnia tygodnia nie są symbolami wieloznacznymi, croner dopasowuje, gdy **którekolwiek** z pól pasuje — nie oba. To standardowe zachowanie Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

To uruchamia się około 5–6 razy w miesiącu zamiast 0–1 raz w miesiącu. OpenClaw używa tutaj domyślnego zachowania OR Cronera. Aby wymagać spełnienia obu warunków, użyj modyfikatora dnia tygodnia `+` w Cronerze (`0 9 15 * +1`) albo ustaw harmonogram według jednego pola, a drugie sprawdzaj w prompcie lub poleceniu zadania.

## Style wykonywania

| Styl            | Wartość `--session` | Uruchamiane w            | Najlepsze do                    |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Sesja główna    | `main`              | Następny Heartbeat       | Przypomnienia, zdarzenia systemowe |
| Izolowany       | `isolated`          | Dedykowane `cron:<jobId>` | Raporty, zadania w tle          |
| Bieżąca sesja   | `current`           | Powiązane w chwili utworzenia | Cykliczna praca zależna od kontekstu |
| Sesja niestandardowa | `session:custom-id` | Trwała nazwana sesja | Przepływy pracy budujące na historii |

Zadania **sesji głównej** umieszczają zdarzenie systemowe w kolejce i opcjonalnie wybudzają Heartbeat (`--wake now` lub `--wake next-heartbeat`). Zadania **izolowane** uruchamiają dedykowaną turę agenta z nową sesją. **Sesje niestandardowe** (`session:xxx`) zachowują kontekst między uruchomieniami, umożliwiając przepływy pracy takie jak codzienne standupy oparte na poprzednich podsumowaniach.

W przypadku zadań izolowanych „nowa sesja” oznacza nowy identyfikator transkrypcji/sesji dla każdego uruchomienia. OpenClaw może przenosić bezpieczne preferencje, takie jak ustawienia thinking/fast/verbose, etykiety oraz jawnie wybrane przez użytkownika nadpisania modelu/autoryzacji, ale nie dziedziczy otaczającego kontekstu rozmowy ze starszego wiersza crona: routingu kanału/grupy, zasad wysyłania lub kolejkowania, podwyższenia uprawnień, źródła ani powiązania środowiska wykonawczego ACP. Użyj `current` lub `session:<id>`, gdy cykliczne zadanie ma celowo opierać się na tym samym kontekście rozmowy.

W przypadku zadań izolowanych demontaż środowiska wykonawczego obejmuje teraz także podejmowaną w najlepszym wysiłku próbę czyszczenia przeglądarki dla tej sesji crona. Błędy czyszczenia są ignorowane, aby rzeczywisty wynik crona nadal miał pierwszeństwo.

Izolowane uruchomienia crona usuwają także wszystkie dołączone instancje środowiska wykonawczego MCP utworzone dla zadania przez współdzieloną ścieżkę czyszczenia środowiska wykonawczego. Odpowiada to temu, jak klienci MCP dla sesji głównej i niestandardowej są zamykani, więc izolowane zadania crona nie powodują wycieków potomnych procesów stdio ani długotrwałych połączeń MCP między uruchomieniami.

Gdy izolowane uruchomienia crona koordynują subagentów, dostarczanie preferuje też końcowy
wynik potomny zamiast nieaktualnego tymczasowego tekstu nadrzędnego. Jeśli uruchomienia potomne nadal
trwają, OpenClaw pomija tę częściową aktualizację nadrzędną, zamiast ją ogłaszać.

W przypadku tekstowych celów ogłoszeń Discord OpenClaw wysyła raz
kanoniczny końcowy tekst asystenta zamiast odtwarzać zarówno payloady tekstu strumieniowanego/pośredniego,
jak i końcową odpowiedź. Payloady multimedialne i strukturalne Discord są nadal dostarczane jako
oddzielne payloady, aby załączniki i komponenty nie zostały pominięte.

### Opcje payloadu dla zadań izolowanych

- `--message`: tekst promptu (wymagany dla izolowanego)
- `--model` / `--thinking`: nadpisania modelu i poziomu thinking
- `--light-context`: pomiń wstrzykiwanie plików bootstrap przestrzeni roboczej
- `--tools exec,read`: ogranicz, których narzędzi może używać zadanie

`--model` używa wybranego dozwolonego modelu dla tego zadania. Jeśli żądany model
nie jest dozwolony, cron zapisuje ostrzeżenie i wraca do wyboru modelu agenta/dom yślnego dla zadania.
Skonfigurowane łańcuchy fallback nadal obowiązują, ale zwykłe nadpisanie modelu bez jawnej listy fallbacków dla zadania nie dołącza już głównego modelu agenta jako ukrytego dodatkowego celu ponowienia.

Pierwszeństwo wyboru modelu dla zadań izolowanych jest następujące:

1. Nadpisanie modelu przez hook Gmaila (gdy uruchomienie pochodzi z Gmaila i to nadpisanie jest dozwolone)
2. `model` w payloadzie dla zadania
3. Nadpisanie modelu zapisanej sesji crona wybrane przez użytkownika
4. Wybór modelu agenta/dom yślnego

Tryb szybki również podąża za rozstrzygniętym aktywnym wyborem. Jeśli wybrana konfiguracja modelu
ma `params.fastMode`, izolowany cron domyślnie używa tego ustawienia. Zapisane nadpisanie `fastMode`
sesji nadal ma pierwszeństwo nad konfiguracją w obu kierunkach.

Jeśli izolowane uruchomienie napotka przekazanie z aktywnym przełączeniem modelu, cron ponawia próbę z
przełączonym dostawcą/modelem i utrwala ten aktywny wybór dla bieżącego uruchomienia przed ponowieniem.
Gdy przełączenie obejmuje też nowy profil autoryzacji, cron utrwala również to nadpisanie profilu autoryzacji
dla bieżącego uruchomienia. Liczba ponowień jest ograniczona: po
początkowej próbie i 2 ponowieniach po przełączeniu cron przerywa zamiast zapętlać się bez końca.

## Dostarczanie i wynik

| Tryb      | Co się dzieje                                                      |
| --------- | ------------------------------------------------------------------ |
| `announce` | Awaryjnie dostarcz końcowy tekst do celu, jeśli agent go nie wysłał |
| `webhook`  | Wyślij payload zdarzenia zakończenia metodą POST na URL            |
| `none`     | Brak awaryjnego dostarczania przez runner                         |

Użyj `--announce --channel telegram --to "-1001234567890"` do dostarczania do kanału. W przypadku tematów forum Telegram użyj `-1001234567890:topic:123`. Cele Slack/Discord/Mattermost powinny używać jawnych prefiksów (`channel:<id>`, `user:<id>`).

W przypadku zadań izolowanych dostarczanie do czatu jest współdzielone. Jeśli trasa czatu jest dostępna,
agent może używać narzędzia `message`, nawet gdy zadanie używa `--no-deliver`. Jeśli
agent wyśle do skonfigurowanego/bieżącego celu, OpenClaw pomija awaryjne
ogłoszenie. W przeciwnym razie `announce`, `webhook` i `none` kontrolują tylko to, co
runner robi z końcową odpowiedzią po turze agenta.

Powiadomienia o niepowodzeniu korzystają z osobnej ścieżki docelowej:

- `cron.failureDestination` ustawia globalną domyślną wartość dla powiadomień o niepowodzeniu.
- `job.delivery.failureDestination` nadpisuje ją dla danego zadania.
- Jeśli żadna z tych opcji nie jest ustawiona, a zadanie już dostarcza przez `announce`, powiadomienia o niepowodzeniu są teraz domyślnie kierowane do tego podstawowego celu ogłoszenia.
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

Cykliczne zadanie izolowane z dostarczaniem:

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

Zadanie izolowane z nadpisaniem modelu i thinking:

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

Gateway może udostępniać punkty końcowe HTTP Webhook dla zewnętrznych wyzwalaczy. Włącz je w konfiguracji:

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

Umieść zdarzenie systemowe w kolejce dla sesji głównej:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (wymagane): opis zdarzenia
- `mode` (opcjonalne): `now` (domyślnie) lub `next-heartbeat`

### POST /hooks/agent

Uruchom izolowaną turę agenta:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
```

Pola: `message` (wymagane), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Mapowane hooki (POST /hooks/\<name\>)

Niestandardowe nazwy hooków są rozwiązywane przez `hooks.mappings` w konfiguracji. Mapowania mogą przekształcać dowolne payloady w akcje `wake` lub `agent` za pomocą szablonów albo transformacji kodem.

### Bezpieczeństwo

- Utrzymuj punkty końcowe hooków za local loopback, tailnet albo zaufanym reverse proxy.
- Używaj dedykowanego tokenu hooków; nie używaj ponownie tokenów uwierzytelniania gateway.
- Utrzymuj `hooks.path` na dedykowanej podścieżce; `/` jest odrzucane.
- Ustaw `hooks.allowedAgentIds`, aby ograniczyć jawne kierowanie `agentId`.
- Pozostaw `hooks.allowRequestSessionKey=false`, chyba że potrzebujesz sesji wybieranych przez wywołującego.
- Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw także `hooks.allowedSessionKeyPrefixes`, aby ograniczyć dozwolone kształty kluczy sesji.
- Payloady hooków są domyślnie opakowywane granicami bezpieczeństwa.

## Integracja Gmail PubSub

Połącz wyzwalacze skrzynki odbiorczej Gmail z OpenClaw przez Google PubSub.

**Wymagania wstępne**: CLI `gcloud`, `gog` (gogcli), włączone hooki OpenClaw, Tailscale dla publicznego punktu końcowego HTTPS.

### Konfiguracja kreatorem (zalecana)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

To zapisuje konfigurację `hooks.gmail`, włącza preset Gmail i używa Tailscale Funnel dla punktu końcowego push.

### Automatyczne uruchamianie Gateway

Gdy `hooks.enabled=true` i ustawiono `hooks.gmail.account`, Gateway uruchamia `gog gmail watch serve` przy starcie i automatycznie odnawia obserwację. Aby z tego zrezygnować, ustaw `OPENCLAW_SKIP_GMAIL_WATCHER=1`.

### Ręczna jednorazowa konfiguracja

1. Wybierz projekt GCP, do którego należy klient OAuth używany przez `gog`:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Utwórz temat i przyznaj Gmailowi dostęp push:

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

### Nadpisanie modelu dla Gmaila

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
- Jeśli nie jest dozwolony, cron wyświetla ostrzeżenie i wraca do wyboru modelu
  agenta/dom yślnego dla zadania.
- Skonfigurowane łańcuchy fallback nadal obowiązują, ale zwykłe nadpisanie `--model` bez
  jawnej listy fallbacków dla zadania nie przechodzi już do głównego modelu agenta
  jako cichego dodatkowego celu ponowienia.

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

Pomocniczy plik stanu środowiska wykonawczego jest wyprowadzany z `cron.store`: magazyn `.json`, taki jak
`~/clawd/cron/jobs.json`, używa `~/clawd/cron/jobs-state.json`, natomiast ścieżka magazynu
bez sufiksu `.json` otrzymuje na końcu `-state.json`.

Wyłącz cron: `cron.enabled: false` lub `OPENCLAW_SKIP_CRON=1`.

**Ponawianie zadań jednorazowych**: błędy przejściowe (limit żądań, przeciążenie, sieć, błąd serwera) są ponawiane do 3 razy z wykładniczym backoffem. Błędy trwałe wyłączają zadanie natychmiast.

**Ponawianie zadań cyklicznych**: wykładniczy backoff (od 30 s do 60 min) między ponowieniami. Backoff resetuje się po następnym pomyślnym uruchomieniu.

**Utrzymanie**: `cron.sessionRetention` (domyślnie `24h`) przycina wpisy sesji izolowanych uruchomień. `cron.runLog.maxBytes` / `cron.runLog.keepLines` automatycznie przycinają pliki dziennika uruchomień.

## Rozwiązywanie problemów

### Drabinka poleceń

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

- Sprawdź `cron.enabled` i zmienną środowiskową `OPENCLAW_SKIP_CRON`.
- Potwierdź, że Gateway działa nieprzerwanie.
- Dla harmonogramów `cron` sprawdź strefę czasową (`--tz`) względem strefy czasowej hosta.
- `reason: not-due` w wyniku uruchomienia oznacza, że ręczne uruchomienie zostało sprawdzone za pomocą `openclaw cron run <jobId> --due`, a termin zadania jeszcze nie nadszedł.

### Cron uruchomił się, ale nie było dostarczenia

- Tryb dostarczania `none` oznacza, że nie należy oczekiwać awaryjnego wysłania przez runner. Agent nadal może
  wysłać wiadomość bezpośrednio za pomocą narzędzia `message`, gdy dostępna jest trasa czatu.
- Brakujący/nieprawidłowy cel dostarczania (`channel`/`to`) oznacza, że wysyłka została pominięta.
- Błędy autoryzacji kanału (`unauthorized`, `Forbidden`) oznaczają, że dostarczanie zostało zablokowane przez poświadczenia.
- Jeśli izolowane uruchomienie zwróci tylko cichy token (`NO_REPLY` / `no_reply`),
  OpenClaw pomija bezpośrednie dostarczanie wychodzące, a także awaryjną
  ścieżkę podsumowania w kolejce, więc nic nie zostaje opublikowane z powrotem na czacie.
- Jeśli agent powinien sam wysłać wiadomość do użytkownika, sprawdź, czy zadanie ma użyteczną
  trasę (`channel: "last"` z poprzednim czatem albo jawny kanał/cel).

### Pułapki związane ze strefą czasową

- Cron bez `--tz` używa strefy czasowej hosta Gateway.
- Harmonogramy `at` bez strefy czasowej są traktowane jako UTC.
- Heartbeat `activeHours` używa skonfigurowanego rozstrzygania strefy czasowej.

## Powiązane

- [Automatyzacja i zadania](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania w tle](/pl/automation/tasks) — rejestr zadań dla wykonań crona
- [Heartbeat](/pl/gateway/heartbeat) — okresowe tury sesji głównej
- [Strefa czasowa](/pl/concepts/timezone) — konfiguracja strefy czasowej
