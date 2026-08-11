const { PrismaClient } = require("../src/generated-client");
const prisma = new PrismaClient();

async function inspectProduct() {
  const p = await prisma.product.findFirst({
    where: { name: { contains: "Cevizli Dut Pestili" } },
    include: { variants: true }
  });

  console.log(JSON.stringify(p, null, 2));
}

inspectProduct()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
