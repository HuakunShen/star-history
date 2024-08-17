/// <reference path="../pb_data/types.d.ts" />
/**
 * Sample: https://127.0.0.1:8090/star-history/crosscopy/tauri-plugin-clipboard
 */
routerAdd("GET", "/star-history/:username/:repo", (c) => {
  const gh_token = c.queryParam("github_token");
  const username = c.pathParam("username");
  const repo = c.pathParam("repo");
  const utils = require(`${__hooks}/index.cjs`);
  const env_token = $os.getenv("GITHUB_TOKEN");
  if (!env_token || env_token.length === 0) {
    return c.json(400, { error: "GITHUB_TOKEN is not set" });
  }
  const token = gh_token ? gh_token : env_token;
  const data = utils.getStarHistory(username, repo, token);
  return c.json(200, data);
});

onModelAfterUpdate((e) => {
  console.log("user updated...", e.model.get("email"));
}, "users");
