# Jira Integration for Rocket.Chat

A comprehensive Jira integration app for Rocket.Chat that allows users to interact with Jira directly from their chat workspace.

<img alt="image" src="https://res.cloudinary.com/dvj3i9gog/image/upload/v1784050420/integration_mwedcq.png" />

## Features

### Authentication
- **OAuth2 Integration**: Secure login with Jira using OAuth2 flow

### Issue Management
- **Create Issues**: Create Jira issues with project, type, summary, description, priority, assignee, and deadline
- **View My Issues**: Browse all issues assigned to you with detailed information
- **Search Issues**: Advanced search with filters for project, status, issue type, priority, and assignee
- **Issue Details**: View comprehensive issue details including comments, status, and metadata

### Issue Operations
- **Assign Issues**: Assign issues to yourself or other users (by `@username` or `me`)
- **Share Issues**: Share issue details with users (`@username`) or channels (`#channel`)
- **Add Comments**: Add comments to Jira issues directly from Rocket.Chat
- **Set Deadline**: Update issue due dates using natural language (`today`, `tomorrow`) or specific dates
- **Update Status**: Transition issues to different statuses (e.g., "To Do", "In Progress", "Done")

## Available Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `/jira login` | Authenticate with Jira | `/jira login` |
| `/jira create` | Create a new Jira issue (opens modal) | `/jira create` |
| `/jira create <type> <project> <summary>` | Quick create an issue | `/jira create Task PROJ Fix login bug` |
| `/jira assign <issue_key> <assignee>` | Assign an issue to a user | `/jira assign PROJ-123 @user` or `/jira assign PROJ-123 me` |
| `/jira assign` | Open assign modal | `/jira assign` |
| `/jira share <issue_key> <target>` | Share issue with user or channel | `/jira share PROJ-123 @user` or `/jira share PROJ-123 #channel` |
| `/jira set deadline <issue_key> <value>` | Set issue deadline | `/jira set deadline PROJ-123 today` |
| `/jira set status <issue_key> <status>` | Update issue status | `/jira set status PROJ-123 "In Progress"` |
| `/jira issues` | View all the issues of that project | `/jira issues` |
| `/jira issues <issue_key>` | View details of issue with `issue_key` | `/jira issues FRON-23` |



## Documentation
Here are some links to documentation:

- Development Guide: [Click here](docs/DEVELOPMENT.md)
- Setup Guide: [Click Here](docs/SETUP.md)
