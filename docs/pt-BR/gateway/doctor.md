---
read_when:
    - Adicionar ou modificar migrações do doctor
    - Introduzir mudanças incompatíveis de configuração
summary: 'Comando Doctor: verificações de integridade, migrações de configuração e etapas de reparo'
title: Doctor
x-i18n:
    generated_at: "2026-04-09T01:29:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75d321bd1ad0e16c29f2382e249c51edfc3a8d33b55bdceea39e7dbcd4901fce
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` é a ferramenta de reparo + migração do OpenClaw. Ela corrige
configurações/estado desatualizados, verifica a integridade e fornece etapas de reparo acionáveis.

## Início rápido

```bash
openclaw doctor
```

### Headless / automação

```bash
openclaw doctor --yes
```

Aceita os padrões sem solicitar confirmação (incluindo etapas de reparo de restart/serviço/sandbox quando aplicável).

```bash
openclaw doctor --repair
```

Aplica os reparos recomendados sem solicitar confirmação (reparos + restarts quando for seguro).

```bash
openclaw doctor --repair --force
```

Aplica também reparos agressivos (sobrescreve configurações personalizadas do supervisor).

```bash
openclaw doctor --non-interactive
```

Executa sem prompts e aplica apenas migrações seguras (normalização de configuração + movimentações de estado no disco). Ignora ações de restart/serviço/sandbox que exigem confirmação humana.
As migrações de estado legadas são executadas automaticamente quando detectadas.

```bash
openclaw doctor --deep
```

Examina serviços do sistema em busca de instalações extras do gateway (launchd/systemd/schtasks).

Se quiser revisar as mudanças antes de gravar, abra primeiro o arquivo de configuração:

```bash
cat ~/.openclaw/openclaw.json
```

## O que ele faz (resumo)

- Atualização opcional prévia para instalações via git (somente interativo).
- Verificação de atualização do protocolo da UI (recompila a Control UI quando o schema do protocolo é mais novo).
- Verificação de integridade + prompt de restart.
- Resumo de status de Skills (elegíveis/ausentes/bloqueadas) e status de plugins.
- Normalização de configuração para valores legados.
- Migração da configuração de Talk dos campos legados simples `talk.*` para `talk.provider` + `talk.providers.<provider>`.
- Verificações de migração do navegador para configurações legadas da extensão do Chrome e prontidão do Chrome MCP.
- Avisos de sobrescrita do provedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Avisos de sombreamento de OAuth do Codex (`models.providers.openai-codex`).
- Verificação de pré-requisitos TLS do OAuth para perfis de OAuth do OpenAI Codex.
- Migração de estado legado no disco (sessions/agent dir/autenticação do WhatsApp).
- Migração de chaves legadas de contrato de manifesto de plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migração do armazenamento cron legado (`jobId`, `schedule.cron`, campos de delivery/payload no nível superior, `provider` em payload, jobs simples de fallback de webhook `notify: true`).
- Inspeção de arquivos de lock de sessão e limpeza de locks obsoletos.
- Verificações de integridade e permissões do estado (sessions, transcripts, diretório de estado).
- Verificações de permissão do arquivo de configuração (chmod 600) ao executar localmente.
- Integridade da autenticação de modelos: verifica expiração de OAuth, pode renovar tokens prestes a expirar e informa estados de cooldown/desativação do perfil de autenticação.
- Detecção de diretório de workspace extra (`~/openclaw`).
- Reparo de imagem de sandbox quando o sandboxing está habilitado.
- Migração de serviço legado e detecção de gateways extras.
- Migração de estado legado do canal Matrix (no modo `--fix` / `--repair`).
- Verificações de runtime do gateway (serviço instalado, mas não em execução; label de launchd em cache).
- Avisos de status de canal (sondados a partir do gateway em execução).
- Auditoria de configuração do supervisor (launchd/systemd/schtasks) com reparo opcional.
- Verificações de melhores práticas de runtime do gateway (Node vs Bun, caminhos de gerenciadores de versão).
- Diagnósticos de conflito de porta do gateway (padrão `18789`).
- Avisos de segurança para políticas de DM abertas.
- Verificações de autenticação do gateway para modo de token local (oferece geração de token quando não existe fonte de token; não sobrescreve configurações SecretRef de token).
- Verificação de linger do systemd no Linux.
- Verificação do tamanho do arquivo de bootstrap do workspace (avisos de truncamento/próximo do limite para arquivos de contexto).
- Verificação de status do shell completion e instalação/atualização automática.
- Verificação de prontidão do provedor de embeddings para pesquisa de memória (modelo local, chave de API remota ou binário QMD).
- Verificações de instalação a partir do código-fonte (incompatibilidade de workspace do pnpm, recursos de UI ausentes, binário tsx ausente).
- Grava a configuração atualizada + metadados do wizard.

## Backfill e redefinição na interface Dreams

A cena Dreams da Control UI inclui ações de **Backfill**, **Reset** e **Clear Grounded**
para o fluxo de dreaming fundamentado. Essas ações usam métodos RPC
no estilo doctor do gateway, mas **não** fazem parte do reparo/migração
da CLI `openclaw doctor`.

O que elas fazem:

- **Backfill** examina arquivos históricos `memory/YYYY-MM-DD.md` no
  workspace ativo, executa a passagem fundamentada do diário REM e grava entradas
  reversíveis de backfill em `DREAMS.md`.
- **Reset** remove apenas essas entradas de diário marcadas como backfill de `DREAMS.md`.
- **Clear Grounded** remove apenas entradas de curto prazo exclusivamente fundamentadas
  que vieram de replay histórico e ainda não acumularam suporte
  de recall ao vivo ou diário.

O que elas **não** fazem sozinhas:

- não editam `MEMORY.md`
- não executam migrações completas do doctor
- não preparam automaticamente candidatos fundamentados no armazenamento ativo
  de promoção de curto prazo, a menos que você execute explicitamente primeiro o caminho da CLI com preparação

Se você quiser que o replay histórico fundamentado influencie o fluxo normal de promoção profunda,
use o fluxo da CLI em vez disso:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Isso prepara candidatos duráveis fundamentados no armazenamento de dreaming de curto prazo enquanto
mantém `DREAMS.md` como a superfície de revisão.

## Comportamento detalhado e justificativa

### 0) Atualização opcional (instalações via git)

Se isto for um checkout do git e o doctor estiver sendo executado de forma interativa, ele oferece
atualizar (fetch/rebase/build) antes de executar o doctor.

### 1) Normalização de configuração

Se a configuração contiver formatos de valores legados (por exemplo `messages.ackReaction`
sem uma sobrescrita específica por canal), o doctor os normaliza para o
schema atual.

Isso inclui campos legados simples do Talk. A configuração pública atual do Talk é
`talk.provider` + `talk.providers.<provider>`. O doctor reescreve formatos antigos
de `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` no mapa do provedor.

### 2) Migrações de chaves legadas de configuração

Quando a configuração contém chaves obsoletas, outros comandos se recusam a executar e pedem
que você execute `openclaw doctor`.

O doctor irá:

- Explicar quais chaves legadas foram encontradas.
- Mostrar a migração que ele aplicou.
- Reescrever `~/.openclaw/openclaw.json` com o schema atualizado.

O Gateway também executa automaticamente as migrações do doctor na inicialização quando detecta
um formato de configuração legado, de modo que configurações desatualizadas sejam reparadas sem intervenção manual.
As migrações do armazenamento de jobs cron são tratadas por `openclaw doctor --fix`.

Migrações atuais:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` no nível superior
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
- Para canais com `accounts` nomeadas, mas com valores no nível superior de canal ainda remanescentes para conta única, mover esses valores com escopo de conta para a conta promovida escolhida para esse canal (`accounts.default` para a maioria dos canais; Matrix pode preservar um destino nomeado/padrão correspondente já existente)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- remover `browser.relayBindHost` (configuração legada de relay da extensão)

Os avisos do doctor também incluem orientações de conta padrão para canais com múltiplas contas:

- Se duas ou mais entradas `channels.<channel>.accounts` estiverem configuradas sem `channels.<channel>.defaultAccount` ou `accounts.default`, o doctor avisa que o roteamento de fallback pode escolher uma conta inesperada.
- Se `channels.<channel>.defaultAccount` estiver definido com um ID de conta desconhecido, o doctor avisa e lista os IDs de conta configurados.

### 2b) Sobrescritas do provedor OpenCode

Se você adicionou manualmente `models.providers.opencode`, `opencode-zen` ou `opencode-go`,
isso sobrescreve o catálogo OpenCode integrado de `@mariozechner/pi-ai`.
Isso pode forçar modelos para a API errada ou zerar custos. O doctor avisa para que você
possa remover a sobrescrita e restaurar o roteamento por API + custos por modelo.

### 2c) Migração do navegador e prontidão do Chrome MCP

Se a configuração do seu navegador ainda aponta para o caminho removido da extensão do Chrome, o doctor
a normaliza para o modelo atual de conexão local ao host do Chrome MCP:

- `browser.profiles.*.driver: "extension"` passa a ser `"existing-session"`
- `browser.relayBindHost` é removido

O doctor também audita o caminho local ao host do Chrome MCP quando você usa `defaultProfile:
"user"` ou um perfil `existing-session` configurado:

- verifica se o Google Chrome está instalado no mesmo host para perfis
  de conexão automática padrão
- verifica a versão detectada do Chrome e avisa quando ela é inferior ao Chrome 144
- lembra você de habilitar a depuração remota na página de inspeção do navegador (por
  exemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  ou `edge://inspect/#remote-debugging`)

O doctor não pode habilitar a configuração do lado do Chrome para você. O Chrome MCP local ao host
ainda exige:

- um navegador baseado em Chromium 144+ no host do gateway/node
- o navegador em execução localmente
- depuração remota habilitada nesse navegador
- aprovação do primeiro prompt de consentimento de conexão no navegador

A prontidão aqui trata apenas dos pré-requisitos de conexão local. Existing-session mantém
os limites atuais de rota do Chrome MCP; rotas avançadas como `responsebody`, exportação de PDF,
interceptação de download e ações em lote ainda exigem um
navegador gerenciado ou perfil CDP bruto.

Esta verificação **não** se aplica a fluxos Docker, sandbox, remote-browser ou outros
fluxos headless. Eles continuam a usar CDP bruto.

### 2d) Pré-requisitos TLS do OAuth

Quando um perfil de OAuth do OpenAI Codex está configurado, o doctor sonda o endpoint de
autorização da OpenAI para verificar se a pilha TLS local do Node/OpenSSL consegue
validar a cadeia de certificados. Se a sonda falhar com um erro de certificado (por
exemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado expirado ou certificado autoassinado),
o doctor imprime orientações de correção específicas da plataforma. No macOS com Node do Homebrew, a
correção costuma ser `brew postinstall ca-certificates`. Com `--deep`, a sonda é executada
mesmo se o gateway estiver íntegro.

### 2c) Sobrescritas do provedor OAuth do Codex

Se você adicionou anteriormente configurações legadas de transporte da OpenAI em
`models.providers.openai-codex`, elas podem sombrear o caminho integrado do provedor
de OAuth do Codex que versões mais novas usam automaticamente. O doctor avisa quando vê
essas configurações antigas de transporte junto com OAuth do Codex para que você possa remover ou reescrever
a sobrescrita de transporte desatualizada e recuperar o comportamento integrado de roteamento/fallback.
Proxies personalizados e sobrescritas apenas de cabeçalho continuam sendo compatíveis e não
disparam este aviso.

### 3) Migrações de estado legado (layout em disco)

O doctor pode migrar layouts antigos em disco para a estrutura atual:

- Armazenamento de sessions + transcripts:
  - de `~/.openclaw/sessions/` para `~/.openclaw/agents/<agentId>/sessions/`
- Diretório do agent:
  - de `~/.openclaw/agent/` para `~/.openclaw/agents/<agentId>/agent/`
- Estado de autenticação do WhatsApp (Baileys):
  - de `~/.openclaw/credentials/*.json` legados (exceto `oauth.json`)
  - para `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de conta padrão: `default`)

Essas migrações são best-effort e idempotentes; o doctor emitirá avisos quando
deixar qualquer pasta legada para trás como backup. O Gateway/CLI também migra automaticamente
as sessions legadas + diretório do agent na inicialização para que histórico/autenticação/modelos fiquem no
caminho por agent sem necessidade de executar o doctor manualmente. A autenticação do WhatsApp é intencionalmente
migrada apenas via `openclaw doctor`. A normalização de Talk provider/provider-map agora
compara por igualdade estrutural, então diferenças apenas na ordem das chaves não disparam mais
mudanças repetidas sem efeito em `doctor --fix`.

### 3a) Migrações legadas de manifesto de plugin

O doctor examina todos os manifestos de plugin instalados em busca de chaves obsoletas
de capacidade no nível superior (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Quando encontradas, ele oferece movê-las para o objeto `contracts`
e reescrever o arquivo de manifesto no local. Essa migração é idempotente;
se a chave `contracts` já tiver os mesmos valores, a chave legada será removida
sem duplicar os dados.

### 3b) Migrações legadas do armazenamento cron

O doctor também verifica o armazenamento de jobs cron (`~/.openclaw/cron/jobs.json` por padrão,
ou `cron.store` quando sobrescrito) em busca de formatos antigos de job que o agendador ainda
aceita por compatibilidade.

As limpezas cron atuais incluem:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- campos de payload no nível superior (`message`, `model`, `thinking`, ...) → `payload`
- campos de delivery no nível superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- aliases de delivery `provider` em payload → `delivery.channel` explícito
- jobs simples legados de fallback de webhook com `notify: true` → `delivery.mode="webhook"` explícito com `delivery.to=cron.webhook`

O doctor só migra automaticamente jobs `notify: true` quando consegue fazer isso sem
alterar o comportamento. Se um job combinar fallback legado de notify com um modo de
delivery não webhook já existente, o doctor avisa e deixa esse job para revisão manual.

### 3c) Limpeza de lock de sessão

O doctor examina o diretório de sessão de cada agent em busca de arquivos obsoletos de write-lock —
arquivos deixados para trás quando uma sessão foi encerrada de forma anormal. Para cada arquivo de lock encontrado, ele informa:
o caminho, PID, se o PID ainda está ativo, idade do lock e se ele é
considerado obsoleto (PID morto ou mais de 30 minutos). No modo `--fix` / `--repair`,
ele remove automaticamente arquivos de lock obsoletos; caso contrário, imprime uma observação e
instrui você a executar novamente com `--fix`.

### 4) Verificações de integridade do estado (persistência de sessão, roteamento e segurança)

O diretório de estado é o tronco cerebral operacional. Se ele desaparecer, você perde
sessions, credenciais, logs e configuração (a menos que tenha backups em outro lugar).

O doctor verifica:

- **Diretório de estado ausente**: avisa sobre perda catastrófica de estado, solicita recriar
  o diretório e lembra que não consegue recuperar dados ausentes.
- **Permissões do diretório de estado**: verifica se há permissão de escrita; oferece reparar permissões
  (e emite uma dica de `chown` quando detecta divergência de proprietário/grupo).
- **Diretório de estado sincronizado por nuvem no macOS**: avisa quando o estado é resolvido em iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou
  `~/Library/CloudStorage/...` porque caminhos com sincronização podem causar I/O mais lento
  e condições de corrida de lock/sincronização.
- **Diretório de estado em SD ou eMMC no Linux**: avisa quando o estado é resolvido para uma origem
  de montagem `mmcblk*`, porque I/O aleatório em SD ou eMMC pode ser mais lento e desgastar
  mais rapidamente com gravações de session e credenciais.
- **Diretórios de sessão ausentes**: `sessions/` e o diretório do armazenamento de sessão são
  necessários para persistir o histórico e evitar falhas `ENOENT`.
- **Divergência de transcript**: avisa quando entradas recentes de sessão têm
  arquivos de transcript ausentes.
- **Sessão principal “JSONL de 1 linha”**: sinaliza quando o transcript principal tem apenas uma
  linha (o histórico não está se acumulando).
- **Múltiplos diretórios de estado**: avisa quando existem várias pastas `~/.openclaw` entre
  diretórios home ou quando `OPENCLAW_STATE_DIR` aponta para outro lugar (o histórico pode
  se dividir entre instalações).
- **Lembrete de modo remoto**: se `gateway.mode=remote`, o doctor lembra você de executá-lo
  no host remoto (o estado fica lá).
- **Permissões do arquivo de configuração**: avisa se `~/.openclaw/openclaw.json` estiver
  legível por grupo/mundo e oferece restringir para `600`.

### 5) Integridade da autenticação de modelos (expiração de OAuth)

O doctor inspeciona perfis de OAuth no armazenamento de autenticação, avisa quando os tokens estão
expirando/expirados e pode renová-los quando for seguro. Se o perfil de
OAuth/token do Anthropic estiver desatualizado, ele sugere uma chave de API do Anthropic ou o
caminho de setup-token do Anthropic.
Prompts de renovação só aparecem em execução interativa (TTY); `--non-interactive`
ignora tentativas de renovação.

Quando uma renovação de OAuth falha permanentemente (por exemplo `refresh_token_reused`,
`invalid_grant` ou um provedor informando que você precisa entrar novamente), o doctor informa
que uma nova autenticação é necessária e imprime o comando exato `openclaw models auth login --provider ...`
a ser executado.

O doctor também informa perfis de autenticação temporariamente inutilizáveis devido a:

- cooldowns curtos (rate limits/timeouts/falhas de autenticação)
- desativações mais longas (falhas de faturamento/crédito)

### 6) Validação do modelo de hooks

Se `hooks.gmail.model` estiver definido, o doctor valida a referência do modelo em relação ao
catálogo e à allowlist e avisa quando ela não for resolvida ou não for permitida.

### 7) Reparo de imagem de sandbox

Quando o sandboxing está habilitado, o doctor verifica imagens Docker e oferece construir ou
alternar para nomes legados se a imagem atual estiver ausente.

### 7b) Dependências de runtime de plugins empacotados

O doctor verifica se as dependências de runtime de plugins empacotados (por exemplo os
pacotes de runtime do plugin do Discord) estão presentes na raiz de instalação do OpenClaw.
Se alguma estiver ausente, o doctor informa os pacotes e os instala no
modo `openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Migrações de serviço do gateway e dicas de limpeza

O doctor detecta serviços legados do gateway (launchd/systemd/schtasks) e
oferece removê-los e instalar o serviço do OpenClaw usando a porta atual do gateway.
Ele também pode examinar serviços extras parecidos com gateway e imprimir dicas de limpeza.
Serviços de gateway do OpenClaw nomeados por perfil são considerados de primeira classe e não são
sinalizados como "extras".

### 8b) Migração de Matrix na inicialização

Quando uma conta do canal Matrix tem uma migração de estado legado pendente ou acionável,
o doctor (no modo `--fix` / `--repair`) cria um snapshot pré-migração e então
executa as etapas de migração em modo best-effort: migração de estado legado do Matrix e preparação
legada de estado criptografado. Ambas as etapas não são fatais; erros são registrados e a
inicialização continua. No modo somente leitura (`openclaw doctor` sem `--fix`), esta verificação
é totalmente ignorada.

### 9) Avisos de segurança

O doctor emite avisos quando um provedor está aberto a DMs sem uma allowlist, ou
quando uma política está configurada de forma perigosa.

### 10) systemd linger (Linux)

Se estiver em execução como um serviço de usuário do systemd, o doctor garante que o linger esteja habilitado para que o
gateway permaneça ativo após logout.

### 11) Status do workspace (Skills, plugins e diretórios legados)

O doctor imprime um resumo do estado do workspace para o agent padrão:

- **Status de Skills**: conta Skills elegíveis, com requisitos ausentes e bloqueadas por allowlist.
- **Diretórios legados de workspace**: avisa quando `~/openclaw` ou outros diretórios legados de workspace
  existem ao lado do workspace atual.
- **Status de plugins**: conta plugins carregados/desativados/com erro; lista IDs de plugin para quaisquer
  erros; informa capacidades do plugin bundle.
- **Avisos de compatibilidade de plugins**: sinaliza plugins que têm problemas de compatibilidade com
  o runtime atual.
- **Diagnósticos de plugin**: exibe quaisquer avisos ou erros de carregamento emitidos pelo
  registro de plugins.

### 11b) Tamanho do arquivo de bootstrap

O doctor verifica se os arquivos de bootstrap do workspace (por exemplo `AGENTS.md`,
`CLAUDE.md` ou outros arquivos de contexto injetados) estão próximos ou acima do orçamento
de caracteres configurado. Ele informa por arquivo a contagem bruta vs. caracteres injetados, porcentagem
de truncamento, causa do truncamento (`max/file` ou `max/total`) e total de caracteres
injetados como fração do orçamento total. Quando os arquivos são truncados ou estão próximos
do limite, o doctor imprime dicas para ajustar `agents.defaults.bootstrapMaxChars`
e `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Shell completion

O doctor verifica se o tab completion está instalado para o shell atual
(zsh, bash, fish ou PowerShell):

- Se o perfil do shell usa um padrão lento de completion dinâmico
  (`source <(openclaw completion ...)`), o doctor o atualiza para a variante mais rápida
  de arquivo em cache.
- Se o completion está configurado no perfil, mas o arquivo de cache está ausente,
  o doctor regenera o cache automaticamente.
- Se nenhum completion estiver configurado, o doctor solicita instalá-lo
  (somente modo interativo; ignorado com `--non-interactive`).

Execute `openclaw completion --write-state` para regenerar o cache manualmente.

### 12) Verificações de autenticação do gateway (token local)

O doctor verifica a prontidão da autenticação por token do gateway local.

- Se o modo de token precisar de um token e nenhuma fonte de token existir, o doctor oferece gerar um.
- Se `gateway.auth.token` for gerenciado por SecretRef, mas estiver indisponível, o doctor avisa e não o sobrescreve com texto simples.
- `openclaw doctor --generate-gateway-token` força a geração somente quando nenhum SecretRef de token estiver configurado.

### 12b) Reparos somente leitura compatíveis com SecretRef

Alguns fluxos de reparo precisam inspecionar credenciais configuradas sem enfraquecer o comportamento fail-fast do runtime.

- `openclaw doctor --fix` agora usa o mesmo modelo resumido de SecretRef somente leitura que os comandos da família status para reparos de configuração direcionados.
- Exemplo: o reparo de `allowFrom` / `groupAllowFrom` `@username` do Telegram tenta usar credenciais configuradas do bot quando disponíveis.
- Se o token do bot do Telegram estiver configurado via SecretRef, mas indisponível no caminho de comando atual, o doctor informa que a credencial está configurada, mas indisponível, e ignora a resolução automática em vez de falhar ou informar incorretamente que o token está ausente.

### 13) Verificação de integridade do gateway + restart

O doctor executa uma verificação de integridade e oferece reiniciar o gateway quando ele parece
não estar íntegro.

### 13b) Prontidão da pesquisa de memória

O doctor verifica se o provedor configurado de embeddings para pesquisa de memória está pronto
para o agent padrão. O comportamento depende do backend e do provedor configurados:

- **Backend QMD**: sonda se o binário `qmd` está disponível e pode ser iniciado.
  Caso contrário, imprime orientações de correção, incluindo o pacote npm e uma opção manual de caminho do binário.
- **Provedor local explícito**: verifica a presença de um arquivo de modelo local ou de uma URL de modelo remota/baixável reconhecida. Se estiver ausente, sugere mudar para um provedor remoto.
- **Provedor remoto explícito** (`openai`, `voyage`, etc.): verifica se uma chave de API está
  presente no ambiente ou no armazenamento de autenticação. Imprime dicas acionáveis de correção se estiver ausente.
- **Provedor automático**: verifica primeiro a disponibilidade do modelo local e depois tenta cada
  provedor remoto na ordem de seleção automática.

Quando um resultado de sonda do gateway está disponível (o gateway estava íntegro no momento da
verificação), o doctor o cruza com a configuração visível pela CLI e aponta
qualquer divergência.

Use `openclaw memory status --deep` para verificar a prontidão de embeddings em runtime.

### 14) Avisos de status de canal

Se o gateway estiver íntegro, o doctor executa uma sonda de status de canal e informa
avisos com correções sugeridas.

### 15) Auditoria + reparo de configuração do supervisor

O doctor verifica a configuração instalada do supervisor (launchd/systemd/schtasks) em busca de
padrões ausentes ou desatualizados (por exemplo dependências `network-online` do systemd e
atraso de restart). Quando encontra uma divergência, ele recomenda uma atualização e pode
reescrever o arquivo do serviço/tarefa com os padrões atuais.

Observações:

- `openclaw doctor` pede confirmação antes de reescrever a configuração do supervisor.
- `openclaw doctor --yes` aceita os prompts de reparo padrão.
- `openclaw doctor --repair` aplica as correções recomendadas sem prompts.
- `openclaw doctor --repair --force` sobrescreve configurações personalizadas do supervisor.
- Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, o doctor na instalação/reparo do serviço valida o SecretRef, mas não persiste valores de token em texto simples resolvidos nos metadados de ambiente do serviço supervisor.
- Se a autenticação por token exigir um token e o SecretRef de token configurado não estiver resolvido, o doctor bloqueia o caminho de instalação/reparo com orientações acionáveis.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem ambos configurados e `gateway.auth.mode` não estiver definido, o doctor bloqueia a instalação/reparo até que o modo seja definido explicitamente.
- Para unidades user-systemd no Linux, as verificações de divergência de token do doctor agora incluem fontes `Environment=` e `EnvironmentFile=` ao comparar metadados de autenticação do serviço.
- Você sempre pode forçar uma regravação completa por meio de `openclaw gateway install --force`.

### 16) Diagnósticos de runtime + porta do gateway

O doctor inspeciona o runtime do serviço (PID, último status de saída) e avisa quando o
serviço está instalado, mas não está realmente em execução. Ele também verifica conflitos de
porta na porta do gateway (padrão `18789`) e informa causas prováveis (gateway já em
execução, túnel SSH).

### 17) Melhores práticas de runtime do gateway

O doctor avisa quando o serviço do gateway é executado com Bun ou em um caminho de Node gerenciado por versão
(`nvm`, `fnm`, `volta`, `asdf`, etc.). Os canais WhatsApp + Telegram exigem Node,
e caminhos de gerenciadores de versão podem quebrar após upgrades porque o serviço não
carrega a inicialização do seu shell. O doctor oferece migrar para uma instalação de Node do sistema quando
disponível (Homebrew/apt/choco).

### 18) Gravação da configuração + metadados do wizard

O doctor persiste quaisquer mudanças de configuração e registra metadados do wizard para registrar a
execução do doctor.

### 19) Dicas de workspace (backup + sistema de memória)

O doctor sugere um sistema de memória do workspace quando ele está ausente e imprime uma dica de backup
se o workspace ainda não estiver sob git.

Consulte [/concepts/agent-workspace](/pt-BR/concepts/agent-workspace) para um guia completo sobre
estrutura do workspace e backup com git (recomendado GitHub ou GitLab privado).
