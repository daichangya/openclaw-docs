---
read_when:
    - Você quer ajustar credenciais, dispositivos ou padrões de agente de forma interativa
summary: Referência da CLI para `openclaw configure` (prompts interativos de configuração)
title: configure
x-i18n:
    generated_at: "2026-04-05T12:37:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 989569fdb8e1b31ce3438756b3ed9bf18e0c8baf611c5981643ba5925459c98f
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Prompt interativo para configurar credenciais, dispositivos e padrões de agente.

Observação: a seção **Model** agora inclui uma seleção múltipla para a lista de permissões
`agents.defaults.models` (o que aparece em `/model` e no seletor de modelo).

Quando o configure é iniciado a partir de uma escolha de autenticação de provedor, os seletores de modelo padrão e
de lista de permissões passam a preferir esse provedor automaticamente. Para provedores pareados, como
Volcengine/BytePlus, a mesma preferência também corresponde às variantes de plano de codificação
(`volcengine-plan/*`, `byteplus-plan/*`). Se o filtro de provedor preferido
produzir uma lista vazia, o configure volta ao catálogo sem filtro em vez de mostrar um seletor em branco.

Dica: `openclaw config` sem um subcomando abre o mesmo assistente. Use
`openclaw config get|set|unset` para edições não interativas.

Para pesquisa na web, `openclaw configure --section web` permite escolher um provedor
e configurar suas credenciais. Alguns provedores também mostram prompts de acompanhamento
específicos do provedor:

- **Grok** pode oferecer configuração opcional de `x_search` com a mesma `XAI_API_KEY` e
  permitir que você escolha um modelo `x_search`.
- **Kimi** pode solicitar a região da API Moonshot (`api.moonshot.ai` vs
  `api.moonshot.cn`) e o modelo padrão do Kimi para pesquisa na web.

Relacionados:

- Referência de configuração do gateway: [Configuração](/gateway/configuration)
- CLI de configuração: [Config](/cli/config)

## Opções

- `--section <section>`: filtro de seção repetível

Seções disponíveis:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

Observações:

- Escolher onde o Gateway é executado sempre atualiza `gateway.mode`. Você pode selecionar "Continue" sem outras seções se isso for tudo de que precisa.
- Serviços orientados a canais (Slack/Discord/Matrix/Microsoft Teams) solicitam listas de permissões de canal/sala durante a configuração. Você pode inserir nomes ou IDs; o assistente resolve nomes para IDs quando possível.
- Se você executar a etapa de instalação do daemon, a autenticação por token exige um token, e `gateway.auth.token` é gerenciado por SecretRef, o configure valida o SecretRef, mas não persiste valores de token em texto simples resolvidos nos metadados de ambiente do serviço supervisor.
- Se a autenticação por token exigir um token e o SecretRef de token configurado não estiver resolvido, o configure bloqueia a instalação do daemon com orientações de correção acionáveis.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem ambos configurados e `gateway.auth.mode` não estiver definido, o configure bloqueia a instalação do daemon até que o modo seja definido explicitamente.

## Exemplos

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```
