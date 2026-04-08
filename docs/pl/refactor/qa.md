---
x-i18n:
    generated_at: "2026-04-08T02:18:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e156cc8e2fe946a0423862f937754a7caa1fe7e6863b50a80bff49a1c86e1e8
    source_path: refactor/qa.md
    workflow: 15
---

# Refaktoryzacja QA

Status: wdrożono podstawową migrację.

## Cel

Przenieść QA OpenClaw z modelu rozdzielonych definicji do jednego źródła prawdy:

- metadane scenariusza
- prompty wysyłane do modelu
- konfiguracja i czyszczenie
- logika harnessu
- asercje i kryteria sukcesu
- artefakty i wskazówki do raportów

Pożądanym stanem końcowym jest generyczny harness QA, który wczytuje rozbudowane pliki definicji scenariuszy zamiast kodować większość zachowania na sztywno w TypeScript.

## Stan obecny

Główne źródło prawdy znajduje się teraz w `qa/scenarios.md`.

Zaimplementowano:

- `qa/scenarios.md`
  - kanoniczny pakiet QA
  - tożsamość operatora
  - misja startowa
  - metadane scenariuszy
  - powiązania handlerów
- `extensions/qa-lab/src/scenario-catalog.ts`
  - parser pakietu Markdown + walidacja zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - renderowanie planu z pakietu Markdown
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - inicjuje wygenerowane pliki zgodności oraz `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - wybiera wykonywalne scenariusze przez powiązania handlerów zdefiniowane w Markdown
- Protokół magistrali QA + UI
  - generyczne załączniki inline do renderowania obrazów/wideo/audio/plików

Pozostałe rozdzielone powierzchnie:

- `extensions/qa-lab/src/suite.ts`
  - nadal zawiera większość wykonywalnej niestandardowej logiki handlerów
- `extensions/qa-lab/src/report.ts`
  - nadal wyprowadza strukturę raportu z wyników runtime

Czyli rozdział źródła prawdy został naprawiony, ale wykonanie nadal jest w większości oparte na handlerach, a nie w pełni deklaratywne.

## Jak naprawdę wygląda powierzchnia scenariuszy

Odczyt obecnego zestawu pokazuje kilka odrębnych klas scenariuszy.

### Prosta interakcja

- bazowy kanał
- bazowe DM
- follow-up w wątku
- przełączanie modelu
- kontynuacja po zatwierdzeniu
- reakcja/edycja/usunięcie

### Mutacja konfiguracji i runtime

- wyłączenie skilla przez poprawkę config
- wybudzenie po restarcie po `config apply`
- przełączenie możliwości po restarcie config
- sprawdzenie dryfu inwentarza runtime

### Asercje systemu plików i repozytorium

- raport wykrywania source/docs
- zbudowanie Lobster Invaders
- wyszukiwanie artefaktu wygenerowanego obrazu

### Orkiestracja pamięci

- przywołanie pamięci
- narzędzia pamięci w kontekście kanału
- fallback po błędzie pamięci
- ranking pamięci sesji
- izolacja pamięci wątków
- przegląd memory dreaming

### Integracja narzędzi i wtyczek

- wywołanie MCP plugin-tools
- widoczność skilli
- hot install skilla
- natywne generowanie obrazów
- image roundtrip
- rozumienie obrazu z załącznika

### Wieloturowe i wieloosobowe

- przekazanie do podagenta
- synteza fanout podagentów
- przepływy w stylu odzyskiwania po restarcie

Te kategorie są istotne, ponieważ determinują wymagania DSL. Płaska lista promptów + oczekiwanego tekstu nie wystarczy.

## Kierunek

### Jedno źródło prawdy

Używać `qa/scenarios.md` jako redagowanego źródła prawdy.

Pakiet powinien pozostać:

- czytelny dla człowieka podczas przeglądu
- możliwy do sparsowania maszynowo
- wystarczająco bogaty, aby napędzać:
  - wykonywanie zestawu
  - bootstrap workspace QA
  - metadane UI QA Lab
  - prompty dokumentacji/wykrywania
  - generowanie raportów

### Preferowany format redagowania

Używać Markdown jako formatu najwyższego poziomu, z osadzonym w nim strukturalnym YAML.

Zalecany kształt:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - nadpisania modelu/dostawcy
  - wymagania wstępne
- sekcje prozatorskie
  - cel
  - uwagi
  - wskazówki do debugowania
- otoczone blokami YAML
  - setup
  - steps
  - assertions
  - cleanup

Daje to:

- lepszą czytelność PR niż ogromny JSON
- bogatszy kontekst niż czysty YAML
- ścisłe parsowanie i walidację zod

Surowy JSON jest akceptowalny tylko jako pośrednia forma wygenerowana.

## Proponowany kształt pliku scenariusza

Przykład:

````md
---
id: image-generation-roundtrip
title: Roundtrip generowania obrazów
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

# Cel

Zweryfikować, że wygenerowane media są ponownie dołączane w turze follow-up.

# Konfiguracja

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

# Kroki

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Kontrola generowania obrazu: wygeneruj obraz latarni morskiej QA i podsumuj go w jednym krótkim zdaniu.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Kontrola generowania obrazu
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Kontrola inspekcji obrazu po roundtrip: opisz wygenerowany załącznik z latarnią morską w jednym krótkim zdaniu.
  attachments:
    - fromArtifact: lighthouseImage
```

# Oczekiwania

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Kontrola inspekcji obrazu po roundtrip
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## Możliwości runnera, które DSL musi obejmować

Na podstawie obecnego zestawu generyczny runner potrzebuje więcej niż wykonywania promptów.

### Działania środowiskowe i konfiguracyjne

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Działania tur agenta

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### Działania konfiguracji i runtime

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### Działania na plikach i artefaktach

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Działania pamięci i cron

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### Działania MCP

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

## Zmienne i odwołania do artefaktów

DSL musi obsługiwać zapisane wyniki i późniejsze odwołania.

Przykłady z obecnego zestawu:

- utworzyć wątek, a potem ponownie użyć `threadId`
- utworzyć sesję, a potem ponownie użyć `sessionKey`
- wygenerować obraz, a potem dołączyć plik w następnej turze
- wygenerować ciąg markera wybudzenia, a potem potwierdzić, że pojawia się później

Potrzebne możliwości:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- typowane odwołania do ścieżek, kluczy sesji, identyfikatorów wątków, markerów, wyników narzędzi

Bez obsługi zmiennych harness będzie dalej przeciekał logiką scenariuszy z powrotem do TypeScript.

## Co powinno pozostać jako furtki awaryjne

W pełni czysto deklaratywny runner nie jest realistyczny w fazie 1.

Niektóre scenariusze są z natury silnie oparte na orkiestracji:

- przegląd memory dreaming
- wybudzenie po restarcie po `config apply`
- przełączenie możliwości po restarcie config
- rozwiązywanie artefaktów wygenerowanych obrazów po znaczniku czasu/ścieżce
- ocena raportu wykrywania

Na razie powinny używać jawnych niestandardowych handlerów.

Zalecana zasada:

- 85-90% deklaratywnie
- jawne kroki `customHandler` dla trudnej reszty
- tylko nazwane i udokumentowane niestandardowe handlery
- bez anonimowego kodu inline w pliku scenariusza

To utrzymuje generyczny silnik w czystości, a jednocześnie pozwala robić postęp.

## Zmiana architektury

### Obecnie

Markdown scenariuszy jest już źródłem prawdy dla:

- wykonywania zestawu
- plików bootstrap workspace
- katalogu scenariuszy UI QA Lab
- metadanych raportów
- promptów wykrywania

Wygenerowana zgodność:

- zainicjalizowany workspace nadal zawiera `QA_KICKOFF_TASK.md`
- zainicjalizowany workspace nadal zawiera `QA_SCENARIO_PLAN.md`
- zainicjalizowany workspace zawiera teraz także `QA_SCENARIOS.md`

## Plan refaktoryzacji

### Faza 1: loader i schemat

Gotowe.

- dodano `qa/scenarios.md`
- dodano parser dla nazwanej zawartości pakietu Markdown YAML
- zwalidowano przez zod
- przełączono odbiorców na sparsowany pakiet
- usunięto pliki repo-level `qa/seed-scenarios.json` i `qa/QA_KICKOFF_TASK.md`

### Faza 2: generyczny silnik

- podzielić `extensions/qa-lab/src/suite.ts` na:
  - loader
  - silnik
  - rejestr akcji
  - rejestr asercji
  - niestandardowe handlery
- zachować istniejące funkcje pomocnicze jako operacje silnika

Rezultat:

- silnik wykonuje proste scenariusze deklaratywne

Zacząć od scenariuszy, które są głównie prompt + wait + assert:

- follow-up w wątku
- rozumienie obrazu z załącznika
- widoczność i wywołanie skillów
- bazowy kanał

Rezultat:

- pierwsze rzeczywiste scenariusze zdefiniowane w Markdown dostarczane przez generyczny silnik

### Faza 4: migracja scenariuszy średniej trudności

- roundtrip generowania obrazów
- narzędzia pamięci w kontekście kanału
- ranking pamięci sesji
- przekazanie do podagenta
- synteza fanout podagentów

Rezultat:

- sprawdzona obsługa zmiennych, artefaktów, asercji narzędzi i asercji request-log

### Faza 5: pozostawienie trudnych scenariuszy na niestandardowych handlerach

- przegląd memory dreaming
- wybudzenie po restarcie po `config apply`
- przełączenie możliwości po restarcie config
- dryf inwentarza runtime

Rezultat:

- ten sam format redagowania, ale z jawnymi blokami niestandardowych kroków tam, gdzie są potrzebne

### Faza 6: usunięcie mapy scenariuszy zakodowanej na sztywno

Gdy pokrycie pakietu będzie wystarczająco dobre:

- usunąć większość rozgałęzień TypeScript specyficznych dla scenariuszy z `extensions/qa-lab/src/suite.ts`

## Fałszywy Slack / obsługa rozbudowanych mediów

Obecna magistrala QA jest zorientowana głównie na tekst.

Powiązane pliki:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

Dzisiaj magistrala QA obsługuje:

- tekst
- reakcje
- wątki

Nie modeluje jeszcze załączników multimedialnych inline.

### Potrzebny kontrakt transportowy

Dodać generyczny model załączników magistrali QA:

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

Następnie dodać `attachments?: QaBusAttachment[]` do:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### Dlaczego najpierw generycznie

Nie budować modelu mediów tylko dla Slacka.

Zamiast tego:

- jeden generyczny model transportu QA
- wiele rendererów nad nim
  - obecny czat QA Lab
  - przyszły fałszywy Slack web
  - dowolne inne widoki fałszywego transportu

To zapobiega duplikacji logiki i pozwala scenariuszom medialnym pozostać niezależnymi od transportu.

### Potrzebne prace w UI

Zaktualizować UI QA tak, aby renderowało:

- podgląd obrazu inline
- odtwarzacz audio inline
- odtwarzacz wideo inline
- chip załącznika pliku

Obecne UI potrafi już renderować wątki i reakcje, więc renderowanie załączników powinno zostać dołożone do tego samego modelu kart wiadomości.

### Prace scenariuszowe umożliwione przez transport mediów

Gdy załączniki zaczną przepływać przez magistralę QA, będzie można dodać bogatsze scenariusze fałszywego czatu:

- odpowiedź z obrazem inline w fałszywym Slacku
- rozumienie załącznika audio
- rozumienie załącznika wideo
- mieszana kolejność załączników
- odpowiedź w wątku z zachowaniem mediów

## Rekomendacja

Kolejny etap implementacji powinien wyglądać tak:

1. dodać loader scenariuszy Markdown + schemat zod
2. wygenerować obecny katalog z Markdown
3. najpierw zmigrować kilka prostych scenariuszy
4. dodać generyczne wsparcie załączników magistrali QA
5. renderować obraz inline w UI QA
6. następnie rozszerzyć na audio i wideo

To najmniejsza ścieżka, która potwierdza oba cele:

- generyczne QA definiowane w Markdown
- bogatsze fałszywe powierzchnie wiadomości

## Otwarte pytania

- czy pliki scenariuszy powinny pozwalać na osadzone szablony promptów Markdown z interpolacją zmiennych
- czy setup/cleanup powinny być nazwanymi sekcjami, czy po prostu uporządkowanymi listami akcji
- czy odwołania do artefaktów powinny być silnie typowane w schemacie, czy oparte na stringach
- czy niestandardowe handlery powinny żyć w jednym rejestrze, czy w rejestrach per-surface
- czy wygenerowany plik zgodności JSON powinien pozostać zacommitowany podczas migracji
