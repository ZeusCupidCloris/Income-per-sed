# 文档与验收索引

[仓库地图与文件用途](../Attachment/repository-map.md) · [使用手册](Income-per-sed（说明文档）.docx) · [维护规则](REPOSITORY_POLICY.md)

按角色进入：[日常用户](user/README.md) · [开发者](developer/README.md) · [验收人员](verification/README.md) · [项目维护者](maintainer/README.md)。入口只链接现有资料，验收结果仍在下方唯一索引维护。

## 当前交付

产品 `2.5.4-rc.2`，交付 `20261001.2`，小组件 `2.5.3`。编号不代表已创建正式发布标签。

- [10-01 四文件同步与验收](acceptance/delivery-sync-20261001.md)：本次命名、小组件居中、长金额和窗口调整与恢复组合；自动检查与实机边界分别记录。

- [09-30 整理与验收记录](acceptance/naming-20260930.md)：保留当批四文件、命名及当时结果。
- [背景绘制核实与修复](acceptance/grid-idle-20260930.md)：重复属性通知的原因和专项结果。
- 上批整理经 [PR #33](https://github.com/ZeusCupidCloris/Income-per-sed/pull/33) 合并，提交 `b4555ad`；[当批 Quality 与 Pages 检查](https://github.com/ZeusCupidCloris/Income-per-sed/actions/runs/36680488487) 成功，发布后首页与 Push 字节核验一致。这是该提交的证据，不替代后续提交检查。
- 本轮仓库清理：合并用途索引、删除一个冗余入口，文件数由 100 减为 99；直接重命名 29 个维护文件并同步引用。本地完整质量检查通过（Edge 101 项、WebKit 38 项），99 个文件用途与内部链接、8 项检查器测试和首页图片来源检查通过。四文件、历史记录地址和截图基线不变，工作流仅同步脚本路径，不改检查及发布条件。
- [后台恢复绘制循环检查](acceptance/grid-recovery-20260930.md) 已纳入默认自动检查，本地双浏览器重复专项通过。远程合并与部署以对应提交的 [自动检查](https://github.com/ZeusCupidCloris/Income-per-sed/actions) 为准，不将本地通过写成实机通过。本次不创建 Release，文件从 [首页四文件入口](../README.md#四文件入口) 获取。
- [发布清单](../release-manifest.json) · [文件校验值](../SHA256SUMS.txt)。
- [说明书校验维护](manual-maintenance.md) · [年度日历替换](calendar-maintenance.md)。

## 待验收

- [10-02 四文件与设置动效交付](acceptance/delivery-settings-20261002.md)：交付 20261002.2 的本地检查、帧开销观察及远程/实机验收边界。
- [10-02 安装与生命周期维护](acceptance/lifecycle-install-20261002.md)：此前实施记录，包含真实冻结与模拟休眠区别；其中动效研究及未推送说明为记录当时状态，最新交付见上方记录。

- 真实跨夜验收仍暂停；浏览器时间模拟不能替代原页面真实跨夜恢复。
- 小组件 `2.5.3` 需实体 iPhone/iPad 核对设置读写和显示；测试替身只能验证逻辑。

证据分为**自动测试**、**桌面浏览器实际观察**、**实体设备或真实跨夜**。一类通过不能代替另一类。

## 历史记录

以下保留原地址与当时结果，不改写为本轮验收：

### 发布与交付

- 四文件验收：[09-16](acceptance/fourfile-20260916.md)、[09-22](acceptance/fourfile-20260922.md)、[09-24](acceptance/fourfile-20260924.md)。
- 版本验收：[2.5.2](acceptance/v2.5.2.md)、[2.5.4-rc.2 启动](acceptance/v2.5.4-rc.2-startup.md)。
- [各版本说明](releases/) · [总变更记录](../CHANGELOG.md)。

### 恢复与读数

- [前台恢复 09-09](acceptance/foreground-resume-20260909.md)、[前台进度 09-23](acceptance/foreground-progress-20260923.md)。
- [读数同步 09-24](acceptance/readout-sync-20260924.md)、[跨日期月收入 09-24](acceptance/cross-date-month-20260924.md)、[恢复维护 09-27](acceptance/recovery-maintenance-20260927.md)。
- [跨夜安排 09-15](acceptance/overnight-20260915.md)：保留当时的安排与边界，不作为真实跨夜已通过证明。

### 动效与维护

- [动效预览 09-22](acceptance/motion-preview-20260922.md)。
- [第二轮维护 09-08](acceptance/maintenance-round2-20260908.md)、[维护 09-15](acceptance/maintenance-20260915.md)、[候选版维护](acceptance/v2.5.4-rc.2-maintenance.md)。
- [全部验收记录](acceptance/) · [展示图片及来源](images/previews-manifest.json)：旧图不表示本次实机截图。

历史 `v35`、`R44` 为内部基线或设计记录，不作对外标题。旧版本号保留其历史含义。
