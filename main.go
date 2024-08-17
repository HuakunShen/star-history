package main

import (
	"log"
	"net/http"
	"os"
	"time"

	gql "github.com/HuakunShen/star-history/graphql"
	"github.com/joho/godotenv"
	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

func main() {
	app := pocketbase.New()
	err := godotenv.Load()
	if err != nil {
		panic(err)
	}
	githubToken := os.Getenv("GITHUB_TOKEN")
	// serves static files from the provided public dir (if exists)
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		e.Router.GET("/star-history/:owner/:repo", func(c echo.Context) error {
			owner := c.PathParam("owner")
			repo := c.PathParam("repo")
			since := time.Date(2022, 1, 1, 0, 0, 0, 0, time.UTC)
			starCounts, err := gql.GetStarHistory(owner, repo, githubToken, &since, 0)
			if err != nil {
				log.Fatal(err)
			}
			return c.JSON(http.StatusOK, starCounts)
		})
		// e.Router.GET("/star-history/:", apis.StaticDirectoryHandler(os.DirFS("./pb_public"), false))
		return nil
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
