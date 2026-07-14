## Development Guide

### Installation

### Prerequisites
- Rocket.Chat Server (v8 or higher)
- Rocket.Chat Apps CLI (`@rocket.chat/apps-cli`)

### Development Setup

1. **Install the CLI** (if not already installed):
   ```sh
   npm install -g @rocket.chat/apps-cli
   ```

2. **Clone the repository**:
   ```sh
   git clone https://github.com/<yourusername>/JiraIntegrationApp_GSoC2026
   cd JiraIntegrationApp_GSoC2026
   ```

3. **Install dependencies**:
   ```sh
   npm install
   ```

4. **Deploy the app**:
   ```sh
   rc-apps deploy --url <rocketchat_url> --username <username> --password <password>
   ```