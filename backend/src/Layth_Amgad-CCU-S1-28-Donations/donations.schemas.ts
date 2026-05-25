import { z } from 'zod';

export const donationStatusEnum = z.enum(['pending', 'reviewed', 'approved', 'rejected']);
export const updateableDonationStatusEnum = z.enum(['reviewed', 'approved', 'rejected']);

export const createDonationSchema = z.object({
  donorName: z.string().min(2).max(120).trim(),
  donorEmail: z.string().email().max(160).trim(),
  // MED-7 Fix: Stricter amount validation
  amount: z.coerce.number()
    .positive('Amount must be greater than 0')
    .max(1_000_000, 'Amount cannot exceed RM 1,000,000')
    .multipleOf(0.01, 'Amount must have at most 2 decimal places'),
  note: z.string().max(500).optional().nullable(),
  // CRIT-5 Fix: Receipt URL must be HTTPS only to prevent SSRF
  receiptUrl: z.string()
    .url('Receipt URL must be a valid URL')
    .max(500)
    .refine(url => url.startsWith('https://'), {
      message: 'Only HTTPS receipt URLs are allowed'
    })
    .optional()
    .nullable()
});

export const updateDonationStatusSchema = z
  .object({
    status: updateableDonationStatusEnum,
    rejectionReason: z.string().min(3).max(500).optional().nullable()
  })
  .refine(
    (data) => {
      if (data.status === 'rejected') {
        return typeof data.rejectionReason === 'string' && data.rejectionReason.trim().length > 0;
      }
      return true;
    },
    {
      message: 'rejectionReason is required when status is rejected',
      path: ['rejectionReason']
    }
  );

export const listDonationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  status: donationStatusEnum.optional(),
  cursor: z.string().min(1).max(100).optional()
});

export const donationIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});
