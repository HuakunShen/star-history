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
) {
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
      last.count++;
    } else {
      acc.push({ date: day, count: 1 });
    }
    return acc;
  }, [] as { date: Date; count: number }[]);
  return starCounts;
}

export function getStarHistory(
  owner: string,
  name: string,
  githubToken: string,
  options?: {
    since: Date | null;
    baseStars: number;
  }
): { date: Date; count: number }[] {
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

  let cumulativeStarCounts = starCounts.reduce((acc, { date, count }) => {
    const last = acc[acc.length - 1];
    const lastCount = last?.count ?? 0;
    acc.push({ date, count: lastCount + count });
    return acc;
  }, [] as { date: Date; count: number }[]);
  if (options.baseStars > 0) {
    cumulativeStarCounts = cumulativeStarCounts.map(({ date, count }) => ({
      date,
      count: count + options.baseStars,
    }));
  }
  return cumulativeStarCounts;
}
