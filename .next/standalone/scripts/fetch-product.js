const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.product.findUnique({ 
  where: { id: 'cms7y76vq0005uetc6rj8y5z6' },
  include: { variants: true }
})
  .then(p => { 
    console.log(JSON.stringify(p, null, 2)); 
    return prisma.$disconnect(); 
  })
  .catch(e => { 
    console.error('ERROR:', e.message); 
    return prisma.$disconnect(); 
  });
