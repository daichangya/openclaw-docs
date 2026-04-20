---
read_when:
    - Rozszerzanie qa-lab lub qa-channel
    - Dodawanie scenariuszy QA opartych na repozytorium
    - Budowanie bardziej realistycznej automatyzacji QA wokół panelu Gateway
summary: Prywatny kształt automatyzacji QA dla qa-lab, qa-channel, scenariuszy z seedowaniem i raportów protokołu
title: Automatyzacja E2E QA
x-i18n:
    generated_at: "2026-04-20T09:58:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 34245ce871356caeab0d9e0eeeaa9fb4e408920a4a97ad27567fa365d8db17c7
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automatyzacja E2E QA

Prywatny stos QA ma ćwiczyć OpenClaw w sposób bardziej realistyczny,
ukształtowany przez kanały niż pojedynczy test jednostkowy.

Obecne elementy:

- `extensions/qa-channel`: syntetyczny kanał wiadomości z powierzchniami DM, kanału, wątku,
  reakcji, edycji i usuwania.
- `extensions/qa-lab`: interfejs debuggera i magistrala QA do obserwowania transkryptu,
  wstrzykiwania wiadomości przychodzących i eksportowania raportu Markdown.
- `qa/`: zasoby seedów oparte na repozytorium dla zadania startowego i bazowych scenariuszy QA.

Obecny przepływ pracy operatora QA to dwupanelowa witryna QA:

- Lewa strona: panel Gateway (Control UI) z agentem.
- Prawa strona: QA Lab, pokazujący transkrypt w stylu Slacka i plan scenariusza.

Uruchom za pomocą:

```bash
pnpm qa:lab:up
```

To buduje witrynę QA, uruchamia opartą na Dockerze ścieżkę Gateway i udostępnia stronę
QA Lab, na której operator lub pętla automatyzacji może zlecić agentowi misję QA,
obserwować rzeczywiste zachowanie kanału i zapisywać, co zadziałało, co się nie udało
lub co pozostało zablokowane.

Aby szybciej iterować nad interfejsem QA Lab bez przebudowywania obrazu Docker przy każdej zmianie,
uruchom stos z bind-mountowanym bundlerem QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` utrzymuje usługi Docker na wstępnie zbudowanym obrazie i bind-mountuje
`extensions/qa-lab/web/dist` do kontenera `qa-lab`. `qa:lab:watch`
przebudowuje ten bundel po zmianach, a przeglądarka automatycznie przeładowuje się, gdy hash zasobu QA Lab się zmieni.

Aby uruchomić ścieżkę smoke z rzeczywistym transportem Matrix, użyj:

```bash
pnpm openclaw qa matrix
```

Ta ścieżka provisionuje jednorazowy homeserver Tuwunel w Dockerze, rejestruje
tymczasowych użytkowników drivera, SUT i obserwatora, tworzy jeden prywatny pokój, a następnie uruchamia
rzeczywisty Plugin Matrix wewnątrz podrzędnego procesu Gateway QA. Ścieżka z żywym transportem utrzymuje
konfigurację procesu podrzędnego ograniczoną do testowanego transportu, dzięki czemu Matrix działa bez
`qa-channel` w konfiguracji procesu podrzędnego. Zapisuje ustrukturyzowane artefakty raportu oraz
połączony log stdout/stderr do wybranego katalogu wyjściowego Matrix QA. Aby przechwycić także
zewnętrzne wyjście build/launcher z `scripts/run-node.mjs`, ustaw
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` na plik logu lokalny dla repozytorium.

Aby uruchomić ścieżkę smoke z rzeczywistym transportem Telegram, użyj:

```bash
pnpm openclaw qa telegram
```

Ta ścieżka celuje w jedną rzeczywistą prywatną grupę Telegram zamiast provisionować
jednorazowy serwer. Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` oraz
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, a także dwóch różnych botów w tej samej
prywatnej grupie. Bot SUT musi mieć nazwę użytkownika Telegram, a obserwacja bot-do-bota
działa najlepiej, gdy oba boty mają włączony tryb Bot-to-Bot Communication Mode
w `@BotFather`.
Polecenie kończy się kodem różnym od zera, gdy jakikolwiek scenariusz się nie powiedzie. Użyj `--allow-failures`, jeśli
chcesz uzyskać artefakty bez kończenia z błędnym kodem wyjścia.

Ścieżki z żywym transportem współdzielą teraz jeden mniejszy kontrakt zamiast każda wymyślać
własny kształt listy scenariuszy:

`qa-channel` pozostaje szerokim syntetycznym zestawem testów zachowania produktu i nie jest częścią macierzy pokrycia żywego transportu.

| Ścieżka  | Canary | Bramka wzmianek | Blokada allowlisty | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Dalszy ciąg wątku | Izolacja wątku | Obserwacja reakcji | Polecenie help |
| -------- | ------ | --------------- | ------------------ | ----------------------------- | ----------------------- | ----------------- | -------------- | ------------------ | -------------- |
| Matrix   | x      | x               | x                  | x                             | x                       | x                 | x              | x                  |                |
| Telegram | x      |                 |                    |                               |                         |                   |                |                    | x              |

Dzięki temu `qa-channel` pozostaje szerokim zestawem testów zachowania produktu, podczas gdy Matrix,
Telegram i przyszłe żywe transporty współdzielą jedną jawną checklistę kontraktu transportowego.

Aby uruchomić ścieżkę na jednorazowej maszynie wirtualnej Linux bez wprowadzania Dockera do ścieżki QA, użyj:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

To uruchamia świeżego gościa Multipass, instaluje zależności, buduje OpenClaw
wewnątrz gościa, uruchamia `qa suite`, a następnie kopiuje zwykły raport QA i
podsumowanie z powrotem do `.artifacts/qa-e2e/...` na hoście.
Ponownie wykorzystuje to samo zachowanie wyboru scenariuszy co `qa suite` na hoście.
Uruchomienia na hoście i w Multipass domyślnie wykonują wiele wybranych scenariuszy równolegle
z izolowanymi workerami Gateway. `qa-channel` domyślnie używa współbieżności 4,
ograniczonej przez liczbę wybranych scenariuszy. Użyj `--concurrency <count>`, aby dostroić
liczbę workerów, lub `--concurrency 1` dla wykonywania szeregowego.
Polecenie kończy się kodem różnym od zera, gdy jakikolwiek scenariusz się nie powiedzie. Użyj `--allow-failures`, jeśli
chcesz uzyskać artefakty bez kończenia z błędnym kodem wyjścia.
Uruchomienia live przekazują obsługiwane wejścia uwierzytelniania QA, które są praktyczne dla
gościa: klucze dostawcy oparte na env, ścieżkę konfiguracji dostawcy live QA oraz
`CODEX_HOME`, jeśli jest obecne. Trzymaj `--output-dir` w katalogu głównym repozytorium, aby gość
mógł zapisywać z powrotem przez zamontowany workspace.

## Seedy oparte na repozytorium

Zasoby seedów znajdują się w `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Są one celowo przechowywane w git, aby plan QA był widoczny zarówno dla ludzi, jak i dla
agenta.

`qa-lab` powinien pozostać ogólnym runnerem Markdown. Każdy plik scenariusza Markdown jest
źródłem prawdy dla jednego uruchomienia testu i powinien definiować:

- metadane scenariusza
- opcjonalne metadane kategorii, możliwości, ścieżki i ryzyka
- odwołania do dokumentacji i kodu
- opcjonalne wymagania Plugin
- opcjonalny patch konfiguracji Gateway
- wykonywalny `qa-flow`

Wielokrotnego użytku powierzchnia runtime, która wspiera `qa-flow`, może pozostać ogólna
i przekrojowa. Na przykład scenariusze Markdown mogą łączyć pomocniki po stronie transportu
z pomocnikami po stronie przeglądarki, które sterują osadzonym Control UI przez
powierzchnię Gateway `browser.request`, bez dodawania runnera specjalnego przypadku.

Pliki scenariuszy powinny być grupowane według możliwości produktu, a nie folderu drzewa źródeł.
Zachowuj stabilność identyfikatorów scenariuszy przy przenoszeniu plików; używaj `docsRefs` i `codeRefs`
dla identyfikowalności implementacji.

Lista bazowa powinna pozostać wystarczająco szeroka, aby obejmować:

- czat DM i kanałowy
- zachowanie wątku
- cykl życia akcji wiadomości
- wywołania zwrotne Cron
- przywoływanie pamięci
- przełączanie modeli
- przekazanie do subagenta
- odczyt repozytorium i dokumentacji
- jedno małe zadanie build, takie jak Lobster Invaders

## Ścieżki mock dostawców

`qa suite` ma dwie lokalne ścieżki mock dostawców:

- `mock-openai` to świadomy scenariuszy mock OpenClaw. Pozostaje domyślną
  deterministyczną ścieżką mock dla QA opartego na repozytorium i bramek parzystości.
- `aimock` uruchamia serwer dostawcy oparty na AIMock do eksperymentalnego pokrycia protokołu,
  fixture, record/replay i chaos. Jest dodatkiem i nie zastępuje dispatcher scenariuszy `mock-openai`.

Implementacja ścieżki dostawców znajduje się w `extensions/qa-lab/src/providers/`.
Każdy dostawca posiada własne ustawienia domyślne, uruchamianie lokalnego serwera,
konfigurację modelu Gateway, potrzeby przygotowania profilu auth oraz flagi możliwości live/mock. Współdzielony kod suite i Gateway
powinien przechodzić przez rejestr dostawców zamiast rozgałęziać się po nazwach dostawców.

## Adaptery transportu

`qa-lab` posiada ogólną powierzchnię transportu dla scenariuszy QA w Markdown.
`qa-channel` jest pierwszym adapterem na tej powierzchni, ale cel projektu jest szerszy:
przyszłe rzeczywiste lub syntetyczne kanały powinny podłączać się do tego samego runnera suite
zamiast dodawania runnera QA specyficznego dla transportu.

Na poziomie architektury podział wygląda następująco:

- `qa-lab` odpowiada za ogólne wykonywanie scenariuszy, współbieżność workerów, zapisywanie artefaktów i raportowanie.
- adapter transportu odpowiada za konfigurację Gateway, gotowość, obserwację wejścia i wyjścia, akcje transportu oraz znormalizowany stan transportu.
- pliki scenariuszy Markdown w `qa/scenarios/` definiują uruchomienie testu; `qa-lab` dostarcza wielokrotnego użytku powierzchnię runtime, która je wykonuje.

Wskazówki wdrożeniowe dla maintainerów dotyczące nowych adapterów kanałów znajdują się w
[Testing](/pl/help/testing#adding-a-channel-to-qa).

## Raportowanie

`qa-lab` eksportuje raport protokołu Markdown z obserwowanej osi czasu magistrali.
Raport powinien odpowiadać na pytania:

- Co zadziałało
- Co się nie udało
- Co pozostało zablokowane
- Jakie kolejne scenariusze warto dodać

W przypadku kontroli charakteru i stylu uruchom ten sam scenariusz dla wielu referencji modeli live
i zapisz oceniony raport Markdown:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Polecenie uruchamia lokalne podrzędne procesy Gateway QA, a nie Docker. Scenariusze oceny charakteru
powinny ustawiać personę przez `SOUL.md`, a następnie wykonywać zwykłe tury użytkownika,
takie jak czat, pomoc dotycząca workspace i małe zadania na plikach. Kandydacki model
nie powinien być informowany, że jest oceniany. Polecenie zachowuje każdy pełny
transkrypt, rejestruje podstawowe statystyki uruchomienia, a następnie prosi modele sędziowskie w trybie fast z
rozumowaniem `xhigh`, aby uszeregowały uruchomienia według naturalności, klimatu i humoru.
Użyj `--blind-judge-models` przy porównywaniu dostawców: prompt sędziego nadal otrzymuje
każdy transkrypt i status uruchomienia, ale referencje kandydatów są zastępowane neutralnymi
etykietami, takimi jak `candidate-01`; raport mapuje rankingi z powrotem na rzeczywiste referencje po
parsowaniu.
Uruchomienia kandydatów domyślnie używają myślenia `high`, z `xhigh` dla modeli OpenAI, które to
obsługują. Nadpisz konkretnego kandydata inline za pomocą
`--model provider/model,thinking=<level>`. `--thinking <level>` nadal ustawia
globalną wartość zapasową, a starsza forma `--model-thinking <provider/model=level>` jest
zachowana dla zgodności.
Referencje kandydatów OpenAI domyślnie używają trybu fast, dzięki czemu priorytetowe przetwarzanie jest stosowane tam,
gdzie dostawca je obsługuje. Dodaj inline `,fast`, `,no-fast` lub `,fast=false`, gdy
pojedynczy kandydat lub sędzia wymaga nadpisania. Przekaż `--fast` tylko wtedy, gdy chcesz
wymusić tryb fast dla każdego modelu kandydata. Czasy trwania kandydatów i sędziów są
rejestrowane w raporcie do analizy benchmarków, ale prompty sędziowskie wyraźnie mówią,
aby nie ustalać rankingu według szybkości.
Zarówno uruchomienia modeli kandydatów, jak i sędziów domyślnie używają współbieżności 16. Zmniejsz
`--concurrency` lub `--judge-concurrency`, gdy limity dostawcy lub obciążenie lokalnego Gateway
powodują zbyt duży szum w uruchomieniu.
Gdy nie zostanie przekazany żaden kandydat `--model`, character eval domyślnie używa
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` oraz
`google/gemini-3.1-pro-preview`.
Gdy nie zostanie przekazany żaden `--judge-model`, sędziowie domyślnie używają
`openai/gpt-5.4,thinking=xhigh,fast` oraz
`anthropic/claude-opus-4-6,thinking=high`.

## Powiązana dokumentacja

- [Testing](/pl/help/testing)
- [QA Channel](/pl/channels/qa-channel)
- [Dashboard](/web/dashboard)
