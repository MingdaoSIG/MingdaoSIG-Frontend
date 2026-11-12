/**
 * Body of `POST /sig/:id/join` (contract v4 §5.6): one answer per question
 * of the SIG's join form, in order, labelled with the question. The
 * backend keeps q1..q3 filled for the email template.
 */
export type TJoinAnswer = {
  question: string;
  answer: string;
};

export type TJoinSigAPI = {
  sig: string;
  answers: TJoinAnswer[];
};
