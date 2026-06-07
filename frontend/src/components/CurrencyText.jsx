import React from 'react';
import { formatCurrency } from '../utils/formatCurrency.js';
export default function CurrencyText({ value }) { return <span className="currency">{formatCurrency(value)}</span>; }
