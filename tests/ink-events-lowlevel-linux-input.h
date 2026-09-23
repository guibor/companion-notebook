/* Test-only Linux input declarations: never used to build the tablet helper. */
#ifndef CN_TEST_LINUX_INPUT_H
#define CN_TEST_LINUX_INPUT_H
#include <stdint.h>
#include <sys/time.h>
#include <sys/ioctl.h>
struct input_event { struct timeval time; uint16_t type, code; int32_t value; };
struct input_absinfo { int32_t value, minimum, maximum, fuzz, flat, resolution; };
#define EV_SYN 0
#define EV_KEY 1
#define EV_ABS 3
#define SYN_REPORT 0
#define SYN_DROPPED 3
#define ABS_X 0
#define ABS_Y 1
#define ABS_PRESSURE 24
#define ABS_DISTANCE 25
#define BTN_TOOL_PEN 320
#define BTN_TOOL_RUBBER 321
#define BTN_TOUCH 330
#define KEY_MAX 767
#define KEY_POWER 116
#define EVIOCGNAME(len) _IOC(2, 'E', 0x06, (len))
#define EVIOCGPHYS(len) _IOC(2, 'E', 0x07, (len))
#define EVIOCGKEY(len) _IOC(2, 'E', 0x18, (len))
#define EVIOCGABS(axis) _IOR('E', 0x40 + (axis), struct input_absinfo)
#endif
