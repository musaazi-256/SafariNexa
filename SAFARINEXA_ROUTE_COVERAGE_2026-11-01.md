# SafariNexa route inventory — 1 November 2026

All 85 page definitions found under Prototype/src/app. Route groups are omitted from URLs. “Browser sampled” means opened in the local review, not every state passed. Dynamic paths were sampled with representative records. Authentication redirects count as guard observations, not completed authentication integrations. External provider/callback routes were source-reviewed, not completed against Google. No statement here certifies all actions on a page.

| Route pattern | Coverage | Notes |
|---|---|---|
| `/accommodation/[id]` | Browser sampled; source reviewed |  |
| `/accommodation` | Browser sampled; source reviewed |  |
| `/admin/bookings` | Browser sampled; source reviewed |  |
| `/admin/businesses/[id]` | Browser sampled; source reviewed |  |
| `/admin/businesses` | Browser sampled; source reviewed |  |
| `/admin/dashboard` | Browser sampled; source reviewed |  |
| `/admin/payments` | Browser sampled; source reviewed | Pending filter reproduced runtime failure; refunds/payouts not executed. |
| `/admin/profile` | Browser sampled; source reviewed |  |
| `/admin/reviews` | Browser sampled; source reviewed |  |
| `/admin/settings` | Browser sampled; source reviewed |  |
| `/admin/support/[id]` | Browser sampled; source reviewed | Synthetic customer/admin case exercised, replied to and closed. |
| `/admin/support` | Browser sampled; source reviewed |  |
| `/admin/users/new` | Browser sampled; source reviewed |  |
| `/admin/users` | Browser sampled; source reviewed |  |
| `/admin/verification` | Browser sampled; source reviewed |  |
| `/admin/auth/access-denied` | Source reviewed; browser coverage not relied upon |  |
| `/admin/auth/google/callback` | Source reviewed; provider flow unexecuted |  |
| `/admin/auth/google` | Source reviewed; provider flow unexecuted |  |
| `/admin/login` | Browser sampled; source reviewed |  |
| `/auth/create-account` | Source reviewed; browser coverage not relied upon |  |
| `/auth/forgot-password` | Browser sampled; source reviewed |  |
| `/auth/google/callback` | Source reviewed; provider flow unexecuted |  |
| `/auth/google/link` | Source reviewed; browser coverage not relied upon |  |
| `/auth/google` | Source reviewed; provider flow unexecuted |  |
| `/auth/sign-in` | Browser sampled; source reviewed |  |
| `/auth/success` | Source reviewed; browser coverage not relied upon |  |
| `/auth/verify` | Browser sampled; source reviewed |  |
| `/bookings/[id]` | Browser sampled; source reviewed |  |
| `/bookings` | Browser sampled; source reviewed |  |
| `/business/bookings/[id]` | Browser sampled; source reviewed |  |
| `/business/bookings` | Browser sampled; source reviewed |  |
| `/business/dashboard` | Browser sampled; source reviewed |  |
| `/business/guides/new` | Browser sampled; source reviewed |  |
| `/business/guides` | Browser sampled; source reviewed |  |
| `/business/listings/[id]/edit` | Browser sampled; source reviewed |  |
| `/business/listings/new` | Browser sampled; source reviewed |  |
| `/business/listings` | Browser sampled; source reviewed |  |
| `/business/messages` | Browser sampled; source reviewed |  |
| `/business/profile` | Browser sampled; source reviewed | Redirects to settings/settings team tab. |
| `/business/revenue` | Browser sampled; source reviewed |  |
| `/business/reviews` | Browser sampled; source reviewed |  |
| `/business/settings` | Browser sampled; source reviewed |  |
| `/business/team` | Browser sampled; source reviewed | Redirects to settings/settings team tab. |
| `/business/verification` | Browser sampled; source reviewed |  |
| `/business/auth/google/callback` | Source reviewed; provider flow unexecuted |  |
| `/business/auth/google` | Source reviewed; provider flow unexecuted |  |
| `/business/auth/sign-in` | Browser sampled; source reviewed |  |
| `/business/onboarding` | Browser sampled; source reviewed |  |
| `/business/onboarding/setup` | Browser sampled; source reviewed |  |
| `/business` | Source reviewed; browser coverage not relied upon |  |
| `/cart` | Browser sampled; source reviewed |  |
| `/checkout/multi` | Browser sampled; source reviewed | Tour-to-checkout flow fails inventory foreign key. |
| `/checkout` | Source reviewed; browser coverage not relied upon |  |
| `/destinations/[slug]` | Browser sampled; source reviewed |  |
| `/destinations` | Browser sampled; source reviewed |  |
| `/docs/[slug]` | Browser sampled; source reviewed |  |
| `/docs` | Browser sampled; source reviewed |  |
| `/explore` | Browser sampled; source reviewed |  |
| `/guides/[id]` | Browser sampled; source reviewed |  |
| `/guides` | Browser sampled; source reviewed |  |
| `/notifications` | Browser sampled; source reviewed |  |
| `/` | Browser sampled; source reviewed |  |
| `/payments/cancelled` | Source reviewed; browser coverage not relied upon |  |
| `/payments` | Browser sampled; source reviewed |  |
| `/payments/receipt` | Browser sampled; source reviewed | False/unverified success display reproduced. |
| `/payments/success` | Browser sampled; source reviewed | False/unverified success display reproduced. |
| `/profile/messages` | Browser sampled; source reviewed |  |
| `/profile` | Browser sampled; source reviewed |  |
| `/profile/payment-settings` | Browser sampled; source reviewed | Coming-soon surface. |
| `/profile/preferences` | Browser sampled; source reviewed |  |
| `/profile/saved` | Browser sampled; source reviewed |  |
| `/restaurants/[id]` | Browser sampled; source reviewed |  |
| `/restaurants` | Browser sampled; source reviewed |  |
| `/reviews/new` | Source reviewed; browser coverage not relied upon |  |
| `/safety` | Browser sampled; source reviewed |  |
| `/saved` | Source reviewed; browser coverage not relied upon |  |
| `/search` | Browser sampled; source reviewed | 390px horizontal overflow reproduced. |
| `/support/[id]` | Browser sampled; source reviewed | Synthetic customer/admin case exercised, replied to and closed. |
| `/support` | Browser sampled; source reviewed |  |
| `/tours/[id]` | Browser sampled; source reviewed | Tour-to-checkout flow fails inventory foreign key. |
| `/tours` | Browser sampled; source reviewed |  |
| `/transport/[id]` | Browser sampled; source reviewed |  |
| `/transport` | Browser sampled; source reviewed |  |
| `/trip-planner/[id]` | Browser sampled; source reviewed | Mock editor; unbound controls and browser runtime errors. |
| `/trip-planner` | Browser sampled; source reviewed | Coming-soon surface. |

