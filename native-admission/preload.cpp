// This bootstrap deliberately has NO Qt runtime dependency. It is inherited by
// exec children through LD_PRELOAD, but must never pull Qt/XOVI GUI extensions
// into the non-Qt helpers whose stdout the native app parses as a protocol.
// Public headers provide the exact empty-tag ABI; QT_NO_VERSION_TAGGING prevents
// those headers from adding a Qt dependency. No firmware offsets or trampolines.
#include <QtCore/qnamespace.h>
#include <dlfcn.h>
#include <limits.h>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <unistd.h>

class QObject;
class QThread;
using Move = bool (*)(QObject *, QThread *, Qt::Disambiguated_t);
using Observe = void (*)(QObject *, QThread *, bool);
static constexpr const char symbol[] = "_ZN7QObject12moveToThreadEP7QThreadN2Qt15Disambiguated_tE";
static Move originalMove;
static Observe observeMove;
static pid_t ownerPid;
static void fail(const char *reason)
{
    std::fprintf(stderr, "Companion bootstrap: %s\n", reason);
    _exit(126);
}
__attribute__((constructor)) static void initializeBootstrap()
{
    char executable[PATH_MAX], ownPath[PATH_MAX], root[PATH_MAX];
    const auto size = readlink("/proc/self/exe", executable, sizeof(executable) - 1);
    if (size < 1 || size >= static_cast<ssize_t>(sizeof(executable) - 1)) return;
    executable[size] = 0;
    const bool native = std::strcmp(executable, "/usr/bin/xochitl") == 0;
    Dl_info info {};
    if (!dladdr(reinterpret_cast<void *>(&initializeBootstrap), &info)
        || !info.dli_fname || !realpath(info.dli_fname, ownPath)) {
        if (native) fail("own path unavailable");
        return; // A foreign exec child must remain silent and unaffected.
    }
    std::strcpy(root, ownPath);
    char *slash = std::strrchr(root, '/');
    if (!slash) {
        if (native) fail("own directory unavailable");
        return;
    }
    *slash = 0;
    char smokePath[PATH_MAX];
    int length = std::snprintf(smokePath, sizeof(smokePath), "%s/admission-smoke", root);
    if (length < 0 || length >= static_cast<int>(sizeof(smokePath))) {
        if (native) fail("smoke path too long");
        return;
    }
    // The only non-native entry is our own adjacent, hash-checked standalone
    // smoke executable. It is not included in a UI installation capsule.
    if (!native && std::strcmp(executable, smokePath) != 0) return;
    const auto original = reinterpret_cast<Move>(dlsym(RTLD_NEXT, symbol));
    if (!original) fail("original Qt moveToThread unresolved");
    __atomic_store_n(&originalMove, original, __ATOMIC_RELEASE);
    char modulePath[PATH_MAX];
    length = std::snprintf(modulePath, sizeof(modulePath),
        "%s/qml/Companion/Admission/libcompanionadmissionplugin.so", root);
    if (length < 0 || length >= static_cast<int>(sizeof(modulePath))) fail("module path too long");
    // The exact same canonical file is imported by QML later. Keep it resident,
    // local to this process, and out of the inherited preload environment.
    void *module = dlopen(modulePath, RTLD_NOW | RTLD_LOCAL | RTLD_NODELETE);
    if (!module) fail("resident admission module unavailable");
    const auto observe = reinterpret_cast<Observe>(dlsym(module, "companion_admission_observe_v1"));
    if (!observe) fail("resident observation bridge unavailable");
    ownerPid = getpid();
    __atomic_store_n(&observeMove, observe, __ATOMIC_RELEASE);
}

extern "C" __attribute__((visibility("default"))) bool companionMove(
    QObject *, QThread *, Qt::Disambiguated_t) asm("_ZN7QObject12moveToThreadEP7QThreadN2Qt15Disambiguated_tE");
extern "C" bool companionMove(QObject *object, QThread *target, Qt::Disambiguated_t tag)
{
    // Foreign Qt programs get transparent forwarding only. A fork without exec
    // must not call the parent's resident registry either.
    auto original = __atomic_load_n(&originalMove, __ATOMIC_ACQUIRE);
    if (!original) original = reinterpret_cast<Move>(dlsym(RTLD_NEXT, symbol));
    if (!original) fail("called Qt moveToThread without its original");
    const bool result = original(object, target, tag);
    const auto observe = __atomic_load_n(&observeMove, __ATOMIC_ACQUIRE);
    if (observe && ownerPid == getpid()) observe(object, target, result);
    return result;
}
