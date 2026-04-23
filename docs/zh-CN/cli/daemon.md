---
read_when:
    - 你仍在脚本中使用 `openclaw daemon ...`
    - 你需要服务生命周期命令（install/start/stop/restart/status）
summary: '`openclaw daemon` 的 CLI 参考（用于 Gateway 网关服务管理的旧别名）'
title: 守护进程
x-i18n:
    generated_at: "2026-04-23T20:43:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35e8cd8ccd03c9bb37595c5b559a81665d584ef5be4aa91277bf0250561a53b8
    source_path: cli/daemon.md
    workflow: 15
---

# `openclaw daemon`

用于 Gateway 网关服务管理命令的旧别名。

`openclaw daemon ...` 会映射到与 `openclaw gateway ...` 服务命令相同的服务控制界面。

## 用法

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## 子命令

- `status`：显示服务安装状态并探测 Gateway 网关健康状态
- `install`：安装服务（`launchd`/`systemd`/`schtasks`）
- `uninstall`：移除服务
- `start`：启动服务
- `stop`：停止服务
- `restart`：重启服务

## 常用选项

- `status`：`--url`、`--token`、`--password`、`--timeout`、`--no-probe`、`--require-rpc`、`--deep`、`--json`
- `install`：`--port`、`--runtime <node|bun>`、`--token`、`--force`、`--json`
- 生命周期操作（`uninstall|start|stop|restart`）：`--json`

说明：

- `status` 会在可能时解析已配置的认证 SecretRef，以用于探测认证。
- 如果此命令路径中某个必需的认证 SecretRef 无法解析，则当探测连接/认证失败时，`daemon status --json` 会报告 `rpc.authWarning`；请显式传入 `--token`/`--password`，或先解析密钥来源。
- 如果探测成功，则会抑制无法解析的 auth-ref 警告，以避免误报。
- `status --deep` 会添加尽力而为的系统级服务扫描。当它发现其他类似 gateway 的服务时，人类可读输出会打印清理提示，并警告每台机器通常仍建议只运行一个 Gateway 网关。
- 在 Linux systemd 安装中，`status` 的 token 漂移检查会同时包含 `Environment=` 和 `EnvironmentFile=` 单元来源。
- 漂移检查会使用合并后的运行时环境解析 `gateway.auth.token` SecretRef（优先使用服务命令环境，其次回退到进程环境）。
- 如果 token 认证实际上未启用（显式 `gateway.auth.mode` 为 `password`/`none`/`trusted-proxy`，或未设置 mode 且 password 可能胜出且不存在可能胜出的 token 候选项），则 token 漂移检查会跳过配置 token 解析。
- 如果 token 认证需要 token 且 `gateway.auth.token` 由 SecretRef 管理，`install` 会验证该 SecretRef 可解析，但不会将解析后的 token 持久化到服务环境元数据中。
- 如果 token 认证需要 token 且配置的 token SecretRef 无法解析，则安装会以关闭失败方式终止。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未设置，则在显式设置 mode 之前会阻止安装。
- 如果你有意在同一主机上运行多个 Gateway 网关，请隔离端口、配置/状态和工作区；请参见 [/gateway#multiple-gateways-same-host](/zh-CN/gateway#multiple-gateways-same-host)。

## 推荐

当前文档和示例请使用 [`openclaw gateway`](/zh-CN/cli/gateway)。
