# Contributing to EasyInterview 🚀

First off, thank you for considering contributing to EasyInterview! It's people like you that make EasyInterview such a great tool for job seekers worldwide.

## 🌈 Our Vision
To bridge the gap between interview preparation and real-world performance using advanced Multi-modal AI.

---

## 🛠️ Getting Started

### 1. Fork and Clone
```bash
git clone https://github.com/krish1440/EasyInterview.git
cd EasyInterview
```

### 2. Environment Setup
You will need a **Google Gemini API Key**.
1. Get a key from [Google AI Studio](https://aistudio.google.com/).
2. Create a `.env` file in the root directory.
3. Add: `VITE_GEMINI_API_KEY=your_key_here`.

### 3. Install & Run
```bash
npm install
npm run dev
```

---

## 🤝 How Can I Contribute?

### Reporting Bugs 🐛
* Use the **GitHub Issues** tab.
* Provide a clear title and description.
* Include steps to reproduce the bug.
* Mention your browser and OS version.

### Suggesting Enhancements ✨
* Open an issue with the tag `enhancement`.
* Describe the problem the feature would solve.
* Explain how the AI integration (Gemini) would handle the new logic.

### Pull Requests 🛠️
1. Create a new branch: `git checkout -b feat/your-feature-name`.
2. Ensure your code follows the existing TypeScript patterns.
3. Add comments/docstrings to complex AI logic.
4. Submit the PR describing your changes in detail.

---

## 🎨 Style Guide
* **TypeScript**: Always use proper interfaces for props and states.
* **Styling**: Use **Tailwind CSS**. Avoid ad-hoc utility classes; use standard patterns.
* **Components**: Keep components modular and focused on a single responsibility.

---

## 🔐 Security & Privacy
Since this app processes camera and microphone data:
* **Never** store user media on servers.
* **Never** hardcode API keys in the source code.
* If you find a security vulnerability, please open a private security advisory on GitHub.

---

## 📜 License
By contributing, you agree that your contributions will be licensed under its [MIT License](LICENSE).
