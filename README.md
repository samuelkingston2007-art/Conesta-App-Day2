# 🎁 AI Gift Finder & Planner

AI Gift Finder is a premium, dark-themed web application designed to help users find thoughtful, highly tailored gifts for any occasion. It leverages **Llama-3.3** via the **Groq API** to process recipient profiles, interests, budgets, and tones—returning structured, matching gift options that can be instantly saved to a personal checklist dashboard.

## 🚀 Live Demo
**Link**: [https://conesta-app-day2.vercel.app](https://conesta-app-day2.vercel.app)

---

## ✨ Features

*   **🔒 Secure User Authentication**: Full signup and signin system securing user accounts using password hashing (`bcryptjs`) and secure HTTP-Only JWT session cookies (`jsonwebtoken`).
*   **🤖 AI recommendation Concierge**: A questionnaire including Recipient Profile, Occasion selector, Max Budget, Interests, and Tone pills (Practical, Sentimental, Funny, Luxury, Unique).
*   **🧩 Structured Recommendation Deck**: Fetches suggestions from Groq in JSON mode. Displays match scores (e.g. `94% Match`), approximate cost, buying source (e.g. Amazon, Etsy, Steam), and reasons.
*   **💾 End-to-End Planner CRUD**: View saved gifts in a dashboard list, toggle completion checkboxes (`Purchased` vs `Pending`), edit details inline, manually add custom items, and delete records.
*   **🛡️ Safety Guardrails**:
    *   *Payload Limits*: Prevents prompt injection by enforcing character caps on inputs.
    *   *Content Filtering*: Blocks inappropriate keywords and returns a helpful user warning.
    *   *Parser Fallbacks*: Robust regex string cleaning for markdown code blocks and structured mock fallbacks if the API fails or is down.
*   **⚙️ Zero-Config Database**: Works right away without configuration by falling back to a local JSON-file store (`mock_db.json`). Instantly hooks up to MongoDB when `MONGODB_URI` is supplied.

---

## 🛠️ Technology Stack

*   **Framework**: Next.js 16 (App Router)
*   **Runtime**: React 19 / TypeScript 5
*   **AI Engine**: Groq SDK (`llama-3.3-70b-versatile`)
*   **Database**: MongoDB / Mongoose (with local JSON fallback)
*   **Session Auth**: JWT Cookies / BcryptJS
*   **Styling**: Premium Vanilla CSS + Tailwind v4 variables

---

## ⚙️ Local Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/samuelkingston2007-art/Conesta-App-Day2.git
    cd Conesta-App-Day2
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure environment variables**:
    Create a `.env.local` file in the root directory:
    ```env
    GROQ_API_KEY=your_groq_api_key_here
    MONGODB_URI=your_mongodb_connection_uri_here
    JWT_SECRET=your_jwt_secret_key_here
    ```
    *(Note: If you leave `MONGODB_URI` blank, the app will run in local file mode, saving data to `mock_db.json` automatically!)*

4.  **Run in development mode**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

5.  **Build production version**:
    ```bash
    npm run build
    npm start
    ```

---

## 🌐 How to Deploy to Vercel

1.  Push your code to your GitHub repository.
2.  Log in to [Vercel](https://vercel.com) and click **Add New** > **Project**.
3.  Import the repository `Conesta-App-Day2`.
4.  In the **Environment Variables** section, add:
    *   `GROQ_API_KEY`
    *   `MONGODB_URI` (You can create a free cluster on MongoDB Atlas)
    *   `JWT_SECRET` (A strong random string)
5.  Click **Deploy**. Vercel will build and host your project at a public `.vercel.app` URL.
