---
read_when:
    - Dostosowywanie parsowania lub ustawień domyślnych dyrektyw myślenia, trybu szybkiego albo verbose
summary: Składnia dyrektyw dla `/think`, `/fast`, `/verbose`, `/trace` i widoczności rozumowania
title: Poziomy myślenia
x-i18n:
    generated_at: "2026-04-23T10:10:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66033bb9272c9b9ea8fc85dc91e33e95ce4c469c56a8cd10c19632a5aa8a2338
    source_path: tools/thinking.md
    workflow: 15
---

# Poziomy myślenia (dyrektywy `/think`)

## Co to robi

- Dyrektywa inline w dowolnej przychodzącej treści: `/t <level>`, `/think:<level>` lub `/thinking <level>`.
- Poziomy (aliasy): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „think”
  - low → „think hard”
  - medium → „think harder”
  - high → „ultrathink” (maksymalny budżet)
  - xhigh → „ultrathink+” (wysiłek GPT-5.2 + modeli Codex oraz Anthropic Claude Opus 4.7)
  - adaptive → zarządzane przez dostawcę myślenie adaptacyjne (obsługiwane dla Claude 4.6 na Anthropic/Bedrock oraz Anthropic Claude Opus 4.7)
  - max → maksymalne rozumowanie dostawcy (obecnie Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` i `extra_high` mapują się do `xhigh`.
  - `highest` mapuje się do `high`.
- Uwagi dotyczące dostawców:
  - Menu i wybieraki myślenia są oparte na profilach dostawców. Pluginy dostawców deklarują dokładny zestaw poziomów dla wybranego modelu, w tym etykiety takie jak binarne `on`.
  - `adaptive`, `xhigh` i `max` są ogłaszane tylko dla profili dostawca/model, które je obsługują. Wpisane dyrektywy z nieobsługiwanymi poziomami są odrzucane wraz z poprawnymi opcjami dla tego modelu.
  - Istniejące zapisane nieobsługiwane poziomy są mapowane ponownie według rangi profilu dostawcy. `adaptive` wraca do `medium` na modelach bez trybu adaptacyjnego, natomiast `xhigh` i `max` wracają do najwyższego obsługiwanego poziomu innego niż `off` dla wybranego modelu.
  - Modele Anthropic Claude 4.6 domyślnie używają `adaptive`, gdy nie ustawiono jawnego poziomu myślenia.
  - Anthropic Claude Opus 4.7 nie ma domyślnie adaptacyjnego myślenia. Domyślny wysiłek API pozostaje własnością dostawcy, chyba że jawnie ustawisz poziom myślenia.
  - Anthropic Claude Opus 4.7 mapuje `/think xhigh` na adaptacyjne myślenie plus `output_config.effort: "xhigh"`, ponieważ `/think` jest dyrektywą myślenia, a `xhigh` jest ustawieniem wysiłku Opus 4.7.
  - Anthropic Claude Opus 4.7 udostępnia także `/think max`; mapuje się ono na tę samą ścieżkę maksymalnego wysiłku należącą do dostawcy.
  - Modele OpenAI GPT mapują `/think` przez obsługę wysiłku Responses API specyficzną dla modelu. `/think off` wysyła `reasoning.effort: "none"` tylko wtedy, gdy model docelowy to obsługuje; w przeciwnym razie OpenClaw pomija wyłączony payload rozumowania zamiast wysyłać nieobsługiwaną wartość.
  - MiniMax (`minimax/*`) na ścieżce strumieniowej zgodnej z Anthropic domyślnie używa `thinking: { type: "disabled" }`, chyba że jawnie ustawisz myślenie w parametrach modelu lub żądania. Zapobiega to wyciekającym deltowym `reasoning_content` z nienatywnego formatu strumienia Anthropic w MiniMax.
  - Z.AI (`zai/*`) obsługuje tylko binarne myślenie (`on`/`off`). Każdy poziom inny niż `off` jest traktowany jako `on` (mapowany do `low`).
  - Moonshot (`moonshot/*`) mapuje `/think off` na `thinking: { type: "disabled" }`, a każdy poziom inny niż `off` na `thinking: { type: "enabled" }`. Gdy myślenie jest włączone, Moonshot akceptuje tylko `tool_choice` `auto|none`; OpenClaw normalizuje niezgodne wartości do `auto`.

## Kolejność rozwiązywania

1. Dyrektywa inline w wiadomości (dotyczy tylko tej wiadomości).
2. Nadpisanie sesji (ustawiane przez wysłanie wiadomości zawierającej wyłącznie dyrektywę).
3. Domyślne ustawienie per agent (`agents.list[].thinkingDefault` w konfiguracji).
4. Globalne ustawienie domyślne (`agents.defaults.thinkingDefault` w konfiguracji).
5. Fallback: domyślne ustawienie zadeklarowane przez dostawcę, gdy jest dostępne, `low` dla innych modeli z katalogu oznaczonych jako obsługujące rozumowanie, w przeciwnym razie `off`.

## Ustawianie domyślnego poziomu dla sesji

- Wyślij wiadomość zawierającą **tylko** dyrektywę (dozwolone białe znaki), np. `/think:medium` lub `/t high`.
- To ustawienie zostaje dla bieżącej sesji (domyślnie per nadawca); jest czyszczone przez `/think:off` albo reset bezczynności sesji.
- Wysyłana jest odpowiedź potwierdzająca (`Thinking level set to high.` / `Thinking disabled.`). Jeśli poziom jest nieprawidłowy (np. `/thinking big`), polecenie zostaje odrzucone z podpowiedzią, a stan sesji pozostaje bez zmian.
- Wyślij `/think` (lub `/think:`) bez argumentu, aby zobaczyć bieżący poziom myślenia.

## Zastosowanie przez agenta

- **Osadzony Pi**: rozwiązany poziom jest przekazywany do runtime osadzonego agenta Pi działającego w procesie.

## Tryb szybki (/fast)

- Poziomy: `on|off`.
- Wiadomość zawierająca tylko dyrektywę przełącza nadpisanie trybu szybkiego dla sesji i odpowiada `Fast mode enabled.` / `Fast mode disabled.`.
- Wyślij `/fast` (lub `/fast status`) bez trybu, aby zobaczyć bieżący skuteczny stan trybu szybkiego.
- OpenClaw rozwiązuje tryb szybki w tej kolejności:
  1. Inline/tylko-dyrektywa `/fast on|off`
  2. Nadpisanie sesji
  3. Domyślne ustawienie per agent (`agents.list[].fastModeDefault`)
  4. Konfiguracja per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Dla `openai/*` tryb szybki mapuje się na przetwarzanie priorytetowe OpenAI przez wysyłanie `service_tier=priority` w obsługiwanych żądaniach Responses.
- Dla `openai-codex/*` tryb szybki wysyła tę samą flagę `service_tier=priority` w Codex Responses. OpenClaw zachowuje jeden współdzielony przełącznik `/fast` dla obu ścieżek uwierzytelniania.
- Dla bezpośrednich publicznych żądań `anthropic/*`, w tym ruchu uwierzytelnionego przez OAuth wysyłanego do `api.anthropic.com`, tryb szybki mapuje się na poziomy usług Anthropic: `/fast on` ustawia `service_tier=auto`, `/fast off` ustawia `service_tier=standard_only`.
- Dla `minimax/*` na ścieżce zgodnej z Anthropic `/fast on` (lub `params.fastMode: true`) przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.
- Jawne parametry modelu Anthropic `serviceTier` / `service_tier` nadpisują domyślne zachowanie trybu szybkiego, gdy ustawiono oba. OpenClaw nadal pomija wstrzykiwanie poziomu usługi Anthropic dla nieanthropicowych proxy `baseUrl`.
- `/status` pokazuje `Fast` tylko wtedy, gdy tryb szybki jest włączony.

## Dyrektywy verbose (`/verbose` lub `/v`)

- Poziomy: `on` (minimalny) | `full` | `off` (domyślnie).
- Wiadomość zawierająca tylko dyrektywę przełącza verbose sesji i odpowiada `Verbose logging enabled.` / `Verbose logging disabled.`; nieprawidłowe poziomy zwracają podpowiedź bez zmiany stanu.
- `/verbose off` zapisuje jawne nadpisanie sesji; wyczyść je przez interfejs Sessions, wybierając `inherit`.
- Dyrektywa inline wpływa tylko na tę wiadomość; w pozostałych przypadkach stosowane są domyślne ustawienia sesji/globalne.
- Wyślij `/verbose` (lub `/verbose:`) bez argumentu, aby zobaczyć bieżący poziom verbose.
- Gdy verbose jest włączone, agenci emitujący ustrukturyzowane wyniki narzędzi (Pi, inni agenci JSON) wysyłają każde wywołanie narzędzia z powrotem jako osobną wiadomość zawierającą tylko metadane, z prefiksem `<emoji> <tool-name>: <arg>`, gdy jest dostępny (ścieżka/polecenie). Te podsumowania narzędzi są wysyłane natychmiast po rozpoczęciu każdego narzędzia (osobne dymki), a nie jako delty strumieniowe.
- Podsumowania błędów narzędzi pozostają widoczne w zwykłym trybie, ale surowe sufiksy szczegółów błędów są ukrywane, chyba że verbose ma wartość `on` lub `full`.
- Gdy verbose ma wartość `full`, wyniki narzędzi są również przekazywane po zakończeniu (osobny dymek, obcięty do bezpiecznej długości). Jeśli przełączysz `/verbose on|full|off` podczas aktywnego przebiegu, kolejne dymki narzędzi zastosują nowe ustawienie.

## Dyrektywy śledzenia Pluginów (`/trace`)

- Poziomy: `on` | `off` (domyślnie).
- Wiadomość zawierająca tylko dyrektywę przełącza wyjście śledzenia Pluginów dla sesji i odpowiada `Plugin trace enabled.` / `Plugin trace disabled.`.
- Dyrektywa inline wpływa tylko na tę wiadomość; w pozostałych przypadkach stosowane są domyślne ustawienia sesji/globalne.
- Wyślij `/trace` (lub `/trace:`) bez argumentu, aby zobaczyć bieżący poziom śledzenia.
- `/trace` jest węższe niż `/verbose`: pokazuje tylko linie trace/debug należące do Pluginów, takie jak podsumowania debug Active Memory.
- Linie trace mogą pojawiać się w `/status` oraz jako dodatkowa wiadomość diagnostyczna po zwykłej odpowiedzi asystenta.

## Widoczność rozumowania (`/reasoning`)

- Poziomy: `on|off|stream`.
- Wiadomość zawierająca tylko dyrektywę przełącza, czy bloki myślenia są pokazywane w odpowiedziach.
- Gdy włączone, rozumowanie jest wysyłane jako **osobna wiadomość** z prefiksem `Reasoning:`.
- `stream` (tylko Telegram): strumieniuje rozumowanie do roboczego dymku Telegram podczas generowania odpowiedzi, a następnie wysyła końcową odpowiedź bez rozumowania.
- Alias: `/reason`.
- Wyślij `/reasoning` (lub `/reasoning:`) bez argumentu, aby zobaczyć bieżący poziom rozumowania.
- Kolejność rozwiązywania: dyrektywa inline, potem nadpisanie sesji, potem domyślne ustawienie per agent (`agents.list[].reasoningDefault`), a następnie fallback (`off`).

## Powiązane

- Dokumentacja trybu podwyższonego znajduje się w [Elevated mode](/pl/tools/elevated).

## Heartbeat

- Treść sondy Heartbeat to skonfigurowany prompt heartbeat (domyślnie: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Dyrektywy inline w wiadomości heartbeat działają jak zwykle (ale unikaj zmiany domyślnych ustawień sesji z heartbeatów).
- Dostarczanie Heartbeat domyślnie obejmuje tylko końcowy payload. Aby także wysyłać osobną wiadomość `Reasoning:` (gdy jest dostępna), ustaw `agents.defaults.heartbeat.includeReasoning: true` lub per agent `agents.list[].heartbeat.includeReasoning: true`.

## Web chat UI

- Selektor myślenia w czacie web odzwierciedla zapisany poziom sesji z magazynu/konfiguracji sesji przychodzącej podczas ładowania strony.
- Wybranie innego poziomu natychmiast zapisuje nadpisanie sesji przez `sessions.patch`; nie czeka na następne wysłanie i nie jest jednorazowym nadpisaniem `thinkingOnce`.
- Pierwsza opcja to zawsze `Default (<resolved level>)`, gdzie rozwiązana wartość domyślna pochodzi z profilu myślenia dostawcy aktywnego modelu sesji.
- Wybierak używa `thinkingOptions` zwracanego przez wiersz sesji gateway. UI przeglądarki nie utrzymuje własnej listy regexów dostawców; Pluginy odpowiadają za zestawy poziomów specyficzne dla modeli.
- `/think:<level>` nadal działa i aktualizuje ten sam zapisany poziom sesji, więc dyrektywy czatu i wybierak pozostają zsynchronizowane.

## Profile dostawców

- Pluginy dostawców mogą udostępniać `resolveThinkingProfile(ctx)`, aby zdefiniować poziomy i domyślne ustawienie obsługiwane przez model.
- Każdy poziom profilu ma zapisany kanoniczny `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` lub `max`) i może zawierać wyświetlaną `label`. Dostawcy binarni używają `{ id: "low", label: "on" }`.
- Opublikowane starsze hooki (`supportsXHighThinking`, `isBinaryThinking` i `resolveDefaultThinkingLevel`) pozostają adapterami zgodności, ale nowe niestandardowe zestawy poziomów powinny używać `resolveThinkingProfile`.
- Wiersze Gateway udostępniają `thinkingOptions` i `thinkingDefault`, dzięki czemu klienci ACP/chat renderują ten sam profil, którego używa walidacja runtime.
