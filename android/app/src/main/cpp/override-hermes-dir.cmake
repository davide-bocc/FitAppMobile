# override-hermes-dir.cmake

# Set root path
if(NOT DEFINED PROJECT_ROOT)
  get_filename_component(PROJECT_ROOT "${CMAKE_CURRENT_LIST_DIR}/../../../../.." ABSOLUTE)
endif()

# Disable unit tests early
set(HERMES_ENABLE_UNIT_TESTS OFF CACHE BOOL "Disable Hermes unit tests" FORCE)

# Disable Hermes unittests folder
set(HERMES_SOURCE_DIR "${PROJECT_ROOT}/node_modules/react-native/ReactAndroid/hermes-engine/hermes")
file(TO_CMAKE_PATH "${HERMES_SOURCE_DIR}" HERMES_SOURCE_DIR)
if(EXISTS "${HERMES_SOURCE_DIR}/unittests")
  file(RENAME "${HERMES_SOURCE_DIR}/unittests" "${HERMES_SOURCE_DIR}/__unittests_disabled")
  message(STATUS "✅ [Override] Hermes unittests folder disabled")
endif()
