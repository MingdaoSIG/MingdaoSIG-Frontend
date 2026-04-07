# API

## Base URL

Always use `process.env.NEXT_PUBLIC_API_URL` — never hardcode the API URL.

## Request Module

All API calls go through `modules/sigAPI/function/_request.ts`:

```typescript
// GET
const data = await request.get("default", "/post/list", {
  token: "jwt-token",
  requestQuery: { skip: 0, limit: 10 }
});

// POST
const result = await request.post("default", "/post", body, {
  token: "jwt-token"
});
```

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
2. After login, exchange for a platform JWT token
3. Store token in `localStorage` under the key `token`
4. Use `useUserAccount` hook to access login state

## Image Upload

Module: `modules/imageUploadAPI/index.ts`

- Accepted formats: `webp`, `jpeg`, `png`, `tiff`
- Max size: 5 MB
