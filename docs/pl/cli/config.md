---
read_when:
    - Chcesz odczytywać lub edytować config nieinteraktywnie
summary: Dokumentacja CLI dla `openclaw config` (get/set/unset/file/schema/validate)
title: config
x-i18n:
    generated_at: "2026-04-23T09:58:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b496b6c02eeb144bfe800b801ea48a178b02bc7a87197dbf189b27d6fcf41c9
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Pomocniki konfiguracji do nieinteraktywnych edycji w `openclaw.json`: pobieranie/ustawianie/usuwanie/plik/schema/validate
wartości według ścieżki oraz wyświetlanie aktywnego pliku config. Uruchom bez podkomendy, aby
otworzyć kreator konfiguracji (tak samo jak `openclaw configure`).

Opcje główne:

- `--section <section>`: powtarzalny filtr sekcji konfiguracji prowadzonej, gdy uruchamiasz `openclaw config` bez podkomendy

Obsługiwane sekcje konfiguracji prowadzonej:

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
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Wypisuje wygenerowany JSON schema dla `openclaw.json` na stdout jako JSON.

Co zawiera:

- Bieżący schema głównego configu oraz główne pole tekstowe `$schema` dla narzędzi edytora
- Metadane dokumentacyjne pól `title` i `description` używane przez interfejs Control
- Zagnieżdżone obiekty, wildcard (`*`) i węzły elementów tablicy (`[]`) dziedziczą te same metadane `title` / `description`, gdy istnieje pasująca dokumentacja pola
- Gałęzie `anyOf` / `oneOf` / `allOf` również dziedziczą te same metadane dokumentacyjne, gdy istnieje pasująca dokumentacja pola
- Metadane schematu plugin + channel w trybie best-effort, gdy można załadować manifesty runtime
- Czysty schema zapasowy nawet wtedy, gdy bieżący config jest nieprawidłowy

Powiązane runtime RPC:

- `config.schema.lookup` zwraca jedną znormalizowaną ścieżkę configu z płytkim
  węzłem schematu (`title`, `description`, `type`, `enum`, `const`, typowe ograniczenia),
  dopasowanymi metadanymi wskazówek interfejsu i podsumowaniami bezpośrednich elementów podrzędnych. Używaj tego do
  zawężonego do ścieżki zagłębiania w interfejsie Control lub w klientach niestandardowych.

```bash
openclaw config schema
```

Przekieruj do pliku, jeśli chcesz go sprawdzić lub zwalidować innymi narzędziami:

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

Wartości są parsowane jako JSON5, gdy to możliwe; w przeciwnym razie są traktowane jako ciągi znaków.
Użyj `--strict-json`, aby wymagać parsowania JSON5. `--json` nadal jest obsługiwane jako starszy alias.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` wypisuje surową wartość jako JSON zamiast tekstu sformatowanego dla terminala.

Przypisanie obiektu domyślnie zastępuje docelową ścieżkę. Chronione ścieżki map/list,
które często zawierają wpisy dodane przez użytkownika, takie jak `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries` i
`auth.profiles`, odmawiają zastąpień, które usunęłyby istniejące wpisy, chyba że przekażesz `--replace`.

Użyj `--merge`, gdy dodajesz wpisy do tych map:

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Użyj `--replace` tylko wtedy, gdy celowo chcesz, aby podana wartość stała się
pełną wartością docelową.

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

3. Tryb budowania dostawcy (tylko ścieżka `secrets.providers.<alias>`):

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

Uwaga dotycząca polityki:

- Przypisania SecretRef są odrzucane na nieobsługiwanych powierzchniach mutowalnych runtime (na przykład `hooks.token`, `commands.ownerDisplaySecret`, tokeny Webhooka do wiązania wątków Discorda i WhatsApp creds JSON). Zobacz [Powierzchnia danych uwierzytelniających SecretRef](/pl/reference/secretref-credential-surface).

Parsowanie wsadowe zawsze używa ładunku wsadowego (`--batch-json`/`--batch-file`) jako źródła prawdy.
`--strict-json` / `--json` nie zmieniają zachowania parsowania wsadowego.

Tryb ścieżka/wartość JSON nadal jest obsługiwany zarówno dla SecretRefs, jak i dostawców:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Flagi budowania dostawcy

Cele budowania dostawcy muszą używać `secrets.providers.<alias>` jako ścieżki.

Wspólne flagi:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Dostawca env (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (powtarzalne)

Dostawca pliku (`--provider-source file`):

- `--provider-path <path>` (wymagane)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`

Dostawca exec (`--provider-source exec`):

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

Przykład utwardzonego dostawcy exec:

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

Użyj `--dry-run`, aby zwalidować zmiany bez zapisywania `openclaw.json`.

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

Zachowanie dry run:

- Tryb builder: uruchamia kontrole rozwiązywalności SecretRef dla zmienionych refów/dostawców.
- Tryb JSON (`--strict-json`, `--json` lub tryb wsadowy): uruchamia walidację schematu oraz kontrole rozwiązywalności SecretRef.
- Walidacja polityki również działa dla znanych nieobsługiwanych powierzchni docelowych SecretRef.
- Kontrole polityki oceniają pełny config po zmianach, więc zapisy obiektów nadrzędnych (na przykład ustawienie `hooks` jako obiektu) nie mogą ominąć walidacji nieobsługiwanych powierzchni.
- Kontrole exec SecretRef są domyślnie pomijane podczas dry run, aby uniknąć efektów ubocznych komend.
- Użyj `--allow-exec` z `--dry-run`, aby włączyć kontrole exec SecretRef (może to wykonać komendy dostawcy).
- `--allow-exec` działa tylko w dry run i zwraca błąd, jeśli zostanie użyte bez `--dry-run`.

`--dry-run --json` wypisuje raport czytelny dla maszyn:

- `ok`: czy dry run przeszedł pomyślnie
- `operations`: liczba ocenionych przypisań
- `checks`: czy uruchomiono kontrole schematu/rozwiązywalności
- `checks.resolvabilityComplete`: czy kontrole rozwiązywalności zostały ukończone (false, gdy refy exec są pomijane)
- `refsChecked`: liczba refów faktycznie rozwiązanych podczas dry run
- `skippedExecRefs`: liczba refów exec pominiętych, ponieważ nie ustawiono `--allow-exec`
- `errors`: ustrukturyzowane błędy schematu/rozwiązywalności, gdy `ok=false`

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
      ref?: string, // obecne dla błędów rozwiązywalności
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

Jeśli dry run się nie powiedzie:

- `config schema validation failed`: kształt configu po zmianach jest nieprawidłowy; popraw ścieżkę/wartość lub kształt obiektu dostawcy/ref.
- `Config policy validation failed: unsupported SecretRef usage`: przenieś to poświadczenie z powrotem do zwykłego tekstu/wejścia typu string i używaj SecretRefs tylko na obsługiwanych powierzchniach.
- `SecretRef assignment(s) could not be resolved`: wskazany dostawca/ref nie może zostać obecnie rozwiązany (brakująca zmienna env, nieprawidłowy wskaźnik pliku, błąd dostawcy exec lub niedopasowanie dostawcy/źródła).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry run pominął refy exec; uruchom ponownie z `--allow-exec`, jeśli potrzebujesz walidacji rozwiązywalności exec.
- W trybie wsadowym popraw błędne wpisy i uruchom ponownie `--dry-run` przed zapisem.

## Bezpieczeństwo zapisu

`openclaw config set` i inne narzędzia do zapisu configu należące do OpenClaw walidują pełny
config po zmianach przed zapisaniem go na dysk. Jeśli nowy ładunek nie przejdzie walidacji schematu
albo wygląda jak destrukcyjne nadpisanie, aktywny config pozostaje bez zmian,
a odrzucony ładunek jest zapisywany obok niego jako `openclaw.json.rejected.*`.
Aktywna ścieżka configu musi być zwykłym plikiem. Układy z symlinkowanym `openclaw.json`
nie są obsługiwane przy zapisie; użyj `OPENCLAW_CONFIG_PATH`, aby wskazać bezpośrednio
rzeczywisty plik.

Preferuj zapisy przez CLI przy małych zmianach:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Jeśli zapis zostanie odrzucony, sprawdź zapisany ładunek i popraw pełny kształt configu:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Bezpośrednie zapisy z edytora są nadal dozwolone, ale działający Gateway traktuje je jako
niezaufane, dopóki nie przejdą walidacji. Nieprawidłowe bezpośrednie edycje mogą zostać przywrócone z
ostatniej znanej dobrej kopii zapasowej podczas uruchamiania lub hot reload. Zobacz
[Rozwiązywanie problemów z Gatewayem](/pl/gateway/troubleshooting#gateway-restored-last-known-good-config).

## Podkomendy

- `config file`: wypisuje ścieżkę aktywnego pliku config (rozwiązaną z `OPENCLAW_CONFIG_PATH` lub z domyślnej lokalizacji). Ścieżka powinna wskazywać zwykły plik, a nie symlink.

Po edycjach zrestartuj Gateway.

## Validate

Waliduje bieżący config względem aktywnego schematu bez uruchamiania
Gatewaya.

```bash
openclaw config validate
openclaw config validate --json
```

Gdy `openclaw config validate` przechodzi pomyślnie, możesz użyć lokalnego TUI, aby
osadzony agent porównał aktywny config z dokumentacją, podczas gdy Ty walidujesz
każdą zmianę z tego samego terminala:

Jeśli walidacja już kończy się błędem, zacznij od `openclaw configure` lub
`openclaw doctor --fix`. `openclaw chat` nie omija ochrony przed
nieprawidłowym configiem.

```bash
openclaw chat
```

Następnie w TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Typowa pętla naprawy:

- Poproś agenta, aby porównał Twój bieżący config z odpowiednią stroną dokumentacji i zasugerował najmniejszą poprawkę.
- Zastosuj precyzyjne edycje za pomocą `openclaw config set` lub `openclaw configure`.
- Po każdej zmianie ponownie uruchom `openclaw config validate`.
- Jeśli walidacja przechodzi, ale runtime nadal działa nieprawidłowo, uruchom `openclaw doctor` lub `openclaw doctor --fix`, aby uzyskać pomoc z migracją i naprawą.
