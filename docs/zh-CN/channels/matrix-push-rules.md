---
read_when:
    - 为自托管 Synapse 或 Tuwunel 设置 Matrix 安静流式传输
    - 用户只希望在最终完成的分块上收到通知，而不是在每次预览编辑时都收到通知
summary: 针对安静的最终预览编辑的按接收者 Matrix 推送规则
title: 用于安静预览的 Matrix 推送规则
x-i18n:
    generated_at: "2026-04-23T20:41:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07a8cf9a4041b63e13feb21ee2eb22909cb14931d6929bedf6b94315f7a270cf
    source_path: channels/matrix-push-rules.md
    workflow: 15
---

当 `channels.matrix.streaming` 为 `"quiet"` 时，OpenClaw 会原地编辑单个预览事件，并使用自定义内容标记来标识最终完成的编辑。只有当每个用户的推送规则匹配该标记时，Matrix 客户端才会仅在最终编辑时发送通知。本页面面向自托管 Matrix 并希望为每个接收者账户安装该规则的运维人员。

如果你只想使用 Matrix 的默认通知行为，请使用 `streaming: "partial"` 或保持关闭流式传输。参见 [Matrix 渠道设置](/zh-CN/channels/matrix#streaming-previews)。

## 前提条件

- recipient user = 应接收通知的人
- bot user = 发送回复的 OpenClaw Matrix 账户
- 对下面的 API 调用，请使用 recipient user 的访问令牌
- 在推送规则中，将 `sender` 与 bot user 的完整 MXID 匹配
- recipient 账户必须已经配置好可用的 pusher —— 只有在普通 Matrix 推送传递正常时，安静预览规则才会生效

## 步骤

<Steps>
  <Step title="配置安静预览">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="获取接收者的访问令牌">
    尽可能复用现有客户端会话令牌。若要签发新的令牌：

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="确认存在 pusher">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

如果没有返回任何 pusher，请先修复该账户的普通 Matrix 推送传递，再继续。

  </Step>

  <Step title="安装 override 推送规则">
    OpenClaw 会为仅文本的最终预览编辑标记 `content["com.openclaw.finalized_preview"] = true`。安装一条同时匹配该标记和 bot MXID 发送者的规则：

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    运行前请替换：

    - `https://matrix.example.org`：你的 homeserver 基础 URL
    - `$USER_ACCESS_TOKEN`：接收者用户的访问令牌
    - `openclaw-finalized-preview-botname`：对每个 bot、每个接收者都唯一的规则 ID（模式：`openclaw-finalized-preview-<botname>`）
    - `@bot:example.org`：你的 OpenClaw bot MXID，而不是接收者的

  </Step>

  <Step title="验证">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

然后测试一次流式回复。在 quiet 模式下，房间会显示一个安静的草稿预览，并在分块或轮次完成时仅通知一次。

  </Step>
</Steps>

如果之后要删除该规则，请使用接收者的令牌对同一个规则 URL 执行 `DELETE`。

## 多 bot 说明

推送规则通过 `ruleId` 作为键：对同一个 ID 重复执行 `PUT` 会更新单条规则。对于向同一接收者发送通知的多个 OpenClaw bot，请为每个 bot 创建一条规则，并使用不同的发送者匹配条件。

新的用户定义 `override` 规则会插入到默认抑制规则之前，因此不需要额外的排序参数。该规则仅影响那些可以原地完成最终化的纯文本预览编辑；媒体回退和陈旧预览回退仍使用普通 Matrix 传递。

## homeserver 说明

<AccordionGroup>
  <Accordion title="Synapse">
    不需要对 `homeserver.yaml` 做任何特殊修改。如果普通 Matrix 通知已经能送达该用户，那么接收者令牌 + 上面的 `pushrules` 调用就是主要配置步骤。

    如果你在反向代理或 workers 后面运行 Synapse，请确保 `/_matrix/client/.../pushrules/` 能正确到达 Synapse。推送传递由主进程或 `synapse.app.pusher` / 已配置的 pusher workers 处理 —— 请确保它们运行正常。

  </Accordion>

  <Accordion title="Tuwunel">
    流程与 Synapse 相同；最终预览标记不需要任何 Tuwunel 特定配置。

    如果用户在另一台设备上活跃时通知消失，请检查是否启用了 `suppress_push_when_active`。Tuwunel 在 1.4.2（2025 年 9 月）中添加了该选项，它可能会在一台设备活跃时有意抑制向其他设备发送推送。

  </Accordion>
</AccordionGroup>

## 相关内容

- [Matrix 渠道设置](/zh-CN/channels/matrix)
- [流式传输概念](/zh-CN/concepts/streaming)
