---
read_when:
    - Diagnozowanie łączności kanałów lub kondycji Gateway
    - Zrozumienie poleceń CLI i opcji kontroli kondycji
summary: Polecenia kontroli kondycji i monitorowanie kondycji Gateway
title: Kontrole kondycji
x-i18n:
    generated_at: "2026-04-23T10:01:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5ddcbe6fa913c5ba889f78cb417124c96b562cf8939410b1d6f66042dfb51a9f
    source_path: gateway/health.md
    workflow: 15
---

# Kontrole kondycji (CLI)

Krótki przewodnik, jak sprawdzać łączność kanałów bez zgadywania.

## Szybkie kontrole

- `openclaw status` — lokalne podsumowanie: osiągalność/tryb Gateway, sugestia aktualizacji, wiek powiązanego uwierzytelnienia kanału, sesje + ostatnia aktywność.
- `openclaw status --all` — pełna lokalna diagnoza (tylko do odczytu, z kolorami, bezpieczna do wklejenia przy debugowaniu).
- `openclaw status --deep` — prosi działające Gateway o sondę żywej kondycji (`health` z `probe:true`), w tym sondy kanałów per konto, gdy są obsługiwane.
- `openclaw health` — prosi działające Gateway o migawkę jego kondycji (tylko WS; bez bezpośrednich gniazd kanałów z CLI).
- `openclaw health --verbose` — wymusza żywą sondę kondycji i wypisuje szczegóły połączenia Gateway.
- `openclaw health --json` — wynik migawki kondycji w formacie czytelnym dla maszyn.
- Wyślij `/status` jako samodzielną wiadomość w WhatsApp/WebChat, aby uzyskać odpowiedź o stanie bez wywoływania agenta.
- Logi: śledź `/tmp/openclaw/openclaw-*.log` i filtruj po `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Głęboka diagnostyka

- Poświadczenia na dysku: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime powinien być aktualny).
- Magazyn sesji: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (ścieżka może być nadpisana w konfiguracji). Liczba i ostatni odbiorcy są pokazywani przez `status`.
- Przepływ ponownego linkowania: `openclaw channels logout && openclaw channels login --verbose`, gdy w logach pojawiają się kody statusu 409–515 albo `loggedOut`. (Uwaga: przepływ logowania przez QR automatycznie restartuje się raz dla statusu 515 po sparowaniu.)
- Diagnostyka jest domyślnie włączona. Gateway rejestruje fakty operacyjne, chyba że ustawiono `diagnostics.enabled: false`. Zdarzenia pamięci rejestrują liczbę bajtów RSS/heap, presję progową i presję wzrostu. Zdarzenia zbyt dużych ładunków rejestrują, co zostało odrzucone, skrócone albo podzielone na fragmenty, wraz z rozmiarami i limitami, gdy są dostępne. Nie rejestrują tekstu wiadomości, zawartości załączników, treści Webhook, surowej treści żądania lub odpowiedzi, tokenów, ciasteczek ani wartości sekretów. Ten sam Heartbeat uruchamia ograniczony rejestrator stabilności, dostępny przez `openclaw gateway stability` albo RPC Gateway `diagnostics.stability`. Krytyczne zakończenia Gateway, przekroczenia limitu czasu zamykania i błędy uruchamiania po restarcie zapisują najnowszą migawkę rejestratora w `~/.openclaw/logs/stability/`, jeśli istnieją zdarzenia; sprawdź najnowszy zapisany pakiet przez `openclaw gateway stability --bundle latest`.
- W przypadku zgłoszeń błędów uruchom `openclaw gateway diagnostics export` i dołącz wygenerowany zip. Eksport łączy podsumowanie Markdown, najnowszy pakiet stabilności, oczyszczone metadane logów, oczyszczone migawki statusu/kondycji Gateway oraz kształt konfiguracji. Jest przeznaczony do udostępniania: tekst czatu, treści Webhook, wyniki narzędzi, poświadczenia, ciasteczka, identyfikatory kont/wiadomości i wartości sekretów są pomijane albo redagowane.

## Konfiguracja monitora kondycji

- `gateway.channelHealthCheckMinutes`: jak często Gateway sprawdza kondycję kanałów. Domyślnie: `5`. Ustaw `0`, aby globalnie wyłączyć restarty monitora kondycji.
- `gateway.channelStaleEventThresholdMinutes`: jak długo połączony kanał może pozostawać bezczynny, zanim monitor kondycji uzna go za nieaktualny i zrestartuje. Domyślnie: `30`. Zachowaj wartość większą lub równą `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: kroczący limit restartów monitora kondycji na kanał/konto w ciągu godziny. Domyślnie: `10`.
- `channels.<provider>.healthMonitor.enabled`: wyłącza restarty monitora kondycji dla konkretnego kanału, pozostawiając włączone monitorowanie globalne.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: nadpisanie dla wielu kont, które ma pierwszeństwo przed ustawieniem na poziomie kanału.
- Te nadpisania per kanał dotyczą wbudowanych monitorów kanałów, które dziś je udostępniają: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram i WhatsApp.

## Gdy coś nie działa

- `logged out` albo status 409–515 → połącz ponownie przez `openclaw channels logout`, a następnie `openclaw channels login`.
- Gateway nieosiągalne → uruchom je: `openclaw gateway --port 18789` (użyj `--force`, jeśli port jest zajęty).
- Brak wiadomości przychodzących → potwierdź, że powiązany telefon jest online i że nadawca jest dozwolony (`channels.whatsapp.allowFrom`); dla czatów grupowych upewnij się, że lista dozwolonych i reguły wzmianek pasują (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Dedykowane polecenie „health”

`openclaw health` prosi działające Gateway o migawkę jego kondycji (bez bezpośrednich gniazd kanałów
z CLI). Domyślnie może zwrócić świeżą buforowaną migawkę Gateway; następnie
Gateway odświeża ten cache w tle. `openclaw health --verbose` zamiast tego wymusza
żywą sondę. Polecenie raportuje wiek powiązanych poświadczeń/uwierzytelnienia, gdy są dostępne,
podsumowania sond per kanał, podsumowanie magazynu sesji oraz czas trwania sondy. Kończy się
kodem błędu, jeśli Gateway jest nieosiągalne albo sonda kończy się błędem/przekroczeniem czasu.

Opcje:

- `--json`: wynik JSON czytelny dla maszyn
- `--timeout <ms>`: nadpisuje domyślny limit czasu sondy 10 s
- `--verbose`: wymusza żywą sondę i wypisuje szczegóły połączenia Gateway
- `--debug`: alias dla `--verbose`

Migawka kondycji zawiera: `ok` (boolean), `ts` (timestamp), `durationMs` (czas sondy), stan per kanał, dostępność agenta oraz podsumowanie magazynu sesji.
