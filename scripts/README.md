# 脚本用途索引

日常网页和小组件不需要运行这些工具。

| 文件 | 用途 | 写入行为 |
| --- | --- | --- |
| build_push.mjs | 从 Develop 生成压缩 Push | --write 写入；--check 只检查 |
| prepare_release.py | 生成 Push、同步手册校验值和清单 | 修改交付 |
| manual_checksums.py | 按文件名书签定位说明书校验值 | 供构建调用 |
| validate_release.py | 版本、语法、说明书及校验清单检查 | 默认只读；--write-checksums 写清单 |
| check_release_repeatability.py | 连续构建两次检查一致性 | 执行构建，串行运行 |
| capture_previews.mjs | 首页三张真实浏览器截图 | 写图片与来源清单 |
| readme_assets_lib.mjs | 图片校验公共函数 | 不写入 |
| validate_readme_assets.mjs | 校验首页图片及来源 | 不写入 |
| verify_pages.py | 比较线上与本地 Push 字节 | 不写入 |
| release_channel.mjs | 判断候选或正式标签 | 不写入 |
| run_python.mjs | 选择 Python 并调用维护脚本 | 由被调用脚本决定 |
| static_server.mjs | 本地静态测试服务 | 不写入 |
| measure_runtime.cjs | 开发资源观察 | 不作为实机结论；详见脚本参数 |

执行顺序见 [维护规则](../docs/REPOSITORY_POLICY.md)。不要同时执行多个写入工具。命名规则检查见 `tests/naming.test.mjs`。
