---
read_when:
    - Planowanie zadań w tle lub wybudzeń
    - Podłączanie zewnętrznych wyzwalaczy (webhooków, Gmaila) do OpenClaw
    - Wybór między heartbeat a cron dla zaplanowanych zadań
summary: Zaplanowane zadania, webhooki i wyzwalacze Gmail PubSub dla harmonogramu bramy
title: Zaplanowane zadania
x-i18n:
    generated_at: "2026-04-11T02:44:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04d94baa152de17d78515f7d545f099fe4810363ab67e06b465e489737f54665
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Zaplanowane zadania (Cron)

Cron to wbudowany harmonogram bramy. Utrwala zadania, wybudza agenta we właściwym czasie i może dostarczać wyniki z powrotem do kanału czatu lub punktu końcowego webhooka.

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

# See run history
openclaw cron runs --id <job-id>
```

## Jak działa cron

- Cron działa **wewnątrz procesu bramy** (nie wewnątrz modelu).
- Zadania są utrwalane w `~/.openclaw/cron/jobs.json`, więc restarty nie powodują utraty harmonogramów.
- Wszystkie wykonania crona tworzą rekordy [zadań w tle](/pl/automation/tasks).
- Zadania jednorazowe (`--at`) są domyślnie automatycznie usuwane po pomyślnym zakończeniu.
- Izolowane uruchomienia crona przy zakończeniu działania w trybie best-effort zamykają śledzone karty/procesy przeglądarki dla sesji `cron:<jobId>`, dzięki czemu odłączona automatyzacja przeglądarki nie pozostawia osieroconych procesów.
- Izolowane uruchomienia crona chronią też przed nieaktualnymi odpowiedziami potwierdzającymi. Jeśli
  pierwszy wynik to tylko tymczasowa aktualizacja statusu (`on it`, `pulling everything
together` i podobne wskazówki), a żadne uruchomienie podagenta potomnego nie jest już
  odpowiedzialne za końcową odpowiedź, OpenClaw ponawia monit raz, aby uzyskać właściwy
  wynik przed dostarczeniem.

<a id="maintenance"></a>

Uzgadnianie zadań dla crona jest zarządzane przez środowisko uruchomieniowe: aktywne zadanie cron pozostaje aktywne, dopóki
środowisko uruchomieniowe crona nadal śledzi to zadanie jako uruchomione, nawet jeśli nadal istnieje stary wiersz sesji potomnej.
Gdy środowisko uruchomieniowe przestaje zarządzać zadaniem i upłynie 5-minutowe okno karencji, konserwacja może
oznaczyć zadanie jako `lost`.

## Typy harmonogramów

| Rodzaj  | Flaga CLI | Opis                                                          |
| ------- | --------- | ------------------------------------------------------------- |
| `at`    | `--at`    | Jednorazowy znacznik czasu (ISO 8601 lub względny, np. `20m`) |
| `every` | `--every` | Stały interwał                                                |
| `cron`  | `--cron`  | 5-polowe lub 6-polowe wyrażenie cron z opcjonalnym `--tz`     |

Znaczniki czasu bez strefy czasowej są traktowane jako UTC. Dodaj `--tz America/New_York` dla harmonogramowania według lokalnego czasu zegarowego.

Powtarzające się wyrażenia uruchamiane o pełnej godzinie są automatycznie rozpraszane maksymalnie o 5 minut, aby zmniejszyć skoki obciążenia. Użyj `--exact`, aby wymusić precyzyjny czas, albo `--stagger 30s`, aby ustawić jawne okno.

## Style wykonania

| Styl            | Wartość `--session` | Uruchamiane w           | Najlepsze do                     |
| --------------- | ------------------- | ----------------------- | -------------------------------- |
| Sesja główna    | `main`              | Następny cykl heartbeat | Przypomnienia, zdarzenia systemowe |
| Izolowane       | `isolated`          | Dedykowane `cron:<jobId>` | Raporty, zadania w tle           |
| Bieżąca sesja   | `current`           | Powiązane przy tworzeniu | Cykliczna praca zależna od kontekstu |
| Sesja niestandardowa | `session:custom-id` | Trwała nazwana sesja | Przepływy pracy budujące na historii |

Zadania **sesji głównej** umieszczają zdarzenie systemowe w kolejce i opcjonalnie wybudzają heartbeat (`--wake now` lub `--wake next-heartbeat`). Zadania **izolowane** uruchamiają dedykowaną turę agenta ze świeżą sesją. **Sesje niestandardowe** (`session:xxx`) zachowują kontekst między uruchomieniami, umożliwiając przepływy pracy takie jak codzienne standupy budujące na poprzednich podsumowaniach.

Dla zadań izolowanych zamykanie środowiska uruchomieniowego obejmuje teraz także czyszczenie przeglądarki w trybie best-effort dla tej sesji cron. Błędy czyszczenia są ignorowane, aby rzeczywisty wynik crona nadal miał pierwszeństwo.

Gdy izolowane uruchomienia crona orkiestrują podagentów, dostarczenie również preferuje końcowy
wynik potomny zamiast nieaktualnego tekstu tymczasowego z nadrzędnego elementu. Jeśli potomkowie nadal
działają, OpenClaw pomija tę częściową aktualizację nadrzędną zamiast ją ogłaszać.

### Opcje ładunku dla zadań izolowanych

- `--message`: tekst monitu (wymagany dla izolowanych)
- `--model` / `--thinking`: nadpisania modelu i poziomu rozumowania
- `--light-context`: pomiń wstrzykiwanie plików bootstrap przestrzeni roboczej
- `--tools exec,read`: ogranicz, których narzędzi zadanie może używać

`--model` używa wybranego dozwolonego modelu dla tego zadania. Jeśli żądany model
nie jest dozwolony, cron zapisuje ostrzeżenie i wraca do wyboru modelu agenta/domyślnego modelu
dla zadania. Skonfigurowane łańcuchy awaryjne nadal mają zastosowanie, ale zwykłe
nadpisanie modelu bez jawnej listy awaryjnej dla zadania nie dołącza już modelu głównego
agenta jako ukrytego dodatkowego celu ponawiania.

Pierwszeństwo wyboru modelu dla zadań izolowanych jest następujące:

1. Nadpisanie modelu hooka Gmaila (gdy uruchomienie pochodzi z Gmaila i to nadpisanie jest dozwolone)
2. `model` w ładunku dla zadania
3. Zapisane nadpisanie modelu sesji cron
4. Wybór modelu agenta/domyślnego modelu

Tryb szybki również podąża za rozstrzygniętym wyborem na żywo. Jeśli wybrana konfiguracja modelu
ma `params.fastMode`, izolowany cron używa tego domyślnie. Zapisane nadpisanie
`fastMode` sesji nadal ma pierwszeństwo nad konfiguracją w obu kierunkach.

Jeśli izolowane uruchomienie trafi na przekazanie z przełączeniem modelu na żywo, cron ponawia próbę z
przełączonym dostawcą/modelem i utrwala ten wybór na żywo przed ponowną próbą. Gdy
przełączenie obejmuje także nowy profil uwierzytelniania, cron utrwala również to nadpisanie
profilu uwierzytelniania. Liczba ponowień jest ograniczona: po początkowej próbie oraz 2 ponownych próbach
przełączenia cron przerywa zamiast zapętlać się w nieskończoność.

## Dostarczanie i wyniki

| Tryb      | Co się dzieje                                             |
| --------- | --------------------------------------------------------- |
| `announce` | Dostarcz podsumowanie do docelowego kanału (domyślnie dla izolowanych) |
| `webhook`  | Wyślij ładunek zdarzenia zakończenia metodą POST do URL   |
| `none`     | Tylko wewnętrznie, bez dostarczenia                       |

Użyj `--announce --channel telegram --to "-1001234567890"` do dostarczania do kanału. Dla tematów forum Telegrama użyj `-1001234567890:topic:123`. Cele Slack/Discord/Mattermost powinny używać jawnych prefiksów (`channel:<id>`, `user:<id>`).

Dla izolowanych zadań zarządzanych przez cron wykonawca zarządza końcową ścieżką dostarczenia. Agent
otrzymuje polecenie zwrócenia podsumowania w postaci zwykłego tekstu, a to podsumowanie jest następnie wysyłane
przez `announce`, `webhook` albo pozostaje wewnętrzne przy `none`. `--no-deliver`
nie przekazuje dostarczania z powrotem agentowi; zachowuje uruchomienie jako wewnętrzne.

Jeśli oryginalne zadanie wyraźnie mówi, aby wysłać wiadomość do jakiegoś zewnętrznego odbiorcy,
agent powinien wskazać w swoim wyniku, do kogo/gdzie ta wiadomość powinna trafić, zamiast
próbować wysłać ją bezpośrednio.

Powiadomienia o błędach mają osobną ścieżkę docelową:

- `cron.failureDestination` ustawia globalną wartość domyślną dla powiadomień o błędach.
- `job.delivery.failureDestination` nadpisuje ją dla konkretnego zadania.
- Jeśli żadne z nich nie jest ustawione, a zadanie już dostarcza przez `announce`, powiadomienia o błędach teraz wracają do tego głównego celu `announce`.
- `delivery.failureDestination` jest obsługiwane tylko w zadaniach `sessionTarget="isolated"`, chyba że głównym trybem dostarczania jest `webhook`.

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

Zadanie izolowane z nadpisaniem modelu i poziomu rozumowania:

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

Brama może udostępniać punkty końcowe HTTP webhooków dla zewnętrznych wyzwalaczy. Włącz w konfiguracji:

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

Tokeny w ciągu zapytania są odrzucane.

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
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

Pola: `message` (wymagane), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Mapowane hooki (POST /hooks/\<name\>)

Niestandardowe nazwy hooków są rozstrzygane przez `hooks.mappings` w konfiguracji. Mapowania mogą przekształcać dowolne ładunki w działania `wake` lub `agent` za pomocą szablonów albo transformacji kodem.

### Bezpieczeństwo

- Utrzymuj punkty końcowe hooków za loopback, tailnetem lub zaufanym reverse proxy.
- Używaj dedykowanego tokenu hooka; nie używaj ponownie tokenów uwierzytelniania bramy.
- Utrzymuj `hooks.path` na dedykowanej podścieżce; `/` jest odrzucane.
- Ustaw `hooks.allowedAgentIds`, aby ograniczyć jawne kierowanie `agentId`.
- Pozostaw `hooks.allowRequestSessionKey=false`, chyba że potrzebujesz sesji wybieranych przez wywołującego.
- Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw też `hooks.allowedSessionKeyPrefixes`, aby ograniczyć dozwolone kształty kluczy sesji.
- Ładunki hooków są domyślnie opakowane granicami bezpieczeństwa.

## Integracja Gmail PubSub

Połącz wyzwalacze skrzynki odbiorczej Gmail z OpenClaw przez Google PubSub.

**Wymagania wstępne**: CLI `gcloud`, `gog` (gogcli), włączone hooki OpenClaw, Tailscale dla publicznego punktu końcowego HTTPS.

### Konfiguracja kreatorem (zalecane)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

To zapisuje konfigurację `hooks.gmail`, włącza preset Gmail i używa Tailscale Funnel dla punktu końcowego push.

### Automatyczne uruchamianie bramy

Gdy `hooks.enabled=true` i ustawiono `hooks.gmail.account`, brama uruchamia `gog gmail watch serve` przy starcie i automatycznie odnawia obserwację. Ustaw `OPENCLAW_SKIP_GMAIL_WATCHER=1`, aby zrezygnować.

### Ręczna jednorazowa konfiguracja

1. Wybierz projekt GCP, który jest właścicielem klienta OAuth używanego przez `gog`:

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

### Nadpisanie modelu Gmaila

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
  agenta/domyślnego modelu dla zadania.
- Skonfigurowane łańcuchy awaryjne nadal mają zastosowanie, ale zwykłe nadpisanie `--model` bez
  jawnej listy awaryjnej dla zadania nie przechodzi już dalej do modelu głównego
  agenta jako cichego dodatkowego celu ponawiania.

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

Wyłącz cron: `cron.enabled: false` lub `OPENCLAW_SKIP_CRON=1`.

**Ponawianie dla zadań jednorazowych**: błędy przejściowe (limit szybkości, przeciążenie, sieć, błąd serwera) są ponawiane maksymalnie 3 razy z wykładniczym opóźnieniem. Błędy trwałe powodują natychmiastowe wyłączenie.

**Ponawianie dla zadań cyklicznych**: wykładnicze opóźnienie (od 30 s do 60 min) między kolejnymi próbami. Opóźnienie resetuje się po następnym pomyślnym uruchomieniu.

**Konserwacja**: `cron.sessionRetention` (domyślnie `24h`) usuwa wpisy sesji izolowanych uruchomień. `cron.runLog.maxBytes` / `cron.runLog.keepLines` automatycznie przycinają pliki dziennika uruchomień.

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

- Sprawdź `cron.enabled` i zmienną środowiskową `OPENCLAW_SKIP_CRON`.
- Potwierdź, że brama działa w sposób ciągły.
- Dla harmonogramów `cron` sprawdź strefę czasową (`--tz`) względem strefy czasowej hosta.
- `reason: not-due` w wyniku uruchomienia oznacza, że ręczne uruchomienie zostało sprawdzone przez `openclaw cron run <jobId> --due` i zadanie nie było jeszcze wymagalne.

### Cron uruchomił się, ale nic nie dostarczono

- Tryb dostarczania `none` oznacza, że nie należy oczekiwać żadnej zewnętrznej wiadomości.
- Brakujący lub nieprawidłowy cel dostarczenia (`channel`/`to`) oznacza, że wysyłka została pominięta.
- Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że dostarczenie zostało zablokowane przez poświadczenia.
- Jeśli izolowane uruchomienie zwraca tylko cichy token (`NO_REPLY` / `no_reply`),
  OpenClaw pomija bezpośrednie dostarczenie wychodzące i pomija też awaryjną
  ścieżkę podsumowania w kolejce, więc nic nie jest publikowane z powrotem na czacie.
- Dla izolowanych zadań zarządzanych przez cron nie oczekuj, że agent użyje narzędzia wiadomości
  jako mechanizmu awaryjnego. Końcowym dostarczeniem zarządza wykonawca; `--no-deliver` zachowuje je
  jako wewnętrzne zamiast pozwalać na bezpośrednie wysłanie.

### Pułapki związane ze strefą czasową

- Cron bez `--tz` używa strefy czasowej hosta bramy.
- Harmonogramy `at` bez strefy czasowej są traktowane jako UTC.
- `activeHours` heartbeat używa rozstrzygania skonfigurowanej strefy czasowej.

## Powiązane

- [Automatyzacja i zadania](/pl/automation) — przegląd wszystkich mechanizmów automatyzacji
- [Zadania w tle](/pl/automation/tasks) — rejestr zadań dla wykonań crona
- [Heartbeat](/pl/gateway/heartbeat) — okresowe tury sesji głównej
- [Strefa czasowa](/pl/concepts/timezone) — konfiguracja strefy czasowej
