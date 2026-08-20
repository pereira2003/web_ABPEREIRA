document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const form = document.getElementById('serviceForm');
  const titleInput = document.getElementById('titleInput');
  const tagInput = document.getElementById('tagInput');
  const imageInput = document.getElementById('imageInput');
  const descInput = document.getElementById('descInput');
  const priceInput = document.getElementById('priceInput');
  const titleH = document.getElementById('title');

  async function loadService(id) {
    try {
      const res = await fetch('/api/services/' + encodeURIComponent(id));
      if (!res.ok) throw new Error('not found');
      const s = await res.json();
      titleInput.value = s.title || '';
      tagInput.value = s.tag || '';
      imageInput.value = s.image || '';
      descInput.value = s.description || '';
      priceInput.value = s.pricing_note || '';
      document.getElementById('serviceId').value = s.id;
      titleH.textContent = 'Editar Servicio';
    } catch (e) {
      // new service
      titleH.textContent = 'Crear Servicio';
    }
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const payload = {
      title: titleInput.value,
      tag: tagInput.value,
      image: imageInput.value,
      description: descInput.value,
      pricing_note: priceInput.value
    };
    const sid = document.getElementById('serviceId').value;
    if (sid) {
      const res = await fetch('/api/services/' + encodeURIComponent(sid), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) location.href = 'admin-services.html'; else alert('Error al guardar');
    } else {
      const res = await fetch('/api/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) location.href = 'admin-services.html'; else alert('Error al crear');
    }
  });

  if (id) loadService(id);
});
