---
read_when:
    - Dodawanie lub modyfikowanie konfiguracji Skills
    - Dostosowywanie dołączonej allowlisty lub zachowania instalacji
summary: Schemat konfiguracji Skills i przykłady
title: Konfiguracja Skills
x-i18n:
    generated_at: "2026-04-23T10:10:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f3b0a5946242bb5c07fd88678c88e3ee62cda514a5afcc9328f67853e05ad3f
    source_path: tools/skills-config.md
    workflow: 15
---

# Konfiguracja Skills

Większość konfiguracji ładowania/instalacji Skills znajduje się pod `skills` w
`~/.openclaw/openclaw.json`. Widoczność Skills specyficzna dla agenta znajduje się pod
`agents.defaults.skills` oraz `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime nadal Node; bun niezalecany)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // lub zwykły string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Dla wbudowanego generowania/edycji obrazów preferuj `agents.defaults.imageGenerationModel`
plus główne narzędzie `image_generate`. `skills.entries.*` służy tylko do niestandardowych lub
zewnętrznych workflow Skills.

Jeśli wybierasz konkretnego providera/model obrazu, skonfiguruj także auth/klucz API
tego providera. Typowe przykłady: `GEMINI_API_KEY` lub `GOOGLE_API_KEY` dla
`google/*`, `OPENAI_API_KEY` dla `openai/*` oraz `FAL_KEY` dla `fal/*`.

Przykłady:

- Natywna konfiguracja w stylu Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Natywna konfiguracja fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Allowlisty Skills agenta

Używaj konfiguracji agenta, gdy chcesz mieć te same korzenie Skills maszyny/obszaru roboczego, ale
inny zestaw widocznych Skills dla każdego agenta.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // dziedziczy wartości domyślne -> github, weather
      { id: "docs", skills: ["docs-search"] }, // zastępuje wartości domyślne
      { id: "locked-down", skills: [] }, // brak Skills
    ],
  },
}
```

Zasady:

- `agents.defaults.skills`: współdzielona bazowa allowlista dla agentów, które pomijają
  `agents.list[].skills`.
- Pomiń `agents.defaults.skills`, aby domyślnie nie ograniczać Skills.
- `agents.list[].skills`: jawny końcowy zestaw Skills dla tego agenta; nie
  jest scalany z wartościami domyślnymi.
- `agents.list[].skills: []`: nie udostępnia żadnych Skills temu agentowi.

## Pola

- Wbudowane korzenie Skills zawsze obejmują `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` oraz `<workspace>/skills`.
- `allowBundled`: opcjonalna allowlista tylko dla **dołączonych** Skills. Gdy jest ustawiona, tylko
  dołączone Skills z listy kwalifikują się (zarządzane Skills oraz Skills agenta i obszaru roboczego pozostają bez zmian).
- `load.extraDirs`: dodatkowe katalogi Skills do skanowania (najniższy priorytet).
- `load.watch`: obserwuje foldery Skills i odświeża migawkę Skills (domyślnie: true).
- `load.watchDebounceMs`: debounce dla zdarzeń watchera Skills w milisekundach (domyślnie: 250).
- `install.preferBrew`: preferuje instalatory brew, gdy są dostępne (domyślnie: true).
- `install.nodeManager`: preferencja instalatora node (`npm` | `pnpm` | `yarn` | `bun`, domyślnie: npm).
  Wpływa to tylko na **instalacje Skills**; runtime Gateway nadal powinien używać Node
  (Bun niezalecany dla WhatsApp/Telegram).
  - `openclaw setup --node-manager` jest węższe i obecnie akceptuje `npm`,
    `pnpm` lub `bun`. Ustaw ręcznie `skills.install.nodeManager: "yarn"`, jeśli
    chcesz instalacji Skills opartych na Yarn.
- `entries.<skillKey>`: nadpisania per Skill.
- `agents.defaults.skills`: opcjonalna domyślna allowlista Skills dziedziczona przez agentów,
  które pomijają `agents.list[].skills`.
- `agents.list[].skills`: opcjonalna końcowa allowlista Skills per agent; jawne
  listy zastępują dziedziczone wartości domyślne zamiast się z nimi scalać.

Pola per Skill:

- `enabled`: ustaw `false`, aby wyłączyć Skill nawet wtedy, gdy jest dołączony/zainstalowany.
- `env`: zmienne środowiskowe wstrzykiwane dla uruchomienia agenta (tylko jeśli nie są już ustawione).
- `apiKey`: opcjonalne udogodnienie dla Skills, które deklarują podstawową zmienną env.
  Obsługuje zwykły string albo obiekt SecretRef (`{ source, provider, id }`).

## Uwagi

- Klucze pod `entries` domyślnie mapują się na nazwę Skill. Jeśli Skill definiuje
  `metadata.openclaw.skillKey`, użyj zamiast tego tego klucza.
- Priorytet ładowania to `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → dołączone Skills →
  `skills.load.extraDirs`.
- Zmiany w Skills są uwzględniane przy następnym obrocie agenta, gdy watcher jest włączony.

### Sandboxowane Skills + zmienne env

Gdy sesja jest **sandboxowana**, procesy Skills działają wewnątrz skonfigurowanego
backendu sandbox. Sandbox **nie** dziedziczy hostowego `process.env`.

Użyj jednego z poniższych:

- `agents.defaults.sandbox.docker.env` dla backendu Docker (albo per agent `agents.list[].sandbox.docker.env`)
- wbuduj env we własny obraz sandbox albo zdalne środowisko sandbox

Globalne `env` i `skills.entries.<skill>.env/apiKey` dotyczą tylko uruchomień **na hoście**.
