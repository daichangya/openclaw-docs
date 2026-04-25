---
read_when:
    - Utrzymujesz Plugin OpenClaw.
    - Widzisz ostrzeżenie o zgodności Pluginu.
    - Planujesz migrację SDK Pluginu lub manifestu.
summary: Kontrakty zgodności Pluginów, metadane wycofań i oczekiwania dotyczące migracji
title: Zgodność Pluginów
x-i18n:
    generated_at: "2026-04-25T13:52:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02e0cdbc763eed5a38b303fc44202ddd36e58bce43dc29b6348db3f5fea66f26
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw utrzymuje starsze kontrakty Pluginów podłączone przez nazwane
adaptery zgodności, zanim je usunie. Chroni to istniejące dołączone i zewnętrzne
Pluginy, podczas gdy kontrakty SDK, manifestu, konfiguracji, setupu i runtime’u
agenta ewoluują.

## Rejestr zgodności

Kontrakty zgodności Pluginów są śledzone w głównym rejestrze pod adresem
`src/plugins/compat/registry.ts`.

Każdy rekord ma:

- stabilny kod zgodności
- status: `active`, `deprecated`, `removal-pending` lub `removed`
- właściciela: SDK, config, setup, channel, provider, wykonanie Pluginu, runtime agenta
  lub core
- daty wprowadzenia i wycofania, gdy mają zastosowanie
- wskazówki dotyczące zamiennika
- dokumentację, diagnostykę i testy, które obejmują stare i nowe zachowanie

Rejestr jest źródłem dla planowania maintainerów i przyszłych kontroli inspektora
Pluginów. Jeśli zachowanie skierowane do Pluginu się zmienia, dodaj lub zaktualizuj
rekord zgodności w tej samej zmianie, która dodaje adapter.

## Pakiet inspektora Pluginów

Inspektor Pluginów powinien znajdować się poza głównym repo OpenClaw jako osobny
pakiet/repozytorium oparty na wersjonowanych kontraktach zgodności i manifestu.

CLI pierwszego dnia powinno wyglądać tak:

```sh
openclaw-plugin-inspector ./my-plugin
```

Powinno emitować:

- walidację manifestu/schematu
- wersję kontraktu zgodności, która jest sprawdzana
- kontrole metadanych instalacji/źródła
- kontrole importu cold-path
- ostrzeżenia o wycofaniach i zgodności

Użyj `--json`, aby uzyskać stabilne wyjście czytelne maszynowo dla adnotacji CI. Core
OpenClaw powinno udostępniać kontrakty i fixture’y, które inspektor może wykorzystywać, ale
nie powinno publikować binarki inspektora z głównego pakietu `openclaw`.

## Polityka wycofań

OpenClaw nie powinien usuwać udokumentowanego kontraktu Pluginu w tym samym wydaniu,
w którym wprowadza jego zamiennik.

Sekwencja migracji wygląda następująco:

1. Dodaj nowy kontrakt.
2. Zachowaj stare zachowanie podłączone przez nazwany adapter zgodności.
3. Emituj diagnostykę lub ostrzeżenia, gdy autorzy Pluginów mogą podjąć działanie.
4. Udokumentuj zamiennik i harmonogram.
5. Przetestuj zarówno starą, jak i nową ścieżkę.
6. Odczekaj ogłoszone okno migracji.
7. Usuwaj tylko po jawnym zatwierdzeniu wydania łamiącego zgodność.

Rekordy wycofane muszą zawierać datę rozpoczęcia ostrzeżeń, zamiennik, link do dokumentacji
i docelową datę usunięcia, gdy jest znana.

## Bieżące obszary zgodności

Bieżące rekordy zgodności obejmują:

- starsze szerokie importy SDK, takie jak `openclaw/plugin-sdk/compat`
- starsze kształty Pluginów oparte wyłącznie na hookach oraz `before_agent_start`
- allowlistę dołączonych Pluginów i zachowanie ich włączania
- starsze metadane manifestu env-var dla dostawców/kanałów
- wskazówki aktywacji, które są zastępowane przez własność wkładów manifestu
- aliasy nazw `embeddedHarness` i `agent-harness`, podczas gdy nazewnictwo publiczne
  przesuwa się w stronę `agentRuntime`
- fallback generowanych metadanych konfiguracji dołączonych kanałów, podczas gdy
  wdrażane są metadane `channelConfigs` oparte najpierw na rejestrze

Nowy kod Pluginów powinien preferować zamiennik wymieniony w rejestrze i w
konkretnym przewodniku migracji. Istniejące Pluginy mogą nadal używać ścieżki zgodności,
dopóki dokumentacja, diagnostyka i informacje o wydaniu nie ogłoszą okna usunięcia.

## Informacje o wydaniu

Informacje o wydaniu powinny zawierać nadchodzące wycofania Pluginów wraz z datami docelowymi i
linkami do dokumentacji migracji. To ostrzeżenie musi pojawić się, zanim ścieżka zgodności
przejdzie do `removal-pending` lub `removed`.
