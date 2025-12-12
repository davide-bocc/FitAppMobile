package fit.app.mobile

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.shell.MainReactPackage
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {

    override val reactNativeHost: ReactNativeHost = object : DefaultReactNativeHost(this) {
        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
        override fun getJSMainModuleName(): String = "index"
        override val isNewArchEnabled: Boolean = true
        override fun getPackages(): MutableList<ReactPackage> = mutableListOf()
    }

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, false)
    }
}
