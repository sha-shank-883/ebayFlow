/**
 * Strips dangerous HTML tags and scripts while allowing a safe subset of HTML.
 * @param input - The HTML string to sanitize
 * @returns Sanitized HTML string with only safe tags preserved
 */
export function sanitizeHtml(input: string): string {
  const allowedTags = [
    'b', 'i', 'u', 'p', 'br', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'img', 'blockquote', 'code', 'pre',
  ];

  const allowedAttrs: Record<string, string[]> = {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
  };

  let result = input;

  result = result.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  result = result.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  result = result.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
  result = result.replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '');
  result = result.replace(/<embed[^>]*>[\s\S]*?<\/embed>/gi, '');
  result = result.replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '');
  result = result.replace(/<input[^>]*\/?>/gi, '');
  result = result.replace(/<textarea[^>]*>[\s\S]*?<\/textarea>/gi, '');
  result = result.replace(/<select[^>]*>[\s\S]*?<\/select>/gi, '');
  result = result.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  result = result.replace(/on\w+\s*=\s*\S+/gi, '');
  result = result.replace(/javascript\s*:/gi, '');
  result = result.replace(/data\s*:/gi, '');
  result = result.replace(/vbscript\s*:/gi, '');

  result = result.replace(/<\s*\/?\s*([a-zA-Z0-9]+)([^>]*)>/g, (match, tagName, attrs) => {
    const lowerTag = tagName.toLowerCase();

    if (!allowedTags.includes(lowerTag)) {
      return '';
    }

    if (allowedAttrs[lowerTag]) {
      const safeAttrs: string[] = [];
      const attrRegex = /([a-zA-Z\-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g;
      let attrMatch;

      while ((attrMatch = attrRegex.exec(attrs)) !== null) {
        const attrName = attrMatch[1].toLowerCase();
        const attrValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';

        if (allowedAttrs[lowerTag].includes(attrName)) {
          if (attrName === 'href' || attrName === 'src') {
            if (/^(javascript|data|vbscript)\s*:/i.test(attrValue)) {
              continue;
            }
          }
          safeAttrs.push(`${attrName}="${attrValue.replace(/"/g, '&quot;')}"`);
        }
      }

      const attrStr = safeAttrs.length > 0 ? ` ${safeAttrs.join(' ')}` : '';
      return `<${lowerTag}${attrStr}>`;
    }

    return `<${lowerTag}>`;
  });

  return result;
}

/**
 * Recursively sanitizes all string values in an object.
 * @param input - The object to sanitize
 * @returns A new object with all string values sanitized
 */
export function sanitizeObject(input: unknown): unknown {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    return sanitizeHtml(input);
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeObject(item));
  }

  if (typeof input === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      result[key] = sanitizeObject(value);
    }
    return result;
  }

  return input;
}

/**
 * Validates that a slug matches the required format.
 * @param slug - The slug string to validate
 * @returns true if the slug is valid, false otherwise
 */
export function validateSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

/**
 * Performs basic email address validation.
 * @param email - The email string to validate
 * @returns true if the email is valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Truncates a string to a maximum length and appends an ellipsis if truncated.
 * @param str - The string to truncate
 * @param maxLength - The maximum allowed length
 * @returns The truncated string with ellipsis if needed
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return `${str.slice(0, maxLength)}...`;
}

/**
 * Escapes special regex characters in a string.
 * @param str - The string to escape
 * @returns The escaped string safe for use in a RegExp
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
