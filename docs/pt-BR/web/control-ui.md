---
read_when:
    - Você quer operar o Gateway a partir de um navegador
    - Você quer acesso via Tailnet sem túneis SSH
summary: Interface de controle baseada em navegador para o Gateway (chat, nodes, configuração)
title: Interface de controle
x-i18n:
    generated_at: "2026-04-24T09:01:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: c84a74e20d6c8829168025830ff4ec8f650f10f72fcaed7c8d2f5d92ab98d616
    source_path: web/control-ui.md
    workflow: 15
---

A Interface de controle é um pequeno app de página única em **Vite + Lit** servido pelo Gateway:

- padrão: `http://<host>:18789/`
- prefixo opcional: defina `gateway.controlUi.basePath` (por exemplo `/openclaw`)

Ela se comunica **diretamente com o WebSocket do Gateway** na mesma porta.

## Abertura rápida (local)

Se o Gateway estiver em execução no mesmo computador, abra:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Se a página não carregar, inicie o Gateway primeiro: `openclaw gateway`.

A autenticação é fornecida durante o handshake do WebSocket via:

- `connect.params.auth.token`
- `connect.params.auth.password`
- cabeçalhos de identidade do Tailscale Serve quando `gateway.auth.allowTailscale: true`
- cabeçalhos de identidade de proxy confiável quando `gateway.auth.mode: "trusted-proxy"`

O painel de configurações do dashboard mantém um token para a sessão atual da aba do navegador
e a URL do Gateway selecionada; senhas não são persistidas. A integração normalmente
gera um token do Gateway para autenticação por segredo compartilhado na primeira conexão, mas a autenticação
por senha também funciona quando `gateway.auth.mode` é `"password"`.

## Emparelhamento de dispositivo (primeira conexão)

Quando você se conecta à Interface de controle a partir de um novo navegador ou dispositivo, o Gateway
exige uma **aprovação única de emparelhamento** — mesmo que você esteja na mesma Tailnet
com `gateway.auth.allowTailscale: true`. Esta é uma medida de segurança para evitar
acesso não autorizado.

**O que você verá:** "disconnected (1008): pairing required"

**Para aprovar o dispositivo:**

```bash
# Listar solicitações pendentes
openclaw devices list

# Aprovar por ID da solicitação
openclaw devices approve <requestId>
```

Se o navegador tentar novamente o emparelhamento com detalhes de autenticação alterados (role/scopes/public
key), a solicitação pendente anterior será substituída e um novo `requestId` será
criado. Execute `openclaw devices list` novamente antes da aprovação.

Se o navegador já estiver emparelhado e você mudar de acesso somente leitura para
acesso de escrita/administração, isso será tratado como um upgrade de aprovação, não uma
reconexão silenciosa. O OpenClaw mantém a aprovação antiga ativa, bloqueia a reconexão
mais ampla e pede que você aprove explicitamente o novo conjunto de escopos.

Uma vez aprovado, o dispositivo é lembrado e não exigirá nova aprovação, a menos
que você o revogue com `openclaw devices revoke --device <id> --role <role>`. Consulte
[CLI de dispositivos](/pt-BR/cli/devices) para rotação e revogação de token.

**Observações:**

- Conexões diretas locais de navegador por loopback (`127.0.0.1` / `localhost`) são
  aprovadas automaticamente.
- Conexões de navegador por tailnet e LAN ainda exigem aprovação explícita, mesmo quando
  se originam da mesma máquina.
- Cada perfil de navegador gera um ID de dispositivo exclusivo, então trocar de navegador ou
  limpar os dados do navegador exigirá novo emparelhamento.

## Identidade pessoal (local do navegador)

A Interface de controle oferece suporte a uma identidade pessoal por navegador (nome de exibição e
avatar) anexada às mensagens de saída para atribuição em sessões compartilhadas. Ela
fica no armazenamento do navegador, é limitada ao perfil atual do navegador e não é
sincronizada com outros dispositivos nem persistida no servidor além dos metadados normais
de autoria nas mensagens que você realmente envia. Limpar dados do site ou
trocar de navegador a redefine para vazio.

## Endpoint de configuração de runtime

A Interface de controle busca suas configurações de runtime em
`/__openclaw/control-ui-config.json`. Esse endpoint é protegido pela mesma
autenticação do Gateway usada no restante da superfície HTTP: navegadores não autenticados não
podem buscá-lo, e uma busca bem-sucedida exige um token/senha válida do Gateway,
identidade do Tailscale Serve ou identidade de proxy confiável.

## Suporte a idioma

A Interface de controle pode se localizar na primeira carga com base no locale do seu navegador.
Para alterá-lo depois, abra **Overview -> Gateway Access -> Language**. O
seletor de locale fica no cartão Gateway Access, não em Appearance.

- Locales compatíveis: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Traduções que não estão em inglês são carregadas sob demanda no navegador.
- O locale selecionado é salvo no armazenamento do navegador e reutilizado em visitas futuras.
- Chaves de tradução ausentes usam fallback para inglês.

## O que ela pode fazer (hoje)

- Conversar com o modelo via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Falar diretamente com OpenAI Realtime a partir do navegador via WebRTC. O Gateway
  gera um segredo de cliente Realtime de curta duração com `talk.realtime.session`; o
  navegador envia áudio do microfone diretamente para a OpenAI e retransmite
  chamadas de ferramenta `openclaw_agent_consult` de volta por `chat.send` para o
  modelo maior configurado no OpenClaw.
- Exibir em streaming chamadas de ferramentas + cartões com saída de ferramenta ao vivo no Chat (eventos do agente)
- Canais: status, login por QR e configuração por canal para canais embutidos e de Plugins incluídos/externos (`channels.status`, `web.login.*`, `config.patch`)
- Instâncias: lista de presença + atualização (`system-presence`)
- Sessões: lista + substituições por sessão de modelo/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
- Dreams: status do Dreaming, alternância ativar/desativar e leitor do Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Tarefas Cron: listar/adicionar/editar/executar/ativar/desativar + histórico de execução (`cron.*`)
- Skills: status, ativar/desativar, instalar, atualizações de chave de API (`skills.*`)
- Nodes: lista + capacidades (`node.list`)
- Aprovações de exec: editar listas de permissões do Gateway ou node + política de perguntar para `exec host=gateway/node` (`exec.approvals.*`)
- Configuração: ver/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Configuração: aplicar + reiniciar com validação (`config.apply`) e despertar a última sessão ativa
- Gravações de configuração incluem proteção por hash base para evitar sobrescrever edições concorrentes
- Gravações de configuração (`config.set`/`config.apply`/`config.patch`) também fazem validação prévia da resolução ativa de SecretRef para refs no payload de configuração enviado; refs ativos enviados que não forem resolvidos são rejeitados antes da gravação
- Schema de configuração + renderização de formulários (`config.schema` / `config.schema.lookup`,
  incluindo `title` / `description` dos campos, dicas de UI correspondentes, resumos
  imediatos de filhos, metadados de documentação em nós aninhados de objeto/wildcard/array/composition,
  além de schemas de Plugin + canal quando disponíveis); o editor Raw JSON fica
  disponível apenas quando o snapshot tem um round-trip bruto seguro
- Se um snapshot não puder fazer round-trip seguro de texto bruto, a Interface de controle força o modo Form e desativa o modo Raw para esse snapshot
- O editor Raw JSON em "Reset to saved" preserva a forma criada em modo bruto (formatação, comentários, layout de `$include`) em vez de renderizar novamente um snapshot achatado, para que edições externas sobrevivam a um reset quando o snapshot puder fazer round-trip seguro
- Valores estruturados de objeto SecretRef são renderizados como somente leitura em entradas de texto de formulário para evitar corrupção acidental de objeto para string
- Depuração: snapshots de status/health/models + log de eventos + chamadas RPC manuais (`status`, `health`, `models.list`)
- Logs: tail ao vivo dos logs de arquivo do Gateway com filtro/exportação (`logs.tail`)
- Atualização: executar uma atualização por pacote/git + reinício (`update.run`) com relatório de reinício

Observações sobre o painel de tarefas Cron:

- Para tarefas isoladas, a entrega usa por padrão anunciar resumo. Você pode mudar para none se quiser execuções somente internas.
- Os campos de canal/destino aparecem quando announce é selecionado.
- O modo Webhook usa `delivery.mode = "webhook"` com `delivery.to` definido como uma URL de Webhook HTTP(S) válida.
- Para tarefas da sessão principal, os modos de entrega webhook e none estão disponíveis.
- Os controles de edição avançada incluem excluir após executar, limpar substituição de agente, opções exatas/escalonadas de cron,
  substituições de modelo/thinking do agente e alternâncias de entrega em regime de melhor esforço.
- A validação do formulário é inline com erros por campo; valores inválidos desativam o botão de salvar até serem corrigidos.
- Defina `cron.webhookToken` para enviar um token bearer dedicado; se omitido, o Webhook é enviado sem cabeçalho de autenticação.
- Fallback obsoleto: tarefas legadas armazenadas com `notify: true` ainda podem usar `cron.webhook` até serem migradas.

## Comportamento do chat

- `chat.send` é **não bloqueante**: ele confirma imediatamente com `{ runId, status: "started" }` e a resposta é transmitida por eventos `chat`.
- Reenviar com a mesma `idempotencyKey` retorna `{ status: "in_flight" }` enquanto estiver em execução e `{ status: "ok" }` após a conclusão.
- Respostas de `chat.history` têm tamanho limitado para segurança da UI. Quando entradas da transcrição são grandes demais, o Gateway pode truncar campos longos de texto, omitir blocos pesados de metadados e substituir mensagens excessivamente grandes por um placeholder (`[chat.history omitted: message too large]`).
- Imagens geradas pelo assistente são persistidas como referências de mídia gerenciadas e servidas novamente por URLs de mídia autenticadas do Gateway, para que recarregamentos não dependam de payloads brutos de imagem em base64 permanecerem na resposta do histórico do chat.
- `chat.history` também remove tags inline apenas de exibição do texto visível do assistente (por exemplo `[[reply_to_*]]` e `[[audio_as_voice]]`), payloads XML em texto simples de chamadas de ferramenta (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamadas de ferramenta), além de tokens de controle de modelo vazados em ASCII/largura total, e omite entradas do assistente cujo texto visível completo seja apenas o token silencioso exato `NO_REPLY` / `no_reply`.
- `chat.inject` acrescenta uma nota do assistente à transcrição da sessão e transmite um evento `chat` para atualizações apenas da UI (sem execução de agente, sem entrega de canal).
- Os seletores de modelo e thinking no cabeçalho do chat aplicam patch na sessão ativa imediatamente por `sessions.patch`; são substituições persistentes da sessão, não opções de envio apenas para um turno.
- O modo Talk usa um provedor de voz em tempo real registrado que oferece suporte a sessões
  WebRTC no navegador. Configure a OpenAI com `talk.provider: "openai"` mais
  `talk.providers.openai.apiKey`, ou reutilize a configuração do provedor
  realtime de Voice Call. O navegador nunca recebe a chave de API padrão da OpenAI; ele recebe
  apenas o segredo efêmero do cliente Realtime. A voz realtime do Google Live
  é compatível com Voice Call no backend e pontes do Google Meet, mas ainda não com esse caminho
  WebRTC do navegador. O prompt da sessão Realtime é montado pelo Gateway;
  `talk.realtime.session` não aceita substituições de instruções fornecidas pelo chamador.
- No compositor do Chat, o controle Talk é o botão de ondas ao lado do
  botão de ditado por microfone. Quando o Talk é iniciado, a linha de status do compositor mostra
  `Connecting Talk...`, depois `Talk live` enquanto o áudio está conectado, ou
  `Asking OpenClaw...` enquanto uma chamada de ferramenta em tempo real consulta o
  modelo maior configurado por `chat.send`.
- Parar:
  - Clique em **Stop** (chama `chat.abort`)
  - Enquanto uma execução está ativa, acompanhamentos normais entram na fila. Clique em **Steer** em uma mensagem enfileirada para injetar esse acompanhamento no turno em execução.
  - Digite `/stop` (ou frases autônomas de abortar, como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fora de banda
  - `chat.abort` aceita `{ sessionKey }` (sem `runId`) para abortar todas as execuções ativas dessa sessão
- Retenção parcial em aborto:
  - Quando uma execução é abortada, o texto parcial do assistente ainda pode ser mostrado na UI
  - O Gateway persiste o texto parcial abortado do assistente no histórico da transcrição quando existe saída em buffer
  - Entradas persistidas incluem metadados de aborto para que consumidores da transcrição possam distinguir parciais abortadas de saídas normais concluídas

## Embeds hospedados

Mensagens do assistente podem renderizar conteúdo web hospedado inline com o shortcode `[embed ...]`.
A política de sandbox do iframe é controlada por
`gateway.controlUi.embedSandbox`:

- `strict`: desativa a execução de scripts dentro de embeds hospedados
- `scripts`: permite embeds interativos mantendo o isolamento de origem; este é
  o padrão e normalmente é suficiente para jogos/widgets autônomos no navegador
- `trusted`: adiciona `allow-same-origin` sobre `allow-scripts` para documentos do mesmo site
  que intencionalmente precisam de privilégios mais fortes

Exemplo:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

Use `trusted` apenas quando o documento incorporado realmente precisar de
comportamento de mesma origem. Para a maioria dos jogos e canvases interativos gerados pelo agente, `scripts` é
a opção mais segura.

URLs absolutas externas `http(s)` para embed continuam bloqueadas por padrão. Se você
intencionalmente quiser que `[embed url="https://..."]` carregue páginas de terceiros, defina
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Acesso por Tailnet (recomendado)

### Tailscale Serve integrado (preferido)

Mantenha o Gateway em loopback e deixe o Tailscale Serve fazer proxy com HTTPS:

```bash
openclaw gateway --tailscale serve
```

Abra:

- `https://<magicdns>/` (ou o `gateway.controlUi.basePath` configurado)

Por padrão, requisições Serve da Interface de controle/WebSocket podem se autenticar via cabeçalhos de identidade do Tailscale
(`tailscale-user-login`) quando `gateway.auth.allowTailscale` é `true`. O OpenClaw
verifica a identidade resolvendo o endereço `x-forwarded-for` com
`tailscale whois` e comparando-o com o cabeçalho, e só aceita isso quando a
requisição chega a loopback com os cabeçalhos `x-forwarded-*` do Tailscale. Defina
`gateway.auth.allowTailscale: false` se quiser exigir credenciais explícitas por segredo compartilhado
mesmo para tráfego do Serve. Depois use `gateway.auth.mode: "token"` ou
`"password"`.
Para esse caminho assíncrono de identidade do Serve, tentativas falhas de autenticação para o mesmo IP de cliente
e escopo de autenticação são serializadas antes das gravações de limite de taxa. Retentativas ruins concorrentes
do mesmo navegador podem, portanto, mostrar `retry later` na segunda requisição
em vez de duas incompatibilidades simples ocorrendo em paralelo.
A autenticação Serve sem token pressupõe que o host do Gateway é confiável. Se código local
não confiável puder ser executado nesse host, exija autenticação por token/senha.

### Bind na tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Depois abra:

- `http://<tailscale-ip>:18789/` (ou o `gateway.controlUi.basePath` configurado)

Cole o segredo compartilhado correspondente nas configurações da UI (enviado como
`connect.params.auth.token` ou `connect.params.auth.password`).

## HTTP inseguro

Se você abrir o dashboard por HTTP simples (`http://<lan-ip>` ou `http://<tailscale-ip>`),
o navegador será executado em um **contexto não seguro** e bloqueará WebCrypto. Por padrão,
o OpenClaw **bloqueia** conexões da Interface de controle sem identidade de dispositivo.

Exceções documentadas:

- compatibilidade com HTTP inseguro somente em localhost com `gateway.controlUi.allowInsecureAuth=true`
- autenticação bem-sucedida de operador da Interface de controle por `gateway.auth.mode: "trusted-proxy"`
- uso emergencial com `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correção recomendada:** use HTTPS (Tailscale Serve) ou abra a UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (no host do Gateway)

**Comportamento da opção de autenticação insegura:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` é apenas uma opção de compatibilidade local:

- Permite que sessões da Interface de controle em localhost prossigam sem identidade de dispositivo em
  contextos HTTP não seguros.
- Não ignora verificações de emparelhamento.
- Não relaxa requisitos remotos (não localhost) de identidade de dispositivo.

**Somente para emergência:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` desativa verificações de identidade de dispositivo da Interface de controle e é um
rebaixamento severo de segurança. Reverta rapidamente após o uso emergencial.

Observação sobre trusted-proxy:

- autenticação trusted-proxy bem-sucedida pode admitir sessões **de operador** da Interface de controle sem
  identidade de dispositivo
- isso **não** se estende a sessões da Interface de controle com papel de node
- proxies reversos loopback no mesmo host ainda não satisfazem autenticação trusted-proxy; veja
  [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth)

Consulte [Tailscale](/pt-BR/gateway/tailscale) para orientações de configuração com HTTPS.

## Política de Segurança de Conteúdo

A Interface de controle vem com uma política `img-src` restrita: apenas recursos **da mesma origem** e URLs `data:` são permitidos. URLs remotas `http(s)` e URLs de imagem relativas a protocolo são rejeitadas pelo navegador e não geram buscas de rede.

O que isso significa na prática:

- Avatares e imagens servidos em caminhos relativos (por exemplo `/avatars/<id>`) ainda são renderizados.
- URLs inline `data:image/...` ainda são renderizadas (útil para payloads no próprio protocolo).
- URLs remotas de avatar emitidas por metadados de canal são removidas pelos auxiliares de avatar da Interface de controle e substituídas pelo logo/badge embutido, para que um canal comprometido ou malicioso não possa forçar buscas arbitrárias de imagens remotas a partir do navegador de um operador.

Você não precisa alterar nada para obter esse comportamento — ele está sempre ativado e não é configurável.

## Autenticação da rota de avatar

Quando a autenticação do Gateway está configurada, o endpoint de avatar da Interface de controle exige o mesmo token do Gateway que o restante da API:

- `GET /avatar/<agentId>` retorna a imagem do avatar apenas para chamadores autenticados. `GET /avatar/<agentId>?meta=1` retorna os metadados do avatar sob a mesma regra.
- Requisições não autenticadas para qualquer uma das rotas são rejeitadas (em linha com a rota irmã de mídia do assistente). Isso evita que a rota de avatar vaze a identidade do agente em hosts que, de outra forma, estariam protegidos.
- A própria Interface de controle encaminha o token do Gateway como cabeçalho bearer ao buscar avatares e usa URLs blob autenticadas para que a imagem continue sendo renderizada nos dashboards.

Se você desativar a autenticação do Gateway (não recomendado em hosts compartilhados), a rota de avatar também se tornará não autenticada, em linha com o restante do Gateway.

## Compilar a UI

O Gateway serve arquivos estáticos de `dist/control-ui`. Compile-os com:

```bash
pnpm ui:build
```

Base absoluta opcional (quando você quiser URLs fixas de assets):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Para desenvolvimento local (servidor de desenvolvimento separado):

```bash
pnpm ui:dev
```

Depois aponte a UI para a URL WS do seu Gateway (por exemplo `ws://127.0.0.1:18789`).

## Depuração/testes: servidor de desenvolvimento + Gateway remoto

A Interface de controle é composta por arquivos estáticos; o destino do WebSocket é configurável e pode ser
diferente da origem HTTP. Isso é útil quando você quer o servidor de desenvolvimento do Vite
localmente, mas o Gateway roda em outro lugar.

1. Inicie o servidor de desenvolvimento da UI: `pnpm ui:dev`
2. Abra uma URL como:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Autenticação opcional de uso único (se necessário):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Observações:

- `gatewayUrl` é armazenado em `localStorage` após o carregamento e removido da URL.
- `token` deve ser passado pelo fragmento da URL (`#token=...`) sempre que possível. Fragmentos não são enviados ao servidor, o que evita vazamento em logs de requisição e Referer. Parâmetros legados `?token=` na query ainda são importados uma vez por compatibilidade, mas apenas como fallback, e são removidos imediatamente após o bootstrap.
- `password` é mantido apenas na memória.
- Quando `gatewayUrl` está definido, a UI não usa fallback para credenciais da configuração ou do ambiente.
  Forneça `token` (ou `password`) explicitamente. A ausência de credenciais explícitas é um erro.
- Use `wss://` quando o Gateway estiver atrás de TLS (Tailscale Serve, proxy HTTPS etc.).
- `gatewayUrl` só é aceito em uma janela de nível superior (não incorporada) para evitar clickjacking.
- Implantações da Interface de controle fora de loopback devem definir `gateway.controlUi.allowedOrigins`
  explicitamente (origens completas). Isso inclui configurações remotas de desenvolvimento.
- Não use `gateway.controlUi.allowedOrigins: ["*"]` exceto em testes locais rigidamente controlados.
  Isso significa permitir qualquer origem de navegador, não “corresponder a qualquer host que eu esteja
  usando”.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` ativa
  o modo de fallback de origem por cabeçalho Host, mas este é um modo de segurança perigoso.

Exemplo:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Detalhes da configuração de acesso remoto: [Acesso remoto](/pt-BR/gateway/remote).

## Relacionado

- [Dashboard](/pt-BR/web/dashboard) — dashboard do Gateway
- [WebChat](/pt-BR/web/webchat) — interface de chat baseada em navegador
- [TUI](/pt-BR/web/tui) — interface de usuário de terminal
- [Health Checks](/pt-BR/gateway/health) — monitoramento de integridade do Gateway
