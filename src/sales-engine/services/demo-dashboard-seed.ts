import { createHash } from 'node:crypto';
import { Types } from 'mongoose';
import { Appointment, FollowUp, Lead } from '../db/models';
import { ensureDemoBusiness } from './demo-business';

export const sampleSource = 'Demo sample';
export const sampleLeads = [
  { key: 'ada', name: 'Ada Okafor', propertyType: '3-bedroom apartment', location: 'Wuse', budget: '₦85,000,000', score: 100, classification: 'HOT', status: 'APPOINTMENT', timeline: 'Within one month', viewing: 'Saturday morning — sample request, awaiting confirmation' },
  { key: 'tunde', name: 'Tunde Bello', propertyType: '4-bedroom duplex', location: 'Gwarinpa', budget: '₦120,000,000', score: 90, classification: 'HOT', status: 'APPOINTMENT', timeline: 'Within two months', viewing: 'Friday afternoon — sample request, awaiting confirmation' },
  { key: 'zainab', name: 'Zainab Musa', propertyType: '4-bedroom terrace', location: 'Jabi', budget: '₦95,000,000', score: 65, classification: 'WARM', status: 'FOLLOW_UP', timeline: 'Within six months', followUp: 'Review the sample Jabi enquiry and discuss buying timeframe.' },
  { key: 'chinedu', name: 'Chinedu Eze', propertyType: '5-bedroom duplex', location: 'Maitama', budget: '₦250,000,000', score: 95, classification: 'HOT', status: 'QUALIFIED', timeline: 'Within one month' },
  { key: 'amaka', name: 'Amaka Nwosu', propertyType: '3-bedroom apartment', location: 'Wuse', budget: '₦80,000,000', score: 55, classification: 'WARM', status: 'FOLLOW_UP', timeline: 'Still planning', followUp: 'Review the sample budget and explain what requires confirmation.' },
  { key: 'david', name: 'David Adeyemi', propertyType: 'General property enquiry', location: 'Abuja', budget: '', score: 20, classification: 'COLD', status: 'NEW', timeline: 'Just exploring' },
] as const;

function sampleId(businessId: string, kind: string, key: string) {
  return new Types.ObjectId(createHash('sha256').update(`tko-dashboard-sample-v1:${businessId}:${kind}:${key}`).digest('hex').slice(0, 24));
}

// Only inserts these fixed sample IDs; existing enquiries and sample edits survive.
export async function seedDemoDashboard(business: { _id: unknown; slug: string; isDemo: boolean }, models = { Lead, Appointment, FollowUp }, now = new Date()) {
  if (business.slug !== 'tko-properties' || !business.isDemo) throw new Error('Sample leads are restricted to the fictional demo business.');
  const businessId = String(business._id);
  for (const sample of sampleLeads) {
    const leadId = sampleId(businessId, 'lead', sample.key);
    const insert = { businessId: business._id, name: sample.name, phone: '', email: '', source: sampleSource, propertyType: sample.propertyType, location: sample.location, budget: sample.budget, interest: `${sample.propertyType} / ${sample.location}`, score: sample.score, classification: sample.classification, status: sample.status, timeline: sample.timeline, intent: 'Buy', inspectionRequested: 'viewing' in sample, requirements: 'Fictional sample enquiry for demonstration only. No real customer, purchase or booking.', isDemo: true, createdAt: now, updatedAt: now };
    await models.Lead.updateOne({ _id: leadId, businessId: business._id }, { $setOnInsert: insert }, { upsert: true, runValidators: true, timestamps: false });
    if ('viewing' in sample) {
      await models.Appointment.updateOne({ _id: sampleId(businessId, 'appointment', sample.key), businessId: business._id }, { $setOnInsert: { businessId: business._id, leadId, customer: `${sample.name} (sample)`, scheduledFor: sample.viewing, status: 'REQUESTED', notes: 'Fictional demonstration request. No inspection is booked.', isDemo: true, createdAt: now, updatedAt: now } }, { upsert: true, runValidators: true, timestamps: false });
    }
    if ('followUp' in sample) {
      await models.FollowUp.updateOne({ _id: sampleId(businessId, 'followup', sample.key), businessId: business._id }, { $setOnInsert: { businessId: business._id, leadId, customer: `${sample.name} (sample)`, scheduledFor: new Date(now.getTime() + 24 * 60 * 60 * 1000), status: 'PENDING', reason: sample.followUp, notes: 'Fictional demonstration task. No message or notification is sent.', isDemo: true, createdAt: now, updatedAt: now } }, { upsert: true, runValidators: true, timestamps: false });
    }
  }
}

let seedPromise: Promise<void> | null = null;
export async function ensureDemoDashboardBusiness() {
  const business = await ensureDemoBusiness();
  if (!seedPromise) seedPromise = seedDemoDashboard(business).catch(error => { seedPromise = null; throw error; });
  await seedPromise;
  return business;
}
