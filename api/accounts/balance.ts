import { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../../lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const account = req.query.account;

    if (!account) {
      return res.status(400).json({
        error: "account parameter required"
      });
    }

    const result = await pool.query(
     `
SELECT
COALESCE(SUM(credit),0) - COALESCE(SUM(debit),0) AS balance
FROM ledger_entries
WHERE account_id=$1
`,
[account]

    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "account not found"
      });
    }

    res.json({
      balance: result.rows[0].balance
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "server error"
    });
  }
}