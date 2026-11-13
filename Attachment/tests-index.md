# 测试用途索引

只维护职责和覆盖边界，不保存每轮执行结果；结果见[验收索引](../docs/README.md)，命令参数见[脚本索引](scripts-index.md#三个主要入口)。

## 五类覆盖矩阵

| 功能组 | 参数 | 主要职责 | 不是重复的边界 |
| --- | --- | --- | --- |
| 计算与存储 | `data` | 收入算式、小组件一致性、网页和组件异常设置 | Scriptable 替身不等于浏览器存储，也不等于实体 iPhone |
| 恢复与回溯 | `recovery` | 后台交接、输入接管、跨日期、历史播放 | 轨道位置、读数同步、月收入算式及浏览器冻结是独立断言 |
| 设置交互 | `settings` | 开合、滚动、焦点、手势、错误反馈与清理 | 动画路径、文字交接、滚动锚定与输入安全不能只留一个截图 |
| 布局与视觉 | `layout` | 长金额、网格、页面截图、手机边界 | 几何断言与像素基线不是相同证据 |
| 发布一致性 | `release` | 构建、命名、校验、工具约束、双版本行为 | 只测 Develop 不能证明生成 Push 一致 |

唯一分组表为[config/test-groups.cjs](../config/test-groups.cjs)。每份可运行测试恰好属于一组，遗漏、重复或失效条目会被自动检查拒绝。按功能选择，不再按交付日期创建新测试套件。

Edge 保留全部功能断言；WebKit 保留[现有兼容性子集](../config/playwright-webkit.config.js)。双浏览器专项不代表两者有完全相同的文件数量。基于 CDP 的冻结专项只在 Edge 执行。帧开销 `settings-frame-budget.spec.js`明确为手动观察，归设置组但不进入默认完整回归。

## 初始化与断言收敛

三份设置测试共用 `helpers/settings-page.js`，统一页面选择、真实显示控件、动效模式、展开操作及交接就绪等待。使用暂停时钟、中间帧或特定视口的测试保留专用初始化，不强行套用共同函数。启动本身的测试不提前切换显示状态。

未删除工资模式、两种网页版本、浅深主题、手机尺寸、输入反向、存储失败或最后一帧边界。滚轮物理明度与缓存样式公式共用一次展开初始化，全部公式和 1440/320/390px 检查保留在 settings-local-motion.spec.js；不删除整份功能测试。

长内容布局另覆盖进度卡可见性通知延迟时的 320/390px 上午与下午缩放：隐藏旧辅助标记不得扩大滚动边界，真实连续游标保持位置，恢复可见后仍可用；不依赖固定休眠等待隐藏状态，不改变原逐帧恢复与长金额断言。额外进度节点尺寸与样式只在断言失败后记录，不插入正常测量轮询。

## 全部测试用途

| 范围 | 文件 | 边界 |
| --- | --- | --- |
| 启动与历史运动 | startup-history-playback.spec.js | 后台是模拟，不代表实机锁屏 |
| 拨盘输入与恢复 | history-dial-refinement.spec.js | Develop/Push 的失焦、回车、Tab、日期定位、无效草稿、鼠标/键盘播放、坐标缓存和模拟十二小时恢复；窄屏初始容器焦点的正反向 Tab、背景焦点隔离与桌面非模态行为；Edge 与 WebKit，不等于整夜驻留 |
| 窄屏回溯联测 | history-flow.spec.js | 两份网页从 390px 打开、定位、鼠标拖动、播放暂停、跨断点关闭与重开，再返回实时；Edge 与 WebKit，不等于真机触摸 |
| 回溯面板焦点与关闭 | history-panel-focus.spec.js | Develop/Push 的窄屏关闭按钮与遮罩焦点归还、桌面外部点击与设置焦点不被抢回、面板键盘隔离和关闭后全局快捷键恢复、关闭反向打开；Edge 与 WebKit，非真机触摸验收 |
| 回溯实时参考线 | live-reference-marker.spec.js | Develop/Push 明暗主题与两种宽度下的边框底色、实时位置跟随及返回实时后隐藏；不改变表盘计算 |
| 拨盘触摸 | history-dial-touch.spec.js | 按原生事件实际坐标验证点选分钟；Edge 注入原生拖动，WebKit 对不支持的多事件注入明确跳过，不替代真机 |
| 前台恢复 | foreground-resume.spec.js | 同日、跨日、上午开工及午休结束；恢复速度按已提交帧的时间与角度配对，保留观察时间及原阈值，固定错位样本自检；双版本使用真实主针 transform 检查收尾壁钟毫秒取整不回退及下一整秒接管，Edge/WebKit；模拟后台，不代表系统休眠 |
| 恢复进度 | foreground-progress.spec.js | 两段工作轨道、拨钮位置及恢复交接的同帧边界 |
| 读数同步 | readout-sync.spec.js | 主针、金额、工时、剩余时间及月收入共同使用统一显示时间；Develop/Push 的顶部标签去重、同秒状态切换、错误标签恢复、毫秒 datetime 更新、帧内北京时间分量复用次数及实时／历史日期隔离；不代替读屏实机验收 |
| 跨日期月收入 | cross-date-month.spec.js | Develop/Push、三种工资模式、次日和工作日/休息日跨月；独立算式校验最终金额；Edge 与 WebKit |
| 恢复组合 | recovery-combinations.spec.js | 恢复中再次隐藏、跨日恢复中回溯后返回实时；三种工资模式及双版本；模拟后台，不代表实机 |
| 连续接管 | interaction-handoff.spec.js | 前台恢复、历史播放、返回实时途中滚轮接管与显示值连续性 |
| 局部动效预览 | motion-feedback.spec.js | 保存结果、反向开合、错误占位、码表暂停、连续回溯、默认关闭的吸附实验及多窗口；Develop 两种设置展开覆盖完整开合时长一致、遮罩同步、浅深主题、桌面手机、纵向先行、窗口调整、保存收回、错误修正、后台中断和清理；短视口与后台模拟不代表手机键盘或实机验收 |
| 设置文字连续性 | settings-text-continuity.spec.js | Develop 动画副本与原卡片的文字排版一致性、面板文字固定坐标和透明度连续性；桌面浏览器自动检查，不替代实机流畅度验收 |
| 设置局部动效 | settings-local-motion.spec.js | 分层显现、常驻日历工具、收入口径原位更新、滚轮物理明度与跨尺寸缓存样式公式；设置 SETTINGS_RELEASE_CHANNEL=push 可验证生成的 Push |
| 设置滚动条交接 | settings-scrollbar-handoff.spec.js | 完整面板在展开、关闭与反向交接中无内容溢出或滚动条；桌面、手机宽度、操作区可见性和减少动态效果 |
| 设置细节精修 | settings-refinements.spec.js | 面板和回溯布局、读数交接、工时滚轮重建和直接输入恢复；工时校验提示时机、相邻时段与修正保存；日历预览、导出、重置、失败回滚及工时和日历联合保存；SETTINGS_RELEASE_CHANNEL=push 验证生成版 |
| 设置稳定性 | settings-stability.spec.js | 日历及错误锚定、右对齐摘要读数、高频操作清理和同帧几何读写；性能采样仅用于定位本机耗时 |
| 设置输入安全 | settings-input-safety.spec.js | 展开早期防误触、关闭接管、触屏意图及停靠后摘要播报；可用 SETTINGS_RELEASE_CHANNEL=push 检查 Push；模拟不替代 iPhone 和 VoiceOver 实机验收 |
| 设置帧开销观察 | settings-frame-budget.spec.js | Edge 中实际采样两种设置卡片的帧间隔与布局、样式计算开销；用于同机对比，不用固定帧率阈值判断所有设备 |
| 交叉操作 | recovery-cross-actions.spec.js | 恢复过程中设置与主题切换、历史播放保存设置、码表跨零点；模拟时间 |
| 双版本行为 | release-behavior.spec.js | 实际 Develop 与 Push 启动、有效预设与日期回溯、两种设置展开轨迹；三种工资模式分别使用独立页面与每例 45 秒预算，保存刷新后检查金额、选中状态及存储模式；保留三模式连续切换计算对照、移动端恢复、异步备份草稿保护与旧错误清除；上海、UTC、纽约和柏林设备时区下的北京时间戳、夏令时跳时与重叠、跨月计薪及日期输入；Edge 与 WebKit |
| 小组件异常配置 | widget-settings.cjs | 缺失与损坏配置、保存和下载失败、标准文件名、刷新边界；使用 Scriptable 替身 |
| 长内容布局 | long-amount-layout.spec.js | 真实设置驱动 8、9、10 位整数金额；双版本、浅深主题、390/1440px 检查窗格边缘；320/390/1440px 月累计及预计金额完整显示、预计块换行、缩放往返、普通金额恢复及隐私遮蔽；趣味换算数量与商品名称完整、逐项计算对照、整项换行、尺寸往返后内容可见、零值及普通数量恢复、原间距与字体不变和隐私遮蔽；宽屏超长数量与归零恢复分开验收，缩放及设置变更后推进固定时钟并在可见区域测量，保留每例原 45 秒时限和原断言；Edge 与 WebKit |
| 小组件一致性 | widget-parity.spec.js | 三种工资模式、完整内置日历、金额缩写；Scriptable 日期接口使用测试适配 |
| 输入设备与刷新率 | input-device-motion.spec.js | 固定工作日业务时间，动画时钟继续 |
| 背景 | background-grid.spec.js | 空闲绘制、鼠标画布变化、降级；Develop/Push 十轮模拟后台恢复，检查后台零绘制、最多一个待执行帧、恢复交互与自然静止；Edge 与 WebKit |
| 异常存储 | storage-resilience.spec.js | 浏览器存储不可用与损坏；Develop/Push 临时键及主键写入失败时保留旧配置、清理临时键并允许重试；完整备份导入在两种写入失败下核对日历原键恢复或移除及重试；实际下载的备份恢复工资、工时与日历后刷新，保留暂停任务和隐私状态，不以初始化脚本重置数据；收入/工时保存中关闭或模拟后台恢复；多窗口转发写入失败不广播新设置或成功确认，保留草稿并验证恢复、重试和刷新，Develop 另核对远程恢复默认的失败回滚；Edge 与 WebKit，不代表实机后台 |
| 页面视觉 | visual.spec.js | 既有截图基线，不随测试失败重建 |
| 全局反馈样式 | global-css-feedback.spec.js | Develop/Push 存储成功与失败提示的显隐生命周期、键盘与高对比度焦点、粗指针隐私解锁尺寸及重开恢复；不修改产品逻辑或截图基线 |
| WebKit 冒烟 | webkit-mobile.spec.js | WebKit 专属基础启动和手机回溯面板边界；其余文件的浏览器范围以 config/playwright-webkit.config.js 中的 testMatch 为唯一来源，避免维护第二份容易遗漏的名单；默认发布与 Develop 预览范围不同，不等于真实 iPhone |
| 发布与资源 | test_prepare_delivery.py、release-channel.test.mjs、readme-preview-validation.test.mjs | 构建与资源一致性 |
| 文档有效性 | document-index-validation.test.mjs | 检查器的遗漏、重复、失效地址、章节及中文路径测试；不修改交付 |
| 文件命名 | release-naming.test.mjs | 既定对外名称、版本、交付编号，以及验收索引当前版本一致性 |
| 部署结构 | workflow-contract.test.mjs | 静态约束；仍需 GitHub 实际运行验收 |
| 改动分流 | workflow-contract.test.mjs | 版本字段排除、真实网页改动、未知路径、失败与缺失关卡的反例检查；不另建重复套件 |
| 安装稳定性 | install-ci-dependencies.test.mjs | 成功不重试、失败最多两次、真实子进程超时终止 |
| 浏览器生命周期 | browser-lifecycle.spec.js | Edge 实际 BFCache 冻结与返回、三轮计时器暂停证据、冻结结合模拟五小时墙钟差；不等于实体电脑休眠或真实跨夜 |
| 检查入口与分组 | quality-entrypoints.test.mjs | 每份用例唯一归属、组内断言不遗漏、显式生成先于产物检查、只读全量不生成交付、手动观察不混入完整回归、参数错误直接失败 |
| 组件源码组装 | source-assembly.test.mjs | 顺序与源码定位、片段完整性、重复与循环、越界路径、JSON 数据、双产物一致、显式依赖；检查收入设置挂载、解绑、重挂和草稿保留，不启动浏览器 |
| 趣味换算组件 | fun-conversions-contract.spec.js | 两个实例互不影响、数量边界、重复值零写入、实时/历史标题、挂载与销毁；实际 Develop / Push 的 file 离线入口不请求源码或联网资源；Edge 与 WebKit，后者使用阻断网络请求而非驱动不支持的离线开关 |
| 已工作与月收入组件 | readout-components-contract.spec.js | 状态文案优先级、两实例隔离、同值写入、累计与预计分离、工作日摘要、月份名称、覆盖提示及监听清理；两份实际 HTML 的跨月回溯、单位节点保留、日历设置与焦点返回；Edge 与 WebKit，不替代真实设备验收 |
| 每小时收入组件 | hourly-summary-contract.spec.js | 三种工资方式呈现、实例隔离与监听清理；两份实际 HTML 的鼠标和键盘入口、原卡隐藏与焦点返回 |
| 日期估算结果 | date-estimate-result.spec.js | Develop/Push 在桌面和窄屏、深浅主题下的工作日与休息日读数、未来日期报错、输入后隐藏与未保存工资草稿隔离；组件实例与生命周期另由源码测试核对 |
| 工资换算摘要 | income-rate-summary.spec.js | 两份网页、两种宽度和深浅主题下三种计薪方式的即时摘要、无效金额与工作日输入、取消及保存后刷新；结构、字体和边界留作前后对照 |
| 工资方式、输入区与草稿 | income-mode-switch.spec.js | 两份网页在桌面、窄屏的鼠标与键盘切换、字段名称、说明、工作日栏显隐、金额限制和布局；覆盖重复当前方式、无效草稿、保存、刷新确认恢复及取消不改已保存工资 |
| 收入设置页签 | income-view-tabs.spec.js | 两份网页在桌面、窄屏的左右循环、Home/End、Tab 焦点、点击切页及保存区显隐；往返页签保留日期、时刻与工资草稿，估算使用已保存工资；隐藏滚轮的延迟回调不得改写选值，可见时仍能滚至 1 日 |
| 工作进度读数 | progress-readout-contract.spec.js | 六种班次或日状态、百分比和无障碍属性、立即归零和入口清理；两份 HTML 的午休、回溯及键盘焦点 |
| 组件联动 | component-joint.spec.js | 隐藏卡片不误判、真实宽度不足时缩紧与恢复；改工时、跨日跨月回溯、换主题及返回实时后的读数同步 |
| 日常使用 | daily-workflow.spec.js | 工资修改、日期定位及返回实时；改工时后核对首页时薪和进度，导出、修改并恢复工时、工资和日历后刷新 |

## 辅助工具

- `helpers/business-clock.js`：为内容稳定场景固定业务日期，不冻结动画时钟。
- `helpers/background-recovery.js`：恢复专项固定步长推进；最终业务值仍用独立算式计算。
- `helpers/settings-page.js`：普通设置测试的共同初始化；不处理暂停时钟和中间帧采样。
- `helpers/display-state.js`：通过真实专注及隐私按钮准备完整显示，等待设置交接；需要丢弃草稿时明确操作放弃确认，不绕过产品状态。
- `helpers/settings-backup.js`：发布与存储测试共用真实备份下载、上传及独立校验，保留明文和工资提醒断言；不直接调用产品内部的导入或校验函数。

默认 Playwright 只收集 `*.spec.js`。Node `*.test.mjs`、小组件 `widget-settings.cjs`和 Python `test_prepare_delivery.py`由快速检查运行，避免在浏览器收集阶段重复执行或产生副作用。

## 失败处理

首次失败保存轨迹、交接帧、越界元素和页面错误；重试成功仍记为偶发，不写成首次通过。不得通过放宽断言、更新截图或增加重试掩盖问题。性能样本只用于同机定位，不以固定帧率评价所有设备。

自动浏览器、模拟后台和 Scriptable 替身不等于实体设备、真实睡眠或跨夜。旧调查结果移出用途索引，不据此认定当前故障仍存在或已修复。

[全文件用途](repository-map.md) · [当前验收状态](../docs/README.md) · [CI 评估](../docs/maintainer/workflow-review.md)
