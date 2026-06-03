import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()
const hash = (p: string) => bcrypt.hashSync(p, 10)

async function main() {
  const coach = await prisma.user.upsert({
    where: { email: "coach@chess.com" },
    update: {},
    create: { email: "coach@chess.com", name: "Rahul Coach", role: "COACH", password: hash("coach123") },
  })

  const [u1, u2, u3, u4] = await Promise.all([
    prisma.user.upsert({ where: { email: "arjun@chess.com" }, update: {}, create: { email: "arjun@chess.com", name: "Arjun Sharma", role: "STUDENT", password: hash("student123") } }),
    prisma.user.upsert({ where: { email: "priya@chess.com" }, update: {}, create: { email: "priya@chess.com", name: "Priya Patel", role: "STUDENT", password: hash("student123") } }),
    prisma.user.upsert({ where: { email: "rohan@chess.com" }, update: {}, create: { email: "rohan@chess.com", name: "Rohan Mehta", role: "STUDENT", password: hash("student123") } }),
    prisma.user.upsert({ where: { email: "sneha@chess.com" }, update: {}, create: { email: "sneha@chess.com", name: "Sneha Iyer", role: "STUDENT", password: hash("student123") } }),
  ])

  const parent = await prisma.user.upsert({
    where: { email: "parent@chess.com" },
    update: {},
    create: { email: "parent@chess.com", name: "Ramesh Sharma", role: "PARENT", password: hash("parent123") },
  })

  const defs = [
    { name: "Arjun Sharma", rating: 1420, skillLevel: "intermediate", goals: "Reach 1600 rating, improve endgame", userId: u1.id, parentId: parent.id },
    { name: "Priya Patel",  rating: 980,  skillLevel: "beginner",     goals: "Learn basic tactics and openings",     userId: u2.id },
    { name: "Rohan Mehta",  rating: 1650, skillLevel: "advanced",     goals: "Qualify for state tournament",          userId: u3.id },
    { name: "Sneha Iyer",   rating: 1120, skillLevel: "intermediate", goals: "Consistent tournament performance",     userId: u4.id },
  ]

  for (const sd of defs) {
    const exists = await prisma.student.findFirst({ where: { userId: sd.userId } })
    if (exists) continue
    const s = await prisma.student.create({ data: { ...sd, coachId: coach.id } })

    await prisma.studentContext.create({ data: { studentId: s.id, contextSummary: `${sd.name} is a ${sd.skillLevel} player rated ${sd.rating}. Goals: ${sd.goals}. Needs endgame work.` } })

    await prisma.progressSnapshot.createMany({
      data: [
        { studentId: s.id, month: new Date("2026-04-01"), rating: sd.rating - 60, improvementRate: 8,  sessionCount: 3, topicMastery: JSON.stringify({ tactics: 50, endgame: 30, openings: 45, positional: 35 }) },
        { studentId: s.id, month: new Date("2026-05-01"), rating: sd.rating - 30, improvementRate: 12, sessionCount: 4, topicMastery: JSON.stringify({ tactics: 60, endgame: 40, openings: 55, positional: 45 }) },
        { studentId: s.id, month: new Date("2026-06-01"), rating: sd.rating,      improvementRate: 18, sessionCount: 6, topicMastery: JSON.stringify({ tactics: 70, endgame: 50, openings: 65, positional: 55 }) },
      ],
    })

    await prisma.coachSession.create({
      data: {
        studentId: s.id,
        coachNotes: `Good session. Focused on ${sd.skillLevel === "beginner" ? "basic tactics" : "middlegame strategy"}.`,
        aiSummary: `Improvement in tactical vision. Key area: ${sd.skillLevel === "beginner" ? "basic checkmate patterns" : "endgame technique"}.`,
      },
    })

    await prisma.improvementPlan.create({
      data: {
        studentId: s.id,
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-08-31"),
        topics: JSON.stringify(["Tactics: Pin and Skewer", "Endgame: King and Pawn", "Opening: Italian Game"]),
        milestones: JSON.stringify([
          { title: "Complete 50 tactics puzzles", done: true },
          { title: "Learn 3 endgame positions", done: false },
          { title: "Play 10 rated games", done: false },
        ]),
      },
    })
  }

  console.log("\n✅ Seed complete!")
  console.log("  Coach:   coach@chess.com  / coach123")
  console.log("  Student: arjun@chess.com  / student123")
  console.log("  Parent:  parent@chess.com / parent123\n")
}

main().catch(console.error).finally(() => prisma.$disconnect())
