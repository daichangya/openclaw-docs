---
read_when:
    - Implementar hooks de runtime de proveedor, ciclo de vida del canal o paquetes packs
    - Depurar el orden de carga de Plugins o el estado del registro
    - Añadir una nueva capacidad de Plugin o Plugin de motor de contexto
summary: 'Aspectos internos de la arquitectura de Plugins: pipeline de carga, registro, hooks de runtime, rutas HTTP y tablas de referencia'
title: Aspectos internos de la arquitectura de Plugins
x-i18n:
    generated_at: "2026-04-25T13:50:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e505155ee2acc84f7f26fa81b62121f03a998b249886d74f798c0f258bd8da4
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Para el modelo público de capacidades, las formas de los Plugins y los
contratos de propiedad/ejecución, consulta [Arquitectura de Plugins](/es/plugins/architecture). Esta página es la
referencia de la mecánica interna: pipeline de carga, registro, hooks de runtime,
rutas HTTP del Gateway, rutas de importación y tablas de esquemas.

## Pipeline de carga

Al iniciar, OpenClaw hace aproximadamente esto:

1. descubre raíces candidatas de Plugins
2. lee manifiestos nativos o de paquetes compatibles y metadatos de paquetes
3. rechaza candidatos inseguros
4. normaliza la configuración de Plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide la habilitación para cada candidato
6. carga módulos nativos habilitados: los módulos incluidos ya compilados usan un cargador nativo;
   los Plugins nativos no compilados usan jiti
7. llama a los hooks nativos `register(api)` y recopila los registros en el registro de Plugins
8. expone el registro a las superficies de comandos/runtime

<Note>
`activate` es un alias heredado de `register`: el cargador resuelve el que esté presente (`def.register ?? def.activate`) y lo llama en el mismo punto. Todos los Plugins incluidos usan `register`; para Plugins nuevos, prefiere `register`.
</Note>

Las puertas de seguridad ocurren **antes** de la ejecución en runtime. Los candidatos se bloquean
cuando la entrada escapa de la raíz del Plugin, la ruta puede escribirse globalmente o la
propiedad de la ruta parece sospechosa para Plugins no incluidos.

### Comportamiento basado primero en el manifiesto

El manifiesto es la fuente de verdad del plano de control. OpenClaw lo usa para:

- identificar el Plugin
- descubrir canales/Skills/esquema de configuración declarados o capacidades del paquete
- validar `plugins.entries.<id>.config`
- ampliar etiquetas/placeholders de Control UI
- mostrar metadatos de instalación/catálogo
- conservar descriptores baratos de activación y configuración sin cargar el runtime del Plugin

Para Plugins nativos, el módulo de runtime es la parte del plano de datos. Registra
el comportamiento real, como hooks, herramientas, comandos o flujos de proveedor.

Los bloques opcionales `activation` y `setup` del manifiesto permanecen en el plano de control.
Son descriptores solo de metadatos para planificación de activación y descubrimiento de configuración;
no sustituyen el registro en runtime, `register(...)` ni `setupEntry`.
Los primeros consumidores de activación real ahora usan sugerencias de comandos, canales y proveedores del manifiesto
para acotar la carga de Plugins antes de materializar un registro más amplio:

- La carga de CLI se limita a Plugins que poseen el comando principal solicitado
- La configuración del canal/resolución del Plugin se limita a Plugins que poseen el
  ID del canal solicitado
- La configuración/resolución explícita del runtime del proveedor se limita a Plugins que poseen el
  ID del proveedor solicitado

El planificador de activación expone tanto una API solo de IDs para consumidores existentes como una
API de plan para nuevos diagnósticos. Las entradas del plan informan por qué se seleccionó un Plugin,
separando las sugerencias explícitas del planificador `activation.*` del respaldo de propiedad del manifiesto
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` y hooks. Esa separación de motivos es el límite de compatibilidad:
los metadatos de Plugins existentes siguen funcionando, mientras que el código nuevo puede detectar sugerencias amplias
o comportamiento de respaldo sin cambiar la semántica de carga del runtime.

El descubrimiento de configuración ahora prefiere IDs propiedad del descriptor como `setup.providers` y
`setup.cliBackends` para acotar los Plugins candidatos antes de recurrir a
`setup-api` para Plugins que aún necesitan hooks de runtime en tiempo de configuración. El flujo de configuración del proveedor usa primero `providerAuthChoices` del manifiesto y luego usa como respaldo
las opciones del asistente del runtime y las opciones del catálogo de instalación por compatibilidad. La opción
explícita `setup.requiresRuntime: false` es un corte solo de descriptor; si se omite
`requiresRuntime`, se mantiene el respaldo heredado a setup-api por compatibilidad. Si más de
un Plugin descubierto afirma poseer el mismo ID normalizado de proveedor de configuración o
backend CLI, la búsqueda de configuración rechaza al propietario ambiguo en lugar de depender del
orden de descubrimiento. Cuando sí se ejecuta el runtime de configuración, los diagnósticos del registro informan
sobre desajustes entre `setup.providers` / `setup.cliBackends` y los proveedores o
backends CLI registrados por setup-api sin bloquear Plugins heredados.

### Qué almacena en caché el cargador

OpenClaw mantiene cachés breves en proceso para:

- resultados de descubrimiento
- datos del registro del manifiesto
- registros de Plugins cargados

Estas cachés reducen los picos de arranque y la sobrecarga de comandos repetidos. Es seguro
pensar en ellas como cachés de rendimiento de corta duración, no como persistencia.

Nota de rendimiento:

- Configura `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` o
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para desactivar estas cachés.
- Ajusta las ventanas de caché con `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` y
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registro

Los Plugins cargados no mutan directamente variables globales arbitrarias del núcleo. Se registran en un
registro central de Plugins.

El registro rastrea:

- registros de Plugins (identidad, origen, procedencia, estado, diagnósticos)
- herramientas
- hooks heredados y hooks tipados
- canales
- proveedores
- controladores de RPC del gateway
- rutas HTTP
- registradores de CLI
- servicios en segundo plano
- comandos propiedad de Plugins

Las funciones del núcleo leen después de ese registro en lugar de hablar directamente con los módulos
de Plugins. Esto mantiene la carga en un solo sentido:

- módulo del Plugin -> registro en el registro
- runtime del núcleo -> consumo del registro

Esa separación importa para la mantenibilidad. Significa que la mayoría de las superficies del núcleo solo
necesitan un punto de integración: “leer el registro”, no “crear casos especiales para cada módulo de Plugin”.

## Callbacks de vinculación de conversaciones

Los Plugins que vinculan una conversación pueden reaccionar cuando se resuelve una aprobación.

Usa `api.onConversationBindingResolved(...)` para recibir un callback después de que una solicitud de vinculación
sea aprobada o denegada:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Ahora existe una vinculación para este plugin + conversación.
        console.log(event.binding?.conversationId);
        return;
      }

      // La solicitud fue denegada; limpia cualquier estado pendiente local.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Campos de la carga útil del callback:

- `status`: `"approved"` o `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` o `"deny"`
- `binding`: la vinculación resuelta para solicitudes aprobadas
- `request`: el resumen de la solicitud original, sugerencia de separación, ID del remitente y
  metadatos de la conversación

Este callback es solo de notificación. No cambia quién tiene permitido vincular una
conversación y se ejecuta después de que termine la gestión de aprobaciones del núcleo.

## Hooks de runtime de proveedor

Los Plugins de proveedor tienen tres capas:

- **Metadatos del manifiesto** para búsqueda barata previa al runtime:
  `setup.providers[].envVars`, la compatibilidad obsoleta `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` y `channelEnvVars`.
- **Hooks de tiempo de configuración**: `catalog` (antes `discovery`) más
  `applyConfigDefaults`.
- **Hooks de runtime**: más de 40 hooks opcionales que cubren autenticación, resolución de modelos,
  encapsulado de streams, niveles de pensamiento, política de reproducción y endpoints de uso. Consulta
  la lista completa en [Orden y uso de hooks](#hook-order-and-usage).

OpenClaw sigue siendo propietario del bucle genérico del agente, failover, gestión de transcripciones y
política de herramientas. Estos hooks son la superficie de extensión para el comportamiento específico
del proveedor sin necesidad de todo un transporte de inferencia personalizado.

Usa `setup.providers[].envVars` del manifiesto cuando el proveedor tenga credenciales basadas en variables de entorno
que las rutas genéricas de autenticación/estado/selector de modelos deban ver sin
cargar el runtime del Plugin. El valor obsoleto `providerAuthEnvVars` sigue siendo leído por el
adaptador de compatibilidad durante la ventana de deprecación, y los Plugins no incluidos
que lo usan reciben un diagnóstico del manifiesto. Usa `providerAuthAliases` del manifiesto
cuando un ID de proveedor deba reutilizar las variables de entorno, perfiles de autenticación,
autenticación respaldada por configuración y la opción de incorporación de clave API de otro ID de proveedor. Usa
`providerAuthChoices` del manifiesto cuando las superficies de CLI de incorporación/opción de autenticación deban conocer el
ID de opción del proveedor, etiquetas de grupo y cableado sencillo de autenticación con una sola bandera sin
cargar el runtime del proveedor. Mantén `envVars` del runtime del proveedor
para sugerencias dirigidas al operador, como etiquetas de incorporación o variables de configuración de
client-id/client-secret de OAuth.

Usa `channelEnvVars` del manifiesto cuando un canal tenga autenticación o configuración impulsadas por entorno
que el respaldo genérico de variables de entorno del shell, las comprobaciones de configuración/estado o las solicitudes
de configuración deban ver sin cargar el runtime del canal.

### Orden y uso de hooks

Para Plugins de modelo/proveedor, OpenClaw llama a los hooks aproximadamente en este orden.
La columna “Cuándo usar” es la guía rápida de decisión.

| #   | Hook                              | Qué hace                                                                                                       | Cuándo usarlo                                                                                                                                 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica la configuración del proveedor en `models.providers` durante la generación de `models.json`           | El proveedor es propietario de un catálogo o de valores predeterminados de URL base                                                          |
| 2   | `applyConfigDefaults`             | Aplica valores predeterminados globales propiedad del proveedor durante la materialización de la configuración | Los valores predeterminados dependen del modo de autenticación, del entorno o de la semántica de la familia de modelos del proveedor         |
| --  | _(búsqueda integrada de modelos)_ | OpenClaw prueba primero la ruta normal de registro/catálogo                                                   | _(no es un hook de Plugin)_                                                                                                                   |
| 3   | `normalizeModelId`                | Normaliza aliases heredados o de vista previa de ID de modelo antes de la búsqueda                            | El proveedor es propietario de la limpieza de aliases antes de la resolución canónica del modelo                                              |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` de la familia del proveedor antes del ensamblado genérico del modelo              | El proveedor es propietario de la limpieza de transporte para IDs de proveedor personalizados en la misma familia de transporte              |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes de la resolución en runtime/proveedor                                 | El proveedor necesita limpieza de configuración que debe vivir con el Plugin; los helpers incluidos de la familia Google también respaldan entradas compatibles de configuración de Google |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescrituras de compatibilidad de uso de streaming nativo a proveedores de configuración               | El proveedor necesita correcciones de metadatos de uso de streaming nativo impulsadas por endpoints                                          |
| 7   | `resolveConfigApiKey`             | Resuelve autenticación con marcador de entorno para proveedores de configuración antes de cargar la autenticación de runtime | El proveedor tiene resolución propia de clave API con marcador de entorno; `amazon-bedrock` también tiene aquí un resolvedor integrado de marcador de entorno AWS |
| 8   | `resolveSyntheticAuth`            | Expone autenticación local/autohospedada o respaldada por configuración sin conservar texto sin formato       | El proveedor puede operar con un marcador sintético/local de credencial                                                                       |
| 9   | `resolveExternalAuthProfiles`     | Superpone perfiles externos de autenticación propiedad del proveedor; el valor predeterminado de `persistence` es `runtime-only` para credenciales propiedad de CLI/app | El proveedor reutiliza credenciales externas de autenticación sin conservar tokens de renovación copiados; declara `contracts.externalAuthProviders` en el manifiesto |
| 10  | `shouldDeferSyntheticProfileAuth` | Relega marcadores almacenados de perfiles sintéticos detrás de autenticación respaldada por entorno/configuración | El proveedor almacena perfiles sintéticos de marcador de posición que no deberían tener prioridad                                             |
| 11  | `resolveDynamicModel`             | Respaldo síncrono para IDs de modelo propiedad del proveedor que aún no están en el registro local            | El proveedor acepta IDs arbitrarios de modelos aguas arriba                                                                                   |
| 12  | `prepareDynamicModel`             | Calentamiento asíncrono; luego `resolveDynamicModel` vuelve a ejecutarse                                      | El proveedor necesita metadatos de red antes de resolver IDs desconocidos                                                                     |
| 13  | `normalizeResolvedModel`          | Reescritura final antes de que el ejecutor integrado use el modelo resuelto                                   | El proveedor necesita reescrituras de transporte pero sigue usando un transporte del núcleo                                                   |
| 14  | `contributeResolvedModelCompat`   | Aporta flags de compatibilidad para modelos del proveedor detrás de otro transporte compatible                | El proveedor reconoce sus propios modelos en transportes proxy sin apropiarse del proveedor                                                   |
| 15  | `capabilities`                    | Metadatos de transcripción/herramientas propiedad del proveedor usados por la lógica compartida del núcleo    | El proveedor necesita particularidades de transcripción/familia de proveedor                                                                  |
| 16  | `normalizeToolSchemas`            | Normaliza esquemas de herramientas antes de que los vea el ejecutor integrado                                 | El proveedor necesita limpieza de esquemas de la familia de transporte                                                                        |
| 17  | `inspectToolSchemas`              | Expone diagnósticos de esquemas propiedad del proveedor después de la normalización                           | El proveedor quiere advertencias de palabras clave sin enseñar al núcleo reglas específicas del proveedor                                    |
| 18  | `resolveReasoningOutputMode`      | Selecciona contrato de salida de razonamiento nativo frente a etiquetado                                      | El proveedor necesita razonamiento/salida final etiquetados en lugar de campos nativos                                                       |
| 19  | `prepareExtraParams`              | Normalización de parámetros de solicitud antes de los wrappers genéricos de opciones de stream                | El proveedor necesita parámetros de solicitud predeterminados o limpieza de parámetros por proveedor                                          |
| 20  | `createStreamFn`                  | Sustituye completamente la ruta normal de stream por un transporte personalizado                              | El proveedor necesita un protocolo de cableado personalizado, no solo un wrapper                                                              |
| 21  | `wrapStreamFn`                    | Wrapper de stream después de aplicar wrappers genéricos                                                       | El proveedor necesita wrappers de compatibilidad de encabezados/cuerpo/modelo de solicitud sin un transporte personalizado                   |
| 22  | `resolveTransportTurnState`       | Adjunta encabezados o metadatos nativos por turno del transporte                                              | El proveedor quiere que los transportes genéricos envíen identidad nativa del turno del proveedor                                             |
| 23  | `resolveWebSocketSessionPolicy`   | Adjunta encabezados WebSocket nativos o política de enfriamiento de sesión                                    | El proveedor quiere que los transportes WS genéricos ajusten encabezados de sesión o política de respaldo                                    |
| 24  | `formatApiKey`                    | Formateador de perfiles de autenticación: el perfil almacenado se convierte en la cadena `apiKey` del runtime | El proveedor almacena metadatos extra de autenticación y necesita una forma personalizada del token en runtime                              |
| 25  | `refreshOAuth`                    | Anulación de renovación OAuth para endpoints de renovación personalizados o política de fallo de renovación   | El proveedor no encaja en los renovadores compartidos de `pi-ai`                                                                              |
| 26  | `buildAuthDoctorHint`             | Sugerencia de reparación que se añade cuando falla la renovación OAuth                                        | El proveedor necesita instrucciones propias de reparación de autenticación tras el fallo de renovación                                        |
| 27  | `matchesContextOverflowError`     | Comparador propiedad del proveedor para desbordamiento de ventana de contexto                                  | El proveedor tiene errores brutos de desbordamiento que las heurísticas genéricas no detectarían                                             |
| 28  | `classifyFailoverReason`          | Clasificación propiedad del proveedor para motivos de failover                                                | El proveedor puede mapear errores brutos de API/transporte a límite de tasa/sobrecarga/etc.                                                  |
| 29  | `isCacheTtlEligible`              | Política de caché de prompts para proveedores proxy/backhaul                                                  | El proveedor necesita restricción de TTL de caché específica de proxy                                                                         |
| 30  | `buildMissingAuthMessage`         | Sustitución del mensaje genérico de recuperación por falta de autenticación                                    | El proveedor necesita una sugerencia específica de recuperación por falta de autenticación                                                    |
| 31  | `suppressBuiltInModel`            | Supresión de modelos obsoletos aguas arriba más sugerencia opcional visible para el usuario                   | El proveedor necesita ocultar filas obsoletas aguas arriba o sustituirlas por una sugerencia del proveedor                                   |
| 32  | `augmentModelCatalog`             | Filas sintéticas/finales del catálogo añadidas después del descubrimiento                                      | El proveedor necesita filas sintéticas de compatibilidad futura en `models list` y en selectores                                             |
| 33  | `resolveThinkingProfile`          | Conjunto de niveles `/think`, etiquetas de visualización y valor predeterminado específicos del modelo        | El proveedor expone una escalera personalizada de pensamiento o una etiqueta binaria para modelos seleccionados                              |
| 34  | `isBinaryThinking`                | Hook de compatibilidad para alternancia on/off de razonamiento                                                | El proveedor solo expone pensamiento binario activado/desactivado                                                                             |
| 35  | `supportsXHighThinking`           | Hook de compatibilidad para soporte de razonamiento `xhigh`                                                   | El proveedor quiere `xhigh` solo en un subconjunto de modelos                                                                                |
| 36  | `resolveDefaultThinkingLevel`     | Hook de compatibilidad para el nivel predeterminado de `/think`                                               | El proveedor es propietario de la política predeterminada de `/think` para una familia de modelos                                            |
| 37  | `isModernModelRef`                | Comparador de modelo moderno para filtros de perfiles activos y selección de smoke                            | El proveedor es propietario de la coincidencia de modelos preferidos para activo/smoke                                                       |
| 38  | `prepareRuntimeAuth`              | Intercambia una credencial configurada por el token/clave real de runtime justo antes de la inferencia       | El proveedor necesita un intercambio de token o una credencial de solicitud de corta duración                                                |
| 39  | `resolveUsageAuth`                | Resuelve credenciales de uso/facturación para `/usage` y superficies de estado relacionadas                   | El proveedor necesita análisis personalizado de token de uso/cuota o una credencial distinta de uso                                          |
| 40  | `fetchUsageSnapshot`              | Obtiene y normaliza instantáneas de uso/cuota específicas del proveedor después de resolver la autenticación  | El proveedor necesita un endpoint de uso específico del proveedor o un analizador de carga útil                                              |
| 41  | `createEmbeddingProvider`         | Construye un adaptador de embeddings propiedad del proveedor para memoria/búsqueda                            | El comportamiento de embeddings para memoria pertenece al Plugin del proveedor                                                                |
| 42  | `buildReplayPolicy`               | Devuelve una política de replay que controla el manejo de transcripciones para el proveedor                   | El proveedor necesita una política personalizada de transcripción (por ejemplo, eliminación de bloques de pensamiento)                       |
| 43  | `sanitizeReplayHistory`           | Reescribe el historial de replay después de la limpieza genérica de transcripciones                           | El proveedor necesita reescrituras específicas del proveedor para replay más allá de los helpers compartidos de Compaction                   |
| 44  | `validateReplayTurns`             | Validación o remodelado final de turnos de replay antes del ejecutor integrado                                | El transporte del proveedor necesita validación más estricta de turnos después del saneamiento genérico                                      |
| 45  | `onModelSelected`                 | Ejecuta efectos secundarios posteriores a la selección propiedad del proveedor                                 | El proveedor necesita telemetría o estado propiedad del proveedor cuando un modelo pasa a estar activo                                       |

`normalizeModelId`, `normalizeTransport` y `normalizeConfig` primero comprueban el
Plugin del proveedor coincidente y luego van recorriendo otros Plugins de proveedor con capacidad de hook
hasta que uno cambia realmente el ID del modelo o el transporte/configuración. Eso mantiene
los shims de proveedor de alias/compatibilidad funcionando sin exigir que quien llama sepa qué
Plugin incluido es el propietario de la reescritura. Si ningún hook de proveedor reescribe una entrada
compatible de configuración de la familia Google, el normalizador de configuración de Google incluido
sigue aplicando esa limpieza de compatibilidad.

Si el proveedor necesita un protocolo de cable totalmente personalizado o un ejecutor de solicitudes personalizado,
eso pertenece a otra clase de extensión. Estos hooks son para comportamiento de proveedor
que sigue ejecutándose sobre el bucle normal de inferencia de OpenClaw.

### Ejemplo de proveedor

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Ejemplos integrados

Los Plugins de proveedor incluidos combinan los hooks anteriores para adaptarse a las necesidades de catálogo,
autenticación, pensamiento, replay y uso de cada proveedor. El conjunto autoritativo de hooks vive en
cada Plugin bajo `extensions/`; esta página ilustra las formas en lugar de
replicar la lista.

<AccordionGroup>
  <Accordion title="Proveedores de catálogo passthrough">
    OpenRouter, Kilocode, Z.AI y xAI registran `catalog` más
    `resolveDynamicModel` / `prepareDynamicModel` para poder exponer IDs de modelos aguas arriba antes del catálogo estático de OpenClaw.
  </Accordion>
  <Accordion title="Proveedores con OAuth y endpoint de uso">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi y z.ai combinan
    `prepareRuntimeAuth` o `formatApiKey` con `resolveUsageAuth` +
    `fetchUsageSnapshot` para controlar el intercambio de tokens y la integración con `/usage`.
  </Accordion>
  <Accordion title="Familias de replay y limpieza de transcripciones">
    Las familias compartidas con nombre (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permiten a los proveedores optar por
    la política de transcripciones mediante `buildReplayPolicy` en lugar de que cada Plugin
    reimplemente la limpieza.
  </Accordion>
  <Accordion title="Proveedores solo de catálogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` y
    `volcengine` registran solo `catalog` y usan el bucle compartido de inferencia.
  </Accordion>
  <Accordion title="Helpers de stream específicos de Anthropic">
    Los encabezados beta, `/fast` / `serviceTier` y `context1m` viven dentro de la
    costura pública `api.ts` / `contract-api.ts` del Plugin de Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) y no en
    el SDK genérico.
  </Accordion>
</AccordionGroup>

## Helpers de runtime

Los Plugins pueden acceder a determinados helpers del núcleo mediante `api.runtime`. Para TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Notas:

- `textToSpeech` devuelve la carga normal de salida TTS del núcleo para superficies de archivo/nota de voz.
- Usa la configuración `messages.tts` del núcleo y la selección de proveedor.
- Devuelve buffer de audio PCM + frecuencia de muestreo. Los Plugins deben remuestrear/codificar para los proveedores.
- `listVoices` es opcional por proveedor. Úsalo para selectores de voz o flujos de configuración propiedad del proveedor.
- Los listados de voces pueden incluir metadatos más ricos como idioma, género y etiquetas de personalidad para selectores conscientes del proveedor.
- OpenAI y ElevenLabs admiten telefonía hoy. Microsoft no.

Los Plugins también pueden registrar proveedores de voz mediante `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Notas:

- Mantén en el núcleo la política de TTS, el respaldo y la entrega de respuestas.
- Usa proveedores de voz para comportamiento de síntesis propiedad del proveedor.
- La entrada heredada `edge` de Microsoft se normaliza al ID de proveedor `microsoft`.
- El modelo preferido de propiedad está orientado por empresa: un solo Plugin de proveedor puede gestionar
  texto, voz, imagen y futuros proveedores multimedia a medida que OpenClaw añada esos
  contratos de capacidad.

Para comprensión de imagen/audio/video, los Plugins registran un único proveedor tipado
de comprensión multimedia en lugar de una bolsa genérica de clave/valor:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Notas:

- Mantén la orquestación, el respaldo, la configuración y la conexión de canales en el núcleo.
- Mantén el comportamiento del proveedor en el Plugin del proveedor.
- La expansión aditiva debe seguir siendo tipada: nuevos métodos opcionales, nuevos campos opcionales
  de resultado, nuevas capacidades opcionales.
- La generación de video ya sigue el mismo patrón:
  - el núcleo es propietario del contrato de capacidad y del helper de runtime
  - los Plugins del proveedor registran `api.registerVideoGenerationProvider(...)`
  - los Plugins de función/canal consumen `api.runtime.videoGeneration.*`

Para helpers de runtime de comprensión multimedia, los Plugins pueden llamar a:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Para transcripción de audio, los Plugins pueden usar el runtime de comprensión multimedia
o el alias STT anterior:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Opcional cuando el MIME no puede inferirse de forma fiable:
  mime: "audio/ogg",
});
```

Notas:

- `api.runtime.mediaUnderstanding.*` es la superficie compartida preferida para
  comprensión de imagen/audio/video.
- Usa la configuración de audio de comprensión multimedia del núcleo (`tools.media.audio`) y el orden de respaldo del proveedor.
- Devuelve `{ text: undefined }` cuando no se produce salida de transcripción (por ejemplo entrada omitida/no compatible).
- `api.runtime.stt.transcribeAudioFile(...)` permanece como alias de compatibilidad.

Los Plugins también pueden iniciar ejecuciones de subagentes en segundo plano mediante `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Notas:

- `provider` y `model` son anulaciones opcionales por ejecución, no cambios persistentes de sesión.
- OpenClaw solo respeta esos campos de anulación para llamadores de confianza.
- Para ejecuciones de respaldo propiedad del Plugin, los operadores deben habilitar explícitamente `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` para restringir Plugins de confianza a objetivos canónicos específicos `provider/model`, o `"*"` para permitir explícitamente cualquier objetivo.
- Las ejecuciones de subagentes de Plugins no confiables siguen funcionando, pero las solicitudes de anulación se rechazan en lugar de usar silenciosamente un respaldo.

Para búsqueda web, los Plugins pueden consumir el helper de runtime compartido en lugar de
acceder a la conexión de herramientas del agente:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Los Plugins también pueden registrar proveedores de búsqueda web mediante
`api.registerWebSearchProvider(...)`.

Notas:

- Mantén en el núcleo la selección de proveedor, resolución de credenciales y semántica compartida de solicitud.
- Usa proveedores de búsqueda web para transportes de búsqueda específicos del proveedor.
- `api.runtime.webSearch.*` es la superficie compartida preferida para Plugins de función/canal que necesiten comportamiento de búsqueda sin depender del wrapper de herramientas del agente.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: genera una imagen usando la cadena configurada de proveedor de generación de imágenes.
- `listProviders(...)`: enumera los proveedores disponibles de generación de imágenes y sus capacidades.

## Rutas HTTP del Gateway

Los Plugins pueden exponer endpoints HTTP con `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Campos de la ruta:

- `path`: ruta bajo el servidor HTTP del gateway.
- `auth`: obligatorio. Usa `"gateway"` para requerir autenticación normal del gateway o `"plugin"` para autenticación/verificación de webhook gestionada por Plugin.
- `match`: opcional. `"exact"` (predeterminado) o `"prefix"`.
- `replaceExisting`: opcional. Permite que el mismo Plugin sustituya su propio registro de ruta existente.
- `handler`: devuelve `true` cuando la ruta gestionó la solicitud.

Notas:

- `api.registerHttpHandler(...)` fue eliminado y provocará un error de carga del Plugin. Usa `api.registerHttpRoute(...)` en su lugar.
- Las rutas de Plugins deben declarar `auth` explícitamente.
- Los conflictos exactos de `path + match` se rechazan a menos que `replaceExisting: true`, y un Plugin no puede sustituir la ruta de otro Plugin.
- Las rutas superpuestas con distintos niveles de `auth` se rechazan. Mantén las cadenas de fallback `exact`/`prefix` solo en el mismo nivel de autenticación.
- Las rutas `auth: "plugin"` **no** reciben automáticamente ámbitos de runtime del operador. Son para webhooks/verificación de firmas gestionadas por Plugin, no para llamadas privilegiadas a helpers del Gateway.
- Las rutas `auth: "gateway"` se ejecutan dentro de un ámbito de runtime de solicitud del Gateway, pero ese ámbito es intencionadamente conservador:
  - la autenticación bearer con secreto compartido (`gateway.auth.mode = "token"` / `"password"`) mantiene los ámbitos de runtime de la ruta del Plugin fijados en `operator.write`, aunque el llamador envíe `x-openclaw-scopes`
  - los modos HTTP de confianza con identidad (por ejemplo `trusted-proxy` o `gateway.auth.mode = "none"` en una entrada privada) respetan `x-openclaw-scopes` solo cuando el encabezado está presente explícitamente
  - si `x-openclaw-scopes` no está presente en esas solicitudes de ruta de Plugin con identidad, el ámbito de runtime usa como respaldo `operator.write`
- Regla práctica: no asumas que una ruta de Plugin autenticada por gateway es implícitamente una superficie de administración. Si tu ruta necesita comportamiento exclusivo de administración, exige un modo de autenticación con identidad y documenta el contrato explícito del encabezado `x-openclaw-scopes`.

## Rutas de importación del SDK de Plugins

Usa subrutas estrechas del SDK en lugar del barrel raíz monolítico `openclaw/plugin-sdk`
al crear Plugins nuevos. Subrutas principales:

| Subruta                            | Propósito                                          |
| ---------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitivas de registro de Plugins                  |
| `openclaw/plugin-sdk/channel-core`  | Helpers de entrada/construcción de canales         |
| `openclaw/plugin-sdk/core`          | Helpers compartidos genéricos y contrato global    |
| `openclaw/plugin-sdk/config-schema` | Esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |

Los Plugins de canal eligen dentro de una familia de costuras estrechas: `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` y `channel-actions`. El comportamiento de aprobaciones debe consolidarse
en un único contrato `approvalCapability` en lugar de mezclarse entre campos
no relacionados del Plugin. Consulta [Plugins de canal](/es/plugins/sdk-channel-plugins).

Los helpers de runtime y configuración viven bajo subrutas `*-runtime`
correspondientes (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`, etc.).

<Info>
`openclaw/plugin-sdk/channel-runtime` está obsoleto: es un shim de compatibilidad para
Plugins antiguos. El código nuevo debería importar primitivas genéricas más estrechas.
</Info>

Puntos de entrada internos del repositorio (por raíz de paquete de Plugin incluido):

- `index.js` — entrada del Plugin incluido
- `api.js` — barrel de helpers/tipos
- `runtime-api.js` — barrel solo de runtime
- `setup-entry.js` — entrada del Plugin de configuración

Los Plugins externos solo deben importar subrutas `openclaw/plugin-sdk/*`. Nunca
importes `src/*` del paquete de otro Plugin desde el núcleo ni desde otro Plugin.
Los puntos de entrada cargados por facade prefieren la instantánea activa de configuración del runtime cuando existe y luego usan como respaldo el archivo de configuración resuelto en disco.

Existen subrutas específicas de capacidad como `image-generation`, `media-understanding`
y `speech` porque los Plugins incluidos las usan hoy. No son automáticamente contratos externos congelados a largo plazo: consulta la página de referencia del SDK correspondiente cuando dependas de ellas.

## Esquemas de herramientas de mensajes

Los Plugins deben ser propietarios de contribuciones de esquema específicas del canal mediante `describeMessageTool(...)`
para primitivas que no son mensajes, como reacciones, lecturas y encuestas.
La presentación compartida de envío debe usar el contrato genérico `MessagePresentation`
en lugar de campos nativos del proveedor para botones, componentes, bloques o tarjetas.
Consulta [Message Presentation](/es/plugins/message-presentation) para ver el contrato,
las reglas de respaldo, el mapeo de proveedores y la lista de comprobación para autores de Plugins.

Los Plugins con capacidad de envío declaran lo que pueden renderizar mediante capacidades de mensaje:

- `presentation` para bloques de presentación semántica (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` para solicitudes de entrega fijada

El núcleo decide si renderizar la presentación de forma nativa o degradarla a texto.
No expongas rutas de escape de UI nativas del proveedor desde la herramienta genérica de mensajes.
Los helpers obsoletos del SDK para esquemas nativos heredados siguen exportándose para Plugins
de terceros ya existentes, pero los Plugins nuevos no deberían usarlos.

## Resolución de destinos de canal

Los Plugins de canal deben ser propietarios de la semántica de destino específica del canal. Mantén
genérico el host compartido de salida y usa la superficie del adaptador de mensajería para las reglas del proveedor:

- `messaging.inferTargetChatType({ to })` decide si un destino normalizado
  debe tratarse como `direct`, `group` o `channel` antes de la búsqueda en directorio.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indica al núcleo si una
  entrada debe pasar directamente a resolución tipo ID en lugar de búsqueda en directorio.
- `messaging.targetResolver.resolveTarget(...)` es el respaldo del Plugin cuando
  el núcleo necesita una resolución final propiedad del proveedor después de la normalización o tras un fallo de directorio.
- `messaging.resolveOutboundSessionRoute(...)` es propietario de la construcción de rutas
  de sesión específicas del proveedor una vez resuelto un destino.

Separación recomendada:

- Usa `inferTargetChatType` para decisiones de categoría que deban ocurrir antes de
  buscar peers/groups.
- Usa `looksLikeId` para comprobaciones de “trata esto como un ID de destino explícito/nativo”.
- Usa `resolveTarget` para el respaldo de normalización específico del proveedor, no para
  una búsqueda amplia en directorio.
- Mantén IDs nativos del proveedor como chat ids, thread ids, JIDs, handles e IDs de sala
  dentro de valores `target` o parámetros específicos del proveedor, no en campos genéricos del SDK.

## Directorios respaldados por configuración

Los Plugins que derivan entradas de directorio de la configuración deben mantener esa lógica en el
Plugin y reutilizar los helpers compartidos de
`openclaw/plugin-sdk/directory-runtime`.

Usa esto cuando un canal necesite peers/groups respaldados por configuración como:

- peers de mensajes directos impulsados por lista de permitidos
- mapas configurados de canal/grupo
- respaldos estáticos de directorio con alcance por cuenta

Los helpers compartidos en `directory-runtime` solo gestionan operaciones genéricas:

- filtrado de consultas
- aplicación de límites
- helpers de deduplicación/normalización
- construcción de `ChannelDirectoryEntry[]`

La inspección de cuentas específica del canal y la normalización de ID deben permanecer en la
implementación del Plugin.

## Catálogos de proveedores

Los Plugins de proveedor pueden definir catálogos de modelos para inferencia con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` devuelve la misma forma que OpenClaw escribe en
`models.providers`:

- `{ provider }` para una entrada de proveedor
- `{ providers }` para varias entradas de proveedor

Usa `catalog` cuando el Plugin sea propietario de IDs de modelo específicos del proveedor, valores predeterminados
de URL base o metadatos de modelos restringidos por autenticación.

`catalog.order` controla cuándo se fusiona el catálogo de un Plugin con respecto a los
proveedores implícitos integrados de OpenClaw:

- `simple`: proveedores simples con clave API o basados en entorno
- `profile`: proveedores que aparecen cuando existen perfiles de autenticación
- `paired`: proveedores que sintetizan varias entradas relacionadas de proveedor
- `late`: último paso, después de otros proveedores implícitos

Los proveedores posteriores ganan en caso de colisión de clave, por lo que los Plugins pueden
sobrescribir intencionadamente una entrada integrada de proveedor con el mismo ID de proveedor.

Compatibilidad:

- `discovery` sigue funcionando como alias heredado
- si se registran ambos `catalog` y `discovery`, OpenClaw usa `catalog`

## Inspección de canal en modo de solo lectura

Si tu Plugin registra un canal, prefiere implementar
`plugin.config.inspectAccount(cfg, accountId)` junto con `resolveAccount(...)`.

Por qué:

- `resolveAccount(...)` es la ruta de runtime. Puede asumir que las credenciales
  están completamente materializadas y fallar rápido cuando faltan secretos requeridos.
- Las rutas de comando de solo lectura como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` y los flujos de doctor/reparación
  de configuración no deberían necesitar materializar credenciales de runtime solo para
  describir la configuración.

Comportamiento recomendado de `inspectAccount(...)`:

- Devuelve solo el estado descriptivo de la cuenta.
- Conserva `enabled` y `configured`.
- Incluye campos de origen/estado de credenciales cuando sean relevantes, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- No necesitas devolver valores brutos de token solo para informar disponibilidad
  en modo de solo lectura. Devolver `tokenStatus: "available"` (y el campo de origen
  correspondiente) es suficiente para comandos de tipo estado.
- Usa `configured_unavailable` cuando una credencial esté configurada mediante SecretRef pero
  no esté disponible en la ruta actual del comando.

Esto permite que los comandos de solo lectura informen “configurado pero no disponible en esta ruta del comando” en lugar de fallar o informar incorrectamente que la cuenta no está configurada.

## Paquetes packs

Un directorio de Plugin puede incluir un `package.json` con `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Cada entrada se convierte en un Plugin. Si el paquete enumera varias extensiones, el ID del Plugin
pasa a ser `name/<fileBase>`.

Si tu Plugin importa dependencias npm, instálalas en ese directorio para que
`node_modules` esté disponible (`npm install` / `pnpm install`).

Protección de seguridad: cada entrada `openclaw.extensions` debe permanecer dentro del directorio del Plugin
después de resolver enlaces simbólicos. Las entradas que escapen del directorio del paquete se
rechazan.

Nota de seguridad: `openclaw plugins install` instala dependencias de Plugins con
`npm install --omit=dev --ignore-scripts` (sin scripts de ciclo de vida, sin dependencias de desarrollo en runtime). Mantén los árboles de dependencias de Plugins en “JS/TS puro” y evita paquetes que requieran compilaciones `postinstall`.

Opcional: `openclaw.setupEntry` puede apuntar a un módulo ligero solo de configuración.
Cuando OpenClaw necesita superficies de configuración para un Plugin de canal deshabilitado, o
cuando un Plugin de canal está habilitado pero aún no está configurado, carga `setupEntry`
en lugar de la entrada completa del Plugin. Esto mantiene el arranque y la configuración más ligeros
cuando la entrada principal del Plugin también conecta herramientas, hooks u otro código
solo de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
puede hacer que un Plugin de canal opte por la misma ruta `setupEntry` durante la fase
de inicio previa a listen del gateway, incluso cuando el canal ya está configurado.

Usa esto solo cuando `setupEntry` cubra completamente la superficie de inicio que debe existir
antes de que el gateway empiece a escuchar. En la práctica, eso significa que la entrada de configuración
debe registrar toda capacidad propiedad del canal de la que dependa el inicio, como:

- el propio registro del canal
- cualquier ruta HTTP que deba estar disponible antes de que el gateway empiece a escuchar
- cualquier método, herramienta o servicio del gateway que deba existir durante esa misma ventana

Si tu entrada completa sigue siendo propietaria de cualquier capacidad de inicio requerida, no habilites
esta bandera. Mantén el Plugin con el comportamiento predeterminado y deja que OpenClaw cargue la
entrada completa durante el arranque.

Los canales incluidos también pueden publicar helpers de superficie contractual solo de configuración que el núcleo
puede consultar antes de cargar el runtime completo del canal. La superficie actual de promoción
de configuración es:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

El núcleo usa esa superficie cuando necesita promover una configuración heredada de canal de cuenta única
a `channels.<id>.accounts.*` sin cargar la entrada completa del Plugin.
Matrix es el ejemplo incluido actual: mueve solo claves de autenticación/bootstrap a una cuenta promovida con nombre cuando ya existen cuentas con nombre y puede conservar una clave configurada de cuenta predeterminada no canónica en lugar de crear siempre `accounts.default`.

Esos adaptadores de parche de configuración mantienen perezoso el descubrimiento de la superficie contractual incluida. El tiempo de importación sigue siendo ligero; la superficie de promoción se carga solo en el primer uso en lugar de reentrar en el arranque del canal incluido al importar el módulo.

Cuando esas superficies de inicio incluyen métodos RPC del gateway, mantenlos bajo un
prefijo específico del Plugin. Los espacios de nombres administrativos del núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre se resuelven
a `operator.admin`, incluso si un Plugin solicita un ámbito más estrecho.

Ejemplo:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Metadatos de catálogo de canal

Los Plugins de canal pueden anunciar metadatos de configuración/descubrimiento mediante `openclaw.channel` e
indicios de instalación mediante `openclaw.install`. Esto mantiene los datos del catálogo del núcleo sin datos.

Ejemplo:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Chat autohospedado mediante bots webhook de Nextcloud Talk.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Campos útiles de `openclaw.channel` además del ejemplo mínimo:

- `detailLabel`: etiqueta secundaria para superficies más ricas de catálogo/estado
- `docsLabel`: sobrescribe el texto del enlace para el enlace de documentación
- `preferOver`: IDs de Plugin/canal de menor prioridad a los que esta entrada de catálogo debe superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto para la superficie de selección
- `markdownCapable`: marca el canal como compatible con Markdown para decisiones de formato saliente
- `exposure.configured`: oculta el canal de las superficies de listado de canales configurados cuando se establece en `false`
- `exposure.setup`: oculta el canal de los selectores interactivos de configuración cuando se establece en `false`
- `exposure.docs`: marca el canal como interno/privado para superficies de navegación de documentación
- `showConfigured` / `showInSetup`: aliases heredados aún aceptados por compatibilidad; prefiere `exposure`
- `quickstartAllowFrom`: habilita el canal en el flujo estándar de inicio rápido `allowFrom`
- `forceAccountBinding`: requiere vinculación explícita de cuenta incluso cuando solo existe una cuenta
- `preferSessionLookupForAnnounceTarget`: prefiere la búsqueda de sesión al resolver destinos de anuncio

OpenClaw también puede fusionar **catálogos de canales externos** (por ejemplo, una
exportación de registro MPM). Coloca un archivo JSON en una de estas rutas:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

O apunta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a
uno o varios archivos JSON (delimitados por comas/punto y coma/`PATH`). Cada archivo debe
contener `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. El analizador también acepta `"packages"` o `"plugins"` como aliases heredados de la clave `"entries"`.

Las entradas generadas del catálogo de canales y las entradas del catálogo de instalación de proveedores exponen
datos normalizados de origen de instalación junto al bloque bruto `openclaw.install`. Los
datos normalizados identifican si la especificación npm es una versión exacta o un selector flotante,
si están presentes los metadatos de integridad esperados y si también hay disponible una
ruta de origen local. Cuando se conoce la identidad del catálogo/paquete, los
datos normalizados advierten si el nombre del paquete npm analizado difiere de esa identidad.
También advierten cuando `defaultChoice` no es válido o apunta a una fuente que
no está disponible, y cuando hay metadatos de integridad npm presentes sin una fuente npm válida.
Los consumidores deben tratar `installSource` como un campo opcional aditivo para que
las entradas antiguas construidas a mano y los shims de compatibilidad no tengan que sintetizarlo.
Esto permite que la incorporación y los diagnósticos expliquen el estado del plano de origen sin
importar el runtime del Plugin.

Las entradas npm externas oficiales deberían preferir un `npmSpec` exacto más
`expectedIntegrity`. Los nombres simples de paquete y dist-tags siguen funcionando por
compatibilidad, pero muestran advertencias del plano de origen para que el catálogo pueda avanzar
hacia instalaciones fijadas y verificadas por integridad sin romper los Plugins existentes.
Cuando la incorporación instala desde una ruta local de catálogo, registra una
entrada `plugins.installs` con `source: "path"` y un `sourcePath` relativo al espacio de trabajo
cuando es posible. La ruta operativa absoluta de carga permanece en
`plugins.load.paths`; el registro de instalación evita duplicar rutas locales de estación de trabajo
en una configuración duradera. Esto mantiene visibles las instalaciones locales de desarrollo para los
diagnósticos del plano de origen sin añadir una segunda superficie bruta de divulgación de rutas del sistema de archivos.

## Plugins de motor de contexto

Los Plugins de motor de contexto son propietarios de la orquestación del contexto de sesión para ingestión,
ensamblado y Compaction. Regístralos desde tu Plugin con
`api.registerContextEngine(id, factory)` y luego selecciona el motor activo con
`plugins.slots.contextEngine`.

Usa esto cuando tu Plugin necesite sustituir o ampliar el pipeline de contexto predeterminado
en lugar de solo añadir búsqueda de memoria o hooks.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Si tu motor **no** es propietario del algoritmo de Compaction, mantén `compact()`
implementado y delégalo explícitamente:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Añadir una nueva capacidad

Cuando un Plugin necesita un comportamiento que no encaja en la API actual, no omitas
el sistema de Plugins con un acceso privado interno. Añade la capacidad que falta.

Secuencia recomendada:

1. define el contrato del núcleo
   Decide qué comportamiento compartido debe ser propiedad del núcleo: política, respaldo, combinación de configuración,
   ciclo de vida, semántica de cara al canal y forma del helper de runtime.
2. añade superficies tipadas de registro/runtime de Plugin
   Amplía `OpenClawPluginApi` y/o `api.runtime` con la superficie tipada de capacidad más pequeña que sea útil.
3. conecta el núcleo + consumidores de canal/función
   Los canales y Plugins de funciones deben consumir la nueva capacidad a través del núcleo,
   no importando directamente una implementación de proveedor.
4. registra implementaciones de proveedores
   Los Plugins de proveedor registran entonces sus backends contra la capacidad.
5. añade cobertura del contrato
   Añade pruebas para que la propiedad y la forma del registro sigan siendo explícitas con el tiempo.

Así es como OpenClaw sigue siendo opinado sin quedar codificado de forma rígida a la
visión del mundo de un solo proveedor. Consulta el [Capability Cookbook](/es/plugins/architecture)
para ver una lista concreta de archivos y un ejemplo práctico.

### Lista de comprobación de capacidad

Cuando añadas una nueva capacidad, la implementación normalmente debería tocar estas
superficies juntas:

- tipos de contrato del núcleo en `src/<capability>/types.ts`
- helper de runtime/ejecutor del núcleo en `src/<capability>/runtime.ts`
- superficie de registro de la API del Plugin en `src/plugins/types.ts`
- conexión del registro de Plugins en `src/plugins/registry.ts`
- exposición del runtime de Plugins en `src/plugins/runtime/*` cuando los Plugins
  de función/canal necesiten consumirla
- helpers de captura/pruebas en `src/test-utils/plugin-registration.ts`
- aserciones de propiedad/contrato en `src/plugins/contracts/registry.ts`
- documentación para operadores/Plugins en `docs/`

Si falta una de esas superficies, normalmente es una señal de que la capacidad
aún no está completamente integrada.

### Plantilla de capacidad

Patrón mínimo:

```ts
// contrato del núcleo
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API del Plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// helper compartido de runtime para Plugins de función/canal
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Patrón de prueba de contrato:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Eso mantiene la regla simple:

- el núcleo es propietario del contrato de capacidad + la orquestación
- los Plugins de proveedor son propietarios de las implementaciones del proveedor
- los Plugins de función/canal consumen helpers de runtime
- las pruebas de contrato mantienen explícita la propiedad

## Relacionado

- [Arquitectura de Plugins](/es/plugins/architecture) — modelo público de capacidades y formas
- [Subrutas del SDK de Plugins](/es/plugins/sdk-subpaths)
- [Configuración del SDK de Plugins](/es/plugins/sdk-setup)
- [Crear Plugins](/es/plugins/building-plugins)
