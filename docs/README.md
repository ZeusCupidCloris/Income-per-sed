# 文档与验收索引

[使用手册](Income-per-sed（说明文档）.docx) · [维护策略](REPOSITORY_POLICY.md) · [集中入口](../Attachment/README.md)

## 当前交付

产品与小组件统一为 **2.5.9**，交付 **20261006.4**，以[发布清单](../release-manifest.json)与[校验值](../SHA256SUMS.txt)为准。

| 事项 | 当前证据 |
| --- | --- |
| PR 合并 | [PR #46](https://github.com/ZeusCupidCloris/Income-per-sed/pull/46)，main 提交 `61e0f31` |
| 合并前自动检查 | [Quality](https://github.com/ZeusCupidCloris/Income-per-sed/actions/runs/37403208552)：发布校验、Edge、WebKit 全部通过 |
| main 复验与部署 | [Quality 与 Pages](https://github.com/ZeusCupidCloris/Income-per-sed/actions/runs/37404721637)：全部通过 |
| 线上内容 | 2026-10-06 下载首页及 Push，SHA-256 均为 `d3e9026ba57cd78e5a4b5f20610db790416cf182dd468c96eaa71752dd61ff11`，与该批本地 Push 一致 |
| 实体设备 | 本批未新增 iPhone/iPad 或 VoiceOver 实机验收 |

本轮仓库维护未改四文件，产品交付仍为上表版本；维护检查单独记录在[本次维护记录](acceptance/maintenance-simplification-20261006.md)。本地维护通过不代表已经推送或合并。

## 待验收

- 真实跨夜验收仍暂停，不用模拟时间替代。
- 小组件设置读写、手机键盘、VoiceOver 和流畅度仍需对应文件的实体设备验收。
- 本轮维护分支尚未推送；远程结果不能引用上一批 Quality 代替。

自动测试证明规则、浏览器行为及布局断言；桌面实际观察证明本机操作现象；实体设备或真实跨夜只在实际完成后标记通过。三者不互相替代。

## 历史记录

以下保持原地址及当时结论，不写成当前交付结果。

### 发布与交付

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
