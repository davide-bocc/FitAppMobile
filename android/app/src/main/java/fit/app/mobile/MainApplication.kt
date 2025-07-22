package fit.app.mobile

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.shell.MainReactPackage
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {
    // 1. Sposta la dichiarazione della proprietà reactNativeHost
    override val reactNativeHost: ReactNativeHost = object : ReactNativeHost(this) {
        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override fun getPackages(): MutableList<ReactPackage> =
            mutableListOf(
                MainReactPackage()
                // Aggiungi qui altri pacchetti
            )

        override fun getJSMainModuleName(): String = "index"
    }

    // 2. Rimuovi il metodo getReactNativeHost() poiché è già fornito dalla property

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, false)
    }
}