variables {
  app_name = "streamlit-test"
}

run "verify_s3_resources" {
  command = plan
  
  assert {
    condition     = random_string.streamlit_s3_bucket.length == 4
    error_message = "Random string for S3 bucket should be configured with length 4"
  }
  
  assert {
    condition     = random_string.streamlit_s3_bucket.special == false
    error_message = "Random string for S3 bucket should not include special characters"
  }
  
  assert {
    condition     = random_string.streamlit_s3_bucket.upper == false
    error_message = "Random string for S3 bucket should not include uppercase characters"
  }
}