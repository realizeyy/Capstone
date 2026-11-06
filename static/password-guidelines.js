/* Password guidelines live feedback script.
   Evaluates new password and confirmation against length, character mix,
   difference from current/username, and matching values. */
(function () {
  'use strict';

  function initPasswordForm(form) {
    var newPwInput = form.querySelector('input[name="new_password"]');
    var confirmPwInput = form.querySelector('input[name="confirm_password"]');
    var currentPwInput = form.querySelector('input[name="current_password"]');
    var guidelines = form.querySelector('.pwd-guidelines') || (form.parentElement && form.parentElement.querySelector('.pwd-guidelines'));

    if (!newPwInput || !guidelines) {
      return;
    }

    var ruleLength = guidelines.querySelector('[data-rule="length"]');
    var ruleMixed = guidelines.querySelector('[data-rule="mixed"]');
    var ruleDiff = guidelines.querySelector('[data-rule="diff"]');
    var ruleMatch = guidelines.querySelector('[data-rule="match"]');

    function getUsername() {
      var usernameInput = form.querySelector('input[name="username"]') ||
                          document.querySelector('#sec_username') ||
                          document.querySelector('input[name="username"]');
      if (usernameInput && usernameInput.value) {
        return usernameInput.value.trim().toLowerCase();
      }
      return '';
    }

    function setRuleState(ruleElement, state, srText) {
      if (!ruleElement) return;

      var icon = ruleElement.querySelector('.pwd-rule-icon i');
      var sr = ruleElement.querySelector('[data-rule-sr]');

      ruleElement.classList.remove('is-passed', 'is-failed');

      if (state === 'passed') {
        ruleElement.classList.add('is-passed');
        if (icon) icon.className = 'fa-solid fa-circle-check';
        if (sr) sr.textContent = srText || 'Satisfied';
      } else if (state === 'failed') {
        ruleElement.classList.add('is-failed');
        if (icon) icon.className = 'fa-solid fa-circle-xmark';
        if (sr) sr.textContent = srText || 'Not satisfied';
      } else {
        if (icon) icon.className = 'fa-solid fa-circle';
        if (sr) sr.textContent = srText || 'Pending';
      }
    }

    function validate() {
      var newPw = newPwInput.value || '';
      var confirmPw = confirmPwInput ? confirmPwInput.value || '' : '';
      var currentPw = currentPwInput ? currentPwInput.value || '' : '';
      var username = getUsername();

      // 1. Length rule (at least 8 characters)
      if (newPw.length === 0) {
        setRuleState(ruleLength, 'pending');
      } else if (newPw.length >= 8) {
        setRuleState(ruleLength, 'passed', 'Satisfied: 8 or more characters');
      } else {
        setRuleState(ruleLength, 'pending', 'Pending: fewer than 8 characters');
      }

      // 2. Mixed characters (cannot be numbers only, must contain letters)
      if (newPw.length === 0) {
        setRuleState(ruleMixed, 'pending');
      } else if (/^\d+$/.test(newPw)) {
        setRuleState(ruleMixed, 'failed', 'Failed: cannot be numbers only');
      } else if (/[a-zA-Z]/.test(newPw)) {
        setRuleState(ruleMixed, 'passed', 'Satisfied: contains letters');
      } else {
        setRuleState(ruleMixed, 'pending');
      }

      // 3. Different from current / username
      if (newPw.length === 0) {
        setRuleState(ruleDiff, 'pending');
      } else {
        var isSameAsCurrent = currentPw && newPw === currentPw;
        var isSameAsUsername = username && newPw.toLowerCase() === username;
        if (isSameAsCurrent) {
          setRuleState(ruleDiff, 'failed', 'Failed: matches current password');
        } else if (isSameAsUsername) {
          setRuleState(ruleDiff, 'failed', 'Failed: matches username');
        } else if (newPw.length >= 8) {
          setRuleState(ruleDiff, 'passed', 'Satisfied: different from credentials');
        } else {
          setRuleState(ruleDiff, 'pending');
        }
      }

      // 4. Passwords match
      if (!confirmPwInput || confirmPw.length === 0) {
        setRuleState(ruleMatch, 'pending', 'Pending: confirmation required');
      } else if (newPw === confirmPw && newPw.length > 0) {
        setRuleState(ruleMatch, 'passed', 'Satisfied: passwords match');
      } else {
        setRuleState(ruleMatch, 'failed', 'Failed: passwords do not match');
      }
    }

    newPwInput.addEventListener('input', validate);
    if (confirmPwInput) {
      confirmPwInput.addEventListener('input', validate);
    }
    if (currentPwInput) {
      currentPwInput.addEventListener('input', validate);
    }

    validate();
  }

  function init() {
    document.querySelectorAll('form').forEach(function (form) {
      if (form.querySelector('input[name="new_password"]')) {
        initPasswordForm(form);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

