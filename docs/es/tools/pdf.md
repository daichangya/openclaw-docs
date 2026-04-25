---
read_when:
    - Quieres analizar PDFs desde agentes
    - Necesitas los parámetros exactos y los límites de la herramienta PDF
    - Estás depurando el modo PDF nativo frente al respaldo de extracción
summary: Analiza uno o más documentos PDF con compatibilidad nativa del proveedor y respaldo de extracción
title: Herramienta PDF
x-i18n:
    generated_at: "2026-04-25T13:58:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89bbc675f2b87729e283659f9604724be7a827b50b11edc853a42c448bbaaf6e
    source_path: tools/pdf.md
    workflow: 15
---

`pdf` analiza uno o más documentos PDF y devuelve texto.

Comportamiento rápido:

- Modo nativo del proveedor para los proveedores de modelos Anthropic y Google.
- Modo de respaldo de extracción para otros proveedores (primero extrae texto y luego imágenes de páginas cuando es necesario).
- Admite entrada única (`pdf`) o múltiple (`pdfs`), con un máximo de 10 PDF por llamada.

## Disponibilidad

La herramienta solo se registra cuando OpenClaw puede resolver una configuración de modelo compatible con PDF para el agente:

1. `agents.defaults.pdfModel`
2. respaldo a `agents.defaults.imageModel`
3. respaldo al modelo de sesión/predeterminado resuelto del agente
4. si los proveedores PDF nativos están respaldados por autenticación, se prefieren antes que los candidatos genéricos de respaldo de imagen

Si no se puede resolver un modelo utilizable, la herramienta `pdf` no se expone.

Notas de disponibilidad:

- La cadena de respaldo tiene en cuenta la autenticación. Un `provider/model` configurado solo cuenta si
  OpenClaw realmente puede autenticar ese proveedor para el agente.
- Actualmente, los proveedores PDF nativos son **Anthropic** y **Google**.
- Si el proveedor de sesión/predeterminado resuelto ya tiene un modelo de visión/PDF
  configurado, la herramienta PDF lo reutiliza antes de recurrir a otros
  proveedores respaldados por autenticación.

## Referencia de entrada

<ParamField path="pdf" type="string">
Una ruta o URL de PDF.
</ParamField>

<ParamField path="pdfs" type="string[]">
Múltiples rutas o URL de PDF, hasta un total de 10.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Prompt de análisis.
</ParamField>

<ParamField path="pages" type="string">
Filtro de páginas como `1-5` o `1,3,7-9`.
</ParamField>

<ParamField path="model" type="string">
Anulación opcional del modelo con formato `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Límite de tamaño por PDF en MB. Usa por defecto `agents.defaults.pdfMaxBytesMb` o `10`.
</ParamField>

Notas de entrada:

- `pdf` y `pdfs` se combinan y deduplican antes de cargarse.
- Si no se proporciona ninguna entrada PDF, la herramienta devuelve un error.
- `pages` se analiza como números de página con índice 1, se deduplica, se ordena y se limita al máximo de páginas configurado.
- `maxBytesMb` usa por defecto `agents.defaults.pdfMaxBytesMb` o `10`.

## Referencias PDF compatibles

- ruta de archivo local (incluida la expansión de `~`)
- URL `file://`
- URL `http://` y `https://`
- referencias entrantes administradas por OpenClaw como `media://inbound/<id>`

Notas sobre referencias:

- Otros esquemas URI (por ejemplo `ftp://`) se rechazan con `unsupported_pdf_reference`.
- En modo sandbox, las URL remotas `http(s)` se rechazan.
- Con la política de archivos solo del espacio de trabajo habilitada, se rechazan las rutas de archivos locales fuera de las raíces permitidas.
- Las referencias entrantes administradas y las rutas reproducidas bajo el almacén de medios entrantes de OpenClaw se permiten con la política de archivos solo del espacio de trabajo.

## Modos de ejecución

### Modo nativo del proveedor

El modo nativo se usa para los proveedores `anthropic` y `google`.
La herramienta envía bytes PDF sin procesar directamente a las API de los proveedores.

Límites del modo nativo:

- `pages` no es compatible. Si se establece, la herramienta devuelve un error.
- La entrada de varios PDF es compatible; cada PDF se envía como un bloque de documento nativo /
  parte PDF en línea antes del prompt.

### Modo de respaldo de extracción

El modo de respaldo se usa para proveedores no nativos.

Flujo:

1. Extraer texto de las páginas seleccionadas (hasta `agents.defaults.pdfMaxPages`, valor predeterminado `20`).
2. Si la longitud del texto extraído es inferior a `200` caracteres, renderizar las páginas seleccionadas a imágenes PNG e incluirlas.
3. Enviar el contenido extraído junto con el prompt al modelo seleccionado.

Detalles del respaldo:

- La extracción de imágenes de páginas usa un presupuesto de píxeles de `4,000,000`.
- Si el modelo de destino no admite entrada de imagen y no hay texto extraíble, la herramienta devuelve un error.
- Si la extracción de texto se realiza correctamente pero la extracción de imágenes requeriría visión en un
  modelo solo de texto, OpenClaw descarta las imágenes renderizadas y continúa con el
  texto extraído.
- El respaldo de extracción usa el plugin integrado `document-extract`. El plugin controla
  `pdfjs-dist`; `@napi-rs/canvas` solo se usa cuando el respaldo de renderizado de imágenes está
  disponible.

## Configuración

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

Consulta [Referencia de configuración](/es/gateway/configuration-reference) para ver todos los detalles de los campos.

## Detalles de salida

La herramienta devuelve texto en `content[0].text` y metadatos estructurados en `details`.

Campos comunes de `details`:

- `model`: referencia del modelo resuelto (`provider/model`)
- `native`: `true` para el modo nativo del proveedor, `false` para el respaldo
- `attempts`: intentos de respaldo que fallaron antes del éxito

Campos de ruta:

- entrada de un solo PDF: `details.pdf`
- entrada de varios PDF: `details.pdfs[]` con entradas `pdf`
- metadatos de reescritura de ruta de sandbox (cuando corresponda): `rewrittenFrom`

## Comportamiento ante errores

- Falta la entrada PDF: lanza `pdf required: provide a path or URL to a PDF document`
- Demasiados PDF: devuelve un error estructurado en `details.error = "too_many_pdfs"`
- Esquema de referencia no compatible: devuelve `details.error = "unsupported_pdf_reference"`
- Modo nativo con `pages`: lanza un error claro `pages is not supported with native PDF providers`

## Ejemplos

Un solo PDF:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Resume este informe en 5 viñetas"
}
```

Varios PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compara los riesgos y los cambios de cronograma en ambos documentos"
}
```

Modelo de respaldo con filtro de páginas:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extrae solo los incidentes que afecten a los clientes"
}
```

## Relacionado

- [Descripción general de herramientas](/es/tools) — todas las herramientas de agentes disponibles
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) — configuración de pdfMaxBytesMb y pdfMaxPages
