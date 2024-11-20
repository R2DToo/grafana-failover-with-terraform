terraform {
   required_providers {
      grafana = {
         source  = "grafana/grafana"
         version = ">= 2.9.0"
      }
   }
}

provider "grafana" {
  alias = "stack"

  url  = "https://nfletcher.grafana.net/"
  auth = "<SERVICE_ACCOUNT_TOKEN>"
}

// Terraform Master Folder

resource "grafana_folder" "terraformFolder" {
  provider = grafana.stack

  title = "Terraform"
}

// _Client Dashboard Use Cases

resource "grafana_folder" "clientDashboardUseCasesFolder" {
  provider = grafana.stack

  parent_folder_uid = grafana_folder.terraformFolder.uid
  title = "_Client Dashboard Use Cases"
}

resource "grafana_folder" "pollardClientFolder" {
  provider = grafana.stack

  parent_folder_uid = grafana_folder.clientDashboardUseCasesFolder.uid
  title = "Pollard"
}

// AppDynamics

resource "grafana_folder" "appDynamicsFolder" {
  provider = grafana.stack

  parent_folder_uid = grafana_folder.terraformFolder.uid
  title = "AppDynamics"
}

resource "grafana_dashboard" "appDynamicsDashboards" {
  provider = grafana.stack

  for_each    = fileset("${path.module}/dashboards/AppDynamics", "*.json")
  config_json = file("${path.module}/dashboards/AppDynamics/${each.key}")
  folder      = grafana_folder.appDynamicsFolder.id
}

// Multi-Source Demo

resource "grafana_folder" "multiSourceFolder" {
  provider = grafana.stack

  parent_folder_uid = grafana_folder.terraformFolder.uid
  title = "Multi-Source Demo"
}

resource "grafana_dashboard" "multiSourceDashboards" {
  provider = grafana.stack

  for_each    = fileset("${path.module}/dashboards/Multi-Source Demo", "*.json")
  config_json = file("${path.module}/dashboards/Multi-Source Demo/${each.key}")
  folder      = grafana_folder.multiSourceFolder.id
}