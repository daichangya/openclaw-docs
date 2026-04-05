---
read_when:
    - Adicionar ou modificar a CLI de modelos (models list/set/scan/aliases/fallbacks)
    - Alterar o comportamento de fallback de modelo ou a UX de seleção
    - Atualizar sondagens de scan de modelos (ferramentas/imagens)
summary: 'CLI de modelos: listar, definir, aliases, fallbacks, scan, status'
title: CLI de modelos
x-i18n:
    generated_at: "2026-04-05T12:40:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: e08f7e50da263895dae2bd2b8dc327972ea322615f8d1918ddbd26bb0fb24840
    source_path: concepts/models.md
    workflow: 15
---

# CLI de modelos

Veja [/concepts/model-failover](/concepts/model-failover) para rotação de perfil de autenticação, cooldowns e como isso interage com fallbacks.
Visão geral rápida de provedores + exemplos: [/concepts/model-providers](/concepts/model-providers).

## Como a seleção de modelo funciona

O OpenClaw seleciona modelos nesta ordem:

1. Modelo **primário** (`agents.defaults.model.primary` ou `agents.defaults.model`).
2. **Fallbacks** em `agents.defaults.model.fallbacks` (em ordem).
3. **Failover de autenticação do provedor** acontece dentro de um provedor antes de passar para o próximo modelo.

Relacionado:

- `agents.defaults.models` é a allowlist/catálogo de modelos que o OpenClaw pode usar (mais aliases).
- `agents.defaults.imageModel` é usado **somente quando** o modelo primário não pode aceitar imagens.
- `agents.defaults.pdfModel` é usado pela ferramenta `pdf`. Se omitido, a ferramenta recai para `agents.defaults.imageModel`, depois para o modelo de sessão/padrão resolvido.
- `agents.defaults.imageGenerationModel` é usado pela capacidade compartilhada de geração de imagem. Se omitido, `image_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual e depois os demais provedores de geração de imagem registrados em ordem de `provider-id`. Se você definir um provedor/modelo específico, configure também a autenticação/chave de API desse provedor.
- `agents.defaults.videoGenerationModel` é usado pela capacidade compartilhada de geração de vídeo. Ao contrário da geração de imagem, isso não infere um padrão de provedor atualmente. Defina explicitamente um `provider/model`, como `qwen/wan2.6-t2v`, e configure também a autenticação/chave de API desse provedor.
- Padrões por agente podem substituir `agents.defaults.model` por meio de `agents.list[].model` mais bindings (veja [/concepts/multi-agent](/concepts/multi-agent)).

## Política rápida de modelos

- Defina o primário como o modelo mais forte da geração mais recente disponível para você.
- Use fallbacks para tarefas sensíveis a custo/latência e chats de menor importância.
- Para agentes com ferramentas ativadas ou entradas não confiáveis, evite camadas de modelo mais antigas/mais fracas.

## Onboarding (recomendado)

Se você não quiser editar a configuração manualmente, execute o onboarding:

```bash
openclaw onboard
```

Ele pode configurar modelo + autenticação para provedores comuns, incluindo **OpenAI Code (Codex) subscription** (OAuth) e **Anthropic** (chave de API ou Claude CLI).

## Chaves de configuração (visão geral)

- `agents.defaults.model.primary` e `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` e `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` e `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` e `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` e `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + aliases + parâmetros de provedor)
- `models.providers` (provedores personalizados gravados em `models.json`)

Refs de modelo são normalizadas para minúsculas. Aliases de provedor como `z.ai/*` são normalizados para `zai/*`.

Exemplos de configuração de provedor (incluindo OpenCode) estão em
[/providers/opencode](/providers/opencode).

## "Model is not allowed" (e por que as respostas param)

Se `agents.defaults.models` estiver definido, ele se torna a **allowlist** para `/model` e para substituições de sessão. Quando um usuário seleciona um modelo que não está nessa allowlist, o OpenClaw retorna:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Isso acontece **antes** de uma resposta normal ser gerada, então a mensagem pode passar a impressão de que “não respondeu”. A correção é:

- Adicionar o modelo a `agents.defaults.models`, ou
- Limpar a allowlist (remover `agents.defaults.models`), ou
- Escolher um modelo em `/model list`.

Exemplo de configuração de allowlist:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Trocar modelos no chat (`/model`)

Você pode trocar modelos para a sessão atual sem reiniciar:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Observações:

- `/model` (e `/model list`) é um seletor compacto numerado (família de modelo + provedores disponíveis).
- No Discord, `/model` e `/models` abrem um seletor interativo com menus suspensos de provedor e modelo, além de uma etapa Submit.
- `/model <#>` seleciona a partir desse seletor.
- `/model` persiste a nova seleção de sessão imediatamente.
- Se o agente estiver ocioso, a próxima execução usará o novo modelo imediatamente.
- Se uma execução já estiver ativa, o OpenClaw marca uma troca ao vivo como pendente e só reinicia no novo modelo em um ponto limpo de nova tentativa.
- Se a atividade de ferramenta ou a saída de resposta já tiver começado, a troca pendente pode continuar na fila até uma oportunidade posterior de nova tentativa ou o próximo turno do usuário.
- `/model status` é a visualização detalhada (candidatos de autenticação e, quando configurado, `baseUrl` + modo `api` do endpoint do provedor).
- Refs de modelo são analisadas dividindo na **primeira** `/`. Use `provider/model` ao digitar `/model <ref>`.
- Se o próprio ID do modelo contiver `/` (estilo OpenRouter), você deve incluir o prefixo do provedor (exemplo: `/model openrouter/moonshotai/kimi-k2`).
- Se você omitir o provedor, o OpenClaw resolve a entrada nesta ordem:
  1. correspondência de alias
  2. correspondência única de provedor configurado para esse ID de modelo exato sem prefixo
  3. fallback obsoleto para o provedor padrão configurado
     Se esse provedor não expuser mais o modelo padrão configurado, o OpenClaw
     em vez disso recai para o primeiro provedor/modelo configurado para evitar
     expor um padrão obsoleto de provedor removido.

Comportamento/configuração completos do comando: [Comandos de barra](/tools/slash-commands).

## Comandos da CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (sem subcomando) é um atalho para `models status`.

### `models list`

Mostra modelos configurados por padrão. Flags úteis:

- `--all`: catálogo completo
- `--local`: apenas provedores locais
- `--provider <name>`: filtrar por provedor
- `--plain`: um modelo por linha
- `--json`: saída legível por máquina

### `models status`

Mostra o modelo primário resolvido, fallbacks, modelo de imagem e uma visão geral de autenticação
dos provedores configurados. Também exibe o status de expiração de OAuth para perfis encontrados
no armazenamento de autenticação (avisa dentro de 24h por padrão). `--plain` imprime somente o
modelo primário resolvido.
O status de OAuth é sempre mostrado (e incluído na saída `--json`). Se um provedor configurado
não tiver credenciais, `models status` imprime uma seção **Missing auth**.
O JSON inclui `auth.oauth` (janela de aviso + perfis) e `auth.providers`
(autenticação efetiva por provedor).
Use `--check` para automação (saída `1` quando ausente/expirado, `2` quando estiver para expirar).
Use `--probe` para verificações ativas de autenticação; linhas de probe podem vir de perfis de autenticação, credenciais de ambiente
ou `models.json`.
Se `auth.order.<provider>` explícito omitir um perfil armazenado, o probe informará
`excluded_by_auth_order` em vez de tentar usá-lo. Se a autenticação existir mas não houver
um modelo sondável que possa ser resolvido para esse provedor, o probe informará `status: no_model`.

A escolha de autenticação depende do provedor/conta. Para hosts de gateway sempre ativos, chaves de API geralmente são a opção mais previsível; reutilização de Claude CLI e perfis OAuth/token existentes da Anthropic também são compatíveis.

Exemplo (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Scanning (modelos gratuitos do OpenRouter)

`openclaw models scan` inspeciona o **catálogo de modelos gratuitos** do OpenRouter e pode
opcionalmente sondar modelos para suporte a ferramentas e imagens.

Principais flags:

- `--no-probe`: ignora probes ativos (somente metadados)
- `--min-params <b>`: tamanho mínimo de parâmetros (bilhões)
- `--max-age-days <days>`: ignora modelos mais antigos
- `--provider <name>`: filtro por prefixo de provedor
- `--max-candidates <n>`: tamanho da lista de fallback
- `--set-default`: define `agents.defaults.model.primary` para a primeira seleção
- `--set-image`: define `agents.defaults.imageModel.primary` para a primeira seleção de imagem

Probes exigem uma chave de API do OpenRouter (de perfis de autenticação ou
`OPENROUTER_API_KEY`). Sem uma chave, use `--no-probe` para apenas listar candidatos.

Os resultados do scan são ranqueados por:

1. Suporte a imagem
2. Latência de ferramenta
3. Tamanho de contexto
4. Contagem de parâmetros

Entrada

- Lista `/models` do OpenRouter (filtro `:free`)
- Exige chave de API do OpenRouter de perfis de autenticação ou `OPENROUTER_API_KEY` (veja [/environment](/help/environment))
- Filtros opcionais: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controles de probe: `--timeout`, `--concurrency`

Quando executado em um TTY, você pode selecionar fallbacks interativamente. No modo não interativo, passe `--yes` para aceitar os padrões.

## Registro de modelos (`models.json`)

Provedores personalizados em `models.providers` são gravados em `models.json` sob o diretório
do agente (padrão `~/.openclaw/agents/<agentId>/agent/models.json`). Esse arquivo
é mesclado por padrão, a menos que `models.mode` esteja definido como `replace`.

Precedência do modo de mesclagem para IDs de provedor correspondentes:

- `baseUrl` não vazio já presente no `models.json` do agente prevalece.
- `apiKey` não vazio no `models.json` do agente prevalece somente quando esse provedor não é gerenciado por SecretRef no contexto atual de configuração/perfil de autenticação.
- Valores `apiKey` de provedor gerenciados por SecretRef são atualizados a partir de marcadores de origem (`ENV_VAR_NAME` para refs de ambiente, `secretref-managed` para refs `file`/`exec`) em vez de persistir segredos resolvidos.
- Valores de cabeçalho de provedor gerenciados por SecretRef são atualizados a partir de marcadores de origem (`secretref-env:ENV_VAR_NAME` para refs de ambiente, `secretref-managed` para refs `file`/`exec`).
- `apiKey`/`baseUrl` vazios ou ausentes no agente recaem para `models.providers` da configuração.
- Outros campos do provedor são atualizados a partir da configuração e de dados de catálogo normalizados.

A persistência de marcadores é autoritativa pela origem: o OpenClaw grava marcadores a partir do snapshot ativo da configuração de origem (pré-resolução), não a partir de valores de segredos resolvidos em runtime.
Isso se aplica sempre que o OpenClaw regenera `models.json`, incluindo caminhos acionados por comando, como `openclaw agent`.

## Relacionado

- [Model Providers](/concepts/model-providers) — roteamento de provedor e autenticação
- [Model Failover](/concepts/model-failover) — cadeias de fallback
- [Image Generation](/tools/image-generation) — configuração de modelo de imagem
- [Referência de configuração](/gateway/configuration-reference#agent-defaults) — chaves de configuração de modelo
