package fit.app.mobile

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactRootView

class MainActivity : ReactActivity() {

    override fun getMainComponentName(): String = "FitAppMobile"

    override fun createReactActivityDelegate(): ReactActivityDelegate {
        return object : ReactActivityDelegate(this, mainComponentName) {
            override fun createRootView(): ReactRootView {
                // In RN 0.70+ autolinking si occupa del GestureHandler
                return ReactRootView(this@MainActivity)
            }
        }
    }
}
