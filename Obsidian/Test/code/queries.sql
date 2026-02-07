-- ================================================
-- Analytics Queries
-- ================================================

-- Daily active users for the last 30 days
SELECT
    DATE_TRUNC('day', event_time) AS day,
    COUNT(DISTINCT user_id) AS dau
FROM events
WHERE event_time >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1;

-- Top 10 users by revenue
SELECT
    u.id,
    u.name,
    u.email,
    SUM(o.total_amount) AS total_revenue,
    COUNT(o.id) AS order_count,
    AVG(o.total_amount) AS avg_order_value
FROM users u
INNER JOIN orders o ON o.user_id = u.id
WHERE o.status = 'completed'
  AND o.created_at >= '2025-01-01'
GROUP BY u.id, u.name, u.email
ORDER BY total_revenue DESC
LIMIT 10;

-- Cohort retention analysis
WITH first_purchase AS (
    SELECT
        user_id,
        DATE_TRUNC('month', MIN(created_at)) AS cohort_month
    FROM orders
    WHERE status = 'completed'
    GROUP BY user_id
),
monthly_activity AS (
    SELECT
        fp.cohort_month,
        DATE_TRUNC('month', o.created_at) AS activity_month,
        COUNT(DISTINCT o.user_id) AS active_users
    FROM orders o
    INNER JOIN first_purchase fp ON fp.user_id = o.user_id
    WHERE o.status = 'completed'
    GROUP BY fp.cohort_month, DATE_TRUNC('month', o.created_at)
)
SELECT
    cohort_month,
    activity_month,
    active_users,
    EXTRACT(MONTH FROM AGE(activity_month, cohort_month)) AS months_since_first,
    ROUND(
        active_users * 100.0 / FIRST_VALUE(active_users)
            OVER (PARTITION BY cohort_month ORDER BY activity_month),
        1
    ) AS retention_pct
FROM monthly_activity
ORDER BY cohort_month, activity_month;

-- Product category performance
SELECT
    c.name AS category,
    COUNT(DISTINCT p.id) AS product_count,
    SUM(oi.quantity) AS units_sold,
    SUM(oi.quantity * oi.unit_price) AS gross_revenue,
    SUM(oi.quantity * oi.unit_price) - SUM(oi.quantity * p.cost) AS gross_margin,
    ROUND(
        (SUM(oi.quantity * oi.unit_price) - SUM(oi.quantity * p.cost))
        / NULLIF(SUM(oi.quantity * oi.unit_price), 0) * 100,
        1
    ) AS margin_pct
FROM categories c
INNER JOIN products p ON p.category_id = c.id
INNER JOIN order_items oi ON oi.product_id = p.id
INNER JOIN orders o ON o.id = oi.order_id
WHERE o.status = 'completed'
  AND o.created_at >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY c.name
ORDER BY gross_revenue DESC;
