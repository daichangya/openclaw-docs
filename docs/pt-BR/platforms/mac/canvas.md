---
read_when:
    - Implementando o painel Canvas no macOS
    - Adicionando controles do agente para workspace visual
    - Depurando carregamentos de canvas no WKWebView
summary: Painel Canvas controlado pelo agente incorporado via WKWebView + esquema de URL personalizado
title: Canvas
x-i18n:
    generated_at: "2026-04-05T12:47:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6c71763d693264d943e570a852208cce69fc469976b2a1cdd9e39e2550534c1
    source_path: platforms/mac/canvas.md
    workflow: 15
---

# Canvas (app macOS)

O app macOS incorpora um **painel Canvas** controlado pelo agente usando `WKWebView`. Ele
é um workspace visual leve para HTML/CSS/JS, A2UI e pequenas superfícies
de UI interativas.

## Onde o Canvas fica

O estado do Canvas é armazenado em Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

O painel Canvas serve esses arquivos por meio de um **esquema de URL personalizado**:

- `openclaw-canvas://<session>/<path>`

Exemplos:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Se não existir `index.html` na raiz, o app exibirá uma **página scaffold integrada**.

## Comportamento do painel

- Painel sem bordas, redimensionável, ancorado próximo à barra de menus (ou ao cursor do mouse).
- Lembra tamanho/posição por sessão.
- Recarrega automaticamente quando arquivos locais do canvas mudam.
- Apenas um painel Canvas fica visível por vez (a sessão é trocada conforme necessário).

O Canvas pode ser desativado em Settings → **Allow Canvas**. Quando desativado, comandos
de node do canvas retornam `CANVAS_DISABLED`.

## Superfície da API do agente

O Canvas é exposto pelo **Gateway WebSocket**, então o agente pode:

- mostrar/ocultar o painel
- navegar para um caminho ou URL
- avaliar JavaScript
- capturar uma imagem instantânea

Exemplos na CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

Observações:

- `canvas.navigate` aceita **caminhos locais de canvas**, URLs `http(s)` e URLs `file://`.
- Se você passar `"/"`, o Canvas mostrará o scaffold local ou `index.html`.

## A2UI no Canvas

O A2UI é hospedado pelo canvas host do Gateway e renderizado dentro do painel Canvas.
Quando o Gateway anuncia um canvas host, o app macOS navega automaticamente para a
página host do A2UI na primeira abertura.

URL padrão do host A2UI:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### Comandos A2UI (v0.8)

Atualmente, o Canvas aceita mensagens servidor→cliente **A2UI v0.8**:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface` (v0.9) não é compatível.

Exemplo na CLI:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Smoke rápido:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Acionando execuções de agente a partir do Canvas

O Canvas pode acionar novas execuções do agente por meio de links profundos:

- `openclaw://agent?...`

Exemplo (em JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

O app solicita confirmação, a menos que uma chave válida seja fornecida.

## Observações de segurança

- O esquema do Canvas bloqueia travessia de diretório; os arquivos precisam ficar dentro da raiz da sessão.
- O conteúdo local do Canvas usa um esquema personalizado (nenhum servidor loopback é necessário).
- URLs externas `http(s)` só são permitidas quando navegadas explicitamente.
