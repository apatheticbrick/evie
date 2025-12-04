# Overview

This program is a way to organize to-do lists and tasks with the added accountability of messaging your friends (or people of your choice) on Discord whenever you begin or complete a task.

## Features

- Create, edit, and complete tasks
- Track time spent on each task
- **Recurring tasks** - Set tasks to repeat at custom intervals
- Discord notifications for task creation and completion
- Automatic Discord reminders for recurring tasks (via cron job)
- View completed tasks history
- Local storage persistence
- Keyboard shortcuts for quick actions
- Testing with Jest

## Tech Stack

- **Frontend**: Next.js 15.5.2 (App Router), React 19
- **Styling**: Custom CSS with Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Discord Integration**: @discordjs/rest
- **Language**: TypeScript

## Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Discord bot with proper permissions

### Setup

1. **Clone the repository**
   ```bash
   gh repo clone apatheticbrick/evie
   cd evie
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DISCORD_BOT_TOKEN=your_bot_token_here
   CHANNEL=your_channel_id_here
   ```

   To get these values:
   - **Bot Token**: Create a bot at [Discord Developer Portal](https://discord.com/developers/applications)
   - **Channel ID**: Enable Developer Mode in Discord, right-click a channel → Copy ID

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Keyboard Shortcuts

- `Ctrl+N` - Create new task
- `Ctrl+Enter` - Save task (when modal is open)
- `Esc` - Close modal/cancel action
- `Enter` - Confirm dialog action

### Creating Tasks

1. Click "Add a New Task" or press `Ctrl+N`
2. Enter a title (required, max 100 characters)
3. Optionally add a description
4. **For recurring tasks**: Check "Make this task recurring" and set the interval in days
5. Click "Save" or press `Ctrl+Enter`

### Managing Tasks

- **Edit**: Click anywhere on a task card
- **Complete**: Click the "Complete" button (or "Check Off" for recurring tasks)
- **View Completed**: Click the "Completed Tasks" header to expand/collapse
- **Uncomplete**: Click "Uncomplete" on a completed task

### Recurring Tasks

Recurring tasks work differently from one-time tasks:

- **Check Off**: Instead of completing, recurring tasks can be "checked off" for the current interval
- **Stay Active**: Checked-off recurring tasks stay in your current tasks list but appear grayed out
- **Auto-Reset**: Tasks automatically become active again when their interval expires
- **Cancel Recurring**: Use the "Cancel Recurring" button to convert a recurring task to a one-time task
- **Edit Frequency**: Change the recurrence interval in the edit modal
- **Discord Reminders**: The cron job sends Discord notifications when recurring tasks are due (runs daily at midnight)

**Note**: Recurring tasks are synced to the server so the cron job can send reminders even when the app isn't open.

### Discord Notifications

The app automatically sends Discord messages when you:
- Create a new task
- Complete a task
- Check off a recurring task
- Uncomplete a task

Additionally, recurring tasks receive automatic Discord reminders when they're due (via the cron job configured in `vercel.json`).

## Project Structure

```
evie/
│   app/
│   ├── api/
│   │   ├── cron/
│   │   │   └── route.ts          # Cron job for recurring task reminders
│   │   ├── sendMessage/
│   │   │   └── route.ts          # Discord API endpoint
│   │   └── tasks/
│   │       └── route.ts          # Task sync API endpoint
│   ├── components/
│   │   ├── taskcard.tsx            # Task card component
│   │   └── toast.tsx              # Toast notifications
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                   # Main app component
│   ├── page.css                   # Component styles
│   └── globals.css                # Global styles
├── __tests__/                     # Test files
│   ├── api/                       # API route tests
│   ├── Task.test.ts               # Task class tests
│   └── recurring-tasks.test.ts    # Recurring task logic tests
├── .env                           # Environment variables (not tracked)
├── jest.config.js                 # Jest configuration
├── jest.setup.js                  # Jest setup file
├── next.config.ts                 # Next.js configuration
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript configuration
└── vercel.json                    # Vercel deployment config (cron schedule)
```

## Data Storage

Tasks are stored in the browser's `localStorage` with two keys:
- `tasks` - Active tasks
- `completedTasks` - Completed tasks

**Note**: Data is stored locally and will be lost if you clear browser data.

## API Endpoints

### POST /api/sendMessage

Sends a message to the configured Discord channel.

**Request Body:**
```json
{
  "message": "Your message here"
}
```

**Response:**
```json
{
  "ok": true
}
```

**Error Responses:**
- `400` - Missing message body
- `500` - Server configuration error or Discord API error

### GET /api/cron

Cron job endpoint that checks for recurring tasks due for reminders. Automatically called by Vercel cron (configured in `vercel.json`).

**Response:**
```json
{
  "ok": true,
  "pingsSent": 2
}
```

### GET /api/tasks

Retrieves all recurring tasks from server storage.

**Response:**
```json
{
  "tasks": [...]
}
```

### POST /api/tasks

Syncs recurring tasks from client to server storage.

**Request Body:**
```json
{
  "tasks": [...]
}
```

### PUT /api/tasks

Updates a task's lastPingTimestamp.

**Request Body:**
```json
{
  "taskId": 123,
  "lastPingTimestamp": 1234567890
}
```

## Development

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

### Linting

```bash
npm run lint
```

### Testing

Run the test suite with Jest:

```bash
npm test
```

The test suite includes:
- Task class functionality
- Recurring task logic and calculations
- API route handlers (cron, tasks, sendMessage)
- Edge cases and error handling

Tests are located in the `__tests__/` directory.

## Configuration

The app uses Next.js configuration to ignore TypeScript and ESLint errors during builds (see `next.config.ts`). This is useful for rapid development but should be addressed for production deployments.

## Troubleshooting

### Discord messages not sending

1. Verify your bot token is correct in `.env`
2. Ensure the bot has "Send Messages" permission in the channel
3. Check the bot is added to your server
4. Verify the channel ID is correct

## Known Bugs/limitations

- Some visual weirdness with the toast animation and formatting
- Data is stored locally (no cloud sync), meaning cross-platform is currently impossible
- No authentification
- Single Discord channel per deployment, different users can't send to different discord servers/channels, or one user can't choose which channel to send to
- Discord messages are hardcoded to include Evie's name which is probably bad
- Recurring task storage uses file system (`/tmp`), which is ephemeral in serverless environments - consider using a database for production

## Future Enhancements

- Database integration for persistent storage
- User authentication and multi-user support
- Task categories and tags (?)
- Mobile support
- Task sharing and collaboration (?)

## License

idk do whatever u want with this ig