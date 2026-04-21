---
read_when:
    - Executando ou depurando o processo do Gateway
summary: Runbook para o serviço Gateway, ciclo de vida e operações
title: Runbook do Gateway
x-i18n:
    generated_at: "2026-04-21T05:36:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1004cdd43b1db6794f3ca83da38dbdb231a1976329d9d6d851e2b02405278d8
    source_path: gateway/index.md
    workflow: 15
---

# Runbook do Gateway

Use esta página para a inicialização no dia 1 e operações no dia 2 do serviço Gateway.

<CardGroup cols={2}>
  <Card title="Solução de problemas avançada" icon="siren" href="/pt-BR/gateway/troubleshooting">
    Diagnósticos orientados por sintomas com sequências exatas de comandos e assinaturas de log.
  </Card>
  <Card title="Configuração" icon="sliders" href="/pt-BR/gateway/configuration">
    Guia de configuração orientado a tarefas + referência completa de configuração.
  </Card>
  <Card title="Gerenciamento de segredos" icon="key-round" href="/pt-BR/gateway/secrets">
    Contrato SecretRef, comportamento de snapshot em tempo de execução e operações de migração/reload.
  </Card>
  <Card title="Contrato do plano de segredos" icon="shield-check" href="/pt-BR/gateway/secrets-plan-contract">
    Regras exatas de alvo/caminho de `secrets apply` e comportamento de perfil de autenticação somente por referência.
  </Card>
</CardGroup>

## Inicialização local em 5 minutos

<Steps>
  <Step title="Inicie o Gateway">

```bash
openclaw gateway --port 18789
# debug/trace espelhados para stdio
openclaw gateway --port 18789 --verbose
# encerra à força o listener na porta selecionada e inicia
openclaw gateway --force
```

  </Step>

  <Step title="Verifique a integridade do serviço">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Baseline saudável: `Runtime: running`, `Connectivity probe: ok` e `Capability: ...` correspondente ao que você espera. Use `openclaw gateway status --require-rpc` quando precisar de prova de RPC com escopo de leitura, não apenas de alcançabilidade.

  </Step>

  <Step title="Valide a prontidão do canal">

```bash
openclaw channels status --probe
```

Com um gateway alcançável, isso executa probes de canal ao vivo por conta e auditorias opcionais.
Se o gateway estiver inalcançável, a CLI recua para resumos de canal apenas com base na configuração,
em vez de saída de probe ao vivo.

  </Step>
</Steps>

<Note>
O reload da configuração do Gateway observa o caminho do arquivo de configuração ativo (resolvido a partir dos padrões de perfil/estado, ou `OPENCLAW_CONFIG_PATH` quando definido).
O modo padrão é `gateway.reload.mode="hybrid"`.
Após o primeiro carregamento bem-sucedido, o processo em execução serve o snapshot de configuração ativo em memória; um reload bem-sucedido troca esse snapshot atomicamente.
</Note>

## Modelo de runtime

- Um processo sempre ativo para roteamento, plano de controle e conexões de canal.
- Uma única porta multiplexada para:
  - controle/RPC via WebSocket
  - APIs HTTP, compatíveis com OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - UI de Controle e hooks
- Modo de bind padrão: `loopback`.
- A autenticação é exigida por padrão. Configurações com segredo compartilhado usam
  `gateway.auth.token` / `gateway.auth.password` (ou
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), e configurações com proxy reverso fora de loopback
  podem usar `gateway.auth.mode: "trusted-proxy"`.

## Endpoints compatíveis com OpenAI

A superfície de compatibilidade de maior impacto do OpenClaw agora é:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Por que esse conjunto importa:

- A maioria das integrações com Open WebUI, LobeChat e LibreChat primeiro consulta `/v1/models`.
- Muitos pipelines de RAG e memória esperam `/v1/embeddings`.
- Clientes nativos de agente estão preferindo cada vez mais `/v1/responses`.

Nota de planejamento:

- `/v1/models` é orientado a agente: retorna `openclaw`, `openclaw/default` e `openclaw/<agentId>`.
- `openclaw/default` é o alias estável que sempre mapeia para o agente padrão configurado.
- Use `x-openclaw-model` quando quiser uma substituição de provider/modelo de backend; caso contrário, a configuração normal de modelo e embeddings do agente selecionado permanece no controle.

Todos eles são executados na porta principal do Gateway e usam o mesmo limite de autenticação de operador confiável que o restante da API HTTP do Gateway.

### Precedência de porta e bind

| Configuração | Ordem de resolução                                            |
| ------------ | ------------------------------------------------------------- |
| Porta do Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Modo de bind | CLI/override → `gateway.bind` → `loopback`                    |

### Modos de hot reload

| `gateway.reload.mode` | Comportamento                           |
| --------------------- | --------------------------------------- |
| `off`                 | Sem reload de configuração              |
| `hot`                 | Aplicar apenas alterações seguras para hot reload |
| `restart`             | Reiniciar em alterações que exigem reload |
| `hybrid` (padrão)     | Aplicar hot reload quando seguro, reiniciar quando necessário |

## Conjunto de comandos do operador

```bash
openclaw gateway status
openclaw gateway status --deep   # adiciona uma varredura de serviço em nível de sistema
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` serve para descoberta extra de serviços (LaunchDaemons/unidades systemd do sistema
/schtasks), não para um probe de integridade RPC mais profundo.

## Múltiplos gateways (mesmo host)

A maioria das instalações deve executar um gateway por máquina. Um único gateway pode hospedar vários
agentes e canais.

Você só precisa de vários gateways quando quiser intencionalmente isolamento ou um bot de resgate.

Verificações úteis:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

O que esperar:

- `gateway status --deep` pode informar `Other gateway-like services detected (best effort)`
  e imprimir dicas de limpeza quando ainda existirem instalações antigas de launchd/systemd/schtasks.
- `gateway probe` pode avisar sobre `multiple reachable gateways` quando mais de um alvo
  responder.
- Se isso for intencional, isole portas, configuração/estado e raízes de workspace por gateway.

Configuração detalhada: [/gateway/multiple-gateways](/pt-BR/gateway/multiple-gateways).

## Acesso remoto

Preferido: Tailscale/VPN.
Fallback: túnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Depois, conecte os clientes localmente a `ws://127.0.0.1:18789`.

<Warning>
Túneis SSH não contornam a autenticação do gateway. Para autenticação com segredo compartilhado, os clientes ainda
devem enviar `token`/`password` mesmo pelo túnel. Para modos com identidade,
a solicitação ainda precisa satisfazer esse caminho de autenticação.
</Warning>

Veja: [Gateway remoto](/pt-BR/gateway/remote), [Autenticação](/pt-BR/gateway/authentication), [Tailscale](/pt-BR/gateway/tailscale).

## Supervisão e ciclo de vida do serviço

Use execuções supervisionadas para confiabilidade semelhante à de produção.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Os rótulos de LaunchAgent são `ai.openclaw.gateway` (padrão) ou `ai.openclaw.<profile>` (perfil nomeado). `openclaw doctor` audita e corrige desvios de configuração do serviço.

  </Tab>

  <Tab title="Linux (systemd de usuário)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Para persistência após logout, ative lingering:

```bash
sudo loginctl enable-linger <user>
```

Exemplo manual de unidade de usuário quando você precisa de um caminho de instalação personalizado:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (nativo)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

A inicialização gerenciada nativa no Windows usa uma Scheduled Task chamada `OpenClaw Gateway`
(ou `OpenClaw Gateway (<profile>)` para perfis nomeados). Se a criação da Scheduled Task
for negada, o OpenClaw recua para um iniciador por usuário na pasta de Inicialização
que aponta para `gateway.cmd` dentro do diretório de estado.

  </Tab>

  <Tab title="Linux (serviço do sistema)">

Use uma unidade de sistema para hosts multiusuário/sempre ativos.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Use o mesmo corpo de serviço da unidade de usuário, mas instale-o em
`/etc/systemd/system/openclaw-gateway[-<profile>].service` e ajuste
`ExecStart=` se o seu binário `openclaw` estiver em outro local.

  </Tab>
</Tabs>

## Múltiplos gateways em um host

A maioria das configurações deve executar **um** Gateway.
Use vários apenas para isolamento/redundância estritos (por exemplo, um perfil de resgate).

Checklist por instância:

- `gateway.port` exclusivo
- `OPENCLAW_CONFIG_PATH` exclusivo
- `OPENCLAW_STATE_DIR` exclusivo
- `agents.defaults.workspace` exclusivo

Exemplo:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Veja: [Múltiplos gateways](/pt-BR/gateway/multiple-gateways).

### Caminho rápido para perfil de desenvolvimento

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Os padrões incluem estado/configuração isolados e porta base do gateway `19001`.

## Referência rápida do protocolo (visão do operador)

- O primeiro frame do cliente deve ser `connect`.
- O Gateway retorna o snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- `hello-ok.features.methods` / `events` são uma lista conservadora de descoberta, não
  um dump gerado de todas as rotas auxiliares chamáveis.
- Requisições: `req(method, params)` → `res(ok/payload|error)`.
- Eventos comuns incluem `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, eventos de ciclo de vida de pareamento/aprovação e `shutdown`.

As execuções do agente têm dois estágios:

1. Ack imediato de aceitação (`status:"accepted"`)
2. Resposta final de conclusão (`status:"ok"|"error"`), com eventos `agent` em streaming no meio.

Veja a documentação completa do protocolo: [Protocolo do Gateway](/pt-BR/gateway/protocol).

## Verificações operacionais

### Liveness

- Abra um WS e envie `connect`.
- Espere uma resposta `hello-ok` com snapshot.

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Recuperação de lacunas

Eventos não são reproduzidos novamente. Em lacunas de sequência, atualize o estado (`health`, `system-presence`) antes de continuar.

## Assinaturas comuns de falha

| Assinatura                                                    | Problema provável                                                                |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | Bind fora de loopback sem um caminho de autenticação válido do gateway          |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflito de porta                                                               |
| `Gateway start blocked: set gateway.mode=local`               | Configuração em modo remoto, ou carimbo de modo local ausente em uma configuração danificada |
| `unauthorized` during connect                                 | Incompatibilidade de autenticação entre cliente e gateway                       |

Para sequências completas de diagnóstico, use [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting).

## Garantias de segurança

- Clientes do protocolo Gateway falham rapidamente quando o Gateway está indisponível (sem fallback implícito para canal direto).
- First frames inválidos/não `connect` são rejeitados e a conexão é fechada.
- O encerramento gracioso emite o evento `shutdown` antes do fechamento do socket.

---

Relacionado:

- [Solução de problemas](/pt-BR/gateway/troubleshooting)
- [Processo em segundo plano](/pt-BR/gateway/background-process)
- [Configuração](/pt-BR/gateway/configuration)
- [Health](/pt-BR/gateway/health)
- [Doctor](/pt-BR/gateway/doctor)
- [Autenticação](/pt-BR/gateway/authentication)
