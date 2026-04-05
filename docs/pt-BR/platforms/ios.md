---
read_when:
    - Pareando ou reconectando o nó do iOS
    - Executando o app iOS a partir do código-fonte
    - Depurando a descoberta do gateway ou comandos de canvas
summary: 'app de nó do iOS: conexão com o Gateway, pareamento, canvas e solução de problemas'
title: App iOS
x-i18n:
    generated_at: "2026-04-05T12:48:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e9d9cec58afd4003dff81d3e367bfbc6a634c1b229e433e08fd78fbb5f2e5a9
    source_path: platforms/ios.md
    workflow: 15
---

# App iOS (Nó)

Disponibilidade: prévia interna. O app iOS ainda não é distribuído publicamente.

## O que ele faz

- Conecta-se a um Gateway via WebSocket (LAN ou tailnet).
- Expõe capacidades do nó: Canvas, captura de tela, captura de câmera, localização, modo de fala, ativação por voz.
- Recebe comandos `node.invoke` e reporta eventos de status do nó.

## Requisitos

- Gateway em execução em outro dispositivo (macOS, Linux ou Windows via WSL2).
- Caminho de rede:
  - Mesma LAN via Bonjour, **ou**
  - Tailnet via DNS-SD unicast (domínio de exemplo: `openclaw.internal.`), **ou**
  - Host/porta manual (fallback).

## Início rápido (parear + conectar)

1. Inicie o Gateway:

```bash
openclaw gateway --port 18789
```

2. No app iOS, abra Settings e escolha um gateway descoberto (ou ative Manual Host e insira host/porta).

3. Aprove a solicitação de pareamento no host do gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Se o app tentar parear novamente com detalhes de autenticação alterados (função/escopos/chave pública),
a solicitação pendente anterior será substituída e um novo `requestId` será criado.
Execute `openclaw devices list` novamente antes da aprovação.

4. Verifique a conexão:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push com relay para builds oficiais

Builds oficiais distribuídas para iOS usam o relay de push externo em vez de publicar o token bruto do APNs
para o gateway.

Requisito no lado do gateway:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

Como o fluxo funciona:

- O app iOS se registra no relay usando App Attest e o recibo do app.
- O relay retorna um identificador opaco de relay junto com uma permissão de envio com escopo de registro.
- O app iOS busca a identidade do gateway pareado e a inclui no registro do relay, para que o registro com relay seja delegado a esse gateway específico.
- O app encaminha esse registro com relay para o gateway pareado com `push.apns.register`.
- O gateway usa esse identificador de relay armazenado para `push.test`, ativações em segundo plano e estímulos de ativação.
- A URL base do relay no gateway deve corresponder à URL do relay incorporada à build oficial/TestFlight do iOS.
- Se o app depois se conectar a outro gateway ou a uma build com uma URL base de relay diferente, ele atualiza o registro do relay em vez de reutilizar o vínculo antigo.

O que o gateway **não** precisa para esse caminho:

- Nenhum token de relay para toda a implantação.
- Nenhuma chave APNs direta para envios com relay em builds oficiais/TestFlight.

Fluxo esperado do operador:

1. Instale a build oficial/TestFlight do iOS.
2. Defina `gateway.push.apns.relay.baseUrl` no gateway.
3. Pareie o app com o gateway e deixe-o concluir a conexão.
4. O app publica `push.apns.register` automaticamente depois de ter um token APNs, a sessão do operador estar conectada e o registro no relay ser bem-sucedido.
5. Depois disso, `push.test`, ativações de reconexão e estímulos de ativação podem usar o registro com relay armazenado.

Observação de compatibilidade:

- `OPENCLAW_APNS_RELAY_BASE_URL` ainda funciona como uma substituição temporária por variável de ambiente para o gateway.

## Fluxo de autenticação e confiança

O relay existe para impor duas restrições que o APNs direto no gateway não consegue fornecer para
builds oficiais do iOS:

- Apenas builds iOS genuínas do OpenClaw distribuídas pela Apple podem usar o relay hospedado.
- Um gateway só pode enviar pushes com relay para dispositivos iOS que foram pareados com esse gateway específico.

Salto a salto:

1. `app iOS -> gateway`
   - O app primeiro pareia com o gateway pelo fluxo normal de autenticação do Gateway.
   - Isso fornece ao app uma sessão de nó autenticada junto com uma sessão de operador autenticada.
   - A sessão do operador é usada para chamar `gateway.identity.get`.

2. `app iOS -> relay`
   - O app chama os endpoints de registro do relay por HTTPS.
   - O registro inclui a prova do App Attest junto com o recibo do app.
   - O relay valida o bundle ID, a prova do App Attest e o recibo da Apple, e exige o caminho oficial/de produção de distribuição.
   - É isso que impede builds locais de Xcode/dev de usar o relay hospedado. Uma build local pode estar assinada,
     mas não satisfaz a prova oficial de distribuição da Apple que o relay exige.

3. `delegação de identidade do gateway`
   - Antes do registro no relay, o app busca a identidade do gateway pareado em
     `gateway.identity.get`.
   - O app inclui essa identidade do gateway na carga útil de registro do relay.
   - O relay retorna um identificador de relay e uma permissão de envio com escopo de registro que são delegados a
     essa identidade de gateway.

4. `gateway -> relay`
   - O gateway armazena o identificador de relay e a permissão de envio vindos de `push.apns.register`.
   - Em `push.test`, ativações de reconexão e estímulos de ativação, o gateway assina a solicitação de envio com sua
     própria identidade de dispositivo.
   - O relay verifica tanto a permissão de envio armazenada quanto a assinatura do gateway em relação à identidade do gateway
     delegada no registro.
   - Outro gateway não pode reutilizar esse registro armazenado, mesmo que de alguma forma obtenha o identificador.

5. `relay -> APNs`
   - O relay possui as credenciais de produção do APNs e o token bruto do APNs para a build oficial.
   - O gateway nunca armazena o token bruto do APNs para builds oficiais com relay.
   - O relay envia o push final para o APNs em nome do gateway pareado.

Por que esse design foi criado:

- Para manter as credenciais de produção do APNs fora dos gateways dos usuários.
- Para evitar armazenar tokens brutos do APNs de builds oficiais no gateway.
- Para permitir o uso do relay hospedado apenas para builds oficiais/TestFlight do OpenClaw.
- Para impedir que um gateway envie pushes de ativação para dispositivos iOS pertencentes a um gateway diferente.

Builds locais/manuais continuam em APNs direto. Se você estiver testando essas builds sem o relay, o
gateway ainda precisará de credenciais diretas do APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

## Caminhos de descoberta

### Bonjour (LAN)

O app iOS procura `_openclaw-gw._tcp` em `local.` e, quando configurado, no mesmo
domínio de descoberta DNS-SD de área ampla. Gateways na mesma LAN aparecem automaticamente a partir de `local.`;
a descoberta entre redes pode usar o domínio de área ampla configurado sem alterar o tipo de beacon.

### Tailnet (entre redes)

Se o mDNS estiver bloqueado, use uma zona DNS-SD unicast (escolha um domínio; exemplo:
`openclaw.internal.`) e DNS dividido do Tailscale.
Consulte [Bonjour](/pt-BR/gateway/bonjour) para o exemplo com CoreDNS.

### Host/porta manual

Em Settings, ative **Manual Host** e insira o host + porta do gateway (padrão `18789`).

## Canvas + A2UI

O nó do iOS renderiza um canvas WKWebView. Use `node.invoke` para controlá-lo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Observações:

- O host de canvas do Gateway serve `/__openclaw__/canvas/` e `/__openclaw__/a2ui/`.
- Ele é servido pelo servidor HTTP do Gateway (mesma porta de `gateway.port`, padrão `18789`).
- O nó do iOS navega automaticamente para o A2UI ao conectar quando uma URL de host de canvas é anunciada.
- Retorne ao scaffold integrado com `canvas.navigate` e `{"url":""}`.

### Avaliação / captura de snapshot do canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Ativação por voz + modo de fala

- A ativação por voz e o modo de fala estão disponíveis em Settings.
- O iOS pode suspender o áudio em segundo plano; trate os recursos de voz como melhor esforço quando o app não estiver ativo.

## Erros comuns

- `NODE_BACKGROUND_UNAVAILABLE`: traga o app iOS para o primeiro plano (comandos de canvas/câmera/tela exigem isso).
- `A2UI_HOST_NOT_CONFIGURED`: o Gateway não anunciou uma URL de host de canvas; verifique `canvasHost` em [Configuração do Gateway](/pt-BR/gateway/configuration).
- O prompt de pareamento nunca aparece: execute `openclaw devices list` e aprove manualmente.
- A reconexão falha após reinstalar: o token de pareamento no Keychain foi removido; pareie o nó novamente.

## Documentação relacionada

- [Pareamento](/pt-BR/channels/pairing)
- [Descoberta](/pt-BR/gateway/discovery)
- [Bonjour](/pt-BR/gateway/bonjour)
