# Copyright Amazon.com, Inc. or its affiliates. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

terraform {
  backend "s3" {
    region = "us-east-1"
    bucket = "aft-tf-backend-746669218362"
    key    = "aft-setup.tfstate"
  }
}
