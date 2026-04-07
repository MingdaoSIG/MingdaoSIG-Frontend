# Data Types

All interfaces are in the `interfaces/` directory.

## TThread (`interfaces/Thread.d.ts`)

```typescript
type TThread = {
  _id?: string;        // Post ID
  sig: string;         // SIG ID
  title: string;
  cover: string;       // Cover image URL
  content: string;     // Markdown content
  user: string;        // Author ID
  hashtag?: string[];
  like?: string[];     // User IDs who liked
  likes?: number;
  comments?: number;
  priority?: number;
  pinned?: boolean;
  removed?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;        // Document version
};
```

## User (`interfaces/User.d.ts`)

```typescript
type Identity = "teacher" | "student" | "alumni";

type User = {
  _id?: string;
  customId?: string;
  email?: string;
  name?: string;
  code?: string;          // Student ID
  class?: string;
  identity?: Identity;
  sig?: string[];         // Joined SIG IDs
  displayName?: string;
  description?: string;
  avatar?: string;
  badge?: ("developer" | "10.21_user" | "bug_hunter")[];
  follower?: string[];
  permission?: Permission;
  createAt?: string;
  updateAt?: string;
  __v?: number;           // Document version
};
```

## Permission Levels

```
0: view only
1: like, comment, apply to join
2: post in specific SIG
3: post in all SIGs
4: delete members
5: review join requests
6: delete comments
7: manage member permissions
8: manage all posts
```

## Sig (`interfaces/Sig.d.ts`)

```typescript
type Sig = {
  _id: string;
  name: string;
  description?: string;
  avatar?: string;
  follower?: string[];
  customId?: string;
  moderator?: string[];
  leader?: string[];
  removed?: boolean;
  badge?: ("developer" | "10.21_user" | "bug_hunter")[];
};
```
