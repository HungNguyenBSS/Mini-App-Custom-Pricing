# Tổng quan hệ thống Mini App Custom Pricing

## 1. Mục đích

Mini App Custom Pricing là một Shopify embedded app cho phép merchant tạo các quy tắc giá tùy chỉnh cho sản phẩm. Rule có thể áp dụng cho tất cả sản phẩm hoặc các sản phẩm thỏa điều kiện tag, với ba kiểu điều chỉnh giá:

- Giá cố định (`fixed`)
- Giảm một số tiền cố định (`decrease_amount`)
- Giảm theo phần trăm (`decrease_percent`)

Sau khi rule được tạo hoặc thay đổi, app đồng bộ các rule đang bật lên Shopify shop metafield. Theme app extension đọc metafield này trên trang chi tiết sản phẩm (PDP), xác định rule phù hợp và hiển thị giá sau giảm.

> Phạm vi hiện tại thay đổi **giá hiển thị trên PDP**.

## 2. Kiến trúc

Hệ thống có ba thành phần chính.

```text
Shopify Admin
    │
    │ Embedded app / App Bridge
    ▼
React Router + Polaris (app/)
    │                         │
    │ Server actions/loaders   │ Client fetch /api (development)
    ▼                         ▼
Shopify Admin GraphQL      Koa REST API (backend/)
    │                         │
    │                         ▼
    │                      MySQL + Sequelize
    │
    ▼
Shop metafield: custom_pricing.active_rules
    │
    ▼
Theme App Extension (extensions/mini-app-cp-hung/)
    │
    ▼
Storefront PDP: Liquid + embed.js
```

### 2.1. Embedded Shopify app

Thư mục `app/` là Shopify app xây trên React Router, App Bridge và Polaris.

- `app/shopify.server.ts`: cấu hình Shopify, MySQL session storage, `afterAuth`.
- `app/routes/app.tsx`: layout embedded app, Polaris và menu điều hướng.
- `app/routes/app.rules._index.tsx`: danh sách rule, tìm kiếm, sắp xếp, bulk enable/disable, duplicate và remove.
- `app/routes/app.rules.new.tsx`: tạo rule.
- `app/routes/app.rules.$id.tsx`: sửa rule.
- `app/components/RuleForm.tsx`: điều phối state, validation và submit của form dùng chung create/edit.
- `app/components/rules/RuleProductScope.tsx`: phần chọn phạm vi sản phẩm (all products hoặc product tags).
- `app/components/rules/ProductPricingPreview.tsx`: bảng xem trước giá sản phẩm và phân trang.
- `app/components/rules/RulesTable.tsx`: bộ lọc, sắp xếp, bulk actions và bảng danh sách rule.
- `app/components/rules/DeleteRuleModal.tsx`: modal xác nhận xóa rule.
- `app/components/rules/ruleForm.utils.ts`: hàm tính giá preview và rút gọn Shopify GID.
- `app/components/rules/rulesList.utils.ts`: hàm định dạng ngày giờ cho danh sách rule.
- `app/hooks/useRules.ts`: custom hook tải danh sách rule và cung cấp hàm `reload`.
- `app/hooks/useRuleFilters.ts`: custom hook quản lý search, debounce và sort của danh sách rule.
- `app/services/pricing.server.ts`: đồng bộ rule sang Shopify metafield và tạo metafield definition.

Route `app.rules._index.tsx` vẫn giữ Shopify `loader`/`action` và state điều phối thao tác. Các component và hooks bên trên chỉ tách phần hiển thị hoặc client state để route ngắn hơn; chúng không thay đổi API hay quy tắc nghiệp vụ.

### 2.2. Backend API

Thư mục `backend/` là REST API độc lập, sử dụng Koa, Koa Router, Koa BodyParser, Sequelize và MySQL.

- `backend/server.ts`: khởi tạo Koa và mount API.
- `backend/models/Shop.ts`: model Shop.
- `backend/models/Rule.ts`: model Rule.
- `backend/routes/shop.ts`: API Shop.
- `backend/routes/rules.ts`: API Rule.

### 2.3. Database

MySQL chứa hai bảng được Sequelize tự đồng bộ khi backend chạy:

| Bảng | Vai trò | Trường chính |
|---|---|---|
| `shops` | Lưu shop đã xác thực/cài app | `id`, `shopDomain`, `accessToken`, `name`, `status` |
| `rules` | Lưu custom pricing rule theo shop | `id`, `shopDomain`, `name`, `status`, `applyTo`, `tags`, `priceType`, `amount`, `productIds` |

Mỗi rule gắn với `shopDomain`. Backend luôn truy vấn rule kèm điều kiện shop để tách dữ liệu giữa các shop.

### 2.4. Redux Toolkit

Redux được khai báo để quản lý `shopData` ở client:

- `app/store/store.ts`: cấu hình Redux store.
- `app/store/shopSlice.ts`: state `shop.data`, `shop.loading` và async thunk `fetchShopData`.
- `app/store/hooks.ts`: typed hooks `useAppDispatch` và `useAppSelector`.
- `app/root.tsx`: bọc toàn bộ app bằng `ReduxProvider`.

Shop identity dùng cho thao tác nhạy cảm (tạo/sửa/xóa rule) vẫn phải lấy từ `session.shop` phía server qua `authenticate.admin(request)`. Redux chỉ nên dùng cho state/UI; không được dùng dữ liệu client làm nguồn xác thực.

### 2.5. Theme app extension

Theme extension ở `extensions/mini-app-cp-hung/`.

- `blocks/embed.liquid`: app embed block cho PDP; xuất dữ liệu metafield rules, product tags/price, `shop.money_format` và `price_selector` cho JavaScript.
- `assets/embed.js`: log `Hello from Hung`, chọn rule khớp, tính giá, định dạng tiền tệ và cập nhật price element.

## 3. Luồng xử lý

### 3.1. Cài app / xác thực shop

```text
Merchant cài hoặc xác thực app
    ↓
Shopify tạo session
    ↓
afterAuth trong app/shopify.server.ts chạy
    ├─ Đăng ký webhook khai báo trong shopify.app.toml
    ├─ Tạo metafield definition custom_pricing.active_rules (nếu chưa có)
    ├─ Dùng Admin GraphQL lấy tên shop
    └─ Gọi backend POST /shop để upsert Shop vào MySQL
```

Shop được lưu với trạng thái `active`.

### 3.2. Tạo hoặc cập nhật rule

```text
Merchant nhập RuleForm
    ↓
Route action xác thực Shopify bằng authenticate.admin(request)
    ↓
Lấy shop hiện tại từ session.shop
    ↓
Gọi Koa API tạo/cập nhật rule, gửi x-shop-domain từ server
    ↓
Koa lưu rule vào MySQL qua Sequelize
    ↓
syncRulesToMetafield() lấy toàn bộ rule enable của shop
    ↓
Admin GraphQL ghi JSON vào shop metafield custom_pricing.active_rules
```

Các thao tác duplicate, remove, enable và disable cũng đồng bộ lại metafield sau khi backend thao tác thành công.

### 3.2.1. Luồng danh sách, tìm kiếm và bulk action

```text
RulesIndex tải rule theo shopDomain bằng useRules()
    ↓
useRuleFilters() debounce truy vấn 500 ms, lọc theo tên và sắp xếp
    ↓
RulesTable hiển thị kết quả và lựa chọn nhiều rule
    ↓
Merchant chọn Enable / Disable / Delete hoặc thao tác từng rule
    ↓
Route action cập nhật backend, đồng bộ metafield, rồi gọi reload()
```

### 3.2.2. Luồng preview trong form

```text
Merchant chọn All products hoặc thêm product tags
    ↓
RuleForm lọc các sản phẩm phù hợp từ danh sách đã lấy qua Admin GraphQL
    ↓
ProductPricingPreview tính modified price theo price type và amount hiện tại
    ↓
Merchant xem bảng preview theo từng trang (10 sản phẩm/trang)
```

### 3.3. Hiển thị giá trên storefront

```text
Merchant bật app embed Custom Pricing trong Theme Editor
    ↓
Chỉ trên PDP, embed.liquid đọc shop.metafields.custom_pricing.active_rules
    ↓
Liquid xuất JSON: rules, product tags, product price, shop.money_format
    ↓
embed.js tìm rule phù hợp:
    - applyTo = all: luôn khớp
    - applyTo = tags: product phải có toàn bộ tag của rule
    ↓
Nếu nhiều rule khớp: dùng rule được tạo sớm nhất
    ↓
embed.js tính giá mới và thay nội dung price selector
```

Merchant có thể cấu hình `Price CSS selector` trong app embed; mặc định là `.price-item--regular`.

### 3.4. Gỡ app

```text
Shopify gửi webhook app/uninstalled
    ↓
Route webhooks.app.uninstalled.tsx xác minh webhook
    ├─ Xóa các Shopify session của shop
    └─ Gọi Koa PUT /shop/uninstall
          ↓
       Cập nhật shops.status = uninstalled trong MySQL
```

## 4. API backend

Backend được mount dưới tiền tố `/api`.

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/shop?shopDomain=...` | Lấy thông tin shop |
| `POST` | `/api/shop` | Tạo/cập nhật shop sau xác thực |
| `PUT` | `/api/shop/uninstall` | Đặt trạng thái shop thành `uninstalled` (header `x-shop-domain`) |
| `GET` | `/api/rules` | Danh sách rules của shop (header `x-shop-domain`) |
| `GET` | `/api/rules/:id` | Lấy một rule |
| `POST` | `/api/rules` | Tạo rule |
| `PUT` | `/api/rules/:id` | Cập nhật rule |
| `POST` | `/api/rules/:id/duplicate` | Nhân bản rule |
| `DELETE` | `/api/rules/:id` | Xóa rule |

Trong development, Vite proxy `/api` đến backend tại cổng `3001`.

## 5. Cấu hình môi trường

Tạo file `.env` ở thư mục gốc. Không commit secrets vào Git.

```dotenv
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_APP_URL=https://your-public-app-url
SCOPES=read_products,read_themes,read_customers,write_themes

DB_HOST=localhost
DB_NAME=shopify_custom_pricing
DB_USER=root
DB_PASS=your_mysql_password

# Ví dụ: backend server mount API tại /api
BACKEND_URL=http://localhost:3001/api
```

`BACKEND_URL` cần chứa `/api`, vì các server-side route gọi ví dụ `${BACKEND_URL}/rules` và `${BACKEND_URL}/shop`.

`shopify.app.toml` cũng phải chứa application URL và auth redirect URL hợp lệ trước khi deploy. Shopify CLI tự cập nhật URL tunnel trong lúc chạy `shopify app dev` nếu `automatically_update_urls_on_dev = true`.

## 6. Cách chạy local

### Điều kiện cần

- Node.js theo phiên bản trong `package.json`: `>=20.19 <22` hoặc `>=22.12`.
- MySQL đang chạy và database đã được tạo.
- Shopify CLI đã đăng nhập và app đã được liên kết với development store.
- Dependencies đã cài bằng `npm install`.

### Bước chạy

Mở hai terminal ở thư mục dự án.

**Terminal 1 — Backend Koa:**

```bash
npm run start-backend
```

Backend sẽ kết nối MySQL, đồng bộ model và chạy mặc định tại `http://localhost:3001`.

**Terminal 2 — Shopify app:**

```bash
npm run dev
```

Shopify CLI sẽ tạo tunnel, cập nhật cấu hình development và mở/hiển thị đường dẫn cài app. Cài app vào development store rồi truy cập từ Shopify Admin.

### Bật storefront extension

1. Mở Shopify Admin → **Online Store** → **Edit Theme**.
2. Bật app embed **Custom Pricing**.
3. Tạo một rule trạng thái Enable trong embedded app.
4. Mở PDP trên storefront để kiểm tra giá hiển thị sau giảm.
5. (Tùy chọn) Mở DevTools Console để xác nhận log `Hello from Hung` khi embed đã bật.

## 7. Lưu ý kỹ thuật

- API version trong Shopify app code và `shopify.app.toml` nên được giữ đồng nhất khi chuẩn bị deploy.
- `application_url`/`redirect_urls` không nên giữ `example.com` khi production.
- Backend hiện nhận `x-shop-domain`; production nên bảo vệ API bằng Shopify session token hoặc chuyển các thao tác nhạy cảm qua server actions để ngăn client giả mạo shop domain.
