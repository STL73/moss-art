// Prices are stored as integers in pence. Intl handles separators and
// always renders two decimal places, so no manual padding is needed.
const gbp = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
});

export const formatPrice = (pence) => gbp.format(pence / 100);
