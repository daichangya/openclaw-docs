---
read_when:
    - Você quer fazer uma chamada de voz de saída a partir do OpenClaw
    - Você está configurando ou desenvolvendo o Plugin de chamada de voz
summary: 'Plugin de chamada de voz: chamadas de saída + entrada via Twilio/Telnyx/Plivo (instalação do Plugin + configuração + CLI)'
title: Plugin de chamada de voz
x-i18n:
    generated_at: "2026-04-23T05:42:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fbfe1aba459dd4fbe1b5c100430ff8cbe8987d7d34b875d115afcaee6e56412
    source_path: plugins/voice-call.md
    workflow: 15
---

# Chamada de voz (Plugin)

Chamadas de voz para o OpenClaw por meio de um Plugin. Oferece suporte a notificações de saída e
conversas de vários turnos com políticas de entrada.

Providers atuais:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + transferência XML + fala com GetInput)
- `mock` (desenvolvimento/sem rede)

Modelo mental rápido:

- Instale o Plugin
- Reinicie o Gateway
- Configure em `plugins.entries.voice-call.config`
- Use `openclaw voicecall ...` ou a tool `voice_call`

## Onde ele roda (local vs remoto)

O Plugin de chamada de voz roda **dentro do processo do Gateway**.

Se você usa um Gateway remoto, instale/configure o Plugin na **máquina que executa o Gateway** e depois reinicie o Gateway para carregá-lo.

## Instalação

### Opção A: instalar a partir do npm (recomendado)

```bash
openclaw plugins install @openclaw/voice-call
```

Reinicie o Gateway em seguida.

### Opção B: instalar a partir de uma pasta local (desenvolvimento, sem cópia)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Reinicie o Gateway em seguida.

## Configuração

Defina a configuração em `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // ou "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Chave pública de Webhook do Telnyx do Portal Mission Control do Telnyx
            // (string Base64; também pode ser definida via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Servidor de Webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Segurança de Webhook (recomendado para túneis/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Exposição pública (escolha uma)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // opcional; primeiro provider de transcrição em tempo real registrado quando não definido
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // opcional se OPENAI_API_KEY estiver definido
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },
        },
      },
    },
  },
}
```

Observações:

- Twilio/Telnyx exigem uma URL de Webhook **publicamente acessível**.
- Plivo exige uma URL de Webhook **publicamente acessível**.
- `mock` é um provider local para desenvolvimento (sem chamadas de rede).
- Se configurações mais antigas ainda usarem `provider: "log"`, `twilio.from` ou chaves legadas `streaming.*` do OpenAI, execute `openclaw doctor --fix` para reescrevê-las.
- Telnyx exige `telnyx.publicKey` (ou `TELNYX_PUBLIC_KEY`), a menos que `skipSignatureVerification` seja true.
- `skipSignatureVerification` é apenas para testes locais.
- Se você usa o tier gratuito do ngrok, defina `publicUrl` com a URL exata do ngrok; a verificação de assinatura é sempre aplicada.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` permite Webhooks do Twilio com assinaturas inválidas **somente** quando `tunnel.provider="ngrok"` e `serve.bind` é loopback (agente local do ngrok). Use apenas para desenvolvimento local.
- URLs do tier gratuito do ngrok podem mudar ou adicionar comportamento de intersticial; se `publicUrl` mudar, as assinaturas do Twilio falharão. Para produção, prefira um domínio estável ou funnel do Tailscale.
- Padrões de segurança de streaming:
  - `streaming.preStartTimeoutMs` fecha sockets que nunca enviam um frame `start` válido.
- `streaming.maxPendingConnections` limita o total de sockets pré-início não autenticados.
- `streaming.maxPendingConnectionsPerIp` limita os sockets pré-início não autenticados por IP de origem.
- `streaming.maxConnections` limita o total de sockets abertos de stream de mídia (pendentes + ativos).
- O fallback em runtime ainda aceita essas chaves antigas de voice-call por enquanto, mas o caminho de reescrita é `openclaw doctor --fix` e o shim de compatibilidade é temporário.

## Transcrição por streaming

`streaming` seleciona um provider de transcrição em tempo real para áudio de chamadas ao vivo.

Comportamento atual em runtime:

- `streaming.provider` é opcional. Se não for definido, a Chamada de voz usa o primeiro
  provider de transcrição em tempo real registrado.
- Providers integrados de transcrição em tempo real incluem Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) e xAI
  (`xai`), registrados por seus Plugins de provider.
- A configuração bruta pertencente ao provider fica em `streaming.providers.<providerId>`.
- Se `streaming.provider` apontar para um provider não registrado, ou se nenhum provider
  de transcrição em tempo real estiver registrado, a Chamada de voz registrará um aviso e
  ignorará o streaming de mídia em vez de fazer todo o Plugin falhar.

Padrões da transcrição por streaming do OpenAI:

- Chave de API: `streaming.providers.openai.apiKey` ou `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Padrões da transcrição por streaming do xAI:

- Chave de API: `streaming.providers.xai.apiKey` ou `XAI_API_KEY`
- endpoint: `wss://api.x.ai/v1/stt`
- `encoding`: `mulaw`
- `sampleRate`: `8000`
- `endpointingMs`: `800`
- `interimResults`: `true`

Exemplo:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "openai",
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // opcional se OPENAI_API_KEY estiver definido
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
          },
        },
      },
    },
  },
}
```

Use xAI em vez disso:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "xai",
            streamPath: "/voice/stream",
            providers: {
              xai: {
                apiKey: "${XAI_API_KEY}", // opcional se XAI_API_KEY estiver definido
                endpointingMs: 800,
                language: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

Chaves legadas ainda são migradas automaticamente por `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Coletor de chamadas obsoletas

Use `staleCallReaperSeconds` para encerrar chamadas que nunca recebem um Webhook terminal
(por exemplo, chamadas em modo notify que nunca são concluídas). O padrão é `0`
(desabilitado).

Faixas recomendadas:

- **Produção:** `120`–`300` segundos para fluxos no estilo notify.
- Mantenha esse valor **maior que `maxDurationSeconds`** para que chamadas normais possam
  terminar. Um bom ponto de partida é `maxDurationSeconds + 30–60` segundos.

Exemplo:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Segurança de Webhook

Quando um proxy ou túnel fica na frente do Gateway, o Plugin reconstrói a
URL pública para verificação de assinatura. Essas opções controlam em quais headers
encaminhados confiar.

`webhookSecurity.allowedHosts` define uma allowlist de hosts a partir de headers de encaminhamento.

`webhookSecurity.trustForwardingHeaders` confia em headers encaminhados sem uma allowlist.

`webhookSecurity.trustedProxyIPs` confia em headers encaminhados apenas quando o IP
remoto da requisição corresponde à lista.

A proteção contra replay de Webhook está habilitada para Twilio e Plivo. Requisições
de Webhook válidas reproduzidas são reconhecidas, mas seus efeitos colaterais são ignorados.

Os turnos de conversa do Twilio incluem um token por turno em callbacks `<Gather>`, então
callbacks de fala obsoletos/reproduzidos não podem satisfazer um turno mais novo de transcrição pendente.

Requisições de Webhook não autenticadas são rejeitadas antes da leitura do corpo quando os
headers de assinatura obrigatórios do provider estão ausentes.

O Webhook de voice-call usa o perfil compartilhado de corpo pré-autenticação (64 KB / 5 segundos)
mais um limite por IP de requisições em andamento antes da verificação de assinatura.

Exemplo com um host público estável:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## TTS para chamadas

A Chamada de voz usa a configuração central `messages.tts` para
streaming de fala nas chamadas. Você pode sobrescrevê-la na configuração do Plugin com o
**mesmo formato** — ela faz deep-merge com `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

Observações:

- Chaves legadas `tts.<provider>` dentro da configuração do Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) são migradas automaticamente para `tts.providers.<provider>` no carregamento. Prefira o formato `providers` na configuração versionada.
- **A fala da Microsoft é ignorada para chamadas de voz** (o áudio de telefonia precisa de PCM; o transporte atual da Microsoft não expõe saída PCM de telefonia).
- O TTS central é usado quando o streaming de mídia do Twilio está habilitado; caso contrário, as chamadas usam fallback para vozes nativas do provider.
- Se um stream de mídia do Twilio já estiver ativo, a Chamada de voz não usa fallback para TwiML `<Say>`. Se o TTS de telefonia não estiver disponível nesse estado, a solicitação de reprodução falha em vez de misturar dois caminhos de reprodução.
- Quando o TTS de telefonia usa fallback para um provider secundário, a Chamada de voz registra um aviso com a cadeia de providers (`from`, `to`, `attempts`) para depuração.

### Mais exemplos

Usar apenas o TTS central (sem sobrescrita):

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```

Sobrescrever para ElevenLabs apenas para chamadas (manter o padrão central em outros lugares):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```

Sobrescrever apenas o model do OpenAI para chamadas (exemplo de deep-merge):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```

## Chamadas de entrada

A política de entrada tem como padrão `disabled`. Para habilitar chamadas de entrada, defina:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` é uma filtragem de caller ID de baixa garantia. O Plugin
normaliza o valor `From` fornecido pelo provider e o compara com `allowFrom`.
A verificação de Webhook autentica a entrega do provider e a integridade do payload, mas
não comprova a propriedade do número do chamador em PSTN/VoIP. Trate `allowFrom` como
filtragem de caller ID, não como identidade forte do chamador.

As respostas automáticas usam o sistema de agente. Ajuste com:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Contrato de saída falada

Para respostas automáticas, a Chamada de voz acrescenta um contrato estrito de saída falada ao system prompt:

- `{"spoken":"..."}`

A Chamada de voz então extrai o texto falado de forma defensiva:

- Ignora payloads marcados como conteúdo de raciocínio/erro.
- Faz parsing de JSON direto, JSON delimitado por fences ou chaves `"spoken"` inline.
- Usa fallback para texto simples e remove parágrafos iniciais prováveis de planejamento/metadados.

Isso mantém a reprodução falada focada no texto voltado ao chamador e evita vazar texto de planejamento para o áudio.

### Comportamento de início da conversa

Para chamadas de saída `conversation`, o tratamento da primeira mensagem está vinculado ao estado de reprodução ao vivo:

- A limpeza da fila de interrupção por fala e a resposta automática são suprimidas somente enquanto a saudação inicial estiver sendo falada ativamente.
- Se a reprodução inicial falhar, a chamada retorna para `listening` e a mensagem inicial permanece na fila para retry.
- A reprodução inicial para streaming do Twilio começa na conexão do stream sem atraso extra.

### Tolerância para desconexão de stream do Twilio

Quando um stream de mídia do Twilio se desconecta, a Chamada de voz espera `2000ms` antes de encerrar automaticamente a chamada:

- Se o stream se reconectar durante essa janela, o encerramento automático é cancelado.
- Se nenhum stream for registrado novamente após o período de tolerância, a chamada é encerrada para evitar chamadas ativas travadas.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

`latency` lê `calls.jsonl` do caminho padrão de armazenamento de voice-call. Use
`--file <path>` para apontar para um log diferente e `--last <n>` para limitar a análise
aos últimos N registros (padrão 200). A saída inclui p50/p90/p99 para a
latência de turno e os tempos de espera de escuta.

## Tool do agente

Nome da tool: `voice_call`

Ações:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `end_call` (callId)
- `get_status` (callId)

Este repositório inclui uma documentação de Skill correspondente em `skills/voice-call/SKILL.md`.

## RPC do Gateway

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
