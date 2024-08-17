package graphql

import (
	"context"
	"sort"
	"time"

	"github.com/machinebox/graphql"
)

type StargazerEdge struct {
	StarredAt string `json:"starredAt"`
}

type PageInfo struct {
	StartCursor     string `json:"startCursor"`
	HasPreviousPage bool   `json:"hasPreviousPage"`
}

type Stargazers struct {
	Edges    []StargazerEdge `json:"edges"`
	PageInfo PageInfo        `json:"pageInfo"`
}

type Repository struct {
	Stargazers Stargazers `json:"stargazers"`
}

type QueryResponse struct {
	Repository Repository `json:"repository"`
}

type StarCount struct {
	Date  time.Time `json:"date"`
	Count int       `json:"count"`
}

func GetStarsEarnedPerDay(owner string, name string, githubToken string, since *time.Time) ([]struct {
	Date  time.Time
	Count int
}, error) {
	client := graphql.NewClient("https://api.github.com/graphql")
	hasPreviousPage := true
	startCursor := ""
	var allDates []time.Time

	for hasPreviousPage {
		req := graphql.NewRequest(`
            query ($owner: String!, $name: String!, $last: Int, $before: String) {
                repository(owner: $owner, name: $name) {
                    stargazers(last: $last, before: $before) {
                        edges {
                            starredAt
                        }
                        pageInfo {
                            startCursor
                            hasPreviousPage
                        }
                    }
                }
            }
        `)
		req.Header.Set("Authorization", "Bearer "+githubToken)
		req.Header.Set("User-Agent", "github-graphql")
		req.Var("owner", owner)
		req.Var("name", name)
		req.Var("last", 100)
		req.Var("before", startCursor)

		var resp QueryResponse
		if err := client.Run(context.Background(), req, &resp); err != nil {
			return nil, err
		}

		pageInfo := resp.Repository.Stargazers.PageInfo
		startCursor = pageInfo.StartCursor
		hasPreviousPage = pageInfo.HasPreviousPage

		for _, edge := range resp.Repository.Stargazers.Edges {
			date, err := time.Parse(time.RFC3339, edge.StarredAt)
			if err != nil {
				return nil, err
			}
			allDates = append(allDates, date)
		}

		if since != nil {
			if len(resp.Repository.Stargazers.Edges) == 0 || allDates[len(allDates)-1].Before(*since) {
				filteredDates := []time.Time{}
				for _, date := range allDates {
					if !date.Before(*since) {
						filteredDates = append(filteredDates, date)
					}
				}
				allDates = filteredDates
				break
			}
		}
	}

	sort.Slice(allDates, func(i, j int) bool {
		return allDates[i].Before(allDates[j])
	})

	starCounts := []struct {
		Date  time.Time
		Count int
	}{}

	for _, date := range allDates {
		day := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
		if len(starCounts) > 0 && starCounts[len(starCounts)-1].Date.Equal(day) {
			starCounts[len(starCounts)-1].Count++
		} else {
			starCounts = append(starCounts, struct {
				Date  time.Time
				Count int
			}{Date: day, Count: 1})
		}
	}

	return starCounts, nil
}

func GetStarHistory(owner string, name string, githubToken string, since *time.Time, baseStars int) ([]StarCount, error) {
	starCounts, err := GetStarsEarnedPerDay(owner, name, githubToken, since)
	if err != nil {
		return nil, err
	}

	cumulativeStarCounts := []StarCount{}
	for _, starCount := range starCounts {
		lastCount := 0
		if len(cumulativeStarCounts) > 0 {
			lastCount = cumulativeStarCounts[len(cumulativeStarCounts)-1].Count
		}
		cumulativeStarCounts = append(cumulativeStarCounts, StarCount{
			Date:  starCount.Date,
			Count: lastCount + starCount.Count,
		})
	}

	if baseStars > 0 {
		for i := range cumulativeStarCounts {
			cumulativeStarCounts[i].Count += baseStars
		}
	}

	return cumulativeStarCounts, nil
}
