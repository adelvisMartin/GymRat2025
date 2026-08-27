#!/usr/bin/env bash
set -euo pipefail
api="${FITAI_ANDROID_API:-unknown}"
size="${1:-}"
density="${2:-}"
package_name="com.adelvis.fitai.pro.debug"
evidence="$GITHUB_WORKSPACE/build/fitai281/evidence/api-$api"
mkdir -p "$evidence"
if [[ -n "$size" ]]; then adb shell wm size "$size"; fi
if [[ -n "$density" ]]; then adb shell wm density "$density"; fi
cleanup(){
  adb shell svc wifi enable >/dev/null 2>&1 || true
  adb shell svc data enable >/dev/null 2>&1 || true
  adb shell cmd devicestoragemonitor reset >/dev/null 2>&1 || true
  adb shell wm size reset >/dev/null 2>&1 || true
  adb shell wm density reset >/dev/null 2>&1 || true
}
trap cleanup EXIT
{
  printf 'source_sha256=%s\n' "${FITAI_SOURCE_SHA256:-unknown}"
  printf 'bridge_commit=%s\n' "${GITHUB_SHA:-unknown}"
  printf 'api=%s\n' "$api"
  adb shell getprop ro.build.version.release | sed 's/^/android_release=/'
  adb shell getprop ro.build.version.sdk | sed 's/^/android_sdk=/'
  adb shell wm size | sed 's/^/wm_size=/'
  adb shell wm density | sed 's/^/wm_density=/'
} > "$evidence/device.txt"
cd "$FITAI_SOURCE_ROOT"
set +e
gradle --no-daemon --stacktrace connectedProDebugAndroidTest 2>&1 | tee "$evidence/connectedProDebugAndroidTest.log"
status=${PIPESTATUS[0]}
set -e
if [[ $status -ne 0 ]]; then
  echo "FAIL exit_code=$status" > "$evidence/status.txt"
  adb logcat -d -t 1500 > "$evidence/logcat-failure.txt" 2>/dev/null || true
  exit "$status"
fi
adb shell am force-stop "$package_name"
adb shell monkey -p "$package_name" -c android.intent.category.LAUNCHER 1 >/dev/null
sleep 2
first_pid="$(adb shell pidof "$package_name" | tr -d '\r' || true)"
test -n "$first_pid"
adb shell input keyevent KEYCODE_HOME
sleep 1
adb shell am kill "$package_name" || true
sleep 1
adb shell monkey -p "$package_name" -c android.intent.category.LAUNCHER 1 >/dev/null
sleep 2
second_pid="$(adb shell pidof "$package_name" | tr -d '\r' || true)"
test -n "$second_pid"
printf 'force_stop_relaunch_pid=%s\nprocess_kill_relaunch_pid=%s\n' "$first_pid" "$second_pid" > "$evidence/restart-smoke.txt"
adb exec-out screencap -p > "$evidence/relaunch.png" 2>/dev/null || true
adb logcat -d -t 1000 > "$evidence/logcat.txt" 2>/dev/null || true
echo PASS > "$evidence/status.txt"
