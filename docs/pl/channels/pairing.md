---
read_when:
    - Konfigurowanie kontroli dostępu do wiadomości prywatnych
    - Parowanie nowego Node iOS/Android
    - Przegląd zabezpieczeń OpenClaw
summary: 'Przegląd parowania: zatwierdzanie, kto może wysyłać Ci wiadomości prywatne i które Node mogą dołączyć'
title: Parowanie
x-i18n:
    generated_at: "2026-04-26T11:24:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9d28547baacce638347ce0062e3bc4f194704eb369b4ca45f7158d5e16cee93
    source_path: channels/pairing.md
    workflow: 15
---

„Parowanie” to jawny krok **zatwierdzenia przez właściciela** w OpenClaw.  
Jest używany w dwóch miejscach:

1. **Parowanie DM** (kto może rozmawiać z botem)
2. **Parowanie Node** (które urządzenia/Node mogą dołączyć do sieci Gateway)

Kontekst bezpieczeństwa: [Security](/pl/gateway/security)

## 1) Parowanie DM (dostęp do czatu przychodzącego)

Gdy kanał jest skonfigurowany z polityką DM `pairing`, nieznani nadawcy otrzymują krótki kod, a ich wiadomość **nie jest przetwarzana**, dopóki jej nie zatwierdzisz.

Domyślne polityki DM są udokumentowane w: [Security](/pl/gateway/security)

Kody parowania:

- 8 znaków, wielkie litery, bez niejednoznacznych znaków (`0O1I`).
- **Wygasają po 1 godzinie**. Bot wysyła wiadomość parowania tylko wtedy, gdy tworzona jest nowa prośba (mniej więcej raz na godzinę na nadawcę).
- Oczekujące prośby o parowanie DM są domyślnie ograniczone do **3 na kanał**; dodatkowe prośby są ignorowane, dopóki jedna nie wygaśnie lub nie zostanie zatwierdzona.

### Zatwierdzanie nadawcy

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Obsługiwane kanały: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Gdzie przechowywany jest stan

Przechowywane w `~/.openclaw/credentials/`:

- Oczekujące prośby: `<channel>-pairing.json`
- Magazyn zatwierdzonej listy dozwolonych:
  - Konto domyślne: `<channel>-allowFrom.json`
  - Konto inne niż domyślne: `<channel>-<accountId>-allowFrom.json`

Zachowanie zakresu konta:

- Konta inne niż domyślne odczytują/zapisują tylko swój plik listy dozwolonych objęty zakresem.
- Konto domyślne używa pliku listy dozwolonych bez zakresu, przypisanego do kanału.

Traktuj te pliki jako wrażliwe (kontrolują dostęp do Twojego asystenta).

Ważne: ten magazyn dotyczy dostępu DM. Autoryzacja grup jest oddzielna.  
Zatwierdzenie kodu parowania DM nie powoduje automatycznie, że ten nadawca może uruchamiać polecenia grupowe ani sterować botem w grupach. W przypadku dostępu grupowego skonfiguruj jawne listy dozwolonych grup dla kanału (na przykład `groupAllowFrom`, `groups` albo nadpisania per grupa/per temat zależnie od kanału).

## 2) Parowanie urządzeń Node (Node iOS/Android/macOS/headless)

Node łączą się z Gateway jako **urządzenia** z `role: node`. Gateway  
tworzy prośbę o parowanie urządzenia, która musi zostać zatwierdzona.

### Parowanie przez Telegram (zalecane dla iOS)

Jeśli używasz Plugin `device-pair`, możesz przeprowadzić pierwsze parowanie urządzenia całkowicie z poziomu Telegram.

1. W Telegram wyślij wiadomość do swojego bota: `/pair`
2. Bot odpowiada dwiema wiadomościami: wiadomością z instrukcjami i oddzielną wiadomością z **kodem konfiguracji** (łatwą do skopiowania/wklejenia w Telegram).
3. Na telefonie otwórz aplikację OpenClaw na iOS → Settings → Gateway.
4. Wklej kod konfiguracji i połącz się.
5. Wróć do Telegram: `/pair pending` (przejrzyj identyfikatory próśb, rolę i zakresy), a następnie zatwierdź.

Kod konfiguracji to ładunek JSON zakodowany w base64, który zawiera:

- `url`: adres URL WebSocket Gateway (`ws://...` lub `wss://...`)
- `bootstrapToken`: krótkotrwały token bootstrap dla pojedynczego urządzenia używany do początkowego uzgadniania parowania

Ten token bootstrap przenosi wbudowany profil bootstrap parowania:

- główny przekazany token `node` pozostaje `scopes: []`
- każdy przekazany token `operator` pozostaje ograniczony do listy dozwolonych bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- sprawdzanie zakresów bootstrap jest poprzedzone rolą, a nie opiera się na jednej płaskiej puli zakresów:
  wpisy zakresów operatora spełniają tylko żądania operatora, a role niebędące operatorem
  nadal muszą żądać zakresów pod własnym prefiksem roli
- późniejsza rotacja/unieważnienie tokena pozostaje ograniczona zarówno przez zatwierdzony
  kontrakt roli urządzenia, jak i zakresy operatora sesji wywołującej

Traktuj kod konfiguracji jak hasło, dopóki jest ważny.

### Zatwierdzanie urządzenia Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Jeśli to samo urządzenie ponowi próbę z innymi szczegółami uwierzytelniania (na przykład inną
rolą/zakresami/kluczem publicznym), poprzednia oczekująca prośba zostaje zastąpiona i tworzony
jest nowy `requestId`.

Ważne: już sparowane urządzenie nie otrzymuje po cichu szerszego dostępu. Jeśli
połączy się ponownie, żądając większej liczby zakresów lub szerszej roli, OpenClaw zachowuje
istniejące zatwierdzenie bez zmian i tworzy nową oczekującą prośbę o rozszerzenie. Użyj
`openclaw devices list`, aby porównać obecnie zatwierdzony dostęp z nowo
żądanym dostępem przed zatwierdzeniem.

### Opcjonalne automatyczne zatwierdzanie Node z zaufanych CIDR

Parowanie urządzeń domyślnie pozostaje ręczne. W przypadku ściśle kontrolowanych sieci Node
możesz włączyć automatyczne zatwierdzanie pierwszego parowania Node za pomocą jawnych CIDR lub dokładnych adresów IP:

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

Dotyczy to tylko nowych próśb o parowanie `role: node` bez żądanych
zakresów. Klienci operatora, przeglądarki, Control UI i WebChat nadal wymagają ręcznego
zatwierdzenia. Zmiany roli, zakresu, metadanych i klucza publicznego nadal wymagają ręcznego
zatwierdzenia.

### Przechowywanie stanu parowania Node

Przechowywane w `~/.openclaw/devices/`:

- `pending.json` (krótkotrwałe; oczekujące prośby wygasają)
- `paired.json` (sparowane urządzenia + tokeny)

### Uwagi

- Starsze API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|rename`) to
  oddzielny magazyn parowania zarządzany przez Gateway. Node WS nadal wymagają parowania urządzenia.
- Rekord parowania jest trwałym źródłem prawdy dla zatwierdzonych ról. Aktywne
  tokeny urządzeń pozostają ograniczone do tego zatwierdzonego zestawu ról; przypadkowy wpis tokena
  poza zatwierdzonymi rolami nie tworzy nowego dostępu.

## Powiązane dokumenty

- Model bezpieczeństwa + prompt injection: [Security](/pl/gateway/security)
- Bezpieczna aktualizacja (uruchom doctor): [Updating](/pl/install/updating)
- Konfiguracje kanałów:
  - Telegram: [Telegram](/pl/channels/telegram)
  - WhatsApp: [WhatsApp](/pl/channels/whatsapp)
  - Signal: [Signal](/pl/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/pl/channels/bluebubbles)
  - iMessage (legacy): [iMessage](/pl/channels/imessage)
  - Discord: [Discord](/pl/channels/discord)
  - Slack: [Slack](/pl/channels/slack)
