# 仓库维护与发布策略

## 稳定分支

- `main` 始终代表可正常打开、可通过自动检查的当前基线，可以是候选版；不等同于 GitHub 最新正式 Release。
- 所有修改先进入独立分支，再通过 Pull Request 合并。
- `main` 禁止直接推送、强制覆盖和删除。
- Pull Request 必须通过 `Release validation`、`Windows Edge visual regression` 和 `WebKit smoke`。
- 合并后的临时分支可按仓库设置清理；长期分支 `BlBl` 保留，不纳入临时分支清理。

## 单一源文件

`Income-per-sed-Develop.html` 是页面唯一维护源。`Income-per-sed-Push.html` 是发布产物，不直接编辑。

```powershell
npm ci
npm run quality:local
```

`quality:local` 会依次运行 `test:release`、`release:prepare`、`test:readme`、Windows Edge 视觉回归和 WebKit 移动端检查，任一阶段失败即停止。`test:readme` 会确认 README 中的三张预览图均为真实 Markdown 或 HTML 图片引用，并验证完整 PNG 分块、CRC、解码数据、尺寸和 `config/readme-previews.json` 中的共享截图清单。截图命令还会生成 `docs/images/previews-manifest.json`，记录当前 Push 和每张预览图的 SHA-256；自动检查据此拒绝未随页面或图片同步、截断或损坏的 README 预览，同时避免不同 Windows/Edge 版本造成像素级误报。`release:prepare` 会统一发布文本文件换行、从 Develop 生成 Push、同步 Word 说明书中的两个 HTML SHA-256、重建 `SHA256SUMS.txt`，并执行最终发布校验。该命令可重复运行；在文件已同步时不会继续改写 Word。构建脚本会移除 Develop 专用诊断面板、动效质量记录和回归导出接口，再压缩 HTML、CSS 与 JavaScript。自动检查会拒绝过期或无法重现的 Push、说明书哈希或校验清单。

## 版本更新

一次正式版本必须同步更新：

1. `release-manifest.json` 中的产品版本、标签和发布日期。
2. `package.json` 与 `package-lock.json` 的版本。
3. Develop 内 `APP_RELEASE` 的 `productVersion`、`sourceTag` 和 `releaseDate`。
4. `CHANGELOG.md` 与 `docs/releases/<tag>.md`。
5. 自动生成的 Push 和 `SHA256SUMS.txt`。

内部页面版本 `v35` 与产品发布版本 `2.5.1` 含义不同：前者标识页面架构基线，后者标识可下载发行版本。

## 候选版与正式发布

- 候选版使用 `v2.5.4-rc.2` 一类标签，工作流标记 `prerelease`，不覆盖正式 Latest。
- 正式版使用 `v2.5.4` 一类标签，才标记为 Latest。正式发布前确认已覆盖目标用户设备；不能用桌面模拟测试替代 iPhone 实机验收。
- 不合法标签直接失败；当前不使用带构建后缀的标签。
- 日常维护 PR 不创建标签，不自动宣布新正式版。准备发布时先补齐对应版本说明，再由所有者授权创建标签。

1. Pull Request 合并到 `main`，确认全部必需检查通过。
2. 在合并提交上创建与清单一致的 `v*` 标签。
3. Release 工作流确认标签属于 `main`，重新生成 Push 并执行完整校验。
4. 工作流上传 Push、Develop、Widget、Word 说明书、SHA-256 和版本清单。
5. GitHub Pages 始终发布 `main` 中已验证的 Push 文件。

历史 Release 不覆盖、不替换；修复通过新的补丁版本发布。

## 文件、截图和说明书同步

1. 仅修改 Develop 源文件或 Widget，使用 `npm run release:prepare` 生成 Push 并同步手册校验值。
2. 若 Push 改变，执行 `npm run preview:capture`，检查三张截图后再执行 `npm run test:readme`；截图清单必须对应当前 Push。
3. 手册内容或校验页有变化时，检查 Word 渲染结果。手册支持两个 HTML 校验值及可选的第三个 Widget 校验值。
4. 执行 `npm run quality:local`。视觉基线只在设计确实改变且人工确认后更新，不通过覆盖截图来掩盖回归。
5. 将源码、生成产物、手册、校验清单和必要截图一起提交；在验收记录中分别写明已验证和未验证的部分。

文档入口见 [文档索引](README.md)。本轮只维护仓库与诊断，不改变页面样式、动画或内置日历维护方式。

## 版权

仓库公开仅用于展示、在线预览和版本存档，不构成开源许可。详细限制以 [README](../README.md#版权与使用限制) 为准。
