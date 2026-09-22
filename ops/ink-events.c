/* Fixed two-stroke native-path diagnostic. No generic event injection interface.
 * Only the existing Ferrari marker device is used; no grabs, uinput, modules,
 * notebook-file writes, or power/touch input access. Watchdog release is separate.
 * Marker echoes are checked conservatively, NOT attributed to a physical or
 * synthetic source. Identical interleaved input cannot be proven absent.
 */
#define _GNU_SOURCE
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
#include <time.h>
#include <unistd.h>

static int fd = -1;
static volatile sig_atomic_t interrupted;
static struct input_absinfo ax, ay, pressure, distance;
static pid_t target;
static unsigned long long target_start;
static const char *log_path;
static double deadline;
static bool monitoring, unexpected_input;
static struct input_event expected[64];
static size_t expected_count;
static void on_signal(int sig) { (void)sig; interrupted = 1; }
static double monotonic(void) {
    struct timespec ts;
    if (clock_gettime(CLOCK_MONOTONIC, &ts)) return -1;
    return ts.tv_sec + ts.tv_nsec / 1e9;
}
static bool within_deadline(void) {
    double now=monotonic();
    return now>=0 && now<deadline;
}
static bool start_deadline(unsigned seconds) {
    struct sigaction hard={0}, cooperative={0};
    sigset_t unblock;
    hard.sa_handler=SIG_DFL;
    if(sigemptyset(&hard.sa_mask) || sigaction(SIGALRM,&hard,NULL)
        || sigemptyset(&unblock) || sigaddset(&unblock,SIGALRM)
        || sigprocmask(SIG_UNBLOCK,&unblock,NULL)) return false;
    /* Hard failure also covers open/ioctl/log reads and the release-only mode.
     * It is not a promise to terminate kernel-uninterruptible I/O; recovery must
     * independently prove the writer cgroup empty before releasing/restarting. */
    alarm(seconds);
    double now=monotonic();
    if(now<0) return false;
    deadline=now+seconds;
    cooperative.sa_handler=on_signal; /* Deliberately no SA_RESTART. */
    if(sigemptyset(&cooperative.sa_mask)
        || sigaction(SIGTERM,&cooperative,NULL)
        || sigaction(SIGINT,&cooperative,NULL)
        || sigaction(SIGHUP,&cooperative,NULL)) return false;
    return true;
}
static bool write_event(unsigned short type,unsigned short code,int value,bool cleanup) {
    struct input_event e = { .type=type, .code=code, .value=value };
    for(unsigned attempt=0;attempt<4;attempt++) {
        if(!within_deadline() || (!cleanup && (interrupted || unexpected_input))) return false;
        ssize_t n=write(fd,&e,sizeof e);
        if(n==(ssize_t)sizeof e) return true;
        /* A short write, EAGAIN, or any error other than bounded EINTR fails.
         * Never retry a partial event and potentially duplicate a prefix. */
        if(n>=0 || errno!=EINTR) return false;
    }
    return false;
}
static bool drain_marker(void) {
    if(!monitoring) return true;
    size_t matched=0;
    unsigned retries=0;
    for(unsigned reads=0;reads<64;reads++) {
        struct input_event observed[64];
        if(!within_deadline()) break;
        ssize_t n=read(fd,observed,sizeof observed);
        if(n<0 && (errno==EAGAIN || errno==EWOULDBLOCK)) {
            expected_count=0;
            return !unexpected_input;
        }
        if(n<0 && errno==EINTR && retries++<3) continue;
        if(n<=0 || n%(ssize_t)sizeof observed[0]) break;
        for(size_t i=0;i<(size_t)n/sizeof observed[0];i++) {
            /* Input core may filter unchanged values. Require every observed
             * event to be an ordered subsequence of this single injected frame.
             * No arbitrary timestamp/tool/touch/SYN_DROPPED events are ignored.
             * An empty queue does NOT prove injection echo or physical absence. */
            while(matched<expected_count
                && (observed[i].type!=expected[matched].type
                    || observed[i].code!=expected[matched].code
                    || observed[i].value!=expected[matched].value)) matched++;
            if(matched==expected_count) goto refused;
            matched++;
        }
    }
refused:
    unexpected_input=true;
    expected_count=0;
    return false;
}
static bool emit_event(unsigned short type,unsigned short code,int value,bool cleanup) {
    if(!cleanup && (interrupted || unexpected_input)) return false;
    if(!cleanup && monitoring && expected_count>=sizeof expected/sizeof expected[0]) {
        unexpected_input=true;
        return false;
    }
    bool sent=write_event(type,code,value,cleanup);
    if(sent && monitoring) {
        if(expected_count==sizeof expected/sizeof expected[0]) {
            unexpected_input=true;
            sent=false;
        } else {
            expected[expected_count++]=(struct input_event){.type=type,.code=code,.value=value};
        }
    }
    if(type==EV_SYN && code==SYN_REPORT && monitoring) {
        bool clean=drain_marker();
        sent=clean && sent;
    }
    return sent;
}
static bool event(unsigned short type, unsigned short code, int value) {
    return emit_event(type,code,value,false);
}
static bool release_pen(void) {
    /* Do not short circuit: attempt every release component after a failed write. */
    bool ok=true;
    ok=emit_event(EV_ABS,ABS_PRESSURE,0,true)&&ok;
    ok=emit_event(EV_ABS,ABS_DISTANCE,distance.maximum,true)&&ok;
    ok=emit_event(EV_KEY,BTN_TOUCH,0,true)&&ok;
    ok=emit_event(EV_KEY,BTN_TOOL_PEN,0,true)&&ok;
    ok=emit_event(EV_SYN,SYN_REPORT,0,true)&&ok;
    return ok;
}
static bool key_up(void) {
    unsigned char bits[(KEY_MAX+8)/8]={0};
    if (ioctl(fd,EVIOCGKEY(sizeof bits),bits)<0) return false;
    return !(bits[BTN_TOUCH/8]&(1u<<(BTN_TOUCH%8)))
        && !(bits[BTN_TOOL_PEN/8]&(1u<<(BTN_TOOL_PEN%8)))
        && !(bits[BTN_TOOL_RUBBER/8]&(1u<<(BTN_TOOL_RUBBER%8)));
}
static bool open_marker(void) {
    char name[128]={0}; struct stat st;
    fd=open("/dev/input/event2",O_RDWR|O_CLOEXEC|O_NOFOLLOW|O_NONBLOCK);
    if(fd<0 || fstat(fd,&st) || !S_ISCHR(st.st_mode)
        || ioctl(fd,EVIOCGNAME(sizeof name),name)<0
        || strcmp(name,"Elan marker input")!=0
        || ioctl(fd,EVIOCGABS(ABS_X),&ax)<0 || ioctl(fd,EVIOCGABS(ABS_Y),&ay)<0
        || ioctl(fd,EVIOCGABS(ABS_PRESSURE),&pressure)<0
        || ioctl(fd,EVIOCGABS(ABS_DISTANCE),&distance)<0) return false;
    return ax.minimum==0 && ax.maximum==11180 && ay.minimum==0 && ay.maximum==15340
        && pressure.minimum==0 && pressure.maximum>=1000 && pressure.maximum<=65535
        && distance.minimum==0 && distance.maximum>0 && distance.maximum<=65535;
}
static unsigned long long process_start(void) {
    char path[80], data[4096], exe[256];
    snprintf(path,sizeof path,"/proc/%d/exe",target);
    ssize_t n=readlink(path,exe,sizeof exe-1); if(n<0) return 0; exe[n]=0;
    if(strcmp(exe,"/usr/bin/xochitl")) return 0;
    snprintf(path,sizeof path,"/proc/%d/stat",target);
    FILE *f=fopen(path,"r"); if(!f) return 0;
    char *read=fgets(data,sizeof data,f); fclose(f); if(!read) return 0;
    char *p=strrchr(data,')'); if(!p) return 0; p+=2;
    for(int field=3;field<22;field++) {p=strchr(p,' ');if(!p)return 0;p++;}
    return strtoull(p,NULL,10);
}
static bool permitted(void) {
    if(interrupted || unexpected_input || !within_deadline() || !drain_marker()
        || process_start()!=target_start) return false;
    struct stat st;
    int f=open(log_path,O_RDONLY|O_CLOEXEC|O_NOFOLLOW|O_NONBLOCK);
    if(f<0 || fstat(f,&st) || !S_ISREG(st.st_mode) || st.st_uid!=0 || st.st_size>16*1024*1024) {
        if(f>=0) close(f);
        return false;
    }
    FILE *stream=fdopen(f,"r");if(!stream){close(f);return false;}
    char *line=NULL;size_t cap=0,total=0;bool gate=false,failed=false;
    ssize_t n;
    while((n=getline(&line,&cap,stream))>=0) {
        total+=(size_t)n;
        if(total>16*1024*1024 || interrupted || !within_deadline()) {failed=true;break;}
        if(strstr(line,"Companion ink: gate open; size=1620x2160; docs=")) gate=true;
        if(strstr(line,"Companion ink: gate closed")) gate=false;
        if(strstr(line,"Companion probe: FAILED")) failed=true;
    }
    bool ok=!ferror(stream);free(line);fclose(stream);
    return ok && gate && !failed && !interrupted && within_deadline()
        && process_start()==target_start && drain_marker();
}
static bool pause_ms(int ms) {
    /* Monitor the between-stroke gap too; physical arrival need not wait for
     * the next stroke's preflight to be noticed. No event-source exclusivity. */
    while(ms>0) {
        if(interrupted || unexpected_input || !within_deadline() || !drain_marker()) return false;
        int chunk=ms>5?5:ms;
        struct timespec ts={.tv_sec=0,.tv_nsec=chunk*1000000};
        unsigned retries=0;
        while(nanosleep(&ts,&ts)<0)
            if(errno!=EINTR || interrupted || !within_deadline() || retries++>=3) return false;
        ms-=chunk;
    }
    return !interrupted && within_deadline() && drain_marker();
}
static bool position(int x,int y) {
    if(x<0 || x>=1620 || y<0 || y>=2160) return false;
    return event(EV_ABS,ABS_X,(int)((int64_t)x*ax.maximum/1620))
        && event(EV_ABS,ABS_Y,(int)((int64_t)y*ay.maximum/2160));
}
static bool draw(int x0,int y0,int x1,int y1) {
    if(!permitted() || !key_up()) return false;
    bool ok=position(x0,y0) && event(EV_KEY,BTN_TOOL_PEN,1)
        && event(EV_KEY,BTN_TOUCH,0) && event(EV_ABS,ABS_PRESSURE,0)
        && event(EV_ABS,ABS_DISTANCE,distance.maximum) && event(EV_SYN,SYN_REPORT,0)
        && pause_ms(25) && permitted();
    if(ok) ok=event(EV_KEY,BTN_TOUCH,1) && event(EV_ABS,ABS_PRESSURE,pressure.maximum/2)
        && event(EV_ABS,ABS_DISTANCE,0) && event(EV_SYN,SYN_REPORT,0);
    for(int i=1;ok && i<=30;i++) {
        ok=pause_ms(12) && permitted() && position(x0+(x1-x0)*i/30,y0+(y1-y0)*i/30)
            && event(EV_SYN,SYN_REPORT,0);
    }
    bool released=release_pen();
    return ok && released && key_up();
}
int main(int argc,char **argv) {
    bool release_only=argc==2 && !strcmp(argv[1],"release");
    bool inspect=argc==2 && !strcmp(argv[1],"inspect");
    if(!release_only && !inspect && !(argc==4 && !strcmp(argv[1],"draw"))) return 2;
    if(!start_deadline(release_only||inspect?2:8)) return 7;
    if(geteuid()!=0 || !open_marker()) {fprintf(stderr,"marker identity/capabilities refused\n");return 3;}
    if(inspect) {bool up=key_up();printf("marker matched; range=%dx%d; pressure=%d; distance=%d; up=%d\n",ax.maximum,ay.maximum,pressure.maximum,distance.maximum,up);close(fd);return up?0:5;}
    if(release_only) {bool ok=release_pen() && key_up();close(fd);return ok?0:4;}
    char *end=NULL;long p=strtol(argv[2],&end,10);
    if(!end || *end || p<2 || p>4194304) {close(fd);return 2;}
    target=(pid_t)p;log_path=argv[3];target_start=process_start();
    monitoring=true;
    if(!target_start || !key_up() || !drain_marker()) {close(fd);return 5;}
    bool ok=draw(550,450,850,500) && pause_ms(600) && draw(700,1500,1000,1570);
    bool released=release_pen() && key_up();close(fd);
    if(!ok || !released || unexpected_input) {fprintf(stderr,"fixed ink sequence refused/interrupted%s\n",unexpected_input?" (unexpected marker events)":"");return 6;}
    puts("two fixed strokes sent; pen released; native acceptance pending");return 0;
}
