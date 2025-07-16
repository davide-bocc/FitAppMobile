package com.example.fitapp;

import android.os.Build;
import android.os.Bundle;
import java.io.IOException;
import android.util.Log;
import com.example.fitapp.BuildConfig;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

import expo.modules.ReactActivityDelegateWrapper;

public class MainActivity extends ReactActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    // Avvia server Node.js (tua personalizzazione)
    new Thread(() -> {
        try {
            Runtime.getRuntime().exec("node " + getFilesDir() + "/../assets/server.js");
        } catch (IOException e) {
            Log.e("NodeError", e.getMessage());
        }
    }).start();

    super.onCreate(savedInstanceState);
  }

  @Override
  protected String getMainComponentName() {
    return "main"; // Mantieni il tuo nome del componente
  }

  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    // Modifica per RN 0.73.x
    return new ReactActivityDelegateWrapper(
      this,
      new DefaultReactActivityDelegate(
        this,
        getMainComponentName(),
        DefaultNewArchitectureEntryPoint.getFabricEnabled(),
        DefaultNewArchitectureEntryPoint.getConcurrentReactEnabled() // Nuovo parametro
      )
    );
  }

  @Override
  public void invokeDefaultOnBackPressed() {
    if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
      if (!moveTaskToBack(false)) {
        super.invokeDefaultOnBackPressed();
      }
      return;
    }
    super.invokeDefaultOnBackPressed();
  }
}