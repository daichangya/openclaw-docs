---
read_when:
    - Implementowanie lub zmienianie odkrywania/reklamowania Bonjour
    - Dostosowywanie trybów połączenia zdalnego (direct vs SSH)
    - Projektowanie odkrywania Node i parowania dla zdalnych Node
summary: Odkrywanie Node i transporty (Bonjour, Tailscale, SSH) do znajdowania Gateway
title: Odkrywanie i transporty
x-i18n:
    generated_at: "2026-04-26T11:29:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 615be0f501470772c257beb8e798c522c108b09081a603f44218404277fdf269
    source_path: gateway/discovery.md
    workflow: 15
---

# Odkrywanie i transporty

OpenClaw ma dwa odrębne problemy, które na pierwszy rzut oka wyglądają podobnie:

1. **Zdalne sterowanie operatora**: aplikacja macOS na pasku menu sterująca Gateway uruchomionym gdzie indziej.
2. **Parowanie Node**: iOS/Android (oraz przyszłe Node) znajdujące Gateway i bezpiecznie się z nim parujące.

Celem projektu jest utrzymanie całego odkrywania/reklamowania sieciowego w **Node Gateway** (`openclaw gateway`) i pozostawienie klientów (aplikacja mac, iOS) jako konsumentów.

## Terminy

- **Gateway**: pojedynczy długotrwale działający proces Gateway, który zarządza stanem (sesje, parowanie, rejestr Node) i uruchamia kanały. Większość konfiguracji używa jednego na hosta; możliwe są izolowane konfiguracje z wieloma Gateway.
- **Gateway WS (control plane)**: punkt końcowy WebSocket domyślnie na `127.0.0.1:18789`; może być zbindowany do LAN/tailnet przez `gateway.bind`.
- **Transport direct WS**: punkt końcowy Gateway WS dostępny przez LAN/tailnet (bez SSH).
- **Transport SSH (fallback)**: zdalne sterowanie przez przekierowanie `127.0.0.1:18789` przez SSH.
- **Legacy TCP bridge (usunięty)**: starszy transport Node (zobacz
  [Bridge protocol](/pl/gateway/bridge-protocol)); nie jest już reklamowany przy
  odkrywaniu i nie jest już częścią bieżących buildów.

Szczegóły protokołu:

- [Gateway protocol](/pl/gateway/protocol)
- [Bridge protocol (legacy)](/pl/gateway/bridge-protocol)

## Dlaczego zachowujemy zarówno „direct”, jak i SSH

- **Direct WS** daje najlepsze UX w tej samej sieci i w obrębie tailnet:
  - automatyczne odkrywanie w LAN przez Bonjour
  - tokeny parowania + ACL zarządzane przez Gateway
  - brak wymaganego dostępu do powłoki; powierzchnia protokołu może pozostać wąska i łatwa do audytu
- **SSH** pozostaje uniwersalnym fallbackiem:
  - działa wszędzie tam, gdzie masz dostęp SSH (nawet między niepowiązanymi sieciami)
  - działa mimo problemów z multicast/mDNS
  - nie wymaga nowych portów przychodzących poza SSH

## Wejścia odkrywania (jak klienci dowiadują się, gdzie jest Gateway)

### 1) Odkrywanie Bonjour / DNS-SD

Multicast Bonjour działa w trybie best-effort i nie przechodzi między sieciami. OpenClaw może także przeglądać
ten sam beacon Gateway przez skonfigurowaną domenę wide-area DNS-SD, więc odkrywanie może obejmować:

- `local.` w tej samej sieci LAN
- skonfigurowaną domenę unicast DNS-SD dla odkrywania między sieciami

Docelowy kierunek:

- **Gateway** reklamuje swój punkt końcowy WS przez Bonjour.
- Klienci przeglądają go i pokazują listę „wybierz Gateway”, a następnie zapisują wybrany punkt końcowy.

Szczegóły rozwiązywania problemów i beacona: [Bonjour](/pl/gateway/bonjour).

#### Szczegóły beacona usługi

- Typy usług:
  - `_openclaw-gw._tcp` (beacon transportu gateway)
- Klucze TXT (niebędące sekretami):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (nazwa wyświetlana skonfigurowana przez operatora)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (tylko gdy TLS jest włączony)
  - `gatewayTlsSha256=<sha256>` (tylko gdy TLS jest włączony i fingerprint jest dostępny)
  - `canvasPort=<port>` (port hosta canvas; obecnie taki sam jak `gatewayPort`, gdy host canvas jest włączony)
  - `tailnetDns=<magicdns>` (opcjonalna wskazówka; wykrywane automatycznie, gdy Tailscale jest dostępny)
  - `sshPort=<port>` (tylko w pełnym trybie mDNS; wide-area DNS-SD może to pomijać, w takim przypadku domyślny port SSH pozostaje `22`)
  - `cliPath=<path>` (tylko w pełnym trybie mDNS; wide-area DNS-SD nadal zapisuje to jako wskazówkę dla zdalnej instalacji)

Uwagi dotyczące bezpieczeństwa:

- Rekordy TXT Bonjour/mDNS są **nieuwierzytelnione**. Klienci muszą traktować wartości TXT wyłącznie jako wskazówki UX.
- Routing (host/port) powinien preferować **rozstrzygnięty punkt końcowy usługi** (SRV + A/AAAA) zamiast wartości `lanHost`, `tailnetDns` lub `gatewayPort` podanych w TXT.
- Pinning TLS nigdy nie może pozwolić, aby reklamowany `gatewayTlsSha256` nadpisał wcześniej zapisany pin.
- Node iOS/Android powinny wymagać jawnego potwierdzenia „zaufaj temu fingerprintowi” przed zapisaniem pierwszego pina (weryfikacja out-of-band), ilekroć wybrana trasa jest bezpieczna/oparta na TLS.

Wyłączanie/nadpisywanie:

- `OPENCLAW_DISABLE_BONJOUR=1` wyłącza reklamowanie.
- Docker Compose domyślnie ustawia `OPENCLAW_DISABLE_BONJOUR=1`, ponieważ sieci bridge
  zwykle nie przenoszą niezawodnie multicastu mDNS; użyj `0` tylko na host, macvlan
  albo innej sieci obsługującej mDNS.
- `gateway.bind` w `~/.openclaw/openclaw.json` steruje trybem bindowania Gateway.
- `OPENCLAW_SSH_PORT` nadpisuje reklamowany port SSH, gdy emitowany jest `sshPort`.
- `OPENCLAW_TAILNET_DNS` publikuje wskazówkę `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` nadpisuje reklamowaną ścieżkę CLI.

### 2) Tailnet (między sieciami)

Dla konfiguracji w stylu London/Vienna Bonjour nie pomoże. Zalecanym celem „direct” jest:

- nazwa Tailscale MagicDNS (preferowana) albo stabilny adres IP tailnet.

Jeśli Gateway może wykryć, że działa pod Tailscale, publikuje `tailnetDns` jako opcjonalną wskazówkę dla klientów (w tym beaconów wide-area).

Aplikacja macOS preferuje teraz nazwy MagicDNS zamiast surowych adresów IP Tailscale przy odkrywaniu Gateway. Poprawia to niezawodność, gdy adresy IP tailnet się zmieniają (na przykład po restartach Node lub ponownym przypisaniu CGNAT), ponieważ nazwy MagicDNS automatycznie rozwiązują się do bieżącego IP.

Dla parowania mobilnych Node wskazówki odkrywania nie łagodzą bezpieczeństwa transportu na trasach tailnet/public:

- iOS/Android nadal wymagają bezpiecznej ścieżki pierwszego połączenia tailnet/public (`wss://` lub Tailscale Serve/Funnel).
- Odkryty surowy adres IP tailnet jest wskazówką routingu, a nie pozwoleniem na użycie zdalnego, jawnotekstowego `ws://`.
- Prywatne połączenie direct `ws://` w LAN nadal jest obsługiwane.
- Jeśli chcesz najprostszą ścieżkę Tailscale dla mobilnych Node, użyj Tailscale Serve, aby odkrywanie i kod konfiguracji rozwiązywały się do tego samego bezpiecznego punktu końcowego MagicDNS.

### 3) Cel ręczny / SSH

Gdy nie ma trasy direct (albo direct jest wyłączony), klienci zawsze mogą połączyć się przez SSH, przekierowując port loopback Gateway.

Zobacz [Dostęp zdalny](/pl/gateway/remote).

## Wybór transportu (polityka klienta)

Zalecane zachowanie klienta:

1. Jeśli skonfigurowany jest sparowany punkt końcowy direct i jest osiągalny, użyj go.
2. W przeciwnym razie, jeśli odkrywanie znajdzie Gateway w `local.` lub w skonfigurowanej domenie wide-area, zaoferuj jednoklikowy wybór „Użyj tego Gateway” i zapisz go jako punkt końcowy direct.
3. W przeciwnym razie, jeśli skonfigurowano DNS/IP tailnet, spróbuj direct.
   Dla mobilnych Node na trasach tailnet/public direct oznacza bezpieczny punkt końcowy, a nie zdalny, jawnotekstowy `ws://`.
4. W przeciwnym razie wróć do SSH.

## Parowanie + auth (transport direct)

Gateway jest źródłem prawdy dla dopuszczania Node/klientów.

- Żądania parowania są tworzone/zatwierdzane/odrzucane w Gateway (zobacz [Parowanie Gateway](/pl/gateway/pairing)).
- Gateway wymusza:
  - auth (token / para kluczy)
  - zakresy/ACL (Gateway nie jest surowym proxy do każdej metody)
  - limity zapytań

## Odpowiedzialności komponentów

- **Gateway**: reklamuje beacony odkrywania, zarządza decyzjami parowania i hostuje punkt końcowy WS.
- **Aplikacja macOS**: pomaga wybrać Gateway, pokazuje monity parowania i używa SSH tylko jako fallbacku.
- **Node iOS/Android**: przeglądają Bonjour dla wygody i łączą się ze sparowanym Gateway WS.

## Powiązane

- [Dostęp zdalny](/pl/gateway/remote)
- [Tailscale](/pl/gateway/tailscale)
- [Odkrywanie Bonjour](/pl/gateway/bonjour)
