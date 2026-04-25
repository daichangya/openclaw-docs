---
read_when:
    - Debugowanie lub konfigurowanie dostępu do WebChat
summary: Statyczny host loopback WebChat i użycie Gateway WS dla interfejsu czatu
title: WebChat
x-i18n:
    generated_at: "2026-04-25T14:02:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: c112aca6c6fb29c5752fe931dcd47749acf0b8d8d505522f75b82533fc3ffb5a
    source_path: web/webchat.md
    workflow: 15
---

Status: interfejs czatu SwiftUI na macOS/iOS komunikuje się bezpośrednio z WebSocket Gateway.

## Czym to jest

- Natywny interfejs czatu dla gateway (bez osadzonej przeglądarki i bez lokalnego serwera statycznego).
- Używa tych samych sesji i reguł routingu co inne kanały.
- Deterministyczny routing: odpowiedzi zawsze wracają do WebChat.

## Szybki start

1. Uruchom gateway.
2. Otwórz interfejs WebChat (aplikacja macOS/iOS) albo kartę czatu w Control UI.
3. Upewnij się, że skonfigurowana jest prawidłowa ścieżka auth gateway (domyślnie wspólny sekret,
   nawet na loopback).

## Jak to działa (zachowanie)

- Interfejs łączy się z WebSocket Gateway i używa `chat.history`, `chat.send` oraz `chat.inject`.
- `chat.history` jest ograniczane dla stabilności: Gateway może przycinać długie pola tekstowe, pomijać ciężkie metadane i zastępować zbyt duże wpisy tekstem `[chat.history omitted: message too large]`.
- `chat.history` jest też normalizowane na potrzeby wyświetlania: kontekst OpenClaw tylko dla runtime,
  wrappery kopert wejściowych, tagi dyrektyw dostarczania inline
  takie jak `[[reply_to_*]]` i `[[audio_as_voice]]`, ładunki XML wywołań narzędzi w postaci zwykłego tekstu
  (w tym `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` oraz
  przycięte bloki wywołań narzędzi), a także wyciekłe tokeny sterujące modelu ASCII/full-width są usuwane z widocznego tekstu,
  zaś wpisy asystenta, których cały widoczny tekst to wyłącznie dokładny
  cichy token `NO_REPLY` / `no_reply`, są pomijane.
- `chat.inject` dopisuje notatkę asystenta bezpośrednio do transkryptu i rozsyła ją do interfejsu (bez uruchamiania agenta).
- Przerwane uruchomienia mogą pozostawić częściowy wynik asystenta widoczny w interfejsie.
- Gateway zapisuje częściowy tekst asystenta z przerwanych uruchomień do historii transkryptu, gdy istnieje zbuforowany wynik, i oznacza te wpisy metadanymi przerwania.
- Historia jest zawsze pobierana z gateway (bez lokalnego obserwowania plików).
- Jeśli gateway jest nieosiągalny, WebChat działa tylko do odczytu.

## Panel narzędzi agentów w Control UI

- Panel Tools w `/agents` w Control UI ma dwa oddzielne widoki:
  - **Dostępne teraz** używa `tools.effective(sessionKey=...)` i pokazuje, z czego bieżąca
    sesja może faktycznie korzystać w runtime, w tym narzędzia core, Pluginów i należące do kanałów.
  - **Konfiguracja narzędzi** używa `tools.catalog` i pozostaje skupiony na profilach, nadpisaniach oraz
    semantyce katalogu.
- Dostępność w runtime jest ograniczona do sesji. Przełączanie sesji na tym samym agencie może zmienić listę
  **Dostępne teraz**.
- Edytor konfiguracji nie implikuje dostępności w runtime; efektywny dostęp nadal podlega
  priorytetowi polityk (`allow`/`deny`, nadpisania per agent i dostawca/kanał).

## Użycie zdalne

- Tryb zdalny tuneluje WebSocket Gateway przez SSH/Tailscale.
- Nie musisz uruchamiać osobnego serwera WebChat.

## Dokumentacja konfiguracji (WebChat)

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

Opcje WebChat:

- `gateway.webchat.chatHistoryMaxChars`: maksymalna liczba znaków dla pól tekstowych w odpowiedziach `chat.history`. Gdy wpis transkryptu przekracza ten limit, Gateway przycina długie pola tekstowe i może zastąpić zbyt duże wiadomości placeholderem. Klient może też wysłać `maxChars` per żądanie, aby nadpisać tę wartość domyślną dla pojedynczego wywołania `chat.history`.

Powiązane opcje globalne:

- `gateway.port`, `gateway.bind`: host/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  auth WebSocket oparty na wspólnym sekrecie.
- `gateway.auth.allowTailscale`: karta czatu przeglądarkowego Control UI może używać nagłówków tożsamości Tailscale
  Serve, gdy są włączone.
- `gateway.auth.mode: "trusted-proxy"`: auth reverse proxy dla klientów przeglądarkowych za świadomym tożsamości **nie-loopback** źródłem proxy (zobacz [Auth Trusted Proxy](/pl/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: cel zdalnego gateway.
- `session.*`: przechowywanie sesji i domyślne główne klucze.

## Powiązane

- [Control UI](/pl/web/control-ui)
- [Dashboard](/pl/web/dashboard)
