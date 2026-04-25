---
read_when:
    - Añadir una nueva capacidad central y una superficie de registro de plugins
    - Decidir si el código pertenece al core, a un plugin de proveedor o a un plugin de funcionalidad
    - Conectar un nuevo helper de tiempo de ejecución para canales o herramientas
sidebarTitle: Adding Capabilities
summary: Guía para colaboradores sobre cómo añadir una nueva capacidad compartida al sistema de plugins de OpenClaw
title: Añadir capacidades (guía para colaboradores)
x-i18n:
    generated_at: "2026-04-25T13:57:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2879b8a4a215dcc44086181e49c510edae93caff01e52c2f5e6b79e6cb02d7b
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  Esta es una **guía para colaboradores** destinada a desarrolladores del core de OpenClaw. Si estás
  creando un plugin externo, consulta [Building Plugins](/es/plugins/building-plugins)
  en su lugar.
</Info>

Usa esto cuando OpenClaw necesite un nuevo dominio, como generación de imágenes, generación de video o alguna futura área funcional respaldada por proveedores.

La regla:

- plugin = límite de propiedad
- capacidad = contrato compartido del core

Eso significa que no debes empezar conectando un proveedor directamente a un canal o a una herramienta. Empieza definiendo la capacidad.

## Cuándo crear una capacidad

Crea una nueva capacidad cuando se cumplan todas estas condiciones:

1. más de un proveedor podría implementarla razonablemente
2. los canales, las herramientas o los plugins de funcionalidad deberían consumirla sin importarles el proveedor
3. el core necesita ser dueño del comportamiento de fallback, política, configuración o entrega

Si el trabajo es exclusivo de un proveedor y todavía no existe un contrato compartido, detente y define primero el contrato.

## La secuencia estándar

1. Define el contrato tipado del core.
2. Añade el registro de plugins para ese contrato.
3. Añade un helper compartido de tiempo de ejecución.
4. Conecta un plugin de proveedor real como prueba.
5. Migra los consumidores de funcionalidad/canal al helper de tiempo de ejecución.
6. Añade pruebas del contrato.
7. Documenta la configuración orientada al operador y el modelo de propiedad.

## Qué va dónde

Core:

- tipos de solicitud/respuesta
- registro de proveedores + resolución
- comportamiento de fallback
- esquema de configuración más metadatos de documentación propagados de `title` / `description` en nodos de objetos anidados, comodines, elementos de arrays y composiciones
- superficie de helpers de tiempo de ejecución

Plugin de proveedor:

- llamadas a la API del proveedor
- manejo de autenticación del proveedor
- normalización específica del proveedor para solicitudes
- registro de la implementación de la capacidad

Plugin de funcionalidad/canal:

- llama a `api.runtime.*` o al helper correspondiente `plugin-sdk/*-runtime`
- nunca llama directamente a una implementación de proveedor

## Capas de proveedor y harness

Usa hooks de proveedor cuando el comportamiento pertenezca al contrato del proveedor del modelo en lugar del bucle genérico del agente. Algunos ejemplos incluyen parámetros de solicitud específicos del proveedor después de la selección del transporte, preferencia de perfil de autenticación, overlays de prompt y enrutamiento de fallback posterior tras un failover de modelo/perfil.

Usa hooks de harness del agente cuando el comportamiento pertenezca al tiempo de ejecución que está ejecutando un turno. Los harnesses pueden clasificar resultados de intentos exitosos pero inutilizables, como respuestas vacías, solo de reasoning o solo de planificación, para que la política externa de fallback del modelo pueda tomar la decisión de reintento.

Mantén ambas capas específicas:

- el core es dueño de la política de reintento/fallback
- los plugins de proveedor son dueños de las pistas específicas del proveedor para solicitud/autenticación/enrutamiento
- los plugins de harness son dueños de la clasificación específica del tiempo de ejecución de intentos
- los plugins de terceros devuelven pistas, no mutaciones directas del estado del core

## Lista de archivos

Para una nueva capacidad, espera tocar estas áreas:

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- uno o más paquetes de plugins empaquetados
- configuración/documentación/pruebas

## Ejemplo: generación de imágenes

La generación de imágenes sigue la forma estándar:

1. el core define `ImageGenerationProvider`
2. el core expone `registerImageGenerationProvider(...)`
3. el core expone `runtime.imageGeneration.generate(...)`
4. los plugins `openai`, `google`, `fal` y `minimax` registran implementaciones respaldadas por proveedores
5. futuros proveedores pueden registrar el mismo contrato sin cambiar canales/herramientas

La clave de configuración es independiente del enrutamiento de análisis de visión:

- `agents.defaults.imageModel` = analizar imágenes
- `agents.defaults.imageGenerationModel` = generar imágenes

Mantén ambos separados para que el fallback y la política sigan siendo explícitos.

## Lista de comprobación de revisión

Antes de publicar una nueva capacidad, verifica:

- ningún canal/herramienta importa código de proveedor directamente
- el helper de tiempo de ejecución es la ruta compartida
- al menos una prueba del contrato afirma la propiedad empaquetada
- la documentación de configuración nombra la nueva clave de modelo/configuración
- la documentación de plugins explica el límite de propiedad

Si un PR omite la capa de capacidad y codifica de forma fija el comportamiento del proveedor en un canal/herramienta, devuélvelo y define primero el contrato.

## Relacionado

- [Plugin](/es/tools/plugin)
- [Creación de Skills](/es/tools/creating-skills)
- [Herramientas y plugins](/es/tools)
