package expo.modules.todaywidget

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** Lets the app hand the widget its text. The widget itself is TodayWidgetProvider. */
class TodayWidgetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("TodayWidget")

    // Saves the widget's content (a JSON text) and redraws every widget on the home screen.
    Function("update") { payload: String ->
      val context = appContext.reactContext
      if (context != null) {
        TodayWidgetProvider.save(context, payload)
        TodayWidgetProvider.refreshAll(context)
      }
    }
  }
}
