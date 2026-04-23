---
read_when:
    - Dostosowywanie analizy dyrektyw myślenia, trybu szybkiego lub szczegółowości albo ich ustawień domyślnych
summary: Składnia dyrektyw dla `/think`, `/fast`, `/verbose`, `/trace` oraz widoczności rozumowania
title: Poziomy myślenia
x-i18n:
    generated_at: "2026-04-23T13:58:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4efe899f7b47244745a105583b3239effa7975fadd06bd7bcad6327afcc91207
    source_path: tools/thinking.md
    workflow: 15
---

# Poziomy myślenia (dyrektywy `/think`)

## Co to robi

- Dyrektywa inline w dowolnej treści przychodzącej: `/t <level>`, `/think:<level>` lub `/thinking <level>`.
- Poziomy (aliasy): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „think”
  - low → „think hard”
  - medium → „think harder”
  - high → „ultrathink” (maksymalny budżet)
  - xhigh → „ultrathink+” (wysiłek GPT-5.2 + modeli Codex oraz Anthropic Claude Opus 4.7)
  - adaptive → adaptacyjne myślenie zarządzane przez dostawcę (obsługiwane dla Claude 4.6 na Anthropic/Bedrock oraz Anthropic Claude Opus 4.7)
  - max → maksymalne rozumowanie dostawcy (obecnie Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` i `extra_high` są mapowane na `xhigh`.
  - `highest` jest mapowane na `high`.
- Uwagi dotyczące dostawców:
  - Menu i selektory myślenia są sterowane przez profile dostawcy. Pluginy dostawców deklarują dokładny zestaw poziomów dla wybranego modelu, w tym etykiety takie jak binarne `on`.
  - `adaptive`, `xhigh` i `max` są ogłaszane tylko dla profili dostawca/model, które je obsługują. Wpisane dyrektywy dla nieobsługiwanych poziomów są odrzucane z listą prawidłowych opcji dla danego modelu.
  - Istniejące zapisane nieobsługiwane poziomy są mapowane ponownie według rangi profilu dostawcy. `adaptive` przechodzi awaryjnie na `medium` w modelach bez trybu adaptacyjnego, a `xhigh` i `max` przechodzą awaryjnie na najwyższy obsługiwany poziom inny niż `off` dla wybranego modelu.
  - Modele Anthropic Claude 4.6 domyślnie używają `adaptive`, gdy nie ustawiono jawnego poziomu myślenia.
  - Anthropic Claude Opus 4.7 nie używa domyślnie myślenia adaptacyjnego. Domyślny wysiłek API pozostaje po stronie dostawcy, chyba że jawnie ustawisz poziom myślenia.
  - Anthropic Claude Opus 4.7 mapuje `/think xhigh` na adaptacyjne myślenie plus `output_config.effort: "xhigh"`, ponieważ `/think` jest dyrektywą myślenia, a `xhigh` to ustawienie wysiłku w Opus 4.7.
  - Anthropic Claude Opus 4.7 udostępnia także `/think max`; jest ono mapowane na tę samą ścieżkę maksymalnego wysiłku zarządzaną przez dostawcę.
  - Modele OpenAI GPT mapują `/think` przez obsługę wysiłku interfejsu Responses API specyficzną dla modelu. `/think off` wysyła `reasoning.effort: "none"` tylko wtedy, gdy model docelowy to obsługuje; w przeciwnym razie OpenClaw pomija wyłączony ładunek rozumowania zamiast wysyłać nieobsługiwaną wartość.
  - MiniMax (`minimax/*`) na ścieżce strumieniowania zgodnej z Anthropic domyślnie używa `thinking: { type: "disabled" }`, chyba że jawnie ustawisz myślenie w parametrach modelu lub żądania. Zapobiega to wyciekom delt `reasoning_content` z nienatywnego formatu strumienia Anthropic używanego przez MiniMax.
  - Z.AI (`zai/*`) obsługuje tylko binarne myślenie (`on`/`off`). Każdy poziom inny niż `off` jest traktowany jako `on` (mapowany na `low`).
  - Moonshot (`moonshot/*`) mapuje `/think off` na `thinking: { type: "disabled" }`, a każdy poziom inny niż `off` na `thinking: { type: "enabled" }`. Gdy myślenie jest włączone, Moonshot akceptuje tylko `tool_choice` `auto|none`; OpenClaw normalizuje niezgodne wartości do `auto`.

## Kolejność rozstrzygania

1. Dyrektywa inline w wiadomości (dotyczy tylko tej wiadomości).
2. Nadpisanie sesji (ustawiane przez wysłanie wiadomości zawierającej wyłącznie dyrektywę).
3. Domyślna wartość dla agenta (`agents.list[].thinkingDefault` w konfiguracji).
4. Globalna wartość domyślna (`agents.defaults.thinkingDefault` w konfiguracji).
5. Rezerwa: domyślna wartość zadeklarowana przez dostawcę, jeśli jest dostępna; w przeciwnym razie modele obsługujące rozumowanie są rozstrzygane do `medium` lub najbliższego obsługiwanego poziomu innego niż `off` dla danego modelu, a modele bez rozumowania pozostają przy `off`.

## Ustawianie domyślnej wartości sesji

- Wyślij wiadomość, która zawiera **tylko** dyrektywę (białe znaki są dozwolone), np. `/think:medium` lub `/t high`.
- To ustawienie pozostaje dla bieżącej sesji (domyślnie dla danego nadawcy); jest czyszczone przez `/think:off` lub reset bezczynności sesji.
- Wysyłana jest odpowiedź potwierdzająca (`Thinking level set to high.` / `Thinking disabled.`). Jeśli poziom jest nieprawidłowy (np. `/thinking big`), polecenie zostaje odrzucone z podpowiedzią, a stan sesji pozostaje bez zmian.
- Wyślij `/think` (lub `/think:`) bez argumentu, aby zobaczyć bieżący poziom myślenia.

## Zastosowanie według agenta

- **Wbudowany Pi**: rozstrzygnięty poziom jest przekazywany do działającego w procesie środowiska uruchomieniowego agenta Pi.

## Tryb szybki (`/fast`)

- Poziomy: `on|off`.
- Wiadomość zawierająca wyłącznie dyrektywę przełącza nadpisanie trybu szybkiego dla sesji i odpowiada `Fast mode enabled.` / `Fast mode disabled.`.
- Wyślij `/fast` (lub `/fast status`) bez trybu, aby zobaczyć bieżący efektywny stan trybu szybkiego.
- OpenClaw rozstrzyga tryb szybki w następującej kolejności:
  1. Inline/wiadomość zawierająca wyłącznie dyrektywę `/fast on|off`
  2. Nadpisanie sesji
  3. Domyślna wartość dla agenta (`agents.list[].fastModeDefault`)
  4. Konfiguracja dla modelu: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Rezerwa: `off`
- Dla `openai/*` tryb szybki jest mapowany na priorytetowe przetwarzanie OpenAI przez wysłanie `service_tier=priority` w obsługiwanych żądaniach Responses.
- Dla `openai-codex/*` tryb szybki wysyła tę samą flagę `service_tier=priority` w odpowiedziach Codex Responses. OpenClaw utrzymuje jeden wspólny przełącznik `/fast` dla obu ścieżek uwierzytelniania.
- Dla bezpośrednich publicznych żądań `anthropic/*`, w tym ruchu uwierzytelnionego przez OAuth wysyłanego do `api.anthropic.com`, tryb szybki jest mapowany na poziomy usług Anthropic: `/fast on` ustawia `service_tier=auto`, `/fast off` ustawia `service_tier=standard_only`.
- Dla `minimax/*` na ścieżce zgodnej z Anthropic, `/fast on` (lub `params.fastMode: true`) przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.
- Jawne parametry modelu Anthropic `serviceTier` / `service_tier` nadpisują domyślną wartość trybu szybkiego, gdy ustawione są oba. OpenClaw nadal pomija wstrzykiwanie poziomu usług Anthropic dla adresów bazowych proxy innych niż Anthropic.
- `/status` pokazuje `Fast` tylko wtedy, gdy tryb szybki jest włączony.

## Dyrektywy szczegółowości (`/verbose` lub `/v`)

- Poziomy: `on` (minimalny) | `full` | `off` (domyślnie).
- Wiadomość zawierająca wyłącznie dyrektywę przełącza szczegółowość sesji i odpowiada `Verbose logging enabled.` / `Verbose logging disabled.`; nieprawidłowe poziomy zwracają podpowiedź bez zmiany stanu.
- `/verbose off` zapisuje jawne nadpisanie sesji; wyczyść je przez interfejs Sessions, wybierając `inherit`.
- Dyrektywa inline dotyczy tylko tej wiadomości; w pozostałych przypadkach stosowane są domyślne wartości sesji/globalne.
- Wyślij `/verbose` (lub `/verbose:`) bez argumentu, aby zobaczyć bieżący poziom szczegółowości.
- Gdy szczegółowość jest włączona, agenci emitujący ustrukturyzowane wyniki narzędzi (Pi, inne agenty JSON) odsyłają każde wywołanie narzędzia jako osobną wiadomość zawierającą wyłącznie metadane, poprzedzoną `<emoji> <tool-name>: <arg>`, gdy to możliwe (ścieżka/polecenie). Te podsumowania narzędzi są wysyłane natychmiast po uruchomieniu każdego narzędzia (osobne dymki), a nie jako delty strumieniowe.
- Podsumowania błędów narzędzi pozostają widoczne w trybie normalnym, ale surowe sufiksy ze szczegółami błędów są ukryte, chyba że szczegółowość to `on` lub `full`.
- Gdy szczegółowość ma wartość `full`, wyjścia narzędzi są także przekazywane po zakończeniu (osobny dymek, obcięty do bezpiecznej długości). Jeśli przełączysz `/verbose on|full|off` w trakcie działania, kolejne dymki narzędzi uwzględnią nowe ustawienie.

## Dyrektywy śledzenia Pluginów (`/trace`)

- Poziomy: `on` | `off` (domyślnie).
- Wiadomość zawierająca wyłącznie dyrektywę przełącza wyjście śledzenia Pluginów dla sesji i odpowiada `Plugin trace enabled.` / `Plugin trace disabled.`.
- Dyrektywa inline dotyczy tylko tej wiadomości; w pozostałych przypadkach stosowane są domyślne wartości sesji/globalne.
- Wyślij `/trace` (lub `/trace:`) bez argumentu, aby zobaczyć bieżący poziom śledzenia.
- `/trace` ma węższy zakres niż `/verbose`: ujawnia tylko linie śledzenia/debug należące do Pluginów, takie jak podsumowania debugowania Active Memory.
- Linie śledzenia mogą pojawiać się w `/status` oraz jako diagnostyczna wiadomość uzupełniająca po zwykłej odpowiedzi asystenta.

## Widoczność rozumowania (`/reasoning`)

- Poziomy: `on|off|stream`.
- Wiadomość zawierająca wyłącznie dyrektywę przełącza to, czy bloki myślenia są pokazywane w odpowiedziach.
- Gdy jest włączone, rozumowanie jest wysyłane jako **osobna wiadomość** poprzedzona `Reasoning:`.
- `stream` (tylko Telegram): strumieniuje rozumowanie do roboczego dymka Telegrama podczas generowania odpowiedzi, a następnie wysyła końcową odpowiedź bez rozumowania.
- Alias: `/reason`.
- Wyślij `/reasoning` (lub `/reasoning:`) bez argumentu, aby zobaczyć bieżący poziom rozumowania.
- Kolejność rozstrzygania: dyrektywa inline, następnie nadpisanie sesji, następnie domyślna wartość dla agenta (`agents.list[].reasoningDefault`), a następnie rezerwa (`off`).

## Powiązane

- Dokumentacja trybu podwyższonego poziomu uprawnień znajduje się w [Elevated mode](/pl/tools/elevated).

## Heartbeat

- Treść sondy Heartbeat to skonfigurowany prompt heartbeat (domyślnie: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Dyrektywy inline w wiadomości heartbeat są stosowane jak zwykle (ale unikaj zmieniania domyślnych ustawień sesji z heartbeatów).
- Dostarczanie Heartbeat domyślnie obejmuje tylko końcowy ładunek. Aby wysyłać także osobną wiadomość `Reasoning:` (gdy jest dostępna), ustaw `agents.defaults.heartbeat.includeReasoning: true` lub dla danego agenta `agents.list[].heartbeat.includeReasoning: true`.

## Interfejs web chat

- Selektor myślenia w web chat odzwierciedla zapisany poziom sesji z przychodzącego magazynu sesji/konfiguracji podczas ładowania strony.
- Wybranie innego poziomu natychmiast zapisuje nadpisanie sesji przez `sessions.patch`; nie czeka na kolejne wysłanie i nie jest jednorazowym nadpisaniem `thinkingOnce`.
- Pierwsza opcja to zawsze `Default (<resolved level>)`, gdzie rozstrzygnięta wartość domyślna pochodzi z profilu myślenia dostawcy dla aktywnego modelu sesji oraz z tej samej logiki rezerwowej, której używają `/status` i `session_status`.
- Selektor używa `thinkingOptions` zwracanych przez wiersz sesji Gateway. Interfejs przeglądarkowy nie utrzymuje własnej listy regexów dostawców; Pluginy zarządzają zestawami poziomów specyficznymi dla modelu.
- `/think:<level>` nadal działa i aktualizuje ten sam zapisany poziom sesji, więc dyrektywy czatu i selektor pozostają zsynchronizowane.

## Profile dostawców

- Pluginy dostawców mogą udostępniać `resolveThinkingProfile(ctx)`, aby zdefiniować obsługiwane poziomy i wartość domyślną modelu.
- Każdy poziom profilu ma zapisywane kanoniczne `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` lub `max`) i może zawierać wyświetlaną `label`. Dostawcy binarni używają `{ id: "low", label: "on" }`.
- Opublikowane starsze haki (`supportsXHighThinking`, `isBinaryThinking` i `resolveDefaultThinkingLevel`) pozostają adapterami zgodności, ale nowe niestandardowe zestawy poziomów powinny używać `resolveThinkingProfile`.
- Wiersze Gateway udostępniają `thinkingOptions` i `thinkingDefault`, aby klienci ACP/chat renderowali ten sam profil, którego używa walidacja środowiska uruchomieniowego.
