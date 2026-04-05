---
read_when:
    - Você quer conectar o OpenClaw ao QQ
    - Você precisa configurar credenciais do QQ Bot
    - Você quer suporte do QQ Bot para grupos ou conversas privadas
summary: Configuração, uso e ajustes do QQ Bot
title: QQ Bot
x-i18n:
    generated_at: "2026-04-05T12:35:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e58fb7b07c59ecbf80a1276368c4a007b45d84e296ed40cffe9845e0953696c
    source_path: channels/qqbot.md
    workflow: 15
---

# QQ Bot

O QQ Bot se conecta ao OpenClaw por meio da API oficial do QQ Bot (gateway WebSocket). O
plugin oferece suporte a conversa privada C2C, @mensagens em grupos e mensagens em canais de guilda com
mídia avançada (imagens, voz, vídeo, arquivos).

Status: plugin incluído. Mensagens diretas, conversas em grupo, canais de guilda e
mídia são compatíveis. Reações e threads não são compatíveis.

## Plugin incluído

As versões atuais do OpenClaw incluem o QQ Bot, portanto compilações empacotadas normais não precisam
de uma etapa separada de `openclaw plugins install`.

## Configuração

1. Acesse a [QQ Open Platform](https://q.qq.com/) e escaneie o código QR com o
   QQ do seu telefone para registrar-se / fazer login.
2. Clique em **Create Bot** para criar um novo bot do QQ.
3. Encontre **AppID** e **AppSecret** na página de configurações do bot e copie-os.

> O AppSecret não é armazenado em texto simples — se você sair da página sem salvá-lo,
> terá de gerar um novo.

4. Adicione o canal:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Reinicie o Gateway.

Caminhos de configuração interativos:

```bash
openclaw channels add
openclaw configure --section channels
```

## Configurar

Configuração mínima:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

Variáveis de ambiente da conta padrão:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret com base em arquivo:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

Observações:

- O fallback por variável de ambiente se aplica apenas à conta padrão do QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` fornece apenas o
  AppSecret; o AppID já deve estar definido na configuração ou em `QQBOT_APP_ID`.
- `clientSecret` também aceita entrada SecretRef, não apenas uma string em texto simples.

### Configuração de várias contas

Execute vários bots do QQ em uma única instância do OpenClaw:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

Cada conta inicia sua própria conexão WebSocket e mantém um cache de token independente
(isolado por `appId`).

Adicione um segundo bot via CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Voz (STT / TTS)

O suporte a STT e TTS usa configuração em dois níveis com fallback por prioridade:

| Configuração | Específico do plugin | Fallback do framework          |
| ------------ | -------------------- | ------------------------------ |
| STT          | `channels.qqbot.stt` | `tools.media.audio.models[0]` |
| TTS          | `channels.qqbot.tts` | `messages.tts`                |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
    },
  },
}
```

Defina `enabled: false` em qualquer um deles para desativar.

O comportamento de upload/transcodificação de áudio de saída também pode ser ajustado com
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formatos de destino

| Formato                    | Descrição              |
| -------------------------- | ---------------------- |
| `qqbot:c2c:OPENID`         | Conversa privada (C2C) |
| `qqbot:group:GROUP_OPENID` | Conversa em grupo      |
| `qqbot:channel:CHANNEL_ID` | Canal de guilda        |

> Cada bot tem seu próprio conjunto de OpenIDs de usuário. Um OpenID recebido pelo Bot A **não pode**
> ser usado para enviar mensagens pelo Bot B.

## Comandos de barra

Comandos integrados interceptados antes da fila da IA:

| Comando        | Descrição                                 |
| -------------- | ----------------------------------------- |
| `/bot-ping`    | Teste de latência                         |
| `/bot-version` | Mostrar a versão do framework OpenClaw    |
| `/bot-help`    | Listar todos os comandos                  |
| `/bot-upgrade` | Mostrar o link do guia de upgrade do QQBot |
| `/bot-logs`    | Exportar logs recentes do gateway como arquivo |

Acrescente `?` a qualquer comando para ajuda de uso (por exemplo, `/bot-upgrade ?`).

## Solução de problemas

- **O bot responde "gone to Mars":** credenciais não configuradas ou Gateway não iniciado.
- **Nenhuma mensagem recebida:** verifique se `appId` e `clientSecret` estão corretos e se o
  bot está habilitado na QQ Open Platform.
- **A configuração com `--token-file` ainda aparece como não configurada:** `--token-file` define apenas
  o AppSecret. Você ainda precisa de `appId` na configuração ou em `QQBOT_APP_ID`.
- **Mensagens proativas não chegam:** o QQ pode interceptar mensagens iniciadas pelo bot se
  o usuário não interagiu recentemente.
- **A voz não é transcrita:** garanta que STT esteja configurado e que o provedor esteja acessível.
