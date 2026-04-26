---
read_when:
    - Rozszerzanie qa-lab lub qa-channel
    - Dodawanie scenariuszy QA opartych na repozytorium
    - Budowanie bardziej realistycznej automatyzacji QA wokół dashboardu Gateway
summary: Prywatna struktura automatyzacji QA dla qa-lab, qa-channel, scenariuszy seeded i raportów protokołu
title: Automatyzacja QA E2E
x-i18n:
    generated_at: "2026-04-26T11:27:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3803f2bc5cdf2368c3af59b412de8ef732708995a54f7771d3f6f16e8be0592b
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

Prywatny stos QA ma testować OpenClaw w bardziej realistyczny sposób, zbliżony do rzeczywistych kanałów, niż jest to możliwe w pojedynczym teście jednostkowym.

Obecne elementy:

- `extensions/qa-channel`: syntetyczny kanał wiadomości z powierzchniami DM, kanału, wątku, reakcji, edycji i usuwania.
- `extensions/qa-lab`: interfejs debuggera i magistrala QA do obserwowania transkryptu, wstrzykiwania wiadomości przychodzących i eksportowania raportu Markdown.
- `qa/`: zasoby seed oparte na repozytorium dla zadania startowego i bazowych scenariuszy QA.

Obecny przepływ pracy operatora QA to witryna QA z dwoma panelami:

- Lewy: dashboard Gateway (Control UI) z agentem.
- Prawy: QA Lab, pokazujący transkrypt w stylu Slack i plan scenariusza.

Uruchomienie:

```bash
pnpm qa:lab:up
```

To buduje witrynę QA, uruchamia ścieżkę Gateway opartą na Docker i udostępnia stronę QA Lab, na której operator lub pętla automatyzacji może zlecić agentowi misję QA, obserwować rzeczywiste zachowanie kanału i zapisywać, co zadziałało, co nie zadziałało i co pozostało zablokowane.

Aby szybciej iterować nad interfejsem QA Lab bez przebudowywania obrazu Docker przy każdej zmianie, uruchom stos z bind mountem bundla QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` utrzymuje usługi Docker na wcześniej zbudowanym obrazie i bind-mountuje `extensions/qa-lab/web/dist` do kontenera `qa-lab`. `qa:lab:watch` przebudowuje ten bundel po zmianach, a przeglądarka automatycznie przeładowuje się, gdy zmieni się hash zasobu QA Lab.

Aby wykonać lokalny smoke test śladów OpenTelemetry, uruchom:

```bash
pnpm qa:otel:smoke
```

Ten skrypt uruchamia lokalny odbiornik śladów OTLP/HTTP, wykonuje scenariusz QA `otel-trace-smoke` z włączonym Plugin `diagnostics-otel`, a następnie dekoduje wyeksportowane span protobuf i sprawdza krytyczny dla wydania kształt: muszą być obecne `openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`, `openclaw.context.assembled` oraz `openclaw.message.delivery`; wywołania modelu nie mogą eksportować `StreamAbandoned` przy udanych turach; surowe identyfikatory diagnostyczne i atrybuty `openclaw.content.*` muszą pozostać poza śladem. Zapisuje `otel-smoke-summary.json` obok artefaktów zestawu QA.

Aby uruchomić ścieżkę smoke Matrix z rzeczywistym transportem, wykonaj:

```bash
pnpm openclaw qa matrix
```

Ta ścieżka tworzy jednorazowy homeserver Tuwunel w Docker, rejestruje tymczasowych użytkowników driver, SUT i observer, tworzy jeden prywatny pokój, a następnie uruchamia rzeczywisty Plugin Matrix wewnątrz potomnego Gateway QA. Ścieżka live transport utrzymuje konfigurację potomną ograniczoną do testowanego transportu, więc Matrix działa bez `qa-channel` w konfiguracji potomnej. Zapisuje uporządkowane artefakty raportu i połączony log stdout/stderr do wybranego katalogu wyjściowego Matrix QA. Aby przechwycić także zewnętrzne dane wyjściowe build/launcher z `scripts/run-node.mjs`, ustaw `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` na plik logu w repozytorium. Postęp Matrix jest domyślnie drukowany. `OPENCLAW_QA_MATRIX_TIMEOUT_MS` ogranicza całe uruchomienie, a `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` ogranicza cleanup, aby zablokowane zamykanie Docker zgłaszało dokładne polecenie odzyskiwania zamiast zawieszać się.

Aby uruchomić ścieżkę smoke Telegram z rzeczywistym transportem, wykonaj:

```bash
pnpm openclaw qa telegram
```

Ta ścieżka używa jednej rzeczywistej prywatnej grupy Telegram zamiast tworzyć jednorazowy serwer. Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` i `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, a także dwóch różnych botów w tej samej prywatnej grupie. Bot SUT musi mieć nazwę użytkownika Telegram, a obserwacja bot-do-bota działa najlepiej, gdy oba boty mają w `@BotFather` włączony Bot-to-Bot Communication Mode.
Polecenie kończy się niezerowym kodem, gdy którykolwiek scenariusz zakończy się niepowodzeniem. Użyj `--allow-failures`, jeśli chcesz uzyskać artefakty bez niezerowego kodu wyjścia.
Raport i podsumowanie Telegram zawierają RTT dla każdej odpowiedzi, liczone od żądania wysłania wiadomości przez driver do zaobserwowanej odpowiedzi SUT, począwszy od canary.

Przed użyciem puli poświadczeń live uruchom:

```bash
pnpm openclaw qa credentials doctor
```

Doctor sprawdza env brokera Convex, waliduje ustawienia endpointów i weryfikuje osiągalność admin/list, gdy obecny jest sekret maintenera. Raportuje tylko status ustawione/brakujące dla sekretów.

Aby uruchomić ścieżkę smoke Discord z rzeczywistym transportem, wykonaj:

```bash
pnpm openclaw qa discord
```

Ta ścieżka używa jednego rzeczywistego prywatnego kanału guild Discord z dwoma botami: botem driver kontrolowanym przez harness oraz botem SUT uruchamianym przez potomny Gateway OpenClaw za pomocą dołączonego Plugin Discord. Wymaga `OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`, `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN` i `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` przy korzystaniu z poświadczeń env.
Ścieżka weryfikuje obsługę wzmianek kanałowych i sprawdza, czy bot SUT zarejestrował natywne polecenie `/help` w Discord.
Polecenie kończy się niezerowym kodem, gdy którykolwiek scenariusz zakończy się niepowodzeniem. Użyj `--allow-failures`, jeśli chcesz uzyskać artefakty bez niezerowego kodu wyjścia.

Ścieżki live transport współdzielą teraz jeden mniejszy kontrakt zamiast tego, by każda definiowała własny kształt listy scenariuszy:

`qa-channel` pozostaje szerokim syntetycznym zestawem zachowań produktu i nie jest częścią macierzy pokrycia live transport.

| Ścieżka   | Canary | Bramkowanie wzmianek | Blokada allowlist | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Dalszy ciąg wątku | Izolacja wątku | Obserwacja reakcji | Polecenie help | Rejestracja poleceń natywnych |
| --------- | ------ | -------------------- | ----------------- | ----------------------------- | ----------------------- | ----------------- | -------------- | ------------------ | -------------- | ----------------------------- |
| Matrix    | x      | x                    | x                 | x                             | x                       | x                 | x              | x                  |                |                               |
| Telegram  | x      | x                    |                   |                               |                         |                   |                |                    | x              |                               |
| Discord   | x      | x                    |                   |                               |                         |                   |                |                    |                | x                             |

Dzięki temu `qa-channel` pozostaje szerokim zestawem zachowań produktu, podczas gdy Matrix, Telegram i przyszłe live transport współdzielą jedną jawną checklistę kontraktu transportowego.

Aby uruchomić ścieżkę jednorazowej maszyny wirtualnej Linux bez wprowadzania Docker do ścieżki QA, wykonaj:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

To uruchamia świeżego gościa Multipass, instaluje zależności, buduje OpenClaw wewnątrz gościa, uruchamia `qa suite`, a następnie kopiuje standardowy raport i podsumowanie QA z powrotem do `.artifacts/qa-e2e/...` na hoście.
Ponownie używa tego samego zachowania wyboru scenariuszy co `qa suite` na hoście.
Uruchomienia zestawu na hoście i w Multipass domyślnie wykonują wiele wybranych scenariuszy równolegle z izolowanymi workerami Gateway. `qa-channel` domyślnie używa współbieżności 4, ograniczonej przez liczbę wybranych scenariuszy. Użyj `--concurrency <count>`, aby dostroić liczbę workerów, lub `--concurrency 1` dla wykonania sekwencyjnego.
Polecenie kończy się niezerowym kodem, gdy którykolwiek scenariusz zakończy się niepowodzeniem. Użyj `--allow-failures`, jeśli chcesz uzyskać artefakty bez niezerowego kodu wyjścia.
Uruchomienia live przekazują obsługiwane wejścia uwierzytelniania QA, które są praktyczne dla gościa: klucze dostawców oparte na env, ścieżkę konfiguracji dostawcy QA live oraz `CODEX_HOME`, jeśli jest obecne. Utrzymuj `--output-dir` pod katalogiem głównym repozytorium, aby gość mógł zapisywać wyniki przez zamontowany workspace.

## Seedy oparte na repozytorium

Zasoby seed znajdują się w `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Celowo są przechowywane w git, aby plan QA był widoczny zarówno dla ludzi, jak i dla agenta.

`qa-lab` powinno pozostać generycznym runnerem Markdown. Każdy plik scenariusza Markdown jest źródłem prawdy dla jednego uruchomienia testu i powinien definiować:

- metadane scenariusza
- opcjonalne metadane kategorii, możliwości, ścieżki i ryzyka
- referencje do dokumentacji i kodu
- opcjonalne wymagania Plugin
- opcjonalną poprawkę konfiguracji Gateway
- wykonywalny `qa-flow`

Współdzielona powierzchnia runtime, która obsługuje `qa-flow`, może pozostać generyczna i przekrojowa. Na przykład scenariusze Markdown mogą łączyć helpery po stronie transportu z helperami po stronie przeglądarki, które sterują osadzonym Control UI przez seam Gateway `browser.request`, bez dodawania specjalnego runnera.

Pliki scenariuszy powinny być grupowane według możliwości produktu, a nie według folderu drzewa źródeł. Zachowuj stabilność ID scenariuszy przy przenoszeniu plików; używaj `docsRefs` i `codeRefs` dla śledzalności implementacji.

Lista bazowa powinna pozostać na tyle szeroka, aby obejmować:

- czat DM i kanałowy
- zachowanie wątków
- cykl życia akcji wiadomości
- callbacki Cron
- odtwarzanie pamięci
- przełączanie modeli
- przekazanie do subagenta
- czytanie repozytorium i dokumentacji
- jedno małe zadanie build, takie jak Lobster Invaders

## Ścieżki mock dostawców

`qa suite` ma dwie lokalne ścieżki mock dostawców:

- `mock-openai` to świadomy scenariuszy mock OpenClaw. Pozostaje domyślną deterministyczną ścieżką mock dla QA opartego na repozytorium i bramek parity.
- `aimock` uruchamia serwer dostawcy oparty na AIMock do eksperymentalnego pokrycia protokołów, fixture, record/replay i chaos. Jest dodatkiem i nie zastępuje dispatcher scenariuszy `mock-openai`.

Implementacja ścieżek dostawców znajduje się w `extensions/qa-lab/src/providers/`.
Każdy dostawca posiada własne ustawienia domyślne, uruchamianie lokalnego serwera, konfigurację modelu Gateway, potrzeby przygotowania auth-profile oraz flagi możliwości live/mock. Współdzielony kod zestawu i Gateway powinien przechodzić przez rejestr dostawców zamiast rozgałęziać się po nazwach dostawców.

## Adaptery transportu

`qa-lab` posiada generyczny seam transportu dla scenariuszy QA w Markdown.
`qa-channel` jest pierwszym adapterem na tym seamie, ale cel projektu jest szerszy:
przyszłe kanały rzeczywiste lub syntetyczne powinny podłączać się do tego samego runnera zestawu zamiast dodawania runnera QA specyficznego dla transportu.

Na poziomie architektury podział wygląda tak:

- `qa-lab` odpowiada za generyczne wykonywanie scenariuszy, współbieżność workerów, zapisywanie artefaktów i raportowanie.
- adapter transportu odpowiada za konfigurację Gateway, gotowość, obserwację wejścia i wyjścia, akcje transportu oraz znormalizowany stan transportu.
- pliki scenariuszy Markdown w `qa/scenarios/` definiują przebieg testu; `qa-lab` zapewnia współdzieloną powierzchnię runtime, która je wykonuje.

Wskazówki adopcyjne dla maintenerów dotyczące nowych adapterów kanałów znajdują się w
[Testing](/pl/help/testing#adding-a-channel-to-qa).

## Raportowanie

`qa-lab` eksportuje raport protokołu Markdown z obserwowanej osi czasu magistrali.
Raport powinien odpowiadać na pytania:

- Co zadziałało
- Co się nie udało
- Co pozostało zablokowane
- Jakie scenariusze follow-up warto dodać

Dla kontroli charakteru i stylu uruchom ten sam scenariusz dla wielu referencji modeli live i zapisz oceniany raport Markdown:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Polecenie uruchamia lokalne potomne procesy Gateway QA, a nie Docker. Scenariusze character eval powinny ustawiać personę przez `SOUL.md`, a następnie wykonywać zwykłe tury użytkownika, takie jak czat, pomoc dotycząca workspace i małe zadania na plikach. Model kandydat nie powinien być informowany, że jest oceniany. Polecenie zachowuje każdy pełny transkrypt, rejestruje podstawowe statystyki uruchomienia, a następnie prosi modele oceniające w trybie fast z rozumowaniem `xhigh`, tam gdzie jest obsługiwane, o uszeregowanie uruchomień według naturalności, klimatu i humoru.
Użyj `--blind-judge-models` przy porównywaniu dostawców: prompt oceniający nadal otrzymuje każdy transkrypt i status uruchomienia, ale referencje kandydatów są zastępowane neutralnymi etykietami, takimi jak `candidate-01`; raport mapuje rankingi z powrotem na rzeczywiste referencje po parsowaniu.
Uruchomienia kandydatów domyślnie używają poziomu rozumowania `high`, z `medium` dla GPT-5.5 i `xhigh` dla starszych referencji ewaluacyjnych OpenAI, które to obsługują. Nadpisz konkretnego kandydata inline przez `--model provider/model,thinking=<level>`. `--thinking <level>` nadal ustawia globalny fallback, a starsza postać `--model-thinking <provider/model=level>` jest zachowana dla zgodności.
Referencje kandydatów OpenAI domyślnie używają trybu fast, aby korzystać z przetwarzania priorytetowego tam, gdzie dostawca to obsługuje. Dodaj inline `,fast`, `,no-fast` lub `,fast=false`, gdy pojedynczy kandydat lub sędzia wymaga nadpisania. Przekazuj `--fast` tylko wtedy, gdy chcesz wymusić tryb fast dla każdego modelu kandydata. Czasy trwania kandydatów i sędziów są rejestrowane w raporcie na potrzeby analizy benchmarków, ale prompty oceniające wyraźnie mówią, aby nie rankingować według szybkości.
Uruchomienia modeli kandydatów i sędziów domyślnie używają współbieżności 16. Zmniejsz `--concurrency` lub `--judge-concurrency`, gdy limity dostawcy lub obciążenie lokalnego Gateway sprawiają, że uruchomienie jest zbyt zaszumione.
Gdy nie przekazano żadnego kandydata `--model`, character eval domyślnie używa
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` oraz
`google/gemini-3.1-pro-preview`, gdy nie przekazano `--model`.
Gdy nie przekazano `--judge-model`, sędziowie domyślnie używają
`openai/gpt-5.5,thinking=xhigh,fast` oraz
`anthropic/claude-opus-4-6,thinking=high`.

## Powiązane dokumenty

- [Testing](/pl/help/testing)
- [QA Channel](/pl/channels/qa-channel)
- [Dashboard](/pl/web/dashboard)
