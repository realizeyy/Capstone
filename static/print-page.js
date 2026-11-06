/* The Print and Back buttons on the printable record and report pages. */
document.querySelectorAll('[data-print-page]').forEach(function (button) {
  button.addEventListener('click', function () { window.print(); });
});

document.querySelectorAll('[data-back-page]').forEach(function (button) {
  button.addEventListener('click', function (e) {
    e.preventDefault();
    var fallback = button.getAttribute('data-back-url') || '/';
    // If opened in a new tab/window, close it directly so user returns to the portal tab
    try {
      window.close();
    } catch (err) {}

    // Fallback if browser security prevents closing: navigate back or to fallback URL
    setTimeout(function () {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = fallback;
      }
    }, 120);
  });
});
