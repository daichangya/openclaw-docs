---
x-i18n:
    generated_at: "2026-04-25T13:57:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: cccaaa1b3e472279b7548ad5af5d50162db9e99a731e06be796de64ee9f8c8d8
    source_path: superpowers/specs/2026-04-22-tweakcn-custom-theme-import-design.md
    workflow: 15
---

# Diseño de importación de tema personalizado de Tweakcn

Estado: aprobado en terminal el 2026-04-22

## Resumen

Añadir exactamente una ranura de tema personalizado de Control UI local al navegador que pueda importarse desde un enlace compartido de tweakcn. Las familias de temas integradas existentes siguen siendo `claw`, `knot` y `dash`. La nueva familia `custom` se comporta como una familia de temas normal de OpenClaw y admite el modo `light`, `dark` y `system` cuando la carga útil importada de tweakcn incluye conjuntos de tokens tanto claros como oscuros.

El tema importado se almacena solo en el perfil actual del navegador junto con el resto de los ajustes de Control UI. No se escribe en la configuración de Gateway ni se sincroniza entre dispositivos o navegadores.

## Problema

El sistema de temas de Control UI actualmente está cerrado sobre tres familias de temas codificadas de forma rígida:

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

Los usuarios pueden cambiar entre familias integradas y variantes de modo, pero no pueden traer un tema desde tweakcn sin editar el CSS del repositorio. El resultado solicitado es más pequeño que un sistema general de tematización: mantener las tres integradas y añadir una ranura importada controlada por el usuario que pueda reemplazarse desde un enlace de tweakcn.

## Objetivos

- Mantener sin cambios las familias de temas integradas existentes.
- Añadir exactamente una ranura personalizada importada, no una biblioteca de temas.
- Aceptar un enlace compartido de tweakcn o una URL directa `https://tweakcn.com/r/themes/{id}`.
- Persistir el tema importado solo en el almacenamiento local del navegador.
- Hacer que la ranura importada funcione con los controles existentes de modo `light`, `dark` y `system`.
- Mantener un comportamiento de fallo seguro: una importación errónea nunca rompe el tema activo de la IU.

## No objetivos

- No habrá biblioteca de múltiples temas ni lista local al navegador de importaciones.
- No habrá persistencia del lado de Gateway ni sincronización entre dispositivos.
- No habrá editor de CSS arbitrario ni editor sin procesar de JSON de temas.
- No habrá carga automática de recursos remotos de fuentes desde tweakcn.
- No se intentará admitir cargas útiles de tweakcn que solo expongan un modo.
- No habrá refactorización global de tematización del repositorio más allá de las interfaces necesarias para Control UI.

## Decisiones de usuario ya tomadas

- Mantener los tres temas integrados.
- Añadir una ranura de importación basada en tweakcn.
- Almacenar el tema importado en el navegador, no en la configuración de Gateway.
- Admitir `light`, `dark` y `system` para el tema importado.
- Sobrescribir la ranura personalizada con la siguiente importación es el comportamiento previsto.

## Enfoque recomendado

Añadir un cuarto id de familia de temas, `custom`, al modelo de temas de Control UI. La familia `custom` pasa a ser seleccionable solo cuando existe una importación válida de tweakcn. La carga útil importada se normaliza en un registro de tema personalizado específico de OpenClaw y se almacena en el almacenamiento local del navegador junto con el resto de los ajustes de la IU.

En tiempo de ejecución, OpenClaw renderiza una etiqueta `<style>` administrada que define los bloques resueltos de variables CSS personalizadas:

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

Esto mantiene las variables del tema personalizado limitadas al ámbito de la familia `custom` y evita que variables CSS en línea se filtren a las familias integradas.

## Arquitectura

### Modelo de temas

Actualizar `ui/src/ui/theme.ts`:

- Extender `ThemeName` para incluir `custom`.
- Extender `ResolvedTheme` para incluir `custom` y `custom-light`.
- Extender `VALID_THEME_NAMES`.
- Actualizar `resolveTheme()` para que `custom` refleje el comportamiento existente de la familia:
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> `custom` o `custom-light` según la preferencia del SO

No se añaden alias heredados para `custom`.

### Modelo de persistencia

Extender la persistencia de `UiSettings` en `ui/src/ui/storage.ts` con una carga útil opcional de tema personalizado:

- `customTheme?: ImportedCustomTheme`

Forma almacenada recomendada:

```ts
type ImportedCustomTheme = {
  sourceUrl: string;
  themeId: string;
  label: string;
  importedAt: string;
  light: Record<string, string>;
  dark: Record<string, string>;
};
```

Notas:

- `sourceUrl` almacena la entrada original del usuario después de la normalización.
- `themeId` es el id del tema de tweakcn extraído de la URL.
- `label` es el campo `name` de tweakcn cuando está presente; de lo contrario, `Custom`.
- `light` y `dark` ya son mapas de tokens normalizados de OpenClaw, no cargas útiles sin procesar de tweakcn.
- La carga útil importada vive junto a otros ajustes locales del navegador y se serializa en el mismo documento de almacenamiento local.
- Si faltan datos de tema personalizado almacenados o son no válidos al cargar, ignora la carga útil y vuelve a `theme: "claw"` cuando la familia persistida era `custom`.

### Aplicación en runtime

Añadir un administrador de hoja de estilo de tema personalizado acotado en el runtime de Control UI, ubicado cerca de `ui/src/ui/app-settings.ts` y `ui/src/ui/theme.ts`.

Responsabilidades:

- Crear o actualizar una única etiqueta estable `<style id="openclaw-custom-theme">` en `document.head`.
- Emitir CSS solo cuando exista una carga útil válida de tema personalizado.
- Eliminar el contenido de la etiqueta de estilo cuando se borre la carga útil.
- Mantener el CSS de familias integradas en `ui/src/styles/base.css`; no insertar tokens importados en la hoja de estilo versionada.

Este administrador se ejecuta siempre que los ajustes se cargan, guardan, importan o borran.

### Selectores de modo claro

La implementación debe preferir `data-theme-mode="light"` para el estilo claro entre familias en lugar de tratar `custom-light` como caso especial. Si un selector existente está fijado a `data-theme="light"` y necesita aplicarse a toda familia clara, amplíalo como parte de este trabajo.

## UX de importación

Actualizar `ui/src/ui/views/config.ts` en la sección `Appearance`:

- Añadir una tarjeta de tema `Custom` junto a `Claw`, `Knot` y `Dash`.
- Mostrar la tarjeta como deshabilitada cuando no exista un tema personalizado importado.
- Añadir un panel de importación bajo la cuadrícula de temas con:
  - una entrada de texto para un enlace compartido de tweakcn o URL `/r/themes/{id}`
  - un botón `Import`
  - una ruta `Replace` cuando ya exista una carga útil personalizada
  - una acción `Clear` cuando ya exista una carga útil personalizada
- Mostrar la etiqueta del tema importado y el host de origen cuando exista una carga útil.
- Si el tema activo es `custom`, importar un reemplazo se aplica inmediatamente.
- Si el tema activo no es `custom`, importar solo almacena la nueva carga útil hasta que el usuario seleccione la tarjeta `Custom`.

El selector rápido de temas en `ui/src/ui/views/config-quick.ts` también debe mostrar `Custom` solo cuando exista una carga útil.

## Análisis de URL y obtención remota

La ruta de importación del navegador acepta:

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

La implementación debe normalizar ambas formas a:

- `https://tweakcn.com/r/themes/{id}`

Luego el navegador obtiene directamente el endpoint normalizado `/r/themes/{id}`.

Usa un validador de esquema acotado para la carga útil externa. Se prefiere un esquema zod porque este es un límite externo no confiable.

Campos remotos obligatorios:

- `name` de nivel superior como `string` opcional
- `cssVars.theme` como `object` opcional
- `cssVars.light` como `object`
- `cssVars.dark` como `object`

Si falta `cssVars.light` o `cssVars.dark`, rechaza la importación. Esto es deliberado: el comportamiento de producto aprobado es compatibilidad completa de modos, no síntesis de mejor esfuerzo de un lado faltante.

## Mapeo de tokens

No reflejes ciegamente las variables de tweakcn. Normaliza un subconjunto acotado en tokens de OpenClaw y deriva el resto en un helper.

### Tokens importados directamente

Desde cada bloque de modo de tweakcn:

- `background`
- `foreground`
- `card`
- `card-foreground`
- `popover`
- `popover-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `destructive-foreground`
- `border`
- `input`
- `ring`
- `radius`

Desde `cssVars.theme` compartido cuando esté presente:

- `font-sans`
- `font-mono`

Si un bloque de modo sobrescribe `font-sans`, `font-mono` o `radius`, gana el valor local del modo.

### Tokens derivados para OpenClaw

El importador deriva variables exclusivas de OpenClaw a partir de los colores base importados:

- `--bg-accent`
- `--bg-elevated`
- `--bg-hover`
- `--panel`
- `--panel-strong`
- `--panel-hover`
- `--chrome`
- `--chrome-strong`
- `--text`
- `--text-strong`
- `--chat-text`
- `--muted`
- `--muted-strong`
- `--accent-hover`
- `--accent-muted`
- `--accent-subtle`
- `--accent-glow`
- `--focus`
- `--focus-ring`
- `--focus-glow`
- `--secondary`
- `--secondary-foreground`
- `--danger`
- `--danger-muted`
- `--danger-subtle`

Las reglas de derivación viven en un helper puro para que puedan probarse de forma independiente. Las fórmulas exactas de mezcla de colores son un detalle de implementación, pero el helper debe cumplir dos restricciones:

- preservar un contraste legible cercano a la intención del tema importado
- producir una salida estable para la misma carga útil importada

### Tokens ignorados en v1

Estos tokens de tweakcn se ignoran intencionalmente en la primera versión:

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

Esto mantiene el alcance en los tokens que el Control UI actual realmente necesita.

### Fuentes

Las cadenas de pila de fuentes se importan si están presentes, pero OpenClaw no carga recursos remotos de fuentes en v1. Si la pila importada hace referencia a fuentes que no están disponibles en el navegador, se aplica el comportamiento normal de reserva.

## Comportamiento ante fallos

Las importaciones erróneas deben fallar de forma cerrada.

- Formato de URL no válido: mostrar error de validación en línea, no obtener.
- Host o forma de ruta no compatibles: mostrar error de validación en línea, no obtener.
- Fallo de red, respuesta no OK o JSON malformado: mostrar error en línea, mantener intacta la carga útil almacenada actual.
- Fallo de esquema o ausencia de bloques `light`/`dark`: mostrar error en línea, mantener intacta la carga útil almacenada actual.
- Acción Clear:
  - elimina la carga útil personalizada almacenada
  - elimina el contenido de la etiqueta de estilo personalizada administrada
  - si `custom` está activo, cambia la familia del tema de vuelta a `claw`
- Carga útil personalizada almacenada no válida en la primera carga:
  - ignora la carga útil almacenada
  - no emite CSS personalizado
  - si la familia de tema persistida era `custom`, vuelve a `claw`

En ningún momento una importación fallida debe dejar el documento activo con variables CSS personalizadas parciales aplicadas.

## Archivos que se espera cambiar en la implementación

Archivos principales:

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

Posibles nuevos helpers:

- `ui/src/ui/custom-theme.ts`
- `ui/src/ui/custom-theme-import.ts`

Pruebas:

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- nuevas pruebas enfocadas para análisis de URL y normalización de cargas útiles

## Pruebas

Cobertura mínima de implementación:

- analizar una URL de enlace compartido para obtener el id del tema de tweakcn
- normalizar `/themes/{id}` y `/r/themes/{id}` en la URL de obtención
- rechazar hosts no compatibles e ids malformados
- validar la forma de la carga útil de tweakcn
- mapear una carga útil válida de tweakcn en mapas de tokens normalizados `light` y `dark` de OpenClaw
- cargar y guardar la carga útil personalizada en los ajustes locales del navegador
- resolver `custom` para `light`, `dark` y `system`
- deshabilitar la selección de `Custom` cuando no exista carga útil
- aplicar el tema importado inmediatamente cuando `custom` ya esté activo
- volver a `claw` cuando se borre el tema personalizado activo

Objetivo de verificación manual:

- importar un tema conocido de tweakcn desde Settings
- cambiar entre `light`, `dark` y `system`
- cambiar entre `custom` y las familias integradas
- recargar la página y confirmar que el tema personalizado importado persiste localmente

## Notas de despliegue

Esta funcionalidad es intencionalmente pequeña. Si más adelante los usuarios solicitan múltiples temas importados, cambio de nombre, exportación o sincronización entre dispositivos, trátalo como un diseño posterior. No construyas por adelantado una abstracción de biblioteca de temas en esta implementación.
