const SYMBOLS = { USD: "$", EUR: "€", GBP: "£", BDT: "৳", INR: "₹" };

export function currencySymbol(currency) {
    return SYMBOLS[currency] || "$";
}

export function formatCurrency(amount, currency) {
    return `${currencySymbol(currency)}${Number(amount || 0).toFixed(2)}`;
}
