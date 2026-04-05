---
read_when:
    - Você quer fazer uma chamada de voz de saída a partir do OpenClaw
    - Você está configurando ou desenvolvendo o plugin voice-call
summary: 'Plugin Voice Call: chamadas de saída + entrada via Twilio/Telnyx/Plivo (instalação do plugin + config + CLI)'
title: Plugin Voice Call
x-i18n:
    generated_at: "2026-04-05T12:50:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e6d10c9fde6ce1f51637af285edc0c710e9cb7702231c0a91b527b721eaddc1
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (plugin)

Chamadas de voz para o OpenClaw por meio de um plugin. Oferece suporte a notificações de saída e
conversas de múltiplos turnos com políticas de entrada.

Provedores atuais:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + transferência XML + reconhecimento de fala GetInput)
- `mock` (desenvolvimento/sem rede)

Modelo mental rápido:

- Instale o plugin
- Reinicie o Gateway
- Configure em `plugins.entries.voice-call.config`
- Use `openclaw voicecall ...` ou a ferramenta `voice_call`

## Onde ele é executado (local vs remoto)

O plugin Voice Call é executado **dentro do processo do Gateway**.

Se você usa um Gateway remoto, instale/configure o plugin na **máquina que executa o Gateway** e depois reinicie o Gateway para carregá-lo.

## Instalação

### Opção A: instalar pelo npm (recomendado)

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

Defina a config em `plugins.entries.voice-call.config`:

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
            // Chave pública do webhook Telnyx do Telnyx Mission Control Portal
            // (string Base64; também pode ser definida via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Servidor de webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Segurança do webhook (recomendado para túneis/proxies)
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
            provider: "openai", // opcional; primeiro provedor de transcrição em tempo real registrado quando não definido
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

- Twilio/Telnyx exigem uma URL de webhook **acessível publicamente**.
- Plivo exige uma URL de webhook **acessível publicamente**.
- `mock` é um provedor local para desenvolvimento (sem chamadas de rede).
- Se configs antigas ainda usam `provider: "log"`, `twilio.from` ou chaves OpenAI legadas de `streaming.*`, execute `openclaw doctor --fix` para reescrevê-las.
- Telnyx exige `telnyx.publicKey` (ou `TELNYX_PUBLIC_KEY`) a menos que `skipSignatureVerification` seja true.
- `skipSignatureVerification` é apenas para testes locais.
- Se você usar o plano gratuito do ngrok, defina `publicUrl` com a URL exata do ngrok; a verificação de assinatura é sempre aplicada.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` permite webhooks do Twilio com assinaturas inválidas **somente** quando `tunnel.provider="ngrok"` e `serve.bind` é loopback (agente local do ngrok). Use apenas para desenvolvimento local.
- URLs do plano gratuito do ngrok podem mudar ou adicionar comportamento intersticial; se `publicUrl` mudar, as assinaturas do Twilio falharão. Para produção, prefira um domínio estável ou Tailscale funnel.
- Padrões de segurança do streaming:
  - `streaming.preStartTimeoutMs` fecha sockets que nunca enviam um frame `start` válido.
- `streaming.maxPendingConnections` limita o total de sockets pré-início não autenticados.
- `streaming.maxPendingConnectionsPerIp` limita os sockets pré-início não autenticados por IP de origem.
- `streaming.maxConnections` limita o total de sockets abertos de fluxo de mídia (pendentes + ativos).
- O fallback de runtime ainda aceita essas chaves antigas de voice-call por enquanto, mas o caminho de regravação é `openclaw doctor --fix` e o shim de compatibilidade é temporário.

## Transcrição por streaming

`streaming` seleciona um provedor de transcrição em tempo real para áudio de chamada ao vivo.

Comportamento atual do runtime:

- `streaming.provider` é opcional. Quando não definido, o Voice Call usa o primeiro
  provedor de transcrição em tempo real registrado.
- Hoje, o provedor empacotado é o OpenAI, registrado pelo plugin empacotado `openai`.
- A config bruta pertencente ao provedor fica em `streaming.providers.<providerId>`.
- Se `streaming.provider` apontar para um provedor não registrado, ou se nenhum provedor
  de transcrição em tempo real estiver registrado, o Voice Call registra um aviso e
  ignora o streaming de mídia em vez de falhar o plugin inteiro.

Padrões de transcrição por streaming do OpenAI:

- Chave de API: `streaming.providers.openai.apiKey` ou `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

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

As chaves legadas ainda são migradas automaticamente por `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Limpador de chamadas obsoletas

Use `staleCallReaperSeconds` para encerrar chamadas que nunca recebem um webhook terminal
(por exemplo, chamadas em modo notify que nunca são concluídas). O padrão é `0`
(desativado).

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

## Segurança de webhook

Quando um proxy ou túnel fica na frente do Gateway, o plugin reconstrói a
URL pública para verificação de assinatura. Essas opções controlam em quais headers
encaminhados confiar.

`webhookSecurity.allowedHosts` cria uma allowlist de hosts a partir de headers de encaminhamento.

`webhookSecurity.trustForwardingHeaders` confia em headers encaminhados sem uma allowlist.

`webhookSecurity.trustedProxyIPs` só confia em headers encaminhados quando o IP remoto
da solicitação corresponde à lista.

A proteção contra replay de webhook está ativada para Twilio e Plivo. Solicitações de webhook
repetidas e válidas são reconhecidas, mas ignoradas quanto a efeitos colaterais.

Os turnos de conversa do Twilio incluem um token por turno nos callbacks `<Gather>`, para que
callbacks de fala obsoletos/repetidos não possam satisfazer um turno de transcrição pendente mais novo.

Solicitações de webhook não autenticadas são rejeitadas antes da leitura do corpo quando
faltam os headers de assinatura exigidos pelo provedor.

O webhook de voice-call usa o perfil compartilhado de corpo pré-auth (64 KB / 5 segundos)
mais um limite por IP de solicitações em andamento antes da verificação de assinatura.

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

O Voice Call usa a configuração principal `messages.tts` para
fala por streaming nas chamadas. Você pode substituí-la na config do plugin com o
**mesmo formato** — ela é mesclada profundamente com `messages.tts`.

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

- Chaves legadas `tts.<provider>` dentro da config do plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) são migradas automaticamente para `tts.providers.<provider>` no carregamento. Prefira o formato `providers` na config versionada.
- **A fala da Microsoft é ignorada para chamadas de voz** (o áudio de telefonia precisa de PCM; o transporte atual da Microsoft não expõe saída PCM de telefonia).
- O TTS principal é usado quando o streaming de mídia do Twilio está ativado; caso contrário, as chamadas recorrem às vozes nativas do provedor.
- Se um stream de mídia do Twilio já estiver ativo, o Voice Call não recorre a `<Say>` do TwiML. Se o TTS de telefonia não estiver disponível nesse estado, a solicitação de reprodução falhará em vez de misturar dois caminhos de reprodução.
- Quando o TTS de telefonia recorre a um provedor secundário, o Voice Call registra um aviso com a cadeia de provedores (`from`, `to`, `attempts`) para depuração.

### Mais exemplos

Use apenas o TTS principal (sem substituição):

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

Substitua por ElevenLabs apenas para chamadas (mantendo o padrão principal em outros contextos):

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

Substitua apenas o model do OpenAI para chamadas (exemplo de deep-merge):

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

A política de entrada tem o padrão `disabled`. Para ativar chamadas de entrada, defina:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` é uma filtragem de ID do chamador de baixa garantia. O plugin
normaliza o valor `From` fornecido pelo provedor e o compara com `allowFrom`.
A verificação de webhook autentica a entrega do provedor e a integridade do payload, mas
não prova a posse do número do chamador PSTN/VoIP. Trate `allowFrom` como
filtragem de ID do chamador, não como identidade forte do chamador.

As respostas automáticas usam o sistema de agent. Ajuste com:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Contrato de saída falada

Para respostas automáticas, o Voice Call acrescenta um contrato estrito de saída falada ao prompt do sistema:

- `{"spoken":"..."}`

Em seguida, o Voice Call extrai o texto falado de forma defensiva:

- Ignora payloads marcados como conteúdo de raciocínio/erro.
- Faz parsing de JSON direto, JSON delimitado por cercas ou chaves `"spoken"` inline.
- Recorre a texto simples e remove parágrafos iniciais que provavelmente sejam de planejamento/meta.

Isso mantém a reprodução falada focada no texto voltado ao chamador e evita vazar texto de planejamento no áudio.

### Comportamento de inicialização da conversa

Para chamadas `conversation` de saída, o tratamento da primeira mensagem está vinculado ao estado de reprodução ao vivo:

- A limpeza da fila por barge-in e a resposta automática são suprimidas apenas enquanto a saudação inicial estiver sendo falada ativamente.
- Se a reprodução inicial falhar, a chamada volta para `listening` e a mensagem inicial permanece na fila para nova tentativa.
- A reprodução inicial para streaming do Twilio começa na conexão do stream sem atraso extra.

### Tolerância para desconexão de stream do Twilio

Quando um stream de mídia do Twilio é desconectado, o Voice Call espera `2000ms` antes de encerrar automaticamente a chamada:

- Se o stream se reconectar durante essa janela, o encerramento automático é cancelado.
- Se nenhum stream for registrado novamente após o período de tolerância, a chamada será encerrada para evitar chamadas ativas travadas.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias para call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # resume a latência por turno a partir dos logs
openclaw voicecall expose --mode funnel
```

`latency` lê `calls.jsonl` do caminho de armazenamento padrão de voice-call. Use
`--file <path>` para apontar para um log diferente e `--last <n>` para limitar a análise
aos últimos N registros (padrão 200). A saída inclui p50/p90/p99 para
latência por turno e tempos de espera de escuta.

## Ferramenta do agent

Nome da ferramenta: `voice_call`

Ações:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `end_call` (callId)
- `get_status` (callId)

Este repositório inclui uma Skill correspondente em `skills/voice-call/SKILL.md`.

## RPC do Gateway

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
