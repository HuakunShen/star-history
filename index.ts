import type { Repo } from "./src/types";

export function getStarDataFromGitHub(
  owner: string,
  name: string,
  token: string,
  before?: string
) {
  const graphql = JSON.stringify({
    query:
      "query StarHistory($owner: String!, $name: String!, $after: String, $before: String, $first: Int, $last: Int) {\n  repository(owner: $owner, name: $name) {\n    stargazerCount\n    stargazers(first: $first, after: $after, last: $last, before: $before) {\n      edges {\n        starredAt\n      }\n      totalCount\n      pageInfo {\n        endCursor\n        hasNextPage\n        hasPreviousPage\n        startCursor\n      }\n    }\n  }\n}",
    variables: {
      owner,
      name,
      last: 100,
      before: before,
    },
  });
  const res = $http.send({
    url: "https://api.github.com/graphql",
    method: "POST",
    body: graphql, // ex. JSON.stringify({"test": 123}) or new FormData()
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    },
    timeout: 120, // in seconds
  });
  return res.json;
}

export function getStarsEarnedPerDay(
  owner: string,
  name: string,
  githubToken: string,
  since: Date | null = null
): { date: Date; stars: number }[] {
  let hasPreviousPage = true;
  let startCursor: string | undefined = undefined;
  let allDates: Date[] = [];
  while (hasPreviousPage) {
    const rawData = getStarDataFromGitHub(
      owner,
      name,
      githubToken,
      startCursor
    );
    const pageInfo = rawData.data.repository?.stargazers.pageInfo;
    startCursor = pageInfo?.startCursor ?? null;
    hasPreviousPage = pageInfo?.hasPreviousPage ?? false;
    const dates: Date[] =
      rawData.data.repository?.stargazers.edges
        ?.map((edge: any) => edge?.starredAt)
        .filter((x: unknown | undefined) => x)
        .map((d: any) => new Date(d)) ?? [];
    allDates.push(...dates);
    if (since) {
      if (dates.length === 0 || dates[dates.length - 1] < since) {
        allDates = allDates.filter((date) => date >= since);
        break;
      }
    }
  }
  allDates.sort((a, b) => a.getTime() - b.getTime());
  const starCounts = allDates.reduce((acc, date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const last = acc[acc.length - 1];
    if (last && +last.date === +day) {
      last.stars++;
    } else {
      acc.push({ date: day, stars: 1 });
    }
    return acc;
  }, [] as { date: Date; stars: number }[]);
  return starCounts;
}

export function starsPerDayToCumulative(
  starCounts: { date: Date; stars: number }[]
): { date: Date; stars: number }[] {
  let cumulativeStarCounts = starCounts.reduce((acc, { date, stars }) => {
    const last = acc[acc.length - 1];
    const lastCount = last?.stars ?? 0;
    acc.push({ date, stars: lastCount + stars });
    return acc;
  }, [] as { date: Date; stars: number }[]);
  return cumulativeStarCounts;
}

export function getStarHistory(
  owner: string,
  name: string,
  githubToken: string,
  options?: {
    since: Date | null;
    baseStars: number;
  }
): { date: Date; stars: number }[] {
  if (!options) {
    options = {
      since: null,
      baseStars: 0,
    };
  }

  const starCounts = getStarsEarnedPerDay(
    owner,
    name,
    githubToken,
    options.since
  );
  let cumulativeStarCounts = starsPerDayToCumulative(starCounts);
  if (options.baseStars > 0) {
    cumulativeStarCounts = cumulativeStarCounts.map(({ date, stars }) => ({
      date,
      stars: stars + options.baseStars,
    }));
  }
  return cumulativeStarCounts;
}

/* -------------------------------------------------------------------------- */
/*                                  Database                                  */
/* -------------------------------------------------------------------------- */

export function repoExists(owner: string, repo: string) {
  const repos = arrayOf(
    new DynamicModel({
      updated: "",
      stars_per_day: "",
    })
  );
  $app
    .dao()
    .db()
    .select("repo.updated")
    .from("repo")
    .where($dbx.exp("LOWER(owner) = {:owner}", { owner: owner.toLowerCase() }))
    .andWhere($dbx.exp("LOWER(repo) = {:repo}", { repo: repo.toLowerCase() }))
    .limit(1)
    .all(repos);
  return repos.length > 0;
}

/**
 * Get entire repo and all its data
 * @param owner
 * @param repo
 * @returns
 */
export function getRepo(owner: string, repo: string): DynamicModel | null {
  const repos = arrayOf(
    new DynamicModel({
      id: "",
      updated: "",
      created: "",
      owner: "",
      repo: "",
      stars_per_day: "",
    })
  );
  $app
    .dao()
    .db()
    .select("repo.*")
    .from("repo")
    .where($dbx.exp("LOWER(owner) = {:owner}", { owner: owner.toLowerCase() }))
    .andWhere($dbx.exp("LOWER(repo) = {:repo}", { repo: repo.toLowerCase() }))
    .all(repos);
  if (repos.length === 0) {
    return null;
  }
  const retRepo = repos[0] as Repo & {
    stars_per_day: string;
    updated: string;
    created: string;
  };

  let stars_per_day = JSON.parse(retRepo.stars_per_day);
  if (stars_per_day === null) {
    stars_per_day = [];
  }
  stars_per_day = stars_per_day.map((x: any) => ({
    date: convertDate(x.date),
    stars: x.stars,
  }));
  return {
    ...retRepo,
    stars_per_day,
    updated: convertDate(retRepo.updated),
    created: convertDate(retRepo.created),
  };
}

export function createRepo(owner: string, repo: string) {
  const collection = $app.dao().findCollectionByNameOrId("repo");
  const record = new Record(collection, {
    // bulk load the record data during initialization
    owner: owner,
    repo: repo,
    stars_per_day: [],
  });
  $app.dao().saveRecord(record);
}

export function convertDate(pbDate: string): Date {
  return new Date(pbDate.replace(" ", "T"));
}

/**
 * Date to string in the format "YYYY-MM-DD"
 * @param date
 * @returns
 */
export function dateToDayString(date: Date): string {
  return date.toISOString().split("T")[0];
}

// export function merge
