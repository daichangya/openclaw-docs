---
read_when:
    - Você precisa inspecionar a saída bruta do modelo para identificar vazamento de raciocínio
    - Você quer executar o Gateway em modo watch enquanto faz iterações
    - Você precisa de um fluxo de trabalho de depuração reproduzível
summary: 'Ferramentas de depuração: modo watch, streams brutos do modelo e rastreamento de vazamento de raciocínio'
title: Depuração
x-i18n:
    generated_at: "2026-04-23T05:39:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45f1c55268c02d2d52abf348760d1e00e7536788c3a9aa77854692c4d964fb6e
    source_path: help/debugging.md
    workflow: 15
---

# Depuração

Esta página cobre helpers de depuração para saída em streaming, especialmente quando um
provider mistura raciocínio em texto normal.

## Substituições de depuração em runtime

Use `/debug` no chat para definir substituições de configuração **somente de runtime** (memória, não disco).
`/debug` fica desabilitado por padrão; habilite com `commands.debug: true`.
Isso é útil quando você precisa alternar configurações obscuras sem editar `openclaw.json`.

Exemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` limpa todas as substituições e retorna à configuração em disco.

## Saída de rastreamento da sessão

Use `/trace` quando quiser ver linhas de trace/depuração de propriedade do Plugin em uma sessão
sem ativar o modo verbose completo.

Exemplos:

```text
/trace
/trace on
/trace off
```

Use `/trace` para diagnósticos de Plugin, como resumos de depuração do Active Memory.
Continue usando `/verbose` para saída normal de status/ferramenta em modo verbose e continue usando
`/debug` para substituições de configuração somente de runtime.

## Temporização temporária de depuração da CLI

O OpenClaw mantém `src/cli/debug-timing.ts` como um pequeno helper para
investigação local. Ele intencionalmente não é conectado à inicialização da CLI, ao roteamento de comandos
nem a nenhum comando por padrão. Use-o apenas enquanto depura um comando lento e então
remova a importação e os spans antes de publicar a mudança de comportamento.

Use isso quando um comando estiver lento e você precisar de uma divisão rápida por fase antes de
decidir se deve usar um profiler de CPU ou corrigir um subsistema específico.

### Adicione spans temporários

Adicione o helper próximo do código que você está investigando. Por exemplo, ao depurar
`openclaw models list`, um patch temporário em
`src/commands/models/list.list-command.ts` pode se parecer com isto:

```ts
// Apenas para depuração temporária. Remova antes de publicar.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

Diretrizes:

- Prefixe nomes de fase temporários com `debug:`.
- Adicione apenas alguns spans em torno das seções suspeitas de lentidão.
- Prefira fases amplas como `registry`, `auth_store` ou `rows` em vez de
  nomes de helpers.
- Use `time()` para trabalho síncrono e `timeAsync()` para promises.
- Mantenha o stdout limpo. O helper grava no stderr, então a saída JSON do comando continua
  analisável.
- Remova importações e spans temporários antes de abrir o PR final de correção.
- Inclua a saída de temporização ou um resumo curto na issue ou no PR que explica
  a otimização.

### Execute com saída legível

O modo legível é melhor para depuração ao vivo:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

Exemplo de saída de uma investigação temporária de `models list`:

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

Descobertas dessa saída:

| Fase                                     |    Tempo | O que isso significa                                                                                  |
| ---------------------------------------- | -------: | ----------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |    20.3s | O carregamento do armazenamento de perfis de autenticação é o maior custo e deve ser investigado primeiro. |
| `debug:models:list:ensure_models_json`   |     5.0s | A sincronização de `models.json` é cara o suficiente para inspecionar cache ou condições de salto.   |
| `debug:models:list:load_model_registry`  |     5.9s | A construção do registro e o trabalho de disponibilidade de provider também têm custos relevantes.    |
| `debug:models:list:read_registry_models` |     2.4s | Ler todos os modelos do registro não é gratuito e pode importar para `--all`.                         |
| fases de anexação de linhas              | 3.2s total | Construir cinco linhas exibidas ainda leva vários segundos, então o caminho de filtragem merece um exame mais atento. |
| `debug:models:list:print_model_table`    |      0ms | A renderização não é o gargalo.                                                                       |

Essas descobertas são suficientes para orientar o próximo patch sem manter código de temporização
nos caminhos de produção.

### Execute com saída JSON

Use o modo JSON quando quiser salvar ou comparar dados de temporização:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

Cada linha em stderr é um objeto JSON:

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### Limpe antes de publicar

Antes de abrir o PR final:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

O comando não deve retornar nenhum ponto temporário de instrumentação, a menos que o PR
esteja adicionando explicitamente uma superfície permanente de diagnóstico. Para correções normais de desempenho,
mantenha apenas a mudança de comportamento, os testes e uma nota curta com a evidência de temporização.

Para hotspots de CPU mais profundos, use profiling do Node (`--cpu-prof`) ou um
profiler externo em vez de adicionar mais wrappers de temporização.

## Modo watch do Gateway

Para iteração rápida, execute o gateway sob o observador de arquivos:

```bash
pnpm gateway:watch
```

Isso corresponde a:

```bash
node scripts/watch-node.mjs gateway --force
```

O observador reinicia em arquivos relevantes para build sob `src/`, arquivos-fonte de extensões,
metadados `package.json` e `openclaw.plugin.json` de extensões, `tsconfig.json`,
`package.json` e `tsdown.config.ts`. Alterações nos metadados de extensões reiniciam o
gateway sem forçar um rebuild do `tsdown`; alterações de código-fonte e configuração ainda
reconstroem `dist` primeiro.

Adicione qualquer flag de CLI do gateway após `gateway:watch` e ela será repassada a
cada reinicialização. Executar novamente o mesmo comando watch para o mesmo conjunto de repositório/flags agora
substitui o observador antigo em vez de deixar processos-pai observadores duplicados.

## Perfil de desenvolvimento + gateway de desenvolvimento (`--dev`)

Use o perfil de desenvolvimento para isolar o estado e iniciar uma configuração segura e descartável para
depuração. Há **duas** flags `--dev`:

- **`--dev` global (perfil):** isola o estado em `~/.openclaw-dev` e
  define a porta padrão do gateway como `19001` (portas derivadas mudam junto com ela).
- **`gateway --dev`:** instrui o Gateway a criar automaticamente uma configuração + workspace padrão**
  quando estiverem ausentes (e ignorar `BOOTSTRAP.md`).

Fluxo recomendado (perfil de desenvolvimento + bootstrap de desenvolvimento):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Se você ainda não tiver uma instalação global, execute a CLI via `pnpm openclaw ...`.

O que isso faz:

1. **Isolamento de perfil** (`--dev` global)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas mudam de acordo)

2. **Bootstrap de desenvolvimento** (`gateway --dev`)
   - Grava uma configuração mínima se estiver ausente (`gateway.mode=local`, bind em loopback).
   - Define `agent.workspace` como o workspace de desenvolvimento.
   - Define `agent.skipBootstrap=true` (sem `BOOTSTRAP.md`).
   - Preenche os arquivos do workspace se estiverem ausentes:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identidade padrão: **C3‑PO** (droide de protocolo).
   - Ignora providers de canal no modo de desenvolvimento (`OPENCLAW_SKIP_CHANNELS=1`).

Fluxo de redefinição (novo início):

```bash
pnpm gateway:dev:reset
```

Observação: `--dev` é uma flag de perfil **global** e é consumida por alguns runners.
Se precisar explicitá-la, use a forma com variável de ambiente:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` apaga configuração, credenciais, sessões e o workspace de desenvolvimento (usando
`trash`, não `rm`) e então recria a configuração padrão de desenvolvimento.

Dica: se um gateway não-dev já estiver em execução (launchd/systemd), pare-o primeiro:

```bash
openclaw gateway stop
```

## Registro de stream bruto (OpenClaw)

O OpenClaw pode registrar o **stream bruto do assistente** antes de qualquer filtragem/formatação.
Essa é a melhor forma de ver se o raciocínio está chegando como deltas de texto simples
(ou como blocos de thinking separados).

Habilite via CLI:

```bash
pnpm gateway:watch --raw-stream
```

Substituição opcional de caminho:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Variáveis de ambiente equivalentes:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Arquivo padrão:

`~/.openclaw/logs/raw-stream.jsonl`

## Registro de chunks brutos (pi-mono)

Para capturar **chunks brutos compatíveis com OpenAI** antes de serem analisados em blocos,
o pi-mono expõe um registrador separado:

```bash
PI_RAW_STREAM=1
```

Caminho opcional:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Arquivo padrão:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Observação: isso só é emitido por processos que usam o
> provider `openai-completions` do pi-mono.

## Observações de segurança

- Registros de stream bruto podem incluir prompts completos, saída de ferramenta e dados do usuário.
- Mantenha os logs locais e exclua-os após a depuração.
- Se você compartilhar logs, remova segredos e PII antes.
