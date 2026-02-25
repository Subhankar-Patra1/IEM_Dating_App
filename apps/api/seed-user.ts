import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'subhankar.patra2024@iem.edu.in';
  
  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  
  if (existingUser) {
    console.log('User already exists. Updating password to "subhankar"...');
    const hash = await bcrypt.hash('subhankar', 10);
    await prisma.user.update({
      where: { email },
      data: { passwordHash: hash }
    });
    console.log('Password updated successfully!');
  } else {
    console.log('Creating new user...');
    const hash = await bcrypt.hash('subhankar', 10);
    await prisma.user.create({
      data: { 
        email, 
        passwordHash: hash, 
        name: 'Subhankar Patra', 
        department: 'CSE', 
        year: 2024, 
        isVerified: true 
      }
    });
    console.log('User created successfully!');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
