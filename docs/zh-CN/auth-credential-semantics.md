---
read_when:
    - 处理身份验证配置文件解析或凭证路由时
    - 调试模型身份验证失败或配置文件顺序时
summary: 用于身份验证配置文件的规范凭证资格与解析语义
title: 身份验证凭证语义
x-i18n:
    generated_at: "2026-04-23T20:40:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 94661670e510f4571f0e54488bd39772b76a6368448920a7b9362da00e8afc34
    source_path: auth-credential-semantics.md
    workflow: 15
---

本文档定义了以下各处使用的规范凭证资格与解析语义：

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

目标是保持选择时与运行时的行为一致。

## 稳定的探测原因代码

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Token 凭证

Token 凭证（`type: "token"`）支持内联 `token` 和/或 `tokenRef`。

### 资格规则

1. 当 `token` 和 `tokenRef` 都不存在时，token 配置文件不具备资格。
2. `expires` 是可选的。
3. 如果存在 `expires`，它必须是一个大于 `0` 的有限数字。
4. 如果 `expires` 无效（`NaN`、`0`、负数、非有限值或类型错误），则该配置文件不具备资格，原因是 `invalid_expires`。
5. 如果 `expires` 已经过期，则该配置文件不具备资格，原因是 `expired`。
6. `tokenRef` 不会绕过 `expires` 校验。

### 解析规则

1. 解析器对 `expires` 的语义与资格语义一致。
2. 对于具备资格的配置文件，token 内容可以从内联值或 `tokenRef` 解析得到。
3. 无法解析的 ref 会在 `models status --probe` 输出中产生 `unresolved_ref`。

## 显式身份验证顺序过滤

- 当为某个提供商设置了 `auth.order.<provider>` 或 auth-store 顺序覆盖时，`models status --probe` 只会探测在该提供商已解析身份验证顺序中仍然保留的配置文件 id。
- 对于该提供商下存储的配置文件，如果它被显式顺序省略，不会在后续被静默尝试。探测输出会为其报告 `reasonCode: excluded_by_auth_order`，并附带详细信息
  `Excluded by auth.order for this provider.`

## 探测目标解析

- 探测目标可以来自身份验证配置文件、环境变量凭证或
  `models.json`。
- 如果某个提供商有凭证，但 OpenClaw 无法为其解析出可探测的模型候选项，则 `models status --probe` 会报告 `status: no_model`，并带有
  `reasonCode: no_model`。

## OAuth SecretRef 策略保护

- SecretRef 输入仅用于静态凭证。
- 如果配置文件凭证的 `type: "oauth"`，则该配置文件凭证内容不支持 SecretRef 对象。
- 如果 `auth.profiles.<id>.mode` 为 `"oauth"`，则该配置文件基于 SecretRef 的 `keyRef`/`tokenRef` 输入会被拒绝。
- 违反此规则会在启动/热重载身份验证解析路径中触发硬失败。

## 兼容旧版的消息

为兼容脚本，探测错误会保持以下首行不变：

`Auth profile credentials are missing or expired.`

后续行可以添加更易读的详细信息和稳定的原因代码。
