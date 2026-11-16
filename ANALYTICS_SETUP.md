# 网站数据统计配置（GTM + GA4）

## 当前使用的 ID

- Google Tag Manager 容器：`GTM-NQML8862`
- Google Analytics 4 衡量 ID：`G-VN5MT41YBP`

网站代码负责加载 GTM 容器并推送业务事件；GA4 标签需要在 GTM 控制台中配置并发布。

## GTM 中需要完成的配置

### 1. 创建 Google 标签

进入 [Google Tag Manager](https://tagmanager.google.com/) 并打开容器 `GTM-NQML8862`：

1. 进入「代码」/「Tags」，新建标签，类型选择 **Google 标签（Google tag）**。
2. 标签 ID 填写 `G-VN5MT41YBP`。
3. 触发条件选择 **Initialization - All Pages** 或 **All Pages**。
4. 保存。

该标签负责 GA4 页面浏览数据采集。不要再在网站代码中额外加载 GA4 的 `gtag.js`，避免重复安装和重复统计。

### 2. 配置网站业务事件

网站通过 `dataLayer` 推送统一事件：

- GTM 事件名：`v8_event`
- 业务事件名字段：`v8_event_name`
- 事件标签字段：`event_label`

在 GTM 中创建以下数据层变量：

| 变量名称 | 数据层变量名称 |
| --- | --- |
| DLV - v8_event_name | `v8_event_name` |
| DLV - event_label | `event_label` |

然后创建一个触发器：

- 类型：**自定义事件（Custom Event）**
- 事件名称：`v8_event`

最后创建一个 **Google Analytics：GA4 事件** 标签：

- 事件名称：选择变量 `{{DLV - v8_event_name}}`
- 事件参数：`event_label` = `{{DLV - event_label}}`
- 触发条件：上一步创建的 `v8_event` 触发器

保存并发布 GTM 容器。

### 3. 当前网站已有的业务事件

- `solution_tab_change`：行业方案页签切换
- 带有 `data-track` 属性的元素点击事件：由网站脚本自动采集

后续只需给需要统计的按钮或链接增加 `data-track="事件名称"`，即可进入统一事件链路。

## 验证方式

1. 在 GTM 中使用「预览（Preview）」连接网站，确认 Google 标签和 `v8_event` 事件触发。
2. 在 GA4「报告」→「实时」中确认页面浏览和业务事件数据。
3. 首次配置后，数据可能需要一段时间才会显示在标准报告中；实时报告和 Tag Assistant 更适合即时验证。
