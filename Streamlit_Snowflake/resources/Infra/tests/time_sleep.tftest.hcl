variables {
  app_name = "streamlit-test"
}

run "verify_time_sleep" {
  command = plan
  
  assert {
    condition     = time_sleep.wait_20_seconds.create_duration == "20s"
    error_message = "Time sleep duration should be 20 seconds"
  }
}