/**
 * Body of `POST /user` (your own profile).
 *
 * @property {string} description - The bio shown on the profile.
 * @property {boolean} notifyComments - Email me when someone comments.
 */
export type TPostUserAPI = {
  description?: string;
  notifyComments?: boolean;
};
