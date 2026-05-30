import { useState } from "react";

interface RatingInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}

export function RatingInput({ value, onChange, disabled }: RatingInputProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const handleRatingClick = (rating: number) => {
    if (disabled) return;
    
    if (value === rating) {
      onChange(null);
    } else {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!disabled) {
      setHoveredRating(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoveredRating(null);
    }
  };

  const displayRating = hoveredRating ?? value;

  return (
    <div className="flex items-center gap-1">
      {[...Array(10)].map((_, index) => {
        const rating = index + 1;
        const isFilled = displayRating !== null && rating <= displayRating;
        
        return (
          <button
            key={rating}
            onClick={() => handleRatingClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            onMouseLeave={handleMouseLeave}
            disabled={disabled}
            className={`
              w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
              transition-all duration-150 cursor-pointer
              ${disabled 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'hover:scale-110'
              }
              ${isFilled 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }
            `}
            aria-label={`Rate ${rating} out of 10`}
            aria-pressed={value === rating}
          >
            <span aria-hidden="true">{rating}</span>
          </button>
        );
      })}
    </div>
  );
}