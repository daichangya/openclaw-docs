---
read_when:
    - Parowanie lub ponowne łączenie Node Android.
    - Debugowanie wykrywania gateway Android lub uwierzytelniania.
    - Weryfikacja zgodności historii czatu między klientami
summary: 'Aplikacja Android (Node): runbook połączenia + powierzchnia poleceń Connect/Chat/Voice/Canvas'
title: Aplikacja Android
x-i18n:
    generated_at: "2026-04-25T13:51:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 789de91275a11e63878ba670b9f316538d6b4731c22ec491b2c802f1cd14dcec
    source_path: platforms/android.md
    workflow: 15
---

> **Uwaga:** Aplikacja Android nie została jeszcze publicznie wydana. Kod źródłowy jest dostępny w [repozytorium OpenClaw](https://github.com/openclaw/openclaw) w `apps/android`. Możesz zbudować ją samodzielnie przy użyciu Java 17 i Android SDK (`./gradlew :app:assemblePlayDebug`). Instrukcje budowania znajdziesz w [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md).

## Szybki przegląd wsparcia

- Rola: aplikacja towarzysząca Node (Android nie hostuje Gateway).
- Gateway wymagany: tak (uruchom go na macOS, Linux lub Windows przez WSL2).
- Instalacja: [Getting Started](/pl/start/getting-started) + [Pairing](/pl/channels/pairing).
- Gateway: [Runbook](/pl/gateway) + [Configuration](/pl/gateway/configuration).
  - Protokoły: [Gateway protocol](/pl/gateway/protocol) (node + control plane).

## Sterowanie systemem

Sterowanie systemem (`launchd`/`systemd`) działa na hoście Gateway. Zobacz [Gateway](/pl/gateway).

## Runbook połączenia

Aplikacja Android Node ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android łączy się bezpośrednio z Gateway WebSocket i używa parowania urządzenia (`role: node`).

Dla Tailscale lub hostów publicznych Android wymaga bezpiecznego endpointu:

- Preferowane: Tailscale Serve / Funnel z `https://<magicdns>` / `wss://<magicdns>`
- Obsługiwane również: dowolny inny URL Gateway `wss://` z prawdziwym endpointem TLS
- Nieszyfrowane `ws://` jest nadal obsługiwane dla prywatnych adresów LAN / hostów `.local`, a także `localhost`, `127.0.0.1` i mostu emulatora Android (`10.0.2.2`)

### Wymagania wstępne

- Możesz uruchomić Gateway na komputerze „master”.
- Urządzenie/emulator Android może osiągnąć Gateway WebSocket:
  - w tej samej sieci LAN z mDNS/NSD, **albo**
  - w tym samym tailnet Tailscale przy użyciu Wide-Area Bonjour / unicast DNS-SD (zobacz poniżej), **albo**
  - przez ręczne podanie hosta/portu gateway (fallback)
- Parowanie mobilne przez tailnet/publiczne **nie** używa surowych endpointów tailnet IP `ws://`. Zamiast tego użyj Tailscale Serve lub innego URL `wss://`.
- Możesz uruchomić CLI (`openclaw`) na komputerze gateway (lub przez SSH).

### 1) Uruchom Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Potwierdź w logach, że widzisz coś takiego:

- `listening on ws://0.0.0.0:18789`

Dla zdalnego dostępu Android przez Tailscale preferuj Serve/Funnel zamiast surowego powiązania tailnet:

```bash
openclaw gateway --tailscale serve
```

To daje Androidowi bezpieczny endpoint `wss://` / `https://`. Zwykła konfiguracja `gateway.bind: "tailnet"` nie wystarcza do pierwszego zdalnego parowania Androida, chyba że dodatkowo osobno kończysz TLS.

### 2) Zweryfikuj wykrywanie (opcjonalnie)

Na komputerze gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Więcej uwag debugowania: [Bonjour](/pl/gateway/bonjour).

Jeśli skonfigurowałeś też domenę wykrywania szerokiego obszaru, porównaj z:

```bash
openclaw gateway discover --json
```

To pokazuje `local.` oraz skonfigurowaną domenę szerokiego obszaru w jednym przebiegu i używa rozwiązanego endpointu usługi zamiast samych wskazówek TXT.

#### Wykrywanie przez tailnet (Wiedeń ⇄ Londyn) przy użyciu unicast DNS-SD

Wykrywanie Android NSD/mDNS nie działa między sieciami. Jeśli Twój Android Node i gateway są w różnych sieciach, ale połączone przez Tailscale, użyj Wide-Area Bonjour / unicast DNS-SD.

Samo wykrywanie nie wystarcza do parowania Android przez tailnet/publiczne. Odkryta trasa nadal wymaga bezpiecznego endpointu (`wss://` lub Tailscale Serve):

1. Skonfiguruj strefę DNS-SD (na przykład `openclaw.internal.`) na hoście gateway i opublikuj rekordy `_openclaw-gw._tcp`.
2. Skonfiguruj split DNS Tailscale dla wybranej domeny wskazujący na ten serwer DNS.

Szczegóły i przykładowa konfiguracja CoreDNS: [Bonjour](/pl/gateway/bonjour).

### 3) Połącz z Androida

W aplikacji Android:

- Aplikacja utrzymuje połączenie z gateway przez **foreground service** (trwałe powiadomienie).
- Otwórz kartę **Connect**.
- Użyj trybu **Setup Code** albo **Manual**.
- Jeśli wykrywanie jest zablokowane, użyj ręcznego hosta/portu w **Advanced controls**. Dla prywatnych hostów LAN `ws://` nadal działa. Dla hostów Tailscale/publicznych włącz TLS i użyj endpointu `wss://` / Tailscale Serve.

Po pierwszym udanym parowaniu Android automatycznie łączy się ponownie przy uruchomieniu:

- z ręcznym endpointem (jeśli włączony), w przeciwnym razie
- z ostatnio wykrytym gateway (best effort).

### 4) Zatwierdź parowanie (CLI)

Na komputerze gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Szczegóły parowania: [Pairing](/pl/channels/pairing).

Opcjonalnie: jeśli Android Node zawsze łączy się z ściśle kontrolowanej podsieci,
możesz jawnie włączyć automatyczne zatwierdzanie pierwszego parowania node dla określonych CIDR lub dokładnych adresów IP:

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

To jest domyślnie wyłączone. Dotyczy tylko świeżego parowania `role: node` bez żądanych zakresów. Parowanie operator/browser/Control UI/WebChat oraz każda zmiana roli, zakresu, metadanych lub klucza publicznego nadal wymagają ręcznego zatwierdzenia.

### 5) Sprawdź, czy node jest połączony

- Przez status node:

  ```bash
  openclaw nodes status
  ```

- Przez Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Czat + historia

Karta Chat na Androidzie obsługuje wybór sesji (domyślnie `main`, plus inne istniejące sesje):

- Historia: `chat.history` (znormalizowana do wyświetlania; inline tagi dyrektyw są usuwane z widocznego tekstu, ładunki XML wywołań narzędzi w zwykłym tekście (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi) oraz wyciekające tokeny sterowania modelem ASCII/full-width są usuwane, czyste wiersze asystenta zawierające tylko cichy token, takie jak dokładne `NO_REPLY` / `no_reply`, są pomijane, a zbyt duże wiersze mogą być zastępowane placeholderami)
- Wysyłanie: `chat.send`
- Aktualizacje push (best effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + kamera

#### Gateway Canvas Host (zalecane dla treści webowych)

Jeśli chcesz, aby node wyświetlał rzeczywisty HTML/CSS/JS, który agent może edytować na dysku, skieruj node do hosta canvas Gateway.

Uwaga: node ładują canvas z serwera HTTP Gateway (ten sam port co `gateway.port`, domyślnie `18789`).

1. Utwórz `~/.openclaw/workspace/canvas/index.html` na hoście gateway.

2. Przejdź node do tego adresu (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcjonalnie): jeśli oba urządzenia są w Tailscale, użyj nazwy MagicDNS lub adresu IP tailnet zamiast `.local`, np. `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Ten serwer wstrzykuje klienta live-reload do HTML i przeładowuje przy zmianach plików.
Host A2UI znajduje się pod `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Polecenia Canvas (tylko na pierwszym planie):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (użyj `{"url":""}` albo `{"url":"/"}`, aby wrócić do domyślnego szkieletu). `canvas.snapshot` zwraca `{ format, base64 }` (domyślnie `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (starszy alias `canvas.a2ui.pushJSONL`)

Polecenia kamery (tylko na pierwszym planie; z bramkowaniem uprawnień):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Parametry i pomocniki CLI znajdziesz w [Camera node](/pl/nodes/camera).

### 8) Voice + rozszerzona powierzchnia poleceń Android

- Voice: Android używa pojedynczego przepływu włącz/wyłącz mikrofon w karcie Voice z przechwytywaniem transkryptu i odtwarzaniem `talk.speak`. Lokalny systemowy TTS jest używany tylko wtedy, gdy `talk.speak` jest niedostępne. Voice zatrzymuje się, gdy aplikacja schodzi z pierwszego planu.
- Przełączniki wake/talk-mode dla Voice są obecnie usunięte z UX/runtime Androida.
- Dodatkowe rodziny poleceń Androida (dostępność zależy od urządzenia + uprawnień):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (zobacz [Notification forwarding](#notification-forwarding) poniżej)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Punkty wejścia asystenta

Android obsługuje uruchamianie OpenClaw z systemowego wyzwalacza asystenta (Google
Assistant). Po skonfigurowaniu przytrzymanie przycisku home lub powiedzenie „Hey Google, ask
OpenClaw...” otwiera aplikację i przekazuje prompt do pola tworzenia wiadomości czatu.

Działa to przy użyciu metadanych Android **App Actions** zadeklarowanych w manifeście aplikacji. Po stronie gateway nie jest potrzebna żadna dodatkowa konfiguracja — intent asystenta jest obsługiwany całkowicie przez aplikację Android i przekazywany jako zwykła wiadomość czatu.

<Note>
Dostępność App Actions zależy od urządzenia, wersji Google Play Services
oraz od tego, czy użytkownik ustawił OpenClaw jako domyślną aplikację asystenta.
</Note>

## Forwardowanie powiadomień

Android może forwardować powiadomienia urządzenia do gateway jako zdarzenia. Kilka ustawień pozwala określić zakres forwardowanych powiadomień i moment ich przekazywania.

| Klucz                            | Typ            | Opis                                                                                                  |
| -------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Forwarduj tylko powiadomienia z tych nazw pakietów. Jeśli ustawione, wszystkie pozostałe pakiety są ignorowane. |
| `notifications.denyPackages`     | string[]       | Nigdy nie forwarduj powiadomień z tych nazw pakietów. Stosowane po `allowPackages`.                   |
| `notifications.quietHours.start` | string (HH:mm) | Początek okna godzin ciszy (lokalny czas urządzenia). Powiadomienia są tłumione w tym oknie.         |
| `notifications.quietHours.end`   | string (HH:mm) | Koniec okna godzin ciszy.                                                                             |
| `notifications.rateLimit`        | number         | Maksymalna liczba forwardowanych powiadomień na pakiet na minutę. Nadmiarowe powiadomienia są odrzucane. |

Selektor powiadomień również używa bezpieczniejszego zachowania dla zdarzeń forwardowanych powiadomień, zapobiegając przypadkowemu forwardowaniu wrażliwych powiadomień systemowych.

Przykładowa konfiguracja:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
Forwardowanie powiadomień wymaga uprawnienia Android Notification Listener. Aplikacja prosi o nie podczas konfiguracji.
</Note>

## Powiązane

- [iOS app](/pl/platforms/ios)
- [Nodes](/pl/nodes)
- [Android node troubleshooting](/pl/nodes/troubleshooting)
