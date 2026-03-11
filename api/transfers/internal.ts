import { VercelRequest, VercelResponse } from "@vercel/node";
import { postTransaction, getAccountBalance } from "../../lib/ledger";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const { fromAccount, toAccount, amount } = req.body;

    if (!fromAccount || !toAccount || !amount) {
      return res.status(400).json({
        error: "missing parameters"
      });
    }

    const balance = await getAccountBalance(fromAccount);

    if (balance < amount) {

      return res.status(400).json({
        error: "insufficient funds"
      });

    }

    const txId = await postTransaction(
      fromAccount,
      toAccount,
      amount
    );

    res.json({
      status: "success",
      transactionId: txId
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "transfer failed"
    });

  }
}