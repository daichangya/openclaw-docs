---
read_when:
    - Zmiana trybów uwierzytelniania lub udostępniania panelu sterowania
summary: Dostęp i uwierzytelnianie panelu Gatewaya (Control UI)
title: Panel sterowania
x-i18n:
    generated_at: "2026-04-23T10:11:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5b50d711711f70c51d65f3908b7a8c1e0e978ed46a853f0ab48c13dfe0348ff
    source_path: web/dashboard.md
    workflow: 15
---

# Panel sterowania (Control UI)

Panel Gatewaya to przeglądarkowy interfejs Control UI serwowany domyślnie pod `/`
(nadpisanie przez `gateway.controlUi.basePath`).

Szybkie otwarcie (lokalny Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (lub [http://localhost:18789/](http://localhost:18789/))

Kluczowe odnośniki:

- [Control UI](/pl/web/control-ui) — użycie i możliwości interfejsu.
- [Tailscale](/pl/gateway/tailscale) — automatyzacja Serve/Funnel.
- [Web surfaces](/pl/web) — tryby bind i uwagi dotyczące bezpieczeństwa.

Uwierzytelnianie jest wymuszane przy handshake WebSocket przez skonfigurowaną
ścieżkę auth Gatewaya:

- `connect.params.auth.token`
- `connect.params.auth.password`
- nagłówki tożsamości Tailscale Serve, gdy `gateway.auth.allowTailscale: true`
- nagłówki tożsamości trusted-proxy, gdy `gateway.auth.mode: "trusted-proxy"`

Zobacz `gateway.auth` w [Konfiguracja Gatewaya](/pl/gateway/configuration).

Uwaga dotycząca bezpieczeństwa: Control UI to **powierzchnia administracyjna** (czat, config, zatwierdzenia exec).
Nie udostępniaj go publicznie. UI przechowuje tokeny URL panelu w `sessionStorage`
dla bieżącej sesji karty przeglądarki i wybranego URL Gatewaya, a po załadowaniu usuwa je z URL.
Preferuj localhost, Tailscale Serve albo tunel SSH.

## Szybka ścieżka (zalecana)

- Po onboardingu CLI automatycznie otwiera panel i wypisuje czysty link (bez tokena).
- Otwórz ponownie w dowolnym momencie: `openclaw dashboard` (kopiuje link, otwiera przeglądarkę, jeśli to możliwe, pokazuje wskazówkę SSH, jeśli działa bez interfejsu).
- Jeśli UI prosi o auth współdzielonym sekretem, wklej skonfigurowany token albo
  hasło do ustawień Control UI.

## Podstawy auth (lokalnie vs zdalnie)

- **Localhost**: otwórz `http://127.0.0.1:18789/`.
- **Źródło współdzielonego tokena sekretu**: `gateway.auth.token` (lub
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` może przekazać go przez fragment URL
  do jednorazowego bootstrapu, a Control UI przechowuje go w `sessionStorage` dla
  bieżącej sesji karty przeglądarki i wybranego URL Gatewaya zamiast w `localStorage`.
- Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, `openclaw dashboard`
  zgodnie z założeniem wypisuje/kopiuje/otwiera URL bez tokena. Dzięki temu nie
  ujawnia zewnętrznie zarządzanych tokenów w logach powłoki, historii schowka ani
  argumentach uruchamiania przeglądarki.
- Jeśli `gateway.auth.token` jest skonfigurowany jako SecretRef i nie daje się rozwiązać w
  bieżącej powłoce, `openclaw dashboard` nadal wypisuje URL bez tokena oraz
  praktyczne wskazówki konfiguracji auth.
- **Współdzielone hasło sekretu**: użyj skonfigurowanego `gateway.auth.password` (lub
  `OPENCLAW_GATEWAY_PASSWORD`). Panel nie utrwala haseł między przeładowaniami.
- **Tryby niosące tożsamość**: Tailscale Serve może spełniać auth Control UI/WebSocket
  przez nagłówki tożsamości, gdy `gateway.auth.allowTailscale: true`, a
  reverse proxy świadome tożsamości działające poza loopback może spełniać
  `gateway.auth.mode: "trusted-proxy"`. W tych trybach panel nie
  potrzebuje wklejanego współdzielonego sekretu dla WebSocket.
- **Nie localhost**: użyj Tailscale Serve, bindowania współdzielonym sekretem poza loopback, reverse proxy świadomego tożsamości poza loopback z
  `gateway.auth.mode: "trusted-proxy"` albo tunelu SSH. API HTTP nadal używają
  auth współdzielonym sekretem, chyba że celowo uruchamiasz prywatny ingress z
  `gateway.auth.mode: "none"` albo trusted-proxy HTTP auth. Zobacz
  [Web surfaces](/pl/web).

<a id="if-you-see-unauthorized-1008"></a>

## Jeśli widzisz „unauthorized” / 1008

- Upewnij się, że Gateway jest osiągalny (lokalnie: `openclaw status`; zdalnie: tunel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host`, a następnie otwórz `http://127.0.0.1:18789/`).
- Dla `AUTH_TOKEN_MISMATCH` klienci mogą wykonać jedną zaufaną ponowną próbę z cache’owanym tokenem urządzenia, gdy Gateway zwraca wskazówki ponowienia. Ta ponowna próba z cache’owanym tokenem używa cache’owanego zestawu zatwierdzonych zakresów tokena; wywołujący z jawnym `deviceToken` / jawnymi `scopes` zachowują swój żądany zestaw zakresów. Jeśli auth nadal kończy się błędem po tej ponownej próbie, napraw ręcznie dryf tokena.
- Poza tą ścieżką ponowienia pierwszeństwo connect auth jest następujące: jawny współdzielony token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia, potem token bootstrap.
- W asynchronicznej ścieżce Tailscale Serve Control UI nieudane próby dla tego samego
  `{scope, ip}` są serializowane przed zapisaniem ich przez limiter nieudanego auth, więc
  druga współbieżna zła ponowna próba może już pokazać `retry later`.
- Aby naprawić dryf tokena, postępuj zgodnie z [checklistą odzyskiwania dryfu tokena](/pl/cli/devices#token-drift-recovery-checklist).
- Pobierz albo podaj współdzielony sekret z hosta Gatewaya:
  - Token: `openclaw config get gateway.auth.token`
  - Hasło: rozwiąż skonfigurowane `gateway.auth.password` albo
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token zarządzany przez SecretRef: rozwiąż zewnętrznego dostawcę sekretów albo wyeksportuj
    `OPENCLAW_GATEWAY_TOKEN` w tej powłoce, a następnie ponownie uruchom `openclaw dashboard`
  - Brak skonfigurowanego współdzielonego sekretu: `openclaw doctor --generate-gateway-token`
- W ustawieniach panelu wklej token lub hasło do pola auth,
  a następnie połącz.
- Selektor języka UI znajduje się w **Overview -> Gateway Access -> Language**.
  Jest częścią karty dostępu, a nie sekcji Appearance.
