/* Clergy Records page UI: the deanery -> parish cascade dropdown for the New
   Record modal, and the Link Account and Lost Phone modals. The record page
   (record-detail.html) loads this too, for the same cascade. Personal
   Information and Documents are now a real per-record page, not a
   JS-populated modal. Every value below comes from what Django already
   rendered into the page (the embedded deaneries JSON): nothing here
   holds or computes application data on its own. Depends on ui.js
   (openModal, closeModal). */

const deaneriesDataElement = document.getElementById('deaneries-data');
const deaneries = deaneriesDataElement ? JSON.parse(deaneriesDataElement.textContent) : {};

function populateDeaneries(selectId){
 const sel=document.getElementById(selectId);
 if(!sel)return;
 sel.innerHTML='<option value="">Select Deanery</option>'+Object.entries(deaneries).map(([id,d])=>`<option value="${id}">${d.name}</option>`).join('');
}

function updateParishOptions(deanerySelectId,assignmentSelectId){
 const deaneryId=document.getElementById(deanerySelectId)?.value;
 const parishSel=document.getElementById(assignmentSelectId);
 if(!parishSel)return;
 if(!deaneryId || !deaneries[deaneryId]){
  parishSel.innerHTML='<option value="">Select Deanery first</option>';
  parishSel.disabled=true;
  return;
 }
 parishSel.innerHTML='<option value="">Select Parish / Assignment</option>'+deaneries[deaneryId].parishes.map(p=>`<option value="${p}">${p}</option>`).join('');
 parishSel.disabled=false;
}

function toggleLeaveReason(statusSelectId,fieldId){
 const statusEl=document.getElementById(statusSelectId);
 const fieldEl=document.getElementById(fieldId);
 if(!statusEl || !fieldEl)return;
 fieldEl.classList.toggle('hidden',statusEl.value!=='On Leave');
}

function clearCreateRecordErrors(form){
 if(!form)return;
 form.querySelectorAll('.record-modal-client-error, .slip-form-inline-error, .alert-error, .field-error-msg').forEach(function(el){
  el.remove();
 });
 form.querySelectorAll('.has-error').forEach(function(el){
  el.classList.remove('has-error');
 });
 form.querySelectorAll('input, select, textarea').forEach(function(el){
  el.removeAttribute('aria-invalid');
  if(typeof el.setCustomValidity==='function')el.setCustomValidity('');
 });
}

function openNewRecordModal(e){
 if(e)e.preventDefault();
 populateDeaneries('newDeanery');
 const deanerySel=document.getElementById('newDeanery');
 const statusSel=document.getElementById('newStatus');
 const leaveReasonInput=document.getElementById('newLeaveReason');
 const form=document.getElementById('createRecordForm') || document.querySelector('#recordModal form');
 clearCreateRecordErrors(form);
 if(typeof window.ednpClearSkeleton==='function')window.ednpClearSkeleton();
 if(deanerySel && !deanerySel.dataset.selectedDeanery){
  deanerySel.value='';
  updateParishOptions('newDeanery','newAssignment');
 }
 if(statusSel && !statusSel.value){
  statusSel.value='Active';
 }
 if(leaveReasonInput && !leaveReasonInput.value){
  leaveReasonInput.value='';
 }
 toggleLeaveReason('newStatus','newLeaveReasonField');
 openModal('recordModal');
}

function openResetAccountModal(button){
 const id=button.dataset.recordId;
 document.getElementById('resetAccountName').textContent=button.dataset.recordName;
 document.getElementById('resetAccountForm').action=`/registrar/clergy-records/${id}/reset-account/`;
 openModal('resetAccountModal');
}

function openLinkAccountModal(button){
 const id=button.dataset.recordId;
 document.getElementById('linkAccountName').textContent=button.dataset.recordName;
 document.getElementById('linkAccountForm').action=`/registrar/clergy-records/${id}/link-account/`;
 openModal('linkAccountModal');
}

// A deanery <select data-parish-target="id"> refills that parish list; a status
// <select data-leave-field="id"> shows that Leave Reason field only for On Leave
document.querySelectorAll('[data-parish-target]').forEach(sel=>{
 sel.addEventListener('change',()=>updateParishOptions(sel.id,sel.dataset.parishTarget));
});
document.querySelectorAll('[data-leave-field]').forEach(sel=>{
 sel.addEventListener('change',()=>toggleLeaveReason(sel.id,sel.dataset.leaveField));
});

const newRecordButton=document.getElementById('newRecordButton');
if(newRecordButton)newRecordButton.addEventListener('click',openNewRecordModal);
document.querySelectorAll('[data-reset-account]').forEach(btn=>btn.addEventListener('click',()=>openResetAccountModal(btn)));
document.querySelectorAll('[data-link-account]').forEach(btn=>btn.addEventListener('click',()=>openLinkAccountModal(btn)));

function validateCreateRecordForm(form){
 const nameInput=form.querySelector('[name="name"]');
 const deanerySelect=form.querySelector('[name="deanery"]');
 const assignmentSelect=form.querySelector('[name="assignment"]');
 const statusSelect=form.querySelector('[name="status"]');
 const leaveReasonInput=form.querySelector('[name="leave_reason"]');
 const baptismInput=form.querySelector('[name="baptism_date"]');
 const confirmationInput=form.querySelector('[name="confirmation_date"]');
 const holyOrdersInput=form.querySelector('[name="holy_orders_date"]');
 const contractEndInput=form.querySelector('[name="contract_end"]');

 if(nameInput && !nameInput.value.trim()){
  return {errorMsg:'Please enter the clergy name.',focusTarget:nameInput};
 }
 if(assignmentSelect && (!assignmentSelect.value || assignmentSelect.disabled)){
  const target=(assignmentSelect.disabled && deanerySelect) ? deanerySelect : assignmentSelect;
  return {errorMsg:'Please select a deanery and parish or assignment.',focusTarget:target};
 }
 if(statusSelect && statusSelect.value==='On Leave' && leaveReasonInput && !leaveReasonInput.value.trim()){
  return {errorMsg:'Leave reason is required when status is On Leave.',focusTarget:leaveReasonInput};
 }
 if(baptismInput && confirmationInput && baptismInput.value && confirmationInput.value && baptismInput.value>confirmationInput.value){
  return {errorMsg:'Confirmation date cannot be earlier than baptism date.',focusTarget:confirmationInput};
 }
 if(holyOrdersInput && contractEndInput && holyOrdersInput.value && contractEndInput.value && holyOrdersInput.value>contractEndInput.value){
  return {errorMsg:'Contract end cannot be earlier than Holy Orders date.',focusTarget:contractEndInput};
 }
 return null;
}

// Client-side validation and data-loss prevention on recordModal submission
const createRecordForm = document.getElementById('createRecordForm') || document.querySelector('#recordModal form');
if (createRecordForm) {
 function handleFieldCorrection(evt){
  const el=evt.target;
  if(el && typeof el.setCustomValidity==='function'){
   el.setCustomValidity('');
  }
  const field=el && el.closest ? el.closest('.field') : null;
  if(field){
   field.classList.remove('has-error');
   field.querySelectorAll('.field-error-msg').forEach(function(msg){ msg.remove(); });
  }
  if(el){
   el.removeAttribute('aria-invalid');
  }
  const clientAlert=createRecordForm.querySelector('.record-modal-client-error');
  if(clientAlert && !validateCreateRecordForm(createRecordForm)){
   clientAlert.remove();
  }
 }
 createRecordForm.addEventListener('input', handleFieldCorrection);
 createRecordForm.addEventListener('change', handleFieldCorrection);

 createRecordForm.addEventListener('submit', function (e) {
  clearCreateRecordErrors(createRecordForm);
  const validation=validateCreateRecordForm(createRecordForm);

  if (validation) {
   e.preventDefault();
   if (typeof window.ednpClearSkeleton === 'function') {
    window.ednpClearSkeleton();
   }
   let alertBox = createRecordForm.querySelector('.record-modal-client-error');
   if (!alertBox) {
    alertBox = document.createElement('div');
    alertBox.className = 'alert alert-error record-modal-client-error';
    alertBox.setAttribute('role', 'alert');
    alertBox.style.marginBottom = 'var(--spacing-md, 1rem)';
    createRecordForm.prepend(alertBox);
   }
   alertBox.textContent = validation.errorMsg;
   if (validation.focusTarget) {
    const fieldWrap=validation.focusTarget.closest('.field');
    if(fieldWrap)fieldWrap.classList.add('has-error');
    validation.focusTarget.setAttribute('aria-invalid', 'true');
    if (!validation.focusTarget.disabled) {
     validation.focusTarget.focus();
     if (typeof validation.focusTarget.reportValidity === 'function') {
      validation.focusTarget.setCustomValidity(validation.errorMsg);
      validation.focusTarget.reportValidity();
     }
    }
   }
   return false;
  }
 });
}

// Auto-open modal if rendered with error alert or existing draft values
document.addEventListener('DOMContentLoaded', function () {
 const modalHasErrors = document.querySelector('#recordModal .alert-error');
 const deanerySel = document.getElementById('newDeanery');
 if (modalHasErrors) {
  openModal('recordModal');
 }
 if (deanerySel && deanerySel.dataset.selectedDeanery) {
  populateDeaneries('newDeanery');
  deanerySel.value = deanerySel.dataset.selectedDeanery;
  updateParishOptions('newDeanery', 'newAssignment');
  const assignmentSel = document.getElementById('newAssignment');
  if (assignmentSel && assignmentSel.dataset.selectedAssignment) {
   assignmentSel.value = assignmentSel.dataset.selectedAssignment;
  }
 }
});


// Slips modal preview and floating bottom pagination dock are handled in ui.js
