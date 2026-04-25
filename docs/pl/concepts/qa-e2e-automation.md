---
read_when:
    - Rozszerzanie qa-lab lub qa-channel
    - Dodawanie scenariuszy QA opartych na repozytorium
    - Budowanie bardziej realistycznej automatyzacji QA wokół panelu Gateway
summary: Prywatny kształt automatyzacji QA dla qa-lab, qa-channel, scenariuszy inicjalizowanych i raportów protokołu
title: Automatyzacja QA E2E
x-i18n:
    generated_at: "2026-04-25T13:45:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a49e0954845355667617c85340281b6dc1b043857a76d7b303cc0a8b2845a75
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

Prywatny stos QA ma służyć do testowania OpenClaw w sposób bardziej realistyczny,
ukształtowany jak prawdziwy kanał, niż pozwala na to pojedynczy test jednostkowy.

Obecne elementy:

- `extensions/qa-channel`: syntetyczny kanał wiadomości z powierzchniami DM, kanału, wątku,
  reakcji, edycji i usuwania.
- `extensions/qa-lab`: interfejs debuggera i magistrala QA do obserwowania transkryptu,
  wstrzykiwania wiadomości przychodzących oraz eksportowania raportu Markdown.
- `qa/`: zasoby inicjalizujące oparte na repozytorium dla zadania startowego i bazowych
  scenariuszy QA.

Obecny przepływ pracy operatora QA to dwupanelowa witryna QA:

- Po lewej: panel Gateway (Control UI) z agentem.
- Po prawej: QA Lab, pokazujące transkrypt w stylu Slacka i plan scenariusza.

Uruchom za pomocą:

```bash
pnpm qa:lab:up
```

To buduje witrynę QA, uruchamia ścieżkę gateway opartą na Dockerze i udostępnia
stronę QA Lab, gdzie operator lub pętla automatyzacji może dać agentowi misję QA,
obserwować rzeczywiste zachowanie kanału i zapisywać, co zadziałało, co się nie udało
i co pozostało zablokowane.

Aby szybciej iterować nad interfejsem QA Lab bez każdorazowego przebudowywania obrazu Docker,
uruchom stos z bundlerem QA Lab montowanym przez bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` utrzymuje usługi Docker na wcześniej zbudowanym obrazie i montuje przez bind mount
`extensions/qa-lab/web/dist` do kontenera `qa-lab`. `qa:lab:watch`
przebudowuje ten bundle przy zmianach, a przeglądarka automatycznie przeładowuje się, gdy hash zasobów QA Lab się zmieni.

Aby uruchomić ścieżkę smoke Matrix z rzeczywistym transportem, użyj:

```bash
pnpm openclaw qa matrix
```

Ta ścieżka przygotowuje jednorazowy homeserver Tuwunel w Dockerze, rejestruje
tymczasowych użytkowników driver, SUT i observer, tworzy jeden prywatny pokój, a następnie uruchamia
prawdziwy Plugin Matrix wewnątrz podrzędnego gateway QA. Ścieżka transportu na żywo utrzymuje
konfigurację podrzędną ograniczoną do testowanego transportu, więc Matrix działa bez
`qa-channel` w konfiguracji podrzędnej. Zapisuje ustrukturyzowane artefakty raportu oraz
połączony log stdout/stderr w wybranym katalogu wyjściowym Matrix QA. Aby
zarejestrować także zewnętrzne wyjście buildu/uruchamiania `scripts/run-node.mjs`,
ustaw `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` na plik logu lokalny względem repozytorium.
Postęp Matrix jest domyślnie wypisywany. `OPENCLAW_QA_MATRIX_TIMEOUT_MS` ogranicza
całe uruchomienie, a `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` ogranicza czyszczenie, tak aby
zawieszone zamykanie Dockera zgłaszało dokładne polecenie odzyskiwania zamiast wisieć.

Aby uruchomić ścieżkę smoke Telegram z rzeczywistym transportem, użyj:

```bash
pnpm openclaw qa telegram
```

Ta ścieżka jest kierowana do jednej prawdziwej prywatnej grupy Telegram zamiast przygotowywać
jednorazowy serwer. Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` oraz
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, a także dwóch różnych botów w tej samej
prywatnej grupie. Bot SUT musi mieć nazwę użytkownika Telegram, a obserwacja bot-do-bota
działa najlepiej, gdy oba boty mają włączony tryb Bot-to-Bot Communication Mode
w `@BotFather`.
Polecenie kończy się kodem niezerowym, gdy jakikolwiek scenariusz zakończy się niepowodzeniem. Użyj `--allow-failures`, gdy
chcesz uzyskać artefakty bez błędnego kodu wyjścia.
Raport i podsumowanie Telegram zawierają RTT dla każdej odpowiedzi, liczone od żądania
wysłania wiadomości przez driver do zaobserwowanej odpowiedzi SUT, zaczynając od canary.

Przed użyciem współdzielonych poświadczeń live uruchom:

```bash
pnpm openclaw qa credentials doctor
```

Doctor sprawdza zmienne środowiskowe brokera Convex, waliduje ustawienia endpointów i weryfikuje
osiągalność administratora/listy, gdy obecny jest sekret maintainera. Raportuje tylko stan
ustawione/brakujące dla sekretów.

Aby uruchomić ścieżkę smoke Discord z rzeczywistym transportem, użyj:

```bash
pnpm openclaw qa discord
```

Ta ścieżka jest kierowana do jednego prawdziwego prywatnego kanału guild Discord z dwoma botami:
botem driver sterowanym przez harness oraz botem SUT uruchamianym przez podrzędny gateway
OpenClaw za pomocą dołączonego Plugin Discord. Wymaga
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
oraz `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` przy użyciu poświadczeń ze zmiennych środowiskowych.
Ścieżka weryfikuje obsługę wzmianek kanału i sprawdza, czy bot SUT ma
zarejestrowane natywne polecenie `/help` w Discord.
Polecenie kończy się kodem niezerowym, gdy jakikolwiek scenariusz zakończy się niepowodzeniem. Użyj `--allow-failures`, gdy
chcesz uzyskać artefakty bez błędnego kodu wyjścia.

Ścieżki transportu live współdzielą teraz jeden mniejszy kontrakt zamiast wymyślać
własny kształt listy scenariuszy dla każdej z nich:

`qa-channel` pozostaje szerokim syntetycznym zestawem zachowań produktu i nie jest częścią
macierzy pokrycia transportu live.

| Ścieżka  | Canary | Bramka wzmianek | Blokada allowlisty | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Dalszy ciąg wątku | Izolacja wątku | Obserwacja reakcji | Polecenie help | Rejestracja polecenia natywnego |
| -------- | ------ | --------------- | ------------------ | ----------------------------- | ----------------------- | ----------------- | -------------- | ------------------ | -------------- | ------------------------------- |
| Matrix   | x      | x               | x                  | x                             | x                       | x                 | x              | x                  |                |                                 |
| Telegram | x      | x               |                    |                               |                         |                   |                |                    | x              |                                 |
| Discord  | x      | x               |                    |                               |                         |                   |                |                    |                | x                               |

To utrzymuje `qa-channel` jako szeroki zestaw zachowań produktu, podczas gdy Matrix,
Telegram i przyszłe transporty live współdzielą jedną jawną checklistę kontraktu transportowego.

Aby uruchomić jednorazową ścieżkę Linux VM bez wprowadzania Dockera do ścieżki QA, użyj:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

To uruchamia świeżego gościa Multipass, instaluje zależności, buduje OpenClaw
wewnątrz gościa, uruchamia `qa suite`, a następnie kopiuje zwykły raport QA i
podsumowanie z powrotem do `.artifacts/qa-e2e/...` na hoście.
Używa tego samego zachowania wyboru scenariuszy co `qa suite` na hoście.
Uruchomienia hosta i Multipass suite wykonują domyślnie wiele wybranych scenariuszy równolegle
z izolowanymi workerami gateway. `qa-channel` domyślnie używa współbieżności 4,
ograniczonej przez liczbę wybranych scenariuszy. Użyj `--concurrency <count>`, aby dostroić
liczbę workerów, lub `--concurrency 1` dla wykonania seryjnego.
Polecenie kończy się kodem niezerowym, gdy jakikolwiek scenariusz zakończy się niepowodzeniem. Użyj `--allow-failures`, gdy
chcesz uzyskać artefakty bez błędnego kodu wyjścia.
Uruchomienia live przekazują obsługiwane wejścia uwierzytelniania QA, które są praktyczne dla
gościa: klucze dostawców ze zmiennych środowiskowych, ścieżkę konfiguracji dostawcy QA live oraz
`CODEX_HOME`, jeśli jest obecne. Utrzymuj `--output-dir` pod katalogiem głównym repozytorium, aby gość
mógł zapisywać z powrotem przez zamontowany obszar roboczy.

## Zasoby inicjalizujące oparte na repozytorium

Zasoby inicjalizujące znajdują się w `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Celowo znajdują się one w gicie, aby plan QA był widoczny zarówno dla ludzi, jak i dla
agenta.

`qa-lab` powinno pozostać generycznym runnerem Markdown. Każdy plik Markdown scenariusza jest
źródłem prawdy dla jednego przebiegu testowego i powinien definiować:

- metadane scenariusza
- opcjonalne metadane kategorii, możliwości, ścieżki i ryzyka
- odwołania do dokumentacji i kodu
- opcjonalne wymagania Plugin
- opcjonalną łatkę konfiguracji gateway
- wykonywalny `qa-flow`

Wielokrotnego użytku powierzchnia środowiska wykonawczego, która wspiera `qa-flow`, może pozostać generyczna
i przekrojowa. Na przykład scenariusze Markdown mogą łączyć pomocniki po stronie transportu
z pomocnikami po stronie przeglądarki, które sterują osadzonym Control UI przez
seam Gateway `browser.request`, bez dodawania specjalnego runnera.

Pliki scenariuszy powinny być grupowane według możliwości produktu, a nie folderu drzewa źródeł. Utrzymuj
stabilne identyfikatory scenariuszy przy przenoszeniu plików; używaj `docsRefs` i `codeRefs`
do śledzenia implementacji.

Lista bazowa powinna pozostać na tyle szeroka, aby obejmować:

- DM i czat kanałowy
- zachowanie wątków
- cykl życia akcji wiadomości
- wywołania zwrotne Cron
- przywoływanie pamięci
- przełączanie modeli
- przekazywanie do subagenta
- czytanie repozytorium i dokumentacji
- jedno małe zadanie build, takie jak Lobster Invaders

## Ścieżki mock dostawców

`qa suite` ma dwie lokalne ścieżki mock dostawców:

- `mock-openai` to świadomy scenariuszy mock OpenClaw. Pozostaje domyślną
  deterministyczną ścieżką mock dla QA opartego na repozytorium i bramek zgodności.
- `aimock` uruchamia serwer dostawcy oparty na AIMock dla eksperymentalnego pokrycia protokołu,
  fixture, record/replay i chaos. Jest dodatkiem i nie zastępuje dispatcher scenariuszy `mock-openai`.

Implementacja ścieżki dostawcy znajduje się w `extensions/qa-lab/src/providers/`.
Każdy dostawca zarządza własnymi ustawieniami domyślnymi, uruchamianiem lokalnego serwera,
konfiguracją modelu gateway, potrzebami przygotowania profilu uwierzytelniania
oraz flagami możliwości live/mock. Wspólny kod suite i gateway powinien kierować przez rejestr dostawców zamiast rozgałęziać się według nazw dostawców.

## Adaptery transportu

`qa-lab` zarządza generycznym seam transportu dla scenariuszy QA w Markdown.
`qa-channel` jest pierwszym adapterem na tym seamie, ale docelowy projekt jest szerszy:
przyszłe rzeczywiste lub syntetyczne kanały powinny włączać się do tego samego runnera suite
zamiast dodawać runner QA specyficzny dla transportu.

Na poziomie architektury podział wygląda tak:

- `qa-lab` zarządza generycznym wykonywaniem scenariuszy, współbieżnością workerów, zapisem artefaktów i raportowaniem.
- adapter transportu zarządza konfiguracją gateway, gotowością, obserwacją wejścia i wyjścia, działaniami transportu oraz znormalizowanym stanem transportu.
- pliki scenariuszy Markdown w `qa/scenarios/` definiują przebieg testu; `qa-lab` zapewnia wielokrotnego użytku powierzchnię środowiska wykonawczego, która je wykonuje.

Wskazówki wdrożeniowe dla maintainerów dotyczące nowych adapterów kanałów znajdują się w
[Testing](/pl/help/testing#adding-a-channel-to-qa).

## Raportowanie

`qa-lab` eksportuje raport protokołu Markdown na podstawie obserwowanej osi czasu magistrali.
Raport powinien odpowiadać na pytania:

- Co zadziałało
- Co się nie udało
- Co pozostało zablokowane
- Jakie scenariusze uzupełniające warto dodać

W celu sprawdzenia charakteru i stylu uruchom ten sam scenariusz na wielu referencjach modeli live
i zapisz oceniany raport Markdown:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=medium,fast \
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

Polecenie uruchamia lokalne podrzędne procesy gateway QA, a nie Docker. Scenariusze character eval
powinny ustawiać personę przez `SOUL.md`, a następnie uruchamiać zwykłe tury użytkownika,
takie jak czat, pomoc w obszarze roboczym i małe zadania na plikach. Modelowi kandydującemu
nie należy mówić, że jest oceniany. Polecenie zachowuje każdy pełny
transkrypt, zapisuje podstawowe statystyki uruchomienia, a następnie prosi modele sędziujące w trybie fast z
rozumowaniem `xhigh`, gdzie jest obsługiwane, o uszeregowanie uruchomień według naturalności, klimatu i humoru.
Używaj `--blind-judge-models` przy porównywaniu dostawców: prompt sędziujący nadal otrzymuje
każdy transkrypt i status uruchomienia, ale referencje kandydatów są zastępowane neutralnymi
etykietami, takimi jak `candidate-01`; raport mapuje rankingi z powrotem na rzeczywiste referencje po parsowaniu.
Uruchomienia kandydatów domyślnie używają thinking `high`, z `medium` dla GPT-5.4 i `xhigh`
dla starszych referencji ewaluacyjnych OpenAI, które to obsługują. Nadpisz konkretnego kandydata inline przez
`--model provider/model,thinking=<level>`. `--thinking <level>` nadal ustawia
globalne ustawienie rezerwowe, a starsza forma `--model-thinking <provider/model=level>` jest
zachowana dla zgodności.
Referencje kandydatów OpenAI domyślnie używają trybu fast, aby stosować przetwarzanie priorytetowe tam, gdzie
dostawca to obsługuje. Dodaj inline `,fast`, `,no-fast` lub `,fast=false`, gdy
pojedynczy kandydat lub sędzia wymaga nadpisania. Przekaż `--fast` tylko wtedy, gdy chcesz
wymusić tryb fast dla każdego modelu kandydującego. Czasy trwania kandydatów i sędziów są
zapisywane w raporcie do analizy porównawczej, ale prompty sędziujące wyraźnie mówią,
aby nie szeregować według szybkości.
Zarówno uruchomienia modeli kandydatów, jak i sędziów domyślnie używają współbieżności 16. Zmniejsz
`--concurrency` lub `--judge-concurrency`, gdy limity dostawcy lub obciążenie lokalnego gateway
powodują, że uruchomienie staje się zbyt zaszumione.
Gdy nie przekażesz żadnego kandydującego `--model`, character eval domyślnie używa
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` oraz
`google/gemini-3.1-pro-preview`, jeśli nie przekażesz `--model`.
Gdy nie przekażesz `--judge-model`, sędziowie domyślnie używają
`openai/gpt-5.4,thinking=xhigh,fast` oraz
`anthropic/claude-opus-4-6,thinking=high`.

## Powiązane dokumenty

- [Testing](/pl/help/testing)
- [QA Channel](/pl/channels/qa-channel)
- [Dashboard](/pl/web/dashboard)
