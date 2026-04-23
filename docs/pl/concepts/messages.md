---
read_when:
    - Wyjaśnienie, jak wiadomości przychodzące stają się odpowiedziami
    - Wyjaśnianie sesji, trybów kolejkowania lub zachowania strumieniowania
    - Dokumentowanie widoczności rozumowania i wpływu na użycie
summary: Przepływ wiadomości, sesje, kolejkowanie i widoczność rozumowania
title: Wiadomości
x-i18n:
    generated_at: "2026-04-23T09:59:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4490d87835f44f703b45b29ad69878fec552caf81f4bd07d29614f71ee15cfb
    source_path: concepts/messages.md
    workflow: 15
---

# Wiadomości

Ta strona łączy sposób, w jaki OpenClaw obsługuje wiadomości przychodzące, sesje, kolejkowanie,
strumieniowanie i widoczność rozumowania.

## Przepływ wiadomości (wysoki poziom)

```
Wiadomość przychodząca
  -> routing/bindings -> klucz sesji
  -> kolejka (jeśli uruchomienie jest aktywne)
  -> uruchomienie agenta (strumieniowanie + narzędzia)
  -> odpowiedzi wychodzące (limity kanału + dzielenie)
```

Kluczowe ustawienia znajdują się w konfiguracji:

- `messages.*` dla prefiksów, kolejkowania i zachowania grup.
- `agents.defaults.*` dla domyślnych ustawień strumieniowania blokowego i dzielenia.
- Nadpisania kanałów (`channels.whatsapp.*`, `channels.telegram.*` itd.) dla limitów i przełączników strumieniowania.

Pełny schemat znajdziesz w [Konfiguracji](/pl/gateway/configuration).

## Deduplikacja wiadomości przychodzących

Kanały mogą ponownie dostarczyć tę samą wiadomość po ponownych połączeniach. OpenClaw utrzymuje
krótkotrwały cache oparty na channel/account/peer/session/message id, aby zduplikowane
dostarczenia nie uruchamiały kolejnego uruchomienia agenta.

## Debouncing wiadomości przychodzących

Szybkie kolejne wiadomości od **tego samego nadawcy** mogą zostać zgrupowane w jedną
turę agenta przez `messages.inbound`. Debouncing jest ograniczony do channel + conversation
i używa najnowszej wiadomości do wątkowania odpowiedzi / identyfikatorów.

Konfiguracja (domyślna globalna + nadpisania na kanał):

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

- Debounce dotyczy wiadomości **tylko tekstowych**; media / załączniki opróżniają kolejkę natychmiast.
- Polecenia sterujące omijają debouncing, aby pozostały samodzielne — **z wyjątkiem** sytuacji, gdy kanał jawnie włącza scalanie DM od tego samego nadawcy (np. [BlueBubbles `coalesceSameSenderDms`](/pl/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), gdzie polecenia DM czekają w oknie debounce, aby ładunek wysłany w częściach mógł dołączyć do tej samej tury agenta.

## Sesje i urządzenia

Sesje należą do Gateway, a nie do klientów.

- Czaty bezpośrednie są zwijane do klucza głównej sesji agenta.
- Grupy / kanały dostają własne klucze sesji.
- Magazyn sesji i transkrypcje znajdują się na hoście Gateway.

Wiele urządzeń / kanałów może mapować się do tej samej sesji, ale historia nie jest w pełni
synchronizowana z powrotem do każdego klienta. Zalecenie: używaj jednego głównego urządzenia dla długich
rozmów, aby uniknąć rozbieżnego kontekstu. UI Control i TUI zawsze pokazują
transkrypcję sesji opartą na Gateway, więc są źródłem prawdy.

Szczegóły: [Zarządzanie sesjami](/pl/concepts/session).

## Treści przychodzące i kontekst historii

OpenClaw rozdziela **treść promptu** od **treści polecenia**:

- `Body`: tekst promptu wysyłany do agenta. Może zawierać koperty kanału i
  opcjonalne opakowania historii.
- `CommandBody`: surowy tekst użytkownika do parsowania dyrektyw / poleceń.
- `RawBody`: starszy alias dla `CommandBody` (zachowany dla zgodności).

Gdy kanał dostarcza historię, używa współdzielonego opakowania:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Dla **czatów innych niż bezpośrednie** (grupy / kanały / pokoje) **treść bieżącej wiadomości** jest poprzedzana
etykietą nadawcy (ten sam styl używany dla wpisów historii). Dzięki temu wiadomości w czasie rzeczywistym i kolejce / historii
są spójne w prompcie agenta.

Bufory historii są **tylko oczekujące**: obejmują wiadomości grupowe, które _nie_
uruchomiły runu (na przykład wiadomości objęte bramkowaniem wzmianką) i **wykluczają** wiadomości
już obecne w transkrypcji sesji.

Usuwanie dyrektyw dotyczy tylko sekcji **bieżącej wiadomości**, aby historia
pozostała nienaruszona. Kanały, które opakowują historię, powinny ustawiać `CommandBody` (lub
`RawBody`) na oryginalny tekst wiadomości i zachowywać `Body` jako połączony prompt.
Bufory historii są konfigurowalne przez `messages.groupChat.historyLimit` (domyślna
wartość globalna) oraz nadpisania per kanał, takie jak `channels.slack.historyLimit` lub
`channels.telegram.accounts.<id>.historyLimit` (ustaw `0`, aby wyłączyć).

## Kolejkowanie i followupy

Jeśli uruchomienie jest już aktywne, wiadomości przychodzące mogą zostać umieszczone w kolejce, skierowane do
bieżącego uruchomienia lub zebrane do tury followup.

- Konfiguracja przez `messages.queue` (i `messages.queue.byChannel`).
- Tryby: `interrupt`, `steer`, `followup`, `collect`, plus warianty backlog.

Szczegóły: [Kolejkowanie](/pl/concepts/queue).

## Strumieniowanie, dzielenie i grupowanie

Strumieniowanie blokowe wysyła częściowe odpowiedzi, gdy model produkuje bloki tekstu.
Dzielenie respektuje limity tekstu kanału i unika rozdzielania bloków kodu fenced.

Kluczowe ustawienia:

- `agents.defaults.blockStreamingDefault` (`on|off`, domyślnie off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (grupowanie oparte na bezczynności)
- `agents.defaults.humanDelay` (pauza przypominająca człowieka między odpowiedziami blokowymi)
- Nadpisania kanałów: `*.blockStreaming` i `*.blockStreamingCoalesce` (kanały inne niż Telegram wymagają jawnego `*.blockStreaming: true`)

Szczegóły: [Strumieniowanie + dzielenie](/pl/concepts/streaming).

## Widoczność rozumowania i tokeny

OpenClaw może ujawniać lub ukrywać rozumowanie modelu:

- `/reasoning on|off|stream` kontroluje widoczność.
- Treść rozumowania nadal wlicza się do użycia tokenów, jeśli została wygenerowana przez model.
- Telegram obsługuje strumieniowanie rozumowania do dymka wersji roboczej.

Szczegóły: [Thinking + dyrektywy rozumowania](/pl/tools/thinking) i [Użycie tokenów](/pl/reference/token-use).

## Prefiksy, wątkowanie i odpowiedzi

Formatowanie wiadomości wychodzących jest scentralizowane w `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` oraz `channels.<channel>.accounts.<id>.responsePrefix` (kaskada prefiksów wychodzących), plus `channels.whatsapp.messagePrefix` (prefiks przychodzący WhatsApp)
- Wątkowanie odpowiedzi przez `replyToMode` i ustawienia domyślne per kanał

Szczegóły: [Konfiguracja](/pl/gateway/configuration-reference#messages) i dokumentacja kanałów.

## Ciche odpowiedzi

Dokładny cichy token `NO_REPLY` / `no_reply` oznacza „nie dostarczaj odpowiedzi widocznej dla użytkownika”.
OpenClaw rozstrzyga to zachowanie według typu rozmowy:

- Rozmowy bezpośrednie domyślnie nie dopuszczają ciszy i przepisują czystą
  cichą odpowiedź na krótkie widoczne zachowanie awaryjne.
- Grupy / kanały domyślnie dopuszczają ciszę.
- Wewnętrzna orkiestracja domyślnie dopuszcza ciszę.

Ustawienia domyślne znajdują się w `agents.defaults.silentReply` oraz
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` i
`surfaces.<id>.silentReplyRewrite` mogą je nadpisywać per surface.

Gdy sesja nadrzędna ma jedno lub więcej oczekujących uruchomień utworzonych subagentów,
czyste ciche odpowiedzi są odrzucane na wszystkich surfaces zamiast przepisywane, tak aby
sesja nadrzędna pozostała cicha, dopóki zdarzenie zakończenia potomka nie dostarczy właściwej odpowiedzi.

## Powiązane

- [Strumieniowanie](/pl/concepts/streaming) — dostarczanie wiadomości w czasie rzeczywistym
- [Retry](/pl/concepts/retry) — zachowanie ponawiania dostarczania wiadomości
- [Kolejka](/pl/concepts/queue) — kolejka przetwarzania wiadomości
- [Kanały](/pl/channels) — integracje z platformami komunikacyjnymi
