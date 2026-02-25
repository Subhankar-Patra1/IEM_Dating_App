import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import axios from 'axios';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("USERS:", users.map(u => ({ email: u.email, id: u.id, hasPassword: !!u.passwordHash })));
  
  const target = await prisma.user.findUnique({ where: { email: 'devtest@iem.edu.in' } });
  if (target) {
     const isValid = await bcrypt.compare('password123', target.passwordHash);
     console.log('Password valid locally:', isValid);
  } else {
     console.log('User not found in DB!');
  }

  try {
     const res = await axios.post('http://localhost:5000/api/v1/auth/login', {
       email: 'devtest@iem.edu.in',
       password: 'password123'
     });
     console.log("AXIOS LOGIN SUCCESS:", !!res.data.data.accessToken);
  } catch(e: any) {
     console.log("AXIOS LOGIN FALL:", e.response?.data || e.message);
  }
}
main().finally(() => prisma.$disconnect());
