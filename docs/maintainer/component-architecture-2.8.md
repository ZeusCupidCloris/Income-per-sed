# 2.8.x 组件维护计划

目标是让维护者改哪张卡片就找到哪一个文件夹，内容、样式和动效各有明确归属，减少误改其他区域。这里的“像插件”指清楚的边界与可单独维护，不是增加插件市场、运行时下载或一套复杂插件系统。

已交付的 2.7.6 没有新增 `src` 目录或迁移业务代码。按“维护时分组件、交付时单 HTML”的约定，从[首批趣味换算卡](component-source-first-batch.md)开始分批迁移。当前 [2.8.0 候选](../releases/v2.8.0.md)已将首页读数、回溯控制、收入与工时设置拆出维护入口，保留字体、计薪口径和机械动效。候选提交审核，不等同于已发布版本。

## 文件归属

建议在 2.8.x 将可编辑源迁移到以下结构，具体文件在各批迁移时创建：

```text
src/
  page.html
  app.js
  core/
    business-time.js
    income-engine.js
    work-calendar.js
    settings-store.js
  styles/
    tokens.css
    base.css
  components/
    income-dial/
    income-readout/
    task-stopwatch/
    work-summary/
    hourly-summary/
    income-settings/
    income-view-tabs/
    income-mode-switch/
    income-drafts/
    income-fields/
    income-rate-summary/
    date-estimate-result/
    schedule-settings/
    schedule-calibration-summary/
    calendar-status/
    progress-readout/
    status-readout/
    history-date-seek/
    history-time-input/
    history-quick-buttons/
    history-dial-geometry/
    history-panel-focus/
    history-panel-controller/
    work-timeline/
    month-summary/
    fun-conversions/
    history-panel/
```

每个组件按实际需要拥有 `index.js`、`view.html`、`style.css`、`controller.js` 和 `motion.js`。没有独立动效的组件不创建空的动效文件；每个组件附简短说明，写清入口、公开方法、依赖、禁止跨改区域和测试位置。[顶部读数](status-readout-fifth-batch.md)与回溯控制分开维护，时间仍从页面传入。

例如，调整趣味换算的间距时，只进入 `fun-conversions/style.css`；修改任务暂停时的反馈时，先查看 `task-stopwatch` 的交互与动效文件；改工资计算公式时，进入公共的 `core/income-engine.js`，同时核对所有使用它的组件。这样区分局部外观与共享规则，不把每次改动都变成全页面搜索。

## 改动边界

- 组件只操作自己的根节点、状态和监听；沿用现有组件标记限定样式，不直接覆盖别的组件，也不擅自改全局字体与主题变量。
- 工资、北京时间、日历和保存规则只保留一套公共实现。组件读取统一的数据，不各自复制计算公式或直接写其他组件的设置。
- 动效文件可以分别维护，但所有需要同步的表针、滚轮和进度仍接收同一帧时间。不得给每张卡片各加一套定时器，造成收入、时间和指针不同步。
- 打开设置、日期回溯和保存完成等跨组件操作，由 `app.js` 明确协调。组件使用约定的方法和事件通知，不穿透修改其他组件 DOM。
- 初始化、更新与销毁都有明确入口。组件负责释放自己的监听、观察器和待执行任务，复用现有生命周期与调度能力，不另造第二套缓存或调度器。

涉及共享时间或计薪规则的改动仍可能影响多个组件；通过明确接口和测试列出影响范围，不承诺任意改动都绝对只影响一个文件夹。

收入设置已由[统一装配入口](../../src/components/income-settings/README.md)连接页签、方式按钮、输入区、草稿和摘要。定位界面从此处开始；开合和保存仍由共享设置面板处理。

[工作时间设置入口](../../src/components/schedule-settings/README.md)连接工时摘要、日历状态和日历按钮。[工时滚轮组](../../src/components/schedule-settings/wheels.js)负责创建和清理，[面板校验](../../src/components/schedule-settings/validation.js)集中判断时长与违规。提示时机、读屏播报、导入校验及保存仍由原宿主处理。

## 源码与交付

已交付的 2.7.x 以 Develop 为唯一编辑源，Push 由它生成。首批迁移从 `src/page.html` 及趣味换算目录开始，同步调整构建、维护策略和发布校验；其他计划文件按后续批次创建，不预建空模块。Develop 成为可定位源文件的可读诊断产物，Push 成为压缩发布产物。

交付仍保留原有四文件名称和双击离线使用能力。模板、样式与脚本在构建时组装，不依赖打开 HTML 后再读取一堆本地模块。小组件与手册保持原路径，不引入大框架；构建工具只有在明确需要时才增加。

开发产物应能从报错与组件标记定位到源文件。组件到文件的对应关系复用现有仓库索引，不再另建一份重复地图。生成文件不再手改，防止源文件与发布文件各改一套。

## 分批顺序与验收

先迁移趣味换算等小型只读组件，验证文件边界、离线构建和局部测试；再迁移工作读数与月收入、[时薪卡](hourly-summary-third-batch.md)及[工作进度读数](progress-readout-fourth-batch.md)。设置、回溯和工作时间轴后续单独处理，最后处理联动最多的机械表盘与任务码表。每批都保留可运行检查点，通过后再迁移下一批，不一次推倒重写。

每批必须核对：原业务结果与公开操作不变、样式没有越界、动画交接与最后一帧不变、监听能释放、Develop/Push 可重复生成且均可离线打开。单 HTML 交付是硬条件：删除或移走源码目录不影响已生成页面的运行，外部脚本与样式依赖由发布检查拒绝。现有测试断言和截图容差保留，新增组件契约与样式范围检查；不靠重建基线掩盖差异。

完成标准是维护一次组件改动时能准确找到入口、说明依赖并只修改必要源文件。新功能与外观调整另列需求，不与文件迁移混在同一批。
