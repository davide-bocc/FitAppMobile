package com.facebook.react;

import android.app.Application;
import com.facebook.react.ReactPackage;
import java.util.Arrays;
import java.util.List;

// Pacchetti nativi
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import io.invertase.firebase.app.ReactNativeFirebaseAppPackage;
import io.invertase.firebase.auth.ReactNativeFirebaseAuthPackage;
import io.invertase.firebase.database.ReactNativeFirebaseDatabasePackage;
import io.invertase.firebase.firestore.ReactNativeFirebaseFirestorePackage;
import io.invertase.firebase.functions.ReactNativeFirebaseFunctionsPackage;
import io.invertase.firebase.storage.ReactNativeFirebaseStoragePackage;
import com.zoontek.rnbootsplash.RNBootSplashPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.ammarahmed.rnquicksqlite.ReactNativeQuickSQLitePackage;
import com.swmansion.reanimated.ReanimatedPackage;
import com.th3rdwave.safeareacontext.SafeAreaContextPackage;
import com.swmansion.rnscreens.RNScreensPackage;
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;
import com.reactnativecommunity.netinfo.NetInfoPackage;
import com.reactnativepicker.PickerPackage;
import expo.modules.av.AVPackage;
import expo.modules.asset.AssetPackage;
import expo.modules.core.ExpoModulesPackage;
import com.swmansion.svg.SvgPackage;

public class PackageList {
    private Application application;

    public PackageList(Application application) {
        this.application = application;
    }

    public List<ReactPackage> getPackages() {
        return Arrays.<ReactPackage>asList(
            new RNGestureHandlerPackage(),
            new ReactNativeFirebaseAppPackage(),
            new ReactNativeFirebaseAuthPackage(),
            new ReactNativeFirebaseDatabasePackage(),
            new ReactNativeFirebaseFirestorePackage(),
            new ReactNativeFirebaseFunctionsPackage(),
            new ReactNativeFirebaseStoragePackage(),
            new VectorIconsPackage(),
            new ReactNativeQuickSQLitePackage(),
            new ReanimatedPackage(),
            new SafeAreaContextPackage(),
            new RNScreensPackage(),
            new AsyncStoragePackage(),
            new NetInfoPackage(),
            new PickerPackage(),
            new AVPackage(),
            new AssetPackage(),
            new ExpoModulesPackage(),
            new SvgPackage()
        );
    }
}
