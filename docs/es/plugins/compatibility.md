---
read_when:
    - Mantienes un Plugin de OpenClaw
    - Ves una advertencia de compatibilidad de plugins
    - Estás planificando una migración del SDK de plugins o del manifiesto
summary: Contratos de compatibilidad de plugins, metadatos de desaprobación y expectativas de migración
title: Compatibilidad de plugins
x-i18n:
    generated_at: "2026-04-25T13:50:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02e0cdbc763eed5a38b303fc44202ddd36e58bce43dc29b6348db3f5fea66f26
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw mantiene los contratos antiguos de plugins conectados mediante adaptadores de compatibilidad con nombre antes de eliminarlos. Esto protege a los plugins incluidos y externos existentes mientras evolucionan los contratos del SDK, el manifiesto, la configuración, la configuración de arranque, la configuración y el entorno de ejecución del agente.

## Registro de compatibilidad

Los contratos de compatibilidad de plugins se rastrean en el registro central en
`src/plugins/compat/registry.ts`.

Cada registro tiene:

- un código de compatibilidad estable
- estado: `active`, `deprecated`, `removal-pending` o `removed`
- propietario: SDK, config, setup, channel, provider, ejecución de plugins, entorno de ejecución del agente
  o core
- fechas de introducción y desaprobación cuando corresponda
- guía de sustitución
- documentación, diagnósticos y pruebas que cubren el comportamiento antiguo y el nuevo

El registro es la fuente para la planificación de mantenimiento y futuras comprobaciones del inspector de plugins. Si cambia un comportamiento de cara al plugin, añade o actualiza el registro de compatibilidad en el mismo cambio que añade el adaptador.

## Paquete de inspector de plugins

El inspector de plugins debe vivir fuera del repositorio principal de OpenClaw como un paquete/repositorio independiente respaldado por los contratos versionados de compatibilidad y manifiesto.

La CLI del primer día debe ser:

```sh
openclaw-plugin-inspector ./my-plugin
```

Debe emitir:

- validación de manifiesto/esquema
- la versión de compatibilidad del contrato que se está comprobando
- comprobaciones de metadatos de instalación/origen
- comprobaciones de importación en ruta en frío
- advertencias de desaprobación y compatibilidad

Usa `--json` para una salida legible por máquina estable en anotaciones de CI. El
core de OpenClaw debe exponer contratos y fixtures que el inspector pueda consumir, pero no debe publicar el binario del inspector desde el paquete principal `openclaw`.

## Política de desaprobación

OpenClaw no debe eliminar un contrato documentado de plugins en la misma versión
que introduce su sustitución.

La secuencia de migración es:

1. Añadir el nuevo contrato.
2. Mantener el comportamiento antiguo conectado mediante un adaptador de compatibilidad con nombre.
3. Emitir diagnósticos o advertencias cuando quienes mantienen plugins puedan actuar.
4. Documentar la sustitución y el calendario.
5. Probar tanto la ruta antigua como la nueva.
6. Esperar durante la ventana de migración anunciada.
7. Eliminar solo con aprobación explícita de versión incompatible.

Los registros desaprobados deben incluir una fecha de inicio de advertencia, sustitución, enlace a la documentación y fecha objetivo de eliminación cuando se conozca.

## Áreas actuales de compatibilidad

Los registros actuales de compatibilidad incluyen:

- importaciones heredadas amplias del SDK como `openclaw/plugin-sdk/compat`
- formatos heredados de plugins solo con hooks y `before_agent_start`
- comportamiento de lista de permitidos y habilitación de plugins incluidos
- metadatos heredados del manifiesto de variables de entorno de proveedor/canal
- sugerencias de activación que están siendo reemplazadas por la propiedad de contribución del manifiesto
- alias de nombre `embeddedHarness` y `agent-harness` mientras la denominación pública avanza
  hacia `agentRuntime`
- respaldo generado de metadatos de configuración de canal incluido mientras llega
  el metadato `channelConfigs` con enfoque de registro primero

El código nuevo de plugins debe preferir la sustitución listada en el registro y en la
guía de migración específica. Los plugins existentes pueden seguir usando una ruta de compatibilidad
hasta que la documentación, los diagnósticos y las notas de versión anuncien una ventana de eliminación.

## Notas de versión

Las notas de versión deben incluir próximas desaprobaciones de plugins con fechas objetivo y
enlaces a la documentación de migración. Esa advertencia debe ocurrir antes de que una ruta de compatibilidad pase a `removal-pending` o `removed`.
