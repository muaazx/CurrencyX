
````markdown
# 🤖 CurrencyX - Currency Converter

CurrencyX is a Python-powered App that allows users to:
- 🌍 Convert between over 150 international currencies
- 💹 Check real-time exchange rates
- 📜 List all supported currencies

This project integrates:
- **ExchangeRate-API** for currency conversion
---

## 🚀 Features

- `/start`: Select the languages 
- `/convert 100 USD to GHS`: Convert amount from one currency to another
- `/showrate USD to GHS`: Get current exchange rate between currencies
- `/currencysupported`: List all supported currencies

---

## 🛠 Requirements

- Python 3.7+
- Free API key from [https://www.exchangerate-api.com](https://www.exchangerate-api.com)

---

## 🔧 Setup

### 📁 1. Clone this Repository

```bash
git clone https://github.com/muaazx/CurrencyXBo.git
cd CurrencyX
````

### 📦 2. Create Virtual Environment (Recommended)

```bash
python -m venv venv
# On Windows
venv\Scripts\activate
# On Linux/Mac
source venv/bin/activate
```

### 📦 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### ⚙️ 4. Create `config.json`

```json
{
  "EXCHANGE_RATE_API_KEY": "your-exchange-rate-api-key"
}
```

### ▶️ 5. Run the Bot

```bash
python currency_x_bot.py
```

---

## 📄 License

This project is open source under the [MIT License](LICENSE).

---

## 🤝 Acknowledgments

* ExchangeRate-API: [https://www.exchangerate-api.com](https://www.exchangerate-api.com)

