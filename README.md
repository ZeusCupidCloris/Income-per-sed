# Income-per-sed

## 产品介绍

可离线运行的收入仪表与任务计价工具，提供机械表盘、数字滚轮、工作进度、历史回溯、主题切换和 Scriptable 小组件。

[在线体验](https://zeuscupidcloris.github.io/Income-per-sed/) · [最新四文件](#四文件入口)

![桌面预览](docs/images/preview-desktop.png)

<details><summary>深色与手机版预览</summary>

![深色预览](docs/images/preview-dark.png)

<img src="docs/images/preview-mobile.png" alt="手机版预览" width="390">

</details>

本仓库公开用于作品展示与版本存档，保留全部权利；公开不等于开源授权。使用范围见 [LICENSE](LICENSE)。

## 四文件入口

| 文件 | 用途 |
| --- | --- |
| [Income-per-sed-Push.html](Income-per-sed-Push.html) | 日常使用，可离线打开 |
| [Income-per-sed-Develop.html](Income-per-sed-Develop.html) | 开发维护与诊断，网页唯一修改源 |
| [IncomeWidget.js](IncomeWidget.js) | Scriptable iPhone、iPad 小组件 |
| [Income-per-sed 使用手册](docs/Income-per-sed（说明文档）.docx) | 使用、设置与故障排查 |

仓库候选文件与正式 Release 可能不是同一批，请勿混用。完整性可通过 [SHA256SUMS.txt](SHA256SUMS.txt) 核对。

## 快速使用

1. 下载并打开 Push 文件。
2. 点击“每小时收入”，设置收入方式和金额。
3. 点击“今日工作进度”，设置上午、午休和下午时间。
4. 使用顶部时间读数或快速回溯按钮回看；点击返回实时恢复当前时间。

小组件需安装 Scriptable，将 Widget 与 Push 文件放在 iCloud Drive 的 Scriptable 目录，按手册完成配置。页面设置保存在浏览器本地，清除站点数据会删除设置。年度日历每年手动替换。

## 当前版本

| 项目 | 标识 |
| --- | --- |
| 产品与四文件版本 | `2.5.9` |
| 交付编号 | `20261006.4` |
| 小组件版本 | `2.5.9`，本批仅同步版本标识 |

本批修复尺寸通知延迟时的进度拨钮越界，并保留时间滚轮键盘焦点轮廓；既有核心动效与小组件外观不变。

版本对应关系见[发布清单](release-manifest.json)，本批检查、合并与 Pages 结果见[当前交付](docs/README.md#当前交付)。普通更新只同步仓库与 Pages，大版本 Release 需另行确认；历史 Release 不一定是最新四文件。

## 维护入口

[集中入口](Attachment/README.md#从这里开始)按任务选择使用、修改、验收或发布；不再经过重复角色导航。

| 要找什么 | 位置 |
| --- | --- |
| 全部文件路径和用途 | [仓库地图](Attachment/repository-map.md) |
| 三个检查入口 | [脚本索引](Attachment/scripts-index.md#三个主要入口) |
| 五类测试与覆盖边界 | [测试索引](Attachment/tests-index.md#五类覆盖矩阵) |
| 当前交付、待验收、历史证据 | [验收索引](docs/README.md) |
| 命名、日历、手册与发布规则 | [维护策略](docs/REPOSITORY_POLICY.md) |
| CI 的作用与重复检查评估 | [工作流评估](docs/maintainer/workflow-review.md) |

开发工具在 `scripts/`、`tests/`、`config/`；自动检查在 `.github/`，均不是运行网页所需的依赖。旧版本与旧验收仍保留原地址。

[自动检查](https://github.com/ZeusCupidCloris/Income-per-sed/actions) · [更新记录](CHANGELOG.md) · [安全报告](.github/SECURITY.md)

维护时只编辑 Develop，再生成 Push；四文件的日常下载路径不变。
