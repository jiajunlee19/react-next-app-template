// This file contains placeholder data that you'll used for dev only, you can seed this into database using "npm run seed"

import bcrypt from 'bcryptjs';

export const users = [
  {
    user_uid: '1493ac72-2669-5f17-a7c2-b78dca0f0344',
    username: 'jiajunlee',
    password: await bcrypt.hash('12345678', 10),
    role: 'boss',
    user_created_dt: new Date(),
    user_updated_dt: new Date()
  }
]