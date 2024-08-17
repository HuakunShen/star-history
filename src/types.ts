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

export type DayStar = {
  date: Date;
  stars: number;
};

/* -------------------------------------------------------------------------- */
/*                                    Event                                   */
/* -------------------------------------------------------------------------- */

export enum EventTypes {
  FetchData = "fetch-data",
  CacheHit = "cache-hit",
}

export type FetchDataEventPayload = {
  owner: string;
  repo: string;
  userTokenProvided: boolean;
  existingDataLength: number;
};

export type CacheHitEventPayload = {
  owner: string;
  repo: string;
  userTokenProvided: boolean;
  existingDataLength: number;
  fetchedDataLength: number;
  mergedDataLength: number;
};

/* -------------------------------------------------------------------------- */
/*                                 Table Names                                */
/* -------------------------------------------------------------------------- */
export enum TableNames {
  Repos = "repos",
  Events = "events",
}
