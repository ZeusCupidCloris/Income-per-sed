# 仓库地图

## 给使用者看

| 入口 | 内容 |
| --- | --- |
| 根目录 Push | 日常网页，不需要开发工具 |
| 根目录 Widget | Scriptable 小组件 |
| docs 中的 Word 手册 | 操作与计算规则 |
| README | 产品、下载、快速使用与版本 |
| LICENSE | 版权与使用范围 |

## 给开发维护者看

| 路径 | 作用 |
| --- | --- |
| Develop | 网页唯一源，保留诊断；Push 为生成文件 |
| release-manifest.json | 产品、组件、交付与内部构建对应关系 |
| SHA256SUMS.txt | 交付完整性，不是代码或设置 |
| scripts/ | 构建、说明书校验、截图与线上核验 |
| tests/ | 业务、动效、异常配置与截图回归 |
| config/ | Edge、WebKit 与 README 截图配置 |
| package.json | 维护命令及工具依赖，不是网页运行依赖 |
| package-lock.json | 固定工具版本 |
| .github/workflows/quality.yml | 合并与发布前自动检查 |
| .github/workflows/pages.yml | 检查通过后部署 Push，并核验线上字节 |
| .github/workflows/release.yml | 标签发布时验证并上传交付附件 |
| .github/dependabot.yml | 维护依赖更新 |
| .github/SECURITY.md | 安全问题报告方式 |
| .github/PULL_REQUEST_TEMPLATE.md | 提交修改检查清单 |
| .editorconfig、.gitattributes、.gitignore | 编辑格式、换行和临时输出规则 |

## 历史与证据

`docs/acceptance/` 记录特定文件和时间的验收，不代表当前版本自动通过；`docs/releases/` 保存版本说明；`CHANGELOG.md` 是变化总览。

`docs/images/` 是首页展示图片及来源清单。`tests/visual.spec.js-snapshots/` 是测试对比基线，用途不同，不是重复文件。测试失败不能直接覆盖基线。

历史地址全部保留。新增索引不移动或删除原记录。无引用不等于无用途；重复或失效内容需核实后单独处理。
