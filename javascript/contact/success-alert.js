(function () {
    function showSuccessAlert(message) {
        window.alert(message || 'Formulario enviado correctamente.');
    }

    window.ContactAlerts = window.ContactAlerts || {};
    window.ContactAlerts.showSuccessAlert = showSuccessAlert;
})();
