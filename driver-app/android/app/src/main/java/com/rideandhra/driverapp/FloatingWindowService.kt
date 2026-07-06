package com.rideandhra.driverapp

import android.app.Service
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import kotlin.math.abs

class FloatingWindowService : Service() {

    private lateinit var windowManager: WindowManager
    private var floatingView: View? = null
    private var dismissView: View? = null

    private lateinit var floatingParams: WindowManager.LayoutParams
    private lateinit var dismissParams: WindowManager.LayoutParams

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onCreate() {
        super.onCreate()

        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        val inflater = LayoutInflater.from(this)

        floatingView = inflater.inflate(R.layout.floating_bubble, null)
        dismissView = inflater.inflate(R.layout.floating_dismiss, null)

        val layoutFlag: Int = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        floatingParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutFlag,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        )

        floatingParams.gravity = Gravity.TOP or Gravity.START
        floatingParams.x = 0
        floatingParams.y = 100

        dismissParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutFlag,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        )

        dismissParams.gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
        dismissParams.y = 100

        windowManager.addView(floatingView, floatingParams)

        setupDragListener()
    }

    private fun setupDragListener() {
        var initialX: Int = 0
        var initialY: Int = 0
        var initialTouchX: Float = 0f
        var initialTouchY: Float = 0f
        var isDismissViewVisible = false

        floatingView?.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = floatingParams.x
                    initialY = floatingParams.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    return@setOnTouchListener true
                }
                MotionEvent.ACTION_UP -> {
                    if (isDismissViewVisible) {
                        try { windowManager.removeView(dismissView) } catch (_: Exception) {}
                        isDismissViewVisible = false
                    }

                    val diffX = abs(event.rawX - initialTouchX)
                    val diffY = abs(event.rawY - initialTouchY)

                    // Tap: open the app
                    if (diffX < 10 && diffY < 10) {
                        val intent = Intent(this, MainActivity::class.java)
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                        startActivity(intent)
                        stopSelf()
                        return@setOnTouchListener true
                    }

                    // Dropped in dismiss zone (bottom centre)
                    @Suppress("DEPRECATION")
                    val screenHeight = windowManager.defaultDisplay.height
                    @Suppress("DEPRECATION")
                    val screenWidth = windowManager.defaultDisplay.width
                    if (event.rawY > screenHeight - 300 &&
                        event.rawX > screenWidth / 2 - 160 &&
                        event.rawX < screenWidth / 2 + 160) {
                        stopSelf()
                    } else {
                        // Snap to nearest edge
                        floatingParams.x = if (floatingParams.x + 60 < screenWidth / 2) 0 else screenWidth - 60
                        windowManager.updateViewLayout(floatingView, floatingParams)
                    }
                    return@setOnTouchListener true
                }
                MotionEvent.ACTION_MOVE -> {
                    if (!isDismissViewVisible) {
                        try { windowManager.addView(dismissView, dismissParams) } catch (_: Exception) {}
                        isDismissViewVisible = true
                    }

                    floatingParams.x = initialX + (event.rawX - initialTouchX).toInt()
                    floatingParams.y = initialY + (event.rawY - initialTouchY).toInt()
                    windowManager.updateViewLayout(floatingView, floatingParams)
                    return@setOnTouchListener true
                }
            }
            false
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        try { if (floatingView != null) windowManager.removeView(floatingView) } catch (_: Exception) {}
        try { if (dismissView != null) windowManager.removeView(dismissView) } catch (_: Exception) {}
    }
}
