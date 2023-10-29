export type TComments = {
  _id: string;
  user: {
    customId: string;
    avatar: string;
  };
  post: string;
  content: string;
  like: Array;
  reply: string;
  removed: boolean;
  createdAt: Date;
  updateAt: Date;
  __v: string;
};
