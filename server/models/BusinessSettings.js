import mongoose from 'mongoose';
import { publicJson } from './modelOptions.js';

const settingsSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, select: false },
    businessName: { type: String, trim: true, maxlength: 160, default: 'TKO Motions' },
    logoUrl: { type: String, trim: true, maxlength: 2000, default: '' },
    logoData: { type: Buffer, select: false },
    logoContentType: { type: String, enum: ['image/png', 'image/jpeg', 'image/webp'], select: false },
    ceoName: { type: String, trim: true, maxlength: 160, default: '' },
    ceoTitle: { type: String, trim: true, maxlength: 100, default: 'CEO' },
    signatureUrl: { type: String, trim: true, maxlength: 2000, default: '' },
    signatureData: { type: Buffer, select: false },
    signatureContentType: { type: String, enum: ['image/png', 'image/jpeg', 'image/webp'], select: false },
    email: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
    phone: { type: String, trim: true, maxlength: 40, default: '' },
    address: { type: String, trim: true, maxlength: 1000, default: '' },
    website: { type: String, trim: true, maxlength: 500, default: 'https://tkomotions.com' },
    defaultCurrency: { type: String, enum: ['NGN', 'USD', 'GBP'], default: 'NGN' },
    bankAccounts: {
      type: [{
        _id: false,
        currency: { type: String, enum: ['NGN', 'USD', 'GBP'], required: true },
        bankName: { type: String, trim: true, maxlength: 160, default: '' },
        accountName: { type: String, trim: true, maxlength: 160, default: '' },
        accountNumber: { type: String, trim: true, maxlength: 80, default: '' },
        ibanSwift: { type: String, trim: true, maxlength: 160, default: '' },
      }],
      default: [],
    },
    bankName: { type: String, trim: true, maxlength: 160, default: '' },
    accountName: { type: String, trim: true, maxlength: 160, default: '' },
    accountNumber: { type: String, trim: true, maxlength: 80, default: '' },
    ibanSwift: { type: String, trim: true, maxlength: 160, default: '' },
    paymentInstructions: { type: String, trim: true, maxlength: 5000, default: '' },
    defaultTerms: { type: String, trim: true, maxlength: 5000, default: 'Payment is due by the date shown above.' },
    defaultTaxRate: { type: Number, min: 0, max: 100, default: 0 },
  },
  { timestamps: true, toJSON: publicJson },
);

export const BusinessSettings = mongoose.model('BusinessSettings', settingsSchema);
