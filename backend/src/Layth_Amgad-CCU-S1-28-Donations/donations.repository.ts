// Layth Amgad — CCU-S1-28 | Donations & Admin Approval Module

import { db } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/database.js';
import { DatabaseError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { Donation, DonationProgress, DonationStatus, SubmitDonationInput } from './donations.types.js';

// matches the postgres snake_case column names exactly
interface DonationRow {
  id: number;
  donor_name: string;
  donor_email: string;
  claimed_amount: string; // postgres NUMERIC comes back as string
  receipt_url: string;
  status: DonationStatus;
  reviewed_by_user_id: number | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// convert a raw postgres row into our clean Donation shape
const mapDonation = (row: DonationRow): Donation => ({
  id: row.id,
  donorName: row.donor_name,
  donorEmail: row.donor_email,
  claimedAmount: Number(row.claimed_amount),
  receiptUrl: row.receipt_url,
  status: row.status,
  reviewedByUserId: row.reviewed_by_user_id,
  reviewedAt: row.reviewed_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const donationsRepository = {
  // insert a new donation with the uploaded receipt path
  async create(input: SubmitDonationInput, receiptUrl: string): Promise<Donation> {
    try {
      const { rows } = await db.query<DonationRow>(
        `INSERT INTO donations (donor_name, donor_email, claimed_amount, receipt_url, status)
         VALUES ($1, $2, $3, $4, 'pending')
         RETURNING *`,
        [input.donorName, input.donorEmail, input.claimedAmount, receiptUrl]
      );
      return mapDonation(rows[0]);
    } catch (err) {
      throw new DatabaseError('Failed to save donation', { cause: String(err) });
    }
  },

  // admin dashboard — grab everything that still needs reviewing
  async findAllPending(): Promise<Donation[]> {
    try {
      const { rows } = await db.query<DonationRow>(
        `SELECT * FROM donations WHERE status = 'pending' ORDER BY created_at ASC`
      );
      return rows.map(mapDonation);
    } catch (err) {
      throw new DatabaseError('Failed to fetch pending donations', { cause: String(err) });
    }
  },

  // look up a single donation — used before approving/rejecting
  async findById(id: number): Promise<Donation | null> {
    try {
      const { rows } = await db.query<DonationRow>(
        `SELECT * FROM donations WHERE id = $1 LIMIT 1`,
        [id]
      );
      return rows.length > 0 ? mapDonation(rows[0]) : null;
    } catch (err) {
      throw new DatabaseError('Failed to fetch donation', { cause: String(err) });
    }
  },

  // flip the status and record which admin reviewed it
  async updateStatus(id: number, status: 'verified' | 'rejected', reviewedByUserId: number): Promise<Donation> {
    try {
      const { rows } = await db.query<DonationRow>(
        `UPDATE donations
         SET status = $1, reviewed_by_user_id = $2, reviewed_at = NOW(), updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [status, reviewedByUserId, id]
      );
      return mapDonation(rows[0]);
    } catch (err) {
      throw new DatabaseError('Failed to update donation status', { cause: String(err) });
    }
  },

  // sum up all verified donations — this powers the public progress bar
  async getVerifiedTotal(): Promise<DonationProgress> {
    try {
      const { rows } = await db.query<{ total: string }>(
        `SELECT COALESCE(SUM(claimed_amount), 0)::text AS total FROM donations WHERE status = 'verified'`
      );
      const totalVerified = Number(rows[0]?.total ?? 0);
      // RM 10,000 fundraising goal — adjust this if the target changes
      const goal = 10_000;
      const percentage = Math.min(100, Math.round((totalVerified / goal) * 100));
      return { totalVerified, goal, percentage };
    } catch (err) {
      throw new DatabaseError('Failed to calculate donation progress', { cause: String(err) });
    }
  }
};
