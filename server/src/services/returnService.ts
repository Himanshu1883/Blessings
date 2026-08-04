import { Return, toPublicReturn } from "../models/Return.js";
import type { ReturnStatus } from "../models/Return.js";
import { AppError } from "../utils/apiResponse.js";

export async function listReturns() {
  const returns = await Return.find().sort({ createdAt: -1 });
  return returns.map(toPublicReturn);
}

export async function updateReturnStatus(id: string, status: ReturnStatus, note?: string) {
  const ret = await Return.findById(id);
  if (!ret) throw new AppError(404, "Return not found");
  ret.status = status;
  ret.statusHistory.push({ status, note, at: new Date() });
  await ret.save();
  return toPublicReturn(ret);
}

export async function createReturn(data: {
  orderId: string;
  userId: string;
  orderNumber: string;
  customerName: string;
  productName: string;
  reason: string;
}) {
  const ret = await Return.create({
    ...data,
    status: "pending",
    statusHistory: [{ status: "pending", at: new Date() }],
  });
  return toPublicReturn(ret);
}
