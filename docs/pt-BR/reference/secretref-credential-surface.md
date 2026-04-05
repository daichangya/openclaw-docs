---
read_when:
    - Verificar a cobertura de credenciais SecretRef
    - Auditar se uma credencial é elegível para `secrets configure` ou `secrets apply`
    - Verificar por que uma credencial está fora da superfície compatível
summary: Superfície canônica de credenciais SecretRef compatíveis vs. não compatíveis
title: Superfície de credenciais SecretRef
x-i18n:
    generated_at: "2026-04-05T12:52:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf997389de1dae8c059d8dfbf186eda979f864de632a033177d6cd5e5544675d
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

# Superfície de credenciais SecretRef

Esta página define a superfície canônica de credenciais SecretRef.

Intenção do escopo:

- No escopo: credenciais estritamente fornecidas pelo usuário que o OpenClaw não emite nem rotaciona.
- Fora do escopo: credenciais emitidas em runtime ou rotativas, material de atualização OAuth e artefatos semelhantes a sessão.

## Credenciais compatíveis

### Alvos em `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

[//]: # "secretref-supported-list-start"

- `models.providers.*.apiKey`
- `models.providers.*.headers.*`
- `models.providers.*.request.auth.token`
- `models.providers.*.request.auth.value`
- `models.providers.*.request.headers.*`
- `models.providers.*.request.proxy.tls.ca`
- `models.providers.*.request.proxy.tls.cert`
- `models.providers.*.request.proxy.tls.key`
- `models.providers.*.request.proxy.tls.passphrase`
- `models.providers.*.request.tls.ca`
- `models.providers.*.request.tls.cert`
- `models.providers.*.request.tls.key`
- `models.providers.*.request.tls.passphrase`
- `skills.entries.*.apiKey`
- `agents.defaults.memorySearch.remote.apiKey`
- `agents.list[].memorySearch.remote.apiKey`
- `talk.providers.*.apiKey`
- `messages.tts.providers.*.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `plugins.entries.firecrawl.config.webFetch.apiKey`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.minimax.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
- `tools.web.search.apiKey`
- `gateway.auth.password`
- `gateway.auth.token`
- `gateway.remote.token`
- `gateway.remote.password`
- `cron.webhookToken`
- `channels.telegram.botToken`
- `channels.telegram.webhookSecret`
- `channels.telegram.accounts.*.botToken`
- `channels.telegram.accounts.*.webhookSecret`
- `channels.slack.botToken`
- `channels.slack.appToken`
- `channels.slack.userToken`
- `channels.slack.signingSecret`
- `channels.slack.accounts.*.botToken`
- `channels.slack.accounts.*.appToken`
- `channels.slack.accounts.*.userToken`
- `channels.slack.accounts.*.signingSecret`
- `channels.discord.token`
- `channels.discord.pluralkit.token`
- `channels.discord.voice.tts.providers.*.apiKey`
- `channels.discord.accounts.*.token`
- `channels.discord.accounts.*.pluralkit.token`
- `channels.discord.accounts.*.voice.tts.providers.*.apiKey`
- `channels.irc.password`
- `channels.irc.nickserv.password`
- `channels.irc.accounts.*.password`
- `channels.irc.accounts.*.nickserv.password`
- `channels.bluebubbles.password`
- `channels.bluebubbles.accounts.*.password`
- `channels.feishu.appSecret`
- `channels.feishu.encryptKey`
- `channels.feishu.verificationToken`
- `channels.feishu.accounts.*.appSecret`
- `channels.feishu.accounts.*.encryptKey`
- `channels.feishu.accounts.*.verificationToken`
- `channels.msteams.appPassword`
- `channels.mattermost.botToken`
- `channels.mattermost.accounts.*.botToken`
- `channels.matrix.accessToken`
- `channels.matrix.password`
- `channels.matrix.accounts.*.accessToken`
- `channels.matrix.accounts.*.password`
- `channels.nextcloud-talk.botSecret`
- `channels.nextcloud-talk.apiPassword`
- `channels.nextcloud-talk.accounts.*.botSecret`
- `channels.nextcloud-talk.accounts.*.apiPassword`
- `channels.zalo.botToken`
- `channels.zalo.webhookSecret`
- `channels.zalo.accounts.*.botToken`
- `channels.zalo.accounts.*.webhookSecret`
- `channels.googlechat.serviceAccount` via irmão `serviceAccountRef` (exceção de compatibilidade)
- `channels.googlechat.accounts.*.serviceAccount` via irmão `serviceAccountRef` (exceção de compatibilidade)

### Alvos em `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; não compatível quando `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; não compatível quando `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Observações:

- Alvos de plano de perfil de autenticação exigem `agentId`.
- Entradas de plano têm como alvo `profiles.*.key` / `profiles.*.token` e gravam refs irmãs (`keyRef` / `tokenRef`).
- Refs de perfil de autenticação são incluídas na resolução em runtime e na cobertura de auditoria.
- Proteção de política OAuth: `auth.profiles.<id>.mode = "oauth"` não pode ser combinado com entradas SecretRef para esse perfil. Inicialização/recarregamento e resolução de perfil de autenticação falham rapidamente quando essa política é violada.
- Para provedores de modelo gerenciados por SecretRef, entradas geradas em `agents/*/agent/models.json` persistem marcadores não secretos (não valores de segredo resolvidos) para superfícies `apiKey`/header.
- A persistência de marcadores é autoritativa à origem: o OpenClaw grava marcadores a partir do snapshot de configuração de origem ativo (pré-resolução), não a partir de valores de segredo resolvidos em runtime.
- Para busca na web:
  - No modo de provedor explícito (`tools.web.search.provider` definido), apenas a chave do provedor selecionado fica ativa.
  - No modo automático (`tools.web.search.provider` não definido), apenas a primeira chave de provedor que é resolvida por precedência fica ativa.
  - No modo automático, refs de provedores não selecionados são tratadas como inativas até serem selecionadas.
  - Caminhos legados de provedor `tools.web.search.*` ainda são resolvidos durante a janela de compatibilidade, mas a superfície canônica de SecretRef é `plugins.entries.<plugin>.config.webSearch.*`.

## Credenciais não compatíveis

Credenciais fora do escopo incluem:

[//]: # "secretref-unsupported-list-start"

- `commands.ownerDisplaySecret`
- `hooks.token`
- `hooks.gmail.pushToken`
- `hooks.mappings[].sessionKey`
- `auth-profiles.oauth.*`
- `channels.discord.threadBindings.webhookToken`
- `channels.discord.accounts.*.threadBindings.webhookToken`
- `channels.whatsapp.creds.json`
- `channels.whatsapp.accounts.*.creds.json`

[//]: # "secretref-unsupported-list-end"

Justificativa:

- Essas credenciais são emitidas, rotacionadas, carregam sessão ou pertencem a classes duráveis de OAuth que não se encaixam na resolução externa SecretRef somente leitura.
