const emptyAccount = (currency) => ({
  currency,
  bankName: '',
  accountName: '',
  accountNumber: '',
  ibanSwift: '',
});

export function bankAccountForCurrency(settings, currency) {
  const configured = settings?.bankAccounts?.find((account) => account.currency === currency);
  if (configured) return { ...configured.toObject?.() ?? configured, currency };

  if (currency === 'NGN' && settings?.bankName) {
    return {
      currency,
      bankName: settings.bankName,
      accountName: settings.accountName || '',
      accountNumber: settings.accountNumber || '',
      ibanSwift: settings.ibanSwift || '',
    };
  }

  return emptyAccount(currency);
}