export type Repo = {
  id: string;
  updated: Date;
  created: Date;
  owner: string;
  repo: string;
  stars_per_day:
    | {
        date: Date;
        stars: number;
      }[]
    | null;
};
