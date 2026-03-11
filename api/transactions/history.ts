import { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../../lib/db";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {

  try {

    const account = req.query.account;

    if (!account) {

      return res.status(400).json({
        error: "account required"
      });

    }

    const result = await pool.query(
      `
      SELECT
      t.id,
      t.type,
      t.amount,
      t.status,
      t.reference,
      t.created_at
      FROM transactions t
      JOIN ledger_entries l
      ON t.id = l.transaction_id
      WHERE l.account_id = $1
      ORDER BY t.created_at DESC
      LIMIT 50
      `,
      [account]
    );

    res.json(result.rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "server error"
    });

  }
}