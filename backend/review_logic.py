import torch
from PIL import Image
import requests
from io import BytesIO
from models import text_tokenizer, text_model, image_processor, image_model, relevance_tokenizer, relevance_model

def analyze_review_text(review_text):
    inputs = text_tokenizer(review_text, return_tensors='pt', truncation=True, max_length=512)
    outputs = text_model(**inputs)
    sentiment = torch.softmax(outputs.logits, dim=1)
    sentiment_score = float(torch.argmax(sentiment) + 1) * 20  # Scale to 100

    fake_indicators = ['fake', 'counterfeit', 'not authentic', 'not as described', 'scam']
    penalty = sum(indicator in review_text.lower() for indicator in fake_indicators) * 15
    return max(0, sentiment_score - penalty)

def compare_images(product_url, review_url):
    try:
        if not review_url or not product_url:
            return None
        product_img = Image.open(BytesIO(requests.get(product_url).content)).resize((224, 224)).convert("RGB")
        review_img = Image.open(BytesIO(requests.get(review_url).content)).resize((224, 224)).convert("RGB")

        with torch.no_grad():
            prod_feat = image_processor(images=product_img, return_tensors='pt')
            rev_feat = image_processor(images=review_img, return_tensors='pt')

            prod_emb = image_model(**prod_feat).last_hidden_state[:, 0, :]
            rev_emb = image_model(**rev_feat).last_hidden_state[:, 0, :]

        similarity = torch.nn.functional.cosine_similarity(prod_emb, rev_emb)
        return round(float(similarity.item()) * 100, 2)
    except Exception as e:
        print("Image comparison error:", e)
        return None

def check_relevance(review, title, desc, category):
    reference = f"{title}. {desc}. {category}"
    inputs = relevance_tokenizer(reference, review, return_tensors='pt', truncation=True, max_length=512)
    outputs = relevance_model(**inputs)
    is_irrelevant = torch.softmax(outputs.logits, dim=1)[0][0].item()
    return {
        "relevance_score": round(is_irrelevant, 2),
        "relevance_check": "relevant" if is_irrelevant < 0.5 else "possibly irrelevant"
    } 