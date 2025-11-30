# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Workaround per evitare errori su flag non supportate da Clang su Android
if (CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  add_compile_options(-Wno-class-memaccess)
endif()

cmake_minimum_required(VERSION 3.13)
project(ReactAndroid)

# --- Project root ---
get_filename_component(PROJECT_ROOT "${CMAKE_CURRENT_LIST_DIR}/../../../../.." ABSOLUTE)
file(TO_CMAKE_PATH "${PROJECT_ROOT}" PROJECT_ROOT)
message(STATUS "📁 Project root directory: ${PROJECT_ROOT}")

# --- React dirs ---
set(REACT_ANDROID_DIR "${PROJECT_ROOT}/node_modules/react-native/ReactAndroid")
set(REACT_COMMON_DIR "${PROJECT_ROOT}/node_modules/react-native/ReactCommon")
file(TO_CMAKE_PATH "${REACT_ANDROID_DIR}" REACT_ANDROID_DIR)
file(TO_CMAKE_PATH "${REACT_COMMON_DIR}" REACT_COMMON_DIR)

# --- Skip Boost / Folly / other third-party local builds (use prefab) ---
option(HERMES_ENABLE "Enable Hermes engine" OFF)

# --- Skip find_package ReactAndroid ---
set(REACTNATIVE_SKIP_FIND_PACKAGE TRUE)

# --- Imposta ReactAndroid_DIR fittizio per bypass find_package ---
if(NOT DEFINED ReactAndroid_DIR)
  set(ReactAndroid_DIR "${CMAKE_CURRENT_LIST_DIR}/../..")
  message(STATUS "ℹ️ ReactAndroid_DIR impostato fittizio per bypass find_package")
endif()

# --- ccache ---
find_program(CCACHE_FOUND ccache)
if(CCACHE_FOUND)
  set_property(GLOBAL PROPERTY RULE_LAUNCH_COMPILE ccache)
  set_property(GLOBAL PROPERTY RULE_LAUNCH_LINK ccache)
  message(STATUS "✅ ccache abilitato")
endif()

add_link_options(-Wl,--build-id)
add_compile_options(-Wall -Werror)

# --- Funzioni per aggiungere subdirectory ---
function(add_react_android_subdir relative_path)
  set(target_dir "${REACT_ANDROID_DIR}/${relative_path}")
  file(TO_CMAKE_PATH "${target_dir}/CMakeLists.txt" cmake_lists_path)
  if(EXISTS "${cmake_lists_path}")
    string(REPLACE "/" "_" rel_path_underscore "${relative_path}")
    add_subdirectory("${target_dir}" "${CMAKE_BINARY_DIR}/ReactAndroid_${rel_path_underscore}")
    message(STATUS "✅ Added ReactAndroid subdir: ${target_dir}")
  endif()
endfunction()

function(add_react_common_subdir relative_path)
  set(target_dir "${REACT_COMMON_DIR}/${relative_path}")
  file(TO_CMAKE_PATH "${target_dir}/CMakeLists.txt" cmake_lists_path)
  if(EXISTS "${cmake_lists_path}")
    string(REPLACE "/" "_" rel_path_underscore "${relative_path}")
    add_subdirectory("${target_dir}" "${CMAKE_BINARY_DIR}/ReactCommon_${rel_path_underscore}")
    message(STATUS "✅ Added ReactCommon subdir: ${target_dir}")
  endif()
endfunction()

function(add_react_build_subdir relative_path)
  set(subdir_path "${REACT_ANDROID_DIR}/build/${relative_path}")
  file(TO_CMAKE_PATH "${subdir_path}/CMakeLists.txt" cmake_lists_path)
  if(EXISTS "${cmake_lists_path}")
    string(REPLACE "/" "_" relative_path_underscore "${relative_path}")
    add_subdirectory("${subdir_path}" "${CMAKE_BINARY_DIR}/react_build_${relative_path_underscore}")
    message(STATUS "✅ Added build subdir: ${subdir_path}")
  else()
    message(WARNING "⚠️ Build subdir not found: ${subdir_path}, skipping")
  endif()
endfunction()

# ⚠️ Funzione NDK disabilitata (non usiamo più third-party NDK locali)
function(add_react_third_party_ndk_subdir_safe subdir)
  message(WARNING "⛔ Skipping legacy third-party NDK build: ${subdir}")
endfunction()

# --- Gestione Codegen e Target Mancanti ---
if(NOT EXISTS ${CMAKE_SOURCE_DIR}/../../../../node_modules/react-native/ReactAndroid/build/generated/source/codegen/jni)
    message(WARNING "⚠️ Codegen directory not found, creating dummy OBJECT targets")

    # Crea directory temporanea per i file fittizi
    set(CODEGEN_DUMMY_DIR "${CMAKE_BINARY_DIR}/codegen_dummy")
    file(MAKE_DIRECTORY ${CODEGEN_DUMMY_DIR})

    # Crea file sorgenti fittizi per i target OBJECT
    if(NOT EXISTS "${CODEGEN_DUMMY_DIR}/react_codegen_rncore.cpp")
        file(WRITE "${CODEGEN_DUMMY_DIR}/react_codegen_rncore.cpp" "// Dummy file for react_codegen_rncore\n")
    endif()

    if(NOT EXISTS "${CODEGEN_DUMMY_DIR}/react_codegen_rncore_modules.cpp")
        file(WRITE "${CODEGEN_DUMMY_DIR}/react_codegen_rncore_modules.cpp" "// Dummy file for react_codegen_rncore_modules\n")
    endif()

    if(NOT EXISTS "${CODEGEN_DUMMY_DIR}/react_codegen_rncore_specs.cpp")
        file(WRITE "${CODEGEN_DUMMY_DIR}/react_codegen_rncore_specs.cpp" "// Dummy file for react_codegen_rncore_specs\n")
    endif()

    # Crea target OBJECT invece di INTERFACE
    if(NOT TARGET react_codegen_rncore)
        add_library(react_codegen_rncore OBJECT "${CODEGEN_DUMMY_DIR}/react_codegen_rncore.cpp")
        set_target_properties(react_codegen_rncore PROPERTIES
            CXX_STANDARD 17
        )
    endif()

    if(NOT TARGET react_codegen_rncore_modules)
        add_library(react_codegen_rncore_modules OBJECT "${CODEGEN_DUMMY_DIR}/react_codegen_rncore_modules.cpp")
        set_target_properties(react_codegen_rncore_modules PROPERTIES
            CXX_STANDARD 17
        )
    endif()

    if(NOT TARGET react_codegen_rncore_specs)
        add_library(react_codegen_rncore_specs OBJECT "${CODEGEN_DUMMY_DIR}/react_codegen_rncore_specs.cpp")
        set_target_properties(react_codegen_rncore_specs PROPERTIES
            CXX_STANDARD 17
        )
    endif()
endif()

# --- Subdirectory ReactAndroid e ReactCommon ---
# add_react_build_subdir(generated/source/codegen/jni)

# ❌ Terze parti non incluse (Prefab le gestisce)
# add_react_third_party_ndk_subdir_safe(glog)
# add_react_third_party_ndk_subdir_safe(boost)
# add_react_third_party_ndk_subdir_safe(double-conversion)
# add_react_third_party_ndk_subdir_safe(folly)
# add_react_third_party_ndk_subdir_safe(fast_float)
# add_react_third_party_ndk_subdir_safe(fmt)
# add_react_third_party_ndk_subdir_safe(googletest)

# --- ReactAndroid principali ---
add_react_android_subdir("fabric")
add_react_android_subdir("react/renderer")
add_react_android_subdir("react/bridging")
add_react_android_subdir("react/renderer/components/view")
add_react_android_subdir("react/renderer/components/image")
add_react_android_subdir("react/renderer/components/scrollview")
add_react_android_subdir("react/renderer/core")
add_react_android_subdir("react/renderer/telemetry")
add_react_android_subdir("react/renderer/uimanager")
add_react_android_subdir("react/renderer/textlayoutmanager")
add_react_android_subdir("react/renderer/graphics")
add_react_android_subdir("react/renderer/imagemanager")
add_react_android_subdir("react/renderer/mapbuffer")
add_react_android_subdir("react/renderer/mounting")
add_react_android_subdir("react/renderer/runtimescheduler")
add_react_android_subdir("react/renderer/element")
add_react_android_subdir("react/renderer/attributedstring")

# ---- FOLLY FIX ----
set(FOLLY_DIR "${REACT_COMMON_DIR}/folly")
message(STATUS "✅ Folly root: ${FOLLY_DIR}")

if(TARGET jsi)
  target_include_directories(jsi PRIVATE "${FOLLY_DIR}")
  message(STATUS "✅ Folly include applicati a JSI")
endif()

if(EXISTS "${FOLLY_DIR}/CMakeLists.txt")
  add_subdirectory("${FOLLY_DIR}" "${CMAKE_BINARY_DIR}/ReactCommon_folly")
  message(STATUS "✅ Folly aggiunto come subdirectory")
else()
  message(STATUS "⚠️ Nessun CMakeLists in Folly → header-only mode (OK)")
endif()

add_react_common_subdir("cxxreact")
add_react_common_subdir("react/nativemodule/core")
add_react_common_subdir("react/nativemodule/defaults")
# COMMENTATO PER EVITARE ERRORI
# add_react_common_subdir("react/nativemodule/dom")
add_react_common_subdir("react/nativemodule/featureflags")
add_react_common_subdir("react/nativemodule/idlecallbacks")
add_react_common_subdir("react/nativemodule/microtasks")
add_react_common_subdir("react/newarchdefaults")

# --- Libreria React FeatureFlags JNI ---
set(FEATUREFLAGSJNI_SRC "${REACT_COMMON_DIR}/react/nativemodule/featureflags/ReactFeatureFlagsJNI.cpp")

if(EXISTS "${FEATUREFLAGSJNI_SRC}")
    # Crea il target solo se non esiste già
    if(NOT TARGET react_featureflagsjni)
        add_library(react_featureflagsjni SHARED ${FEATUREFLAGSJNI_SRC})
        target_link_libraries(react_featureflagsjni
            jsi
            glog
            react_utils
        )
        message(STATUS "✅ ReactFeatureFlagsJNI target created from source")
    endif()
else()
    # Crea il target solo se non esiste già
    if(NOT TARGET react_featureflagsjni)
        message(WARNING "⚠️ ReactFeatureFlagsJNI.cpp non trovato, creo target INTERFACE vuoto")
        add_library(react_featureflagsjni INTERFACE)
        set_target_properties(react_featureflagsjni PROPERTIES
            INTERFACE_LINK_LIBRARIES ""
        )
    endif()
endif()
