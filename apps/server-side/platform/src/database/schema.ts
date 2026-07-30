import { pgSchema } from 'drizzle-orm/pg-core';

/**
 * Everything that never takes part in a transaction with the game: accounts,
 * identities, entitlements, receipts, push tokens.
 *
 * Declared here because this package owns those tables. The `game` schema is
 * declared by the product, which is what keeps game vocabulary out of Contour 1
 * — see #13.
 */
export const platform = pgSchema('platform');
