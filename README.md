# Telegram Link Shortener Bot

![Telegram Link Shortener Bot](bot.png)

Welcome to the Telegram Link Shortener Bot project! This bot allows users to shorten URLs using a simple command. It's built with Node.js, the Telegram Bot API, and MongoDB for data storage.

## Getting Started

1. Clone this repository: `git clone https://github.com/softmuneeb/telegram-link-shortener-bot.git`
2. Install dependencies: `npm install`
3. Set up environment variables: Create a `.env` file in the project root and provide your Telegram Bot Token, MongoDB credentials, and other necessary settings.
4. Start the bot: `npm start`

## Commands

- `/start`: Get a friendly greeting and command list.
- `/shorten [url]`: Shorten a URL.
- `/mylinks`: View your shortened links.
- `/deleteallmylinks`: Delete all your shortened links.

## Technology Stack

- Node.js
- MongoDB
- Telegram Bot API
- Shortid library

## Contributing

If you're interested in contributing to this project, please read the [Contributing Guidelines](CONTRIBUTING.md) to get started.

## License

This project is licensed under the [MIT License](LICENSE).
