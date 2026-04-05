---
read_when:
    - Trabalhando em recursos do canal Microsoft Teams
summary: Status de suporte do bot do Microsoft Teams, capacidades e configuração
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-05T12:37:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99fc6e136893ec65dc85d3bc0c0d92134069a2f3b8cb4fcf66c14674399b3eaf
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> "Abandonai toda esperança, vós que entrais aqui."

Atualizado: 2026-01-21

Status: texto + anexos em DMs são compatíveis; envio de arquivos em canais/grupos requer `sharePointSiteId` + permissões do Graph (consulte [Envio de arquivos em chats de grupo](#envio-de-arquivos-em-chats-de-grupo)). Enquetes são enviadas via Adaptive Cards. As ações de mensagem expõem `upload-file` explícito para envios centrados em arquivos.

## Plugin integrado

O Microsoft Teams é distribuído como um plugin integrado nas versões atuais do OpenClaw, portanto nenhuma instalação separada é necessária na compilação empacotada normal.

Se você estiver em uma compilação mais antiga ou em uma instalação personalizada que exclui o Teams integrado, instale-o manualmente:

```bash
openclaw plugins install @openclaw/msteams
```

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Detalhes: [Plugins](/tools/plugin)

## Configuração rápida (iniciante)

1. Certifique-se de que o plugin do Microsoft Teams esteja disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações mais antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Crie um **Azure Bot** (App ID + segredo do cliente + tenant ID).
3. Configure o OpenClaw com essas credenciais.
4. Exponha `/api/messages` (porta 3978 por padrão) por meio de uma URL pública ou túnel.
5. Instale o pacote do app do Teams e inicie o gateway.

Configuração mínima:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Observação: chats de grupo são bloqueados por padrão (`channels.msteams.groupPolicy: "allowlist"`). Para permitir respostas em grupo, defina `channels.msteams.groupAllowFrom` (ou use `groupPolicy: "open"` para permitir qualquer membro, com bloqueio por menção).

## Objetivos

- Conversar com o OpenClaw via DMs, chats de grupo ou canais do Teams.
- Manter o roteamento determinístico: as respostas sempre voltam para o canal em que chegaram.
- Adotar um comportamento seguro por padrão nos canais (menções obrigatórias, salvo configuração em contrário).

## Gravações de configuração

Por padrão, o Microsoft Teams pode gravar atualizações de configuração acionadas por `/config set|unset` (requer `commands.config: true`).

Desative com:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Controle de acesso (DMs + grupos)

**Acesso a DMs**

- Padrão: `channels.msteams.dmPolicy = "pairing"`. Remetentes desconhecidos são ignorados até serem aprovados.
- `channels.msteams.allowFrom` deve usar IDs de objeto AAD estáveis.
- UPNs/nomes de exibição são mutáveis; a correspondência direta é desativada por padrão e só é ativada com `channels.msteams.dangerouslyAllowNameMatching: true`.
- O assistente de configuração pode resolver nomes para IDs via Microsoft Graph quando as credenciais permitem.

**Acesso a grupos**

- Padrão: `channels.msteams.groupPolicy = "allowlist"` (bloqueado a menos que você adicione `groupAllowFrom`). Use `channels.defaults.groupPolicy` para substituir o padrão quando não estiver definido.
- `channels.msteams.groupAllowFrom` controla quais remetentes podem acionar em chats/canais de grupo (usa `channels.msteams.allowFrom` como fallback).
- Defina `groupPolicy: "open"` para permitir qualquer membro (ainda com bloqueio por menção por padrão).
- Para não permitir **nenhum canal**, defina `channels.msteams.groupPolicy: "disabled"`.

Exemplo:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**Teams + lista de permissões de canal**

- Restrinja respostas em grupo/canal listando equipes e canais em `channels.msteams.teams`.
- As chaves devem usar IDs estáveis de equipe e IDs de conversa de canal.
- Quando `groupPolicy="allowlist"` e uma lista de permissões de equipes estiver presente, somente as equipes/canais listados serão aceitos (com bloqueio por menção).
- O assistente de configuração aceita entradas `Equipe/Canal` e as armazena para você.
- Na inicialização, o OpenClaw resolve nomes de equipe/canal e de usuários em listas de permissões para IDs (quando as permissões do Graph permitem)
  e registra o mapeamento em log; nomes de equipe/canal não resolvidos são mantidos como digitados, mas ignorados para roteamento por padrão, a menos que `channels.msteams.dangerouslyAllowNameMatching: true` esteja ativado.

Exemplo:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

## Como funciona

1. Certifique-se de que o plugin do Microsoft Teams esteja disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações mais antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Crie um **Azure Bot** (App ID + segredo + tenant ID).
3. Crie um **pacote de app do Teams** que faça referência ao bot e inclua as permissões RSC abaixo.
4. Envie/instale o app do Teams em uma equipe (ou no escopo pessoal para DMs).
5. Configure `msteams` em `~/.openclaw/openclaw.json` (ou variáveis de ambiente) e inicie o gateway.
6. O gateway escuta o tráfego de webhook do Bot Framework em `/api/messages` por padrão.

## Configuração do Azure Bot (pré-requisitos)

Antes de configurar o OpenClaw, você precisa criar um recurso Azure Bot.

### Etapa 1: Criar Azure Bot

1. Acesse [Criar Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Preencha a aba **Basics**:

   | Campo              | Valor                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Nome do seu bot, por exemplo, `openclaw-msteams` (deve ser único) |
   | **Subscription**   | Selecione sua assinatura do Azure                        |
   | **Resource group** | Crie um novo ou use um existente                         |
   | **Pricing tier**   | **Free** para desenvolvimento/testes                     |
   | **Type of App**    | **Single Tenant** (recomendado - veja a observação abaixo) |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Aviso de descontinuação:** a criação de novos bots multilocatário foi descontinuada após 2025-07-31. Use **Single Tenant** para novos bots.

3. Clique em **Review + create** → **Create** (aguarde ~1-2 minutos)

### Etapa 2: Obter credenciais

1. Acesse seu recurso Azure Bot → **Configuration**
2. Copie **Microsoft App ID** → este é seu `appId`
3. Clique em **Manage Password** → vá para o App Registration
4. Em **Certificates & secrets** → **New client secret** → copie o **Value** → este é seu `appPassword`
5. Vá em **Overview** → copie **Directory (tenant) ID** → este é seu `tenantId`

### Etapa 3: Configurar o endpoint de mensagens

1. Em Azure Bot → **Configuration**
2. Defina **Messaging endpoint** como a URL do seu webhook:
   - Produção: `https://your-domain.com/api/messages`
   - Desenvolvimento local: use um túnel (consulte [Desenvolvimento local](#desenvolvimento-local-tunelamento) abaixo)

### Etapa 4: Ativar o canal Teams

1. Em Azure Bot → **Channels**
2. Clique em **Microsoft Teams** → Configure → Save
3. Aceite os Termos de Serviço

## Desenvolvimento local (tunelamento)

O Teams não consegue acessar `localhost`. Use um túnel para desenvolvimento local:

**Opção A: ngrok**

```bash
ngrok http 3978
# Copy the https URL, e.g., https://abc123.ngrok.io
# Set messaging endpoint to: https://abc123.ngrok.io/api/messages
```

**Opção B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Use your Tailscale funnel URL as the messaging endpoint
```

## Teams Developer Portal (alternativa)

Em vez de criar manualmente um ZIP de manifesto, você pode usar o [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. Clique em **+ New app**
2. Preencha as informações básicas (nome, descrição, informações do desenvolvedor)
3. Vá em **App features** → **Bot**
4. Selecione **Enter a bot ID manually** e cole o App ID do seu Azure Bot
5. Marque os escopos: **Personal**, **Team**, **Group Chat**
6. Clique em **Distribute** → **Download app package**
7. No Teams: **Apps** → **Manage your apps** → **Upload a custom app** → selecione o ZIP

Isso costuma ser mais fácil do que editar manifestos JSON manualmente.

## Testando o bot

**Opção A: Azure Web Chat (verifique o webhook primeiro)**

1. No Azure Portal → seu recurso Azure Bot → **Test in Web Chat**
2. Envie uma mensagem - você deve ver uma resposta
3. Isso confirma que seu endpoint de webhook funciona antes da configuração do Teams

**Opção B: Teams (após a instalação do app)**

1. Instale o app do Teams (sideload ou catálogo da organização)
2. Encontre o bot no Teams e envie uma DM
3. Verifique os logs do gateway para atividade recebida

## Configuração (somente texto mínimo)

1. **Certifique-se de que o plugin do Microsoft Teams esteja disponível**
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações mais antigas/personalizadas podem adicioná-lo manualmente:
     - Do npm: `openclaw plugins install @openclaw/msteams`
     - De um checkout local: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **Registro do bot**
   - Crie um Azure Bot (veja acima) e anote:
     - App ID
     - Segredo do cliente (senha do app)
     - Tenant ID (single-tenant)

3. **Manifesto do app do Teams**
   - Inclua uma entrada `bot` com `botId = <App ID>`.
   - Escopos: `personal`, `team`, `groupChat`.
   - `supportsFiles: true` (obrigatório para manipulação de arquivos no escopo pessoal).
   - Adicione permissões RSC (abaixo).
   - Crie ícones: `outline.png` (32x32) e `color.png` (192x192).
   - Compacte os três arquivos juntos: `manifest.json`, `outline.png`, `color.png`.

4. **Configure o OpenClaw**

   ```json5
   {
     channels: {
       msteams: {
         enabled: true,
         appId: "<APP_ID>",
         appPassword: "<APP_PASSWORD>",
         tenantId: "<TENANT_ID>",
         webhook: { port: 3978, path: "/api/messages" },
       },
     },
   }
   ```

   Você também pode usar variáveis de ambiente em vez de chaves de configuração:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`

5. **Endpoint do bot**
   - Defina o Azure Bot Messaging Endpoint como:
     - `https://<host>:3978/api/messages` (ou o caminho/porta escolhidos).

6. **Execute o gateway**
   - O canal Teams é iniciado automaticamente quando o plugin integrado ou instalado manualmente está disponível e a configuração `msteams` existe com credenciais.

## Ação de informações do membro

O OpenClaw expõe uma ação `member-info` com suporte do Graph para o Microsoft Teams, para que agentes e automações possam resolver detalhes de membros do canal (nome de exibição, email, função) diretamente do Microsoft Graph.

Requisitos:

- Permissão RSC `Member.Read.Group` (já presente no manifesto recomendado)
- Para buscas entre equipes: permissão de Aplicativo Graph `User.Read.All` com consentimento de administrador

A ação é controlada por `channels.msteams.actions.memberInfo` (padrão: ativada quando há credenciais do Graph disponíveis).

## Contexto do histórico

- `channels.msteams.historyLimit` controla quantas mensagens recentes do canal/grupo são incluídas no prompt.
- Usa `messages.groupChat.historyLimit` como fallback. Defina `0` para desativar (padrão 50).
- O histórico da thread obtido é filtrado pelas listas de permissões do remetente (`allowFrom` / `groupAllowFrom`), então a semeadura de contexto da thread inclui apenas mensagens de remetentes permitidos.
- O contexto de anexo citado (`ReplyTo*` derivado do HTML de resposta do Teams) atualmente é transmitido como recebido.
- Em outras palavras, as listas de permissões controlam quem pode acionar o agente; apenas caminhos específicos de contexto suplementar são filtrados atualmente.
- O histórico de DM pode ser limitado com `channels.msteams.dmHistoryLimit` (turnos do usuário). Substituições por usuário: `channels.msteams.dms["<user_id>"].historyLimit`.

## Permissões RSC atuais do Teams (manifesto)

Estas são as **permissões resourceSpecific existentes** no manifesto do nosso app do Teams. Elas se aplicam apenas dentro da equipe/chat onde o app está instalado.

**Para canais (escopo de equipe):**

- `ChannelMessage.Read.Group` (Application) - receber todo o conteúdo de texto das mensagens do canal sem @menção
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Para chats de grupo:**

- `ChatMessage.Read.Chat` (Application) - receber todas as mensagens de chat em grupo sem @menção

## Exemplo de manifesto do Teams (com trechos ocultados)

Exemplo mínimo e válido com os campos obrigatórios. Substitua IDs e URLs.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### Observações sobre o manifesto (campos obrigatórios)

- `bots[].botId` **deve** corresponder ao App ID do Azure Bot.
- `webApplicationInfo.id` **deve** corresponder ao App ID do Azure Bot.
- `bots[].scopes` deve incluir as superfícies que você pretende usar (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` é obrigatório para manipulação de arquivos no escopo pessoal.
- `authorization.permissions.resourceSpecific` deve incluir leitura/envio de canal se você quiser tráfego de canal.

### Atualizando um app existente

Para atualizar um app do Teams já instalado (por exemplo, para adicionar permissões RSC):

1. Atualize seu `manifest.json` com as novas configurações
2. **Incremente o campo `version`** (por exemplo, `1.0.0` → `1.1.0`)
3. **Compacte novamente** o manifesto com os ícones (`manifest.json`, `outline.png`, `color.png`)
4. Envie o novo zip:
   - **Opção A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → encontre seu app → Upload new version
   - **Opção B (sideload):** No Teams → Apps → Manage your apps → Upload a custom app
5. **Para canais de equipe:** reinstale o app em cada equipe para que as novas permissões entrem em vigor
6. **Feche totalmente e reabra o Teams** (não apenas feche a janela) para limpar os metadados de app em cache

## Capacidades: somente RSC vs Graph

### Com **somente Teams RSC** (app instalado, sem permissões da API Graph)

Funciona:

- Ler conteúdo de **texto** de mensagens de canal.
- Enviar conteúdo de **texto** de mensagens de canal.
- Receber anexos de arquivos em **escopo pessoal (DM)**.

NÃO funciona:

- **Conteúdo de imagem ou arquivo** de canal/grupo (a carga útil inclui apenas um stub HTML).
- Baixar anexos armazenados no SharePoint/OneDrive.
- Ler histórico de mensagens (além do evento de webhook ao vivo).

### Com **Teams RSC + permissões de Aplicativo do Microsoft Graph**

Adiciona:

- Download de conteúdos hospedados (imagens coladas em mensagens).
- Download de anexos de arquivo armazenados no SharePoint/OneDrive.
- Leitura do histórico de mensagens de canal/chat via Graph.

### RSC vs API Graph

| Capacidade              | Permissões RSC      | API Graph                            |
| ----------------------- | ------------------- | ------------------------------------ |
| **Mensagens em tempo real** | Sim (via webhook) | Não (somente polling)                |
| **Mensagens históricas** | Não                | Sim (pode consultar histórico)       |
| **Complexidade de configuração** | Apenas manifesto do app | Requer consentimento de administrador + fluxo de token |
| **Funciona offline**    | Não (deve estar em execução) | Sim (consulta a qualquer momento) |

**Resumo:** RSC é para escuta em tempo real; a API Graph é para acesso histórico. Para recuperar mensagens perdidas enquanto estiver offline, você precisa da API Graph com `ChannelMessage.Read.All` (requer consentimento de administrador).

## Mídia + histórico habilitados por Graph (obrigatório para canais)

Se você precisa de imagens/arquivos em **canais** ou quer buscar **histórico de mensagens**, deve ativar permissões do Microsoft Graph e conceder consentimento de administrador.

1. No **App Registration** do Entra ID (Azure AD), adicione permissões de **Aplicativo** do Microsoft Graph:
   - `ChannelMessage.Read.All` (anexos de canal + histórico)
   - `Chat.Read.All` ou `ChatMessage.Read.All` (chats de grupo)
2. **Conceda consentimento de administrador** para o tenant.
3. Aumente a **versão do manifesto** do app do Teams, reenvie-o e **reinstale o app no Teams**.
4. **Feche totalmente e reabra o Teams** para limpar os metadados de app em cache.

**Permissão adicional para menções de usuários:** menções @ a usuários funcionam imediatamente para usuários da conversa. No entanto, se você quiser pesquisar e mencionar dinamicamente usuários que **não estão na conversa atual**, adicione a permissão de Aplicativo `User.Read.All` e conceda consentimento de administrador.

## Limitações conhecidas

### Timeouts de webhook

O Teams entrega mensagens via webhook HTTP. Se o processamento demorar muito (por exemplo, respostas lentas do LLM), você pode ver:

- Timeouts do gateway
- O Teams tentando reenviar a mensagem (causando duplicatas)
- Respostas descartadas

O OpenClaw lida com isso retornando rapidamente e enviando respostas de forma proativa, mas respostas muito lentas ainda podem causar problemas.

### Formatação

O markdown do Teams é mais limitado do que no Slack ou Discord:

- A formatação básica funciona: **negrito**, _itálico_, `code`, links
- Markdown complexo (tabelas, listas aninhadas) pode não renderizar corretamente
- Adaptive Cards são compatíveis para enquetes e envios arbitrários de cards (consulte abaixo)

## Configuração

Configurações principais (consulte `/gateway/configuration` para padrões compartilhados entre canais):

- `channels.msteams.enabled`: ativa/desativa o canal.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: credenciais do bot.
- `channels.msteams.webhook.port` (padrão `3978`)
- `channels.msteams.webhook.path` (padrão `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pairing)
- `channels.msteams.allowFrom`: lista de permissões de DM (IDs de objeto AAD recomendados). O assistente resolve nomes para IDs durante a configuração quando há acesso ao Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: alternância break-glass para reativar correspondência mutável por UPN/nome de exibição e roteamento direto por nome de equipe/canal.
- `channels.msteams.textChunkLimit`: tamanho de fragmento de texto de saída.
- `channels.msteams.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da fragmentação por tamanho.
- `channels.msteams.mediaAllowHosts`: lista de permissões para hosts de anexos recebidos (o padrão são domínios Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: lista de permissões para anexar cabeçalhos Authorization em novas tentativas de mídia (o padrão são hosts Graph + Bot Framework).
- `channels.msteams.requireMention`: exige @menção em canais/grupos (padrão true).
- `channels.msteams.replyStyle`: `thread | top-level` (consulte [Estilo de resposta](#estilo-de-resposta-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: substituição por equipe.
- `channels.msteams.teams.<teamId>.requireMention`: substituição por equipe.
- `channels.msteams.teams.<teamId>.tools`: substituições padrão de política de ferramentas por equipe (`allow`/`deny`/`alsoAllow`) usadas quando uma substituição de canal está ausente.
- `channels.msteams.teams.<teamId>.toolsBySender`: substituições padrão de política de ferramentas por equipe e por remetente (o curinga `"*"` é compatível).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: substituição por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: substituição por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: substituições de política de ferramentas por canal (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: substituições de política de ferramentas por canal e por remetente (o curinga `"*"` é compatível).
- As chaves `toolsBySender` devem usar prefixos explícitos:
  `id:`, `e164:`, `username:`, `name:` (chaves legadas sem prefixo ainda são mapeadas somente para `id:`).
- `channels.msteams.actions.memberInfo`: ativa ou desativa a ação member info com suporte do Graph (padrão: ativada quando há credenciais do Graph disponíveis).
- `channels.msteams.sharePointSiteId`: ID do site do SharePoint para uploads de arquivo em chats/canais de grupo (consulte [Envio de arquivos em chats de grupo](#envio-de-arquivos-em-chats-de-grupo)).

## Roteamento e sessões

- As chaves de sessão seguem o formato padrão de agente (consulte [/concepts/session](/concepts/session)):
  - Mensagens diretas compartilham a sessão principal (`agent:<agentId>:<mainKey>`).
  - Mensagens de canal/grupo usam o ID da conversa:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Estilo de resposta: threads vs posts

O Teams introduziu recentemente dois estilos de interface de canal sobre o mesmo modelo de dados subjacente:

| Estilo                    | Descrição                                               | `replyStyle` recomendado |
| ------------------------- | ------------------------------------------------------- | ------------------------ |
| **Posts** (clássico)      | As mensagens aparecem como cards com respostas em thread abaixo | `thread` (padrão) |
| **Threads** (semelhante ao Slack) | As mensagens fluem linearmente, mais como no Slack | `top-level` |

**O problema:** a API do Teams não expõe qual estilo de interface um canal usa. Se você usar o `replyStyle` errado:

- `thread` em um canal estilo Threads → as respostas aparecem aninhadas de forma estranha
- `top-level` em um canal estilo Posts → as respostas aparecem como posts independentes no nível superior em vez de dentro da thread

**Solução:** configure `replyStyle` por canal com base em como o canal está configurado:

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

## Anexos e imagens

**Limitações atuais:**

- **DMs:** imagens e anexos de arquivo funcionam via APIs de arquivo do bot do Teams.
- **Canais/grupos:** anexos vivem no armazenamento M365 (SharePoint/OneDrive). A carga útil do webhook inclui apenas um stub HTML, não os bytes reais do arquivo. **Permissões da API Graph são obrigatórias** para baixar anexos de canal.
- Para envios centrados explicitamente em arquivo, use `action=upload-file` com `media` / `filePath` / `path`; `message` opcional se torna o texto/comentário acompanhante, e `filename` substitui o nome enviado.

Sem permissões do Graph, mensagens de canal com imagens serão recebidas apenas como texto (o conteúdo da imagem não é acessível ao bot).
Por padrão, o OpenClaw só baixa mídia de nomes de host Microsoft/Teams. Substitua com `channels.msteams.mediaAllowHosts` (use `["*"]` para permitir qualquer host).
Cabeçalhos Authorization só são anexados para hosts em `channels.msteams.mediaAuthAllowHosts` (o padrão é Graph + hosts do Bot Framework). Mantenha essa lista restrita (evite sufixos multilocatário).

## Envio de arquivos em chats de grupo

Bots podem enviar arquivos em DMs usando o fluxo FileConsentCard (integrado). No entanto, **enviar arquivos em chats/canais de grupo** requer configuração adicional:

| Contexto                 | Como os arquivos são enviados              | Configuração necessária                         |
| ------------------------ | ------------------------------------------ | ----------------------------------------------- |
| **DMs**                  | FileConsentCard → usuário aceita → bot faz upload | Funciona imediatamente                     |
| **Chats/canais de grupo** | Upload para SharePoint → compartilhar link | Requer `sharePointSiteId` + permissões do Graph |
| **Imagens (qualquer contexto)** | Inline codificado em Base64          | Funciona imediatamente                           |

### Por que chats de grupo precisam de SharePoint

Bots não têm um drive pessoal no OneDrive (o endpoint `/me/drive` da API Graph não funciona para identidades de aplicativo). Para enviar arquivos em chats/canais de grupo, o bot faz upload para um **site do SharePoint** e cria um link de compartilhamento.

### Configuração

1. **Adicione permissões da API Graph** em Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - upload de arquivos para o SharePoint
   - `Chat.Read.All` (Application) - opcional, ativa links de compartilhamento por usuário

2. **Conceda consentimento de administrador** para o tenant.

3. **Obtenha o ID do seu site do SharePoint:**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Configure o OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Comportamento de compartilhamento

| Permissão                              | Comportamento de compartilhamento                         |
| -------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` apenas           | Link de compartilhamento para toda a organização (qualquer pessoa da org pode acessar) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Link de compartilhamento por usuário (somente membros do chat podem acessar) |

O compartilhamento por usuário é mais seguro, pois apenas os participantes do chat podem acessar o arquivo. Se a permissão `Chat.Read.All` estiver ausente, o bot recorre ao compartilhamento para toda a organização.

### Comportamento de fallback

| Cenário                                           | Resultado                                           |
| ------------------------------------------------- | --------------------------------------------------- |
| Chat de grupo + arquivo + `sharePointSiteId` configurado | Upload para SharePoint, envio de link de compartilhamento |
| Chat de grupo + arquivo + sem `sharePointSiteId`  | Tenta upload no OneDrive (pode falhar), envia só texto |
| Chat pessoal + arquivo                            | Fluxo FileConsentCard (funciona sem SharePoint)     |
| Qualquer contexto + imagem                        | Inline codificado em Base64 (funciona sem SharePoint) |

### Local onde os arquivos são armazenados

Os arquivos enviados são armazenados em uma pasta `/OpenClawShared/` na biblioteca de documentos padrão do site SharePoint configurado.

## Enquetes (Adaptive Cards)

O OpenClaw envia enquetes do Teams como Adaptive Cards (não há API nativa de enquetes no Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Os votos são registrados pelo gateway em `~/.openclaw/msteams-polls.json`.
- O gateway deve permanecer online para registrar votos.
- As enquetes ainda não publicam resumos de resultados automaticamente (inspecione o arquivo de armazenamento, se necessário).

## Adaptive Cards (arbitrários)

Envie qualquer JSON de Adaptive Card para usuários ou conversas do Teams usando a ferramenta `message` ou a CLI.

O parâmetro `card` aceita um objeto JSON de Adaptive Card. Quando `card` é fornecido, o texto da mensagem é opcional.

**Ferramenta do agente:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  card: {
    type: "AdaptiveCard",
    version: "1.5",
    body: [{ type: "TextBlock", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello!"}]}'
```

Consulte a [documentação do Adaptive Cards](https://adaptivecards.io/) para o esquema e exemplos de cards. Para detalhes sobre o formato de destino, consulte [Formatos de destino](#formatos-de-destino) abaixo.

## Formatos de destino

Os destinos do MSTeams usam prefixos para distinguir usuários de conversas:

| Tipo de destino        | Formato                          | Exemplo                                             |
| ---------------------- | -------------------------------- | --------------------------------------------------- |
| Usuário (por ID)       | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Usuário (por nome)     | `user:<display-name>`            | `user:John Smith` (requer API Graph)               |
| Grupo/canal            | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`           |
| Grupo/canal (bruto)    | `<conversation-id>`              | `19:abc123...@thread.tacv2` (se contiver `@thread`) |

**Exemplos de CLI:**

```bash
# Send to a user by ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Send to a user by display name (triggers Graph API lookup)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Send to a group chat or channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Send an Adaptive Card to a conversation
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello"}]}'
```

**Exemplos de ferramenta do agente:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  card: {
    type: "AdaptiveCard",
    version: "1.5",
    body: [{ type: "TextBlock", text: "Hello" }],
  },
}
```

Observação: sem o prefixo `user:`, os nomes usam por padrão a resolução de grupo/equipe. Sempre use `user:` ao direcionar pessoas por nome de exibição.

## Mensagens proativas

- Mensagens proativas só são possíveis **depois** que um usuário interage, porque armazenamos referências de conversa nesse momento.
- Consulte `/gateway/configuration` para `dmPolicy` e controle por lista de permissões.

## IDs de equipe e canal (armadilha comum)

O parâmetro de consulta `groupId` nas URLs do Teams **NÃO** é o ID de equipe usado na configuração. Extraia os IDs do caminho da URL:

**URL da equipe:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID (URL-decode this)
```

**URL do canal:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**Para configuração:**

- ID da equipe = segmento do caminho após `/team/` (decodificado da URL, por exemplo, `19:Bk4j...@thread.tacv2`)
- ID do canal = segmento do caminho após `/channel/` (decodificado da URL)
- **Ignore** o parâmetro de consulta `groupId`

## Canais privados

Bots têm suporte limitado em canais privados:

| Recurso                      | Canais padrão     | Canais privados       |
| ---------------------------- | ----------------- | --------------------- |
| Instalação do bot            | Sim               | Limitado              |
| Mensagens em tempo real (webhook) | Sim         | Pode não funcionar    |
| Permissões RSC               | Sim               | Pode se comportar de forma diferente |
| @menções                     | Sim               | Se o bot estiver acessível |
| Histórico via API Graph      | Sim               | Sim (com permissões)  |

**Alternativas se canais privados não funcionarem:**

1. Use canais padrão para interações com o bot
2. Use DMs - usuários sempre podem enviar mensagens diretamente ao bot
3. Use a API Graph para acesso histórico (requer `ChannelMessage.Read.All`)

## Solução de problemas

### Problemas comuns

- **Imagens não aparecem nos canais:** permissões do Graph ou consentimento de administrador ausentes. Reinstale o app do Teams e feche/reabra totalmente o Teams.
- **Sem respostas no canal:** menções são obrigatórias por padrão; defina `channels.msteams.requireMention=false` ou configure por equipe/canal.
- **Incompatibilidade de versão (Teams ainda mostra o manifesto antigo):** remova + adicione novamente o app e feche totalmente o Teams para atualizar.
- **401 Unauthorized do webhook:** esperado ao testar manualmente sem JWT do Azure - significa que o endpoint está acessível, mas a autenticação falhou. Use o Azure Web Chat para testar corretamente.

### Erros de upload de manifesto

- **"Icon file cannot be empty":** o manifesto referencia arquivos de ícone com 0 bytes. Crie ícones PNG válidos (32x32 para `outline.png`, 192x192 para `color.png`).
- **"webApplicationInfo.Id already in use":** o app ainda está instalado em outra equipe/chat. Encontre-o e desinstale-o primeiro, ou aguarde 5-10 minutos pela propagação.
- **"Something went wrong" no upload:** faça o upload por [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), abra as DevTools do navegador (F12) → aba Network e verifique o corpo da resposta para o erro real.
- **Falha no sideload:** tente "Upload an app to your org's app catalog" em vez de "Upload a custom app" - isso geralmente contorna restrições de sideload.

### Permissões RSC não funcionando

1. Verifique se `webApplicationInfo.id` corresponde exatamente ao App ID do seu bot
2. Reenvie o app e reinstale-o na equipe/chat
3. Verifique se o administrador da sua organização bloqueou permissões RSC
4. Confirme se você está usando o escopo correto: `ChannelMessage.Read.Group` para equipes, `ChatMessage.Read.Chat` para chats de grupo

## Referências

- [Criar Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guia de configuração do Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - criar/gerenciar apps do Teams
- [Esquema de manifesto do app do Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receber mensagens de canal com RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referência de permissões RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Manipulação de arquivos do bot do Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (canal/grupo requer Graph)
- [Mensagens proativas](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Relacionado

- [Visão geral dos canais](/channels) — todos os canais compatíveis
- [Pairing](/channels/pairing) — autenticação de DM e fluxo de pairing
- [Grupos](/channels/groups) — comportamento de chat em grupo e bloqueio por menção
- [Roteamento de canais](/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/gateway/security) — modelo de acesso e reforço de segurança
