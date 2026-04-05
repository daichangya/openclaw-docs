---
read_when:
    - Executando ou depurando o processo do gateway
summary: Runbook para o serviço Gateway, ciclo de vida e operações
title: Runbook do Gateway
x-i18n:
    generated_at: "2026-04-05T12:41:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ec17674370de4e171779389c83580317308a4f07ebf335ad236a47238af18e1
    source_path: gateway/index.md
    workflow: 15
---

# Runbook do Gateway

Use esta página para a inicialização no primeiro dia e operações do segundo dia do serviço Gateway.

<CardGroup cols={2}>
  <Card title="Solução de problemas avançada" icon="siren" href="/gateway/troubleshooting">
    Diagnóstico orientado por sintomas com sequências exatas de comandos e assinaturas de log.
  </Card>
  <Card title="Configuração" icon="sliders" href="/gateway/configuration">
    Guia de configuração orientado por tarefas + referência completa de configuração.
  </Card>
  <Card title="Gerenciamento de segredos" icon="key-round" href="/gateway/secrets">
    Contrato de SecretRef, comportamento de snapshot de runtime e operações de migração/recarga.
  </Card>
  <Card title="Contrato do plano de segredos" icon="shield-check" href="/gateway/secrets-plan-contract">
    Regras exatas de destino/caminho de `secrets apply` e comportamento de perfil de autenticação somente com refs.
  </Card>
</CardGroup>

## Inicialização local em 5 minutos

<Steps>
  <Step title="Inicie o Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Verifique a integridade do serviço">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Linha de base saudável: `Runtime: running` e `RPC probe: ok`.

  </Step>

  <Step title="Valide a prontidão dos canais">

```bash
openclaw channels status --probe
```

Com um gateway acessível, isso executa sondagens ativas por conta e auditorias opcionais.
Se o gateway estiver inacessível, a CLI faz fallback para resumos de canal baseados apenas na configuração
em vez da saída de sondagem ativa.

  </Step>
</Steps>

<Note>
A recarga de configuração do Gateway monitora o caminho ativo do arquivo de configuração (resolvido a partir dos padrões de perfil/estado ou de `OPENCLAW_CONFIG_PATH` quando definido).
O modo padrão é `gateway.reload.mode="hybrid"`.
Após o primeiro carregamento bem-sucedido, o processo em execução atende o snapshot ativo de configuração em memória; uma recarga bem-sucedida troca esse snapshot de forma atômica.
</Note>

## Modelo de runtime

- Um processo sempre ativo para roteamento, plano de controle e conexões de canal.
- Uma única porta multiplexada para:
  - controle/RPC por WebSocket
  - APIs HTTP, compatíveis com OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - interface de Control e hooks
- Modo de bind padrão: `loopback`.
- A autenticação é obrigatória por padrão. Configurações de segredo compartilhado usam
  `gateway.auth.token` / `gateway.auth.password` (ou
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), e configurações de proxy reverso
  sem loopback podem usar `gateway.auth.mode: "trusted-proxy"`.

## Endpoints compatíveis com OpenAI

A superfície de compatibilidade de maior impacto do OpenClaw agora é:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Por que esse conjunto importa:

- A maioria das integrações com Open WebUI, LobeChat e LibreChat faz sondagem de `/v1/models` primeiro.
- Muitos pipelines de RAG e memória esperam `/v1/embeddings`.
- Clientes nativos de agente estão preferindo cada vez mais `/v1/responses`.

Observação de planejamento:

- `/v1/models` é orientado a agente: ele retorna `openclaw`, `openclaw/default` e `openclaw/<agentId>`.
- `openclaw/default` é o alias estável que sempre mapeia para o agente padrão configurado.
- Use `x-openclaw-model` quando quiser uma substituição de provedor/modelo de backend; caso contrário, a configuração normal de modelo e embeddings do agente selecionado continua no controle.

Todos eles são executados na porta principal do Gateway e usam o mesmo limite confiável de autenticação de operador que o restante da API HTTP do Gateway.

### Precedência de porta e bind

| Setting      | Resolution order                                              |
| ------------ | ------------------------------------------------------------- |
| Gateway port | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bind mode    | CLI/override → `gateway.bind` → `loopback`                    |

### Modos de recarga a quente

| `gateway.reload.mode` | Behavior                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | Sem recarga de configuração                |
| `hot`                 | Aplica apenas alterações seguras a quente  |
| `restart`             | Reinicia em alterações que exigem recarga  |
| `hybrid` (padrão)     | Aplica a quente quando seguro, reinicia quando necessário |

## Conjunto de comandos do operador

```bash
openclaw gateway status
openclaw gateway status --deep   # adds a system-level service scan
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` é para descoberta extra de serviço (LaunchDaemons/unidades systemd do sistema
/schtasks), não para uma sondagem de integridade RPC mais profunda.

## Múltiplos gateways (mesmo host)

A maioria das instalações deve executar um gateway por máquina. Um único gateway pode hospedar múltiplos
agentes e canais.

Você só precisa de múltiplos gateways quando quiser isolamento intencional ou um bot de resgate.

Verificações úteis:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

O que esperar:

- `gateway status --deep` pode relatar `Other gateway-like services detected (best effort)`
  e imprimir dicas de limpeza quando instalações antigas de launchd/systemd/schtasks ainda estiverem presentes.
- `gateway probe` pode avisar sobre `multiple reachable gateways` quando mais de um destino
  responder.
- Se isso for intencional, isole portas, configuração/estado e raízes de workspace por gateway.

Configuração detalhada: [/gateway/multiple-gateways](/gateway/multiple-gateways).

## Acesso remoto

Preferencial: Tailscale/VPN.
Fallback: túnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Depois conecte os clientes a `ws://127.0.0.1:18789` localmente.

<Warning>
Túneis SSH não ignoram a autenticação do gateway. Para autenticação com segredo compartilhado, os clientes ainda
devem enviar `token`/`password` mesmo pelo túnel. Para modos com identidade,
a solicitação ainda precisa satisfazer esse caminho de autenticação.
</Warning>

Consulte: [Gateway remoto](/gateway/remote), [Autenticação](/gateway/authentication), [Tailscale](/gateway/tailscale).

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

Os rótulos de LaunchAgent são `ai.openclaw.gateway` (padrão) ou `ai.openclaw.<profile>` (perfil nomeado). `openclaw doctor` audita e repara desvio de configuração do serviço.

  </Tab>

  <Tab title="Linux (systemd do usuário)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Para persistência após logout, ative lingering:

```bash
sudo loginctl enable-linger <user>
```

Exemplo manual de unidade de usuário quando você precisar de um caminho de instalação personalizado:

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
for negada, o OpenClaw faz fallback para um iniciador por usuário na pasta Startup
que aponta para `gateway.cmd` dentro do diretório de estado.

  </Tab>

  <Tab title="Linux (serviço de sistema)">

Use uma unidade de sistema para hosts multiusuário/sempre ativos.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Use o mesmo corpo de serviço da unidade do usuário, mas instale-o em
`/etc/systemd/system/openclaw-gateway[-<profile>].service` e ajuste
`ExecStart=` se seu binário `openclaw` estiver em outro local.

  </Tab>
</Tabs>

## Múltiplos gateways em um host

A maioria das configurações deve executar **um** Gateway.
Use múltiplos apenas para isolamento/redundância estritos (por exemplo, um perfil de resgate).

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

Consulte: [Múltiplos gateways](/gateway/multiple-gateways).

### Caminho rápido do perfil de desenvolvimento

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Os padrões incluem estado/configuração isolados e porta base do gateway `19001`.

## Referência rápida de protocolo (visão do operador)

- O primeiro frame do cliente deve ser `connect`.
- O Gateway retorna um snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limites/política).
- `hello-ok.features.methods` / `events` são uma lista conservadora de descoberta, não
  um despejo gerado de todos os caminhos auxiliares chamáveis.
- Solicitações: `req(method, params)` → `res(ok/payload|error)`.
- Eventos comuns incluem `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, eventos do ciclo de vida de pareamento/aprovação e `shutdown`.

Execuções de agente têm duas etapas:

1. Confirmação imediata de aceite (`status:"accepted"`)
2. Resposta final de conclusão (`status:"ok"|"error"`), com eventos `agent` transmitidos entre elas.

Consulte a documentação completa do protocolo: [Protocolo do Gateway](/gateway/protocol).

## Verificações operacionais

### Disponibilidade

- Abra o WS e envie `connect`.
- Espere uma resposta `hello-ok` com snapshot.

### Prontidão

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Recuperação de lacunas

Eventos não são reproduzidos. Em caso de lacunas na sequência, atualize o estado (`health`, `system-presence`) antes de continuar.

## Assinaturas comuns de falha

| Signature                                                      | Likely issue                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Bind sem loopback sem um caminho válido de autenticação do gateway              |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflito de porta                                                               |
| `Gateway start blocked: set gateway.mode=local`                | Configuração definida para modo remoto, ou carimbo de modo local ausente em uma configuração danificada |
| `unauthorized` during connect                                  | Incompatibilidade de autenticação entre cliente e gateway                       |

Para sequências completas de diagnóstico, use [Solução de problemas do Gateway](/gateway/troubleshooting).

## Garantias de segurança

- Clientes do protocolo Gateway falham rapidamente quando o Gateway está indisponível (sem fallback implícito para canal direto).
- Primeiros frames inválidos/não `connect` são rejeitados e a conexão é fechada.
- O desligamento gracioso emite o evento `shutdown` antes do fechamento do socket.

---

Relacionado:

- [Solução de problemas](/gateway/troubleshooting)
- [Processo em segundo plano](/gateway/background-process)
- [Configuração](/gateway/configuration)
- [Integridade](/gateway/health)
- [Doctor](/gateway/doctor)
- [Autenticação](/gateway/authentication)
