/* Includes the production implementation with a fake input device. Every read,
 * write, open and ioctl is intercepted; the only real process test is SIGALRM
 * in a forked child. No tablet, /dev input or production artifact is accessed. */
#include <assert.h>
#include <errno.h>
#include <fcntl.h>
#include <linux/input.h>
#include <signal.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/ioctl.h>
#include <sys/stat.h>
#include <sys/wait.h>
#include <time.h>
#include <unistd.h>

static int write_calls, read_calls, open_calls;
static int opened_flags;
static unsigned alarm_at_open;
static bool alarm_default_at_open, alarm_unblocked_at_open;
static int write_error, write_error_count, fail_write_at, interrupt_write_at;
static bool short_write, clock_error, read_partial, read_eof;
static int sleep_calls, sleep_error, sleep_error_count, unexpected_after_sleep, interrupt_after_sleep;
static int read_error, read_error_count;
static double fake_now = 10;
static struct input_event written[128], observed[128];
static size_t observed_count, observed_pos, read_stride;
static ssize_t fake_write(int, const void *, size_t);
static ssize_t fake_read(int, void *, size_t);
static int fake_clock_gettime(clockid_t, struct timespec *);
static int fake_open(const char *, int, ...);
static int fake_ioctl(int, unsigned long, ...);
static int fake_nanosleep(const struct timespec *, struct timespec *);
static struct input_event sample(unsigned short, unsigned short, int);
static uid_t fake_geteuid(void) { return 0; }
#define write fake_write
#define read fake_read
#define clock_gettime fake_clock_gettime
#define open fake_open
#define ioctl fake_ioctl
#define nanosleep fake_nanosleep
#define geteuid fake_geteuid
#define main ink_events_production_main
#include "../ops/ink-events.c"
#undef main
#undef geteuid
#undef nanosleep
#undef ioctl
#undef open
#undef clock_gettime
#undef read
#undef write

static ssize_t fake_write(int f, const void *data, size_t n) {
    assert(f == 99 && n == sizeof(struct input_event));
    assert(write_calls < 128);
    written[write_calls++] = *(const struct input_event *)data;
    if (write_calls == interrupt_write_at) interrupted = 1;
    if (write_calls == fail_write_at) { errno = EIO; return -1; }
    if (write_error_count > 0) { --write_error_count; errno = write_error; return -1; }
    if (short_write) return (ssize_t)n - 1;
    return (ssize_t)n;
}
static ssize_t fake_read(int f, void *data, size_t n) {
    assert(f == 99);
    ++read_calls;
    assert(read_calls < 200); /* Turn accidental unbounded retries into failure. */
    if (read_error_count > 0) { --read_error_count; errno = read_error; return -1; }
    if (read_partial) { memset(data, 0, n); return sizeof(struct input_event) - 1; }
    if (read_eof) return 0;
    if (observed_pos == observed_count) { errno = EAGAIN; return -1; }
    size_t count = n / sizeof(struct input_event);
    if (read_stride && count > read_stride) count = read_stride;
    if (count > observed_count - observed_pos) count = observed_count - observed_pos;
    assert(count > 0);
    memcpy(data, observed + observed_pos, count * sizeof(struct input_event));
    observed_pos += count;
    return (ssize_t)(count * sizeof(struct input_event));
}
static int fake_clock_gettime(clockid_t clock_id, struct timespec *ts) {
    assert(clock_id == CLOCK_MONOTONIC);
    if (clock_error) { errno = EIO; return -1; }
    ts->tv_sec = (time_t)fake_now;
    ts->tv_nsec = (long)((fake_now - ts->tv_sec) * 1e9);
    return 0;
}
static int fake_open(const char *path, int flags, ...) {
    (void)path; ++open_calls; opened_flags = flags;
    struct sigaction disposition; sigset_t blocked;
    assert(sigaction(SIGALRM, NULL, &disposition) == 0);
    assert(sigprocmask(SIG_SETMASK, NULL, &blocked) == 0);
    alarm_default_at_open = disposition.sa_handler == SIG_DFL;
    alarm_unblocked_at_open = sigismember(&blocked, SIGALRM) == 0;
    alarm_at_open = alarm(0);
    errno = EACCES; return -1;
}
static int fake_ioctl(int f, unsigned long request, ...) {
    (void)f; (void)request; errno = ENOTTY; return -1;
}
static int fake_nanosleep(const struct timespec *requested, struct timespec *remaining) {
    ++sleep_calls;
    if (sleep_calls == interrupt_after_sleep) interrupted = 1;
    if (sleep_calls == unexpected_after_sleep) {
        observed[observed_count++] = sample(EV_ABS, ABS_X, 9000);
    }
    if (sleep_error_count > 0) {
        --sleep_error_count;
        if (remaining) *remaining = *requested;
        errno = sleep_error;
        return -1;
    }
    fake_now += requested->tv_sec + requested->tv_nsec / 1e9;
    return 0;
}
static void reset(void) {
    alarm(0);
    fd = 99; interrupted = 0; deadline = 18; fake_now = 10;
    monitoring = false; unexpected_input = false; expected_count = 0;
    distance.maximum = 255;
    write_calls = read_calls = open_calls = 0;
    opened_flags = 0; alarm_at_open = 0;
    alarm_default_at_open = alarm_unblocked_at_open = false;
    write_error = write_error_count = fail_write_at = interrupt_write_at = 0;
    short_write = clock_error = read_partial = read_eof = false;
    read_error = read_error_count = 0;
    sleep_calls = sleep_error = sleep_error_count = unexpected_after_sleep = interrupt_after_sleep = 0;
    observed_count = observed_pos = read_stride = 0;
    memset(written, 0, sizeof written); memset(observed, 0, sizeof observed);
}
static struct input_event sample(unsigned short type, unsigned short code, int value) {
    return (struct input_event){ .type = type, .code = code, .value = value };
}
static void expected_frame(void) {
    monitoring = true;
    expected[0] = sample(EV_ABS, ABS_X, 100);
    expected[1] = sample(EV_ABS, ABS_Y, 200);
    expected[2] = sample(EV_SYN, SYN_REPORT, 0);
    expected_count = 3;
}
static void check_release_sequence(void) {
    assert(write_calls == 5);
    const struct input_event want[] = {
        sample(EV_ABS, ABS_PRESSURE, 0), sample(EV_ABS, ABS_DISTANCE, 255),
        sample(EV_KEY, BTN_TOUCH, 0), sample(EV_KEY, BTN_TOOL_PEN, 0),
        sample(EV_SYN, SYN_REPORT, 0)
    };
    for (int i = 0; i < 5; ++i) {
        assert(written[i].type == want[i].type && written[i].code == want[i].code
            && written[i].value == want[i].value);
    }
}
static void write_cases(void) {
    reset(); assert(event(EV_ABS, ABS_X, 100)); assert(write_calls == 1);
    reset(); interrupted = 1; assert(!event(EV_KEY, BTN_TOUCH, 1)); assert(!write_calls);
    reset(); unexpected_input = true; assert(!event(EV_KEY, BTN_TOUCH, 1)); assert(!write_calls);
    reset(); fake_now = 19; assert(!within_deadline()); assert(!event(EV_KEY, BTN_TOUCH, 1)); assert(!write_calls);
    reset(); clock_error = true; assert(!within_deadline()); assert(!event(EV_KEY, BTN_TOUCH, 1)); assert(!write_calls);
    reset(); short_write = true; assert(!event(EV_ABS, ABS_X, 100)); assert(write_calls == 1);
    reset(); write_error = EAGAIN; write_error_count = 20;
    assert(!event(EV_ABS, ABS_X, 100)); assert(write_calls == 1);
    reset(); write_error = EINTR; write_error_count = 1;
    assert(event(EV_ABS, ABS_X, 100)); assert(write_calls == 2);
    reset(); write_error = EINTR; write_error_count = 100;
    assert(!event(EV_ABS, ABS_X, 100)); assert(write_calls <= 4);
    reset(); write_error = EINTR; write_error_count = 100; interrupt_write_at = 1;
    assert(!event(EV_ABS, ABS_X, 100)); assert(write_calls == 1);
    reset(); monitoring = true; assert(event(EV_ABS, ABS_X, 100));
    assert(expected_count == 1 && expected[0].type == EV_ABS && expected[0].code == ABS_X && expected[0].value == 100);
    reset(); monitoring = true; expected_count = 64;
    assert(!event(EV_ABS, ABS_X, 100)); assert(!write_calls);
    reset(); monitoring = true; short_write = true;
    assert(!event(EV_ABS, ABS_X, 100)); assert(expected_count == 0);
    reset(); monitoring = true;
    observed[0] = sample(EV_ABS, ABS_X, 100);
    observed[1] = sample(EV_SYN, SYN_REPORT, 0); observed_count = 2;
    assert(event(EV_ABS, ABS_X, 100)); assert(event(EV_SYN, SYN_REPORT, 0));
    assert(read_calls > 0 && expected_count == 0 && !unexpected_input);
    reset(); monitoring = true;
    observed[0] = sample(EV_ABS, ABS_X, 999); observed_count = 1;
    assert(event(EV_ABS, ABS_X, 100)); assert(!event(EV_SYN, SYN_REPORT, 0));
    assert(unexpected_input);
    puts("write: interruption/deadline/clock/short/EAGAIN/EINTR/capacity guards passed");
}
static void release_cases(void) {
    reset(); interrupted = 1; unexpected_input = true;
    assert(release_pen()); check_release_sequence();
    for (int i = 1; i <= 5; ++i) {
        reset(); interrupted = 1; unexpected_input = true; fail_write_at = i;
        assert(!release_pen()); check_release_sequence();
    }
    reset(); short_write = true; assert(!release_pen()); check_release_sequence();
    reset(); write_error = EINTR; write_error_count = 100;
    assert(!release_pen()); assert(write_calls >= 5 && write_calls <= 20);
    reset(); monitoring = true; interrupted = 1; unexpected_input = true; expected_count = 64;
    assert(!release_pen()); check_release_sequence();
    reset(); fake_now = 19; assert(!release_pen()); assert(!write_calls);
    puts("release: all five components attempted after interruption and each failed write");
}
static void read_cases(void) {
    reset(); expected_frame(); memcpy(observed, expected, 3 * sizeof(*expected)); observed_count = 3;
    assert(drain_marker()); assert(!unexpected_input && expected_count == 0);
    reset(); expected_frame(); observed[0] = expected[1]; observed[1] = expected[2]; observed_count = 2; read_stride = 1;
    assert(drain_marker()); assert(!unexpected_input && expected_count == 0);
    reset(); expected_frame(); assert(drain_marker()); assert(expected_count == 0);
    for (int variant = 0; variant < 6; ++variant) {
        reset(); expected_frame(); observed_count = 2; observed[0] = expected[0]; observed[1] = expected[2];
        if (variant == 0) observed[0].value = 101;
        if (variant == 1) { observed[0] = expected[1]; observed[1] = expected[0]; }
        if (variant == 2) observed[1] = expected[0];
        if (variant == 3) observed[0] = sample(EV_SYN, SYN_DROPPED, 0);
        if (variant == 4) { expected_count = 0; observed_count = 1; }
        if (variant == 5) observed[0] = sample(EV_KEY, BTN_TOOL_RUBBER, 1);
        assert(!drain_marker()); assert(unexpected_input);
        observed_pos = observed_count; assert(!event(EV_ABS, ABS_X, 100)); assert(!write_calls);
        assert(!drain_marker()); assert(unexpected_input);
    }
    reset(); expected_frame(); read_partial = true; assert(!drain_marker()); assert(unexpected_input);
    reset(); expected_frame(); read_eof = true; assert(!drain_marker()); assert(unexpected_input);
    reset(); expected_frame(); read_error = EIO; read_error_count = 1; assert(!drain_marker()); assert(unexpected_input);
    reset(); expected_frame(); read_error = EINTR; read_error_count = 1; assert(drain_marker()); assert(read_calls == 2);
    reset(); expected_frame(); read_error = EINTR; read_error_count = 100;
    assert(!drain_marker()); assert(read_calls <= 4 && unexpected_input);
    reset(); monitoring = true; expected_count = observed_count = 64; read_stride = 1;
    for (size_t i = 0; i < 64; ++i) expected[i] = observed[i] = sample(EV_ABS, ABS_X, (int)i);
    assert(!drain_marker()); assert(read_calls == 64 && unexpected_input);
    puts("monitor: exact/filtered echoes accepted; unexpected/out-of-order/partial/read errors sticky");
}
static void pause_cases(void) {
    const int durations[] = {12, 25, 600};
    for (size_t i = 0; i < sizeof durations / sizeof durations[0]; ++i) {
        reset(); monitoring = true; assert(pause_ms(durations[i]));
        assert(sleep_calls == (durations[i] + 4) / 5);
        reset(); monitoring = true; unexpected_after_sleep = 1;
        assert(!pause_ms(durations[i])); assert(unexpected_input && sleep_calls == 1);
        assert(!event(EV_KEY, BTN_TOUCH, 1)); assert(!write_calls);
    }
    reset(); monitoring = true; interrupt_after_sleep = 1;
    assert(!pause_ms(25)); assert(sleep_calls == 1);
    reset(); monitoring = true; sleep_error = EINTR; sleep_error_count = 100;
    assert(!pause_ms(25)); assert(sleep_calls <= 4);
    reset(); monitoring = true; deadline = fake_now + 0.001;
    assert(!pause_ms(25)); assert(sleep_calls == 1);
    puts("pause: 12/25/600ms gaps monitored; interruption/deadline/EINTR bounded");
}
static void deadline_setup_cases(void) {
    const char *modes[] = {"inspect", "release", "draw"};
    for (int i = 0; i < 3; ++i) {
        reset();
        char *args[] = {"ink-events", (char *)modes[i], "42", "/not-a-real-log", NULL};
        assert(ink_events_production_main(i == 2 ? 4 : 2, args) == 3);
        assert(open_calls == 1 && alarm_at_open == (i == 2 ? 8u : 2u));
        assert(alarm_default_at_open && alarm_unblocked_at_open);
        assert((opened_flags & (O_NONBLOCK | O_NOFOLLOW | O_CLOEXEC)) ==
            (O_NONBLOCK | O_NOFOLLOW | O_CLOEXEC));
        struct sigaction disposition;
        assert(sigaction(SIGTERM, NULL, &disposition) == 0);
        assert(disposition.sa_handler == on_signal && !(disposition.sa_flags & SA_RESTART));
    }
    reset(); clock_error = true;
    char *args[] = {"ink-events", "inspect", NULL};
    assert(ink_events_production_main(2, args) == 7 && open_calls == 0);
    reset();
    puts("setup: hard timer precedes refused device open in all modes; clock failure stays closed");
}
static void real_alarm_case(void) {
    pid_t child = fork(); assert(child >= 0);
    if (!child) {
        signal(SIGALRM, SIG_IGN);
        sigset_t set; sigemptyset(&set); sigaddset(&set, SIGALRM);
        assert(sigprocmask(SIG_BLOCK, &set, NULL) == 0);
        assert(start_deadline(1));
        /* Must die from real SIGALRM despite inherited ignored/blocked state. */
        sleep(3); _exit(91);
    }
    int status; assert(waitpid(child, &status, 0) == child);
    assert(WIFSIGNALED(status) && WTERMSIG(status) == SIGALRM);
    puts("alarm: inherited ignored/blocked SIGALRM reset and real child terminated");
}
int main(void) {
    write_cases(); release_cases(); read_cases(); pause_cases(); deadline_setup_cases(); real_alarm_case();
    alarm(0); assert(open_calls == 0);
    puts("production ink-event low-level tests passed; no device access");
    return 0;
}
