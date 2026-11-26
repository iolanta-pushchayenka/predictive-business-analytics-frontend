## Getting Started

### Prerequisites

- Node.js
- npm

### Local Setup

1. Clone the repository and navigate to the project directory:

```bash
git clone https://github.com/iolanta-pushchayenka/predictive-business-analytics-frontend.git
cd predictive-business-analytics-frontend
```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Create a `.env.local` file in the project root using `.env.example` as a template.

    ```dotenv
    VITE_API_URL=https://predictive-business-analytics-backend.onrender.com
    ```

4. Start the development server:

    ```bash
    npm run dev
    ```

5. Open the local URL displayed in the terminal.

The frontend communicates with the deployed backend API through the `VITE_API_URL` environment variable.

### Testing and Build

Run tests:

```bash
npm test -- --run
```

Run linting:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

### Front-End Documentation

The Front-End Architecture is documented in the [`docs/`](./docs/) directory.
