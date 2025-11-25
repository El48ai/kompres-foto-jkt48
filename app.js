// app.js — modular client-side compressor (ES module)
import { zipFiles } from './zip-helper.js';

const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');
const compressBtn = document.getElementById('compressBtn');
const downloadZipBtn = document.getElementById('downloadZipBtn');
const qualityInput = document.getElementById('quality');
const maxWidthInput = document.getElementById('maxWidth');
const gallery = document.getElementById('gallery');

let files = [];
let compressedFiles = [];

function addFileList(list){
  for(const f of list){
    if(!f.type.startsWith('image/')) continue;
    files.push(f);
    renderThumb(f);
  }
}

fileInput.addEventListener('change',(e)=> addFileList(e.target.files));

dropzone.addEventListener('click',()=> fileInput.click());
dropzone.addEventListener('keydown',(e)=> { if(e.key === 'Enter') fileInput.click(); });

dropzone.addEventListener('dragover', e=>{ e.preventDefault(); dropzone.classList.add('drag'); });
dropzone.addEventListener('dragleave', e=> dropzone.classList.remove('drag'));

dropzone.addEventListener('drop', e=>{
  e.preventDefault(); dropzone.classList.remove('drag');
  addFileList(e.dataTransfer.files);
});

function renderThumb(file){
  const div = document.createElement('div'); div.className='thumb card';
  const img = document.createElement('img');
  const meta = document.createElement('div'); meta.className='meta';
  const name = document.createElement('div'); name.textContent = file.name;
  const size = document.createElement('div'); size.textContent = Math.round(file.size/1024) + ' KB';
  meta.appendChild(name); meta.appendChild(size);
  div.appendChild(img); div.appendChild(meta);
  gallery.prepend(div);

  const reader = new FileReader();
  reader.onload = ()=> img.src = reader.result;
  reader.readAsDataURL(file);
}

async function compressAll(){
  compressedFiles = [];
  for(const f of files){
    const blob = await compressImageFile(f, {
      quality: Number(qualityInput.value)/100,
      maxWidth: Number(maxWidthInput.value)
    });
    // ensure extension
    const base = f.name.replace(/\.(png|jpg|jpeg)$/i, '') || f.name;
    compressedFiles.push({name: base + '.webp', blob});
  }
  if(compressedFiles.length) downloadZipBtn.disabled=false;
}

compressBtn.addEventListener('click', async ()=>{
  if(files.length === 0){
    alert('Pilih file gambar dulu.');
    return;
  }
  compressBtn.disabled = true; compressBtn.textContent='Processing...';
  try{
    await compressAll();
    alert('Selesai: ' + compressedFiles.length + ' file siap diunduh.');
  }catch(e){
    console.error(e);
    alert('Terjadi error saat kompresi.');
  }finally{
    compressBtn.disabled=false; compressBtn.textContent='Kompres';
  }
});

downloadZipBtn.addEventListener('click', async ()=>{
  if(!compressedFiles.length) return;
  const zipBlob = await zipFiles(compressedFiles);
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a'); a.href=url; a.download='compressed_images.zip'; a.click();
  URL.revokeObjectURL(url);
});

// helper: compress a single File using canvas, return Blob (webp if supported)
async function compressImageFile(file, opts){
  const img = await loadImageFromFile(file);
  const {width, height} = calcSize(img.width, img.height, opts.maxWidth);
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d'); ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0,0, width, height);
  const mime = supportsWebP() ? 'image/webp' : 'image/jpeg';
  return await new Promise(resolve => canvas.toBlob(resolve, mime, opts.quality));
}

function supportsWebP(){
  // quick feature-detect via canvas
  const c = document.createElement('canvas');
  if (!c.getContext) return false;
  return c.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

function loadImageFromFile(file){
  return new Promise((res, rej)=>{
    const reader = new FileReader();
    reader.onload = ()=>{
      const img = new Image(); img.onload = ()=> res(img); img.onerror = rej; img.src = reader.result;
    };
    reader.onerror = rej; reader.readAsDataURL(file);
  });
}

function calcSize(w,h,maxW){
  if(w <= maxW) return {width:w, height:h};
  const ratio = maxW / w; return {width: Math.round(w*ratio), height: Math.round(h*ratio)};
}
