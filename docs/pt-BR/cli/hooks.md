---
read_when:
    - Você quer gerenciar hooks de agente
    - Você quer inspecionar a disponibilidade de hooks ou ativar hooks de workspace
summary: Referência da CLI para `openclaw hooks` (hooks de agente)
title: hooks
x-i18n:
    generated_at: "2026-04-05T12:38:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8dc9144e9844e9c3cdef2514098eb170543746fcc55ca5a1cc746c12d80209e7
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Gerencie hooks de agente (automações orientadas por eventos para comandos como `/new`, `/reset` e inicialização do gateway).

Executar `openclaw hooks` sem subcomando equivale a `openclaw hooks list`.

Relacionado:

- Hooks: [Hooks](/automation/hooks)
- Hooks de plugin: [Hooks de plugin](/plugins/architecture#provider-runtime-hooks)

## Listar todos os hooks

```bash
openclaw hooks list
```

Lista todos os hooks descobertos dos diretórios de workspace, gerenciados, extras e incluídos.

**Opções:**

- `--eligible`: mostra apenas hooks elegíveis (requisitos atendidos)
- `--json`: saída como JSON
- `-v, --verbose`: mostra informações detalhadas, incluindo requisitos ausentes

**Exemplo de saída:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**Exemplo (verbose):**

```bash
openclaw hooks list --verbose
```

Mostra requisitos ausentes para hooks inelegíveis.

**Exemplo (JSON):**

```bash
openclaw hooks list --json
```

Retorna JSON estruturado para uso programático.

## Obter informações de um hook

```bash
openclaw hooks info <name>
```

Mostra informações detalhadas sobre um hook específico.

**Argumentos:**

- `<name>`: nome ou chave do hook (por exemplo, `session-memory`)

**Opções:**

- `--json`: saída como JSON

**Exemplo:**

```bash
openclaw hooks info session-memory
```

**Saída:**

```
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## Verificar elegibilidade dos hooks

```bash
openclaw hooks check
```

Mostra um resumo do status de elegibilidade dos hooks (quantos estão prontos vs. não prontos).

**Opções:**

- `--json`: saída como JSON

**Exemplo de saída:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Ativar um hook

```bash
openclaw hooks enable <name>
```

Ativa um hook específico adicionando-o à sua configuração (`~/.openclaw/openclaw.json` por padrão).

**Observação:** hooks de workspace ficam desativados por padrão até serem ativados aqui ou na configuração. Hooks gerenciados por plugins mostram `plugin:<id>` em `openclaw hooks list` e não podem ser ativados/desativados aqui. Ative/desative o plugin em vez disso.

**Argumentos:**

- `<name>`: nome do hook (por exemplo, `session-memory`)

**Exemplo:**

```bash
openclaw hooks enable session-memory
```

**Saída:**

```
✓ Hook ativado: 💾 session-memory
```

**O que ele faz:**

- Verifica se o hook existe e é elegível
- Atualiza `hooks.internal.entries.<name>.enabled = true` na sua configuração
- Salva a configuração no disco

Se o hook veio de `<workspace>/hooks/`, essa etapa de opt-in é necessária para que
o Gateway o carregue.

**Depois de ativar:**

- Reinicie o gateway para recarregar os hooks (reinicie o app de barra de menu no macOS ou reinicie seu processo do gateway em desenvolvimento).

## Desativar um hook

```bash
openclaw hooks disable <name>
```

Desativa um hook específico atualizando sua configuração.

**Argumentos:**

- `<name>`: nome do hook (por exemplo, `command-logger`)

**Exemplo:**

```bash
openclaw hooks disable command-logger
```

**Saída:**

```
⏸ Hook desativado: 📝 command-logger
```

**Depois de desativar:**

- Reinicie o gateway para recarregar os hooks

## Observações

- `openclaw hooks list --json`, `info --json` e `check --json` gravam JSON estruturado diretamente em stdout.
- Hooks gerenciados por plugin não podem ser ativados nem desativados aqui; ative ou desative o plugin proprietário em vez disso.

## Instalar pacotes de hooks

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Instale pacotes de hooks pelo instalador unificado de plugins.

`openclaw hooks install` ainda funciona como alias de compatibilidade, mas imprime um
aviso de descontinuação e encaminha para `openclaw plugins install`.

Especificações npm são **somente do registro** (nome do pacote + **versão exata** opcional ou
**dist-tag**). Especificações Git/URL/file e intervalos semver são rejeitados. Instalações de
dependências são executadas com `--ignore-scripts` por segurança.

Especificações simples e `@latest` permanecem na trilha estável. Se o npm resolver qualquer um
desses para uma pré-release, o OpenClaw interrompe e pede que você faça opt-in explicitamente com uma
tag de pré-release como `@beta`/`@rc` ou uma versão exata de pré-release.

**O que ele faz:**

- Copia o pacote de hooks para `~/.openclaw/hooks/<id>`
- Ativa os hooks instalados em `hooks.internal.entries.*`
- Registra a instalação em `hooks.internal.installs`

**Opções:**

- `-l, --link`: vincula um diretório local em vez de copiar (adiciona-o a `hooks.internal.load.extraDirs`)
- `--pin`: registra instalações npm como `name@version` exato resolvido em `hooks.internal.installs`

**Arquivos compatíveis:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Exemplos:**

```bash
# Local directory
openclaw plugins install ./my-hook-pack

# Local archive
openclaw plugins install ./my-hook-pack.zip

# NPM package
openclaw plugins install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw plugins install -l ./my-hook-pack
```

Pacotes de hooks vinculados são tratados como hooks gerenciados de um diretório
configurado pelo operador, não como hooks de workspace.

## Atualizar pacotes de hooks

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Atualize pacotes de hooks baseados em npm rastreados pelo atualizador unificado de plugins.

`openclaw hooks update` ainda funciona como alias de compatibilidade, mas imprime um
aviso de descontinuação e encaminha para `openclaw plugins update`.

**Opções:**

- `--all`: atualiza todos os pacotes de hooks rastreados
- `--dry-run`: mostra o que mudaria sem gravar

Quando existe um hash de integridade armazenado e o hash do artefato buscado muda,
o OpenClaw imprime um aviso e pede confirmação antes de prosseguir. Use o `--yes`
global para ignorar prompts em execuções de CI/não interativas.

## Hooks incluídos

### session-memory

Salva o contexto da sessão na memória quando você emite `/new` ou `/reset`.

**Ativar:**

```bash
openclaw hooks enable session-memory
```

**Saída:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Consulte:** [documentação do session-memory](/automation/hooks#session-memory)

### bootstrap-extra-files

Injeta arquivos adicionais de bootstrap (por exemplo `AGENTS.md` / `TOOLS.md` locais do monorepo) durante `agent:bootstrap`.

**Ativar:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Consulte:** [documentação do bootstrap-extra-files](/automation/hooks#bootstrap-extra-files)

### command-logger

Registra todos os eventos de comando em um arquivo de auditoria centralizado.

**Ativar:**

```bash
openclaw hooks enable command-logger
```

**Saída:** `~/.openclaw/logs/commands.log`

**Ver logs:**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Consulte:** [documentação do command-logger](/automation/hooks#command-logger)

### boot-md

Executa `BOOT.md` quando o gateway inicia (depois que os canais são iniciados).

**Eventos**: `gateway:startup`

**Ativar**:

```bash
openclaw hooks enable boot-md
```

**Consulte:** [documentação do boot-md](/automation/hooks#boot-md)
