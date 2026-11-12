/* ==========================================================================
   SATU-SATUNYA pengaturan frontend.
   Ganti GAS_URL dengan URL /exec dari Deploy → Aplikasi web di Apps Script.
   URL ini memang publik; keamanan dijaga login dan pengecekan peran di server.
   ========================================================================== */
window.APP_CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbxlHF9JF3x7du_864dMYIqwC6IzPQfuJ58scGW4ppjk2qeF_fpVKPVIs_NA2HJSMTYqfQ/exec'
};
