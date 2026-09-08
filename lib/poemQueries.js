import mongoose from 'mongoose';

/**
 * Builds an aggregation pipeline for a bounded poem list that returns lightweight
 * counts (likeCount/commentCount/annotationCount) instead of the full embedded
 * comments/likes/annotations sub-documents.
 *
 * Those arrays are unbounded (a popular poem can carry hundreds of comments/likes),
 * and the old `.find().populate().lean()` queries shipped them in full for every
 * poem in a page — that's what made a 12-poem feed page balloon to several MB.
 * Computing counts/flags in the aggregation means Mongo never sends the raw
 * arrays over the wire to begin with.
 */
export function buildPoemListPipeline({
  match = {},
  limit = 20,
  currentUserId = null,
  commentsPreviewCount = 0,
  authorProjection = { username: 1, avatar: 1 },
} = {}) {
  const userObjectId = currentUserId && mongoose.isValidObjectId(currentUserId)
    ? new mongoose.Types.ObjectId(String(currentUserId))
    : null;

  const addFields = {
    likeCount: { $size: { $ifNull: ['$likes', []] } },
    commentCount: { $size: { $ifNull: ['$comments', []] } },
    annotationCount: { $size: { $ifNull: ['$annotations', []] } },
    likedByMe: userObjectId
      ? { $in: [userObjectId, { $ifNull: ['$likes.userId', []] }] }
      : false,
    // Which lines have at least one annotation, so the feed card's per-line dot
    // indicators can render instantly without shipping annotation content.
    annotationLines: {
      $setUnion: [
        { $map: { input: { $ifNull: ['$annotations', []] }, as: 'a', in: '$$a.lineIndex' } },
        [],
      ],
    },
  };

  if (commentsPreviewCount > 0) {
    addFields.commentsPreview = { $slice: [{ $ifNull: ['$comments', []] }, commentsPreviewCount] };
  }

  return [
    { $match: match },
    { $sort: { createdAt: -1 } },
    { $limit: limit },
    { $addFields: addFields },
    { $project: { likes: 0, comments: 0, annotations: 0 } },
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author',
        pipeline: [{ $project: authorProjection }],
      },
    },
    { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'coAuthors',
        foreignField: '_id',
        as: 'coAuthors',
        pipeline: [{ $project: { username: 1 } }],
      },
    },
  ];
}

/**
 * A short, cheap-to-compute ETag for a page of poems, derived from the page's
 * newest/oldest ids and update times. Lets clients (and the service worker's
 * runtime cache) revalidate with a 304 instead of re-downloading the page.
 */
export function buildPoemsETag(poems) {
  if (!poems.length) return '"empty"';
  const first = poems[0];
  const last = poems[poems.length - 1];
  const stamp = (poem) => `${poem._id}:${new Date(poem.updatedAt || poem.createdAt).getTime()}`;
  return `"${stamp(first)}-${stamp(last)}-${poems.length}"`;
}
