---
read_when:
    - Adicionando ou modificando migrações do doctor
    - Introduzindo mudanças incompatíveis de configuração
summary: 'Comando Doctor: verificações de integridade, migrações de configuração e etapas de reparo'
title: Doctor
x-i18n:
    generated_at: "2026-04-05T12:42:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 119080ef6afe1b14382a234f844ea71336923355d991fe6d816fddc6c83cf88f
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` é a ferramenta de reparo + migração do OpenClaw. Ela corrige
configuração/estado obsoletos, verifica a integridade e fornece etapas de reparo acionáveis.

## Início rápido

```bash
openclaw doctor
```

### Headless / automação

```bash
openclaw doctor --yes
```

Aceita os padrões sem solicitar confirmação (incluindo etapas de reparo de restart/serviço/sandbox, quando aplicável).

```bash
openclaw doctor --repair
```

Aplica reparos recomendados sem solicitar confirmação (reparos + restarts quando seguros).

```bash
openclaw doctor --repair --force
```

Aplica também reparos agressivos (sobrescreve configurações personalizadas de supervisor).

```bash
openclaw doctor --non-interactive
```

Executa sem prompts e aplica apenas migrações seguras (normalização de configuração + movimentações de estado em disco). Ignora ações de restart/serviço/sandbox que exigem confirmação humana.
Migrações de estado legado são executadas automaticamente quando detectadas.

```bash
openclaw doctor --deep
```

Varre serviços do sistema em busca de instalações extras do gateway (launchd/systemd/schtasks).

Se você quiser revisar as alterações antes de gravar, abra primeiro o arquivo de configuração:

```bash
cat ~/.openclaw/openclaw.json
```

## O que ele faz (resumo)

- Atualização opcional de pré-verificação para instalações via git (somente interativo).
- Verificação de atualização do protocolo da UI (recompila a UI de Controle quando o esquema do protocolo é mais novo).
- Verificação de integridade + prompt de restart.
- Resumo do status de Skills (elegíveis/ausentes/bloqueadas) e status de plugins.
- Normalização da configuração para valores legados.
- Migração da configuração Talk de campos planos legados `talk.*` para `talk.provider` + `talk.providers.<provider>`.
- Verificações de migração do Browser para configurações legadas de extensão do Chrome e prontidão do Chrome MCP.
- Avisos de substituição de provedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Verificação de pré-requisitos TLS de OAuth para perfis OpenAI Codex OAuth.
- Migração de estado legado em disco (sessões/dir de agente/autenticação do WhatsApp).
- Migração da chave de contrato de manifesto de plugin legado (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migração do armazenamento legado de cron (`jobId`, `schedule.cron`, campos de entrega/payload de nível superior, `provider` no payload, jobs simples de fallback de webhook com `notify: true`).
- Inspeção de arquivo de lock de sessão e limpeza de locks obsoletos.
- Verificações de integridade e permissões do estado (sessões, transcrições, diretório de estado).
- Verificações de permissões do arquivo de configuração (chmod 600) ao executar localmente.
- Integridade da autenticação de modelos: verifica expiração de OAuth, pode atualizar tokens prestes a expirar e relata estados de cooldown/desativação de perfis de autenticação.
- Detecção de diretório extra de workspace (`~/openclaw`).
- Reparo de imagem de sandbox quando sandboxing está habilitado.
- Migração de serviço legado e detecção de gateways extras.
- Migração de estado legado do canal Matrix (em modo `--fix` / `--repair`).
- Verificações de runtime do gateway (serviço instalado, mas não em execução; rótulo launchd em cache).
- Avisos de status de canais (sondados a partir do gateway em execução).
- Auditoria de configuração de supervisor (launchd/systemd/schtasks) com reparo opcional.
- Verificações de boas práticas de runtime do gateway (Node vs Bun, caminhos de gerenciador de versões).
- Diagnósticos de colisão de porta do gateway (padrão `18789`).
- Avisos de segurança para políticas abertas de DM.
- Verificações de autenticação do gateway para modo de token local (oferece geração de token quando nenhuma origem de token existe; não sobrescreve configurações de token SecretRef).
- Verificação de linger do systemd no Linux.
- Verificação de tamanho de arquivos bootstrap do workspace (avisos de truncamento/próximo ao limite para arquivos de contexto).
- Verificação de status do autocompletar do shell e instalação/upgrade automáticos.
- Verificação de prontidão do provedor de embedding da pesquisa de memória (modelo local, chave de API remota ou binário QMD).
- Verificações de instalação de origem (incompatibilidade do workspace pnpm, ativos de UI ausentes, binário tsx ausente).
- Grava configuração atualizada + metadados do assistente.

## Comportamento detalhado e justificativa

### 0) Atualização opcional (instalações via git)

Se isto for um checkout git e o doctor estiver sendo executado de forma interativa, ele oferece
atualizar (fetch/rebase/build) antes de executar o doctor.

### 1) Normalização da configuração

Se a configuração contiver formatos de valores legados (por exemplo `messages.ackReaction`
sem uma substituição específica de canal), o doctor os normaliza para o
esquema atual.

Isso inclui campos planos legados de Talk. A configuração pública atual de Talk é
`talk.provider` + `talk.providers.<provider>`. O doctor reescreve formatos antigos de
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` no mapa de provedores.

### 2) Migrações de chaves legadas de configuração

Quando a configuração contém chaves obsoletas, outros comandos se recusam a executar e pedem
que você execute `openclaw doctor`.

O Doctor irá:

- Explicar quais chaves legadas foram encontradas.
- Mostrar a migração que aplicou.
- Reescrever `~/.openclaw/openclaw.json` com o esquema atualizado.

O Gateway também executa automaticamente migrações do doctor na inicialização quando detecta um
formato legado de configuração, então configurações obsoletas são reparadas sem intervenção manual.
Migrações do armazenamento de jobs de cron são tratadas por `openclaw doctor --fix`.

Migrações atuais:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` de nível superior
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- legado `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Para canais com `accounts` nomeadas, mas com valores persistentes de canal de conta única no nível superior, mover esses valores com escopo de conta para a conta promovida escolhida para esse canal (`accounts.default` para a maioria dos canais; Matrix pode preservar um destino nomeado/padrão correspondente existente)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- remover `browser.relayBindHost` (configuração legada de relay de extensão)

Os avisos do Doctor também incluem orientações de conta padrão para canais com várias contas:

- Se duas ou mais entradas `channels.<channel>.accounts` estiverem configuradas sem `channels.<channel>.defaultAccount` ou `accounts.default`, o doctor avisa que o roteamento por fallback pode escolher uma conta inesperada.
- Se `channels.<channel>.defaultAccount` estiver definido para um ID de conta desconhecido, o doctor avisa e lista os IDs de conta configurados.

### 2b) Substituições de provedor OpenCode

Se você adicionou `models.providers.opencode`, `opencode-zen` ou `opencode-go`
manualmente, isso substitui o catálogo OpenCode embutido de `@mariozechner/pi-ai`.
Isso pode forçar modelos para a API errada ou zerar custos. O doctor avisa para que você
possa remover a substituição e restaurar o roteamento por API + custos por modelo.

### 2c) Migração do Browser e prontidão do Chrome MCP

Se a sua configuração do browser ainda aponta para o caminho removido da extensão do Chrome, o doctor
a normaliza para o modelo atual de conexão local ao host do Chrome MCP:

- `browser.profiles.*.driver: "extension"` passa a ser `"existing-session"`
- `browser.relayBindHost` é removido

O doctor também audita o caminho local ao host do Chrome MCP quando você usa `defaultProfile:
"user"` ou um perfil `existing-session` configurado:

- verifica se o Google Chrome está instalado no mesmo host para perfis padrão
  de conexão automática
- verifica a versão detectada do Chrome e avisa quando ela está abaixo do Chrome 144
- lembra você de habilitar a depuração remota na página de inspeção do browser (por
  exemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`
  ou `edge://inspect/#remote-debugging`)

O doctor não pode habilitar essa configuração do lado do Chrome para você. O Chrome MCP local ao host
ainda exige:

- um browser baseado em Chromium 144+ no host do gateway/nó
- o browser em execução localmente
- depuração remota habilitada nesse browser
- aprovação do primeiro prompt de consentimento de conexão no browser

A prontidão aqui trata apenas dos pré-requisitos de conexão local. Existing-session mantém
os limites atuais de rota do Chrome MCP; rotas avançadas como `responsebody`, exportação de PDF,
interceptação de download e ações em lote ainda exigem um
browser gerenciado ou perfil raw CDP.

Esta verificação **não** se aplica a Docker, sandbox, remote-browser ou outros
fluxos headless. Eles continuam usando raw CDP.

### 2d) Pré-requisitos TLS de OAuth

Quando um perfil OpenAI Codex OAuth está configurado, o doctor sonda o endpoint de
autorização da OpenAI para verificar se a stack TLS local de Node/OpenSSL consegue
validar a cadeia de certificados. Se a sondagem falhar com um erro de certificado (por
exemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado expirado ou certificado autoassinado),
o doctor imprime orientações de correção específicas da plataforma. No macOS com Node do Homebrew, a
correção costuma ser `brew postinstall ca-certificates`. Com `--deep`, a sondagem é executada
mesmo que o gateway esteja íntegro.

### 3) Migrações de estado legado (layout em disco)

O doctor pode migrar layouts antigos em disco para a estrutura atual:

- Armazenamento de sessões + transcrições:
  - de `~/.openclaw/sessions/` para `~/.openclaw/agents/<agentId>/sessions/`
- Diretório do agente:
  - de `~/.openclaw/agent/` para `~/.openclaw/agents/<agentId>/agent/`
- Estado de autenticação do WhatsApp (Baileys):
  - de `~/.openclaw/credentials/*.json` legado (exceto `oauth.json`)
  - para `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID padrão da conta: `default`)

Essas migrações são best-effort e idempotentes; o doctor emitirá avisos quando
deixar alguma pasta legada para trás como backup. O Gateway/CLI também migra automaticamente
as sessões legadas + diretório do agente na inicialização para que histórico/autenticação/modelos caiam no
caminho por agente sem exigir execução manual do doctor. A autenticação do WhatsApp é intencionalmente
migrada apenas via `openclaw doctor`. A normalização Talk provider/provider-map agora
compara por igualdade estrutural, então diferenças apenas na ordem das chaves não disparam mais
mudanças repetidas sem efeito em `doctor --fix`.

### 3a) Migrações legadas de manifesto de plugin

O doctor varre todos os manifestos de plugin instalados em busca de chaves
obsoletas de capacidade de nível superior (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Quando encontradas, ele oferece mover essas chaves para o objeto `contracts`
e reescrever o arquivo de manifesto no local. Essa migração é idempotente;
se a chave `contracts` já tiver os mesmos valores, a chave legada é removida
sem duplicar os dados.

### 3b) Migrações legadas do armazenamento de cron

O doctor também verifica o armazenamento de jobs de cron (`~/.openclaw/cron/jobs.json` por padrão,
ou `cron.store` quando substituído) em busca de formatos antigos de job que o scheduler ainda
aceita por compatibilidade.

As limpezas atuais de cron incluem:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- campos de payload de nível superior (`message`, `model`, `thinking`, ...) → `payload`
- campos de entrega de nível superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- aliases de entrega `provider` no payload → `delivery.channel` explícito
- jobs simples legados de fallback de webhook com `notify: true` → `delivery.mode="webhook"` explícito com `delivery.to=cron.webhook`

O doctor só migra automaticamente jobs `notify: true` quando consegue fazer isso sem
alterar o comportamento. Se um job combinar fallback legado de notify com um modo de entrega
não-webhook já existente, o doctor avisa e deixa esse job para revisão manual.

### 3c) Limpeza de locks de sessão

O doctor varre cada diretório de sessão de agente em busca de arquivos obsoletos de lock de gravação — arquivos deixados
para trás quando uma sessão foi encerrada de forma anormal. Para cada lock encontrado, ele informa:
o caminho, PID, se o PID ainda está ativo, idade do lock e se ele é
considerado obsoleto (PID morto ou mais antigo que 30 minutos). No modo `--fix` / `--repair`
ele remove automaticamente locks obsoletos; caso contrário, imprime uma observação e
instrui você a executar novamente com `--fix`.

### 4) Verificações de integridade do estado (persistência de sessão, roteamento e segurança)

O diretório de estado é o tronco encefálico operacional. Se ele desaparecer, você perde
sessões, credenciais, logs e configuração (a menos que tenha backups em outro lugar).

O doctor verifica:

- **Diretório de estado ausente**: avisa sobre perda catastrófica de estado, solicita recriação
  do diretório e lembra que não pode recuperar dados ausentes.
- **Permissões do diretório de estado**: verifica capacidade de gravação; oferece reparar permissões
  (e emite uma dica de `chown` quando detecta incompatibilidade de owner/grupo).
- **Diretório de estado sincronizado com a nuvem no macOS**: avisa quando o estado é resolvido em iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou
  `~/Library/CloudStorage/...`, porque caminhos com sync em segundo plano podem causar E/S mais lenta
  e condições de corrida de lock/sincronização.
- **Diretório de estado em SD ou eMMC no Linux**: avisa quando o estado é resolvido em uma origem
  de montagem `mmcblk*`, porque E/S aleatória em SD ou eMMC pode ser mais lenta e causar desgaste
  mais rápido sob gravações de sessão e credenciais.
- **Diretórios de sessão ausentes**: `sessions/` e o diretório de armazenamento de sessões são
  necessários para persistir o histórico e evitar falhas `ENOENT`.
- **Incompatibilidade de transcrição**: avisa quando entradas recentes de sessão têm arquivos de
  transcrição ausentes.
- **Sessão principal “JSONL de 1 linha”**: sinaliza quando a transcrição principal tem apenas uma
  linha (o histórico não está se acumulando).
- **Vários diretórios de estado**: avisa quando vários diretórios `~/.openclaw` existem em
  diretórios home ou quando `OPENCLAW_STATE_DIR` aponta para outro lugar (o histórico pode
  ficar dividido entre instalações).
- **Lembrete de modo remoto**: se `gateway.mode=remote`, o doctor lembra você de executá-lo
  no host remoto (o estado fica lá).
- **Permissões do arquivo de configuração**: avisa se `~/.openclaw/openclaw.json` está
  legível por grupo/mundo e oferece restringir para `600`.

### 5) Integridade da autenticação de modelos (expiração de OAuth)

O doctor inspeciona perfis OAuth no armazenamento de autenticação, avisa quando tokens estão
expirando/expirados e pode atualizá-los quando seguro. Se o perfil
OAuth/token da Anthropic estiver obsoleto, ele sugere migrar para Claude CLI ou uma
chave de API da Anthropic.
Prompts de atualização só aparecem em execução interativa (TTY); `--non-interactive`
ignora tentativas de atualização.

O doctor também relata perfis de autenticação temporariamente inutilizáveis devido a:

- cooldowns curtos (limites de taxa/timeouts/falhas de autenticação)
- desativações mais longas (falhas de cobrança/crédito)

### 6) Validação do modelo de hooks

Se `hooks.gmail.model` estiver definido, o doctor valida a referência do modelo em relação ao
catálogo e à lista de permissões e avisa quando ela não puder ser resolvida ou não for permitida.

### 7) Reparo de imagem de sandbox

Quando sandboxing está habilitado, o doctor verifica imagens Docker e oferece construir ou
mudar para nomes legados se a imagem atual estiver ausente.

### 7b) Dependências de runtime de plugins incluídos

O doctor verifica se dependências de runtime de plugins incluídos (por exemplo os
pacotes de runtime do plugin Discord) estão presentes na raiz da instalação do OpenClaw.
Se alguma estiver ausente, o doctor relata os pacotes e os instala no modo
`openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Migrações de serviço do gateway e dicas de limpeza

O doctor detecta serviços legados do gateway (launchd/systemd/schtasks) e
oferece removê-los e instalar o serviço OpenClaw usando a porta atual do gateway.
Ele também pode procurar serviços extras semelhantes ao gateway e imprimir dicas de limpeza.
Serviços de gateway OpenClaw nomeados por perfil são considerados de primeira classe e não
são marcados como "extra".

### 8b) Migração Matrix na inicialização

Quando uma conta de canal Matrix tem uma migração de estado legado pendente ou acionável,
o doctor (no modo `--fix` / `--repair`) cria um snapshot pré-migração e então
executa as etapas de migração em best-effort: migração de estado legado do Matrix e preparação de estado
criptografado legado. Ambas as etapas não são fatais; erros são registrados em log e a
inicialização continua. No modo somente leitura (`openclaw doctor` sem `--fix`) esta verificação
é totalmente ignorada.

### 9) Avisos de segurança

O doctor emite avisos quando um provedor está aberto a DMs sem lista de permissões, ou
quando uma política está configurada de forma perigosa.

### 10) Linger do systemd (Linux)

Se estiver sendo executado como serviço de usuário do systemd, o doctor garante que linger esteja habilitado para que o
gateway continue ativo após logout.

### 11) Status do workspace (Skills, plugins e diretórios legados)

O doctor imprime um resumo do estado do workspace para o agente padrão:

- **Status de Skills**: conta Skills elegíveis, com requisitos ausentes e bloqueadas por lista de permissões.
- **Diretórios legados do workspace**: avisa quando `~/openclaw` ou outros diretórios legados de workspace
  existem ao lado do workspace atual.
- **Status de plugins**: conta plugins carregados/desabilitados/com erro; lista IDs de plugins para quaisquer
  erros; relata capacidades de plugins incluídos no bundle.
- **Avisos de compatibilidade de plugins**: sinaliza plugins que têm problemas de compatibilidade com
  o runtime atual.
- **Diagnósticos de plugin**: expõe quaisquer avisos ou erros emitidos pelo
  registro de plugins durante o carregamento.

### 11b) Tamanho de arquivo bootstrap

O doctor verifica se os arquivos bootstrap do workspace (por exemplo `AGENTS.md`,
`CLAUDE.md` ou outros arquivos de contexto injetados) estão próximos ou acima do
orçamento configurado de caracteres. Ele informa contagens por arquivo de caracteres brutos vs. injetados, percentual
de truncamento, causa do truncamento (`max/file` ou `max/total`) e total de caracteres
injetados como fração do orçamento total. Quando arquivos são truncados ou estão próximos
do limite, o doctor imprime dicas para ajustar `agents.defaults.bootstrapMaxChars`
e `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Autocompletar do shell

O doctor verifica se o autocompletar por tab está instalado para o shell atual
(zsh, bash, fish ou PowerShell):

- Se o perfil do shell usar um padrão lento de autocompletar dinâmico
  (`source <(openclaw completion ...)`), o doctor o atualiza para a variante
  mais rápida com arquivo em cache.
- Se o autocompletar estiver configurado no perfil, mas o arquivo de cache estiver ausente,
  o doctor regenera o cache automaticamente.
- Se nenhum autocompletar estiver configurado, o doctor oferece instalá-lo
  (somente modo interativo; ignorado com `--non-interactive`).

Execute `openclaw completion --write-state` para regenerar manualmente o cache.

### 12) Verificações de autenticação do gateway (token local)

O doctor verifica a prontidão da autenticação por token local do gateway.

- Se o modo de token precisar de um token e nenhuma origem de token existir, o doctor oferece gerar um.
- Se `gateway.auth.token` for gerenciado por SecretRef, mas estiver indisponível, o doctor avisa e não o sobrescreve com texto simples.
- `openclaw doctor --generate-gateway-token` força a geração apenas quando nenhum token SecretRef estiver configurado.

### 12b) Reparos somente leitura com reconhecimento de SecretRef

Alguns fluxos de reparo precisam inspecionar credenciais configuradas sem enfraquecer o comportamento fail-fast do runtime.

- `openclaw doctor --fix` agora usa o mesmo modelo de resumo de SecretRef somente leitura dos comandos da família status para reparos direcionados de configuração.
- Exemplo: o reparo de `allowFrom` / `groupAllowFrom` do Telegram com `@username` tenta usar credenciais configuradas do bot quando disponíveis.
- Se o token do bot Telegram estiver configurado via SecretRef, mas indisponível no caminho atual do comando, o doctor informa que a credencial está configurada-mas-indisponível e ignora a resolução automática em vez de falhar ou relatar incorretamente o token como ausente.

### 13) Verificação de integridade do gateway + restart

O doctor executa uma verificação de integridade e oferece reiniciar o gateway quando ele parece
não íntegro.

### 13b) Prontidão da pesquisa de memória

O doctor verifica se o provedor configurado de embedding da pesquisa de memória está pronto
para o agente padrão. O comportamento depende do backend e do provedor configurados:

- **Backend QMD**: sonda se o binário `qmd` está disponível e pode ser iniciado.
  Se não estiver, imprime orientações de correção incluindo o pacote npm e uma opção manual de caminho do binário.
- **Provedor local explícito**: verifica a existência de um arquivo de modelo local ou de uma URL reconhecida
  de modelo remoto/baixável. Se ausente, sugere mudar para um provedor remoto.
- **Provedor remoto explícito** (`openai`, `voyage` etc.): verifica se uma chave de API está
  presente no ambiente ou no armazenamento de autenticação. Imprime dicas acionáveis de correção se estiver ausente.
- **Provedor automático**: verifica primeiro a disponibilidade do modelo local, depois tenta cada provedor remoto
  na ordem de seleção automática.

Quando um resultado de probe do gateway está disponível (o gateway estava íntegro no momento da
verificação), o doctor cruza esse resultado com a configuração visível pela CLI e informa
qualquer discrepância.

Use `openclaw memory status --deep` para verificar a prontidão de embeddings em runtime.

### 14) Avisos de status de canal

Se o gateway estiver íntegro, o doctor executa uma sondagem de status de canal e relata
avisos com correções sugeridas.

### 15) Auditoria + reparo de configuração de supervisor

O doctor verifica a configuração instalada do supervisor (launchd/systemd/schtasks) em busca de
padrões ausentes ou desatualizados (por exemplo dependências `network-online` do systemd e
atraso de restart). Quando encontra uma incompatibilidade, recomenda uma atualização e pode
reescrever o arquivo de serviço/tarefa para os padrões atuais.

Observações:

- `openclaw doctor` solicita confirmação antes de reescrever a configuração do supervisor.
- `openclaw doctor --yes` aceita os prompts padrão de reparo.
- `openclaw doctor --repair` aplica correções recomendadas sem prompts.
- `openclaw doctor --repair --force` sobrescreve configurações personalizadas de supervisor.
- Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação/reparo de serviço do doctor valida o SecretRef, mas não persiste valores resolvidos de token em texto simples nos metadados de ambiente do serviço supervisor.
- Se a autenticação por token exigir um token e o token SecretRef configurado estiver não resolvido, o doctor bloqueia o caminho de instalação/reparo com orientação acionável.
- Se tanto `gateway.auth.token` quanto `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, o doctor bloqueia instalação/reparo até que o modo seja definido explicitamente.
- Para units Linux user-systemd, verificações de desvio de token agora incluem fontes `Environment=` e `EnvironmentFile=` ao comparar metadados de autenticação do serviço.
- Você sempre pode forçar uma regravação completa via `openclaw gateway install --force`.

### 16) Diagnósticos de runtime + porta do gateway

O doctor inspeciona o runtime do serviço (PID, último status de saída) e avisa quando o
serviço está instalado, mas não está realmente em execução. Ele também verifica colisões de
porta na porta do gateway (padrão `18789`) e relata causas prováveis (gateway já
em execução, túnel SSH).

### 17) Boas práticas de runtime do gateway

O doctor avisa quando o serviço do gateway é executado com Bun ou com um caminho Node gerenciado por versão
(`nvm`, `fnm`, `volta`, `asdf` etc.). Canais WhatsApp + Telegram exigem Node,
e caminhos de gerenciador de versões podem quebrar após upgrades porque o serviço não
carrega a inicialização do seu shell. O doctor oferece migrar para uma instalação de sistema do Node quando
disponível (Homebrew/apt/choco).

### 18) Gravação de configuração + metadados do assistente

O doctor persiste quaisquer mudanças de configuração e registra metadados do assistente para marcar a
execução do doctor.

### 19) Dicas de workspace (backup + sistema de memória)

O doctor sugere um sistema de memória do workspace quando ausente e imprime uma dica de backup
se o workspace ainda não estiver sob git.

Consulte [/concepts/agent-workspace](/concepts/agent-workspace) para um guia completo da
estrutura do workspace e backup com git (GitHub ou GitLab privados recomendados).
