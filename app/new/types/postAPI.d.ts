/**
 * type for Post API Body Needs.
 *
 * @interface TPostAPI
 * @property {string} title - The title of the post.
 * @property {string} sig - The signature included in the post.
 * @property {string[]} hashtag - An array of tags needed for the post.
 * @property {string} content - The constent of the post.
 * @property {string} cover - The URL of the post's cover image.
 */
export type TPostAPI = {
  title: string;
  sig: string;
  hashtag?: string[];
  content: string;
  cover: string;
};
