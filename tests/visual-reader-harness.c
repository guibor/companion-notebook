// Isolated syscall tests of the actual production row copier. No proc/input IO.
#define _POSIX_C_SOURCE 200809L
#include <sys/types.h>
#include <stddef.h>
static ssize_t fake_pread(int, void *, size_t, off_t);
static ssize_t fake_write(int, const void *, size_t);
#define FRAME_PREAD fake_pread
#define FRAME_WRITE fake_write
#define main production_main
#include "../ops/read-visual-frame.c"
#undef main
#include <assert.h>
#include <stdlib.h>

static const char *scenario;
static size_t read_calls, write_calls, emitted;
static ssize_t fake_pread(int fd, void *buffer, size_t count, off_t offset) {
    assert(fd == 17 && offset >= 65536);
    uint64_t relative = (uint64_t)offset - 65536;
    size_t y = relative / STRIDE, x = relative % STRIDE;
    assert(y < ROWS && x < ROW_BYTES && count <= ROW_BYTES - x);
    ++read_calls;
    if (!strcmp(scenario, "read-eof")) return 0;
    if (!strcmp(scenario, "read-error")) { errno = EIO; return -1; }
    if (!strcmp(scenario, "read-interrupt-forever") ||
        (!strcmp(scenario, "partial-interrupted") && read_calls == 1)) {
        errno = EINTR; return -1;
    }
    size_t got = !strcmp(scenario, "partial-interrupted") && count > 137 ? 137 : count;
    memset(buffer, (int)(y % 240), got);
    return (ssize_t)got;
}
static ssize_t fake_write(int fd, const void *buffer, size_t count) {
    assert(fd == STDOUT_FILENO);
    ++write_calls;
    if (!strcmp(scenario, "write-zero")) return 0;
    if (!strcmp(scenario, "write-error")) { errno = EIO; return -1; }
    if (!strcmp(scenario, "write-interrupt-forever") ||
        (!strcmp(scenario, "partial-interrupted") && write_calls == 1)) {
        errno = EINTR; return -1;
    }
    size_t sent = !strcmp(scenario, "partial-interrupted") && count > 97 ? 97 : count;
    const unsigned char *bytes = buffer;
    for (size_t i = 0; i < sent; ++i) assert(bytes[i] == (emitted / ROW_BYTES) % 240);
    emitted += sent;
    return (ssize_t)sent;
}
int main(int argc, char **argv) {
    assert(argc == 2); scenario = argv[1];
    if (!strcmp(scenario, "parse")) {
        unsigned int pid; uint64_t address;
        assert(parse_pid("1", &pid) && pid == 1);
        assert(parse_pid("2147483647", &pid) && pid == INT_MAX);
        const char *bad_pid[] = {"", "0", "01", "-1", "+1", "1x", "1/../2", " 1", "2147483648", "999999999999999999"};
        for (size_t i = 0; i < sizeof(bad_pid)/sizeof(*bad_pid); ++i) assert(!parse_pid(bad_pid[i], &pid));
        assert(parse_address("0x10000", &address) && address == 65536);
        char edge[32];
        snprintf(edge, sizeof(edge), "0x%llx", (unsigned long long)(ADDRESS_LIMIT - READ_SPAN));
        assert(parse_address(edge, &address));
        snprintf(edge, sizeof(edge), "0x%llx", (unsigned long long)(ADDRESS_LIMIT - READ_SPAN + 1));
        assert(!parse_address(edge, &address));
        const char *bad_address[] = {"", "0", "0x", "0xffff", "65536", "-0x10000", "+0x10000", "0X10000", "0x1ABCD", "0x10000 ", "0x10000z", "0xffffffffffff", "0x1000000000000"};
        for (size_t i = 0; i < sizeof(bad_address)/sizeof(*bad_address); ++i) assert(!parse_address(bad_address[i], &address));
        return 0;
    }
    int result = copy_visible_rows(17, 65536);
    if (!strcmp(scenario, "normal") || !strcmp(scenario, "partial-interrupted")) {
        assert(result == 0 && emitted == (size_t)ROW_BYTES * ROWS);
        if (!strcmp(scenario, "normal")) assert(read_calls == ROWS && write_calls == ROWS);
    } else {
        assert(result != 0 && emitted == 0);
        assert(read_calls <= MAX_INTERRUPTS + 1 && write_calls <= MAX_INTERRUPTS + 1);
    }
    return 0;
}
