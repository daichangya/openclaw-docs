---
read_when:
    - Você precisa da assinatura de tipo exata de definePluginEntry ou defineChannelPluginEntry
    - Você quer entender o modo de registro (completo vs setup vs metadados de CLI)
    - Você está consultando as opções de ponto de entrada
sidebarTitle: Entry Points
summary: Referência para definePluginEntry, defineChannelPluginEntry e defineSetupPluginEntry
title: Pontos de entrada de plugin
x-i18n:
    generated_at: "2026-04-05T12:49:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 799dbfe71e681dd8ba929a7a631dfe745c3c5c69530126fea2f9c137b120f51f
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Pontos de entrada de plugin

Todo plugin exporta um objeto de entrada padrão. O SDK fornece três helpers para
criá-los.

<Tip>
  **Procurando um passo a passo?** Consulte [Plugins de canal](/plugins/sdk-channel-plugins)
  ou [Plugins de provedor](/plugins/sdk-provider-plugins) para guias passo a passo.
</Tip>

## `definePluginEntry`

**Importação:** `openclaw/plugin-sdk/plugin-entry`

Para plugins de provedor, plugins de ferramenta, plugins de hook e tudo o que **não**
for um canal de mensagens.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| Campo          | Tipo                                                             | Obrigatório | Padrão              |
| -------------- | ---------------------------------------------------------------- | ----------- | ------------------- |
| `id`           | `string`                                                         | Sim         | —                   |
| `name`         | `string`                                                         | Sim         | —                   |
| `description`  | `string`                                                         | Sim         | —                   |
| `kind`         | `string`                                                         | Não         | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Não         | Schema de objeto vazio |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Sim         | —                   |

- `id` deve corresponder ao seu manifesto `openclaw.plugin.json`.
- `kind` é para slots exclusivos: `"memory"` ou `"context-engine"`.
- `configSchema` pode ser uma função para avaliação preguiçosa.
- O OpenClaw resolve e memoiza esse schema no primeiro acesso, portanto builders de schema
  caros são executados apenas uma vez.

## `defineChannelPluginEntry`

**Importação:** `openclaw/plugin-sdk/channel-core`

Encapsula `definePluginEntry` com a infraestrutura específica de canal. Chama automaticamente
`api.registerChannel({ plugin })`, expõe uma seam opcional de metadados de CLI para ajuda na raiz
e controla `registerFull` de acordo com o modo de registro.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| Campo                 | Tipo                                                             | Obrigatório | Padrão              |
| --------------------- | ---------------------------------------------------------------- | ----------- | ------------------- |
| `id`                  | `string`                                                         | Sim         | —                   |
| `name`                | `string`                                                         | Sim         | —                   |
| `description`         | `string`                                                         | Sim         | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Sim         | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Não         | Schema de objeto vazio |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Não         | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Não         | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Não         | —                   |

- `setRuntime` é chamado durante o registro para que você possa armazenar a referência de runtime
  (normalmente por meio de `createPluginRuntimeStore`). Ele é ignorado durante a captura
  de metadados de CLI.
- `registerCliMetadata` é executado tanto durante `api.registrationMode === "cli-metadata"`
  quanto durante `api.registrationMode === "full"`.
  Use-o como o local canônico para descritores de CLI pertencentes ao canal, para que a ajuda
  na raiz permaneça sem ativação, enquanto o registro normal de comandos da CLI continua compatível
  com carregamentos completos de plugin.
- `registerFull` é executado apenas quando `api.registrationMode === "full"`. Ele é ignorado
  durante o carregamento somente de setup.
- Assim como `definePluginEntry`, `configSchema` pode ser uma factory preguiçosa e o OpenClaw
  memoiza o schema resolvido no primeiro acesso.
- Para comandos de CLI na raiz pertencentes ao plugin, prefira `api.registerCli(..., { descriptors: [...] })`
  quando quiser que o comando permaneça com lazy-loading sem desaparecer da árvore de parsing
  da CLI na raiz. Para plugins de canal, prefira registrar esses descritores
  em `registerCliMetadata(...)` e manter `registerFull(...)` focado em trabalho somente de runtime.
- Se `registerFull(...)` também registrar métodos RPC de gateway, mantenha-os em um
  prefixo específico do plugin. Namespaces administrativos principais reservados (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) são sempre forçados para
  `operator.admin`.

## `defineSetupPluginEntry`

**Importação:** `openclaw/plugin-sdk/channel-core`

Para o arquivo leve `setup-entry.ts`. Retorna apenas `{ plugin }`, sem
infraestrutura de runtime ou de CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

O OpenClaw carrega isso em vez da entrada completa quando um canal está desativado,
não configurado ou quando o carregamento adiado está ativado. Consulte
[Setup e config](/plugins/sdk-setup#setup-entry) para saber quando isso importa.

Na prática, combine `defineSetupPluginEntry(...)` com as famílias restritas de helpers de setup:

- `openclaw/plugin-sdk/setup-runtime` para helpers de setup seguros para runtime, como
  adaptadores de patch de setup seguros para importação, saída de nota de consulta,
  `promptResolvedAllowFrom`, `splitSetupEntries` e proxies de setup delegados
- `openclaw/plugin-sdk/channel-setup` para superfícies de setup de instalação opcional
- `openclaw/plugin-sdk/setup-tools` para helpers de CLI/arquivo/docs de setup/instalação

Mantenha SDKs pesados, registro de CLI e serviços de runtime de longa duração na
entrada completa.

## Modo de registro

`api.registrationMode` informa ao seu plugin como ele foi carregado:

| Modo              | Quando                           | O que registrar                                                                          |
| ----------------- | -------------------------------- | ---------------------------------------------------------------------------------------- |
| `"full"`          | Inicialização normal do gateway  | Tudo                                                                                     |
| `"setup-only"`    | Canal desativado/não configurado | Apenas registro de canal                                                                 |
| `"setup-runtime"` | Fluxo de setup com runtime disponível | Registro de canal mais apenas o runtime leve necessário antes de a entrada completa carregar |
| `"cli-metadata"`  | Ajuda na raiz / captura de metadados de CLI | Apenas descritores de CLI                                                                |

`defineChannelPluginEntry` lida automaticamente com essa divisão. Se você usar
`definePluginEntry` diretamente para um canal, verifique o modo por conta própria:

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Registros pesados somente de runtime
  api.registerService(/* ... */);
}
```

Trate `"setup-runtime"` como a janela em que superfícies de inicialização somente de setup devem
existir sem reentrar no runtime completo do canal empacotado. Bons encaixes são
registro de canal, rotas HTTP seguras para setup, métodos de gateway seguros para setup e
helpers de setup delegados. Serviços pesados em segundo plano, registradores de CLI e
bootstraps de SDK de provedor/cliente ainda pertencem a `"full"`.

Especificamente para registradores de CLI:

- use `descriptors` quando o registrador possuir um ou mais comandos na raiz e você
  quiser que o OpenClaw faça lazy-load do módulo real da CLI na primeira invocação
- garanta que esses descritores cubram todos os comandos de nível superior expostos pelo
  registrador
- use apenas `commands` para caminhos de compatibilidade eager

## Formatos de plugin

O OpenClaw classifica plugins carregados de acordo com seu comportamento de registro:

| Formato               | Descrição                                         |
| --------------------- | ------------------------------------------------- |
| **plain-capability**  | Um tipo de capacidade (por exemplo, apenas provedor) |
| **hybrid-capability** | Vários tipos de capacidade (por exemplo, provedor + fala) |
| **hook-only**         | Apenas hooks, sem capacidades                     |
| **non-capability**    | Ferramentas/comandos/serviços, mas sem capacidades |

Use `openclaw plugins inspect <id>` para ver o formato de um plugin.

## Relacionado

- [Visão geral do SDK](/plugins/sdk-overview) — API de registro e referência de subcaminhos
- [Helpers de runtime](/plugins/sdk-runtime) — `api.runtime` e `createPluginRuntimeStore`
- [Setup e config](/plugins/sdk-setup) — manifesto, entrada de setup, carregamento adiado
- [Plugins de canal](/plugins/sdk-channel-plugins) — como criar o objeto `ChannelPlugin`
- [Plugins de provedor](/plugins/sdk-provider-plugins) — registro de provedor e hooks
