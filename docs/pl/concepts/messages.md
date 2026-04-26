---
read_when:
    - Wyjaśnienie, jak wiadomości przychodzące stają się odpowiedziami
    - Wyjaśnienie sesji, trybów kolejkowania lub zachowania streamingu
    - Dokumentowanie widoczności rozumowania i wpływu na użycie
summary: Przepływ wiadomości, sesje, kolejkowanie i widoczność rozumowania
title: Wiadomości
x-i18n:
    generated_at: "2026-04-26T11:27:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b77d344ed0cab80566582f43127c91ec987e892eeed788aeb9988b377a96e06
    source_path: concepts/messages.md
    workflow: 15
---

Ta strona łączy sposób, w jaki OpenClaw obsługuje wiadomości przychodzące, sesje, kolejkowanie,
streaming i widoczność rozumowania.

## Przepływ wiadomości (wysoki poziom)

```
Wiadomość przychodząca
  -> routing/bindings -> klucz sesji
  -> kolejka (jeśli uruchomienie jest aktywne)
  -> uruchomienie agenta (streaming + narzędzia)
  -> odpowiedzi wychodzące (limity kanału + chunking)
```

Kluczowe ustawienia znajdują się w konfiguracji:

- `messages.*` dla prefiksów, kolejkowania i zachowania grup.
- `agents.defaults.*` dla domyślnych ustawień streamingu blokowego i chunkingu.
- Nadpisania kanałów (`channels.whatsapp.*`, `channels.telegram.*` itd.) dla limitów i przełączników streamingu.

Pełny schemat znajdziesz w [Konfiguracji](/pl/gateway/configuration).

## Deduplikacja wejścia

Kanały mogą ponownie dostarczać tę samą wiadomość po ponownych połączeniach. OpenClaw utrzymuje
krótkotrwałą pamięć podręczną kluczowaną przez channel/account/peer/session/message id, aby zduplikowane
dostarczenia nie wyzwalały kolejnego uruchomienia agenta.

## Debouncing wiadomości przychodzących

Szybkie kolejne wiadomości od **tego samego nadawcy** mogą być grupowane w jedną
turę agenta przez `messages.inbound`. Debouncing ma zakres per kanał + konwersacja
i używa najnowszej wiadomości do wątkowania odpowiedzi/ID.

Konfiguracja (globalna wartość domyślna + nadpisania per kanał):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

Uwagi:

- Debounce dotyczy wiadomości **tylko tekstowych**; multimedia/załączniki są opróżniane natychmiast.
- Polecenia sterujące omijają debouncing, aby pozostały samodzielne — **z wyjątkiem** sytuacji, gdy kanał jawnie włącza koalescencję DM-ów tego samego nadawcy (np. [BlueBubbles `coalesceSameSenderDms`](/pl/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), gdzie polecenia DM czekają w oknie debounce, aby payload wysłany w częściach mógł dołączyć do tej samej tury agenta.

## Sesje i urządzenia

Właścicielem sesji jest gateway, a nie klienci.

- Czaty bezpośrednie zapadają się do klucza sesji głównej agenta.
- Grupy/kanały mają własne klucze sesji.
- Magazyn sesji i transkrypty znajdują się na hoście gateway.

Wiele urządzeń/kanałów może mapować się do tej samej sesji, ale historia nie jest w pełni
synchronizowana z powrotem do każdego klienta. Zalecenie: używaj jednego głównego urządzenia do długich
rozmów, aby uniknąć rozbieżnego kontekstu. Control UI i TUI zawsze pokazują transkrypt sesji oparty na
gateway, więc są źródłem prawdy.

Szczegóły: [Zarządzanie sesjami](/pl/concepts/session).

## Metadane wyników narzędzi

`content` wyniku narzędzia to wynik widoczny dla modelu. `details` wyniku narzędzia to
metadane runtime do renderowania w UI, diagnostyki, dostarczania multimediów i Pluginów.

OpenClaw utrzymuje to rozgraniczenie w sposób jawny:

- `toolResult.details` jest usuwane przed odtworzeniem dostawcy i wejściem Compaction.
- Trwałe transkrypty sesji zachowują tylko ograniczone `details`; zbyt duże metadane
  są zastępowane zwartym podsumowaniem oznaczonym `persistedDetailsTruncated: true`.
- Pluginy i narzędzia powinny umieszczać tekst, który model musi przeczytać, w `content`, a nie tylko
  w `details`.

## Treści przychodzące i kontekst historii

OpenClaw rozdziela **treść promptu** od **treści polecenia**:

- `Body`: tekst promptu wysyłany do agenta. Może zawierać obwiednie kanału i
  opcjonalne opakowania historii.
- `CommandBody`: surowy tekst użytkownika do parsowania dyrektyw/poleceń.
- `RawBody`: starszy alias `CommandBody` (zachowany dla kompatybilności).

Gdy kanał dostarcza historię, używa wspólnego opakowania:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Dla **czatów niebezpośrednich** (grupy/kanały/pokoje) **treść bieżącej wiadomości** jest poprzedzana
etykietą nadawcy (w tym samym stylu używanym dla wpisów historii). Dzięki temu wiadomości w czasie rzeczywistym oraz wiadomości z kolejki/historii
są spójne w promptcie agenta.

Bufory historii są **tylko oczekujące**: zawierają wiadomości grupowe, które _nie_
wywołały uruchomienia (na przykład wiadomości bramkowane wzmianką), i **wykluczają** wiadomości
już obecne w transkrypcie sesji.

Usuwanie dyrektyw dotyczy tylko sekcji **bieżącej wiadomości**, aby historia
pozostała nienaruszona. Kanały, które opakowują historię, powinny ustawiać `CommandBody` (lub
`RawBody`) na oryginalny tekst wiadomości i zachowywać `Body` jako połączony prompt.
Bufory historii są konfigurowalne przez `messages.groupChat.historyLimit` (globalna
wartość domyślna) oraz nadpisania per kanał, takie jak `channels.slack.historyLimit` lub
`channels.telegram.accounts.<id>.historyLimit` (ustaw `0`, aby wyłączyć).

## Kolejkowanie i follow-upy

Jeśli uruchomienie jest już aktywne, wiadomości przychodzące mogą być kolejkowane, kierowane do
bieżącego uruchomienia lub zbierane do tury follow-up.

- Skonfiguruj przez `messages.queue` (oraz `messages.queue.byChannel`).
- Tryby: `interrupt`, `steer`, `followup`, `collect` oraz warianty backlog.

Szczegóły: [Kolejkowanie](/pl/concepts/queue).

## Streaming, chunking i batching

Streaming blokowy wysyła częściowe odpowiedzi, gdy model generuje bloki tekstu.
Chunking respektuje limity tekstowe kanału i unika dzielenia ogrodzonych bloków kodu.

Kluczowe ustawienia:

- `agents.defaults.blockStreamingDefault` (`on|off`, domyślnie off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching oparty na bezczynności)
- `agents.defaults.humanDelay` (pauza podobna do ludzkiej między odpowiedziami blokowymi)
- Nadpisania kanałów: `*.blockStreaming` i `*.blockStreamingCoalesce` (kanały inne niż Telegram wymagają jawnego `*.blockStreaming: true`)

Szczegóły: [Streaming + chunking](/pl/concepts/streaming).

## Widoczność rozumowania i tokeny

OpenClaw może ujawniać lub ukrywać rozumowanie modelu:

- `/reasoning on|off|stream` kontroluje widoczność.
- Treść rozumowania nadal wlicza się do użycia tokenów, gdy jest generowana przez model.
- Telegram obsługuje streaming rozumowania do dymku wersji roboczej.

Szczegóły: [Dyrektywy Thinking + reasoning](/pl/tools/thinking) i [Użycie tokenów](/pl/reference/token-use).

## Prefiksy, wątkowanie i odpowiedzi

Formatowanie wiadomości wychodzących jest scentralizowane w `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` i `channels.<channel>.accounts.<id>.responsePrefix` (kaskada prefiksów wychodzących), plus `channels.whatsapp.messagePrefix` (prefiks wejściowy WhatsApp)
- Wątkowanie odpowiedzi przez `replyToMode` i wartości domyślne per kanał

Szczegóły: [Konfiguracja](/pl/gateway/config-agents#messages) i dokumentacja kanałów.

## Ciche odpowiedzi

Dokładny token ciszy `NO_REPLY` / `no_reply` oznacza „nie dostarczaj odpowiedzi widocznej dla użytkownika”.
Gdy tura ma także oczekujące multimedia narzędzia, takie jak wygenerowane audio TTS, OpenClaw
usuwa cichy tekst, ale nadal dostarcza załącznik multimedialny.
OpenClaw rozstrzyga to zachowanie według typu konwersacji:

- Konwersacje bezpośrednie domyślnie nie zezwalają na ciszę i przepisują samą cichą
  odpowiedź na krótką widoczną odpowiedź awaryjną.
- Grupy/kanały domyślnie zezwalają na ciszę.
- Wewnętrzna orkiestracja domyślnie zezwala na ciszę.

OpenClaw używa także cichych odpowiedzi dla wewnętrznych błędów runnera, które zdarzają się
przed jakąkolwiek odpowiedzią asystenta na czatach niebezpośrednich, dzięki czemu grupy/kanały nie widzą
standardowego tekstu błędu gateway. Czaty bezpośrednie domyślnie pokazują zwięzły tekst błędu;
surowe szczegóły runnera są pokazywane tylko wtedy, gdy `/verbose` ma wartość `on` lub `full`.

Wartości domyślne znajdują się w `agents.defaults.silentReply` oraz
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` i
`surfaces.<id>.silentReplyRewrite` mogą je nadpisywać per powierzchnia.

Gdy sesja nadrzędna ma jedno lub więcej oczekujących uruchomień utworzonych subagentów, same
ciche odpowiedzi są odrzucane na wszystkich powierzchniach zamiast przepisywania, tak aby sesja
nadrzędna pozostawała cicha do momentu, gdy zdarzenie zakończenia potomka dostarczy rzeczywistą odpowiedź.

## Powiązane

- [Streaming](/pl/concepts/streaming) — dostarczanie wiadomości w czasie rzeczywistym
- [Retry](/pl/concepts/retry) — zachowanie ponawiania dostarczania wiadomości
- [Queue](/pl/concepts/queue) — kolejka przetwarzania wiadomości
- [Kanały](/pl/channels) — integracje z platformami wiadomości
