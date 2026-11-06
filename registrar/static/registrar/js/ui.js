/* Pure UI helpers shared by every registrar page: modals, the toast
   notification, in-app document preview modal with back/confirmation,
   zero-reload AJAX document uploads that preserve unsaved form fields,
   sticky section navigation scrollspy, and unsaved changes protection. */

function openModal(id){
 const el=document.getElementById(id);
 if(el)el.classList.add('show');
}

function closeModal(id){
 const el=document.getElementById(id);
 if(el)el.classList.remove('show');
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

document.querySelectorAll('.modal-bg').forEach(modal=>{
 modal.addEventListener('click',e=>{
  if(e.target===modal)modal.classList.remove('show');
 });
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

// Messages Django attached to this response ("Record saved", errors), rendered
// into #flash-messages by base.html, shown as toasts
document.querySelectorAll('#flash-messages [data-level]').forEach(msg=>showToast(msg.textContent,msg.dataset.level));

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
  }
  #docPreviewModal {
   z-index: 95 !important;
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

  function closePreview(){
   modal.classList.remove('show');
   const frame=document.getElementById('docPreviewFrame');
   if(frame)frame.src='about:blank';
   if(activePreviewTrigger){
    const field=activePreviewTrigger.closest('.field, .edit-field, .doc-card');
    if(field){
     field.scrollIntoView({behavior:'smooth',block:'center'});
    }
    activePreviewTrigger.focus();
   }
  }

  modal.addEventListener('click',function(e){
   if(e.target===modal)closePreview();
  });
  document.getElementById('docPreviewCloseTop')?.addEventListener('click',closePreview);
  document.getElementById('docPreviewBackBtn')?.addEventListener('click',closePreview);
  document.getElementById('docPreviewPrintBtn')?.addEventListener('click',function(){
   if(activePreviewUrl)quickPrintFile(activePreviewUrl);
  });
  document.getElementById('docPreviewConfirmBtn')?.addEventListener('click',function(){
   if(activePreviewTrigger){
    const container=activePreviewTrigger.closest('.date-att-bar, .doc-card');
    if(container&&!container.querySelector('.preview-confirmed-tag')){
     const tag=document.createElement('span');
     tag.className='preview-confirmed-tag';
     tag.innerHTML='<i class="fa-solid fa-check"></i> Confirmed';
     const statusEl=container.querySelector('.att-status, .doc-card-head');
     if(statusEl)statusEl.appendChild(tag);
    }
   }
   showToast(activePreviewTitle+' confirmed.','success');
   closePreview();
  });
  document.addEventListener('keydown',function(e){
   if(e.key==='Escape'&&modal.classList.contains('show'))closePreview();
  });
  return modal;
 }

 document.addEventListener('click',function(e){
  const viewLink=e.target.closest('a.att-btn.view, .doc-card .row-actions a[href*="/documents/"][href$="/view/"]');
  if(!viewLink||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  const href=viewLink.getAttribute('href');
  if(!href)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  activePreviewTrigger=viewLink;
  activePreviewUrl=href;
  const cardOrBar=viewLink.closest('[data-doc-title], .doc-card, .date-att-bar');
  activePreviewTitle=
   viewLink.dataset.docName||
   (cardOrBar&&cardOrBar.dataset.docTitle)||
   (cardOrBar&&cardOrBar.querySelector('.doc-card-head b')?.textContent)||
   'Document Preview';
  const modal=ensurePreviewModal();
  const titleSpan=modal.querySelector('#docPreviewTitle span');
  if(titleSpan)titleSpan.textContent='Preview: '+activePreviewTitle;
  const frame=modal.querySelector('#docPreviewFrame');
  if(frame)frame.src=href;
  const newTabBtn=modal.querySelector('#docPreviewNewTabBtn');
  if(newTabBtn)newTabBtn.href=href;
  modal.classList.add('show');
  document.getElementById('docPreviewConfirmBtn')?.focus();
 },true);

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

 // 4. Sticky Sub-Section Navigation Scrollspy & Smooth Scrolling
 const sectionNav=document.getElementById('personalSectionNav');
 if(sectionNav){
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

 // 7. In-App Credential Slips Preview Modal with Back & Print Actions
 let activeSlipsBlobUrl = '';
 let activeSlipsBackUrl = '';

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
    }
    #slipsPreviewModal.show {
     display: flex !important;
     animation: modalBackdropFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .slips-preview-card {
     width: min(920px, calc(100vw - 32px)) !important;
     max-width: 920px !important;
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
     padding: 16px 20px !important;
     border-bottom: 1px solid #e2e8f0 !important;
     background: #ffffff !important;
    }
    .slips-preview-head-title {
     display: flex !important;
     align-items: center !important;
     gap: 12px !important;
    }
    .slips-preview-head-icon {
     width: 40px !important;
     height: 40px !important;
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
    }
    .slips-preview-head .muted {
     font-size: 12px !important;
     color: #64748b !important;
    }
    .slips-preview-toolbar {
     display: flex !important;
     align-items: center !important;
     justify-content: space-between !important;
     padding: 12px 20px !important;
     background: #f8fafc !important;
     border-bottom: 1px solid #e2e8f0 !important;
     gap: 12px !important;
     flex-wrap: wrap !important;
    }
    .slips-toolbar-left, .slips-toolbar-right {
     display: flex !important;
     align-items: center !important;
     gap: 10px !important;
    }
    .slips-preview-body {
     flex: 1 !important;
     min-height: 520px !important;
     height: 68vh !important;
     background: #525659 !important;
     position: relative !important;
    }
    .slips-preview-frame {
     width: 100% !important;
     height: 100% !important;
     border: none !important;
     display: block !important;
    }
    .slips-btn-back {
     font-weight: 600 !important;
     border: 1px solid #cbd5e1 !important;
     background: #ffffff !important;
     color: #1e293b !important;
    }
    .slips-btn-back:hover {
     background: #f1f5f9 !important;
     border-color: #94a3b8 !important;
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
      <div class="slips-preview-head-icon">
       <i class="fa-solid fa-print"></i>
      </div>
      <div>
       <h3 id="slipsPreviewTitle">Login Slips Ready to Print</h3>
       <span class="muted" id="slipsPreviewSub">Temporary account credentials. Print now and hand to clergy.</span>
      </div>
     </div>
     <button type="button" class="close" id="slipsPreviewCloseTop" aria-label="Close dialog">
      <i class="fa-solid fa-xmark"></i>
     </button>
    </div>
    <div class="slips-preview-toolbar">
     <div class="slips-toolbar-left">
      <button type="button" class="btn secondary slips-btn-back" id="slipsBackToRecordsBtn">
       <i class="fa-solid fa-arrow-left"></i> <span id="slipsBackLabel">Back to Clergy Records</span>
      </button>
     </div>
     <div class="slips-toolbar-right">
      <button type="button" class="btn" id="slipsPrintBtn">
       <i class="fa-solid fa-print"></i> Print Slips
      </button>
     </div>
    </div>
    <div class="slips-preview-body">
     <iframe class="slips-preview-frame" id="slipsPreviewFrame" title="Portal Login Slips"></iframe>
    </div>
   </div>
  `;
  document.body.appendChild(modal);

  function closeSlipsModal(shouldReload) {
   modal.classList.remove('show');
   const frame = document.getElementById('slipsPreviewFrame');
   if (frame) frame.src = 'about:blank';
   if (activeSlipsBlobUrl) {
    URL.revokeObjectURL(activeSlipsBlobUrl);
    activeSlipsBlobUrl = '';
   }
   if (shouldReload) {
    if (activeSlipsBackUrl) {
     window.location.href = activeSlipsBackUrl;
    } else {
     window.location.reload();
    }
   }
  }

  document.getElementById('slipsPreviewCloseTop')?.addEventListener('click', function () {
   closeSlipsModal(true);
  });
  document.getElementById('slipsBackToRecordsBtn')?.addEventListener('click', function () {
   closeSlipsModal(true);
  });
  modal.addEventListener('click', function (e) {
   if (e.target === modal) closeSlipsModal(true);
  });
  document.addEventListener('keydown', function (e) {
   if (e.key === 'Escape' && modal.classList.contains('show')) {
    closeSlipsModal(true);
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

  var fallbackBackUrl = window.location.href;
  if (window.location.pathname.indexOf('bulk') !== -1) {
   fallbackBackUrl = '/registrar/clergy-records/';
  }
  activeSlipsBackUrl = opts.backUrl || fallbackBackUrl;

  var backLabel = opts.backLabel || (window.location.pathname.indexOf('account-security') !== -1 ? 'Back to Account Security' : 'Back to Clergy Records');
  var backLabelEl = document.getElementById('slipsBackLabel');
  if (backLabelEl) backLabelEl.textContent = backLabel;

  var subEl = document.getElementById('slipsPreviewSub');
  if (subEl && opts.subtitle) {
   subEl.textContent = opts.subtitle;
  }

  var frame = document.getElementById('slipsPreviewFrame');
  if (frame) {
   if (opts.isHtml || typeof content === 'string') {
    try {
     const doc = frame.contentWindow.document;
     doc.open();
     doc.write(content);
     doc.close();
     setTimeout(function () {
      try {
       frame.contentWindow.focus();
       frame.contentWindow.print();
      } catch (err) {}
     }, 350);
    } catch (writeErr) {
     frame.srcdoc = content;
    }
   } else {
    activeSlipsBlobUrl = URL.createObjectURL(content);
    frame.src = activeSlipsBlobUrl;
    frame.onload = function () {
     setTimeout(function () {
      try {
       frame.contentWindow.focus();
       frame.contentWindow.print();
      } catch (err) {}
     }, 350);
    };
   }
  }

  modal.classList.add('show');
 };

 // Intercept slip-producing forms so the user remains on the portal with back and print controls
 document.addEventListener('submit', function (e) {
  const form = e.target;
  const action = form.getAttribute('action') || '';
  const isSlipForm = form.classList.contains('slip-form') ||
                     form.id === 'linkAccountForm' ||
                     form.id === 'resetAccountForm' ||
                     form.id === 'bulkConfirmForm' ||
                     form.id === 'createRecordForm' ||
                     /\/clergy-records\/([^/]+\/)?(create|link-account|reset-account)/.test(action) ||
                     /\/account-security\/(\d+\/)?reset\//.test(action);

  if (!isSlipForm) return;

  e.preventDefault();
  e.stopImmediatePropagation();

  const submitBtn = e.submitter || form.querySelector('button[type="submit"], input[type="submit"]');
  if (submitBtn) {
   submitBtn.disabled = true;
   submitBtn.setAttribute('aria-busy', 'true');
  }

  showToast('Generating login slip for printing...', 'working');

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
   if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.removeAttribute('aria-busy');
   }

   const contentType = res.headers.get('content-type') || '';
   if (res.ok && contentType.indexOf('text/html') !== -1) {
    const parentModal = form.closest('.modal-bg');
    if (parentModal) parentModal.classList.remove('show');

    const html = await res.text();
    showToast('Login slip ready for printing.', 'success');

    var backLabel = 'Back to Clergy Records';
    var backUrl = '/registrar/clergy-records/';
    if (window.location.pathname.indexOf('account-security') !== -1) {
     backLabel = 'Back to Account Security';
     backUrl = window.location.href;
    } else if (window.location.pathname.indexOf('clergy-records') !== -1) {
     backUrl = window.location.href;
    }

    window.openSlipsModal(html, {
     backLabel: backLabel,
     backUrl: backUrl,
     isHtml: true,
     subtitle: 'Temporary credentials generated. Print slip and hand to clergy.'
    });
    return;
   }

   if (res.ok && contentType.indexOf('application/pdf') !== -1) {
    const parentModal = form.closest('.modal-bg');
    if (parentModal) parentModal.classList.remove('show');

    const blob = await res.blob();
    showToast('Login slips ready for printing.', 'success');

    var backLabel = 'Back to Clergy Records';
    var backUrl = '/registrar/clergy-records/';
    if (window.location.pathname.indexOf('account-security') !== -1) {
     backLabel = 'Back to Account Security';
     backUrl = window.location.href;
    } else if (window.location.pathname.indexOf('clergy-records') !== -1) {
     backUrl = window.location.href;
    }

    window.openSlipsModal(blob, {
     backLabel: backLabel,
     backUrl: backUrl,
     subtitle: 'Temporary credentials generated. Print slip and hand to clergy.'
    });
    return;
   }

   // If server returned JSON error (e.g. form validation error)
   if (contentType.indexOf('application/json') !== -1) {
    const data = await res.json();
    showToast(data.message || 'An error occurred while creating records.', 'error');
    return;
   }

   // If server redirected or returned HTML
   if (res.redirected) {
    window.location.href = res.url;
   } else {
    window.location.reload();
   }
  }).catch(function (err) {
   if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.removeAttribute('aria-busy');
   }
   showToast('Could not complete request: ' + (err.message || 'Network error'), 'error');
  });
 });
})();
