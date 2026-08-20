document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('list');
  const newBtn = document.getElementById('newService');

  async function load() {
    list.innerHTML = 'Cargando...';
    try {
      const res = await fetch('/api/services');
      if (!res.ok) throw new Error('network');
      const services = await res.json();
      render(services);
    } catch (e) {
      list.innerHTML = '<p>Error cargando servicios.</p>';
    }
  }

  function render(services) {
    if (!services || !services.length) { list.innerHTML = '<p>No hay servicios.</p>'; return; }
    const ul = document.createElement('ul');
    services.forEach(s => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${s.title}</strong> — ${s.tag || ''} — <a href="admin-edit-service.html?id=${encodeURIComponent(s.id)}">Editar</a> <button data-id="${s.id}" class="del">Borrar</button>`;
      ul.appendChild(li);
    });
    list.innerHTML = '';
    list.appendChild(ul);

    list.querySelectorAll('.del').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Borrar servicio?')) return;
        const id = btn.dataset.id;
        const res = await fetch('/api/services/' + encodeURIComponent(id), { method: 'DELETE' });
        if (res.ok) load(); else alert('Error al borrar');
      });
    });
  }

  newBtn.addEventListener('click', () => {
    location.href = 'admin-edit-service.html';
  });

  load();
});
