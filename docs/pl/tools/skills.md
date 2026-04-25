---
read_when:
    - Dodawanie lub modyfikowanie Skills
    - Zmiana bramkowania Skills lub reguł ładowania
summary: 'Skills: zarządzane vs obszaru roboczego, reguły bramkowania i okablowanie config/env'
title: Skills
x-i18n:
    generated_at: "2026-04-25T14:00:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44f946d91588c878754340aaf55e0e3b9096bba12aea36fb90c445cd41e4f892
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw używa folderów Skills zgodnych z **[AgentSkills](https://agentskills.io)** do uczenia agenta, jak używać narzędzi. Każdy Skill to katalog zawierający `SKILL.md` z frontmatter YAML i instrukcjami. OpenClaw ładuje **dołączone Skills** oraz opcjonalne lokalne nadpisania i filtruje je w czasie ładowania na podstawie środowiska, konfiguracji i obecności binarek.

## Lokalizacje i priorytet

OpenClaw ładuje Skills z tych źródeł:

1. **Dodatkowe foldery Skills**: konfigurowane przez `skills.load.extraDirs`
2. **Dołączone Skills**: dostarczane z instalacją (pakiet npm lub OpenClaw.app)
3. **Zarządzane/lokalne Skills**: `~/.openclaw/skills`
4. **Personal agent Skills**: `~/.agents/skills`
5. **Project agent Skills**: `<workspace>/.agents/skills`
6. **Workspace Skills**: `<workspace>/skills`

Jeśli nazwy Skills się konfliktują, priorytet jest następujący:

`<workspace>/skills` (najwyższy) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → dołączone Skills → `skills.load.extraDirs` (najniższy)

## Skills per agent vs współdzielone

W konfiguracjach **wielu agentów** każdy agent ma własny obszar roboczy. Oznacza to:

- **Skills per agent** znajdują się w `<workspace>/skills` tylko dla tego agenta.
- **Project agent Skills** znajdują się w `<workspace>/.agents/skills` i mają zastosowanie do
  tego obszaru roboczego przed zwykłym folderem `skills/` obszaru roboczego.
- **Personal agent Skills** znajdują się w `~/.agents/skills` i mają zastosowanie we wszystkich
  obszarach roboczych na tej maszynie.
- **Współdzielone Skills** znajdują się w `~/.openclaw/skills` (zarządzane/lokalne) i są widoczne
  dla **wszystkich agentów** na tej samej maszynie.
- **Współdzielone foldery** można także dodać przez `skills.load.extraDirs` (najniższy
  priorytet), jeśli chcesz mieć wspólny pakiet Skills używany przez wielu agentów.

Jeśli ta sama nazwa Skill istnieje w więcej niż jednym miejscu, obowiązuje zwykły priorytet:
wygrywa obszar roboczy, potem project agent Skills, potem personal agent Skills,
potem zarządzane/lokalne, potem dołączone, a na końcu extra dirs.

## Allowlisty Skills per agent

**Lokalizacja** Skill i **widoczność** Skill to oddzielne mechanizmy kontroli.

- Lokalizacja/priorytet decyduje, która kopia Skill o tej samej nazwie wygrywa.
- Allowlisty agentów decydują, których widocznych Skills agent może faktycznie używać.

Użyj `agents.defaults.skills` jako wspólnej bazy, a następnie nadpisz per agent przez
`agents.list[].skills`:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // dziedziczy github, weather
      { id: "docs", skills: ["docs-search"] }, // zastępuje defaults
      { id: "locked-down", skills: [] }, // brak Skills
    ],
  },
}
```

Zasady:

- Pomiń `agents.defaults.skills`, aby domyślnie nie ograniczać Skills.
- Pomiń `agents.list[].skills`, aby dziedziczyć `agents.defaults.skills`.
- Ustaw `agents.list[].skills: []`, aby nie mieć żadnych Skills.
- Niepusta lista `agents.list[].skills` jest ostatecznym zbiorem dla tego agenta; nie
  scala się z defaults.

OpenClaw stosuje efektywny zestaw Skills agenta w budowaniu promptu, wykrywaniu slash-commandów Skills, synchronizacji sandboxa i migawkach Skills.

## Pluginy + Skills

Pluginy mogą dostarczać własne Skills, wypisując katalogi `skills` w
`openclaw.plugin.json` (ścieżki względne względem katalogu głównego Plugin). Skills Plugin ładują się,
gdy Plugin jest włączony. To właściwe miejsce dla przewodników operacyjnych specyficznych dla narzędzi,
które są zbyt długie dla opisu narzędzia, ale powinny być dostępne
zawsze, gdy Plugin jest zainstalowany; na przykład Plugin przeglądarki dostarcza
Skill `browser-automation` do wieloetapowego sterowania przeglądarką. Obecnie te
katalogi są scalane do tej samej ścieżki o niskim priorytecie co
`skills.load.extraDirs`, więc Skill o tej samej nazwie z dołączonych, zarządzanych, agentowych lub obszaru roboczego nadpisuje je.
Możesz je bramkować przez `metadata.openclaw.requires.config` w wpisie konfiguracji Plugin.
Zobacz [Plugins](/pl/tools/plugin) w kontekście wykrywania/konfiguracji oraz [Tools](/pl/tools) w kontekście
powierzchni narzędzi, których uczą te Skills.

## Skill Workshop

Opcjonalny, eksperymentalny Plugin Skill Workshop może tworzyć lub aktualizować Skills obszaru roboczego na podstawie wielokrotnego użycia procedur zaobserwowanych podczas pracy agenta. Jest domyślnie wyłączony i musi zostać jawnie włączony przez
`plugins.entries.skill-workshop`.

Skill Workshop zapisuje tylko do `<workspace>/skills`, skanuje wygenerowaną treść,
obsługuje oczekujące zatwierdzenie lub automatyczne bezpieczne zapisy, kieruje niebezpieczne
propozycje do kwarantanny i odświeża migawkę Skills po udanych zapisach, dzięki czemu nowe
Skills mogą stać się dostępne bez restartu Gateway.

Używaj go, gdy chcesz, aby poprawki takie jak „następnym razem zweryfikuj przypisanie GIF” albo
ciężko wypracowane workflow, takie jak checklisty QA dla mediów, stały się trwałymi instrukcjami proceduralnymi. Zacznij od oczekującego zatwierdzenia; automatycznych zapisów używaj tylko w zaufanych obszarach roboczych po przejrzeniu propozycji. Pełny przewodnik:
[Plugin Skill Workshop](/pl/plugins/skill-workshop).

## ClawHub (instalacja + synchronizacja)

ClawHub to publiczny rejestr Skills dla OpenClaw. Przeglądaj pod adresem
[https://clawhub.ai](https://clawhub.ai). Używaj natywnych poleceń `openclaw skills`
do wykrywania/instalowania/aktualizowania Skills albo osobnego CLI `clawhub`, gdy
potrzebujesz przepływów publikacji/synchronizacji.
Pełny przewodnik: [ClawHub](/pl/tools/clawhub).

Typowe przepływy:

- Zainstaluj Skill do swojego obszaru roboczego:
  - `openclaw skills install <skill-slug>`
- Zaktualizuj wszystkie zainstalowane Skills:
  - `openclaw skills update --all`
- Synchronizacja (skanowanie + publikowanie aktualizacji):
  - `clawhub sync --all`

Natywne `openclaw skills install` instaluje do aktywnego katalogu `skills/`
obszaru roboczego. Osobne CLI `clawhub` również instaluje do `./skills` pod
bieżącym katalogiem roboczym (albo wraca do skonfigurowanego obszaru roboczego OpenClaw).
OpenClaw wykryje to jako `<workspace>/skills` w następnej sesji.

## Uwagi dotyczące bezpieczeństwa

- Traktuj Skills stron trzecich jako **niezaufany kod**. Przeczytaj je przed włączeniem.
- Preferuj uruchomienia sandboxowane dla niezaufanych danych wejściowych i ryzykownych narzędzi. Zobacz [Sandboxing](/pl/gateway/sandboxing).
- Wykrywanie Skills w obszarze roboczym i extra-dir akceptuje tylko katalogi główne Skill i pliki `SKILL.md`, których rozwiązywana realpath pozostaje wewnątrz skonfigurowanego katalogu głównego.
- Instalacje zależności Skill wykonywane przez Gateway (`skills.install`, onboarding i UI ustawień Skills) uruchamiają wbudowany skaner niebezpiecznego kodu przed wykonaniem metadanych instalatora. Znaleziska `critical` domyślnie blokują wykonanie, chyba że wywołujący jawnie ustawi nadpisanie dla niebezpiecznego kodu; podejrzane znaleziska nadal tylko ostrzegają.
- `openclaw skills install <slug>` działa inaczej: pobiera folder Skill z ClawHub do obszaru roboczego i nie używa powyższej ścieżki metadanych instalatora.
- `skills.entries.*.env` i `skills.entries.*.apiKey` wstrzykują sekrety do procesu **hosta**
  dla tej tury agenta (nie do sandboxa). Trzymaj sekrety poza promptami i logami.
- Szerszy model zagrożeń i checklisty: [Security](/pl/gateway/security).

## Format (zgodny z AgentSkills + Pi)

`SKILL.md` musi zawierać co najmniej:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Uwagi:

- Stosujemy specyfikację AgentSkills dla układu/intencji.
- Parser używany przez osadzonego agenta obsługuje tylko **jednowierszowe** klucze frontmatter.
- `metadata` powinno być **jednowierszowym obiektem JSON**.
- Użyj `{baseDir}` w instrukcjach, aby odwołać się do ścieżki folderu Skill.
- Opcjonalne klucze frontmatter:
  - `homepage` — URL pokazywany jako „Website” w interfejsie Skills na macOS (obsługiwany także przez `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (domyślnie: `true`). Gdy `true`, Skill jest ujawniany jako slash command użytkownika.
  - `disable-model-invocation` — `true|false` (domyślnie: `false`). Gdy `true`, Skill jest wykluczany z promptu modelu (nadal dostępny przez wywołanie użytkownika).
  - `command-dispatch` — `tool` (opcjonalnie). Gdy ustawione na `tool`, slash command omija model i jest kierowane bezpośrednio do narzędzia.
  - `command-tool` — nazwa narzędzia do wywołania, gdy ustawione jest `command-dispatch: tool`.
  - `command-arg-mode` — `raw` (domyślnie). Dla dispatchu do narzędzia przekazuje surowy ciąg args do narzędzia (bez parsowania przez rdzeń).

    Narzędzie jest wywoływane z parametrami:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Bramkowanie (filtry czasu ładowania)

OpenClaw **filtruje Skills w czasie ładowania** przy użyciu `metadata` (jednowierszowy JSON):

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

Pola pod `metadata.openclaw`:

- `always: true` — zawsze uwzględnia Skill (pomija inne bramki).
- `emoji` — opcjonalne emoji używane przez interfejs Skills na macOS.
- `homepage` — opcjonalny URL pokazywany jako „Website” w interfejsie Skills na macOS.
- `os` — opcjonalna lista platform (`darwin`, `linux`, `win32`). Jeśli ustawiona, Skill kwalifikuje się tylko na tych systemach operacyjnych.
- `requires.bins` — lista; każdy wpis musi istnieć w `PATH`.
- `requires.anyBins` — lista; co najmniej jeden wpis musi istnieć w `PATH`.
- `requires.env` — lista; zmienna env musi istnieć **albo** zostać podana w konfiguracji.
- `requires.config` — lista ścieżek `openclaw.json`, które muszą być truthy.
- `primaryEnv` — nazwa zmiennej env powiązanej z `skills.entries.<name>.apiKey`.
- `install` — opcjonalna tablica specyfikacji instalatora używana przez interfejs Skills na macOS (brew/node/go/uv/download).

Starsze bloki `metadata.clawdbot` są nadal akceptowane, gdy
brakuje `metadata.openclaw`, więc starsze zainstalowane Skills zachowują swoje
bramki zależności i wskazówki instalatora. Nowe i zaktualizowane Skills powinny używać
`metadata.openclaw`.

Uwaga dotycząca sandboxingu:

- `requires.bins` jest sprawdzane na **hoście** w czasie ładowania Skill.
- Jeśli agent jest sandboxowany, binarka musi również istnieć **wewnątrz kontenera**.
  Zainstaluj ją przez `agents.defaults.sandbox.docker.setupCommand` (lub własny obraz).
  `setupCommand` uruchamia się raz po utworzeniu kontenera.
  Instalacje pakietów wymagają także wyjścia do sieci, zapisywalnego głównego systemu plików i użytkownika root w sandboxie.
  Przykład: Skill `summarize` (`skills/summarize/SKILL.md`) wymaga CLI `summarize`
  wewnątrz kontenera sandboxa, aby mógł tam działać.

Przykład instalatora:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

Uwagi:

- Jeśli wypisano wiele instalatorów, gateway wybiera **jedną** preferowaną opcję (brew, jeśli dostępne, w przeciwnym razie node).
- Jeśli wszystkie instalatory mają typ `download`, OpenClaw wypisuje każdy wpis, aby można było zobaczyć dostępne artefakty.
- Specyfikacje instalatora mogą zawierać `os: ["darwin"|"linux"|"win32"]`, aby filtrować opcje według platformy.
- Instalacje Node respektują `skills.install.nodeManager` w `openclaw.json` (domyślnie: npm; opcje: npm/pnpm/yarn/bun).
  Dotyczy to tylko **instalacji Skills**; runtime Gateway nadal powinien być Node
  (Bun nie jest zalecany dla WhatsApp/Telegram).
- Wybór instalatora wykonywany przez Gateway jest oparty na preferencjach, a nie tylko na node:
  gdy specyfikacje instalacji mieszają typy, OpenClaw preferuje Homebrew, gdy
  `skills.install.preferBrew` jest włączone i istnieje `brew`, następnie `uv`, potem
  skonfigurowany menedżer node, a następnie inne fallbacki, takie jak `go` lub `download`.
- Jeśli każda specyfikacja instalacji ma typ `download`, OpenClaw pokazuje wszystkie opcje pobierania
  zamiast zawężać do jednego preferowanego instalatora.
- Instalacje Go: jeśli brakuje `go`, a `brew` jest dostępne, gateway najpierw instaluje Go przez Homebrew i ustawia `GOBIN` na `bin` Homebrew, gdy to możliwe.
- Instalacje przez download: `url` (wymagane), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (domyślnie: auto przy wykryciu archiwum), `stripComponents`, `targetDir` (domyślnie: `~/.openclaw/tools/<skillKey>`).

Jeśli nie ma `metadata.openclaw`, Skill jest zawsze kwalifikujący się (chyba że
jest wyłączony w konfiguracji albo zablokowany przez `skills.allowBundled` dla dołączonych Skills).

## Nadpisania konfiguracji (`~/.openclaw/openclaw.json`)

Dołączone/zarządzane Skills można przełączać i dostarczać im wartości env:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Uwaga: jeśli nazwa Skill zawiera myślniki, ujmij klucz w cudzysłów (JSON5 pozwala na klucze w cudzysłowie).

Jeśli chcesz standardowego generowania/edycji obrazów wewnątrz samego OpenClaw, użyj narzędzia rdzenia
`image_generate` z `agents.defaults.imageGenerationModel` zamiast
dołączonego Skill. Przykłady Skills tutaj dotyczą niestandardowych lub zewnętrznych workflow.

Do natywnej analizy obrazów używaj narzędzia `image` z `agents.defaults.imageModel`.
Do natywnego generowania/edycji obrazów używaj `image_generate` z
`agents.defaults.imageGenerationModel`. Jeśli wybierzesz `openai/*`, `google/*`,
`fal/*` lub inny provider-specyficzny model obrazu, dodaj także auth/klucz API
tego providera.

Klucze konfiguracji domyślnie odpowiadają **nazwie Skill**. Jeśli Skill definiuje
`metadata.openclaw.skillKey`, użyj tego klucza pod `skills.entries`.

Zasady:

- `enabled: false` wyłącza Skill, nawet jeśli jest dołączony/zainstalowany.
- `env`: wstrzykiwane **tylko wtedy**, gdy zmienna nie jest już ustawiona w procesie.
- `apiKey`: wygodny skrót dla Skills, które deklarują `metadata.openclaw.primaryEnv`.
  Obsługuje zwykły ciąg albo obiekt SecretRef (`{ source, provider, id }`).
- `config`: opcjonalny worek na niestandardowe pola per Skill; niestandardowe klucze muszą znajdować się tutaj.
- `allowBundled`: opcjonalna allowlista tylko dla **dołączonych** Skills. Jeśli ustawiona, tylko
  dołączone Skills z listy kwalifikują się (zarządzane/skills obszaru roboczego pozostają bez zmian).

## Wstrzykiwanie środowiska (per uruchomienie agenta)

Gdy uruchomienie agenta się rozpoczyna, OpenClaw:

1. Odczytuje metadane Skill.
2. Stosuje dowolne `skills.entries.<key>.env` lub `skills.entries.<key>.apiKey` do
   `process.env`.
3. Buduje prompt systemowy z **kwalifikującymi się** Skills.
4. Przywraca oryginalne środowisko po zakończeniu uruchomienia.

To jest **ograniczone do uruchomienia agenta**, a nie globalnego środowiska powłoki.

Dla dołączonego backendu `claude-cli` OpenClaw materializuje także tę samą
kwalifikującą się migawkę jako tymczasowy Plugin Claude Code i przekazuje go przez
`--plugin-dir`. Claude Code może wtedy używać swojego natywnego resolvera Skills, podczas gdy
OpenClaw nadal pozostaje właścicielem priorytetu, allowlist per agent, bramkowania i
wstrzykiwania env/kluczy API `skills.entries.*`. Inne backendy CLI używają tylko katalogu promptu.

## Migawka sesji (wydajność)

OpenClaw tworzy migawkę kwalifikujących się Skills **w momencie rozpoczęcia sesji** i ponownie używa tej listy w kolejnych turach tej samej sesji. Zmiany w Skills lub konfiguracji zaczynają działać przy następnej nowej sesji.

Skills mogą także odświeżać się w połowie sesji, gdy włączony jest watcher Skills albo gdy pojawi się nowy kwalifikujący się zdalny Node (zobacz poniżej). Traktuj to jako **hot reload**: odświeżona lista zostanie pobrana przy następnej turze agenta.

Jeśli efektywna allowlista Skills agenta zmieni się dla tej sesji, OpenClaw
odświeża migawkę, aby widoczne Skills pozostały zgodne z bieżącym
agentem.

## Zdalne Node'y macOS (gateway Linux)

Jeśli Gateway działa na Linuksie, ale podłączony jest **macOS Node** **z dozwolonym `system.run`** (bezpieczeństwo Exec approvals nieustawione na `deny`), OpenClaw może traktować Skills tylko dla macOS jako kwalifikujące się, gdy wymagane binarki są obecne na tym Node. Agent powinien wykonywać te Skills przez narzędzie `exec` z `host=node`.

To opiera się na tym, że Node raportuje obsługę poleceń oraz na sondzie binarek przez `system.run`. Jeśli Node macOS później przejdzie offline, Skills pozostaną widoczne; wywołania mogą kończyć się niepowodzeniem, dopóki Node ponownie się nie połączy.

## Watcher Skills (auto-refresh)

Domyślnie OpenClaw obserwuje foldery Skills i podbija migawkę Skills, gdy pliki `SKILL.md` się zmieniają. Skonfiguruj to pod `skills.load`:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

## Wpływ na tokeny (lista Skills)

Gdy Skills się kwalifikują, OpenClaw wstrzykuje kompaktową listę XML dostępnych Skills do promptu systemowego (przez `formatSkillsForPrompt` w `pi-coding-agent`). Koszt jest deterministyczny:

- **Narzut bazowy (tylko gdy jest ≥1 Skill):** 195 znaków.
- **Na Skill:** 97 znaków + długość wartości XML-escaped `<name>`, `<description>` i `<location>`.

Wzór (znaki):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Uwagi:

- Escapowanie XML rozszerza `& < > " '` do encji (`&amp;`, `&lt;` itd.), zwiększając długość.
- Liczba tokenów różni się w zależności od tokenizera modelu. Przybliżone oszacowanie w stylu OpenAI to ~4 znaki/token, więc **97 znaków ≈ 24 tokeny** na Skill plus rzeczywiste długości Twoich pól.

## Cykl życia zarządzanych Skills

OpenClaw dostarcza bazowy zestaw Skills jako **dołączone Skills** będące częścią
instalacji (pakiet npm lub OpenClaw.app). `~/.openclaw/skills` istnieje dla lokalnych
nadpisań (na przykład przypięcia/patchowania Skill bez zmiany dołączonej
kopii). Skills obszaru roboczego należą do użytkownika i nadpisują oba przy konfliktach nazw.

## Dokumentacja referencyjna konfiguracji

Pełny schemat konfiguracji znajdziesz w [Skills config](/pl/tools/skills-config).

## Szukasz większej liczby Skills?

Przeglądaj [https://clawhub.ai](https://clawhub.ai).

---

## Powiązane

- [Creating Skills](/pl/tools/creating-skills) — budowanie własnych Skills
- [Skills Config](/pl/tools/skills-config) — dokumentacja referencyjna konfiguracji Skills
- [Slash Commands](/pl/tools/slash-commands) — wszystkie dostępne slash commandy
- [Plugins](/pl/tools/plugin) — przegląd systemu Plugin
