---
read_when:
    - Você quer que um agente do OpenClaw entre em uma chamada do Google Meet
    - Você está configurando o Chrome, o Node do Chrome ou o Twilio como um transporte do Google Meet
summary: 'Plugin do Google Meet: entre em URLs explícitas do Meet pelo Chrome ou Twilio com padrões de voz em tempo real'
title: Plugin do Google Meet
x-i18n:
    generated_at: "2026-04-24T09:51:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: f1673ac4adc9cf163194a340dd6e451d0e4d28bb62adeb126898298e62106d43
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

Suporte a participantes do Google Meet para o OpenClaw.

O Plugin é explícito por definição:

- Ele entra apenas em uma URL explícita `https://meet.google.com/...`.
- A voz `realtime` é o modo padrão.
- A voz em tempo real pode retornar ao agente completo do OpenClaw quando for necessário raciocínio mais profundo ou ferramentas.
- A autenticação começa como OAuth pessoal do Google ou com um perfil do Chrome já autenticado.
- Não há anúncio automático de consentimento.
- O backend de áudio padrão do Chrome é `BlackHole 2ch`.
- O Chrome pode ser executado localmente ou em um host Node pareado.
- O Twilio aceita um número de discagem mais um PIN ou sequência DTMF opcional.
- O comando da CLI é `googlemeet`; `meet` fica reservado para fluxos mais amplos de teleconferência com agentes.

## Início rápido

Instale as dependências locais de áudio e configure um provedor de voz em tempo real no backend. OpenAI é o padrão; Google Gemini Live também funciona com `realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` instala o dispositivo de áudio virtual `BlackHole 2ch`. O instalador do Homebrew exige uma reinicialização antes que o macOS exponha o dispositivo:

```bash
sudo reboot
```

Após reiniciar, verifique as duas partes:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Ative o Plugin:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Verifique a configuração:

```bash
openclaw googlemeet setup
```

Entre em uma reunião:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Ou deixe um agente entrar usando a ferramenta `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

O Chrome entra usando o perfil autenticado no Chrome. No Meet, escolha `BlackHole 2ch` para o caminho de microfone/alto-falante usado pelo OpenClaw. Para áudio duplex limpo, use dispositivos virtuais separados ou um grafo no estilo Loopback; um único dispositivo BlackHole já basta para um primeiro teste rápido, mas pode causar eco.

### Gateway local + Chrome no Parallels

Você **não** precisa de um Gateway completo do OpenClaw nem de uma chave de API de modelo dentro de uma VM macOS apenas para fazer a VM ser a dona do Chrome. Execute o Gateway e o agente localmente, depois execute um host Node na VM. Ative o Plugin empacotado na VM uma vez para que o Node anuncie o comando do Chrome:

O que roda em cada lugar:

- Host do Gateway: Gateway do OpenClaw, workspace do agente, chaves de modelo/API, provedor realtime e a configuração do Plugin do Google Meet.
- VM macOS no Parallels: CLI/host Node do OpenClaw, Google Chrome, SoX, BlackHole 2ch e um perfil do Chrome autenticado no Google.
- Não necessário na VM: serviço Gateway, configuração do agente, chave OpenAI/GPT ou configuração de provedor de modelo.

Instale as dependências da VM:

```bash
brew install blackhole-2ch sox
```

Reinicie a VM após instalar o BlackHole para que o macOS exponha `BlackHole 2ch`:

```bash
sudo reboot
```

Após reiniciar, confirme que a VM consegue ver o dispositivo de áudio e os comandos do SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Instale ou atualize o OpenClaw na VM e então ative o Plugin empacotado lá:

```bash
openclaw plugins enable google-meet
```

Inicie o host Node na VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Se `<gateway-host>` for um IP da LAN e você não estiver usando TLS, o Node recusará o WebSocket em texto puro, a menos que você habilite explicitamente essa rede privada confiável:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Use a mesma variável de ambiente ao instalar o Node como um LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` é uma variável de ambiente de processo, não uma configuração de `openclaw.json`. `openclaw node install` a armazena no ambiente do LaunchAgent quando ela está presente no comando de instalação.

Aprove o Node a partir do host do Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Confirme que o Gateway vê o Node e que ele anuncia `googlemeet.chrome`:

```bash
openclaw nodes status
```

Encaminhe o Meet por esse Node no host do Gateway:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

Agora entre normalmente a partir do host do Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

ou peça ao agente para usar a ferramenta `google_meet` com `transport: "chrome-node"`.

Se `chromeNode.node` for omitido, o OpenClaw faz seleção automática apenas quando exatamente um Node conectado anuncia `googlemeet.chrome`. Se houver vários Nodes compatíveis conectados, defina `chromeNode.node` como o id do Node, o nome de exibição ou o IP remoto.

Verificações comuns de falha:

- `No connected Google Meet-capable node`: inicie `openclaw node run` na VM, aprove o pareamento e confirme que `openclaw plugins enable google-meet` foi executado na VM. Confirme também que o host do Gateway permite o comando do Node com `gateway.nodes.allowCommands: ["googlemeet.chrome"]`.
- `BlackHole 2ch audio device not found on the node`: instale `blackhole-2ch` na VM e reinicie a VM.
- O Chrome abre, mas não consegue entrar: faça login no Chrome dentro da VM e confirme que esse perfil consegue entrar manualmente na URL do Meet.
- Sem áudio: no Meet, encaminhe o microfone/alto-falante pelo caminho do dispositivo de áudio virtual usado pelo OpenClaw; use dispositivos virtuais separados ou roteamento no estilo Loopback para áudio duplex limpo.

## Notas de instalação

O padrão realtime do Chrome usa duas ferramentas externas:

- `sox`: utilitário de áudio de linha de comando. O Plugin usa seus comandos `rec` e `play` para a ponte de áudio padrão G.711 mu-law de 8 kHz.
- `blackhole-2ch`: driver de áudio virtual do macOS. Ele cria o dispositivo de áudio `BlackHole 2ch` pelo qual o Chrome/Meet pode ser roteado.

O OpenClaw não empacota nem redistribui nenhum dos dois pacotes. A documentação orienta os usuários a instalá-los como dependências do host via Homebrew. O SoX é licenciado como `LGPL-2.0-only AND GPL-2.0-only`; o BlackHole é GPL-3.0. Se você criar um instalador ou appliance que empacote BlackHole com o OpenClaw, revise os termos de licenciamento upstream do BlackHole ou obtenha uma licença separada da Existential Audio.

## Transportes

### Chrome

O transporte Chrome abre a URL do Meet no Google Chrome e entra usando o perfil autenticado no Chrome. No macOS, o Plugin verifica a presença de `BlackHole 2ch` antes da inicialização. Se estiver configurado, ele também executa um comando de verificação de integridade da ponte de áudio e um comando de inicialização antes de abrir o Chrome. Use `chrome` quando o Chrome/áudio estiver no host do Gateway; use `chrome-node` quando o Chrome/áudio estiver em um Node pareado, como uma VM macOS no Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Encaminhe o áudio de microfone e alto-falante do Chrome pela ponte local de áudio do OpenClaw. Se `BlackHole 2ch` não estiver instalado, a entrada falha com um erro de configuração em vez de entrar silenciosamente sem um caminho de áudio.

### Twilio

O transporte Twilio é um plano de discagem estrito delegado ao Plugin Voice Call. Ele não analisa páginas do Meet em busca de números de telefone.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Use `--dtmf-sequence` quando a reunião exigir uma sequência personalizada:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth e preflight

O acesso à API de mídia do Google Meet usa primeiro um cliente OAuth pessoal. Configure `oauth.clientId` e opcionalmente `oauth.clientSecret`, depois execute:

```bash
openclaw googlemeet auth login --json
```

O comando imprime um bloco de configuração `oauth` com um token de atualização. Ele usa PKCE, callback localhost em `http://localhost:8085/oauth2callback` e um fluxo manual de copiar/colar com `--manual`.

Estas variáveis de ambiente são aceitas como fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` ou `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` ou `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` ou `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` ou `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` ou
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` ou `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` ou `GOOGLE_MEET_PREVIEW_ACK`

Resolva uma URL do Meet, código ou `spaces/{id}` por meio de `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Execute o preflight antes do trabalho de mídia:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Defina `preview.enrollmentAcknowledged: true` somente após confirmar que seu projeto do Cloud, principal OAuth e participantes da reunião estão inscritos no Google Workspace Developer Preview Program para APIs de mídia do Meet.

## Configuração

O caminho realtime comum do Chrome precisa apenas do Plugin ativado, BlackHole, SoX e uma chave de provedor de voz em tempo real no backend. OpenAI é o padrão; defina `realtime.provider: "google"` para usar Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Defina a configuração do Plugin em `plugins.entries.google-meet.config`:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Padrões:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: id/nome/IP opcional do Node para `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`: comando SoX `rec` que grava áudio G.711 mu-law de 8 kHz na stdout
- `chrome.audioOutputCommand`: comando SoX `play` que lê áudio G.711 mu-law de 8 kHz da stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: respostas faladas breves, com
  `openclaw_agent_consult` para respostas mais profundas
- `realtime.introMessage`: verificação curta falada de prontidão quando a ponte realtime se conecta; defina como `""` para entrar em silêncio

Substituições opcionais:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

Configuração somente para Twilio:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

## Ferramenta

Agentes podem usar a ferramenta `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Use `transport: "chrome"` quando o Chrome estiver em execução no host do Gateway. Use `transport: "chrome-node"` quando o Chrome estiver em execução em um Node pareado, como uma VM no Parallels. Em ambos os casos, o modelo realtime e `openclaw_agent_consult` são executados no host do Gateway, então as credenciais do modelo permanecem lá.

Use `action: "status"` para listar sessões ativas ou inspecionar um ID de sessão. Use `action: "speak"` com `sessionId` e `message` para fazer o agente realtime falar imediatamente. Use `action: "leave"` para marcar uma sessão como encerrada.

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Consulta ao agente em tempo real

O modo realtime do Chrome é otimizado para um loop de voz ao vivo. O provedor de voz em tempo real ouve o áudio da reunião e fala por meio da ponte de áudio configurada. Quando o modelo realtime precisa de raciocínio mais profundo, informações atuais ou ferramentas normais do OpenClaw, ele pode chamar `openclaw_agent_consult`.

A ferramenta de consulta executa o agente normal do OpenClaw nos bastidores com o contexto recente da transcrição da reunião e retorna uma resposta falada concisa para a sessão de voz em tempo real. O modelo de voz pode então falar essa resposta de volta na reunião.

`realtime.toolPolicy` controla a execução da consulta:

- `safe-read-only`: expõe a ferramenta de consulta e limita o agente normal a
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e
  `memory_get`.
- `owner`: expõe a ferramenta de consulta e permite que o agente normal use a política normal de ferramentas do agente.
- `none`: não expõe a ferramenta de consulta ao modelo de voz em tempo real.

A chave da sessão de consulta tem escopo por sessão do Meet, para que chamadas de consulta de acompanhamento possam reutilizar o contexto anterior da consulta durante a mesma reunião.

Para forçar uma verificação falada de prontidão depois que o Chrome já tiver entrado totalmente na chamada:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

## Notas

A API oficial de mídia do Google Meet é orientada a recebimento, então falar em uma chamada do Meet ainda exige um caminho de participante. Este Plugin mantém esse limite visível: o Chrome lida com a participação no navegador e o roteamento de áudio local; o Twilio lida com a participação por discagem telefônica.

O modo realtime do Chrome precisa de um destes:

- `chrome.audioInputCommand` mais `chrome.audioOutputCommand`: o OpenClaw controla a ponte do modelo realtime e canaliza áudio G.711 mu-law de 8 kHz entre esses comandos e o provedor de voz em tempo real selecionado.
- `chrome.audioBridgeCommand`: um comando de ponte externa controla todo o caminho de áudio local e deve encerrar após iniciar ou validar seu daemon.

Para áudio duplex limpo, encaminhe a saída do Meet e o microfone do Meet por dispositivos virtuais separados ou por um grafo de dispositivo virtual no estilo Loopback. Um único dispositivo BlackHole compartilhado pode ecoar outros participantes de volta para a chamada.

`googlemeet speak` aciona a ponte de áudio realtime ativa para uma sessão do Chrome. `googlemeet leave` interrompe essa ponte. Para sessões do Twilio delegadas por meio do Plugin Voice Call, `leave` também encerra a chamada de voz subjacente.

## Relacionado

- [Plugin Voice Call](/pt-BR/plugins/voice-call)
- [Modo de conversa](/pt-BR/nodes/talk)
- [Criando Plugins](/pt-BR/plugins/building-plugins)
