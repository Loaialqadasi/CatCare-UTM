// Layth Amgad — CCU-S1-28 | Donations & Admin Approval Module

import { ConflictError, NotFoundError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { donationsRepository } from './donations.repository.js';
import { Donation, DonationProgress, SubmitDonationInput } from './donations.types.js';

export const donationsService = {
  // donor uploads a receipt — file path comes from multer after it's saved to disk
  async submitDonation(input: SubmitDonationInput, receiptUrl: string): Promise<Donation> {
    return donationsRepository.create(input, receiptUrl);
  },

  // pull every pending donation for the admin dashboard
  async getPendingDonations(): Promise<Donation[]> {
    return donationsRepository.findAllPending();
  },

  // admin approves or rejects — make sure the record actually exists first
  async reviewDonation(
    donationId: number,
    status: 'verified' | 'rejected',
    adminUserId: number
  ): Promise<Donation> {
    const existing = await donationsRepository.findById(donationId);
    if (!existing) {
      throw new NotFoundError('Donation not found');
    }

    // don't let admins re-review something that's already been decided
    if (existing.status !== 'pending') {
      throw new ConflictError('Donation has already been reviewed', { currentStatus: existing.status });
    }

    return donationsRepository.updateStatus(donationId, status, adminUserId);
  },

  // returns the live progress bar data for the public fundraising page
  async getDonationProgress(): Promise<DonationProgress> {
    return donationsRepository.getVerifiedTotal();
  }
};
