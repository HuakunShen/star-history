/// <reference path="../pb_data/types.d.ts" />

/**
 * Sample: https://127.0.0.1:8090/star-history/crosscopy/tauri-plugin-clipboard
 */
routerAdd("GET", "/star-history/:owner/:repo", (c) => {
  const gh_token = c.queryParam("github_token");
  const owner = c.pathParam("owner");
  const repo = c.pathParam("repo");
  const utils = require(`${__hooks}/index.cjs`);

  // check if repo in database
  let since = new Date();
  let existingData = [];
  let dbRepo = utils.getRepo(owner, repo);
  if (dbRepo) {
    if (dbRepo.stars_per_day !== null) {
      // has repo, has data
      existingData = dbRepo.stars_per_day ? dbRepo.stars_per_day : [];
      since = dbRepo.updated;
    } else {
      // has repo, no data
      since = null; // get all data
    }
  } else {
    // no repo, then create repo first
    utils.createRepo(owner, repo);
    dbRepo = utils.getRepo(owner, repo);
    if (!dbRepo) {
      return c.json(500, { error: "Unexpected Error: Error creating repo" });
    }
    since = null; // get all data
  }
  // if since is not null and it's today, then return existingData
  if (
    since &&
    utils.dateToDayString(since) === utils.dateToDayString(new Date())
  ) {
    $app.logger().info("Cache hit fully, return existing data");
    // return c.json(200, utils.starsPerDayToCumulative(existingData)); // TODO: uncomment this
  }

  // fetch data
  const env_token = $os.getenv("GITHUB_TOKEN");
  if (!env_token || env_token.length === 0) {
    return c.json(400, { error: "GITHUB_TOKEN is not set" });
  }
  const token = gh_token ? gh_token : env_token;
  const data = utils.getStarsEarnedPerDay(owner, repo, token, since);
  // if last date is today, remove it
  const lastestExistingDate =
    existingData.length > 0 ? existingData[existingData.length - 1].date : null;
  const now = new Date();

  if (
    lastestExistingDate &&
    utils.dateToDayString(lastestExistingDate) === utils.dateToDayString(now)
  ) {
    data.pop();
  }

  // merge data with existingData, existingData should be older, also remove duplicates. both should be sorted
  $app.logger().debug({
    existingData,
    newData: data,
  });
  const originalExistingDataLength = existingData.length;
  if (
    lastestExistingDate &&
    data.length &&
    lastestExistingDate > data[0].date
  ) {
    // if latest existingData is newer than oldest new data, then merge them
    const overlapIndex = existingData.findIndex(
      (item) =>
        utils.dateToDayString(item.date) === utils.dateToDayString(data[0].date)
    );
    if (overlapIndex > -1) {
      // truncate existingData from overlapIndex forward
      existingData = existingData.slice(overlapIndex);
    }
  }

  const concatData = [...existingData, ...data];
  $app.logger().info({
    "Existing Data": originalExistingDataLength,
    "New Data": data.length,
    "Merged Data": concatData.length,
  });
  const dbRepoMod = $app.dao().findRecordById("repo", dbRepo.id);
  dbRepoMod.set("stars_per_day", JSON.stringify(concatData));
  $app.dao().saveRecord(dbRepoMod);
  return c.json(200, utils.starsPerDayToCumulative(concatData));
});

onModelAfterUpdate((e) => {
  console.log("user updated...", e.model.get("email"));
}, "users");
