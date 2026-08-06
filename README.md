# Income-per-sed

[![Quality](https://github.com/ZeusCupidCloris/Income-per-sed/actions/workflows/quality.yml/badge.svg)](https://github.com/ZeusCupidCloris/Income-per-sed/actions/workflows/quality.yml)
[![Pages](https://github.com/ZeusCupidCloris/Income-per-sed/actions/workflows/pages.yml/badge.svg)](https://github.com/ZeusCupidCloris/Income-per-sed/actions/workflows/pages.yml)

一个离线运行的收入仪表与任务计价工具。页面采用机械表盘、数字滚轮和怀表码表视觉语言，按工作时间实时展示今日收入、本月累计、工作进度，并支持历史回溯。

[在线体验](https://zeuscupidcloris.github.io/Income-per-sed/) · [下载最新版本](https://github.com/ZeusCupidCloris/Income-per-sed/releases/latest) · [查看完整说明书](docs/Income-per-sed（说明文档）.docx)

![Income-per-sed 桌面版预览](docs/images/preview-desktop.png)

## 下载与版本

| 文件 | 用途 |
| --- | --- |
| `Income-per-sed-Push.html` | 日常使用与分发版本，单文件离线运行 |
| `Income-per-sed-Develop.html` | 开发维护版本，保留结构化注释、诊断接口与回归检查 |
| `IncomeWidget.js` | Scriptable iPhone 桌面小组件 |
| `docs/Income-per-sed（说明文档）.docx` | 使用、计算、维护与验证手册 |
| `SHA256SUMS.txt` | 正式交付文件的完整性校验值 |

推荐从 [GitHub Releases](https://github.com/ZeusCupidCloris/Income-per-sed/releases) 下载已标记版本。日常运行使用 Push 版；排查动画、布局、存储、日历或计算问题时使用 Develop 版。

## 主要能力

- 固定月薪、年度平均、固定日薪三种收入计算方式
- 按上午、午休、下午工作时段实时计算
- 今日收入、时薪、秒薪、本月累计和年度估算
- 历史日期回溯、暂停、播放与返回实时
- 独立任务计价码表
- 浅色、深色及跟随系统主题
- 桌面、手机、平板和超宽屏响应式布局
- 浏览器本地存储、多窗口同步与 Scriptable 设置同步
- 法定节假日和调休工作日识别
- 高对比度、强制色彩和减少动态效果支持

## 快速开始

1. 下载并打开 `Income-per-sed-Push.html`。
2. 点击“每小时收入”卡片设置收入计算方式。
3. 点击“今日工作进度”卡片设置工作时间。
4. 页面会根据当前时间自动计算收入和进度。
5. iPhone 用户可将 `IncomeWidget.js` 与 Push 页面放入 iCloud Drive 的 Scriptable 目录。

## 在线预览

GitHub Pages 会将 Push 版作为静态页面发布。在线版与下载版使用相同 HTML；下载后仍可完全离线运行。

手机版首屏预览：

<img src="docs/images/preview-mobile.png" alt="Income-per-sed 手机版预览" width="390">

## 隐私与数据

- 页面没有后台服务、账户系统或数据上报功能。
- 工资、工作时间、主题和历史设置保存在当前浏览器的本地存储中。
- Scriptable 小组件数据保存在设备本地或用户自己的 iCloud Drive 中。
- 清除浏览器站点数据会删除页面设置，重要配置请按说明书中的方式备份。

## 兼容性

- 桌面端建议使用最新稳定版 Chrome 或 Microsoft Edge。
- iPhone、iPad 建议使用最新稳定版 Safari；小组件需要 Scriptable。
- 支持键盘操作、触屏、鼠标滚轮和触控板。
- 支持 `prefers-reduced-motion`、高对比度和系统主题。

## 质量检查

每次提交会自动执行：

- Push、Develop 与 Widget 必需结构检查
- JavaScript 语法检查
- Word 说明书 OOXML/ZIP 完整性检查
- SHA-256 校验文件一致性检查
- 390、768、1440、2560 像素宽度布局检查
- 浅色、深色、手机版快速回溯面板截图回归

本地验证：

```powershell
npm ci
npm run validate
npm test
```

## 当前版本

- 应用版本：`2.5.0`
- 页面基线：Pocket Watch v35 / R35
- 构建日期：2026-08-01
- 更新记录：[CHANGELOG.md](CHANGELOG.md)

## License

当前仓库暂未声明开源许可证。除非仓库所有者另行授权，否则保留全部权利。
