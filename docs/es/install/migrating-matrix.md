---
read_when:
    - Actualizar una instalación existente de Matrix
    - Migrar el historial cifrado de Matrix y el estado del dispositivo
summary: Cómo OpenClaw actualiza el Plugin anterior de Matrix in situ, incluidos los límites de recuperación del estado cifrado y los pasos de recuperación manual.
title: Migración de Matrix
x-i18n:
    generated_at: "2026-04-25T13:48:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c35794d7d56d2083905fe4a478463223813b6c901c5c67935fbb9670b51f225
    source_path: install/migrating-matrix.md
    workflow: 15
---

Esta página cubre las actualizaciones desde el Plugin público `matrix` anterior hasta la implementación actual.

Para la mayoría de los usuarios, la actualización se realiza in situ:

- el Plugin sigue siendo `@openclaw/matrix`
- el canal sigue siendo `matrix`
- tu configuración permanece en `channels.matrix`
- las credenciales en caché permanecen en `~/.openclaw/credentials/matrix/`
- el estado de runtime permanece en `~/.openclaw/matrix/`

No necesitas renombrar claves de configuración ni reinstalar el Plugin con un nombre nuevo.

## Qué hace automáticamente la migración

Cuando se inicia el gateway, y cuando ejecutas [`openclaw doctor --fix`](/es/gateway/doctor), OpenClaw intenta reparar automáticamente el estado antiguo de Matrix.
Antes de que cualquier paso de migración de Matrix que sea accionable modifique el estado en disco, OpenClaw crea o reutiliza una instantánea de recuperación específica.

Cuando usas `openclaw update`, el desencadenante exacto depende de cómo esté instalado OpenClaw:

- las instalaciones desde código fuente ejecutan `openclaw doctor --fix` durante el flujo de actualización y luego reinician el gateway de forma predeterminada
- las instalaciones con gestor de paquetes actualizan el paquete, ejecutan una pasada no interactiva de doctor y luego dependen del reinicio predeterminado del gateway para que el arranque pueda completar la migración de Matrix
- si usas `openclaw update --no-restart`, la migración de Matrix respaldada por el arranque se pospone hasta que más tarde ejecutes `openclaw doctor --fix` y reinicies el gateway

La migración automática cubre:

- crear o reutilizar una instantánea previa a la migración en `~/Backups/openclaw-migrations/`
- reutilizar tus credenciales de Matrix en caché
- mantener la misma selección de cuenta y la misma configuración `channels.matrix`
- mover el almacén de sincronización plano de Matrix más antiguo a la ubicación actual con ámbito de cuenta
- mover el almacén criptográfico plano de Matrix más antiguo a la ubicación actual con ámbito de cuenta cuando la cuenta de destino pueda resolverse de forma segura
- extraer una clave de descifrado de copia de seguridad de claves de sala de Matrix guardada previamente del antiguo almacén criptográfico rust, cuando esa clave exista localmente
- reutilizar la raíz de almacenamiento hash de token existente más completa para la misma cuenta de Matrix, homeserver y usuario cuando el token de acceso cambie más tarde
- escanear raíces hermanas de almacenamiento hash de token en busca de metadatos pendientes de restauración de estado cifrado cuando el token de acceso de Matrix haya cambiado pero la identidad de cuenta/dispositivo siga siendo la misma
- restaurar claves de sala respaldadas en el nuevo almacén criptográfico en el siguiente arranque de Matrix

Detalles de la instantánea:

- OpenClaw escribe un archivo marcador en `~/.openclaw/matrix/migration-snapshot.json` después de una instantánea correcta para que los siguientes arranques y pasadas de reparación puedan reutilizar el mismo archivo.
- Estas instantáneas automáticas de migración de Matrix respaldan solo configuración + estado (`includeWorkspace: false`).
- Si Matrix solo tiene estado de migración de advertencia, por ejemplo porque aún faltan `userId` o `accessToken`, OpenClaw todavía no crea la instantánea porque ninguna mutación de Matrix es accionable.
- Si falla el paso de instantánea, OpenClaw omite la migración de Matrix en esa ejecución en lugar de modificar el estado sin un punto de recuperación.

Sobre las actualizaciones multicuenta:

- el almacén plano de Matrix más antiguo (`~/.openclaw/matrix/bot-storage.json` y `~/.openclaw/matrix/crypto/`) provenía de un diseño de almacén único, por lo que OpenClaw solo puede migrarlo a un destino de cuenta de Matrix resuelto
- los almacenes heredados de Matrix ya delimitados por cuenta se detectan y preparan por cada cuenta de Matrix configurada

## Qué no puede hacer la migración automáticamente

El Plugin público anterior de Matrix **no** creaba automáticamente copias de seguridad de claves de sala de Matrix. Conservaba el estado criptográfico local y solicitaba verificación del dispositivo, pero no garantizaba que tus claves de sala estuvieran respaldadas en el homeserver.

Eso significa que algunas instalaciones cifradas solo pueden migrarse parcialmente.

OpenClaw no puede recuperar automáticamente:

- claves de sala solo locales que nunca se respaldaron
- estado cifrado cuando la cuenta Matrix de destino todavía no puede resolverse porque `homeserver`, `userId` o `accessToken` aún no están disponibles
- la migración automática de un almacén plano compartido de Matrix cuando hay varias cuentas de Matrix configuradas pero `channels.matrix.defaultAccount` no está establecido
- instalaciones personalizadas de Plugin por ruta fijadas a una ruta de repositorio en lugar del paquete Matrix estándar
- una clave de recuperación faltante cuando el almacén antiguo tenía claves respaldadas pero no conservaba localmente la clave de descifrado

Alcance actual de las advertencias:

- las instalaciones personalizadas del Plugin Matrix por ruta se muestran tanto en el arranque del gateway como en `openclaw doctor`

Si tu instalación antigua tenía historial cifrado solo local que nunca se respaldó, algunos mensajes cifrados antiguos pueden seguir siendo ilegibles después de la actualización.

## Flujo de actualización recomendado

1. Actualiza OpenClaw y el Plugin Matrix normalmente.
   Prefiere `openclaw update` sin `--no-restart` para que el arranque pueda completar la migración de Matrix inmediatamente.
2. Ejecuta:

   ```bash
   openclaw doctor --fix
   ```

   Si Matrix tiene trabajo de migración accionable, doctor creará o reutilizará primero la instantánea previa a la migración e imprimirá la ruta del archivo.

3. Inicia o reinicia el gateway.
4. Comprueba el estado actual de verificación y copia de seguridad:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Si OpenClaw te indica que se necesita una clave de recuperación, ejecuta:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. Si este dispositivo todavía no está verificado, ejecuta:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

   Si se acepta la clave de recuperación y la copia de seguridad es utilizable, pero `Cross-signing verified`
   sigue siendo `no`, completa la autoverificación desde otro cliente Matrix:

   ```bash
   openclaw matrix verify self
   ```

   Acepta la solicitud en otro cliente Matrix, compara los emoji o los decimales,
   y escribe `yes` solo cuando coincidan. El comando finaliza correctamente solo
   después de que `Cross-signing verified` pase a ser `yes`.

7. Si intencionadamente estás abandonando historial antiguo irrecuperable y quieres una línea base nueva de copia de seguridad para futuros mensajes, ejecuta:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. Si todavía no existe una copia de seguridad de claves en el servidor, crea una para futuras recuperaciones:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Cómo funciona la migración cifrada

La migración cifrada es un proceso de dos etapas:

1. El arranque o `openclaw doctor --fix` crea o reutiliza la instantánea previa a la migración si la migración cifrada es accionable.
2. El arranque o `openclaw doctor --fix` inspecciona el almacén criptográfico antiguo de Matrix mediante la instalación activa del Plugin Matrix.
3. Si se encuentra una clave de descifrado de copia de seguridad, OpenClaw la escribe en el nuevo flujo de claves de recuperación y marca como pendiente la restauración de claves de sala.
4. En el siguiente arranque de Matrix, OpenClaw restaura automáticamente las claves de sala respaldadas en el nuevo almacén criptográfico.

Si el almacén antiguo informa claves de sala que nunca se respaldaron, OpenClaw advierte en lugar de fingir que la recuperación tuvo éxito.

## Mensajes comunes y su significado

### Mensajes de actualización y detección

`Matrix plugin upgraded in place.`

- Significado: se detectó el antiguo estado de Matrix en disco y se migró al diseño actual.
- Qué hacer: nada, a menos que la misma salida incluya también advertencias.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Significado: OpenClaw creó un archivo de recuperación antes de modificar el estado de Matrix.
- Qué hacer: conserva la ruta del archivo impresa hasta que confirmes que la migración tuvo éxito.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Significado: OpenClaw encontró un marcador de instantánea de migración de Matrix ya existente y reutilizó ese archivo en lugar de crear una copia de seguridad duplicada.
- Qué hacer: conserva la ruta del archivo impresa hasta que confirmes que la migración tuvo éxito.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Significado: existe estado antiguo de Matrix, pero OpenClaw no puede asignarlo a una cuenta Matrix actual porque Matrix no está configurado.
- Qué hacer: configura `channels.matrix`, luego vuelve a ejecutar `openclaw doctor --fix` o reinicia el gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Significado: OpenClaw encontró estado antiguo, pero todavía no puede determinar la raíz exacta actual de cuenta/dispositivo.
- Qué hacer: inicia el gateway una vez con un inicio de sesión Matrix funcional, o vuelve a ejecutar `openclaw doctor --fix` después de que existan credenciales en caché.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Significado: OpenClaw encontró un almacén plano compartido de Matrix, pero se niega a adivinar qué cuenta Matrix nombrada debería recibirlo.
- Qué hacer: establece `channels.matrix.defaultAccount` en la cuenta deseada, luego vuelve a ejecutar `openclaw doctor --fix` o reinicia el gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Significado: la nueva ubicación con ámbito de cuenta ya tiene un almacén de sincronización o criptográfico, por lo que OpenClaw no lo sobrescribió automáticamente.
- Qué hacer: verifica que la cuenta actual sea la correcta antes de eliminar o mover manualmente el destino en conflicto.

`Failed migrating Matrix legacy sync store (...)` o `Failed migrating Matrix legacy crypto store (...)`

- Significado: OpenClaw intentó mover estado antiguo de Matrix pero falló la operación del sistema de archivos.
- Qué hacer: inspecciona los permisos del sistema de archivos y el estado del disco, luego vuelve a ejecutar `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Significado: OpenClaw encontró un almacén antiguo cifrado de Matrix, pero no hay una configuración actual de Matrix a la que adjuntarlo.
- Qué hacer: configura `channels.matrix`, luego vuelve a ejecutar `openclaw doctor --fix` o reinicia el gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Significado: el almacén cifrado existe, pero OpenClaw no puede decidir de forma segura a qué cuenta/dispositivo actual pertenece.
- Qué hacer: inicia el gateway una vez con un inicio de sesión Matrix funcional, o vuelve a ejecutar `openclaw doctor --fix` después de que las credenciales en caché estén disponibles.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Significado: OpenClaw encontró un almacén criptográfico heredado plano compartido, pero se niega a adivinar qué cuenta Matrix nombrada debería recibirlo.
- Qué hacer: establece `channels.matrix.defaultAccount` en la cuenta deseada, luego vuelve a ejecutar `openclaw doctor --fix` o reinicia el gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Significado: OpenClaw detectó estado antiguo de Matrix, pero la migración sigue bloqueada por la falta de datos de identidad o credenciales.
- Qué hacer: completa el inicio de sesión o la configuración de Matrix, luego vuelve a ejecutar `openclaw doctor --fix` o reinicia el gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Significado: OpenClaw encontró estado antiguo cifrado de Matrix, pero no pudo cargar el entrypoint auxiliar del Plugin Matrix que normalmente inspecciona ese almacén.
- Qué hacer: reinstala o repara el Plugin Matrix (`openclaw plugins install @openclaw/matrix`, o `openclaw plugins install ./path/to/local/matrix-plugin` para un checkout del repositorio), luego vuelve a ejecutar `openclaw doctor --fix` o reinicia el gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Significado: OpenClaw encontró una ruta de archivo auxiliar que escapa la raíz del Plugin o falla las comprobaciones de límites del Plugin, por lo que se negó a importarla.
- Qué hacer: reinstala el Plugin Matrix desde una ruta de confianza, luego vuelve a ejecutar `openclaw doctor --fix` o reinicia el gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Significado: OpenClaw se negó a modificar el estado de Matrix porque no pudo crear primero la instantánea de recuperación.
- Qué hacer: resuelve el error de copia de seguridad y luego vuelve a ejecutar `openclaw doctor --fix` o reinicia el gateway.

`Failed migrating legacy Matrix client storage: ...`

- Significado: el respaldo del lado cliente de Matrix encontró almacenamiento plano antiguo, pero el movimiento falló. OpenClaw ahora aborta ese respaldo en lugar de iniciar silenciosamente con un almacén nuevo.
- Qué hacer: inspecciona los permisos del sistema de archivos o los conflictos, conserva intacto el estado antiguo y vuelve a intentarlo después de corregir el error.

`Matrix is installed from a custom path: ...`

- Significado: Matrix está fijado a una instalación por ruta, por lo que las actualizaciones de la rama principal no lo reemplazan automáticamente con el paquete Matrix estándar del repositorio.
- Qué hacer: reinstálalo con `openclaw plugins install @openclaw/matrix` cuando quieras volver al Plugin Matrix predeterminado.

### Mensajes de recuperación de estado cifrado

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Significado: las claves de sala respaldadas se restauraron correctamente en el nuevo almacén criptográfico.
- Qué hacer: normalmente nada.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Significado: algunas claves de sala antiguas existían solo en el almacén local antiguo y nunca se habían subido a la copia de seguridad de Matrix.
- Qué hacer: espera que parte del historial cifrado antiguo siga sin estar disponible, a menos que puedas recuperar esas claves manualmente desde otro cliente Matrix verificado.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- Significado: existe una copia de seguridad, pero OpenClaw no pudo recuperar automáticamente la clave de recuperación.
- Qué hacer: ejecuta `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Significado: OpenClaw encontró el almacén cifrado antiguo, pero no pudo inspeccionarlo con la seguridad suficiente como para preparar la recuperación.
- Qué hacer: vuelve a ejecutar `openclaw doctor --fix`. Si se repite, conserva intacto el directorio de estado antiguo y recupera usando otro cliente Matrix verificado más `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Significado: OpenClaw detectó un conflicto de claves de copia de seguridad y se negó a sobrescribir automáticamente el archivo actual de recovery-key.
- Qué hacer: verifica cuál es la clave de recuperación correcta antes de volver a intentar cualquier comando de restauración.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Significado: este es el límite estricto del formato de almacenamiento antiguo.
- Qué hacer: las claves respaldadas aún pueden restaurarse, pero el historial cifrado solo local puede seguir sin estar disponible.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Significado: el nuevo Plugin intentó la restauración, pero Matrix devolvió un error.
- Qué hacer: ejecuta `openclaw matrix verify backup status` y luego vuelve a intentar con `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` si es necesario.

### Mensajes de recuperación manual

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Significado: OpenClaw sabe que deberías tener una clave de copia de seguridad, pero no está activa en este dispositivo.
- Qué hacer: ejecuta `openclaw matrix verify backup restore`, o pasa `--recovery-key` si es necesario.

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- Significado: este dispositivo no tiene actualmente almacenada la clave de recuperación.
- Qué hacer: primero verifica el dispositivo con tu clave de recuperación y luego restaura la copia de seguridad.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- Significado: la clave almacenada no coincide con la copia de seguridad de Matrix activa.
- Qué hacer: vuelve a ejecutar `openclaw matrix verify device "<your-recovery-key>"` con la clave correcta.

Si aceptas perder el historial cifrado antiguo irrecuperable, puedes en su lugar restablecer la
línea base actual de copia de seguridad con `openclaw matrix verify backup reset --yes`. Cuando el
secreto de copia de seguridad almacenado está roto, ese restablecimiento también puede volver a crear el almacenamiento secreto para que la
nueva clave de copia de seguridad pueda cargarse correctamente después del reinicio.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- Significado: la copia de seguridad existe, pero este dispositivo todavía no confía lo suficiente en la cadena de firma cruzada.
- Qué hacer: vuelve a ejecutar `openclaw matrix verify device "<your-recovery-key>"`.

`Matrix recovery key is required`

- Significado: intentaste un paso de recuperación sin proporcionar una clave de recuperación cuando era necesaria.
- Qué hacer: vuelve a ejecutar el comando con tu clave de recuperación.

`Invalid Matrix recovery key: ...`

- Significado: la clave proporcionada no pudo analizarse o no coincidía con el formato esperado.
- Qué hacer: vuelve a intentarlo con la clave de recuperación exacta de tu cliente Matrix o del archivo de recovery-key.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Significado: OpenClaw pudo aplicar la clave de recuperación, pero Matrix todavía no ha
  establecido confianza total de identidad de firma cruzada para este dispositivo. Revisa la
  salida del comando para `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` y `Device verified by owner`.
- Qué hacer: ejecuta `openclaw matrix verify self`, acepta la solicitud en otro
  cliente Matrix, compara el SAS y escribe `yes` solo cuando coincida. El
  comando espera a que exista confianza total de identidad de Matrix antes de informar de éxito. Usa
  `openclaw matrix verify bootstrap --recovery-key "<your-recovery-key>" --force-reset-cross-signing`
  solo cuando realmente quieras reemplazar la identidad actual de firma cruzada.

`Matrix key backup is not active on this device after loading from secret storage.`

- Significado: el almacenamiento secreto no produjo una sesión de copia de seguridad activa en este dispositivo.
- Qué hacer: primero verifica el dispositivo y luego vuelve a comprobar con `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- Significado: este dispositivo no puede restaurar desde almacenamiento secreto hasta que se complete la verificación del dispositivo.
- Qué hacer: primero ejecuta `openclaw matrix verify device "<your-recovery-key>"`.

### Mensajes de instalación personalizada del Plugin

`Matrix is installed from a custom path that no longer exists: ...`

- Significado: tu registro de instalación del Plugin apunta a una ruta local que ya no existe.
- Qué hacer: reinstala con `openclaw plugins install @openclaw/matrix`, o si estás ejecutando desde un checkout del repositorio, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Si el historial cifrado sigue sin volver

Ejecuta estas comprobaciones en orden:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

Si la copia de seguridad se restaura correctamente pero en algunas salas antiguas sigue faltando historial, probablemente esas claves faltantes nunca fueron respaldadas por el Plugin anterior.

## Si quieres empezar de cero para mensajes futuros

Si aceptas perder el historial cifrado antiguo irrecuperable y solo quieres una línea base limpia de copia de seguridad de ahora en adelante, ejecuta estos comandos en orden:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Si el dispositivo sigue sin verificarse después de eso, completa la verificación desde tu cliente Matrix comparando los emoji SAS o los códigos decimales y confirmando que coinciden.

## Páginas relacionadas

- [Matrix](/es/channels/matrix)
- [Doctor](/es/gateway/doctor)
- [Migración](/es/install/migrating)
- [Plugins](/es/tools/plugin)
