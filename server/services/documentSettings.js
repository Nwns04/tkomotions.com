import { BusinessSettings } from '../models/BusinessSettings.js';

export async function getDocumentSettings(owner) {
  const settings = await BusinessSettings.findOne({ owner }).select('+logoData +logoContentType +signatureData +signatureContentType');
  if (!settings) return {};

  const documentSettings = settings.toJSON();
  if (settings.logoData && settings.logoContentType) {
    documentSettings.logoUrl = `data:${settings.logoContentType};base64,${settings.logoData.toString('base64')}`;
  }
  if (settings.signatureData && settings.signatureContentType) {
    documentSettings.signatureUrl = `data:${settings.signatureContentType};base64,${settings.signatureData.toString('base64')}`;
  }
  delete documentSettings.logoData;
  delete documentSettings.logoContentType;
  delete documentSettings.signatureData;
  delete documentSettings.signatureContentType;
  return documentSettings;
}