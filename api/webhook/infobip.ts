import { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../../lib/db";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {

    const message = req.body.text;
    const account = req.body.account; // account number from chatbot

    if (message === "balance") {

      const result = await pool.query(
        `
        SELECT
        COALESCE(SUM(credit),0) - COALESCE(SUM(debit),0) AS balance
        FROM ledger_entries
        WHERE account_id = $1
        `,
        [account]
      );

      const balance = result.rows[0]?.balance ?? 0;

      res.json({
        reply: `Your balance is ₦${balance}`
      });

    } else {

      res.json({
        reply: "Unknown command"
      });

    }

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "server error"
    });

  }
}