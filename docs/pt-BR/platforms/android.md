---
read_when:
    - Pareamento ou reconexão do nó Android
    - Depuração da descoberta ou autenticação do gateway no Android
    - Verificação da paridade do histórico de chat entre clientes
summary: 'App Android (nó): runbook de conexão + superfície de comandos Connect/Chat/Voice/Canvas'
title: App Android
x-i18n:
    generated_at: "2026-04-05T12:48:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2223891afc3aa34af4aaf5410b4f1c6aebcf24bab68a6c47dd9832882d5260db
    source_path: platforms/android.md
    workflow: 15
---

# App Android (Nó)

> **Observação:** O app Android ainda não foi lançado publicamente. O código-fonte está disponível no [repositório OpenClaw](https://github.com/openclaw/openclaw) em `apps/android`. Você pode compilá-lo por conta própria usando Java 17 e o Android SDK (`./gradlew :app:assemblePlayDebug`). Consulte [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) para obter instruções de compilação.

## Panorama de suporte

- Função: app de nó complementar (o Android não hospeda o Gateway).
- Gateway obrigatório: sim (execute-o no macOS, Linux ou Windows via WSL2).
- Instalação: [Primeiros passos](/pt-BR/start/getting-started) + [Pareamento](/pt-BR/channels/pairing).
- Gateway: [Runbook](/pt-BR/gateway) + [Configuração](/pt-BR/gateway/configuration).
  - Protocolos: [Protocolo do Gateway](/pt-BR/gateway/protocol) (nós + plano de controle).

## Controle do sistema

O controle do sistema (launchd/systemd) fica no host do Gateway. Consulte [Gateway](/pt-BR/gateway).

## Runbook de conexão

App de nó Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

O Android se conecta diretamente ao WebSocket do Gateway e usa pareamento de dispositivo (`role: node`).

Para Tailscale ou hosts públicos, o Android exige um endpoint seguro:

- Preferencial: Tailscale Serve / Funnel com `https://<magicdns>` / `wss://<magicdns>`
- Também compatível: qualquer outra URL `wss://` do Gateway com um endpoint TLS real
- `ws://` sem criptografia continua compatível em endereços de LAN privada / hosts `.local`, além de `localhost`, `127.0.0.1` e a bridge do emulador Android (`10.0.2.2`)

### Pré-requisitos

- Você consegue executar o Gateway na máquina “master”.
- O dispositivo/emulador Android consegue alcançar o WebSocket do gateway:
  - Mesma LAN com mDNS/NSD, **ou**
  - Mesma tailnet Tailscale usando Wide-Area Bonjour / DNS-SD unicast (veja abaixo), **ou**
  - Host/porta do gateway manualmente (fallback)
- O pareamento móvel por tailnet/público **não** usa endpoints `ws://` de IP bruto da tailnet. Use Tailscale Serve ou outra URL `wss://`.
- Você consegue executar a CLI (`openclaw`) na máquina do gateway (ou via SSH).

### 1) Inicie o Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Confirme nos logs que você vê algo como:

- `listening on ws://0.0.0.0:18789`

Para acesso remoto do Android via Tailscale, prefira Serve/Funnel em vez de um bind bruto da tailnet:

```bash
openclaw gateway --tailscale serve
```

Isso fornece ao Android um endpoint seguro `wss://` / `https://`. Uma configuração simples de `gateway.bind: "tailnet"` não é suficiente para o primeiro pareamento remoto do Android, a menos que você também faça a terminação TLS separadamente.

### 2) Verifique a descoberta (opcional)

Na máquina do gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Mais notas de depuração: [Bonjour](/pt-BR/gateway/bonjour).

Se você também configurou um domínio de descoberta wide-area, compare com:

```bash
openclaw gateway discover --json
```

Isso mostra `local.` junto com o domínio wide-area configurado em uma única passagem e usa o endpoint de serviço resolvido em vez de dicas somente via TXT.

#### Descoberta tailnet (Viena ⇄ Londres) via DNS-SD unicast

A descoberta NSD/mDNS do Android não atravessa redes. Se o seu nó Android e o gateway estiverem em redes diferentes, mas conectados via Tailscale, use Wide-Area Bonjour / DNS-SD unicast.

A descoberta por si só não é suficiente para o pareamento do Android por tailnet/público. A rota descoberta ainda precisa de um endpoint seguro (`wss://` ou Tailscale Serve):

1. Configure uma zona DNS-SD (exemplo `openclaw.internal.`) no host do gateway e publique registros `_openclaw-gw._tcp`.
2. Configure o DNS dividido do Tailscale para o domínio escolhido apontando para esse servidor DNS.

Detalhes e exemplo de configuração do CoreDNS: [Bonjour](/pt-BR/gateway/bonjour).

### 3) Conecte pelo Android

No app Android:

- O app mantém a conexão com o gateway ativa por meio de um **serviço em primeiro plano** (notificação persistente).
- Abra a aba **Connect**.
- Use o modo **Setup Code** ou **Manual**.
- Se a descoberta estiver bloqueada, use host/porta manual em **Advanced controls**. Para hosts de LAN privada, `ws://` ainda funciona. Para hosts Tailscale/públicos, ative TLS e use um endpoint `wss://` / Tailscale Serve.

Após o primeiro pareamento bem-sucedido, o Android se reconecta automaticamente ao iniciar:

- Endpoint manual (se estiver ativado) ou, caso contrário,
- O último gateway descoberto (melhor esforço).

### 4) Aprove o pareamento (CLI)

Na máquina do gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Detalhes do pareamento: [Pareamento](/pt-BR/channels/pairing).

### 5) Verifique se o nó está conectado

- Via status dos nós:

  ```bash
  openclaw nodes status
  ```

- Via Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + histórico

A aba Chat do Android oferece suporte à seleção de sessão (padrão `main`, além de outras sessões existentes):

- Histórico: `chat.history` (normalizado para exibição; tags de diretivas inline são removidas do texto visível, cargas XML de chamadas de ferramenta em texto simples — incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamadas de ferramenta — e tokens de controle do modelo vazados em ASCII/largura completa são removidos, linhas do assistente compostas apenas por tokens silenciosos, como `NO_REPLY` / `no_reply` exatos, são omitidas, e linhas muito grandes podem ser substituídas por placeholders)
- Envio: `chat.send`
- Atualizações por push (melhor esforço): `chat.subscribe` → `event:"chat"`

### 7) Canvas + câmera

#### Gateway Canvas Host (recomendado para conteúdo web)

Se você quiser que o nó mostre HTML/CSS/JS real que o agente possa editar em disco, aponte o nó para o host canvas do Gateway.

Observação: os nós carregam o canvas a partir do servidor HTTP do Gateway (mesma porta de `gateway.port`, padrão `18789`).

1. Crie `~/.openclaw/workspace/canvas/index.html` no host do gateway.

2. Navegue o nó até ele (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcional): se ambos os dispositivos estiverem no Tailscale, use um nome MagicDNS ou IP da tailnet em vez de `.local`, por exemplo `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Esse servidor injeta um cliente de recarga ao vivo no HTML e recarrega quando os arquivos mudam.
O host A2UI fica em `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Comandos de canvas (somente em primeiro plano):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (use `{"url":""}` ou `{"url":"/"}` para voltar ao scaffold padrão). `canvas.snapshot` retorna `{ format, base64 }` (padrão `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` alias legado)

Comandos de câmera (somente em primeiro plano; controlados por permissão):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Consulte [Nó de câmera](/pt-BR/nodes/camera) para parâmetros e auxiliares da CLI.

### 8) Voice + superfície expandida de comandos do Android

- Voz: o Android usa um único fluxo de ligar/desligar microfone na aba Voice com captura de transcrição e reprodução `talk.speak`. O TTS local do sistema é usado apenas quando `talk.speak` não está disponível. A voz para quando o app sai do primeiro plano.
- Os alternadores de voice wake/talk-mode foram removidos do UX/runtime do Android no momento.
- Famílias adicionais de comandos do Android (a disponibilidade depende do dispositivo + permissões):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (consulte [Encaminhamento de notificações](#notification-forwarding) abaixo)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Pontos de entrada do assistente

O Android oferece suporte ao lançamento do OpenClaw a partir do gatilho de assistente do sistema (Google Assistant). Quando configurado, manter o botão home pressionado ou dizer "Hey Google, ask OpenClaw..." abre o app e envia o prompt para o compositor de chat.

Isso usa metadados do Android **App Actions** declarados no manifesto do app. Nenhuma configuração extra é necessária no lado do gateway — a intent do assistente é tratada inteiramente pelo app Android e encaminhada como uma mensagem de chat normal.

<Note>
A disponibilidade de App Actions depende do dispositivo, da versão do Google Play Services e de o usuário ter definido o OpenClaw como app de assistente padrão.
</Note>

## Encaminhamento de notificações

O Android pode encaminhar notificações do dispositivo para o gateway como eventos. Vários controles permitem definir o escopo de quais notificações são encaminhadas e quando isso acontece.

| Key                              | Type           | Description                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Encaminhe notificações apenas destes nomes de pacote. Se definido, todos os outros pacotes serão ignorados. |
| `notifications.denyPackages`     | string[]       | Nunca encaminhe notificações destes nomes de pacote. Aplicado após `allowPackages`.              |
| `notifications.quietHours.start` | string (HH:mm) | Início da janela de horário silencioso (hora local do dispositivo). As notificações são suprimidas durante essa janela. |
| `notifications.quietHours.end`   | string (HH:mm) | Fim da janela de horário silencioso.                                                              |
| `notifications.rateLimit`        | number         | Máximo de notificações encaminhadas por pacote por minuto. Notificações excedentes são descartadas. |

O seletor de notificações também usa um comportamento mais seguro para eventos de notificação encaminhados, evitando o encaminhamento acidental de notificações sensíveis do sistema.

Exemplo de configuração:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
O encaminhamento de notificações exige a permissão Android Notification Listener. O app solicita isso durante a configuração.
</Note>
