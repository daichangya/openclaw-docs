---
read_when:
    - Chcesz połączyć OpenClaw z QQ
    - Potrzebujesz skonfigurować poświadczenia bota QQ
    - Chcesz obsługi bota QQ dla czatów grupowych lub prywatnych
summary: Konfiguracja, ustawienia i użycie bota QQ
title: bot QQ
x-i18n:
    generated_at: "2026-04-26T11:24:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: bd899d9556ab418bbb3d7dc368e6f6e1eca96828cbcc87b4147ccad362f1918e
    source_path: channels/qqbot.md
    workflow: 15
---

QQ Bot łączy się z OpenClaw przez oficjalne API QQ Bot (bramka WebSocket). Ten
Plugin obsługuje prywatne czaty C2C, grupowe @messages oraz wiadomości w kanałach guild z
multimediami rich (obrazy, głos, wideo, pliki).

Status: dołączony Plugin. Obsługiwane są wiadomości bezpośrednie, czaty grupowe, kanały guild oraz
multimedia. Reakcje i wątki nie są obsługiwane.

## Dołączony Plugin

Aktualne wydania OpenClaw zawierają QQ Bot, więc zwykłe spakowane buildy nie wymagają
osobnego kroku `openclaw plugins install`.

## Konfiguracja

1. Przejdź do [QQ Open Platform](https://q.qq.com/) i zeskanuj kod QR swoim
   QQ w telefonie, aby się zarejestrować / zalogować.
2. Kliknij **Create Bot**, aby utworzyć nowego bota QQ.
3. Znajdź **AppID** i **AppSecret** na stronie ustawień bota i skopiuj je.

> AppSecret nie jest przechowywany w postaci jawnego tekstu — jeśli opuścisz stronę bez jego zapisania,
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

- Fallback do env dotyczy tylko domyślnego konta QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` podaje tylko
  AppSecret; AppID musi już być ustawione w konfiguracji lub w `QQBOT_APP_ID`.
- `clientSecret` akceptuje także wejście SecretRef, nie tylko ciąg znaków w postaci jawnego tekstu.

### Konfiguracja wielu kont

Uruchamiaj wiele botów QQ w ramach jednej instancji OpenClaw:

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

Każde konto uruchamia własne połączenie WebSocket i utrzymuje niezależną pamięć podręczną
tokenów (izolowaną przez `appId`).

Dodawanie drugiego bota przez CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Głos (STT / TTS)

Obsługa STT i TTS ma dwupoziomową konfigurację z fallbackiem priorytetowym:

| Ustawienie | Specyficzne dla Pluginu                                 | Fallback frameworka          |
| ---------- | ------------------------------------------------------- | ---------------------------- |
| STT        | `channels.qqbot.stt`                                    | `tools.media.audio.models[0]` |
| TTS        | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`               |

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
      accounts: {
        qq-main: {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

Ustaw `enabled: false` dla dowolnego z nich, aby je wyłączyć.
Nadpisania TTS na poziomie konta używają tego samego kształtu co `messages.tts` i są głęboko scalane
z konfiguracją TTS kanału/globalną.

Przychodzące załączniki głosowe QQ są udostępniane agentom jako metadane nośnika audio,
przy jednoczesnym trzymaniu surowych plików głosowych poza ogólnymi `MediaPaths`. Odpowiedzi
w jawnym tekście `[[audio_as_voice]]` syntezują TTS i wysyłają natywną wiadomość głosową QQ, gdy TTS jest
skonfigurowane.

Zachowanie przesyłania/transkodowania audio wychodzącego można też dostroić za pomocą
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formaty celu

| Format                     | Opis                 |
| -------------------------- | -------------------- |
| `qqbot:c2c:OPENID`         | Czat prywatny (C2C)  |
| `qqbot:group:GROUP_OPENID` | Czat grupowy         |
| `qqbot:channel:CHANNEL_ID` | Kanał guild          |

> Każdy bot ma własny zestaw OpenID użytkowników. OpenID otrzymany przez Bota A **nie może**
> być użyty do wysyłania wiadomości przez Bota B.

## Polecenia slash

Wbudowane polecenia przechwytywane przed kolejką AI:

| Polecenie      | Opis                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Test opóźnienia                                                                                           |
| `/bot-version` | Pokaż wersję frameworka OpenClaw                                                                          |
| `/bot-help`    | Wyświetl wszystkie polecenia                                                                              |
| `/bot-upgrade` | Pokaż link do przewodnika aktualizacji QQBot                                                              |
| `/bot-logs`    | Wyeksportuj ostatnie logi Gateway jako plik                                                               |
| `/bot-approve` | Zatwierdź oczekującą akcję QQ Bot (na przykład potwierdzenie przesłania C2C lub grupowego) przez natywny przepływ. |

Dodaj `?` do dowolnego polecenia, aby uzyskać pomoc o użyciu (na przykład `/bot-upgrade ?`).

## Architektura silnika

QQ Bot jest dostarczany jako samodzielny silnik wewnątrz Pluginu:

- Każde konto posiada izolowany stos zasobów (połączenie WebSocket, klient API, pamięć podręczną tokenów, katalog główny przechowywania multimediów) kluczowany przez `appId`. Konta nigdy nie współdzielą stanu przychodzącego/wychodzącego.
- Logger wielu kont oznacza linie logu kontem właściciela, dzięki czemu diagnostyka pozostaje rozdzielna, gdy uruchamiasz kilka botów pod jedną bramką.
- Ścieżki przychodzące, wychodzące i mostu Gateway współdzielą jeden katalog główny payloadów mediów w `~/.openclaw/media`, więc przesyłania, pobrania i pamięci podręczne transkodowania trafiają do jednego chronionego katalogu zamiast do drzewa dla każdego podsystemu osobno.
- Poświadczenia można tworzyć kopie zapasowe i przywracać w ramach standardowych snapshotów poświadczeń OpenClaw; silnik ponownie dołącza stos zasobów każdego konta po przywróceniu bez potrzeby nowego parowania kodem QR.

## Onboarding kodem QR

Jako alternatywa dla ręcznego wklejania `AppID:AppSecret`, silnik obsługuje przepływ onboardingu kodem QR do łączenia QQ Bot z OpenClaw:

1. Uruchom ścieżkę konfiguracji QQ Bot (na przykład `openclaw channels add --channel qqbot`) i po wyświetleniu monitu wybierz przepływ kodu QR.
2. Zeskanuj wygenerowany kod QR aplikacją telefonu powiązaną z docelowym QQ Bot.
3. Zatwierdź parowanie w telefonie. OpenClaw zapisze zwrócone poświadczenia w `credentials/` w odpowiednim zakresie konta.

Monity zatwierdzania generowane przez samego bota (na przykład przepływy „allow this action?” udostępniane przez API QQ Bot) są wyświetlane jako natywne monity OpenClaw, które możesz zaakceptować za pomocą `/bot-approve`, zamiast odpowiadać przez surowego klienta QQ.

## Rozwiązywanie problemów

- **Bot odpowiada „gone to Mars”:** poświadczenia nie są skonfigurowane lub Gateway nie został uruchomiony.
- **Brak wiadomości przychodzących:** sprawdź, czy `appId` i `clientSecret` są poprawne oraz czy
  bot jest włączony na QQ Open Platform.
- **Powtarzające się odpowiedzi do samego siebie:** OpenClaw zapisuje indeksy odwołań wychodzących QQ jako
  utworzone przez bota i ignoruje zdarzenia przychodzące, których bieżący `msgIdx` odpowiada temu
  samemu kontu bota. Zapobiega to pętlom echa platformy, a jednocześnie nadal pozwala użytkownikom
  cytować lub odpowiadać na wcześniejsze wiadomości bota.
- **Konfiguracja z `--token-file` nadal pokazuje brak konfiguracji:** `--token-file` ustawia tylko
  AppSecret. Nadal potrzebujesz `appId` w konfiguracji lub `QQBOT_APP_ID`.
- **Wiadomości proaktywne nie docierają:** QQ może przechwytywać wiadomości inicjowane przez bota, jeśli
  użytkownik nie wchodził ostatnio w interakcję.
- **Głos nie jest transkrybowany:** upewnij się, że STT jest skonfigurowane i że provider jest osiągalny.

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting)
