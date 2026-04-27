---
read_when:
    - 升级现有的 Matrix 安装
    - 迁移已加密的 Matrix 历史记录和设备状态
summary: OpenClaw 如何原地升级旧版 Matrix 插件，包括加密状态恢复限制和手动恢复步骤。
title: Matrix 迁移
x-i18n:
    generated_at: "2026-04-27T06:05:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf7ed5dd886f2e2ba292fbd06b8f5967f8952ec3b1007c466f57e6479044cb30
    source_path: install/migrating-matrix.md
    workflow: 15
---

从之前公开的 `matrix` 插件升级到当前实现。

对大多数用户来说，这是一次原地升级：

- 插件仍然是 `@openclaw/matrix`
- 渠道仍然是 `matrix`
- 你的配置仍然位于 `channels.matrix`
- 缓存的凭证仍然位于 `~/.openclaw/credentials/matrix/`
- 运行时状态仍然位于 `~/.openclaw/matrix/`

你不需要重命名配置键，也不需要用新名称重新安装插件。

## 迁移会自动执行的内容

当 Gateway 网关启动时，以及当你运行 [`openclaw doctor --fix`](/zh-CN/gateway/doctor) 时，OpenClaw 会尝试自动修复旧的 Matrix 状态。
在任何可执行的 Matrix 迁移步骤修改磁盘状态之前，OpenClaw 都会创建或复用一个聚焦的恢复快照。

当你使用 `openclaw update` 时，具体触发方式取决于 OpenClaw 的安装方式：

- 源代码安装会在更新流程中运行 `openclaw doctor --fix`，然后默认重启 gateway
- 软件包管理器安装会更新软件包，运行一次非交互式 doctor 检查，然后依赖默认的 gateway 重启来完成 Matrix 迁移
- 如果你使用 `openclaw update --no-restart`，则依赖启动的 Matrix 迁移会推迟到你之后运行 `openclaw doctor --fix` 并重启 gateway 时才执行

自动迁移包括：

- 在 `~/Backups/openclaw-migrations/` 下创建或复用迁移前快照
- 复用你缓存的 Matrix 凭证
- 保持相同的账户选择和 `channels.matrix` 配置
- 将最旧的扁平 Matrix 同步存储移动到当前按账户划分的位置
- 在能够安全解析目标账户时，将最旧的扁平 Matrix 加密存储移动到当前按账户划分的位置
- 当旧的 rust crypto store 本地存在该密钥时，从中提取之前保存的 Matrix 房间密钥备份解密密钥
- 当访问令牌之后发生变化时，为同一个 Matrix 账户、homeserver 和用户复用现有最完整的令牌哈希存储根目录
- 当 Matrix 访问令牌已变化但账户/设备身份保持不变时，扫描同级令牌哈希存储根目录以查找待恢复的加密状态元数据
- 在下一次 Matrix 启动时，将已备份的房间密钥恢复到新的加密存储中

快照细节：

- 成功创建快照后，OpenClaw 会在 `~/.openclaw/matrix/migration-snapshot.json` 写入一个标记文件，以便后续启动和修复过程复用同一个归档文件。
- 这些自动 Matrix 迁移快照仅备份配置 + 状态（`includeWorkspace: false`）。
- 如果 Matrix 只有仅警告的迁移状态，例如因为 `userId` 或 `accessToken` 仍然缺失，OpenClaw 暂时不会创建快照，因为此时还没有可执行的 Matrix 修改。
- 如果快照步骤失败，OpenClaw 会跳过该次运行中的 Matrix 迁移，而不是在没有恢复点的情况下修改状态。

关于多账户升级：

- 最旧的扁平 Matrix 存储（`~/.openclaw/matrix/bot-storage.json` 和 `~/.openclaw/matrix/crypto/`）来自单一存储布局，因此 OpenClaw 只能将其迁移到一个已解析的 Matrix 目标账户中
- 已经是按账户划分的旧版 Matrix 存储会针对每个已配置的 Matrix 账户分别检测和准备

## 迁移无法自动完成的内容

之前公开的 Matrix 插件**不会**自动创建 Matrix 房间密钥备份。它会持久化本地加密状态并请求设备验证，但并不保证你的房间密钥已经备份到 homeserver。

这意味着某些加密安装只能被部分迁移。

OpenClaw 无法自动恢复以下内容：

- 从未备份过的仅本地房间密钥
- 当 `homeserver`、`userId` 或 `accessToken` 仍不可用、导致目标 Matrix 账户尚无法解析时的加密状态
- 当配置了多个 Matrix 账户但未设置 `channels.matrix.defaultAccount` 时，对单个共享扁平 Matrix 存储的自动迁移
- 固定到仓库路径而非标准 Matrix 软件包的自定义插件路径安装
- 当旧存储已有备份密钥，但未在本地保留解密密钥时，缺失的恢复密钥

当前警告范围：

- 自定义 Matrix 插件路径安装会同时在 gateway 启动和 `openclaw doctor` 中显示

如果你的旧安装中存在从未备份过的仅本地加密历史，升级后某些较旧的加密消息可能仍然无法读取。

## 推荐升级流程

1. 正常更新 OpenClaw 和 Matrix 插件。
   优先使用不带 `--no-restart` 的普通 `openclaw update`，以便启动时立即完成 Matrix 迁移。
2. 运行：

   ```bash
   openclaw doctor --fix
   ```

   如果 Matrix 存在可执行的迁移工作，doctor 会先创建或复用迁移前快照，并打印归档路径。

3. 启动或重启 gateway。
4. 检查当前验证和备份状态：

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. 将你要修复的 Matrix 账户的恢复密钥放入账户专用环境变量中。对于单一默认账户，`MATRIX_RECOVERY_KEY` 即可。对于多个账户，每个账户使用一个变量，例如 `MATRIX_RECOVERY_KEY_ASSISTANT`，并在命令中加上 `--account assistant`。

6. 如果 OpenClaw 提示需要恢复密钥，请为对应账户运行命令：

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. 如果此设备仍未验证，请为对应账户运行命令：

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   如果恢复密钥已被接受且备份可用，但 `Cross-signing verified`
   仍然为 `no`，请在另一个 Matrix 客户端中完成自验证：

   ```bash
   openclaw matrix verify self
   ```

   在另一个 Matrix 客户端中接受请求，比较表情符号或十进制数字，
   仅在它们匹配时输入 `yes`。只有在 `Cross-signing verified` 变为 `yes` 之后，
   命令才会成功退出。

8. 如果你打算有意放弃无法恢复的旧历史，并希望为未来消息建立新的备份基线，请运行：

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. 如果服务器端密钥备份尚不存在，请为未来恢复创建一个：

   ```bash
   openclaw matrix verify bootstrap
   ```

## 加密迁移如何工作

加密迁移是一个两阶段过程：

1. 如果加密迁移可执行，启动或 `openclaw doctor --fix` 会创建或复用迁移前快照。
2. 启动或 `openclaw doctor --fix` 会通过当前已安装的 Matrix 插件检查旧的 Matrix 加密存储。
3. 如果找到备份解密密钥，OpenClaw 会将其写入新的恢复密钥流程，并将房间密钥恢复标记为待处理。
4. 在下一次 Matrix 启动时，OpenClaw 会自动将已备份的房间密钥恢复到新的加密存储中。

如果旧存储报告存在从未备份过的房间密钥，OpenClaw 会发出警告，而不是假装恢复已经成功。

## 常见消息及其含义

### 升级和检测消息

`Matrix plugin upgraded in place.`

- 含义：检测到旧的磁盘 Matrix 状态，并已将其迁移到当前布局。
- 该怎么做：如果同一输出中没有同时包含警告，则无需操作。

`Matrix migration snapshot created before applying Matrix upgrades.`

- 含义：OpenClaw 在修改 Matrix 状态之前创建了恢复归档。
- 该怎么做：在确认迁移成功之前，请保留输出中打印的归档路径。

`Matrix migration snapshot reused before applying Matrix upgrades.`

- 含义：OpenClaw 找到了现有的 Matrix 迁移快照标记，并复用了该归档，而不是创建重复备份。
- 该怎么做：在确认迁移成功之前，请保留输出中打印的归档路径。

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- 含义：存在旧的 Matrix 状态，但由于 Matrix 尚未配置，OpenClaw 无法将其映射到当前 Matrix 账户。
- 该怎么做：配置 `channels.matrix`，然后重新运行 `openclaw doctor --fix` 或重启 gateway。

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 含义：OpenClaw 找到了旧状态，但仍无法确定确切的当前账户/设备根目录。
- 该怎么做：先使用有效的 Matrix 登录启动一次 gateway，或在缓存凭证存在后重新运行 `openclaw doctor --fix`。

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 含义：OpenClaw 找到了一个共享的扁平 Matrix 存储，但拒绝猜测应将其交给哪个具名 Matrix 账户。
- 该怎么做：将 `channels.matrix.defaultAccount` 设置为预期账户，然后重新运行 `openclaw doctor --fix` 或重启 gateway。

`Matrix legacy sync store not migrated because the target already exists (...)`

- 含义：新的按账户划分位置已经有同步存储或加密存储，因此 OpenClaw 没有自动覆盖它。
- 该怎么做：在手动删除或移动冲突目标之前，先确认当前账户确实是正确账户。

`Failed migrating Matrix legacy sync store (...)` 或 `Failed migrating Matrix legacy crypto store (...)`

- 含义：OpenClaw 尝试移动旧的 Matrix 状态，但文件系统操作失败了。
- 该怎么做：检查文件系统权限和磁盘状态，然后重新运行 `openclaw doctor --fix`。

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- 含义：OpenClaw 找到了旧的加密 Matrix 存储，但当前没有可附加到其上的 Matrix 配置。
- 该怎么做：配置 `channels.matrix`，然后重新运行 `openclaw doctor --fix` 或重启 gateway。

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 含义：加密存储存在，但 OpenClaw 无法安全判断它属于哪个当前账户/设备。
- 该怎么做：先使用有效的 Matrix 登录启动一次 gateway，或在缓存凭证可用后重新运行 `openclaw doctor --fix`。

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 含义：OpenClaw 找到了一个共享的扁平旧版加密存储，但拒绝猜测应将其交给哪个具名 Matrix 账户。
- 该怎么做：将 `channels.matrix.defaultAccount` 设置为预期账户，然后重新运行 `openclaw doctor --fix` 或重启 gateway。

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- 含义：OpenClaw 检测到了旧的 Matrix 状态，但迁移仍然被缺失的身份或凭证数据阻塞。
- 该怎么做：完成 Matrix 登录或配置设置，然后重新运行 `openclaw doctor --fix` 或重启 gateway。

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- 含义：OpenClaw 找到了旧的加密 Matrix 状态，但无法从 Matrix 插件加载通常用于检查该存储的辅助入口点。
- 该怎么做：重新安装或修复 Matrix 插件（`openclaw plugins install @openclaw/matrix`，或者对于仓库检出使用 `openclaw plugins install ./path/to/local/matrix-plugin`），然后重新运行 `openclaw doctor --fix` 或重启 gateway。

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- 含义：OpenClaw 找到了一个逃逸插件根目录或未通过插件边界检查的辅助文件路径，因此拒绝导入它。
- 该怎么做：从可信路径重新安装 Matrix 插件，然后重新运行 `openclaw doctor --fix` 或重启 gateway。

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- 含义：OpenClaw 拒绝修改 Matrix 状态，因为它无法先创建恢复快照。
- 该怎么做：先解决备份错误，然后重新运行 `openclaw doctor --fix` 或重启 gateway。

`Failed migrating legacy Matrix client storage: ...`

- 含义：Matrix 客户端侧回退逻辑发现了旧的扁平存储，但移动失败了。OpenClaw 现在会中止该回退流程，而不是静默地以全新存储启动。
- 该怎么做：检查文件系统权限或冲突，保留旧状态不变，并在修复错误后重试。

`Matrix is installed from a custom path: ...`

- 含义：Matrix 被固定为路径安装，因此主线更新不会自动将其替换为仓库的标准 Matrix 软件包。
- 该怎么做：当你想恢复为默认 Matrix 插件时，使用 `openclaw plugins install @openclaw/matrix` 重新安装。

### 加密状态恢复消息

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- 含义：已成功将备份的房间密钥恢复到新的加密存储中。
- 该怎么做：通常无需任何操作。

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- 含义：某些旧房间密钥仅存在于旧的本地存储中，且从未上传到 Matrix 备份。
- 该怎么做：除非你能从另一个已验证客户端手动恢复这些密钥，否则预计部分旧的加密历史仍将不可用。

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- 含义：备份存在，但 OpenClaw 无法自动恢复恢复密钥。
- 该怎么做：运行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`。

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- 含义：OpenClaw 找到了旧的加密存储，但无法足够安全地检查它以准备恢复。
- 该怎么做：重新运行 `openclaw doctor --fix`。如果问题重复出现，请保持旧状态目录不变，并结合另一个已验证的 Matrix 客户端使用 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` 进行恢复。

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- 含义：OpenClaw 检测到了备份密钥冲突，并拒绝自动覆盖当前 recovery-key 文件。
- 该怎么做：在重试任何恢复命令之前，先确认哪个恢复密钥才是正确的。

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- 含义：这是旧存储格式的硬性限制。
- 该怎么做：已备份的密钥仍然可以恢复，但仅本地存在的加密历史可能仍不可用。

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- 含义：新插件尝试恢复时，Matrix 返回了错误。
- 该怎么做：运行 `openclaw matrix verify backup status`，然后在需要时重试 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`。

### 手动恢复消息

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- 含义：OpenClaw 知道你应该有备份密钥，但该密钥当前未在此设备上激活。
- 该怎么做：运行 `openclaw matrix verify backup restore`，或者在需要时设置 `MATRIX_RECOVERY_KEY` 并运行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`。

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- 含义：此设备当前尚未存储恢复密钥。
- 该怎么做：设置 `MATRIX_RECOVERY_KEY`，运行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`，然后恢复备份。

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- 含义：已存储的密钥与当前活跃的 Matrix 备份不匹配。
- 该怎么做：将 `MATRIX_RECOVERY_KEY` 设置为正确的密钥，并运行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

如果你接受失去无法恢复的旧加密历史，也可以改为使用
`openclaw matrix verify backup reset --yes` 重置当前备份基线。当
已存储的备份密钥损坏时，该重置还可能重新创建 secret storage，以便新的
备份密钥在重启后能够正确加载。

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- 含义：备份存在，但该设备对 cross-signing trust chain 的信任尚不够强。
- 该怎么做：设置 `MATRIX_RECOVERY_KEY` 并运行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

`Matrix recovery key is required`

- 含义：你在需要恢复密钥的恢复步骤中没有提供恢复密钥。
- 该怎么做：使用 `--recovery-key-stdin` 重新运行命令，例如 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

`Invalid Matrix recovery key: ...`

- 含义：提供的密钥无法解析，或与预期格式不匹配。
- 该怎么做：使用来自你的 Matrix 客户端或 recovery-key 文件中的准确恢复密钥重试。

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- 含义：OpenClaw 可以应用恢复密钥，但 Matrix 仍未为该设备
  建立完整的 cross-signing 身份信任。请检查命令输出中的
  `Recovery key accepted`、`Backup usable`、
  `Cross-signing verified` 和 `Device verified by owner`。
- 该怎么做：运行 `openclaw matrix verify self`，在另一个
  Matrix 客户端中接受请求，比较 SAS，并且仅在匹配时输入 `yes`。该
  命令会等待完整 Matrix 身份信任建立后才报告成功。仅当你明确想替换当前 cross-signing 身份时，
  才使用
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`。

`Matrix key backup is not active on this device after loading from secret storage.`

- 含义：secret storage 没有在该设备上生成活跃的备份会话。
- 该怎么做：先验证设备，然后使用 `openclaw matrix verify backup status` 再次检查。

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- 含义：在设备验证完成之前，该设备无法从 secret storage 恢复。
- 该怎么做：先运行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

### 自定义插件安装消息

`Matrix is installed from a custom path that no longer exists: ...`

- 含义：你的插件安装记录指向一个已经不存在的本地路径。
- 该怎么做：使用 `openclaw plugins install @openclaw/matrix` 重新安装；如果你是从仓库检出运行，则使用 `openclaw plugins install ./path/to/local/matrix-plugin`。

## 如果加密历史仍未恢复

请按顺序运行以下检查：

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

如果备份恢复成功，但某些旧房间仍然缺少历史记录，那么这些缺失的密钥很可能从未被之前的插件备份过。

## 如果你想为未来消息重新开始

如果你接受失去无法恢复的旧加密历史，并且只想为后续消息建立一个干净的备份基线，请按顺序运行以下命令：

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

如果在此之后设备仍未验证，请在你的 Matrix 客户端中通过比较 SAS 表情符号或十进制代码并确认它们匹配来完成验证。

## 相关页面

- [Matrix](/zh-CN/channels/matrix)
- [Doctor](/zh-CN/gateway/doctor)
- [迁移](/zh-CN/install/migrating)
- [插件](/zh-CN/tools/plugin)
