# ----------------------------------
# Configurazione base di ProGuard
# ----------------------------------
-dontobfuscate
-dontoptimize
-dontpreverify
-printmapping mapping.txt
-printusage unused.txt
-printseeds seeds.txt

# ----------------------------------
# React Native e Dipendenze
# ----------------------------------
# React Native core
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.soloader.** { *; }

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.swmansion.common.** { *; }

# TurboModules
-keep class com.facebook.react.turbomodule.** { *; }

# JSI
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.proguard.annotations.** { *; }
-keep class com.facebook.proguard.annotations.DoNotStrip

# ----------------------------------
# Firebase
# ----------------------------------
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-keep class org.chromium.** { *; }

# Crashlytics
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception

# ----------------------------------
# Altre Dipendenze Comuni
# ----------------------------------
# react-native-vector-icons
-keep class com.oblador.vectoricons.** { *; }

# SQLite
-keep class org.sqlite.** { *; }
-keep class io.liteglue.** { *; }

# ----------------------------------
# Configurazioni aggiuntive
# ----------------------------------
# Mantieni le classi native
-keepclasseswithmembernames class * {
    native <methods>;
}

# Mantieni i metodi chiamati tramite reflection
-keepclassmembers class ** {
    @com.facebook.react.uimanager.annotations.ReactProp <methods>;
    @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>;
}

# Mantieni le viste
-keep public class * extends android.view.View {
    public <init>(android.content.Context);
    public <init>(android.content.Context, android.util.AttributeSet);
    public <init>(android.content.Context, android.util.AttributeSet, int);
    public void set*(***);
}

# Mantieni le attività
-keep public class * extends android.app.Activity

# Mantieni i gestori di click
-keepclassmembers class * extends android.content.Context {
    public void *(android.view.View);
}