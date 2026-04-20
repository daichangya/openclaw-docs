---
read_when:
    - Konfigurowanie kontroli dostępu do wiadomości prywatnych
    - Parowanie nowego Node iOS/Android
    - Przegląd zabezpieczeń OpenClaw
summary: 'Przegląd parowania: zatwierdzanie, kto może wysyłać Ci wiadomości prywatne + które Node mogą dołączyć'
title: Parowanie
x-i18n:
    generated_at: "2026-04-20T09:58:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4161629ead02dc0bdcd283cc125fe6579a579e03740127f4feb22dfe344bd028
    source_path: channels/pairing.md
    workflow: 15
---

# Parowanie

„Parowanie” to w OpenClaw jawny etap **zatwierdzenia przez właściciela**.
Jest używany w dwóch miejscach:

1. **Parowanie wiadomości prywatnych** (kto może rozmawiać z botem)
2. **Parowanie Node** (które urządzenia/Node mogą dołączyć do sieci Gateway)

Kontekst bezpieczeństwa: [Bezpieczeństwo](/pl/gateway/security)

## 1) Parowanie wiadomości prywatnych (dostęp do czatu przychodzącego)

Gdy kanał jest skonfigurowany z zasadą wiadomości prywatnych `pairing`, nieznani nadawcy otrzymują krótki kod, a ich wiadomość **nie jest przetwarzana**, dopóki jej nie zatwierdzisz.

Domyślne zasady wiadomości prywatnych są udokumentowane tutaj: [Bezpieczeństwo](/pl/gateway/security)

Kody parowania:

- 8 znaków, wielkie litery, bez niejednoznacznych znaków (`0O1I`).
- **Wygasają po 1 godzinie**. Bot wysyła wiadomość parowania tylko wtedy, gdy tworzona jest nowa prośba (mniej więcej raz na godzinę dla każdego nadawcy).
- Oczekujące prośby o parowanie wiadomości prywatnych są domyślnie ograniczone do **3 na kanał**; dodatkowe prośby są ignorowane, dopóki jedna nie wygaśnie albo nie zostanie zatwierdzona.

### Zatwierdzenie nadawcy

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Obsługiwane kanały: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Gdzie jest przechowywany stan

Przechowywany w `~/.openclaw/credentials/`:

- Oczekujące prośby: `<channel>-pairing.json`
- Magazyn zatwierdzonej listy dozwolonych nadawców:
  - Konto domyślne: `<channel>-allowFrom.json`
  - Konto inne niż domyślne: `<channel>-<accountId>-allowFrom.json`

Zachowanie zakresu kont:

- Konta inne niż domyślne odczytują/zapisują tylko swój plik listy dozwolonych nadawców.
- Konto domyślne używa niezakresowanego pliku listy dozwolonych nadawców na poziomie kanału.

Traktuj te pliki jako wrażliwe (kontrolują dostęp do Twojego asystenta).

Ważne: ten magazyn dotyczy dostępu do wiadomości prywatnych. Autoryzacja grup jest oddzielna.
Zatwierdzenie kodu parowania wiadomości prywatnej nie pozwala automatycznie temu nadawcy uruchamiać poleceń grupowych ani sterować botem w grupach. W przypadku dostępu grupowego skonfiguruj jawne listy dozwolonych grup dla kanału (na przykład `groupAllowFrom`, `groups` albo nadpisania per grupa/per temat, zależnie od kanału).

## 2) Parowanie urządzeń Node (Node iOS/Android/macOS/headless)

Node łączą się z Gateway jako **urządzenia** z `role: node`. Gateway
tworzy prośbę o sparowanie urządzenia, która musi zostać zatwierdzona.

### Parowanie przez Telegram (zalecane dla iOS)

Jeśli używasz Plugin `device-pair`, możesz przeprowadzić pierwsze parowanie urządzenia całkowicie z poziomu Telegram:

1. W Telegram wyślij wiadomość do swojego bota: `/pair`
2. Bot odpowie dwiema wiadomościami: wiadomością z instrukcjami oraz osobną wiadomością z **kodem konfiguracji** (łatwym do skopiowania/wklejenia w Telegram).
3. Na telefonie otwórz aplikację OpenClaw na iOS → Ustawienia → Gateway.
4. Wklej kod konfiguracji i połącz się.
5. Wróć do Telegram: `/pair pending` (przejrzyj identyfikatory próśb, rolę i zakresy), a następnie zatwierdź.

Kod konfiguracji to zakodowany w base64 ładunek JSON, który zawiera:

- `url`: adres URL WebSocket Gateway (`ws://...` lub `wss://...`)
- `bootstrapToken`: krótko żyjący token bootstrap dla pojedynczego urządzenia używany podczas początkowego uzgadniania parowania

Ten token bootstrap ma wbudowany profil bootstrap parowania:

- główny przekazany token `node` pozostaje `scopes: []`
- każdy przekazany token `operator` pozostaje ograniczony do bootstrapowej listy dozwolonej:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- sprawdzanie zakresów bootstrap jest prefiksowane rolą, a nie realizowane przez jedną wspólną pulę zakresów:
  wpisy zakresów operatora spełniają tylko żądania operatora, a role niebędące operatorem
  nadal muszą żądać zakresów pod własnym prefiksem roli

Traktuj kod konfiguracji jak hasło, dopóki jest ważny.

### Zatwierdzenie urządzenia Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Jeśli to samo urządzenie ponowi próbę z innymi danymi uwierzytelniającymi (na przykład inną
rolą/zakresami/kluczem publicznym), poprzednia oczekująca prośba zostaje zastąpiona i tworzony jest nowy
`requestId`.

Ważne: już sparowane urządzenie nie otrzymuje po cichu szerszego dostępu. Jeśli
ponownie połączy się, prosząc o więcej zakresów albo szerszą rolę, OpenClaw zachowa
istniejące zatwierdzenie bez zmian i utworzy nową oczekującą prośbę o podniesienie uprawnień. Użyj
`openclaw devices list`, aby porównać obecnie zatwierdzony dostęp z nowo
żądanym dostępem przed zatwierdzeniem.

### Przechowywanie stanu parowania Node

Przechowywany w `~/.openclaw/devices/`:

- `pending.json` (krótkotrwały; oczekujące prośby wygasają)
- `paired.json` (sparowane urządzenia + tokeny)

### Uwagi

- Starsze API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|rename`) to
  oddzielny magazyn parowania zarządzany przez Gateway. Node WS nadal wymagają parowania urządzenia.
- Rekord parowania jest trwałym źródłem prawdy dla zatwierdzonych ról. Aktywne
  tokeny urządzeń pozostają ograniczone do tego zatwierdzonego zestawu ról; przypadkowy wpis tokena
  poza zatwierdzonymi rolami nie daje nowego dostępu.

## Powiązane dokumenty

- Model bezpieczeństwa + prompt injection: [Bezpieczeństwo](/pl/gateway/security)
- Bezpieczne aktualizowanie (uruchom doctor): [Aktualizowanie](/pl/install/updating)
- Konfiguracje kanałów:
  - Telegram: [Telegram](/pl/channels/telegram)
  - WhatsApp: [WhatsApp](/pl/channels/whatsapp)
  - Signal: [Signal](/pl/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/pl/channels/bluebubbles)
  - iMessage (starsze): [iMessage](/pl/channels/imessage)
  - Discord: [Discord](/pl/channels/discord)
  - Slack: [Slack](/pl/channels/slack)
