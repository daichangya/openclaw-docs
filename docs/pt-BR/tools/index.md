---
read_when:
    - Você quer entender quais ferramentas o OpenClaw oferece
    - Você precisa configurar, permitir ou negar ferramentas
    - Você está decidindo entre ferramentas integradas, Skills e Plugins
summary: 'Visão geral de ferramentas e Plugins do OpenClaw: o que o agente pode fazer e como estendê-lo'
title: Ferramentas e Plugins
x-i18n:
    generated_at: "2026-04-23T05:44:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c32414dfa99969372e9b0c846305a1af1ffb18a282e6dfc8a6adabe3fab145a
    source_path: tools/index.md
    workflow: 15
---

# Ferramentas e Plugins

Tudo o que o agente faz além de gerar texto acontece por meio de **ferramentas**.
Ferramentas são como o agente lê arquivos, executa comandos, navega na web, envia
mensagens e interage com dispositivos.

## Ferramentas, Skills e Plugins

O OpenClaw tem três camadas que trabalham juntas:

<Steps>
  <Step title="Ferramentas são o que o agente chama">
    Uma ferramenta é uma função tipada que o agente pode invocar (por exemplo `exec`, `browser`,
    `web_search`, `message`). O OpenClaw inclui um conjunto de **ferramentas integradas** e
    Plugins podem registrar outras adicionais.

    O agente vê as ferramentas como definições estruturadas de função enviadas para a API do modelo.

  </Step>

  <Step title="Skills ensinam ao agente quando e como">
    Uma Skill é um arquivo markdown (`SKILL.md`) injetado no prompt do sistema.
    Skills dão ao agente contexto, restrições e orientação passo a passo para
    usar ferramentas com eficácia. Skills ficam no seu workspace, em pastas compartilhadas
    ou são distribuídas dentro de Plugins.

    [Referência de Skills](/pt-BR/tools/skills) | [Criando Skills](/pt-BR/tools/creating-skills)

  </Step>

  <Step title="Plugins empacotam tudo junto">
    Um Plugin é um pacote que pode registrar qualquer combinação de capacidades:
    canais, provedores de modelo, ferramentas, Skills, fala, transcrição em tempo real,
    voz em tempo real, entendimento de mídia, geração de imagem, geração de vídeo,
    web fetch, web search e muito mais. Alguns Plugins são **core** (distribuídos com
    OpenClaw), outros são **externos** (publicados no npm pela comunidade).

    [Instalar e configurar Plugins](/pt-BR/tools/plugin) | [Crie o seu](/pt-BR/plugins/building-plugins)

  </Step>
</Steps>

## Ferramentas integradas

Estas ferramentas vêm com o OpenClaw e estão disponíveis sem instalar nenhum Plugin:

| Ferramenta                                 | O que faz                                                            | Página                                      |
| ------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------- |
| `exec` / `process`                         | Executa comandos de shell, gerencia processos em segundo plano       | [Exec](/pt-BR/tools/exec)                         |
| `code_execution`                           | Executa análise remota de Python em sandbox                          | [Code Execution](/pt-BR/tools/code-execution)     |
| `browser`                                  | Controla um navegador Chromium (navegar, clicar, capturar tela)      | [Browser](/pt-BR/tools/browser)                   |
| `web_search` / `x_search` / `web_fetch`    | Pesquisa na web, pesquisa posts no X, busca conteúdo de páginas      | [Web](/pt-BR/tools/web)                           |
| `read` / `write` / `edit`                  | E/S de arquivos no workspace                                         |                                             |
| `apply_patch`                              | Patches de arquivo com vários blocos                                 | [Apply Patch](/pt-BR/tools/apply-patch)           |
| `message`                                  | Envia mensagens em todos os canais                                   | [Agent Send](/pt-BR/tools/agent-send)             |
| `canvas`                                   | Controla o Canvas do node (present, eval, snapshot)                  |                                             |
| `nodes`                                    | Descobre e direciona dispositivos pareados                           |                                             |
| `cron` / `gateway`                         | Gerencia jobs agendados; inspeciona, corrige, reinicia ou atualiza o Gateway |                                             |
| `image` / `image_generate`                 | Analisa ou gera imagens                                              | [Image Generation](/pt-BR/tools/image-generation) |
| `music_generate`                           | Gera faixas de música                                                | [Music Generation](/pt-BR/tools/music-generation) |
| `video_generate`                           | Gera vídeos                                                          | [Video Generation](/pt-BR/tools/video-generation) |
| `tts`                                      | Conversão pontual de texto em fala                                   | [TTS](/pt-BR/tools/tts)                           |
| `sessions_*` / `subagents` / `agents_list` | Gerenciamento de sessão, status e orquestração de subagentes         | [Sub-agents](/pt-BR/tools/subagents)              |
| `session_status`                           | Retorno leve no estilo `/status` e substituição do modelo da sessão  | [Session Tools](/pt-BR/concepts/session-tool)     |

Para trabalho com imagem, use `image` para análise e `image_generate` para geração ou edição. Se você usar `openai/*`, `google/*`, `fal/*` ou outro provedor de imagem não padrão, configure primeiro a autenticação/chave de API desse provedor.

Para trabalho com música, use `music_generate`. Se você usar `google/*`, `minimax/*` ou outro provedor de música não padrão, configure primeiro a autenticação/chave de API desse provedor.

Para trabalho com vídeo, use `video_generate`. Se você usar `qwen/*` ou outro provedor de vídeo não padrão, configure primeiro a autenticação/chave de API desse provedor.

Para geração de áudio orientada por workflow, use `music_generate` quando um Plugin como
ComfyUI o registrar. Isso é separado de `tts`, que é texto para fala.

`session_status` é a ferramenta leve de status/retorno no grupo de sessões.
Ela responde a perguntas no estilo `/status` sobre a sessão atual e pode
opcionalmente definir uma substituição de modelo por sessão; `model=default` limpa essa
substituição. Como `/status`, ela pode preencher contadores esparsos de tokens/cache e o
rótulo do modelo de runtime ativo a partir da entrada de uso mais recente da transcrição.

`gateway` é a ferramenta de runtime exclusiva do proprietário para operações do Gateway:

- `config.schema.lookup` para uma única subárvore de configuração com escopo por caminho antes de edições
- `config.get` para o snapshot + hash da configuração atual
- `config.patch` para atualizações parciais de configuração com reinicialização
- `config.apply` apenas para substituição completa da configuração
- `update.run` para self-update explícito + reinicialização

Para mudanças parciais, prefira `config.schema.lookup` e depois `config.patch`. Use
`config.apply` apenas quando você pretende substituir a configuração inteira.
A ferramenta também se recusa a alterar `tools.exec.ask` ou `tools.exec.security`;
aliases legados `tools.bash.*` são normalizados para os mesmos caminhos protegidos de exec.

### Ferramentas fornecidas por Plugin

Plugins podem registrar ferramentas adicionais. Alguns exemplos:

- [Diffs](/pt-BR/tools/diffs) — visualizador e renderizador de diffs
- [LLM Task](/pt-BR/tools/llm-task) — etapa de LLM somente JSON para saída estruturada
- [Lobster](/pt-BR/tools/lobster) — runtime de workflow tipado com aprovações retomáveis
- [Music Generation](/pt-BR/tools/music-generation) — ferramenta compartilhada `music_generate` com provedores baseados em workflow
- [OpenProse](/pt-BR/prose) — orquestração de workflow com foco em Markdown
- [Tokenjuice](/pt-BR/tools/tokenjuice) — compacta resultados ruidosos das ferramentas `exec` e `bash`

## Configuração de ferramentas

### Listas de permissão e negação

Controle quais ferramentas o agente pode chamar por meio de `tools.allow` / `tools.deny` na
configuração. A negação sempre tem precedência sobre a permissão.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### Perfis de ferramenta

`tools.profile` define uma allowlist base antes de `allow`/`deny` ser aplicada.
Substituição por agente: `agents.list[].tools.profile`.

| Perfil      | O que inclui                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Sem restrição (igual a não definido)                                                                                                              |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Apenas `session_status`                                                                                                                            |

Os perfis `coding` e `messaging` também permitem ferramentas MCP do bundle configuradas
sob a chave de Plugin `bundle-mcp`. Adicione `tools.deny: ["bundle-mcp"]` quando
quiser que um perfil mantenha suas ferramentas integradas normais, mas oculte todas as ferramentas MCP configuradas.
O perfil `minimal` não inclui ferramentas MCP do bundle.

### Grupos de ferramentas

Use abreviações `group:*` em listas de permissão/negação:

| Grupo              | Ferramentas                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` é aceito como alias para `exec`)                                    |
| `group:fs`         | read, write, edit, apply_patch                                                                             |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                  |
| `group:web`        | web_search, x_search, web_fetch                                                                            |
| `group:ui`         | browser, canvas                                                                                            |
| `group:automation` | cron, gateway                                                                                              |
| `group:messaging`  | message                                                                                                    |
| `group:nodes`      | nodes                                                                                                      |
| `group:agents`     | agents_list                                                                                                |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                 |
| `group:openclaw`   | Todas as ferramentas integradas do OpenClaw (exclui ferramentas de Plugin)                                |

`sessions_history` retorna uma visualização limitada e filtrada com segurança para recuperação. Ela remove
tags de thinking, scaffolding `<relevant-memories>`, payloads XML em texto simples
de chamada de ferramenta (incluindo `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta),
scaffolding degradado de chamada de ferramenta, tokens vazados de controle de modelo em ASCII/largura total
e XML malformado de chamada de ferramenta do MiniMax do texto do assistente, depois aplica
redação/truncamento e possíveis placeholders de linha superdimensionada em vez de agir
como um dump bruto da transcrição.

### Restrições específicas por provedor

Use `tools.byProvider` para restringir ferramentas de provedores específicos sem
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
