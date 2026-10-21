# 文档与验收索引

[使用手册](Income-per-sed（说明文档）.docx) · [维护策略](REPOSITORY_POLICY.md) · [集中入口](../Attachment/README.md)

## 当前交付

产品与小组件按所有者确认统一为 **2.7.0**，交付 **20261021.3**，以[发布清单](../release-manifest.json)与[校验值](../SHA256SUMS.txt)为准。本批通过独立分支送审，不代表已经合并、创建 Release 或更新线上版本。

| 事项 | 当前证据 |
| --- | --- |
| 本地发布检查 | 四文件版本、语法、共享脚本作用域、手册校验书签与校验清单通过；57 项配套检查通过，连续两次构建六文件字节一致 |
| 小组件范围 | 核对共享计薪模式、内置日历与设置交换；除版本元数据外保持原有业务和布局 |
| 网页范围 | 同步已确认的 RC47 交互与字体，Push 重新生成；修复跨脚本压缩重名及残留诊断调用 |
| 浏览器证据 | RC47 原预览 117 组检查单独保留；本批生成版专项 Edge 18 项、WebKit 15 项通过，不把预览结果冒称为全部仓库套件重跑 |
| 手册 | 九页、五张当前 Push 插图，逐页检查通过；工程历史与用户操作分开，可访问性辅助检查无高、中、低级问题 |
| GitHub 与 Pages | 独立分支已上传，正在将交付版本统一为 2.7.0；尚未创建 PR、未合并或部署，不沿用历史线上通过结论 |

详见[本批版本说明](releases/v2.7.0.md)与[四文件同步记录](acceptance/fourfile-20261021.md)。2026-10-09 小组件“持续观察中，暂未发现问题”的用户反馈保留为历史证据，不自动扩展为本批全部设备与状态已验收。

## 待验收

- 小组件排版、日常状态交接和分流效果继续观察，当前未报告异常；保留用户最新反馈，不重复要求确认已经观察过的同一现象。
- 真实跨夜验收仍暂停，不用模拟时间替代。
- 小组件设置读写、手机键盘、VoiceOver 和流畅度仍需对应文件的实体设备验收。
- 导航与检查入口整理已通过 [PR #47 检查](https://github.com/ZeusCupidCloris/Income-per-sed/actions/runs/37444224454)并合并；后续滚轮测试初始化收敛为独立验收批次，结果见本次维护记录，远程状态以对应维护 PR 为准。

自动测试证明规则、浏览器行为及布局断言；桌面实际观察证明本机操作现象；实体设备或真实跨夜只在实际完成后标记通过。三者不互相替代。

## 历史记录

以下保持原地址及当时结论，不写成当前交付结果。

### 发布与交付

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
