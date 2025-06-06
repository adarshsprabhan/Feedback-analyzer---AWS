import boto3
import time


class SpeechService:
    def __init__(self, storage_service):
        self.client = boto3.client('polly')
        self.bucket_name = storage_service.get_storage_location()
        self.storage_service = storage_service

    def synthesize_speech(self, text, target_language):
        POLL_DELAY = 5

        voice_map = {
            'en': 'Ivy',      # US English
            'de': 'Marlene',  # German
            'fr': 'Celine',   # French
            'it': 'Carla',    # Italian
            'es': 'Conchita', # Spanish
            'pt': 'Vitoria',    # Portuguese
            'ru': 'Maxim',   # Russian
            'ja': 'Mizuki',   # Japanese
            'ko': 'Seoyeon',    # Korean
            'hi': 'Aditi',   # Hindi
            'ar': 'Zeina',  # Arabic
            'zh': 'Zhiyu',  # Chinese
            'tr': 'Filiz',  # Turkish
            'nl': 'Lotte',  # Dutch
            'sv': 'Astrid', # Swedish
            'da': 'Mathilde',   # Danish
            'no': 'Liv',    # Norwegian
            'fi': 'Salli',  # Finnish
            'pl': 'Ewa',    # Polish
            'cs': 'Jakub',  # Czech
            'hu': 'Gabor',  # Hungarian
            'ro': 'Carmen' # Romanian
        }

        response = self.client.start_speech_synthesis_task(
            Text = text,
            VoiceId = voice_map[target_language],
            OutputFormat = 'mp3',
            OutputS3BucketName = self.bucket_name
        )

        synthesis_task = {
            'taskId': response['SynthesisTask']['TaskId'],
            'taskStatus': 'inProgress'
        }

        while synthesis_task['taskStatus'] == 'inProgress'\
                or synthesis_task['taskStatus'] == 'scheduled':
            time.sleep(POLL_DELAY)

            response = self.client.get_speech_synthesis_task(
                TaskId = synthesis_task['taskId']
            )

            synthesis_task['taskStatus'] = response['SynthesisTask']['TaskStatus']

            if synthesis_task['taskStatus'] == 'completed':
                synthesis_task['speechUri'] = response['SynthesisTask']['OutputUri']
                self.storage_service.make_file_public(synthesis_task['speechUri'])
                return synthesis_task['speechUri']

        return ''
