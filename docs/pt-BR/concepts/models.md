---
read_when:
    - Adicionando ou modificando a CLI de modelos (`models list/set/scan/aliases/fallbacks`)
    - Alterando o comportamento de fallback de modelos ou a UX de seleção
    - Atualizando as sondas de varredura de modelos (tools/imagens)
summary: 'CLI de Models: listar, definir, aliases, fallbacks, escanear, status'
title: CLI de Models
x-i18n:
    generated_at: "2026-04-23T05:38:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18d915f3f761aaff5efc3bf752f5abddeb625e1a386ab3d701f46fd92244f20e
    source_path: concepts/models.md
    workflow: 15
---

# CLI de modelos

Veja [/concepts/model-failover](/pt-BR/concepts/model-failover) para rotação de perfis de autenticação,
cooldowns e como isso interage com fallbacks.
Visão geral rápida de providers + exemplos: [/concepts/model-providers](/pt-BR/concepts/model-providers).

## Como a seleção de modelos funciona

O OpenClaw seleciona os modelos nesta ordem:

1. Modelo **primário** (`agents.defaults.model.primary` ou `agents.defaults.model`).
2. **Fallbacks** em `agents.defaults.model.fallbacks` (em ordem).
3. O failover de autenticação do provider acontece dentro de um provider antes de passar para o
   próximo modelo.

Relacionado:

- `agents.defaults.models` é a allowlist/catálogo de modelos que o OpenClaw pode usar (mais aliases).
- `agents.defaults.imageModel` é usado **somente quando** o modelo primário não pode aceitar imagens.
- `agents.defaults.pdfModel` é usado pela ferramenta `pdf`. Se omitido, a ferramenta
  usa fallback para `agents.defaults.imageModel` e, depois, para o modelo resolvido da sessão/padrão.
- `agents.defaults.imageGenerationModel` é usado pela capacidade compartilhada de geração de imagens. Se omitido, `image_generate` ainda pode inferir um provider padrão com autenticação. Ele tenta primeiro o provider padrão atual e, em seguida, os demais providers de geração de imagens registrados, em ordem de `provider-id`. Se você definir um provider/modelo específico, configure também a autenticação/chave de API desse provider.
- `agents.defaults.musicGenerationModel` é usado pela capacidade compartilhada de geração de música. Se omitido, `music_generate` ainda pode inferir um provider padrão com autenticação. Ele tenta primeiro o provider padrão atual e, em seguida, os demais providers de geração de música registrados, em ordem de `provider-id`. Se você definir um provider/modelo específico, configure também a autenticação/chave de API desse provider.
- `agents.defaults.videoGenerationModel` é usado pela capacidade compartilhada de geração de vídeo. Se omitido, `video_generate` ainda pode inferir um provider padrão com autenticação. Ele tenta primeiro o provider padrão atual e, em seguida, os demais providers de geração de vídeo registrados, em ordem de `provider-id`. Se você definir um provider/modelo específico, configure também a autenticação/chave de API desse provider.
- Os padrões por agente podem sobrescrever `agents.defaults.model` por meio de `agents.list[].model` mais bindings (veja [/concepts/multi-agent](/pt-BR/concepts/multi-agent)).

## Política rápida de modelos

- Defina seu primário como o modelo mais forte e de geração mais recente disponível para você.
- Use fallbacks para tarefas sensíveis a custo/latência e conversas de menor importância.
- Para agentes com tools habilitadas ou entradas não confiáveis, evite tiers de modelo mais antigos/mais fracos.

## Onboarding (recomendado)

Se você não quiser editar a configuração manualmente, execute o onboarding:

```bash
openclaw onboard
```

Ele pode configurar modelo + autenticação para providers comuns, incluindo **OpenAI Code (Codex)
subscription** (OAuth) e **Anthropic** (chave de API ou Claude CLI).

## Chaves de configuração (visão geral)

- `agents.defaults.model.primary` e `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` e `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` e `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` e `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` e `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + aliases + parâmetros do provider)
- `models.providers` (providers personalizados gravados em `models.json`)

As referências de modelo são normalizadas para minúsculas. Aliases de provider como `z.ai/*` são normalizados
para `zai/*`.

Exemplos de configuração de provider (incluindo OpenCode) estão em
[/providers/opencode](/pt-BR/providers/opencode).

### Edições seguras da allowlist

Use gravações aditivas ao atualizar `agents.defaults.models` manualmente:

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` protege mapas de modelo/provider contra sobrescrita acidental. Uma
atribuição simples de objeto para `agents.defaults.models`, `models.providers` ou
`models.providers.<id>.models` é rejeitada quando removeria entradas
existentes. Use `--merge` para alterações aditivas; use `--replace` somente quando o
valor fornecido deve se tornar o valor completo de destino.

A configuração interativa de provider e `openclaw configure --section model` também mesclam
seleções com escopo de provider na allowlist existente, portanto adicionar Codex,
Ollama ou outro provider não remove entradas de modelo não relacionadas.

## "Model is not allowed" (e por que as respostas param)

Se `agents.defaults.models` estiver definido, ele se torna a **allowlist** para `/model` e para
substituições de sessão. Quando um usuário seleciona um modelo que não está nessa allowlist,
o OpenClaw retorna:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Isso acontece **antes** de uma resposta normal ser gerada, então a mensagem pode parecer
que “não respondeu”. A correção é:

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

## Trocando de modelo no chat (`/model`)

Você pode trocar de modelo para a sessão atual sem reiniciar:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Observações:

- `/model` (e `/model list`) é um seletor compacto numerado (família de modelo + providers disponíveis).
- No Discord, `/model` e `/models` abrem um seletor interativo com menus suspensos de provider e modelo, além de uma etapa de Submit.
- `/models add` está disponível por padrão e pode ser desabilitado com `commands.modelsWrite=false`.
- Quando habilitado, `/models add <provider> <modelId>` é o caminho mais rápido; `/models add` sem argumentos inicia um fluxo guiado com provider primeiro, quando compatível.
- Após `/models add`, o novo modelo fica disponível em `/models` e `/model` sem reiniciar o Gateway.
- `/model <#>` seleciona a partir desse seletor.
- `/model` persiste imediatamente a nova seleção da sessão.
- Se o agente estiver ocioso, a próxima execução usa o novo modelo imediatamente.
- Se uma execução já estiver ativa, o OpenClaw marca uma troca ao vivo como pendente e só reinicia no novo modelo em um ponto limpo de retry.
- Se a atividade de tool ou a saída de resposta já tiver começado, a troca pendente pode continuar na fila até uma oportunidade posterior de retry ou até o próximo turno do usuário.
- As referências de modelo são analisadas dividindo na **primeira** `/`. Use `provider/model` ao digitar `/model <ref>`.
- Se o próprio ID do modelo contiver `/` (estilo OpenRouter), você deverá incluir o prefixo do provider (exemplo: `/model openrouter/moonshotai/kimi-k2`).
- Se você omitir o provider, o OpenClaw resolve a entrada nesta ordem:
  1. correspondência de alias
  2. correspondência única de provider configurado para esse ID de modelo exato sem prefixo
  3. fallback obsoleto para o provider padrão configurado
     Se esse provider não expuser mais o modelo padrão configurado, o OpenClaw
     usa fallback para o primeiro provider/modelo configurado para evitar
     exibir um padrão obsoleto de provider removido.

Comportamento/configuração completos do comando: [Comandos slash](/pt-BR/tools/slash-commands).

Exemplos:

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

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

Mostra os modelos configurados por padrão. Flags úteis:

- `--all`: catálogo completo
- `--local`: somente providers locais
- `--provider <name>`: filtrar por provider
- `--plain`: um modelo por linha
- `--json`: saída legível por máquina

`--all` inclui linhas do catálogo estático empacotado pertencentes ao provider antes de a autenticação estar
configurada, portanto visualizações somente de descoberta podem mostrar modelos indisponíveis até
você adicionar as credenciais correspondentes do provider.

### `models status`

Mostra o modelo primário resolvido, fallbacks, modelo de imagem e uma visão geral de autenticação
dos providers configurados. Também exibe o status de expiração do OAuth para perfis encontrados
no armazenamento de autenticação (avisa dentro de 24h por padrão). `--plain` imprime apenas o
modelo primário resolvido.
O status do OAuth é sempre exibido (e incluído na saída `--json`). Se um
provider configurado não tiver credenciais, `models status` imprime uma seção **Missing auth**.
O JSON inclui `auth.oauth` (janela de aviso + perfis) e `auth.providers`
(autenticação efetiva por provider, incluindo credenciais vindas de env). `auth.oauth`
é apenas a saúde de perfis do armazenamento de autenticação; providers somente com env não aparecem ali.
Use `--check` para automação (saída `1` quando ausente/expirado, `2` quando prestes a expirar).
Use `--probe` para verificações de autenticação ao vivo; as linhas de probe podem vir de perfis de autenticação, credenciais de env
ou `models.json`.
Se `auth.order.<provider>` explícito omitir um perfil armazenado, o probe reporta
`excluded_by_auth_order` em vez de tentar usá-lo. Se a autenticação existir mas nenhum modelo verificável puder ser resolvido para esse provider, o
probe reporta `status: no_model`.

A escolha de autenticação depende do provider/conta. Para hosts de Gateway sempre ativos,
chaves de API geralmente são a opção mais previsível; reutilização do Claude CLI e perfis
existentes de OAuth/token da Anthropic também são suportados.

Exemplo (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Varredura (modelos gratuitos do OpenRouter)

`openclaw models scan` inspeciona o **catálogo de modelos gratuitos** do OpenRouter e pode
opcionalmente verificar modelos quanto a suporte a tools e imagens.

Principais flags:

- `--no-probe`: ignorar probes ao vivo (somente metadados)
- `--min-params <b>`: tamanho mínimo de parâmetros (bilhões)
- `--max-age-days <days>`: ignorar modelos mais antigos
- `--provider <name>`: filtro de prefixo de provider
- `--max-candidates <n>`: tamanho da lista de fallbacks
- `--set-default`: definir `agents.defaults.model.primary` como a primeira seleção
- `--set-image`: definir `agents.defaults.imageModel.primary` como a primeira seleção de imagem

A verificação requer uma chave de API do OpenRouter (de perfis de autenticação ou
`OPENROUTER_API_KEY`). Sem uma chave, use `--no-probe` para listar apenas candidatos.

Os resultados da varredura são classificados por:

1. Suporte a imagem
2. Latência de tools
3. Tamanho de contexto
4. Quantidade de parâmetros

Entrada

- Lista `/models` do OpenRouter (filtro `:free`)
- Requer chave de API do OpenRouter de perfis de autenticação ou `OPENROUTER_API_KEY` (veja [/environment](/pt-BR/help/environment))
- Filtros opcionais: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controles de probe: `--timeout`, `--concurrency`

Quando executado em um TTY, você pode selecionar fallbacks interativamente. Em modo não interativo,
passe `--yes` para aceitar os padrões.

## Registro de modelos (`models.json`)

Providers personalizados em `models.providers` são gravados em `models.json` no
diretório do agente (padrão `~/.openclaw/agents/<agentId>/agent/models.json`). Esse arquivo
é mesclado por padrão, a menos que `models.mode` esteja definido como `replace`.

Precedência do modo de mesclagem para IDs de provider correspondentes:

- `baseUrl` não vazio já presente em `models.json` do agente prevalece.
- `apiKey` não vazio em `models.json` do agente prevalece somente quando esse provider não é gerenciado por SecretRef no contexto atual de config/perfil de autenticação.
- Valores de `apiKey` de providers gerenciados por SecretRef são atualizados a partir de marcadores de origem (`ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de arquivo/exec) em vez de persistir secrets resolvidos.
- Valores de header de providers gerenciados por SecretRef são atualizados a partir de marcadores de origem (`secretref-env:ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de arquivo/exec).
- `apiKey`/`baseUrl` do agente vazios ou ausentes usam fallback para `models.providers` da config.
- Outros campos do provider são atualizados a partir da config e de dados de catálogo normalizados.

A persistência de marcadores é autoritativa pela origem: o OpenClaw grava marcadores a partir do snapshot da config de origem ativa (pré-resolução), e não de valores de secret resolvidos em tempo de execução.
Isso se aplica sempre que o OpenClaw regenera `models.json`, incluindo caminhos acionados por comando como `openclaw agent`.

## Relacionado

- [Providers de modelos](/pt-BR/concepts/model-providers) — roteamento de provider e autenticação
- [Failover de modelos](/pt-BR/concepts/model-failover) — cadeias de fallback
- [Geração de imagens](/pt-BR/tools/image-generation) — configuração de modelo de imagem
- [Geração de música](/pt-BR/tools/music-generation) — configuração de modelo de música
- [Geração de vídeo](/pt-BR/tools/video-generation) — configuração de modelo de vídeo
- [Referência de configuração](/pt-BR/gateway/configuration-reference#agent-defaults) — chaves de configuração de modelo
