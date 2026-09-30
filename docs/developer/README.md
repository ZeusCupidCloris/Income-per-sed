# 开发者入口

面向修改代码、构建交付与排查问题的开发者。本目录只提供导航，实际工具和源码保持原位置。

## 推荐阅读顺序

1. [单一源文件与检查流程](../REPOSITORY_POLICY.md#单一源文件)：只编辑 Develop，再生成 Push。
2. [脚本用途索引](../../Attachment/scripts-index.md)：构建、截图、校验、资源观察与线上核验。
3. [测试用途索引](../../Attachment/tests-index.md)：业务、动效、恢复、存储及视觉测试。
4. [说明书维护规则](../manual-maintenance.md)：同步文件校验书签，保留既有排版和图片。

## 工作位置

| 位置 | 用途 |
| --- | --- |
| [Develop](../../Income-per-sed-Develop.html) | 网页唯一修改源与诊断 |
| [Widget](../../IncomeWidget.js) | Scriptable 小组件源文件 |
| [scripts](../../scripts/) | 维护工具 |
| [tests](../../tests/) | 自动测试及视觉基线 |
| [config](../../config/) | 测试和截图配置 |

检查失败时先定位原因，不通过替换截图来掩盖回归。自动测试与真实设备验收的边界见 [验收人员入口](../verification/README.md)。

[全部文件用途](../../Attachment/repository-map.md) · [项目维护者入口](../maintainer/README.md)
