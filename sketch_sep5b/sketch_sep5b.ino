#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// =====================================================
// WIFI SETTINGS
// =====================================================

const char* WIFI_SSID = "Dialog 4G 993";
const char* WIFI_PASSWORD = "4D8e3EFF";

// IMPORTANT:
// Use the IP address of the computer/server running FastAPI.
// Do NOT use localhost here.
//
// Example:
// http://192.168.1.100:8000/attendance

const char* API_URL = "http://192.168.8.200:8000/attendance/scan";


// =====================================================
// MFRC522 PINS
// =====================================================

#define RFID_SS_PIN   5
#define RFID_RST_PIN  27

MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);


// =====================================================
// LCD
// =====================================================

// Common I2C LCD addresses are 0x27 or 0x3F
LiquidCrystal_I2C lcd(0x27, 16, 2);


// =====================================================
// LED + BUZZER
// =====================================================

#define GREEN_LED  25
#define RED_LED    33
#define BUZZER     26


// =====================================================
// VARIABLES
// =====================================================

String lastUID = "";

unsigned long lastScanTime = 0;

const unsigned long SCAN_COOLDOWN = 3000;


// =====================================================
// SETUP
// =====================================================

void setup() {

  Serial.begin(115200);

  delay(1000);

  Serial.println();
  Serial.println("=================================");
  Serial.println(" ESP32 RFID ATTENDANCE SYSTEM");
  Serial.println("=================================");


  // ---------------------------------------------------
  // GPIO SETUP
  // ---------------------------------------------------

  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED, LOW);
  digitalWrite(BUZZER, LOW);


  // ---------------------------------------------------
  // LCD SETUP
  // ---------------------------------------------------

  Wire.begin(21, 22);

  lcd.init();
  lcd.backlight();

  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("RFID Attendance");

  lcd.setCursor(0, 1);
  lcd.print("Starting...");


  // ---------------------------------------------------
  // SPI SETUP
  // ---------------------------------------------------

  SPI.begin(
    18,  // SCK
    19,  // MISO
    23,  // MOSI
    5    // SS
  );


  // ---------------------------------------------------
  // MFRC522 SETUP
  // ---------------------------------------------------

  rfid.PCD_Init();

  delay(100);

  Serial.println();
  Serial.println("MFRC522 initialized.");

  rfid.PCD_DumpVersionToSerial();


  // ---------------------------------------------------
  // WIFI
  // ---------------------------------------------------

  connectWiFi();


  // ---------------------------------------------------
  // READY
  // ---------------------------------------------------

  showReady();

}


// =====================================================
// MAIN LOOP
// =====================================================

void loop() {

  // ---------------------------------------------------
  // Make sure Wi-Fi is connected
  // ---------------------------------------------------

  if (WiFi.status() != WL_CONNECTED) {

    Serial.println("Wi-Fi disconnected.");

    connectWiFi();
  }


  // ---------------------------------------------------
  // Check for new RFID card
  // ---------------------------------------------------

  if (!rfid.PICC_IsNewCardPresent()) {
    return;
  }


  // ---------------------------------------------------
  // Read RFID card
  // ---------------------------------------------------

  if (!rfid.PICC_ReadCardSerial()) {
    return;
  }


  // ---------------------------------------------------
  // Get UID
  // ---------------------------------------------------

  String uid = getUID();

  Serial.println();
  Serial.println("=================================");
  Serial.println("RFID CARD DETECTED");
  Serial.print("UID: ");
  Serial.println(uid);
  Serial.println("=================================");


  // ---------------------------------------------------
  // Prevent repeated scanning
  // ---------------------------------------------------

  if (uid == lastUID &&
      millis() - lastScanTime < SCAN_COOLDOWN) {

    Serial.println("Duplicate scan ignored.");

    stopRFID();

    return;
  }


  lastUID = uid;
  lastScanTime = millis();


  // ---------------------------------------------------
  // Display scanning
  // ---------------------------------------------------

  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("Card detected");

  lcd.setCursor(0, 1);

  if (uid.length() > 16) {
    lcd.print(uid.substring(0, 16));
  } else {
    lcd.print(uid);
  }


  // ---------------------------------------------------
  // Send UID to FastAPI
  // ---------------------------------------------------

  sendAttendance(uid);


  // ---------------------------------------------------
  // Stop RFID communication
  // ---------------------------------------------------

  stopRFID();

  delay(1000);

  showReady();
}


// =====================================================
// CONNECT WIFI
// =====================================================

void connectWiFi() {

  Serial.println();
  Serial.println("Connecting to Wi-Fi...");

  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");

  WiFi.disconnect(true);

  delay(500);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);


  int attempts = 0;

  while (WiFi.status() != WL_CONNECTED &&
         attempts < 30) {

    delay(500);

    Serial.print(".");

    attempts++;
  }


  Serial.println();


  if (WiFi.status() == WL_CONNECTED) {

    Serial.println("Wi-Fi connected!");

    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());

    lcd.clear();

    lcd.setCursor(0, 0);
    lcd.print("WiFi Connected");

    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP());

    delay(2000);

  } else {

    Serial.println("Wi-Fi connection failed.");

    lcd.clear();

    lcd.setCursor(0, 0);
    lcd.print("WiFi Failed");

    lcd.setCursor(0, 1);
    lcd.print("Check network");

    delay(2000);
  }
}


// =====================================================
// GET RFID UID
// =====================================================

String getUID() {

  String uid = "";


  for (byte i = 0; i < rfid.uid.size; i++) {

    if (rfid.uid.uidByte[i] < 0x10) {
      uid += "0";
    }

    uid += String(
      rfid.uid.uidByte[i],
      HEX
    );

    if (i < rfid.uid.size - 1) {
      uid += ":";
    }
  }


  uid.toUpperCase();

  return uid;
}


// =====================================================
// SEND ATTENDANCE TO FASTAPI
// =====================================================

void sendAttendance(String uid) {

  if (WiFi.status() != WL_CONNECTED) {

    Serial.println("No Wi-Fi connection.");

    showError("No WiFi");

    return;
  }


  HTTPClient http;


  Serial.println();
  Serial.println("Sending attendance...");
  Serial.print("API: ");
  Serial.println(API_URL);


  http.begin(API_URL);

  http.addHeader(
    "Content-Type",
    "application/json"
  );


  // ---------------------------------------------------
  // JSON DATA
  // ---------------------------------------------------

  String jsonData = "{";

  jsonData += "\"rfid_uid\":\"";
  jsonData += uid;
  jsonData += "\"";

  jsonData += "}";


  Serial.print("JSON: ");
  Serial.println(jsonData);


  // ---------------------------------------------------
  // POST REQUEST
  // ---------------------------------------------------

  int httpCode = http.POST(jsonData);


  Serial.print("HTTP Status: ");
  Serial.println(httpCode);


  // ---------------------------------------------------
  // RESPONSE
  // ---------------------------------------------------

  if (httpCode > 0) {

    String response = http.getString();

    Serial.println("Server response:");
    Serial.println(response);


    if (httpCode >= 200 &&
        httpCode < 300) {

      // ---------------------------------------------
      // SUCCESS
      // ---------------------------------------------

      if (response.indexOf("Admin RFID login ready") >= 0) {
        adminLoginFeedback();
      } else {
        successFeedback(response);
      }

    } else if (httpCode == 404) {

      // ---------------------------------------------
      // UNKNOWN RFID
      // ---------------------------------------------

      unknownCard();

    } else {

      // ---------------------------------------------
      // SERVER ERROR
      // ---------------------------------------------

      showError("Server Error");
    }

  } else {

    Serial.println("HTTP request failed.");

    showError("API Failed");
  }


  http.end();
}


// =====================================================
// SUCCESS FEEDBACK
// =====================================================

void successFeedback(String response) {

  Serial.println();
  Serial.println("ATTENDANCE SUCCESS");


  // Green LED

  digitalWrite(GREEN_LED, HIGH);


  // Short beep

  beep(150);


  // LCD

  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("Attendance");

  lcd.setCursor(0, 1);
  lcd.print("Marked!");


  delay(2000);


  digitalWrite(GREEN_LED, LOW);
}


// =====================================================
// ADMIN LOGIN FEEDBACK
// =====================================================

void adminLoginFeedback() {

  Serial.println();
  Serial.println("ADMIN RFID LOGIN SENT");

  digitalWrite(GREEN_LED, HIGH);
  beep(150);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Admin Login");
  lcd.setCursor(0, 1);
  lcd.print("Check dashboard");

  delay(2000);

  digitalWrite(GREEN_LED, LOW);
}


// =====================================================
// UNKNOWN CARD
// =====================================================

void unknownCard() {

  Serial.println();
  Serial.println("UNKNOWN RFID CARD");


  // Red LED

  digitalWrite(RED_LED, HIGH);


  // Error beep

  beep(100);

  delay(100);

  beep(100);


  // LCD

  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("Unknown Card");

  lcd.setCursor(0, 1);
  lcd.print("Not Registered");


  delay(2000);


  digitalWrite(RED_LED, LOW);
}


// =====================================================
// GENERAL ERROR
// =====================================================

void showError(String message) {

  Serial.print("ERROR: ");
  Serial.println(message);


  digitalWrite(RED_LED, HIGH);


  beep(200);

  delay(500);


  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("Error");

  lcd.setCursor(0, 1);

  if (message.length() > 16) {
    lcd.print(message.substring(0, 16));
  } else {
    lcd.print(message);
  }


  delay(1500);


  digitalWrite(RED_LED, LOW);
}


// =====================================================
// READY SCREEN
// =====================================================

void showReady() {

  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("Scan RFID Card");

  lcd.setCursor(0, 1);

  if (WiFi.status() == WL_CONNECTED) {
    lcd.print("Ready");
  } else {
    lcd.print("WiFi Offline");
  }
}


// =====================================================
// BUZZER
// =====================================================

void beep(int duration) {

  digitalWrite(BUZZER, HIGH);

  delay(duration);

  digitalWrite(BUZZER, LOW);
}


// =====================================================
// STOP RFID
// =====================================================

void stopRFID() {

  rfid.PICC_HaltA();

  rfid.PCD_StopCrypto1();
}