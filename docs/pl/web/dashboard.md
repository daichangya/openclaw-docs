---
read_when:
    - Zmiana uwierzytelniania panelu sterowania lub trybów ekspozycji
summary: Dostęp i uwierzytelnianie panelu Gateway (Control UI)
title: Panel sterowania
x-i18n:
    generated_at: "2026-04-25T14:01:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e0e7c8cebe715f96e7f0e967e9fd86c4c6c54f7cc08a4291b02515fc0933a1a
    source_path: web/dashboard.md
    workflow: 15
---

Panel Gateway to przeglądarkowy interfejs Control UI, domyślnie serwowany pod `/`
(nadpisanie przez `gateway.controlUi.basePath`).

Szybkie otwarcie (lokalny Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (lub [http://localhost:18789/](http://localhost:18789/))
- Przy `gateway.tls.enabled: true` użyj `https://127.0.0.1:18789/` oraz
  `wss://127.0.0.1:18789` dla punktu końcowego WebSocket.

Kluczowe odnośniki:

- [Control UI](/pl/web/control-ui) — informacje o użyciu i możliwościach interfejsu.
- [Tailscale](/pl/gateway/tailscale) — informacje o automatyzacji Serve/Funnel.
- [Powierzchnie webowe](/pl/web) — informacje o trybach powiązań i uwagach dotyczących bezpieczeństwa.

Uwierzytelnianie jest wymuszane podczas handshake WebSocket przez skonfigurowaną
ścieżkę uwierzytelniania gateway:

- `connect.params.auth.token`
- `connect.params.auth.password`
- nagłówki tożsamości Tailscale Serve, gdy `gateway.auth.allowTailscale: true`
- nagłówki tożsamości zaufanego proxy, gdy `gateway.auth.mode: "trusted-proxy"`

Zobacz `gateway.auth` w [Konfiguracji Gateway](/pl/gateway/configuration).

Uwaga dotycząca bezpieczeństwa: Control UI to **powierzchnia administracyjna**
(czat, konfiguracja, zatwierdzenia exec). Nie wystawiaj jej publicznie. Interfejs
przechowuje tokeny URL panelu w `sessionStorage` dla bieżącej sesji karty przeglądarki
i wybranego adresu URL gateway, a po załadowaniu usuwa je z URL.
Preferuj localhost, Tailscale Serve lub tunel SSH.

## Szybka ścieżka (zalecane)

- Po wdrożeniu CLI automatycznie otwiera panel i wypisuje czysty link (bez tokena).
- Otwórz ponownie w dowolnym momencie: `openclaw dashboard` (kopiuje link, otwiera przeglądarkę, jeśli to możliwe, i pokazuje wskazówkę SSH w trybie bezgłowym).
- Jeśli interfejs poprosi o uwierzytelnianie wspólnym sekretem, wklej skonfigurowany token lub
  hasło w ustawieniach Control UI.

## Podstawy uwierzytelniania (lokalnie vs zdalnie)

- **Localhost**: otwórz `http://127.0.0.1:18789/`.
- **TLS Gateway**: gdy `gateway.tls.enabled: true`, linki panelu/statusu używają
  `https://`, a linki WebSocket w Control UI używają `wss://`.
- **Źródło tokena wspólnego sekretu**: `gateway.auth.token` (lub
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` może przekazać go przez fragment URL
  do jednorazowego bootstrapowania, a Control UI przechowuje go w `sessionStorage` dla
  bieżącej sesji karty przeglądarki i wybranego adresu URL gateway zamiast w `localStorage`.
- Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, `openclaw dashboard`
  celowo wypisuje/kopiuje/otwiera URL bez tokena. Pozwala to uniknąć ujawniania
  zewnętrznie zarządzanych tokenów w logach powłoki, historii schowka lub argumentach
  uruchamiania przeglądarki.
- Jeśli `gateway.auth.token` jest skonfigurowany jako SecretRef i nie jest rozwiązany w bieżącej
  powłoce, `openclaw dashboard` nadal wypisuje URL bez tokena oraz
  praktyczne wskazówki dotyczące konfiguracji uwierzytelniania.
- **Hasło wspólnego sekretu**: użyj skonfigurowanego `gateway.auth.password` (lub
  `OPENCLAW_GATEWAY_PASSWORD`). Panel nie zachowuje haseł po przeładowaniu.
- **Tryby z tożsamością**: Tailscale Serve może spełnić wymagania uwierzytelniania Control UI/WebSocket
  przez nagłówki tożsamości, gdy `gateway.auth.allowTailscale: true`, a
  reverse proxy świadome tożsamości, działające poza loopback, może spełnić je przy
  `gateway.auth.mode: "trusted-proxy"`. W tych trybach panel nie
  potrzebuje wklejonego wspólnego sekretu dla WebSocket.
- **Nie localhost**: użyj Tailscale Serve, powiązania poza loopback ze wspólnym sekretem,
  reverse proxy świadomego tożsamości poza loopback z
  `gateway.auth.mode: "trusted-proxy"` lub tunelu SSH. Interfejsy HTTP API nadal używają
  uwierzytelniania wspólnym sekretem, chyba że celowo uruchamiasz prywatny ingress z
  `gateway.auth.mode: "none"` lub uwierzytelnianie HTTP trusted-proxy. Zobacz
  [Powierzchnie webowe](/pl/web).

<a id="if-you-see-unauthorized-1008"></a>

## Jeśli widzisz „unauthorized” / 1008

- Upewnij się, że gateway jest osiągalny (lokalnie: `openclaw status`; zdalnie: tunel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host`, a następnie otwórz `http://127.0.0.1:18789/`).
- Przy `AUTH_TOKEN_MISMATCH` klienci mogą wykonać jedną zaufaną ponowną próbę z buforowanym tokenem urządzenia, gdy gateway zwraca wskazówki ponowienia. Ta ponowna próba z buforowanym tokenem ponownie używa buforowanych zatwierdzonych zakresów tokena; wywołania z jawnym `deviceToken` / jawnymi `scopes` zachowują żądany zestaw zakresów. Jeśli uwierzytelnianie nadal się nie powiedzie po tej ponownej próbie, ręcznie rozwiąż rozjazd tokena.
- Poza tą ścieżką ponowienia pierwszeństwo uwierzytelniania połączenia jest następujące: najpierw jawny wspólny token/hasło, następnie jawny `deviceToken`, potem zapisany token urządzenia, a na końcu token bootstrapujący.
- W asynchronicznej ścieżce Tailscale Serve Control UI nieudane próby dla tego samego
  `{scope, ip}` są serializowane, zanim limiter nieudanego uwierzytelniania je zapisze, więc
  druga równoległa błędna ponowna próba może już pokazać `retry later`.
- Kroki naprawy rozjazdu tokena znajdziesz w [Liście kontrolnej odzyskiwania po rozjechaniu tokena](/pl/cli/devices#token-drift-recovery-checklist).
- Pobierz lub podaj wspólny sekret z hosta gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Hasło: rozwiąż skonfigurowane `gateway.auth.password` lub
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token zarządzany przez SecretRef: rozwiąż zewnętrznego dostawcę sekretów lub wyeksportuj
    `OPENCLAW_GATEWAY_TOKEN` w tej powłoce, a następnie ponownie uruchom `openclaw dashboard`
  - Brak skonfigurowanego wspólnego sekretu: `openclaw doctor --generate-gateway-token`
- W ustawieniach panelu wklej token lub hasło do pola uwierzytelniania,
  a następnie połącz się.
- Selektor języka interfejsu znajduje się w **Overview -> Gateway Access -> Language**.
  Jest częścią karty dostępu, a nie sekcji Appearance.

## Powiązane

- [Control UI](/pl/web/control-ui)
- [WebChat](/pl/web/webchat)
