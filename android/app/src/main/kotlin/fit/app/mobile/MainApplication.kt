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

        override fun getPackages(): MutableList<ReactPackage> {
            // Lista dei pacchetti, anche solo MainReactPackage è sufficiente per partire
            return mutableListOf(MainReactPackage())
        }
    }

    override fun onCreate() {
        super.onCreate()

        // Carica la libreria opzionale, ignora se non esiste
        try {
            System.loadLibrary("react_featureflagsjni")
        } catch (e: UnsatisfiedLinkError) {
            println("Libreria react_featureflagsjni non trovata, usando valori di default")
        }

        SoLoader.init(this, false)
    }
}


