"use strict";

const serverUrl = "http://127.0.0.1:8000";

class HttpError extends Error {
    constructor(response) {
        super(`${response.status} for ${response.url}`);
        this.name = "HttpError";
        this.response = response;
    }
}

let audioRecorder;
let recordedAudio;
let audioFile = {};
let isRecording = false;
const maxAudioLength = 30000;

const mediaConstraints = {
    audio: true
};
navigator.getUserMedia(mediaConstraints, onMediaSuccess, onMediaError);

function onMediaSuccess(audioStream) {
    audioRecorder = new MediaStreamRecorder(audioStream);
    audioRecorder.mimeType = "audio/wav";
    audioRecorder.ondataavailable = handleAudioData;
}

function onMediaError(error) {
    alert("Audio recording not available: " + error.message);
}

function startRecording() {
    recordedAudio = [];
    audioRecorder.start(maxAudioLength);
}

function stopRecording() {
    audioRecorder.stop();
}

function handleAudioData(audioRecording) {
    audioRecorder.stop();

    audioFile = new File([audioRecording], "recorded_audio.wav", {type: "audio/wav"});

    let audioElem = document.getElementById("recording-player");
    audioElem.src = window.URL.createObjectURL(audioRecording);
}

function toggleRecording() {
    let toggleBtn = document.getElementById("record-toggle");
    let translateBtn = document.getElementById("translate");

    if (isRecording) {
        toggleBtn.value = 'Record';
        translateBtn.disabled = false;
        stopRecording();
    } else {
        toggleBtn.value = 'Stop';
        translateBtn.disabled = true;
        startRecording();
    }

    isRecording = !isRecording;
}

function uploadMp3File() {
  const input = document.getElementById("mp3-upload");
  const file = input.files[0];
  if (!file) return alert("No file selected!");

  audioFile = file;
  document.getElementById("recording-player").src = URL.createObjectURL(file);
  document.getElementById("translate").disabled = false;
}

async function uploadRecording() {
    // encode recording file as base64 string for upload
    let converter = new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.readAsDataURL(audioFile);
        reader.onload = () => resolve(reader.result
            .toString().replace(/^data:(.*,)?/, ''));
        reader.onerror = (error) => reject(error);
    });
    let encodedString = await converter;

    // make server call to upload image
    // and return the server upload promise
    return fetch(serverUrl + "/recordings", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({filename: audioFile.name, filebytes: encodedString})
    }).then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new HttpError(response);
        }
    })
}

let fromLang;
let toLang;

function translateRecording(audio) {
    let fromLangElem = document.getElementById("fromLang");
    fromLang = fromLangElem[fromLangElem.selectedIndex].value;
    let toLangElem = document.getElementById("toLang");
    toLang = toLangElem[toLangElem.selectedIndex].value;

    // start translation text spinner
    let textSpinner = document.getElementById("text-spinner");
    textSpinner.hidden = false;

    // make server call to transcribe recorded audio
    return fetch(serverUrl + "/recordings/" + audio["fileId"] + "/translate-text", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({fromLang: fromLang, toLang: toLang})
    }).then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new HttpError(response);
        }
    })
}

function updateTranslation(translation) {
  // stop translation text spinner
  let textSpinner = document.getElementById("text-spinner");
  textSpinner.hidden = true;

  let transcriptionElem = document.getElementById("transcription");
  transcriptionElem.appendChild(document.createTextNode(translation["text"]));

  let translationElem = document.getElementById("translation");
  translationElem.appendChild(
    document.createTextNode(translation["translation"]["translatedText"])
  );

  // Update sentiment display
  let sentimentElem = document.getElementById("sentiment");
    sentimentElem.appendChild(
        document.createTextNode(translation["sentiment"]["Sentiment"])
    );

  // Show sentiment scores in chart
  updateSentimentChart(translation["sentiment"]["SentimentScore"]);

  fetch(serverUrl + "/summarize_sentiment_audio", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sentiment: translation["sentiment"],
      language: toLang,
    }),
  })
    .then((response) => response.json())
    .then((audio) => {
      document.getElementById("summary-player").src = audio["audioUrl"];
    });

  return translation;
}

function synthesizeTranslation(translation) {
    // start translation audio spinner
    let audioSpinner = document.getElementById("audio-spinner");
    audioSpinner.hidden = false;

    // make server call to synthesize translation audio
    return fetch(serverUrl + "/synthesize_speech", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({text: translation["translation"]["translatedText"], language: toLang})
    }).then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new HttpError(response);
        }
    })
}

function updateTranslationAudio(audio) {
    // stop translation audio spinner
    let audioSpinner = document.getElementById("audio-spinner");
    audioSpinner.hidden = true;

    let audioElem = document.getElementById("translation-player");
    audioElem.src = audio["audioUrl"];
}

function uploadAndTranslate() {
    let toggleBtn = document.getElementById("record-toggle");
    toggleBtn.disabled = true;
    let translateBtn = document.getElementById("translate");
    translateBtn.disabled = true;

    uploadRecording()
        .then(audio => translateRecording(audio))
        .then(translation => updateTranslation(translation))
        .then(translation => synthesizeTranslation(translation))
        .then(audio => updateTranslationAudio(audio))
        .catch(error => {
            alert("Error: " + error);
        })

    toggleBtn.disabled = false;
}

function updateSentimentChart(scores) {
  const ctx = document.getElementById("sentimentChart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Positive", "Negative", "Neutral", "Mixed"],
      datasets: [
        {
          label: "Sentiment Scores",
          data: [
            scores.Positive,
            scores.Negative,
            scores.Neutral,
            scores.Mixed,
          ],
          backgroundColor: [
            "rgba(75, 192, 192, 0.5)",
            "rgba(255, 99, 132, 0.5)",
            "rgba(201, 203, 207, 0.5)",
            "rgba(153, 102, 255, 0.5)",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 1 },
      },
    },
  });
}


