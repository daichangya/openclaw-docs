---
read_when:
    - Buscas definiciones de canales de lanzamiento públicos
    - Buscas la nomenclatura de versiones y la cadencia
summary: Canales de lanzamiento públicos, nomenclatura de versiones y cadencia
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-04-25T13:56:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc20f30345cbc6c0897e63c9f6a554f9c25be0b52df3efc7d2bbd8827891984a
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw tiene tres vías públicas de lanzamiento:

- stable: lanzamientos etiquetados que publican en npm `beta` de forma predeterminada, o en npm `latest` cuando se solicita explícitamente
- beta: etiquetas de prelanzamiento que publican en npm `beta`
- dev: la cabecera móvil de `main`

## Nomenclatura de versiones

- Versión de lanzamiento estable: `YYYY.M.D`
  - Etiqueta Git: `vYYYY.M.D`
- Versión de lanzamiento estable de corrección: `YYYY.M.D-N`
  - Etiqueta Git: `vYYYY.M.D-N`
- Versión de prelanzamiento beta: `YYYY.M.D-beta.N`
  - Etiqueta Git: `vYYYY.M.D-beta.N`
- No rellenes con ceros el mes ni el día
- `latest` significa el lanzamiento estable actual promovido en npm
- `beta` significa el objetivo de instalación beta actual
- Los lanzamientos estables y las correcciones estables publican en npm `beta` de forma predeterminada; los operadores de lanzamiento pueden apuntar a `latest` explícitamente, o promover después una compilación beta validada
- Cada lanzamiento estable de OpenClaw distribuye juntos el paquete npm y la app de macOS;
  los lanzamientos beta normalmente validan y publican primero la ruta del paquete npm, con
  la compilación/firma/notarización de la app de mac reservada para stable salvo que se solicite explícitamente

## Cadencia de lanzamientos

- Los lanzamientos avanzan primero por beta
- Stable llega solo después de que se valide la beta más reciente
- Los maintainers normalmente generan lanzamientos desde una rama `release/YYYY.M.D` creada
  a partir del `main` actual, para que la validación y las correcciones de lanzamiento no bloqueen
  el desarrollo nuevo en `main`
- Si una etiqueta beta ya se ha enviado o publicado y necesita una corrección, los maintainers crean
  la siguiente etiqueta `-beta.N` en lugar de eliminar o recrear la etiqueta beta anterior
- El procedimiento detallado de lanzamiento, las aprobaciones, las credenciales y las notas de recuperación son
  solo para maintainers

## Verificación previa al lanzamiento

- Ejecuta `pnpm check:test-types` antes de la verificación previa al lanzamiento para que el TypeScript de pruebas siga
  cubierto fuera de la compuerta local más rápida `pnpm check`
- Ejecuta `pnpm check:architecture` antes de la verificación previa al lanzamiento para que las comprobaciones más amplias de
  ciclos de importación y límites de arquitectura estén en verde fuera de la compuerta local más rápida
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que los artefactos de lanzamiento esperados
  `dist/*` y el paquete de Control UI existan para el paso de
  validación del paquete
- Ejecuta `pnpm release:check` antes de cada lanzamiento etiquetado
- Las comprobaciones de lanzamiento ahora se ejecutan en un workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` también ejecuta la compuerta de paridad simulada de QA Lab más las vías de QA activas de
  Matrix y Telegram antes de la aprobación del lanzamiento. Las vías activas usan el entorno
  `qa-live-shared`; Telegram también usa concesiones de credenciales de Convex CI.
- La validación en tiempo de ejecución de instalación y actualización entre sistemas operativos se despacha desde el
  workflow llamador privado
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  que invoca el workflow público reutilizable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta separación es intencional: mantiene la ruta real de lanzamiento en npm corta,
  determinista y centrada en artefactos, mientras que las comprobaciones activas más lentas permanecen en su
  propia vía para que no ralenticen ni bloqueen la publicación
- Las comprobaciones de lanzamiento deben despacharse desde la referencia del workflow de `main` o desde una
  referencia de workflow `release/YYYY.M.D` para que la lógica del workflow y los secretos sigan
  controlados
- Ese workflow acepta una etiqueta de lanzamiento existente o el SHA completo actual de 40 caracteres de la confirmación de la rama del workflow
- En modo SHA de confirmación solo acepta la cabecera actual de la rama del workflow; usa una
  etiqueta de lanzamiento para confirmaciones de lanzamiento más antiguas
- La verificación previa solo de validación de `OpenClaw NPM Release` también acepta el
  SHA completo actual de 40 caracteres de la confirmación de la rama del workflow sin requerir una etiqueta enviada
- Esa ruta SHA es solo de validación y no puede promoverse a una publicación real
- En modo SHA, el workflow sintetiza `v<package.json version>` solo para la comprobación de metadatos
  del paquete; la publicación real sigue requiriendo una etiqueta de lanzamiento real
- Ambos workflows mantienen la ruta real de publicación y promoción en runners hospedados por GitHub, mientras que la ruta de validación no mutante puede usar los
  runners Linux Blacksmith más grandes
- Ese workflow ejecuta
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando los secretos de workflow `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`
- La verificación previa de lanzamiento en npm ya no espera a la vía separada de comprobaciones de lanzamiento
- Ejecuta `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o la etiqueta beta/corrección correspondiente) antes de la aprobación
- Después de publicar en npm, ejecuta
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versión beta/corrección correspondiente) para verificar la ruta de instalación del registro publicado en un prefijo temporal nuevo
- Después de una publicación beta, ejecuta `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar la incorporación del paquete instalado, la configuración de Telegram y el E2E real de Telegram
  contra el paquete npm publicado usando el grupo compartido de credenciales Telegram arrendadas.
  Las ejecuciones puntuales locales de maintainers pueden omitir las variables de Convex y pasar directamente las tres
  credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Los maintainers pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el
  workflow manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y
  no se ejecuta en cada fusión.
- La automatización de lanzamientos para maintainers ahora usa verificación previa y luego promoción:
  - la publicación real en npm debe superar una `preflight_run_id` correcta de npm
  - la publicación real en npm debe despacharse desde la misma rama `main` o
    `release/YYYY.M.D` que la ejecución correcta de verificación previa
  - los lanzamientos estables en npm usan `beta` de forma predeterminada
  - la publicación estable en npm puede apuntar a `latest` explícitamente mediante entrada del workflow
  - la mutación de `dist-tag` de npm basada en token ahora reside en
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por seguridad, porque `npm dist-tag add` sigue necesitando `NPM_TOKEN` mientras que el
    repositorio público mantiene la publicación solo con OIDC
  - el `macOS Release` público es solo de validación
  - la publicación privada real de mac debe superar una comprobación previa privada de mac
    `preflight_run_id` y `validate_run_id`
  - las rutas de publicación reales promueven artefactos preparados en lugar de volver a compilarlos
- Para lanzamientos de corrección estable como `YYYY.M.D-N`, el verificador posterior a la publicación
  también comprueba la misma ruta de actualización de prefijo temporal de `YYYY.M.D` a `YYYY.M.D-N`
  para que las correcciones de lanzamiento no puedan dejar silenciosamente instalaciones globales antiguas en la carga estable base
- La verificación previa de lanzamiento en npm falla de forma cerrada a menos que el tarball incluya tanto
  `dist/control-ui/index.html` como una carga útil no vacía `dist/control-ui/assets/`
  para que no volvamos a distribuir un panel del navegador vacío
- La verificación posterior a la publicación también comprueba que la instalación publicada del registro
  contenga dependencias de tiempo de ejecución de Plugin incluidas y no vacías en el diseño raíz `dist/*`.
  Un lanzamiento que se distribuye con cargas útiles de dependencias de Plugin faltantes o vacías
  falla en el verificador posterior a la publicación y no puede promoverse
  a `latest`.
- `pnpm test:install:smoke` también aplica el presupuesto `unpackedSize` del paquete npm sobre
  el tarball candidato de actualización, para que el e2e del instalador detecte el aumento accidental del tamaño del paquete
  antes de la ruta de publicación del lanzamiento
- Si el trabajo de lanzamiento tocó la planificación de CI, manifiestos de temporización de extensiones o
  matrices de pruebas de extensiones, regenera y revisa las salidas de matriz del workflow
  `checks-node-extensions` propiedad del planificador desde `.github/workflows/ci.yml`
  antes de la aprobación para que las notas de lanzamiento no describan una disposición de CI obsoleta
- La preparación del lanzamiento estable de macOS también incluye las superficies del actualizador:
  - el lanzamiento de GitHub debe terminar con los archivos `.zip`, `.dmg` y `.dSYM.zip` empaquetados
  - `appcast.xml` en `main` debe apuntar al nuevo zip estable después de la publicación
  - la app empaquetada debe mantener un id de bundle no de depuración, una URL de feed Sparkle no vacía
    y un `CFBundleVersion` igual o superior al límite mínimo canónico de compilación de Sparkle
    para esa versión de lanzamiento

## Entradas del workflow de NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento requerida como `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el
  SHA completo actual de 40 caracteres de la confirmación de la rama del workflow para verificación previa solo de validación
- `preflight_only`: `true` solo para validación/compilación/paquete, `false` para la
  ruta de publicación real
- `preflight_run_id`: requerido en la ruta de publicación real para que el workflow reutilice
  el tarball preparado de la ejecución correcta de verificación previa
- `npm_dist_tag`: etiqueta objetivo de npm para la ruta de publicación; de forma predeterminada `beta`

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: etiqueta de lanzamiento existente o el SHA completo actual de 40 caracteres de la confirmación de `main`
  que se va a validar cuando se despacha desde `main`; desde una rama de lanzamiento, usa una
  etiqueta de lanzamiento existente o el SHA completo actual de 40 caracteres de la confirmación de la rama de lanzamiento

Reglas:

- Las etiquetas estables y de corrección pueden publicar en `beta` o en `latest`
- Las etiquetas beta de prelanzamiento solo pueden publicar en `beta`
- Para `OpenClaw NPM Release`, la entrada de SHA completa de confirmación solo se permite cuando
  `preflight_only=true`
- `OpenClaw Release Checks` siempre es solo de validación y también acepta el
  SHA actual de confirmación de la rama del workflow
- El modo SHA de confirmación de las comprobaciones de lanzamiento también requiere la cabecera actual de la rama del workflow
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante la verificación previa;
  el workflow verifica esos metadatos antes de continuar con la publicación

## Secuencia de lanzamiento estable en npm

Al generar un lanzamiento estable en npm:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA completo actual de la confirmación de la rama del workflow
     para una ejecución de prueba solo de validación del workflow de verificación previa
2. Elige `npm_dist_tag=beta` para el flujo normal primero beta, o `latest` solo
   cuando quieras intencionalmente una publicación estable directa
3. Ejecuta `OpenClaw Release Checks` por separado con la misma etiqueta o el
   SHA completo actual de la confirmación de la rama del workflow cuando quieras cobertura activa de caché de prompt,
   paridad de QA Lab, Matrix y Telegram
   - Esto es separado a propósito para que la cobertura activa siga disponible sin
     volver a acoplar comprobaciones largas o inestables al workflow de publicación
4. Guarda el `preflight_run_id` correcto
5. Ejecuta `OpenClaw NPM Release` de nuevo con `preflight_only=false`, la misma
   `tag`, el mismo `npm_dist_tag` y el `preflight_run_id` guardado
6. Si el lanzamiento llegó a `beta`, usa el workflow privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover esa versión estable de `beta` a `latest`
7. Si el lanzamiento se publicó intencionalmente directamente en `latest` y `beta`
   debe seguir inmediatamente la misma compilación estable, usa ese mismo workflow privado
   para apuntar ambas `dist-tags` a la versión estable, o deja que su sincronización de autorreparación programada
   mueva `beta` más tarde

La mutación de `dist-tag` reside en el repositorio privado por seguridad porque todavía
requiere `NPM_TOKEN`, mientras que el repositorio público mantiene la publicación solo con OIDC.

Eso mantiene tanto la ruta de publicación directa como la ruta de promoción primero beta
documentadas y visibles para el operador.

Si un maintainer debe recurrir a autenticación local de npm, ejecuta cualquier comando
de CLI de 1Password (`op`) solo dentro de una sesión dedicada de tmux. No llames a `op`
directamente desde el shell principal del agente; mantenerlo dentro de tmux hace que las solicitudes,
alertas y el manejo de OTP sean observables y evita alertas repetidas del host.

## Referencias públicas

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Los maintainers usan la documentación privada de lanzamiento en
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
como runbook real.

## Relacionado

- [Canales de lanzamiento](/es/install/development-channels)
