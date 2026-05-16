// Layth Amgad — CCU-S1-28 | Donations & Admin Approval Module

import { z } from 'zod';

// donor submits this when uploading a receipt
export const submitDonationSchema = z.object({
  donorName: z.string().min(2).max(120).trim(),
  donorEmail: z.string().email().max(160).trim().toLowerCase(),
  // claimed amount in MYR — at least RM 1, cap at RM 1 million to block silly inputs
  claimedAmount: z.coerce.number().positive().min(1).max(1_000_000)
});

// admin sends this to approve or reject
export const reviewDonationSchema = z.object({
  status: z.enum(['verified', 'rejected'])
});

// route param — must be a positive integer
export const donationIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});
