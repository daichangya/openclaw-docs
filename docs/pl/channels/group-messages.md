---
read_when:
    - Zmiana reguł wiadomości grupowych lub wzmianek
summary: Zachowanie i konfiguracja obsługi wiadomości grupowych WhatsApp (`mentionPatterns` są współdzielone między powierzchniami)
title: Wiadomości grupowe
x-i18n:
    generated_at: "2026-04-25T13:41:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 740eee61d15a24b09b4b896613ff9e0235457708d9dcbe0c3b1d5e136cefb975
    source_path: channels/group-messages.md
    workflow: 15
---

Cel: pozwolić Clawdowi przebywać w grupach WhatsApp, wybudzać się tylko po wywołaniu i utrzymywać ten wątek oddzielnie od osobistej sesji DM.

Uwaga: `agents.list[].groupChat.mentionPatterns` jest teraz używane także przez Telegram/Discord/Slack/iMessage; ten dokument koncentruje się na zachowaniu specyficznym dla WhatsApp. W konfiguracjach z wieloma agentami ustaw `agents.list[].groupChat.mentionPatterns` dla każdego agenta (lub użyj `messages.groupChat.mentionPatterns` jako globalnego ustawienia awaryjnego).

## Bieżąca implementacja (2025-12-03)

- Tryby aktywacji: `mention` (domyślnie) lub `always`. `mention` wymaga wywołania (prawdziwe WhatsApp @-wzmianki przez `mentionedJids`, bezpieczne wzorce regex lub numer E.164 bota w dowolnym miejscu tekstu). `always` wybudza agenta przy każdej wiadomości, ale powinien on odpowiadać tylko wtedy, gdy może wnieść istotną wartość; w przeciwnym razie zwraca dokładny cichy token `NO_REPLY` / `no_reply`. Domyślne wartości można ustawić w konfiguracji (`channels.whatsapp.groups`) i nadpisać dla każdej grupy przez `/activation`. Gdy ustawione jest `channels.whatsapp.groups`, działa ono również jako allowlista grup (uwzględnij `"*"`, aby zezwolić na wszystkie).
- Zasady grup: `channels.whatsapp.groupPolicy` kontroluje, czy wiadomości grupowe są akceptowane (`open|disabled|allowlist`). `allowlist` używa `channels.whatsapp.groupAllowFrom` (ustawienie awaryjne: jawne `channels.whatsapp.allowFrom`). Wartość domyślna to `allowlist` (blokada do czasu dodania nadawców).
- Sesje per grupa: klucze sesji mają postać `agent:<agentId>:whatsapp:group:<jid>`, więc polecenia takie jak `/verbose on`, `/trace on` lub `/think high` (wysyłane jako samodzielne wiadomości) są ograniczone do tej grupy; stan osobistego DM pozostaje nietknięty. Heartbeat jest pomijany dla wątków grupowych.
- Wstrzykiwanie kontekstu: **tylko oczekujące** wiadomości grupowe (domyślnie 50), które _nie_ wywołały uruchomienia, są poprzedzane sekcją `[Chat messages since your last reply - for context]`, a wywołujący wiersz trafia pod `[Current message - respond to this]`. Wiadomości już obecne w sesji nie są wstrzykiwane ponownie.
- Ujawnianie nadawcy: każda partia grupowa kończy się teraz `[from: Sender Name (+E164)]`, aby Pi wiedział, kto mówi.
- Wiadomości efemeryczne/view-once: rozpakowujemy je przed wyodrębnieniem tekstu/wzmianek, więc wywołania w nich nadal uruchamiają agenta.
- Prompt systemowy grupy: przy pierwszej turze sesji grupowej (oraz zawsze, gdy `/activation` zmienia tryb) wstrzykujemy krótki opis do promptu systemowego, taki jak `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Jeśli metadane nie są dostępne, nadal informujemy agenta, że to czat grupowy.

## Przykład konfiguracji (WhatsApp)

Dodaj blok `groupChat` do `~/.openclaw/openclaw.json`, aby wywołania po nazwie wyświetlanej działały nawet wtedy, gdy WhatsApp usuwa wizualne `@` z treści wiadomości:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Uwagi:

- Wyrażenia regex są nieczułe na wielkość liter i używają tych samych zabezpieczeń safe-regex co inne powierzchnie regex w konfiguracji; nieprawidłowe wzorce i niebezpieczne zagnieżdżone powtórzenia są ignorowane.
- WhatsApp nadal wysyła kanoniczne wzmianki przez `mentionedJids`, gdy ktoś stuknie kontakt, więc awaryjne dopasowanie po numerze rzadko jest potrzebne, ale stanowi przydatne zabezpieczenie.

### Polecenie aktywacji (tylko właściciel)

Użyj polecenia czatu grupowego:

- `/activation mention`
- `/activation always`

Tylko numer właściciela (z `channels.whatsapp.allowFrom` lub własny numer E.164 bota, jeśli nie jest ustawiony) może to zmienić. Wyślij `/status` jako samodzielną wiadomość w grupie, aby zobaczyć bieżący tryb aktywacji.

## Jak używać

1. Dodaj swoje konto WhatsApp (to, na którym działa OpenClaw) do grupy.
2. Napisz `@openclaw …` (lub uwzględnij numer). Tylko nadawcy z allowlisty mogą go uruchomić, chyba że ustawisz `groupPolicy: "open"`.
3. Prompt agenta będzie zawierał ostatni kontekst grupy oraz końcowy znacznik `[from: …]`, aby mógł zwrócić się do właściwej osoby.
4. Dyrektywy na poziomie sesji (`/verbose on`, `/trace on`, `/think high`, `/new` lub `/reset`, `/compact`) dotyczą wyłącznie sesji tej grupy; wysyłaj je jako samodzielne wiadomości, aby zostały zarejestrowane. Twoja osobista sesja DM pozostaje niezależna.

## Testowanie / weryfikacja

- Ręczny smoke test:
  - Wyślij wywołanie `@openclaw` w grupie i potwierdź odpowiedź odnoszącą się do nazwy nadawcy.
  - Wyślij drugie wywołanie i sprawdź, czy blok historii został uwzględniony, a następnie wyczyszczony w następnej turze.
- Sprawdź logi Gateway (uruchom z `--verbose`), aby zobaczyć wpisy `inbound web message` pokazujące `from: <groupJid>` oraz sufiks `[from: …]`.

## Znane kwestie

- Heartbeat jest celowo pomijany dla grup, aby uniknąć hałaśliwych rozgłoszeń.
- Tłumienie echa używa połączonego ciągu partii; jeśli wyślesz dwa razy identyczny tekst bez wzmianek, odpowiedź zostanie wygenerowana tylko na pierwszy.
- Wpisy magazynu sesji będą widoczne jako `agent:<agentId>:whatsapp:group:<jid>` w magazynie sesji (`~/.openclaw/agents/<agentId>/sessions/sessions.json` domyślnie); brak wpisu oznacza jedynie, że grupa jeszcze nie wywołała uruchomienia.
- Wskaźniki pisania w grupach są zgodne z `agents.defaults.typingMode` (domyślnie: `message`, gdy nie ma wzmianki).

## Powiązane

- [Grupy](/pl/channels/groups)
- [Routing kanałów](/pl/channels/channel-routing)
- [Grupy rozgłoszeniowe](/pl/channels/broadcast-groups)
