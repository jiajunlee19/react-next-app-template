// This file contains placeholder data that you'll used for dev only, it will then be replacing with data.js in prod.

import { hash } from "bcrypt";

const user = [
  {
    user_uid: 'e0f88bf1-deff-404d-8d83-0956dcee8c98',
    email: 'jiajunlee@email.com',
    password: await hash('12345678', 10),
    role: 'boss',
    user_createdAt: new Date(),
    user_updatedAt: new Date()
  }
]

const shipdoc = [
  {
    shipdoc_uid: '3e6e459a-f89d-4754-925d-4b90e831ddfc',
    shipdoc_number: '1723456',
    shipdoc_contact: 'JIAJUNLEE',
    shipdoc_createdAt: new Date(),
    shipdoc_updatedAt: new Date()
  }
]

const box_type = [
  {
    box_type_uid: '4a7e6e73-55f9-4bd8-a73c-f6eebe94fe69',
    box_part_number: '503-500168',
    box_max_tray: 5,
    box_type_createdAt: new Date(),
    box_type_updatedAt: new Date(),
  }
]

const tray_type = [
  {
    tray_type_uid: '6f760732-bd3e-43a1-a549-7a962d7e54af',
    tray_part_number: '503-500187',
    tray_max_drive: 36,
    tray_type_createdAt: new Date(),
    tray_type_updatedAt: new Date(),
  }
]

const box = [
  {
    box_uid: '192e9679-c737-40ce-a38a-55ed00e80af4',
    box_type_uid: '4a7e6e73-55f9-4bd8-a73c-f6eebe94fe69',
    shipdoc_uid: '3e6e459a-f89d-4754-925d-4b90e831ddfc',
    box_status: 'active',
    box_createdAt: new Date(),
    box_updatedAt: new Date(),
  }
]

const tray = [
  {
    tray_uid: 'f13f07ae-4880-4994-a9f7-0c527d6e455c',
    box_uid: '192e9679-c737-40ce-a38a-55ed00e80af4',
    tray_type_uid: '6f760732-bd3e-43a1-a549-7a962d7e54af',
    tray_createdAt: new Date(),
    tray_updatedAt: new Date(),
  }
]

const lot = [
  {
    lot_uid: '493eea20-f424-4a09-9ebc-f1d0a8e37fa7',
    tray_uid: 'f13f07ae-4880-4994-a9f7-0c527d6e455c',
    lot_id: 'JAAABCD001',
    lot_qty: '36',
    lot_createdAt: new Date(),
    lot_updatedAt: new Date(),
  }
]
