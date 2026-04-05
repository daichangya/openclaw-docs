---
read_when:
    - Você quer ler ou editar a configuração de forma não interativa
summary: Referência da CLI para `openclaw config` (get/set/unset/file/schema/validate)
title: config
x-i18n:
    generated_at: "2026-04-05T12:37:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4de30f41e15297019151ad1a5b306cb331fd5c2beefd5ce5b98fcc51e95f0de
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Auxiliares de configuração para edições não interativas em `openclaw.json`: obter/definir/remover/arquivo/schema/validate
valores por caminho e imprimir o arquivo de configuração ativo. Execute sem um subcomando para
abrir o assistente de configuração (o mesmo que `openclaw configure`).

Opções de nível superior:

- `--section <section>`: filtro repetível de seção da configuração guiada quando você executa `openclaw config` sem um subcomando

Seções guiadas compatíveis:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## Exemplos

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Imprime o schema JSON gerado para `openclaw.json` em stdout como JSON.

O que ele inclui:

- O schema de configuração raiz atual, além de um campo de string `$schema` na raiz para ferramentas de editor
- Metadados de documentação `title` e `description` de campo usados pela interface de Control
- Nós aninhados de objeto, curinga (`*`) e item de matriz (`[]`) herdam os mesmos metadados `title` / `description` quando existe documentação de campo correspondente
- Ramificações `anyOf` / `oneOf` / `allOf` também herdam os mesmos metadados de documentação quando existe documentação de campo correspondente
- Metadados de schema de plugin + canal em tempo real no melhor esforço quando manifests de runtime podem ser carregados
- Um schema de fallback limpo mesmo quando a configuração atual é inválida

RPC de runtime relacionado:

- `config.schema.lookup` retorna um caminho de configuração normalizado com um
  nó de schema superficial (`title`, `description`, `type`, `enum`, `const`, limites comuns),
  metadados de dica de UI correspondentes e resumos imediatos dos filhos. Use-o para
  detalhamento por caminho na interface de Control ou em clientes personalizados.

```bash
openclaw config schema
```

Direcione-o para um arquivo quando quiser inspecioná-lo ou validá-lo com outras ferramentas:

```bash
openclaw config schema > openclaw.schema.json
```

### Caminhos

Os caminhos usam notação por ponto ou colchetes:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Use o índice da lista de agentes para direcionar um agente específico:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Valores

Os valores são analisados como JSON5 quando possível; caso contrário, são tratados como strings.
Use `--strict-json` para exigir análise JSON5. `--json` continua compatível como alias legado.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` imprime o valor bruto como JSON em vez de texto formatado para terminal.

## Modos de `config set`

`openclaw config set` oferece suporte a quatro estilos de atribuição:

1. Modo de valor: `openclaw config set <path> <value>`
2. Modo construtor de SecretRef:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Modo construtor de provedor (somente caminho `secrets.providers.<alias>`):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. Modo em lote (`--batch-json` ou `--batch-file`):

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

Observação de política:

- Atribuições de SecretRef são rejeitadas em superfícies sem suporte para mutação em runtime (por exemplo `hooks.token`, `commands.ownerDisplaySecret`, tokens de webhook de vínculo de thread do Discord e JSON de credenciais do WhatsApp). Consulte [Superfície de credenciais SecretRef](/reference/secretref-credential-surface).

A análise em lote sempre usa a carga em lote (`--batch-json`/`--batch-file`) como fonte da verdade.
`--strict-json` / `--json` não alteram o comportamento da análise em lote.

O modo JSON path/value continua compatível tanto para SecretRefs quanto para provedores:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Flags do construtor de provedor

Os destinos do construtor de provedor devem usar `secrets.providers.<alias>` como caminho.

Flags comuns:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Provedor env (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (repetível)

Provedor file (`--provider-source file`):

- `--provider-path <path>` (obrigatório)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`

Provedor exec (`--provider-source exec`):

- `--provider-command <path>` (obrigatório)
- `--provider-arg <arg>` (repetível)
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>` (repetível)
- `--provider-pass-env <ENV_VAR>` (repetível)
- `--provider-trusted-dir <path>` (repetível)
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

Exemplo de provedor exec reforçado:

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

## Simulação

Use `--dry-run` para validar alterações sem gravar `openclaw.json`.

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

Comportamento da simulação:

- Modo construtor: executa verificações de resolubilidade de SecretRef para refs/provedores alterados.
- Modo JSON (`--strict-json`, `--json` ou modo em lote): executa validação de schema mais verificações de resolubilidade de SecretRef.
- A validação de política também é executada para superfícies de destino SecretRef conhecidas sem suporte.
- As verificações de política avaliam toda a configuração após a alteração, então gravações em objetos pai (por exemplo, definir `hooks` como objeto) não podem contornar a validação de superfície sem suporte.
- Verificações de SecretRef exec são ignoradas por padrão durante a simulação para evitar efeitos colaterais de comandos.
- Use `--allow-exec` com `--dry-run` para ativar verificações de SecretRef exec (isso pode executar comandos de provedor).
- `--allow-exec` é apenas para simulação e gera erro se usado sem `--dry-run`.

`--dry-run --json` imprime um relatório legível por máquina:

- `ok`: se a simulação passou
- `operations`: número de atribuições avaliadas
- `checks`: se as verificações de schema/resolubilidade foram executadas
- `checks.resolvabilityComplete`: se as verificações de resolubilidade foram executadas até o fim (`false` quando refs exec são ignoradas)
- `refsChecked`: número de refs realmente resolvidas durante a simulação
- `skippedExecRefs`: número de refs exec ignoradas porque `--allow-exec` não foi definido
- `errors`: falhas estruturadas de schema/resolubilidade quando `ok=false`

### Formato da saída JSON

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

Exemplo de sucesso:

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

Exemplo de falha:

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

Se a simulação falhar:

- `config schema validation failed`: o formato da sua configuração após a alteração é inválido; corrija o caminho/valor ou o formato do objeto de provedor/ref.
- `Config policy validation failed: unsupported SecretRef usage`: mova essa credencial de volta para entrada em plaintext/string e mantenha SecretRefs apenas em superfícies compatíveis.
- `SecretRef assignment(s) could not be resolved`: o provedor/ref referenciado atualmente não pode ser resolvido (variável de ambiente ausente, ponteiro de arquivo inválido, falha do provedor exec ou incompatibilidade de provedor/origem).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: a simulação ignorou refs exec; execute novamente com `--allow-exec` se precisar validar a resolubilidade exec.
- Para modo em lote, corrija as entradas com falha e execute `--dry-run` novamente antes de gravar.

## Subcomandos

- `config file`: imprime o caminho do arquivo de configuração ativo (resolvido de `OPENCLAW_CONFIG_PATH` ou da localização padrão).

Reinicie o gateway após as edições.

## Validar

Valide a configuração atual em relação ao schema ativo sem iniciar o
gateway.

```bash
openclaw config validate
openclaw config validate --json
```
