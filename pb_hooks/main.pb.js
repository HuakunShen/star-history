/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/exp", (c) => {
  const utils = require(`${__hooks}/index.cjs`);
  const data = utils.getStarsEarnedPerDay(
    "CrossCopy",
    "tauri-plugin-clipboard",
    $os.getenv("GITHUB_TOKEN"),
    null
  );
  return c.json(200, data);
});

/**
 * Sample: https://127.0.0.1:8090/star-history/crosscopy/tauri-plugin-clipboard
 */
routerAdd("GET", "/star-history/:owner/:repo", (c) => {
  const gh_token = c.queryParam("github_token");
  const owner = c.pathParam("owner").toLowerCase();
  const repo = c.pathParam("repo").toLowerCase();
  const utils = require(`${__hooks}/index.cjs`);

  return utils.handleStarHistory(owner, repo, c, gh_token);
});

onModelAfterUpdate((e) => {
  console.log(e.model.tableName());
  console.log(e.model.id);
}, "repos");
