from transformers import AutoTokenizer, AutoModelForSequenceClassification, ViTImageProcessor, ViTModel, BertTokenizer, BertForNextSentencePrediction

# Text sentiment model
text_tokenizer = AutoTokenizer.from_pretrained('nlptown/bert-base-multilingual-uncased-sentiment')
text_model = AutoModelForSequenceClassification.from_pretrained('nlptown/bert-base-multilingual-uncased-sentiment')

# Image embedding model
image_processor = ViTImageProcessor.from_pretrained('google/vit-base-patch16-224')
image_model = ViTModel.from_pretrained('google/vit-base-patch16-224')

# Relevance check model
relevance_tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
relevance_model = BertForNextSentencePrediction.from_pretrained('bert-base-uncased') 