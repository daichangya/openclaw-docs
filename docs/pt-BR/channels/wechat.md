---
read_when:
    - Você quer conectar o OpenClaw ao WeChat ou Weixin
    - Você está instalando ou solucionando problemas do Plugin de canal openclaw-weixin
    - Você precisa entender como Plugins de canal externos são executados ao lado do Gateway
summary: Configuração do canal WeChat por meio do Plugin externo openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-04-19T01:11:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae669f2b6300e0c2b1d1dc57743a0a2ab0c05b9e277ec2ac640a03e6e7ab3b84
    source_path: channels/wechat.md
    workflow: 15
---

# WeChat

O OpenClaw se conecta ao WeChat por meio do Plugin de canal externo da Tencent
`@tencent-weixin/openclaw-weixin`.

Status: Plugin externo. Conversas diretas e mídia são compatíveis. Conversas em grupo não são
anunciadas pelos metadados de capacidade do Plugin atual.

## Nomenclatura

- **WeChat** é o nome voltado ao usuário nestas docs.
- **Weixin** é o nome usado pelo pacote da Tencent e pelo id do Plugin.
- `openclaw-weixin` é o id do canal do OpenClaw.
- `@tencent-weixin/openclaw-weixin` é o pacote npm.

Use `openclaw-weixin` em comandos de CLI e caminhos de configuração.

## Como funciona

O código do WeChat não fica no repositório principal do OpenClaw. O OpenClaw fornece o
contrato genérico de Plugin de canal, e o Plugin externo fornece o
runtime específico do WeChat:

1. `openclaw plugins install` instala `@tencent-weixin/openclaw-weixin`.
2. O Gateway descobre o manifesto do Plugin e carrega o ponto de entrada do Plugin.
3. O Plugin registra o id de canal `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` inicia o login por QR.
5. O Plugin armazena as credenciais da conta no diretório de estado do OpenClaw.
6. Quando o Gateway é iniciado, o Plugin inicia seu monitor Weixin para cada
   conta configurada.
7. As mensagens recebidas do WeChat são normalizadas pelo contrato do canal, roteadas para
   o agente OpenClaw selecionado e enviadas de volta pelo caminho de saída do Plugin.

Essa separação é importante: o núcleo do OpenClaw deve permanecer independente de canal. Login do WeChat,
chamadas de API Tencent iLink, upload/download de mídia, tokens de contexto e
monitoramento de contas pertencem ao Plugin externo.

## Instalação

Instalação rápida:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

Instalação manual:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

Reinicie o Gateway após a instalação:

```bash
openclaw gateway restart
```

## Login

Execute o login por QR na mesma máquina que executa o Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

Escaneie o código QR com o WeChat no seu telefone e confirme o login. O Plugin salva
o token da conta localmente após uma leitura bem-sucedida.

Para adicionar outra conta do WeChat, execute o mesmo comando de login novamente. Para várias
contas, isole as sessões de mensagem direta por conta, canal e remetente:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Controle de acesso

Mensagens diretas usam o modelo normal de pareamento e allowlist do OpenClaw para Plugins
de canal.

Aprove novos remetentes:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Para o modelo completo de controle de acesso, consulte [Pareamento](/pt-BR/channels/pairing).

## Compatibilidade

O Plugin verifica a versão do host OpenClaw na inicialização.

| Linha do Plugin | Versão do OpenClaw      | Tag npm  |
| --------------- | ----------------------- | -------- |
| `2.x`           | `>=2026.3.22`           | `latest` |
| `1.x`           | `>=2026.1.0 <2026.3.22` | `legacy` |

Se o Plugin informar que sua versão do OpenClaw é muito antiga, atualize o
OpenClaw ou instale a linha legada do Plugin:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Processo sidecar

O Plugin do WeChat pode executar trabalho auxiliar ao lado do Gateway enquanto monitora a
API Tencent iLink. Na issue #68451, esse caminho auxiliar expôs um bug na
limpeza genérica de Gateway obsoleto do OpenClaw: um processo filho podia tentar limpar o
processo Gateway pai, causando loops de reinicialização em gerenciadores de processo como o systemd.

A limpeza atual de inicialização do OpenClaw exclui o processo atual e seus ancestrais,
portanto, um auxiliar de canal não deve matar o Gateway que o iniciou. Essa correção é
genérica; não é um caminho específico do WeChat no núcleo.

## Solução de problemas

Verifique a instalação e o status:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Se o canal aparecer como instalado, mas não se conectar, confirme se o Plugin está
habilitado e reinicie:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Se o Gateway reiniciar repetidamente após habilitar o WeChat, atualize o OpenClaw e
o Plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Desativação temporária:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Docs relacionadas

- Visão geral dos canais: [Canais de chat](/pt-BR/channels)
- Pareamento: [Pareamento](/pt-BR/channels/pairing)
- Roteamento de canal: [Roteamento de canal](/pt-BR/channels/channel-routing)
- Arquitetura de Plugin: [Arquitetura de Plugin](/pt-BR/plugins/architecture)
- SDK de Plugin de canal: [SDK de Plugin de canal](/pt-BR/plugins/sdk-channel-plugins)
- Pacote externo: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
