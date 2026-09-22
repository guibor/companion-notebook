// Non-Qt exec-child regression. No native application, extensions, display,
// input device, notebook, security helper, settings, or network operations.
#define _GNU_SOURCE
#include <dlfcn.h>
#include <link.h>
#include <limits.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

static int forbidden, bootstrapMapped;
static char expectedBootstrap[PATH_MAX];
static int inspect(struct dl_phdr_info *info, size_t size, void *data)
{
    (void)size; (void)data;
    if (strstr(info->dlpi_name, "libQt6")
        || strstr(info->dlpi_name, "libcompanionadmissionplugin")) forbidden = 1;
    if (strcmp(info->dlpi_name, expectedBootstrap) == 0) bootstrapMapped = 1;
    return 0;
}
int main(int argc, char **argv)
{
    (void)argv;
    alarm(3);
    if (argc != 1) return 2;
    char executable[PATH_MAX];
    const ssize_t count = readlink("/proc/self/exe", executable, sizeof(executable) - 1);
    if (count < 1 || count >= (ssize_t)sizeof(executable) - 1) return 4;
    executable[count] = 0;
    char *slash = strrchr(executable, '/');
    if (!slash) return 4;
    *slash = 0;
    const int length = snprintf(expectedBootstrap, sizeof(expectedBootstrap),
        "%s/libcompanionbootstrap.so", executable);
    if (length < 0 || length >= (int)sizeof(expectedBootstrap)) return 4;
    dl_iterate_phdr(inspect, NULL);
    if (forbidden || dlsym(RTLD_DEFAULT, "_Z21qRegisterResourceDataiPKhS0_S0_")) {
        fputs("ADMISSION_CHILD_FAIL: inherited Qt or admission module\n", stderr);
        return 1;
    }
    const char *preload = getenv("LD_PRELOAD");
    if (!bootstrapMapped || !preload || strcmp(preload, expectedBootstrap) != 0) {
        fputs("ADMISSION_CHILD_FAIL: exact inherited bootstrap missing\n", stderr);
        return 1;
    }
    // Numeric output models a helper protocol. Any constructor chatter, extra
    // output, changed status or inherited GUI dependency must fail the parent.
    return puts("6") < 0 ? 3 : 0;
}
