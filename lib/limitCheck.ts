import { prisma } from '@/lib/prisma';

export async function getEffectiveLimit(userId: string): Promise<number> {
  const expenseLimit = await prisma.expenseLimit.findFirst({
    where: { 
      OR: [
        { masterUserId: userId },
        { targetUserId: userId }
      ]
    },
  });

  const baseLimit = expenseLimit?.limitAmount ? Number(expenseLimit.limitAmount) : 0;

  // 現在の年月を取得
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 0-indexed なので +1

  // 承認済みの上限解放申請を取得
  const activeExemptionRequest = await prisma.limitExemptionRequest.findFirst({
    where: {
      userId,
      status: 'APPROVED',
      year: currentYear,
      month: currentMonth,
    },
    orderBy: { requestedAmount: 'desc' },
  });

  if (activeExemptionRequest) {
    return baseLimit + Number(activeExemptionRequest.requestedAmount);
  }

  return baseLimit;
}

export async function getLimitStatus(userId: string, month: Date) {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      status: 'APPROVED',
      expenseDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const effectiveLimit = await getEffectiveLimit(userId);

  const expenseLimit = await prisma.expenseLimit.findFirst({
    where: { 
      OR: [
        { masterUserId: userId },
        { targetUserId: userId }
      ]
    },
  });
  const baseLimit = expenseLimit?.limitAmount ? Number(expenseLimit.limitAmount) : 0;

  const currentYear = month.getFullYear();
  const currentMonth = month.getMonth() + 1;

  const activeExemption = await prisma.limitExemptionRequest.findFirst({
    where: {
      userId,
      status: 'APPROVED',
      year: currentYear,
      month: currentMonth,
    },
  });

  const remaining = effectiveLimit - totalSpent;
  const usagePercentage = effectiveLimit > 0 ? (totalSpent / effectiveLimit) * 100 : 0;

  // 終了日を計算（年月 + equivalentMonths）
  let endDate: string | undefined;
  if (activeExemption) {
    const endMonth = new Date(activeExemption.year, activeExemption.month - 1 + activeExemption.equivalentMonths, 0);
    endDate = endMonth.toISOString();
  }

  return {
    totalSpent,
    effectiveLimit,
    baseLimit,
    remaining,
    usagePercentage,
    isOverLimit: totalSpent > effectiveLimit,
    hasActiveIncrease: !!activeExemption,
    activeIncreaseAmount: activeExemption ? Number(activeExemption.requestedAmount) : undefined,
    activeIncreaseEndDate: endDate,
  };
}
