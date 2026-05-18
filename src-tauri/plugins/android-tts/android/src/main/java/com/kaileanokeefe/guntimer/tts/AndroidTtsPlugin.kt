package com.kaileanokeefe.guntimer.tts

import android.app.Activity
import android.speech.tts.TextToSpeech
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.Plugin
import java.util.Locale

@InvokeArg
class SpeakArgs {
  lateinit var text: String
}

@TauriPlugin
class AndroidTtsPlugin(private val activity: Activity) : Plugin(activity), TextToSpeech.OnInitListener {
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

  @Command
  fun speak(invoke: Invoke) {
    try {
      val args = invoke.parseArgs(SpeakArgs::class.java)
      val text = args.text.trim()

      if (text.isEmpty()) {
        invoke.resolve()
        return
      }

      activity.runOnUiThread {
        if (isReady) {
          speakNow(text)
        } else {
          pendingText = text
        }
      }

      invoke.resolve()
    } catch (error: Exception) {
      invoke.reject(error.message)
    }
  }

  @Command
  fun stop(invoke: Invoke) {
    activity.runOnUiThread {
      pendingText = null
      textToSpeech?.stop()
    }

    invoke.resolve()
  }

  @Suppress("DEPRECATION", "OVERRIDE_DEPRECATION")
  override fun onDestroy() {
    pendingText = null
    textToSpeech?.shutdown()
    textToSpeech = null
    isReady = false
    super.onDestroy()
  }

  private fun speakNow(text: String) {
    textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "gun-timer-result")
  }
}
