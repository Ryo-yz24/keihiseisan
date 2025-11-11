import { prisma } from "./prisma";

export async function createNotification({
  userId,
  type,
  title,
  message,
  relatedExpenseId,
}: {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedExpenseId?: string;
}) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        relatedExpenseId: relatedExpenseId || null,
      },
    });
  } catch (error) {
    console.error("通知の作成に失敗:", error);
  }
}

// 経費承認時の通知
export async function notifyExpenseApproved(
  expenseId: string,
  userId: string,
  amount: number
) {
  await createNotification({
    userId,
    type: "EXPENSE_APPROVED",
    title: "経費が承認されました",
    message: `¥${amount.toLocaleString()}の経費申請が承認されました。`,
    relatedExpenseId: expenseId,
  });
}

// 経費却下時の通知
export async function notifyExpenseRejected(
  expenseId: string,
  userId: string,
  amount: number,
  reason?: string
) {
  await createNotification({
    userId,
    type: "EXPENSE_REJECTED",
    title: "経費が却下されました",
    message: `¥${amount.toLocaleString()}の経費申請が却下されました。${
      reason ? `理由: ${reason}` : ""
    }`,
    relatedExpenseId: expenseId,
  });
}

// 経費申請時の通知（マスターユーザーへ）
export async function notifyExpenseSubmitted(
  expenseId: string,
  masterUserId: string,
  userName: string,
  amount: number
) {
  await createNotification({
    userId: masterUserId,
    type: "EXPENSE_SUBMITTED",
    title: "新しい経費申請があります",
    message: `${userName}さんから¥${amount.toLocaleString()}の経費申請がありました。`,
    relatedExpenseId: expenseId,
  });
}

// 上限解放承認時の通知
export async function notifyLimitIncreaseApproved(
  userId: string,
  amount: number
) {
  await createNotification({
    userId,
    type: "LIMIT_INCREASE_APPROVED",
    title: "上限解放申請が承認されました",
    message: `¥${amount.toLocaleString()}の上限解放申請が承認されました。`,
  });
}

// 上限解放却下時の通知
export async function notifyLimitIncreaseRejected(
  userId: string,
  amount: number,
  reason?: string
) {
  await createNotification({
    userId,
    type: "LIMIT_INCREASE_REJECTED",
    title: "上限解放申請が却下されました",
    message: `¥${amount.toLocaleString()}の上限解放申請が却下されました。${
      reason ? `理由: ${reason}` : ""
    }`,
  });
}