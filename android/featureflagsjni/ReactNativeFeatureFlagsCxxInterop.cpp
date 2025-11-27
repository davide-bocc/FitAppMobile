#include <jni.h>
#include "ReactNativeFeatureFlags.h"

extern "C" JNIEXPORT jboolean JNICALL
Java_com_facebook_react_internal_featureflags_ReactNativeFeatureFlagsCxxInterop_enableBridgelessArchitecture(
    JNIEnv* env,
    jobject /* this */) {
    return facebook::react::ReactNativeFeatureFlags::enableBridgelessArchitecture() ? JNI_TRUE : JNI_FALSE;
}
