package fit.app.mobile

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {

    override val reactNativeHost: ReactNativeHost = object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> {
            // Ritorna una lista vuota per ora
            return emptyList()
        }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        // Disabilitato temporaneamente
        override val isNewArchEnabled: Boolean = false
    }

    override fun onCreate() {
        super.onCreate()

        // Prova a caricare la libreria, ma ignora l'errore se non esiste
        try {
            System.loadLibrary("react_featureflagsjni")
        } catch (e: UnsatisfiedLinkError) {
            // Ignora l'errore se la libreria non esiste
            println("Libreria react_featureflagsjni non trovata, usando valori di default")
        }

        SoLoader.init(this, false)
    }
}
