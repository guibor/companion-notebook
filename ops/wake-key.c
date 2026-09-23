/* One pre-opened, identity-checked balanced power-key batch for the disposable
 * display-sleep test only. No generic injector, RTC, grabbing, long press,
 * repeated key-down, suspend policy, or fabricated native wake reason. */
#define _GNU_SOURCE
#include <errno.h>
#include <fcntl.h>
#include <linux/input.h>
#include <math.h>
#include <signal.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/ioctl.h>
#include <sys/stat.h>
#include <time.h>
#include <unistd.h>

static double milliseconds(clockid_t clock) {
    struct timespec t;
    return clock_gettime(clock,&t) ? -1 : t.tv_sec*1000.0+t.tv_nsec/1000000.0;
}
static bool key_up(int fd) {
    unsigned char bits[(KEY_MAX+8)/8]={0};
    return ioctl(fd,EVIOCGKEY(sizeof bits),bits)>=0 && !(bits[KEY_POWER/8]&(1u<<(KEY_POWER%8)));
}
static int open_key(bool require_up) {
    int fd=open("/dev/input/event0",O_RDWR|O_NOFOLLOW|O_NONBLOCK|O_CLOEXEC);
    struct stat st; char name[128]={0},phys[128]={0};
    if(fd<0) return -1;
    if(fstat(fd,&st)||!S_ISCHR(st.st_mode)||ioctl(fd,EVIOCGNAME(sizeof name),name)<0
        ||ioctl(fd,EVIOCGPHYS(sizeof phys),phys)<0
        ||strcmp(name,"30370000.snvs:snvs-powerkey")||strcmp(phys,"snvs-pwrkey/input0")||(require_up&&!key_up(fd))) {
        close(fd);return -1;
    }
    return fd;
}
static unsigned long long process_start(long pid) {
    char path[80],exe[256],data[4096];
    snprintf(path,sizeof path,"/proc/%ld/exe",pid);
    ssize_t n=readlink(path,exe,sizeof exe-1);if(n<0)return 0;exe[n]=0;
    if(strcmp(exe,"/usr/bin/xochitl"))return 0;
    snprintf(path,sizeof path,"/proc/%ld/stat",pid);
    FILE *f=fopen(path,"r");if(!f)return 0;
    bool ok=fgets(data,sizeof data,f)!=NULL;fclose(f);if(!ok)return 0;
    char *p=strrchr(data,')');if(!p)return 0;p+=2;
    for(int i=3;i<22;i++){p=strchr(p,' ');if(!p)return 0;p++;}
    return strtoull(p,NULL,10);
}
// Exact receipt appears only once, after the QML owned-park/identity checks.
// Logs are bounded and private; a failure/wake/multiple receipt forbids input.
static int sleep_receipt(const char *path,double *epoch) {
    int fd=open(path,O_RDONLY|O_NOFOLLOW|O_NONBLOCK|O_CLOEXEC);struct stat st;
    if(fd<0)return -1;
    if(fstat(fd,&st)||!S_ISREG(st.st_mode)||st.st_uid!=0||st.st_size>16*1024*1024){close(fd);return -1;}
    FILE *f=fdopen(fd,"r");if(!f){close(fd);return -1;}
    char *line=NULL;size_t cap=0,total=0;ssize_t n;int count=0,requests=0;bool bad=false;
    const char *marker="Companion sleep: asleep; parked=true; detached=true; epoch-ms=";
    const char *requested="Companion sleep: requested; epoch-ms=";
    while((n=getline(&line,&cap,f))>=0){
        total+=(size_t)n;if(total>16*1024*1024){bad=true;break;}
        if(strstr(line,"Companion probe: FAILED")||strstr(line,"Companion transition: FAILED")
            ||strstr(line,"Companion sleep: awake;")){bad=true;break;}
        char *p=strstr(line,requested);
        if(p){
            char *end;*epoch=strtod(p+strlen(requested),&end);
            if(!isfinite(*epoch)||end==p+strlen(requested)||(*end!='\n'&&*end!='\r'&&*end!='\x1b'&&*end!=0))bad=true;
            requests++;
        }
        if(strstr(line,marker)){
            if(requests!=1)bad=true;
            count++;
        }
    }
    bad=bad||ferror(f)||requests>1;free(line);fclose(f);return bad||count>1?-1:count;
}
int main(int argc,char **argv) {
    if(argc==2&&!strcmp(argv[1],"release")&&geteuid()==0){
        signal(SIGALRM,SIG_DFL);alarm(2);
        int fd=open_key(false);if(fd<0)return 3;
        if(key_up(fd)){close(fd);return 0;}
        struct input_event up[2]={{.type=EV_KEY,.code=KEY_POWER,.value=0},{.type=EV_SYN,.code=SYN_REPORT,.value=0}};
        bool ok=write(fd,up,sizeof up)==(ssize_t)sizeof up&&key_up(fd);
        close(fd);return ok?0:7;
    }
    if(argc!=3||geteuid()!=0)return 2;
    char *end;long pid=strtol(argv[1],&end,10);if(*end||pid<2||pid>4194304)return 2;
    signal(SIGALRM,SIG_DFL);alarm(100);
    int fd=open_key(true);if(fd<0)return 3;
    unsigned long long start=process_start(pid);double begun=milliseconds(CLOCK_MONOTONIC);
    if(!start||begun<0){close(fd);return 4;}
    puts("wake helper ready; key-up=true; pre-opened=true");fflush(stdout);
    double request_seen=-1,request_epoch=0;
    for(;;){
        double epoch=0,now=milliseconds(CLOCK_MONOTONIC);int found=sleep_receipt(argv[2],&epoch);
        if(found<0||now<begun||now-begun>90000||process_start(pid)!=start){close(fd);return 5;}
        if(epoch>0){
            if(request_seen<0){request_seen=now;request_epoch=epoch;}
            // Native secondary destruction took 2074ms in trial110500. Keep
            // the original pre-sleep clock, but allow that observed drain.
            // The independent 3s-monotonic/4s-wall watchdog is unchanged.
            if(epoch!=request_epoch||now-request_seen>2900){
                fprintf(stderr,"wake refused: request changed or monotonic freshness expired\n");
                close(fd);return 6;
            }
        }else if(request_seen>=0){close(fd);return 6;}
        if(found){
            double age=milliseconds(CLOCK_REALTIME)-epoch;
            if(age<0||age>3000||now-begun<3000||!key_up(fd)){
                fprintf(stderr,"wake refused: wall freshness, settling or key-up check failed\n");
                close(fd);return 6;
            }
            struct input_event events[4]={
                {.type=EV_KEY,.code=KEY_POWER,.value=1}, {.type=EV_SYN,.code=SYN_REPORT,.value=0},
                {.type=EV_KEY,.code=KEY_POWER,.value=0}, {.type=EV_SYN,.code=SYN_REPORT,.value=0}
            };
            // No retry: a partial write is a failure, never a balanced success.
            // A separate UP-only cleanup cannot generate a new held key.
            puts("wake-batch-attempted");fflush(stdout);
            // Log scans, /proc checks, ioctls and even flushing this marker can
            // take time. Never authorize a write using the loop's old sample.
            now=milliseconds(CLOCK_MONOTONIC);
            age=milliseconds(CLOCK_REALTIME)-epoch;
            if(now<begun||now-begun>90000||now<request_seen||now-request_seen>2900
                    ||age<0||age>3000){
                fprintf(stderr,"wake refused: final pre-write freshness expired\n");
                close(fd);return 6;
            }
            ssize_t written=write(fd,events,sizeof events);
            if(written!=(ssize_t)sizeof events||!key_up(fd)){
                (void)write(fd,events+2,2*sizeof events[0]);
                fprintf(stderr,"balanced wake batch failed; up-only cleanup attempted\n");close(fd);return 7;
            }
            puts("balanced wake batch sent once; key-up=true; native-wake=unverified");fflush(stdout);
            close(fd);return 0;
        }
        struct timespec delay={.tv_sec=0,.tv_nsec=20000000};
        if(nanosleep(&delay,NULL)){close(fd);return 8;}
    }
}
