---
read_when:
    - Wyjaśnianie, jak działa strumieniowanie lub chunkowanie na kanałach
    - Zmiana zachowania strumieniowania blokowego lub chunkowania kanału
    - Debugowanie zduplikowanych/wczesnych odpowiedzi blokowych lub strumieniowania podglądu kanału
summary: Zachowanie strumieniowania i chunkowania (odpowiedzi blokowe, strumieniowanie podglądu kanału, mapowanie trybów)
title: Strumieniowanie i chunkowanie
x-i18n:
    generated_at: "2026-04-25T13:45:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba308b79b12886f3a1bc36bc277e3df0e2b9c6018aa260b432ccea89a235819f
    source_path: concepts/streaming.md
    workflow: 15
---

OpenClaw ma dwie oddzielne warstwy strumieniowania:

- **Strumieniowanie blokowe (kanały):** emituje ukończone **bloki**, gdy asystent pisze. Są to zwykłe wiadomości kanałowe (nie delty tokenów).
- **Strumieniowanie podglądu (Telegram/Discord/Slack):** aktualizuje tymczasową **wiadomość podglądu** podczas generowania.

Obecnie **nie ma prawdziwego strumieniowania delt tokenów** do wiadomości kanałowych. Strumieniowanie podglądu jest oparte na wiadomościach (wysłanie + edycje/dopisania).

## Strumieniowanie blokowe (wiadomości kanałowe)

Strumieniowanie blokowe wysyła wynik asystenta w zgrubnych chunkach, gdy stają się dostępne.

```
Dane wyjściowe modelu
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emituje bloki wraz ze wzrostem bufora
       └─ (blockStreamingBreak=message_end)
            └─ chunker opróżnia przy message_end
                   └─ wysłanie kanałowe (odpowiedzi blokowe)
```

Legenda:

- `text_delta/events`: zdarzenia strumienia modelu (mogą być rzadkie dla modeli niestrumieniowych).
- `chunker`: `EmbeddedBlockChunker` stosujący dolne/górne granice + preferencję podziału.
- `channel send`: rzeczywiste wiadomości wychodzące (odpowiedzi blokowe).

**Elementy sterujące:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (domyślnie off).
- Nadpisania kanału: `*.blockStreaming` (oraz warianty per konto), aby wymusić `"on"`/`"off"` per kanał.
- `agents.defaults.blockStreamingBreak`: `"text_end"` lub `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (scala strumieniowane bloki przed wysłaniem).
- Sztywny limit kanału: `*.textChunkLimit` (np. `channels.whatsapp.textChunkLimit`).
- Tryb chunkowania kanału: `*.chunkMode` (`length` domyślnie, `newline` dzieli na pustych liniach (granice akapitów) przed chunkowaniem po długości).
- Miękki limit Discord: `channels.discord.maxLinesPerMessage` (domyślnie 17) dzieli wysokie odpowiedzi, aby uniknąć przycinania w UI.

**Semantyka granic:**

- `text_end`: strumieniuj bloki, gdy tylko chunker je wyemituje; opróżniaj przy każdym `text_end`.
- `message_end`: czekaj, aż wiadomość asystenta się zakończy, a następnie opróżnij zbuforowany wynik.

`message_end` nadal używa chunkera, jeśli zbuforowany tekst przekracza `maxChars`, więc może wyemitować wiele chunków na końcu.

### Dostarczanie multimediów przy strumieniowaniu blokowym

Dyrektywy `MEDIA:` są zwykłymi metadanymi dostarczania. Gdy strumieniowanie blokowe wyśle
wcześnie blok multimedialny, OpenClaw zapamiętuje to dostarczenie dla tej tury. Jeśli końcowy
ładunek asystenta powtarza ten sam URL medium, końcowe dostarczenie usuwa
duplikat medium zamiast wysyłać załącznik ponownie.

Dokładne duplikaty końcowych ładunków są tłumione. Jeśli końcowy ładunek dodaje
odrębny tekst wokół medium, które zostało już zastrumieniowane, OpenClaw nadal wysyła
nowy tekst, zachowując pojedyncze dostarczenie medium. Zapobiega to duplikowaniu notatek głosowych
lub plików na kanałach takich jak Telegram, gdy agent emituje `MEDIA:` podczas
strumieniowania, a provider uwzględnia je także w ukończonej odpowiedzi.

## Algorytm chunkowania (dolne/górne granice)

Chunkowanie blokowe jest realizowane przez `EmbeddedBlockChunker`:

- **Dolna granica:** nie emituj, dopóki bufor < `minChars` (chyba że wymuszone).
- **Górna granica:** preferuj podziały przed `maxChars`; jeśli wymuszone, dziel przy `maxChars`.
- **Preferencja podziału:** `paragraph` → `newline` → `sentence` → `whitespace` → twardy podział.
- **Ogrodzenia kodu:** nigdy nie dziel wewnątrz ogrodzeń; gdy wymuszone przy `maxChars`, zamknij i otwórz ponownie ogrodzenie, aby Markdown pozostał poprawny.

`maxChars` jest ograniczane do `textChunkLimit` kanału, więc nie można przekroczyć limitów per kanał.

## Scalanie (łączenie strumieniowanych bloków)

Gdy strumieniowanie blokowe jest włączone, OpenClaw może **scalać kolejne chunki bloków**
przed ich wysłaniem. Ogranicza to „spam pojedynczymi liniami”, a jednocześnie zapewnia
postępowe dane wyjściowe.

- Scalanie czeka na **przerwy bezczynności** (`idleMs`) przed opróżnieniem.
- Bufory są ograniczone przez `maxChars` i zostaną opróżnione po ich przekroczeniu.
- `minChars` zapobiega wysyłaniu drobnych fragmentów, dopóki nie zgromadzi się wystarczająco dużo tekstu
  (końcowe opróżnienie zawsze wysyła pozostały tekst).
- Łącznik wynika z `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spacja).
- Nadpisania kanału są dostępne przez `*.blockStreamingCoalesce` (w tym konfiguracje per konto).
- Domyślne `minChars` dla scalania jest podnoszone do 1500 dla Signal/Slack/Discord, chyba że zostanie nadpisane.

## Naturalne opóźnienia między blokami

Gdy strumieniowanie blokowe jest włączone, możesz dodać **losową pauzę** między
odpowiedziami blokowymi (po pierwszym bloku). Sprawia to, że odpowiedzi w wielu bąbelkach wydają się
bardziej naturalne.

- Konfiguracja: `agents.defaults.humanDelay` (nadpisanie per agent przez `agents.list[].humanDelay`).
- Tryby: `off` (domyślnie), `natural` (800–2500 ms), `custom` (`minMs`/`maxMs`).
- Dotyczy tylko **odpowiedzi blokowych**, nie końcowych odpowiedzi ani podsumowań narzędzi.

## „Strumieniuj chunki albo wszystko”

Mapuje się to na:

- **Strumieniuj chunki:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emituj na bieżąco). Kanały inne niż Telegram wymagają również `*.blockStreaming: true`.
- **Strumieniuj wszystko na końcu:** `blockStreamingBreak: "message_end"` (opróżnij raz, ewentualnie w wielu chunkach, jeśli bardzo długie).
- **Brak strumieniowania blokowego:** `blockStreamingDefault: "off"` (tylko końcowa odpowiedź).

**Uwaga dotycząca kanałów:** Strumieniowanie blokowe jest **wyłączone, dopóki**
`*.blockStreaming` nie zostanie jawnie ustawione na `true`. Kanały mogą strumieniować podgląd na żywo
(`channels.<channel>.streaming`) bez odpowiedzi blokowych.

Przypomnienie o lokalizacji konfiguracji: domyślne wartości `blockStreaming*` znajdują się pod
`agents.defaults`, a nie w głównej konfiguracji.

## Tryby strumieniowania podglądu

Kanoniczny klucz: `channels.<channel>.streaming`

Tryby:

- `off`: wyłącza strumieniowanie podglądu.
- `partial`: pojedynczy podgląd zastępowany najnowszym tekstem.
- `block`: aktualizacje podglądu w chunkach/dopisaniach.
- `progress`: podgląd postępu/statusu podczas generowania, końcowa odpowiedź po zakończeniu.

### Mapowanie kanałów

| Kanał      | `off` | `partial` | `block` | `progress`        |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | mapuje do `partial` |
| Discord    | ✅    | ✅        | ✅      | mapuje do `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

Tylko Slack:

- `channels.slack.streaming.nativeTransport` przełącza natywne wywołania API strumieniowania Slack, gdy `channels.slack.streaming.mode="partial"` (domyślnie: `true`).
- Natywne strumieniowanie Slack i status wątku asystenta Slack wymagają celu będącego wątkiem odpowiedzi; DM najwyższego poziomu nie pokazują takiego podglądu w stylu wątku.

Migracja starszych kluczy:

- Telegram: starsze wartości `streamMode` oraz skalarne/boolean `streaming` są wykrywane i migrowane przez ścieżki kompatybilności doctor/config do `streaming.mode`.
- Discord: `streamMode` + boolean `streaming` są automatycznie migrowane do enum `streaming`.
- Slack: `streamMode` jest automatycznie migrowane do `streaming.mode`; boolean `streaming` jest automatycznie migrowane do `streaming.mode` plus `streaming.nativeTransport`; starsze `nativeStreaming` jest automatycznie migrowane do `streaming.nativeTransport`.

### Zachowanie w czasie działania

Telegram:

- Używa aktualizacji podglądu `sendMessage` + `editMessageText` w DM oraz grupach/tematach.
- Strumieniowanie podglądu jest pomijane, gdy strumieniowanie blokowe Telegram jest jawnie włączone (aby uniknąć podwójnego strumieniowania).
- `/reasoning stream` może zapisywać reasoning do podglądu.

Discord:

- Używa wiadomości podglądu typu send + edit.
- Tryb `block` używa chunkowania szkicu (`draftChunk`).
- Strumieniowanie podglądu jest pomijane, gdy strumieniowanie blokowe Discord jest jawnie włączone.
- Końcowe ładunki multimediów, błędów i jawnych odpowiedzi anulują oczekujące podglądy bez opróżniania nowego szkicu, a następnie używają zwykłego dostarczenia.

Slack:

- `partial` może używać natywnego strumieniowania Slack (`chat.startStream`/`append`/`stop`), gdy jest dostępne.
- `block` używa podglądów szkicu w stylu dopisywania.
- `progress` używa tekstu podglądu statusu, a następnie końcowej odpowiedzi.
- Natywne strumieniowanie i strumieniowanie szkicu tłumią odpowiedzi blokowe dla tej tury, więc odpowiedź Slack jest strumieniowana tylko jedną ścieżką dostarczenia.
- Końcowe ładunki multimediów/błędów i końcowe ładunki postępu nie tworzą jednorazowych wiadomości szkicu; tylko końcowe ładunki tekstowe/blokowe, które mogą edytować podgląd, opróżniają oczekujący tekst szkicu.

Mattermost:

- Strumieniuje myślenie, aktywność narzędzi i częściowy tekst odpowiedzi do jednego szkicu posta podglądu, który jest finalizowany w miejscu, gdy końcową odpowiedź można bezpiecznie wysłać.
- Wraca do wysłania nowego końcowego posta, jeśli post podglądu został usunięty lub jest niedostępny w momencie finalizacji.
- Końcowe ładunki multimediów/błędów anulują oczekujące aktualizacje podglądu przed zwykłym dostarczeniem zamiast opróżniać tymczasowy post podglądu.

Matrix:

- Szkice podglądu są finalizowane w miejscu, gdy końcowy tekst może ponownie użyć zdarzenia podglądu.
- Końcowe ładunki tylko z mediami, błędami i niedopasowaniem celu odpowiedzi anulują oczekujące aktualizacje podglądu przed zwykłym dostarczeniem; już widoczny nieaktualny podgląd jest redagowany.

### Aktualizacje podglądu postępu narzędzi

Strumieniowanie podglądu może też obejmować aktualizacje **postępu narzędzi** — krótkie linie statusu, takie jak „searching the web”, „reading file” lub „calling tool”, które pojawiają się w tej samej wiadomości podglądu podczas działania narzędzi, przed końcową odpowiedzią. Dzięki temu tury narzędzi wieloetapowych wyglądają wizualnie na aktywne, a nie milczące między pierwszym podglądem myślenia a końcową odpowiedzią.

Obsługiwane powierzchnie:

- **Discord**, **Slack** i **Telegram** domyślnie strumieniują postęp narzędzi do edycji podglądu na żywo, gdy strumieniowanie podglądu jest aktywne.
- Telegram ma włączone aktualizacje podglądu postępu narzędzi od `v2026.4.22`; pozostawienie ich włączonych zachowuje to wydane zachowanie.
- **Mattermost** już scala aktywność narzędzi w swoim pojedynczym poście szkicu podglądu (zobacz wyżej).
- Edycje postępu narzędzi podążają za aktywnym trybem strumieniowania podglądu; są pomijane, gdy strumieniowanie podglądu ma wartość `off` lub gdy strumieniowanie blokowe przejęło wiadomość.
- Aby zachować strumieniowanie podglądu, ale ukryć linie postępu narzędzi, ustaw `streaming.preview.toolProgress` na `false` dla tego kanału. Aby całkowicie wyłączyć edycje podglądu, ustaw `streaming.mode` na `off`.

Przykład:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": false
        }
      }
    }
  }
}
```

## Powiązane

- [Wiadomości](/pl/concepts/messages) — cykl życia wiadomości i dostarczanie
- [Retry](/pl/concepts/retry) — zachowanie ponawiania przy niepowodzeniu dostarczenia
- [Kanały](/pl/channels) — obsługa strumieniowania per kanał
