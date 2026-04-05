---
read_when:
    - Executar o Gateway OpenClaw no WSL2 enquanto o Chrome fica no Windows
    - Ver erros sobrepostos de navegador/UI de controle entre WSL2 e Windows
    - Decidir entre Chrome MCP local ao host e CDP remoto bruto em configurações com hosts divididos
summary: Solucione problemas do Gateway no WSL2 + Chrome remoto no Windows em camadas
title: Solução de problemas de WSL2 + Windows + Chrome remoto via CDP
x-i18n:
    generated_at: "2026-04-05T12:54:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99df2988d3c6cf36a8c2124d5b724228d095a60b2d2b552f3810709b5086127d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 15
---

# Solução de problemas de WSL2 + Windows + Chrome remoto via CDP

Este guia cobre a configuração comum de hosts divididos em que:

- o Gateway OpenClaw é executado dentro do WSL2
- o Chrome é executado no Windows
- o controle do navegador precisa atravessar o limite entre WSL2 e Windows

Ele também cobre o padrão de falha em camadas da [issue #39369](https://github.com/openclaw/openclaw/issues/39369): vários problemas independentes podem aparecer ao mesmo tempo, o que faz a camada errada parecer quebrada primeiro.

## Escolha primeiro o modo de navegador correto

Você tem dois padrões válidos:

### Opção 1: CDP remoto bruto do WSL2 para o Windows

Use um perfil de navegador remoto que aponte do WSL2 para um endpoint CDP do Chrome no Windows.

Escolha isso quando:

- o Gateway permanece dentro do WSL2
- o Chrome é executado no Windows
- você precisa que o controle do navegador atravesse o limite entre WSL2 e Windows

### Opção 2: Chrome MCP local ao host

Use `existing-session` / `user` somente quando o próprio Gateway for executado no mesmo host que o Chrome.

Escolha isso quando:

- o OpenClaw e o Chrome estão na mesma máquina
- você quer o estado local já autenticado do navegador
- você não precisa de transporte de navegador entre hosts
- você não precisa de rotas avançadas apenas de CDP bruto/gerenciado, como `responsebody`, exportação
  de PDF, interceptação de download ou ações em lote

Para Gateway no WSL2 + Chrome no Windows, prefira CDP remoto bruto. Chrome MCP é local ao host, não uma bridge de WSL2 para Windows.

## Arquitetura funcional

Formato de referência:

- o WSL2 executa o Gateway em `127.0.0.1:18789`
- o Windows abre a UI de controle em um navegador normal em `http://127.0.0.1:18789/`
- o Chrome no Windows expõe um endpoint CDP na porta `9222`
- o WSL2 consegue alcançar esse endpoint CDP do Windows
- o OpenClaw aponta um perfil de navegador para o endereço que pode ser alcançado a partir do WSL2

## Por que essa configuração é confusa

Várias falhas podem se sobrepor:

- o WSL2 não consegue alcançar o endpoint CDP do Windows
- a UI de controle foi aberta a partir de uma origem não segura
- `gateway.controlUi.allowedOrigins` não corresponde à origem da página
- faltam token ou emparelhamento
- o perfil do navegador aponta para o endereço errado

Por isso, corrigir uma camada ainda pode deixar um erro diferente visível.

## Regra crítica para a UI de controle

Quando a UI é aberta a partir do Windows, use localhost do Windows, a menos que você tenha uma configuração deliberada com HTTPS.

Use:

`http://127.0.0.1:18789/`

Não use por padrão um IP de LAN para a UI de controle. HTTP simples em um endereço de LAN ou tailnet pode disparar comportamento de origem não segura/autenticação de dispositivo que não está relacionado ao próprio CDP. Veja [UI de controle](/web/control-ui).

## Valide em camadas

Trabalhe de cima para baixo. Não pule etapas.

### Camada 1: verificar se o Chrome está servindo CDP no Windows

Inicie o Chrome no Windows com depuração remota habilitada:

```powershell
chrome.exe --remote-debugging-port=9222
```

No Windows, verifique primeiro o próprio Chrome:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Se isso falhar no Windows, o problema ainda não é do OpenClaw.

### Camada 2: verificar se o WSL2 consegue alcançar esse endpoint do Windows

No WSL2, teste o endereço exato que você pretende usar em `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Bom resultado:

- `/json/version` retorna JSON com metadados de Browser / Protocol-Version
- `/json/list` retorna JSON (um array vazio é aceitável se nenhuma página estiver aberta)

Se isso falhar:

- o Windows ainda não está expondo a porta para o WSL2
- o endereço está errado para o lado do WSL2
- firewall / encaminhamento de porta / proxy local ainda estão faltando

Corrija isso antes de mexer na configuração do OpenClaw.

### Camada 3: configurar o perfil de navegador correto

Para CDP remoto bruto, aponte o OpenClaw para o endereço que pode ser alcançado a partir do WSL2:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Observações:

- use o endereço alcançável a partir do WSL2, não o que só funciona no Windows
- mantenha `attachOnly: true` para navegadores gerenciados externamente
- `cdpUrl` pode ser `http://`, `https://`, `ws://` ou `wss://`
- use HTTP(S) quando quiser que o OpenClaw descubra `/json/version`
- use WS(S) apenas quando o provedor do navegador fornecer uma URL direta de socket DevTools
- teste a mesma URL com `curl` antes de esperar que o OpenClaw funcione

### Camada 4: verificar separadamente a camada da UI de controle

Abra a UI a partir do Windows:

`http://127.0.0.1:18789/`

Depois verifique:

- a origem da página corresponde ao que `gateway.controlUi.allowedOrigins` espera
- a autenticação por token ou o emparelhamento está configurado corretamente
- você não está depurando um problema de autenticação da UI de controle como se fosse um problema de navegador

Página útil:

- [UI de controle](/web/control-ui)

### Camada 5: verificar o controle de navegador de ponta a ponta

No WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Bom resultado:

- a aba abre no Chrome do Windows
- `openclaw browser tabs` retorna o alvo
- ações posteriores (`snapshot`, `screenshot`, `navigate`) funcionam a partir do mesmo perfil

## Erros enganosos comuns

Trate cada mensagem como uma pista específica da camada:

- `control-ui-insecure-auth`
  - problema de origem da UI / contexto seguro, não de transporte CDP
- `token_missing`
  - problema de configuração de autenticação
- `pairing required`
  - problema de aprovação do dispositivo
- `Remote CDP for profile "remote" is not reachable`
  - o WSL2 não consegue alcançar o `cdpUrl` configurado
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - o endpoint HTTP respondeu, mas ainda não foi possível abrir o WebSocket DevTools
- substituições obsoletas de viewport / modo escuro / localidade / offline após uma sessão remota
  - execute `openclaw browser stop --browser-profile remote`
  - isso fecha a sessão de controle ativa e libera o estado de emulação do Playwright/CDP sem reiniciar o gateway nem o navegador externo
- `gateway timeout after 1500ms`
  - muitas vezes ainda é alcance do CDP ou um endpoint remoto lento/inacessível
- `No Chrome tabs found for profile="user"`
  - perfil local do Chrome MCP selecionado onde não há abas locais disponíveis no host

## Checklist rápido de triagem

1. Windows: `curl http://127.0.0.1:9222/json/version` funciona?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` funciona?
3. Configuração do OpenClaw: `browser.profiles.<name>.cdpUrl` usa esse endereço exato alcançável a partir do WSL2?
4. UI de controle: você está abrindo `http://127.0.0.1:18789/` em vez de um IP de LAN?
5. Você está tentando usar `existing-session` entre WSL2 e Windows em vez de CDP remoto bruto?

## Conclusão prática

Em geral, essa configuração é viável. A parte difícil é que transporte do navegador, segurança da origem da UI de controle e token/emparelhamento podem falhar independentemente, embora pareçam semelhantes do ponto de vista do usuário.

Na dúvida:

- primeiro verifique localmente o endpoint do Chrome no Windows
- depois verifique o mesmo endpoint a partir do WSL2
- só então depure a configuração do OpenClaw ou a autenticação da UI de controle
