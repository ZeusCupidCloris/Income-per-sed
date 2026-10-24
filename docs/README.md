# 文档与验收索引

[使用手册](Income-per-sed（说明文档）.docx) · [维护策略](REPOSITORY_POLICY.md) · [集中入口](../Attachment/README.md)

## 当前交付

本地已完成[第一批变量精简与参考线预览](maintainer/css-variable-layout.md)：删除 14 个旧间距与圆角名称的 25 处定义，29 个外观对照场景通过；参考线颜色修复与纯删除分别留在独立分支和预览中。Edge 专项 66 项通过；WebKit 57 项通过、1 项长金额缩放原生崩溃，三份页面六次有界对照未复现，仍保留为待观察风险。以上不是全业务检查通过或新版本发布，不把本地源码检查点写成四文件交付。

此前的[自定义变量引用审计](maintainer/css-variable-audit.md)梳理了 340 个名称，确认 56 个已定义名称没有消费路径，列为四批清理候选；71 个脚本写入名称与 32 项类型注册保留。当时只更新审计文档，四文件和交付清单与 `4a872fd` 完全相同，8 组隔离浏览器观察不是完整业务回归。以上为该审计检查点的历史记录，不代表后续候选仍未修改页面。

本地维护候选现继续完成[全局 CSS 审计](maintainer/global-css-audit.md)：37 条候选逐项核对，移除 33 条被后续规则覆盖的声明，保留 4 条兼容回退；Develop 减少 2,699 字节，Push 减少 2,218 字节，外观和脚本不变。联合对照 50 场景、Edge 专项 59 项、WebKit 专项 49 项通过，WebKit 2 项既定驱动能力跳过，无自动重试；配套检查 57 项、139 文件索引、两次六文件重建一致性通过。这是专项结果，不是完整业务套件重跑。

前一轮[八批 CSS 清理](maintainer/card-css-plan.md#本地执行记录-2026-年-10-月-24-日)的本地检查点 `c125995` 已有局部对照 165 次、最终全页对照 59 场景、配套检查 57 项、Edge 272 项和 WebKit 179 项通过，WebKit 4 项既定驱动能力跳过，均无测试重试；这些保留为该检查点的历史证据。

下面的线上、桌面和 PR 记录指已交付的 2.7.2，不代表上述本地维护候选已发布。本地校验清单、手册校验值和 README 图片来源已随候选页面更新；本轮没有升级版本、上传 GitHub、部署 Pages 或替换桌面文件，真实手机及真实整夜验收仍暂缓。

### 已发布基线

以下为 2026-10-23 的交付记录，本轮未重新查询远端。当前本地校验值已随维护候选改变，不用于声称线上或桌面与当前候选一致。

产品与小组件统一为 **2.7.2**，交付 **20261023.1**，以[发布清单](../release-manifest.json)与[校验值](../SHA256SUMS.txt)为准。[PR #62](https://github.com/ZeusCupidCloris/Income-per-sed/pull/62) 已合并为 `5eeff46`，桌面四文件已备份、替换并核验。main 的 Quality / Pages 通过并部署，线上首页及命名 Push 均与本批发布文件逐字节一致。不创建 Release 或标签。

本批纳入全天回溯拨盘、持续时间校验、统一播放响应和坐标缓存，保留 RC37 字体、主界面与计薪口径。Widget 仅同步元数据。范围与结果见[2.7.2 版本说明](releases/v2.7.2.md)及[本批验收](acceptance/fourfile-20261023.md)，后续见[逐卡片 CSS 计划](maintainer/card-css-plan.md)。真实手机及真实整夜验收暂缓，不把模拟结果写成真机通过。

| 事项 | 当前证据 |
| --- | --- |
| 本地发布检查 | 57 项配套检查、137 文件索引、构建与交付校验通过；连续两次重建六文件字节一致 |
| 网页与小组件 | 全天回溯拨盘、精确输入校验和交接竞争修复；统一播放响应、缓存坐标并移除旧分支。Widget 仅更新元数据，保留原计薪和布局 |
| 浏览器证据 | 最终本地 Edge 拨盘/发布/视觉 59 项通过，WebKit 拨盘 34 项通过及 2 项驱动能力跳过；[最终 PR 完整检查](https://github.com/ZeusCupidCloris/Income-per-sed/actions/runs/39939248838) Edge 272 项、WebKit 179 项通过及 4 项既定跳过，均无测试重试 |
| 手册与预览 | 九页、五张本批 Push 插图；最终校验值更新后重新渲染核对变化页。README 三张预览和来源哈希同步 |
| 桌面 | 2026-10-23 19:04（北京时间）先备份再替换四文件，校验值与 main 一致；390 像素视口离线交互检查通过，无脚本错误或联网请求 |
| main 与 Pages | [Quality / Pages](https://github.com/ZeusCupidCloris/Income-per-sed/actions/runs/39943036492) 通过并部署，Edge 272 项、WebKit 179 项通过及 4 项既定跳过，无测试重试。2026-10-23 19:31（北京时间）独立核验首页与命名 Push 的完整字节及线上操作通过，无脚本错误 |

最初 WebKit 安装遇到 Ubuntu 依赖下载超时，有界重跑揭示有效输入在失焦至提交之间被一帧刷新覆盖的问题，修复前已稳定复现，修复后重新执行完整检查。最终四项必需检查均通过，不把前序失败描述为通过。WebKit 四项既定跳过依赖 Chromium CDP 原生触摸注入，Edge 均实际执行通过。

2.7.1 的历史证据移至[上批版本说明](releases/v2.7.1.md)与[上批四文件同步记录](acceptance/fourfile-20261022.md)，不代表当前交付。2026-10-09 小组件“持续观察中，暂未发现问题”的用户反馈保留为历史证据，不自动扩展为本批全部设备与状态已验收。

## 待验收

- 小组件排版、日常状态交接和分流效果继续观察，当前未报告异常；保留用户最新反馈，不重复要求确认已经观察过的同一现象。
- 真实跨夜验收仍暂停，不用模拟时间替代。
- 小组件设置读写、手机键盘、VoiceOver 和流畅度仍需对应文件的实体设备验收。
- 导航与检查入口整理已通过 [PR #47 检查](https://github.com/ZeusCupidCloris/Income-per-sed/actions/runs/37444224454)并合并；后续滚轮测试初始化收敛为独立验收批次，结果见本次维护记录，远程状态以对应维护 PR 为准。

自动测试证明规则、浏览器行为及布局断言；桌面实际观察证明本机操作现象；实体设备或真实跨夜只在实际完成后标记通过。三者不互相替代。

## 历史记录

以下保持原地址及当时结论，不写成当前交付结果。

### 发布与交付

- [2.7.0 四文件与线上交付](releases/v2.7.0.md)、[10-21 验收与 Pages 记录](acceptance/fourfile-20261021.md)：保留当批完整检查与线上字节证据，不当作 2.7.1 的检查结果。

- [2.6.1 四文件交付及远程状态](releases/v2.6.1.md)：保留 2026-10-08 批次与后续用户观察，不当作当前候选交付的远程证据。

- [2.6.0 四文件交付](releases/v2.6.0.md)：旧 PR #53 检查通过，后续审查发现中号窄屏越界，未合并，不属于线上发布。

- 2.5.9 / 20261006.4：[PR #46](https://github.com/ZeusCupidCloris/Income-per-sed/pull/46)，main 提交 `61e0f31`；[合并前 Quality](https://github.com/ZeusCupidCloris/Income-per-sed/actions/runs/37403208552)与[main Quality / Pages](https://github.com/ZeusCupidCloris/Income-per-sed/actions/runs/37404721637)通过。2026-10-06 记录首页与 Push 的 SHA-256 为 `d3e9026ba57cd78e5a4b5f20610db790416cf182dd468c96eaa71752dd61ff11`，与该批本地 Push 一致；本次未重新验证该旧线上版本。
- [10-05 设置交付](acceptance/settings-delivery-20261005.md)、[10-02 设置交付](acceptance/delivery-settings-20261002.md)、[10-01 四文件同步](acceptance/delivery-sync-20261001.md)。
- [09-30 命名与整理](acceptance/naming-20260930.md)、[09-16](acceptance/fourfile-20260916.md)、[09-22](acceptance/fourfile-20260922.md)、[09-24](acceptance/fourfile-20260924.md)四文件验收。
- [2.5.2](acceptance/v2.5.2.md)、[2.5.4-rc.2 启动](acceptance/v2.5.4-rc.2-startup.md)、[各版本说明](releases/)。

### 恢复与资源

- [前台恢复 09-09](acceptance/foreground-resume-20260909.md)、[前台进度 09-23](acceptance/foreground-progress-20260923.md)、[读数同步 09-24](acceptance/readout-sync-20260924.md)、[跨日期月收入 09-24](acceptance/cross-date-month-20260924.md)。
- [恢复维护 09-27](acceptance/recovery-maintenance-20260927.md)、[背景静止 09-30](acceptance/grid-idle-20260930.md)、[背景恢复 09-30](acceptance/grid-recovery-20260930.md)。
- [安装与生命周期 10-02](acceptance/lifecycle-install-20261002.md)、[保存可靠性与资源观察 10-03](acceptance/storage-runtime-20261003.md)、[原始资源报告](acceptance/runtime-observation-20261003.json)。
- [跨夜安排 09-15](acceptance/overnight-20260915.md)：是安排，不是已通过证明。

### 动效与维护

- [动效预览 09-22](acceptance/motion-preview-20260922.md)、[维护 09-15](acceptance/maintenance-20260915.md)、[第二轮维护 09-08](acceptance/maintenance-round2-20260908.md)、[候选版维护](acceptance/v2.5.4-rc.2-maintenance.md)。
- [全部原记录](acceptance/) · [旧图片及来源](images/previews-manifest.json) · [更新记录](../CHANGELOG.md)。

历史内部代号与 rc 版本只保留历史含义。用途索引不承载每批过程记录；当前状态只维护在本页。
