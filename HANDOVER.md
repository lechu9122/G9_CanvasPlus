# Handover Notes

This document contains important information for the next team continuing development on the CanvasPlus project.

## Project Overview

- Developed as part of the University of Auckland SOFTENG 310 course.
- The project will be continued in Assignment 2 (A2) with further enhancements.

## Environment Setup

- Please refer to `client/.env.example` and `server/.env.example` for environment variable placeholders.
- Create `.env` files in both `client` and `server` directories with the required secret keys and configuration values before running the project.

## Completed Features

- **Canvas API Integration:** Basic import of To-Do items from Canvas.
- **Customisable Homepage UI:** User interface allowing personalisation of the dashboard.
- **AI Integration:** Basic prompt-completion for task prioritisation using OpenAI.

## Planned Features for Assignment 2

- Notifications and reminders for upcoming tasks and events.
- App connections (CanvasAPI)
- Mobile compatibility improvements.
- Additional widgets such as Weather, Time, and other utilities.

NB: CanvasAPI can be acquired by creating a personal account using CANVAS, we cannot access to APIs with our student account.

## Tools and Integrations

- **SonarLint/SonarCloud:** Static code analysis integrated for maintaining code quality.
- **Snyk:** Vulnerability scanning to ensure security of dependencies.

## GitHub Workflow Reminders

- Create a separate branch for each feature or fix.
- Open pull requests (PRs) for all changes.
- Conduct peer reviews before merging.
- Use squash merge to keep commit history clean.
- Document all discussions and decisions in issues or PR comments.

Please ensure to follow these guidelines to maintain project consistency and quality.
