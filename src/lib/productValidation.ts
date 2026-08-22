import { Product } from '../types';

/**
 * Checks if a candidate product number (sellerItemCode or product ID/SKU)
 * already exists in the product catalog.
 */
export function checkDuplicateProductNumber(
  candidateNumber: string | undefined | null,
  currentProductId: string | undefined | null,
  productsList: Product[]
): { isDuplicate: boolean; conflictingProduct?: Product } {
  if (!candidateNumber || !candidateNumber.trim()) {
    return { isDuplicate: false };
  }

  const normalizedCandidate = candidateNumber.trim().toLowerCase();

  const conflict = productsList.find(p => {
    // Exclude the product being edited
    if (currentProductId && p.id === currentProductId) {
      return false;
    }

    const existingId = (p.id || '').trim().toLowerCase();
    const existingSellerCode = (p.sellerItemCode || '').trim().toLowerCase();

    return existingId === normalizedCandidate || existingSellerCode === normalizedCandidate;
  });

  return {
    isDuplicate: Boolean(conflict),
    conflictingProduct: conflict
  };
}

/**
 * Checks if a candidate description (English or Arabic craft story)
 * is already used by another product in the catalog.
 */
export function checkDuplicateDescription(
  candidateDescription: string | undefined | null,
  currentProductId: string | undefined | null,
  productsList: Product[]
): { isDuplicate: boolean; conflictingProduct?: Product } {
  if (!candidateDescription || !candidateDescription.trim()) {
    return { isDuplicate: false };
  }

  const cleanCandidate = candidateDescription.trim().toLowerCase().replace(/\s+/g, ' ');

  // Ignore short generic placeholders under 10 characters
  if (cleanCandidate.length < 10) {
    return { isDuplicate: false };
  }

  const conflict = productsList.find(p => {
    // Exclude the product being edited
    if (currentProductId && p.id === currentProductId) {
      return false;
    }

    const existingDesc = (p.description || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const existingCraft = (p.craftStory || '').trim().toLowerCase().replace(/\s+/g, ' ');

    return (
      (existingDesc && existingDesc.length >= 10 && existingDesc === cleanCandidate) ||
      (existingCraft && existingCraft.length >= 10 && existingCraft === cleanCandidate)
    );
  });

  return {
    isDuplicate: Boolean(conflict),
    conflictingProduct: conflict
  };
}
