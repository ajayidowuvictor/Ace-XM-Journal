package expo.modules.todaywidget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.view.View
import android.widget.RemoteViews
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * The home-screen widget. It only shows text the app saved for it (counts and times, and names
 * only when the person chose that). Nothing else is read, and nothing is sent anywhere.
 */
class TodayWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    for (id in ids) {
      manager.updateAppWidget(id, build(context))
    }
  }

  companion object {
    private const val PREFS = "ace_today_widget"
    private const val KEY = "payload"

    fun save(context: Context, payload: String) {
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, payload).apply()
    }

    fun refreshAll(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      val ids = manager.getAppWidgetIds(ComponentName(context, TodayWidgetProvider::class.java))
      for (id in ids) {
        manager.updateAppWidget(id, build(context))
      }
    }

    private fun today(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

    private fun build(context: Context): RemoteViews {
      val views = RemoteViews(context.packageName, R.layout.today_widget)

      val saved = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null)
      val payload = try {
        if (saved == null) null else JSONObject(saved)
      } catch (e: Exception) {
        null
      }

      val lineIds = intArrayOf(R.id.widget_line_1, R.id.widget_line_2, R.id.widget_line_3)
      for (lineId in lineIds) {
        views.setViewVisibility(lineId, View.GONE)
      }
      views.setViewVisibility(R.id.widget_footer, View.GONE)

      if (payload == null) {
        views.setTextViewText(R.id.widget_headline, context.getString(R.string.today_widget_empty))
        views.setProgressBar(R.id.widget_progress, 100, 0, false)
      } else if (payload.optString("date") != today()) {
        // The app has not refreshed the widget today, so yesterday's numbers would mislead.
        views.setTextViewText(R.id.widget_headline, context.getString(R.string.today_widget_stale))
        views.setProgressBar(R.id.widget_progress, 100, 0, false)
      } else {
        views.setTextViewText(R.id.widget_headline, payload.optString("headline"))
        views.setProgressBar(R.id.widget_progress, 100, payload.optInt("progress", 0), false)

        val lines = payload.optJSONArray("lines")
        if (lines != null) {
          for (index in 0 until minOf(lines.length(), lineIds.size)) {
            views.setTextViewText(lineIds[index], lines.optString(index))
            views.setViewVisibility(lineIds[index], View.VISIBLE)
          }
        }
        val footer = payload.optString("footer")
        if (footer.isNotEmpty()) {
          views.setTextViewText(R.id.widget_footer, footer)
          views.setViewVisibility(R.id.widget_footer, View.VISIBLE)
        }
      }

      // Tapping the widget opens the app.
      val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
      if (launch != null) {
        val pending = PendingIntent.getActivity(
          context,
          0,
          launch,
          PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        views.setOnClickPendingIntent(R.id.widget_root, pending)
      }
      return views
    }
  }
}
