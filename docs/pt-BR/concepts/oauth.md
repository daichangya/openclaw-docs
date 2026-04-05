---
read_when:
    - Você quer entender o OAuth do OpenClaw de ponta a ponta
    - Você encontrou problemas de invalidação de token / logout
    - Você quer fluxos de autenticação do Claude CLI ou OAuth
    - Você quer múltiplas contas ou roteamento por perfil
summary: 'OAuth no OpenClaw: troca de tokens, armazenamento e padrões para múltiplas contas'
title: OAuth
x-i18n:
    generated_at: "2026-04-05T12:40:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b364be2182fcf9082834450f39aecc0913c85fb03237eec1228a589d4851dcd
    source_path: concepts/oauth.md
    workflow: 15
---

# OAuth

O OpenClaw oferece suporte a “autenticação por assinatura” via OAuth para providers que a oferecem
(notavelmente **OpenAI Codex (ChatGPT OAuth)**). Para assinaturas da Anthropic, novas
configurações devem usar o caminho de login local do **Claude CLI** no host do gateway, mas
a Anthropic distingue entre o uso direto do Claude Code e o caminho de reutilização do OpenClaw. A documentação pública do Claude Code da Anthropic diz que o uso direto do Claude Code permanece
dentro dos limites da assinatura do Claude. Separadamente, a Anthropic notificou os usuários do OpenClaw
em **4 de abril de 2026 às 12:00 PM PT / 8:00 PM BST** que o OpenClaw conta como
um harness de terceiros e agora exige **Extra Usage** para esse tráfego.
O OpenAI Codex OAuth é explicitamente compatível para uso em ferramentas externas como
o OpenClaw. Esta página explica:

Para Anthropic em produção, a autenticação por chave de API é o caminho recomendado mais seguro.

- como funciona a **troca de token** do OAuth (PKCE)
- onde os tokens são **armazenados** (e por quê)
- como lidar com **múltiplas contas** (perfis + substituições por sessão)

O OpenClaw também oferece suporte a **plugins de provider** que distribuem seus próprios fluxos de OAuth ou de chave de API.
Execute-os por meio de:

```bash
openclaw models auth login --provider <id>
```

## O coletor de tokens (por que ele existe)

Providers OAuth com frequência emitem um **novo refresh token** durante fluxos de login/atualização. Alguns providers (ou clientes OAuth) podem invalidar refresh tokens mais antigos quando um novo é emitido para o mesmo usuário/app.

Sintoma prático:

- você faz login via OpenClaw _e_ via Claude Code / Codex CLI → um deles acaba sendo “desconectado” aleatoriamente depois

Para reduzir isso, o OpenClaw trata `auth-profiles.json` como um **coletor de tokens**:

- o runtime lê credenciais de **um único lugar**
- podemos manter vários perfis e roteá-los de forma determinística
- quando credenciais são reutilizadas de uma CLI externa como a Codex CLI, o OpenClaw
  as espelha com proveniência e relê essa fonte externa em vez de
  girar o refresh token por conta própria

## Armazenamento (onde os tokens ficam)

Os segredos são armazenados **por agente**:

- Perfis de autenticação (OAuth + chaves de API + refs opcionais no nível do valor): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Arquivo de compatibilidade legado: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (entradas estáticas de `api_key` são removidas quando descobertas)

Arquivo legado apenas para importação (ainda compatível, mas não é o armazenamento principal):

- `~/.openclaw/credentials/oauth.json` (importado para `auth-profiles.json` no primeiro uso)

Todos os itens acima também respeitam `$OPENCLAW_STATE_DIR` (substituição do diretório de estado). Referência completa: [/gateway/configuration](/gateway/configuration-reference#auth-storage)

Para refs estáticas de segredo e comportamento de ativação do snapshot em runtime, consulte [Gerenciamento de segredos](/gateway/secrets).

## Compatibilidade legada de token da Anthropic

<Warning>
A documentação pública do Claude Code da Anthropic diz que o uso direto do Claude Code permanece dentro
dos limites da assinatura do Claude. Separadamente, a Anthropic informou os usuários do OpenClaw em
**4 de abril de 2026 às 12:00 PM PT / 8:00 PM BST** que **o OpenClaw conta como um
harness de terceiros**. Perfis de token Anthropic existentes continuam tecnicamente utilizáveis no OpenClaw, mas a Anthropic diz que o caminho do OpenClaw agora exige **Extra
Usage** (pay-as-you-go cobrado separadamente da assinatura) para esse tráfego.

Para a documentação atual da Anthropic sobre o plano direto do Claude Code, consulte [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
e [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Se você quiser outras opções no estilo assinatura no OpenClaw, consulte [OpenAI
Codex](/providers/openai), [Qwen Cloud Coding
Plan](/providers/qwen), [MiniMax Coding Plan](/providers/minimax),
e [Z.AI / GLM Coding Plan](/providers/glm).
</Warning>

O OpenClaw agora expõe novamente o setup-token da Anthropic como um caminho legado/manual.
O aviso de cobrança da Anthropic específico para o OpenClaw ainda se aplica a esse caminho, então
use-o esperando que a Anthropic exija **Extra Usage** para
tráfego de login do Claude direcionado pelo OpenClaw.

## Migração para Anthropic Claude CLI

Se o Claude CLI já estiver instalado e autenticado no host do gateway, você poderá
mudar a seleção de modelos Anthropic para o backend local da CLI. Este é um
caminho compatível no OpenClaw quando você quiser reutilizar um login local do Claude CLI no
mesmo host.

Pré-requisitos:

- o binário `claude` está instalado no host do gateway
- o Claude CLI já está autenticado ali por meio de `claude auth login`

Comando de migração:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Atalho de onboarding:

```bash
openclaw onboard --auth-choice anthropic-cli
```

Isso mantém perfis de autenticação Anthropic existentes para rollback, mas reescreve o principal
caminho do modelo padrão de `anthropic/...` para `claude-cli/...`, reescreve fallbacks correspondentes
do Anthropic Claude e adiciona entradas correspondentes de allowlist `claude-cli/...` em `agents.defaults.models`.

Verifique:

```bash
openclaw models status
```

## Troca de OAuth (como o login funciona)

Os fluxos de login interativos do OpenClaw são implementados em `@mariozechner/pi-ai` e conectados aos assistentes/comandos.

### Anthropic Claude CLI

Formato do fluxo:

Caminho do Claude CLI:

1. faça login com `claude auth login` no host do gateway
2. execute `openclaw models auth login --provider anthropic --method cli --set-default`
3. não armazene nenhum novo perfil de autenticação; mude a seleção de modelos para `claude-cli/...`
4. mantenha perfis de autenticação Anthropic existentes para rollback

A documentação pública do Claude Code da Anthropic descreve esse fluxo direto de
login de assinatura do Claude para o próprio `claude`. O OpenClaw pode reutilizar esse login local, mas
a Anthropic classifica separadamente o caminho controlado pelo OpenClaw como uso de harness de terceiros para fins de cobrança.

Caminho do assistente interativo:

- `openclaw onboard` / `openclaw configure` → opção de autenticação `anthropic-cli`

### OpenAI Codex (ChatGPT OAuth)

O OpenAI Codex OAuth é explicitamente compatível para uso fora da Codex CLI, inclusive em fluxos de trabalho do OpenClaw.

Formato do fluxo (PKCE):

1. gere verificador/desafio PKCE + `state` aleatório
2. abra `https://auth.openai.com/oauth/authorize?...`
3. tente capturar o callback em `http://127.0.0.1:1455/auth/callback`
4. se não for possível fazer bind do callback (ou se você estiver remoto/headless), cole a URL/código de redirecionamento
5. faça a troca em `https://auth.openai.com/oauth/token`
6. extraia `accountId` do access token e armazene `{ access, refresh, expires, accountId }`

O caminho no assistente é `openclaw onboard` → opção de autenticação `openai-codex`.

## Refresh + expiração

Os perfis armazenam um timestamp `expires`.

Em runtime:

- se `expires` estiver no futuro → use o access token armazenado
- se tiver expirado → atualize (sob bloqueio de arquivo) e sobrescreva as credenciais armazenadas
- exceção: credenciais reutilizadas de CLIs externas permanecem gerenciadas externamente; o OpenClaw
  relê o armazenamento de autenticação da CLI e nunca consome o refresh token copiado por conta própria

O fluxo de atualização é automático; em geral, você não precisa gerenciar tokens manualmente.

## Múltiplas contas (perfis) + roteamento

Dois padrões:

### 1) Preferido: agentes separados

Se você quiser que “pessoal” e “trabalho” nunca interajam, use agentes isolados (sessões + credenciais + workspace separados):

```bash
openclaw agents add work
openclaw agents add personal
```

Depois configure a autenticação por agente (assistente) e roteie os chats para o agente certo.

### 2) Avançado: múltiplos perfis em um agente

`auth-profiles.json` oferece suporte a vários IDs de perfil para o mesmo provider.

Escolha qual perfil será usado:

- globalmente por ordem de configuração (`auth.order`)
- por sessão via `/model ...@<profileId>`

Exemplo (substituição por sessão):

- `/model Opus@anthropic:work`

Como ver quais IDs de perfil existem:

- `openclaw channels list --json` (mostra `auth[]`)

Documentação relacionada:

- [/concepts/model-failover](/concepts/model-failover) (regras de rotação + cooldown)
- [/tools/slash-commands](/tools/slash-commands) (superfície de comandos)

## Relacionado

- [Autenticação](/gateway/authentication) — visão geral da autenticação de providers de modelo
- [Segredos](/gateway/secrets) — armazenamento de credenciais e SecretRef
- [Referência de configuração](/gateway/configuration-reference#auth-storage) — chaves de configuração de autenticação
