---
read_when:
    - Chcesz odczytywać lub edytować konfigurację w trybie nieinteraktywnym
summary: Dokumentacja CLI dla `openclaw config` (`get`/`set`/`unset`/`file`/`schema`/`validate`)
title: Konfiguracja
x-i18n:
    generated_at: "2026-04-25T13:43:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60567d39174d7214461f995d32f3064777d7437ff82226961eab404cd7fec5c4
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Pomocniki konfiguracji do nieinteraktywnych zmian w `openclaw.json`: get/set/unset/file/schema/validate
wartości według ścieżki oraz wyświetlanie aktywnego pliku konfiguracji. Uruchom bez podpolecenia, aby
otworzyć kreator konfiguracji (tak samo jak `openclaw configure`).

Opcje główne:

- `--section <section>`: powtarzalny filtr sekcji kreatora konfiguracji, gdy uruchamiasz `openclaw config` bez podpolecenia

Obsługiwane sekcje kreatora:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## Przykłady

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Wypisuje wygenerowany schemat JSON dla `openclaw.json` na stdout jako JSON.

Co zawiera:

- Bieżący schemat głównej konfiguracji oraz główne pole tekstowe `$schema` dla narzędzi edytora
- Metadane dokumentacyjne pól `title` i `description` używane przez interfejs Control UI
- Zagnieżdżone obiekty, węzły wildcard (`*`) i elementów tablic (`[]`) dziedziczą te same metadane `title` / `description`, gdy istnieje pasująca dokumentacja pola
- Gałęzie `anyOf` / `oneOf` / `allOf` również dziedziczą te same metadane dokumentacyjne, gdy istnieje pasująca dokumentacja pola
- Metadane schematu live Plugin i kanałów w trybie best-effort, gdy można załadować manifesty runtime
- Czysty schemat awaryjny nawet wtedy, gdy bieżąca konfiguracja jest nieprawidłowa

Powiązane RPC runtime:

- `config.schema.lookup` zwraca jedną znormalizowaną ścieżkę konfiguracji z płytkim
  węzłem schematu (`title`, `description`, `type`, `enum`, `const`, wspólne ograniczenia),
  dopasowanymi metadanymi podpowiedzi interfejsu i podsumowaniami bezpośrednich elementów podrzędnych. Używaj tego do
  zagłębiania się w ścieżki w Control UI lub niestandardowych klientach.

```bash
openclaw config schema
```

Przekieruj do pliku, gdy chcesz go sprawdzić lub zweryfikować innymi narzędziami:

```bash
openclaw config schema > openclaw.schema.json
```

### Ścieżki

Ścieżki używają notacji kropkowej lub nawiasowej:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Użyj indeksu listy agentów, aby wskazać konkretnego agenta:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Wartości

Wartości są analizowane jako JSON5, jeśli to możliwe; w przeciwnym razie są traktowane jako ciągi znaków.
Użyj `--strict-json`, aby wymagać analizy JSON5. `--json` pozostaje obsługiwane jako starszy alias.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` wypisuje surową wartość jako JSON zamiast tekstu sformatowanego dla terminala.

Przypisanie obiektu domyślnie zastępuje ścieżkę docelową. Chronione ścieżki map/list,
które często zawierają wpisy dodane przez użytkownika, takie jak `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries` oraz
`auth.profiles`, odrzucają zastąpienia, które usunęłyby istniejące wpisy, chyba że
przekażesz `--replace`.

Użyj `--merge` przy dodawaniu wpisów do tych map:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Używaj `--replace` tylko wtedy, gdy celowo chcesz, aby podana wartość stała się
całą wartością docelową.

## Tryby `config set`

`openclaw config set` obsługuje cztery style przypisania:

1. Tryb wartości: `openclaw config set <path> <value>`
2. Tryb budowania SecretRef:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Tryb budowania providera (tylko ścieżka `secrets.providers.<alias>`):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. Tryb wsadowy (`--batch-json` lub `--batch-file`):

```bash
openclaw config set --batch-json '[
  {
    "path": "secrets.providers.default",
    "provider": { "source": "env" }
  },
  {
    "path": "channels.discord.token",
    "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
  }
]'
```

```bash
openclaw config set --batch-file ./config-set.batch.json --dry-run
```

Uwaga dotycząca zasad:

- Przypisania SecretRef są odrzucane na nieobsługiwanych powierzchniach mutowalnych w runtime (na przykład `hooks.token`, `commands.ownerDisplaySecret`, tokeny Webhook powiązań wątków Discord i JSON danych uwierzytelniających WhatsApp). Zobacz [SecretRef Credential Surface](/pl/reference/secretref-credential-surface).

Analiza wsadowa zawsze używa ładunku wsadowego (`--batch-json`/`--batch-file`) jako źródła prawdy.
`--strict-json` / `--json` nie zmieniają zachowania analizy wsadowej.

Tryb ścieżki/wartości JSON nadal jest obsługiwany zarówno dla SecretRef, jak i providerów:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Flagi budowania providera

Cele budowania providera muszą używać `secrets.providers.<alias>` jako ścieżki.

Wspólne flagi:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Provider środowiskowy (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (powtarzalne)

Provider plikowy (`--provider-source file`):

- `--provider-path <path>` (wymagane)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

Provider exec (`--provider-source exec`):

- `--provider-command <path>` (wymagane)
- `--provider-arg <arg>` (powtarzalne)
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>` (powtarzalne)
- `--provider-pass-env <ENV_VAR>` (powtarzalne)
- `--provider-trusted-dir <path>` (powtarzalne)
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

Przykład utwardzonego providera exec:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## Dry run

Użyj `--dry-run`, aby zweryfikować zmiany bez zapisywania `openclaw.json`.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

Zachowanie dry-run:

- Tryb builder: uruchamia kontrole rozwiązywalności SecretRef dla zmienionych refów/providerów.
- Tryb JSON (`--strict-json`, `--json` lub tryb wsadowy): uruchamia walidację schematu oraz kontrole rozwiązywalności SecretRef.
- Walidacja zasad również jest uruchamiana dla znanych nieobsługiwanych powierzchni docelowych SecretRef.
- Kontrole zasad oceniają pełną konfigurację po zmianie, więc zapisy obiektu nadrzędnego (na przykład ustawienie `hooks` jako obiektu) nie mogą obejść walidacji nieobsługiwanej powierzchni.
- Kontrole SecretRef exec są domyślnie pomijane podczas dry-run, aby uniknąć skutków ubocznych wykonywania poleceń.
- Użyj `--allow-exec` razem z `--dry-run`, aby włączyć kontrole SecretRef exec (może to wykonać polecenia providera).
- `--allow-exec` działa tylko z dry-run i zwraca błąd, jeśli zostanie użyte bez `--dry-run`.

`--dry-run --json` wypisuje raport czytelny maszynowo:

- `ok`: czy dry-run zakończył się powodzeniem
- `operations`: liczba ocenionych przypisań
- `checks`: czy uruchomiono kontrole schematu/rozwiązywalności
- `checks.resolvabilityComplete`: czy kontrole rozwiązywalności zakończyły się w pełni (`false`, gdy refy exec są pomijane)
- `refsChecked`: liczba refów faktycznie rozwiązanych podczas dry-run
- `skippedExecRefs`: liczba refów exec pominiętych, ponieważ nie ustawiono `--allow-exec`
- `errors`: uporządkowane błędy schematu/rozwiązywalności, gdy `ok=false`

### Kształt wyjścia JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // present for resolvability errors
    },
  ],
}
```

Przykład powodzenia:

```json
{
  "ok": true,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0
}
```

Przykład niepowodzenia:

```json
{
  "ok": false,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0,
  "errors": [
    {
      "kind": "resolvability",
      "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
      "ref": "env:default:MISSING_TEST_SECRET"
    }
  ]
}
```

Jeśli dry-run się nie powiedzie:

- `config schema validation failed`: kształt konfiguracji po zmianie jest nieprawidłowy; popraw ścieżkę/wartość lub kształt obiektu provider/ref.
- `Config policy validation failed: unsupported SecretRef usage`: przenieś to poświadczenie z powrotem do wejścia plaintext/string i używaj SecretRef tylko na obsługiwanych powierzchniach.
- `SecretRef assignment(s) could not be resolved`: wskazany provider/ref obecnie nie może zostać rozwiązany (brakująca zmienna środowiskowa, nieprawidłowy wskaźnik pliku, błąd providera exec lub niedopasowanie provider/source).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run pominął refy exec; uruchom ponownie z `--allow-exec`, jeśli potrzebujesz walidacji rozwiązywalności exec.
- W trybie wsadowym popraw błędne wpisy i ponownie uruchom `--dry-run` przed zapisem.

## Bezpieczeństwo zapisu

`openclaw config set` i inne mechanizmy zapisu konfiguracji zarządzane przez OpenClaw walidują pełną
konfigurację po zmianie, zanim zatwierdzą ją na dysku. Jeśli nowy ładunek nie przejdzie walidacji schematu
lub wygląda na destrukcyjne nadpisanie, aktywna konfiguracja pozostaje bez zmian,
a odrzucony ładunek jest zapisywany obok niej jako `openclaw.json.rejected.*`.
Aktywna ścieżka konfiguracji musi być zwykłym plikiem. Układy z dowiązanym `openclaw.json`
nie są obsługiwane przy zapisie; użyj `OPENCLAW_CONFIG_PATH`, aby wskazać bezpośrednio
rzeczywisty plik.

Preferuj zapisy przez CLI przy małych zmianach:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Jeśli zapis zostanie odrzucony, sprawdź zapisany ładunek i popraw pełny kształt konfiguracji:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Bezpośrednie zapisy przez edytor są nadal dozwolone, ale działający Gateway traktuje je jako
niezaufane, dopóki nie przejdą walidacji. Nieprawidłowe bezpośrednie zmiany mogą zostać odtworzone z
ostatniej znanej poprawnej kopii zapasowej podczas uruchamiania lub hot reload. Zobacz
[rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-restored-last-known-good-config).

Odzyskiwanie całego pliku jest zarezerwowane dla globalnie uszkodzonej konfiguracji, takiej jak błędy
parsowania, błędy schematu na poziomie głównym, błędy starszych migracji lub mieszane błędy Pluginów
i poziomu głównego. Jeśli walidacja kończy się niepowodzeniem tylko w `plugins.entries.<id>...`,
OpenClaw pozostawia aktywne `openclaw.json` bez zmian i zgłasza problem lokalny dla Plugin zamiast
przywracać `.last-good`. Zapobiega to sytuacji, w której zmiany schematu Plugin lub niedopasowanie
`minHostVersion` cofają niezwiązane ustawienia użytkownika, takie jak modele,
providery, profile uwierzytelniania, kanały, ekspozycja Gateway, narzędzia, pamięć, przeglądarka lub
konfiguracja Cron.

## Podpolecenia

- `config file`: Wypisz ścieżkę aktywnego pliku konfiguracji (rozwiązaną z `OPENCLAW_CONFIG_PATH` lub lokalizacji domyślnej). Ścieżka powinna wskazywać zwykły plik, a nie dowiązanie symboliczne.

Po zmianach uruchom ponownie Gateway.

## Walidacja

Zweryfikuj bieżącą konfigurację względem aktywnego schematu bez uruchamiania
Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Gdy `openclaw config validate` przechodzi pomyślnie, możesz użyć lokalnego TUI, aby
osadzony agent porównał aktywną konfigurację z dokumentacją, podczas gdy będziesz walidować
każdą zmianę z tego samego terminala:

Jeśli walidacja już się nie powiedzie, zacznij od `openclaw configure` lub
`openclaw doctor --fix`. `openclaw chat` nie omija zabezpieczenia przed
nieprawidłową konfiguracją.

```bash
openclaw chat
```

Następnie wewnątrz TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Typowa pętla naprawy:

- Poproś agenta, aby porównał Twoją bieżącą konfigurację z odpowiednią stroną dokumentacji i zasugerował najmniejszą poprawkę.
- Zastosuj ukierunkowane zmiany za pomocą `openclaw config set` lub `openclaw configure`.
- Po każdej zmianie ponownie uruchom `openclaw config validate`.
- Jeśli walidacja przechodzi, ale runtime nadal działa nieprawidłowo, uruchom `openclaw doctor` lub `openclaw doctor --fix`, aby uzyskać pomoc w migracji i naprawie.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Konfiguracja](/pl/gateway/configuration)
