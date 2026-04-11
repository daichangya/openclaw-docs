---
read_when:
    - Rozszerzanie qa-lab lub qa-channel
    - Dodawanie scenariuszy QA wspieranych przez repozytorium
    - Budowanie bardziej realistycznej automatyzacji QA wokół panelu Gateway
summary: Prywatny kształt automatyzacji QA dla qa-lab, qa-channel, scenariuszy seedowanych i raportów protokołu
title: Automatyzacja QA E2E
x-i18n:
    generated_at: "2026-04-11T02:44:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5427b505e26bfd542e984e3920c3f7cb825473959195ba9737eff5da944c60d0
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automatyzacja QA E2E

Prywatny stos QA ma na celu testowanie OpenClaw w sposób bardziej realistyczny,
ukształtowany przez kanały, niż pozwala na to pojedynczy test jednostkowy.

Obecne elementy:

- `extensions/qa-channel`: syntetyczny kanał wiadomości z powierzchniami DM, kanału, wątku,
  reakcji, edycji i usuwania.
- `extensions/qa-lab`: interfejs debuggera i magistrala QA do obserwowania transkryptu,
  wstrzykiwania wiadomości przychodzących i eksportowania raportu Markdown.
- `qa/`: zasoby seedowane wspierane przez repozytorium dla zadania początkowego i bazowych
  scenariuszy QA.

Obecny przepływ pracy operatora QA to dwupanelowa witryna QA:

- Po lewej: panel Gateway (Control UI) z agentem.
- Po prawej: QA Lab, pokazujący transkrypt w stylu Slacka i plan scenariusza.

Uruchom to poleceniem:

```bash
pnpm qa:lab:up
```

To buduje witrynę QA, uruchamia ścieżkę gateway wspieraną przez Docker i udostępnia
stronę QA Lab, na której operator lub pętla automatyzacji może zlecić agentowi
misję QA, obserwować rzeczywiste zachowanie kanału oraz zapisywać, co działało,
co zawiodło i co pozostało zablokowane.

Aby szybciej iterować nad interfejsem QA Lab bez przebudowywania obrazu Docker przy każdej zmianie,
uruchom stos z podmontowanym pakietem QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` utrzymuje usługi Docker na wcześniej zbudowanym obrazie i bind-mountuje
`extensions/qa-lab/web/dist` do kontenera `qa-lab`. `qa:lab:watch`
przebudowuje ten pakiet przy zmianach, a przeglądarka automatycznie przeładowuje się,
gdy zmienia się hash zasobu QA Lab.

Aby uruchomić ścieżkę smoke Matrix z rzeczywistym transportem, użyj:

```bash
pnpm openclaw qa matrix
```

Ta ścieżka przygotowuje jednorazowy homeserver Tuwunel w Dockerze, rejestruje
tymczasowych użytkowników driver, SUT i observer, tworzy jeden prywatny pokój,
a następnie uruchamia rzeczywistą wtyczkę Matrix wewnątrz podrzędnego procesu QA gateway. Ścieżka z żywym transportem utrzymuje konfigurację procesu podrzędnego ograniczoną do testowanego transportu, dzięki czemu Matrix działa bez
`qa-channel` w konfiguracji procesu podrzędnego.

Aby uruchomić ścieżkę smoke Telegram z rzeczywistym transportem, użyj:

```bash
pnpm openclaw qa telegram
```

Ta ścieżka celuje w jedną rzeczywistą prywatną grupę Telegram zamiast przygotowywać
jednorazowy serwer. Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` oraz
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, a także dwóch różnych botów w tej samej
prywatnej grupie. Bot SUT musi mieć nazwę użytkownika Telegram, a obserwacja bot-bot
działa najlepiej, gdy oba boty mają włączony tryb Bot-to-Bot Communication Mode
w `@BotFather`.

Ścieżki z żywym transportem współdzielą teraz jeden mniejszy kontrakt zamiast tego,
by każda definiowała własny kształt listy scenariuszy:

`qa-channel` pozostaje szerokim syntetycznym zestawem zachowań produktu i nie jest częścią
macierzy pokrycia żywego transportu.

| Ścieżka  | Canary | Bramka wzmianek | Blokada allowlisty | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Dalszy ciąg w wątku | Izolacja wątku | Obserwacja reakcji | Polecenie pomocy |
| -------- | ------ | --------------- | ------------------ | ----------------------------- | ----------------------- | ------------------- | -------------- | ------------------ | ---------------- |
| Matrix   | x      | x               | x                  | x                             | x                       | x                   | x              | x                  |                  |
| Telegram | x      |                 |                    |                               |                         |                     |                |                    | x                |

Dzięki temu `qa-channel` pozostaje szerokim zestawem zachowań produktu, podczas gdy Matrix,
Telegram i przyszłe żywe transporty współdzielą jedną jawną checklistę kontraktu transportu.

Aby uruchomić jednorazową ścieżkę na maszynie wirtualnej Linux bez włączania Dockera do ścieżki QA, użyj:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

To uruchamia świeżego gościa Multipass, instaluje zależności, buduje OpenClaw
wewnątrz gościa, uruchamia `qa suite`, a następnie kopiuje standardowy raport QA
i podsumowanie z powrotem do `.artifacts/qa-e2e/...` na hoście.
Wykorzystuje to samo zachowanie wyboru scenariuszy co `qa suite` na hoście.
Uruchomienia hosta i Multipass domyślnie wykonują wiele wybranych scenariuszy równolegle
z izolowanymi workerami gateway, do 64 workerów lub liczby wybranych scenariuszy.
Użyj `--concurrency <count>`, aby dostroić liczbę workerów, albo
`--concurrency 1` do wykonania szeregowego.
Uruchomienia live przekazują obsługiwane wejścia uwierzytelniania QA, które są praktyczne dla
gościa: klucze dostawców oparte na env, ścieżkę konfiguracji dostawcy QA live oraz
`CODEX_HOME`, jeśli jest obecne. Utrzymuj `--output-dir` pod katalogiem głównym repozytorium, aby gość
mógł zapisywać z powrotem przez zamontowany obszar roboczy.

## Seedy wspierane przez repozytorium

Zasoby seedów znajdują się w `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Są one celowo przechowywane w git, aby plan QA był widoczny zarówno dla ludzi, jak i dla
agenta. Lista bazowa powinna pozostać na tyle szeroka, aby obejmować:

- czat DM i kanałowy
- zachowanie wątków
- cykl życia akcji wiadomości
- wywołania cron
- przywoływanie pamięci
- przełączanie modeli
- przekazanie do subagenta
- czytanie repozytorium i dokumentacji
- jedno małe zadanie build, takie jak Lobster Invaders

## Raportowanie

`qa-lab` eksportuje raport protokołu Markdown z obserwowanej osi czasu magistrali.
Raport powinien odpowiadać na pytania:

- Co zadziałało
- Co zawiodło
- Co pozostało zablokowane
- Jakie scenariusze uzupełniające warto dodać

W celu sprawdzania charakteru i stylu uruchom ten sam scenariusz dla wielu referencji modeli live
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

Polecenie uruchamia lokalne podrzędne procesy QA gateway, a nie Docker. Scenariusze
oceny charakteru powinny ustawiać personę przez `SOUL.md`, a następnie uruchamiać zwykłe
tury użytkownika, takie jak czat, pomoc dotyczącą obszaru roboczego i małe zadania na plikach. Kandydatowi
nie należy mówić, że jest oceniany. Polecenie zachowuje każdy pełny
transkrypt, rejestruje podstawowe statystyki uruchomienia, a następnie prosi modele sędziujące w trybie fast z
rozumowaniem `xhigh` o uszeregowanie uruchomień według naturalności, klimatu i humoru.
Użyj `--blind-judge-models` podczas porównywania dostawców: prompt sędziego nadal otrzymuje
każdy transkrypt i status uruchomienia, ale referencje kandydatów są zastępowane neutralnymi
etykietami, takimi jak `candidate-01`; raport mapuje rankingi z powrotem na rzeczywiste referencje po
parsowaniu.
Uruchomienia kandydatów domyślnie używają `high` thinking, z `xhigh` dla modeli OpenAI, które to
obsługują. Zastąp konkretnego kandydata inline przez
`--model provider/model,thinking=<level>`. `--thinking <level>` nadal ustawia
globalny fallback, a starsza forma `--model-thinking <provider/model=level>` jest
zachowana dla kompatybilności.
Referencje kandydatów OpenAI domyślnie używają trybu fast, aby korzystać z przetwarzania priorytetowego tam,
gdzie dostawca to obsługuje. Dodaj inline `,fast`, `,no-fast` lub `,fast=false`, gdy
pojedynczy kandydat lub sędzia wymaga nadpisania. Przekaż `--fast` tylko wtedy, gdy chcesz
wymusić tryb fast dla każdego modelu kandydata. Czas trwania uruchomień kandydatów i sędziów jest
rejestrowany w raporcie na potrzeby analizy porównawczej, ale prompty sędziów wyraźnie mówią,
aby nie tworzyć rankingu według szybkości.
Uruchomienia modeli kandydatów i sędziów domyślnie używają współbieżności 16. Zmniejsz
`--concurrency` lub `--judge-concurrency`, gdy limity dostawcy lub obciążenie lokalnego gateway
powodują, że uruchomienie jest zbyt zaszumione.
Gdy nie zostanie przekazany żaden kandydat `--model`, ocena charakteru domyślnie używa
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` oraz
`google/gemini-3.1-pro-preview`, gdy nie zostanie przekazane `--model`.
Gdy nie zostanie przekazane `--judge-model`, sędziowie domyślnie używają
`openai/gpt-5.4,thinking=xhigh,fast` oraz
`anthropic/claude-opus-4-6,thinking=high`.

## Powiązana dokumentacja

- [Testing](/pl/help/testing)
- [QA Channel](/pl/channels/qa-channel)
- [Dashboard](/web/dashboard)
