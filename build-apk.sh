#!/bin/bash
set -e

BUILD_DIR="/app/applet/android-build"
PLATFORM_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"
BIN_DIR="$BUILD_DIR/bin"
GEN_DIR="$BUILD_DIR/gen"
OBJ_DIR="$BUILD_DIR/obj"
PUBLIC_DL="/app/applet/public/downloads"

mkdir -p "$BIN_DIR" "$GEN_DIR" "$OBJ_DIR" "$PUBLIC_DL"

echo "[1/8] Generating R.java with AAPT..."
aapt package -m -J "$GEN_DIR" \
  -M "$BUILD_DIR/AndroidManifest.xml" \
  -S "$BUILD_DIR/res" \
  -I "$PLATFORM_JAR"

echo "[2/8] Compiling Java classes with javac..."
javac -source 8 -target 8 \
  -bootclasspath "$PLATFORM_JAR" \
  -d "$OBJ_DIR" \
  "$GEN_DIR/com/gemini/ai/assistant/R.java" \
  "$BUILD_DIR/src/com/gemini/ai/assistant/MainActivity.java"

echo "[3/8] Converting to Dalvik DEX (classes.dex)..."
dalvik-exchange --dex --output="$BIN_DIR/classes.dex" "$OBJ_DIR"

echo "[4/8] Packaging resources and assets into unaligned APK..."
aapt package -f \
  -M "$BUILD_DIR/AndroidManifest.xml" \
  -S "$BUILD_DIR/res" \
  -A "$BUILD_DIR/assets" \
  -I "$PLATFORM_JAR" \
  -F "$BIN_DIR/unaligned.apk"

echo "[5/8] Adding classes.dex to APK package..."
(cd "$BIN_DIR" && aapt add unaligned.apk classes.dex)

echo "[6/8] 4-Byte ZipAligning APK for zero-copy Android memory mapping..."
rm -f "$BIN_DIR/aligned.apk"
zipalign -v -p 4 "$BIN_DIR/unaligned.apk" "$BIN_DIR/aligned.apk"

echo "[7/8] Generating release keystore and signing APK with apksigner (v1, v2, v3)..."
KEYSTORE="$BUILD_DIR/gemini-release.keystore"
if [ ! -f "$KEYSTORE" ]; then
  keytool -genkeypair -v \
    -keystore "$KEYSTORE" \
    -alias geminikey \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "gemini2026pass" \
    -keypass "gemini2026pass" \
    -dname "CN=Gemini AI Assistant, OU=Mobile Engineering, O=Gemini Studio, L=Berlin, ST=Berlin, C=DE"
fi

FINAL_APK="$PUBLIC_DL/gemini-ai-assistant.apk"
rm -f "$FINAL_APK"
apksigner sign \
  --ks "$KEYSTORE" \
  --ks-key-alias geminikey \
  --ks-pass pass:gemini2026pass \
  --key-pass pass:gemini2026pass \
  --out "$FINAL_APK" \
  "$BIN_DIR/aligned.apk"

echo "[8/8] Verifying APK technical integrity..."
echo "--- AAPT BADGING DUMP ---"
aapt dump badging "$FINAL_APK"
echo "--- APKSIGNER VERIFY ---"
apksigner verify --verbose "$FINAL_APK"
echo "--- CHECKSUM REPORT ---"
sha256sum "$FINAL_APK" > "$PUBLIC_DL/gemini-ai-assistant.apk.sha256"
cat "$PUBLIC_DL/gemini-ai-assistant.apk.sha256"
ls -lh "$FINAL_APK"

echo "APK BUILD & VERIFICATION SUCCESSFUL!"
