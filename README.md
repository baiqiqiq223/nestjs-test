# OSS 上传签名服务

这是一个基于 NestJS 的后端服务，用于给“前端直传阿里云 OSS”生成临时、安全、可过期的 POST Policy 上传签名。

服务端只负责生成上传凭证，不接收文件内容。前端拿到签名后，直接把文件上传到 OSS。

## Node 版本

推荐使用：

```bash
Node.js 24 LTS
npm 11+
```

原因：

- Node 24 是当前 Active LTS，适合新项目和生产部署。
- Node 22 已进入 Maintenance LTS，更适合存量项目继续维护。
- 本项目已在 `package.json` 中通过 `engines` 约束运行版本：`node >=24 <25`。

## 功能

- 生成 OSS 前端直传 POST Policy 签名。
- 签名短期有效，默认 300 秒。
- 每次签名只允许上传到一个唯一对象路径。
- 限制最大上传文件大小。
- 可按业务场景生成目录，例如 `avatar`、`product`、`material`。
- 支持按 `Content-Type` 限制上传类型。
- 内置环境变量校验、全局参数校验、Helmet、安全 CORS 配置、接口限流。
- 代码按模块拆分，便于继续扩展用户、订单、文件管理等其它接口。

## 目录结构

```text
src
├── app.module.ts
├── main.ts
└── modules
    ├── config
    │   ├── app.config.ts
    │   ├── env.validation.ts
    │   └── oss.config.ts
    ├── health
    │   ├── health.controller.ts
    │   └── health.module.ts
    └── oss
        ├── dto
        │   └── create-upload-signature.dto.ts
        ├── interfaces
        │   └── upload-signature.interface.ts
        ├── oss.controller.ts
        ├── oss.module.ts
        ├── oss.service.spec.ts
        └── oss.service.ts
```

## 启动

```bash
npm install
copy .env.example .env
npm run start:dev
```

Windows PowerShell 也可以使用：

```powershell
Copy-Item .env.example .env
```

启动后接口基础地址：

```text
http://localhost:3000/api/v1
```

## 环境变量

复制 `.env.example` 后，按实际 OSS 信息修改：

```env
NODE_ENV=development
PORT=3000
API_PREFIX=api
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
THROTTLE_TTL_MS=60000
THROTTLE_LIMIT=60

OSS_REGION=oss-cn-hangzhou
OSS_BUCKET=your-bucket
OSS_ACCESS_KEY_ID=your-ram-access-key-id
OSS_ACCESS_KEY_SECRET=your-ram-access-key-secret
OSS_UPLOAD_DIR=uploads
OSS_SIGNATURE_EXPIRE_SECONDS=300
OSS_MAX_FILE_SIZE_MB=20

WECHAT_MINI_APP_ID=your-wechat-mini-app-id
WECHAT_MINI_APP_SECRET=your-wechat-mini-app-secret
```

生产环境建议：

- `OSS_ACCESS_KEY_ID` 和 `OSS_ACCESS_KEY_SECRET` 使用 RAM 子账号。
- RAM 权限只授予目标 Bucket 和指定目录的 `oss:PutObject`。
- `OSS_SIGNATURE_EXPIRE_SECONDS` 建议设置为 60 到 300 秒。
- `CORS_ORIGINS` 只填写可信前端域名，不要使用通配来源。

## 生成上传签名

请求：

```http
GET /api/v1/oss/upload/signature?contentType=image/png&fileName=avatar.png&scene=avatar
```

参数说明：

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `fileName` | 否 | 原始文件名，仅用于提取安全后缀名 |
| `contentType` | 否 | 限制上传文件类型，例如 `image/png` |
| `scene` | 否 | 业务场景目录，例如 `avatar`、`product` |

响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "host": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com",
    "key": "uploads/avatar/2026/05/20/uuid.png",
    "policy": "base64-policy",
    "signature": "signature",
    "accessId": "your-ram-access-key-id",
    "expireAt": "2026-05-20T10:00:00.000Z",
    "maxFileSize": 20971520,
    "successActionStatus": "200"
  },
  "timestamp": "2026-05-20T10:00:00.000Z",
  "path": "/api/v1/oss/upload/signature?contentType=image/png&fileName=avatar.png&scene=avatar"
}
```

字段说明：

| 字段 | 说明 |
| --- | --- |
| `code` | 业务状态码，成功固定为 `0` |
| `message` | 响应信息，成功为 `success` |
| `data` | 业务数据 |
| `timestamp` | 服务端响应时间 |
| `path` | 当前请求路径 |
| `data.host` | OSS 前端直传地址 |
| `data.key` | 后端生成的对象路径，本次签名只允许上传到该路径 |
| `data.policy` | Base64 编码后的 OSS POST Policy |
| `data.signature` | 对 Policy 生成的 HMAC-SHA1 签名 |
| `data.accessId` | 前端表单字段 `OSSAccessKeyId` 使用的 RAM AccessKeyId |
| `data.expireAt` | 签名过期时间 |
| `data.maxFileSize` | 允许上传的最大文件大小，单位字节 |
| `data.successActionStatus` | OSS 上传成功后返回的 HTTP 状态码 |

## 微信小程序登录

请求：

```http
POST /api/v1/auth/wechat/login
Content-Type: application/json
```

请求体：

```json
{
  "code": "wx.login 返回的 code",
  "nickname": "微信昵称",
  "avatarUrl": "http://tmp/2Gi15mYa8P8Mbe5eb9ec15490fcbe71e37f858d8ba32.jpeg"
}
```

说明：

- 小程序前端调用 `wx.login` 获取 `code`，再把 `code` 传给后端。
- `nickname` 和 `avatarUrl` 为可选字段，用于保存前端获取到的微信昵称和头像。
- 如果本次登录没有传 `nickname` 或 `avatarUrl`，后端会保留用户之前保存的资料。
- 后端使用 `WECHAT_MINI_APP_ID` 和 `WECHAT_MINI_APP_SECRET` 调用微信 `jscode2session` 接口。
- 后端不会把微信 `session_key` 返回给前端，只返回自建登录态 `token`。
- 后续需要登录的接口，在请求头携带 `Authorization: Bearer <token>`。
- `token` 30 天未使用会自动过期；每次鉴权成功都会把有效期顺延 30 天。

参数说明：

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `code` | 是 | `wx.login` 返回的临时登录凭证 |
| `nickname` | 否 | 微信昵称，最多 30 个字符 |
| `avatarUrl` | 否 | 微信头像 URL，支持 `https://...` 和微信临时头像地址 `http://tmp/...` |

响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "backend-token",
    "expiresIn": 2592000,
    "expiresAt": "2026-06-19T10:00:00.000Z",
    "user": {
      "id": "user-id",
      "openid": "wechat-openid",
      "unionid": "wechat-unionid",
      "nickname": "微信昵称",
      "avatarUrl": "https://example.com/avatar.png"
    }
  },
  "timestamp": "2026-05-20T10:00:00.000Z",
  "path": "/api/v1/auth/wechat/login"
}
```

返回字段说明：

| 字段 | 说明 |
| --- | --- |
| `data.token` | 后端生成的登录 token，后续请求通过 `Authorization: Bearer <token>` 携带 |
| `data.expiresIn` | token 未使用自动过期时间，单位秒，当前为 30 天 |
| `data.expiresAt` | token 当前过期时间；每次鉴权成功后会顺延 30 天 |
| `data.user.id` | 后端内部用户 ID，用于关联图片等业务数据 |
| `data.user.openid` | 微信小程序用户 `openid`，同一个小程序内唯一 |
| `data.user.unionid` | 微信开放平台 `unionid`，满足微信条件时返回，可用于多应用用户打通 |
| `data.user.nickname` | 用户微信昵称，前端传入后保存并返回 |
| `data.user.avatarUrl` | 用户微信头像 URL，前端传入后保存并返回 |

## 上传图片信息

请求：

```http
POST /api/v1/images
Content-Type: application/json
Authorization: Bearer <token>
```

请求体：

```json
{
  "imageUrl": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com/uploads/demo.png",
  "title": "图片标题",
  "description": "图片描述"
}
```

参数说明：

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `imageUrl` | 是 | 前端直传 OSS 成功后得到的图片 URL，必须是带协议的完整 URL |
| `title` | 是 | 图片标题，最多 20 个字符 |
| `description` | 是 | 图片描述，最多 100 个字符 |

响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "image-id",
    "userId": "user-id",
    "imageUrl": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com/uploads/demo.png",
    "title": "图片标题",
    "description": "图片描述",
    "createdAt": "2026-05-20T10:00:00.000Z",
    "updatedAt": "2026-05-20T10:00:00.000Z"
  },
  "timestamp": "2026-05-20T10:00:00.000Z",
  "path": "/api/v1/images"
}
```

返回字段说明：

| 字段 | 说明 |
| --- | --- |
| `data.id` | 图片记录 ID |
| `data.userId` | 当前登录用户的后端内部用户 ID |
| `data.imageUrl` | 图片 OSS 地址 |
| `data.title` | 图片标题 |
| `data.description` | 图片描述 |
| `data.createdAt` | 图片记录创建时间 |
| `data.updatedAt` | 图片记录更新时间 |

## 获取图片列表

请求：

```http
GET /api/v1/images?page=1&pageSize=20
Authorization: Bearer <token>
```

查询参数：

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `page` | 否 | 页码，默认 `1` |
| `pageSize` | 否 | 每页数量，默认 `20`，最大 `100` |

说明：

- 接口只返回当前登录用户上传的图片。
- 当前版本使用内存存储，服务重启后用户 token 和图片记录会丢失；接入数据库后应持久化用户和图片表。

响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "image-id",
        "userId": "user-id",
        "imageUrl": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com/uploads/demo.png",
        "title": "图片标题",
        "description": "图片描述",
        "createdAt": "2026-05-20T10:00:00.000Z",
        "updatedAt": "2026-05-20T10:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  },
  "timestamp": "2026-05-20T10:00:00.000Z",
  "path": "/api/v1/images?page=1&pageSize=20"
}
```

返回字段说明：

| 字段 | 说明 |
| --- | --- |
| `data.items` | 当前页图片记录列表 |
| `data.items[].id` | 图片记录 ID |
| `data.items[].userId` | 图片所属用户的后端内部用户 ID |
| `data.items[].imageUrl` | 图片 OSS 地址 |
| `data.items[].title` | 图片标题 |
| `data.items[].description` | 图片描述 |
| `data.items[].createdAt` | 图片记录创建时间 |
| `data.items[].updatedAt` | 图片记录更新时间 |
| `data.total` | 当前登录用户的图片总数 |
| `data.page` | 当前页码 |
| `data.pageSize` | 每页数量 |

## 前端上传表单字段

前端拿到响应后，使用 `multipart/form-data` 直传 OSS：

```text
key=<response.data.key>
OSSAccessKeyId=<response.data.accessId>
policy=<response.data.policy>
Signature=<response.data.signature>
success_action_status=200
Content-Type=<file.type>
file=<binary file>
```

上传地址使用：

```text
<response.data.host>
```

注意：`file` 字段必须放在表单最后。

## 安全设计说明

核心代码在 `src/modules/oss/oss.service.ts`。

关键点：

- 使用 HMAC-SHA1 按 OSS POST Policy 规则生成签名。
- `expiration` 控制签名过期时间。
- `eq $key` 限制本次签名只能上传到一个对象路径。
- `content-length-range` 限制上传体积。
- 后端生成 UUID 文件名，避免前端覆盖任意 OSS 对象。
- `scene`、`fileName` 使用 DTO 校验，避免路径注入。

## 常用命令

```bash
npm run start:dev
npm run build
npm run start:prod
npm test
npm run lint
```

## 健康检查

```http
GET /api/v1/health
```

响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "status": "ok",
    "timestamp": "2026-05-20T00:00:00.000Z"
  },
  "timestamp": "2026-05-20T00:00:00.000Z",
  "path": "/api/v1/health"
}
```

## 错误响应

接口报错会统一返回：

```json
{
  "code": 400,
  "message": "Bad Request",
  "data": null,
  "timestamp": "2026-05-20T00:00:00.000Z",
  "path": "/api/v1/oss/upload/signature?scene=../bad",
  "errors": [
    "scene can only contain letters, numbers, underscore and hyphen"
  ]
}
```
