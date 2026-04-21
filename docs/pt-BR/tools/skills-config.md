---
read_when:
    - Adicionando ou modificando a configuração de Skills
    - Ajustando a lista de permissões empacotada ou o comportamento de instalação
summary: Schema de configuração de Skills e exemplos
title: Configuração de Skills
x-i18n:
    generated_at: "2026-04-21T05:44:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af3a51af5d6d6af355c529bb8ec0a045046c635d8fff0dec20cd875ec12e88b
    source_path: tools/skills-config.md
    workflow: 15
---

# Configuração de Skills

A maior parte da configuração de carregamento/instalação de Skills fica em `skills` em
`~/.openclaw/openclaw.json`. A visibilidade de Skills específica por agente fica em
`agents.defaults.skills` e `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (o runtime do Gateway continua sendo Node; bun não é recomendado)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // ou string em texto simples
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Para geração/edição de imagem integrada, prefira `agents.defaults.imageGenerationModel`
mais a ferramenta principal `image_generate`. `skills.entries.*` serve apenas para fluxos
de Skill personalizados ou de terceiros.

Se você selecionar um provider/modelo de imagem específico, também configure a
autenticação/chave de API desse provider. Exemplos típicos: `GEMINI_API_KEY` ou `GOOGLE_API_KEY` para
`google/*`, `OPENAI_API_KEY` para `openai/*` e `FAL_KEY` para `fal/*`.

Exemplos:

- Configuração nativa no estilo Nano Banana: `agents.defaults.imageGenerationModel.primary: "google/gemini-3.1-flash-image-preview"`
- Configuração nativa do fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Listas de permissões de Skills por agente

Use a configuração do agente quando quiser as mesmas raízes de Skill da máquina/workspace, mas um
conjunto visível diferente de Skills por agente.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // herda os padrões -> github, weather
      { id: "docs", skills: ["docs-search"] }, // substitui os padrões
      { id: "locked-down", skills: [] }, // sem Skills
    ],
  },
}
```

Regras:

- `agents.defaults.skills`: lista de permissões base compartilhada para agentes que omitem
  `agents.list[].skills`.
- Omita `agents.defaults.skills` para deixar Skills irrestritos por padrão.
- `agents.list[].skills`: conjunto final explícito de Skills para aquele agente; não
  é mesclado com os padrões.
- `agents.list[].skills: []`: não expõe nenhum Skill para aquele agente.

## Campos

- As raízes integradas de Skill sempre incluem `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` e `<workspace>/skills`.
- `allowBundled`: lista de permissões opcional apenas para Skills **empacotados**. Quando definida, apenas
  Skills empacotados presentes na lista são elegíveis (Skills gerenciados, de agente e de workspace não são afetados).
- `load.extraDirs`: diretórios adicionais de Skill para varredura (menor precedência).
- `load.watch`: observa pastas de Skill e atualiza o snapshot de Skills (padrão: true).
- `load.watchDebounceMs`: debounce para eventos do watcher de Skill em milissegundos (padrão: 250).
- `install.preferBrew`: prefere instaladores brew quando disponíveis (padrão: true).
- `install.nodeManager`: preferência de instalador Node (`npm` | `pnpm` | `yarn` | `bun`, padrão: npm).
  Isso afeta apenas **instalações de Skill**; o runtime do Gateway ainda deve ser Node
  (`bun` não é recomendado para WhatsApp/Telegram).
  - `openclaw setup --node-manager` é mais restrito e atualmente aceita `npm`,
    `pnpm` ou `bun`. Defina `skills.install.nodeManager: "yarn"` manualmente se você
    quiser instalações de Skill com suporte do Yarn.
- `entries.<skillKey>`: substituições por Skill.
- `agents.defaults.skills`: lista de permissões padrão opcional de Skills herdada por agentes
  que omitem `agents.list[].skills`.
- `agents.list[].skills`: lista de permissões final opcional de Skills por agente; listas explícitas
  substituem os padrões herdados em vez de fazer merge.

Campos por Skill:

- `enabled`: defina `false` para desativar um Skill mesmo que ele esteja empacotado/instalado.
- `env`: variáveis de ambiente injetadas para a execução do agente (somente se ainda não estiverem definidas).
- `apiKey`: conveniência opcional para Skills que declaram uma variável env principal.
  Aceita string em texto simples ou objeto SecretRef (`{ source, provider, id }`).

## Observações

- As chaves em `entries` mapeiam para o nome do Skill por padrão. Se um Skill definir
  `metadata.openclaw.skillKey`, use essa chave em vez disso.
- A precedência de carregamento é `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills empacotados →
  `skills.load.extraDirs`.
- Mudanças em Skills são capturadas no próximo turno do agente quando o watcher está ativado.

### Skills em sandbox + variáveis de ambiente

Quando uma sessão está **em sandbox**, processos de Skill são executados dentro do
backend de sandbox configurado. O sandbox **não** herda o `process.env` do host.

Use um destes:

- `agents.defaults.sandbox.docker.env` para o backend Docker (ou `agents.list[].sandbox.docker.env` por agente)
- incorpore o env à sua imagem personalizada de sandbox ou ao ambiente remoto de sandbox

`env` global e `skills.entries.<skill>.env/apiKey` se aplicam apenas a execuções **no host**.
