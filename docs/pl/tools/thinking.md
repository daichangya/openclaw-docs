---
read_when:
    - Dostosowywanie analizy składni dyrektyw lub wartości domyślnych dla myślenia, trybu szybkiego albo szczegółowości
summary: Składnia dyrektyw dla `/think`, `/fast`, `/verbose`, `/trace` oraz widoczności rozumowania
title: Poziomy myślenia
x-i18n:
    generated_at: "2026-04-25T14:00:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0537f10d3dd3251ac41590bebd2d83ba8b2562725c322040b20f32547c8af88d
    source_path: tools/thinking.md
    workflow: 15
---

## Co to robi

- Dyrektywa inline w dowolnej treści przychodzącej: `/t <level>`, `/think:<level>` lub `/thinking <level>`.
- Poziomy (aliasy): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „think”
  - low → „think hard”
  - medium → „think harder”
  - high → „ultrathink” (maksymalny budżet)
  - xhigh → „ultrathink+” (modele GPT-5.2+ i Codex oraz poziom effort Anthropic Claude Opus 4.7)
  - adaptive → zarządzane przez dostawcę myślenie adaptacyjne (obsługiwane dla Claude 4.6 w Anthropic/Bedrock, Anthropic Claude Opus 4.7 oraz dynamic thinking Google Gemini)
  - max → maksymalne rozumowanie dostawcy (obecnie Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` i `extra_high` są mapowane na `xhigh`.
  - `highest` jest mapowane na `high`.
- Uwagi dotyczące dostawców:
  - Menu i selektory myślenia są sterowane przez profile dostawców. Plugin dostawcy deklarują dokładny zestaw poziomów dla wybranego modelu, w tym etykiety takie jak binarne `on`.
  - `adaptive`, `xhigh` i `max` są ogłaszane tylko dla profili dostawca/model, które je obsługują. Wpisane dyrektywy dla nieobsługiwanych poziomów są odrzucane wraz z poprawnymi opcjami dla danego modelu.
  - Istniejące zapisane nieobsługiwane poziomy są przemapowywane według rangi profilu dostawcy. `adaptive` przechodzi na `medium` w modelach nieadaptacyjnych, a `xhigh` i `max` przechodzą na najwyższy obsługiwany poziom inny niż `off` dla wybranego modelu.
  - Modele Anthropic Claude 4.6 domyślnie używają `adaptive`, gdy nie ustawiono jawnego poziomu myślenia.
  - Anthropic Claude Opus 4.7 nie domyślnie nie używa myślenia adaptacyjnego. Domyślna wartość effort w jego API pozostaje zarządzana przez dostawcę, chyba że jawnie ustawisz poziom myślenia.
  - Anthropic Claude Opus 4.7 mapuje `/think xhigh` na myślenie adaptacyjne plus `output_config.effort: "xhigh"`, ponieważ `/think` jest dyrektywą myślenia, a `xhigh` jest ustawieniem effort dla Opus 4.7.
  - Anthropic Claude Opus 4.7 udostępnia także `/think max`; jest ono mapowane na tę samą ścieżkę maksymalnego effort zarządzaną przez dostawcę.
  - Modele OpenAI GPT mapują `/think` przez obsługę effort specyficzną dla modelu w Responses API. `/think off` wysyła `reasoning.effort: "none"` tylko wtedy, gdy model docelowy to obsługuje; w przeciwnym razie OpenClaw pomija ładunek wyłączonego rozumowania zamiast wysyłać nieobsługiwaną wartość.
  - Google Gemini mapuje `/think adaptive` na dynamic thinking zarządzane przez dostawcę Gemini. Żądania Gemini 3 pomijają stałe `thinkingLevel`, a żądania Gemini 2.5 wysyłają `thinkingBudget: -1`; stałe poziomy nadal są mapowane do najbliższego `thinkingLevel` lub budżetu Gemini dla tej rodziny modeli.
  - MiniMax (`minimax/*`) na ścieżce strumieniowania zgodnej z Anthropic domyślnie używa `thinking: { type: "disabled" }`, chyba że jawnie ustawisz thinking w parametrach modelu lub żądania. Zapobiega to wyciekom delt `reasoning_content` z nienatywnego formatu strumienia Anthropic w MiniMax.
  - Z.AI (`zai/*`) obsługuje tylko binarne myślenie (`on`/`off`). Każdy poziom inny niż `off` jest traktowany jako `on` (mapowany do `low`).
  - Moonshot (`moonshot/*`) mapuje `/think off` na `thinking: { type: "disabled" }`, a każdy poziom inny niż `off` na `thinking: { type: "enabled" }`. Gdy thinking jest włączone, Moonshot akceptuje tylko `tool_choice` `auto|none`; OpenClaw normalizuje niezgodne wartości do `auto`.

## Kolejność rozwiązywania

1. Dyrektywa inline w wiadomości (dotyczy tylko tej wiadomości).
2. Nadpisanie sesji (ustawiane przez wysłanie wiadomości zawierającej wyłącznie dyrektywę).
3. Domyślna wartość dla agenta (`agents.list[].thinkingDefault` w konfiguracji).
4. Globalna wartość domyślna (`agents.defaults.thinkingDefault` w konfiguracji).
5. Fallback: wartość domyślna zadeklarowana przez dostawcę, jeśli jest dostępna; w przeciwnym razie modele zdolne do rozumowania przyjmują `medium` lub najbliższy obsługiwany poziom inny niż `off` dla danego modelu, a modele bez rozumowania pozostają przy `off`.

## Ustawianie domyślnej wartości sesji

- Wyślij wiadomość, która zawiera **wyłącznie** dyrektywę (dozwolone są białe znaki), np. `/think:medium` lub `/t high`.
- To ustawienie pozostaje dla bieżącej sesji (domyślnie per nadawca); jest czyszczone przez `/think:off` lub reset bezczynności sesji.
- Wysyłana jest odpowiedź potwierdzająca (`Thinking level set to high.` / `Thinking disabled.`). Jeśli poziom jest nieprawidłowy (np. `/thinking big`), polecenie zostaje odrzucone z podpowiedzią, a stan sesji pozostaje bez zmian.
- Wyślij `/think` (lub `/think:`) bez argumentu, aby zobaczyć bieżący poziom myślenia.

## Zastosowanie według agenta

- **Osadzony Pi**: rozstrzygnięty poziom jest przekazywany do środowiska wykonawczego agenta Pi działającego w procesie.

## Tryb szybki (/fast)

- Poziomy: `on|off`.
- Wiadomość zawierająca wyłącznie dyrektywę przełącza nadpisanie trybu szybkiego dla sesji i odpowiada `Fast mode enabled.` / `Fast mode disabled.`.
- Wyślij `/fast` (lub `/fast status`) bez trybu, aby zobaczyć bieżący efektywny stan trybu szybkiego.
- OpenClaw rozwiązuje tryb szybki w następującej kolejności:
  1. Inline / zawierające wyłącznie dyrektywę `/fast on|off`
  2. Nadpisanie sesji
  3. Domyślna wartość dla agenta (`agents.list[].fastModeDefault`)
  4. Konfiguracja dla modelu: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Dla `openai/*` tryb szybki mapuje się na przetwarzanie priorytetowe OpenAI przez wysłanie `service_tier=priority` w obsługiwanych żądaniach Responses.
- Dla `openai-codex/*` tryb szybki wysyła tę samą flagę `service_tier=priority` w Codex Responses. OpenClaw utrzymuje jedno wspólne przełączenie `/fast` dla obu ścieżek uwierzytelniania.
- Dla bezpośrednich publicznych żądań `anthropic/*`, w tym ruchu uwierzytelnianego przez OAuth wysyłanego do `api.anthropic.com`, tryb szybki mapuje się na poziomy service tier Anthropic: `/fast on` ustawia `service_tier=auto`, a `/fast off` ustawia `service_tier=standard_only`.
- Dla `minimax/*` na ścieżce zgodnej z Anthropic `/fast on` (lub `params.fastMode: true`) przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.
- Jawne parametry modelu Anthropic `serviceTier` / `service_tier` mają pierwszeństwo przed domyślną wartością trybu szybkiego, gdy ustawione są oba. OpenClaw nadal pomija wstrzykiwanie service tier Anthropic dla nieanthropicowych bazowych adresów URL proxy.
- `/status` pokazuje `Fast` tylko wtedy, gdy tryb szybki jest włączony.

## Dyrektywy szczegółowości (/verbose lub /v)

- Poziomy: `on` (minimalny) | `full` | `off` (domyślnie).
- Wiadomość zawierająca wyłącznie dyrektywę przełącza szczegółowość sesji i odpowiada `Verbose logging enabled.` / `Verbose logging disabled.`; nieprawidłowe poziomy zwracają podpowiedź bez zmiany stanu.
- `/verbose off` zapisuje jawne nadpisanie sesji; wyczyść je w interfejsie Sessions, wybierając `inherit`.
- Dyrektywa inline dotyczy tylko tej wiadomości; w przeciwnym razie stosowane są domyślne ustawienia sesji/globalne.
- Wyślij `/verbose` (lub `/verbose:`) bez argumentu, aby zobaczyć bieżący poziom szczegółowości.
- Gdy szczegółowość jest włączona, agenci emitujący uporządkowane wyniki narzędzi (Pi, inni agenci JSON) wysyłają każde wywołanie narzędzia z powrotem jako osobną wiadomość zawierającą wyłącznie metadane, z prefiksem `<emoji> <tool-name>: <arg>`, jeśli jest dostępny (ścieżka/polecenie). Te podsumowania narzędzi są wysyłane, gdy tylko każde narzędzie się uruchomi (osobne dymki), a nie jako delty strumieniowe.
- Podsumowania błędów narzędzi pozostają widoczne w trybie normalnym, ale surowe sufiksy ze szczegółami błędów są ukryte, chyba że `verbose` ma wartość `on` lub `full`.
- Gdy `verbose` ma wartość `full`, wyjścia narzędzi są także przekazywane po zakończeniu (osobny dymek, obcięty do bezpiecznej długości). Jeśli przełączysz `/verbose on|full|off`, gdy przebieg jest w toku, kolejne dymki narzędzi uwzględnią nowe ustawienie.

## Dyrektywy śledzenia Plugin (/trace)

- Poziomy: `on` | `off` (domyślnie).
- Wiadomość zawierająca wyłącznie dyrektywę przełącza wyjście śledzenia Plugin dla sesji i odpowiada `Plugin trace enabled.` / `Plugin trace disabled.`.
- Dyrektywa inline dotyczy tylko tej wiadomości; w przeciwnym razie stosowane są domyślne ustawienia sesji/globalne.
- Wyślij `/trace` (lub `/trace:`) bez argumentu, aby zobaczyć bieżący poziom śledzenia.
- `/trace` jest węższe niż `/verbose`: ujawnia tylko linie śledzenia/debugowania należące do Plugin, takie jak podsumowania debugowania Active Memory.
- Linie śledzenia mogą pojawiać się w `/status` oraz jako kolejna wiadomość diagnostyczna po zwykłej odpowiedzi asystenta.

## Widoczność rozumowania (/reasoning)

- Poziomy: `on|off|stream`.
- Wiadomość zawierająca wyłącznie dyrektywę przełącza to, czy bloki myślenia są pokazywane w odpowiedziach.
- Gdy ta opcja jest włączona, rozumowanie jest wysyłane jako **osobna wiadomość** z prefiksem `Reasoning:`.
- `stream` (tylko Telegram): strumieniuje rozumowanie do dymka szkicu Telegram podczas generowania odpowiedzi, a następnie wysyła ostateczną odpowiedź bez rozumowania.
- Alias: `/reason`.
- Wyślij `/reasoning` (lub `/reasoning:`) bez argumentu, aby zobaczyć bieżący poziom rozumowania.
- Kolejność rozwiązywania: dyrektywa inline, następnie nadpisanie sesji, potem domyślna wartość dla agenta (`agents.list[].reasoningDefault`), a następnie fallback (`off`).

## Powiązane

- Dokumentacja trybu Elevated znajduje się w [Tryb Elevated](/pl/tools/elevated).

## Heartbeat

- Treść sondy Heartbeat to skonfigurowany prompt heartbeat (domyślnie: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Dyrektywy inline w wiadomości heartbeat działają jak zwykle (ale unikaj zmieniania domyślnych ustawień sesji z heartbeatów).
- Dostarczanie Heartbeat domyślnie obejmuje tylko końcowy ładunek. Aby wysyłać także osobną wiadomość `Reasoning:` (gdy jest dostępna), ustaw `agents.defaults.heartbeat.includeReasoning: true` lub per-agent `agents.list[].heartbeat.includeReasoning: true`.

## Interfejs czatu webowego

- Selektor myślenia w czacie webowym odzwierciedla zapisany poziom sesji z magazynu/konfiguracji sesji przychodzącej podczas ładowania strony.
- Wybranie innego poziomu zapisuje nadpisanie sesji natychmiast przez `sessions.patch`; nie czeka na następne wysłanie i nie jest jednorazowym nadpisaniem `thinkingOnce`.
- Pierwsza opcja to zawsze `Default (<resolved level>)`, gdzie rozstrzygnięta wartość domyślna pochodzi z profilu myślenia dostawcy dla aktywnego modelu sesji oraz z tej samej logiki fallbacku, której używają `/status` i `session_status`.
- Selektor używa `thinkingLevels` zwracanych przez wiersz/domyślne wartości sesji gateway, a `thinkingOptions` pozostaje starszą listą etykiet. Interfejs przeglądarkowy nie utrzymuje własnej listy regexów dostawców; Plugin są właścicielami zestawów poziomów specyficznych dla modelu.
- `/think:<level>` nadal działa i aktualizuje ten sam zapisany poziom sesji, więc dyrektywy czatu i selektor pozostają zsynchronizowane.

## Profile dostawców

- Plugin dostawcy mogą udostępniać `resolveThinkingProfile(ctx)`, aby definiować obsługiwane poziomy modelu i wartość domyślną.
- Każdy poziom profilu ma zapisany kanoniczny `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` lub `max`) i może zawierać wyświetlaną `label`. Dostawcy binarni używają `{ id: "low", label: "on" }`.
- Opublikowane starsze hooki (`supportsXHighThinking`, `isBinaryThinking` i `resolveDefaultThinkingLevel`) pozostają adapterami zgodności, ale nowe niestandardowe zestawy poziomów powinny używać `resolveThinkingProfile`.
- Wiersze/domyślne wartości Gateway udostępniają `thinkingLevels`, `thinkingOptions` i `thinkingDefault`, aby klienci ACP/czatu renderowali te same identyfikatory i etykiety profili, których używa walidacja środowiska wykonawczego.
