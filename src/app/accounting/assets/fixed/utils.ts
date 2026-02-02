// Client-side utility for depreciation calculation
// This is NOT a server action

export interface FixedAsset {
  id: string;
  user_id: string;
  group_id: string | null;
  name: string;
  purchase_date: string;
  purchase_price: number;
  useful_life_years: number;
  residual_value: number;
  memo: string | null;
  created_at: string;
}

/**
 * Calculate depreciation for a fixed asset using straight-line method (定額況E
 */
export function calculateDepreciation(asset: FixedAsset): {
  annualDepreciation: number;
  accumulatedDepreciation: number;
  bookValue: number;
  yearsUsed: number;
  yearsRemaining: number;
  depreciationComplete: boolean;
} {
  const now = new Date();
  const purchaseDate = new Date(asset.purchase_date);
  
  // Calculate years used (from purchase to now)
  const yearsUsed = Math.floor((now.getTime() - purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  
  // Annual depreciation = (Purchase Price - Residual Value) / Useful Life Years
  const annualDepreciation = Math.floor((asset.purchase_price - asset.residual_value) / asset.useful_life_years);
  
  // Accumulated depreciation (capped at max)
  const maxDepreciation = asset.purchase_price - asset.residual_value;
  const accumulatedDepreciation = Math.min(yearsUsed * annualDepreciation, maxDepreciation);
  
  // Book value
  const bookValue = asset.purchase_price - accumulatedDepreciation;
  
  // Years remaining
  const yearsRemaining = Math.max(0, asset.useful_life_years - yearsUsed);
  
  return {
    annualDepreciation,
    accumulatedDepreciation,
    bookValue,
    yearsUsed,
    yearsRemaining,
    depreciationComplete: yearsRemaining === 0,
  };
}
