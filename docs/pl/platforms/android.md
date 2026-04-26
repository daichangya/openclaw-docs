---
read_when:
    - Parowanie lub ponowne łączenie Android Node
    - Debugowanie discovery albo uwierzytelniania Android gateway
    - Weryfikowanie zgodności historii czatu między klientami
summary: 'Aplikacja Android (node): runbook połączenia + powierzchnia poleceń Connect/Chat/Voice/Canvas'
title: Aplikacja Android
x-i18n:
    generated_at: "2026-04-26T11:35:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a47c07e3301ad7b98f4827c9c34c42b7ba2f92c55aabd7b49606ab688191b66
    source_path: platforms/android.md
    workflow: 15
---

> **Uwaga:** Aplikacja Android nie została jeszcze publicznie wydana. Kod źródłowy jest dostępny w [repozytorium OpenClaw](https://github.com/openclaw/openclaw) pod `apps/android`. Możesz zbudować ją samodzielnie przy użyciu Java 17 i Android SDK (`./gradlew :app:assemblePlayDebug`). Instrukcje budowania znajdziesz w [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md).

## Stan wsparcia

- Rola: aplikacja towarzysząca node (Android nie hostuje Gateway).
- Wymagany Gateway: tak (uruchom go na macOS, Linux lub Windows przez WSL2).
- Instalacja: [Pierwsze kroki](/pl/start/getting-started) + [Parowanie](/pl/channels/pairing).
- Gateway: [Runbook](/pl/gateway) + [Konfiguracja](/pl/gateway/configuration).
  - Protokoły: [Protokół Gateway](/pl/gateway/protocol) (Node + control plane).

## Sterowanie systemem

Sterowanie systemem (launchd/systemd) znajduje się na hoście Gateway. Zobacz [Gateway](/pl/gateway).

## Runbook połączenia

Aplikacja Android Node ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android łączy się bezpośrednio z Gateway WebSocket i używa parowania urządzeń (`role: node`).

Dla Tailscale lub hostów publicznych Android wymaga bezpiecznego endpointu:

- Preferowane: Tailscale Serve / Funnel z `https://<magicdns>` / `wss://<magicdns>`
- Również obsługiwane: dowolny inny URL Gateway `wss://` z prawdziwym endpointem TLS
- Czysty tekst `ws://` jest nadal obsługiwany dla prywatnych adresów LAN / hostów `.local`, a także `localhost`, `127.0.0.1` i mostu emulatora Android (`10.0.2.2`)

### Wymagania wstępne

- Możesz uruchomić Gateway na maszynie „master”.
- Urządzenie/emulator Android może dotrzeć do Gateway WebSocket:
  - Ta sama sieć LAN z mDNS/NSD, **albo**
  - Ta sama tailnet Tailscale z Wide-Area Bonjour / unicast DNS-SD (zobacz poniżej), **albo**
  - Ręczny host/port gateway (fallback)
- Parowanie mobilne przez tailnet/publicznie **nie** używa surowych endpointów tailnet IP `ws://`. Zamiast tego użyj Tailscale Serve albo innego URL `wss://`.
- Możesz uruchamiać CLI (`openclaw`) na maszynie gateway (albo przez SSH).

### 1) Uruchom Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Potwierdź w logach, że widzisz coś takiego:

- `listening on ws://0.0.0.0:18789`

Dla zdalnego dostępu Android przez Tailscale preferuj Serve/Funnel zamiast surowego bind tailnet:

```bash
openclaw gateway --tailscale serve
```

Daje to Androidowi bezpieczny endpoint `wss://` / `https://`. Zwykła konfiguracja `gateway.bind: "tailnet"` nie wystarcza do pierwszego zdalnego parowania Android, chyba że dodatkowo osobno kończysz TLS.

### 2) Zweryfikuj discovery (opcjonalnie)

Na maszynie gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Więcej uwag dotyczących debugowania: [Bonjour](/pl/gateway/bonjour).

Jeśli skonfigurowałeś również domenę discovery szerokiego obszaru, porównaj z:

```bash
openclaw gateway discover --json
```

Pokazuje to `local.` oraz skonfigurowaną domenę szerokiego obszaru w jednym przebiegu i używa rozwiązanego
endpointu usługi zamiast samych wskazówek TXT.

#### Discovery tailnet (Wiedeń ⇄ Londyn) przez unicast DNS-SD

Discovery Android NSD/mDNS nie przechodzi między sieciami. Jeśli Android Node i gateway są w różnych sieciach, ale połączone przez Tailscale, użyj zamiast tego Wide-Area Bonjour / unicast DNS-SD.

Samo discovery nie wystarcza do parowania Android przez tailnet/publicznie. Odkryta trasa nadal wymaga bezpiecznego endpointu (`wss://` lub Tailscale Serve):

1. Skonfiguruj strefę DNS-SD (na przykład `openclaw.internal.`) na hoście gateway i opublikuj rekordy `_openclaw-gw._tcp`.
2. Skonfiguruj Tailscale split DNS dla wybranej domeny, wskazując na ten serwer DNS.

Szczegóły i przykładowa konfiguracja CoreDNS: [Bonjour](/pl/gateway/bonjour).

### 3) Połącz z Android

W aplikacji Android:

- Aplikacja utrzymuje połączenie z gateway przy życiu przez **foreground service** (trwałe powiadomienie).
- Otwórz kartę **Connect**.
- Użyj trybu **Setup Code** albo **Manual**.
- Jeśli discovery jest zablokowane, użyj ręcznego hosta/portu w **Advanced controls**. Dla prywatnych hostów LAN `ws://` nadal działa. Dla hostów Tailscale/publicznych włącz TLS i użyj endpointu `wss://` / Tailscale Serve.

Po pierwszym udanym parowaniu Android automatycznie łączy się ponownie przy uruchomieniu:

- Ręczny endpoint (jeśli włączony), w przeciwnym razie
- Ostatnio odkryty gateway (best-effort).

### 4) Zatwierdź parowanie (CLI)

Na maszynie gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Szczegóły parowania: [Parowanie](/pl/channels/pairing).

Opcjonalnie: jeśli Android Node zawsze łączy się z ściśle kontrolowanej podsieci,
możesz włączyć opt-in do automatycznego zatwierdzania pierwszego parowania node przez jawne CIDR-y lub dokładne adresy IP:

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

To jest domyślnie wyłączone. Dotyczy tylko świeżego parowania `role: node` bez
żądanych zakresów. Parowanie operator/browser oraz każda zmiana roli, zakresu, metadanych lub
klucza publicznego nadal wymaga ręcznego zatwierdzenia.

### 5) Zweryfikuj, że node jest połączony

- Przez status node:

  ```bash
  openclaw nodes status
  ```

- Przez Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + historia

Karta Chat na Android obsługuje wybór sesji (domyślnie `main` oraz inne istniejące sesje):

- Historia: `chat.history` (znormalizowana do wyświetlania; inline tagi dyrektyw są
  usuwane z widocznego tekstu, ładunki XML wywołań narzędzi w formie zwykłego tekstu (w tym
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz
  obcięte bloki wywołań narzędzi) i wyciekłe tokeny sterujące modelem ASCII/full-width
  są usuwane, czyste wiersze asystenta z cichym tokenem, takie jak dokładne `NO_REPLY` /
  `no_reply`, są pomijane, a zbyt duże wiersze mogą być zastępowane placeholderami)
- Wysyłanie: `chat.send`
- Aktualizacje push (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + kamera

#### Gateway Canvas Host (zalecane dla treści web)

Jeśli chcesz, aby node wyświetlał prawdziwe HTML/CSS/JS, które agent może edytować na dysku, wskaż node na host canvas Gateway.

Uwaga: Node ładują canvas z serwera HTTP Gateway (ten sam port co `gateway.port`, domyślnie `18789`).

1. Utwórz `~/.openclaw/workspace/canvas/index.html` na hoście gateway.

2. Przejdź node do niego (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcjonalnie): jeśli oba urządzenia są w Tailscale, użyj nazwy MagicDNS lub adresu IP tailnet zamiast `.local`, np. `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Ten serwer wstrzykuje klienta live-reload do HTML i przeładowuje przy zmianach plików.
Host A2UI znajduje się pod `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Polecenia Canvas (tylko na pierwszym planie):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (użyj `{"url":""}` lub `{"url":"/"}`, aby wrócić do domyślnego scaffoldu). `canvas.snapshot` zwraca `{ format, base64 }` (domyślnie `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (starszy alias `canvas.a2ui.pushJSONL`)

Polecenia kamery (tylko na pierwszym planie; zależne od uprawnień):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Parametry i helpery CLI znajdziesz w [Camera node](/pl/nodes/camera).

### 8) Voice + rozszerzona powierzchnia poleceń Android

- Karta Voice: Android ma dwa jawne tryby przechwytywania. **Mic** to ręczna sesja karty Voice, która wysyła każdą pauzę jako turę czatu i zatrzymuje się, gdy aplikacja opuszcza pierwszy plan albo użytkownik opuszcza kartę Voice. **Talk** to ciągły tryb Talk Mode i nasłuchuje, dopóki nie zostanie wyłączony albo node się nie rozłączy.
- Talk Mode promuje istniejący foreground service z `dataSync` do `dataSync|microphone` przed rozpoczęciem przechwytywania, a następnie degraduje go, gdy Talk Mode się zatrzymuje. Android 14+ wymaga deklaracji `FOREGROUND_SERVICE_MICROPHONE`, uprawnienia runtime `RECORD_AUDIO` oraz typu usługi mikrofonowej w runtime.
- Odpowiedzi głosowe używają `talk.speak` przez skonfigurowanego providera Talk gateway. Lokalny systemowy TTS jest używany tylko wtedy, gdy `talk.speak` jest niedostępne.
- Voice wake pozostaje wyłączone w UX/runtime Android.
- Dodatkowe rodziny poleceń Android (dostępność zależy od urządzenia i uprawnień):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (zobacz [Przekazywanie powiadomień](#notification-forwarding) poniżej)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Entry pointy asystenta

Android obsługuje uruchamianie OpenClaw z systemowego triggera asystenta (Google
Assistant). Gdy jest skonfigurowane, przytrzymanie przycisku home albo powiedzenie „Hey Google, ask
OpenClaw...” otwiera aplikację i przekazuje prompt do pola tworzenia czatu.

Używa to metadanych Android **App Actions** zadeklarowanych w manifeście aplikacji. Nie
jest potrzebna żadna dodatkowa konfiguracja po stronie gateway — intencja asystenta jest
obsługiwana całkowicie przez aplikację Android i przekazywana jako zwykła wiadomość czatu.

<Note>
Dostępność App Actions zależy od urządzenia, wersji Google Play Services
oraz od tego, czy użytkownik ustawił OpenClaw jako domyślną aplikację asystenta.
</Note>

## Przekazywanie powiadomień

Android może przekazywać powiadomienia urządzenia do gateway jako zdarzenia. Kilka kontrolek pozwala ograniczyć, które powiadomienia są przekazywane i kiedy.

| Klucz                            | Typ            | Opis                                                                                              |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Przekazuj tylko powiadomienia z tych nazw pakietów. Jeśli ustawione, wszystkie inne pakiety są ignorowane. |
| `notifications.denyPackages`     | string[]       | Nigdy nie przekazuj powiadomień z tych nazw pakietów. Stosowane po `allowPackages`.              |
| `notifications.quietHours.start` | string (HH:mm) | Początek okna cichych godzin (lokalny czas urządzenia). Powiadomienia są tłumione w tym oknie.   |
| `notifications.quietHours.end`   | string (HH:mm) | Koniec okna cichych godzin.                                                                       |
| `notifications.rateLimit`        | number         | Maksymalna liczba przekazywanych powiadomień na pakiet na minutę. Nadmiarowe powiadomienia są odrzucane. |

Selektor powiadomień używa również bezpieczniejszego zachowania dla przekazywanych zdarzeń powiadomień, zapobiegając przypadkowemu przekazaniu wrażliwych powiadomień systemowych.

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
Przekazywanie powiadomień wymaga uprawnienia Android Notification Listener. Aplikacja prosi o nie podczas konfiguracji.
</Note>

## Powiązane

- [Aplikacja iOS](/pl/platforms/ios)
- [Node](/pl/nodes)
- [Rozwiązywanie problemów z Android Node](/pl/nodes/troubleshooting)
