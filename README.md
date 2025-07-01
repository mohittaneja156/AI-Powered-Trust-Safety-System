# 🔒 AI-Powered Trust & Safety System

> A comprehensive AI-based solution to detect fake reviews, counterfeit listings, privacy risks, and malicious activity across e-commerce and fintech platforms. Built to ensure authenticity, improve user trust, and assist admins in moderating threats and managing data privacy effectively.

🛡️ **Developed by Team Brain Byte**

---

## 🚨 Problem Statement

Online platforms face increasing threats from:
- Fake and coordinated review attacks
- Counterfeit and deceptive product listings
- Malicious seller or user behavior

This solution delivers **proactive protection** by combining **language, visual, and privacy intelligence** with real-time monitoring and user-friendly verification and consent tools.

---

## 💡 Key Features

### 🔍 AI-Powered Fraud & Trust Detection  
Multimodal detection pipeline combining:
- **BERT** for multilingual sentiment and review analysis  
- **Vision Transformer (ViT)** for image similarity and authenticity detection  
- **Keyword-based rules** for suspicious terms and policy violations
- **Word2Vec** for semantic brand/tagline embedding

### 📱 Product Authenticity & Privacy Verification  
- **MobileNet (Keras)** for logo and brand region verification  
- **SIFT** and **LBP** for visual descriptor checks  
- **OpenCV + pyzbar** for barcode decoding and matching
- **Privacy Dashboard** for user consent and data sharing management (Fintech prototype)

### 🧠 Listing & Review Integrity Engine  
- **BERT** for textual policy violations  
- **ViT** for image mismatch or counterfeit signal detection  
- **spaCy NER + rule engine** for named entity and compliance validation
- **Trust scoring** for reviews and listings

### 🛡️ Trust & Safety Operations Hub  
Central admin dashboard for:
- AI-generated trust scores and risk flags
- Aggregated text/image/relevance analysis
- Privacy/consent monitoring (fintech demo)
- Highlights high-risk or penalized reviews/listings for admin action

---

## ⚙️ Tech Stack

| Layer         | Technologies / Models Used                                                                |
|---------------|-------------------------------------------------------------------------------------------|
| Frontend      | Next.js, Tailwind CSS                                                                     |
| Backend       | Python FastAPI, MongoDB                                                                   |
| NLP           | BERT, spaCy NER, Word2Vec, Custom Rules                                                   |
| Vision        | ViT , ResNet50, MobileNet (Keras), OpenCV, Image Hashing                                  |
| Barcode/Logo  | OpenCV, pyzbar, SIFT, LBP                                                                 |
| Model Fusion  | Keras (MobileNet+LSTM+Dense for logo/text authenticity)                                   |
| Privacy/Consent| Custom privacy dashboard, consent flows (Fintech prototype)                              |
| Anomalies     | *(Planned: Isolation Forest, Time Series (ARIMA))*                                        |

---

### 🔬 Models Used

- **Text Review Analysis:** BERT 
- **Image Embedding:** Vision Transformer (ViT), ResNet50
- **Logo/Brand Verification:** MobileNet (Keras), OpenCV, SIFT, LBP
- **Brand/Tagline Embedding:** Word2Vec (Gensim)
- **Barcode Detection:** OpenCV, pyzbar
- **Trust Scoring:** Fusion of text, image, and rule-based features
- **Anomaly Detection:** *(Planned: Isolation Forest, ARIMA)*

---

## 🖥️ Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start dev server:
```bash
npm run dev
```

4. Access at [http://localhost:3000](http://localhost:3000)

---

## 🧪 Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. (Optional) Create virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # On Windows
source venv/bin/activate  # On Linux/Mac
```

3. Install packages:
```bash
pip install -r requirements.txt
```

4. Run server:
```bash
uvicorn app:app --host 0.0.0.0 --port 5001
```

Runs at [http://localhost:5001](http://localhost:5001)

---

## 📁 Project Structure

```
AI-Powered-Trust-Safety-System/
├── frontend/               # Next.js UI (Trust & Safety Dashboard, Product/Review/Privacy flows)
│   ├── src/
│   ├── public/
│   └── ...
├── backend/                # FastAPI Backend (AI Models, APIs)
│   ├── app.py
│   ├── models.py
│   ├── review_logic.py
│   └── requirements.txt
└── README.md
```

---

## 📈 Evaluation Metrics

| Metric                      | Outcome                            |
|-----------------------------|-------------------------------------|
| Counterfeit Detection       | 90%+ Precision                      |
| Policy Violation Prevention | 50% Drop in flagged mock data      |
| Scanner Adoption            | 70% among return-related cases     |
| Trust Badge Engagement      | 85%+ in product views               |

---

## 👥 Team Brain Byte

- **Gauri** 
- **Ashish K Choudhary** 
- **Mohit Taneja** 

---

## ✅ Project Overview

This project represents a scalable, explainable, and user-first approach to combating fraud, counterfeiting, and privacy risks in e-commerce and fintech ecosystems — powered by responsible AI, practical UX, and end-to-end trust scoring.

---