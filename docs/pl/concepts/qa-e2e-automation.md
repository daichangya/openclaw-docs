---
read_when:
    - Rozszerzanie qa-lab lub qa-channel
    - Dodawanie scenariuszy QA wspieranych przez repozytorium
    - Budowanie automatyzacji QA o wyższym poziomie realizmu wokół panelu Gateway
summary: Prywatna struktura automatyzacji QA dla qa-lab, qa-channel, scenariuszy seedowanych i raportów protokołu
title: Automatyzacja QA E2E
x-i18n:
    generated_at: "2026-04-23T10:00:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: a967a74d2e70b042e9443c5ec954902b820d2e5a22cbecd9be74af13b9085553
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automatyzacja QA E2E

Prywatny stos QA ma na celu testowanie OpenClaw w sposób bardziej realistyczny,
ukształtowany przez kanały, niż może to zrobić pojedynczy test jednostkowy.

Obecne elementy:

- `extensions/qa-channel`: syntetyczny kanał wiadomości z powierzchniami DM, kanału, wątku,
  reakcji, edycji i usuwania.
- `extensions/qa-lab`: interfejs debuggera i magistrala QA do obserwowania transkryptu,
  wstrzykiwania wiadomości przychodzących i eksportowania raportu Markdown.
- `qa/`: zasoby seedowane wspierane przez repozytorium dla zadania startowego i bazowych
  scenariuszy QA.

Obecny przepływ pracy operatora QA to dwupanelowa witryna QA:

- Po lewej: panel Gateway (Control UI) z agentem.
- Po prawej: QA Lab, pokazujący transkrypt w stylu Slack i plan scenariusza.

Uruchom za pomocą:

```bash
pnpm qa:lab:up
```

To buduje witrynę QA, uruchamia opartą na Docker ścieżkę gateway i udostępnia
stronę QA Lab, na której operator lub pętla automatyzacji może przydzielić agentowi
misję QA, obserwować rzeczywiste zachowanie kanału i zapisywać, co zadziałało, co się nie udało
lub co pozostało zablokowane.

Aby szybciej iterować nad interfejsem QA Lab bez przebudowywania obrazu Docker za każdym razem,
uruchom stos z podmontowanym bundelem QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` utrzymuje usługi Docker na wcześniej zbudowanym obrazie i bind-mountuje
`extensions/qa-lab/web/dist` do kontenera `qa-lab`. `qa:lab:watch`
przebudowuje ten bundle przy zmianach, a przeglądarka automatycznie przeładowuje się, gdy hash
zasobów QA Lab ulegnie zmianie.

Aby uruchomić ścieżkę smoke Matrix z rzeczywistym transportem, wykonaj:

```bash
pnpm openclaw qa matrix
```

Ta ścieżka tworzy jednorazowy homeserver Tuwunel w Docker, rejestruje
tymczasowych użytkowników driver, SUT i observer, tworzy jeden prywatny pokój, a następnie uruchamia
rzeczywisty plugin Matrix wewnątrz podrzędnego gateway QA. Ścieżka z żywym transportem utrzymuje
konfigurację podrzędną ograniczoną do testowanego transportu, więc Matrix działa bez
`qa-channel` w konfiguracji podrzędnej. Zapisuje ustrukturyzowane artefakty raportu oraz
połączony log stdout/stderr do wybranego katalogu wyjściowego Matrix QA. Aby
przechwycić także zewnętrzne dane wyjściowe builda/launchera `scripts/run-node.mjs`, ustaw
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` na plik logu lokalny względem repozytorium.

Aby uruchomić ścieżkę smoke Telegram z rzeczywistym transportem, wykonaj:

```bash
pnpm openclaw qa telegram
```

Ta ścieżka celuje w jedną rzeczywistą prywatną grupę Telegram zamiast tworzyć
jednorazowy serwer. Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` oraz
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, a także dwóch różnych botów w tej samej
prywatnej grupie. Bot SUT musi mieć nazwę użytkownika Telegram, a obserwacja bot-do-bota
działa najlepiej, gdy oba boty mają włączony tryb Bot-to-Bot Communication Mode
w `@BotFather`.
Polecenie kończy się kodem niezerowym, gdy którykolwiek scenariusz zakończy się niepowodzeniem. Użyj `--allow-failures`, gdy
chcesz uzyskać artefakty bez kończenia z kodem błędu.
Raport i podsumowanie Telegram zawierają RTT dla każdej odpowiedzi od chwili wysłania wiadomości
przez driver do chwili zaobserwowania odpowiedzi SUT, zaczynając od canary.

Ścieżki z żywym transportem współdzielą teraz jeden mniejszy kontrakt zamiast tego, by każda tworzyła
własny kształt listy scenariuszy:

`qa-channel` pozostaje szerokim syntetycznym zestawem zachowań produktu i nie jest częścią macierzy pokrycia
żywego transportu.

| Lane     | Canary | Kontrola wzmianki | Blokada allowlisty | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Dalszy ciąg wątku | Izolacja wątku | Obserwacja reakcji | Polecenie help |
| -------- | ------ | ----------------- | ------------------ | ----------------------------- | ----------------------- | ----------------- | -------------- | ------------------ | -------------- |
| Matrix   | x      | x                 | x                  | x                             | x                       | x                 | x              | x                  |                |
| Telegram | x      |                   |                    |                               |                         |                   |                |                    | x              |

Pozwala to zachować `qa-channel` jako szeroki zestaw zachowań produktu, podczas gdy Matrix,
Telegram i przyszłe żywe transporty współdzielą jedną jawną listę kontrolną kontraktu transportowego.

Aby uruchomić jednorazową ścieżkę Linux VM bez włączania Docker do ścieżki QA, wykonaj:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

To uruchamia nowego gościa Multipass, instaluje zależności, buduje OpenClaw
wewnątrz gościa, uruchamia `qa suite`, a następnie kopiuje zwykły raport QA i
podsumowanie z powrotem do `.artifacts/qa-e2e/...` na hoście.
Wykorzystuje to samo zachowanie wyboru scenariuszy co `qa suite` na hoście.
Uruchomienia hosta i Multipass wykonują domyślnie wiele wybranych scenariuszy równolegle
z izolowanymi workerami gateway. `qa-channel` domyślnie używa współbieżności 4,
ograniczonej liczbą wybranych scenariuszy. Użyj `--concurrency <count>`, aby dostroić
liczbę workerów, albo `--concurrency 1` dla wykonania szeregowego.
Polecenie kończy się kodem niezerowym, gdy którykolwiek scenariusz zakończy się niepowodzeniem. Użyj `--allow-failures`, gdy
chcesz uzyskać artefakty bez kończenia z kodem błędu.
Uruchomienia live przekazują obsługiwane wejścia uwierzytelniania QA, które są praktyczne dla
gościa: klucze dostawców oparte na env, ścieżkę konfiguracji dostawcy QA live oraz
`CODEX_HOME`, gdy jest obecne. Zachowaj `--output-dir` pod katalogiem głównym repozytorium, aby gość
mógł zapisać dane z powrotem przez zamontowany workspace.

## Seedy wspierane przez repozytorium

Zasoby seedowane znajdują się w `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Celowo znajdują się one w git, aby plan QA był widoczny zarówno dla ludzi, jak i
dla agenta.

`qa-lab` powinno pozostać ogólnym runnerem Markdown. Każdy plik scenariusza Markdown jest
źródłem prawdy dla jednego uruchomienia testowego i powinien definiować:

- metadane scenariusza
- opcjonalne metadane kategorii, capability, lane i ryzyka
- odwołania do dokumentacji i kodu
- opcjonalne wymagania pluginów
- opcjonalną łatkę konfiguracji gateway
- wykonywalny `qa-flow`

Współdzielona powierzchnia runtime obsługująca `qa-flow` może pozostać ogólna
i przekrojowa. Na przykład scenariusze Markdown mogą łączyć pomocniki po stronie
transportu z pomocnikami po stronie przeglądarki, które sterują osadzonym Control UI przez
szczelinę Gateway `browser.request`, bez dodawania runnera specjalnego przypadku.

Pliki scenariuszy powinny być grupowane według capability produktu, a nie według folderu
drzewa źródłowego. Zachowuj stabilność identyfikatorów scenariuszy przy przenoszeniu plików; używaj
`docsRefs` i `codeRefs` dla śledzenia implementacji.

Lista bazowa powinna pozostać wystarczająco szeroka, aby obejmować:

- czat DM i kanałowy
- zachowanie wątków
- cykl życia działań wiadomości
- callbacki Cron
- przywoływanie pamięci
- przełączanie modeli
- przekazanie do subagenta
- czytanie repozytorium i dokumentacji
- jedno małe zadanie build, takie jak Lobster Invaders

## Ścieżki z mockami dostawców

`qa suite` ma dwie lokalne ścieżki mocków dostawców:

- `mock-openai` to świadomy scenariuszy mock OpenClaw. Pozostaje domyślną
  deterministyczną ścieżką mocków dla QA wspieranego przez repozytorium i bramek zgodności.
- `aimock` uruchamia serwer dostawcy oparty na AIMock dla eksperymentalnego pokrycia protokołu,
  fixture, record/replay i chaos. Jest dodatkiem i nie zastępuje dispatcher-a scenariuszy `mock-openai`.

Implementacja ścieżki dostawcy znajduje się w `extensions/qa-lab/src/providers/`.
Każdy dostawca posiada własne ustawienia domyślne, uruchamianie lokalnego serwera,
konfigurację modelu gateway, potrzeby przygotowania profilu uwierzytelniania oraz flagi capability
live/mock. Współdzielony kod suite i gateway powinien kierować przez rejestr dostawców zamiast rozgałęziać się po nazwach dostawców.

## Adaptery transportu

`qa-lab` posiada ogólną szczelinę transportu dla scenariuszy QA Markdown.
`qa-channel` jest pierwszym adapterem tej szczeliny, ale docelowo projekt ma szerszy zakres:
przyszłe rzeczywiste lub syntetyczne kanały powinny podłączać się do tego samego runnera suite
zamiast dodawać runner QA specyficzny dla transportu.

Na poziomie architektury podział wygląda tak:

- `qa-lab` odpowiada za ogólne wykonywanie scenariuszy, współbieżność workerów, zapisywanie artefaktów i raportowanie.
- adapter transportu odpowiada za konfigurację gateway, gotowość, obserwację wejścia i wyjścia, działania transportu oraz znormalizowany stan transportu.
- pliki scenariuszy Markdown w `qa/scenarios/` definiują uruchomienie testowe; `qa-lab` udostępnia wielokrotnego użytku powierzchnię runtime, która je wykonuje.

Wskazówki wdrożeniowe dla maintainerów dodających nowe adaptery kanałów znajdują się w
[Testing](/pl/help/testing#adding-a-channel-to-qa).

## Raportowanie

`qa-lab` eksportuje raport protokołu Markdown na podstawie obserwowanej osi czasu magistrali.
Raport powinien odpowiadać na pytania:

- Co zadziałało
- Co się nie udało
- Co pozostało zablokowane
- Jakie scenariusze uzupełniające warto dodać

W przypadku kontroli charakteru i stylu uruchom ten sam scenariusz z wieloma żywymi referencjami modeli
i zapisz oceniany raport Markdown:

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

Polecenie uruchamia lokalne podrzędne procesy gateway QA, a nie Docker. Scenariusze oceny charakteru
powinny ustawiać personę przez `SOUL.md`, a następnie uruchamiać zwykłe tury użytkownika,
takie jak czat, pomoc dotycząca workspace i małe zadania na plikach. Kandydat modelu
nie powinien być informowany, że jest oceniany. Polecenie zachowuje każdy pełny
transkrypt, zapisuje podstawowe statystyki uruchomienia, a następnie prosi modele oceniające w trybie fast z
rozumowaniem `xhigh` o uszeregowanie uruchomień według naturalności, vibe i humoru.
Użyj `--blind-judge-models` przy porównywaniu dostawców: prompt oceniający nadal otrzymuje
każdy transkrypt i stan uruchomienia, ale referencje kandydatów są zastępowane neutralnymi
etykietami takimi jak `candidate-01`; raport mapuje rankingi z powrotem na rzeczywiste referencje po
parsowaniu.
Uruchomienia kandydatów domyślnie używają `high` thinking, a dla modeli OpenAI `xhigh`, jeśli
jest obsługiwane. Nadpisz konkretnego kandydata inline przez
`--model provider/model,thinking=<level>`. `--thinking <level>` nadal ustawia
globalną wartość zapasową, a starsza forma `--model-thinking <provider/model=level>` jest
zachowana dla zgodności.
Referencje kandydatów OpenAI domyślnie używają trybu fast, aby wykorzystywać przetwarzanie priorytetowe tam,
gdzie dostawca je obsługuje. Dodaj inline `,fast`, `,no-fast` lub `,fast=false`, gdy
pojedynczy kandydat lub oceniający wymaga nadpisania. Przekaż `--fast` tylko wtedy, gdy chcesz
wymusić tryb fast dla każdego modelu kandydata. Czasy trwania kandydatów i modeli oceniających są
zapisywane w raporcie do analizy porównawczej, ale prompty oceniające wyraźnie mówią,
aby nie oceniać według szybkości.
Uruchomienia modeli kandydatów i oceniających domyślnie używają współbieżności 16. Zmniejsz
`--concurrency` lub `--judge-concurrency`, gdy limity dostawców albo obciążenie lokalnego gateway
powodują zbyt duży szum.
Gdy nie zostanie przekazane żadne `--model` dla kandydata, ocena charakteru domyślnie używa
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` oraz
`google/gemini-3.1-pro-preview`, gdy nie zostanie przekazane `--model`.
Gdy nie zostanie przekazane żadne `--judge-model`, oceniający domyślnie używają
`openai/gpt-5.4,thinking=xhigh,fast` oraz
`anthropic/claude-opus-4-6,thinking=high`.

## Powiązana dokumentacja

- [Testing](/pl/help/testing)
- [QA Channel](/pl/channels/qa-channel)
- [Panel](/pl/web/dashboard)
