import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "superadmin@studio.local";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Superadmin sudah ada:", email);
    return;
  }

  const password = await bcrypt.hash("ubahsegera123", 10);
  await prisma.user.create({
    data: {
      name: "Super Admin",
      email,
      password,
      role: "SUPERADMIN",
    },
  });

  console.log("Superadmin dibuat:");
  console.log("  email   :", email);
  console.log("  password: ubahsegera123 (segera ganti setelah login)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
