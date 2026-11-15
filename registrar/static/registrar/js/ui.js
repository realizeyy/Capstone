/* Pure UI helpers shared by every registrar page: modals, the toast
   notification, in-app document preview modal with back/confirmation,
   zero-reload AJAX document uploads that preserve unsaved form fields,
   sticky section navigation scrollspy, and unsaved changes protection. */

function syncBodyScrollLock(){
 const anyOpen=Array.from(document.querySelectorAll('.modal-bg')).some(function(m){
  if(!m)return false;
  return (m.classList.contains('show')||m.classList.contains('active')||m.style.display==='flex')&&m.style.display!=='none';
 });
 document.body.classList.toggle('modal-open',anyOpen);
}
window.syncBodyScrollLock=syncBodyScrollLock;

function openModal(id){
 const el=document.getElementById(id);
 if(el)el.classList.add('show');
 syncBodyScrollLock();
}

function closeModal(id){
 const el=document.getElementById(id);
 if(el)el.classList.remove('show');
 syncBodyScrollLock();
}

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
function hideToast(){
 const el=document.getElementById('toast');
 if(!el)return;
 el.classList.remove('show');
 clearTimeout(toastTimer);
}
function showToast(message,level){
 const el=document.getElementById('toast');
 if(!el)return;
 el.textContent=message;
 el.className='toast show'+(level?' toast-'+level:'');
 el.title='Click to dismiss';
 el.style.cursor='pointer';
 clearTimeout(toastTimer);
 if(level!=='working'){
  toastTimer=setTimeout(()=>el.classList.remove('show'),level==='error'?8000:4500);
 }
}
window.showToast=showToast;
window.hideToast=hideToast;

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

document.querySelectorAll('.modal-bg').forEach(modal=>{
 modal.addEventListener('click',e=>{
  if(e.target===modal){
   modal.classList.remove('show');
   syncBodyScrollLock();
  }
 });
 modal.addEventListener('wheel',e=>{
  if(e.target===modal)e.preventDefault();
 },{passive:false});
});

// The sidebar's menu button on narrow screens
document.querySelectorAll('.nav-toggle').forEach(btn=>{
 btn.addEventListener('click',()=>{
  const open=btn.closest('.sidebar').classList.toggle('nav-open');
  btn.setAttribute('aria-expanded',open);
 });
});

// <button data-close-modal="id"> closes that modal; <button data-print-url="url"> prints that file
document.addEventListener('click',e=>{
 const closer=e.target.closest('[data-close-modal]');
 if(closer)closeModal(closer.dataset.closeModal);
 const printer=e.target.closest('[data-print-url]');
 if(printer)quickPrintFile(printer.dataset.printUrl);
});

// data-confirm is handled asynchronously via in-app centered modal in skeleton.js (window.appConfirm)

// <select data-autosubmit> submits its form as soon as it changes
document.querySelectorAll('select[data-autosubmit]').forEach(sel=>{
 sel.addEventListener('change',()=>sel.form.submit());
});

// <select data-per-page-select> updates per_page and resets to page 1 while preserving filters
document.querySelectorAll('select[data-per-page-select]').forEach(sel=>{
 sel.addEventListener('change',()=>{
  const params=new URLSearchParams(sel.dataset.baseQuery||'');
  params.set('per_page',sel.value);
  window.location.href=`?${params.toString()}`;
 });
});

// Messages Django attached to this response ("Record saved", errors), rendered
// into #flash-messages by base.html, shown as toasts
document.querySelectorAll('#flash-messages [data-level]').forEach(msg=>showToast(msg.textContent,msg.dataset.level));
try{
 const rawPendingToast=sessionStorage.getItem('ednp_pending_toast');
 if(rawPendingToast){
  sessionStorage.removeItem('ednp_pending_toast');
  const pending=JSON.parse(rawPendingToast);
  if(pending&&pending.message){
   showToast(pending.message,pending.level||'info');
  }
 }
}catch(err){}

/* =========================================================================
   UX ENHANCEMENTS FOR REGISTRAR PORTAL:
   1. In-App Document Preview Modal with Back Button & Confirmation
   2. Zero-Reload AJAX Document Uploads + Field Focus Return
   3. Sticky Sub-Section Navigation Scrollspy
   4. Floating Unsaved Changes Bar & beforeunload Guard
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
   z-index: 100005 !important;
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
      <span class="muted" style="font-size:11px;">Review the attached document below, then confirm or return to the record.</span>
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
      <button type="button" class="btn small" id="docPreviewConfirmBtn">
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
  syncBodyScrollLock();
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
  syncBodyScrollLock();
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

 // 3. Zero-Reload AJAX Uploads for Quick Attachment Modal & Document Cards
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
    badge.className='badge active-b';
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
    <a class="btn small secondary" href="${data.view_url}" target="_blank" rel="noopener" data-doc-name="${data.document_name}"><i class="fa-solid fa-eye"></i> View</a>
    <a class="btn small secondary" href="${data.download_url}"><i class="fa-solid fa-download"></i> Download</a>
    <button type="button" class="btn small secondary" data-print-url="${data.view_url}"><i class="fa-solid fa-print"></i> Print</button>
   `;
   const submitBtn=card.querySelector('.doc-card-upload button');
   if(submitBtn){
    submitBtn.innerHTML='<i class="fa-solid fa-rotate"></i> Replace';
   }
  });

  if(data.summary_submitted!==undefined&&data.summary_total!==undefined){
   const tabDocBadge=document.querySelector('#tabBtnDocuments .badge');
   if(tabDocBadge){
    tabDocBadge.textContent=`${data.summary_submitted}/${data.summary_total}`;
   }
  }
 }

 document.addEventListener('submit',async function(e){
  const form=e.target;
  if(e.defaultPrevented)return;
  const isQuickUpload=Boolean(form.closest('#quickUploadModal'));
  const isDocCardUpload=form.classList.contains('doc-card-upload');
  if(!isQuickUpload&&!isDocCardUpload)return;

  const fileInput=form.querySelector('input[type="file"]');
  const file=fileInput&&fileInput.files&&fileInput.files[0];
  if(file&&file.size>10*1024*1024){
   showToast('File is too large: maximum allowed is 10 MB for a photo or scan, and 5 MB for a PDF.','error');
   return;
  }

  e.preventDefault();
  e.stopImmediatePropagation();

  const btn=e.submitter||form.querySelector('button[type="submit"], button:not([type])');
  const origHtml=btn?btn.innerHTML:'';
  if(btn){
   btn.disabled=true;
   btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Uploading…';
  }

  try{
   const formData=new FormData(form);
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

   updateAttachmentBarsInDOM(data);
   showToast(data.message||'Document uploaded successfully.','success');
   form.reset();

   if(isQuickUpload){
    closeModal('quickUploadModal');
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

 // 5. Floating Unsaved Changes Bar & beforeunload Guard on #recordPersonalForm
 const recordForm=document.getElementById('recordPersonalForm');
 if(recordForm){
  let isDirty=false;
  const saveBar=document.createElement('div');
  saveBar.className='floating-save-bar';
  saveBar.innerHTML=`
   <span><span class="unsaved-dot"></span>You have unsaved changes</span>
   <button type="button" class="btn small secondary" id="floatingDiscardBtn" style="padding:5px 10px;">Discard</button>
   <button type="button" class="btn small" id="floatingSaveBtn" style="padding:5px 12px;"><i class="fa-solid fa-floppy-disk"></i> Save Changes</button>
  `;
  document.body.appendChild(saveBar);

  function markDirty(){
   if(!isDirty){
    isDirty=true;
    saveBar.classList.add('visible');
   }
  }

  recordForm.addEventListener('input',markDirty);
  recordForm.addEventListener('change',markDirty);
  const secBody=document.getElementById('sectionQuickEditBody');
  if(secBody){
   secBody.addEventListener('input',function(e){
    if(e.target.closest('#sec-reg-deployments, #sec-reg-family'))return;
    markDirty();
   });
   secBody.addEventListener('change',function(e){
    if(e.target.closest('#sec-reg-deployments, #sec-reg-family'))return;
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

  document.getElementById('floatingSaveBtn')?.addEventListener('click',function(){
   isDirty=false;
   saveBar.classList.remove('visible');
   const secSave=document.getElementById('sectionQuickEditSaveBtn');
   if(secSave){secSave.click();return;}
   recordForm.requestSubmit();
  });
  document.getElementById('floatingDiscardBtn')?.addEventListener('click',function(){
   if(confirm('Discard your unsaved changes?')){
    isDirty=false;
    saveBar.classList.remove('visible');
    document.dispatchEvent(new CustomEvent('ednp:form-discarded'));
    window.location.reload();
   }
  });
  recordForm.addEventListener('submit',function(){
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

 // 7. In-App Progress Modal & Credential Slips Preview Modal with Back & Print Actions
 let activeSlipsBlobUrl = '';
 let activeSlipsBackUrl = '';
 let activeSlipsStayOnClose = false;
 let activeSlipsBackToast = '';
 let slipsPrintTimeout = null;
 let slipProgressTimer = null;
 let slipProgressStartedAt = 0;
 let activeProgressIsBulk = false;

 function ensureSlipProgressModal() {
  let modal = document.getElementById('slipProgressModal');
  if (modal) return modal;

  if (!document.getElementById('slipProgressStyles')) {
   const style = document.createElement('style');
   style.id = 'slipProgressStyles';
   style.textContent = `
    #slipProgressModal {
     z-index: 99999;
     display: none;
     position: fixed;
     inset: 0;
     background: rgba(15, 23, 42, 0.7);
     backdrop-filter: blur(4px);
     -webkit-backdrop-filter: blur(4px);
     align-items: center;
     justify-content: center;
     padding: 16px;
    }
    #slipProgressModal.show {
     display: flex !important;
     animation: modalBackdropFadeIn 0.18s ease both;
    }
    .slip-progress-card {
     width: 100% !important;
     max-width: 460px !important;
     min-width: 0 !important;
     box-sizing: border-box !important;
     background: #ffffff !important;
     border: 1px solid #cbd5e1 !important;
     border-radius: 14px !important;
     box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(15, 23, 42, 0.08) !important;
     padding: 24px !important;
     display: flex !important;
     flex-direction: column !important;
     gap: 14px !important;
     animation: modalBoxEnter 0.2s cubic-bezier(0.16, 1, 0.3, 1) both !important;
    }
    .slip-progress-head {
     display: flex !important;
     align-items: center !important;
     gap: 14px !important;
    }
    .slip-progress-spinner {
     width: 38px !important;
     height: 38px !important;
     flex-shrink: 0 !important;
     border-radius: 999px !important;
     border: 3px solid #dbeafe !important;
     border-top-color: #2563eb !important;
     animation: slipSpin 0.85s linear infinite !important;
    }
    .slip-progress-head-copy {
     flex: 1 1 auto !important;
     min-width: 0 !important;
    }
    .slip-progress-title-row {
     display: flex !important;
     align-items: center !important;
     justify-content: space-between !important;
     gap: 8px !important;
    }
    .slip-progress-title-row h3 {
     margin: 0 !important;
     font-size: 16px !important;
     font-weight: 700 !important;
     color: #0f172a !important;
    }
    .slip-progress-elapsed {
     font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
     font-size: 12px !important;
     font-weight: 600 !important;
     color: #334155 !important;
     background: #f1f5f9 !important;
     border: 1px solid #e2e8f0 !important;
     border-radius: 999px !important;
     padding: 2px 8px !important;
     white-space: nowrap !important;
    }
    .slip-progress-stage {
     margin: 4px 0 0 !important;
     font-size: 13px !important;
     color: #475569 !important;
     line-height: 1.4 !important;
    }
    .slip-progress-track {
     width: 100% !important;
     height: 8px !important;
     border-radius: 999px !important;
     background: #e2e8f0 !important;
     overflow: hidden !important;
     position: relative !important;
    }
    .slip-progress-bar {
     position: absolute !important;
     top: 0 !important;
     bottom: 0 !important;
     left: 0 !important;
     width: 38% !important;
     border-radius: 999px !important;
     background: linear-gradient(90deg, #2563eb, #3b82f6) !important;
     animation: slipIndeterminate 1.4s ease-in-out infinite !important;
    }
    .slip-progress-notice {
     display: none !important;
     align-items: flex-start !important;
     gap: 10px !important;
     padding: 12px 14px !important;
     border-radius: 10px !important;
     border: 1px solid #e2e8f0 !important;
     background: #f8fafc !important;
     color: #334155 !important;
     font-size: 12.5px !important;
     line-height: 1.45 !important;
    }
    .slip-progress-notice.show {
     display: flex !important;
    }
    .slip-progress-notice svg {
     flex-shrink: 0 !important;
     margin-top: 2px !important;
     color: #2563eb !important;
    }
    @keyframes slipSpin {
     to { transform: rotate(360deg); }
    }
    @keyframes slipIndeterminate {
     0% { left: -40%; width: 36%; }
     50% { left: 32%; width: 46%; }
     100% { left: 102%; width: 32%; }
    }
    @media (prefers-reduced-motion: reduce) {
     #slipProgressModal.show,
     .slip-progress-card {
      animation: none !important;
     }
     .slip-progress-spinner {
      animation: none !important;
      border-right-color: #2563eb !important;
     }
     .slip-progress-bar {
      animation: none !important;
      left: 0 !important;
      width: 100% !important;
      opacity: 0.55 !important;
     }
    }
   `;
   document.head.appendChild(style);
  }

  modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.id = 'slipProgressModal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'slipProgressTitle');
  modal.setAttribute('aria-describedby', 'slipProgressStage');
  modal.innerHTML = `
   <div class="modal slip-progress-card">
    <div class="slip-progress-head">
     <div class="slip-progress-spinner" aria-hidden="true"></div>
     <div class="slip-progress-head-copy">
      <div class="slip-progress-title-row">
       <h3 id="slipProgressTitle">Creating account & login slips</h3>
       <span class="slip-progress-elapsed" id="slipProgressElapsed" aria-live="off">0s</span>
      </div>
      <p class="slip-progress-stage" id="slipProgressStage" aria-live="polite">
       Validating details and generating secure credentials...
      </p>
     </div>
    </div>
    <div class="slip-progress-track" role="progressbar" aria-label="Account creation progress" aria-valuetext="In progress">
     <div class="slip-progress-bar"></div>
    </div>
    <div class="slip-progress-notice" id="slipProgressNotice">
     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
     </svg>
     <span id="slipProgressNoticeText"></span>
    </div>
   </div>
  `;
  document.body.appendChild(modal);
  return modal;
 }

 function openSlipProgressModal(opts) {
  opts = opts || {};
  const modal = ensureSlipProgressModal();
  if (slipProgressTimer) {
   clearInterval(slipProgressTimer);
   slipProgressTimer = null;
  }

  activeProgressIsBulk = Boolean(opts.isBulk);
  slipProgressStartedAt = Date.now();

  const titleEl = document.getElementById('slipProgressTitle');
  const stageEl = document.getElementById('slipProgressStage');
  const elapsedEl = document.getElementById('slipProgressElapsed');
  const noticeEl = document.getElementById('slipProgressNotice');
  const noticeTextEl = document.getElementById('slipProgressNoticeText');

  if (titleEl) {
   if (activeProgressIsBulk) {
    titleEl.textContent = opts.count
     ? ('Creating ' + opts.count + ' clergy ' + (opts.count === 1 ? 'account' : 'accounts'))
     : 'Creating clergy accounts';
   } else {
    titleEl.textContent = opts.title || 'Generating login slip';
   }
  }
  if (stageEl) {
   stageEl.textContent = activeProgressIsBulk
    ? 'Encrypting temporary passwords and saving records...'
    : 'Saving credentials and preparing printable slip...';
  }
  if (elapsedEl) {
   elapsedEl.textContent = '0s';
  }
  if (noticeEl && noticeTextEl) {
   if (activeProgressIsBulk) {
    noticeTextEl.textContent = 'Bulk batches take longer (often 5 to 20 seconds for large lists) because each temporary password is encrypted individually and printable QR slips are built together. Please keep this page open.';
    noticeEl.classList.add('show');
   } else {
    noticeTextEl.textContent = 'This is taking slightly longer than usual while credentials and printable slips finish generating. Please keep this page open.';
    noticeEl.classList.remove('show');
   }
  }

  modal.classList.add('show');
  syncBodyScrollLock();

  slipProgressTimer = setInterval(function () {
   const secs = Math.max(0, Math.floor((Date.now() - slipProgressStartedAt) / 1000));
   if (elapsedEl) elapsedEl.textContent = secs + 's';
   if (stageEl) {
    if (secs >= 10) {
     stageEl.textContent = 'Still working: compiling printable QR login slips...';
    } else if (secs >= 4) {
     stageEl.textContent = 'Finalizing database transaction and generating login slips...';
    }
   }
   if (!activeProgressIsBulk && noticeEl && secs >= 3) {
    noticeEl.classList.add('show');
   }
  }, 1000);
 }

 function closeSlipProgressModal() {
  if (slipProgressTimer) {
   clearInterval(slipProgressTimer);
   slipProgressTimer = null;
  }
  const modal = document.getElementById('slipProgressModal');
  if (modal) {
   modal.classList.remove('show');
   syncBodyScrollLock();
  }
 }

 function ensureSlipsModal() {
  let modal = document.getElementById('slipsPreviewModal');
  if (modal) return modal;

  if (!document.getElementById('slipsPreviewStyles')) {
   const style = document.createElement('style');
   style.id = 'slipsPreviewStyles';
   style.textContent = `
    #slipsPreviewModal {
     z-index: 99998;
     display: none;
     position: fixed;
     inset: 0;
     background: rgba(15, 23, 42, 0.65);
     backdrop-filter: blur(4px);
     -webkit-backdrop-filter: blur(4px);
     align-items: center;
     justify-content: center;
     padding: 12px;
     box-sizing: border-box;
    }
    #slipsPreviewModal.show {
     display: flex !important;
     animation: modalBackdropFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .slips-preview-card {
     width: 100% !important;
     max-width: 940px !important;
     min-width: 0 !important;
     box-sizing: border-box !important;
     height: min(90vh, 860px) !important;
     max-height: 94vh !important;
     background: #fff !important;
     border-radius: 14px !important;
     border: 1px solid #cbd5e1 !important;
     box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.3), 0 0 0 1px rgba(15, 23, 42, 0.08) !important;
     display: flex !important;
     flex-direction: column !important;
     padding: 0 !important;
     overflow: hidden !important;
     animation: modalBoxEnter 0.24s cubic-bezier(0.16, 1, 0.3, 1) both !important;
    }
    .slips-preview-head {
     display: flex !important;
     align-items: center !important;
     justify-content: space-between !important;
     gap: 12px !important;
     padding: 14px 20px !important;
     border-bottom: 1px solid #e2e8f0 !important;
     background: #ffffff !important;
     flex-shrink: 0 !important;
     min-width: 0 !important;
    }
    .slips-preview-head-title {
     display: flex !important;
     align-items: center !important;
     gap: 12px !important;
     flex: 1 1 auto !important;
     min-width: 0 !important;
    }
    .slips-preview-head-text {
     flex: 1 1 auto !important;
     min-width: 0 !important;
    }
    .slips-preview-head-icon {
     width: 40px !important;
     height: 40px !important;
     flex-shrink: 0 !important;
     border-radius: 10px !important;
     background: #eff6ff !important;
     border: 1px solid #bfdbfe !important;
     color: #2563eb !important;
     display: flex !important;
     align-items: center !important;
     justify-content: center !important;
     font-size: 18px !important;
    }
    .slips-preview-head h3 {
     margin: 0 !important;
     font-size: 17px !important;
     font-weight: 700 !important;
     color: #0f172a !important;
     line-height: 1.25 !important;
     overflow-wrap: anywhere !important;
    }
    .slips-preview-head .muted {
     font-size: 12px !important;
     color: #475569 !important;
     display: block !important;
     line-height: 1.35 !important;
     overflow-wrap: anywhere !important;
    }
    .slips-result-banner {
     display: none !important;
     align-items: center !important;
     gap: 10px !important;
     margin: 10px 20px 0 !important;
     padding: 10px 14px !important;
     border-radius: 10px !important;
     border: 1px solid #bbf7d0 !important;
     background: #f0fdf4 !important;
     color: #166534 !important;
     font-size: 13px !important;
     font-weight: 600 !important;
     flex-shrink: 0 !important;
     min-width: 0 !important;
     box-sizing: border-box !important;
    }
    .slips-result-banner.show {
     display: flex !important;
    }
    #slipsResultBannerText {
     flex: 1 1 auto !important;
     min-width: 0 !important;
     line-height: 1.4 !important;
     overflow-wrap: anywhere !important;
    }
    .slips-result-banner svg {
     flex-shrink: 0 !important;
    }
    .slips-preview-toolbar {
     display: flex !important;
     align-items: center !important;
     justify-content: space-between !important;
     padding: 12px 20px !important;
     background: #f8fafc !important;
     border-bottom: 1px solid #e2e8f0 !important;
     gap: 10px !important;
     flex-wrap: wrap !important;
     flex-shrink: 0 !important;
     min-width: 0 !important;
    }
    .slips-toolbar-left, .slips-toolbar-right {
     display: flex !important;
     align-items: center !important;
     gap: 10px !important;
     flex-wrap: wrap !important;
     min-width: 0 !important;
    }
    .slips-preview-toolbar .btn,
    #slipsPreviewCloseTop {
     min-height: 40px !important;
     min-width: 40px !important;
     flex-shrink: 0 !important;
    }
    .slips-preview-body {
     flex: 1 1 auto !important;
     min-height: 0 !important;
     background: #e2e8f0 !important;
     position: relative !important;
     overflow: hidden !important;
    }
    .slips-preview-frame {
     position: absolute !important;
     inset: 0 !important;
     width: 100% !important;
     height: 100% !important;
     border: none !important;
     display: block !important;
     background: #ffffff !important;
    }
    .slips-btn-back {
     font-weight: 600 !important;
     border: 1px solid #cbd5e1 !important;
     background: #ffffff !important;
     color: #1e293b !important;
     display: inline-flex !important;
     align-items: center !important;
     gap: 8px !important;
    }
    .slips-btn-back:hover {
     background: #f1f5f9 !important;
     border-color: #94a3b8 !important;
    }
    .slip-form-inline-error {
     margin-bottom: 12px;
    }
    @media (max-width: 600px) {
     #slipsPreviewModal {
      padding: 6px !important;
     }
     .slips-preview-card {
      width: 100% !important;
      height: 94vh !important;
     }
     .slips-preview-head,
     .slips-preview-toolbar {
      padding: 10px 12px !important;
     }
     .slips-preview-head-icon {
      width: 34px !important;
      height: 34px !important;
     }
     .slips-preview-head h3 {
      font-size: 15px !important;
     }
     .slips-result-banner {
      margin: 8px 12px 0 !important;
     }
     .toast {
      max-width: calc(100vw - 24px) !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
     }
    }
    @media (prefers-reduced-motion: reduce) {
     #slipsPreviewModal.show,
     .slips-preview-card {
      animation: none !important;
     }
    }
   `;
   document.head.appendChild(style);
  }

  modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.id = 'slipsPreviewModal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'slipsPreviewTitle');
  modal.innerHTML = `
   <div class="modal slips-preview-card">
    <div class="slips-preview-head">
     <div class="slips-preview-head-title">
      <div class="slips-preview-head-icon" aria-hidden="true">
       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"></polyline>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
        <rect x="6" y="14" width="12" height="8"></rect>
       </svg>
      </div>
      <div class="slips-preview-head-text">
       <h3 id="slipsPreviewTitle">Login Slips Ready to Print</h3>
       <span class="muted" id="slipsPreviewSub">Temporary account credentials. Print now and hand to clergy.</span>
      </div>
     </div>
     <button type="button" class="close" id="slipsPreviewCloseTop" aria-label="Close dialog">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
       <line x1="18" y1="6" x2="6" y2="18"></line>
       <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
     </button>
    </div>
    <div class="slips-result-banner" id="slipsResultBanner" role="status" aria-live="polite">
     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
     </svg>
     <span id="slipsResultBannerText"></span>
    </div>
    <div class="slips-preview-toolbar">
     <div class="slips-toolbar-left">
      <button type="button" class="btn secondary slips-btn-back" id="slipsBackToRecordsBtn">
       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
       </svg>
       <span id="slipsBackLabel">Back to Clergy Records</span>
      </button>
     </div>
     <div class="slips-toolbar-right">
      <button type="button" class="btn" id="slipsPrintBtn">
       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="6 9 6 2 18 2 18 9"></polyline>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
        <rect x="6" y="14" width="12" height="8"></rect>
       </svg>
       <span>Print Slips</span>
      </button>
     </div>
    </div>
    <div class="slips-preview-body">
     <iframe class="slips-preview-frame" id="slipsPreviewFrame" title="Portal Login Slips"></iframe>
    </div>
   </div>
  `;
  document.body.appendChild(modal);

  function closeSlipsModal(mode) {
   const isBackAction = (mode === 'back');
   const shouldNavigate = isBackAction || !activeSlipsStayOnClose;
   modal.classList.remove('show');
   syncBodyScrollLock();
   if (slipsPrintTimeout) {
    clearTimeout(slipsPrintTimeout);
    slipsPrintTimeout = null;
   }
   const frame = document.getElementById('slipsPreviewFrame');
   if (frame) {
    frame.onload = null;
    frame.src = 'about:blank';
   }
   if (activeSlipsBlobUrl) {
    URL.revokeObjectURL(activeSlipsBlobUrl);
    activeSlipsBlobUrl = '';
   }
   if (shouldNavigate) {
    if (activeSlipsBackToast) {
     try {
      sessionStorage.setItem('ednp_pending_toast', JSON.stringify({
       message: activeSlipsBackToast,
       level: 'success'
      }));
     } catch (err) {}
    }
    if (activeSlipsBackUrl) {
     window.location.href = activeSlipsBackUrl;
    } else {
     window.location.reload();
    }
   }
  }

  document.getElementById('slipsPreviewCloseTop')?.addEventListener('click', function () {
   closeSlipsModal('dismiss');
  });
  document.getElementById('slipsBackToRecordsBtn')?.addEventListener('click', function () {
   closeSlipsModal('back');
  });
  modal.addEventListener('click', function (e) {
   if (e.target === modal) closeSlipsModal('dismiss');
  });
  modal.addEventListener('wheel', function (e) {
   if (e.target === modal) e.preventDefault();
  }, { passive: false });
  document.addEventListener('keydown', function (e) {
   if (e.key === 'Escape' && modal.classList.contains('show')) {
    closeSlipsModal('dismiss');
   }
  });

  document.getElementById('slipsPrintBtn')?.addEventListener('click', function () {
   const frame = document.getElementById('slipsPreviewFrame');
   if (frame && frame.contentWindow) {
    try {
     frame.contentWindow.focus();
     frame.contentWindow.print();
     return;
    } catch (err) {}
   }
   if (activeSlipsBlobUrl) {
    window.open(activeSlipsBlobUrl, '_blank');
   }
  });

  return modal;
 }

 window.openSlipsModal = function (content, opts) {
  opts = opts || {};
  const modal = ensureSlipsModal();
  if (activeSlipsBlobUrl) {
   URL.revokeObjectURL(activeSlipsBlobUrl);
   activeSlipsBlobUrl = '';
  }
  if (slipsPrintTimeout) {
   clearTimeout(slipsPrintTimeout);
   slipsPrintTimeout = null;
  }

  const isBulkPath = window.location.pathname.indexOf('bulk') !== -1;
  let fallbackBackUrl = window.location.href;
  if (isBulkPath) {
   fallbackBackUrl = '/registrar/clergy-records/';
  }
  activeSlipsBackUrl = opts.backUrl || fallbackBackUrl;
  activeSlipsStayOnClose = opts.stayOnPageOnClose !== undefined ? Boolean(opts.stayOnPageOnClose) : isBulkPath;
  activeSlipsBackToast = opts.backToastMessage || '';

  const titleEl = document.getElementById('slipsPreviewTitle');
  if (titleEl) {
   titleEl.textContent = opts.title || 'Login Slips Ready to Print';
  }

  const backLabel = opts.backLabel || (window.location.pathname.indexOf('account-security') !== -1 ? 'Back to Account Security' : 'Back to Clergy Records');
  const backLabelEl = document.getElementById('slipsBackLabel');
  if (backLabelEl) backLabelEl.textContent = backLabel;

  const subEl = document.getElementById('slipsPreviewSub');
  if (subEl) {
   subEl.textContent = opts.subtitle || 'Temporary account credentials. Print now and hand to clergy.';
  }

  const bannerEl = document.getElementById('slipsResultBanner');
  const bannerTextEl = document.getElementById('slipsResultBannerText');
  if (bannerEl && bannerTextEl) {
   if (opts.resultMessage) {
    bannerTextEl.textContent = opts.resultMessage;
    bannerEl.classList.add('show');
   } else {
    bannerTextEl.textContent = '';
    bannerEl.classList.remove('show');
   }
  }

  // Show modal BEFORE writing iframe content so layout viewport dimensions are resolved (prevents 150px iframe collapse)
  modal.classList.add('show');
  syncBodyScrollLock();

  const frame = document.getElementById('slipsPreviewFrame');
  if (frame) {
   frame.onload = null;
   let slipsPrintTriggered = false;
   function scheduleFramePrint(delayMs) {
    if (opts.skipAutoPrint || slipsPrintTriggered) return;
    if (slipsPrintTimeout) clearTimeout(slipsPrintTimeout);
    slipsPrintTimeout = setTimeout(function () {
     if (slipsPrintTriggered || !modal.classList.contains('show')) return;
     slipsPrintTriggered = true;
     try {
      if (frame.contentWindow) {
       frame.contentWindow.focus();
       frame.contentWindow.print();
      }
     } catch (err) {}
    }, delayMs);
   }
   function prepareIframeDoc(doc) {
    if (!doc) return;
    const embeddedActions = doc.querySelector('.actions');
    if (embeddedActions) embeddedActions.remove();
    if (doc.documentElement) doc.documentElement.classList.add('in-iframe');
   }

   if (opts.isHtml || typeof content === 'string') {
    frame.onload = function () {
     try {
      prepareIframeDoc(frame.contentWindow && frame.contentWindow.document);
     } catch (err) {}
     scheduleFramePrint(180);
    };
    try {
     const doc = frame.contentWindow.document;
     doc.open();
     doc.write(content);
     doc.close();
     prepareIframeDoc(doc);
     if (doc.readyState === 'complete') {
      scheduleFramePrint(220);
     } else {
      scheduleFramePrint(900);
     }
    } catch (writeErr) {
     frame.srcdoc = content;
     scheduleFramePrint(550);
    }
   } else {
    activeSlipsBlobUrl = URL.createObjectURL(content);
    frame.onload = function () {
     scheduleFramePrint(250);
    };
    frame.src = activeSlipsBlobUrl;
   }
  }
 };

 function clearSlipFormInlineError(form) {
  form.querySelectorAll('.slip-form-inline-error').forEach(function (el) {
   el.remove();
  });
 }

 function showSlipFormInlineError(form, message) {
  clearSlipFormInlineError(form);
  const banner = document.createElement('div');
  banner.className = 'alert alert-error slip-form-inline-error';
  banner.setAttribute('role', 'alert');
  banner.textContent = message;
  form.prepend(banner);
  try {
   banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (err) {}
 }

 function parseBulkCountFromForm(form, submitBtn) {
  const checkedRows = form.querySelectorAll('input[type="checkbox"]:checked').length;
  if (checkedRows > 0) return checkedRows;
  const hiddenCount = form.querySelector('input[name="count"]');
  if (hiddenCount && hiddenCount.value) {
   const parsed = parseInt(hiddenCount.value, 10);
   if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  const btnText = (submitBtn && submitBtn.textContent) || '';
  const match = btnText.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
 }

 // Intercept slip-producing forms so the user remains on the portal with progress, status, and print controls
 document.addEventListener('submit', function (e) {
  const form = e.target;
  if (!form || form.tagName !== 'FORM') return;
  const action = form.getAttribute('action') || '';
  const isSlipForm = form.classList.contains('slip-form') ||
                     form.id === 'linkAccountForm' ||
                     form.id === 'resetAccountForm' ||
                     form.id === 'bulkConfirmForm' ||
                     form.id === 'createRecordForm' ||
                     /\/clergy-records\/([^/]+\/)?(create|link-account|reset-account)/.test(action) ||
                     /\/account-security\/(\d+\/)?reset\//.test(action);

  if (!isSlipForm) return;
  if (e.defaultPrevented) return;

  e.preventDefault();
  e.stopImmediatePropagation();

  const submitBtn = e.submitter || form.querySelector('button[type="submit"], input[type="submit"]');
  if (submitBtn) {
   submitBtn.disabled = true;
   submitBtn.setAttribute('aria-busy', 'true');
  }
  clearSlipFormInlineError(form);

  const isBulk = form.id === 'bulkConfirmForm';
  const batchCount = isBulk ? parseBulkCountFromForm(form, submitBtn) : 1;

  function finishProgressUi() {
   closeSlipProgressModal();
   if (typeof window.ednpClearSkeleton === 'function') {
    window.ednpClearSkeleton();
   } else {
    form.classList.remove('is-submitting');
    document.querySelectorAll('.sk-progress.on').forEach(function (p) { p.classList.remove('on'); });
   }
   if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.classList.remove('is-busy');
    submitBtn.removeAttribute('aria-busy');
   }
  }

  openSlipProgressModal({
   isBulk: isBulk,
   count: batchCount,
   title: isBulk ? undefined : 'Creating account & login slip'
  });

  showToast(
   isBulk
    ? ('Creating ' + (batchCount ? batchCount + ' ' : '') + 'clergy accounts & generating login slips...')
    : 'Generating login slip for printing...',
   'working'
  );

  const formData = new FormData(form);
  if (e.submitter && e.submitter.name) {
   formData.append(e.submitter.name, e.submitter.value);
  }
  formData.append('format', 'html');

  fetch(form.action || window.location.href, {
   method: 'POST',
   body: formData,
   headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'X-Slip-Format': 'html'
   }
  }).then(async function (res) {
   const contentType = res.headers.get('content-type') || '';

   if (res.redirected) {
    finishProgressUi();
    hideToast();
    const isLoginRedirect = res.url.indexOf('/login') !== -1;
    if (!isLoginRedirect && isBulk && typeof window.ednpOnBulkAccountsError === 'function') {
     window.ednpOnBulkAccountsError('Your bulk request could not be completed. Please review your batch and try again.', { isNetwork: false });
     showToast('Bulk request did not produce login slips.', 'error');
     return;
    }
    if (!isLoginRedirect) {
     try {
      sessionStorage.setItem('ednp_pending_toast', JSON.stringify({
       message: 'Please verify the clergy list before retrying.',
       level: 'info'
      }));
     } catch (err) {}
    }
    window.location.href = res.url;
    return;
   }

   if (res.ok && contentType.indexOf('text/html') !== -1) {
    const html = await res.text();
    const headerCount = parseInt(res.headers.get('X-Slips-Count') || '0', 10);
    const slipCount = headerCount > 0 ? headerCount : (batchCount || 1);

    finishProgressUi();

    const parentModal = form.closest('.modal-bg');
    if (parentModal) {
     parentModal.classList.remove('show');
     syncBodyScrollLock();
    }

    const pathname = window.location.pathname;
    let backLabel = 'Back to Clergy Records';
    let backUrl = '/registrar/clergy-records/';
    if (pathname.indexOf('account-security') !== -1) {
     backLabel = 'Back to Account Security';
     backUrl = window.location.href;
    } else if (pathname.indexOf('bulk') !== -1) {
     backLabel = 'Back to Clergy Records';
     backUrl = '/registrar/clergy-records/';
    } else if (pathname.indexOf('clergy-records') !== -1) {
     backUrl = window.location.href;
    }

    let successMsg = 'Clergy record and portal login slip created.';
    if (isBulk) {
     successMsg = 'Created ' + slipCount + ' clergy ' + (slipCount === 1 ? 'account' : 'accounts') + '. Login slips are ready to print.';
     if (typeof window.ednpOnBulkAccountsSuccess === 'function') {
      window.ednpOnBulkAccountsSuccess(slipCount, html, true);
     }
    } else if (form.id === 'resetAccountForm' || action.indexOf('/reset') !== -1) {
     successMsg = 'Temporary password reset. Login slip is ready to print.';
    } else if (form.id === 'linkAccountForm' || action.indexOf('link-account') !== -1) {
     successMsg = 'Clergy portal account linked. Login slip is ready to print.';
    }

    showToast(successMsg, 'success');

    window.openSlipsModal(html, {
     isHtml: true,
     title: isBulk ? ('Bulk Login Slips Ready (' + slipCount + ')') : 'Login Slip Ready to Print',
     subtitle: isBulk
      ? 'Temporary credentials created cleanly. Print all slips now, or close to return to your batch summary.'
      : 'Temporary credentials generated. Print slip and hand to clergy.',
     resultMessage: successMsg,
     backLabel: backLabel,
     backUrl: backUrl,
     backToastMessage: successMsg,
     stayOnPageOnClose: isBulk
    });
    return;
   }

   if (res.ok && contentType.indexOf('application/pdf') !== -1) {
    const blob = await res.blob();
    const headerCount = parseInt(res.headers.get('X-Slips-Count') || '0', 10);
    const slipCount = headerCount > 0 ? headerCount : (batchCount || 1);

    finishProgressUi();

    const parentModal = form.closest('.modal-bg');
    if (parentModal) {
     parentModal.classList.remove('show');
     syncBodyScrollLock();
    }

    const pathname = window.location.pathname;
    let backLabel = 'Back to Clergy Records';
    let backUrl = '/registrar/clergy-records/';
    if (pathname.indexOf('account-security') !== -1) {
     backLabel = 'Back to Account Security';
     backUrl = window.location.href;
    } else if (pathname.indexOf('bulk') !== -1) {
     backLabel = 'Back to Clergy Records';
     backUrl = '/registrar/clergy-records/';
    } else if (pathname.indexOf('clergy-records') !== -1) {
     backUrl = window.location.href;
    }

    const successMsg = isBulk
     ? ('Created ' + slipCount + ' clergy ' + (slipCount === 1 ? 'account' : 'accounts') + '. Login slips are ready to print.')
     : 'Login slip ready for printing.';

    if (isBulk && typeof window.ednpOnBulkAccountsSuccess === 'function') {
     window.ednpOnBulkAccountsSuccess(slipCount, blob, false);
    }

    showToast(successMsg, 'success');

    window.openSlipsModal(blob, {
     title: isBulk ? ('Bulk Login Slips Ready (' + slipCount + ')') : 'Login Slip Ready to Print',
     subtitle: 'Temporary credentials generated. Print slip and hand to clergy.',
     resultMessage: successMsg,
     backLabel: backLabel,
     backUrl: backUrl,
     backToastMessage: successMsg,
     stayOnPageOnClose: isBulk
    });
    return;
   }

   // Server returned JSON error (validation failure, duplicate username, expired token, etc.)
   if (contentType.indexOf('application/json') !== -1) {
    const data = await res.json();
    finishProgressUi();
    const errMsg = data.message || 'An error occurred while creating records.';
    if (isBulk && typeof window.ednpOnBulkAccountsError === 'function') {
     window.ednpOnBulkAccountsError(errMsg, {
      expired: Boolean(data.expired),
      isNetwork: false
     });
    } else {
     if (data.errors && typeof window.applyFormErrors === 'function') {
      window.applyFormErrors(form, data.errors);
     }
     showSlipFormInlineError(form, errMsg);
    }
    showToast(errMsg, 'error');
    return;
   }

   finishProgressUi();
   if (!res.ok) {
    const statusMsg = 'Could not complete request (server returned ' + res.status + '). Nothing was changed; please try again.';
    if (isBulk && typeof window.ednpOnBulkAccountsError === 'function') {
     window.ednpOnBulkAccountsError(statusMsg, { expired: false, isNetwork: false });
    } else {
     showSlipFormInlineError(form, statusMsg);
    }
    showToast(statusMsg, 'error');
    return;
   }

   window.location.reload();
  }).catch(function (err) {
   finishProgressUi();
   const netMsg = isBulk
    ? 'Connection interrupted while processing the batch. Check Clergy Records before retrying so you do not duplicate accounts.'
    : ('Could not complete request: ' + ((err && err.message) || 'Network error'));
   if (isBulk && typeof window.ednpOnBulkAccountsError === 'function') {
    window.ednpOnBulkAccountsError(netMsg, { expired: false, isNetwork: true });
   } else {
    showSlipFormInlineError(form, netMsg);
   }
   showToast(netMsg, 'error');
  });
 });

 // Dismissible Notices Engine with LocalStorage Persistence
 function getNoticeStorageKey(id) {
  const appEl = document.querySelector('.app') || document.getElementById('app');
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
   if (notice.closest('.modal')) return;
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

 function initStickyHeader() {
  const header = document.getElementById('clergyStickyHeader');
  const sentinel = document.getElementById('clergyStickySentinel');
  if (!header || !sentinel) return;

  function updateStuck() {
   const rect = sentinel.getBoundingClientRect();
   header.classList.toggle('is-stuck', rect.top < 0);
  }

  if ('IntersectionObserver' in window) {
   const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
     header.classList.toggle('is-stuck', !entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
   }, { root: null, threshold: 0 });
   observer.observe(sentinel);
  }

  window.addEventListener('scroll', updateStuck, { passive: true });
  window.addEventListener('resize', updateStuck, { passive: true });
  updateStuck();
 }

 // Floating bottom pagination dock when table extends beyond viewport
 function initFloatingPager() {
  const pager = document.getElementById('clergyBottomPager');
  const sentinel = document.getElementById('clergyPagerSentinel');
  if (!pager || !sentinel) return;

  function updateFloating() {
   const sentinelRect = sentinel.getBoundingClientRect();
   pager.classList.toggle('is-floating', sentinelRect.top > window.innerHeight);
  }

  if ('IntersectionObserver' in window) {
   const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
     pager.classList.toggle('is-floating', !entry.isIntersecting && entry.boundingClientRect.top > window.innerHeight);
    });
   }, { root: null, threshold: 0 });
   observer.observe(sentinel);
  }

  window.addEventListener('scroll', updateFloating, { passive: true });
  window.addEventListener('resize', updateFloating, { passive: true });
  updateFloating();
 }

 function initStickyAndFloatingBars() {
  initStickyHeader();
  initFloatingPager();
 }

 if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStickyAndFloatingBars);
 } else {
  initStickyAndFloatingBars();
 }
})();
