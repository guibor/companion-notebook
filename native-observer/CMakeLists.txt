cmake_minimum_required(VERSION 3.21)
project(companion_native_observer VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_AUTOMOC ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

find_package(Qt6 6.8 REQUIRED COMPONENTS Core Qml)

add_library(retirementobserver STATIC retirementobserver.cpp retirementobserver.h)
target_link_libraries(retirementobserver PUBLIC Qt6::Core)
target_include_directories(retirementobserver PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}")
target_compile_options(retirementobserver PRIVATE -Wall -Wextra -Werror)

add_library(companionlifecycleplugin MODULE plugin.cpp)
target_link_libraries(companionlifecycleplugin PRIVATE retirementobserver Qt6::Qml)
target_compile_options(companionlifecycleplugin PRIVATE -Wall -Wextra -Werror)
set_target_properties(companionlifecycleplugin PROPERTIES
    LIBRARY_OUTPUT_DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}/qml/Companion/Lifecycle")
configure_file(qmldir "${CMAKE_CURRENT_BINARY_DIR}/qml/Companion/Lifecycle/qmldir" COPYONLY)

include(CTest)
if(BUILD_TESTING)
    find_package(Qt6 6.8 REQUIRED COMPONENTS Test)
    add_subdirectory("${CMAKE_CURRENT_SOURCE_DIR}/../tests/native-observer"
                     "${CMAKE_CURRENT_BINARY_DIR}/tests")
endif()
