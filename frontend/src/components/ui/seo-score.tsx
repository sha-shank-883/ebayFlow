import { useMemo } from "react";

interface SEOScoreProps {
  /** The page title to evaluate */
  title: string;
  /** The meta description to evaluate */
  description: string;
  /** The URL slug to evaluate */
  slug: string;
  /** Optional image URL */
  imageUrl?: string;
}

interface ScoreResult {
  score: number;
  issues: { passed: boolean; message: string }[];
}

/**
 * Calculates the title score (0-35 points).
 * Optimal length is 30-60 characters.
 */
function calculateTitleScore(title: string): { score: number; passed: boolean; message: string } {
  const length = title.length;
  if (length === 0) {
    return { score: 0, passed: false, message: "Title is empty" };
  }
  if (length >= 30 && length <= 60) {
    return { score: 35, passed: true, message: `Title length is optimal (${length} chars)` };
  }
  if (length < 30) {
    return { score: 15, passed: false, message: `Title is too short (${length}/30 chars minimum)` };
  }
  return { score: 15, passed: false, message: `Title is too long (${length}/60 chars maximum)` };
}

/**
 * Calculates the description score (0-35 points).
 * Optimal length is 120-160 characters.
 */
function calculateDescriptionScore(description: string): { score: number; passed: boolean; message: string } {
  const length = description.length;
  if (length === 0) {
    return { score: 0, passed: false, message: "Description is empty" };
  }
  if (length >= 120 && length <= 160) {
    return { score: 35, passed: true, message: `Description length is optimal (${length} chars)` };
  }
  if (length < 120) {
    return { score: 15, passed: false, message: `Description is too short (${length}/120 chars minimum)` };
  }
  return { score: 15, passed: false, message: `Description is too long (${length}/160 chars maximum)` };
}

/**
 * Calculates the slug score (0-20 points).
 * Valid slugs contain only lowercase letters, numbers, and hyphens.
 */
function calculateSlugScore(slug: string): { score: number; passed: boolean; message: string } {
  if (!slug || slug.trim().length === 0) {
    return { score: 0, passed: false, message: "Slug is empty" };
  }
  const validSlugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  if (validSlugRegex.test(slug)) {
    return { score: 20, passed: true, message: "Slug format is valid" };
  }
  return { score: 5, passed: false, message: "Slug should use lowercase letters, numbers, and hyphens only" };
}

/**
 * Calculates the image score (0-10 points).
 */
function calculateImageScore(imageUrl?: string): { score: number; passed: boolean; message: string } {
  if (imageUrl && imageUrl.trim().length > 0) {
    return { score: 10, passed: true, message: "Image is set" };
  }
  return { score: 0, passed: false, message: "No image set (recommended for better engagement)" };
}

/**
 * Calculates the overall SEO score and generates a checklist of issues.
 */
function calculateSEOScore(title: string, description: string, slug: string, imageUrl?: string): ScoreResult {
  const titleResult = calculateTitleScore(title);
  const descResult = calculateDescriptionScore(description);
  const slugResult = calculateSlugScore(slug);
  const imageResult = calculateImageScore(imageUrl);

  const score = titleResult.score + descResult.score + slugResult.score + imageResult.score;
  const issues = [
    { passed: titleResult.passed, message: titleResult.message },
    { passed: descResult.passed, message: descResult.message },
    { passed: slugResult.passed, message: slugResult.message },
    { passed: imageResult.passed, message: imageResult.message },
  ];

  return { score, issues };
}

/**
 * Returns the color class based on the SEO score.
 */
function getScoreColor(score: number): string {
  if (score <= 40) return "text-red-500";
  if (score <= 70) return "text-yellow-500";
  return "text-green-500";
}

/**
 * Returns the stroke color for the circular progress indicator.
 */
function getStrokeColor(score: number): string {
  if (score <= 40) return "#ef4444";
  if (score <= 70) return "#eab308";
  return "#22c55e";
}

/**
 * Returns the label based on the SEO score.
 */
function getScoreLabel(score: number): string {
  if (score <= 40) return "Poor";
  if (score <= 70) return "Needs Improvement";
  return "Good";
}

/**
 * SEO Score indicator component.
 *
 * Evaluates SEO quality based on title length, description length,
 * slug format, and presence of an image. Displays a circular progress
 * indicator and a checklist of issues/suggestions.
 *
 * @example
 * ```tsx
 * <SEOScore
 *   title="My Awesome Product"
 *   description="This is a detailed description of my product that helps with SEO."
 *   slug="my-awesome-product"
 *   imageUrl="https://example.com/image.jpg"
 * />
 * ```
 */
export function SEOScore({ title, description, slug, imageUrl }: SEOScoreProps) {
  const { score, issues } = useMemo(
    () => calculateSEOScore(title, description, slug, imageUrl),
    [title, description, slug, imageUrl]
  );

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="relative inline-flex items-center justify-center">
        <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={getStrokeColor(score)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score}
          </span>
          <span className="text-xs text-gray-500">{getScoreLabel(score)}</span>
        </div>
      </div>

      <div className="w-full space-y-2">
        {issues.map((issue, index) => (
          <div
            key={index}
            className="flex items-start gap-2 text-sm"
          >
            {issue.passed ? (
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            <span className={issue.passed ? "text-gray-600" : "text-gray-800"}>
              {issue.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
