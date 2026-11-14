-- Signup numbers, from counts only. Nothing here reads an address. Run, for example:
--   wrangler d1 execute cyberoutlook-email --remote --file worker/stats.sql
-- (Visits and request numbers come from Cloudflare's own dashboard, not from anything on the pages. See docs/email-platform-design.md.)

-- By topic, all time
SELECT topic, SUM(asked) AS asked, SUM(confirmed) AS confirmed,
       ROUND(100.0 * SUM(confirmed) / NULLIF(SUM(asked), 0), 1) AS confirmed_percent
FROM counts GROUP BY topic ORDER BY topic;

-- By day, last 30 days
SELECT day, topic, SUM(asked) AS asked, SUM(confirmed) AS confirmed
FROM counts WHERE day >= date('now', '-30 day') GROUP BY day, topic ORDER BY day DESC, topic;

-- By page
SELECT source, topic, SUM(asked) AS asked, SUM(confirmed) AS confirmed FROM counts GROUP BY source, topic ORDER BY source, topic;
