'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  Eye,
  MessageSquare,
} from 'lucide-react';

interface ArtworkCardProps {
  id: string;
  title: string;
  artistName: string;
  medium: string;
  dimensions: string;
  price: number;
  image: string;
  likes?: number;
  views?: number;
  comments?: number;
  rating?: number;
  showDeleteBadge?: boolean;
  className?: string;
}

export default function ArtworkCard({
  id,
  title,
  artistName,
  medium,
  dimensions,
  price,
  image,
  likes = 0,
  views = 0,
  comments = 0,
  rating = 0,
  showDeleteBadge = false,
  className = '',
}: ArtworkCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [imgError, setImgError] = useState(false);

  const handleLike = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setLiked((previousLiked) => {
      const nextLiked = !previousLiked;

      setLikeCount((currentCount) =>
        nextLiked
          ? currentCount + 1
          : Math.max(0, currentCount - 1)
      );

      return nextLiked;
    });
  };

  const placeholderColors = [
    'bg-rose-100',
    'bg-amber-100',
    'bg-sky-100',
    'bg-emerald-100',
    'bg-violet-100',
    'bg-orange-100',
  ];

  const numericId = Number.parseInt(id, 10);

  const colorClass =
    Number.isNaN(numericId)
      ? 'bg-gray-100'
      : placeholderColors[
          numericId % placeholderColors.length
        ];

  const hasRating =
    typeof rating === 'number' && rating > 0;

  const displayRating = hasRating
    ? Math.min(5, Math.max(0, rating))
    : 0;

  return (
    <Link
      href={`/artwork/${id}`}
      className={`artwork-card block group ${className}`}
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-gray-100">
        {!imgError && image ? (
          <img
            src={image}
            alt={title}
            className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ minHeight: '200px' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className={`w-full flex items-center justify-center ${colorClass}`}
            style={{ minHeight: '220px' }}
          >
            <div className="text-center p-4">
              <div className="text-4xl mb-2">
                🎨
              </div>

              <p className="text-xs text-gray-500 font-medium line-clamp-2">
                {title}
              </p>
            </div>
          </div>
        )}

        {/* Like */}
        <button
          type="button"
          onClick={handleLike}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white shadow-sm"
          aria-label={
            liked ? 'Unlike artwork' : 'Like artwork'
          }
        >
          <Heart
            size={15}
            className={
              liked
                ? 'fill-[#e63329] text-[#e63329]'
                : 'text-gray-600'
            }
          />
        </button>

        {/* Delete Badge */}
        {showDeleteBadge && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute top-3 left-3 w-6 h-6 bg-[#e63329] text-white flex items-center justify-center text-xs font-bold"
            aria-label="Delete artwork"
          >
            ×
          </button>
        )}
      </div>

      {/* Details */}
      <div className="pt-2.5 pb-4">
        <h3
          className="text-[13px] font-semibold text-gray-900 leading-snug overflow-hidden"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {title}
        </h3>

        <p className="text-[11px] text-gray-500 mt-0.5">
          {artistName}
          &nbsp;|&nbsp;
          {medium}
          &nbsp;|&nbsp;
          {dimensions}
        </p>

        {/* Rating */}
        {hasRating ? (
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-2.5 h-2.5 ${
                  star <= Math.round(displayRating)
                    ? 'text-yellow-400'
                    : 'text-gray-200'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}

            <span className="text-[10px] text-gray-400 ml-0.5">
              {displayRating.toFixed(1)}
            </span>
          </div>
        ) : (
          <div className="text-[10px] text-gray-400 mt-1">
            No reviews yet
          </div>
        )}

        {/* Price */}
        <p className="text-[13px] font-bold text-gray-900 mt-1.5">
          ₹{price.toLocaleString('en-IN')}
        </p>

        {/* Engagement */}
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-[10px] text-gray-400">
            <Heart size={10} />
            {likeCount}
          </span>

          <span className="flex items-center gap-1 text-[10px] text-gray-400">
            <Eye size={10} />
            {views}
          </span>

          <span className="flex items-center gap-1 text-[10px] text-gray-400">
            <MessageSquare size={10} />
            {comments}
          </span>
        </div>
      </div>
    </Link>
  );
}