# V8 网站部署与 Nginx 配置指南

本文以以下环境为例：

- 服务器 IP：`23.95.185.110`
- Nginx 安装目录：`/usr/local/nginx`
- 网站目录：`/var/www/guangxiang`
- 示例域名：`example.com`
- 示例部署用户：`root`

请将文档中的 `example.com` 替换为你的真实域名。

---

## 一、登录并检查服务器

```bash
ssh root@23.95.185.110
```

检查 Nginx：

```bash
/usr/local/nginx/sbin/nginx -v
/usr/local/nginx/sbin/nginx -V
ps -ef | grep nginx
```

检查配置文件位置：

```bash
/usr/local/nginx/sbin/nginx -t
```

通常主配置文件为：

```text
/usr/local/nginx/conf/nginx.conf
```

检查 80、443 端口：

```bash
ss -lntp | grep -E ':80|:443'
```

如果使用 UFW 防火墙：

```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload
```

如果使用 firewalld：

```bash
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

---

## 二、准备网站文件

当前 V8 网站的 `assets` 是一个软链接：

```text
v8/assets -> ../v7/assets
```

上传时必须解析软链接，否则服务器上可能只得到一个失效的链接。

推荐最终目录结构：

```text
/var/www/guangxiang/
├── index.html
├── analytics.js
├── script.js
├── styles.css
├── assets/
└── pages/
```

部署后访问地址为：

```text
https://example.com/
https://example.com/pages/solutions.html
https://example.com/pages/architecture.html
https://example.com/pages/technology.html
https://example.com/pages/contact.html
```

---

## 三、上传网站文件

在本地电脑执行：

```bash
cd /Users/chunlin/Documents/workspace_codex/yolo11-video/product-website
```

在服务器创建网站目录：

```bash
ssh root@23.95.185.110 "mkdir -p /var/www/guangxiang"
```

使用 `rsync -aL` 上传 V8 网站：

```bash
rsync -avzL \
  v8/ \
  root@23.95.185.110:/var/www/guangxiang/
```

参数说明：

- `-a`：保留目录结构和文件属性；
- `-v`：显示上传过程；
- `-z`：传输时压缩；
- `-L`：解析软链接并复制真实文件。

登录服务器检查文件：

```bash
ssh root@23.95.185.110
find /var/www/guangxiang -maxdepth 2 -type f | sort | head -50
```

检查图片和视频是否已经真实复制：

```bash
find /var/www/guangxiang/assets/images -type f | wc -l
find /var/www/guangxiang/assets/videos -type f | wc -l
```

检查关键文件：

```bash
ls -l \
  /var/www/guangxiang/index.html \
  /var/www/guangxiang/styles.css \
  /var/www/guangxiang/script.js \
  /var/www/guangxiang/analytics.js \
  /var/www/guangxiang/assets/images/favicon.svg
```

---

## 四、设置文件权限

静态网站只需要 Nginx 能读取文件：

```bash
chown -R root:root /var/www/guangxiang
find /var/www/guangxiang -type d -exec chmod 755 {} \\
;
find /var/www/guangxiang -type f -exec chmod 644 {} \\
;
```

也可以使用更直观的写法：

```bash
find /var/www/guangxiang -type d -print0 | xargs -0 chmod 755
find /var/www/guangxiang -type f -print0 | xargs -0 chmod 644
```

如果 Nginx 访问父目录受限：

```bash
chmod 755 /var
chmod 755 /var/www
chmod 755 /var/www/guangxiang
```

查看 Nginx 运行用户：

```bash
grep -n 'user ' /usr/local/nginx/conf/nginx.conf
```

---

## 五、配置 Nginx 主配置

创建站点配置目录：

```bash
mkdir -p /usr/local/nginx/conf/conf.d
```

编辑主配置文件：

```bash
vi /usr/local/nginx/conf/nginx.conf
```

确认 `http { ... }` 内包含站点配置引入：

```nginx
http {
    include       mime.types;
    default_type  application/octet-stream;

    sendfile on;
    keepalive_timeout 65;

    include /usr/local/nginx/conf/conf.d/*.conf;
}
```

如果主配置文件中已经存在其他内容，只需要确认以下这一行位于 `http {}` 内：

```nginx
include /usr/local/nginx/conf/conf.d/*.conf;
```

---

## 六、配置 HTTP 站点

创建站点配置：

```bash
vi /usr/local/nginx/conf/conf.d/guangxiang.conf
```

先写入 HTTP 配置：

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name example.com www.example.com;

    root /var/www/guangxiang;
    index index.html;

    # Let's Encrypt 证书验证目录
    location ^~ /.well-known/acme-challenge/ {
        root /var/www/guangxiang;
        default_type text/plain;
    }

    # 静态网站
    location / {
        try_files $uri $uri/ =404;
    }

    # HTML 不长期缓存，方便更新页面
    location ~* \.html$ {
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # CSS、JS、图片、字体和视频缓存 7 天
    location ~* \.(?:css|js|svg|png|jpg|jpeg|gif|webp|avif|ico|webm|mp4|woff|woff2)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
    }

    # 基础安全响应头
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

将 `example.com` 替换为真实域名。

检查配置：

```bash
/usr/local/nginx/sbin/nginx -t
```

看到以下内容说明配置语法正确：

```text
syntax is ok
test is successful
```

重新加载 Nginx：

```bash
/usr/local/nginx/sbin/nginx -s reload
```

如果 Nginx 由 systemd 管理，也可以使用：

```bash
systemctl reload nginx
```

临时使用 IP 测试时，可以将配置改为：

```nginx
server_name 23.95.185.110 example.com www.example.com;
```

测试：

```bash
curl -I http://23.95.185.110/
```

---

## 七、DNS 配置

在域名服务商的 DNS 控制台添加以下记录。

假设域名为：

```text
example.com
```

### 根域名 A 记录

| 类型 | 主机记录 | 记录值 | TTL |
|---|---|---|---|
| A | `@` | `23.95.185.110` | `300` |

### www 记录

推荐使用 CNAME：

| 类型 | 主机记录 | 记录值 | TTL |
|---|---|---|---|
| CNAME | `www` | `example.com` | `300` |

也可以使用 A 记录：

| 类型 | 主机记录 | 记录值 | TTL |
|---|---|---|---|
| A | `www` | `23.95.185.110` | `300` |

不要同时配置互相冲突的 A 记录和 CNAME 记录。

如果 DNS 控制台存在旧的 `AAAA` 记录，但服务器没有配置 IPv6，建议暂时删除该记录，避免部分用户解析到不可用的 IPv6 地址。

### 检查 DNS

在本地电脑执行：

```bash
dig +short example.com
dig +short www.example.com
```

预期返回：

```text
23.95.185.110
```

也可以执行：

```bash
nslookup example.com
nslookup www.example.com
```

---

## 八、申请 HTTPS 证书

正式网站建议启用 HTTPS。

### 安装 Certbot

Ubuntu/Debian：

```bash
apt update
apt install -y certbot
```

由于 Nginx 安装在 `/usr/local/nginx`，建议使用 webroot 模式，不要让 Certbot 自动修改 Nginx 配置。

确认验证目录：

```bash
mkdir -p /var/www/guangxiang/.well-known/acme-challenge
echo ok > /var/www/guangxiang/.well-known/acme-challenge/test.txt
```

测试验证文件：

```bash
curl http://example.com/.well-known/acme-challenge/test.txt
```

应该返回：

```text
ok
```

申请证书：

```bash
certbot certonly \
  --webroot \
  -w /var/www/guangxiang \
  -d example.com \
  -d www.example.com
```

证书一般位于：

```text
/etc/letsencrypt/live/example.com/fullchain.pem
/etc/letsencrypt/live/example.com/privkey.pem
```

---

## 九、配置 HTTPS 和 HTTP 跳转

编辑站点配置：

```bash
vi /usr/local/nginx/conf/conf.d/guangxiang.conf
```

替换为以下配置：

```nginx
# HTTP 自动跳转到 HTTPS
server {
    listen 80;
    listen [::]:80;

    server_name example.com www.example.com;

    # 证书续期验证仍允许通过 HTTP
    location ^~ /.well-known/acme-challenge/ {
        root /var/www/guangxiang;
        default_type text/plain;
    }

    location / {
        return 301 https://example.com$request_uri;
    }
}

# HTTPS 网站
server {
    listen 443 ssl;
    listen [::]:443 ssl;

    server_name example.com www.example.com;

    root /var/www/guangxiang;
    index index.html;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    location / {
        try_files $uri $uri/ =404;
    }

    # HTML 不长期缓存
    location ~* \.html$ {
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # 静态资源缓存 7 天
    location ~* \.(?:css|js|svg|png|jpg|jpeg|gif|webp|avif|ico|webm|mp4|woff|woff2)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
    }

    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000" always;
}
```

这里的：

```nginx
return 301 https://example.com$request_uri;
```

会把所有 HTTP 请求跳转到不带 `www` 的主域名。

如果希望 `www.example.com` 作为主域名，则改为：

```nginx
return 301 https://www.example.com$request_uri;
```

检查并重载：

```bash
/usr/local/nginx/sbin/nginx -t
/usr/local/nginx/sbin/nginx -s reload
```

测试：

```bash
curl -I http://example.com
curl -I https://example.com
curl -I https://www.example.com
```

预期结果：

- HTTP 返回 `301`；
- HTTPS 返回 `200`；
- `www` 和非 `www` 统一到一个主域名。

---

## 十、配置证书自动续期

先测试续期流程：

```bash
certbot renew --dry-run
```

测试成功后设置定时任务：

```bash
crontab -e
```

添加：

```cron
17 3 * * * certbot renew --quiet --deploy-hook "/usr/local/nginx/sbin/nginx -s reload"
```

该任务每天凌晨 3:17 检查证书，只有证书更新时才重新加载 Nginx。

---

## 十一、统计代码配置

当前网站中的 `v8/analytics.js` 默认为空配置，不会发送统计请求。

文件位置：

```text
v8/analytics.js
```

### Google Analytics 4

如果使用 GA4，修改：

```js
window.V8_ANALYTICS = {
  provider: 'ga4',
  measurementId: 'G-XXXXXXXXXX'
};
```

需要填写 Google Analytics 数据流中的 Measurement ID，例如：

```text
G-XXXXXXXXXX
```

### 百度统计

如果使用百度统计，修改为：

```js
window.V8_ANALYTICS = {
  provider: 'baidu',
  measurementId: '你的百度统计站点ID'
};
```

建议二选一，不要同时启用两个统计平台，以免页面浏览量重复统计。

---

## 十二、正式部署后的检查

### 检查页面和资源

```bash
curl -I https://example.com/
curl -I https://example.com/styles.css
curl -I https://example.com/script.js
curl -I https://example.com/analytics.js
curl -I https://example.com/assets/images/favicon.svg
curl -I https://example.com/assets/videos/hero-demo.webm
curl -I https://example.com/pages/solutions.html
curl -I https://example.com/pages/architecture.html
curl -I https://example.com/pages/technology.html
curl -I https://example.com/pages/contact.html
```

关键资源应返回：

```text
HTTP/2 200
```

### 查看 Nginx 日志

访问日志：

```bash
tail -f /usr/local/nginx/logs/access.log
```

错误日志：

```bash
tail -f /usr/local/nginx/logs/error.log
```

如果日志目录不同，执行：

```bash
grep -R "access_log\|error_log" /usr/local/nginx/conf
```

### 检查 404

打开网站浏览器开发者工具，在 Network 中筛选 `404`，重点检查：

- `assets/images`；
- `assets/videos`；
- `styles.css`；
- `script.js`；
- `analytics.js`；
- `favicon.svg`。

### 移动端检查

建议使用浏览器开发者工具测试：

- `390 × 844`；
- `412 × 915`；
- `768 × 1024`。

重点确认：

- 顶部导航；
- 行业方案横向标签；
- 方案视频；
- 联系电话；
- QQ 链接；
- 页脚公司名称；
- 技术表格是否横向溢出。

---

## 十三、正式网站信息

最终推荐目录：

```text
/var/www/guangxiang/
```

最终访问地址：

```text
https://example.com/
https://example.com/pages/solutions.html
https://example.com/pages/architecture.html
https://example.com/pages/technology.html
https://example.com/pages/contact.html
```

部署时请特别注意：

1. 上传时使用 `rsync -aL`，解析 `v8/assets` 软链接；
2. DNS 中将 `@` 和 `www` 指向 `23.95.185.110`；
3. Nginx 的 `root` 指向网站目录，不是 `/usr/local/nginx`；
4. 申请 HTTPS 证书后再开启强制 HTTPS；
5. 正式域名确定后，再补充 canonical 和正式 Open Graph URL；
6. 提供 GA4 或百度统计 ID 后，再填写 `v8/analytics.js`。
