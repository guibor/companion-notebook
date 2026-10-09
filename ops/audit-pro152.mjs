// Read-only ELF/resource audit. No execution of ARM code and no device access.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {targets} from './firmware-target.mjs';
const oldRoot='/Users/mdf/code/remarkable-beta-os/.cache/firmware/3.29.0.148';
const newRoot='/Users/mdf/code/remarkable-beta-os/.cache/firmware/3.29.0.152';
const sha=b=>createHash('sha256').update(b).digest('hex');
function elf(file,expected) {
    const b=fs.readFileSync(file);assert.equal(sha(b),expected);assert.equal(b.readUInt16LE(18),183);
    const number=o=>Number(b.readBigUInt64LE(o));
    const sections=[];
    for(let i=0;i<b.readUInt16LE(60);i++) {
        const p=number(40)+i*b.readUInt16LE(58);
        sections.push({type:b.readUInt32LE(p+4),address:number(p+16),offset:number(p+24),size:number(p+32),entry:number(p+56)});
    }
    const off=address=>{const s=sections.find(s=>s.type!==8&&address>=s.address&&address<s.address+s.size);assert(s,'Unmapped ELF address');return s.offset+address-s.address;};
    const address=o=>{const s=sections.find(s=>s.type!==8&&o>=s.offset&&o<s.offset+s.size);assert(s);return s.address+o-s.offset;};
    const reloc=new Map();
    for(const s of sections.filter(s=>s.type===4))for(let p=s.offset;p<s.offset+s.size;p+=s.entry)
        if(b.readUInt32LE(p+8)===1027)reloc.set(number(p),number(p+16)); // R_AARCH64_RELATIVE
    function meta(name) {
        const needle=Buffer.from(name+'\0'),found=[];
        for(let p=b.indexOf(needle);p>=0;p=b.indexOf(needle,p+1)) {
            for(let n=1;n<=256&&p-n*8>=0;n++) {
                const start=p-n*8;
                if(b.readUInt32LE(start)!==n*8||b.readUInt32LE(start+4)!==name.length)continue;
                const strings=[];let cursor=n*8,valid=true;
                for(let i=0;i<n;i++) {
                    const offset=b.readUInt32LE(start+i*8),length=b.readUInt32LE(start+i*8+4);
                    if(offset!==cursor||length>8192||start+offset+length>=b.length||b[start+offset+length]!==0){valid=false;break;}
                    strings.push(b.toString('utf8',start+offset,start+offset+length));cursor+=length+1;
                }
                if(!valid)continue;
                for(const [slot,value]of reloc)if(value===address(start)&&reloc.has(slot+8)) {
                    const data=off(reloc.get(slot+8));
                    if(data>=start||start-data>16384||b.readUInt32LE(data)!==13)continue;
                    found.push({strings,metadata:b.subarray(data,start),stringTable:b.subarray(start,start+cursor)});
                }
            }
        }
        assert.equal(found.length,1,`Expected one Qt6 metadata record: ${name}`);return found[0];
    }
    return {b,meta};
}
const a=elf(oldRoot+'/xochitl',targets['3.29.0.148'].stockSha256);
const b=elf(newRoot+'/xochitl.stock',targets['3.29.0.152'].stockSha256);
const metadata={};
for(const name of ['PenInputSurfaceManager','PenInputThread','PenInputSurface','PenInputHandler']) {
    const before=a.meta(name),after=b.meta(name);
    assert.deepEqual(after.strings,before.strings,`${name} meta strings changed`);
    assert.deepEqual(after.metadata,before.metadata,`${name} method/property metadata changed`);
    metadata[name]={metadataSha256:sha(after.metadata),stringsSha256:sha(after.stringTable),metadataBytes:after.metadata.length};
}
const readelf=args=>execFileSync('aarch64-linux-gnu-readelf',args,{encoding:'utf8',maxBuffer:16*1024*1024});
const stock=newRoot+'/xochitl.stock';
assert.match(readelf(['-n',stock]),new RegExp(targets['3.29.0.152'].buildId));
assert.match(readelf(['--dyn-syms','--wide',stock]),/UND _ZN7QObject12moveToThreadEP7QThreadN2Qt15Disambiguated_tE@Qt_6/);
const receipt={status:'static-metaobject-match-runtime-libraries-pending',stockSha256:sha(b.b),buildId:targets['3.29.0.152'].buildId,
    metadata,publicQtInterpositionImport:true,
    limitations:['Metadata equality is not code/worker semantic equivalence','Exact .152 runtime libraries and on-target startup remain coordinator gates'],installable:false};
fs.mkdirSync('build/pro-3.29.0.152-audit',{recursive:true});
fs.writeFileSync('build/pro-3.29.0.152-audit/native-abi.json',JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt,null,2));
