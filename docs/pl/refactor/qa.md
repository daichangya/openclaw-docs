---
read_when:
    - Refaktoryzacja definicji scenariuszy QA lub kodu harnessu qa-lab
    - Przenoszenie zachowania QA między scenariuszami Markdown a logiką harnessu TypeScript
summary: Plan refaktoryzacji QA dla katalogu scenariuszy i konsolidacji harnessu
title: Refaktoryzacja QA
x-i18n:
    generated_at: "2026-04-23T10:08:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16867d5be372ab414aa516144193144414c326ea53a52627f3ff91f85b8fdf9d
    source_path: refactor/qa.md
    workflow: 15
---

# Refaktoryzacja QA

Status: migracja bazowa została wdrożona.

## Cel

Przenieść QA OpenClaw z modelu rozdzielonych definicji do jednego źródła prawdy:

- metadane scenariusza
- prompty wysyłane do modelu
- setup i teardown
- logika harnessu
- asercje i kryteria sukcesu
- artefakty i podpowiedzi raportu

Pożądanym stanem końcowym jest generyczny harness QA, który ładuje rozbudowane pliki definicji scenariuszy zamiast hardcodować większość zachowania w TypeScript.

## Stan obecny

Podstawowe źródło prawdy znajduje się teraz w `qa/scenarios/index.md` oraz po jednym pliku na
scenariusz w `qa/scenarios/<theme>/*.md`.

Wdrożone:

- `qa/scenarios/index.md`
  - kanoniczne metadane pakietu QA
  - tożsamość operatora
  - misja kickoff
- `qa/scenarios/<theme>/*.md`
  - jeden plik markdown na scenariusz
  - metadane scenariusza
  - powiązania handlerów
  - konfiguracja wykonania specyficzna dla scenariusza
- `extensions/qa-lab/src/scenario-catalog.ts`
  - parser pakietu markdown + walidacja zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - renderowanie planu z pakietu markdown
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - seeduje wygenerowane pliki zgodności plus `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - wybiera wykonywalne scenariusze przez powiązania handlerów zdefiniowane w markdown
- protokół + UI magistrali QA
  - generyczne załączniki inline do renderowania obrazów/wideo/audio/plików

Pozostałe rozdzielone powierzchnie:

- `extensions/qa-lab/src/suite.ts`
  - nadal posiada większość wykonywalnej logiki niestandardowych handlerów
- `extensions/qa-lab/src/report.ts`
  - nadal wyprowadza strukturę raportu z wyników runtime

Czyli rozdział źródła prawdy został naprawiony, ale wykonanie nadal w większości opiera się na handlerach zamiast być w pełni deklaratywne.

## Jak wygląda rzeczywista powierzchnia scenariusza

Odczyt aktualnego suite pokazuje kilka różnych klas scenariuszy.

### Prosta interakcja

- baseline kanału
- baseline DM
- follow-up w wątku
- przełączanie modelu
- dokończenie zatwierdzenia
- reakcja/edycja/usunięcie

### Mutacja konfiguracji i runtime

- config patch skill disable
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift check

### Asercje filesystem i repozytorium

- source/docs discovery report
- build Lobster Invaders
- generated image artifact lookup

### Orkiestracja pamięci

- memory recall
- memory tools in channel context
- memory failure fallback
- session memory ranking
- thread memory isolation
- memory dreaming sweep

### Integracja narzędzi i pluginów

- MCP plugin-tools call
- skill visibility
- skill hot install
- native image generation
- image roundtrip
- image understanding from attachment

### Wiele tur i wielu aktorów

- subagent handoff
- subagent fanout synthesis
- przepływy w stylu odzyskiwania po restarcie

Te kategorie mają znaczenie, ponieważ wyznaczają wymagania DSL. Płaska lista prompt + oczekiwany tekst nie wystarczy.

## Kierunek

### Jedno źródło prawdy

Używaj `qa/scenarios/index.md` oraz `qa/scenarios/<theme>/*.md` jako autorskiego
źródła prawdy.

Pakiet powinien pozostać:

- czytelny dla człowieka podczas review
- parsowalny maszynowo
- wystarczająco bogaty, by napędzać:
  - wykonanie suite
  - bootstrap workspace QA
  - metadane UI QA Lab
  - prompty docs/discovery
  - generowanie raportów

### Preferowany format autorski

Używaj Markdown jako formatu najwyższego poziomu, z ustrukturyzowanym YAML wewnątrz.

Zalecany kształt:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - nadpisania model/provider
  - prerequisites
- sekcje prose
  - objective
  - notes
  - debugging hints
- blokowane sekcje YAML
  - setup
  - steps
  - assertions
  - cleanup

Daje to:

- lepszą czytelność PR niż wielki JSON
- bogatszy kontekst niż czysty YAML
- ścisłe parsowanie i walidację zod

Surowy JSON jest akceptowalny tylko jako pośrednia forma wygenerowana.

## Proponowany kształt pliku scenariusza

Przykład:

````md
---
id: image-generation-roundtrip
title: Image generation roundtrip
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# Objective

Verify generated media is reattached on the follow-up turn.

# Setup

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# Steps

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Image generation check: generate a QA lighthouse image and summarize it in one short sentence.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Image generation check
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Roundtrip image inspection check: describe the generated lighthouse attachment in one short sentence.
  attachments:
    - fromArtifact: lighthouseImage
```

# Expect

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Roundtrip image inspection check
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## Możliwości runnera, które DSL musi pokryć

Na podstawie obecnego suite generyczny runner potrzebuje czegoś więcej niż wykonania promptów.

### Akcje środowiska i setupu

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Akcje tury agenta

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### Akcje konfiguracji i runtime

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### Akcje plików i artefaktów

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Akcje pamięci i Cron

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### Akcje MCP

- `mcp.callTool`

### Asercje

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## Zmienne i referencje artefaktów

DSL musi obsługiwać zapisane wyniki i późniejsze odwołania.

Przykłady z obecnego suite:

- utworzyć wątek, a potem ponownie użyć `threadId`
- utworzyć sesję, a potem ponownie użyć `sessionKey`
- wygenerować obraz, a następnie dołączyć plik w następnej turze
- wygenerować string wake marker, a następnie sprawdzić, czy pojawia się później

Potrzebne możliwości:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- typowane referencje dla ścieżek, kluczy sesji, ID wątków, markerów, wyników narzędzi

Bez obsługi zmiennych harness będzie nadal przeciekał logiką scenariuszy z powrotem do TypeScript.

## Co powinno pozostać jako escape hatch

W pełni czysto deklaratywny runner nie jest realistyczny w fazie 1.

Niektóre scenariusze są z natury ciężkie orkiestracyjnie:

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- generated image artifact resolution by timestamp/path
- discovery-report evaluation

Na razie powinny używać jawnych custom handlerów.

Zalecana reguła:

- 85-90% deklaratywnie
- jawne kroki `customHandler` dla trudnej reszty
- tylko nazwane i udokumentowane custom handlery
- bez anonimowego kodu inline w pliku scenariusza

Dzięki temu generyczny silnik pozostaje czysty, a jednocześnie możliwy jest postęp.

## Zmiana architektury

### Obecnie

Markdown scenariuszy jest już źródłem prawdy dla:

- wykonania suite
- plików bootstrap workspace
- katalogu scenariuszy UI QA Lab
- metadanych raportu
- promptów discovery

Wygenerowana zgodność:

- seedowany workspace nadal zawiera `QA_KICKOFF_TASK.md`
- seedowany workspace nadal zawiera `QA_SCENARIO_PLAN.md`
- seedowany workspace zawiera teraz też `QA_SCENARIOS.md`

## Plan refaktoryzacji

### Faza 1: loader i schema

Gotowe.

- dodano `qa/scenarios/index.md`
- podzielono scenariusze na `qa/scenarios/<theme>/*.md`
- dodano parser dla nazwanej zawartości YAML w pakiecie markdown
- zwalidowano przez zod
- przełączono konsumentów na sparsowany pakiet
- usunięto repozytoryjne `qa/seed-scenarios.json` i `qa/QA_KICKOFF_TASK.md`

### Faza 2: silnik generyczny

- podziel `extensions/qa-lab/src/suite.ts` na:
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- zachowaj istniejące funkcje pomocnicze jako operacje silnika

Rezultat:

- silnik wykonuje proste scenariusze deklaratywne

Zacznij od scenariuszy, które są głównie prompt + wait + assert:

- threaded follow-up
- image understanding from attachment
- skill visibility and invocation
- channel baseline

Rezultat:

- pierwsze rzeczywiste scenariusze zdefiniowane w markdown dostarczane przez generyczny silnik

### Faza 4: migracja scenariuszy średniej trudności

- image generation roundtrip
- memory tools in channel context
- session memory ranking
- subagent handoff
- subagent fanout synthesis

Rezultat:

- udowodnione działanie zmiennych, artefaktów, asercji narzędzi i asercji request-log

### Faza 5: pozostaw trudne scenariusze na custom handlerach

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift

Rezultat:

- ten sam format autorski, ale z jawnymi blokami custom-step tam, gdzie potrzeba

### Faza 6: usuń hardcodowaną mapę scenariuszy

Gdy pokrycie pakietu będzie wystarczająco dobre:

- usuń większość rozgałęzień TypeScript specyficznych dla scenariuszy z `extensions/qa-lab/src/suite.ts`

## Fake Slack / wsparcie rich media

Obecna magistrala QA jest text-first.

Istotne pliki:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

Dziś magistrala QA obsługuje:

- tekst
- reakcje
- wątki

Nie modeluje jeszcze załączników mediów inline.

### Potrzebny kontrakt transportu

Dodaj generyczny model załącznika magistrali QA:

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

Następnie dodaj `attachments?: QaBusAttachment[]` do:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### Dlaczego najpierw generycznie

Nie buduj modelu mediów tylko dla Slack.

Zamiast tego:

- jeden generyczny model transportu QA
- wiele rendererów nad nim
  - obecny czat QA Lab
  - przyszły fake Slack web
  - dowolne inne widoki fake transportu

To zapobiega duplikacji logiki i pozwala scenariuszom mediów pozostać niezależnymi od transportu.

### Potrzebna praca po stronie UI

Zaktualizuj UI QA, aby renderował:

- podgląd obrazu inline
- odtwarzacz audio inline
- odtwarzacz wideo inline
- chip załącznika pliku

Obecne UI potrafi już renderować wątki i reakcje, więc renderowanie załączników powinno zostać nałożone na ten sam model kart wiadomości.

### Praca nad scenariuszami odblokowana przez transport mediów

Gdy załączniki popłyną przez magistralę QA, będzie można dodać bogatsze scenariusze fake-chat:

- odpowiedź z obrazem inline w fake Slack
- rozumienie załącznika audio
- rozumienie załącznika wideo
- mieszane kolejności załączników
- odpowiedź w wątku z zachowaniem mediów

## Rekomendacja

Następny fragment implementacji powinien wyglądać tak:

1. dodaj loader scenariuszy markdown + schema zod
2. wygeneruj obecny katalog z markdown
3. najpierw zmigruj kilka prostych scenariuszy
4. dodaj generyczną obsługę załączników magistrali QA
5. renderuj obraz inline w UI QA
6. potem rozszerz na audio i wideo

To najmniejsza ścieżka, która dowodzi obu celów:

- generyczne QA definiowane w markdown
- bogatsze fake powierzchnie komunikacyjne

## Otwarte pytania

- czy pliki scenariuszy powinny dopuszczać osadzone szablony promptów w Markdown z interpolacją zmiennych
- czy setup/cleanup powinny być nazwanymi sekcjami, czy tylko uporządkowanymi listami akcji
- czy referencje artefaktów powinny być silnie typowane w schemacie, czy oparte na stringach
- czy custom handlery powinny znajdować się w jednym rejestrze, czy w rejestrach per-surface
- czy wygenerowany plik zgodności JSON powinien pozostać commitowany w trakcie migracji
