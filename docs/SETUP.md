# Setup Guide

This guide is for Post installation of this app.


### Enabling OAuth 2.0 3LO

Before you can implement OAuth 2.0 (3LO) for your app, you need to enable it for your app using the [developer console.](https://developer.atlassian.com/console/myapps/)

1. From any page on [developer.atlassian.com](https://developer.atlassian.com/), select your profile icon in the top-right corner, and from the dropdown, select Developer console.
2. Select your app from the list (or create one if you don't already have one).
3. Select Authorization in the left menu.
4. Next to OAuth 2.0 (3LO), select Configure.
5. Enter the Callback URL (from the application details copy url in GET callback). Set this to any URL that is accessible by your app. When you implement OAuth 2.0 (3LO) in your app, the redirect_uri must match this URL.
6. Click Save changes.

**Note, if you haven't already added an API to your app, you should do this now:**

1. Select Permissions in the left menu.
2. Next to the API you want to add, select Add.

**Following Permissions are necessary**
1. read:me
2. read:account
3. read:jira-work
4. read:jira-user
5. write:jira-work
6. manage:jira-webhook

---

### Configuring Rocket.Chat App Settings

To connect this app with the Jira, follow these steps:

1. Go to Marketplace -> Installed / Private Apps(in case of Development) -> Click Jira.
2. Click on Settings.
3. Paste clientID, clientSecret generated from the Atlassian Developer Console and paste your Jira Cloud URL
4. Click Save changes.