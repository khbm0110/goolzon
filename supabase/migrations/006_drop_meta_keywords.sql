-- `meta_keywords` (<meta name="keywords">) has had zero effect on
-- Google ranking since 2009 (confirmed publicly by Google), and this
-- project never even rendered it into any page's <meta> tags — it was
-- a dead field only ever read/written by the admin SEO settings form.
-- Removed from the app in this same change; this drops the column for
-- databases that were already provisioned before that.
alter table public.seo_settings drop column if exists meta_keywords;
