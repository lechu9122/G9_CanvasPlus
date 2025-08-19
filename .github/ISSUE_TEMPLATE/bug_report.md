---
name: Bug report
about: Create a report to help us improve
title: ''
labels: ''
assignees: ''

---

name: "Bug report"
description: "Report a bug — please include steps to reproduce, expected vs actual behaviour, and any logs or screenshots."
title: "Bug: {short_summary}"
labels: ["bug"]
body:
  - type: input
    id: short_summary
    attributes:
      label: "Short summary"
      description: "One-line summary of the bug (required)."
      placeholder: "E.g. Save button throws NullPointerException"
      required: true

  - type: textarea
    id: steps_to_reproduce
    attributes:
      label: "Steps to reproduce"
      description: "List the exact steps to reproduce the issue (required)."
      placeholder: "1. Do X\n2. Do Y\n3. Observe Z"
      required: true

  - type: textarea
    id: expected_behavior
    attributes:
      label: "Expected behavior"
      description: "What you expected to happen."

  - type: textarea
    id: actual_behavior
    attributes:
      label: "Actual behavior"
      description: "What actually happened (include error messages if any)."

  - type: dropdown
    id: severity
    attributes:
      label: "Severity"
      description: "How badly does this affect users?"
      options:
        - "Critical (blocks core functionality)"
        - "High (major functionality broken)"
        - "Medium (minor functionality broken)"
        - "Low (cosmetic/edge case)"

  - type: input
    id: environment
    attributes:
      label: "Environment (OS, version, browser, commit SHA)"
      placeholder: "e.g. Windows 10, v1.3.2, commit abc123"

  - type: checkboxes
    id: attachments
    attributes:
      label: "Attachments"
      options:
        - "Logs"
        - "Screenshot"
        - "Test case"
        - "None"

  - type: textarea
    id: additional_info
    attributes:
      label: "Additional information"
      description: "Anything else that might help diagnose the problem."
