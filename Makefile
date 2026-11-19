.PHONY: build deploy destroy

build:
	cd frontend && npm install && npm run build

deploy: build
	cd terraform && terraform init && terraform apply

destroy:
	cd terraform && terraform destroy
