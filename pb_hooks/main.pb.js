/// <reference path="../pb_data/types.d.ts" />

// routerAdd("GET", "/hello/{name}", (e) => {
//   let name = e.request.pathValue("name")

//   return e.json(200, { "message": "Hello " + name })
// })

// onRecordAfterUpdateSuccess((e) => {
//   console.log("user updated...", e.record.get("email"))

//   e.next()
// }, "users")

// routerAdd("GET", "/api/hello/{name}", (e) => {
//   let name = e.request.pathValue("name");
//   return e.json(200, { message: "Hello " + name });
// });

routerAdd("GET", "/api/exp", (e) => {
  // return e.json(200, { message: "Hello " });
  const utils = require(`${__hooks}/index.cjs`);
  const data = utils.getStarsEarnedPerDay(
    "CrossCopy",
    "tauri-plugin-clipboard",
    $os.getenv("GITHUB_TOKEN"),
    null
  );
  return e.json(200, data);
});

// routerAdd("GET", "/hello/star-history/{owner}/{repo}", (e) => {
//   let owner = e.request.pathValue("owner");
//   let repo = e.request.pathValue("repo");
//   return e.json(200, { message: "Hello " + owner + " " + repo });
// });

/**
 * Sample: https://127.0.0.1:8090/star-history/crosscopy/tauri-plugin-clipboard
 */
routerAdd("GET", "/api/star-history/{owner}/{repo}", (e) => {
  // const gh_token = c.queryParam("github_token");
  console.log("get star history");
  const gh_token = $os.getenv("GITHUB_TOKEN");

  // const provider = c.pathParam("provider").toLowerCase();
  const owner = e.request.pathValue("owner").toLowerCase();
  const repo = e.request.pathValue("repo").toLowerCase();
  console.log("gh_token", gh_token);
  console.log("owner", owner);
  console.log("repo", repo);
  $app.logger().info(`Star History Request: owner: ${owner}, repo: ${repo}`);
  const utils = require(`${__hooks}/index.cjs`);
  return utils.handleStarHistory(owner, repo, e, gh_token);
});

// onRecordAfterUpdateSuccess((e) => {
//   console.log("user updated...", e.record.get("email"));

//   e.next();
// }, "users");

// // onModelAfterUpdate((e) => {
// //   console.log(e.model.tableName());
// //   console.log(e.model.id);
// // }, "repos");
// onRecordAfterUpdateSuccess((e) => {
//   console.log("user updated...", e.record?.get("email"));
//   e.next();
// }, "users");
