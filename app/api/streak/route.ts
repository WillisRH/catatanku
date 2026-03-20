import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getPrevDay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  status: "active" | "at_risk" | "broken";
}

function calculateStreak(noteDates: string[], today: string): StreakResult {
  if (!noteDates.length) {
    return { currentStreak: 0, longestStreak: 0, status: "broken" };
  }

  const unique = [...new Set(noteDates)].sort().reverse();
  const yesterday = getPrevDay(today);

  const hasToday = unique[0] === today;
  const hasYesterday = unique.includes(yesterday);

  let status: "active" | "at_risk" | "broken";
  let startDate: string;

  if (hasToday) {
    startDate = today;
    status = "active";
  } else if (hasYesterday) {
    startDate = yesterday;
    status = "at_risk";
  } else {
    // Broken — still compute longestStreak from history
    let longest = 0;
    let run = 0;
    let expected: string | null = null;
    for (const date of unique) {
      if (expected === null || date === expected) {
        run++;
        expected = getPrevDay(date);
      } else {
        longest = Math.max(longest, run);
        run = 1;
        expected = getPrevDay(date);
      }
    }
    longest = Math.max(longest, run);
    return { currentStreak: 0, longestStreak: longest, status: "broken" };
  }

  // Count current streak backward from startDate
  let currentStreak = 0;
  let expected = startDate;
  for (const date of unique) {
    if (date === expected) {
      currentStreak++;
      expected = getPrevDay(expected);
    } else if (date < expected) {
      break;
    }
  }

  // All-time longest streak scan
  let longest = 0;
  let run = 0;
  let exp2: string | null = null;
  for (const date of unique) {
    if (exp2 === null || date === exp2) {
      run++;
      exp2 = getPrevDay(date);
    } else {
      longest = Math.max(longest, run);
      run = 1;
      exp2 = getPrevDay(date);
    }
  }
  longest = Math.max(longest, run);

  return {
    currentStreak,
    longestStreak: Math.max(longest, currentStreak),
    status,
  };
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const today = searchParams.get("today");

  if (!today || !/^\d{4}-\d{2}-\d{2}$/.test(today)) {
    return NextResponse.json({ error: "Missing or invalid today param" }, { status: 400 });
  }

  const notes = await prisma.note.findMany({
    where: { userId: session.user.id },
    select: { date: true },
  });

  const noteDates = notes.map((n) => n.date);
  const result = calculateStreak(noteDates, today);

  // Fire-and-forget cache update
  prisma.user.update({
    where: { id: session.user.id },
    data: {
      currentStreak: result.currentStreak,
      longestStreak: result.longestStreak,
      lastActiveDate: today,
    },
  }).catch(() => {});

  return NextResponse.json(result);
}
