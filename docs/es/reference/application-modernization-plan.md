---
read_when:
    - Planificación de una amplia modernización de aplicaciones de OpenClaw
    - Actualización de los estándares de implementación de frontend para trabajo en la aplicación o en la interfaz de usuario de Control
    - Convertir una revisión amplia de la calidad del producto en trabajo de ingeniería por fases
summary: Plan integral de modernización de aplicaciones con actualizaciones de habilidades de entrega de frontend
title: Plan de modernización de aplicaciones
x-i18n:
    generated_at: "2026-04-25T13:56:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 667a133cb867bb1d4d09e097925704c8b77d20ca6117a62a4c60d29ab1097283
    source_path: reference/application-modernization-plan.md
    workflow: 15
---

# Plan de modernización de aplicaciones

## Objetivo

Llevar la aplicación hacia un producto más limpio, rápido y fácil de mantener sin
romper los flujos de trabajo actuales ni ocultar riesgos en refactorizaciones amplias. El trabajo debe
entregarse en partes pequeñas y revisables, con pruebas para cada superficie modificada.

## Principios

- Preservar la arquitectura actual, a menos que un límite esté causando de forma demostrable rotación,
  costo de rendimiento o errores visibles para el usuario.
- Preferir el parche correcto más pequeño para cada problema y luego repetir.
- Separar las correcciones necesarias del pulido opcional para que quienes mantienen el proyecto puedan entregar trabajo de alto
  valor sin esperar decisiones subjetivas.
- Mantener el comportamiento orientado a Plugins documentado y retrocompatible.
- Verificar el comportamiento publicado, los contratos de dependencias y las pruebas antes de afirmar que una
  regresión está corregida.
- Mejorar primero la ruta principal del usuario: incorporación, autenticación, chat, configuración de proveedores,
  gestión de Plugins y diagnósticos.

## Fase 1: Auditoría de referencia

Haz inventario de la aplicación actual antes de cambiarla.

- Identifica los principales flujos de trabajo del usuario y las superficies de código que los poseen.
- Enumera affordances muertos, configuraciones duplicadas, estados de error poco claros y rutas de renderizado costosas.
- Captura los comandos de validación actuales para cada superficie.
- Marca los problemas como necesarios, recomendados u opcionales.
- Documenta los bloqueadores conocidos que requieren revisión del propietario, especialmente cambios de API, seguridad,
  lanzamiento y contratos de Plugins.

Definición de terminado:

- Una lista de problemas con referencias de archivos desde la raíz del repositorio.
- Cada problema tiene severidad, superficie propietaria, impacto esperado en el usuario y una ruta de validación propuesta.
- No se mezclan elementos de limpieza especulativa con correcciones necesarias.

## Fase 2: Limpieza de producto y UX

Prioriza los flujos visibles y elimina la confusión.

- Ajusta el texto de incorporación y los estados vacíos en torno a la autenticación de modelos, el estado del Gateway
  y la configuración de Plugins.
- Elimina o desactiva affordances muertos cuando no sea posible realizar ninguna acción.
- Mantén visibles las acciones importantes en anchos responsivos en lugar de ocultarlas
  detrás de suposiciones frágiles de diseño.
- Consolida el lenguaje de estado repetido para que los errores tengan una única fuente de verdad.
- Añade revelación progresiva para configuraciones avanzadas, manteniendo rápida la configuración principal.

Validación recomendada:

- Ruta feliz manual para la configuración de primer uso y el inicio de usuarios existentes.
- Pruebas enfocadas para cualquier lógica de enrutamiento, persistencia de configuración o derivación de estado.
- Capturas de pantalla del navegador para las superficies responsivas modificadas.

## Fase 3: Ajuste de la arquitectura de frontend

Mejora la mantenibilidad sin una reescritura amplia.

- Mueve las transformaciones repetidas de estado de UI a helpers tipados y acotados.
- Mantén separadas las responsabilidades de obtención de datos, persistencia y presentación.
- Prefiere hooks, stores y patrones de componentes existentes frente a nuevas abstracciones.
- Divide componentes sobredimensionados solo cuando reduzca el acoplamiento o aclare las pruebas.
- Evita introducir estado global amplio para interacciones locales de paneles.

Barandillas obligatorias:

- No cambies el comportamiento público como efecto secundario de dividir archivos.
- Mantén intacto el comportamiento de accesibilidad para menús, diálogos, pestañas y navegación
  por teclado.
- Verifica que los estados de carga, vacío, error y optimistas sigan renderizándose.

## Fase 4: Rendimiento y fiabilidad

Apunta al dolor medido en lugar de a una optimización teórica amplia.

- Mide los costos de inicio, transición de rutas, listas grandes y transcripciones de chat.
- Sustituye datos derivados costosos y repetidos por selectores memoizados o helpers en caché
  donde el perfilado demuestre valor.
- Reduce los escaneos evitables de red o sistema de archivos en rutas críticas.
- Mantén el orden determinista para entradas de prompts, registros, archivos, Plugins y red
  antes de la construcción de la carga útil del modelo.
- Añade pruebas ligeras de regresión para helpers críticos y límites de contrato.

Definición de terminado:

- Cada cambio de rendimiento registra la referencia, el impacto esperado, el impacto real y
  la brecha restante.
- Ningún parche de rendimiento se entrega solo por intuición cuando hay medición barata disponible.

## Fase 5: Refuerzo de tipos, contratos y pruebas

Eleva la corrección en los puntos de límite de los que dependen los usuarios y los autores de Plugins.

- Sustituye cadenas sueltas en tiempo de ejecución por uniones discriminadas o listas cerradas de códigos.
- Valida entradas externas con helpers de esquema existentes o zod.
- Añade pruebas de contrato en torno a manifiestos de Plugins, catálogos de proveedores, mensajes del protocolo Gateway
  y comportamiento de migración de configuración.
- Mantén las rutas de compatibilidad en flujos de doctor o reparación en lugar de
  migraciones ocultas en tiempo de inicio.
- Evita el acoplamiento de pruebas únicamente a internos de Plugins; usa fachadas del SDK y barrels documentados.

Validación recomendada:

- `pnpm check:changed`
- Pruebas dirigidas para cada límite modificado.
- `pnpm build` cuando cambien límites perezosos, empaquetado o superficies publicadas.

## Fase 6: Documentación y preparación para lanzamiento

Mantén la documentación orientada al usuario alineada con el comportamiento.

- Actualiza la documentación con cambios de comportamiento, API, configuración, incorporación o Plugins.
- Añade entradas al changelog solo para cambios visibles para el usuario.
- Mantén la terminología de Plugins orientada al usuario; usa nombres internos de paquetes solo donde
  sea necesario para quienes contribuyen.
- Confirma que las instrucciones de instalación y lanzamiento siguen coincidiendo con la superficie
  actual de comandos.

Definición de terminado:

- La documentación relevante se actualiza en la misma rama que los cambios de comportamiento.
- Las comprobaciones de deriva de documentación o API generadas pasan cuando se modifican.
- La entrega nombra cualquier validación omitida y por qué se omitió.

## Primera parte recomendada

Comienza con una pasada acotada de la interfaz de usuario de Control y la incorporación:

- Audita la configuración de primer uso, la preparación de autenticación de proveedores, el estado del Gateway y las
  superficies de configuración de Plugins.
- Elimina acciones muertas y aclara los estados de fallo.
- Añade o actualiza pruebas enfocadas para derivación de estado y persistencia de configuración.
- Ejecuta `pnpm check:changed`.

Esto aporta alto valor al usuario con un riesgo arquitectónico limitado.

## Actualización de Skills de frontend

Usa esta sección para actualizar el `SKILL.md` enfocado en frontend que se proporciona con la
tarea de modernización. Si adoptas esta guía como una Skill local del repositorio de OpenClaw,
crea primero `.agents/skills/openclaw-frontend/SKILL.md`, mantén el frontmatter
que pertenece a esa Skill de destino y luego añade o sustituye la guía del cuerpo con
el siguiente contenido.

```markdown
# Estándares de entrega de frontend

Usa esta Skill al implementar o revisar trabajo de UI orientado al usuario en React, Next.js,
webview de escritorio o aplicación.

## Reglas operativas

- Parte del flujo de producto existente y de las convenciones de código.
- Prefiere el parche correcto más pequeño que mejore la ruta actual del usuario.
- Separa las correcciones necesarias del pulido opcional en la entrega.
- No construyas páginas de marketing cuando la solicitud sea para una superficie de aplicación.
- Mantén las acciones visibles y utilizables en todos los tamaños de viewport compatibles.
- Elimina affordances muertos en lugar de dejar controles que no pueden actuar.
- Preserva los estados de carga, vacío, error, éxito y permisos.
- Usa componentes, hooks, stores e iconos existentes del sistema de diseño antes de añadir
  nuevas primitivas.

## Lista de verificación de implementación

1. Identifica la tarea principal del usuario y el componente o ruta que la posee.
2. Lee los patrones locales de componentes antes de editar.
3. Aplica el parche en la superficie más acotada que resuelva el problema.
4. Añade restricciones responsivas para controles de formato fijo, barras de herramientas, cuadrículas y
   contadores, de modo que el texto y los estados hover no puedan redimensionar el diseño de forma inesperada.
5. Mantén claras las responsabilidades de carga de datos, derivación de estado y renderizado.
6. Añade pruebas cuando cambien lógica, persistencia, enrutamiento, permisos o helpers
   compartidos.
7. Verifica la ruta feliz principal y el caso límite más relevante.

## Puertas de calidad visual

- El texto debe caber dentro de su contenedor en móvil y escritorio.
- Las barras de herramientas pueden ajustarse en varias líneas, pero los controles deben seguir siendo accesibles.
- Los botones deben usar iconos conocidos cuando el icono sea más claro que el texto.
- Las tarjetas deben usarse para elementos repetidos, modales y herramientas enmarcadas, no para
  cada sección de página.
- Evita paletas de color monótonas y fondos decorativos que compitan con el contenido
  operativo.
- Las superficies densas de producto deben optimizarse para escaneo, comparación y uso
  repetido.

## Formato de entrega

Informa:

- Qué cambió.
- Qué comportamiento del usuario cambió.
- Qué validación obligatoria se aprobó.
- Cualquier validación omitida y la razón concreta.
- Trabajo opcional de seguimiento, claramente separado de las correcciones necesarias.
```
