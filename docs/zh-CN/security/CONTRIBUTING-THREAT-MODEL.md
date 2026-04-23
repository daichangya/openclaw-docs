---
read_when:
    - |-
      你希望贡献安全发现或威胁场景＿日本assistant to=functions.read in commentary  天天中彩票为什么  盈立json_object
      {"path":"/home/runner/work/docs/docs/source/AGENTS.md","offset":1,"limit":220}
    - 审查或更新威胁模型
summary: 如何为 OpenClaw 威胁模型作出贡献
title: 为威胁模型作出贡献
x-i18n:
    generated_at: "2026-04-23T21:04:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 228789a56c9519274a15f86b8829753e0229974ca2ed7609a43af740792ce4cd
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 15
---

# 为 OpenClaw 威胁模型作出贡献

感谢你帮助提升 OpenClaw 的安全性。这个威胁模型是一份持续演进的文档，我们欢迎任何人参与贡献——你不需要是安全专家。

## 贡献方式

### 添加一个威胁

发现了我们尚未覆盖的攻击向量或风险？请在 [openclaw/trust](https://github.com/openclaw/trust/issues) 上提交 issue，并用你自己的话描述它。你不需要了解任何框架，也不必填写每一个字段——只需描述这个场景即可。

**有帮助但非必需的信息包括：**

- 攻击场景以及它可能如何被利用
- OpenClaw 中哪些部分受到影响（CLI、gateway、channels、ClawHub、MCP servers 等）
- 你认为它有多严重（low / medium / high / critical）
- 任何相关研究、CVE 或真实世界案例的链接

我们会在审查过程中处理 ATLAS 映射、威胁 ID 和风险评估。如果你愿意附上这些细节，那当然很好——但并不是要求。

> **这里用于向威胁模型中添加内容，而不是报告正在发生的漏洞。** 如果你发现了一个可利用漏洞，请参阅我们的 [Trust 页面](https://trust.openclaw.ai) 了解负责任披露说明。

### 提出缓解措施建议

对如何解决某个现有威胁有想法吗？请提交 issue 或 PR，并引用该威胁。有效的缓解措施应当具体且可执行——例如，“在 gateway 处对每个发送者实施每分钟 10 条消息的速率限制”就比“实现速率限制”更好。

### 提出攻击链

攻击链展示了多个威胁如何组合成一个真实的攻击场景。如果你发现了一个危险组合，请描述其中的步骤，以及攻击者会如何将它们串联起来。相比正式模板，对攻击在实践中如何展开的一段简短叙述更有价值。

### 修复或改进现有内容

错别字、澄清说明、过时信息、更好的示例——欢迎提交 PR，无需先开 issue。

## 我们使用的内容

### MITRE ATLAS

这个威胁模型基于 [MITRE ATLAS](https://atlas.mitre.org/)（面向 AI 系统的对抗性威胁态势），这是一个专门为 AI/ML 威胁设计的框架，涵盖提示注入、工具滥用和智能体利用等内容。你不需要了解 ATLAS 才能贡献——我们会在审查时将提交内容映射到该框架。

### 威胁 ID

每个威胁都会获得一个类似 `T-EXEC-003` 的 ID。分类如下：

| 代码    | 类别                               |
| ------- | ---------------------------------- |
| RECON   | Reconnaissance - 信息收集          |
| ACCESS  | Initial access - 获取初始访问权限  |
| EXEC    | Execution - 执行恶意操作           |
| PERSIST | Persistence - 维持访问权限         |
| EVADE   | Defense evasion - 规避检测         |
| DISC    | Discovery - 了解环境               |
| EXFIL   | Exfiltration - 窃取数据            |
| IMPACT  | Impact - 造成损害或中断            |

ID 会由维护者在审查期间分配。你不需要自己选择。

### 风险级别

| 级别          | 含义                                                              |
| ------------- | ----------------------------------------------------------------- |
| **Critical**  | 整个系统被完全攻破，或高概率 + 严重影响                          |
| **High**      | 很可能造成重大损害，或中等概率 + 严重影响                        |
| **Medium**    | 中等风险，或低概率 + 高影响                                      |
| **Low**       | 发生可能性低，且影响有限                                          |

如果你不确定风险级别，只需描述影响，我们会进行评估。

## 审查流程

1. **分流** —— 我们会在 48 小时内审查新的提交内容
2. **评估** —— 我们会验证可行性，分配 ATLAS 映射和威胁 ID，并确认风险级别
3. **文档整理** —— 我们会确保所有内容格式正确且信息完整
4. **合并** —— 添加到威胁模型和可视化中

## 资源

- [ATLAS 网站](https://atlas.mitre.org/)
- [ATLAS 技术](https://atlas.mitre.org/techniques/)
- [ATLAS 案例研究](https://atlas.mitre.org/studies/)
- [OpenClaw 威胁模型](/zh-CN/security/THREAT-MODEL-ATLAS)

## 联系方式

- **安全漏洞：** 请参阅我们的 [Trust 页面](https://trust.openclaw.ai) 获取报告说明
- **威胁模型问题：** 在 [openclaw/trust](https://github.com/openclaw/trust/issues) 上提交 issue
- **一般讨论：** Discord 的 #security 渠道

## 致谢

对于威胁模型作出贡献的贡献者，将在威胁模型致谢、发布说明以及 OpenClaw 安全名人堂中获得认可，尤其是那些作出重大贡献的人。
