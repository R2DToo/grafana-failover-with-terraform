# Getting Started

To use this utility, you must use the terraform.exe file to perform on your specified Grafana Instance.

First, you must have the URL of the Grafana Instance and a token created from a Service Account.

First, you must initialize the Terraform project:

```
terraform init
```

Then, you must plan the Terraform project. This will let you know how many additions, updates, and deletions will take place. It will also let you know of any errors:

```
terraform plan
```

Finally, you can apply the Terraform project so that the planned changes will take effect:

```
terraform apply
```