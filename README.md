# Income-per-sed

## 产品介绍

可离线运行的收入仪表与任务计价工具，提供机械表盘、数字滚轮、工作进度、历史回溯、主题切换和 Scriptable 小组件。

[在线体验](https://zeuscupidcloris.github.io/Income-per-sed/) · [正式发布](https://github.com/ZeusCupidCloris/Income-per-sed/releases/latest)

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
| 产品版本 | `2.5.4-rc.2`，候选版，并非新的正式 Release |
| 交付编号 | `20260930.1` |
| 小组件组件版本 | `2.5.3` |
| Push 浏览器标题 | `Income-per-sed` |
| Develop 浏览器标题 | `Income-per-sed · Develop` |
| 小组件设置菜单 | `Income-per-sed` |
| 手册封面 | `Income-per-sed 使用手册` |

版本对应关系以 [发布清单](release-manifest.json) 为准；发布是否完成以 GitHub 检查、合并与部署结果为准。旧图片与旧验收不自动代表本次通过。

本批交付入口：[2.5.4-rc.2 候选发布包](https://github.com/ZeusCupidCloris/Income-per-sed/releases/tag/v2.5.4-rc.2)。候选发布不替换上方正式 Latest，请下载同一发布包内的四文件。

## 维护入口

- [仓库地图](docs/repository-map.md)：日常文件、维护工具与历史资料。
- [文档与验收索引](docs/README.md)：当前交付、待验收和历史记录。
- [脚本用途](scripts/README.md) · [测试用途](tests/README.md)。
- [维护与发布规则](docs/REPOSITORY_POLICY.md) · [更新记录](CHANGELOG.md)。
- [自动检查](https://github.com/ZeusCupidCloris/Income-per-sed/actions) · [安全报告](.github/SECURITY.md)。

维护时只修改 Develop，再生成 Push；不要分别编辑两个网页版本。日常下载路径与历史记录地址保持不变。
