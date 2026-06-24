# 點餐網站 - 使用說明

這是一個完整的點餐系統，包含：

- **顧客點餐頁面**（網址首頁 `/`）：瀏覽分類、選餐點、客製化、結帳（現場付現金或轉帳）
- **店家後台**（`/admin`）：即時收到新訂單通知、管理訂單狀態、管理菜單與客製化選項

資料庫使用 **Supabase**（一個提供免費方案的線上資料庫服務），網站使用 **Next.js** 開發，部署到 **Vercel**（免費）。全程不需要自己管理伺服器。

以下教學假設你完全沒有架站經驗，請照順序一步一步做。

---

## 第一步：建立 Supabase 資料庫（約 10 分鐘）

1. 前往 https://supabase.com，用 GitHub 或 Email 註冊一個免費帳號。
2. 登入後點 **New project**，填上專案名稱（例如 `my-restaurant`）、設定一個資料庫密碼（記下來，之後可能會用到）、選一個離你近的地區，按 **Create new project**。等待約 1-2 分鐘建立完成。
3. 建立完成後，左側選單點 **SQL Editor** -> **New query**。
4. 打開這個專案資料夾裡的 `supabase/schema.sql` 檔案，把全部內容複製貼到編輯框裡，按右下角 **Run**。
   - 這會自動建立所有資料表、安全規則，以及幾個範例分類和菜色，方便你之後測試。
5. **開啟即時通知功能**：左側選單點 **Database** -> **Replication**，找到 `orders` 這個資料表，把它的 Realtime 開關打開（這樣店家後台才能即時收到新訂單）。
6. **建立店家登入帳號**：左側選單點 **Authentication** -> **Users** -> **Add user**，輸入店家要用來登入後台的 Email 和密碼（建立時記得勾選 "Auto Confirm User"，不然要等驗證信）。這組帳密之後就是登入 `/admin` 用的。
7. 左側選單點 **Project Settings** -> **API**，這個頁面會用到兩個值，先留著等下一步要用：
   - **Project URL**
   - **anon public** 金鑰（一長串文字）

---

## 第二步：在自己電腦上試跑網站（確認沒問題再上線）

1. 安裝 [Node.js](https://nodejs.org)（選 LTS 版本，下載後直接安裝，一路按下一步即可）。
2. 把整個專案資料夾解壓縮到電腦的某個位置。
3. 把資料夾裡的 `.env.local.example` 複製一份，改名成 `.env.local`，打開它，把第一步留下的兩個值填進去：

   ```
   NEXT_PUBLIC_SUPABASE_URL=你的 Project URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 anon public 金鑰
   ```

4. 打開終端機（Windows 用「命令提示字元」或 PowerShell，Mac 用「終端機」），切換到專案資料夾，依序執行：

   ```
   npm install
   npm run dev
   ```

5. 看到 `Local: http://localhost:3000` 後，瀏覽器打開 `http://localhost:3000` 就能看到顧客點餐頁面；打開 `http://localhost:3000/admin` 用剛剛建立的帳密登入，就是店家後台。
6. 自己下一筆測試訂單，看看後台是否會即時跳出來、有聲音提示。

---

## 第三步：正式上線（部署到 Vercel，免費）

1. 到 https://github.com 註冊一個免費帳號（如果還沒有），建立一個新的 repository（新的程式碼倉庫），把專案資料夾上傳上去（GitHub 網頁上有 "uploading an existing file" 的功能，可以直接拖檔案上傳，不一定要會用 git 指令）。
2. 到 https://vercel.com，用剛剛的 GitHub 帳號登入。
3. 點 **Add New** -> **Project**，選擇剛剛上傳的 repository，點 **Import**。
4. 在 **Environment Variables** 區塊，加入跟 `.env.local` 一樣的兩個變數：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. 按 **Deploy**，等待 1-2 分鐘。完成後 Vercel 會給你一個網址（例如 `https://my-restaurant.vercel.app`），這就是正式的網站了。
   - 顧客點餐頁面：`https://my-restaurant.vercel.app`
   - 店家後台：`https://my-restaurant.vercel.app/admin`
6. 之後想換成自己的網域名稱（例如 `order.我的店.com`），可以在 Vercel 專案的 **Settings -> Domains** 設定，照畫面指示去你購買網域的地方加一筆 DNS 紀錄即可。

> 之後如果想修改程式碼，只要把修改後的檔案再上傳到 GitHub，Vercel 會自動重新部署，不需要重複上面步驟。

---

## 日常使用方式

**顧客端**：分享網址（或印成 QR code 貼在桌上）給顧客，顧客選餐點 -> 客製化 -> 加入購物車 -> 填姓名電話 -> 選付款方式 -> 送出，畫面會顯示「請至現場付款」。

**店家端**：登入 `/admin` 後留在「訂單管理」頁面，新訂單進來時畫面會自動跳出並發出提示音（手機/電腦需先點過頁面一次，瀏覽器才會允許播放聲音，這是瀏覽器的安全限制）。可以把狀態切換成「製作中」「已完成」，或取消訂單。

**菜單管理**：可以新增/編輯/刪除分類與菜色，標記菜色是「飯類」（會自動出現加飯選項）、「麵類」（會自動出現加麵選項）或「其他」。

**客製化選項管理**：可以新增/修改/刪除像「辣度」「加料」這類選項群組，設定是否「預設套用到所有菜色」。如果某個菜色需要不一樣的客製化選項，到「菜單管理」編輯該菜色，選擇「自訂這個菜色的選項」，勾選要套用的群組即可，不影響其他菜色。

---

## 資料庫結構簡介（之後想自己調整可以參考）

- `categories` 分類
- `dishes` 菜色（`dish_type` 標記 rice/noodle/other，用來判斷加飯/加麵選項是否顯示）
- `option_groups` 客製化選項群組（辣度、加料…），`is_default` 決定是否自動套用到所有菜色
- `option_choices` 每個群組底下的選項，`extra_price` 是加價金額
- `dish_option_groups` 個別菜色覆寫客製化選項用的對應表
- `orders` / `order_items` / `order_item_options` 訂單與明細

## 常見問題

**Q: 後台聽不到新訂單的提示音？**
A: 大部分瀏覽器規定使用者要先跟頁面互動過（點一下畫面任何地方）才允許自動播放聲音，登入後台先點一下頁面即可。

**Q: 可以收信用卡或 LINE Pay 嗎？**
A: 目前版本只支援「現場付款」（現金/轉帳），沒有串接線上金流。如果之後需要，可以再串接第三方金流服務。

**Q: Supabase / Vercel 真的是免費的嗎？**
A: 兩者都有免費方案，對小型店家的訂單量來說通常完全夠用；如果生意變大、流量變高，才需要考慮升級付費方案。
