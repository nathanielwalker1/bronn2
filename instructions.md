Product Requirements Document (PRD)
🟡 Project Name
LP Snapshot Finder

🎯 Goal
Create a simple web dashboard that shows users a list of token pairs on the Base network that:

Have traded within a tight price range over a defined time period

Meet a minimum volume threshold

Are potentially good for providing liquidity right now

🧩 Core Features
1. User Input Panel
Allow users to customize 3 filters:

✅ Price Range % (e.g., ±5%)

✅ Time Period (e.g., 7, 14, or 30 days)

✅ Minimum Volume (e.g., $10M)

Defaults:

Price range: ±5%

Time period: 30 days

Minimum volume: $10,000,000

2. Output: List of LP-Friendly Assets
Display a clean table or card view with results:

Token Pair (e.g., USDC/WETH)

30d Price Range (e.g., $2,350–$2,500)

Volume (e.g., $12.4M in 30d)

Current APR (if available — optional)

3. Design + UX
Beautiful, minimalist interface

Easy-to-read fonts and buttons

Mobile responsive

Use TailwindCSS or clean custom CSS — your call

⚙️ Technical Stack

Component	Tool
UI	Vanilla HTML + CSS + JS
Data Source	Use mock JSON data for now (can fake it like an API call)
Later Integration	Use Dune API or Flipside Crypto API (Base chain focus)
Hosting	GitHub Pages or Vercel (free)
AI Help	Cursor (you) + Me (ChatGPT) 😎
🧪 MVP Data Example (Mocked for Now)
json
Copy
Edit
[
  {
    "pair": "USDC/WETH",
    "priceRange": "±4.2%",
    "volume": "$12.8M",
    "timePeriod": "30d"
  },
  {
    "pair": "DAI/USDC",
    "priceRange": "±2.1%",
    "volume": "$18.6M",
    "timePeriod": "30d"
  }
]
We'll just read this from a local .json file or embed it in JS to simulate API response.

🧱 File Structure
bash
Copy
Edit
/your-project/
├── index.html
├── styles.css
├── script.js
├── data/
│   └── mockData.json
✅ Phase 1 Milestones

Task	Description
UI Layout	Build form + result table in HTML
CSS Styling	Add responsive layout and nice design
JS Logic	Read input values, filter data, show results
Data	Use mocked data for now
Bonus	Add loading spinner or “no results found” message
🔜 Future Enhancements
Replace mock data with real Dune or Flipside API calls

Add APR/APY column using DeFi protocol APIs

Allow LP token sorting by stability or returns

Alert or email notifications when new matches hit