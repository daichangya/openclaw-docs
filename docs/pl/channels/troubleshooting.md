---
read_when:
    - Transport kanału pokazuje połączenie, ale odpowiedzi nie działają
    - Potrzebujesz kontroli specyficznych dla kanału, zanim przejdziesz do szczegółowej dokumentacji dostawcy
summary: Szybkie rozwiązywanie problemów na poziomie kanału z charakterystycznymi sygnaturami awarii dla każdego kanału i sposobami naprawy
title: Rozwiązywanie problemów z kanałami
x-i18n:
    generated_at: "2026-04-20T09:58:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0aef31742cd5cc4af3fa3d3ea1acba51875ad4a1423c0e8c87372c3df31b0528
    source_path: channels/troubleshooting.md
    workflow: 15
---

# Rozwiązywanie problemów z kanałami

Użyj tej strony, gdy kanał się łączy, ale działa nieprawidłowo.

## Drabina poleceń

Najpierw uruchom je w tej kolejności:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Prawidłowy stan bazowy:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` lub `admin-capable`
- Test kanału pokazuje, że transport jest połączony, a tam, gdzie to obsługiwane, `works` lub `audit ok`

## WhatsApp

### Sygnatury awarii WhatsApp

| Objaw                           | Najszybsza kontrola                               | Naprawa                                                 |
| ------------------------------- | ------------------------------------------------- | ------------------------------------------------------- |
| Połączono, ale brak odpowiedzi w DM | `openclaw pairing list whatsapp`                  | Zatwierdź nadawcę lub zmień politykę DM/listę dozwolonych. |
| Wiadomości grupowe są ignorowane | Sprawdź `requireMention` i wzorce wzmianek w konfiguracji | Wspomnij bota lub złagodź politykę wzmianek dla tej grupy. |
| Losowe rozłączenia/pętle ponownego logowania | `openclaw channels status --probe` + logi         | Zaloguj się ponownie i sprawdź, czy katalog poświadczeń jest w dobrym stanie. |

Pełne rozwiązywanie problemów: [/channels/whatsapp#troubleshooting](/pl/channels/whatsapp#troubleshooting)

## Telegram

### Sygnatury awarii Telegram

| Objaw                               | Najszybsza kontrola                           | Naprawa                                                                    |
| ----------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------- |
| `/start`, ale brak użytecznego przepływu odpowiedzi | `openclaw pairing list telegram`              | Zatwierdź parowanie lub zmień politykę DM.                                 |
| Bot jest online, ale grupa milczy   | Sprawdź wymóg wzmianki i tryb prywatności bota | Wyłącz tryb prywatności dla widoczności w grupie lub wspomnij bota.        |
| Błędy wysyłania z błędami sieciowymi | Sprawdź logi pod kątem błędów wywołań Telegram API | Napraw routing DNS/IPv6/proxy do `api.telegram.org`.                       |
| `setMyCommands` odrzucane przy starcie | Sprawdź logi pod kątem `BOT_COMMANDS_TOO_MUCH` | Ogranicz komendy Telegram z Plugin/Skills/własne lub wyłącz natywne menu. |
| Po aktualizacji lista dozwolonych Cię blokuje | `openclaw security audit` i listy dozwolonych w konfiguracji | Uruchom `openclaw doctor --fix` lub zastąp `@username` numerycznymi identyfikatorami nadawców. |

Pełne rozwiązywanie problemów: [/channels/telegram#troubleshooting](/pl/channels/telegram#troubleshooting)

## Discord

### Sygnatury awarii Discord

| Objaw                           | Najszybsza kontrola              | Naprawa                                                  |
| ------------------------------- | -------------------------------- | -------------------------------------------------------- |
| Bot jest online, ale nie odpowiada na serwerze | `openclaw channels status --probe` | Zezwól na serwer/kanał i sprawdź uprawnienie message content intent. |
| Wiadomości grupowe są ignorowane | Sprawdź logi pod kątem odrzuceń przez reguły wzmianek | Wspomnij bota lub ustaw `requireMention: false` dla serwera/kanału. |
| Brak odpowiedzi w DM            | `openclaw pairing list discord`  | Zatwierdź parowanie DM lub dostosuj politykę DM.         |

Pełne rozwiązywanie problemów: [/channels/discord#troubleshooting](/pl/channels/discord#troubleshooting)

## Slack

### Sygnatury awarii Slack

| Objaw                                  | Najszybsza kontrola                    | Naprawa                                                                                                                                             |
| -------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode jest połączony, ale brak odpowiedzi | `openclaw channels status --probe`     | Sprawdź token aplikacji + token bota oraz wymagane zakresy; zwróć uwagę na `botTokenStatus` / `appTokenStatus = configured_unavailable` w konfiguracjach opartych na SecretRef. |
| DM są blokowane                        | `openclaw pairing list slack`          | Zatwierdź parowanie lub złagodź politykę DM.                                                                                                       |
| Wiadomość na kanale jest ignorowana    | Sprawdź `groupPolicy` i listę dozwolonych kanałów | Zezwól na kanał lub przełącz politykę na `open`.                                                                                                   |

Pełne rozwiązywanie problemów: [/channels/slack#troubleshooting](/pl/channels/slack#troubleshooting)

## iMessage and BlueBubbles

### Sygnatury awarii iMessage i BlueBubbles

| Objaw                            | Najszybsza kontrola                                                   | Naprawa                                              |
| -------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------- |
| Brak zdarzeń przychodzących      | Sprawdź osiągalność Webhook/servera i uprawnienia aplikacji           | Napraw URL Webhook lub stan serwera BlueBubbles.     |
| Można wysyłać, ale nie odbiera na macOS | Sprawdź uprawnienia prywatności macOS dla automatyzacji Messages      | Ponownie nadaj uprawnienia TCC i uruchom proces kanału ponownie. |
| Nadawca DM jest blokowany        | `openclaw pairing list imessage` lub `openclaw pairing list bluebubbles` | Zatwierdź parowanie lub zaktualizuj listę dozwolonych. |

Pełne rozwiązywanie problemów:

- [/channels/imessage#troubleshooting](/pl/channels/imessage#troubleshooting)
- [/channels/bluebubbles#troubleshooting](/pl/channels/bluebubbles#troubleshooting)

## Signal

### Sygnatury awarii Signal

| Objaw                           | Najszybsza kontrola                 | Naprawa                                                 |
| ------------------------------- | ----------------------------------- | ------------------------------------------------------- |
| Demon jest osiągalny, ale bot milczy | `openclaw channels status --probe`  | Sprawdź URL/konto demona `signal-cli` i tryb odbioru.   |
| DM są blokowane                 | `openclaw pairing list signal`      | Zatwierdź nadawcę lub dostosuj politykę DM.             |
| Odpowiedzi w grupie się nie uruchamiają | Sprawdź listę dozwolonych grup i wzorce wzmianek | Dodaj nadawcę/grupę lub złagodź reguły blokowania.      |

Pełne rozwiązywanie problemów: [/channels/signal#troubleshooting](/pl/channels/signal#troubleshooting)

## QQ Bot

### Sygnatury awarii QQ Bot

| Objaw                           | Najszybsza kontrola                          | Naprawa                                                         |
| ------------------------------- | -------------------------------------------- | --------------------------------------------------------------- |
| Bot odpowiada „gone to Mars”    | Sprawdź `appId` i `clientSecret` w konfiguracji | Ustaw poświadczenia lub uruchom Gateway ponownie.               |
| Brak wiadomości przychodzących  | `openclaw channels status --probe`           | Sprawdź poświadczenia na QQ Open Platform.                      |
| Głos nie jest transkrybowany    | Sprawdź konfigurację dostawcy STT            | Skonfiguruj `channels.qqbot.stt` lub `tools.media.audio`.       |
| Wiadomości proaktywne nie docierają | Sprawdź wymagania interakcji platformy QQ    | QQ może blokować wiadomości inicjowane przez bota bez niedawnej interakcji. |

Pełne rozwiązywanie problemów: [/channels/qqbot#troubleshooting](/pl/channels/qqbot#troubleshooting)

## Matrix

### Sygnatury awarii Matrix

| Objaw                               | Najszybsza kontrola                  | Naprawa                                                                  |
| ----------------------------------- | ------------------------------------ | ------------------------------------------------------------------------ |
| Zalogowano, ale ignoruje wiadomości w pokoju | `openclaw channels status --probe`   | Sprawdź `groupPolicy`, listę dozwolonych pokoi i reguły wzmianek.        |
| DM nie są przetwarzane              | `openclaw pairing list matrix`       | Zatwierdź nadawcę lub dostosuj politykę DM.                              |
| Zaszyfrowane pokoje nie działają    | `openclaw matrix verify status`      | Zweryfikuj urządzenie ponownie, a następnie sprawdź `openclaw matrix verify backup status`. |
| Przywracanie kopii zapasowej oczekuje/jest uszkodzone | `openclaw matrix verify backup status` | Uruchom `openclaw matrix verify backup restore` lub uruchom ponownie z kluczem odzyskiwania. |
| Cross-signing/bootstrap wygląda nieprawidłowo | `openclaw matrix verify bootstrap`   | Napraw magazyn sekretów, cross-signing i stan kopii zapasowej w jednym przebiegu. |

Pełna konfiguracja i ustawienia: [Matrix](/pl/channels/matrix)
