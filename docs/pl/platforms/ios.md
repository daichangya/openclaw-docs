---
read_when:
    - Parowanie lub ponowne łączenie Node iOS
    - Uruchamianie aplikacji iOS ze źródła
    - Debugowanie wykrywania gateway lub poleceń canvas
summary: 'Aplikacja Node na iOS: połączenie z Gateway, parowanie, canvas i rozwiązywanie problemów'
title: aplikacja iOS
x-i18n:
    generated_at: "2026-04-25T13:51:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad0088cd135168248cfad10c24715f74117a66efaa52a572579c04f96a806538
    source_path: platforms/ios.md
    workflow: 15
---

Dostępność: wewnętrzny podgląd. Aplikacja na iOS nie jest jeszcze publicznie dystrybuowana.

## Co robi

- Łączy się z Gateway przez WebSocket (LAN albo tailnet).
- Udostępnia możliwości Node: Canvas, migawkę ekranu, przechwytywanie kamery, lokalizację, tryb Talk, Voice wake.
- Odbiera polecenia `node.invoke` i raportuje zdarzenia statusu Node.

## Wymagania

- Gateway uruchomiony na innym urządzeniu (macOS, Linux albo Windows przez WSL2).
- Ścieżka sieciowa:
  - Ta sama sieć LAN przez Bonjour, **albo**
  - Tailnet przez unicast DNS-SD (przykładowa domena: `openclaw.internal.`), **albo**
  - Ręczny host/port (fallback).

## Szybki start (pair + connect)

1. Uruchom Gateway:

```bash
openclaw gateway --port 18789
```

2. W aplikacji iOS otwórz Settings i wybierz wykryty Gateway (albo włącz Manual Host i wpisz host/port).

3. Zatwierdź żądanie parowania na hoście gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Jeśli aplikacja ponowi próbę parowania ze zmienionymi danymi auth (rola/zakresy/klucz publiczny),
poprzednie oczekujące żądanie zostanie zastąpione i utworzony zostanie nowy `requestId`.
Uruchom `openclaw devices list` ponownie przed zatwierdzeniem.

Opcjonalnie: jeśli Node iOS zawsze łączy się z ściśle kontrolowanej podsieci, możesz
włączyć automatyczne zatwierdzanie pierwszego parowania Node przy użyciu jawnych CIDR albo dokładnych adresów IP:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

To jest domyślnie wyłączone. Dotyczy tylko nowego parowania `role: node` bez
żądanych zakresów. Parowanie operatora/przeglądarki i każda zmiana roli, zakresu, metadanych albo
klucza publicznego nadal wymagają ręcznego zatwierdzenia.

4. Zweryfikuj połączenie:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push oparty na relay dla oficjalnych buildów

Oficjalnie dystrybuowane buildy iOS używają zewnętrznego push relay zamiast publikować surowy token APNs
do gateway.

Wymaganie po stronie gateway:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

Jak działa ten przepływ:

- Aplikacja iOS rejestruje się w relay przy użyciu App Attest i receipt aplikacji.
- Relay zwraca niejawny relay handle oraz send grant ograniczony do rejestracji.
- Aplikacja iOS pobiera tożsamość sparowanego gateway i dołącza ją do rejestracji relay, dzięki czemu rejestracja oparta na relay jest delegowana do konkretnego gateway.
- Aplikacja przekazuje tę rejestrację opartą na relay do sparowanego gateway przez `push.apns.register`.
- Gateway używa tego zapisanego relay handle dla `push.test`, wybudzeń w tle i wake nudges.
- Base URL relay gateway musi odpowiadać adresowi relay zaszytemu w oficjalnym/buildzie TestFlight iOS.
- Jeśli aplikacja później połączy się z innym gateway albo buildem z innym base URL relay, odświeży rejestrację relay zamiast ponownie używać starego powiązania.

Czego gateway **nie** potrzebuje dla tej ścieżki:

- Żadnego tokenu relay obowiązującego w całym wdrożeniu.
- Żadnego bezpośredniego klucza APNs dla oficjalnych/TestFlight wysyłek opartych na relay.

Oczekiwany przepływ operatora:

1. Zainstaluj oficjalny/build TestFlight iOS.
2. Ustaw `gateway.push.apns.relay.baseUrl` w gateway.
3. Sparuj aplikację z gateway i pozwól jej zakończyć łączenie.
4. Aplikacja publikuje `push.apns.register` automatycznie po uzyskaniu tokenu APNs, połączeniu sesji operatora i pomyślnym zakończeniu rejestracji relay.
5. Po tym `push.test`, reconnect wakes i wake nudges mogą używać zapisanej rejestracji opartej na relay.

Uwaga o zgodności:

- `OPENCLAW_APNS_RELAY_BASE_URL` nadal działa jako tymczasowe nadpisanie zmienną środowiskową dla gateway.

## Przepływ uwierzytelniania i zaufania

Relay istnieje po to, aby wymuszać dwa ograniczenia, których bezpośrednie APNs na gateway nie może zapewnić dla
oficjalnych buildów iOS:

- Tylko prawdziwe buildy OpenClaw na iOS dystrybuowane przez Apple mogą używać hostowanego relay.
- Gateway może wysyłać push oparte na relay tylko do urządzeń iOS, które sparowały się z tym konkretnym
  gateway.

Skok po skoku:

1. `aplikacja iOS -> gateway`
   - Aplikacja najpierw paruje się z gateway przez zwykły przepływ auth Gateway.
   - To daje aplikacji uwierzytelnioną sesję node oraz uwierzytelnioną sesję operatora.
   - Sesja operatora jest używana do wywołania `gateway.identity.get`.

2. `aplikacja iOS -> relay`
   - Aplikacja wywołuje endpointy rejestracji relay przez HTTPS.
   - Rejestracja zawiera dowód App Attest oraz receipt aplikacji.
   - Relay waliduje bundle ID, dowód App Attest i receipt Apple oraz wymaga
     oficjalnej/produkcyjnej ścieżki dystrybucji.
   - To właśnie blokuje lokalne buildy Xcode/dev przed użyciem hostowanego relay. Lokalny build może być
     podpisany, ale nie spełnia dowodu oficjalnej dystrybucji Apple, którego oczekuje relay.

3. `delegacja tożsamości gateway`
   - Przed rejestracją relay aplikacja pobiera tożsamość sparowanego gateway z
     `gateway.identity.get`.
   - Aplikacja dołącza tę tożsamość gateway do ładunku rejestracji relay.
   - Relay zwraca relay handle i send grant ograniczony do rejestracji, delegowane do
     tej tożsamości gateway.

4. `gateway -> relay`
   - Gateway zapisuje relay handle i send grant z `push.apns.register`.
   - Przy `push.test`, reconnect wakes i wake nudges gateway podpisuje żądanie wysyłki
     własną tożsamością urządzenia.
   - Relay weryfikuje zarówno zapisany send grant, jak i podpis gateway względem delegowanej
     tożsamości gateway z rejestracji.
   - Inny gateway nie może ponownie użyć tej zapisanej rejestracji, nawet jeśli w jakiś sposób uzyska handle.

5. `relay -> APNs`
   - Relay posiada produkcyjne poświadczenia APNs i surowy token APNs dla oficjalnego buildu.
   - Gateway nigdy nie przechowuje surowego tokenu APNs dla oficjalnych buildów opartych na relay.
   - Relay wysyła końcowy push do APNs w imieniu sparowanego gateway.

Dlaczego zaprojektowano to w ten sposób:

- Aby trzymać produkcyjne poświadczenia APNs poza gateway użytkowników.
- Aby unikać przechowywania surowych tokenów APNs oficjalnych buildów na gateway.
- Aby umożliwić użycie hostowanego relay tylko oficjalnym/buildom TestFlight OpenClaw.
- Aby uniemożliwić jednemu gateway wysyłanie wake push do urządzeń iOS należących do innego gateway.

Lokalne/ręczne buildy pozostają przy bezpośrednim APNs. Jeśli testujesz takie buildy bez relay,
gateway nadal potrzebuje bezpośrednich poświadczeń APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Są to zmienne środowiskowe runtime hosta gateway, a nie ustawienia Fastlane. `apps/ios/fastlane/.env` przechowuje tylko
auth App Store Connect / TestFlight, takie jak `ASC_KEY_ID` i `ASC_ISSUER_ID`; nie konfiguruje
bezpośredniego dostarczania APNs dla lokalnych buildów iOS.

Zalecane przechowywanie na hoście gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Nie commituj pliku `.p8` ani nie umieszczaj go w checkout repo.

## Ścieżki wykrywania

### Bonjour (LAN)

Aplikacja iOS przegląda `_openclaw-gw._tcp` w `local.` oraz, jeśli skonfigurowano, tę samą
domenę wykrywania wide-area DNS-SD. Gateway w tej samej sieci LAN pojawiają się automatycznie z `local.`;
wykrywanie między sieciami może używać skonfigurowanej domeny wide-area bez zmiany typu beacon.

### Tailnet (między sieciami)

Jeśli mDNS jest blokowane, użyj strefy unicast DNS-SD (wybierz domenę; przykład:
`openclaw.internal.`) i Tailscale split DNS.
Zobacz [Bonjour](/pl/gateway/bonjour), aby uzyskać przykład CoreDNS.

### Ręczny host/port

W Settings włącz **Manual Host** i wpisz host gateway + port (domyślnie `18789`).

## Canvas + A2UI

Node iOS renderuje canvas WKWebView. Użyj `node.invoke`, aby nim sterować:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Uwagi:

- Host canvas Gateway serwuje `/__openclaw__/canvas/` i `/__openclaw__/a2ui/`.
- Jest serwowany z serwera HTTP Gateway (ten sam port co `gateway.port`, domyślnie `18789`).
- Node iOS automatycznie przechodzi do A2UI przy połączeniu, gdy reklamowany jest adres URL hosta canvas.
- Aby wrócić do wbudowanego scaffold, użyj `canvas.navigate` i `{"url":""}`.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + tryb Talk

- Voice wake i tryb Talk są dostępne w Settings.
- iOS może wstrzymywać audio w tle; traktuj funkcje głosowe jako best-effort, gdy aplikacja nie jest aktywna.

## Typowe błędy

- `NODE_BACKGROUND_UNAVAILABLE`: przenieś aplikację iOS na pierwszy plan (polecenia canvas/camera/screen tego wymagają).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway nie reklamował adresu URL hosta canvas; sprawdź `canvasHost` w [Gateway configuration](/pl/gateway/configuration).
- Prompt parowania nigdy się nie pojawia: uruchom `openclaw devices list` i zatwierdź ręcznie.
- Reconnect nie działa po ponownej instalacji: token parowania w Keychain został wyczyszczony; sparuj Node ponownie.

## Powiązane dokumenty

- [Parowanie](/pl/channels/pairing)
- [Discovery](/pl/gateway/discovery)
- [Bonjour](/pl/gateway/bonjour)
