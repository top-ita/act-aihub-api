# คู่มือการเรียกใช้งาน API 5 เส้นทางสำคัญ (Developer API Guide)

เอกสารฉบับนี้จัดทำขึ้นสำหรับนักพัฒนา (Frontend / Backend / Fullstack) เพื่ออธิบายรายละเอียด, วัตถุประสงค์, พารามิเตอร์, ตัวอย่างการเรียกใช้งาน, และโครงสร้าง Response ของ API เส้นสำคัญ 5 เส้นในระบบกิจกรรมนักศึกษา (`sis-apis`)

---

## สารบัญ API

1. [`GET /api/v1/act/act-registrations`](#1-get-apiv1actact-registrations-ดึงรายการลงทะเบียนกิจกรรมทั้งหมด) — ดึงรายการลงทะเบียนกิจกรรมทั้งหมด (Streamed JSON)
2. [`GET /api/v1/act/activity-schedules`](#2-get-apiv1actactivity-schedules-ดึงรอบกำหนดการกิจกรรมทั้งหมด) — ดึงรอบกำหนดการกิจกรรมทั้งหมด (Streamed JSON)
3. [`GET /api/v1/auth/users`](#3-get-apiv1authusers-ดึงรายชื่อผู้ใช้พร้อมสรุปผลกิจกรรม) — ดึงรายชื่อนักศึกษาพร้อมสรุปผลกิจกรรมรายบุคคล
4. [`GET /api/v1/act/activities`](#4-get-apiv1actactivities-ดึงรายการกิจกรรมโหมดจัดการ) — ดึงรายการกิจกรรมในโหมดจัดการ (Management Mode)
5. [`GET /api/v1/report/summary/user/{userIdentifier}`](#5-get-apiv1reportsummaryuseruseridentifier-สรุปผลกิจกรรมรายบุคคลตามกรอบ) — สรุปผลกิจกรรมรายบุคคลตามกรอบ (สำหรับดูความคืบหน้า / ใบรับรอง)

---

## ความรู้พื้นฐานร่วมกัน (Common Concepts)

### Base URL & Prefix
- **Server (Production / UAT):** `https://api831.yru.ac.th/act/api`

### กลไก `paginate=false` (Streamed JSON Chunking)
เมื่อส่ง `paginate=false` ใน API รายการส่วนใหญ่ของระบบ:
- Backend จะ **ไม่ใช้** Pagination ปกติ และจะไม่ดึงข้อมูลทั้งหมดมาไว้ใน RAM ในคราวเดียว (`->get()`)
- ระบบจะใช้ `lazy(100)->chunk(100)` และส่ง Response ออกมาเป็น **Streamed JSON** (`response()->streamJson(['data' => $rows()])`)
- **ข้อดี:** ประหยัดหน่วยความจำของเซิร์ฟเวอร์อย่างมากเมื่อข้อมูลมีจำนวนหลายพันถึงหลักหมื่นแถว
- **รูปแบบ Response:**
  ```json
  {
    "data": [
      { ... },
      { ... }
    ]
  }
  ```

---

## 1. `GET /api/v1/act/act-registrations` (ดึงรายการลงทะเบียนกิจกรรมทั้งหมด)

### URL
```http
GET https://api831.yru.ac.th/act/api/v1/act/act-registrations?paginate=false&sort_by=registered_at&sort_order=desc&type=student
```

### วัตถุประสงค์ (Use Case)
ใช้สำหรับดึงประวัติและรายการลงทะเบียนเข้าร่วมกิจกรรมทั้งหมด โดยเรียงลำดับจากรายการที่ลงทะเบียนล่าสุดลงมา เหมาะสำหรับ:
- หน้าสรุปการลงทะเบียนรวมของระบบ (`/auth/register`)
- การดึงข้อมูลไป Export Excel หรือทำรายงานภาพรวม
- ตรวจสอบสถานะการเข้าร่วม (ลงทะเบียนแล้ว, เช็คอินแล้ว, เช็คเอาท์แล้ว)

### การยืนยันตัวตน (Authentication)
- **สิทธิ์:** Public route ในการอ่านข้อมูล (หากส่ง `Authorization: Bearer {token}` มาด้วย ระบบสามารถนำไปตรวจสอบสิทธิ์เพิ่มเติมได้)

### Query Parameters

| Parameter | Type | Required | คำอธิบาย |
|---|---|---|---|
| `paginate` | `boolean` | ไม่บังคับ | กำหนดเป็น `false` เพื่อดึงข้อมูลทั้งหมดแบบ Streamed JSON |
| `sort_by` | `string` | ไม่บังคับ | คอลัมน์ที่ต้องการเรียงลำดับ ในที่นี้คือ `registered_at` (วันที่ลงทะเบียน)<br>*(รองรับ: `id`, `status`, `registered_at`, `checkin_at`, `checkout_at`, `attendance_minutes`, `checkin_method`, `user.username`, `user.name`, `activity.title`)* |
| `sort_order` | `string` | ไม่บังคับ | ลำดับการเรียง: `desc` (จากใหม่ไปเก่า) หรือ `asc` (จากเก่าไปใหม่) |
| `type` | `string` | ไม่บังคับ | ค่าประเภทผู้ใช้ เช่น `student` (ส่งจาก client เพื่อระบุบริบทการเรียก) |

#### ฟิลเตอร์เสริมที่รองรับ (Optional Filters)
- `activity_id`: กรองเฉพาะกิจกรรมที่ระบุ
- `schedule_id`: กรองเฉพาะรอบกำหนดการที่ระบุ
- `user_id`: กรองเฉพาะผู้ใช้ที่ระบุ
- `status`: กรองตามสถานะ (`1`=ลงทะเบียน, `4`=เช็คอิน, `5`=เช็คเอาท์/สมบูรณ์, `6`=ยกเลิก) คั่นด้วย comma ได้ เช่น `status=4,5`
- `has_checkin`: `1` = เช็คอินแล้ว, `0` = ยังไม่เช็คอิน
- `faculty`, `program`: กรองตามคณะ / สาขาวิชา
- `from`, `to`: กรองช่วงวันที่ลงทะเบียน (`registered_at`)
- `search`: ค้นหาชื่อ-สกุล, รหัสนักศึกษา, ชื่อกิจกรรม, ref_code, หมายเหตุ

### ตัวอย่างการเรียก (cURL)
```bash
curl -X GET "https://api831.yru.ac.th/act/api/v1/act/act-registrations?paginate=false&sort_by=registered_at&sort_order=desc&type=student" \
  -H "Accept: application/json"
```

### ตัวอย่าง Response (JSON)
```json
{
  "data": [
    {
      "id": 1502,
      "activity_id": 45,
      "schedule_id": 88,
      "user_id": 119231,
      "user_code": "406510024",
      "user_name": "นายสมชาย ใจดี",
      "user_email": "somchai.j@yru.ac.th",
      "user": {
        "id": 119231,
        "username": "406510024",
        "name": "นายสมชาย ใจดี"
      },
      "activity": {
        "id": 45,
        "title": "กิจกรรมปฐมนิเทศนักศึกษาใหม่ ประจำปีการศึกษา 2568"
      },
      "schedule": {
        "id": 88,
        "registration_start_date": "2026-06-01T08:30:00+07:00",
        "registration_end_date": "2026-06-15T16:30:00+07:00",
        "activity_start_date": "2026-06-20T09:00:00+07:00",
        "activity_end_date": "2026-06-20T16:00:00+07:00",
        "duration_minutes": 360,
        "status": "closed"
      },
      "status": 5,
      "remark": null,
      "registered_at": "2026-06-05T10:15:20+07:00",
      "checkin_at": "2026-06-20T08:50:12+07:00",
      "checkout_at": "2026-06-20T16:05:40+07:00",
      "attendance_minutes": 360,
      "checkin_method": "qr_scan",
      "ref_code": "REG-20260605-0012",
      "note": null,
      "meta": null,
      "created_at": "2026-06-05T10:15:20+07:00",
      "updated_at": "2026-06-20T16:05:40+07:00"
    }
  ]
}
```

---

## 2. `GET /api/v1/act/activity-schedules` (ดึงรอบกำหนดการกิจกรรมทั้งหมด)

### URL
```http
GET https://api831.yru.ac.th/act/api/v1/act/activity-schedules?paginate=false&sort_by=registration_start_date&sort_order=desc
```

### วัตถุประสงค์ (Use Case)
ใช้ดึงรายการรอบกำหนดการจัดกิจกรรมทั้งหมด (`act_activity_schedules`) พร้อมข้อมูลกิจกรรมหลัก, หมวดหมู่/ประเภทกิจกรรม, และจำนวนผู้เข้าร่วมกิจกรรมที่นับจริงแบบเรียลไทม์ เหมาะสำหรับ:
- ปฏิทินกิจกรรม และตารางกำหนดการทั้งหมดของระบบ
- หน้าค้นหาและเลือกกำหนดการเพื่อนำเข้าผู้เข้าร่วม (Import Participant Dialog)
- เจ้าหน้าที่ตรวจสอบรอบเปิดรับสมัครและจำนวนที่นั่งที่เหลือ

### การยืนยันตัวตน (Authentication)
- **สิทธิ์:** Public route

### Query Parameters

| Parameter | Type | Required | คำอธิบาย |
|---|---|---|---|
| `paginate` | `boolean` | ไม่บังคับ | กำหนดเป็น `false` เพื่อดึงข้อมูลทั้งหมดแบบ Streamed JSON |
| `sort_by` | `string` | ไม่บังคับ | เรียงลำดับตาม `registration_start_date` (วันเริ่มเปิดรับสมัคร) |
| `sort_order` | `string` | ไม่บังคับ | `desc` (ล่าสุดมาก่อน) หรือ `asc` |

#### ฟิลเตอร์เสริมที่รองรับ (Optional Filters)
- `activity_id`: กรองเฉพาะรอบของกิจกรรมหลัก ID นี้
- `open_only`: `true` = เฉพาะรอบที่ยังเปิดรับสมัครอยู่ในปัจจุบัน
- `status`: `active` (เปิดรับสมัคร) หรือ `inactive` (ยังไม่เปิดหรือปิดแล้ว)
- `registration_phase`: `upcoming` (ยังไม่ถึงเวลา), `open` (กำลังเปิดรับสมัคร), `closed` (ปิดรับสมัครแล้ว)
- `registration_date_from`, `registration_date_to`: กรองช่วงเวลาเปิดรับสมัคร
- `activity_date_from`, `activity_date_to`: กรองช่วงเวลาจัดกิจกรรมจริง
- `is_published`: `true` / `false` แสดงเฉพาะรอบที่เผยแพร่แล้ว
- `is_restricted`: `true` / `false` รอบที่มีการจำกัดกลุ่มเป้าหมาย (ปีรุ่น/คณะ/หลักสูตร/รหัสนำ)
- `duration_hours_min`, `duration_hours_max`: กรองตามจำนวนชั่วโมงกิจกรรม
- `search`: ค้นหาชื่อกิจกรรมหลัก (`activity.title`)

### จุดเด่นด้านสถาปัตยกรรม (Architectural Highlights)
1. **Real-time Count:** ระบบนับจำนวนผู้เข้าร่วมจริงจากตาราง `act_registrations` (ไม่นับสถานะ 6=ยกเลิก) ผ่าน `withCount('registrations as current_participants_count')` ทำให้ได้ข้อมูลยอดคนสมัครล่าสุดเสมอ
2. **Computed Display:** คำนวณ `primary_action_type`, `primary_action_label`, `available_slots`, `is_full`, `is_registration_open` มาให้พร้อมแสดงผลบน UI ทันที

### ตัวอย่างการเรียก (cURL)
```bash
curl -X GET "https://api831.yru.ac.th/act/api/v1/act/activity-schedules?paginate=false&sort_by=registration_start_date&sort_order=desc" \
  -H "Accept: application/json"
```

### ตัวอย่าง Response (JSON)
```json
{
  "data": [
    {
      "id": 88,
      "activity_id": 45,
      "type_id": 2,
      "category_id": 7,
      "type_label": "กิจกรรมบังคับ",
      "category_label": "กิจกรรมเสริมสร้างคุณธรรมจริยธรรม",
      "type_tag_class": "badge-danger",
      "registration_start_date": "2026-06-01T08:30:00+07:00",
      "registration_end_date": "2026-06-15T16:30:00+07:00",
      "activity_start_date": "2026-06-20T09:00:00+07:00",
      "activity_end_date": "2026-06-20T16:00:00+07:00",
      "checkin_start_date": "2026-06-20T08:00:00+07:00",
      "checkout_start_date": "2026-06-20T15:30:00+07:00",
      "duration_minutes": 360,
      "duration_hours": 6,
      "status": "closed",
      "is_published": true,
      "max_participants": 200,
      "current_participants": 185,
      "available_slots": 15,
      "is_registration_open": false,
      "is_full": false,
      "is_expired": true,
      "is_restricted": true,
      "target_student_year_prefix": ["68"],
      "target_faculties": ["คณะวิทยาศาสตร์และเทคโนโลยี"],
      "target_student_status": "normal",
      "activity": {
        "id": 45,
        "title": "กิจกรรมปฐมนิเทศนักศึกษาใหม่ ประจำปีการศึกษา 2568",
        "detail": "กิจกรรมสำหรับนักศึกษาชั้นปีที่ 1...",
        "organizer_name": "กองพัฒนานักศึกษา"
      }
    }
  ]
}
```

---

## 3. `GET /api/v1/auth/users` (ดึงรายชื่อผู้ใช้พร้อมสรุปผลกิจกรรม)

### URL
```http
GET https://api831.yru.ac.th/act/api/v1/auth/users?paginate=false&sort_by=username&sort_order=asc&type=student&include_activity_summary=1
```

### วัตถุประสงค์ (Use Case)
ใช้ดึงรายชื่อนักศึกษาทั้งหมด โดยเรียงตามรหัสนักศึกษา (`username`) พร้อมคำนวณสรุปผลกิจกรรม (จำนวนกิจกรรมที่ผ่านเกณฑ์ `passed` และจำนวนกิจกรรมทั้งหมดที่ต้องทำตามกรอบ `total`) แนบมาให้ในแต่ละแถว เหมาะสำหรับ:
- หน้ารายชื่อนักศึกษาสำหรับบุคลากร / อาจารย์ที่ปรึกษา (หน้า Employees: `/auth/employee`)
- หน้าตรวจสอบคุณสมบัติการสำเร็จการศึกษาด้านกิจกรรม
- ลดจำนวน HTTP Request (ไม่ต้องยิง API สรุปผลแยกทีละคน)

### การยืนยันตัวตน และการบังคับสิทธิ์ (Auth & RBAC)
- **Token:** แนะนำให้ส่ง `Authorization: Bearer {token}`
- **กฎสิทธิ์เฉพาะของเส้นนี้:**
  - หากผู้ล็อกอินมีบทบาท **`advisor`** (อาจารย์ที่ปรึกษา) โดยไม่มีบทบาท `admin` ระบบจะ **บังคับกรองเฉพาะนักศึกษาในความดูแลของอาจารย์ท่านนั้นอัตโนมัติ** (`advisor_type_ref_id`)
  - หากผู้ล็อกอินมีบทบาท **`admin`** สามารถดูนักศึกษาทั้งหมดได้ และสามารถส่งฟิลเตอร์ `advisor_type_ref_id` เพื่อเลือกดูรายอาจารย์ได้

### Query Parameters

| Parameter | Type | Required | คำอธิบาย |
|---|---|---|---|
| `paginate` | `boolean` | ไม่บังคับ | `false` เพื่อดึงข้อมูลทั้งหมดแบบ Streamed JSON |
| `sort_by` | `string` | ไม่บังคับ | ฟิลด์ที่ใช้เรียง ในที่นี้คือ `username` (รหัสนักศึกษา) |
| `sort_order` | `string` | ไม่บังคับ | `asc` (0-9 / ก-ฮ) หรือ `desc` |
| `type` | `string` | ไม่บังคับ | ระบุ `student` เพื่อดึงเฉพาะบัญชีประเภทนักศึกษา |
| `include_activity_summary` | `integer`/`boolean` | ไม่บังคับ | ระบุ `1` หรือ `true` เพื่อให้ระบบคำนวณและแนบ `activity_summary` มาในทุกแถว |

#### ฟิลเตอร์เสริมที่รองรับ (Optional Filters)
- `faculty`: กรองตามคณะ
- `program`: กรองตามสาขาวิชา/หลักสูตร
- `student_status`: `normal` (นักศึกษาปกติ) หรือ `transfer` (นักศึกษาเทียบโอน)
- `role_in`: กรองผู้ใช้ที่มีบทบาทตามระบุ เช่น `role_in=student,leader`
- `search`: ค้นหาชื่อ-นามสกุล หรือรหัสนักศึกษา (หากส่งรหัสตัวเลข ≥ 8 หลัก ระบบจะสลับไปใช้ Exact Index Search เพื่อความเร็วสูงสุด)

### ฟิลด์สำคัญ: `activity_summary`
เมื่อส่ง `include_activity_summary=1` และ `type=student` ระบบจะเรียก `ActRegistrationSummaryByUsersService` เพื่อคำนวณความคืบหน้ากิจกรรมตามกรอบกิจกรรมที่นักศึกษาคนนั้นสังกัด:
```json
"activity_summary": {
  "passed": 8,
  "total": 12
}
```
- `passed`: จำนวนกิจกรรมที่เข้าร่วมสมบูรณ์และผ่านเกณฑ์ในกรอบ
- `total`: จำนวนกิจกรรมขั้นต่ำทั้งหมดที่กรอบกำหนดให้ต้องเข้าร่วมตามประเภทนักศึกษา (ปกติ/เทียบโอน)

### ตัวอย่างการเรียก (cURL)
```bash
curl -X GET "https://api831.yru.ac.th/act/api/v1/auth/users?paginate=false&sort_by=username&sort_order=asc&type=student&include_activity_summary=1" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Accept: application/json"
```

### ตัวอย่าง Response (JSON)
```json
{
  "data": [
    {
      "id": 119231,
      "username": "406510024",
      "name": "นายสมชาย ใจดี",
      "email": "somchai.j@yru.ac.th",
      "type": "student",
      "prefix": "นาย",
      "fname": "สมชาย",
      "lname": "ใจดี",
      "faculty": "คณะวิทยาศาสตร์และเทคโนโลยี",
      "program": "วิทยาการคอมพิวเตอร์",
      "academic_year": "2565",
      "student_status": "normal",
      "activity_summary": {
        "passed": 9,
        "total": 12
      },
      "roles": [
        { "name": "student", "display_name": "นักศึกษา" }
      ],
      "permissions": [],
      "acl": ["student"]
    }
  ]
}
```

---

## 4. `GET /api/v1/act/activities` (ดึงรายการกิจกรรมโหมดจัดการ)

### URL
```http
GET https://api831.yru.ac.th/act/api/v1/act/activities?with_trashed=true&paginate=false
```

### วัตถุประสงค์ (Use Case)
ใช้สำหรับดึงรายการกิจกรรมหลักใน **โหมดจัดการของผู้ดูแลระบบ/เจ้าหน้าที่ (Management Mode)** เหมาะสำหรับ:
- หน้าจัดการกิจกรรมหลังบ้าน (`/auth/activities`)
- ตรวจสอบสถานะการอนุมัติกิจกรรม (`approval_status`: รออนุญาต, อนุญาตแล้ว, ไม่อนุญาต)
- ดูจำนวนรอบทั้งหมดของแต่ละกิจกรรม (`schedules_count`)

### ความแตกต่างสำคัญ: Student Mode vs Management Mode
API เส้น `GET /api/v1/act/activities` ถูกออกแบบให้มี 2 โหมดการทำงานอย่างชัดเจน:

| โหมด | เงื่อนไข Query | พฤติกรรมการทำงาน | เหมาะกับ |
|---|---|---|---|
| **Student Mode** *(Default)* | **ไม่ส่ง** `with_trashed` | คืนผลลัพธ์ยึดตาม **รอบกำหนดการ (`act_activity_schedules`)** โดย 1 รายการ = 1 รอบ พร้อมตรวจสอบและกรองตามกลุ่มเป้าหมาย (ชั้นปี, คณะ, หลักสูตร) ของนักศึกษา | หน้ารายการกิจกรรมสำหรับให้นักศึกษากดลงทะเบียน |
| **Management Mode** | **ส่ง** `with_trashed=true` หรือ `1` | คืนผลลัพธ์ยึดตาม **กิจกรรมหลัก (`act_activities`)** โดย 1 รายการ = 1 กิจกรรม ไม่ผ่านตัวกรองกลุ่มเป้าหมาย พร้อมโหลดรอบกำหนดการล่าสุด (`activeSchedule`), ผู้สร้าง (`creator`), ผู้อนุมัติ (`approver`), และจำนวนรอบทั้งหมด (`schedules_count`) | หน้าจัดการกิจกรรมของเจ้าหน้าที่และแอดมิน |

### Query Parameters

| Parameter | Type | Required | คำอธิบาย |
|---|---|---|---|
| `with_trashed` | `boolean` | **สำคัญ** | ระบุ `true` หรือ `1` เพื่อเปิดการทำงานในโหมดจัดการ (Management Mode) |
| `paginate` | `boolean` | ไม่บังคับ | `false` เพื่อดึงข้อมูลทั้งหมดแบบ Streamed JSON |

#### ฟิลเตอร์เสริมใน Management Mode (Optional Filters)
- `approval_status`: สถานะการอนุมัติ (`0` หรือ `PENDING`=รออนุญาต, `1` หรือ `APPROVED`=อนุญาตแล้ว, `2` หรือ `REJECTED`=ไม่อนุญาต)
- `user_id`: กรองตามผู้สร้างกิจกรรม (`created_by`)
- `username`: ค้นหาชื่อหรือ username ของผู้สร้างกิจกรรม
- `faculty`: กรองตามคณะของผู้สร้างกิจกรรม
- `search`: ค้นหาตามชื่อกิจกรรม (`title`)

### ตัวอย่างการเรียก (cURL)
```bash
curl -X GET "https://api831.yru.ac.th/act/api/v1/act/activities?with_trashed=true&paginate=false" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Accept: application/json"
```

### ตัวอย่าง Response (JSON)
```json
{
  "data": [
    {
      "id": 45,
      "title": "กิจกรรมปฐมนิเทศนักศึกษาใหม่ ประจำปีการศึกษา 2568",
      "detail": "กิจกรรมสำหรับนักศึกษาชั้นปีที่ 1...",
      "hashtags": "#ปฐมนิเทศ #ปี68",
      "organizer_name": "กองพัฒนานักศึกษา",
      "organizer_contact": "โทร. 073-299699 ต่อ 1234",
      "approval_status": 1,
      "approval_status_label": "อนุญาต",
      "approved_by": 12,
      "approved_at": "2026-05-20T14:30:00+07:00",
      "created_by": 55,
      "schedules_count": 2,
      "creator": {
        "id": 55,
        "name": "เจ้าหน้าที่ สหกิจและกิจกรรม",
        "username": "act_staff01",
        "faculty": "กองพัฒนานักศึกษา"
      },
      "approver": {
        "id": 12,
        "name": "ผู้อำนวยการกองพัฒนานักศึกษา",
        "username": "director_dev"
      },
      "active_schedule_id": 88,
      "status": 1,
      "status_label": "เปิดรับสมัคร",
      "duration_hours": 6,
      "created_at": "2026-05-15T09:00:00+07:00",
      "updated_at": "2026-05-20T14:30:00+07:00"
    }
  ]
}
```

---

## 5. `GET /api/v1/report/summary/user/{userIdentifier}` (สรุปผลกิจกรรมรายบุคคลตามกรอบ)

### URL
```http
GET https://api831.yru.ac.th/act/api/v1/report/summary/user/119231
```

### วัตถุประสงค์ (Use Case)
ใช้ตรวจสอบสรุปความคืบหน้าการเข้าร่วมกิจกรรมของนักศึกษาเป็นรายบุคคล โดยนำประวัติการเข้าร่วมที่ผ่านการเช็คอิน/เสร็จสิ้นแล้วมาเทียบกับเกณฑ์เงื่อนไขใน **กรอบกิจกรรม (`act_frames`)** ที่นักศึกษาคนนั้นสังกัด เหมาะสำหรับ:
- หน้ารายงานสรุปผลกิจกรรมของนักศึกษา
- หน้าระบบออกใบรับรองกิจกรรมนักศึกษา (Activity Transcript / Certificate)
- อาจารย์ที่ปรึกษาและงานแนะแนวตรวจสอบชั่วโมงกิจกรรม

### การยืนยันตัวตน (Authentication)
- **สิทธิ์:** **Public route (ไม่ต้องส่ง Bearer Token)** เพื่อความยืดหยุ่นในการออกรายงาน/ตรวจสอบจากระบบภายนอก
- *(หมายเหตุ: หากต้องการดูข้อมูลของตนเองที่ล็อกอินอยู่ สามารถใช้เส้น `GET /api/v1/report/summary/me` ซึ่งต้องใช้ Token)*

### Path Parameters

| Parameter | Type | Required | คำอธิบาย |
|---|---|---|---|
| `userIdentifier` | `string` / `integer` | **ต้องระบุ** | สามารถส่งได้ 2 รูปแบบ:<br>1. **User ID:** เช่น `119231`<br>2. **รหัสนักศึกษา / Username:** เช่น `406510024`<br>*ระบบจะ resolve เป็นผู้ใช้ให้อัตโนมัติ* |

### Query Parameters (Optional)

| Parameter | Type | Required | คำอธิบาย |
|---|---|---|---|
| `frame_id` | `integer` | ไม่บังคับ | ระบุรหัสกรอบกิจกรรมที่ต้องการนำมาเทียบเกณฑ์<br>*(หากไม่ระบุ ระบบจะค้นหากรอบกิจกรรมที่ตรงกับกลุ่มเป้าหมายของนักศึกษาคนนั้นให้อัตโนมัติผ่าน `ActFrame::pickForUser`)* |
| `fields` | `string` | ไม่บังคับ | กรองเฉพาะคีย์หลักที่ต้องการใน Response เพื่อลด Payload ขนาดใหญ่ เช่น `fields=user,summary`<br>*(คีย์ที่รองรับ: `user`, `frame`, `summary`, `categories`)* |

### กลไกประสิทธิภาพ (Performance & Caching)
- มีระบบ In-memory/Redis Cache เป็นเวลา **2 นาที** ต่อ `(user_id, frame_id)` เพื่อป้องกันการ query ซ้ำซ้อนเมื่อเปิดดูหลายครั้ง
- ระบบจะกรองการลงทะเบียนเฉพาะกิจกรรมที่มีการเช็คอินจริง (`status IN (4, 5)` และ `checkin_at IS NOT NULL`) และไม่รวมกิจกรรมที่ไม่อนุมัติ (`approval_status = REJECTED`)

### ตัวอย่างการเรียก (cURL)
```bash
# เรียกโดยใช้ User ID
curl -X GET "https://api831.yru.ac.th/act/api/v1/report/summary/user/119231" \
  -H "Accept: application/json"

# หรือเรียกโดยใช้ รหัสนักศึกษา
curl -X GET "https://api831.yru.ac.th/act/api/v1/report/summary/user/406510024" \
  -H "Accept: application/json"
```

### ตัวอย่าง Response (JSON)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 119231,
      "name": "นายสมชาย ใจดี",
      "student_id": "406510024",
      "email": "somchai.j@yru.ac.th",
      "level": "ปริญญาตรี",
      "major": "วิทยาการคอมพิวเตอร์",
      "faculty": "คณะวิทยาศาสตร์และเทคโนโลยี",
      "student_status": "normal"
    },
    "frame": {
      "id": 3,
      "title": "กรอบกิจกรรมพัฒนานักศึกษา ประจำปีการศึกษา 2565-2568",
      "start_date": "2022-06-01",
      "end_date": "2026-05-31",
      "is_restricted": true,
      "target_student_year_prefix": ["65"],
      "target_student_status": null
    },
    "summary": {
      "total_activities": 14,
      "total_hours": 42.5,
      "overall_status": "passed"
    },
    "categories": [
      {
        "category_id": 1,
        "category_name": "กิจกรรมเสริมสร้างคุณธรรม จริยธรรม และค่านิยม",
        "category_description": "กิจกรรมด้านคุณธรรม...",
        "type_id": 1,
        "type_name": "กิจกรรมบังคับ",
        "frame_items": [
          {
            "id": 10,
            "category_id": 1,
            "category_name": "กิจกรรมเสริมสร้างคุณธรรม จริยธรรม และค่านิยม",
            "requirement": {
              "normal_activity_min": 2,
              "normal_hour_min": 6,
              "transfer_activity_min": 1,
              "transfer_hour_min": 3
            },
            "count": 2,
            "total_hours": 6.0,
            "is_passed": true,
            "activities": [
              {
                "id": 45,
                "title": "กิจกรรมปฐมนิเทศนักศึกษาใหม่ ประจำปีการศึกษา 2568",
                "duration_hours": 6.0,
                "attendance_hours": 6.0,
                "checkin_at": "2026-06-20 08:50:12",
                "checkout_at": "2026-06-20 16:05:40",
                "joined_year": "68",
                "occurrence_index": 1,
                "occurrence_total": 1
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## ตารางสรุปเปรียบเทียบทั้ง 5 เส้น

| Endpoint | Method | Auth | Response Type | จุดประสงค์หลัก |
|---|---|---|---|---|
| `/api/v1/act/act-registrations` | `GET` | Public | Streamed JSON (`data: [...]`) | ดึงรายการลงทะเบียนทั้งหมด เรียงตามวันลงทะเบียน |
| `/api/v1/act/activity-schedules` | `GET` | Public | Streamed JSON (`data: [...]`) | ดึงรอบกำหนดการทั้งหมด พร้อมจำนวนผู้สมัครจริง |
| `/api/v1/auth/users` | `GET` | Optional (บังคับ Advisor) | Streamed JSON (`data: [...]`) | รายชื่อนักศึกษาพร้อมสรุปกิจกรรม (`passed`/`total`) |
| `/api/v1/act/activities` | `GET` | Public / Token | Streamed JSON (`data: [...]`) | โหมดจัดการกิจกรรมหลังบ้าน (`with_trashed=true`) |
| `/api/v1/report/summary/user/{id}` | `GET` | Public | JSON Object (`success`, `data`) | สรุปผลกิจกรรมรายคนตามกรอบ (มี cache 2 นาที) |

---

## ข้อแนะนำสำหรับนักพัฒนา Frontend (Angular / Web Client)

1. **การรับข้อมูลแบบ Streamed JSON (`paginate=false`):**
   - รูปแบบ Response จะมี key `data` เป็น array ของข้อมูลเสมอ (`{ data: [...] }`)
   - ไม่ต้องเรียกซ้ำหลายหน้า (pagination) สามารถนำ array ใน `res.data` ไป render หรือ filter ใน memory ของ UI ได้ทันที
2. **การ Sort ข้อมูล:**
   - ใช้คู่ `sort_by` และ `sort_order` เสมอ หลีกเลี่ยงการส่งคำสั่ง SQL order โดยตรง เนื่องจากระบบมีการ whitelist คอลัมน์ที่อนุญาตเพื่อความปลอดภัย
3. **การใช้งานสรุปกิจกรรมในหน้า Users:**
   - เมื่อต้องการแสดงรายชื่อนักศึกษาในตารางที่มีคอลัมน์ "กิจกรรมที่ผ่าน" ให้ส่ง `include_activity_summary=1&type=student` เสมอ เพื่อลดภาระการยิง API N+1 ครั้ง

