export interface IThread {
  _id?: string,
  sig: string,
  title: string,
  cover: string,
  content: string,
  user: string,
  hashtag: string[],
  like?: string[],
  likes?: number,
  priority?: number,
  pinned?: boolean,
  removed?: boolean,
  createAt?: string,
  updateAt?: string,
  __v?: number
}