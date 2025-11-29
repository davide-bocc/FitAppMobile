package fit.app.mobile

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {

    override val reactNativeHost: ReactNativeHost = object : DefaultReactNativeHost(this) {
        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override fun getJSMainModuleName(): String = "index"

        // Abilita la nuova architettura solo se vuoi usare Fabric/Bridgeless
        override val isNewArchEnabled: Boolean = true

        // Importantissimo: chiama il super per far partire l'autolinking
        override fun getPackages() = super.getPackages()
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

