// RatingStars.tsx client/src/components/common/RatingStars.tsx
// Displays the average rating as 5 stars, with halves, and optionally the number of reviews.

// STEP 32 (part 6): Rating stars

import { MdStar, MdStarBorder, MdStarHalf } from "react-icons/md";

type RatingStarsProps = {
  rating: number;
  count?: number;
  size?: number;
};

const RatingStars = ({ rating, count, size = 16 }: RatingStarsProps) => {
  const clampedRating = Math.max(0, Math.min(5, rating));
  const rounded = Math.round(clampedRating * 2) / 2;

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="flex text-warning"
        role="img"
        aria-label={`Rated ${clampedRating.toFixed(1)} out of 5`}
      >
        {[1, 2, 3, 4, 5].map((star) =>
          rounded >= star ? (
            <MdStar key={star} size={size} aria-hidden="true" />
          ) : rounded >= star - 0.5 ? (
            <MdStarHalf key={star} size={size} aria-hidden="true" />
          ) : (
            <MdStarBorder key={star} size={size} aria-hidden="true" />
          ),
        )}
      </span>
      {count !== undefined && (
        <span className="text-[13px] text-muted">({count})</span>
      )}
    </div>
  );
};

export default RatingStars;
