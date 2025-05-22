AWS Voice Feedback Analyzer

Project Overview

This is a voice-based feedback analyzer web application that records user voice input, converts it into text, translates the text and audio into multiple languages, performs sentiment analysis on the text, and displays sentiment results with interactive graphs on a webpage. It leverages AWS services such as Transcribe, Translate, Comprehend, and Polly to offer a seamless multilingual voice processing experience.

Features

Voice recording and transcription using AWS Transcribe
Multilingual text and audio translation with AWS Translate and AWS Polly
Sentiment analysis on feedback text using AWS Comprehend
Visualization of sentiment results via graphs on a web interface
Serverless backend powered by AWS Chalice
Simple RESTful API architecture
Tech Stack

Python 3.8+
AWS Chalice (serverless framework)
AWS SDK (boto3)
HTML/CSS/JavaScript frontend
Getting Started

Prerequisites
AWS Account with permissions for Transcribe, Translate, Comprehend, Polly, S3
AWS CLI configured with your credentials
Python 3.8 or higher installed
Virtual environment tool (venv or virtualenv)
Chalice installed (pip install chalice)
