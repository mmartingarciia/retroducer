#include <Arduino.h>
#include <WiFi.h>
#include <SD.h>
#include <SPI.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>
#include "Audio.h" // ESP32-audioI2S

// --- Configuration ---
const char* SSID_AP = "Retroducer_Player";
const char* PASS_AP = "12345678"; // Min 8 chars

// --- Globals ---
AsyncWebServer server(80);
Audio audio;

// * --- GPIO Definition (Standard ESP32 VSPI) ---
// SD Card: SCK=18, MISO=19, MOSI=23, CS=5
#define SD_CS 5

// I2S (PCM5102)
#define I2S_BCK 27
#define I2S_LRC 26
#define I2S_DOUT 25

// * --- Helper Functions ---
// --- WiFi Access Point Setup ---
void setupWiFi() {
    WiFi.mode(WIFI_AP);
    WiFi.softAP(SSID_AP, PASS_AP);
    Serial.print("Access Point Started. IP: ");
    Serial.println(WiFi.softAPIP());
}

// --- SD Card Setup ---
void setupSD() {
    if (!SD.begin(SD_CS)) {
        Serial.println("SD Card Mount Failed!");
        return;
    }
    uint8_t cardType = SD.cardType();
    if (cardType == CARD_NONE) {
        Serial.println("No SD Card attached");
        return;
    }
    Serial.println("SD Card Initialized.");
}

// --- Audio Setup ---
void setupAudio() {
    audio.setPinout(I2S_BCK, I2S_LRC, I2S_DOUT);
    audio.setVolume(10); // 0...21
    Serial.println("Audio Initialized.");
}

// --- Web Server Setup (Comms with Retroducer) ---
void setupServer() {
    // Basic Status Endpoint
    server.on("/api/status", HTTP_GET, [](AsyncWebServerRequest *request){
        DynamicJsonDocument doc(256);
        doc["status"] = "online";
        doc["ip"] = WiFi.softAPIP().toString();
        // Add playback info here later
        
        String response;
        serializeJson(doc, response);
        request->send(200, "application/json", response);
    });

    // File Upload Endpoint
    // Usage: POST /upload with file form-data
    server.on("/upload", HTTP_POST, [](AsyncWebServerRequest *request){
        request->send(200, "text/plain", "Upload Complete");
    }, [](AsyncWebServerRequest *request, String filename, size_t index, uint8_t *data, size_t len, bool final){
        static File uploadFile;
        // First chunk: Open file
        if(!index){
            String path = "/" + filename;
            Serial.printf("Upload Start: %s\n", path.c_str());
            
            // Check if SD is available
            if(!SD.exists("/") && !SD.mkdir("/")){
                 Serial.println("SD Error");
            }

            uploadFile = SD.open(path, FILE_WRITE);
        }
        
        // Write in SD
        if(uploadFile){
            uploadFile.write(data, len);
        }

        // Close file
        if(final){
            if(uploadFile){
                uploadFile.close();
                Serial.printf("Upload End: %s, %u bytes\n", filename.c_str(), index+len);
            }
        }
    });

    server.begin();
    Serial.println("HTTP Server Started.");
}

void setup() {
    Serial.begin(115200);
    
    setupSD();
    setupAudio();
    setupWiFi();
    setupServer();
    
    // Test: Try to play a file if it exists (Checking hardware)
    // audio.connecttoFS(SD, "/test.mp3"); 
}

void loop() {
    audio.loop(); 
    // Other non-blocking tasks
}
