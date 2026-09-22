add_executable(tst_retirementobserver tst_retirementobserver.cpp)
set_target_properties(tst_retirementobserver PROPERTIES AUTOMOC ON)
target_include_directories(tst_retirementobserver PRIVATE
    "${CMAKE_CURRENT_SOURCE_DIR}/../../native-observer")
target_link_libraries(tst_retirementobserver PRIVATE
    retirementobserver Qt6::Core Qt6::Qml Qt6::Test)
target_compile_definitions(tst_retirementobserver PRIVATE
    TEST_OBSERVER_IMPORT_DIR="${CMAKE_BINARY_DIR}/qml")
add_dependencies(tst_retirementobserver companionlifecycleplugin)
add_test(NAME retirementobserver COMMAND tst_retirementobserver)
