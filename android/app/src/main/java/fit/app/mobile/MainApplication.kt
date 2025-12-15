package fit.app.mobile

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {

    private val newArchitectureEnabled = true

    override val reactNativeHost: ReactNativeHost = object : DefaultReactNativeHost(this) {
        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
        override fun getJSMainModuleName(): String = "index"

        override fun getPackages(): List<ReactPackage> {
            return mutableListOf()
        }

        // Nuova architettura attiva
        override val isNewArchEnabled: Boolean
            get() = newArchitectureEnabled
    }

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, false)
    }
}
