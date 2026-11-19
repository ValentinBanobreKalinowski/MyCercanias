# MyMadrid

React frontend on S3 + CloudFront, Python Lambdas behind API Gateway, data in DynamoDB. Runs in `eu-south-2` (Spain).

```
frontend/     React app (Vite)
terraform/    all infra + lambda code (terraform/lambdas/)
```

## Architecture

- `https://mi-cercanias.valentin-cloud.com` → Route 53 alias → CloudFront (`valentin-cloud.com` and `www` redirect there)
- CloudFront `/*` → S3 bucket (private, OAC)
- CloudFront `/api/*` → API Gateway (HTTP API) → `api` Lambda → DynamoDB
- EventBridge every 1 min → `fetcher` Lambda (fetches every 30s) → DynamoDB
- TLS cert from ACM (us-east-1, required by CloudFront), validated through Route 53

## Requirements

- Terraform >= 1.6, Node 20+, AWS CLI configured
- `eu-south-2` enabled in the account (it's an opt-in region)
- Hosted zone for `valentin-cloud.com` in Route 53 (created automatically when you bought the domain)

## Deploy

```sh
make deploy
```

Same as:

```sh
cd frontend && npm install && npm run build
cd ../terraform && terraform init && terraform apply
```

First apply takes ~5-10 min (cert validation + CloudFront). Then open https://mi-cercanias.valentin-cloud.com.

Build the frontend before applying, terraform uploads whatever is in `frontend/dist`.

## Working on the code

You don't need AWS access. GitHub Actions deploys everything.

```sh
git clone git@github.com:ValentinBanobreKalinowski/MyCercanias.git
cd MyCercanias/frontend && npm install
```

1. `git checkout -b my-change`
2. Edit `frontend/src/` or `terraform/lambdas/`
3. Push and open a PR. CI builds it and shows the terraform plan.
4. Merge, and it's live in ~2 min.

Don't push straight to `main`, and don't run `terraform apply` locally.

## Local dev

```sh
cd frontend && npm run dev
```

`/api` gets proxied to the deployed site.

## Test the fetcher manually

```sh
aws lambda invoke --region eu-south-2 --function-name mymadrid-fetcher /dev/stdout
curl https://mi-cercanias.valentin-cloud.com/api/trains
```
