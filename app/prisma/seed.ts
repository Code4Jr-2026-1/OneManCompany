import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()
const hash = (p: string) => bcrypt.hashSync(p, 10)

const defaultLessons = [
  { title: "Tactics: Pin & Skewer", skillLevel: "beginner", topics: "Pin, Skewer, Basic tactics", description: "Understand how to exploit pinned and skewered pieces.", duration: 60 },
  { title: "Tactics: Fork & Discovered Attack", skillLevel: "beginner", topics: "Fork, Knight fork, Discovered attack", description: "Win material using forks and discovered attacks.", duration: 60 },
  { title: "Endgame: King & Pawn vs King", skillLevel: "beginner", topics: "Pawn endgame, Opposition, Key squares", description: "Master the most fundamental endgame.", duration: 45 },
  { title: "Opening Principles", skillLevel: "beginner", topics: "Center control, Development, King safety", description: "The three golden rules of the opening.", duration: 45 },
  { title: "Italian Game Opening", skillLevel: "intermediate", topics: "1.e4 e5 2.Nf3 Nc6 3.Bc4, Giuoco Piano", description: "Solid, classical opening for White.", duration: 60 },
  { title: "Ruy Lopez Overview", skillLevel: "intermediate", topics: "Spanish opening, Berlin defence, Closed Ruy", description: "One of the oldest and most analysed openings.", duration: 60 },
  { title: "Middlegame: Pawn Structure", skillLevel: "intermediate", topics: "Pawn chains, Isolated pawns, Passed pawns", description: "How pawn structure determines your plan.", duration: 75 },
  { title: "Rook Endgames", skillLevel: "intermediate", topics: "Lucena, Philidor, Rook behind passer", description: "Essential rook endgame techniques.", duration: 75 },
  { title: "Positional Chess: Outpost", skillLevel: "advanced", topics: "Knight outpost, Weak squares, Piece coordination", description: "Create and exploit outposts for positional advantage.", duration: 90 },
  { title: "Attack on Castled King", skillLevel: "advanced", topics: "Pawn storm, Piece sacrifice, Mating patterns", description: "Systematic approach to attacking the castled king.", duration: 90 },
]

async function main() {
  const coach = await prisma.user.upsert({
    where: { email: "coach@chess.com" },
    update: {},
    create: { email: "coach@chess.com", name: "Rahul Coach", role: "COACH", password: hash("coach123"), hourlyRate: 500 },
  })

  // Seed default lesson templates
  for (const lesson of defaultLessons) {
    const exists = await prisma.lessonTemplate.findFirst({ where: { coachId: coach.id, title: lesson.title } })
    if (!exists) {
      await prisma.lessonTemplate.create({ data: { ...lesson, coachId: coach.id, isDefault: true } })
    }
  }

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

  const now = new Date()
  const defs = [
    { name: "Arjun Sharma", rating: 1420, skillLevel: "intermediate", goals: "Reach 1600 rating, master endgames", userId: u1.id, parentId: parent.id },
    { name: "Priya Patel",  rating: 980,  skillLevel: "beginner",     goals: "Learn basic tactics and openings",    userId: u2.id },
    { name: "Rohan Mehta",  rating: 1650, skillLevel: "advanced",     goals: "Qualify for state tournament",         userId: u3.id },
    { name: "Sneha Iyer",   rating: 1120, skillLevel: "intermediate", goals: "Consistent tournament results",        userId: u4.id },
  ]

  for (let i = 0; i < defs.length; i++) {
    const sd = defs[i]
    const exists = await prisma.student.findFirst({ where: { userId: sd.userId } })
    if (exists) continue

    const s = await prisma.student.create({ data: { ...sd, coachId: coach.id } })

    await prisma.studentContext.create({
      data: { studentId: s.id, contextSummary: `${sd.name} is a ${sd.skillLevel} player rated ${sd.rating}. Goals: ${sd.goals}. Recurring weaknesses: endgame technique and time management.` },
    })

    await prisma.progressSnapshot.createMany({
      data: [
        { studentId: s.id, month: new Date("2026-04-01"), rating: sd.rating - 60, improvementRate: 8,  sessionCount: 3, topicMastery: JSON.stringify({ tactics: 50, endgame: 30, openings: 45, positional: 35 }) },
        { studentId: s.id, month: new Date("2026-05-01"), rating: sd.rating - 30, improvementRate: 12, sessionCount: 4, topicMastery: JSON.stringify({ tactics: 60, endgame: 40, openings: 55, positional: 45 }) },
        { studentId: s.id, month: new Date("2026-06-01"), rating: sd.rating,      improvementRate: 18, sessionCount: 6, topicMastery: JSON.stringify({ tactics: 70, endgame: 50, openings: 65, positional: 55 }) },
      ],
    })

    // Past session
    await prisma.coachSession.create({
      data: {
        studentId: s.id,
        date: new Date(now.getTime() - (i === 3 ? 8 : 3) * 86400000),
        duration: 60,
        topicsCovered: sd.skillLevel === "beginner" ? "Basic tactics: pin and fork" : "Endgame technique: king and pawn",
        coachNotes: `Good session. ${sd.name} showed improvement in calculation. Needs more endgame practice.`,
        aiSummary: `Session focused on ${sd.skillLevel === "beginner" ? "tactical patterns" : "endgame fundamentals"}. Student engaged well. Next session: continue with ${sd.skillLevel === "beginner" ? "discovered attacks" : "rook endgames"}.`,
        homeworkSet: sd.skillLevel === "beginner" ? "Solve 20 pin tactics on Lichess" : "Study Lucena position — 3 practice games",
        nextSessionDate: new Date(now.getTime() + (7 - i) * 86400000),
      },
    })

    // Homework
    await prisma.homework.create({
      data: {
        studentId: s.id,
        title: sd.skillLevel === "beginner" ? "20 Pin tactics on Lichess" : "Study Lucena position",
        description: sd.skillLevel === "beginner" ? "Complete 20 pin/skewer puzzles on Lichess. Screenshot your score." : "Practice the Lucena position setup in 3 games. Write down what you learned.",
        dueDate: new Date(now.getTime() + (7 - i) * 86400000),
        status: i === 0 ? "DONE" : i === 2 ? "DONE" : "PENDING",
        completedAt: i === 0 || i === 2 ? new Date() : null,
      },
    })

    // Scheduled session
    await prisma.scheduledSession.create({
      data: {
        studentId: s.id,
        scheduledAt: new Date(now.getTime() + (7 - i) * 86400000),
        duration: 60,
        status: "CONFIRMED",
        notes: `Continue from last session — ${sd.skillLevel === "beginner" ? "discovered attacks" : "rook endgames"}`,
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
          { title: "Learn 3 endgame positions", done: i === 2 },
          { title: "Play 10 rated games", done: false },
        ]),
      },
    })

    // Billing
    await prisma.billingEntry.create({
      data: {
        studentId: s.id,
        month: new Date("2026-06-01"),
        sessions: 6,
        hours: 6,
        rateUsed: 500,
        amount: 3000,
        paid: i === 2,
        paidAt: i === 2 ? new Date() : null,
      },
    })
  }

  console.log("\n✅ Seed complete!")
  console.log("  Coach:   coach@chess.com  / coach123")
  console.log("  Student: arjun@chess.com  / student123")
  console.log("  Parent:  parent@chess.com / parent123\n")
}

main().catch(console.error).finally(() => prisma.$disconnect())
