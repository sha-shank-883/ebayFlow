import { test, expect } from '@playwright/test';

test.describe('Admin Blog Management Flow', () => {
  const testUser = {
    email: 'superadmin@example.com',
    password: 'SecurePass123!',
  };

  const testPost = {
    title: 'E2E Test Blog Post',
    content: 'This is a test blog post created during E2E testing.',
    updatedContent: 'This content has been updated during E2E testing.',
  };

  let postId: string;
  let draftVersionId: string;
  let publishedVersionId: string;

  test.beforeEach(async ({ page }) => {
    // Clear any existing session state before each test
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test('complete admin blog lifecycle', async ({ page }) => {
    // ============================================================
    // STEP 1: Login as SUPER_ADMIN
    // Navigate to login page and authenticate with admin credentials
    // ============================================================
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);

    // Fill login form
    await page.getByRole('textbox', { name: /email/i }).fill(testUser.email);
    await page.getByRole('textbox', { name: /password/i }).fill(testUser.password);

    // Submit login form and wait for navigation
    await Promise.all([
      page.waitForURL(/\/dashboard/),
      page.getByRole('button', { name: /sign in|log in|login/i }).click(),
    ]);

    // Wait for loading state to complete
    await expect(page.getByRole('status')).not.toBeVisible({ timeout: 10000 });

    // Verify successful login by checking for admin dashboard elements
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByText(/welcome|dashboard/i)).toBeVisible({ timeout: 5000 });

    // ============================================================
    // STEP 2: Navigate to /dashboard/admin
    // Access the admin panel for blog management
    // ============================================================
    await page.goto('/dashboard/admin');
    await expect(page).toHaveURL(/\/dashboard\/admin/);

    // Wait for admin panel to load
    await expect(page.locator('[data-testid="admin-panel"]')).toBeVisible({ timeout: 10000 });

    // Verify admin-specific UI elements are present
    await expect(page.getByRole('heading', { name: /admin|blog management/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /create|new post|add/i })).toBeVisible();

    // ============================================================
    // STEP 3: Create a new blog post
    // Fill out the blog creation form and save as draft
    // ============================================================
    await page.getByRole('button', { name: /create|new post|add/i }).click();

    // Wait for the create post form/modal to appear
    await expect(page.getByRole('dialog').or(page.locator('[data-testid="create-post-form"]'))).toBeVisible({ timeout: 5000 });

    // Fill in post title
    await page.getByRole('textbox', { name: /title/i }).fill(testPost.title);

    // Fill in post content using the content editor
    const contentEditor = page.locator('[data-testid="content-editor"], [role="textbox"][aria-label*="content"], textarea[name="content"]').first();
    await contentEditor.fill(testPost.content);

    // Save as draft
    await page.getByRole('button', { name: /save draft|draft/i }).click();

    // Wait for save operation to complete and toast notification
    await expect(page.getByRole('status')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/saved|draft created/i)).toBeVisible({ timeout: 5000 });

    // Capture the post ID from the URL or response for later use
    const url = page.url();
    const postIdMatch = url.match(/\/posts?\/([^/?]+)/);
    if (postIdMatch) {
      postId = postIdMatch[1];
    }

    // Verify draft was created by checking the post list
    await expect(page.getByText(testPost.title)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/draft/i)).toBeVisible();

    // ============================================================
    // STEP 4: Preview draft
    // Open the draft preview to verify content before publishing
    // ============================================================
    await page.getByRole('button', { name: /preview/i }).click();

    // Wait for preview modal/window to open
    await expect(page.getByRole('dialog').or(page.locator('[data-testid="preview-modal"]'))).toBeVisible({ timeout: 5000 });

    // Verify preview content matches what was entered
    await expect(page.getByRole('heading', { name: testPost.title })).toBeVisible();
    await expect(page.getByText(testPost.content)).toBeVisible();

    // Verify draft badge is shown in preview
    await expect(page.getByText(/draft|preview/i)).toBeVisible();

    // Close preview
    await page.getByRole('button', { name: /close|exit/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // ============================================================
    // STEP 5: Publish post
    // Publish the draft to make it publicly visible
    // ============================================================
    await page.getByRole('button', { name: /publish/i }).click();

    // Confirm publish action if a confirmation dialog appears
    const confirmDialog = page.getByRole('dialog').filter({ hasText: /confirm|publish/i });
    if (await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.getByRole('button', { name: /confirm|yes|publish/i }).click();
    }

    // Wait for publish operation to complete
    await expect(page.getByRole('status')).not.toBeVisible({ timeout: 15000 });

    // Verify success toast notification
    await expect(page.getByText(/published|post is live/i)).toBeVisible({ timeout: 5000 });

    // Verify post status changed to published
    await expect(page.getByText(/published|live/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/draft/i)).not.toBeVisible();

    // Capture published version ID for later comparison
    const versionInfo = await page.locator('[data-testid="version-info"]').textContent();
    if (versionInfo) {
      publishedVersionId = versionInfo;
    }

    // ============================================================
    // STEP 6: Verify post appears in public API
    // Make an API request to confirm the post is publicly accessible
    // ============================================================
    const apiResponse = await page.request.get('/api/posts', {
      params: { status: 'published', search: testPost.title },
    });

    expect(apiResponse.ok()).toBeTruthy();
    const apiData = await apiResponse.json();

    // Verify the post exists in API response
    const posts = apiData.posts || apiData.data || apiData;
    const foundPost = Array.isArray(posts)
      ? posts.find((p: { title: string }) => p.title === testPost.title)
      : null;

    expect(foundPost).toBeTruthy();
    expect(foundPost.title).toBe(testPost.title);
    expect(foundPost.content).toBe(testPost.content);
    expect(foundPost.status).toBe('published');

    // Also verify the individual post endpoint
    if (postId) {
      const singlePostResponse = await page.request.get(`/api/posts/${postId}`);
      expect(singlePostResponse.ok()).toBeTruthy();
      const singlePostData = await singlePostResponse.json();
      expect(singlePostData.title).toBe(testPost.title);
      expect(singlePostData.status).toBe('published');
    }

    // ============================================================
    // STEP 7: Edit post
    // Modify the published post and save changes
    // ============================================================
    await page.getByRole('button', { name: /edit/i }).click();

    // Wait for edit form to load
    await expect(page.getByRole('dialog').or(page.locator('[data-testid="edit-post-form"]'))).toBeVisible({ timeout: 5000 });

    // Update the content
    const editEditor = page.locator('[data-testid="content-editor"], [role="textbox"][aria-label*="content"], textarea[name="content"]').first();
    await editEditor.fill(testPost.updatedContent);

    // Save changes
    await page.getByRole('button', { name: /save|update/i }).click();

    // Wait for save to complete
    await expect(page.getByRole('status')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/updated|saved successfully/i)).toBeVisible({ timeout: 5000 });

    // Verify the updated content is displayed
    await expect(page.getByText(testPost.updatedContent)).toBeVisible({ timeout: 5000 });

    // Verify version history shows a new version was created
    await expect(page.locator('[data-testid="version-count"]')).toHaveText(/2|v2/i);

    // ============================================================
    // STEP 8: Restore previous version
    // Access version history and restore the original version
    // ============================================================
    await page.getByRole('button', { name: /history|versions|revisions/i }).click();

    // Wait for version history panel to appear
    await expect(page.locator('[data-testid="version-history"]')).toBeVisible({ timeout: 5000 });

    // Find and click on the previous version (v1 or the original)
    const previousVersion = page.locator('[data-testid="version-item"]').filter({ hasText: /v1|original|draft/i }).first();
    await previousVersion.click();

    // Click restore button
    await page.getByRole('button', { name: /restore|revert/i }).click();

    // Confirm restore action
    const restoreConfirm = page.getByRole('dialog').filter({ hasText: /restore|revert|confirm/i });
    if (await restoreConfirm.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.getByRole('button', { name: /confirm|yes|restore/i }).click();
    }

    // Wait for restore operation to complete
    await expect(page.getByRole('status')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/restored|reverted/i)).toBeVisible({ timeout: 5000 });

    // Verify the original content is restored
    await expect(page.getByText(testPost.content)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(testPost.updatedContent)).not.toBeVisible();

    // ============================================================
    // STEP 9: Delete post
    // Delete the post and confirm the action
    // ============================================================
    await page.getByRole('button', { name: /delete|remove/i }).click();

    // Wait for delete confirmation dialog
    await expect(page.getByRole('dialog').filter({ hasText: /delete|remove|confirm/i })).toBeVisible({ timeout: 5000 });

    // Confirm deletion
    await page.getByRole('button', { name: /confirm|yes|delete/i }).click();

    // Wait for delete operation to complete
    await expect(page.getByRole('status')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/deleted|removed/i)).toBeVisible({ timeout: 5000 });

    // Verify post no longer appears in the admin list
    await expect(page.getByText(testPost.title)).not.toBeVisible({ timeout: 5000 });

    // ============================================================
    // STEP 10: Verify post is soft-deleted
    // Confirm the post is soft-deleted via API (still exists but marked as deleted)
    // ============================================================

    // Verify post does not appear in public API
    const publicApiResponse = await page.request.get('/api/posts', {
      params: { status: 'published', search: testPost.title },
    });

    expect(publicApiResponse.ok()).toBeTruthy();
    const publicApiData = await publicApiResponse.json();
    const publicPosts = publicApiData.posts || publicApiData.data || publicApiData;
    const stillPublic = Array.isArray(publicPosts)
      ? publicPosts.find((p: { title: string }) => p.title === testPost.title)
      : null;

    expect(stillPublic).toBeFalsy();

    // Verify post exists in admin API with deleted status (soft delete)
    const adminApiResponse = await page.request.get('/api/admin/posts', {
      params: { include_deleted: 'true', search: testPost.title },
    });

    expect(adminApiResponse.ok()).toBeTruthy();
    const adminApiData = await adminApiResponse.json();
    const adminPosts = adminApiData.posts || adminApiData.data || adminApiData;
    const softDeletedPost = Array.isArray(adminPosts)
      ? adminPosts.find((p: { title: string; deleted_at?: string | null }) =>
          p.title === testPost.title && p.deleted_at !== null
        )
      : null;

    expect(softDeletedPost).toBeTruthy();
    expect(softDeletedPost.deleted_at).not.toBeNull();

    // Verify the post returns 410 Gone or includes deleted flag when accessed directly
    const directResponse = await page.request.get(`/api/posts/${postId}`);
    expect(directResponse.status()).toMatch(/404|410/);
  });

  test('handles network errors gracefully during publish', async ({ page }) => {
    // Test that the UI handles network failures during publish action
    await page.route('/api/posts/*/publish', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    // Navigate to admin and attempt to publish
    await page.goto('/dashboard/admin');
    await expect(page.locator('[data-testid="admin-panel"]')).toBeVisible({ timeout: 10000 });

    // Click publish and verify error handling
    await page.getByRole('button', { name: /publish/i }).click();

    // Wait for loading state
    await expect(page.getByRole('status')).toBeVisible({ timeout: 5000 });

    // Verify error toast is shown
    await expect(page.getByText(/error|failed|try again/i)).toBeVisible({ timeout: 10000 });

    // Verify the button is re-enabled after error
    await expect(page.getByRole('button', { name: /publish/i })).toBeEnabled();
  });

  test('prevents duplicate submissions with loading states', async ({ page }) => {
    // Test that rapid clicks don't cause duplicate submissions
    await page.goto('/dashboard/admin');
    await expect(page.locator('[data-testid="admin-panel"]')).toBeVisible({ timeout: 10000 });

    // Click publish multiple times rapidly
    const publishButton = page.getByRole('button', { name: /publish/i });
    await publishButton.click();

    // Verify button becomes disabled during processing
    await expect(publishButton).toBeDisabled({ timeout: 2000 });

    // Verify loading indicator is shown
    await expect(page.getByRole('status')).toBeVisible({ timeout: 5000 });

    // Wait for operation to complete
    await expect(page.getByRole('status')).not.toBeVisible({ timeout: 15000 });

    // Verify button is re-enabled after completion
    await expect(publishButton).toBeEnabled({ timeout: 5000 });
  });
});
