# Income-per-sed

## 产品介绍

用机械表盘与数字滚轮查看今日收入、已工作时间和剩余进度，也可以回看过去的时间点，为任务单独计时计价。

**[在线体验](https://zeuscupidcloris.github.io/Income-per-sed/)** · [获取四文件](#四文件入口) · [快速使用](#快速使用)

![浅色桌面界面：主收入表盘、数字滚轮、任务码表与今日工作进度](docs/images/preview-desktop.png)

单文件网页，无需安装网页运行依赖；下载 Push 后可离线打开。支持浅色、深色主题，并配有 Scriptable iPhone、iPad 小组件。

<details><summary>查看深色桌面界面</summary>

![深色桌面界面：同一收入仪表在深色主题下的显示](docs/images/preview-dark.png)

</details>

<details><summary>查看手机版界面</summary>

<img src="docs/images/preview-mobile.png" alt="手机版界面：表盘与收入读数在上方，工作信息依次排列" width="390">

</details>

**使用边界**：收入按设置的工资与日历规则计算，不代表实际到账记录。仓库公开用于作品展示与版本存档，保留全部权利；使用范围见 [LICENSE](LICENSE)。

## 四文件入口

日常使用选择 **Push**；其余文件分别用于小组件、使用说明和开发维护。点击入口查看文件，在 GitHub 文件页使用下载按钮保存。

| 入口 | 用途 |
| --- | --- |
| **[Push · 日常网页](Income-per-sed-Push.html)** | 下载 HTML 后打开即可使用 |
| [Widget · 手机和平板小组件](IncomeWidget.js) | 在 Scriptable 中运行，配置方式见手册 |
| [使用手册 · Word](docs/Income-per-sed（说明文档）.docx) | 功能、设置与故障排查 |
| [Develop · 开发源文件](Income-per-sed-Develop.html) | 开发与诊断，网页唯一修改源 |

请使用同一交付批次，不与历史 Release 混用；需要核对文件完整性时，查看 [SHA-256 校验清单](SHA256SUMS.txt)。原文件名与下载路径保持不变。

## 快速使用

1. 想先看看效果，打开[在线体验](https://zeuscupidcloris.github.io/Income-per-sed/)；离线使用则下载并打开 Push 文件。
2. 点击“每小时收入”，设置收入方式和金额。
3. 点击“今日工作进度”，设置上午、午休和下午时间。
4. 使用顶部时间读数或快速回溯按钮回看；点击返回实时恢复当前时间。

**小组件**：安装 Scriptable，将 Widget 与 Push 文件放在 iCloud Drive 的 Scriptable 目录，按[使用手册](docs/Income-per-sed（说明文档）.docx)完成配置。

**设置与日历**：网页设置保存在当前浏览器本地，清除站点数据会删除设置；小组件配置与网页设置读回方式见手册。内置年度日历每年手动替换，使用前请核对覆盖年份。

## 当前版本

| 项目 | 标识 |
| --- | --- |
| 产品与四文件版本 | `2.5.9` |
| 交付编号 | `20261006.4` |

本批修复尺寸通知延迟时的进度拨钮越界，并保留时间滚轮键盘焦点轮廓；既有核心动效与小组件外观不变。

版本对应关系见[发布清单](release-manifest.json)，检查与上线记录见[当前交付](docs/README.md#当前交付)。普通更新同步仓库与 Pages；仅在确认大版本时发布 Release。

## 维护入口

以下内容供开发维护使用。首次查找文件可先看[仓库地图](Attachment/repository-map.md)，执行维护任务可从[集中入口](Attachment/README.md#从这里开始)开始。

| 要找什么 | 位置 |
| --- | --- |
| 全部文件路径和用途 | [仓库地图](Attachment/repository-map.md) |
| 三个检查入口 | [脚本索引](Attachment/scripts-index.md#三个主要入口) |
| 五类测试与覆盖边界 | [测试索引](Attachment/tests-index.md#五类覆盖矩阵) |
| 当前交付、待验收、历史证据 | [验收索引](docs/README.md) |
| 命名、日历、手册与发布规则 | [维护策略](docs/REPOSITORY_POLICY.md) |
| CI 的作用与重复检查评估 | [工作流评估](docs/maintainer/workflow-review.md) |

`scripts/`、`tests/`、`config/` 和 `.github/` 服务于构建与自动检查，日常使用无需安装这些工具。历史资料保留原地址。

[自动检查](https://github.com/ZeusCupidCloris/Income-per-sed/actions) · [更新记录](CHANGELOG.md) · [安全报告](.github/SECURITY.md)

维护时只编辑 Develop，再生成 Push；四文件的日常下载路径不变。
