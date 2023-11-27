/**
 * type for Join SIG API Body Needs.
 *
 * @interface TPostAPI
 * @property {string} sig - The sig ID.
 * @property {string} q1 - The answer to the first question.
 * @property {string} q2 - The answer to the second question.
 * @property {string} q3 - The answer to the third question
 */

export type TJoinSigAPI = {
  sig: string;
  q1: string;
  q2: string;
  q3: string;
}