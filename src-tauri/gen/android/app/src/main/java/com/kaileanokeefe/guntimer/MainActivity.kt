package com.kaileanokeefe.guntimer

import android.app.Activity
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import java.util.Locale

class MainActivity : TauriActivity() {
  private var speechBridge: AndroidSpeechBridge? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
  }

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    val bridge = AndroidSpeechBridge(this)
    speechBridge = bridge
    webView.addJavascriptInterface(bridge, "GunTimerAndroidSpeech")
  }

  override fun onDestroy() {
    speechBridge?.shutdown()
    speechBridge = null
    super.onDestroy()
  }
}

class AndroidSpeechBridge(private val activity: Activity) : TextToSpeech.OnInitListener {
  private var textToSpeech: TextToSpeech? = TextToSpeech(activity.applicationContext, this)
  private var isReady = false
  private var pendingText: String? = null

  override fun onInit(status: Int) {
    activity.runOnUiThread {
      if (status != TextToSpeech.SUCCESS) {
        return@runOnUiThread
      }

      val speaker = textToSpeech ?: return@runOnUiThread
      speaker.language = Locale.getDefault()
      isReady = true
      pendingText?.let { speakNow(it) }
      pendingText = null
    }
  }

  @JavascriptInterface
  fun speak(text: String): Boolean {
    val trimmedText = text.trim()

    if (trimmedText.isEmpty()) {
      return false
    }

    activity.runOnUiThread {
      if (isReady) {
        speakNow(trimmedText)
      } else {
        pendingText = trimmedText
      }
    }

    return true
  }

  @JavascriptInterface
  fun stop() {
    activity.runOnUiThread {
      pendingText = null
      textToSpeech?.stop()
    }
  }

  fun shutdown() {
    pendingText = null
    textToSpeech?.shutdown()
    textToSpeech = null
    isReady = false
  }

  private fun speakNow(text: String) {
    textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "gun-timer-result")
  }
}
