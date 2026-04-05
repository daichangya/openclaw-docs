---
read_when:
    - Você precisa saber quais variáveis de ambiente são carregadas e em que ordem
    - Você está depurando chaves de API ausentes no Gateway
    - Você está documentando autenticação de provedores ou ambientes de implantação
summary: Onde o OpenClaw carrega variáveis de ambiente e a ordem de precedência
title: Variáveis de ambiente
x-i18n:
    generated_at: "2026-04-05T12:43:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80aea69ca2ffe19a4e93140f05dd81fd576955562ff9913135d38a685a0353c
    source_path: help/environment.md
    workflow: 15
---

# Variáveis de ambiente

O OpenClaw obtém variáveis de ambiente de várias fontes. A regra é **nunca substituir valores existentes**.

## Precedência (maior → menor)

1. **Ambiente do processo** (o que o processo do Gateway já possui do shell/daemon pai).
2. **`.env` no diretório de trabalho atual** (padrão do dotenv; não substitui).
3. **`.env` global** em `~/.openclaw/.env` (também conhecido como `$OPENCLAW_STATE_DIR/.env`; não substitui).
4. **Bloco `env` da configuração** em `~/.openclaw/openclaw.json` (aplicado apenas se estiver ausente).
5. **Importação opcional do shell de login** (`env.shellEnv.enabled` ou `OPENCLAW_LOAD_SHELL_ENV=1`), aplicada apenas para chaves esperadas ausentes.

Em instalações novas do Ubuntu que usam o diretório de estado padrão, o OpenClaw também trata `~/.config/openclaw/gateway.env` como fallback de compatibilidade após o `.env` global. Se ambos os arquivos existirem e divergirem, o OpenClaw manterá `~/.openclaw/.env` e imprimirá um aviso.

Se o arquivo de configuração estiver totalmente ausente, a etapa 4 será ignorada; a importação do shell ainda será executada se estiver ativada.

## Bloco `env` da configuração

Duas formas equivalentes de definir variáveis de ambiente inline (ambas sem substituição):

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

## Importação de env do shell

`env.shellEnv` executa seu shell de login e importa apenas chaves esperadas **ausentes**:

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

Equivalentes em variáveis de ambiente:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Variáveis de ambiente injetadas em runtime

O OpenClaw também injeta marcadores de contexto em processos filhos iniciados:

- `OPENCLAW_SHELL=exec`: definido para comandos executados pela ferramenta `exec`.
- `OPENCLAW_SHELL=acp`: definido para processos iniciados pelo backend de runtime ACP (por exemplo `acpx`).
- `OPENCLAW_SHELL=acp-client`: definido para `openclaw acp client` quando ele inicia o processo de bridge ACP.
- `OPENCLAW_SHELL=tui-local`: definido para comandos de shell `!` locais da TUI.

Esses são marcadores de runtime (não exigem configuração do usuário). Eles podem ser usados em lógica de shell/perfil
para aplicar regras específicas de contexto.

## Variáveis de ambiente da UI

- `OPENCLAW_THEME=light`: força a paleta clara da TUI quando seu terminal tem fundo claro.
- `OPENCLAW_THEME=dark`: força a paleta escura da TUI.
- `COLORFGBG`: se seu terminal a exportar, o OpenClaw usa a dica de cor de fundo para escolher automaticamente a paleta da TUI.

## Substituição de variáveis de ambiente na configuração

Você pode referenciar variáveis de ambiente diretamente em valores de string da configuração usando a sintaxe `${VAR_NAME}`:

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

Consulte [Configuração: substituição de variáveis de ambiente](/gateway/configuration-reference#env-var-substitution) para ver todos os detalhes.

## Referências de segredos vs strings `${ENV}`

O OpenClaw oferece suporte a dois padrões orientados por env:

- substituição de string `${VAR}` em valores de configuração.
- objetos SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) para campos que aceitam referências de segredo.

Ambos são resolvidos a partir do env do processo no momento da ativação. Os detalhes de SecretRef estão documentados em [Gerenciamento de segredos](/gateway/secrets).

## Variáveis de ambiente relacionadas a caminho

| Variable               | Purpose                                                                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`        | Substitui o diretório home usado para toda a resolução interna de caminhos (`~/.openclaw/`, diretórios de agente, sessões, credenciais). Útil ao executar o OpenClaw como um usuário de serviço dedicado. |
| `OPENCLAW_STATE_DIR`   | Substitui o diretório de estado (padrão `~/.openclaw`).                                                                                                                            |
| `OPENCLAW_CONFIG_PATH` | Substitui o caminho do arquivo de configuração (padrão `~/.openclaw/openclaw.json`).                                                                                                             |

## Logging

| Variable             | Purpose                                                                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Substitui o nível de log tanto para arquivo quanto para console (por exemplo `debug`, `trace`). Tem precedência sobre `logging.level` e `logging.consoleLevel` na configuração. Valores inválidos são ignorados com um aviso. |

### `OPENCLAW_HOME`

Quando definido, `OPENCLAW_HOME` substitui o diretório home do sistema (`$HOME` / `os.homedir()`) para toda a resolução interna de caminhos. Isso permite isolamento completo do sistema de arquivos para contas de serviço headless.

**Precedência:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Exemplo** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` também pode ser definido para um caminho com til (`~/svc`), que será expandido usando `$HOME` antes do uso.

## Usuários do nvm: falhas de TLS em `web_fetch`

Se o Node.js foi instalado via **nvm** (e não pelo gerenciador de pacotes do sistema), o `fetch()` integrado usa
o armazenamento de CAs empacotado pelo nvm, que pode não incluir CAs raiz modernas (ISRG Root X1/X2 para Let's Encrypt,
DigiCert Global Root G2 etc.). Isso faz com que `web_fetch` falhe com `"fetch failed"` na maioria dos sites HTTPS.

No Linux, o OpenClaw detecta automaticamente o nvm e aplica a correção no ambiente real de inicialização:

- `openclaw gateway install` grava `NODE_EXTRA_CA_CERTS` no ambiente do serviço systemd
- o ponto de entrada da CLI `openclaw` se reexecuta com `NODE_EXTRA_CA_CERTS` definido antes da inicialização do Node

**Correção manual (para versões mais antigas ou inicializações diretas com `node ...`):**

Exporte a variável antes de iniciar o OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Não conte apenas com gravação em `~/.openclaw/.env` para essa variável; o Node lê
`NODE_EXTRA_CA_CERTS` na inicialização do processo.

## Relacionado

- [Configuração do gateway](/gateway/configuration)
- [FAQ: variáveis de ambiente e carregamento de .env](/help/faq#env-vars-and-env-loading)
- [Visão geral de modelos](/concepts/models)
