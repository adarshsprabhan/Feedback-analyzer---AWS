import boto3

class SentimentService:
    def __init__(self):
        self.client = boto3.client('comprehend')

    def analyze_sentiment(self, text, language_code='en'):
        response = self.client.detect_sentiment(Text=text, LanguageCode=language_code)
        return response  # Includes Sentiment, SentimentScore
