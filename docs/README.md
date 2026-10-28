# 文档与验收索引

[使用手册](Income-per-sed（说明文档）.docx) · [维护策略](REPOSITORY_POLICY.md) · [集中入口](../Attachment/README.md)

## 当前交付

产品与小组件统一为 **2.7.5**，交付 **20261028.1**，当前处于补丁验收阶段。修复午休回到实时的进度衔接，以及首轮完整验收捕获的前台恢复主针收尾回退；桌面替换、PR、main 及 Pages 结果仅在实际完成后记录，不能从候选版本号推定已经上线。见[本批验收](acceptance/fourfile-20261028.md)与[版本说明](releases/v2.7.5.md)。不创建 Release 或标签，实体手机和真实跨夜继续暂缓。

### 2.7.4 历史交付

产品与小组件统一为 **2.7.4**，交付 **20261027.1**，以[清单](../release-manifest.json)和[校验值](../SHA256SUMS.txt)为准。[PR #66](https://github.com/ZeusCupidCloris/Income-per-sed/pull/66) 已合并为 `9f0dfaa`；[PR 完整检查](https://github.com/ZeusCupidCloris/Income-per-sed/actions/runs/40445825030)与 [main 完整检查 / Pages](https://github.com/ZeusCupidCloris/Income-per-sed/actions/runs/40450019386)各自实际完成 Edge 310 项、WebKit 217 项通过及 4 项既定跳过，零失败、零重试。另完成 8 组、96 项完整备份恢复验收，57 项配套检查、159 文件目录与两次六文件重复构建通过；手册九页逐页查看，仅封面和末页变化。桌面四文件已先备份、替换并校验，2026-10-27 13:07（北京时间）独立核对线上两入口字节与窄屏、宽屏操作通过。详见[本批验收](acceptance/fourfile-20261027.md)与[版本说明](releases/v2.7.4.md)。不创建 Release 或标签；历史偶发 WebKit 崩溃仍未归因，真机和真实整夜验收继续暂缓。

### 2.7.3 历史交付

当时产品与小组件统一为 **2.7.3**，交付 **20261026.1**，历史[清单](https://github.com/ZeusCupidCloris/Income-per-sed/blob/01ce242e8af4b4ef958eb9e64d5c6e76c7b42550/release-manifest.json)和[校验值](https://github.com/ZeusCupidCloris/Income-per-sed/blob/01ce242e8af4b4ef958eb9e64d5c6e76c7b42550/SHA256SUMS.txt)固定在对应提交。[PR #64](https://github.com/ZeusCupidCloris/Income-per-sed/pull/64) 已合并为 `20b7e5c`；桌面四文件已备份、替换并校验。[PR 完整检查](https://github.com/ZeusCupidCloris/Income-per-sed/actions/runs/40323193353)与 [main Quality / Pages](https://github.com/ZeusCupidCloris/Income-per-sed/actions/runs/40330490334) 均以 Edge 296、WebKit 203 项通过及 4 项既定触摸驱动跳过完成，没有测试重试。Pages 当时已部署，2026-10-26 21:58（北京时间）独立核对线上首页和命名 Push 的完整字节与线上操作通过。[当批验收](acceptance/fourfile-20261026.md)与[版本说明](releases/v2.7.3.md)保留残余风险和未验收边界；不创建 Release 或标签。

### 交付前维护记录

以下保留各本地检查点的范围和当时结果，不将旧版本、旧哈希、历史待办或失败覆盖为当前交付结论。

2026-10-26 完成[累计补丁交付准备](maintainer/patch-readiness.md)：只读核对 main 基准、累计改动、16 个参考刻线生命周期场景、两组真实像素对照和当前候选三阶段原生时钟采样。六文件与 `37d0a67` 的已验收候选相同，引用上轮完整结果而非重复宣称重跑；本轮只新增本地审阅包与维护说明。刻线功能正常但视觉很弱，人工观感、残余崩溃风险处置及新版本交付仍待确认，不上传、合并、部署或替换桌面。

2026-10-26 已完成[本次同步内的时间格式化复用](maintainer/frame-time-format.md)及双引擎旧新分段核对：每次顶部同步从三次格式化降至两次，不增加跨帧缓存，原测试、配置和截图不改。本轮原完整验收 Edge 296 项通过；WebKit 203 项通过、4 项原有触摸驱动限制跳过，零失败、零重试，发现范围与实际执行逐项一致。历史窄屏崩溃本轮未复现，仍未归因，不称作已修复。最终配套检查、154 文件目录及两次重建结果见本批记录；不升级版本或交付。

2026-10-26 完成[顶部标签写入优化](maintainer/timeline-label-writes.md)：七个 aria-label 调用点接入既有变化检查，文案、CSS、毫秒时间、指针、滚轮和缓存不改。本机六秒样本中每个标签写入由 366 降至 6 次，同值写入由 360 降至零；不是整页提速比例。新增修改前证明与双版本同秒状态测试，修改后 Edge 23 项 / WebKit 15 项专项通过，无重试、跳过或截图更新。生成版和手册校验值跟随本地候选，图片保留原字节；不升级版本或交付，原 WebKit 全量失败仍未归因。配套检查、153 文件目录及两次重建结果见本批记录。

2026-10-26 完成[两份旧关键帧清理预览](maintainer/keyframe-clock-preview.md)：Develop / Push 只删除对应两份早期覆盖定义，分别减少 217 / 196 字节，脚本和实际动画不变。16 个新旧外观对照、八个有效关键帧场景、双引擎各 43 项动效专项及原缩放用例各一次通过，无重试、跳过。三组时钟对照各十二轮未崩溃，不能归因；读写计数确认两个无障碍标签存在重复写入，定位和收入指示器在稳定窗口无常驻重复执行。本地生成文件与手册校验值跟随候选更新，README 原图片保留并记录来源；不升级版本或交付。上轮 WebKit 全量失败不被本轮专项覆盖，最终校验及 152 文件目录见本批记录。

2026-10-26 完成[追踪边界、只读审计与恢复修改条件](maintainer/trace-boundary-audit.md)：八组对照中无自定义循环、完整追踪组仍崩溃，不能将采样或追踪直接认定为根因。原完整现状基线 Edge 292 项通过；WebKit 198 项通过、4 项既定驱动限制跳过、1 项恢复窄屏崩溃，无重试，质量门仍失败。核对固定时间会包装计时接口并更正历史措辞，另留原生时钟短时耗时样本。只读审计证实两份早期同名关键帧已被覆盖；下一批可立即做局部本地删除预览，不必冻结全仓库，但当前不发布。六文件、原测试、配置及依赖未改；最终配套检查与 151 文件目录另核对。

2026-10-26 完成[采样拆分及补充对照](maintainer/webkit-sampler-split.md)：八组有界诊断保留四次页面崩溃，位置尺寸组、无自定义循环组各十二轮未崩溃，纯 JS 记录仍在第十轮崩溃；原始用例单次控制通过。根因与独立最小复现仍未确认，产品、原断言和六文件不改，不发布。[2.7.0 起完整回顾](maintainer/2.7x-review.md)另列已交付与本地维护；本次只读复核 GitHub main、Pages 和桌面仍与已发布 2.7.2 一致，不能当作新交互或真机验收。

本地已完成[WebKit 恢复窄屏的单因素对照](maintainer/webkit-factor-controls.md)：两阶段十一组、无重试，保留五次页面崩溃。单页首轮和不返回实时的流程也会失败；移除自定义采样、不切主题的同页组各十二轮未崩溃，但末尾原流程参照也未崩溃，仍不能认定因果或已修复。六份交付文件与 `1ba5161` 字节一致，原测试、配置和阈值不改，暂不继续精简或发布。

本地现已完成[工资模式测试拆分与 WebKit 缩放排查](maintainer/persistence-webkit-repro.md)：每模式独立页面、原操作与断言保留、每例仍为 45 秒；整个发布行为文件在 Edge / WebKit 各 19 项通过，无重试、跳过。缩放诊断在新上下文第 3 轮恢复窄屏时捕获页面崩溃；同页与缩减候选各 12 轮未崩溃，尚未得到有效独立最小复现，根因未确认。本次不代表完整业务回归通过；六份交付文件与 `3a354bd` 字节一致，暂不继续精简或发布。

本地已完成[最后四对金属别名清理与完整复核](maintainer/css-variable-metal-alias.md)：八个名称、十二处定义和一条空规则已删除，47 个外观场景通过；原四批 56 个候选名称、99 处定义已处理完毕，现有清单中无使用入口的已定义名称为零。Edge 全量 288 项通过；WebKit 199 项中 192 项通过、4 项既定驱动限制跳过、3 项失败，无测试重试。失败为原长金额缩放 `Target crashed` 重现，以及 Develop / Push 各一项持久化流程整体超时，完整回归未通过。两份执行结果均与发现清单逐项一致，不将范围执行完整冒称质量门通过。

本批 57 项配套检查、146 文件索引和两次六文件重建一致性通过，手册仅末页校验值变化，README 图片字节不变。字体、实际配色、布局与算法不变；当前只保留本地候选，不升级版本、不发布或替换桌面文件。新旧失败及轨迹均保留，根因或测试预算问题仍待定位，后续先处理这三项失败。

本地已完成[第三批显示与配色参数精简](maintainer/css-variable-display-color.md)：先后独立删除八个名称的 24 处定义、十九个名称的 31 处定义，以及由此变空的十条规则和一个媒体查询。两组各 47 个外观场景、Edge 35 项和 WebKit 27 项专项通过，无测试重试；字体、实际配色、布局和算法不变。Develop 合计减少 2,429 字节、Push 减少 2,235，剩余候选为八个金属别名名称的十二处定义。原 WebKit 间歇崩溃未在本轮重现，仍未归因，以上不是新版本发布。

本批配套检查 57 项、145 文件索引与两次六文件重建一致性通过；手册九页核对后仅末页校验值变化，README 图片字节不变、来源哈希随候选更新。仍为本地维护候选，没有升级版本、同步 GitHub / Pages 或替换桌面文件。

本地已完成[第二批旧参数精简](maintainer/css-variable-tuning.md)：只删除七处无消费定义，不改动画或计算；35 个外观对照、Edge 35 项及 WebKit 27 项专项通过，无测试重试。此前先完成[WebKit 有界排查](maintainer/webkit-stability.md)，连续 58 项、同页 12 轮及清理前后四次独立冷启动均通过；原间歇崩溃仍未归因，未标记已修复。配套检查 57 项、144 文件索引与两次重建一致性通过，手册校验值及 README 来源随候选同步。这些是本地候选证据，不代表发布。

本地已完成[第一批变量精简与参考线预览](maintainer/css-variable-layout.md)：删除 14 个旧间距与圆角名称的 25 处定义，29 个外观对照场景通过；参考线颜色修复与纯删除分别留在独立分支和预览中。Edge 专项 66 项通过；WebKit 57 项通过、1 项长金额缩放原生崩溃，三份页面六次有界对照未复现，仍保留为待观察风险。以上不是全业务检查通过或新版本发布，不把本地源码检查点写成四文件交付。

此前的[自定义变量引用审计](maintainer/css-variable-audit.md)梳理了 340 个名称，确认 56 个已定义名称没有消费路径，列为四批清理候选；71 个脚本写入名称与 32 项类型注册保留。当时只更新审计文档，四文件和交付清单与 `4a872fd` 完全相同，8 组隔离浏览器观察不是完整业务回归。以上为该审计检查点的历史记录，不代表后续候选仍未修改页面。

本地维护候选现继续完成[全局 CSS 审计](maintainer/global-css-audit.md)：37 条候选逐项核对，移除 33 条被后续规则覆盖的声明，保留 4 条兼容回退；Develop 减少 2,699 字节，Push 减少 2,218 字节，外观和脚本不变。联合对照 50 场景、Edge 专项 59 项、WebKit 专项 49 项通过，WebKit 2 项既定驱动能力跳过，无自动重试；配套检查 57 项、139 文件索引、两次六文件重建一致性通过。这是专项结果，不是完整业务套件重跑。

前一轮[八批 CSS 清理](maintainer/card-css-plan.md#本地执行记录-2026-年-10-月-24-日)的本地检查点 `c125995` 已有局部对照 165 次、最终全页对照 59 场景、配套检查 57 项、Edge 272 项和 WebKit 179 项通过，WebKit 4 项既定驱动能力跳过，均无测试重试；这些保留为该检查点的历史证据。

下面的线上、桌面和 PR 记录指已交付的 2.7.2，不代表上述本地维护候选已发布。本地校验清单、手册校验值和 README 图片来源已随候选页面更新；本轮没有升级版本、上传 GitHub、部署 Pages 或替换桌面文件，真实手机及真实整夜验收仍暂缓。

### 2.7.2 历史交付

以下为 2026-10-23 的历史交付记录，保留当时的范围与结论，不代替上方 2.7.4 的新检查。历史清单使用固定提交地址，不与当前根目录的清单或校验值混用。

当时产品与小组件统一为 **2.7.2**，交付 **20261023.1**，历史[发布清单](https://github.com/ZeusCupidCloris/Income-per-sed/blob/1adc69471684c78102fcad9fc15efc5def7321e7/release-manifest.json)与[校验值](https://github.com/ZeusCupidCloris/Income-per-sed/blob/1adc69471684c78102fcad9fc15efc5def7321e7/SHA256SUMS.txt)固定在对应提交。[PR #62](https://github.com/ZeusCupidCloris/Income-per-sed/pull/62) 已合并为 `5eeff46`，当批桌面和 Pages 的核验结果保留如下，不代表当前线上仍为 2.7.2。不创建 Release 或标签。

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
