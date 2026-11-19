<p align="center">
  <img src="frontend/public/logo.png" alt="MyCercanías logo" width="120" />
</p>

<h1 align="center">MyCercanías</h1>

<p align="center"><b>Madrid commuter trains, live.</b><br/>
<a href="https://my-cercanias.valentin-cloud.com">my-cercanias.valentin-cloud.com</a></p>

---

## What it does

MyCercanías is a web app for people in Madrid who use **Cercanías** trains. It shows a live map with:

- **Where every train is right now**, on every line (C1, C2, C3…)
- **How late each train is**
- How recently the data was updated

The data comes from Renfe's open real-time feed and refreshes every minute.

**Why now?** Cercanías workers are on strike, so services are cancelled and delayed all the time. Timetables can't be trusted, and MyCercanías shows what is actually running so you can plan your trip.

## Infrastructure (AWS)



Infrastructure runs in `eu-south-2` (Spain), close to the users.

- **Availability**: everything is managed and serverless (CloudFront, S3, Lambda, DynamoDB), so there are no servers to go down. AWS runs it across several data centers.
- **Scalability**: CloudFront caches the site around the world. Lambda and DynamoDB (on-demand) scale up on their own when lots of people check the trains at once.
- **Security**: HTTPS only, with a certificate from ACM. The S3 bucket is private and only CloudFront can read it. Each Lambda can only do what it needs (fetcher writes, api reads). API Gateway has rate limits. GitHub Actions gets into AWS through OIDC, so no AWS keys are stored anywhere.
- **Cost optimization**: pay-per-use everywhere. No idle servers, DynamoDB is on-demand, old data is deleted automatically (TTL), logs are kept for a short time, and CloudFront uses the cheapest price class.

## Terraform

All the infrastructure is written as code with **Terraform** in the [terraform/](terraform/) folder. Nobody clicks around in the AWS console: the whole setup can be created, changed or rebuilt with one command, and every change is reviewed in Git like normal code.

## CI/CD pipeline

The pipeline ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) is what lets a team work on the app together safely:

1. Each person works on their own branch and opens a Pull Request.
2. The pipeline builds the frontend, checks the Lambda code and shows the **Terraform plan**, so the team can see exactly what will change before merging.
3. When the PR is merged into `main`, the pipeline deploys automatically. It's live in about 2 minutes.

Nobody needs AWS access on their laptop, nobody deploys by hand, and two deploys never run at the same time.

## Technologies

| Part | Tech |
|---|---|
| **Frontend** | React + Vite, Leaflet (map) |
| **Backend** | Python 3.12 on AWS Lambda, DynamoDB |
| **Infrastructure** | Terraform, AWS (CloudFront, S3, API Gateway, EventBridge, Route 53, ACM) |
| **CI/CD** | GitHub Actions |

## Getting started

```sh
git clone git@github.com:ValentinBanobreKalinowski/MyCercanias.git
cd MyCercanias/frontend && npm install
npm run dev
```

`/api` is proxied to the deployed site, so you don't need AWS to work on the frontend.

## Deploying your own copy

Running your own MyCercanías is not just "clone and go". The code is set up for our account and domain, so you would need:

- **Your own AWS account**, with the `eu-south-2` (Spain) region turned on (it's opt-in)
- **Your own domain name**, with a hosted zone in Route 53
- To change the domain, project name and GitHub repo in the Terraform variables
- To run the one-time setup in [terraform/bootstrap/](terraform/bootstrap/) to create the Terraform state bucket and the GitHub deploy roles
- To set up your GitHub repo with those role ARNs (`AWS_DEPLOY_ROLE_ARN`, `AWS_PLAN_ROLE_ARN`) so the pipeline can deploy
- Terraform, Node and the AWS CLI installed on your machine

It can be done, but it takes some AWS knowledge and setup first.
