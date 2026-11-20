# AI Usage

We used an AI coding assistant (Claude Code) during the hackathon. This file explains what it did and what the team did.

## Decided by the team

- **Idea:** a live map of Madrid's Cercanías trains with delays.
- **Data source:** Renfe's official open data (GTFS-Realtime, CC BY 4.0).
- **Cloud architecture and services:**
  - S3 + CloudFront for the frontend
  - Route 53 and AWS Certificate Manager for the domain and HTTPS
  - API Gateway + Lambda for the backend
  - EventBridge for scheduled fetching
  - DynamoDB for storage
  - all running in the eu-south-2 (Spain) region
- **Tools:** React for the frontend, Terraform for the infrastructure, GitHub with GitHub Actions for CI/CD.
- **Workflow:** branches, pull requests and a protected `main` branch.
- **Product decisions:** the features, the fetch frequency, the UI design, and the domain (`my-cercanias.valentin-cloud.com`).

## Done with AI

- **Code:** wrote most of the application code, based on the team's decisions:
  - the React frontend and map
  - the Python Lambdas that fetch, parse and serve the train data
  - the Terraform for the infrastructure
  - the GitHub Actions pipeline
- **Debugging:** helped find and fix problems such as the GitHub to AWS authentication, empty responses from the Renfe feed, and the map tiles that required an API key.
- **Options:** suggested options for implementation details (for example the map library and how to calculate delays). The team chose between them.
- **Documentation:** helped write the README and this file.

## Review

The team reviewed every change before merging, through pull requests on GitHub.
