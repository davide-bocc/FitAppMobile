cmake_minimum_required(VERSION 3.18)
project(featureflagsjni)

# Percorso ReactCommon
set(REACT_COMMON_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../node_modules/react-native/ReactCommon")

# Libreria condivisa nativa
add_library(react_featureflagsjni SHARED
    ${REACT_COMMON_DIR}/react/featureflags/ReactNativeFeatureFlags.cpp
    ${REACT_COMMON_DIR}/react/featureflags/ReactNativeFeatureFlagsAccessor.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/ReactNativeFeatureFlagsCxxInterop.cpp
)

# Include directories
target_include_directories(react_featureflagsjni PUBLIC
    ${REACT_COMMON_DIR}/react/featureflags
    ${REACT_COMMON_DIR}
)

# Link eventuali librerie necessarie (log e c++_shared)
find_library(log-lib log)
target_link_libraries(react_featureflagsjni PUBLIC ${log-lib} c++_shared)
