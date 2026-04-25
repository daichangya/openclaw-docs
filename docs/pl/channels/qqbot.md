---
read_when:
    - Chcesz połączyć OpenClaw z QQ.
    - Potrzebujesz skonfigurować poświadczenia QQ Bot.
    - Chcesz obsługę czatów grupowych lub prywatnych w QQ Bot.
summary: Konfiguracja, ustawienia i użytkowanie QQ Bot
title: bot QQ
x-i18n:
    generated_at: "2026-04-25T13:42:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1219f8d6ca3996272b293cc042364300f0fdfea6c7f19585e4ee514ac2182d46
    source_path: channels/qqbot.md
    workflow: 15
---

QQ Bot łączy się z OpenClaw przez oficjalne API QQ Bot (brama WebSocket). Ten
Plugin obsługuje prywatne czaty C2C, grupowe @messages oraz wiadomości na kanałach guild z
multimediami rozszerzonymi (obrazy, głos, wideo, pliki).

Status: dołączony Plugin. Obsługiwane są wiadomości prywatne, czaty grupowe, kanały guild oraz
multimedia. Reakcje i wątki nie są obsługiwane.

## Dołączony Plugin

Bieżące wydania OpenClaw zawierają QQ Bot w pakiecie, więc zwykłe buildy pakietowe nie wymagają
osobnego kroku `openclaw plugins install`.

## Konfiguracja

1. Przejdź do [QQ Open Platform](https://q.qq.com/) i zeskanuj kod QR za pomocą
   aplikacji QQ w telefonie, aby się zarejestrować / zalogować.
2. Kliknij **Create Bot**, aby utworzyć nowego bota QQ.
3. Na stronie ustawień bota znajdź **AppID** i **AppSecret** i skopiuj je.

> AppSecret nie jest przechowywany w postaci zwykłego tekstu — jeśli opuścisz stronę bez zapisania,
> konieczne będzie wygenerowanie nowego.

4. Dodaj kanał:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Uruchom ponownie Gateway.

Interaktywne ścieżki konfiguracji:

```bash
openclaw channels add
openclaw configure --section channels
```

## Konfiguracja

Minimalna konfiguracja:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

Zmienne środowiskowe dla konta domyślnego:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret z pliku:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

Uwagi:

- Rezerwowe użycie zmiennych środowiskowych dotyczy tylko domyślnego konta QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` przekazuje tylko
  AppSecret; AppID musi być już ustawiony w konfiguracji lub w `QQBOT_APP_ID`.
- `clientSecret` akceptuje także dane wejściowe SecretRef, a nie tylko ciąg tekstowy w postaci zwykłego tekstu.

### Konfiguracja wielu kont

Uruchamiaj wiele botów QQ w jednej instancji OpenClaw:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

Każde konto uruchamia własne połączenie WebSocket i utrzymuje niezależną
pamięć podręczną tokenów (izolowaną przez `appId`).

Dodanie drugiego bota przez CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Głos (STT / TTS)

Obsługa STT i TTS ma dwupoziomową konfigurację z rezerwowym priorytetem:

| Ustawienie | Specyficzne dla Plugin | Rezerwowe na poziomie frameworka |
| ------- | -------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt` | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts` | `messages.tts`                |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
    },
  },
}
```

Ustaw `enabled: false` dla dowolnego z nich, aby go wyłączyć.

Przychodzące załączniki głosowe QQ są udostępniane agentom jako metadane multimediów audio,
a surowe pliki głosowe pozostają poza ogólnym `MediaPaths`. Odpowiedzi w zwykłym
tekście `[[audio_as_voice]]` syntezują TTS i wysyłają natywną wiadomość głosową QQ, gdy TTS jest
skonfigurowane.

Zachowanie przesyłania/transkodowania wychodzącego audio można także dostroić za pomocą
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formaty docelowe

| Format                     | Opis               |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Czat prywatny (C2C) |
| `qqbot:group:GROUP_OPENID` | Czat grupowy       |
| `qqbot:channel:CHANNEL_ID` | Kanał guild        |

> Każdy bot ma własny zestaw OpenID użytkowników. OpenID otrzymany przez Bota A **nie może**
> zostać użyty do wysyłania wiadomości przez Bota B.

## Polecenia slash

Wbudowane polecenia przechwytywane przed kolejką AI:

| Polecenie      | Opis                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Test opóźnienia                                                                                          |
| `/bot-version` | Pokazuje wersję frameworka OpenClaw                                                                      |
| `/bot-help`    | Wyświetla wszystkie polecenia                                                                            |
| `/bot-upgrade` | Pokazuje link do przewodnika aktualizacji QQBot                                                          |
| `/bot-logs`    | Eksportuje ostatnie logi Gateway jako plik                                                               |
| `/bot-approve` | Zatwierdza oczekujące działanie QQ Bot (na przykład potwierdzenie przesyłania C2C lub grupowego) przez natywny przepływ. |

Dodaj `?` do dowolnego polecenia, aby uzyskać pomoc o użyciu (na przykład `/bot-upgrade ?`).

## Architektura silnika

QQ Bot jest dostarczany jako samodzielny silnik wewnątrz Plugin:

- Każde konto ma własny izolowany stos zasobów (połączenie WebSocket, klient API, pamięć podręczną tokenów, katalog główny przechowywania multimediów) powiązany z `appId`. Konta nigdy nie współdzielą stanu przychodzącego/wychodzącego.
- Rejestrator wielu kont oznacza linie logów kontem właściciela, dzięki czemu diagnostyka pozostaje rozdzielona, gdy uruchamiasz kilka botów pod jedną bramą.
- Ścieżki przychodzące, wychodzące i mostka Gateway współdzielą jeden katalog główny ładunków multimedialnych w `~/.openclaw/media`, więc przesyłania, pobrania i pamięci podręczne transkodowania trafiają do jednego chronionego katalogu zamiast do osobnego drzewa dla każdego podsystemu.
- Poświadczenia można tworzyć w kopii zapasowej i przywracać jako część standardowych migawek poświadczeń OpenClaw; po przywróceniu silnik ponownie dołącza stos zasobów każdego konta bez konieczności ponownego parowania kodem QR.

## Onboarding kodem QR

Jako alternatywę dla ręcznego wklejania `AppID:AppSecret`, silnik obsługuje przepływ onboardingu kodem QR służący do łączenia QQ Bot z OpenClaw:

1. Uruchom ścieżkę konfiguracji QQ Bot (na przykład `openclaw channels add --channel qqbot`) i po wyświetleniu monitu wybierz przepływ kodu QR.
2. Zeskanuj wygenerowany kod QR aplikacją w telefonie powiązaną z docelowym QQ Bot.
3. Zatwierdź parowanie w telefonie. OpenClaw zapisze zwrócone poświadczenia w `credentials/` we właściwym zakresie konta.

Monity o zatwierdzenie generowane przez samego bota (na przykład przepływy „zezwolić na to działanie?” udostępniane przez API QQ Bot) są wyświetlane jako natywne monity OpenClaw, które możesz zaakceptować za pomocą `/bot-approve` zamiast odpowiadać przez surowego klienta QQ.

## Rozwiązywanie problemów

- **Bot odpowiada „gone to Mars”:** poświadczenia nie są skonfigurowane lub Gateway nie został uruchomiony.
- **Brak wiadomości przychodzących:** sprawdź, czy `appId` i `clientSecret` są poprawne oraz czy
  bot jest włączony na QQ Open Platform.
- **Konfiguracja z `--token-file` nadal pokazuje brak konfiguracji:** `--token-file` ustawia tylko
  AppSecret. Nadal potrzebujesz `appId` w konfiguracji lub `QQBOT_APP_ID`.
- **Wiadomości proaktywne nie docierają:** QQ może przechwytywać wiadomości inicjowane przez bota, jeśli
  użytkownik nie wchodził ostatnio w interakcję.
- **Głos nie jest transkrybowany:** upewnij się, że STT jest skonfigurowane i dostawca jest osiągalny.

## Powiązane

- [Pairing](/pl/channels/pairing)
- [Groups](/pl/channels/groups)
- [Channel troubleshooting](/pl/channels/troubleshooting)
