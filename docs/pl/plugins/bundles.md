---
read_when:
    - Chcesz zainstalować bundle zgodny z Codex, Claude lub Cursor
    - Musisz zrozumieć, jak OpenClaw mapuje zawartość bundla na natywne funkcje
    - Debugujesz wykrywanie bundla lub brakujące możliwości
summary: Instaluj i używaj bundli Codex, Claude i Cursor jako Pluginów OpenClaw
title: Bundle Pluginów
x-i18n:
    generated_at: "2026-04-23T10:03:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd5ac067546429412f8f4fd2c0da22005686c2d4377944ecd078f56054223f9b
    source_path: plugins/bundles.md
    workflow: 15
---

# Bundle Pluginów

OpenClaw może instalować Pluginy z trzech zewnętrznych ekosystemów: **Codex**, **Claude**
i **Cursor**. Są one nazywane **bundlami** — pakietami zawartości i metadanych, które
OpenClaw mapuje na natywne funkcje, takie jak Skills, hooki i narzędzia MCP.

<Info>
  Bundle **nie są** tym samym co natywne Pluginy OpenClaw. Natywne Pluginy działają
  w procesie i mogą rejestrować dowolną możliwość. Bundle to pakiety zawartości z
  selektywnym mapowaniem funkcji i węższą granicą zaufania.
</Info>

## Dlaczego bundle istnieją

Wiele przydatnych Pluginów jest publikowanych w formacie Codex, Claude lub Cursor. Zamiast
wymagać od autorów przepisywania ich jako natywnych Pluginów OpenClaw, OpenClaw
wykrywa te formaty i mapuje ich obsługiwaną zawartość na natywny zestaw funkcji.
Oznacza to, że możesz zainstalować pakiet poleceń Claude lub bundle Skills Codex
i od razu z niego korzystać.

## Instalacja bundla

<Steps>
  <Step title="Zainstaluj z katalogu, archiwum lub marketplace">
    ```bash
    # Katalog lokalny
    openclaw plugins install ./my-bundle

    # Archiwum
    openclaw plugins install ./my-bundle.tgz

    # Marketplace Claude
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Zweryfikuj wykrycie">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Bundle są pokazywane jako `Format: bundle` z podtypem `codex`, `claude` lub `cursor`.

  </Step>

  <Step title="Uruchom ponownie i używaj">
    ```bash
    openclaw gateway restart
    ```

    Zmapowane funkcje (Skills, hooki, narzędzia MCP, domyślne ustawienia LSP) są dostępne w następnej sesji.

  </Step>
</Steps>

## Co OpenClaw mapuje z bundli

Nie każda funkcja bundla działa dziś w OpenClaw. Oto co działa, a co
jest wykrywane, ale jeszcze niepodłączone.

### Obecnie obsługiwane

| Funkcja        | Jak jest mapowana                                                                            | Dotyczy         |
| -------------- | -------------------------------------------------------------------------------------------- | --------------- |
| Zawartość Skills | Rooty Skills bundla są ładowane jako zwykłe Skills OpenClaw                               | Wszystkie formaty |
| Polecenia      | `commands/` i `.cursor/commands/` są traktowane jako rooty Skills                            | Claude, Cursor  |
| Pakiety hooków | Układy w stylu OpenClaw `HOOK.md` + `handler.ts`                                             | Codex           |
| Narzędzia MCP  | Konfiguracja MCP bundla jest scalana z osadzonymi ustawieniami Pi; ładowane są obsługiwane serwery stdio i HTTP | Wszystkie formaty |
| Serwery LSP    | Claude `.lsp.json` i zadeklarowane w manifeście `lspServers` są scalane z domyślnymi ustawieniami LSP osadzonego Pi | Claude          |
| Ustawienia     | Claude `settings.json` jest importowane jako domyślne ustawienia osadzonego Pi              | Claude          |

#### Zawartość Skills

- rooty Skills bundla są ładowane jako zwykłe rooty Skills OpenClaw
- rooty Claude `commands` są traktowane jako dodatkowe rooty Skills
- rooty Cursor `.cursor/commands` są traktowane jako dodatkowe rooty Skills

Oznacza to, że pliki poleceń markdown Claude działają przez zwykły loader Skills OpenClaw.
Markdown poleceń Cursor działa tą samą ścieżką.

#### Pakiety hooków

- rooty hooków bundla działają **tylko** wtedy, gdy używają zwykłego układu pakietu hooków OpenClaw.
  Dziś dotyczy to głównie przypadku zgodnego z Codex:
  - `HOOK.md`
  - `handler.ts` lub `handler.js`

#### MCP dla Pi

- włączone bundle mogą wnosić konfigurację serwerów MCP
- OpenClaw scala konfigurację MCP bundla z efektywnymi osadzonymi ustawieniami Pi jako
  `mcpServers`
- OpenClaw udostępnia obsługiwane narzędzia MCP bundla podczas osadzonych tur agenta Pi przez
  uruchamianie serwerów stdio lub łączenie się z serwerami HTTP
- profile narzędzi `coding` i `messaging` domyślnie zawierają narzędzia MCP bundla; użyj `tools.deny: ["bundle-mcp"]`, aby z tego zrezygnować dla agenta lub gateway
- lokalne ustawienia Pi dla projektu nadal mają zastosowanie po domyślnych ustawieniach bundla, więc
  ustawienia workspace mogą w razie potrzeby nadpisywać wpisy MCP bundla
- katalogi narzędzi MCP bundla są sortowane deterministycznie przed rejestracją, więc
  zmiany w kolejności upstream `listTools()` nie powodują niepotrzebnych zmian bloków narzędzi w prompt-cache

##### Transporty

Serwery MCP mogą używać transportu stdio albo HTTP:

**Stdio** uruchamia proces potomny:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** łączy się z działającym serwerem MCP przez `sse` domyślnie albo `streamable-http`, gdy zostanie zażądane:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport` można ustawić na `"streamable-http"` lub `"sse"`; jeśli zostanie pominięte, OpenClaw używa `sse`
- dozwolone są tylko schematy URL `http:` i `https:`
- wartości `headers` obsługują interpolację `${ENV_VAR}`
- wpis serwera zawierający jednocześnie `command` i `url` jest odrzucany
- poświadczenia w URL (userinfo i parametry query) są redagowane z opisów
  narzędzi i logów
- `connectionTimeoutMs` nadpisuje domyślny 30-sekundowy limit czasu połączenia dla
  transportów stdio i HTTP

##### Nazewnictwo narzędzi

OpenClaw rejestruje narzędzia MCP bundla z nazwami bezpiecznymi dla dostawców w postaci
`serverName__toolName`. Na przykład serwer o kluczu `"vigil-harbor"` udostępniający
narzędzie `memory_search` zostanie zarejestrowany jako `vigil-harbor__memory_search`.

- znaki spoza `A-Za-z0-9_-` są zastępowane przez `-`
- prefiksy serwerów są ograniczone do 30 znaków
- pełne nazwy narzędzi są ograniczone do 64 znaków
- puste nazwy serwerów wracają do `mcp`
- kolidujące sanityzowane nazwy są rozróżniane za pomocą sufiksów numerycznych
- końcowa kolejność udostępnianych narzędzi jest deterministyczna według bezpiecznej nazwy, aby utrzymać stabilność cache przy powtarzanych turach Pi
- filtrowanie profili traktuje wszystkie narzędzia z jednego serwera MCP bundla jako należące do Pluginu
  `bundle-mcp`, więc allowlisty i denylisty profili mogą obejmować zarówno
  poszczególne nazwy udostępnionych narzędzi, jak i klucz Pluginu `bundle-mcp`

#### Osadzone ustawienia Pi

- Claude `settings.json` jest importowane jako domyślne osadzone ustawienia Pi, gdy
  bundle jest włączony
- OpenClaw sanityzuje klucze nadpisania shella przed ich zastosowaniem

Sanityzowane klucze:

- `shellPath`
- `shellCommandPrefix`

#### Osadzone Pi LSP

- włączone bundle Claude mogą wnosić konfigurację serwerów LSP
- OpenClaw ładuje `.lsp.json` oraz wszelkie ścieżki `lspServers` zadeklarowane w manifeście
- konfiguracja LSP bundla jest scalana z efektywnymi domyślnymi ustawieniami LSP osadzonego Pi
- obecnie można uruchamiać tylko obsługiwane serwery LSP oparte na stdio; nieobsługiwane
  transporty nadal są pokazywane w `openclaw plugins inspect <id>`

### Wykrywane, ale niewykonywane

Są rozpoznawane i pokazywane w diagnostyce, ale OpenClaw ich nie uruchamia:

- Claude `agents`, automatyzacja `hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Metadane inline/app Codex wykraczające poza raportowanie możliwości

## Formaty bundli

<AccordionGroup>
  <Accordion title="Bundle Codex">
    Markery: `.codex-plugin/plugin.json`

    Opcjonalna zawartość: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Bundle Codex najlepiej pasują do OpenClaw, gdy używają rootów Skills i katalogów pakietów hooków
    w stylu OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundle Claude">
    Dwa tryby wykrywania:

    - **Na podstawie manifestu:** `.claude-plugin/plugin.json`
    - **Bez manifestu:** domyślny układ Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Zachowanie specyficzne dla Claude:

    - `commands/` jest traktowane jako zawartość Skills
    - `settings.json` jest importowane do osadzonych ustawień Pi (klucze nadpisania shella są sanityzowane)
    - `.mcp.json` udostępnia obsługiwane narzędzia stdio osadzonemu Pi
    - `.lsp.json` wraz ze ścieżkami `lspServers` zadeklarowanymi w manifeście są ładowane do domyślnych ustawień LSP osadzonego Pi
    - `hooks/hooks.json` jest wykrywane, ale niewykonywane
    - Niestandardowe ścieżki komponentów w manifeście są addytywne (rozszerzają wartości domyślne, a nie je zastępują)

  </Accordion>

  <Accordion title="Bundle Cursor">
    Markery: `.cursor-plugin/plugin.json`

    Opcjonalna zawartość: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` jest traktowane jako zawartość Skills
    - `.cursor/rules/`, `.cursor/agents/` i `.cursor/hooks.json` są wykrywane tylko diagnostycznie

  </Accordion>
</AccordionGroup>

## Priorytet wykrywania

OpenClaw najpierw sprawdza natywny format Pluginu:

1. `openclaw.plugin.json` lub poprawny `package.json` z `openclaw.extensions` — traktowane jako **natywny Plugin**
2. Markery bundla (`.codex-plugin/`, `.claude-plugin/` lub domyślny układ Claude/Cursor) — traktowane jako **bundle**

Jeśli katalog zawiera oba typy, OpenClaw używa ścieżki natywnej. Zapobiega to
częściowemu instalowaniu pakietów w podwójnym formacie jako bundli.

## Zależności runtime i czyszczenie

- Zależności runtime bundled Pluginów są dostarczane wewnątrz pakietu OpenClaw pod
  `dist/*`. OpenClaw **nie** uruchamia `npm install` przy starcie dla bundled
  Pluginów; za dostarczenie kompletnego zestawu zależności bundled
  odpowiada pipeline wydawniczy (zobacz regułę weryfikacji postpublish w
  [Releasing](/pl/reference/RELEASING)).

## Bezpieczeństwo

Bundle mają węższą granicę zaufania niż natywne Pluginy:

- OpenClaw **nie** ładuje dowolnych modułów runtime bundla w procesie
- Ścieżki Skills i pakietów hooków muszą pozostawać wewnątrz root Pluginu (sprawdzanie granic)
- Pliki ustawień są odczytywane z użyciem tych samych kontroli granic
- Obsługiwane serwery MCP stdio mogą być uruchamiane jako podprocesy

To sprawia, że bundle są domyślnie bezpieczniejsze, ale nadal powinieneś traktować bundle stron trzecich jako zaufaną zawartość dla funkcji, które faktycznie udostępniają.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Bundle jest wykrywany, ale możliwości nie działają">
    Uruchom `openclaw plugins inspect <id>`. Jeśli możliwość jest wymieniona, ale oznaczona jako
    niepodłączona, jest to ograniczenie produktu — a nie uszkodzona instalacja.
  </Accordion>

  <Accordion title="Pliki poleceń Claude się nie pojawiają">
    Upewnij się, że bundle jest włączony, a pliki markdown znajdują się wewnątrz wykrytego
    root `commands/` lub `skills/`.
  </Accordion>

  <Accordion title="Ustawienia Claude się nie stosują">
    Obsługiwane są tylko osadzone ustawienia Pi z `settings.json`. OpenClaw nie
    traktuje ustawień bundla jako surowych łatek konfiguracji.
  </Accordion>

  <Accordion title="Hooki Claude się nie wykonują">
    `hooks/hooks.json` jest wykrywane tylko diagnostycznie. Jeśli potrzebujesz uruchamialnych hooków, użyj
    układu pakietu hooków OpenClaw albo dostarcz natywny Plugin.
  </Accordion>
</AccordionGroup>

## Powiązane

- [Instalowanie i konfigurowanie Pluginów](/pl/tools/plugin)
- [Tworzenie Pluginów](/pl/plugins/building-plugins) — utwórz natywny Plugin
- [Manifest Pluginu](/pl/plugins/manifest) — schemat natywnego manifestu
