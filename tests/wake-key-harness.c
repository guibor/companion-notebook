/* Production helper, all device/process/time calls replaced. No tablet access. */
#include <assert.h>
#include <fcntl.h>
#include <linux/input.h>
#include <signal.h>
#include <stdbool.h>
#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/ioctl.h>
#include <sys/stat.h>
#include <time.h>
#include <unistd.h>
static double now;
static int mode,writes,opens,proc_reads;
static bool down,wrong_device;
static struct input_event sent[8];
static size_t sizes[3];
static int fake_open(const char *,int,...);
static int fake_close(int fd){return fd==99?0:close(fd);}
static uid_t fake_geteuid(void){return 0;}
static unsigned fake_alarm(unsigned n){(void)n;return 0;}
static int fake_fstat(int fd,struct stat *st){if(fd==99){memset(st,0,sizeof *st);st->st_mode=S_IFCHR;return 0;}int r=fstat(fd,st);st->st_uid=0;return r;}
static int fake_ioctl(int fd,unsigned long request,...){
    assert(fd==99);va_list args;va_start(args,request);void *out=va_arg(args,void *);va_end(args);
    if(request==EVIOCGNAME(128)){strcpy(out,wrong_device?"foreign":"30370000.snvs:snvs-powerkey");return 0;}
    if(request==EVIOCGPHYS(128)){strcpy(out,"snvs-pwrkey/input0");return 0;}
    if(request==EVIOCGKEY((KEY_MAX+8)/8)){memset(out,0,(KEY_MAX+8)/8);if(down)((unsigned char *)out)[KEY_POWER/8]|=1u<<(KEY_POWER%8);return 0;}
    assert(false);return -1;
}
static ssize_t fake_readlink(const char *path,char *out,size_t n){assert(strstr(path,"/proc/321/exe"));const char *s="/usr/bin/xochitl";assert(n>strlen(s));memcpy(out,s,strlen(s));return strlen(s);}
static FILE *fake_fopen(const char *path,const char *access){
    assert(!strcmp(path,"/proc/321/stat"));assert(!strcmp(access,"r"));FILE *f=tmpfile();assert(f);
    fprintf(f,"321 (xochitl) S");for(int i=4;i<22;i++)fprintf(f," 0");fprintf(f," %d\n",mode==6&&proc_reads++>0?456:123);rewind(f);return f;
}
static int fake_clock(clockid_t id,struct timespec *t){double v=now+(id==CLOCK_REALTIME?1700000000:0);if(mode==9&&id==CLOCK_REALTIME&&now>13.1)v-=100;t->tv_sec=(time_t)v;t->tv_nsec=(long)((v-t->tv_sec)*1e9);return 0;}
static int fake_sleep(const struct timespec *a,struct timespec *b){(void)a;(void)b;now+=mode==7?100:0.02;return 0;}
static ssize_t fake_write(int fd,const void *data,size_t n){
    assert(fd==99&&writes<3);sizes[writes]=n;memcpy(sent+writes*2,data,n);
    int call=++writes;
    if(mode==1&&call==1){down=true;return sizeof(struct input_event);}
    if(mode==2&&call==1)return -1;
    const struct input_event *events=data;
    for(size_t i=0;i<n/sizeof *events;i++)if(events[i].type==EV_KEY){assert(events[i].code==KEY_POWER);down=events[i].value;}
    return n;
}
#define open fake_open
#define close fake_close
#define geteuid fake_geteuid
#define alarm fake_alarm
#define fstat fake_fstat
#define ioctl fake_ioctl
#define readlink fake_readlink
#define fopen fake_fopen
#define clock_gettime fake_clock
#define nanosleep fake_sleep
#define write fake_write
#define main wake_production_main
#include "../ops/wake-key.c"
#undef main
#undef write
#undef nanosleep
#undef clock_gettime
#undef fopen
#undef readlink
#undef ioctl
#undef fstat
#undef alarm
#undef geteuid
#undef close
#undef open
static int fake_open(const char *path,int flags,...){
    assert(++opens<5000);assert(flags&O_NOFOLLOW);assert(flags&O_CLOEXEC);assert(flags&O_NONBLOCK);
    if(!strcmp(path,"/dev/input/event0")){assert(flags&O_RDWR);return 99;}
    assert(!strcmp(path,"probe.log"));FILE *f=tmpfile();assert(f);
    if(now>=13){
        const char *prefix="Companion sleep: requested; epoch-ms=";
        if(mode==3)fprintf(f,"%snan\n",prefix);
        else if(mode==4)fprintf(f,"%s%.0f\n",prefix,(1700000000+now-3)*1000);
        else if(mode==5)fprintf(f,"Companion probe: FAILED expected\n");
        else fprintf(f,"%s1700000013000\x1b[0;37m (probeSleepOwned qrc:/test.qml:123)\x1b[0m\n",prefix);
        if(mode!=8&&mode!=9)fprintf(f,"Companion sleep: asleep; parked=true; detached=true; epoch-ms=%.0f\n",(1700000000+now)*1000);
    }
    fflush(f);rewind(f);int fd=dup(fileno(f));assert(fd>=0);fclose(f);return fd;
}
static void reset(int m){mode=m;writes=opens=proc_reads=0;down=wrong_device=false;now=10;memset(sent,0,sizeof sent);memset(sizes,0,sizeof sizes);}
int main(void){
    char *args[]={"wake-key","321","probe.log",NULL},*release[]={"wake-key","release",NULL};
    reset(0);assert(wake_production_main(3,args)==0);assert(writes==1&&!down);assert(sizes[0]==4*sizeof(struct input_event));
    assert(sent[0].type==EV_KEY&&sent[0].value==1);assert(sent[1].type==EV_SYN);assert(sent[2].type==EV_KEY&&sent[2].value==0);assert(sent[3].type==EV_SYN);
    for(int m=1;m<=2;m++){reset(m);assert(wake_production_main(3,args)==7);assert(writes==2&&!down);assert(sizes[1]==2*sizeof(struct input_event));assert(sent[2].value==0);}
    for(int m=3;m<=9;m++){reset(m);assert(wake_production_main(3,args)!=0);assert(writes==0);}
    reset(0);wrong_device=true;assert(wake_production_main(3,args)==3);assert(!writes);
    reset(0);down=true;assert(wake_production_main(3,args)==3);assert(!writes);
    reset(0);assert(wake_production_main(2,release)==0);assert(!writes);
    reset(0);down=true;assert(wake_production_main(2,release)==0);assert(writes==1&&!down);assert(sizes[0]==2*sizeof(struct input_event));assert(sent[0].value==0);
    puts("production wake helper failure tests passed; no device access");return 0;
}
