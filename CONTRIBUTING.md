# 贡献指南

## 分支与提交

- `main` 是日常合并及 GitHub Pages 的发布来源。维护变更先从最新 `main` 新建分支，再提 PR；未获上线确认的产品候选可以留在草稿 PR。
- `develop`、`test`、`release/uat` 分别留作开发集成、集中测试和验收。需要多项改动一起验证时，先约定纳入范围；不必让纯文档或独立维护逐级合并。`feature/<模块>`、`hotfix/<问题>` 按实际任务创建，紧急修复以 `main` 为起点。`BlBl` 保留独立历史。
- 仓库会自动删除合并来源分支。转入下一阶段时用临时分支送审，不直接拿这三个常设分支当 PR 来源；不启用自动逐级合并或预览部署。
- PR 标题使用 `type(scope): 具体改动`，如 `fix(dial): allow vertical swipe to scroll`、`docs(delivery): clarify site verification`。使用 Squash 合并时，以 PR 标题写入主分支历史；不要求每条草稿提交都遵守此格式。

## 验证

1. 修改 [页面及组件源码](src/)，不手改生成的 Develop / Push。涉及产品体验时，提供从验收候选生成的独立 Push HTML，注明来源提交和校验值。
2. 从 `npm run check` 开始，再按改动范围运行[对应专项或完整验收](Attachment/scripts-index.md#三个主要入口)。在 PR 填已验、未验与原因，不用截图或本地预览替代自动回归。
3. 沿用现有 Quality 检查。分支本身不代表已测试或已部署；`main` 合并仍须通过现有四项必需检查。

## 交付

- 合并后以实际 `main` 提交的 Quality 与 Pages 发布结果为准。需替换桌面四文件、更新独立站点时，从同一已验收提交取产物，分别核对并记录结果。
- 不改产品的维护 PR 不升版。普通更新不创建 Release 或标签；只有经所有者确认的大版本才按[正式发布约定](docs/REPOSITORY_POLICY.md#当前发布约定)操作。

完整核对项见[维护与发布策略](docs/REPOSITORY_POLICY.md)。
