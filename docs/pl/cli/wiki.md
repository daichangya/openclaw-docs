---
read_when:
    - Chcesz używać CLI memory-wiki
    - Dokumentujesz lub zmieniasz `openclaw wiki`
summary: Dokumentacja CLI dla `openclaw wiki` (stan sejfu memory-wiki, search, compile, lint, apply, bridge oraz pomocniki Obsidian)
title: wiki
x-i18n:
    generated_at: "2026-04-23T09:59:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: e94908532c35da4edf488266ddc6eee06e8f7833eeba5f2b5c0c7d5d45b65eef
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

Sprawdzanie i utrzymanie sejfu `memory-wiki`.

Dostarczane przez bundlowany Plugin `memory-wiki`.

Powiązane:

- [Plugin Memory Wiki](/pl/plugins/memory-wiki)
- [Przegląd pamięci](/pl/concepts/memory)
- [CLI: memory](/pl/cli/memory)

## Do czego służy

Użyj `openclaw wiki`, gdy chcesz mieć skompilowany sejf wiedzy z:

- wyszukiwaniem natywnym dla wiki i odczytem stron
- syntezami bogatymi w pochodzenie
- raportami sprzeczności i świeżości
- importami mostkowymi z aktywnego Pluginu pamięci
- opcjonalnymi pomocnikami CLI Obsidian

## Typowe polecenia

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Polecenia

### `wiki status`

Sprawdza bieżący tryb sejfu, kondycję i dostępność CLI Obsidian.

Użyj tego najpierw, jeśli nie masz pewności, czy sejf został zainicjalizowany, czy tryb bridge
jest zdrowy albo czy integracja z Obsidian jest dostępna.

### `wiki doctor`

Uruchamia kontrole kondycji wiki i ujawnia problemy z konfiguracją lub sejfem.

Typowe problemy:

- włączony tryb bridge bez publicznych artefaktów pamięci
- nieprawidłowy lub brakujący układ sejfu
- brak zewnętrznego CLI Obsidian, gdy oczekiwany jest tryb Obsidian

### `wiki init`

Tworzy układ sejfu wiki i strony startowe.

To inicjalizuje strukturę główną, w tym indeksy najwyższego poziomu i katalogi
pamięci podręcznej.

### `wiki ingest <path-or-url>`

Importuje zawartość do warstwy źródłowej wiki.

Uwagi:

- ingest URL-i jest kontrolowany przez `ingest.allowUrlIngest`
- zaimportowane strony źródłowe zachowują pochodzenie w frontmatter
- po ingescie może uruchomić się automatyczne kompilowanie, jeśli jest włączone

### `wiki compile`

Przebudowuje indeksy, powiązane bloki, dashboardy i skompilowane digesty.

Zapisuje to stabilne artefakty skierowane do maszyny w:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Jeśli włączone jest `render.createDashboards`, compile odświeża także strony raportów.

### `wiki lint`

Sprawdza sejf i raportuje:

- problemy strukturalne
- luki w pochodzeniu
- sprzeczności
- otwarte pytania
- strony/claimy o niskiej pewności
- nieaktualne strony/claimy

Uruchom to po istotnych aktualizacjach wiki.

### `wiki search <query>`

Przeszukuje zawartość wiki.

Zachowanie zależy od konfiguracji:

- `search.backend`: `shared` lub `local`
- `search.corpus`: `wiki`, `memory` lub `all`

Użyj `wiki search`, gdy zależy Ci na rankingu specyficznym dla wiki albo na szczegółach pochodzenia.
Do jednego szerokiego wspólnego przebiegu przywołania preferuj `openclaw memory search`, gdy
aktywny Plugin pamięci udostępnia wspólne wyszukiwanie.

### `wiki get <lookup>`

Odczytuje stronę wiki według ID albo ścieżki względnej.

Przykłady:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Stosuje wąskie mutacje bez swobodnego ręcznego przerabiania strony.

Obsługiwane przepływy obejmują:

- tworzenie/aktualizację strony syntezy
- aktualizację metadanych strony
- dołączanie ID źródeł
- dodawanie pytań
- dodawanie sprzeczności
- aktualizację confidence/status
- zapisywanie ustrukturyzowanych claimów

To polecenie istnieje po to, aby wiki mogła bezpiecznie ewoluować bez ręcznej edycji
zarządzanych bloków.

### `wiki bridge import`

Importuje publiczne artefakty pamięci z aktywnego Pluginu pamięci do stron źródłowych
opartych na bridge.

Użyj tego w trybie `bridge`, gdy chcesz wciągnąć do sejfu wiki najnowsze eksportowane
artefakty pamięci.

### `wiki unsafe-local import`

Importuje z jawnie skonfigurowanych lokalnych ścieżek w trybie `unsafe-local`.

To jest celowo eksperymentalne i działa tylko na tej samej maszynie.

### `wiki obsidian ...`

Polecenia pomocnicze Obsidian dla sejfów działających w trybie przyjaznym Obsidian.

Podpolecenia:

- `status`
- `search`
- `open`
- `command`
- `daily`

Wymagają oficjalnego CLI `obsidian` w `PATH`, gdy
włączone jest `obsidian.useOfficialCli`.

## Praktyczne wskazówki użycia

- Używaj `wiki search` + `wiki get`, gdy znaczenie mają pochodzenie i tożsamość strony.
- Używaj `wiki apply` zamiast ręcznego edytowania zarządzanych wygenerowanych sekcji.
- Używaj `wiki lint`, zanim zaufasz sprzecznym treściom albo treściom o niskiej pewności.
- Używaj `wiki compile` po zbiorczych importach albo zmianach źródeł, gdy chcesz od razu mieć świeże
  dashboardy i skompilowane digesty.
- Używaj `wiki bridge import`, gdy tryb bridge zależy od nowo eksportowanych artefaktów
  pamięci.

## Powiązania z konfiguracją

Zachowanie `openclaw wiki` kształtują:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Zobacz [Plugin Memory Wiki](/pl/plugins/memory-wiki), aby poznać pełny model konfiguracji.
