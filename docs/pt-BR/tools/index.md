---
read_when:
    - Você quer entender quais ferramentas o OpenClaw fornece
    - Você precisa configurar, permitir ou negar ferramentas
    - Você está decidindo entre ferramentas integradas, Skills e plugins
summary: 'Visão geral de ferramentas e plugins do OpenClaw: o que o agente pode fazer e como estendê-lo'
title: Ferramentas e Plugins
x-i18n:
    generated_at: "2026-04-05T12:55:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17768048b23f980de5e502cc30fbddbadc2e26ae62f0f03c5ab5bbcdeea67e50
    source_path: tools/index.md
    workflow: 15
---

# Ferramentas e Plugins

Tudo o que o agente faz além de gerar texto acontece por meio de **ferramentas**.
As ferramentas são como o agente lê arquivos, executa comandos, navega na web, envia
mensagens e interage com dispositivos.

## Ferramentas, Skills e plugins

O OpenClaw tem três camadas que funcionam juntas:

<Steps>
  <Step title="Ferramentas são o que o agente chama">
    Uma ferramenta é uma função tipada que o agente pode invocar (por exemplo, `exec`, `browser`,
    `web_search`, `message`). O OpenClaw inclui um conjunto de **ferramentas integradas** e
    os plugins podem registrar outras adicionais.

    O agente vê as ferramentas como definições estruturadas de funções enviadas à API do modelo.

  </Step>

  <Step title="As Skills ensinam ao agente quando e como">
    Uma skill é um arquivo markdown (`SKILL.md`) injetado no prompt do sistema.
    As Skills dão ao agente contexto, restrições e orientação passo a passo para
    usar ferramentas com eficiência. As Skills ficam no seu workspace, em pastas compartilhadas
    ou são incluídas dentro de plugins.

    [Referência de Skills](/tools/skills) | [Criando Skills](/tools/creating-skills)

  </Step>

  <Step title="Plugins empacotam tudo junto">
    Um plugin é um pacote que pode registrar qualquer combinação de capacidades:
    canais, providers de modelo, ferramentas, Skills, fala, transcrição em tempo real,
    voz em tempo real, entendimento de mídia, geração de imagem, geração de vídeo,
    web fetch, web search e mais. Alguns plugins são **core** (distribuídos com
    o OpenClaw), outros são **externos** (publicados no npm pela comunidade).

    [Instalar e configurar plugins](/tools/plugin) | [Crie o seu próprio](/plugins/building-plugins)

  </Step>
</Steps>

## Ferramentas integradas

Estas ferramentas vêm com o OpenClaw e estão disponíveis sem instalar nenhum plugin:

| Tool                                       | What it does                                                          | Page                                    |
| ------------------------------------------ | --------------------------------------------------------------------- | --------------------------------------- |
| `exec` / `process`                         | Executa comandos de shell, gerencia processos em segundo plano                       | [Exec](/tools/exec)                     |
| `code_execution`                           | Executa análise remota em Python com sandbox                                  | [Code Execution](/tools/code-execution) |
| `browser`                                  | Controla um navegador Chromium (navegar, clicar, screenshot)              | [Browser](/tools/browser)               |
| `web_search` / `x_search` / `web_fetch`    | Pesquisa na web, pesquisa posts no X, busca conteúdo de páginas                    | [Web](/tools/web)                       |
| `read` / `write` / `edit`                  | E/S de arquivos no workspace                                             |                                         |
| `apply_patch`                              | Patches de arquivo com múltiplos hunks                                               | [Apply Patch](/tools/apply-patch)       |
| `message`                                  | Envia mensagens por todos os canais                                     | [Agent Send](/tools/agent-send)         |
| `canvas`                                   | Controla o Canvas do nó (apresentar, eval, snapshot)                           |                                         |
| `nodes`                                    | Descobre e direciona dispositivos pareados                                    |                                         |
| `cron` / `gateway`                         | Gerencia jobs agendados; inspeciona, aplica patches, reinicia ou atualiza o gateway |                                         |
| `image` / `image_generate`                 | Analisa ou gera imagens                                            |                                         |
| `tts`                                      | Conversão pontual de texto para fala                                    | [TTS](/tools/tts)                       |
| `sessions_*` / `subagents` / `agents_list` | Gerenciamento de sessão, status e orquestração de subagentes               | [Sub-agents](/tools/subagents)          |
| `session_status`                           | Leitura leve no estilo `/status` e substituição do modelo por sessão       | [Session Tools](/pt-BR/concepts/session-tool) |

Para trabalho com imagens, use `image` para análise e `image_generate` para geração ou edição. Se você direcionar para `openai/*`, `google/*`, `fal/*` ou outro provider de imagem não padrão, configure primeiro a autenticação/chave de API desse provider.

`session_status` é a ferramenta leve de status/leitura no grupo de sessões.
Ela responde a perguntas no estilo `/status` sobre a sessão atual e pode
opcionalmente definir uma substituição de modelo por sessão; `model=default` limpa essa
substituição. Assim como `/status`, ela pode preencher contadores esparsos de tokens/cache e o
rótulo do modelo ativo em runtime a partir da entrada de uso mais recente da transcrição.

`gateway` é a ferramenta de runtime exclusiva do proprietário para operações do gateway:

- `config.schema.lookup` para uma subárvore de configuração delimitada por caminho antes de edições
- `config.get` para o snapshot atual da configuração + hash
- `config.patch` para atualizações parciais da configuração com reinicialização
- `config.apply` apenas para substituição da configuração completa
- `update.run` para autoatualização explícita + reinicialização

Para mudanças parciais, prefira `config.schema.lookup` e depois `config.patch`. Use
`config.apply` apenas quando você quiser intencionalmente substituir a configuração inteira.
A ferramenta também se recusa a mudar `tools.exec.ask` ou `tools.exec.security`;
aliases legados `tools.bash.*` são normalizados para os mesmos caminhos protegidos de exec.

### Ferramentas fornecidas por plugins

Plugins podem registrar ferramentas adicionais. Alguns exemplos:

- [Lobster](/tools/lobster) — runtime de fluxo de trabalho tipado com aprovações retomáveis
- [LLM Task](/tools/llm-task) — etapa de LLM somente JSON para saída estruturada
- [Diffs](/tools/diffs) — visualizador e renderizador de diffs
- [OpenProse](/prose) — orquestração de fluxo de trabalho com foco em markdown

## Configuração de ferramentas

### Listas de permissão e negação

Controle quais ferramentas o agente pode chamar via `tools.allow` / `tools.deny` na
configuração. A negação sempre prevalece sobre a permissão.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### Perfis de ferramenta

`tools.profile` define uma allowlist base antes da aplicação de `allow`/`deny`.
Substituição por agente: `agents.list[].tools.profile`.

| Profile     | What it includes                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `full`      | Sem restrição (igual a não definido)                                                                                |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                     |
| `minimal`   | apenas `session_status`                                                                                         |

### Grupos de ferramentas

Use atalhos `group:*` em listas de permissão/negação:

| Group              | Tools                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` é aceito como alias para `exec`)                                 |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, tts                                                                                |
| `group:openclaw`   | Todas as ferramentas integradas do OpenClaw (exclui ferramentas de plugins)                                                       |

`sessions_history` retorna uma visualização de recordação limitada e filtrada por segurança. Ela remove
tags de thinking, estrutura `<relevant-memories>`, payloads XML de chamadas de ferramenta em texto simples
(incluindo `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocos truncados de chamadas de ferramenta),
estrutura degradada de chamadas de ferramenta, tokens de controle do modelo vazados em ASCII/largura completa
e XML malformado de chamadas de ferramenta do MiniMax do texto do assistente, e depois aplica
redação/truncamento e possíveis placeholders para linhas grandes demais em vez de agir
como um dump bruto da transcrição.

### Restrições específicas por provider

Use `tools.byProvider` para restringir ferramentas para providers específicos sem
alterar os padrões globais:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
