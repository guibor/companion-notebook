// Fixed-purpose read-only RGB32 extraction. The deployment wrapper owns the
// exact process/view identity and exclusive output file; this helper never opens
// an output path, touches input devices, or reads non-visible row padding.
#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <fcntl.h>
#include <limits.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>

enum { ROW_BYTES = 6480, STRIDE = 6528, ROWS = 2160, MAX_INTERRUPTS = 16 };
#define ADDRESS_LIMIT UINT64_C(0x1000000000000)
#define READ_SPAN ((uint64_t)(ROWS - 1) * STRIDE + ROW_BYTES)
_Static_assert(sizeof(off_t) >= 8, "64-bit pread offsets required");

static int fail(const char *message) {
    fputs(message, stderr);
    fputc('\n', stderr);
    return 1;
}

static int parse_pid(const char *text, unsigned int *pid) {
    if (!text || text[0] < '1' || text[0] > '9') return 0;
    unsigned int value = 0;
    for (const unsigned char *p = (const unsigned char *)text; *p; ++p) {
        if (*p < '0' || *p > '9') return 0;
        unsigned int digit = *p - '0';
        if (value > ((unsigned int)INT_MAX - digit) / 10) return 0;
        value = value * 10 + digit;
    }
    *pid = value;
    return 1;
}

static int parse_address(const char *text, uint64_t *address) {
    if (!text || text[0] != '0' || text[1] != 'x') return 0;
    size_t digits = strlen(text + 2);
    if (digits < 1 || digits > 12) return 0;
    uint64_t value = 0;
    for (const unsigned char *p = (const unsigned char *)text + 2; *p; ++p) {
        unsigned int digit;
        if (*p >= '0' && *p <= '9') digit = *p - '0';
        else if (*p >= 'a' && *p <= 'f') digit = *p - 'a' + 10;
        else return 0;
        value = value * 16 + digit;
    }
    if (value < 65536 || value > ADDRESS_LIMIT - READ_SPAN) return 0;
    *address = value;
    return 1;
}

// Tests include this actual implementation with syscall shims; the staged
// binary is built without either override or the desktop-only fixture main.
#ifndef FRAME_PREAD
#define FRAME_PREAD pread
#endif
#ifndef FRAME_WRITE
#define FRAME_WRITE write
#endif
static int copy_visible_rows(int fd, uint64_t address) {
    unsigned char row[ROW_BYTES];
    for (unsigned int y = 0; y < ROWS; ++y) {
        size_t done = 0;
        unsigned int interruptions = 0;
        while (done < sizeof(row)) {
            ssize_t got = FRAME_PREAD(fd, row + done, sizeof(row) - done,
                                     (off_t)(address + (uint64_t)y * STRIDE + done));
            if (got < 0 && errno == EINTR && ++interruptions <= MAX_INTERRUPTS) continue;
            if (got <= 0 || (size_t)got > sizeof(row) - done) return fail("Visible row read failed");
            done += (size_t)got;
        }
        done = 0;
        interruptions = 0;
        while (done < sizeof(row)) {
            ssize_t sent = FRAME_WRITE(STDOUT_FILENO, row + done, sizeof(row) - done);
            if (sent < 0 && errno == EINTR && ++interruptions <= MAX_INTERRUPTS) continue;
            if (sent <= 0 || (size_t)sent > sizeof(row) - done) return fail("Visible row output failed");
            done += (size_t)sent;
        }
    }
    return 0;
}

int main(int argc, char **argv) {
    // A second hard bound inside the wrapper's five-second process timeout.
    alarm(4);
    uint64_t address;
    unsigned int pid;
    char path[64];
    const char *input;
#ifdef FRAME_DESKTOP_FIXTURE
    // This entry point exists only in a separate local-test executable. It is
    // never cross-built, copied into the visual capsule, or accepted by its hash.
    if (argc != 4 || strcmp(argv[1], "--fixture") != 0 || !parse_address(argv[3], &address))
        return fail("Expected desktop fixture path and address");
    // Keep strict PID parsing covered by the separate syscall harness too.
    (void)pid; (void)path; (void)parse_pid;
    input = argv[2];
#else
    if (argc != 3 || !parse_pid(argv[1], &pid) || !parse_address(argv[2], &address))
        return fail("Expected exact PID and buffer address");
    int size = snprintf(path, sizeof(path), "/proc/%u/mem", pid);
    if (size < 0 || (size_t)size >= sizeof(path)) return fail("Process path overflow");
    input = path;
#endif
    int fd = open(input, O_RDONLY | O_CLOEXEC | O_NOFOLLOW);
    if (fd < 0) return fail("Read-only buffer open failed");
    struct stat st;
    if (fstat(fd, &st) != 0 || !S_ISREG(st.st_mode)) {
        close(fd);
        return fail("Buffer descriptor is not a regular memory file");
    }
    int result = copy_visible_rows(fd, address);
    if (close(fd) != 0) result = fail("Buffer close failed");
    return result;
}
