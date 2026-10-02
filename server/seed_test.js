const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('123456', 10);
  const testHash = await bcrypt.hash('211895', 10);
  
  // Create company first
  let company = await prisma.company.findFirst({ where: { cnpj: '00000000000100' } });
  if (!company) {
    company = await prisma.company.create({
      data: { name: 'Empresa Teste', cnpj: '00000000000100', tradeName: 'Empresa Teste' }
    });
  }

  // Create default test user
  let user = await prisma.user.findFirst({ where: { email: 'teste@teste.com' } });
  if (!user) {
    user = await prisma.user.create({
      data: { name: 'Usuário Teste', email: 'teste@teste.com', password: hash, role: 'admin', companyId: company.id }
    });
  }

  // Create requested test user
  let testUser = await prisma.user.findFirst({ where: { email: 'conecta@email.com' } });
  if (!testUser) {
    testUser = await prisma.user.create({
      data: { name: 'Conecta Teste', email: 'conecta@email.com', password: testHash, role: 'admin', companyId: company.id }
    });
    console.log('User conecta@email.com created successfully!');
  } else {
    // Se o usuário já existe, atualiza a senha para garantir
    await prisma.user.update({
      where: { email: 'conecta@email.com' },
      data: { password: testHash }
    });
    console.log('User conecta@email.com updated with correct password!');
  }

  console.log('Seed executed!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
