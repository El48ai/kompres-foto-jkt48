// zip-helper.js
import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.0/dist/jszip.min.js';
export async function zipFiles(list){
  const zip = new JSZip();
  for(const it of list){ zip.file(it.name, it.blob); }
  return await zip.generateAsync({type:'blob'});
}
