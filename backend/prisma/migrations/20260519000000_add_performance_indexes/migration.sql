-- Add performance indexes to frequently queried fields

-- Page indexes
CREATE INDEX "idx_page_slug" ON "Page" ("slug");
CREATE INDEX "idx_page_isActive" ON "Page" ("isActive");
CREATE INDEX "idx_page_deletedAt" ON "Page" ("deletedAt");

-- SectionContent indexes
CREATE INDEX "idx_sectionContent_pageId" ON "SectionContent" ("pageId");
CREATE INDEX "idx_sectionContent_sectionKey" ON "SectionContent" ("sectionKey");
CREATE INDEX "idx_sectionContent_isActive" ON "SectionContent" ("isActive");

-- BlogPost indexes
CREATE INDEX "idx_blogPost_slug" ON "BlogPost" ("slug");
CREATE INDEX "idx_blogPost_status" ON "BlogPost" ("status");
CREATE INDEX "idx_blogPost_publishedAt" ON "BlogPost" ("publishedAt");
CREATE INDEX "idx_blogPost_isActive" ON "BlogPost" ("isActive");
CREATE INDEX "idx_blogPost_deletedAt" ON "BlogPost" ("deletedAt");

-- NavigationItem indexes
CREATE INDEX "idx_navigationItem_location" ON "NavigationItem" ("location");
CREATE INDEX "idx_navigationItem_isActive" ON "NavigationItem" ("isActive");
CREATE INDEX "idx_navigationItem_parentId" ON "NavigationItem" ("parentId");

-- MediaAsset indexes
CREATE INDEX "idx_mediaAsset_category" ON "MediaAsset" ("category");
CREATE INDEX "idx_mediaAsset_isActive" ON "MediaAsset" ("isActive");
CREATE INDEX "idx_mediaAsset_deletedAt" ON "MediaAsset" ("deletedAt");

-- Testimonial indexes
CREATE INDEX "idx_testimonial_isActive" ON "Testimonial" ("isActive");
CREATE INDEX "idx_testimonial_order" ON "Testimonial" ("order");

-- FAQItem indexes
CREATE INDEX "idx_faqItem_categoryId" ON "FAQItem" ("categoryId");
CREATE INDEX "idx_faqItem_isActive" ON "FAQItem" ("isActive");

-- PricingPlan indexes
CREATE INDEX "idx_pricingPlan_period" ON "PricingPlan" ("period");
CREATE INDEX "idx_pricingPlan_isActive" ON "PricingPlan" ("isActive");

-- Redirect indexes
CREATE INDEX "idx_redirect_from" ON "Redirect" ("from");
CREATE INDEX "idx_redirect_isActive" ON "Redirect" ("isActive");

-- ContentAudit indexes
CREATE INDEX "idx_contentAudit_entityType" ON "ContentAudit" ("entityType");
CREATE INDEX "idx_contentAudit_entityId" ON "ContentAudit" ("entityId");
CREATE INDEX "idx_contentAudit_createdAt" ON "ContentAudit" ("createdAt");

-- AdminUser indexes
CREATE INDEX "idx_adminUser_userId" ON "AdminUser" ("userId");
CREATE INDEX "idx_adminUser_roleId" ON "AdminUser" ("roleId");
