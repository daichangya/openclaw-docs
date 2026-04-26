---
read_when:
    - Debugowanie lub konfiguracja dostępu do WebChat
summary: Host statyczny local loopback WebChat i użycie Gateway WS dla interfejsu czatu
title: WebChat
x-i18n:
    generated_at: "2026-04-26T11:44:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: eb64bf7771f833a6d97c1b0ad773e763422af25e85a3084519e05aa8d3d0ab69
    source_path: web/webchat.md
    workflow: 15
---

Status: interfejs czatu SwiftUI na macOS/iOS komunikuje się bezpośrednio z WebSocket Gateway.

## Czym to jest

- Natywny interfejs czatu dla gateway (bez osadzonej przeglądarki i bez lokalnego serwera statycznego).
- Używa tych samych sesji i reguł trasowania co inne kanały.
- Deterministyczne trasowanie: odpowiedzi zawsze wracają do WebChat.

## Szybki start

1. Uruchom gateway.
2. Otwórz interfejs WebChat (aplikacja macOS/iOS) lub kartę czatu Control UI.
3. Upewnij się, że skonfigurowano prawidłową ścieżkę uwierzytelniania gateway (domyślnie shared-secret,
   nawet na local loopback).

## Jak to działa (zachowanie)

- Interfejs łączy się z WebSocket Gateway i używa `chat.history`, `chat.send` oraz `chat.inject`.
- `chat.history` jest ograniczone dla stabilności: Gateway może obcinać długie pola tekstowe, pomijać ciężkie metadane i zastępować zbyt duże wpisy przez `[chat.history omitted: message too large]`.
- `chat.history` jest również normalizowane do wyświetlania: widoczny tekst jest oczyszczany z kontekstu OpenClaw tylko dla środowiska uruchomieniowego,
  przychodzących opakowań kopertowych, wbudowanych tagów dyrektyw dostarczania
  takich jak `[[reply_to_*]]` i `[[audio_as_voice]]`, zwykłych tekstowych ładunków XML wywołań narzędzi
  (w tym `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` oraz
  obciętych bloków wywołań narzędzi), a także wyciekłych tokenów kontroli modelu ASCII/full-width,
  a wpisy asystenta, których cały widoczny tekst to wyłącznie dokładny
  cichy token `NO_REPLY` / `no_reply`, są pomijane.
- Ładunki odpowiedzi oznaczone jako reasoning (`isReasoning: true`) są wykluczane z treści asystenta WebChat, tekstu odtwarzania transkryptu i bloków treści audio, dzięki czemu ładunki zawierające wyłącznie thinking nie pojawiają się jako widoczne wiadomości asystenta ani odtwarzalne audio.
- `chat.inject` dopisuje notatkę asystenta bezpośrednio do transkryptu i rozgłasza ją do interfejsu (bez przebiegu agenta).
- Przerwane przebiegi mogą pozostawić częściowe wyjście asystenta widoczne w interfejsie.
- Gateway utrwala przerwany częściowy tekst asystenta w historii transkryptu, gdy istnieje buforowane wyjście, i oznacza te wpisy metadanymi przerwania.
- Historia jest zawsze pobierana z gateway (bez lokalnego obserwowania plików).
- Jeśli gateway jest nieosiągalny, WebChat działa tylko do odczytu.

## Panel narzędzi agentów w Control UI

- Panel Tools w `/agents` w Control UI ma dwa oddzielne widoki:
  - **Dostępne teraz** używa `tools.effective(sessionKey=...)` i pokazuje, z czego bieżąca
    sesja może faktycznie korzystać w środowisku uruchomieniowym, w tym narzędzia należące do rdzenia, pluginów i kanałów.
  - **Konfiguracja narzędzi** używa `tools.catalog` i pozostaje skupiona na profilach, nadpisaniach oraz
    semantyce katalogu.
- Dostępność w środowisku uruchomieniowym jest ograniczona do sesji. Przełączanie sesji na tym samym agencie może zmienić listę
  **Dostępne teraz**.
- Edytor konfiguracji nie implikuje dostępności w środowisku uruchomieniowym; efektywny dostęp nadal podlega
  priorytetowi polityk (`allow`/`deny`, nadpisania per agent oraz dostawca/kanał).

## Użycie zdalne

- Tryb zdalny tuneluje WebSocket gateway przez SSH/Tailscale.
- Nie musisz uruchamiać oddzielnego serwera WebChat.

## Odniesienie do konfiguracji (WebChat)

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

Opcje WebChat:

- `gateway.webchat.chatHistoryMaxChars`: maksymalna liczba znaków dla pól tekstowych w odpowiedziach `chat.history`. Gdy wpis transkryptu przekracza ten limit, Gateway obcina długie pola tekstowe i może zastąpić zbyt duże wiadomości placeholderem. Klient może także wysłać `maxChars` per żądanie, aby nadpisać tę wartość domyślną dla pojedynczego wywołania `chat.history`.

Powiązane opcje globalne:

- `gateway.port`, `gateway.bind`: host/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  uwierzytelnianie WebSocket typu shared-secret.
- `gateway.auth.allowTailscale`: karta czatu w przeglądarkowym Control UI może używać nagłówków tożsamości Tailscale
  Serve, gdy ta opcja jest włączona.
- `gateway.auth.mode: "trusted-proxy"`: uwierzytelnianie reverse-proxy dla klientów przeglądarkowych za proxy **spoza local loopback** rozpoznającego tożsamość źródła (zobacz [Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: docelowy zdalny gateway.
- `session.*`: przechowywanie sesji i domyślne klucze główne.

## Powiązane

- [Control UI](/pl/web/control-ui)
- [Dashboard](/pl/web/dashboard)
