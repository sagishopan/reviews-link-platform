// Sentiment is derived deterministically from the star rating at save time.
function sentimentFromRating(rating) {
  if (rating <= 2) return 'negative';
  if (rating === 3) return 'neutral';
  return 'positive';
}

module.exports = { sentimentFromRating };
