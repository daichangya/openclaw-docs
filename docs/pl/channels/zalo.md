---
read_when:
    - Pracujesz nad funkcjami Zalo lub Webhookami.
summary: Status obsługi, możliwości i konfiguracja bota Zalo
title: Zalo
x-i18n:
    generated_at: "2026-04-25T13:42:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7eb9d5b1879fcdf70220c4b1542e843e47e12048ff567eeb0e1cb3367b3d200
    source_path: channels/zalo.md
    workflow: 15
---

Status: eksperymentalny. Wiadomości prywatne są obsługiwane. Sekcja [Możliwości](#capabilities) poniżej odzwierciedla bieżące zachowanie botów Marketplace.

## Dołączony Plugin

Zalo jest dostarczane jako dołączony Plugin w bieżących wydaniach OpenClaw, więc zwykłe
buildy pakietowe nie wymagają osobnej instalacji.

Jeśli używasz starszego buildu lub niestandardowej instalacji, która nie zawiera Zalo, zainstaluj go
ręcznie:

- Instalacja przez CLI: `openclaw plugins install @openclaw/zalo`
- Lub z checkoutu źródłowego: `openclaw plugins install ./path/to/local/zalo-plugin`
- Szczegóły: [Plugins](/pl/tools/plugin)

## Szybka konfiguracja (dla początkujących)

1. Upewnij się, że Plugin Zalo jest dostępny.
   - Bieżące pakietowe wydania OpenClaw zawierają go już w zestawie.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Ustaw token:
   - Zmienna środowiskowa: `ZALO_BOT_TOKEN=...`
   - Lub konfiguracja: `channels.zalo.accounts.default.botToken: "..."`.
3. Uruchom ponownie gateway (lub dokończ konfigurację).
4. Dostęp do wiadomości prywatnych domyślnie używa parowania; zatwierdź kod parowania przy pierwszym kontakcie.

Minimalna konfiguracja:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## Czym to jest

Zalo to komunikator popularny w Wietnamie; jego Bot API pozwala Gateway uruchamiać bota do rozmów 1:1.
To dobre rozwiązanie do wsparcia lub powiadomień, gdy zależy Ci na deterministycznym kierowaniu odpowiedzi z powrotem do Zalo.

Ta strona odzwierciedla bieżące zachowanie OpenClaw dla **botów Zalo Bot Creator / Marketplace**.
**Boty Zalo Official Account (OA)** to inna powierzchnia produktowa Zalo i mogą działać inaczej.

- Kanał Zalo Bot API należący do Gateway.
- Deterministyczne kierowanie: odpowiedzi wracają do Zalo; model nigdy nie wybiera kanałów.
- Wiadomości prywatne współdzielą główną sesję agenta.
- Sekcja [Możliwości](#capabilities) poniżej pokazuje bieżące wsparcie dla botów Marketplace.

## Konfiguracja (szybka ścieżka)

### 1) Utwórz token bota (Zalo Bot Platform)

1. Przejdź do [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) i zaloguj się.
2. Utwórz nowego bota i skonfiguruj jego ustawienia.
3. Skopiuj pełny token bota (zwykle `numeric_id:secret`). W przypadku botów Marketplace użyteczny token środowiska wykonawczego może pojawić się w wiadomości powitalnej bota po utworzeniu.

### 2) Skonfiguruj token (zmienna środowiskowa lub konfiguracja)

Przykład:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

Jeśli później przejdziesz do powierzchni botów Zalo, w której grupy są dostępne, możesz jawnie dodać konfigurację specyficzną dla grup, taką jak `groupPolicy` i `groupAllowFrom`. Dla bieżącego zachowania botów Marketplace zobacz [Możliwości](#capabilities).

Opcja zmiennej środowiskowej: `ZALO_BOT_TOKEN=...` (działa tylko dla konta domyślnego).

Obsługa wielu kont: użyj `channels.zalo.accounts` z tokenami per konto oraz opcjonalną `name`.

3. Uruchom ponownie gateway. Zalo uruchamia się, gdy token zostanie rozwiązany (ze zmiennej środowiskowej lub konfiguracji).
4. Dostęp do wiadomości prywatnych domyślnie używa parowania. Zatwierdź kod, gdy bot zostanie po raz pierwszy skontaktowany.

## Jak to działa (zachowanie)

- Wiadomości przychodzące są normalizowane do współdzielonej otoczki kanału z placeholderami multimediów.
- Odpowiedzi są zawsze kierowane z powrotem do tego samego czatu Zalo.
- Domyślnie używane jest long-polling; tryb Webhook jest dostępny przez `channels.zalo.webhookUrl`.

## Ograniczenia

- Tekst wychodzący jest dzielony na fragmenty po 2000 znaków (limit API Zalo).
- Pobieranie/przesyłanie multimediów jest ograniczone przez `channels.zalo.mediaMaxMb` (domyślnie 5).
- Streaming jest domyślnie blokowany, ponieważ limit 2000 znaków sprawia, że streaming jest mniej przydatny.

## Kontrola dostępu (wiadomości prywatne)

### Dostęp do wiadomości prywatnych

- Domyślnie: `channels.zalo.dmPolicy = "pairing"`. Nieznani nadawcy otrzymują kod parowania; wiadomości są ignorowane do momentu zatwierdzenia (kody wygasają po 1 godzinie).
- Zatwierdzanie przez:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Parowanie jest domyślnym mechanizmem wymiany tokenów. Szczegóły: [Pairing](/pl/channels/pairing)
- `channels.zalo.allowFrom` akceptuje numeryczne identyfikatory użytkowników (brak dostępnego wyszukiwania po nazwie użytkownika).

## Kontrola dostępu (grupy)

W przypadku **botów Zalo Bot Creator / Marketplace** obsługa grup nie była w praktyce dostępna, ponieważ nie dało się w ogóle dodać bota do grupy.

Oznacza to, że poniższe klucze konfiguracyjne związane z grupami istnieją w schemacie, ale nie były użyteczne dla botów Marketplace:

- `channels.zalo.groupPolicy` kontroluje obsługę wiadomości przychodzących w grupach: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` ogranicza, które identyfikatory nadawców mogą uruchamiać bota w grupach.
- Jeśli `groupAllowFrom` nie jest ustawione, Zalo używa `allowFrom` jako ustawienia rezerwowego do sprawdzania nadawców.
- Uwaga środowiska wykonawczego: jeśli całe `channels.zalo` jest pominięte, środowisko wykonawcze nadal używa ustawienia rezerwowego `groupPolicy="allowlist"` dla bezpieczeństwa.

Wartości zasad grupowych (gdy dostęp do grup jest dostępny na powierzchni Twojego bota) to:

- `groupPolicy: "disabled"` — blokuje wszystkie wiadomości grupowe.
- `groupPolicy: "open"` — zezwala każdemu członkowi grupy (z bramkowaniem wzmianek).
- `groupPolicy: "allowlist"` — domyślne zachowanie fail-closed; akceptowani są tylko dozwoleni nadawcy.

Jeśli używasz innej powierzchni produktu botów Zalo i masz potwierdzone działanie grup, udokumentuj to osobno, zamiast zakładać, że odpowiada to przepływowi botów Marketplace.

## Long-polling a Webhook

- Domyślnie: long-polling (nie jest wymagany publiczny URL).
- Tryb Webhook: ustaw `channels.zalo.webhookUrl` i `channels.zalo.webhookSecret`.
  - Sekret Webhook musi mieć od 8 do 256 znaków.
  - URL Webhook musi używać HTTPS.
  - Zalo wysyła zdarzenia z nagłówkiem `X-Bot-Api-Secret-Token` do weryfikacji.
  - HTTP Gateway obsługuje żądania Webhook pod `channels.zalo.webhookPath` (domyślnie ścieżka URL Webhook).
  - Żądania muszą używać `Content-Type: application/json` (lub typów mediów `+json`).
  - Zduplikowane zdarzenia (`event_name + message_id`) są ignorowane przez krótki okres ochrony przed powtórzeniami.
  - Ruch seryjny jest ograniczany per ścieżka/źródło i może zwracać HTTP 429.

**Uwaga:** `getUpdates` (polling) i Webhook wzajemnie się wykluczają zgodnie z dokumentacją API Zalo.

## Obsługiwane typy wiadomości

Aby szybko sprawdzić stan wsparcia, zobacz [Możliwości](#capabilities). Poniższe uwagi dodają szczegóły tam, gdzie zachowanie wymaga dodatkowego kontekstu.

- **Wiadomości tekstowe**: pełne wsparcie z dzieleniem na fragmenty po 2000 znaków.
- **Zwykłe URL-e w tekście**: działają jak zwykłe dane wejściowe tekstowe.
- **Podglądy linków / rozbudowane karty linków**: zobacz status botów Marketplace w [Możliwości](#capabilities); nie wywoływały odpowiedzi w sposób niezawodny.
- **Wiadomości obrazkowe**: zobacz status botów Marketplace w [Możliwości](#capabilities); obsługa obrazów przychodzących była zawodna (wskaźnik pisania bez końcowej odpowiedzi).
- **Naklejki**: zobacz status botów Marketplace w [Możliwości](#capabilities).
- **Notatki głosowe / pliki audio / wideo / ogólne załączniki plikowe**: zobacz status botów Marketplace w [Możliwości](#capabilities).
- **Nieobsługiwane typy**: są logowane (na przykład wiadomości od użytkowników chronionych).

## Możliwości

Ta tabela podsumowuje bieżące zachowanie **botów Zalo Bot Creator / Marketplace** w OpenClaw.

| Funkcja                     | Status                                  |
| --------------------------- | --------------------------------------- |
| Wiadomości prywatne         | ✅ Obsługiwane                          |
| Grupy                       | ❌ Niedostępne dla botów Marketplace    |
| Multimedia (obrazy przychodzące) | ⚠️ Ograniczone / sprawdź w swoim środowisku |
| Multimedia (obrazy wychodzące)   | ⚠️ Nie testowano ponownie dla botów Marketplace |
| Zwykłe URL-e w tekście      | ✅ Obsługiwane                          |
| Podglądy linków             | ⚠️ Zawodne dla botów Marketplace        |
| Reakcje                     | ❌ Nieobsługiwane                       |
| Naklejki                    | ⚠️ Brak odpowiedzi agenta dla botów Marketplace |
| Notatki głosowe / audio / wideo | ⚠️ Brak odpowiedzi agenta dla botów Marketplace |
| Załączniki plikowe          | ⚠️ Brak odpowiedzi agenta dla botów Marketplace |
| Wątki                       | ❌ Nieobsługiwane                       |
| Ankiety                     | ❌ Nieobsługiwane                       |
| Polecenia natywne           | ❌ Nieobsługiwane                       |
| Streaming                   | ⚠️ Zablokowany (limit 2000 znaków)      |

## Cele dostarczania (CLI/Cron)

- Użyj identyfikatora czatu jako celu.
- Przykład: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Rozwiązywanie problemów

**Bot nie odpowiada:**

- Sprawdź, czy token jest prawidłowy: `openclaw channels status --probe`
- Zweryfikuj, czy nadawca jest zatwierdzony (parowanie lub `allowFrom`)
- Sprawdź logi gateway: `openclaw logs --follow`

**Webhook nie odbiera zdarzeń:**

- Upewnij się, że URL Webhook używa HTTPS
- Zweryfikuj, czy sekretny token ma od 8 do 256 znaków
- Potwierdź, że punkt końcowy HTTP gateway jest osiągalny pod skonfigurowaną ścieżką
- Sprawdź, czy polling `getUpdates` nie jest uruchomiony (wzajemnie się wykluczają)

## Dokumentacja konfiguracji (Zalo)

Pełna konfiguracja: [Configuration](/pl/gateway/configuration)

Płaskie klucze najwyższego poziomu (`channels.zalo.botToken`, `channels.zalo.dmPolicy` i podobne) to starszy skrót dla pojedynczego konta. W nowych konfiguracjach preferuj `channels.zalo.accounts.<id>.*`. Obie formy są nadal udokumentowane tutaj, ponieważ istnieją w schemacie.

Opcje dostawcy:

- `channels.zalo.enabled`: włącza/wyłącza uruchamianie kanału.
- `channels.zalo.botToken`: token bota z Zalo Bot Platform.
- `channels.zalo.tokenFile`: odczytuje token ze zwykłej ścieżki pliku. Dowiązania symboliczne są odrzucane.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing).
- `channels.zalo.allowFrom`: allowlista wiadomości prywatnych (identyfikatory użytkowników). `open` wymaga `"*"`. Kreator poprosi o identyfikatory numeryczne.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (domyślnie: allowlist). Obecne w konfiguracji; zobacz [Możliwości](#capabilities) i [Kontrola dostępu (grupy)](#access-control-groups), aby poznać bieżące zachowanie botów Marketplace.
- `channels.zalo.groupAllowFrom`: allowlista nadawców grupowych (identyfikatory użytkowników). Gdy nie jest ustawione, używa `allowFrom` jako ustawienia rezerwowego.
- `channels.zalo.mediaMaxMb`: limit multimediów przychodzących/wychodzących (MB, domyślnie 5).
- `channels.zalo.webhookUrl`: włącza tryb Webhook (wymagany HTTPS).
- `channels.zalo.webhookSecret`: sekret Webhook (8-256 znaków).
- `channels.zalo.webhookPath`: ścieżka Webhook na serwerze HTTP gateway.
- `channels.zalo.proxy`: URL proxy dla żądań API.

Opcje wielu kont:

- `channels.zalo.accounts.<id>.botToken`: token per konto.
- `channels.zalo.accounts.<id>.tokenFile`: zwykły plik tokena per konto. Dowiązania symboliczne są odrzucane.
- `channels.zalo.accounts.<id>.name`: nazwa wyświetlana.
- `channels.zalo.accounts.<id>.enabled`: włącza/wyłącza konto.
- `channels.zalo.accounts.<id>.dmPolicy`: zasada wiadomości prywatnych per konto.
- `channels.zalo.accounts.<id>.allowFrom`: allowlista per konto.
- `channels.zalo.accounts.<id>.groupPolicy`: zasada grup per konto. Obecne w konfiguracji; zobacz [Możliwości](#capabilities) i [Kontrola dostępu (grupy)](#access-control-groups), aby poznać bieżące zachowanie botów Marketplace.
- `channels.zalo.accounts.<id>.groupAllowFrom`: allowlista nadawców grupowych per konto.
- `channels.zalo.accounts.<id>.webhookUrl`: URL Webhook per konto.
- `channels.zalo.accounts.<id>.webhookSecret`: sekret Webhook per konto.
- `channels.zalo.accounts.<id>.webhookPath`: ścieżka Webhook per konto.
- `channels.zalo.accounts.<id>.proxy`: URL proxy per konto.

## Powiązane

- [Channels Overview](/pl/channels) — wszystkie obsługiwane kanały
- [Pairing](/pl/channels/pairing) — uwierzytelnianie wiadomości prywatnych i przepływ parowania
- [Groups](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmianek
- [Channel Routing](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Security](/pl/gateway/security) — model dostępu i utwardzanie
