// Public Qt symbol interposition only. No firmware offsets, text patching, input
// injection, or XOVI trampoline. This DSO must remain loaded until process exit.
#include "admissiongate.h"
#include <QObject>
#include <QThread>
#include <dlfcn.h>
#include <unistd.h>

using Move = bool (*)(QObject *, QThread *, Qt::Disambiguated_t);
static constexpr const char symbol[] = "_ZN7QObject12moveToThreadEP7QThreadN2Qt15Disambiguated_tE";
static Move original()
{
    static auto function = reinterpret_cast<Move>(dlsym(RTLD_NEXT, symbol));
    if (!function) {
        static constexpr char error[] = "Companion admission: original Qt moveToThread unresolved\n";
        (void)!write(STDERR_FILENO, error, sizeof(error) - 1);
        _exit(126); // Fail before calling through a missing public ABI.
    }
    return function;
}
__attribute__((constructor)) static void resolveOriginal() { (void)original(); }

extern "C" __attribute__((visibility("default"))) bool companionMove(
    QObject *, QThread *, Qt::Disambiguated_t) asm("_ZN7QObject12moveToThreadEP7QThreadN2Qt15Disambiguated_tE");
extern "C" bool companionMove(QObject *object, QThread *target, Qt::Disambiguated_t tag)
{
    const bool result = original()(object, target, tag);
    companionObserveSelfMove(object, target, result);
    return result;
}
