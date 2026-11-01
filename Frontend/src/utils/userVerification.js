/**
 * Determines whether a user has earned Verified Standing on SkillSwap.
 *
 * Basis for Verification:
 * 1. Explicitly flagged as `isVerified` (via completed swap milestone or admin check).
 * 2. Has completed at least 1 swap milestone and received verified peer reviews (totalRatings > 0).
 * 3. Has completed verified exchanges that increased their credit balance beyond initial signup (credits > 3).
 */
export const isUserVerified = (user) => {
  if (!user) return false;
  if (user.isVerified === true) return true;
  if (typeof user.totalRatings === 'number' && user.totalRatings > 0) return true;
  if (Array.isArray(user.ratings) && user.ratings.length > 0) return true;
  if (typeof user.credits === 'number' && user.credits > 3) return true;
  return false;
};

/**
 * Returns human-readable standing label based on exchange achievements.
 */
export const getVerificationLabel = (user) => {
  if (!isUserVerified(user)) return 'Community Member';
  if (user?.totalRatings && user.totalRatings >= 20) return 'Master Mentor';
  if (user?.totalRatings && user.totalRatings > 0) return 'Verified Partner';
  return 'Verified Member';
};
