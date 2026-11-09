# Thiệp mời Lễ Tốt Nghiệp

Trang tĩnh, không build, không backend, deploy Vercel free.

| File | Việc |
|---|---|
| `index.html` | Thiệp mời (toàn bộ trang) |
| `tot-nghiep-animation.html` | Hoạt ảnh pixel 78 giây, nhúng vào thiệp bằng iframe |

## Thông tin buổi lễ
- **14/11/2026 — 10h30** (sáng thứ 7), xong lễ là chụp ảnh
- **Hội trường A (lầu 6)** — 97 Võ Văn Tần, P. Xuân Hòa, TP.HCM
- Gửi xe: Công viên Tao Đàn hoặc Cung Văn hoá Lao động TP.HCM

## Màn hình khoá
Vừa vào trang: overlay kiểu màn hình khoá iOS — giờ `10:30`, ngày `Thứ Bảy, 14 tháng 11`,
một "thông báo" kính mờ, quầng màu thở nhẹ phía sau; trang thật nằm dưới bị blur 26px.
Mở bằng: kéo lên (>70px), cuộn xuống, chạm bất kỳ, bấm nút "Mở thiệp", hoặc Enter/Space/↑/↓/Esc.
Mở xong overlay bị xoá khỏi DOM, trang nét dần, hero mới chạy animation.
Tôn trọng `prefers-reduced-motion`.

## Sửa nội dung
Mở `index.html`, tìm `const INVITE = {`. Sửa `start`, `hours`, `venueName`, `venueAddr`,
`mapUrl`, `parking`, `agenda`, `faq`, `photos`, `albumUrl`, `albumUrlFormal`, `zalo`, `email`, `animUrl`.

## RSVP (không có backend)
Nút "Xác nhận tham dự" → `https://zalo.me/0384555001`.
Phương án hai: link `mailto:wanaquana.k.dev@gmail.com` có sẵn subject.

## Album ảnh buổi lễ
Hai link Google Drive, chọn theo nhóm khách:
- Khách trong `FORMAL` (Ba Hồ, Mẹ Trang, Chị 7, Anh 7, Chị Mi, Huỳnh Hương) → `albumUrlFormal`
- Tất cả khách còn lại → `albumUrl`

Chỉ nhận URL `https:`; link sai thì ẩn mục, không tạo nút giả.

## Hoạt ảnh
Section "Bốn năm trong 78 giây". Phong bì đóng; bấm thì nắp lật, thiệp trượt lên, ~1,1s sau mới tải `iframe` nên trang vào nhanh.
Màn < 735px: bấm mở tab mới (nhúng 16:9 trên màn hẹp thì chữ pixel chỉ còn ~4px, không đọc nổi).

9 cảnh, viết cho người không biết gì về lập trình — không có từ kỹ thuật nào.
Thời lượng mỗi cảnh ở `data-t` trên `<section>`; thêm/bớt/đổi thứ tự cảnh chỉ cần sửa HTML.

| # | Nội dung |
|---|---|
| 1 | Chào, mình là Quân, mình làm ứng dụng điện thoại (chữ gõ dần) |
| 2 | Hành trình 2022 → 2026, người pixel đi dọc đường, trời ngả hoàng hôn |
| 3 | Một ngày năm cuối: đồng hồ 07:00 → 01:00, trời tối dần |
| 4 | 6 app đã làm, mỗi app một màn hình điện thoại chạy thật |
| 5 | Hiện tại: Global Safe, dự án Swapy, gặp đối tác FPT và Viettel |
| 6 | Swapy: ngón tay chạm đặt lịch |
| 7 | Cảm ơn: chữ cuộn như credit phim, ảnh polaroid hiện dần |
| 8 | Thiệp mời: ngày giờ, địa điểm |
| 9 | Đường tới hội trường: lầu 6, 3 bước |

### Ảnh đại diện thật
`avatar.jpg` (900×899, pixel art) đã có sẵn, dùng ở cảnh 1, 6, 7. Xoá file đi thì tự rơi về
hình pixel vẽ bằng code — không lỗi, không ô trống.

**Đổi ảnh khác:** ghi đè `avatar.jpg`, rồi chạy `node measure.mjs` để lấy toạ độ nón tốt nghiệp:
```
→ đặt: const AV_CAP = [36, 4];
```
Dán số đó vào `AV_CAP` trong `tot-nghiep-animation.html`. Nếu nón vẫn lệch, chỉnh tay:
số đầu = sang phải, số sau = xuống dưới. Xem lại bằng `node shot.mjs`.

## Thiệp riêng theo tên khách
`GUESTS` map đường dẫn → tên có dấu: `domain.com/BaHo` → "Gửi Ba Hồ,".
Khách không nằm trong `FORMAL` nhận bản nội dung vui (`FUN`). Không có trong `GUESTS`
thì tách slug: `/NguyenVanA` → "Nguyen Van A". Dùng `?to=Tên` cũng được.

### Thêm một người mới
Mở `index.html`, làm 2 bước (bước 3 nếu cần):

**1. Thêm vào `GUESTS`** — bên trái là đường dẫn (không dấu, không khoảng trắng), bên phải là tên hiển thị:
```js
const GUESTS = {
  BaHo: 'Ba Hồ',
  CoLan: 'Cô Lan',     // ← thêm dòng này
};
```
→ Link gửi đi: `https://ten-mien.vercel.app/CoLan` → hiện "Gửi Cô Lan,"

**2. Chọn giọng văn.** Mặc định là bản vui (`FUN`). Muốn trang trọng thì thêm khoá vào `FORMAL`:
```js
const FORMAL = ['BaHo', 'MeTrang', 'Chi7', 'Anh7', 'ChiMi', 'HuynhHuong', 'CoLan'];
```
`FORMAL` cũng quyết định xem album Drive nào (xem mục Album).

**3. Lịch trình riêng (tuỳ chọn).** Thêm khoá vào `who` của nhóm trong `PLANS`:
```js
giadinh: { who: [...FORMAL, 'CoLan'], ... }
```
Không thêm thì mục "lịch riêng" tự ẩn với người đó, các phần khác vẫn đủ.

**Không cần sửa code cũng gửi được:** `https://ten-mien.vercel.app/?to=Cô%20Lan`
Cách này hiện đúng tên nhưng luôn dùng bản vui và album chung, không có lịch riêng.

> Tên có dấu trong đường dẫn vẫn chạy (`/Nguyễn Văn A`), nhưng khi dán vào Zalo/Messenger
> sẽ thành chuỗi `%E1%BB%85...` xấu. Nên dùng khoá không dấu.

## Lịch trình riêng theo nhóm (`PLANS`)
Mỗi khách thấy đúng lịch của nhóm mình. Khách lạ / không tên: ẩn mục.

| Nhóm | Ai | Lịch |
|---|---|---|
| `anhem` | Phương Duy, Tẹo, Vy-chan | Thứ 6 tối nhậu → thứ 7 sáng chụp hình → trưa mình đi với gia đình → chiều cà phê + nhậu vòng hai |
| `giadinh` | Ba Hồ, Mẹ Trang, Chị 7, Anh 7, Chị Mi, Huỳnh Hương | Thứ 7: 10:00 có mặt → 10:30 lễ → 12:00 chụp ảnh → ăn trưa tới 15–16:00 |
| `dai_hoc` | Đệ An, Đệ Đăng, Đệ Hoàng, cháu gái | Thứ 7 ghé chụp hình (không bắt buộc) → hẹn riêng **Chủ Nhật 22/11/2026** |

Thêm nhóm: thêm một khoá vào `PLANS` với `who` (danh sách khoá trong `GUESTS`), `ttl`, `sub`, `rows`.
Nhãn cột đầu dùng `\n` để xuống dòng (`'Thứ 6 · 13/11\ntối'`).

## Deploy Vercel
```
npx vercel --prod
```
`vercel.json` rewrite mọi đường dẫn về `index.html` để `/BaHo` hoạt động.
File có thật được serve trước rewrite, nên `/tot-nghiep-animation.html` vẫn mở trực tiếp được.

## Kiểm thử
```
node check.mjs      # nội dung, link, countdown, .ics, gallery, album, RSVP, hoạt ảnh, lịch riêng (115 checks)
node audit.mjs      # lỗi UI: tràn ngang, vùng chạm 44px, chữ nhỏ/bị cắt, màn khoá (125 checks, 8 cỡ máy)
node audit-anim.mjs # hoạt ảnh: 9 cảnh, chữ tràn/bị cắt/quá nhỏ, nút điều khiển
node shot.mjs       # chụp 9 cảnh ra /tmp/anim-0..8.png để xem bằng mắt
```
Cần Node 22 + Google Chrome.
