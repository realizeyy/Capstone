/* Pure UI helpers shared by every clergy page: the toast notification,
   in-app document preview modal with back/confirmation, zero-reload AJAX
   document & photo uploads that preserve unsaved form fields and return focus,
   sticky section navigation scrollspy, and unsaved changes protection. */

function escapeHtml(str){
 return String(str==null?'':str)
  .replace(/&/g,'&amp;')
  .replace(/</g,'&lt;')
  .replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;')
  .replace(/'/g,'&#39;');
}
window.escapeHtml=escapeHtml;

async function parseJsonResponse(res){
 if(res.redirected){
  return {ok:false,error:'Your session has expired. Please refresh the page and sign in again.'};
 }
 const contentType=res.headers.get('content-type')||'';
 if(!contentType.includes('application/json')){
  if(res.status===413){
   return {ok:false,error:'The uploaded file is too large for the server to process.'};
  }
  if(res.status===403){
   return {ok:false,error:'Session expired or action forbidden. Please refresh the page.'};
  }
  if(res.status>=500){
   return {ok:false,error:'A server error occurred. Please try again later.'};
  }
  return {ok:false,error:'Unexpected response from the server. Please try again.'};
 }
 try{
  return await res.json();
 }catch(_e){
  return {ok:false,error:'Could not parse server response. Please try again.'};
 }
}
window.parseJsonResponse=parseJsonResponse;

function applyFormErrors(formEl, errors){
 if(!formEl || !errors) return;
 formEl.querySelectorAll('.has-error').forEach(el=>el.classList.remove('has-error'));
 formEl.querySelectorAll('.field-error-msg').forEach(el=>el.remove());
 formEl.querySelectorAll('[aria-invalid="true"]').forEach(el=>el.removeAttribute('aria-invalid'));

 let firstInvalidEl = null;

 for(const [field, errList] of Object.entries(errors)){
  if(field === '__all__') continue;
  const msg = Array.isArray(errList) ? (typeof errList[0] === 'object' ? errList[0].message : errList[0]) : String(errList);
  const input = formEl.querySelector(`[name="${field}"]`);
  if(input){
   input.setAttribute('aria-invalid', 'true');
   const container = input.closest('.field, .edit-field') || input.parentElement;
   if(container){
    container.classList.add('has-error');
    const errSpan = document.createElement('span');
    errSpan.className = 'field-error-msg';
    errSpan.textContent = msg;
    container.appendChild(errSpan);
   }
   if(!firstInvalidEl) firstInvalidEl = input;
  }
 }

 if(firstInvalidEl){
  const fieldContainer = firstInvalidEl.closest('.field, .edit-field') || firstInvalidEl;
  fieldContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(()=>firstInvalidEl.focus(), 200);
 }
}
window.applyFormErrors = applyFormErrors;

let toastTimer;
function showToast(message,level){
 const el=document.getElementById('toast');
 if(!el)return;
 el.textContent=message;
 el.className='toast show'+(level?' toast-'+level:'');
 el.title='Click to dismiss';
 el.style.cursor='pointer';
 clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>el.classList.remove('show'),level==='error'?8000:3500);
}

document.getElementById('toast')?.addEventListener('click',function(){
 this.classList.remove('show');
 clearTimeout(toastTimer);
});

function quickPrintFile(url){
 if(!url)return;

 // Case 1: If the in-app document preview modal is currently showing this file, print directly from its frame
 const previewModal=document.getElementById('docPreviewModal');
 const previewFrame=document.getElementById('docPreviewFrame');
 if(previewModal&&previewModal.classList.contains('show')&&previewFrame&&previewFrame.contentWindow){
  try{
   previewFrame.contentWindow.focus();
   previewFrame.contentWindow.print();
   return;
  }catch(err){
   // Continue to background iframe below
  }
 }

 if(typeof showToast==='function'){
  showToast('Opening print dialog...','info');
 }

 // Case 2: In-place silent iframe printing (keeps user on current page, no tab switching)
 let printFrame=document.getElementById('ednpHiddenPrintFrame');
 if(printFrame)printFrame.remove();

 printFrame=document.createElement('iframe');
 printFrame.id='ednpHiddenPrintFrame';
 printFrame.setAttribute('aria-hidden','true');
 printFrame.style.position='fixed';
 printFrame.style.top='-9999px';
 printFrame.style.left='-9999px';
 printFrame.style.width='1px';
 printFrame.style.height='1px';
 printFrame.style.border='0';
 printFrame.style.opacity='0';
 printFrame.style.pointerEvents='none';

 let hasPrinted=false;
 function doPrint(){
  if(hasPrinted)return;
  hasPrinted=true;
  try{
   printFrame.contentWindow.focus();
   printFrame.contentWindow.print();
  }catch(e){
   const win=window.open(url,'_blank');
   if(win){
    win.addEventListener('load',()=>{win.focus();win.print();});
   }else if(typeof showToast==='function'){
    showToast('Please allow pop-ups to print this file.','error');
   }
  }
 }

 document.body.appendChild(printFrame);

 // If it is an image file, format it cleanly so it centers on the printed sheet
 const isImage=/\.(png|jpe?g|webp|gif)($|\?)/i.test(url);
 if(isImage){
  try{
   const doc=printFrame.contentWindow.document;
   doc.open();
   doc.write('<!DOCTYPE html><html><head><title>Print Document</title><style>@page{margin:10mm;size:auto;}body{margin:0;display:flex;align-items:center;justify-content:center;min-height:95vh;}img{max-width:100%;max-height:92vh;object-fit:contain;}</style></head><body><img src="' + url + '" onload="setTimeout(function(){window.focus();window.print();},250)"></body></html>');
   doc.close();
  }catch(imgErr){
   printFrame.onload=function(){ setTimeout(doPrint,300); };
   printFrame.src=url;
   setTimeout(function(){ if(!hasPrinted)doPrint(); },1400);
  }
 }else{
  printFrame.onload=function(){
   setTimeout(doPrint,300);
  };
  printFrame.src=url;
  setTimeout(function(){
   if(!hasPrinted)doPrint();
  },1400);
 }
}

// The sidebar's menu button on narrow screens
document.querySelectorAll('.nav-toggle').forEach(btn=>{
 btn.addEventListener('click',()=>{
  const open=btn.closest('.sidebar').classList.toggle('nav-open');
  btn.setAttribute('aria-expanded',open);
 });
});

// <button data-print-url="url"> prints that file
document.addEventListener('click',e=>{
 const printer=e.target.closest('[data-print-url]');
 if(printer)quickPrintFile(printer.dataset.printUrl);
});

// data-confirm is handled asynchronously via in-app centered modal in skeleton.js (window.appConfirm)

// Messages Django attached to this response ("Record saved", errors), rendered
// into #flash-messages by base.html, shown as toasts
document.querySelectorAll('#flash-messages [data-level]').forEach(msg=>showToast(msg.textContent,msg.dataset.level));

// Checks a chosen profile picture the moment it is selected, with the same rules the
// server applies (registrar.forms.ProfilePictureForm): JPG/PNG, at most 5 MB, and the
// file's first bytes must really be a JPG or PNG. Resolves to an error message, or null.
const PROFILE_PIC_MAX_BYTES=5*1024*1024;
function profilePicError(file){
 if(!/\.(jpe?g|png)$/i.test(file.name))return Promise.resolve('Only JPG and PNG images are allowed for a profile picture.');
 if(file.size>PROFILE_PIC_MAX_BYTES)return Promise.resolve('Image is too large - the maximum is 5 MB.');
 return file.slice(0,8).arrayBuffer().then(buf=>{
  const b=new Uint8Array(buf);
  const isPng=b.length>=4&&b[0]===0x89&&b[1]===0x50&&b[2]===0x4E&&b[3]===0x47;
  const isJpg=b.length>=3&&b[0]===0xFF&&b[1]===0xD8&&b[2]===0xFF;
  const wantsPng=/\.png$/i.test(file.name);
  return (wantsPng?isPng:isJpg)?null:'That file does not look like a real JPG or PNG image.';
 }).catch(()=>'Could not read that file. Please choose another image.');
}

// Live preview when choosing a profile picture on My Record & Profile
const profilePicInput=document.getElementById('profilePictureInput');
if(profilePicInput){
 profilePicInput.addEventListener('change',()=>{
  const file=profilePicInput.files&&profilePicInput.files[0];
  if(!file)return;
  profilePicError(file).then(error=>{
   if(error){
    profilePicInput.value='';
    showToast(error,'error');
    return;
   }
   const img=document.getElementById('profilePicPreviewImg');
   const initials=document.getElementById('profilePicInitials');
   if(img){img.src=URL.createObjectURL(file);img.classList.remove('hidden');}
   if(initials)initials.classList.add('hidden');
  });
 });
}

/* =========================================================================
   UX ENHANCEMENTS:
   1. Shared Styles for Preview Modal & Floating Unsaved Bar
   2. In-App Document Preview Modal with Back Button & Confirmation
   3. Zero-Reload AJAX Document & Profile Picture Uploads + Field Focus Return
   4. Sticky Sub-Section Navigation Scrollspy
   5. Floating Unsaved Changes Bar & beforeunload Guard
   ========================================================================= */
(function(){
 const style=document.createElement('style');
 style.textContent=`
  .doc-preview-modal-card {
   width: min(920px, 95vw) !important;
   max-width: 920px !important;
   height: min(86vh, 820px);
   display: flex;
   flex-direction: column;
   padding: 0 !important;
   overflow: hidden;
   overscroll-behavior: contain;
  }
  #docPreviewModal {
   z-index: 105 !important;
   overscroll-behavior: contain;
  }
  .toast {
   z-index: 120 !important;
  }
  .ph-picker-panel {
   z-index: 110 !important;
  }
  .doc-preview-head {
   display: flex;
   align-items: center;
   justify-content: space-between;
   padding: 14px 18px;
   border-bottom: 1px solid #e2e8f0;
   background: #f8fafc;
  }
  .doc-preview-head h3 {
   margin: 0;
   font-size: 15px;
   color: #0f172a;
   display: flex;
   align-items: center;
   gap: 8px;
  }
  .doc-preview-body {
   flex: 1;
   background: #334155;
   position: relative;
   overflow: hidden;
   display: flex;
   align-items: center;
   justify-content: center;
  }
  .doc-preview-frame {
   width: 100%;
   height: 100%;
   border: 0;
   background: #fff;
  }
  .doc-preview-foot {
   display: flex;
   align-items: center;
   justify-content: space-between;
   flex-wrap: wrap;
   gap: 10px;
   padding: 12px 18px;
   border-top: 1px solid #e2e8f0;
   background: #ffffff;
  }
  .doc-preview-foot-left, .doc-preview-foot-right {
   display: flex;
   align-items: center;
   gap: 8px;
   flex-wrap: wrap;
  }
  .preview-confirmed-tag {
   display: inline-flex;
   align-items: center;
   gap: 4px;
   font-size: 11px;
   font-weight: 600;
   color: #15803d;
   background: #dcfce7;
   padding: 2px 7px;
   border-radius: 9999px;
  }
  .floating-save-bar {
   position: fixed;
   bottom: 20px;
   right: 24px;
   z-index: 90;
   background: #0f172a;
   color: #ffffff;
   padding: 10px 16px;
   border-radius: 12px;
   box-shadow: 0 12px 28px rgba(15, 23, 42, 0.35);
   display: flex;
   align-items: center;
   gap: 14px;
   font-size: 13px;
   transform: translateY(140%);
   opacity: 0;
   pointer-events: none;
   transition: transform 0.22s ease, opacity 0.22s ease;
  }
  .floating-save-bar.visible {
   transform: translateY(0);
   opacity: 1;
   pointer-events: auto;
  }
  .floating-save-bar .unsaved-dot {
   width: 8px;
   height: 8px;
   border-radius: 50%;
   background: #f59e0b;
   display: inline-block;
   margin-right: 6px;
  }
  .field.has-error input, .field.has-error select, .field.has-error textarea,
  .edit-field.has-error input, .edit-field.has-error select, .edit-field.has-error textarea {
   border-color: var(--red, #d9534f) !important;
   box-shadow: 0 0 0 1px var(--red, #d9534f) !important;
  }
  .field-error-msg {
   display: block;
   font-size: 0.75rem;
   color: var(--red, #d9534f);
   margin-top: 0.25rem;
   font-weight: 500;
  }
 `;
 document.head.appendChild(style);

 // 1. Track last clicked quick-upload trigger so we can return focus & scroll to it
 let lastUploadTriggerField=null;
 document.addEventListener('click',function(e){
  const btn=e.target.closest('[data-quick-upload]');
  if(btn){
   lastUploadTriggerField=btn.closest('.field, .edit-field, .doc-card');
  }
 },true);

 // 2. In-App Document Preview Modal with Back & Confirmation
 let activePreviewTrigger=null;
 let activePreviewUrl='';
 let activePreviewTitle='Document Preview';

 function ensurePreviewModal(){
  let modal=document.getElementById('docPreviewModal');
  if(modal)return modal;
  modal=document.createElement('div');
  modal.className='modal-bg';
  modal.id='docPreviewModal';
  modal.setAttribute('role','dialog');
  modal.setAttribute('aria-modal','true');
  modal.innerHTML=`
   <div class="modal doc-preview-modal-card">
    <div class="doc-preview-head">
     <div>
      <h3 id="docPreviewTitle"><i class="fa-solid fa-file-eye" style="color:#2f6fed;"></i> <span>Document Preview</span></h3>
      <span class="muted" style="font-size:11px;">Review the attached document below, then confirm or return to your form.</span>
     </div>
     <button type="button" class="close" id="docPreviewCloseTop" aria-label="Close preview">
      <i class="fa-solid fa-xmark"></i>
     </button>
    </div>
    <div class="doc-preview-body">
     <iframe class="doc-preview-frame" id="docPreviewFrame" title="Document Preview"></iframe>
    </div>
    <div class="doc-preview-foot">
     <div class="doc-preview-foot-left">
      <button type="button" class="btn secondary small" id="docPreviewBackBtn">
       <i class="fa-solid fa-arrow-left"></i> Back
      </button>
      <button type="button" class="btn secondary small" id="docPreviewPrintBtn">
       <i class="fa-solid fa-print"></i> Print
      </button>
      <a href="#" target="_blank" rel="noopener" class="btn secondary small" id="docPreviewNewTabBtn">
       <i class="fa-solid fa-up-right-from-square"></i> Open in New Tab
      </a>
     </div>
     <div class="doc-preview-foot-right">
      <button type="button" class="btn green small" id="docPreviewConfirmBtn">
       <i class="fa-solid fa-circle-check"></i> Confirm Document
      </button>
     </div>
    </div>
   </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('click',function(e){
   if(e.target===modal)closePreview();
  });
  modal.addEventListener('wheel',function(e){
   if(e.target===modal)e.preventDefault();
  },{passive:false});
  modal.querySelector('#docPreviewCloseTop')?.addEventListener('click',closePreview);
  modal.querySelector('#docPreviewBackBtn')?.addEventListener('click',closePreview);
  modal.querySelector('#docPreviewPrintBtn')?.addEventListener('click',function(){
   if(activePreviewUrl)quickPrintFile(activePreviewUrl);
  });
  modal.querySelector('#docPreviewConfirmBtn')?.addEventListener('click',function(){
   if(activePreviewTrigger){
    const container=activePreviewTrigger.closest('.date-att-bar, .doc-card, .doc-row, .doc-bar');
    if(container&&!container.querySelector('.preview-confirmed-tag')){
     const tag=document.createElement('span');
     tag.className='preview-confirmed-tag';
     tag.innerHTML='<i class="fa-solid fa-check"></i> Confirmed';
     const statusEl=container.querySelector('.att-status, .doc-card-head, .col-status');
     if(statusEl)statusEl.appendChild(tag);
    }
   }
   showToast(activePreviewTitle+' confirmed.','success');
   closePreview();
  });
  return modal;
 }

 function closePreview(){
  const modal=document.getElementById('docPreviewModal');
  if(!modal)return;
  modal.classList.remove('show', 'active');
  modal.style.display='none';
  if(typeof window.syncBodyScrollLock==='function'){
   window.syncBodyScrollLock();
  }else{
   document.body.classList.remove('modal-open');
  }
  const frame=document.getElementById('docPreviewFrame');
  if(frame)frame.src='about:blank';
  if(activePreviewTrigger){
   const field=activePreviewTrigger.closest('.field, .edit-field, .doc-card, .doc-row, .doc-bar');
   if(field){
    field.scrollIntoView({behavior:'smooth',block:'center'});
   }
   if(typeof activePreviewTrigger.focus==='function'){
    activePreviewTrigger.focus();
   }
  }
 }
 window.closeDocPreview=closePreview;

 function openDocPreview(url, title, triggerEl){
  if(!url) return;
  activePreviewTrigger=triggerEl||null;
  activePreviewUrl=url;
  activePreviewTitle=title||(triggerEl&&(
   triggerEl.dataset.docName||
   triggerEl.dataset.docTitle||
   triggerEl.querySelector('.doc-table-link span, .col-name span, .doc-card-head b')?.textContent
  ))||'Document Preview';

  const modal=ensurePreviewModal();
  const titleSpan=modal.querySelector('#docPreviewTitle span');
  if(titleSpan)titleSpan.textContent='Preview: '+activePreviewTitle;
  const frame=modal.querySelector('#docPreviewFrame');
  if(frame)frame.src=url;
  const newTabBtn=modal.querySelector('#docPreviewNewTabBtn');
  if(newTabBtn)newTabBtn.href=url;
  modal.classList.add('show', 'active');
  modal.style.display='flex';
  if(typeof window.syncBodyScrollLock==='function'){
   window.syncBodyScrollLock();
  }else{
   document.body.classList.add('modal-open');
  }
  modal.querySelector('#docPreviewBackBtn')?.focus();
 }
 window.openDocPreview=openDocPreview;

 document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
   const modal=document.getElementById('docPreviewModal');
   if(modal&&(modal.classList.contains('show')||modal.style.display==='flex'))closePreview();
  }
 });

 document.addEventListener('click',function(e){
  // 1. In-app document view links (including .doc-table-link, .att-btn.view, and direct /documents/.../view/ links)
  const viewLink=e.target.closest('a.att-btn.view, a.doc-table-link, .doc-card .row-actions a[href*="/documents/"][href$="/view/"], a[href*="/documents/"][href$="/view/"]');
  if(viewLink&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey){
   const href=viewLink.getAttribute('href');
   if(href&&href!=='#'&&!href.startsWith('javascript:')){
    e.preventDefault();
    e.stopImmediatePropagation();
    const cardOrBar=viewLink.closest('[data-doc-title], .doc-row, .doc-bar, .doc-card, .date-att-bar');
    const title=
     viewLink.dataset.docName||
     (cardOrBar&&cardOrBar.dataset.docTitle)||
     viewLink.querySelector('span')?.textContent||
     (cardOrBar&&cardOrBar.querySelector('.doc-table-link span, .col-name span, .doc-card-head b')?.textContent)||
     'Document Preview';
    openDocPreview(href, title, viewLink);
    return;
   }
  }

  // 2. Table row click to preview document (excluding action buttons and interactive controls)
  const row=e.target.closest('.doc-row[data-view-url], .doc-bar[data-view-url]');
  if(row&&!e.target.closest('.col-actions, .doc-action-btn, .doc-bar-actions, button, a, input, form')){
   const url=row.dataset.viewUrl;
   if(url){
    e.preventDefault();
    e.stopImmediatePropagation();
    const title=row.dataset.docTitle||row.querySelector('.col-name span')?.textContent||'Document Preview';
    openDocPreview(url, title, row);
    return;
   }
  }
 },true);

 document.addEventListener('keydown',function(e){
  if(e.key==='Enter'){
   const row=document.activeElement;
   if(row&&(row.classList.contains('doc-row')||row.classList.contains('doc-bar'))&&row.dataset.viewUrl){
    if(!row.closest('#docPreviewModal')){
     e.preventDefault();
     const url=row.dataset.viewUrl;
     const title=row.dataset.docTitle||row.querySelector('.col-name span')?.textContent||'Document Preview';
     openDocPreview(url, title, row);
    }
   }
  }
 });

 // 3. Zero-Reload AJAX Uploads for Quick Attachment Modal, Requirement Cards & Profile Picture
 function highlightAndReturnToField(fieldEl){
  if(!fieldEl)return;
  fieldEl.scrollIntoView({behavior:'smooth',block:'center'});
  fieldEl.classList.remove('field-highlight-flash');
  void fieldEl.offsetWidth;
  fieldEl.classList.add('field-highlight-flash');
  const input=fieldEl.querySelector('input:not([type="hidden"]):not([type="file"]):not([readonly]), select, textarea');
  if(input)setTimeout(()=>input.focus({preventScroll:true}),250);
 }

 function updateAttachmentBarsInDOM(data){
  const docTypeId=String(data.document_type_id);
  document.querySelectorAll(`.date-att-bar[data-att-doc-type="${docTypeId}"]`).forEach(bar=>{
   bar.className='date-att-bar uploaded';
   const statusEl=bar.querySelector('.att-status');
   if(statusEl){
    statusEl.innerHTML=`<i class="fa-solid fa-circle-check"></i> ${data.document_name} attached <span class="preview-confirmed-tag"><i class="fa-solid fa-check"></i> Just uploaded</span>`;
   }
   const actionsEl=bar.querySelector('.att-actions');
   if(actionsEl){
    actionsEl.innerHTML=`
     <a href="${data.view_url}" target="_blank" class="att-btn view" data-doc-name="${data.document_name}"><i class="fa-solid fa-eye"></i> View</a>
     <button type="button" class="att-btn replace" data-quick-upload="${docTypeId}" data-doc-name="${data.document_name}"><i class="fa-solid fa-arrow-up-from-bracket"></i> Replace</button>
    `;
   }
  });

  document.querySelectorAll(`.doc-card[data-doc-card-type="${docTypeId}"]`).forEach(card=>{
   const badge=card.querySelector('.doc-card-head .badge');
   if(badge){
    badge.className='badge green';
    badge.textContent='Submitted';
   }
   let fileDiv=card.querySelector('.doc-card-file');
   if(!fileDiv){
    fileDiv=document.createElement('div');
    fileDiv.className='doc-card-file';
    const uploadForm=card.querySelector('.doc-card-upload');
    if(uploadForm)card.insertBefore(fileDiv,uploadForm);
   }
   fileDiv.innerHTML='<i class="fa-solid fa-file-lines"></i> Submitted '+escapeHtml(data.submitted_date)+(data.notes?'<br>'+escapeHtml(data.notes):'');

   let rowActions=card.querySelector('.row-actions');
   if(!rowActions){
    rowActions=document.createElement('div');
    rowActions.className='row-actions';
    const uploadForm=card.querySelector('.doc-card-upload');
    if(uploadForm)card.insertBefore(rowActions,uploadForm);
   }
   rowActions.innerHTML=`
    <a class="btn secondary small" href="${data.view_url}" target="_blank" rel="noopener" data-doc-name="${data.document_name}"><i class="fa-solid fa-eye"></i> View</a>
    <a class="btn secondary small" href="${data.download_url}"><i class="fa-solid fa-download"></i> Download</a>
    <button type="button" class="btn secondary small" data-print-url="${data.view_url}"><i class="fa-solid fa-print"></i> Print</button>
   `;
   const submitBtn=card.querySelector('.doc-card-upload button');
   if(submitBtn){
    submitBtn.innerHTML='<i class="fa-solid fa-rotate"></i> Replace';
   }
  });

  if(data.summary_submitted!==undefined&&data.summary_total!==undefined){
   document.querySelectorAll('.sidebar .nav a[href*="requirements"] .badge').forEach(b=>{
    b.textContent=`${data.summary_submitted}/${data.summary_total}`;
    b.classList.toggle('complete',data.summary_submitted===data.summary_total);
   });
  }
 }

 document.addEventListener('submit',async function(e){
  const form=e.target;
  if(e.defaultPrevented)return;

  // Case A: Quick Upload Modal or Requirement Card Upload Form
  const isQuickUpload=Boolean(form.closest('#quickUploadModal'));
  const isDocCardUpload=form.classList.contains('doc-card-upload');
  // Case B: Profile picture upload/remove button inside #profileForm or #profilePhotoForm
  const submitter=e.submitter;
  const isProfilePicAction=(form.id==='profileForm'||form.id==='profilePhotoForm')&&submitter&&(submitter.name==='upload_profile_picture'||submitter.name==='remove_profile_picture');

  if(!isQuickUpload&&!isDocCardUpload&&!isProfilePicAction)return;

  const fileInput=form.querySelector('input[type="file"]')||(form.id?document.querySelector('input[type="file"][form="'+form.id+'"]'):null);
  const file=fileInput&&fileInput.files&&fileInput.files[0];
  if(file&&file.size>10*1024*1024){
   showToast('File is too large: maximum allowed is 10 MB for a photo or scan, and 5 MB for a PDF.','error');
   return;
  }

  e.preventDefault();
  e.stopImmediatePropagation();

  const btn=submitter||form.querySelector('button[type="submit"], button:not([type])');
  const origHtml=btn?btn.innerHTML:'';
  if(btn){
   btn.disabled=true;
   btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Uploading…';
  }

  try{
   const formData=new FormData(form);
   if(submitter&&submitter.name){
    formData.append(submitter.name,submitter.value||'1');
   }
   const res=await fetch(form.getAttribute('action')||window.location.href,{
    method:'POST',
    body:formData,
    headers:{'X-Requested-With':'XMLHttpRequest'}
   });
   const data=await parseJsonResponse(res);
   if(!data.ok){
    showToast((data&&data.error)||'Could not upload file. Please check the file and try again.','error');
    return;
   }

   if(isProfilePicAction){
    showToast(data.message||'Profile picture updated.','success');
    const previewImg=document.getElementById('profilePicPreviewImg');
    const initialsEl=document.getElementById('profilePicInitials');
    const removeBtn=document.getElementById('removeProfilePicBtn');
    const uploadBtn=document.getElementById('uploadProfilePicBtn');
    if(data.removed){
     if(previewImg){previewImg.src='';previewImg.classList.add('hidden');}
     if(initialsEl){initialsEl.textContent=data.initials||'';initialsEl.classList.remove('hidden');}
     if(removeBtn)removeBtn.classList.add('hidden');
     if(uploadBtn)uploadBtn.innerHTML='<i class="fa-solid fa-camera"></i> Upload Photo';
     document.querySelectorAll('.sidebar-avatar img, .top-avatar img').forEach(img=>{img.remove();});
    }else if(data.picture_url){
     if(previewImg){previewImg.src=data.picture_url;previewImg.classList.remove('hidden');}
     if(initialsEl)initialsEl.classList.add('hidden');
     if(removeBtn)removeBtn.classList.remove('hidden');
     if(uploadBtn)uploadBtn.innerHTML='<i class="fa-solid fa-camera"></i> Replace Photo';
     document.querySelectorAll('.sidebar-avatar img, .top-avatar img').forEach(img=>{img.src=data.picture_url;});
    }
    if(profilePicInput)profilePicInput.value='';
    return;
   }

   updateAttachmentBarsInDOM(data);
   showToast(data.message||'Document uploaded successfully.','success');
   form.reset();

   if(isQuickUpload){
    if(typeof closeModal==='function')closeModal('quickUploadModal');
    const targetField=lastUploadTriggerField||document.querySelector(`.date-att-bar[data-att-doc-type="${data.document_type_id}"]`)?.closest('.field, .edit-field');
    highlightAndReturnToField(targetField);
   }else if(isDocCardUpload){
    const card=form.closest('.doc-card');
    highlightAndReturnToField(card);
   }
  }catch(_err){
   showToast('Network error while uploading. Please try again.','error');
  }finally{
   if(btn){
    btn.disabled=false;
    btn.innerHTML=origHtml;
   }
  }
 },true);

 // 4. Sticky Sub-Section Navigation Scrollspy & Smooth Scrolling (skipped on single-modal workspaces)
 const sectionNav=document.getElementById('personalSectionNav');
 if(sectionNav&&!document.querySelector('.inline-modal-stage')){
  const pills=Array.from(sectionNav.querySelectorAll('.nav-pill'));
  const targets=pills.map(p=>document.querySelector(p.getAttribute('href'))).filter(Boolean);

  pills.forEach(pill=>{
   pill.addEventListener('click',function(e){
    const targetId=pill.getAttribute('href');
    const targetEl=targetId?document.querySelector(targetId):null;
    if(!targetEl)return;
    e.preventDefault();
    pills.forEach(p=>p.classList.remove('active'));
    pill.classList.add('active');
    targetEl.scrollIntoView({behavior:'smooth',block:'start'});
    targetEl.classList.remove('field-highlight-flash');
    void targetEl.offsetWidth;
    targetEl.classList.add('field-highlight-flash');
   });
  });

  if('IntersectionObserver' in window&&targets.length){
   const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
     if(entry.isIntersecting){
      const id='#'+entry.target.id;
      pills.forEach(p=>p.classList.toggle('active',p.getAttribute('href')===id));
     }
    });
   },{rootMargin:'-15% 0px -70% 0px',threshold:0});
   targets.forEach(t=>observer.observe(t));
  }
 }

 // 5. Floating Unsaved Changes Bar & beforeunload Guard on #profileForm
 const profileForm=document.getElementById('profileForm');
 if(profileForm){
  let isDirty=false;
  const saveBar=document.createElement('div');
  saveBar.className='floating-save-bar';
  saveBar.innerHTML=`
   <span><span class="unsaved-dot"></span>You have unsaved changes</span>
   <button type="button" class="btn small secondary" id="floatingDiscardBtn" style="padding:5px 10px;">Discard</button>
   <button type="button" class="btn small green" id="floatingSaveBtn" style="padding:5px 12px;"><i class="fa-solid fa-floppy-disk"></i> Save Changes</button>
  `;
  document.body.appendChild(saveBar);

  function markDirty(){
   if(!isDirty){
    isDirty=true;
    saveBar.classList.add('visible');
   }
  }

  profileForm.addEventListener('input',function(e){
   if(e.target.name==='profile_picture')return;
   markDirty();
  });
  profileForm.addEventListener('change',function(e){
   if(e.target.name==='profile_picture')return;
   markDirty();
  });
  const secBody=document.getElementById('sectionQuickEditBody');
  if(secBody){
   secBody.addEventListener('input',function(e){
    if(e.target.name==='profile_picture'||e.target.closest('#sec-deployments, #sec-medical'))return;
    markDirty();
   });
   secBody.addEventListener('change',function(e){
    if(e.target.name==='profile_picture'||e.target.closest('#sec-deployments, #sec-medical'))return;
    markDirty();
   });
  }
  document.addEventListener('ednp:form-saved',function(){
   isDirty=false;
   saveBar.classList.remove('visible');
  });
  document.addEventListener('ednp:draft-restored',function(){
   saveBar.classList.add('visible');
  });
  document.addEventListener('ednp:form-dirty',markDirty);
  document.addEventListener('ednp:form-clean',function(){
   isDirty=false;
   saveBar.classList.remove('visible');
  });
  document.getElementById('addChildBtn')?.addEventListener('click',markDirty);
  document.getElementById('addEduBtn')?.addEventListener('click',markDirty);

  document.getElementById('floatingSaveBtn')?.addEventListener('click',function(){
   isDirty=false;
   saveBar.classList.remove('visible');
   const secSave=document.getElementById('sectionQuickEditSaveBtn');
   if(secSave){secSave.click();return;}
   profileForm.requestSubmit();
  });
  document.getElementById('floatingDiscardBtn')?.addEventListener('click',function(){
   if(confirm('Discard your unsaved changes?')){
    isDirty=false;
    saveBar.classList.remove('visible');
    document.dispatchEvent(new CustomEvent('ednp:form-discarded'));
    window.location.reload();
   }
  });
  profileForm.addEventListener('submit',function(){
   isDirty=false;
   saveBar.classList.remove('visible');
  });
  window.addEventListener('beforeunload',function(e){
   if(isDirty){
    e.preventDefault();
    e.returnValue='';
   }
  });
 }

 // 6. Preserve & Restore Scroll Position Across Standard Form Submits
 const SCROLL_KEY='ednp_scroll_'+window.location.pathname;
 const savedScroll=sessionStorage.getItem(SCROLL_KEY);
 if(savedScroll){
  sessionStorage.removeItem(SCROLL_KEY);
  const y=parseInt(savedScroll,10);
  if(!isNaN(y)&&y>0){
   window.scrollTo({top:y,behavior:'instant'});
  }
 }
 document.addEventListener('submit',function(e){
  if(!e.defaultPrevented){
   try{sessionStorage.setItem(SCROLL_KEY,String(window.scrollY));}catch(_){}
  }
 });

 // 7. Dismissible Notices Engine with LocalStorage Persistence
 function getNoticeStorageKey(id) {
  const appEl = document.getElementById('app') || document.querySelector('.app');
  const userId = (appEl && appEl.dataset && appEl.dataset.userId) ? appEl.dataset.userId : 'u';
  return 'ednp_notice_dismissed_' + userId + '_' + id;
 }

 function initDismissibleNotices() {
  // Hide previously dismissed notices on page load
  document.querySelectorAll('.notice[id]').forEach(function(notice) {
   if (notice.id) {
    try {
     if (localStorage.getItem(getNoticeStorageKey(notice.id)) === '1') {
      notice.style.display = 'none';
     }
    } catch (_) {}
   }
  });

  // Auto-inject dismiss button on static notice banners that lack one
  document.querySelectorAll('.notice').forEach(function(notice) {
   if (notice.classList.contains('notice-row')) return;
   if (notice.closest('.modal') && !notice.closest('.section-quick-modal')) return;
   if (notice.id && (notice.id.toLowerCase().includes('replace') || notice.id.toLowerCase().includes('status'))) return;
   if (notice.style.display === 'none') return;

   if (!notice.querySelector('.notice-dismiss')) {
    let contentEl = notice.querySelector('.notice-content');
    if (!contentEl) {
     contentEl = document.createElement('div');
     contentEl.className = 'notice-content';
     while (notice.firstChild) {
      contentEl.appendChild(notice.firstChild);
     }
     notice.appendChild(contentEl);
    }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'notice-dismiss';
    btn.setAttribute('aria-label', 'Dismiss notice');
    btn.title = 'Dismiss';
    if (notice.id) btn.setAttribute('data-dismiss-notice', notice.id);
    btn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    notice.appendChild(btn);
   }
  });
 }

 // Delegated click listener for notice dismiss buttons
 document.addEventListener('click', function(e) {
  const dismissBtn = e.target.closest('.notice-dismiss, [data-dismiss-notice]');
  if (!dismissBtn) return;
  const targetId = dismissBtn.getAttribute('data-dismiss-notice');
  const notice = (targetId ? document.getElementById(targetId) : null) || dismissBtn.closest('.notice');
  if (!notice) return;

  notice.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
  notice.style.opacity = '0';
  notice.style.transform = 'translateY(-4px)';
  setTimeout(function() {
   notice.style.display = 'none';
  }, 180);

  const storageId = targetId || notice.id;
  if (storageId) {
   try {
    localStorage.setItem(getNoticeStorageKey(storageId), '1');
   } catch (_) {}
  }
 });

 if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDismissibleNotices);
 } else {
  initDismissibleNotices();
 }
})();
