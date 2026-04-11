---
read_when:
    - Dodawanie lub modyfikowanie Skills
    - Zmiana reguł bramkowania lub ładowania Skills
summary: 'Skills: zarządzane a przestrzeni roboczej, reguły bramkowania i okablowanie konfiguracji/env'
title: Skills
x-i18n:
    generated_at: "2026-04-11T02:48:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: b1eaf130966950b6eb24f859d9a77ecbf81c6cb80deaaa6a3a79d2c16d83115d
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

OpenClaw używa folderów Skills zgodnych z **[AgentSkills](https://agentskills.io)**, aby uczyć agenta korzystania z narzędzi. Każda Skill to katalog zawierający `SKILL.md` z YAML frontmatter i instrukcjami. OpenClaw ładuje **bundlowane Skills** oraz opcjonalne lokalne nadpisania, a następnie filtruje je podczas ładowania na podstawie środowiska, konfiguracji i obecności plików binarnych.

## Lokalizacje i priorytet

OpenClaw ładuje Skills z tych źródeł:

1. **Dodatkowe foldery Skills**: skonfigurowane przez `skills.load.extraDirs`
2. **Bundlowane Skills**: dostarczane razem z instalacją (pakiet npm lub OpenClaw.app)
3. **Zarządzane/lokalne Skills**: `~/.openclaw/skills`
4. **Osobiste Skills agenta**: `~/.agents/skills`
5. **Projektowe Skills agenta**: `<workspace>/.agents/skills`
6. **Skills przestrzeni roboczej**: `<workspace>/skills`

Jeśli nazwa Skill koliduje, priorytet jest następujący:

`<workspace>/skills` (najwyższy) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundlowane Skills → `skills.load.extraDirs` (najniższy)

## Skills dla agenta a Skills współdzielone

W konfiguracjach **wieloagentowych** każdy agent ma własną przestrzeń roboczą. Oznacza to, że:

- **Skills dla konkretnego agenta** znajdują się w `<workspace>/skills` tylko dla tego agenta.
- **Projektowe Skills agenta** znajdują się w `<workspace>/.agents/skills` i mają zastosowanie do
  tej przestrzeni roboczej przed zwykłym folderem `skills/` przestrzeni roboczej.
- **Osobiste Skills agenta** znajdują się w `~/.agents/skills` i obowiązują we wszystkich
  przestrzeniach roboczych na tej maszynie.
- **Współdzielone Skills** znajdują się w `~/.openclaw/skills` (zarządzane/lokalne) i są widoczne
  dla **wszystkich agentów** na tej samej maszynie.
- **Współdzielone foldery** można również dodać przez `skills.load.extraDirs` (najniższy
  priorytet), jeśli chcesz mieć wspólny pakiet Skills używany przez wielu agentów.

Jeśli ta sama nazwa Skill istnieje w więcej niż jednym miejscu, obowiązuje zwykły priorytet:
wygrywa przestrzeń robocza, potem projektowe Skills agenta, potem osobiste Skills agenta,
następnie zarządzane/lokalne, potem bundlowane, a na końcu dodatkowe katalogi.

## Listy dozwolonych Skills dla agenta

**Lokalizacja** Skill i **widoczność** Skill to dwa oddzielne mechanizmy sterowania.

- Lokalizacja/priorytet decyduje, która kopia Skill o tej samej nazwie wygrywa.
- Listy dozwolonych dla agenta decydują, których widocznych Skills agent może faktycznie używać.

Użyj `agents.defaults.skills` dla współdzielonej bazy, a potem nadpisz dla konkretnego agenta przez
`agents.list[].skills`:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // dziedziczy github, weather
      { id: "docs", skills: ["docs-search"] }, // zastępuje wartości domyślne
      { id: "locked-down", skills: [] }, // bez Skills
    ],
  },
}
```

Zasady:

- Pomiń `agents.defaults.skills`, aby domyślnie nie ograniczać Skills.
- Pomiń `agents.list[].skills`, aby odziedziczyć `agents.defaults.skills`.
- Ustaw `agents.list[].skills: []`, aby nie mieć żadnych Skills.
- Niepusta lista `agents.list[].skills` jest ostatecznym zbiorem dla tego agenta; nie
  scala się z wartościami domyślnymi.

OpenClaw stosuje efektywny zestaw Skills agenta do budowania promptu, wykrywania poleceń ukośnikowych Skills, synchronizacji sandboxa i migawek Skills.

## Pluginy + Skills

Pluginy mogą dostarczać własne Skills, podając katalogi `skills` w
`openclaw.plugin.json` (ścieżki względne względem katalogu głównego pluginu). Skills pluginu są ładowane,
gdy plugin jest włączony. Obecnie te katalogi są scalane z tą samą ścieżką
o niskim priorytecie co `skills.load.extraDirs`, więc Skill o tej samej nazwie z bundla,
zarządzana, agenta lub przestrzeni roboczej ją nadpisze.
Możesz je bramkować przez `metadata.openclaw.requires.config` na wpisie konfiguracji
pluginu. Zobacz [Pluginy](/pl/tools/plugin) w kontekście wykrywania/konfiguracji oraz [Narzędzia](/pl/tools) w kontekście
powierzchni narzędzi, których uczą te Skills.

## ClawHub (instalacja + synchronizacja)

ClawHub to publiczny rejestr Skills dla OpenClaw. Przeglądaj pod adresem
[https://clawhub.ai](https://clawhub.ai). Używaj natywnych poleceń `openclaw skills`,
aby wykrywać/instalować/aktualizować Skills, albo osobnego CLI `clawhub`, gdy
potrzebujesz przepływów publikowania/synchronizacji.
Pełny przewodnik: [ClawHub](/pl/tools/clawhub).

Typowe przepływy:

- Zainstaluj Skill w swojej przestrzeni roboczej:
  - `openclaw skills install <skill-slug>`
- Zaktualizuj wszystkie zainstalowane Skills:
  - `openclaw skills update --all`
- Synchronizuj (skanowanie + publikowanie aktualizacji):
  - `clawhub sync --all`

Natywne `openclaw skills install` instaluje do aktywnego katalogu `skills/`
przestrzeni roboczej. Osobne CLI `clawhub` również instaluje do `./skills` w
bieżącym katalogu roboczym (albo wraca do skonfigurowanej przestrzeni roboczej OpenClaw).
OpenClaw wykryje to jako `<workspace>/skills` przy następnej sesji.

## Uwagi dotyczące bezpieczeństwa

- Traktuj Skills stron trzecich jako **niezaufany kod**. Przeczytaj je przed włączeniem.
- Preferuj uruchomienia sandboxowane dla niezaufanych danych wejściowych i ryzykownych narzędzi. Zobacz [Sandboxing](/pl/gateway/sandboxing).
- Wykrywanie Skills w przestrzeni roboczej i dodatkowych katalogach akceptuje tylko katalogi główne Skills i pliki `SKILL.md`, których rozwiązana ścieżka rzeczywista pozostaje wewnątrz skonfigurowanego katalogu głównego.
- Instalacje zależności Skill wspierane przez gateway (`skills.install`, onboarding i UI ustawień Skills) uruchamiają wbudowany skaner niebezpiecznego kodu przed wykonaniem metadanych instalatora. Znaleziska `critical` domyślnie blokują działanie, chyba że wywołujący jawnie ustawi niebezpieczne nadpisanie; podejrzane znaleziska nadal tylko ostrzegają.
- `openclaw skills install <slug>` działa inaczej: pobiera folder Skill z ClawHub do przestrzeni roboczej i nie używa opisanej wyżej ścieżki metadanych instalatora.
- `skills.entries.*.env` i `skills.entries.*.apiKey` wstrzykują sekrety do procesu **hosta**
  dla tej tury agenta (nie do sandboxa). Nie umieszczaj sekretów w promptach ani logach.
- Szerszy model zagrożeń i listy kontrolne znajdziesz w [Bezpieczeństwie](/pl/gateway/security).

## Format (AgentSkills + zgodny z Pi)

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
- Używaj `{baseDir}` w instrukcjach, aby odwołać się do ścieżki folderu Skill.
- Opcjonalne klucze frontmatter:
  - `homepage` — URL wyświetlany jako „Website” w UI Skills na macOS (obsługiwany również przez `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (domyślnie: `true`). Gdy ma wartość `true`, Skill jest udostępniana jako polecenie ukośnikowe użytkownika.
  - `disable-model-invocation` — `true|false` (domyślnie: `false`). Gdy ma wartość `true`, Skill jest wykluczana z promptu modelu (nadal dostępna przez wywołanie użytkownika).
  - `command-dispatch` — `tool` (opcjonalne). Po ustawieniu na `tool` polecenie ukośnikowe omija model i jest wysyłane bezpośrednio do narzędzia.
  - `command-tool` — nazwa narzędzia do wywołania, gdy ustawiono `command-dispatch: tool`.
  - `command-arg-mode` — `raw` (domyślnie). Dla wysyłki do narzędzia przekazuje surowy ciąg argumentów do narzędzia (bez parsowania przez rdzeń).

    Narzędzie jest wywoływane z parametrami:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Bramkowanie (filtry podczas ładowania)

OpenClaw **filtruje Skills podczas ładowania** za pomocą `metadata` (jednowierszowy JSON):

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

Pola w `metadata.openclaw`:

- `always: true` — zawsze uwzględniaj Skill (pomija inne bramki).
- `emoji` — opcjonalne emoji używane przez UI Skills na macOS.
- `homepage` — opcjonalny URL wyświetlany jako „Website” w UI Skills na macOS.
- `os` — opcjonalna lista platform (`darwin`, `linux`, `win32`). Jeśli jest ustawiona, Skill kwalifikuje się tylko na tych systemach operacyjnych.
- `requires.bins` — lista; każdy element musi istnieć w `PATH`.
- `requires.anyBins` — lista; co najmniej jeden element musi istnieć w `PATH`.
- `requires.env` — lista; zmienna env musi istnieć **albo** zostać dostarczona w konfiguracji.
- `requires.config` — lista ścieżek `openclaw.json`, które muszą mieć wartość prawdziwą.
- `primaryEnv` — nazwa zmiennej env powiązanej z `skills.entries.<name>.apiKey`.
- `install` — opcjonalna tablica specyfikacji instalatora używana przez UI Skills na macOS (brew/node/go/uv/download).

Uwaga dotycząca sandboxingu:

- `requires.bins` jest sprawdzane na **hoście** podczas ładowania Skill.
- Jeśli agent działa w sandboxie, plik binarny musi istnieć również **wewnątrz kontenera**.
  Zainstaluj go przez `agents.defaults.sandbox.docker.setupCommand` (albo niestandardowy obraz).
  `setupCommand` uruchamia się raz po utworzeniu kontenera.
  Instalacje pakietów wymagają również dostępu do sieci, zapisywalnego głównego systemu plików i użytkownika root w sandboxie.
  Przykład: Skill `summarize` (`skills/summarize/SKILL.md`) potrzebuje CLI `summarize`
  w kontenerze sandboxa, aby tam działać.

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

- Jeśli podano wiele instalatorów, gateway wybiera **jedną** preferowaną opcję (brew, gdy jest dostępny, w przeciwnym razie node).
- Jeśli wszystkie instalatory mają typ `download`, OpenClaw wyświetla każdy wpis, aby można było zobaczyć dostępne artefakty.
- Specyfikacje instalatora mogą zawierać `os: ["darwin"|"linux"|"win32"]`, aby filtrować opcje według platformy.
- Instalacje node respektują `skills.install.nodeManager` w `openclaw.json` (domyślnie: npm; opcje: npm/pnpm/yarn/bun).
  Dotyczy to tylko **instalacji Skill**; runtime Gateway nadal powinien być uruchamiany przez Node
  (Bun nie jest zalecany dla WhatsApp/Telegram).
- Wybór instalatora wspieranego przez gateway zależy od preferencji, a nie tylko od node:
  gdy specyfikacje instalacji mieszają różne typy, OpenClaw preferuje Homebrew, gdy
  `skills.install.preferBrew` jest włączone i istnieje `brew`, potem `uv`, potem
  skonfigurowany menedżer node, a następnie inne fallbacki, takie jak `go` lub `download`.
- Jeśli każda specyfikacja instalacji ma typ `download`, OpenClaw udostępnia wszystkie opcje pobierania
  zamiast zwijać je do jednego preferowanego instalatora.
- Instalacje Go: jeśli brakuje `go`, a dostępny jest `brew`, gateway najpierw instaluje Go przez Homebrew i ustawia `GOBIN` na `bin` Homebrew, gdy to możliwe.
- Instalacje przez pobieranie: `url` (wymagane), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (domyślnie: automatycznie po wykryciu archiwum), `stripComponents`, `targetDir` (domyślnie: `~/.openclaw/tools/<skillKey>`).

Jeśli nie ma `metadata.openclaw`, Skill zawsze się kwalifikuje (chyba że
jest wyłączona w konfiguracji albo zablokowana przez `skills.allowBundled` dla bundlowanych Skills).

## Nadpisania konfiguracji (`~/.openclaw/openclaw.json`)

Bundlowane/zarządzane Skills można przełączać i dostarczać im wartości env:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // albo zwykły ciąg tekstowy
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

Uwaga: jeśli nazwa Skill zawiera myślniki, umieść klucz w cudzysłowie (JSON5 dopuszcza klucze w cudzysłowie).

Jeśli chcesz standardowego generowania/edycji obrazów wewnątrz samego OpenClaw, użyj
głównego narzędzia `image_generate` z `agents.defaults.imageGenerationModel` zamiast
bundlowanej Skill. Przykłady Skills tutaj dotyczą niestandardowych lub zewnętrznych przepływów pracy.

Do natywnej analizy obrazów użyj narzędzia `image` z `agents.defaults.imageModel`.
Do natywnego generowania/edycji obrazów użyj `image_generate` z
`agents.defaults.imageGenerationModel`. Jeśli wybierzesz `openai/*`, `google/*`,
`fal/*` lub inny model obrazów specyficzny dla dostawcy, dodaj również uwierzytelnianie/klucz API tego dostawcy.

Klucze konfiguracji domyślnie odpowiadają **nazwie Skill**. Jeśli Skill definiuje
`metadata.openclaw.skillKey`, użyj tego klucza w `skills.entries`.

Zasady:

- `enabled: false` wyłącza Skill nawet wtedy, gdy jest bundlowana/zainstalowana.
- `env`: wstrzykiwane **tylko wtedy**, gdy zmienna nie jest już ustawiona w procesie.
- `apiKey`: wygodne rozwiązanie dla Skills deklarujących `metadata.openclaw.primaryEnv`.
  Obsługuje zwykły ciąg tekstowy albo obiekt SecretRef (`{ source, provider, id }`).
- `config`: opcjonalny zbiór dla niestandardowych pól per Skill; niestandardowe klucze muszą znajdować się tutaj.
- `allowBundled`: opcjonalna lista dozwolonych tylko dla **bundlowanych** Skills. Jeśli jest ustawiona, kwalifikują się tylko
  bundlowane Skills z tej listy (Skills zarządzane/przestrzeni roboczej pozostają bez wpływu).

## Wstrzykiwanie środowiska (na uruchomienie agenta)

Gdy rozpoczyna się uruchomienie agenta, OpenClaw:

1. Odczytuje metadane Skill.
2. Stosuje dowolne `skills.entries.<key>.env` lub `skills.entries.<key>.apiKey` do
   `process.env`.
3. Buduje prompt systemowy z **kwalifikującymi się** Skills.
4. Przywraca oryginalne środowisko po zakończeniu uruchomienia.

To jest zakresowane **do uruchomienia agenta**, a nie do globalnego środowiska powłoki.

Dla bundlowanego backendu `claude-cli` OpenClaw dodatkowo materializuje tę samą
kwalifikującą się migawkę jako tymczasowy plugin Claude Code i przekazuje ją przez
`--plugin-dir`. Claude Code może wtedy używać swojego natywnego resolvera Skills, podczas gdy
OpenClaw nadal kontroluje priorytet, listy dozwolonych per agent, bramkowanie oraz
wstrzykiwanie env/klucza API przez `skills.entries.*`. Inne backendy CLI używają tylko
katalogu promptu.

## Migawka sesji (wydajność)

OpenClaw tworzy migawkę kwalifikujących się Skills **w momencie rozpoczęcia sesji** i ponownie używa tej listy przy kolejnych turach w tej samej sesji. Zmiany w Skills lub konfiguracji zaczynają działać od następnej nowej sesji.

Skills mogą też odświeżać się w trakcie sesji, gdy watcher Skills jest włączony albo gdy pojawi się nowy kwalifikujący się zdalny węzeł (zobacz poniżej). Traktuj to jako **hot reload**: odświeżona lista zostanie wykorzystana przy następnej turze agenta.

Jeśli efektywna lista dozwolonych Skills dla agenta zmieni się dla tej sesji, OpenClaw
odświeży migawkę, aby widoczne Skills pozostały zgodne z bieżącym agentem.

## Zdalne węzły macOS (gateway na Linuksie)

Jeśli Gateway działa na Linuksie, ale podłączony jest **węzeł macOS** **z dozwolonym `system.run`** (ustawienie bezpieczeństwa Exec approvals nie jest ustawione na `deny`), OpenClaw może traktować Skills dostępne tylko na macOS jako kwalifikujące się, gdy wymagane pliki binarne są obecne na tym węźle. Agent powinien uruchamiać te Skills przez narzędzie `exec` z `host=node`.

Opiera się to na tym, że węzeł raportuje obsługę poleceń oraz na sprawdzeniu plików binarnych przez `system.run`. Jeśli węzeł macOS później przejdzie offline, Skills pozostaną widoczne; wywołania mogą kończyć się błędem, dopóki węzeł nie połączy się ponownie.

## Watcher Skills (automatyczne odświeżanie)

Domyślnie OpenClaw obserwuje foldery Skills i podbija migawkę Skills, gdy pliki `SKILL.md` się zmieniają. Skonfiguruj to w `skills.load`:

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

Gdy Skills się kwalifikują, OpenClaw wstrzykuje zwartą listę XML dostępnych Skills do promptu systemowego (przez `formatSkillsForPrompt` w `pi-coding-agent`). Koszt jest deterministyczny:

- **Narzut bazowy (tylko gdy ≥1 Skill):** 195 znaków.
- **Na Skill:** 97 znaków + długość wartości `<name>`, `<description>` i `<location>` po ucieczce XML.

Wzór (znaki):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Uwagi:

- Ucieczka XML rozszerza `& < > " '` do encji (`&amp;`, `&lt;` itd.), zwiększając długość.
- Liczba tokenów zależy od tokenizera modelu. Przybliżone oszacowanie w stylu OpenAI to ~4 znaki/token, więc **97 znaków ≈ 24 tokeny** na Skill plus rzeczywiste długości pól.

## Cykl życia zarządzanych Skills

OpenClaw dostarcza bazowy zestaw Skills jako **bundlowane Skills** będące częścią
instalacji (pakiet npm lub OpenClaw.app). `~/.openclaw/skills` istnieje dla lokalnych
nadpisań (na przykład przypięcia/załatania Skill bez zmiany kopii bundlowanej). Skills przestrzeni roboczej są własnością użytkownika i nadpisują oba te źródła przy konfliktach nazw.

## Odniesienie do konfiguracji

Pełny schemat konfiguracji znajdziesz w [Konfiguracja Skills](/pl/tools/skills-config).

## Szukasz większej liczby Skills?

Przeglądaj [https://clawhub.ai](https://clawhub.ai).

---

## Powiązane

- [Tworzenie Skills](/pl/tools/creating-skills) — budowanie własnych Skills
- [Konfiguracja Skills](/pl/tools/skills-config) — odniesienie do konfiguracji Skills
- [Polecenia ukośnikowe](/pl/tools/slash-commands) — wszystkie dostępne polecenia ukośnikowe
- [Pluginy](/pl/tools/plugin) — przegląd systemu pluginów
