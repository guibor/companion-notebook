// Edit the user-supplied recording locally; never connects to a tablet.
import {execFileSync as run} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const input=process.argv[2];
assert(input && fs.existsSync(input), 'Pass the original recording path');
const out='docs/images/demos';
fs.mkdirSync(out,{recursive:true});
const clips=[
  {name:'quick-pad',cuts:[[12,30],[50,57]],speed:1.5},
  {name:'read-and-scroll',cuts:[[118,140]],speed:1.5},
  {name:'companion-writing',cuts:[[183,198]],speed:1.25},
];
for(const {name,cuts,speed} of clips) {
  const filters=cuts.map(([start,end],i)=>`[0:v]trim=start=${start}:end=${end},setpts=(PTS-STARTPTS)/${speed},crop=480:606:0:0[v${i}]`);
  filters.push(cuts.map((_,i)=>`[v${i}]`).join('')+`concat=n=${cuts.length}:v=1:a=0,fps=15,format=yuv420p[out]`);
  run('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',input,'-filter_complex',filters.join(';'),'-map','[out]','-an','-map_metadata','-1','-c:v','libx264','-crf','19','-preset','slow','-movflags','+faststart',`${out}/${name}.mp4`],{stdio:'inherit'});
  run('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',`${out}/${name}.mp4`,'-filter_complex','[0:v]split[a][b];[a]palettegen=stats_mode=diff:max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle','-loop','0',`${out}/${name}.gif`],{stdio:'inherit'});
  console.log(name,fs.statSync(`${out}/${name}.gif`).size);
}
