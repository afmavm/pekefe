import { prisma } from "../src/lib/prisma";

async function main() {
  const categories = await prisma.categoryDetail.findMany();
  console.log("Found categories:", categories.length);

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const newId = `PKF-KAT-${String(i + 1).padStart(3, "0")}`;
    console.log(`Updating ${cat.id} (${cat.name}) -> ${newId}`);

    await prisma.$executeRawUnsafe(
      `UPDATE CategoryDetail SET id = ? WHERE id = ?`,
      newId,
      cat.id
    );
  }

  const updated = await prisma.categoryDetail.findMany();
  console.log("Updated categories in DB:", updated);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
