---
read_when:
    - Diagnozowanie łączności kanałów lub stanu Gateway
    - Zrozumienie poleceń i opcji CLI kontroli stanu
summary: Polecenia kontroli stanu i monitorowanie stanu Gateway
title: Kontrole stanu
x-i18n:
    generated_at: "2026-04-25T13:47:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d00e842dc0d67d71ac6e6547ebb7e3cd2b476562a7cde0f81624c6e20d67683
    source_path: gateway/health.md
    workflow: 15
---

Krótki przewodnik, jak weryfikować łączność kanałów bez zgadywania.

## Szybkie kontrole

- `openclaw status` — lokalne podsumowanie: osiągalność/tryb Gateway, wskazówka aktualizacji, wiek uwierzytelnienia połączonych kanałów, sesje i ostatnia aktywność.
- `openclaw status --all` — pełna lokalna diagnostyka (tylko odczyt, kolory, bezpieczne do wklejenia przy debugowaniu).
- `openclaw status --deep` — pyta działający Gateway o sondę live stanu (`health` z `probe:true`), w tym o sondy kanałów per konto, gdy są obsługiwane.
- `openclaw health` — pyta działający Gateway o jego migawkę stanu (tylko WS; bez bezpośrednich gniazd kanałów z CLI).
- `openclaw health --verbose` — wymusza sondę live stanu i wypisuje szczegóły połączenia Gateway.
- `openclaw health --json` — wyjście migawki stanu w formacie czytelnym maszynowo.
- Wyślij `/status` jako samodzielną wiadomość w WhatsApp/WebChat, aby otrzymać odpowiedź ze statusem bez wywoływania agenta.
- Logi: śledź `/tmp/openclaw/openclaw-*.log` i filtruj `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Głęboka diagnostyka

- Dane uwierzytelniające na dysku: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime powinien być aktualny).
- Magazyn sesji: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (ścieżka może być nadpisana w konfiguracji). Liczba i ostatni odbiorcy są widoczni w `status`.
- Przepływ ponownego łączenia: `openclaw channels logout && openclaw channels login --verbose`, gdy w logach pojawiają się kody statusu 409–515 lub `loggedOut`. (Uwaga: przepływ logowania QR automatycznie restartuje się raz dla statusu 515 po sparowaniu.)
- Diagnostyka jest domyślnie włączona. Gateway zapisuje fakty operacyjne, chyba że ustawiono `diagnostics.enabled: false`. Zdarzenia pamięci zapisują liczbę bajtów RSS/heap, presję progową i presję wzrostu. Zdarzenia zbyt dużych ładunków zapisują, co zostało odrzucone, przycięte lub podzielone na fragmenty, wraz z rozmiarami i limitami, gdy są dostępne. Nie zapisują tekstu wiadomości, zawartości załączników, treści Webhook, surowego ciała żądania lub odpowiedzi, tokenów, ciasteczek ani wartości sekretów. Ten sam Heartbeat uruchamia ograniczony rejestrator stabilności, dostępny przez `openclaw gateway stability` lub Gateway RPC `diagnostics.stability`. Krytyczne zakończenia Gateway, timeouty zamykania i błędy uruchomienia przy restarcie zapisują najnowszą migawkę rejestratora w `~/.openclaw/logs/stability/`, gdy istnieją zdarzenia; sprawdź najnowszy zapisany pakiet przez `openclaw gateway stability --bundle latest`.
- Dla raportów błędów uruchom `openclaw gateway diagnostics export` i dołącz wygenerowany plik zip. Eksport łączy podsumowanie Markdown, najnowszy pakiet stabilności, zsanityzowane metadane logów, zsanityzowane migawki statusu/stanu Gateway oraz kształt konfiguracji. Jest przeznaczony do udostępniania: tekst czatu, treści Webhook, wyjścia narzędzi, dane uwierzytelniające, ciasteczka, identyfikatory kont/wiadomości i wartości sekretów są pomijane lub redagowane. Zobacz [Diagnostics Export](/pl/gateway/diagnostics).

## Konfiguracja monitora stanu

- `gateway.channelHealthCheckMinutes`: jak często Gateway sprawdza stan kanałów. Domyślnie: `5`. Ustaw `0`, aby globalnie wyłączyć restarty monitora stanu.
- `gateway.channelStaleEventThresholdMinutes`: jak długo połączony kanał może pozostawać bezczynny, zanim monitor stanu uzna go za przestarzały i zrestartuje. Domyślnie: `30`. Utrzymuj tę wartość większą lub równą `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: kroczący limit restartów monitora stanu na kanał/konto w ciągu jednej godziny. Domyślnie: `10`.
- `channels.<provider>.healthMonitor.enabled`: wyłącza restarty monitora stanu dla konkretnego kanału przy pozostawieniu globalnego monitorowania włączonego.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: nadpisanie dla wielu kont, które ma pierwszeństwo nad ustawieniem na poziomie kanału.
- Te nadpisania per kanał dotyczą wbudowanych monitorów kanałów, które obecnie je udostępniają: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram i WhatsApp.

## Gdy coś nie działa

- `logged out` lub status 409–515 → połącz ponownie przez `openclaw channels logout`, a następnie `openclaw channels login`.
- Gateway nieosiągalny → uruchom go: `openclaw gateway --port 18789` (użyj `--force`, jeśli port jest zajęty).
- Brak wiadomości przychodzących → potwierdź, że połączony telefon jest online i nadawca jest dozwolony (`channels.whatsapp.allowFrom`); dla czatów grupowych upewnij się, że allowlista i zasady wzmianek są zgodne (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Dedykowane polecenie „health”

`openclaw health` pyta działający Gateway o jego migawkę stanu (bez bezpośrednich gniazd kanałów
z CLI). Domyślnie może zwrócić świeżą buforowaną migawkę Gateway; Gateway
następnie odświeża ten cache w tle. `openclaw health --verbose` zamiast tego wymusza
sondę live. Polecenie raportuje wiek połączonych danych uwierzytelniających/uwierzytelnienia, gdy jest dostępny,
podsumowania sond per kanał, podsumowanie magazynu sesji i czas trwania sondy. Zwraca
kod różny od zera, jeśli Gateway jest nieosiągalny lub sonda kończy się błędem/timeoutem.

Opcje:

- `--json`: wyjście JSON czytelne maszynowo
- `--timeout <ms>`: nadpisuje domyślny timeout sondy 10 s
- `--verbose`: wymusza sondę live i wypisuje szczegóły połączenia Gateway
- `--debug`: alias dla `--verbose`

Migawka stanu zawiera: `ok` (boolean), `ts` (timestamp), `durationMs` (czas sondy), stan per kanał, dostępność agenta i podsumowanie magazynu sesji.

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Eksport diagnostyki](/pl/gateway/diagnostics)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
