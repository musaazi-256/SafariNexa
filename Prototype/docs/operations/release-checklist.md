# Release operations checklist

## Build and schema
- Build is `npm run build`: generates Prisma Client and compiles Next.js only.
- Apply reviewed schema changes with `npm run db:migrate` separately.
- New empty database: deploy the tracked baseline and additive migrations.
- Existing database: backup and compare its schema to the baseline first; an engineer must explicitly baseline it before deploy. Do not run the baseline CREATE statements against existing tables. The local development database was already verified and baselined.
- Seed only an explicitly disposable development/test database. Never seed production demo administrators or financial records.
- CI checks lint, tests, production build and typecheck. External gateway/browser integration tests still need isolated fixtures and credentials.

## Required configuration
- Database connection; long random AUTH_SECRET; canonical HTTPS AUTH_URL; AUTH_DEV_MODE=false.
- STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET only after sandbox acceptance tests. Register checkout completion/async success/failure/expiry and refund update/create events with the signed webhook endpoint.
- EMAIL_FROM, RESEND_API_KEY and canonical URL for account emails/invitations. Use a verified sender and test delivery/failure.
- PRIVATE_DOCUMENT_DIRECTORY: private persistent storage path outside any public/static mount. Copy legacy .private/verification files to that volume.
- PUBLIC_IMAGE_DIRECTORY: persistent storage for deliberately public listing images, served through the validated image endpoint. Verification files must never be placed there.
- CRON_SECRET: random server-side secret protecting POST /api/jobs/expire-bookings. Schedule through deployment infrastructure every 10–15 minutes, over HTTPS with Bearer authorization. Do not expose the secret to clients.
- Enforce reverse-proxy upload/body limits and private storage backups. A private-volume implementation is provided; external object storage is not configured automatically.
- Optional NEXT_PUBLIC_*_URL social links appear only when valid HTTPS URLs are configured.

## Monitoring and incident handling
- GET /api/health probes the database and returns readiness, not uptime history.
- Alert on webhook/job 5xx responses, stale provider attempts, refund/payout reconciliation failures and storage problems.
- Retry signed webhooks after transient transaction failures. Never manually mark money received solely because a customer reached a success URL.
- Historical demo payments/payouts need explicit reconciliation or separation from a clean production environment.
- Unknown in-flight payment attempts must be investigated before releasing inventory or attempting a second charge.
- Operational email/SMS delivery needs a durable queue/outbox and delivery telemetry before claiming those channels work.

## Release gates
- No fabricated financial outcomes.
- Verified sandbox collection, cancellation, partial/full refund, allocation and replay behavior.
- Provider and settlement-account decision for mobile money and payouts; these remain unavailable.
- Two-business/two-customer authorization checks with development overrides disabled.
- Concurrent inventory tests, responsive/keyboard checks, backup restore and rollback drill.
- Product approval for dining duration/hours, transport overlap and cancellation/commission rules.
- Do not equate a successful build with operational or payment-provider certification.

Provider contracts referenced during implementation: [Stripe currency special cases](https://docs.stripe.com/currencies#special-cases) and [Resend email API](https://resend.com/docs/api-reference/emails/send-email).
