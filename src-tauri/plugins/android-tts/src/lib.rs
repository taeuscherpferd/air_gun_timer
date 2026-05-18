use tauri::{
    plugin::{Builder, PluginApi, TauriPlugin},
    AppHandle, Manager, Runtime, State,
};

#[cfg(not(android))]
use std::marker::PhantomData;
#[cfg(android)]
use serde::Serialize;
#[cfg(android)]
use tauri::plugin::PluginHandle;

#[cfg(android)]
const PLUGIN_IDENTIFIER: &str = "com.kaileanokeefe.guntimer.tts";

pub struct AndroidTts<R: Runtime> {
    #[cfg(android)]
    mobile_plugin_handle: PluginHandle<R>,
    #[cfg(not(android))]
    _marker: PhantomData<fn() -> R>,
}

#[cfg(android)]
#[derive(Serialize)]
struct SpeakPayload {
    text: String,
}

impl<R: Runtime> AndroidTts<R> {
    fn speak(&self, text: String) -> Result<(), String> {
        let trimmed_text = text.trim();

        if trimmed_text.is_empty() {
            return Ok(());
        }

        #[cfg(android)]
        {
            self.mobile_plugin_handle
                .run_mobile_plugin(
                    "speak",
                    SpeakPayload {
                        text: trimmed_text.to_string(),
                    },
                )
                .map_err(|error| error.to_string())
        }

        #[cfg(not(android))]
        {
            Err("Native Android text-to-speech is unavailable on this platform.".to_string())
        }
    }

    fn stop(&self) -> Result<(), String> {
        #[cfg(android)]
        {
            self.mobile_plugin_handle
                .run_mobile_plugin("stop", ())
                .map_err(|error| error.to_string())
        }

        #[cfg(not(android))]
        {
            Ok(())
        }
    }
}

#[tauri::command]
async fn speak<R: Runtime>(
    _app: AppHandle<R>,
    android_tts: State<'_, AndroidTts<R>>,
    text: String,
) -> Result<(), String> {
    android_tts.speak(text)
}

#[tauri::command]
async fn stop<R: Runtime>(
    _app: AppHandle<R>,
    android_tts: State<'_, AndroidTts<R>>,
) -> Result<(), String> {
    android_tts.stop()
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("android-tts")
        .invoke_handler(tauri::generate_handler![speak, stop])
        .setup(|app, _api: PluginApi<R, ()>| {
            #[cfg(android)]
            let android_tts = AndroidTts {
                mobile_plugin_handle: _api.register_android_plugin(
                    PLUGIN_IDENTIFIER,
                    "AndroidTtsPlugin",
                )?,
            };

            #[cfg(not(android))]
            let android_tts: AndroidTts<R> = AndroidTts {
                _marker: PhantomData,
            };

            app.manage(android_tts);
            Ok(())
        })
        .build()
}
