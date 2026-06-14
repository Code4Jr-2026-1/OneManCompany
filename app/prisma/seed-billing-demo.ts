import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const coach = await prisma.user.findUnique({ where: { email: "coach@chess.com" } })
  if (!coach) throw new Error("Run `npm run db:seed` first to create the coach and students.")

  const arjun = await prisma.student.findFirst({ where: { name: "Arjun Sharma", coachId: coach.id } })
  const priya = await prisma.student.findFirst({ where: { name: "Priya Patel", coachId: coach.id } })
  if (!arjun || !priya) throw new Error("Run `npm run db:seed` first to create the coach and students.")

  const now = new Date()
  const monthStart = (offset: number) => new Date(now.getFullYear(), now.getMonth() - offset, 1)

  // ---- Session history: extra past coach sessions for Arjun across last 4 months ----
  const sessionTopics = [
    { topicsCovered: "Italian Game opening repertoire", coachNotes: "Played through main lines, good recall of theory.", aiSummary: "Strong grasp of opening principles. Focus next on middlegame plans.", homeworkSet: "Review 5 Italian Game master games" },
    { topicsCovered: "Rook endgames: Lucena position", coachNotes: "Needs more practice converting winning rook endgames.", aiSummary: "Lucena technique improving but still slow. Practice timing.", homeworkSet: "Practice Lucena position — 5 games vs engine" },
    { topicsCovered: "Tactics: pins, forks, discovered attacks", coachNotes: "Solved puzzles quickly, good pattern recognition.", aiSummary: "Tactical vision much sharper this month.", homeworkSet: "Solve 30 tactics puzzles on Lichess" },
    { topicsCovered: "Pawn structure & isolated pawns", coachNotes: "Discussed plans for both sides with an isolated d-pawn.", aiSummary: "Understands the trade-offs of an isolated pawn structure now.", homeworkSet: "Annotate one of your own games focusing on pawn structure" },
    { topicsCovered: "King safety and castling timing", coachNotes: "Reviewed games where castling was delayed too long.", aiSummary: "Castling timing improving — fewer king safety issues in recent games.", homeworkSet: "Play 3 games focusing on early king safety" },
    { topicsCovered: "Knight outposts and weak squares", coachNotes: "Identified outpost opportunities in recent games.", aiSummary: "Good progress recognizing outpost squares for knights.", homeworkSet: "Find 3 outpost examples from your recent games" },
    { topicsCovered: "Calculation training: forcing moves", coachNotes: "Worked on checks, captures, threats ordering.", aiSummary: "Calculation depth increasing — now checking 3 moves ahead consistently.", homeworkSet: "Solve 15 calculation puzzles (3-move depth)" },
    { topicsCovered: "Endgame: opposition and key squares", coachNotes: "Drilled king and pawn endgames with opposition.", aiSummary: "Opposition concept is solid now. Move on to more complex endgames.", homeworkSet: "Study 2 key-square endgame positions" },
  ]

  for (let i = 0; i < sessionTopics.length; i++) {
    const daysAgo = 10 + i * 12 // spread across ~4 months
    await prisma.coachSession.create({
      data: {
        studentId: arjun.id,
        date: new Date(now.getTime() - daysAgo * 86400000),
        duration: i % 3 === 0 ? 90 : 60,
        ...sessionTopics[i],
      },
    })
  }

  // ---- Payment history: private billing entries for last 4 months for Arjun ----
  const privateBilling = [
    { offset: 3, sessions: 4, hours: 4, amount: 2000, paid: true },
    { offset: 2, sessions: 5, hours: 5, amount: 2500, paid: true },
    { offset: 1, sessions: 6, hours: 6.5, amount: 3250, paid: true },
    { offset: 0, sessions: 3, hours: 3, amount: 1500, paid: false },
  ]

  for (const b of privateBilling) {
    const month = monthStart(b.offset)
    const exists = await prisma.billingEntry.findFirst({ where: { studentId: arjun.id, groupClassId: null, month } })
    if (exists) continue
    await prisma.billingEntry.create({
      data: {
        studentId: arjun.id,
        month,
        sessions: b.sessions,
        hours: b.hours,
        rateUsed: 500,
        amount: b.amount,
        paid: b.paid,
        paidAt: b.paid ? new Date(month.getTime() + 5 * 86400000) : null,
      },
    })
  }

  // ---- Group class with enrollments + group billing history ----
  let groupClass = await prisma.groupClass.findFirst({ where: { coachId: coach.id, name: "Saturday Tactics Group" } })
  if (!groupClass) {
    groupClass = await prisma.groupClass.create({
      data: {
        coachId: coach.id,
        name: "Saturday Tactics Group",
        description: "Weekly group session focused on tactical patterns and calculation.",
        skillLevel: "all",
        capacity: 10,
        dayOfWeek: 6,
        startTime: "10:00",
        duration: 60,
        groupRate: 300,
        isActive: true,
      },
    })
  }

  for (const student of [arjun, priya]) {
    await prisma.groupEnrollment.upsert({
      where: { groupClassId_studentId: { groupClassId: groupClass.id, studentId: student.id } },
      update: {},
      create: { groupClassId: groupClass.id, studentId: student.id, status: "ACTIVE" },
    })
  }

  // Group sessions for the last 2 months (4 sessions/month)
  for (let offset = 1; offset >= 0; offset--) {
    const m = monthStart(offset)
    for (let w = 0; w < 4; w++) {
      const date = new Date(m.getFullYear(), m.getMonth(), 1 + w * 7)
      const exists = await prisma.groupSession.findFirst({ where: { groupClassId: groupClass.id, date } })
      if (!exists) {
        await prisma.groupSession.create({
          data: { groupClassId: groupClass.id, date, topicsCovered: "Tactics drill: pins, forks, skewers" },
        })
      }
    }

    // Group billing entries per enrolled student for that month
    for (const student of [arjun, priya]) {
      const exists = await prisma.billingEntry.findFirst({ where: { studentId: student.id, groupClassId: groupClass.id, month: m } })
      if (exists) continue
      await prisma.billingEntry.create({
        data: {
          studentId: student.id,
          groupClassId: groupClass.id,
          month: m,
          sessions: 4,
          hours: 4,
          rateUsed: 300,
          amount: 4 * 300,
          paid: offset === 1, // last month paid, this month pending
          paidAt: offset === 1 ? new Date(m.getTime() + 10 * 86400000) : null,
        },
      })
    }
  }

  console.log("\n✅ Billing demo data seeded for Arjun Sharma & Priya Patel")
  console.log("  - 8 additional coach sessions for Arjun (monthly attendance history)")
  console.log("  - 4 months of private billing entries for Arjun (3 paid, 1 pending)")
  console.log("  - Group class 'Saturday Tactics Group' with Arjun + Priya enrolled")
  console.log("  - 2 months of group billing entries (1 paid, 1 pending)\n")
}

main().catch(console.error).finally(() => prisma.$disconnect())
