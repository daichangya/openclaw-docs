---
read_when:
    - Utrzymujesz plugin OpenClaw
    - Widzisz ostrzeżenie o zgodności pluginu
    - Planujesz migrację SDK pluginu lub manifestu pluginu
summary: Kontrakty zgodności pluginów, metadane deprecacji i oczekiwania migracyjne
title: Zgodność pluginów
x-i18n:
    generated_at: "2026-04-26T11:36:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b4e11dc57c29eac72844b91bec75a9d48005bbd3c89a2a9d7a5634ab782e5fc
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw utrzymuje starsze kontrakty pluginów podłączone przez nazwane adaptery
zgodności, zanim je usunie. Chroni to istniejące pluginy dołączone i zewnętrzne,
podczas gdy ewoluują kontrakty SDK, manifestu, setupu, konfiguracji i runtime agenta.

## Rejestr zgodności

Kontrakty zgodności pluginów są śledzone w głównym rejestrze pod
`src/plugins/compat/registry.ts`.

Każdy rekord ma:

- stabilny kod zgodności
- status: `active`, `deprecated`, `removal-pending` lub `removed`
- właściciela: SDK, config, setup, channel, provider, wykonanie pluginu, agent runtime
  lub core
- daty wprowadzenia i deprecacji, jeśli mają zastosowanie
- wskazówki dotyczące zamiennika
- dokumentację, diagnostykę i testy obejmujące stare i nowe zachowanie

Rejestr jest źródłem dla planowania maintainerów i przyszłych kontroli inspektora
pluginów. Jeśli zachowanie skierowane do pluginów się zmienia, dodaj lub zaktualizuj
rekord zgodności w tej samej zmianie, która dodaje adapter.

Naprawy doctor i zgodność migracji są śledzone osobno pod
`src/commands/doctor/shared/deprecation-compat.ts`. Te rekordy obejmują stare
kształty konfiguracji, układy install-ledger i shimy naprawcze, które mogą
musieć pozostać dostępne po usunięciu ścieżki zgodności runtime.

Przeglądy wydaniowe powinny sprawdzać oba rejestry. Nie usuwaj migracji doctor
tylko dlatego, że wygasł odpowiadający jej rekord zgodności runtime lub config; najpierw
zweryfikuj, że nie istnieje obsługiwana ścieżka aktualizacji, która nadal wymaga tej naprawy.
Ponownie weryfikuj też każdą adnotację zamiennika podczas planowania wydania, ponieważ
własność pluginów i ślad konfiguracji mogą się zmieniać, gdy providery i kanały są wynoszone z
core.

## Pakiet inspektora pluginów

Inspektor pluginów powinien znajdować się poza głównym repo OpenClaw jako osobny
pakiet/repozytorium oparty na wersjonowanych kontraktach zgodności i manifestu.

CLI pierwszego dnia powinno wyglądać tak:

```sh
openclaw-plugin-inspector ./my-plugin
```

Powinien emitować:

- walidację manifestu/schematu
- wersję kontraktu zgodności, która jest sprawdzana
- kontrole metadanych instalacji/źródła
- kontrole importu zimnej ścieżki
- ostrzeżenia o deprecacji i zgodności

Używaj `--json`, aby uzyskać stabilne wyjście czytelne maszynowo w adnotacjach CI. Core
OpenClaw powinno udostępniać kontrakty i fixture’y, z których może korzystać inspektor, ale
nie powinno publikować binarki inspektora z głównego pakietu `openclaw`.

## Polityka deprecacji

OpenClaw nie powinien usuwać udokumentowanego kontraktu pluginu w tym samym wydaniu,
w którym wprowadza jego zamiennik.

Sekwencja migracji wygląda następująco:

1. Dodaj nowy kontrakt.
2. Utrzymuj stare zachowanie podłączone przez nazwany adapter zgodności.
3. Emituj diagnostykę lub ostrzeżenia, gdy autorzy pluginów mogą podjąć działanie.
4. Udokumentuj zamiennik i harmonogram.
5. Przetestuj zarówno stare, jak i nowe ścieżki.
6. Odczekaj ogłoszone okno migracji.
7. Usuwaj tylko po uzyskaniu jawnej zgody na wydanie łamiące zgodność.

Rekordy oznaczone jako deprecated muszą zawierać datę rozpoczęcia ostrzeżeń, zamiennik, link do dokumentacji
oraz ostateczną datę usunięcia nie później niż trzy miesiące po rozpoczęciu ostrzeżeń. Nie
dodawaj zdeprecjonowanej ścieżki zgodności z otwartym oknem usunięcia, chyba że
maintainerzy jawnie zdecydują, że jest to trwała zgodność, i oznaczą ją zamiast tego jako `active`.

## Bieżące obszary zgodności

Bieżące rekordy zgodności obejmują:

- starsze szerokie importy SDK, takie jak `openclaw/plugin-sdk/compat`
- starsze kształty pluginów oparte tylko na hookach i `before_agent_start`
- starsze entrypointy pluginów `activate(api)`, podczas gdy pluginy migrują do
  `register(api)`
- starsze aliasy SDK, takie jak `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, konstruktory statusu `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/test-utils` oraz aliasy typów `ClawdbotConfig` /
  `OpenClawSchemaType`
- zachowanie allowlist i enablement dołączonych pluginów
- starsze metadane manifestu zmiennych środowiskowych providera/kanału
- starsze hooki pluginów providera i aliasy typów, podczas gdy providery przechodzą na
  jawne hooki katalogu, auth, thinking, replay i transport
- starsze aliasy runtime, takie jak `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession` oraz `api.runtime.stt`
- starszą rozdzieloną rejestrację pluginów pamięci, podczas gdy pluginy pamięci przechodzą do
  `registerMemoryCapability`
- starsze helpery SDK kanałów dla natywnych schematów wiadomości, bramkowania wzmianek,
  formatowania inbound envelope i zagnieżdżania możliwości zatwierdzania
- podpowiedzi aktywacji zastępowane przez własność wkładów manifestu
- fallback runtime `setup-api`, podczas gdy deskryptory setup przechodzą do zimnych
  metadanych `setup.requiresRuntime: false`
- hooki providera `discovery`, podczas gdy hooki katalogu providera przechodzą do
  `catalog.run(...)`
- metadane kanałów `showConfigured` / `showInSetup`, podczas gdy pakiety kanałów przechodzą
  do `openclaw.channel.exposure`
- starsze klucze konfiguracji polityki runtime, podczas gdy doctor migruje operatorów do
  `agentRuntime`
- fallback wygenerowanych metadanych konfiguracji dołączonych kanałów, podczas gdy lądują
  metadane `channelConfigs` typu registry-first
- utrwalone flagi env wyłączania rejestru pluginów i migracji instalacji, podczas gdy
  przebiegi naprawcze migrują operatorów do `openclaw plugins registry --refresh` i
  `openclaw doctor --fix`
- starsze ścieżki konfiguracji web search, web fetch i x_search należące do pluginów, podczas gdy
  doctor migruje je do `plugins.entries.<plugin>.config`
- starszą autorską konfigurację `plugins.installs` i aliasy ścieżek ładowania dołączonych pluginów, podczas gdy metadane instalacji przechodzą do stanu zarządzanego przez plugin ledger

Nowy kod pluginów powinien preferować zamiennik wymieniony w rejestrze i w
konkretnym przewodniku migracyjnym. Istniejące pluginy mogą nadal używać ścieżki zgodności,
dopóki dokumentacja, diagnostyka i informacje o wydaniu nie ogłoszą okna usunięcia.

## Informacje o wydaniu

Informacje o wydaniu powinny zawierać nadchodzące deprecacje pluginów z docelowymi datami i
linkami do dokumentacji migracyjnej. To ostrzeżenie musi pojawić się przed tym, jak ścieżka zgodności przejdzie do `removal-pending` lub `removed`.
