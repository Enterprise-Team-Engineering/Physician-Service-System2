# Physician Service System 启动说明

网站由三部分组成，需要按顺序启动：

1. MySQL 数据库 `physician_service`
2. PHP 后端，地址 `http://127.0.0.1:8088`
3. Vue 前端，地址 `http://localhost:8081`

前端页面通过 `/api` 访问后端，后端再读写本机 MySQL。

## 环境

- MySQL 8
- PHP 8，需启用 `pdo_mysql`
- Node.js。当前机器是 Node 22 时，启动前端要加上 OpenSSL 兼容参数

数据库连接写在 `backend/php/config.php`。

## 1. 准备数据库

在项目根目录打开命令行。如果库还没建，执行：

```text
mysql -u root -p123456 --default-character-set=utf8mb4 < database/01_schema.sql
mysql -u root -p123456 --default-character-set=utf8mb4 < database/02_data.sql
```

已经在 `mysql>` 里登录时，改用：

```text
source C:/Users/Lenovo/Desktop/app/Physician-Service-System2/database/01_schema.sql
source C:/Users/Lenovo/Desktop/app/Physician-Service-System2/database/02_data.sql
```

`02_data.sql` 会清空并重新写入示例数据。库里已经有要保留的记录时，不要重复执行它。

## 2. 启动后端

新开一个命令行窗口：

```text
cd backend/php
php -S 127.0.0.1:8088 router.php
```

看到 `Development Server (http://127.0.0.1:8088) started` 后保持这个窗口不要关。

## 3. 启动前端

再开一个命令行窗口。第一次需要安装依赖：

```text
cd frontend
npm install --legacy-peer-deps
```

然后启动：

```powershell
cd frontend
$env:NODE_OPTIONS="--openssl-legacy-provider"
npm run dev
```

看到 `http://localhost:8081` 后，用浏览器打开这个地址。

## 登录账号

| 用户名 | 密码 | 身份 |
| --- | --- | --- |
| doctor | 123456 | 张医生 |
| admin | admin123 | 内科科室管理员 |
| wilson | 123456 | 威尔逊医生 |

登录后应能看到患者、问诊和病历。这些数据来自 `physician_service`，刷新页面后仍然保留。

## 关闭

在运行后端和前端的两个窗口里按 `Ctrl+C`。MySQL 服务可以继续开着。
