---
read_when:
    - Adicionando ou modificando migrações do doctor
    - Introduzindo mudanças incompatíveis na configuração
summary: 'Comando doctor: verificações de integridade, migrações de configuração e etapas de reparo'
title: Doctor
x-i18n:
    generated_at: "2026-04-21T05:37:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6460fe657e7cf0d938bfbb77e1cc0355c1b67830327d441878e48375de52a46f
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` é a ferramenta de reparo + migração do OpenClaw. Ela corrige
configuração/estado desatualizados, verifica a integridade e fornece etapas de reparo acionáveis.

## Início rápido

```bash
openclaw doctor
```

### Headless / automação

```bash
openclaw doctor --yes
```

Aceita os padrões sem solicitar confirmação (incluindo etapas de reparo de reinício/serviço/sandbox quando aplicável).

```bash
openclaw doctor --repair
```

Aplica os reparos recomendados sem solicitar confirmação (reparos + reinicializações quando seguro).

```bash
openclaw doctor --repair --force
```

Aplica também reparos agressivos (sobrescreve configurações personalizadas do supervisor).

```bash
openclaw doctor --non-interactive
```

Executa sem prompts e aplica apenas migrações seguras (normalização de configuração + movimentações de estado em disco). Ignora ações de reinício/serviço/sandbox que exigem confirmação humana.
Migrações de estado legado são executadas automaticamente quando detectadas.

```bash
openclaw doctor --deep
```

Examina serviços do sistema em busca de instalações extras do Gateway (launchd/systemd/schtasks).

Se você quiser revisar as alterações antes de gravar, abra primeiro o arquivo de configuração:

```bash
cat ~/.openclaw/openclaw.json
```

## O que ele faz (resumo)

- Atualização opcional antes da execução para instalações via git (apenas interativo).
- Verificação de atualização do protocolo da UI (recompila a Control UI quando o schema do protocolo é mais recente).
- Verificação de integridade + prompt de reinício.
- Resumo do status de Skills (elegíveis/ausentes/bloqueadas) e status de plugins.
- Normalização de configuração para valores legados.
- Migração da configuração de Talk dos campos legados achatados `talk.*` para `talk.provider` + `talk.providers.<provider>`.
- Verificações de migração do navegador para configurações legadas da extensão do Chrome e prontidão do Chrome MCP.
- Avisos de substituição do provedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Avisos de sombreamento do OAuth do Codex (`models.providers.openai-codex`).
- Verificação de pré-requisitos de TLS do OAuth para perfis OAuth do OpenAI Codex.
- Migração legada de estado em disco (sessões/diretório do agente/autenticação do WhatsApp).
- Migração legada da chave de contrato do manifesto de plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migração legada do armazenamento de Cron (`jobId`, `schedule.cron`, campos de entrega/payload de nível superior, payload `provider`, jobs simples de fallback de Webhook com `notify: true`).
- Inspeção do arquivo de bloqueio de sessão e limpeza de bloqueios obsoletos.
- Verificações de integridade e permissões do estado (sessões, transcrições, diretório de estado).
- Verificações de permissões do arquivo de configuração (`chmod 600`) ao executar localmente.
- Integridade da autenticação do modelo: verifica expiração de OAuth, pode atualizar tokens prestes a expirar e informa estados de cooldown/desativação do perfil de autenticação.
- Detecção de diretório extra de workspace (`~/openclaw`).
- Reparo da imagem de sandbox quando o sandboxing está ativado.
- Migração de serviço legado e detecção de Gateway extra.
- Migração de estado legado do canal Matrix (no modo `--fix` / `--repair`).
- Verificações do runtime do Gateway (serviço instalado, mas não em execução; label launchd em cache).
- Avisos de status do canal (sondados a partir do Gateway em execução).
- Auditoria de configuração do supervisor (launchd/systemd/schtasks) com reparo opcional.
- Verificações de melhores práticas do runtime do Gateway (Node vs Bun, caminhos de gerenciador de versão).
- Diagnóstico de colisão de porta do Gateway (padrão `18789`).
- Avisos de segurança para políticas de DM abertas.
- Verificações de autenticação do Gateway para modo de token local (oferece geração de token quando não existe fonte de token; não sobrescreve configurações SecretRef de token).
- Detecção de problemas de pareamento de dispositivos (solicitações pendentes de primeiro pareamento, upgrades pendentes de função/escopo, divergência obsoleta do cache local de token do dispositivo e divergência de autenticação de registro pareado).
- Verificação de linger do systemd no Linux.
- Verificação do tamanho do arquivo de bootstrap do workspace (avisos de truncamento/próximo do limite para arquivos de contexto).
- Verificação do status do shell completion e instalação/atualização automática.
- Verificação da prontidão do provedor de embeddings da busca de memória (modelo local, chave de API remota ou binário QMD).
- Verificações de instalação de origem (incompatibilidade de workspace pnpm, ativos de UI ausentes, binário tsx ausente).
- Grava configuração atualizada + metadados do assistente.

## Backfill e redefinição da UI de Dreams

A cena Dreams da Control UI inclui ações **Backfill**, **Reset** e **Clear Grounded**
para o fluxo de Dreaming grounded. Essas ações usam métodos RPC no estilo doctor do
Gateway, mas **não** fazem parte do reparo/migração da CLI `openclaw doctor`.

O que elas fazem:

- **Backfill** examina arquivos históricos `memory/YYYY-MM-DD.md` no
  workspace ativo, executa a passagem grounded de diário REM e grava entradas
  reversíveis de backfill em `DREAMS.md`.
- **Reset** remove apenas essas entradas de diário de backfill marcadas de `DREAMS.md`.
- **Clear Grounded** remove apenas entradas temporárias somente grounded preparadas
  que vieram de replay histórico e ainda não acumularam suporte diário ou recall ao vivo.

O que elas **não** fazem por si mesmas:

- não editam `MEMORY.md`
- não executam migrações completas do doctor
- não preparam automaticamente candidatos grounded para o armazenamento de promoção
  temporária ao vivo, a menos que você execute explicitamente primeiro o caminho da CLI preparado

Se você quiser que o replay grounded histórico influencie o fluxo normal de promoção
profunda, use o fluxo da CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Isso prepara candidatos grounded duráveis no armazenamento temporário de Dreaming,
mantendo `DREAMS.md` como a superfície de revisão.

## Comportamento detalhado e justificativa

### 0) Atualização opcional (instalações via git)

Se isto for um checkout git e o doctor estiver sendo executado interativamente, ele oferece
atualizar (fetch/rebase/build) antes de executar o doctor.

### 1) Normalização de configuração

Se a configuração contiver formatos legados de valor (por exemplo `messages.ackReaction`
sem uma substituição específica por canal), o doctor os normaliza para o schema
atual.

Isso inclui campos achatados legados de Talk. A configuração pública atual de Talk é
`talk.provider` + `talk.providers.<provider>`. O doctor reescreve formatos antigos
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` no mapa do provedor.

### 2) Migrações de chaves legadas de configuração

Quando a configuração contém chaves obsoletas, outros comandos se recusam a executar e pedem
que você execute `openclaw doctor`.

O doctor irá:

- Explicar quais chaves legadas foram encontradas.
- Mostrar a migração aplicada.
- Reescrever `~/.openclaw/openclaw.json` com o schema atualizado.

O Gateway também executa automaticamente migrações do doctor na inicialização quando detecta um
formato legado de configuração, então configurações desatualizadas são reparadas sem intervenção manual.
Migrações do armazenamento de jobs do Cron são tratadas por `openclaw doctor --fix`.

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
- Para canais com `accounts` nomeadas, mas com valores de canal de conta única ainda no nível superior, mova esses valores com escopo de conta para a conta promovida escolhida para esse canal (`accounts.default` para a maioria dos canais; Matrix pode preservar um destino nomeado/padrão correspondente existente)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- remover `browser.relayBindHost` (configuração legada do relay da extensão)

Os avisos do doctor também incluem orientações sobre conta padrão para canais com múltiplas contas:

- Se duas ou mais entradas `channels.<channel>.accounts` estiverem configuradas sem `channels.<channel>.defaultAccount` ou `accounts.default`, o doctor avisa que o roteamento de fallback pode escolher uma conta inesperada.
- Se `channels.<channel>.defaultAccount` estiver definido para um ID de conta desconhecido, o doctor avisa e lista os IDs de conta configurados.

### 2b) Substituições do provedor OpenCode

Se você adicionou `models.providers.opencode`, `opencode-zen` ou `opencode-go`
manualmente, isso substitui o catálogo OpenCode integrado de `@mariozechner/pi-ai`.
Isso pode forçar modelos para a API errada ou zerar custos. O doctor avisa para que você
possa remover a substituição e restaurar o roteamento por API por modelo + custos.

### 2c) Migração do navegador e prontidão do Chrome MCP

Se sua configuração do navegador ainda aponta para o caminho removido da extensão do Chrome, o doctor
a normaliza para o modelo atual de conexão host-local do Chrome MCP:

- `browser.profiles.*.driver: "extension"` torna-se `"existing-session"`
- `browser.relayBindHost` é removido

O doctor também audita o caminho host-local do Chrome MCP quando você usa `defaultProfile:
"user"` ou um perfil `existing-session` configurado:

- verifica se o Google Chrome está instalado no mesmo host para perfis padrão
  com conexão automática
- verifica a versão detectada do Chrome e avisa quando ela for inferior ao Chrome 144
- lembra você de ativar a depuração remota na página de inspeção do navegador (por
  exemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  ou `edge://inspect/#remote-debugging`)

O doctor não pode ativar a configuração do lado do Chrome para você. O Chrome MCP host-local
ainda exige:

- um navegador baseado em Chromium 144+ no host do gateway/node
- o navegador em execução localmente
- depuração remota ativada nesse navegador
- aprovação do primeiro prompt de consentimento de conexão no navegador

A prontidão aqui diz respeito apenas aos pré-requisitos de conexão local. Existing-session mantém
os limites atuais de rota do Chrome MCP; rotas avançadas como `responsebody`, exportação de PDF,
interceptação de download e ações em lote ainda exigem um navegador gerenciado ou perfil CDP bruto.

Esta verificação **não** se aplica a Docker, sandbox, remote-browser ou outros
fluxos headless. Eles continuam a usar CDP bruto.

### 2d) Pré-requisitos de TLS do OAuth

Quando um perfil OAuth do OpenAI Codex está configurado, o doctor sonda o endpoint de
autorização da OpenAI para verificar se a pilha local de TLS do Node/OpenSSL consegue
validar a cadeia de certificados. Se a sonda falhar com um erro de certificado (por
exemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado expirado ou certificado autoassinado),
o doctor imprime orientações de correção específicas da plataforma. No macOS com um Node do Homebrew, a
correção geralmente é `brew postinstall ca-certificates`. Com `--deep`, a sonda é executada
mesmo se o Gateway estiver íntegro.

### 2c) Substituições do provedor OAuth do Codex

Se você adicionou anteriormente configurações legadas de transporte do OpenAI em
`models.providers.openai-codex`, elas podem sombrear o caminho integrado do
provedor OAuth do Codex que versões mais novas usam automaticamente. O doctor avisa quando vê
essas configurações antigas de transporte junto com o OAuth do Codex para que você possa remover
ou reescrever a substituição legada de transporte e recuperar o comportamento integrado de
roteamento/fallback. Proxies personalizados e substituições somente de header ainda são compatíveis e não
disparam este aviso.

### 3) Migrações legadas de estado (layout em disco)

O doctor pode migrar layouts antigos em disco para a estrutura atual:

- Armazenamento de sessões + transcrições:
  - de `~/.openclaw/sessions/` para `~/.openclaw/agents/<agentId>/sessions/`
- Diretório do agente:
  - de `~/.openclaw/agent/` para `~/.openclaw/agents/<agentId>/agent/`
- Estado de autenticação do WhatsApp (Baileys):
  - de `~/.openclaw/credentials/*.json` legado (exceto `oauth.json`)
  - para `~/.openclaw/credentials/whatsapp/<accountId>/...` (id da conta padrão: `default`)

Essas migrações são best-effort e idempotentes; o doctor emitirá avisos quando
deixar quaisquer pastas legadas para trás como backups. O Gateway/CLI também migra automaticamente
as sessões legadas + o diretório do agente na inicialização, para que histórico/autenticação/modelos caiam no
caminho por agente sem uma execução manual do doctor. A autenticação do WhatsApp é intencionalmente migrada
apenas via `openclaw doctor`. A normalização de provider/provider-map do Talk agora
compara por igualdade estrutural, então diferenças apenas na ordem das chaves não disparam mais
alterações repetidas e sem efeito em `doctor --fix`.

### 3a) Migrações legadas de manifesto de plugin

O doctor examina todos os manifestos de plugins instalados em busca de chaves
obsoletas de capacidade de nível superior (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Quando encontradas, ele oferece mover essas chaves para o objeto `contracts`
e reescrever o arquivo de manifesto no local. Essa migração é idempotente;
se a chave `contracts` já tiver os mesmos valores, a chave legada será removida
sem duplicar os dados.

### 3b) Migrações legadas do armazenamento de Cron

O doctor também verifica o armazenamento de jobs do Cron (`~/.openclaw/cron/jobs.json` por padrão,
ou `cron.store` quando substituído) em busca de formatos antigos de job que o agendador ainda
aceita por compatibilidade.

As limpezas atuais de Cron incluem:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- campos de payload de nível superior (`message`, `model`, `thinking`, ...) → `payload`
- campos de entrega de nível superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- aliases de entrega do `provider` do payload → `delivery.channel` explícito
- jobs simples legados de fallback de Webhook com `notify: true` → `delivery.mode="webhook"` explícito com `delivery.to=cron.webhook`

O doctor só migra automaticamente jobs com `notify: true` quando consegue fazer isso sem
alterar o comportamento. Se um job combinar fallback legado de notificação com um modo de
entrega não-Webhook existente, o doctor avisa e deixa esse job para revisão manual.

### 3c) Limpeza de bloqueio de sessão

O doctor examina cada diretório de sessão do agente em busca de arquivos obsoletos de bloqueio de escrita —
arquivos deixados para trás quando uma sessão foi encerrada de forma anormal. Para cada arquivo de bloqueio encontrado, ele informa:
o caminho, PID, se o PID ainda está ativo, a idade do bloqueio e se ele é
considerado obsoleto (PID morto ou mais antigo que 30 minutos). No modo `--fix` / `--repair`
ele remove automaticamente arquivos de bloqueio obsoletos; caso contrário, imprime uma observação e
instrui você a executar novamente com `--fix`.

### 4) Verificações de integridade do estado (persistência de sessão, roteamento e segurança)

O diretório de estado é o tronco encefálico operacional. Se ele desaparecer, você perde
sessões, credenciais, logs e configuração (a menos que tenha backups em outro lugar).

O doctor verifica:

- **Diretório de estado ausente**: avisa sobre perda catastrófica de estado, solicita recriar
  o diretório e lembra que não pode recuperar dados ausentes.
- **Permissões do diretório de estado**: verifica gravabilidade; oferece reparar permissões
  (e emite uma dica de `chown` quando é detectada divergência de proprietário/grupo).
- **Diretório de estado do macOS sincronizado em nuvem**: avisa quando o estado resolve em iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou
  `~/Library/CloudStorage/...` porque caminhos com sincronização podem causar I/O mais lento
  e corridas de bloqueio/sincronização.
- **Diretório de estado em SD ou eMMC no Linux**: avisa quando o estado resolve para uma origem de montagem `mmcblk*`,
  porque I/O aleatório com backing em SD ou eMMC pode ser mais lento e causar maior desgaste
  sob gravações de sessão e credenciais.
- **Diretórios de sessão ausentes**: `sessions/` e o diretório de armazenamento de sessões são
  necessários para persistir histórico e evitar falhas `ENOENT`.
- **Divergência de transcrição**: avisa quando entradas recentes de sessão têm arquivos
  de transcrição ausentes.
- **Sessão principal “JSONL de 1 linha”**: sinaliza quando a transcrição principal tem apenas uma
  linha (o histórico não está se acumulando).
- **Múltiplos diretórios de estado**: avisa quando existem múltiplas pastas `~/.openclaw` em
  diretórios home ou quando `OPENCLAW_STATE_DIR` aponta para outro lugar (o histórico pode
  se dividir entre instalações).
- **Lembrete do modo remoto**: se `gateway.mode=remote`, o doctor lembra você de executá-lo
  no host remoto (o estado vive lá).
- **Permissões do arquivo de configuração**: avisa se `~/.openclaw/openclaw.json` estiver
  legível por grupo/mundo e oferece restringi-lo para `600`.

### 5) Integridade da autenticação do modelo (expiração do OAuth)

O doctor inspeciona perfis OAuth no armazenamento de autenticação, avisa quando tokens estão
perto de expirar/expirados e pode atualizá-los quando for seguro. Se o perfil
OAuth/token do Anthropic estiver obsoleto, ele sugere uma chave de API do Anthropic ou o
caminho do token de configuração do Anthropic.
Prompts de atualização aparecem apenas ao executar interativamente (TTY); `--non-interactive`
ignora tentativas de atualização.

Quando uma atualização de OAuth falha permanentemente (por exemplo `refresh_token_reused`,
`invalid_grant`, ou um provedor informando que você precisa entrar novamente), o doctor informa
que é necessário reautenticar e imprime o comando exato `openclaw models auth login --provider ...`
que deve ser executado.

O doctor também informa perfis de autenticação que estão temporariamente inutilizáveis devido a:

- cooldowns curtos (limites de taxa/timeouts/falhas de autenticação)
- desativações mais longas (falhas de cobrança/crédito)

### 6) Validação do modelo de hooks

Se `hooks.gmail.model` estiver definido, o doctor valida a referência do modelo em relação ao
catálogo e à lista de permissões e avisa quando ela não for resolvida ou não for permitida.

### 7) Reparo da imagem de sandbox

Quando o sandboxing está ativado, o doctor verifica imagens Docker e oferece construir ou
alternar para nomes legados se a imagem atual estiver ausente.

### 7b) Dependências de runtime de plugins incluídos

O doctor verifica dependências de runtime apenas para plugins incluídos que estão ativos na
configuração atual ou ativados pelo padrão do manifesto incluído, por exemplo
`plugins.entries.discord.enabled: true`, legado
`channels.discord.enabled: true`, ou um provedor incluído ativado por padrão. Se alguma
estiver ausente, o doctor informa os pacotes e os instala no modo
`openclaw doctor --fix` / `openclaw doctor --repair`. Plugins externos ainda
usam `openclaw plugins install` / `openclaw plugins update`; o doctor não
instala dependências para caminhos arbitrários de plugin.

### 8) Migrações de serviço do Gateway e dicas de limpeza

O doctor detecta serviços legados do Gateway (launchd/systemd/schtasks) e
oferece removê-los e instalar o serviço OpenClaw usando a porta atual do Gateway.
Ele também pode examinar serviços extras semelhantes ao Gateway e imprimir dicas de limpeza.
Serviços do Gateway OpenClaw nomeados por perfil são considerados de primeira classe e não são
marcados como "extras".

### 8b) Migração Matrix na inicialização

Quando uma conta do canal Matrix tem uma migração legada de estado pendente ou acionável,
o doctor (no modo `--fix` / `--repair`) cria um snapshot pré-migração e depois
executa as etapas de migração best-effort: migração legada de estado Matrix e preparação
legada de estado criptografado. Ambas as etapas não são fatais; erros são registrados e a
inicialização continua. No modo somente leitura (`openclaw doctor` sem `--fix`) esta verificação
é totalmente ignorada.

### 8c) Pareamento de dispositivos e divergência de autenticação

O doctor agora inspeciona o estado de pareamento de dispositivos como parte da passagem normal de integridade.

O que ele informa:

- solicitações pendentes de primeiro pareamento
- upgrades de função pendentes para dispositivos já pareados
- upgrades de escopo pendentes para dispositivos já pareados
- reparos de divergência de chave pública em que o id do dispositivo ainda corresponde, mas a
  identidade do dispositivo não corresponde mais ao registro aprovado
- registros pareados sem um token ativo para uma função aprovada
- tokens pareados cujos escopos divergem da linha de base aprovada do pareamento
- entradas locais em cache de token do dispositivo para a máquina atual que antecedem uma
  rotação de token no lado do Gateway ou carregam metadados de escopo obsoletos

O doctor não aprova automaticamente solicitações de pareamento nem gira tokens de dispositivo automaticamente. Em vez disso,
ele imprime as etapas exatas seguintes:

- inspecionar solicitações pendentes com `openclaw devices list`
- aprovar a solicitação exata com `openclaw devices approve <requestId>`
- girar um token novo com `openclaw devices rotate --device <deviceId> --role <role>`
- remover e aprovar novamente um registro obsoleto com `openclaw devices remove <deviceId>`

Isso fecha a brecha comum de "já pareado mas ainda recebendo pairing required":
o doctor agora distingue primeiro pareamento de upgrades pendentes de função/escopo
e de divergência obsoleta de token/identidade do dispositivo.

### 9) Avisos de segurança

O doctor emite avisos quando um provedor está aberto para DMs sem uma lista de permissões, ou
quando uma política está configurada de forma perigosa.

### 10) linger do systemd (Linux)

Se estiver em execução como um serviço de usuário do systemd, o doctor garante que o linger esteja ativado para que o
Gateway continue ativo após logout.

### 11) Status do workspace (Skills, plugins e diretórios legados)

O doctor imprime um resumo do estado do workspace para o agente padrão:

- **Status de Skills**: conta Skills elegíveis, com requisitos ausentes e bloqueadas por lista de permissões.
- **Diretórios legados do workspace**: avisa quando `~/openclaw` ou outros diretórios legados do workspace
  existem ao lado do workspace atual.
- **Status de plugins**: conta plugins carregados/desativados/com erro; lista IDs de plugin para quaisquer
  erros; informa capacidades de plugins incluídos.
- **Avisos de compatibilidade de plugins**: sinaliza plugins que têm problemas de compatibilidade com
  o runtime atual.
- **Diagnósticos de plugins**: expõe quaisquer avisos ou erros em tempo de carregamento emitidos pelo
  registro de plugins.

### 11b) Tamanho do arquivo de bootstrap

O doctor verifica se arquivos de bootstrap do workspace (por exemplo `AGENTS.md`,
`CLAUDE.md` ou outros arquivos de contexto injetados) estão próximos ou acima do orçamento
de caracteres configurado. Ele informa, por arquivo, contagens brutas vs. injetadas de caracteres, percentual
de truncamento, causa do truncamento (`max/file` ou `max/total`) e total de caracteres injetados
como fração do orçamento total. Quando os arquivos estão truncados ou próximos do
limite, o doctor imprime dicas para ajustar `agents.defaults.bootstrapMaxChars`
e `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Shell completion

O doctor verifica se o preenchimento por tabulação está instalado para o shell atual
(zsh, bash, fish ou PowerShell):

- Se o perfil do shell usar um padrão lento de conclusão dinâmica
  (`source <(openclaw completion ...)`), o doctor o atualiza para a variante mais rápida
  com arquivo em cache.
- Se a conclusão estiver configurada no perfil, mas o arquivo de cache estiver ausente,
  o doctor regenera o cache automaticamente.
- Se nenhuma conclusão estiver configurada, o doctor solicita para instalá-la
  (apenas no modo interativo; ignorado com `--non-interactive`).

Execute `openclaw completion --write-state` para regenerar o cache manualmente.

### 12) Verificações de autenticação do Gateway (token local)

O doctor verifica a prontidão da autenticação por token local do Gateway.

- Se o modo de token precisar de um token e não existir fonte de token, o doctor oferece gerar um.
- Se `gateway.auth.token` for gerenciado por SecretRef, mas estiver indisponível, o doctor avisa e não o sobrescreve com texto simples.
- `openclaw doctor --generate-gateway-token` força a geração apenas quando nenhum SecretRef de token está configurado.

### 12b) Reparos somente leitura com reconhecimento de SecretRef

Alguns fluxos de reparo precisam inspecionar credenciais configuradas sem enfraquecer o comportamento de falha rápida do runtime.

- `openclaw doctor --fix` agora usa o mesmo modelo de resumo somente leitura com reconhecimento de SecretRef dos comandos da família status para reparos direcionados de configuração.
- Exemplo: o reparo de `@username` em `allowFrom` / `groupAllowFrom` do Telegram tenta usar credenciais de bot configuradas quando disponíveis.
- Se o token do bot do Telegram estiver configurado via SecretRef, mas indisponível no caminho atual do comando, o doctor informa que a credencial está configurada, mas indisponível, e ignora a resolução automática em vez de falhar ou informar incorretamente que o token está ausente.

### 13) Verificação de integridade do Gateway + reinício

O doctor executa uma verificação de integridade e oferece reiniciar o Gateway quando ele parece
não íntegro.

### 13b) Prontidão da busca de memória

O doctor verifica se o provedor de embeddings configurado para a busca de memória está pronto
para o agente padrão. O comportamento depende do backend e do provedor configurados:

- **Backend QMD**: verifica se o binário `qmd` está disponível e pode ser iniciado.
  Caso contrário, imprime orientações de correção, incluindo o pacote npm e uma opção manual de caminho do binário.
- **Provedor local explícito**: verifica a existência de um arquivo de modelo local ou de uma URL de modelo remoto/baixável reconhecida. Se estiver ausente, sugere trocar para um provedor remoto.
- **Provedor remoto explícito** (`openai`, `voyage` etc.): verifica se uma chave de API está
  presente no ambiente ou no armazenamento de autenticação. Imprime dicas acionáveis de correção se estiver ausente.
- **Provedor automático**: verifica primeiro a disponibilidade do modelo local, depois tenta cada provedor remoto na ordem de seleção automática.

Quando um resultado de sonda do Gateway está disponível (o Gateway estava íntegro no momento da
verificação), o doctor cruza esse resultado com a configuração visível pela CLI e observa
qualquer divergência.

Use `openclaw memory status --deep` para verificar a prontidão dos embeddings em runtime.

### 14) Avisos de status do canal

Se o Gateway estiver íntegro, o doctor executa uma sonda de status do canal e informa
avisos com correções sugeridas.

### 15) Auditoria + reparo da configuração do supervisor

O doctor verifica a configuração instalada do supervisor (launchd/systemd/schtasks) em busca de
padrões ausentes ou desatualizados (por exemplo, dependências `network-online` do systemd e
atraso de reinício). Quando encontra uma divergência, ele recomenda uma atualização e pode
reescrever o arquivo de serviço/tarefa para os padrões atuais.

Observações:

- `openclaw doctor` solicita confirmação antes de reescrever a configuração do supervisor.
- `openclaw doctor --yes` aceita os prompts de reparo padrão.
- `openclaw doctor --repair` aplica correções recomendadas sem prompts.
- `openclaw doctor --repair --force` sobrescreve configurações personalizadas do supervisor.
- Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação/reparo do serviço pelo doctor valida o SecretRef, mas não persiste valores resolvidos de token em texto simples nos metadados de ambiente do serviço supervisor.
- Se a autenticação por token exigir um token e o token SecretRef configurado não estiver resolvido, o doctor bloqueia o caminho de instalação/reparo com orientações acionáveis.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem ambos configurados e `gateway.auth.mode` não estiver definido, o doctor bloqueia a instalação/reparo até que o modo seja definido explicitamente.
- Para unidades user-systemd no Linux, as verificações de divergência de token do doctor agora incluem fontes `Environment=` e `EnvironmentFile=` ao comparar metadados de autenticação do serviço.
- Você sempre pode forçar uma reescrita completa via `openclaw gateway install --force`.

### 16) Runtime do Gateway + diagnósticos de porta

O doctor inspeciona o runtime do serviço (PID, último status de saída) e avisa quando o
serviço está instalado, mas não está realmente em execução. Ele também verifica colisões de porta
na porta do Gateway (padrão `18789`) e informa causas prováveis (Gateway já em execução,
túnel SSH).

### 17) Melhores práticas do runtime do Gateway

O doctor avisa quando o serviço do Gateway é executado em Bun ou em um caminho de Node gerenciado por versão
(`nvm`, `fnm`, `volta`, `asdf` etc.). Os canais WhatsApp + Telegram exigem Node,
e caminhos de gerenciadores de versão podem quebrar após upgrades porque o serviço não
carrega a inicialização do seu shell. O doctor oferece migrar para uma instalação de Node do sistema quando
disponível (Homebrew/apt/choco).

### 18) Gravação da configuração + metadados do assistente

O doctor persiste quaisquer alterações de configuração e registra metadados do assistente para registrar a
execução do doctor.

### 19) Dicas de workspace (backup + sistema de memória)

O doctor sugere um sistema de memória do workspace quando ele está ausente e imprime uma dica de backup
se o workspace ainda não estiver sob git.

Consulte [/concepts/agent-workspace](/pt-BR/concepts/agent-workspace) para um guia completo da
estrutura do workspace e backup com git (recomendado GitHub ou GitLab privado).
