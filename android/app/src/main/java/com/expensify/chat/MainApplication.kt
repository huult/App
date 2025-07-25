package com.expensify.chat

import android.app.Activity
import com.facebook.react.common.assets.ReactFontManager

import android.app.ActivityManager
import android.app.ActivityManager.RunningAppProcessInfo
import android.content.Context
import android.content.res.Configuration
import android.database.CursorWindow
import android.os.Bundle
import android.os.Process
import androidx.multidex.MultiDexApplication
import com.expensify.chat.bootsplash.BootSplashPackage
import com.expensify.chat.navbar.NavBarManagerPackage
import com.expensify.chat.shortcutManagerModule.ShortcutManagerPackage
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.modules.i18nmanager.I18nUtil
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import com.google.firebase.crashlytics.FirebaseCrashlytics
import com.oblador.performance.RNPerformance
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

class MainApplication : MultiDexApplication(), ReactApplication {
    var currentState: String = "active"
        private set
    var prevState: String = "inactive"
        private set

    override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(this, object : DefaultReactNativeHost(this) {
        override fun getUseDeveloperSupport() = BuildConfig.DEBUG

        override fun getPackages(): List<ReactPackage>  = 
            PackageList(this).packages.apply {
            // Packages that cannot be autolinked yet can be added manually here, for example:
            // add(MyReactNativePackage());
            add(ShortcutManagerPackage())
            add(BootSplashPackage())
            add(ExpensifyAppPackage())
            add(RNTextInputResetPackage())
            add(NavBarManagerPackage())
        }

        override fun getJSMainModuleName() = ".expo/.virtual-metro-entry"

        override val isNewArchEnabled: Boolean
            get() = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean
            get() = BuildConfig.IS_HERMES_ENABLED
    })

    override val reactHost: ReactHost
        get() = getDefaultReactHost(applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()
        ReactFontManager.getInstance().addCustomFont(this, "Custom Emoji Font", R.font.custom_emoji_font)
        ReactFontManager.getInstance().addCustomFont(this, "Expensify New Kansas", R.font.expensify_new_kansas)
        ReactFontManager.getInstance().addCustomFont(this, "Expensify Neue", R.font.expensify_neue)
        ReactFontManager.getInstance().addCustomFont(this, "Expensify Mono", R.font.expensify_mono)
        RNPerformance.getInstance().mark("appCreationStart", false);

        if (isOnfidoProcess()) {
            return
        }

        registerActivityLifecycleCallbacks(object: ActivityLifecycleCallbacks {
            override fun onActivityStarted(p0: Activity) {
                prevState = currentState
                currentState = "active"
            }

            override fun onActivityStopped(p0: Activity) {
                val isOnForeground = isAppOnForeground()
                prevState = currentState
                currentState = if (isOnForeground) "active" else "background"
            }

            override fun onActivityDestroyed(p0: Activity) {
                val isOnForeground = isAppOnForeground()
                prevState = currentState
                currentState = if (isOnForeground) "active" else "background"
            }

            override fun onActivityCreated(p0: Activity, p1: Bundle?) {}
            override fun onActivityResumed(p0: Activity) {}
            override fun onActivityPaused(p0: Activity) {}
            override fun onActivitySaveInstanceState(p0: Activity, p1: Bundle) {}
        })

        SoLoader.init(this, OpenSourceMergedSoMapping)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this app.
            load()
        }
        if (BuildConfig.DEBUG) {
            FirebaseCrashlytics.getInstance().setCrashlyticsCollectionEnabled(false)
        }

        // Force the app to LTR mode.
        val sharedI18nUtilInstance = I18nUtil.instance
        sharedI18nUtilInstance.allowRTL(applicationContext, false)

        // Start the "js_load" custom performance tracing metric. This timer is stopped by a native
        // module in the JS so we can measure total time starting in the native layer and ending in
        // the JS layer.
        StartupTimer.start()

        // Increase SQLite DB write size
        try {
            val field = CursorWindow::class.java.getDeclaredField("sCursorWindowSize")
            field.isAccessible = true
            field[null] = 100 * 1024 * 1024 //the 100MB is the new size
        } catch (e: Exception) {
            e.printStackTrace()
        }
        ApplicationLifecycleDispatcher.onApplicationCreate(this);
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
    }

    private fun isOnfidoProcess(): Boolean {
        val pid = Process.myPid()
        val manager = this.getSystemService(ACTIVITY_SERVICE) as ActivityManager

        return manager.runningAppProcesses.any {
            it.pid == pid && it.processName.endsWith(":onfido_process")
        }
    }

    /**
     * Checks if the application is currently running in the foreground.
     * https://stackoverflow.com/a/8490088/8398300
     */
    private fun isAppOnForeground(): Boolean {
        val activityManager = applicationContext.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val appProcesses = activityManager.runningAppProcesses ?: return false
        val packageName: String = applicationContext.getPackageName()
        for (appProcess in appProcesses) {
            if (appProcess.importance == RunningAppProcessInfo.IMPORTANCE_FOREGROUND &&
                appProcess.processName == packageName
            ) {
                return true
            }
        }
        return false
    }
}
