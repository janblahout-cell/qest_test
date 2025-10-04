import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Example: Create a test user
  const testUser = await prisma.user.upsert({
    where: { email: "test@qest.cz" },
    update: {},
    create: {
      email: "test@qest.cz",
      name: "Test User",
      calendarConsent: false,
    },
  })

  console.log("✅ Created test user:", testUser.email)

  // Add more seed data as needed
  console.log("🌱 Seeding completed!")
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
