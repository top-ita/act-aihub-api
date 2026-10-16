# Activity API documentation website

หน้าเว็บ HTML / CSS / JavaScript ไม่ต้องติดตั้ง npm packages เปิดโดยดับเบิลคลิก `index.html` ได้ทันที ไม่ต้องรันเซิร์ฟเวอร์

## เปิดใช้งาน

ดับเบิลคลิก `index.html` หรือเปิด `file:///Users/taveevut/dev/SIS/act-aihub-api/index.html`

โหมด `file://` อ่านเนื้อหาจาก `manual-data.js` ที่สร้างจาก Markdown เพราะเบราว์เซอร์ไม่อนุญาตให้ `fetch()` อ่านไฟล์โดยตรง หลังแก้ไข `API_MANUAL.md` ให้รันคำสั่งนี้แล้วรีเฟรชหน้าเว็บ:

```bash
python3 sync-manual.py
```

หากต้องการอ่าน Markdown ล่าสุดโดยตรงทุกครั้งที่รีเฟรช สามารถเปิดผ่าน HTTP server ได้:

```bash
cd /Users/taveevut/dev/SIS/act-aihub-api
python3 -m http.server 8080 --bind 127.0.0.1
```

เปิด http://localhost:8080 ในเบราว์เซอร์

แก้ไข `API_MANUAL.md` แล้วรีเฟรชหน้าเว็บ เนื้อหาและสารบัญจะอัปเดตตามไฟล์ รองรับตาราง ลิงก์ anchor และ code blocks พร้อมปุ่มคัดลอก ค้นหาโดยกรองหมวดที่มีข้อความตรงกัน กด `/` เพื่อค้นหา และ `Escape` เพื่อล้างคำค้น

นำไฟล์ `index.html`, `styles.css`, `app.js`, `manual-data.js`, `API_MANUAL.md` และโฟลเดอร์ `vendor/` ไปวางบน static web server ได้ โดยต้องอยู่ภายใต้ path เดียวกัน

## Libraries

เก็บไว้ใน `vendor/` เพื่อให้เปิดเว็บได้โดยไม่เรียก CDN:

- Marked 15.0.12 (MIT): https://github.com/markedjs/marked
- DOMPurify 3.2.6 (Apache-2.0 OR MPL-2.0): https://github.com/cure53/DOMPurify

Markdown ถูกแปลงเป็น HTML ด้วย Marked และผ่าน DOMPurify ก่อนแสดงผล

## ฟอนต์

ใช้ Google Sans ทั้งหน้า รวมถึงตัวอย่างโค้ด ผ่าน Google Fonts `@import` ใน `styles.css` ต้องเชื่อมต่ออินเทอร์เน็ตเพื่อโหลดฟอนต์ หากโหลดไม่ได้จะใช้ sans-serif ของเครื่อง
