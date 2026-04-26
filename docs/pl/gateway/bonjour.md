---
read_when:
    - Debugowanie problemów z wykrywaniem Bonjour na macOS/iOS
    - Zmiana typów usług mDNS, rekordów TXT lub UX wykrywania
summary: Wykrywanie Bonjour/mDNS + debugowanie (beacony Gateway, klienci i typowe tryby awarii)
title: Wykrywanie Bonjour
x-i18n:
    generated_at: "2026-04-26T11:28:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: b055021bdcd92740934823dea2acf758c6ec991a15c0a315426dc359a7eea093
    source_path: gateway/bonjour.md
    workflow: 15
---

# Wykrywanie Bonjour / mDNS

OpenClaw używa Bonjour (mDNS / DNS‑SD) do wykrywania aktywnego Gateway (endpoint WebSocket).
Przeglądanie multicast `local.` to **udogodnienie tylko w LAN**. Dołączony
Plugin `bonjour` odpowiada za reklamowanie w LAN i jest domyślnie włączony. W przypadku wykrywania między sieciami
ten sam beacon może być także publikowany przez skonfigurowaną domenę wide-area DNS-SD.
Wykrywanie nadal ma charakter best-effort i **nie** zastępuje łączności przez SSH ani Tailnet.

## Wide-area Bonjour (Unicast DNS-SD) przez Tailscale

Jeśli Node i gateway znajdują się w różnych sieciach, multicast mDNS nie przekroczy
tej granicy. Możesz zachować ten sam UX wykrywania, przełączając się na **unicast DNS‑SD**
("Wide‑Area Bonjour") przez Tailscale.

Kroki na wysokim poziomie:

1. Uruchom serwer DNS na hoście gateway (osiągalny przez Tailnet).
2. Opublikuj rekordy DNS‑SD dla `_openclaw-gw._tcp` w dedykowanej strefie
   (przykład: `openclaw.internal.`).
3. Skonfiguruj **split DNS** w Tailscale, aby wybrana domena była rozwiązywana przez ten
   serwer DNS dla klientów (w tym iOS).

OpenClaw obsługuje dowolną domenę wykrywania; `openclaw.internal.` to tylko przykład.
Node iOS/Android przeglądają zarówno `local.`, jak i skonfigurowaną domenę wide-area.

### Konfiguracja Gateway (zalecana)

```json5
{
  gateway: { bind: "tailnet" }, // tylko tailnet (zalecane)
  discovery: { wideArea: { enabled: true } }, // włącza publikowanie wide-area DNS-SD
}
```

### Jednorazowa konfiguracja serwera DNS (host gateway)

```bash
openclaw dns setup --apply
```

To instaluje CoreDNS i konfiguruje go tak, aby:

- nasłuchiwał na porcie 53 tylko na interfejsach Tailscale gateway
- obsługiwał wybraną domenę (przykład: `openclaw.internal.`) z `~/.openclaw/dns/<domain>.db`

Zweryfikuj z maszyny połączonej z tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Ustawienia DNS Tailscale

W konsoli administracyjnej Tailscale:

- Dodaj nameserver wskazujący na adres IP tailnet gateway (UDP/TCP 53).
- Dodaj split DNS, aby domena wykrywania używała tego nameservera.

Gdy klienci zaakceptują DNS tailnet, Node iOS oraz wykrywanie CLI mogą przeglądać
`_openclaw-gw._tcp` w domenie wykrywania bez multicast.

### Bezpieczeństwo listenera Gateway (zalecane)

Port Gateway WS (domyślnie `18789`) domyślnie wiąże się z loopback. Dla dostępu LAN/tailnet
wiąż go jawnie i pozostaw włączone uwierzytelnianie.

Dla konfiguracji tylko tailnet:

- Ustaw `gateway.bind: "tailnet"` w `~/.openclaw/openclaw.json`.
- Uruchom ponownie Gateway (lub uruchom ponownie aplikację paska menu macOS).

## Co się reklamuje

Tylko Gateway reklamuje `_openclaw-gw._tcp`. Reklamowanie multicast w LAN jest
zapewniane przez dołączony Plugin `bonjour`; publikacja wide-area DNS-SD nadal
pozostaje po stronie Gateway.

## Typy usług

- `_openclaw-gw._tcp` — beacon transportu gateway (używany przez Node macOS/iOS/Android).

## Klucze TXT (niejawne podpowiedzi)

Gateway reklamuje niewielkie, niejwne podpowiedzi, aby ułatwić przepływy UI:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (tylko gdy TLS jest włączony)
- `gatewayTlsSha256=<sha256>` (tylko gdy TLS jest włączony i odcisk palca jest dostępny)
- `canvasPort=<port>` (tylko gdy host canvas jest włączony; obecnie taki sam jak `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (tylko pełny tryb mDNS, opcjonalna podpowiedź, gdy Tailnet jest dostępny)
- `sshPort=<port>` (tylko pełny tryb mDNS; wide-area DNS-SD może go pomijać)
- `cliPath=<path>` (tylko pełny tryb mDNS; wide-area DNS-SD nadal zapisuje go jako podpowiedź zdalnej instalacji)

Uwagi dotyczące bezpieczeństwa:

- Rekordy TXT Bonjour/mDNS są **nieuwierzytelnione**. Klienci nie mogą traktować TXT jako autorytatywnego routingu.
- Klienci powinni routować przy użyciu rozwiązanego endpointu usługi (SRV + A/AAAA). Traktuj `lanHost`, `tailnetDns`, `gatewayPort` i `gatewayTlsSha256` wyłącznie jako podpowiedzi.
- Automatyczne wskazywanie celu SSH powinno podobnie używać rozwiązanego hosta usługi, a nie podpowiedzi wyłącznie z TXT.
- Pinning TLS nigdy nie może pozwalać, by reklamowany `gatewayTlsSha256` nadpisywał wcześniej zapisany pin.
- Node iOS/Android powinny traktować bezpośrednie połączenia oparte na wykrywaniu jako **tylko TLS** i wymagać jawnego potwierdzenia użytkownika przed zaufaniem odciskowi palca przy pierwszym użyciu.

## Debugowanie na macOS

Przydatne wbudowane narzędzia:

- Przeglądaj instancje:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Rozwiąż jedną instancję (zastąp `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Jeśli przeglądanie działa, ale rozwiązywanie nie, zwykle oznacza to problem z polityką LAN lub
resolverem mDNS.

## Debugowanie w logach Gateway

Gateway zapisuje rotujący plik logu (wypisywany przy uruchomieniu jako
`gateway log file: ...`). Szukaj linii `bonjour:`, w szczególności:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

## Debugowanie na Node iOS

Node iOS używa `NWBrowser` do wykrywania `_openclaw-gw._tcp`.

Aby przechwycić logi:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → odtwórz problem → **Copy**

Log zawiera przejścia stanu przeglądarki i zmiany zbioru wyników.

## Kiedy wyłączyć Bonjour

Wyłącz Bonjour tylko wtedy, gdy reklamowanie multicast w LAN jest niedostępne lub szkodliwe.
Typowy przypadek to Gateway uruchomiony za Docker bridge networking, WSL lub
polityką sieciową, która odrzuca multicast mDNS. W takich środowiskach Gateway nadal
jest osiągalny przez opublikowany URL, SSH, Tailnet lub wide-area DNS-SD,
ale automatyczne wykrywanie w LAN nie jest niezawodne.

Gdy problem dotyczy zakresu wdrożenia, preferuj istniejące nadpisanie środowiskowe:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

To wyłącza reklamowanie multicast w LAN bez zmiany konfiguracji Pluginu.
Jest bezpieczne dla obrazów Docker, plików usług, skryptów uruchomieniowych i jednorazowego
debugowania, ponieważ ustawienie znika wraz ze środowiskiem.

Używaj konfiguracji Pluginu tylko wtedy, gdy celowo chcesz wyłączyć
dołączony Plugin wykrywania LAN dla tej konfiguracji OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Pułapki Dockera

Dołączony Docker Compose domyślnie ustawia `OPENCLAW_DISABLE_BONJOUR=1` dla usługi Gateway.
Sieci Docker bridge zwykle nie przekazują multicast mDNS
(`224.0.0.251:5353`) między kontenerem a LAN, więc pozostawienie włączonego Bonjour może
powodować powtarzające się błędy ciao `probing` lub `announcing`, nie sprawiając, że wykrywanie zacznie działać.

Ważne pułapki:

- Wyłączenie Bonjour nie zatrzymuje Gateway. Zatrzymuje tylko reklamowanie multicast w LAN.
- Wyłączenie Bonjour nie zmienia `gateway.bind`; Docker nadal domyślnie używa
  `OPENCLAW_GATEWAY_BIND=lan`, aby opublikowany port hosta mógł działać.
- Wyłączenie Bonjour nie wyłącza wide-area DNS-SD. Użyj wykrywania wide-area
  lub Tailnet, gdy Gateway i Node nie znajdują się w tym samym LAN.
- Ponowne użycie tego samego `OPENCLAW_CONFIG_DIR` poza Dockerem nie dziedziczy
  domyślnego ustawienia Compose, chyba że środowisko nadal ustawia `OPENCLAW_DISABLE_BONJOUR`.
- Ustaw `OPENCLAW_DISABLE_BONJOUR=0` tylko dla host networking, macvlan lub innej
  sieci, w której wiadomo, że multicast mDNS przechodzi.

## Rozwiązywanie problemów z wyłączonym Bonjour

Jeśli Node przestał automatycznie wykrywać Gateway po konfiguracji Dockera:

1. Potwierdź, czy Gateway celowo tłumi reklamowanie LAN:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Potwierdź, że sam Gateway jest osiągalny przez opublikowany port:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Użyj celu bezpośredniego, gdy Bonjour jest wyłączony:
   - Control UI lub lokalne narzędzia: `http://127.0.0.1:18789`
   - Klienci LAN: `http://<gateway-host>:18789`
   - Klienci między sieciami: Tailnet MagicDNS, adres IP Tailnet, tunel SSH lub
     wide-area DNS-SD

4. Jeśli celowo włączyłeś Bonjour w Dockerze przy użyciu
   `OPENCLAW_DISABLE_BONJOUR=0`, przetestuj multicast z hosta:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Jeśli przeglądanie jest puste lub logi Gateway pokazują powtarzające się anulowania
   watchdog ciao, przywróć `OPENCLAW_DISABLE_BONJOUR=1` i użyj trasy bezpośredniej albo
   trasy Tailnet.

## Typowe tryby awarii

- **Bonjour nie przechodzi między sieciami**: użyj Tailnet lub SSH.
- **Multicast zablokowany**: niektóre sieci Wi‑Fi wyłączają mDNS.
- **Reklamujący utknął w probing/announcing**: hosty z zablokowanym multicastem,
  mostki kontenerów, WSL lub zmiany interfejsów mogą pozostawić reklamujący ciao w
  stanie nieogłoszonym. OpenClaw ponawia próbę kilka razy, a następnie wyłącza Bonjour
  dla bieżącego procesu Gateway zamiast w nieskończoność restartować reklamujący.
- **Docker bridge networking**: dołączony Docker Compose domyślnie wyłącza Bonjour
  przez `OPENCLAW_DISABLE_BONJOUR=1`. Ustaw `0` tylko dla host,
  macvlan lub innej sieci obsługującej mDNS.
- **Uśpienie / zmiany interfejsów**: macOS może tymczasowo gubić wyniki mDNS; spróbuj ponownie.
- **Przeglądanie działa, ale rozwiązywanie nie**: utrzymuj proste nazwy maszyn (unikaj emoji lub
  interpunkcji), a następnie uruchom ponownie Gateway. Nazwa instancji usługi pochodzi od
  nazwy hosta, więc zbyt złożone nazwy mogą mylić niektóre resolvery.

## Escapowane nazwy instancji (`\032`)

Bonjour/DNS‑SD często escapuje bajty w nazwach instancji usług jako sekwencje dziesiętne `\DDD`
(np. spacje stają się `\032`).

- To normalne na poziomie protokołu.
- UI powinny dekodować to na potrzeby wyświetlania (iOS używa `BonjourEscapes.decode`).

## Wyłączanie / konfiguracja

- `openclaw plugins disable bonjour` wyłącza reklamowanie multicast w LAN przez wyłączenie dołączonego Pluginu.
- `openclaw plugins enable bonjour` przywraca domyślny Plugin wykrywania LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` wyłącza reklamowanie multicast w LAN bez zmiany konfiguracji Pluginu; akceptowane wartości prawdziwe to `1`, `true`, `yes` i `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- Docker Compose domyślnie ustawia `OPENCLAW_DISABLE_BONJOUR=1` dla bridge networking; nadpisuj przez `OPENCLAW_DISABLE_BONJOUR=0` tylko wtedy, gdy multicast mDNS jest dostępny.
- `gateway.bind` w `~/.openclaw/openclaw.json` kontroluje tryb wiązania Gateway.
- `OPENCLAW_SSH_PORT` nadpisuje port SSH, gdy reklamowany jest `sshPort` (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publikuje podpowiedź MagicDNS w TXT, gdy włączony jest pełny tryb mDNS (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` nadpisuje reklamowaną ścieżkę CLI (legacy: `OPENCLAW_CLI_PATH`).

## Dokumentacja powiązana

- Polityka wykrywania i wybór transportu: [Wykrywanie](/pl/gateway/discovery)
- Pairing Node + zatwierdzenia: [Pairing Gateway](/pl/gateway/pairing)
