# API

## Base URL

Always use `process.env.NEXT_PUBLIC_API_URL` — never hardcode the API URL.

## Request Module

New code calls the backend through `modules/api/client.ts`:

```typescript
const result = await apiRequest<TThread[]>("/post/list", {
  query: { skip: 0, limit: 10 },
});
if (!result.ok) {
  toast.error(result.message); // Traditional Chinese, e.g. 429 → 「操作太頻繁，請稍後再試」
  return;
}
use(result.data);

// Authenticated: pass the token, or `auth: true` for the signed-in user's
await apiRequest(`/post/${id}/like`, { method: "POST", token });
```

`apiRequest` never throws. Every outcome comes back as a result:
`ok: true` with `data` only for status 2000; otherwise `ok: false` with a
`kind` (`rate-limited`, `unauthorized`, `too-large`, `not-found`,
`network`, `invalid-response`, `error`) and a user-facing `message`. It
handles non-JSON bodies (429 plain text, 502 HTML pages) too.
`fetchApiData` and `modules/sigAPI` resolve to `data` and throw an
`ApiError` instead, for react-query and older callers.

An authenticated request answered with HTTP 401 or status 4013 makes the
auth provider re-exchange the login once and retries with the new token.

## Custom Status Codes

Defined in `modules/customStatusCode/index.ts`:

| Code | Meaning |
|------|---------|
| 2000 | OK — success |
| **4000–4001** | **General errors** |
| 4000 | Not found |
| 4001 | Forbidden — no permission |
| **4010–4032** | **Validation errors** |
| 4010 | Invalid user |
| 4011 | Invalid body |
| 4012 | Invalid query |
| 4013 | Invalid JWT |
| 4015 | Invalid Google access token |
| 4016 | Invalid image ID |
| 4017 | Invalid user ID |
| 4018 | Invalid post ID |
| 4019 | Invalid SIG ID |
| 4020 | Invalid reply ID |
| 4021 | Invalid custom ID |
| 4022 | Custom ID already exists |
| 4023 | Invalid content length |
| 4024 | Empty content |
| 4025 | Invalid hashtag |
| 4026 | Content size exceeded |
| 4027 | Failed to send email |
| 4028 | Already joined |
| 4029 | Already applied |
| 4030 | Not a member |
| 4031 | Already confirmed |
| 4032–4035 | Leader/moderator conflicts |
| **4100–4111** | **Database errors** |
| 4100–4101 | User read/write error |
| 4102–4103 | Image read/write error |
| 4104–4105 | Post read/write error |
| 4106–4107 | SIG read/write error |
| 4108–4109 | Comment read/write error |
| 4110–4111 | Join request read/write error |
| **5000** | **Unknown error** |

## Authentication Flow

1. NextAuth.js handles Google OAuth — only `@ms.mingdao.edu.tw` domain accepted
   (the school app can also sign users in with `/?session=…`).
2. `AuthProvider` (`utils/useUserAccount/AuthProvider.tsx`, mounted once in
   `app/providers.tsx`) exchanges the Google access token or the session for a
   platform JWT via `POST /login`, but only when there is no usable stored JWT
   (expired per its `exp` claim, or missing). The Google token next-auth keeps
   stops working after about an hour, so the JWT is what keeps users signed in.
3. The JWT is stored in `localStorage` under `token` (the profile under `user`),
   through `utils/safeStorage`, which never throws when storage is blocked.
   On each page load a stored JWT is reused and the profile refreshed with
   `GET /user/me`.
4. On a 401 / 4013 the provider re-exchanges once; only if that fails does it
   sign out (without reloading the page).
5. Components read the state with `useUserAccount()`
   (`{ isLogin, token, userData, isLoading, login, logout }`).

Email, student number and other private fields come only from `/user/me`
(yourself) or `/user/:id/full` (yourself or an admin), never from the public
`/user/:id` or users embedded in posts and comments.

## Image Upload

Module: `modules/imageUploadAPI/index.ts`

- Accepted formats: `webp`, `jpeg`, `png`, `tiff`
- Max size: 5 MB
