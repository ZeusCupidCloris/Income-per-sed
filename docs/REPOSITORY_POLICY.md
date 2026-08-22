# 仓库维护与发布策略

## 稳定分支

- `main` 始终代表可正常打开、可通过自动检查的正式状态。
- 所有修改先进入独立分支，再通过 Pull Request 合并。
- `main` 禁止直接推送、强制覆盖和删除。
- Pull Request 必须通过 `Release validation`、`Windows Edge visual regression` 和 `WebKit smoke`。
- 合并后自动删除来源分支，避免遗留无效开发分支。

## 单一源文件

`Income-per-sed-Develop.html` 是页面唯一维护源。`Income-per-sed-Push.html` 是发布产物，不直接编辑。

```powershell
npm ci
npm run test:release
npm run release:prepare
npm test
npm run test:webkit
```

`release:prepare` 会统一发布文本文件换行、从 Develop 生成 Push、同步 Word 说明书中的两个 HTML SHA-256、重建 `SHA256SUMS.txt`，并执行最终发布校验。该命令可重复运行；在文件已同步时不会继续改写 Word。构建脚本会移除 Develop 专用诊断面板、动效质量记录和回归导出接口，再压缩 HTML、CSS 与 JavaScript。自动检查会拒绝过期或无法重现的 Push、说明书哈希或校验清单。

## 版本更新

一次正式版本必须同步更新：

1. `release-manifest.json` 中的产品版本、标签和发布日期。
2. `package.json` 与 `package-lock.json` 的版本。
3. Develop 内 `APP_RELEASE` 的 `productVersion`、`sourceTag` 和 `releaseDate`。
4. `CHANGELOG.md` 与 `docs/releases/<tag>.md`。
5. 自动生成的 Push 和 `SHA256SUMS.txt`。

内部页面版本 `v35` 与产品发布版本 `2.5.1` 含义不同：前者标识页面架构基线，后者标识可下载发行版本。

## 正式发布

1. Pull Request 合并到 `main`，确认全部必需检查通过。
2. 在合并提交上创建与清单一致的 `v*` 标签。
3. Release 工作流确认标签属于 `main`，重新生成 Push 并执行完整校验。
4. 工作流上传 Push、Develop、Widget、Word 说明书、SHA-256 和版本清单。
5. GitHub Pages 始终发布 `main` 中已验证的 Push 文件。

历史 Release 不覆盖、不替换；修复通过新的补丁版本发布。

## 版权

仓库公开仅用于展示、在线预览和版本存档，不构成开源许可。详细限制以 [README](../README.md#版权与使用限制) 为准。
